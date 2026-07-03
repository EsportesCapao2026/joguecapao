import Link from "next/link";
import { CalendarDays, Layers, Trophy, Users, ArrowRight } from "lucide-react";
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
  if (status === "ativo") return "bg-green-300 text-slate-950";
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
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 -z-10 bg-[url('/bg-estadio.jpg')] bg-cover bg-center opacity-75" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-slate-950/35 via-slate-950/72 to-slate-950/95" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-r from-slate-950/60 via-slate-950/20 to-blue-950/45" />

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur">
          <div className="border-b border-white/10 bg-gradient-to-r from-yellow-300/15 via-green-400/10 to-blue-500/15 p-6 md:p-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-yellow-200">
              <Trophy size={14} />
              Competições
            </span>

            <h1 className="mt-4 max-w-5xl text-4xl font-black tracking-tight text-white md:text-6xl">
              Campeonatos municipais
            </h1>

            <p className="mt-4 max-w-4xl text-sm leading-7 text-white/72 md:text-base">
              Consulte os campeonatos cadastrados, modalidades, categorias,
              séries e situação das inscrições.
            </p>
          </div>
        </div>

        {campeonatos.length === 0 ? (
          <div className="rounded-[2rem] border border-yellow-300/20 bg-yellow-300/10 p-6 text-yellow-50 shadow-2xl backdrop-blur">
            Nenhum campeonato ativo cadastrado no momento.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {campeonatos.map((campeonato) => (
              <article
                key={campeonato.id}
                className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur transition hover:-translate-y-1 hover:border-yellow-300/35"
              >
                <div className="mb-4 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(
                      campeonato.status
                    )}`}
                  >
                    {statusLabel(campeonato.status)}
                  </span>

                  {campeonato.inscricoes_abertas && (
                    <span className="rounded-full border border-blue-300/25 bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-100">
                      Inscrições abertas
                    </span>
                  )}

                  {campeonato.modalidade && (
                    <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-bold text-white/75">
                      {campeonato.modalidade}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-black text-white md:text-3xl">
                  {campeonato.nome}
                </h2>

                {campeonato.descricao && (
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-white/70">
                    {campeonato.descricao}
                  </p>
                )}

                <div className="mt-5 grid gap-3 text-sm text-white/68">
                  <div className="flex gap-3 rounded-2xl border border-white/10 bg-black/25 p-4">
                    <CalendarDays className="mt-0.5 shrink-0 text-yellow-200" size={18} />
                    <div>
                      <strong className="text-white">Período:</strong>{" "}
                      {formatarData(campeonato.data_inicio)} até{" "}
                      {formatarData(campeonato.data_fim)}
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-2xl border border-white/10 bg-black/25 p-4">
                    <Users className="mt-0.5 shrink-0 text-green-200" size={18} />
                    <div>
                      <strong className="text-white">Categorias:</strong>{" "}
                      {categoriasTexto(campeonato.categorias_lista)}
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-2xl border border-white/10 bg-black/25 p-4">
                    <Layers className="mt-0.5 shrink-0 text-blue-200" size={18} />
                    <div>
                      <strong className="text-white">Séries:</strong>{" "}
                      {seriesTexto(
                        campeonato.categorias_lista,
                        campeonato.series_lista
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 md:flex-row">
                  <Link
                    href={`/campeonatos/${campeonato.id}`}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-green-400 to-blue-500 px-5 py-4 text-sm font-black text-slate-950 shadow-lg transition hover:scale-[1.01]"
                  >
                    Ver campeonato
                    <ArrowRight size={18} />
                  </Link>

                  {campeonato.inscricoes_abertas && (
                    <Link
                      href={`/inscricoes?campeonato=${campeonato.id}`}
                      className="inline-flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] px-5 py-4 text-sm font-black text-white transition hover:bg-white/[0.13]"
                    >
                      Inscrever equipe
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
