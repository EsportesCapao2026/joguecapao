import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileText,
  Gavel,
  ListChecks,
  MapPin,
  Medal,
  ShieldCheck,
  Table2,
  Users,
} from "lucide-react";

const jogos = [
  {
    rodada: "Rodada 1",
    categoria: "Masculino • Série Ouro",
    equipeA: "Unidos",
    equipeB: "Visual",
    data: "Sábado, 06/07",
    hora: "19h",
    local: "Ginásio Municipal",
  },
  {
    rodada: "Rodada 1",
    categoria: "Masculino • Série Prata",
    equipeA: "XT",
    equipeB: "Bom de Várzea",
    data: "Sábado, 06/07",
    hora: "20h",
    local: "Ginásio Municipal",
  },
  {
    rodada: "Rodada 2",
    categoria: "Feminino • Série Ouro",
    equipeA: "São Paulo",
    equipeB: "Vagal",
    data: "Domingo, 07/07",
    hora: "18h30",
    local: "Ginásio Municipal",
  },
];

const classificacao = [
  { pos: 1, equipe: "Unidos", pts: 12, j: 4, v: 4, e: 0, d: 0, sg: 9 },
  { pos: 2, equipe: "Visual", pts: 9, j: 4, v: 3, e: 0, d: 1, sg: 5 },
  { pos: 3, equipe: "XT", pts: 7, j: 4, v: 2, e: 1, d: 1, sg: 3 },
  { pos: 4, equipe: "Bom de Várzea", pts: 4, j: 4, v: 1, e: 1, d: 2, sg: -1 },
];

const artilheiros = [
  { pos: 1, nome: "João Silva", equipe: "Unidos", gols: 8 },
  { pos: 2, nome: "Pedro Santos", equipe: "Visual", gols: 6 },
  { pos: 3, nome: "Carlos Oliveira", equipe: "XT", gols: 5 },
  { pos: 4, nome: "Lucas Martins", equipe: "Bom de Várzea", gols: 4 },
];

const menu = [
  { label: "Jogos", href: "#jogos", icon: CalendarDays },
  { label: "Classificação", href: "#classificacao", icon: Table2 },
  { label: "Artilharia", href: "#artilharia", icon: Medal },
  { label: "Regras", href: "#regras", icon: ListChecks },
  { label: "Punições", href: "#punicoes", icon: Gavel },
  { label: "Denúncia", href: "/denuncias", icon: FileText },
  { label: "Inscrever equipe", href: "/inscricoes", icon: Users },
];

export default function CampeonatoDetalhePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020806] text-white">
      <Background />

      <div className="relative z-10 mx-auto max-w-[1500px] px-4 py-6 md:px-8">
        <Header />

        <section className="grid gap-6 pt-8 lg:grid-cols-[300px_1fr]">
          <aside className="h-fit rounded-[34px] border border-white/10 bg-black/42 p-4 shadow-2xl backdrop-blur-xl lg:sticky lg:top-8">
            <div className="mb-4 rounded-[26px] border border-white/10 bg-white/[0.045] p-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
                Campeonato
              </p>
              <h2 className="mt-1 text-2xl font-black">Municipal de Futsal</h2>
            </div>

            <nav className="space-y-2">
              {menu.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 rounded-[22px] px-4 py-4 text-lg font-black text-white/78 transition hover:bg-white/[0.09] hover:text-emerald-300"
                  >
                    <Icon size={22} className="text-emerald-300" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          <div className="space-y-6">
            <section className="rounded-[36px] border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl md:p-9">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-black text-emerald-200">
                <ShieldCheck size={16} />
                Campeonato em andamento
              </div>

              <h1 className="text-4xl font-black leading-tight md:text-6xl">
                Municipal de{" "}
                <span className="bg-gradient-to-r from-[#ffd400] via-[#67dd7a] to-[#00bde7] bg-clip-text text-transparent">
                  Futsal
                </span>
              </h1>

              <p className="mt-5 max-w-4xl text-lg leading-8 text-white/68">
                Acompanhe jogos, classificação, artilharia, regras, denúncias e
                punições do campeonato. As informações abaixo serão filtradas por
                categoria e série quando conectarmos ao Supabase.
              </p>

              <div className="mt-7 grid gap-4 md:grid-cols-4">
                <Resumo label="Equipes" value="24" />
                <Resumo label="Jogos" value="38" />
                <Resumo label="Categorias" value="2" />
                <Resumo label="Séries" value="3" />
              </div>
            </section>

            <section id="jogos" className="rounded-[34px] border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl md:p-8">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">
                Agenda
              </p>
              <h2 className="mt-2 text-3xl font-black md:text-5xl">
                Jogos e confrontos
              </h2>

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {jogos.map((jogo) => (
                  <article
                    key={`${jogo.equipeA}-${jogo.equipeB}`}
                    className="rounded-[28px] border border-white/10 bg-white/[0.055] p-5 transition hover:bg-white/[0.085]"
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <span className="rounded-full bg-emerald-300/12 px-4 py-2 text-sm font-black text-emerald-200">
                        {jogo.rodada}
                      </span>
                      <span className="text-sm font-bold text-white/50">
                        {jogo.categoria}
                      </span>
                    </div>

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="text-left text-2xl font-black">{jogo.equipeA}</div>
                      <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-2 text-lg font-black text-white/55">
                        X
                      </div>
                      <div className="text-right text-2xl font-black">{jogo.equipeB}</div>
                    </div>

                    <div className="mt-5 grid gap-3 text-sm text-white/65 md:grid-cols-3">
                      <Info icon={<CalendarDays size={16} />} text={jogo.data} />
                      <Info icon={<Clock3 size={16} />} text={jogo.hora} />
                      <Info icon={<MapPin size={16} />} text={jogo.local} />
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section id="classificacao" className="rounded-[34px] border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl md:p-8">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">
                Tabela
              </p>
              <h2 className="mt-2 text-3xl font-black md:text-5xl">
                Tabela de classificação
              </h2>

              <div className="mt-6 overflow-hidden rounded-[28px] border border-white/10">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-white/[0.07] text-xs uppercase tracking-[0.16em] text-white/55">
                    <tr>
                      <th className="p-4">#</th>
                      <th className="p-4">Equipe</th>
                      <th className="p-4">Pts</th>
                      <th className="p-4">J</th>
                      <th className="p-4">V</th>
                      <th className="p-4">E</th>
                      <th className="p-4">D</th>
                      <th className="p-4">SG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classificacao.map((linha) => (
                      <tr
                        key={linha.equipe}
                        className="border-t border-white/10 bg-white/[0.035] transition hover:bg-white/[0.06]"
                      >
                        <td className="p-4">
                          <span
                            className={`grid h-9 w-9 place-items-center rounded-xl font-black ${
                              linha.pos <= 3
                                ? "bg-gradient-to-r from-[#ffd400] via-[#67dd7a] to-[#00bde7] text-black"
                                : "bg-white/10 text-white"
                            }`}
                          >
                            {linha.pos}
                          </span>
                        </td>
                        <td className="p-4 text-lg font-black">{linha.equipe}</td>
                        <td className="p-4 font-black text-emerald-300">{linha.pts}</td>
                        <td className="p-4 text-white/70">{linha.j}</td>
                        <td className="p-4 text-white/70">{linha.v}</td>
                        <td className="p-4 text-white/70">{linha.e}</td>
                        <td className="p-4 text-white/70">{linha.d}</td>
                        <td className="p-4 text-white/70">{linha.sg}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="artilharia" className="rounded-[34px] border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl md:p-8">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">
                Ranking
              </p>
              <h2 className="mt-2 text-3xl font-black md:text-5xl">
                Artilharia
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {artilheiros.map((item) => (
                  <article
                    key={item.nome}
                    className="flex items-center justify-between rounded-[26px] border border-white/10 bg-white/[0.055] p-5 transition hover:bg-white/[0.085]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-r from-[#ffd400] via-[#67dd7a] to-[#00bde7] font-black text-black">
                        {item.pos}
                      </div>
                      <div>
                        <h3 className="text-xl font-black">{item.nome}</h3>
                        <p className="text-sm text-white/55">{item.equipe}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-3xl font-black text-emerald-300">{item.gols}</p>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
                        gols
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section id="regras" className="rounded-[34px] border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl md:p-8">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">
                Regulamento
              </p>
              <h2 className="mt-2 text-3xl font-black md:text-5xl">
                Regras do campeonato
              </h2>
              <p className="mt-4 max-w-4xl text-lg leading-8 text-white/68">
                Esta área receberá o regulamento específico do campeonato e a
                consulta aos artigos aplicáveis quando conectarmos o banco de regras.
              </p>
            </section>

            <section id="punicoes" className="rounded-[34px] border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl md:p-8">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">
                Justiça desportiva
              </p>
              <h2 className="mt-2 text-3xl font-black md:text-5xl">
                Punições do campeonato
              </h2>
              <p className="mt-4 max-w-4xl text-lg leading-8 text-white/68">
                Aqui serão listadas as punições filtradas por campeonato, categoria,
                série, equipe e atleta.
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function Background() {
  return (
    <>
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50"
        style={{ backgroundImage: "url('/bg-estadio.jpg')" }}
      />
      <div className="fixed inset-0 z-[1] bg-black/55" />
      <div className="fixed inset-0 z-[2] bg-[radial-gradient(circle_at_top_left,rgba(255,213,0,0.15),transparent_26%),radial-gradient(circle_at_top_right,rgba(0,195,255,0.16),transparent_30%),linear-gradient(to_bottom,rgba(0,0,0,0.12),rgba(0,0,0,0.72))]" />
      <div className="fixed inset-0 z-[3] bg-[linear-gradient(rgba(90,255,210,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(90,255,210,0.035)_1px,transparent_1px)] bg-[size:64px_64px]" />
    </>
  );
}

function Header() {
  return (
    <header className="rounded-[34px] border border-white/10 bg-black/42 px-5 py-5 shadow-2xl backdrop-blur-xl md:px-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="block">
          <div className="relative h-24 w-[300px] sm:h-28 sm:w-[340px] xl:h-32 xl:w-[340px]">
            <Image
              src="/logo-capao.png"
              alt="Prefeitura de Capão da Canoa"
              fill
              priority
              sizes="(min-width: 1280px) 340px, (min-width: 640px) 340px, 300px"
              className="object-contain object-left"
            />
          </div>
        </Link>

        <Link
          href="/campeonatos"
          className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-5 py-3 font-black text-white transition hover:bg-white/[0.1]"
        >
          <ArrowLeft size={18} />
          Voltar para campeonatos
        </Link>
      </div>
    </header>
  );
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-white/65">
      <span className="text-emerald-300">{icon}</span>
      {text}
    </div>
  );
}

function Resumo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
      <p className="mt-1 bg-gradient-to-r from-[#ffd400] via-[#67dd7a] to-[#00bde7] bg-clip-text text-xl font-black text-transparent">
        {value}
      </p>
    </div>
  );
}
