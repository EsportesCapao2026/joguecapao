import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldAlert, Trophy, ArrowRight } from "lucide-react";
import { supabasePublic } from "@/lib/supabasePublic";
import { InscricaoEquipeForm } from "@/components/inscricoes/InscricaoEquipeForm";

type SearchParams = Promise<{
  campeonato?: string;
  sucesso?: string;
  alerta?: string;
  erro?: string;
  detalhe?: string;
  faltando?: string;
}>;

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
  inscricoes_abertas: boolean | null;
  categorias_lista: CategoriaConfig[] | string[] | null;
};

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

export default async function InscricoesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const campeonatoId = params.campeonato;

  let campeonato: Campeonato | null = null;
  let campeonatosDisponiveis: Campeonato[] = [];

  if (campeonatoId) {
    const { data } = await supabasePublic
      .from("campeonatos")
      .select(
        "id, nome, modalidade, descricao, status, inscricoes_abertas, categorias_lista"
      )
      .eq("id", campeonatoId)
      .single();

    campeonato = data as Campeonato | null;
  } else {
    const { data } = await supabasePublic
      .from("campeonatos")
      .select(
        "id, nome, modalidade, descricao, status, inscricoes_abertas, categorias_lista"
      )
      .eq("inscricoes_abertas", true)
      .neq("status", "encerrado")
      .order("created_at", { ascending: false });

    campeonatosDisponiveis = (data || []) as Campeonato[];
  }

  const categorias = normalizarCategorias(campeonato?.categorias_lista || null);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[url('/bg-estadio.jpg')] bg-cover bg-center opacity-75" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/45 to-slate-950/78" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/35 via-slate-950/10 to-blue-950/25" />

      <section className="relative z-10 mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <Link
          href={campeonato ? `/campeonatos/${campeonato.id}` : "/"}
          className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/[0.13]"
        >
          <ArrowLeft size={18} />
          Voltar
        </Link>

        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur">
          <div className="border-b border-white/10 bg-gradient-to-r from-yellow-300/15 via-green-400/10 to-blue-500/15 p-6 md:p-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-yellow-200">
              <Trophy size={14} />
              Inscrição de equipe
            </span>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-6xl">
              Inscrever equipe
            </h1>

            {campeonato ? (
              <p className="mt-4 text-sm leading-7 text-white/72 md:text-base">
                Campeonato selecionado:{" "}
                <strong className="text-yellow-100">{campeonato.nome}</strong>
                {campeonato.modalidade ? ` — ${campeonato.modalidade}` : ""}
              </p>
            ) : (
              <p className="mt-4 text-sm leading-7 text-white/72 md:text-base">
                Escolha abaixo em qual campeonato deseja inscrever a equipe.
              </p>
            )}
          </div>

          <div className="p-6 md:p-8">
            {!campeonato ? (
              <div>
                {campeonatosDisponiveis.length === 0 ? (
                  <div className="rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-sm leading-7 text-yellow-50">
                    Nenhum campeonato com inscrições abertas no momento.
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {campeonatosDisponiveis.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-3xl border border-white/10 bg-slate-950/60 p-5"
                      >
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-green-300 px-3 py-1 text-xs font-black text-slate-950">
                            Inscrições abertas
                          </span>

                          {item.modalidade && (
                            <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-bold text-white/75">
                              {item.modalidade}
                            </span>
                          )}
                        </div>

                        <h2 className="text-2xl font-black text-white">
                          {item.nome}
                        </h2>

                        {item.descricao && (
                          <p className="mt-3 text-sm leading-7 text-white/65">
                            {item.descricao}
                          </p>
                        )}

                        <Link
                          href={`/inscricoes?campeonato=${item.id}`}
                          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-green-400 to-blue-500 px-5 py-4 text-sm font-black text-slate-950 shadow-lg transition hover:scale-[1.01]"
                        >
                          Inscrever neste campeonato
                          <ArrowRight size={18} />
                        </Link>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ) : !campeonato.inscricoes_abertas ? (
              <div className="rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-sm leading-7 text-yellow-50">
                As inscrições para este campeonato não estão abertas no momento.
              </div>
            ) : (
              <>
                {params.sucesso && (
                  <div className="mb-6 flex gap-3 rounded-3xl border border-green-300/25 bg-green-400/10 p-5 text-green-50">
                    <CheckCircle2 className="mt-0.5 shrink-0" size={22} />
                    <div>
                      <strong className="block font-black">
                        Inscrição enviada com sucesso.
                      </strong>
                      <p className="mt-1 text-sm leading-6 text-green-50/80">
                        A inscrição ficou pendente e será analisada pela organização.
                      </p>

                      {params.alerta === "punicao" && (
                        <p className="mt-3 rounded-2xl border border-yellow-300/25 bg-yellow-300/10 p-3 text-sm font-bold leading-6 text-yellow-50">
                          Atenção: o sistema encontrou um possível atleta com restrição.
                          A inscrição foi enviada normalmente, mas a organização fará a conferência antes da aprovação.
                        </p>
                      )}

                      {params.detalhe && (
                        <p className="mt-3 rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-xs leading-5 text-red-50/85">
                          Detalhe técnico: {params.detalhe}
                        </p>
                      )}

                      {params.faltando && (
                        <p className="mt-3 rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-xs leading-5 text-red-50/85">
                          Campos faltando: {params.faltando}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {params.erro && (
                  <div className="mb-6 flex gap-3 rounded-3xl border border-red-300/25 bg-red-400/10 p-5 text-red-50">
                    <ShieldAlert className="mt-0.5 shrink-0" size={22} />
                    <div>
                      <strong className="block font-black">
                        Não foi possível enviar a inscrição.
                      </strong>
                      <p className="mt-1 text-sm leading-6 text-red-50/80">
                        {params.faltando
                          ? `Faltou preencher: ${params.faltando}`
                          : "Confira os campos obrigatórios e tente novamente."}
                      </p>

                      {params.detalhe && (
                        <p className="mt-3 rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-xs leading-5 text-red-50/85">
                          Detalhe técnico: {params.detalhe}
                        </p>
                      )}

                      {params.faltando && (
                        <p className="mt-3 rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-xs leading-5 text-red-50/85">
                          Campos faltando: {params.faltando}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <InscricaoEquipeForm campeonatoId={campeonato.id} categorias={categorias} />
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
