```sh
ssh -p 8899 root@med.uem.mz
```

# Deploy do Plagea — guia passo a passo

Este guia documenta o deploy da aplicação num servidor **CentOS 10 (Stream)**,
com CI/CD via GitHub Actions e dois ambientes (**staging** e **production**).
Para correr o projecto localmente em desenvolvimento, ver
[docs/DEVELOPMENT.md](./DEVELOPMENT.md).

## Arquitetura

```
GitHub (push) ──> GitHub Actions ──> ghcr.io (imagem Docker)
                                            │
                                            ▼
                         SSH + docker compose pull/up
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     │  Servidor CentOS 10                          │
                     │                                              │
                     │  Nginx (80/443, TLS)                         │
                     │     │ proxy_pass 127.0.0.1:<PORT>             │
                     │     ▼                                        │
                     │  container "plagea-app" (network_mode: host) │
                     │     │ 127.0.0.1:27017                        │
                     │     ▼                                        │
                     │  mongod (instalação nativa, não containerizado)│
                     └──────────────────────────────────────────────┘
```

Pontos-chave desta arquitetura (decisões já tomadas, ver histórico da
conversa que gerou este guia):

- **Só a app corre em container** (Docker). O **MongoDB fica fora do
  container**, instalado directamente no sistema operativo.
- O container da app usa `network_mode: host` — por isso alcança o Mongo em
  `127.0.0.1:27017` sem precisar de redes Docker nem de expor o Mongo a
  nenhuma subnet de bridge. O Mongo nunca deve ouvir fora de `127.0.0.1`.
- As imagens são construídas uma vez no GitHub Actions e publicadas no
  **GitHub Container Registry** (`ghcr.io`); o servidor só faz `pull`,
  nunca `build`, em produção/staging.
- **staging** e **production** são tratados como dois ambientes
  independentes — podem ser dois servidores separados (recomendado) ou,
  em alternativa de orçamento, o mesmo servidor com portas/bases de dados
  diferentes (ver nota na secção 2).

---

## 0. Pré-requisitos

- Acesso root (ou sudo) ao(s) servidor(es) CentOS 10.
- Um utilizador dedicado para deploy, com chave SSH própria (não usar
  root para o deploy automático). Vamos chamá-lo `deploy` neste guia.
- Um domínio, com o DNS já a apontar para o IP do servidor de produção.
  Se tiveres acesso ao DNS para criar um subdomínio de staging (ex.
  `staging.plagea.exemplo.mz`), é a opção mais simples. **Se não tiveres
  esse acesso**, a secção 4 explica como usar o mesmo domínio para os
  dois ambientes, distinguidos só por uma porta externa diferente — sem
  precisar de DNS nenhum.
- O repositório GitHub (`zelitosaide/plagea`) com duas branches:
  `main` (produção) e `staging`.

---

## 1. Preparação do servidor (repetir em cada servidor/ambiente)

### 1.1 Actualizações e utilizador de deploy

Primeiro, **na tua própria máquina** (não no servidor), gera um par de
chaves SSH por ambiente — vão ser o que o GitHub Actions usa para entrar
no servidor:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/plagea_staging_deploy -C "github-actions-staging" -N ""
ssh-keygen -t ed25519 -f ~/.ssh/plagea_production_deploy -C "github-actions-production" -N ""
```

Cada comando cria dois ficheiros: um sem extensão (a chave **privada** —
nunca sai do teu computador, vai ser o *value* dos secrets `STAGING_SSH_KEY`/`PRODUCTION_SSH_KEY`
na secção 3) e um `.pub` (a chave **pública**, que vai para o servidor).

Agora, **no servidor** (como root ou via sudo):

```bash
dnf -y update
adduser deploy
usermod -aG wheel deploy          # permite sudo, se precisares
mkdir -p /home/deploy/.ssh
```

Volta à tua máquina, imprime cada chave pública (`cat ~/.ssh/plagea_staging_deploy.pub`,
depois `cat ~/.ssh/plagea_production_deploy.pub`) e cola o resultado de
cada uma — uma linha de texto por chave, tal como aparece — dentro de
`/home/deploy/.ssh/authorized_keys` no servidor. Por exemplo, ainda no
servidor:

```bash
echo "ssh-ed25519 AAAA...o-resto-que-o-cat-mostrou... github-actions-staging" >> /home/deploy/.ssh/authorized_keys
echo "ssh-ed25519 AAAA...o-resto-que-o-cat-mostrou... github-actions-production" >> /home/deploy/.ssh/authorized_keys
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

Confirma que funciona, ainda da tua máquina:

```bash
ssh -i ~/.ssh/plagea_staging_deploy deploy@<host>
```

Se entrar sem pedir password, está pronto — os *values* dos secrets
`STAGING_SSH_KEY`/`PRODUCTION_SSH_KEY` (secção 3) são o conteúdo
completo dos ficheiros de chave **privada** (`cat ~/.ssh/plagea_staging_deploy`,
incluindo as linhas `BEGIN`/`END`).

### 1.2 Firewall (firewalld já vem activo por defeito no CentOS 10)

```bash
firewall-cmd --permanent --add-service=ssh
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

Por agora, não abras mais nenhuma porta — a app (3000/3001) e o Mongo
(27017) só precisam de ser alcançáveis a partir do próprio servidor
(`127.0.0.1`), nunca da rede exterior; é o Nginx que fica exposto e faz
de intermediário.

**Excepção, só se estiveres a usar o setup "mesmo domínio, porta
diferente" para staging** (secção 4.3, quando não tens acesso ao DNS):
nesse caso vais abrir também a porta externa escolhida para staging
(ex. `8443`) — essa é a única porta além de ssh/http/https que fica
mesmo acessível de fora, e isso é feito mais tarde, na própria secção
4.3, não aqui.

### 1.3 SELinux

Mantém o SELinux em `enforcing` (é o padrão do CentOS). Vamos precisar de
um boolean específico para o Nginx poder falar com a app — isso é feito
na secção 4. Não desactives o SELinux; se algo for bloqueado
inesperadamente, diagnostica com:

```bash
sudo ausearch -m avc -ts recent
sudo audit2allow -a   # sugere a regra/boolean em falta
```

### 1.4 Instalar Docker

O CentOS 10 não traz o Docker nos repositórios por defeito (a Red Hat
promove o Podman). Instala a partir do repositório oficial do Docker:

```bash
dnf -y install dnf-plugins-core
dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable --now docker
usermod -aG docker deploy
```

> **Nota de compatibilidade (actualizada)**: confirmado (via `curl` a
> `download.docker.com/linux/centos/`) que o repositório já lista "10/"
> explicitamente, por isso o comando acima deve resolver sem precisares
> de tocar em `$releasever`. Se mesmo assim o `dnf install` falhar a
> resolver pacotes no teu caso, o plano B é editar
> `/etc/yum.repos.d/docker-ce.repo` e trocar `$releasever` por `9` nos
> `baseurl` (compatibilidade binária entre RHEL 9/10 costuma funcionar).

Confirma: `docker compose version` e `docker run --rm hello-world`.

### 1.5 Autenticar o Docker no GitHub Container Registry

As imagens em `ghcr.io/zelitosaide/plagea` ficam, por defeito, com a
mesma visibilidade do repositório. Duas opções:

- **Mais simples**: depois do primeiro push de imagem (secção 3), torna o
  pacote público em _github.com/zelitosaide/plagea/pkgs/container/plagea_
  → Package settings → Change visibility → Public. Sem isto, o passo
  abaixo é obrigatório.
- **Mantendo privado**: gera um _Personal Access Token_ (classic) com o
  scope `read:packages` em _github.com/settings/tokens_, e autentica o
  Docker do servidor uma única vez:

  ```bash
  echo "<PAT>" | docker login ghcr.io -u zelitosaide --password-stdin
  ```

  A credencial fica guardada em `~/.docker/config.json` do utilizador
  `deploy` — não precisa de se repetir a cada deploy.

---

## 2. MongoDB nativo (instalação directa no SO, sem container)

> **Nota de compatibilidade (actualizada)**: ao escrever este guia, a
> MongoDB ainda não tinha publicado oficialmente um repositório para
> RHEL 10, por isso a recomendação era usar o do `el9` como aposta de
> compatibilidade binária. Isso já não é necessário — confirmado (via
> `curl` ao `repomd.xml`, devolve metadata válida, não 404) que já existe
> um repositório oficial `/redhat/10/`, usado directamente abaixo. Se no
> teu caso isto ainda assim falhar (por exemplo, por teres uma versão
> diferente do CentOS 10 ou o repositório ter mudado), o plano B
> continua válido: correr o Mongo noutro servidor já suportado, ou um
> serviço gerido (ex. MongoDB Atlas), e ajustar só o `MONGODB_URI` — o
> resto deste guia não muda.

### 2.1 Instalar

```bash
cat > /etc/yum.repos.d/mongodb-org-7.repo <<'EOF'
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/10/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://pgp.mongodb.com/server-7.0.asc
EOF

# A chave GPG da MongoDB usa uma auto-certificação antiga baseada em
# SHA-1, que a política de criptografia por defeito do RHEL/CentOS 10
# já rejeita ("Policy rejects ... SHA1 is not considered secure"). Isto
# não indica nada de errado com o repositório — é só o RHEL 10 a ser
# mais estrito do que o 9 nesta validação específica. Relaxa só para
# esta importação; depois de a chave ficar confiada, não precisa de se
# repetir.
update-crypto-policies --set DEFAULT:SHA1
dnf install -y mongodb-org-server mongodb-mongosh
update-crypto-policies --set DEFAULT   # repõe a política estrita; a chave já importada continua válida
systemctl enable --now mongod
```

> **Nota**: não instales o meta-pacote `mongodb-org` completo — ele
> arrasta o `mongodb-org-tools`, que por sua vez precisa do pacote
> `mongodb-database-tools` (projecto separado da MongoDB, com
> repositório próprio), **ainda sem build para el10** neste momento
> (confirmado: `dnf install -y mongodb-org` falha com
> "nothing provides mongodb-database-tools"). `mongodb-org-server`
> (o `mongod` em si) e `mongodb-mongosh` (o cliente `mongosh`, usado
> abaixo) não dependem disso — instalam e correm normalmente. As
> ferramentas de linha de comandos que faltam (`mongodump`/`mongorestore`)
> só são precisas para os backups, cobertas de outra forma na secção 2.4.

### 2.2 Confirmar que só ouve em localhost

`/etc/mongod.conf` já vem, por defeito, com `bindIp: 127.0.0.1` — confirma
que não foi alterado. **Nunca** mudar para `0.0.0.0` neste setup.

### 2.3 Ativar autenticação e criar utilizadores

```bash
mongosh
```

```js
use admin
db.createUser({
  user: "admin",
  pwd: passwordPrompt(),   // escreve a password quando pedido
  roles: [{ role: "root", db: "admin" }]
})
exit
```

Edita `/etc/mongod.conf`, acrescenta/confirma:

```yaml
security:
  authorization: enabled
```

```bash
systemctl restart mongod
```

Cria agora os utilizadores de aplicação — **um por ambiente** (nunca
partilhar a mesma base entre staging e production), mas **ambos a
partir da base `admin`** (não `use plagea`/`use plagea_staging` antes
do `createUser` — isso guardaria as credenciais no sítio errado para o
`authSource=admin` que vamos usar no `.env`; já aconteceu e deu
"Authentication failed" ao correr o deploy):

```bash
mongosh -u admin -p --authenticationDatabase admin
```

```js
use admin
db.createUser({
  user: "plagea_app",
  pwd: passwordPrompt(),
  roles: [{ role: "readWrite", db: "plagea" }]
})
db.createUser({
  user: "plagea_staging_app",
  pwd: passwordPrompt(),
  roles: [{ role: "readWrite", db: "plagea_staging" }]
})
exit
```

(nomes de utilizador diferentes entre os dois — como agora ambos "vivem"
dentro da mesma base `admin`, não podem ter o mesmo nome, ao contrário
do que aconteceria se estivessem em bases diferentes)

O `MONGODB_URI` resultante (usado no `.env` de cada ambiente, secção 5):

```
# production
mongodb://plagea_app:<password>@127.0.0.1:27017/plagea?authSource=admin

# staging
mongodb://plagea_staging_app:<password>@127.0.0.1:27017/plagea_staging?authSource=admin
```

### 2.4 Backups

`mongodump`/`mongorestore` fazem parte do `mongodb-database-tools`, que
não instalámos (secção 2.1 — ainda sem build para el10). Em vez de
tentar instalar esses binários à parte, reaproveitamos o Docker (já
temos, secção 1.4) só para correr a imagem oficial `mongo:7`, que já
traz essas ferramentas embutidas — sem depender de nenhum pacote RPM em
falta:

```bash
mkdir -p /srv/plagea/backups
cat > /etc/cron.daily/plagea-mongodump <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
STAMP="$(date +%Y%m%d)"
DEST="/srv/plagea/backups/${STAMP}"
mkdir -p "${DEST}"
docker run --rm --network host \
  -v /srv/plagea/backups:/backup \
  mongo:7 \
  mongodump -u admin -p '<password>' --authenticationDatabase admin \
    --db plagea --out "/backup/${STAMP}"
find /srv/plagea/backups -maxdepth 1 -mtime +14 -exec rm -rf {} +
EOF
chmod +x /etc/cron.daily/plagea-mongodump
```

(`--network host` dá ao container acesso a `127.0.0.1:27017` do próprio
servidor, exactamente como já fazemos para o container da app — ver
arquitectura no topo deste guia.)

Para restaurar manualmente (ex. teste de disaster recovery), o mesmo
princípio aplica-se ao `mongorestore`:

```bash
docker run --rm --network host \
  -v /srv/plagea/backups:/backup \
  mongo:7 \
  mongorestore -u admin -p '<password>' --authenticationDatabase admin \
    --db plagea /backup/<data-do-backup>/plagea
```

Copia periodicamente `/srv/plagea/backups` para fora da máquina (rsync,
S3, etc.) — um backup que só existe no mesmo disco não protege de uma
falha de disco.

---

## 3. GitHub — segredos e ambientes

### 3.1 Criar a branch `staging`

```bash
git checkout -b staging
git push -u origin staging
```

### 3.2 Configurar os `Environments` (gate de aprovação + segredos isolados)

Em _Settings → Environments_ no GitHub:

1. Cria o ambiente **`staging`**:
   - Secrets: `STAGING_HOST`, `STAGING_SSH_USER` (`deploy`),
     `STAGING_SSH_KEY` (a chave **privada** correspondente à pública
     colocada em `authorized_keys` na secção 1.1).
2. Cria o ambiente **`production`**:
   - Em "Deployment protection rules", activa **Required reviewers** e
     adiciona-te a ti (ou a quem deva aprovar) — isto é o que transforma
     `environment: production` no workflow num gate manual real.
   - Secrets: `PRODUCTION_HOST`, `PRODUCTION_SSH_USER`,
     `PRODUCTION_SSH_KEY`.

Não é preciso criar nenhum segredo para o `ghcr.io` — o workflow usa o
`GITHUB_TOKEN` automático, que já tem permissão de publicar pacotes
(`packages: write`, já configurado em `.github/workflows/deploy.yml`).

---

## 4. Nginx + TLS (por ambiente)

```bash
dnf install -y nginx certbot python3-certbot-nginx
systemctl enable --now nginx
setsebool -P httpd_can_network_connect 1
```

### 4.1 Produção (sempre com o seu próprio vhost em 80/443)

Copia o template `deploy/nginx-plagea.conf.template` para
`/etc/nginx/conf.d/plagea-production.conf`, substituindo:

- `__DOMAIN__` → o teu domínio
- `__APP_PORT__` → a porta onde a app de produção escuta (`PORT` no
  `.env`, secção 5) — ex. `3000`
- `__ENVIRONMENT__` → `production` (só para o nome dos logs)

```bash
nginx -t && systemctl reload nginx
certbot --nginx -d <teu-dominio>
```

O certbot já instala o timer de renovação automática via systemd — não
precisas de configurar cron para isso.

> **Se isto for uma migração** (o domínio já está em produção, a apontar
> para outro servidor, e estás a preparar um servidor novo): o certbot
> só consegue emitir o certificado **depois** do DNS já apontar para o
> servidor novo — a validação do Let's Encrypt (HTTP-01) precisa de
> chegar aqui para encontrar o ficheiro de desafio. Não há forma de
> "preparar o certificado antes". Faz por esta ordem, para minimizar o
> tempo de impacto na produção real:
> 1. Termina primeiro a secção 6 (primeiro deploy) **neste servidor
>    novo**, até a app responder em `http://127.0.0.1:<PORT>/api/health`.
> 2. Testa de fora sem tocar no DNS real, simulando a resolução só para
>    este pedido:
>    ```bash
>    curl --resolve <teu-dominio>:80:<IP-do-servidor-novo> http://<teu-dominio>/api/health
>    ```
> 3. Só quando isso funcionar, pede a troca do registo DNS (do IP antigo
>    para o novo) a quem o gere.
> 4. Confirma a propagação (`dig +short <teu-dominio>` já deve mostrar o
>    IP novo) e **só então** corre o `certbot` desta secção.

### 4.2 Staging — com subdomínio próprio (se tiveres acesso ao DNS)

Repete exactamente o 4.1, mas com `__DOMAIN__` = o subdomínio de staging
(ex. `staging.plagea.exemplo.mz`) e `__APP_PORT__` = a porta de staging
(ex. `3001`). Precisa de um registo DNS próprio para esse subdomínio —
ver secção 0.

### 4.3 Staging — SEM acesso ao DNS (mesmo domínio da produção, porta diferente)

Se não tens acesso ao provedor do domínio para criar um subdomínio,
usa o mesmo domínio da produção para staging, distinguido só por uma
porta externa alternativa (ex. `8443`) — sem precisar de nenhum registo
DNS novo.

Copia `deploy/nginx-plagea-staging-sameport.conf.template` para
`/etc/nginx/conf.d/plagea-staging.conf`, substituindo:

- `__DOMAIN__` → o **mesmo** domínio usado na secção 4.1 (já tem
  certificado válido, emitido pelo certbot para a produção — este bloco
  reaproveita os mesmos ficheiros de certificado, não precisa de correr
  o certbot outra vez)
- `__STAGING_PORT__` → a porta externa escolhida para staging (ex. `8443`)
- `__APP_PORT__` → a porta interna da app de staging (`PORT` no `.env`
  desse ambiente, ex. `3001`)

```bash
firewall-cmd --permanent --add-port=8443/tcp   # ou o valor que escolheste
firewall-cmd --reload
nginx -t && systemctl reload nginx
```

Staging fica acessível em `https://<teu-dominio>:8443`.

> **Importante**: define `SESSION_COOKIE_NAME` no `.env` do ambiente de
> staging com um valor diferente do de produção (ver `.env.example`,
> já suportado em `lib/auth.ts`). Um cookie de sessão não distingue
> porta — só o nome o faz — por isso, sem isto, autenticar em staging e
> em produção no mesmo browser pisava-se um ao outro.

---

## 5. Estrutura e `.env` por ambiente

Repete por ambiente (`staging` e `production`):

```bash
mkdir -p /srv/plagea/staging /srv/plagea/production
```

Cria `/srv/plagea/<ambiente>/.env` (**nunca** commitado, permissões
restritas):

```bash
cat > /srv/plagea/production/.env <<'EOF'
MONGODB_URI=mongodb://plagea_app:<password>@127.0.0.1:27017/plagea?authSource=admin
MONGODB_DB=plagea
SESSION_SECRET=<gerar com: openssl rand -base64 32>
PORT=3000
EOF
chmod 600 /srv/plagea/production/.env
chown deploy:deploy /srv/plagea/production/.env
```

(repete para `staging`, com `PORT=3001` se partilhar o mesmo servidor, e
uma base de dados/`MONGODB_URI` diferente — nunca a mesma do production).

As linhas `APP_IMAGE=`/`MIGRATE_IMAGE=` **não** precisas de criar à mão —
o `deploy.sh` escreve-as automaticamente a cada deploy.

### Unit systemd (template, uma vez por servidor)

Este ficheiro não faz parte do que o CI copia a cada deploy (isso é só
`docker-compose.yml` e `deploy.sh`, ver secção 6) — é uma configuração
do próprio servidor, uma única vez. Primeiro, **na tua máquina** (onde
tens o repositório clonado), envia-o para o servidor:

```bash
scp deploy/plagea-app@.service deploy@<host>:/tmp/
```

Depois, **no servidor** (via SSH, como root ou com sudo):

```bash
sudo mv /tmp/plagea-app@.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable plagea-app@production.service
sudo systemctl enable plagea-app@staging.service   # só se este servidor também servir staging
```

(`plagea-app@production` e `plagea-app@staging` são duas _instâncias_ da
mesma unit — `%i` no ficheiro resolve para o texto depois do `@`.)

---

## 6. Primeiro deploy (bootstrap manual)

Antes do pipeline correr pela primeira vez com sucesso, faz um deploy
manual para confirmar que toda a infraestrutura está pronta:

```bash
# no teu computador, dentro do repositório — o login é SEMPRE necessário
# para fazer push (independentemente de o pacote ficar público ou
# privado depois; isso só afecta quem o pode "pull" sem autenticação).
# Password = um Personal Access Token com o scope "write:packages"
# (github.com/settings/tokens), não a password normal da conta.
docker login ghcr.io -u zelitosaide
docker build --target runner -t ghcr.io/zelitosaide/plagea:bootstrap .
docker build --target builder -t ghcr.io/zelitosaide/plagea:bootstrap-tools .
docker push ghcr.io/zelitosaide/plagea:bootstrap
docker push ghcr.io/zelitosaide/plagea:bootstrap-tools

# copia os ficheiros base para o servidor
scp docker-compose.yml deploy/deploy.sh deploy@<host>:/srv/plagea/production/

# no servidor
ssh deploy@<host>
chmod +x /srv/plagea/production/deploy.sh
/srv/plagea/production/deploy.sh production bootstrap
```

Se o smoke test (`/api/health`) passar, a infraestrutura está pronta.
Repete para `staging`. A partir daqui, os deploys normais passam a ser
automáticos (secção 7).

---

## 7. Operação do dia a dia

### 7.1 Deploy normal

- `git push origin staging` → CI builda, publica em `ghcr.io`, faz deploy
  automático ao ambiente de staging.
- Depois de validado em staging: `git checkout main && git merge staging && git push origin main`
  → builda, publica, e **espera aprovação manual** (Environments →
  production → Review deployments) antes de atingir produção.

### 7.2 Rollback manual

```bash
ssh deploy@<host>
cat /srv/plagea/production/last-good-tag   # tag anterior, se precisares de a repetir manualmente
/srv/plagea/production/deploy.sh production <tag-anterior>
```

O próprio `deploy.sh` já faz rollback automático se o smoke test falhar
logo após o deploy (ver script).

### 7.3 Migrações

Correm automaticamente a cada deploy (dentro do `deploy.sh`, antes do
restart). Para correr manualmente:

```bash
cd /srv/plagea/production
docker compose run --rm migrate scripts/migrate-sample-slots.mjs
```

### 7.4 Logs

```bash
journalctl -u plagea-app@production.service -f
docker logs -f plagea-app
```

### 7.5 Health check manual

```bash
curl http://127.0.0.1:3000/api/health
```

---

## 8. Checklist final

- [ ] Docker instalado e `docker compose version` funciona
- [ ] MongoDB nativo instalado, `bindIp 127.0.0.1`, autenticação activa
- [ ] Utilizador de aplicação do Mongo criado (base própria por ambiente)
- [ ] Backup diário do Mongo configurado e testado (`mongorestore` já experimentado pelo menos uma vez)
- [ ] Nginx + certbot configurados, HTTPS a funcionar no domínio de cada ambiente
- [ ] `firewall-cmd --list-all` só mostra ssh/http/https (+ a porta de staging, ex. 8443, se estiveres a usar o mesmo domínio para os dois ambientes — ver secção 4.3)
- [ ] Se staging partilha o domínio da produção: `SESSION_COOKIE_NAME` diferente no `.env` de cada ambiente
- [ ] `/srv/plagea/<ambiente>/.env` criado, com permissões `600`
- [ ] Unit `plagea-app@<ambiente>.service` instalada e `enabled`
- [ ] Branch `staging` criada
- [ ] GitHub Environments `staging`/`production` criados, com os segredos de SSH
- [ ] "Required reviewers" activo no ambiente `production`
- [ ] Primeiro deploy manual (secção 6) feito com sucesso nos dois ambientes
- [ ] `git push origin staging` dispara o deploy automático e fica saudável
