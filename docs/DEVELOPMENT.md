# Correr o Plagea em desenvolvimento

> Nota: existe um `readme.md` na raiz do repositório, mas o conteúdo dele é
> de outro projecto (a "Data Statement API" da Vodacom) — não é a
> documentação desta app. Para evitar sobrepor esse ficheiro (o sistema de
> ficheiros deste Mac não distingue `README.md` de `readme.md`), a
> documentação do Plagea fica em `docs/` — este ficheiro para
> desenvolvimento local, [DEPLOYMENT.md](./DEPLOYMENT.md) para produção/staging.

## Pré-requisitos

- **Node.js 20+** (o Dockerfile de produção usa `node:20-alpine`; localmente
  qualquer 20.x/22.x funciona).
- **pnpm** — é o gestor de pacotes deste projecto (ver `pnpm-lock.yaml` e o
  campo `packageManager` no `package.json`). Instala com
  `npm install -g pnpm` se ainda não o tiveres.
- **Docker Desktop** (ou outro Mongo acessível) — só é preciso para correr
  um MongoDB local; a app em si não corre em container durante o
  desenvolvimento (isso é só para produção, ver `docs/DEPLOYMENT.md`).

## 1. Instalar dependências

```bash
pnpm install
```

## 2. MongoDB local

Para desenvolvimento, o mais simples é um container Mongo sem
autenticação (nunca faças isto em produção — ver `docs/DEPLOYMENT.md`
secção 2 para o setup com autenticação):

```bash
docker run -d --name plagea-mongo-dev \
  -p 27017:27017 \
  -v plagea-mongo-dev-data:/data/db \
  mongo:7
```

Confirma que está a correr: `docker ps | grep plagea-mongo-dev`.

Para parar/retomar depois (os dados ficam no volume `plagea-mongo-dev-data`):

```bash
docker stop plagea-mongo-dev
docker start plagea-mongo-dev
```

## 3. Variáveis de ambiente

Copia o template e ajusta para o Mongo local (sem autenticação, por isso
sem utilizador/password no URI):

```bash
cp .env.example .env.local
```

Edita `.env.local`:

```
MONGODB_URI=mongodb://127.0.0.1:27017/plagea
MONGODB_DB=plagea
SESSION_SECRET=qualquer-string-para-desenvolvimento
PORT=3000
```

(`.env.local` já está no `.gitignore` — nunca vai para o repositório.)

## 4. Preparar a base de dados (primeira vez)

Com o Mongo local a correr, corre estes scripts **por esta ordem** — cada
um é idempotente, por isso é seguro repetir mais tarde:

```bash
node --env-file=.env.local scripts/seed-users.mjs
node --env-file=.env.local scripts/migrate-departments.mjs
node --env-file=.env.local scripts/migrate-equipment.mjs
node --env-file=.env.local scripts/migrate-sample-slots.mjs
```

O que cada um faz:

| Script | O que faz |
| --- | --- |
| `seed-users.mjs` | Cria 4 contas (`admin`), password inicial = o próprio email |
| `migrate-departments.mjs` | Cria o departamento "Microbiologia"; promove `zelitosaide83@gmail.com` a `superadmin`; os outros 3 ficam `admin` desse departamento |
| `migrate-equipment.mjs` | Migração do modelo antigo de congeladores — não-op numa BD nova, mas seguro correr |
| `migrate-sample-slots.mjs` | Cria os índices da colecção `sample_slots` (reserva de posições) — importante correr mesmo numa BD vazia, para os índices já existirem antes de criares a primeira amostra |

(Estes mesmos comandos também estão disponíveis como `pnpm run migrate:departments` / `migrate:equipment` / `migrate:sample-slots`, mas nesse caso tens de exportar as variáveis de ambiente tu mesmo em vez de usar `--env-file`.)

## 5. Correr a app

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) e entra com um dos
emails do passo 4 (ex. `zelitosaide83@gmail.com`) e password = o próprio
email.

## 6. Scripts úteis

| Comando | Descrição |
| --- | --- |
| `pnpm dev` | Servidor de desenvolvimento (Turbopack, hot reload) |
| `pnpm build` | Build de produção |
| `pnpm start` | Corre o build de produção localmente (precisa de `pnpm build` primeiro) |
| `npx tsc --noEmit` | Verificação de tipos isolada — o `next build` **não** apanha erros de tipo, porque `next.config.mjs` tem `ignoreBuildErrors: true` |
| `pnpm run seed:users` | Re-corre o seed de utilizadores (idempotente) |
| `pnpm run migrate:departments` / `migrate:equipment` / `migrate:sample-slots` | Scripts de migração (idempotentes) |

## Produção / staging

Isto cobre só o desenvolvimento local. Para construir a imagem Docker,
configurar o MongoDB com autenticação, Nginx/TLS e o pipeline de CI/CD,
ver [docs/DEPLOYMENT.md](./DEPLOYMENT.md).
