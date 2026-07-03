import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Layers,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { supabasePublic } from "@/lib/supabasePublic";

type CategoriaConfig = {
  nome: string;
  ativo: boolean;
  series_ativas: boolean;
  series_lista: string[];
};

type Campeonato = {
  id: string;
  nome: string;
  modalidade: string | null;
  descricao: string | null;
  status: string | null;
  categorias_ativas: boolean | null;
  categorias_lista: CategoriaConfig[] | string[] | null;
  series_ativas: boolean | null;
  series_lista: string[] | null;
  inscricoes_abertas: boolean | null;
  data_inicio: string | null;
  data_fim: string | null;
  created_at: string | null;
};

function statusLabel(status: string | null) {
  if (status === "ativo") return "Ativo";
  if (status === "pausado") return "Pausado";
  if (status === "encerrado") return "Encerrado";
  return "Sem status";
}

function statusClass(status: string | null) {
  if (status === "ativo") return "bg-emerald-300 text-black";
  if (status === "pausado") return "border border-yellow-300/30 bg-yellow-300/10 text-yellow-100";
  if (status === "encerrado") return "border border-red-300/30 bg-red-500/10 text-red-100";
  return "border border-white/10 bg-white/10 text-white/70";
}

function formatarData(data: string | null) {
  if (!data) return "Não informada";

  const partes = data.split("-");
  if (partes.length !== 3) return data;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function categoriasTexto(categorias: Campeonato["categorias_lista"]) {
  if (!categorias || categorias.length === 0) return "Não informadas";

  return categorias
    .map((categoria) => {
      if (typeof categoria === "string") return categoria;
      return categoria.nome;
    })
    .filter(Boolean)
    .join(", ");
}

function seriesTexto(categorias: Campeonato["categorias_lista"], seriesLista: string[] | null) {
  const seriesPorCategoria =
    categorias
      ?.flatMap((categoria) => {
        if (typeof categoria === "string") return [];
        if (!categoria.series_ativas) return [];
        return categoria.series_lista || [];
      })
      .filter(Boolean) || [];

  const todas = Array.from(new Set([...seriesPorCategoria, ...(seriesLista || [])]));

  if (todas.length === 0) return "Sem divisão por séries";

  return todas.join(", ");
}

export default async function CampeonatosPage() {
  const { data } = await supabasePublic
    .from("campeonatos")
    .select(
      "id, nome, modalidade, descricao, status, categorias_ativas, categorias_lista, series_ativas, series_lista, inscricoes_abertas, data_inicio, data_fim, created_at"
    )
    .neq("status", "encerrado")
    .order("created_at", { ascending: false });

  const campeonatos = (data || []) as Campeonato[];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020806] text-white">
      <Background />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-4 md:px-6">
        <Header />

        <section className="grid gap-5 pt-5 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="rounded-[26px] border border-white/10 bg-black/42 p-5 shadow-xl backdrop-blur-xl md:p-6">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-sm font-black text-emerald-200">
              <Trophy size={16} />
              Competições
            </div>

            <h1 className="text-3xl font-black leading-tight md:text-5xl">
              Campeonatos{" "}
              <span className="bg-gradient-to-r from-[#ffd400] via-[#67dd7a] to-[#00bde7] bg-clip-text text-transparent">
                municipais.
              </span>
            </h1>

            <p className="mt-4 text-base leading-7 text-white/68">
              Consulte os campeonatos cadastrados, modalidades, categorias,
              séries, períodos e situação das inscrições.
            </p>

            <div className="mt-6 space-y-3">
              <Info
                icon={<ShieldCheck size={22} />}
                title="Status"
                text="Veja quais competições estão ativas."
              />
              <Info
                icon={<Users size={22} />}
                title="Categorias"
                text="Confira masculino, feminino e outras divisões."
              />
              <Info
                icon={<Layers size={22} />}
                title="Séries"
                text="Acompanhe Série Ouro, Prata, Bronze e demais formatos."
              />
              <Info
                icon={<CalendarDays size={22} />}
                title="Período"
                text="Veja as datas previstas de cada campeonato."
              />
            </div>
          </aside>

          <section className="rounded-[26px] border border-white/10 bg-black/44 p-5 shadow-xl backdrop-blur-xl md:p-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">
              Lista de campeonatos
            </p>

            <h2 className="mt-2 text-2xl font-black md:text-3xl">
              Competições disponíveis
            </h2>

            <div className="mt-4">
              {campeonatos.length === 0 ? (
                <div className="rounded-[20px] border border-yellow-300/20 bg-yellow-300/10 p-5 text-yellow-50">
                  Nenhum campeonato ativo cadastrado no momento.
                </div>
              ) : (
                <div className="space-y-5">
                  {campeonatos.map((campeonato) => (
                    <article
                      key={campeonato.id}
                      className="rounded-[20px] border border-white/10 bg-white/[0.045] p-5 transition hover:border-emerald-300/35 hover:bg-white/[0.065]"
                    >
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(
                            campeonato.status
                          )}`}
                        >
                          {statusLabel(campeonato.status)}
                        </span>

                        {campeonato.inscricoes_abertas && (
                          <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-100">
                            Inscrições abertas
                          </span>
                        )}

                        {campeonato.modalidade && (
                          <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-bold text-white/75">
                            {campeonato.modalidade}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-4 text-xl font-black uppercase text-white">
                        {campeonato.nome}
                      </h3>

                      {campeonato.descricao && (
                        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-white/62">
                          {campeonato.descricao}
                        </p>
                      )}

                      <div className="mt-4 space-y-3 text-sm text-white/62">
                        <LinhaInfo
                          icon={<CalendarDays size={19} />}
                          title="Período"
                          text={`${formatarData(campeonato.data_inicio)} até ${formatarData(
                            campeonato.data_fim
                          )}`}
                        />

                        <LinhaInfo
                          icon={<Users size={19} />}
                          title="Categorias"
                          text={categoriasTexto(campeonato.categorias_lista)}
                        />

                        <LinhaInfo
                          icon={<Layers size={19} />}
                          title="Séries"
                          text={seriesTexto(
                            campeonato.categorias_lista,
                            campeonato.series_lista
                          )}
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                          href={`/campeonatos/${campeonato.id}`}
                          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#ffd400] via-[#67dd7a] to-[#00bde7] px-3 py-1.5.5 font-black text-black transition hover:scale-[1.02]"
                        >
                          Ver campeonato
                          <ArrowRight size={18} />
                        </Link>

                        {campeonato.inscricoes_abertas && (
                          <Link
                            href={`/inscricoes?campeonato=${campeonato.id}`}
                            className="rounded-2xl border border-white/12 bg-white/[0.06] px-3 py-1.5.5 font-black text-white transition hover:bg-white/[0.1]"
                          >
                            Inscrever equipe
                          </Link>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
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
    <header className="rounded-[18px] border border-white/10 bg-black/42 px-4 py-4 shadow-xl backdrop-blur-xl md:px-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="block">
          <div className="relative h-16 w-[220px] sm:h-20 sm:w-[260px] xl:h-20 xl:w-[270px]">
            <Image
              src="/logo-capao.png"
              alt="Prefeitura de Capão da Canoa"
              fill
              priority
              sizes="(min-width: 1280px) 270px, (min-width: 640px) 260px, 220px"
              className="object-contain object-left"
            />
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-3 py-2.5 font-black text-white transition hover:bg-white/[0.1]"
        >
          <ArrowLeft size={18} />
          Voltar para início
        </Link>
      </div>
    </header>
  );
}

function Info({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4 rounded-[18px] border border-white/10 bg-white/[0.045] p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-300/12 text-emerald-300">
        {icon}
      </div>
      <div>
        <h3 className="font-black">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-white/58">{text}</p>
      </div>
    </div>
  );
}

function LinhaInfo({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-[22px] border border-white/10 bg-white/[0.045] p-4">
      <div className="mt-0.5 text-emerald-300">{icon}</div>
      <div>
        <strong className="text-white">{title}:</strong>{" "}
        <span>{text}</span>
      </div>
    </div>
  );
}
