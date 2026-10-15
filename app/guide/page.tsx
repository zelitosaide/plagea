"use client"

import type { ComponentType } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Download,
  Building2,
  Warehouse,
  TestTube,
  Search,
  BarChart3,
  ShieldCheck,
  Copy,
  Link2,
  AlertTriangle,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  user: "Utilizador",
}

function SectionHeading({
  id,
  icon: Icon,
  title,
}: {
  id: string
  icon: ComponentType<{ className?: string }>
  title: string
}) {
  return (
    <h2 id={id} className="text-xl font-semibold text-foreground flex items-center gap-2 scroll-mt-20">
      <Icon className="h-5 w-5 text-primary" />
      {title}
    </h2>
  )
}

export default function GuidePage() {
  const { user } = useAuth()
  const role = user?.role || "user"
  const isAdmin = role === "admin" || role === "superadmin"
  const isSuperAdmin = role === "superadmin"

  const sections = [
    { id: "visao-geral", label: "Visão Geral" },
    { id: "departamentos-papeis", label: "Departamentos e Papéis" },
    { id: "equipamento", label: "Equipamento de Armazenamento" },
    { id: "amostras", label: "Gerir Amostras" },
    { id: "pesquisar-partilhar", label: "Pesquisar e Partilhar Amostras" },
    { id: "relatorios", label: "Relatórios" },
    ...(isAdmin ? [{ id: "administracao", label: "Administração" }] : []),
    { id: "faq", label: "Perguntas Frequentes" },
  ]

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Guia do Utilizador
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
            Como usar o PlaGeA, adaptado ao que a sua conta pode fazer
            {user && (
              <Badge variant={isSuperAdmin ? "outline" : isAdmin ? "secondary" : "default"}>
                A sua conta: {ROLE_LABEL[role] || role}
              </Badge>
            )}
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => window.print()}>
          <Download className="h-4 w-4" />
          Transferir PDF
        </Button>
      </div>

      <Card className="print:shadow-none print:border-none">
        <CardContent className="p-6 md:p-10 space-y-10">
          {/* Table of contents */}
          <nav aria-label="Índice" className="print:hidden">
            <p className="text-sm font-medium text-muted-foreground mb-2">Índice</p>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 list-decimal list-inside text-sm">
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="text-primary hover:underline">
                    {section.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Visão geral */}
          <section className="space-y-3 print:break-inside-avoid">
            <SectionHeading id="visao-geral" icon={BookOpen} title="Visão Geral" />
            <p className="text-sm leading-relaxed text-foreground">
              O PlaGeA (Plataforma de Gestão de Amostras) regista onde está guardada cada amostra
              de laboratório — em que congelador, arquivo de blocos ou arquivo de lâminas, e em
              que posição exacta — para que qualquer pessoa da equipa consiga encontrar uma
              amostra sem ter de perguntar a quem a guardou.
            </p>
            <p className="text-sm leading-relaxed text-foreground">
              O sistema está organizado por <strong>departamento</strong>: cada instituição ou
              serviço (por exemplo, Microbiologia ou Anatomia Patológica) só vê e gere o seu
              próprio equipamento e as suas próprias amostras.
            </p>
          </section>

          {/* Departamentos e Papéis */}
          <section className="space-y-3 print:break-inside-avoid">
            <SectionHeading id="departamentos-papeis" icon={Building2} title="Departamentos e Papéis" />
            <p className="text-sm leading-relaxed text-foreground">
              Cada conta tem um papel, que determina o que consegue ver e fazer:
            </p>
            <div className="space-y-3">
              <div className={`flex gap-3 items-start rounded-md ${role === "user" ? "bg-primary/5 p-2 -m-2" : ""}`}>
                <Badge className="mt-0.5 shrink-0">Utilizador</Badge>
                <p className="text-sm text-muted-foreground">
                  Adiciona, edita e consulta equipamento e amostras do seu departamento. Não gere contas de outras pessoas.
                  {role === "user" && <span className="text-primary font-medium"> — é o seu papel actual.</span>}
                </p>
              </div>
              <div className={`flex gap-3 items-start rounded-md ${role === "admin" ? "bg-primary/5 p-2 -m-2" : ""}`}>
                <Badge variant="secondary" className="mt-0.5 shrink-0">Admin</Badge>
                <p className="text-sm text-muted-foreground">
                  Tudo o que um Utilizador pode fazer, mais a gestão dos utilizadores do seu próprio departamento (em
                  "Administração").
                  {role === "admin" && <span className="text-primary font-medium"> — é o seu papel actual.</span>}
                </p>
              </div>
              <div className={`flex gap-3 items-start rounded-md ${isSuperAdmin ? "bg-primary/5 p-2 -m-2" : ""}`}>
                <Badge variant="outline" className="mt-0.5 shrink-0">Superadmin</Badge>
                <p className="text-sm text-muted-foreground">
                  Papel ao nível da instituição: cria departamentos, vê e gere equipamento e amostras de
                  <em> todos</em> os departamentos, e é o único que atribui o departamento de um novo utilizador.
                  {isSuperAdmin && <span className="text-primary font-medium"> — é o seu papel actual.</span>}
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Um utilizador de um departamento nunca vê equipamento, amostras ou utilizadores de outro departamento —
              mesmo que soubesse o link exacto, o sistema recusa o acesso.
            </p>
          </section>

          {/* Equipamento */}
          <section className="space-y-4 print:break-inside-avoid">
            <SectionHeading id="equipamento" icon={Warehouse} title="Equipamento de Armazenamento" />
            <p className="text-sm leading-relaxed text-foreground">
              Existem três tipos de equipamento, cada um com o seu próprio formato de código de
              localização. Em <strong>Equipamentos → Adicionar Novo Equipamento</strong>, escolha
              primeiro o tipo — os campos seguintes ajustam-se automaticamente.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-border p-4 space-y-2">
                <p className="font-medium text-sm">Congelador</p>
                <p className="font-mono text-sm text-primary">F1-S1-D-B1-P1</p>
                <p className="text-xs text-muted-foreground">
                  Congelador 1, Prateleira 1, lado Direito, Box 1, Posição 1. A Box é uma grelha (ex. 9×9), com as
                  dimensões que definir.
                </p>
              </div>
              <div className="rounded-lg border border-border p-4 space-y-2">
                <p className="font-medium text-sm">Arquivo de Blocos</p>
                <p className="font-mono text-sm text-primary">AB1-G3-L2-P15</p>
                <p className="text-xs text-muted-foreground">
                  Arquivo de Blocos 1, Gaveta 3, Linha 2, Posição 15. Cada Linha é uma fila simples numerada, não uma
                  grelha.
                </p>
              </div>
              <div className="rounded-lg border border-border p-4 space-y-2">
                <p className="font-medium text-sm">Arquivo de Lâminas</p>
                <p className="font-mono text-sm text-primary">AL2-G4-P35</p>
                <p className="text-xs text-muted-foreground">
                  Arquivo de Lâminas 2, Gaveta 4, Posição 35. Cada Gaveta é também uma fila simples numerada.
                </p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              O número de posições de uma Box, Linha ou Gaveta não vem fixo — use "Definir dimensões", no formulário
              de amostra, para ajustar ao tamanho real. Posições já ocupadas por outra amostra aparecem marcadas e
              não podem ser escolhidas outra vez.
            </p>
          </section>

          {/* Amostras */}
          <section className="space-y-3 print:break-inside-avoid">
            <SectionHeading id="amostras" icon={TestTube} title="Gerir Amostras" />
            <p className="text-sm leading-relaxed text-foreground">
              Em <strong>Amostras → Adicionar Nova Amostra</strong>, preencha os dados clínicos
              (código do paciente, tipo, quantidade, projecto, datas) e depois o local de
              armazenamento: escolha o equipamento e vá preenchendo os níveis de localização
              (Prateleira/Gaveta/Linha, conforme o tipo) até chegar à grelha ou fila de posições,
              onde escolhe a posição livre.
            </p>
            <p className="text-sm leading-relaxed text-foreground">
              Ao guardar, é levado directamente para a página dessa amostra — onde pode confirmar
              tudo, editar outra vez, ou eliminar a amostra se tiver sido um engano.
            </p>
          </section>

          {/* Pesquisar e partilhar */}
          <section className="space-y-3 print:break-inside-avoid">
            <SectionHeading id="pesquisar-partilhar" icon={Search} title="Pesquisar e Partilhar Amostras" />
            <p className="text-sm leading-relaxed text-foreground">
              Em <strong>Amostras</strong>, pesquise por código do paciente, tipo ou projecto, e
              filtre por equipamento, tipo de amostra ou projecto. Clicar no código do paciente,
              ou no ícone de olho, abre a página de detalhe dessa amostra.
            </p>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                Partilhar uma amostra
              </p>
              <p className="text-sm text-muted-foreground">
                Na página de detalhe de cada amostra, o botão <strong>Copiar Link</strong> copia o
                endereço dessa página — útil para enviar a um colega. O botão{" "}
                <span className="inline-flex items-center gap-1 font-medium">
                  <Copy className="h-3.5 w-3.5" />
                  Copiar
                </span>{" "}
                junto ao código de localização (ex. <span className="font-mono">F1-S1-D-B1-P1</span>) copia só esse
                código, pronto a colar num formulário externo como o REDCap.
              </p>
            </div>
          </section>

          {/* Relatórios */}
          <section className="space-y-3 print:break-inside-avoid">
            <SectionHeading id="relatorios" icon={BarChart3} title="Relatórios" />
            <p className="text-sm leading-relaxed text-foreground">
              Em <strong>Relatórios</strong>, escolha um intervalo de datas ("De" / "Até") para ver
              a actividade de amostras nesse período: por tipo, por projecto, e ao longo do tempo.
              A ocupação de equipamento e as listas de validade mostram sempre o estado actual,
              independentemente do intervalo escolhido.
            </p>
            <p className="text-sm leading-relaxed text-foreground">
              Os botões <strong>Exportar CSV</strong> e <strong>Imprimir / PDF</strong>, no topo da
              página, permitem levar o relatório para fora do sistema — o CSV abre em Excel, e
              "Imprimir / PDF" usa o diálogo de impressão do próprio navegador (escolha "Guardar
              como PDF" como destino).
            </p>
            {isSuperAdmin ? (
              <p className="text-sm leading-relaxed text-foreground">
                Como superadmin, vê ainda uma secção de <strong>"Visão Institucional"</strong>,
                comparando todos os departamentos — não aparece para Admin nem Utilizador.
              </p>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Os relatórios mostram sempre dados do seu próprio departamento. A comparação entre
                departamentos ("Visão Institucional") só é visível para o superadmin.
              </p>
            )}
          </section>

          {/* Administração */}
          {isAdmin && (
            <section className="space-y-3 print:break-inside-avoid">
              <SectionHeading id="administracao" icon={ShieldCheck} title="Administração" />
              {isSuperAdmin ? (
                <p className="text-sm leading-relaxed text-foreground">
                  Como superadmin, em <strong>Administração</strong> vê e gere utilizadores de{" "}
                  <em>todos</em> os departamentos, escolhendo o departamento (ou nenhum, para criar
                  outro superadmin) ao criar cada conta. É também o único papel que cria novos
                  departamentos, em <strong>Departamentos</strong>.
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-foreground">
                  Como admin, em <strong>Administração</strong> pode criar, editar ou desactivar
                  contas de utilizador — mas só dentro do seu próprio departamento. Para criar um
                  novo departamento, ou mover alguém para outro departamento, peça a um superadmin.
                </p>
              )}
            </section>
          )}

          {/* FAQ */}
          <section className="space-y-4 print:break-inside-avoid">
            <SectionHeading id="faq" icon={AlertTriangle} title="Perguntas Frequentes" />
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Enganei-me a escolher a posição de uma amostra. Como corrijo?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Abra a amostra e clique em "Editar" — pode alterar o equipamento, qualquer nível de localização ou a
                  posição, exactamente como ao criá-la.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">A posição que quero escolher aparece ocupada, mas tenho a certeza de que está livre.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Confirme que escolheu o equipamento e os níveis de localização certos (Prateleira/Lado/Box ou
                  Gaveta/Linha) — uma posição "P5" na Linha 1 é diferente de uma posição "P5" na Linha 2.
                </p>
              </div>
              {isSuperAdmin ? (
                <div>
                  <p className="text-sm font-medium">Como atribuo um utilizador a outro departamento?</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Em "Administração", edite a conta e escolha o novo departamento — só o superadmin tem essa opção;
                    um admin só gere contas já dentro do seu próprio departamento.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium">Porque não vejo o equipamento de outro departamento?</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    É intencional: cada departamento só vê e gere o seu próprio equipamento e amostras. Só um
                    superadmin tem visão sobre todos os departamentos.
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">Posso mudar o tamanho de uma Box, Linha ou Gaveta depois de já ter amostras lá dentro?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Sim, em "Definir dimensões" no formulário de amostra — mas reduzir o tamanho não remove amostras já
                  guardadas em posições que deixem de existir; confirme antes de reduzir.
                </p>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
