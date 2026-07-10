import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { exigirAdmin } from "@/lib/adminAuth";
import {
  alterarStatusCampeonato,
  cadastrarCampeonato,
  excluirCampeonato,
} from "./actions";
import { AdminCampeonatoEditButton } from "@/components/admin/campeonatos/AdminCampeonatoEditButton";
import { AdminDeleteSubmitButton } from "@/components/admin/AdminDeleteSubmitButton";

type SearchParams = Promise<{
  sucesso?: string;
  erro?: string;
  detalhe?: string;
}>;

type CategoriaConfig = {
  nome: string;
  ativo?: boolean;
  series_ativas?: boolean;
  series_lista?: string[];
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

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-yellow-300/60 focus:ring-2 focus:ring-yellow-300/10";

const labelClass = "mb-2 block text-sm font-black text-white/75";

const primaryButtonClass =
  "w-full rounded-2xl bg-gradient-to-r from-yellow-300 via-green-400 to-blue-500 px-5 py-4 text-sm font-black text-slate-950 shadow-lg transition hover:scale-[1.01]";

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

function listaTexto(lista: CategoriaConfig[] | string[] | null) {
  if (!lista || lista.length === 0) return "Não informado";
  return lista
    .map((item) => {
      if (typeof item === "string") return item;

      const series = item.series_lista?.length
        ? ` (${item.series_lista.join(", ")})`
        : "";

      return `${item.nome}${series}`;
    })
    .join(", ");
}

export default async function AdminCampeonatosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await exigirAdmin();

  const params = await searchParams;
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from("campeonatos")
    .select(
      "id, nome, modalidade, descricao, status, categorias_ativas, categorias_lista, series_ativas, series_lista, inscricoes_abertas, data_inicio, data_fim, created_at"
    )
    .order("created_at", { ascending: false });

  const campeonatos = (data || []) as Campeonato[];

  return (
    <div className="space-y-6 text-white">

      <section className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur">
          <div className="border-b border-white/10 bg-gradient-to-r from-yellow-300/15 via-green-400/10 to-blue-500/15 p-6 md:p-8">
            <span className="inline-flex rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-yellow-200">
              Gestão de campeonatos
            </span>

            <h1 className="mt-4 max-w-5xl text-4xl font-black tracking-tight text-white md:text-6xl">
              Campeonatos municipais
            </h1>

            <p className="mt-4 max-w-4xl text-sm leading-7 text-white/72 md:text-base">
              Cadastre campeonatos, defina modalidade, categorias, séries,
              período de disputa e situação das inscrições. Essas informações
              serão usadas nas inscrições, jogos, classificação e artilharia.
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
            {params.detalhe && (
              <span className="mt-2 block text-xs font-bold text-red-50/80">
                Detalhe: {params.detalhe}
              </span>
            )}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur">
            <span className="inline-flex rounded-full border border-green-300/25 bg-green-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-green-100">
              Novo campeonato
            </span>

            <h2 className="mt-3 text-2xl font-black text-white">
              Cadastrar campeonato
            </h2>

            <form action={cadastrarCampeonato} className="mt-6 space-y-4">
              <label className="block">
                <span className={labelClass}>Nome do campeonato</span>
                <input
                  name="nome"
                  required
                  placeholder="Ex.: Municipal de Futsal 2026"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className={labelClass}>Modalidade</span>
                <input
                  name="modalidade"
                  placeholder="Ex.: Futsal, Futebol de Campo, Vôlei..."
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className={labelClass}>Status inicial</span>
                <select name="status" className={inputClass} defaultValue="ativo">
                  <option value="ativo">Ativo</option>
                  <option value="pausado">Pausado</option>
                  <option value="encerrado">Encerrado</option>
                </select>
              </label>

              <label className="block">
                <span className={labelClass}>Descrição</span>
                <textarea
                  name="descricao"
                  rows={5}
                  placeholder="Descreva o campeonato, público, formato e observações gerais..."
                  className={inputClass}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Data de início</span>
                  <input name="data_inicio" type="date" className={inputClass} />
                </label>

                <label className="block">
                  <span className={labelClass}>Data de fim</span>
                  <input name="data_fim" type="date" className={inputClass} />
                </label>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="mb-4">
                  <span className="inline-flex rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-yellow-100">
                    Categorias
                  </span>

                  <p className="mt-3 text-sm leading-6 text-white/60">
                    Escolha quais categorias farão parte do campeonato. Cada
                    categoria pode ter suas próprias séries.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                    <label className="flex items-center gap-3 text-sm font-black text-white">
                      <input
                        name="masculino_ativa"
                        type="checkbox"
                        defaultChecked
                        className="h-5 w-5 accent-yellow-300"
                      />
                      Categoria Masculino
                    </label>

                    <label className="mt-4 flex items-center gap-3 text-sm font-bold text-white/75">
                      <input
                        name="masculino_series_ativas"
                        type="checkbox"
                        className="h-5 w-5 accent-yellow-300"
                      />
                      Usar séries no masculino
                    </label>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-3 text-sm font-bold text-white/70">
                        <input
                          name="masculino_serie_ouro"
                          type="checkbox"
                          className="h-4 w-4 accent-yellow-300"
                        />
                        Série Ouro
                      </label>

                      <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-3 text-sm font-bold text-white/70">
                        <input
                          name="masculino_serie_prata"
                          type="checkbox"
                          className="h-4 w-4 accent-yellow-300"
                        />
                        Série Prata
                      </label>

                      <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-3 text-sm font-bold text-white/70">
                        <input
                          name="masculino_serie_bronze"
                          type="checkbox"
                          className="h-4 w-4 accent-yellow-300"
                        />
                        Série Bronze
                      </label>
                    </div>

                    <label className="mt-4 block">
                      <span className={labelClass}>
                        Séries extras do masculino
                      </span>
                      <input
                        name="masculino_series_extras"
                        placeholder="Ex.: Série Master, Série Sub-20"
                        className={inputClass}
                      />
                    </label>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                    <label className="flex items-center gap-3 text-sm font-black text-white">
                      <input
                        name="feminino_ativa"
                        type="checkbox"
                        defaultChecked
                        className="h-5 w-5 accent-yellow-300"
                      />
                      Categoria Feminino
                    </label>

                    <label className="mt-4 flex items-center gap-3 text-sm font-bold text-white/75">
                      <input
                        name="feminino_series_ativas"
                        type="checkbox"
                        className="h-5 w-5 accent-yellow-300"
                      />
                      Usar séries no feminino
                    </label>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-3 text-sm font-bold text-white/70">
                        <input
                          name="feminino_serie_ouro"
                          type="checkbox"
                          className="h-4 w-4 accent-yellow-300"
                        />
                        Série Ouro
                      </label>

                      <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-3 text-sm font-bold text-white/70">
                        <input
                          name="feminino_serie_prata"
                          type="checkbox"
                          className="h-4 w-4 accent-yellow-300"
                        />
                        Série Prata
                      </label>

                      <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-3 text-sm font-bold text-white/70">
                        <input
                          name="feminino_serie_bronze"
                          type="checkbox"
                          className="h-4 w-4 accent-yellow-300"
                        />
                        Série Bronze
                      </label>
                    </div>

                    <label className="mt-4 block">
                      <span className={labelClass}>
                        Séries extras do feminino
                      </span>
                      <input
                        name="feminino_series_extras"
                        placeholder="Ex.: Série Livre, Série Sub-18"
                        className={inputClass}
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className={labelClass}>Categorias extras</span>
                    <input
                      name="categorias_extras"
                      placeholder="Ex.: Veterano, Sub-17, Master"
                      className={inputClass}
                    />
                    <span className="mt-2 block text-xs leading-5 text-white/45">
                      Separe por vírgula. Essas categorias extras entram sem
                      séries inicialmente.
                    </span>
                  </label>
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-3xl border border-blue-300/20 bg-blue-500/10 p-4 text-sm font-black text-blue-50">
                <input
                  name="inscricoes_abertas"
                  type="checkbox"
                  className="h-5 w-5 accent-yellow-300"
                />
                Inscrições abertas
              </label>

              <button type="submit" className={primaryButtonClass}>
                Salvar campeonato
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="inline-flex rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-yellow-100">
                  Cadastrados
                </span>

                <h2 className="mt-3 text-2xl font-black text-white">
                  Campeonatos existentes
                </h2>
              </div>

              <p className="text-sm font-bold text-white/45">
                {campeonatos.length} campeonato(s)
              </p>
            </div>

            {campeonatos.length === 0 ? (
              <div className="rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-sm leading-7 text-yellow-50">
                Nenhum campeonato cadastrado ainda.
              </div>
            ) : (
              <div className="space-y-4">
                {campeonatos.map((campeonato) => (
                  <article
                    key={campeonato.id}
                    className="rounded-3xl border border-white/10 bg-slate-950/65 p-5 shadow-xl"
                  >
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(
                          campeonato.status
                        )}`}
                      >
                        {statusLabel(campeonato.status)}
                      </span>

                      {campeonato.inscricoes_abertas && (
                        <span className="rounded-full border border-blue-300/20 bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-100">
                          Inscrições abertas
                        </span>
                      )}

                      {campeonato.modalidade && (
                        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white/70">
                          {campeonato.modalidade}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-black text-white">
                      {campeonato.nome}
                    </h3>

                    {campeonato.descricao && (
                      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-white/72">
                        {campeonato.descricao}
                      </p>
                    )}

                    <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/65 md:grid-cols-2">
                      <p>
                        <strong className="text-white/85">Início:</strong>{" "}
                        {formatarData(campeonato.data_inicio)}
                      </p>

                      <p>
                        <strong className="text-white/85">Fim:</strong>{" "}
                        {formatarData(campeonato.data_fim)}
                      </p>

                      <p>
                        <strong className="text-white/85">Categorias:</strong>{" "}
                        {campeonato.categorias_ativas
                          ? listaTexto(campeonato.categorias_lista)
                          : "Desativadas"}
                      </p>

                      <p>
                        <strong className="text-white/85">Séries:</strong>{" "}
                        {campeonato.series_ativas
                          ? listaTexto(campeonato.series_lista)
                          : "Desativadas"}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-5">
                      <AdminCampeonatoEditButton campeonato={campeonato} />

                      <form action={alterarStatusCampeonato}>
                        <input type="hidden" name="id" value={campeonato.id} />
                        <input type="hidden" name="status" value="ativo" />
                        <button
                          type="submit"
                          className="w-full rounded-2xl bg-green-300 px-4 py-3 text-xs font-black uppercase tracking-[0.15em] text-slate-950 transition hover:scale-[1.01]"
                        >
                          Ativar
                        </button>
                      </form>

                      <form action={alterarStatusCampeonato}>
                        <input type="hidden" name="id" value={campeonato.id} />
                        <input type="hidden" name="status" value="pausado" />
                        <button
                          type="submit"
                          className="w-full rounded-2xl border border-yellow-300/30 bg-yellow-300/10 px-4 py-3 text-xs font-black uppercase tracking-[0.15em] text-yellow-100 transition hover:bg-yellow-300/20"
                        >
                          Pausar
                        </button>
                      </form>

                      <form action={alterarStatusCampeonato}>
                        <input type="hidden" name="id" value={campeonato.id} />
                        <input type="hidden" name="status" value="encerrado" />
                        <button
                          type="submit"
                          className="w-full rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.15em] text-red-100 transition hover:bg-red-500/20"
                        >
                          Encerrar
                        </button>
                      </form>

                      <form action={excluirCampeonato}>
                        <input type="hidden" name="id" value={campeonato.id} />

                        <AdminDeleteSubmitButton
                          label="Excluir"
                          confirmMessage={`Excluir definitivamente o campeonato "${campeonato.nome}"? Jogos, inscrições, equipes, atletas, gols e regras municipais vinculados serão removidos. Punições e denúncias serão preservadas como histórico, mas sem vínculo direto com o campeonato.`}
                        />
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
