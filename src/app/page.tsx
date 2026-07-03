import Image from "next/image";
import Link from "next/link";
import { supabasePublic } from "@/lib/supabasePublic";
import LiveMatchBanner, { type JogoAoVivo } from "@/components/public/LiveMatchBanner";
import { parseJogoObservacoes } from "@/lib/tempoReal";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  FileText,
  Gavel,
  ListChecks,
  MapPin,
  Medal,
  ShieldCheck,
  Table2,
  Trophy,
  Users,
} from "lucide-react";

function formatarData(data: string | null) {
  if (!data) return "A definir";
  const partes = data.split("-");
  if (partes.length !== 3) return data;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export const dynamic = "force-dynamic";

const acessosRapidos = [
  {
    titulo: "Campeonatos",
    descricao: "Escolha um campeonato para ver jogos, classificação e artilharia.",
    href: "/campeonatos",
    icon: Trophy,
    destaque: true,
  },
  {
    titulo: "Jogos e confrontos",
    descricao: "Veja a agenda dos próximos jogos e rodadas.",
    href: "/campeonatos/municipal-futsal#jogos",
    icon: CalendarDays,
    destaque: false,
  },
  {
    titulo: "Inscrever equipe",
    descricao: "Cadastre time, atletas e responsável.",
    href: "/inscricoes",
    icon: Users,
    destaque: true,
  },
  {
    titulo: "Fazer denúncia",
    descricao: "Registre denúncia com partida, equipe e anexos.",
    href: "/denuncias",
    icon: FileText,
    destaque: false,
  },
  {
    titulo: "Regras do campeonato",
    descricao: "Consulte regulamentos e orientações oficiais.",
    href: "/regras",
    icon: ListChecks,
    destaque: false,
  },
  {
    titulo: "Punições",
    descricao: "Consulte atletas suspensos e decisões.",
    href: "/punicoes",
    icon: Gavel,
    destaque: false,
  },
  {
    titulo: "Classificação",
    descricao: "Disponível dentro de cada campeonato.",
    href: "/campeonatos",
    icon: Table2,
    destaque: false,
  },
  {
    titulo: "Artilheiros",
    descricao: "Ranking de gols por campeonato, categoria e série.",
    href: "/campeonatos",
    icon: Medal,
    destaque: false,
  },
  {
    titulo: "Painel administrativo",
    descricao: "Acesso restrito da organização.",
    href: "/admin",
    icon: ShieldCheck,
    destaque: true,
  },
];

type SupabaseListResult<T> = {
  data: T[] | null;
  error: { message?: string } | null;
};

type CampeonatoHome = {
  id: string;
  nome: string;
  modalidade: string | null;
  descricao: string | null;
  status: string | null;
  inscricoes_abertas: boolean | null;
  created_at: string | null;
};

async function buscarListaComFallback<T>(
  consulta: PromiseLike<SupabaseListResult<T>>,
  rotulo: string
) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const resultado = await Promise.race([
      Promise.resolve(consulta),
      new Promise<SupabaseListResult<T>>((resolve) => {
        timeout = setTimeout(() => {
          resolve({
            data: [],
            error: { message: `Tempo esgotado ao carregar ${rotulo}.` },
          });
        }, 4500);
      }),
    ]);

    if (resultado.error) {
      console.error(`[Home] ${rotulo}:`, resultado.error.message);
      return [];
    }

    return resultado.data || [];
  } catch (error) {
    console.error(`[Home] Falha ao carregar ${rotulo}:`, error);
    return [];
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export default async function Home() {
  const [campeonatosData, aoVivoData, agendadosData] = await Promise.all([
    buscarListaComFallback<CampeonatoHome>(
      supabasePublic
        .from("campeonatos")
        .select("id, nome, modalidade, descricao, status, inscricoes_abertas, created_at")
        .neq("status", "encerrado")
        .order("created_at", { ascending: false })
        .limit(6),
      "campeonatos"
    ),
    buscarListaComFallback<JogoAoVivo>(
      supabasePublic
        .from("jogos")
        .select("id, rodada, categoria, serie, equipe_mandante_id, equipe_visitante_id, equipe_mandante_nome, equipe_visitante_nome, data_jogo, horario, local, status, gols_mandante, gols_visitante, observacoes")
        .eq("status", "em_andamento"),
      "jogos ao vivo"
    ),
    buscarListaComFallback<JogoAoVivo>(
      supabasePublic
        .from("jogos")
        .select("id, rodada, categoria, serie, equipe_mandante_id, equipe_visitante_id, equipe_mandante_nome, equipe_visitante_nome, data_jogo, horario, local, status, gols_mandante, gols_visitante, observacoes")
        .neq("status", "realizado")
        .neq("status", "em_andamento")
        .neq("status", "anulado")
        .order("data_jogo", { ascending: true, nullsFirst: false })
        .limit(5),
      "próximos jogos"
    ),
  ]);

  const campeonatos = (campeonatosData || []).map((campeonato) => ({
    nome: campeonato.nome,
    status:
      campeonato.inscricoes_abertas
        ? "Inscrições abertas"
        : campeonato.status === "pausado"
          ? "Pausado"
          : "Em andamento",
    descricao:
      campeonato.descricao ||
      `Campeonato municipal de ${campeonato.modalidade || "esportes"}.`,
    href: `/campeonatos/${campeonato.id}`,
  }));

  const aoVivo = aoVivoData as JogoAoVivo[];

  const proximosJogos = [
    ...aoVivoData,
    ...agendadosData,
  ].slice(0, 5) as JogoAoVivo[];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020806] text-white">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-55"
        style={{ backgroundImage: "url('/bg-estadio.jpg')" }}
      />
      <div className="fixed inset-0 z-[1] bg-black/42" />
      <div className="fixed inset-0 z-[2] bg-[radial-gradient(circle_at_top_left,rgba(255,213,0,0.16),transparent_26%),radial-gradient(circle_at_top_right,rgba(0,195,255,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(75,236,174,0.14),transparent_30%),linear-gradient(to_bottom,rgba(0,0,0,0.08),rgba(0,0,0,0.62))]" />
      <div className="fixed inset-0 z-[3] bg-[linear-gradient(rgba(90,255,210,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(90,255,210,0.035)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative z-10 mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8">
        <header className="rounded-[34px] border border-white/10 bg-black/38 px-5 py-5 shadow-2xl backdrop-blur-xl md:px-7">
          <div className="grid gap-5 xl:grid-cols-[260px_1fr] xl:items-center">
            <Link href="/" className="block shrink-0">
              <div className="relative h-20 w-[260px] sm:h-24 sm:w-[300px] xl:h-28 xl:w-[260px]">
                <Image
                  src="/logo-capao.png"
                  alt="Prefeitura de Capão da Canoa"
                  fill
                  priority
                  sizes="(min-width: 1280px) 260px, (min-width: 640px) 300px, 260px"
                  className="object-contain object-left"
                />
              </div>
            </Link>

            <nav className="flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
              <a
                href="#campeonatos"
                className="rounded-2xl px-3 py-3 text-base font-extrabold text-white/85 transition hover:bg-white/10 hover:text-white xl:text-lg"
              >
                Campeonatos
              </a>

              <a
                href="#jogos"
                className="rounded-2xl px-3 py-3 text-base font-extrabold text-white/85 transition hover:bg-white/10 hover:text-white xl:text-lg"
              >
                Jogos
              </a>

              <Link
                href="/campeonatos"
                className="rounded-2xl px-3 py-3 text-base font-extrabold text-white/85 transition hover:bg-white/10 hover:text-white xl:text-lg"
              >
                Inscrições
              </Link>

              <Link
                href="/denuncias"
                className="rounded-2xl px-3 py-3 text-base font-extrabold text-white/85 transition hover:bg-white/10 hover:text-white xl:text-lg"
              >
                Denúncias
              </Link>

              <Link
                href="/regras"
                className="rounded-2xl px-3 py-3 text-base font-extrabold text-white/85 transition hover:bg-white/10 hover:text-white xl:text-lg"
              >
                Regras
              </Link>

              <Link
                href="/punicoes"
                className="rounded-2xl px-3 py-3 text-base font-extrabold text-white/85 transition hover:bg-white/10 hover:text-white xl:text-lg"
              >
                Punições
              </Link>

              <Link
                href="/admin"
                className="rounded-2xl bg-gradient-to-r from-[#ffd400] via-[#67dd7a] to-[#00bde7] px-5 py-3 text-base font-black text-black transition hover:scale-[1.02] xl:text-lg"
              >
                Área Admin
              </Link>
            </nav>
          </div>
        </header>

        {/* Seção Exclusiva de Jogo Ao Vivo (no topo absoluto) */}
        <LiveMatchBanner jogosIniciais={aoVivo} />

        <section className="grid items-start gap-5 pt-5 lg:grid-cols-[1fr_360px]">
          <div className="h-fit rounded-[36px] border border-white/10 bg-black/36 p-6 shadow-2xl backdrop-blur-xl md:p-9">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-black text-emerald-200">
              <ShieldCheck size={16} />
              Sistema oficial de gestão esportiva
            </div>

            <h1 className="max-w-5xl text-3xl font-black leading-[1] tracking-tight sm:text-4xl md:text-5xl xl:text-6xl">
              <span className="text-white">Seja bem-vindo ao Sistema de</span>
              <br />
              <span className="bg-gradient-to-r from-[#ffd400] via-[#66db78] to-[#00bde7] bg-clip-text text-transparent">
                Campeonatos Municipais
              </span>
              <br />
              <span className="bg-gradient-to-r from-[#ffd400] via-[#66db78] to-[#00bde7] bg-clip-text text-transparent">
                de Capão da Canoa
              </span>
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-7 text-white/70 md:text-lg">
              Plataforma oficial para facilitar a vida dos participantes e da organização:
              inscrições, próximos jogos, denúncias, regras, punições e informações
              dos campeonatos municipais em um só lugar.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/campeonatos"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#ffd400] via-[#67dd7a] to-[#00bde7] px-6 py-4 font-black text-black transition hover:scale-[1.02]"
              >
                Inscrever equipe
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/denuncias"
                className="rounded-2xl border border-white/12 bg-white/[0.07] px-6 py-4 font-black text-white transition hover:bg-white/[0.12]"
              >
                Fazer denúncia
              </Link>

              <Link
                href="/regras"
                className="rounded-2xl border border-white/12 bg-white/[0.07] px-6 py-4 font-black text-white transition hover:bg-white/[0.12]"
              >
                Ver regras
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <InfoBox label="Campeonatos" value="Ativos" />
              <InfoBox label="Inscrições" value="Abertas" />
              <InfoBox label="Sistema" value="Profissional" />
            </div>
          </div>

          <aside className="rounded-[36px] border border-white/10 bg-black/42 p-5 shadow-2xl backdrop-blur-xl">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">
              Acesso rápido
            </p>
            <h2 className="mt-2 text-3xl font-black">O que você precisa?</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Escolha uma opção para acessar diretamente a área desejada.
            </p>

            <div className="mt-4 space-y-2">
              {acessosRapidos.slice(0, 5).map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    href={item.href}
                    key={item.titulo}
                    className={`group flex items-center gap-3 rounded-[18px] border p-3 transition hover:-translate-y-1 ${
                      item.destaque
                        ? "border-emerald-300/20 bg-gradient-to-r from-[#ffd400]/15 via-[#67dd7a]/12 to-[#00bde7]/15"
                        : "border-white/10 bg-white/[0.055] hover:bg-white/[0.09]"
                    }`}
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-300/12 text-emerald-300 transition group-hover:bg-emerald-300 group-hover:text-black">
                      <Icon size={20} />
                    </div>

                    <div>
                      <h3 className="font-black">{item.titulo}</h3>
                      <p className="mt-1 text-xs leading-5 text-white/55">
                        {item.descricao}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </aside>
        </section>

        <section id="jogos" className="grid gap-6 pt-8 pb-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[34px] border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">
              Agenda esportiva
            </p>
            <div className="mt-2 flex items-center justify-between gap-4">
              <h2 className="text-3xl font-black md:text-5xl">Próximos jogos</h2>
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-300">
                <CalendarDays size={28} />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {proximosJogos.length === 0 ? (
                <div className="rounded-[28px] border border-yellow-300/20 bg-yellow-300/10 p-6 text-sm leading-7 text-yellow-100/80">
                  Nenhum jogo agendado no momento. Acompanhe a agenda oficial em breve.
                </div>
              ) : (
                proximosJogos.map((jogo) => {
                  const isLive = jogo.status === "em_andamento";
                  
                  // Parse das observações
                  const jsonObs = parseJogoObservacoes(jogo.observacoes);

                  const tempoReal = jsonObs.tempo_real || {};
                  const minutoCronometro = tempoReal.minuto ?? 0;
                  const segundoCronometro = tempoReal.segundo ?? 0;
                  const periodoCronometro = tempoReal.periodo ?? "1T";
                  const acrescimo = tempoReal.acrescimo ?? 0;
                  const isPenaltis = tempoReal.penaltis_ativo || periodoCronometro === "PEN";
                  
                  const golsDetalhe = jsonObs.gols_detalhe || [];
                  const penaltis = jsonObs.penaltis || { mandante_cobrancas: [], visitante_cobrancas: [] };
                  const penMandante = (penaltis.mandante_cobrancas || []).filter(Boolean).length;
                  const penVisitante = (penaltis.visitante_cobrancas || []).filter(Boolean).length;

                  // Label de tempo real
                  let liveLabel = "Ao Vivo";
                  if (periodoCronometro === "PEN") {
                    liveLabel = "Pênaltis";
                  } else if (periodoCronometro.includes("PR")) {
                    liveLabel = "Prorrogação";
                  }

                  let timeString = `${minutoCronometro}:${segundoCronometro < 10 ? '0' + segundoCronometro : segundoCronometro}`;
                  if (acrescimo > 0) {
                    timeString += ` +${acrescimo}'`;
                  }

                  // Label do tempo corrido / período
                  let periodoLabel = periodoCronometro;
                  if (periodoCronometro === "1T") periodoLabel = "1º Tempo";
                  if (periodoCronometro === "2T") periodoLabel = "2º Tempo";
                  if (periodoCronometro === "INT") periodoLabel = "Intervalo";
                  if (periodoCronometro === "1T-PR") periodoLabel = "Prorrog. (1ºT)";
                  if (periodoCronometro === "INT-PR") periodoLabel = "Prorrog. (Intervalo)";
                  if (periodoCronometro === "2T-PR") periodoLabel = "Prorrog. (2ºT)";
                  if (periodoCronometro === "PEN") periodoLabel = "Penalidades";

                  return (
                    <article
                      key={jogo.id}
                      className={`rounded-[28px] border p-5 transition ${isLive ? "border-red-500/40 bg-red-950/15 shadow-lg shadow-red-500/5 hover:bg-red-950/20" : "border-white/10 bg-white/[0.055] hover:bg-white/[0.085]"}`}
                    >
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {isLive ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-black uppercase text-red-300 animate-pulse">
                              <span className="h-2 w-2 rounded-full bg-red-500" />
                              {liveLabel} — {timeString} ({periodoLabel})
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-300/12 px-4 py-2 text-sm font-black text-emerald-200">
                              {jogo.rodada || "Jogo agendado"}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-white/50">
                          {jogo.categoria || "Geral"}{jogo.serie ? ` • ${jogo.serie}` : ""}
                        </span>
                      </div>

                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <div className="text-left text-2xl font-black md:text-3xl uppercase text-white truncate">
                          {jogo.equipe_mandante_nome || "Mandante"}
                        </div>

                        {isLive ? (
                          <div className="rounded-2xl border border-red-500/30 bg-black/45 px-6 py-4 text-center flex flex-col items-center justify-center min-w-[130px]">
                            <p className="text-4xl font-black text-yellow-200 font-mono tracking-wider">
                              {jogo.gols_mandante ?? 0} - {jogo.gols_visitante ?? 0}
                            </p>
                            
                            {/* Cronômetro Central e Grande */}
                            <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-black font-mono text-red-300 animate-pulse">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              {timeString}
                            </span>

                            {isPenaltis && (
                              <p className="text-xxs font-black text-red-300 uppercase tracking-widest mt-2 animate-pulse">
                                Pen: {penMandante} x {penVisitante}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-2 text-lg font-black text-white/55">
                            X
                          </div>
                        )}

                        <div className="text-right text-2xl font-black md:text-3xl uppercase text-white truncate">
                          {jogo.equipe_visitante_nome || "Visitante"}
                        </div>
                      </div>

                      {/* Exibição dos autores dos gols para partidas ao vivo */}
                      {isLive && golsDetalhe.length > 0 && (
                        <div className="mt-4 rounded-2xl border border-white/5 bg-black/40 p-4 shadow-inner">
                          <p className="text-xxs font-black uppercase tracking-wider text-white/35 mb-2.5 text-center">Gols do Confronto</p>
                          <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto pr-1">
                            {golsDetalhe.map((gol, index) => (
                              <div key={index} className="flex items-center justify-center gap-2 text-xs text-white/80">
                                <span className="text-yellow-300 text-xxs font-black bg-yellow-400/10 border border-yellow-300/20 px-2 py-0.5 rounded-md">
                                  {gol.minuto}&apos;
                                </span>
                                <span className="text-white/50">⚽</span>
                                <strong className="uppercase font-black text-white/90">{gol.atleta_nome}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-5 grid gap-3 text-sm text-white/65 md:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <CalendarDays size={16} className="text-emerald-300" />
                          {formatarData(jogo.data_jogo)}
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock3 size={16} className="text-emerald-300" />
                          {isLive ? "Em andamento" : (jogo.horario || "A definir")}
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-emerald-300" />
                          {jogo.local || "A definir"}
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">
              Importante
            </p>
            <h3 className="mt-2 text-3xl font-black">
              Classificação e artilharia ficam dentro de cada campeonato.
            </h3>
            <p className="mt-4 text-base leading-7 text-white/68">
              Como o município pode ter vários campeonatos ao mesmo tempo, com categorias
              e séries diferentes, a tabela de classificação e a artilharia serão exibidas
              após o usuário escolher o campeonato desejado.
            </p>

            <a
              href="#campeonatos"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-4 font-black text-white transition hover:bg-white/[0.1]"
            >
              Escolher campeonato
              <ArrowRight size={18} />
            </a>
          </div>
        </section>

        <section id="campeonatos" className="pb-14 pt-2">
          <div className="mb-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">
              Campeonatos
            </p>
            <h2 className="mt-2 text-3xl font-black md:text-5xl">
              Escolha o campeonato para ver detalhes.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {campeonatos.length === 0 ? (
              <div className="rounded-[28px] border border-yellow-300/20 bg-yellow-300/10 p-6 text-sm leading-7 text-yellow-100/80 md:col-span-3">
                Nenhum campeonato disponível no momento. A página inicial
                continua ativa, e a organização poderá publicar novas
                competições em breve.
              </div>
            ) : campeonatos.map((campeonato) => (
              <article
                key={campeonato.nome}
                className="rounded-[28px] border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.07]"
              >
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-300/12 text-emerald-300">
                  <Trophy size={24} />
                </div>

                <span className="rounded-full bg-emerald-300/12 px-3 py-1 text-xs font-black text-emerald-200">
                  {campeonato.status}
                </span>

                <h3 className="mt-4 text-2xl font-black">{campeonato.nome}</h3>
                <p className="mt-3 leading-7 text-white/60">{campeonato.descricao}</p>

                <Link href={campeonato.href} className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#ffd400] via-[#67dd7a] to-[#00bde7] px-5 py-4 font-black text-black transition hover:scale-[1.02]">
                  Ver campeonato
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
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
