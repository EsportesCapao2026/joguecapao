import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
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
  categorias_lista: CategoriaConfig[] | string[] | null;
  series_lista: string[] | null;
  inscricoes_abertas: boolean | null;
  data_inicio: string | null;
  data_fim: string | null;
};

type EquipeAprovada = {
  id: string;
  nome_equipe: string | null;
  cidade: string | null;
  categoria: string | null;
  serie: string | null;
  nome_tecnico: string | null;
  logo_url: string | null;
  created_at: string | null;
};

type PageParams = Promise<{
  id: string;
}>;

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

function normalizarCategorias(categorias: Campeonato["categorias_lista"]) {
  if (!categorias || categorias.length === 0) return [];

  return categorias.map((categoria) => {
    if (typeof categoria === "string") {
      return {
        nome: categoria,
        ativo: true,
        series_ativas: false,
        series_lista: [],
      };
    }

    return {
      nome: categoria.nome,
      ativo: categoria.ativo,
      series_ativas: categoria.series_ativas,
      series_lista: categoria.series_lista || [],
    };
  });
}

export default async function CampeonatoDetalhePage({
  params,
}: {
  params: PageParams;
}) {
  const { id } = await params;

  const { data, error } = await supabasePublic
    .from("campeonatos")
    .select(
      "id, nome, modalidade, descricao, status, categorias_lista, series_lista, inscricoes_abertas, data_inicio, data_fim"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const campeonato = data as Campeonato;
  const categorias = normalizarCategorias(campeonato.categorias_lista);

  const { data: equipesData } = await supabasePublic
    .from("inscricoes")
    .select(
      "id, nome_equipe, cidade, categoria, serie, nome_tecnico, logo_url, created_at"
    )
    .eq("campeonato_id", campeonato.id)
    .eq("status", "aprovada")
    .order("created_at", { ascending: true });

  const equipesAprovadas = (equipesData || []) as EquipeAprovada[];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 -z-10 bg-[url('/bg-estadio.jpg')] bg-cover bg-center opacity-75" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-slate-950/35 via-slate-950/72 to-slate-950/95" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-r from-slate-950/60 via-slate-950/20 to-blue-950/45" />

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <Link
          href="/campeonatos"
          className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/[0.13]"
        >
          <ArrowLeft size={18} />
          Voltar para campeonatos
        </Link>

        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur">
          <div className="border-b border-white/10 bg-gradient-to-r from-yellow-300/15 via-green-400/10 to-blue-500/15 p-6 md:p-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-yellow-200">
              <Trophy size={14} />
              Campeonato
            </span>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(campeonato.status)}`}>
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

            <h1 className="mt-4 max-w-5xl text-4xl font-black tracking-tight text-white md:text-6xl">
              {campeonato.nome}
            </h1>

            {campeonato.descricao && (
              <p className="mt-4 max-w-4xl whitespace-pre-line text-sm leading-7 text-white/72 md:text-base">
                {campeonato.descricao}
              </p>
            )}
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-3 md:p-8">
            <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
              <CalendarDays className="mb-3 text-yellow-200" size={26} />
              <h2 className="text-lg font-black">Período</h2>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Início: {formatarData(campeonato.data_inicio)}
                <br />
                Fim: {formatarData(campeonato.data_fim)}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
              <Users className="mb-3 text-green-200" size={26} />
              <h2 className="text-lg font-black">Categorias</h2>
              <p className="mt-2 text-sm leading-6 text-white/65">
                {categorias.length > 0
                  ? categorias.map((categoria) => categoria.nome).join(", ")
                  : "Não informadas"}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
              <Layers className="mb-3 text-blue-200" size={26} />
              <h2 className="text-lg font-black">Séries</h2>
              <p className="mt-2 text-sm leading-6 text-white/65">
                {categorias.some((categoria) => categoria.series_ativas)
                  ? "Configuradas por categoria"
                  : "Sem divisão por séries"}
              </p>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur md:p-8">
            <span className="inline-flex rounded-full border border-green-300/25 bg-green-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-green-100">
              Configuração
            </span>

            <h2 className="mt-3 text-2xl font-black">
              Categorias e séries do campeonato
            </h2>

            <div className="mt-6 space-y-4">
              {categorias.length === 0 ? (
                <div className="rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-sm text-yellow-50">
                  Nenhuma categoria configurada para este campeonato.
                </div>
              ) : (
                categorias.map((categoria) => (
                  <div
                    key={categoria.nome}
                    className="rounded-3xl border border-white/10 bg-slate-950/60 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-xl font-black">{categoria.nome}</h3>

                      <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-black text-white/70">
                        {categoria.series_ativas ? "Com séries" : "Sem séries"}
                      </span>
                    </div>

                    {categoria.series_ativas && categoria.series_lista.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {categoria.series_lista.map((serie) => (
                          <span
                            key={serie}
                            className="rounded-full border border-blue-300/25 bg-blue-500/10 px-3 py-2 text-xs font-black text-blue-100"
                          >
                            {serie}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-white/55">
                        Esta categoria não possui divisão por série.
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur md:p-8">
            <ShieldCheck className="mb-4 text-yellow-200" size={32} />

            <h2 className="text-2xl font-black">Área do campeonato</h2>

            <p className="mt-3 text-sm leading-7 text-white/65">
              Esta é a área oficial do campeonato. Aqui o público poderá
              acompanhar jogos, classificação, artilharia, inscrições, regras
              e informações importantes.
            </p>

            <div className="mt-6 grid gap-3">
              {campeonato.inscricoes_abertas && (
                <Link
                  href={`/inscricoes?campeonato=${campeonato.id}`}
                  className="rounded-2xl bg-gradient-to-r from-yellow-300 via-green-400 to-blue-500 px-5 py-4 text-center text-sm font-black text-slate-950 shadow-lg transition hover:scale-[1.01]"
                >
                  Inscrever equipe
                </Link>
              )}

              <Link
                href="/regras"
                className="rounded-2xl border border-white/10 bg-white/[0.08] px-5 py-4 text-center text-sm font-black text-white transition hover:bg-white/[0.13]"
              >
                Ver regras
              </Link>
            </div>
          </aside>

        <section className="mt-8 grid gap-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur md:p-8">
            <span className="inline-flex rounded-full border border-blue-300/25 bg-blue-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-blue-100">
              Acompanhamento
            </span>

            <h2 className="mt-3 text-2xl font-black">
              Jogos, classificação e artilharia
            </h2>

            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/65">
              Quando os jogos forem cadastrados pela organização, esta área
              será usada para exibir tabela de jogos, resultados, classificação,
              artilharia e informações do andamento do campeonato.
            </p>

            <div className="mt-6 grid gap-5 lg:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                <h3 className="text-xl font-black text-white">Jogos</h3>

                <div className="mt-4 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4 text-sm leading-6 text-yellow-50">
                  Nenhum jogo cadastrado ainda.
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                <h3 className="text-xl font-black text-white">Classificação</h3>

                <div className="mt-4 rounded-2xl border border-green-300/20 bg-green-400/10 p-4 text-sm leading-6 text-green-50">
                  A classificação será gerada após o cadastro dos jogos e
                  resultados.
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                <h3 className="text-xl font-black text-white">Artilharia</h3>

                <div className="mt-4 rounded-2xl border border-blue-300/20 bg-blue-500/10 p-4 text-sm leading-6 text-blue-50">
                  A artilharia será exibida quando os gols dos atletas forem
                  lançados.
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur md:p-8">
            <span className="inline-flex rounded-full border border-green-300/25 bg-green-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-green-100">
              PARTICIPANTES
            </span>

            <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-black uppercase">
                  EQUIPES INSCRITAS
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/60">
                  Equipes aprovadas pela organização para este campeonato.
                </p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-black text-white/70">
                {equipesAprovadas.length} equipe(s)
              </span>
            </div>

            {equipesAprovadas.length === 0 ? (
              <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/60 p-5 text-sm leading-7 text-white/65">
                Nenhuma equipe aprovada neste campeonato ainda.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {equipesAprovadas.map((equipe) => (
                  <article
                    key={equipe.id}
                    className="rounded-3xl border border-white/10 bg-slate-950/55 p-5"
                  >
                    <div className="flex gap-4">
                      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-black/25">
                        {equipe.logo_url ? (
                          <img
                            src={equipe.logo_url}
                            alt={`Logo da equipe ${equipe.nome_equipe || "inscrita"}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-black text-white/45">
                            {(equipe.nome_equipe || "?").slice(0, 1)}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-xl font-black uppercase text-white">
                          {equipe.nome_equipe || "Equipe sem nome"}
                        </h3>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {equipe.categoria && (
                            <span className="rounded-full border border-green-300/20 bg-green-400/10 px-3 py-1 text-xs font-black text-green-100">
                              {equipe.categoria}
                            </span>
                          )}

                          {equipe.serie && (
                            <span className="rounded-full border border-blue-300/20 bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-100">
                              {equipe.serie}
                            </span>
                          )}
                        </div>

                        <p className="mt-3 text-sm leading-6 text-white/62">
                          Cidade: {equipe.cidade || "Não informada"}
                          <br />
                          Técnico: {equipe.nome_tecnico || "Não informado"}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
        </section>
      </section>
    </main>
  );
}
