import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  alterarStatusCbjd,
  cadastrarRegraMunicipal,
  desativarRegraMunicipal,
} from "./actions";

type SearchParams = Promise<{
  sucesso?: string;
  erro?: string;
}>;

type RegraMunicipal = {
  id: string;
  campeonato_nome: string | null;
  titulo: string;
  descricao: string;
  artigo_referencia: string | null;
  origem: string | null;
  ativo: boolean | null;
  created_at: string | null;
};

function origemLabel(origem: string | null) {
  if (origem === "regulamento_municipal") return "Regulamento municipal";
  if (origem === "cbjd") return "CBJD";
  if (origem === "decisao_administrativa") return "Decisão administrativa";
  if (origem === "outro_documento") return "Outro documento";
  return "Regra";
}

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-yellow-300/60 focus:ring-2 focus:ring-yellow-300/10";

const labelClass = "mb-2 block text-sm font-black text-white/75";

const primaryButtonClass =
  "w-full rounded-2xl bg-gradient-to-r from-yellow-300 via-green-400 to-blue-500 px-5 py-4 text-sm font-black text-slate-950 shadow-lg transition hover:scale-[1.01]";

export default async function AdminRegrasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = getSupabaseAdmin();

  const { data: configData } = await supabase
    .from("configuracoes")
    .select("valor")
    .eq("chave", "cbjd_config")
    .maybeSingle();

  const cbjdAtivo = Boolean(configData?.valor?.ativo ?? true);

  const { data: regrasData } = await supabase
    .from("regras_campeonatos")
    .select(
      "id, campeonato_nome, titulo, descricao, artigo_referencia, origem, ativo, created_at"
    )
    .eq("ativo", true)
    .order("created_at", { ascending: false });

  const regras = (regrasData || []) as RegraMunicipal[];

  return (
    <div className="space-y-6 text-white">

      <section className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur">
          <div className="border-b border-white/10 bg-gradient-to-r from-yellow-300/15 via-green-400/10 to-blue-500/15 p-6 md:p-8">
            <span className="inline-flex rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-yellow-200">
              Gestão de regras
            </span>

            <h1 className="mt-4 max-w-5xl text-4xl font-black tracking-tight text-white md:text-6xl">
              Regras, regulamentos e CBJD
            </h1>

            <p className="mt-4 max-w-4xl text-sm leading-7 text-white/72 md:text-base">
              Cadastre regras próprias dos campeonatos municipais e controle o
              uso do CBJD como regra subsidiária. O regulamento próprio
              prevalece; o CBJD entra como apoio nos casos omissos.
            </p>
          </div>
        </div>

        {params.sucesso && (
          <div className="rounded-3xl border border-green-300/25 bg-green-400/10 p-4 text-sm font-black text-green-100 backdrop-blur">
            Alteração salva com sucesso.
          </div>
        )}

        {params.erro && (
          <div className="rounded-3xl border border-red-300/25 bg-red-400/10 p-4 text-sm font-black text-red-100 backdrop-blur">
            Não foi possível concluir a ação. Confira os campos e tente novamente.
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full border border-blue-300/25 bg-blue-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                  Base complementar
                </span>

                <h2 className="mt-3 text-2xl font-black text-white">
                  CBJD como regra subsidiária
                </h2>
              </div>

              <span
                className={`rounded-full px-4 py-2 text-sm font-black shadow-lg ${
                  cbjdAtivo
                    ? "bg-green-300 text-slate-950"
                    : "border border-red-300/30 bg-red-500/10 text-red-100"
                }`}
              >
                {cbjdAtivo ? "Ativado" : "Desativado"}
              </span>
            </div>

            <p className="text-sm leading-7 text-white/68">
              Quando estiver ativado, o CBJD poderá ser usado como base
              complementar nos casos em que o regulamento municipal não tiver
              regra específica.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <form action={alterarStatusCbjd}>
                <input type="hidden" name="ativo" value="true" />
                <button type="submit" className={primaryButtonClass}>
                  Ativar CBJD
                </button>
              </form>

              <form action={alterarStatusCbjd}>
                <input type="hidden" name="ativo" value="false" />
                <button
                  type="submit"
                  className="w-full rounded-2xl border border-red-300/30 bg-red-500/10 px-5 py-4 text-sm font-black text-red-100 transition hover:bg-red-500/20"
                >
                  Desativar CBJD
                </button>
              </form>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur">
            <span className="inline-flex rounded-full border border-green-300/25 bg-green-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-green-100">
              Regulamento próprio
            </span>

            <h2 className="mt-3 text-2xl font-black text-white">
              Cadastrar nova regra municipal
            </h2>

            <form action={cadastrarRegraMunicipal} className="mt-6 space-y-4">
              <label className="block">
                <span className={labelClass}>Campeonato</span>
                <input
                  name="campeonato_nome"
                  placeholder="Ex.: Municipal de Futsal"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className={labelClass}>Origem da regra</span>
                <select name="origem" className={inputClass}>
                  <option value="regulamento_municipal">
                    Regulamento municipal
                  </option>
                  <option value="decisao_administrativa">
                    Decisão administrativa
                  </option>
                  <option value="cbjd">CBJD aplicado ao caso</option>
                  <option value="outro_documento">Outro documento</option>
                </select>
              </label>

              <label className="block">
                <span className={labelClass}>Título da regra</span>
                <input
                  name="titulo"
                  required
                  placeholder="Ex.: Critério de inscrição de atletas"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className={labelClass}>Referência</span>
                <input
                  name="artigo_referencia"
                  placeholder="Ex.: Art. 5º do regulamento municipal"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className={labelClass}>Descrição completa da regra</span>
                <textarea
                  name="descricao"
                  required
                  rows={8}
                  placeholder="Digite aqui a regra completa, com artigos, incisos, parágrafos e observações necessárias..."
                  className={inputClass}
                />
              </label>

              <button type="submit" className={primaryButtonClass}>
                Salvar regra municipal
              </button>
            </form>
          </section>
        </div>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-yellow-100">
                Regras ativas
              </span>

              <h2 className="mt-3 text-2xl font-black text-white">
                Regras municipais cadastradas
              </h2>
            </div>

            <p className="text-sm font-bold text-white/45">
              {regras.length} regra(s) ativa(s)
            </p>
          </div>

          {regras.length === 0 ? (
            <div className="rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-sm leading-7 text-yellow-50">
              Nenhuma regra municipal cadastrada ainda.
            </div>
          ) : (
            <div className="space-y-4">
              {regras.map((regra) => (
                <article
                  key={regra.id}
                  className="rounded-3xl border border-white/10 bg-slate-950/65 p-5 shadow-xl"
                >
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-green-300 px-3 py-1 text-xs font-black text-slate-950">
                      {origemLabel(regra.origem)}
                    </span>

                    {regra.campeonato_nome && (
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white/70">
                        {regra.campeonato_nome}
                      </span>
                    )}

                    {regra.artigo_referencia && (
                      <span className="rounded-full border border-blue-300/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-100">
                        {regra.artigo_referencia}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-white">
                    {regra.titulo}
                  </h3>

                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-white/72">
                    {regra.descricao}
                  </p>

                  <form action={desativarRegraMunicipal} className="mt-4">
                    <input type="hidden" name="id" value={regra.id} />

                    <button
                      type="submit"
                      className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-red-100 transition hover:bg-red-500/20"
                    >
                      Desativar regra
                    </button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
