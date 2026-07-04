import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { exigirAdmin } from "@/lib/adminAuth";
import { AdminPunicaoForm } from "@/components/admin/punicoes/AdminPunicaoForm";
import { AdminPunicaoActions } from "@/components/admin/punicoes/AdminPunicaoActions";
import {
  AdminAtletaFichaButton,
  type AtletaFicha,
} from "@/components/admin/punicoes/AdminAtletaFichaButton";
import { removerPunicao } from "./actions";
import { Trash2, CalendarDays, AlertTriangle } from "lucide-react";
import {
  documentosNormalizadosAtleta,
  formatarDocumentoAtleta,
  normalizarNomeAtleta,
} from "@/lib/restricoesAtletas";

type SearchParams = Promise<{
  sucesso?: string;
  erro?: string;
  detalhe?: string;
}>;

type Campeonato = {
  id: string;
  nome: string;
  modalidade: string | null;
};

type Equipe = {
  id: string;
  campeonato_id: string | null;
  nome: string;
  categoria_nome: string | null;
  serie_nome: string | null;
};

type Atleta = {
  id: string;
  equipe_id: string | null;
  nome: string;
  numero_camisa: string | null;
};

type Punicao = {
  id: string;
  campeonato_id: string | null;
  equipe_id: string | null;
  atleta_id: string | null;
  equipe_nome: string | null;
  atleta_nome: string | null;
  categoria_nome: string | null;
  serie_nome: string | null;
  motivo: string | null;
  artigo_cbjd: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  jogos_suspensao: number | null;
  status: string | null;
  origem: string | null;
  created_at: string | null;
};

type InscricaoContato = {
  id: string;
  campeonato_id?: string | null;
  categoria?: string | null;
  serie?: string | null;
  nome_equipe: string | null;
  nome_time: string | null;
  responsavel_nome: string | null;
  responsavel_telefone: string | null;
  status?: string | null;
  created_at?: string | null;
};

type InscricaoJogadorFicha = {
  id: string;
  inscricao_id: string | null;
  nome: string | null;
  documento_tipo: string | null;
  documento_numero: string | null;
  documento_arquivo_url: string | null;
  numero_camisa: string | null;
  status: string | null;
  created_at: string | null;
};

function formatarData(data: string | null) {
  if (!data) return "N/A";
  const partes = data.split("-");
  if (partes.length !== 3) return data;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function normalizarTexto(valor: string | null | undefined) {
  return (valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function dataRegistro(valor: string | null | undefined) {
  if (!valor) return 0;
  const data = new Date(valor).getTime();
  return Number.isNaN(data) ? 0 : data;
}

export default async function AdminPunicoesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await exigirAdmin();

  const params = await searchParams;
  const supabase = getSupabaseAdmin();

  // Buscar campeonatos ativos
  const { data: campeonatosData } = await supabase
    .from("campeonatos")
    .select("id, nome, modalidade")
    .neq("status", "encerrado")
    .order("created_at", { ascending: false });

  const campeonatos = (campeonatosData || []) as Campeonato[];

  // Buscar equipes aprovadas
  const { data: equipesData } = await supabase
    .from("equipes")
    .select("id, campeonato_id, nome, categoria_nome, serie_nome")
    .order("nome", { ascending: true });

  const equipes = (equipesData || []) as Equipe[];

  // Buscar atletas ativos
  const { data: atletasData } = await supabase
    .from("atletas")
    .select("id, equipe_id, nome, numero_camisa")
    .order("nome", { ascending: true });

  const atletas = (atletasData || []) as Atleta[];

  // Buscar punições cadastradas
  const { data: punicoesData } = await supabase
    .from("punicoes")
    .select("*")
    .order("created_at", { ascending: false });

  const punicoes = (punicoesData || []) as Punicao[];

  const { data: contatosData } = await supabase
    .from("inscricoes")
    .select(
      "id, campeonato_id, categoria, serie, nome_equipe, nome_time, responsavel_nome, responsavel_telefone, status, created_at"
    );

  const contatos = (contatosData || []) as InscricaoContato[];

  const { data: jogadoresFichaData } = await supabase
    .from("inscricao_jogadores")
    .select("*")
    .order("created_at", { ascending: false });

  const jogadoresFicha = (jogadoresFichaData || []) as InscricaoJogadorFicha[];

  const campeonatoFichaIds = Array.from(
    new Set(contatos.map((contato) => contato.campeonato_id).filter(Boolean))
  ) as string[];

  const { data: campeonatosFichaData } =
    campeonatoFichaIds.length > 0
      ? await supabase
          .from("campeonatos")
          .select("id, nome, modalidade")
          .in("id", campeonatoFichaIds)
      : { data: [] };

  const campeonatosFicha = (campeonatosFichaData || []) as Campeonato[];

  const campeonatoPorId = new Map(
    [...campeonatosFicha, ...campeonatos].map((c) => [c.id, c])
  );

  const contatoPorEquipeId = new Map(contatos.map((contato) => [contato.id, contato]));
  const contatoPorNomeEquipe = new Map<string, InscricaoContato>();
  const jogadorPorId = new Map(jogadoresFicha.map((jogador) => [jogador.id, jogador]));

  contatos.forEach((contato) => {
    const nomes = [contato.nome_equipe, contato.nome_time];
    nomes.forEach((nome) => {
      const chave = normalizarTexto(nome);
      if (chave) contatoPorNomeEquipe.set(chave, contato);
    });
  });

  async function obterDocumentoAssinado(caminho: string | null) {
    if (!caminho) return null;
    if (caminho.startsWith("http://") || caminho.startsWith("https://")) {
      return caminho;
    }

    const { data } = await supabase.storage
      .from("documentos-atletas")
      .createSignedUrl(caminho, 60 * 60);

    return data?.signedUrl || null;
  }

  const fichasPorPunicao = new Map<string, AtletaFicha>();

  for (const punicao of punicoes) {
    const base = punicao.atleta_id ? jogadorPorId.get(punicao.atleta_id) : null;
    const nomeBase = normalizarNomeAtleta(base?.nome || punicao.atleta_nome);
    const documentosBase = base ? documentosNormalizadosAtleta(base) : new Set<string>();

    const registros = jogadoresFicha
      .filter((jogador) => {
        if (punicao.atleta_id && jogador.id === punicao.atleta_id) return true;

        const mesmoNome =
          nomeBase && normalizarNomeAtleta(jogador.nome) === nomeBase;
        const documentosJogador = documentosNormalizadosAtleta(jogador);
        const mesmoDocumento =
          documentosBase.size > 0 &&
          Array.from(documentosJogador).some((documento) =>
            documentosBase.has(documento)
          );

        return Boolean(mesmoNome || mesmoDocumento);
      })
      .sort((a, b) => dataRegistro(b.created_at) - dataRegistro(a.created_at));

    const ultimoRegistro = registros[0] || base || null;
    const ultimaInscricao = ultimoRegistro?.inscricao_id
      ? contatoPorEquipeId.get(ultimoRegistro.inscricao_id)
      : null;
    const ultimoCampeonato = ultimaInscricao?.campeonato_id
      ? campeonatoPorId.get(ultimaInscricao.campeonato_id)
      : null;

    const historico = registros.map((registro) => {
      const inscricao = registro.inscricao_id
        ? contatoPorEquipeId.get(registro.inscricao_id)
        : null;
      const campeonato = inscricao?.campeonato_id
        ? campeonatoPorId.get(inscricao.campeonato_id)
        : null;

      return {
        id: registro.id,
        time:
          inscricao?.nome_equipe ||
          inscricao?.nome_time ||
          punicao.equipe_nome ||
          "Equipe nao informada",
        campeonato: campeonato?.nome || "Campeonato nao informado",
        categoria: inscricao?.categoria || null,
        serie: inscricao?.serie || null,
        numeroCamisa: registro.numero_camisa,
        status: registro.status,
        dataInscricao: registro.created_at || inscricao?.created_at || null,
      };
    });

    const ficha: AtletaFicha = {
      punicaoId: punicao.id,
      nome: ultimoRegistro?.nome || punicao.atleta_nome || "Atleta nao informado",
      documentos: ultimoRegistro
        ? formatarDocumentoAtleta(ultimoRegistro)
        : "Documentos nao encontrados",
      numeroCamisa: ultimoRegistro?.numero_camisa || null,
      status: ultimoRegistro?.status || null,
      ultimoTime:
        ultimaInscricao?.nome_equipe ||
        ultimaInscricao?.nome_time ||
        punicao.equipe_nome ||
        "Equipe nao informada",
      ultimoCampeonato:
        ultimoCampeonato?.nome ||
        (punicao.campeonato_id
          ? campeonatoPorId.get(punicao.campeonato_id)?.nome
          : null) ||
        "Campeonato nao informado",
      ultimaCategoria: ultimaInscricao?.categoria || punicao.categoria_nome,
      ultimaSerie: ultimaInscricao?.serie || punicao.serie_nome,
      ultimaInscricaoEm: ultimoRegistro?.created_at || ultimaInscricao?.created_at || null,
      ultimoDocumentoUrl: await obterDocumentoAssinado(
        ultimoRegistro?.documento_arquivo_url || null
      ),
      historico,
    };

    fichasPorPunicao.set(punicao.id, ficha);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur">
        <div className="border-b border-white/10 bg-gradient-to-r from-yellow-300/15 via-green-400/10 to-blue-500/15 p-6 md:p-8">
          <span className="inline-flex rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-yellow-200">
            PUNIÇÕES
          </span>

          <h1 className="mt-4 text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
            Punições e Suspensões
          </h1>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/72 md:text-base">
            Registre e gerencie punições, suspensões por cartões ou decisões disciplinares relativas aos campeonatos municipais.
          </p>
        </div>
      </div>

      {params.sucesso && (
        <div className="rounded-3xl border border-green-300/25 bg-green-400/10 p-4 text-sm font-black text-green-100 backdrop-blur">
          {params.sucesso === "cadastrada" && "Punição cadastrada com sucesso!"}
          {params.sucesso === "removida" && "Punição removida com sucesso!"}
          {params.sucesso === "observacao" && "Observação adicionada à punição com sucesso!"}
        </div>
      )}

      {params.erro && (
        <div className="rounded-3xl border border-red-300/25 bg-red-400/10 p-4 text-sm font-black text-red-100 backdrop-blur">
          Erro ao realizar ação. Tente novamente.
          {params.detalhe && (
            <span className="mt-2 block text-xs font-bold text-red-50/80">
              Detalhe: {params.detalhe}
            </span>
          )}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur">
          <span className="inline-flex rounded-full border border-green-300/25 bg-green-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-green-100">
            NOVA PUNIÇÃO
          </span>

          <h2 className="mt-3 text-2xl font-black uppercase text-white">
            CADASTRAR SUSPENSÃO
          </h2>

          <AdminPunicaoForm
            campeonatos={campeonatos}
            equipes={equipes}
            atletas={atletas}
          />
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-yellow-100">
                PUNIÇÕES REGISTRADAS
              </span>

              <h2 className="mt-3 text-2xl font-black uppercase text-white">
                LISTA DE SUSPENSÕES
              </h2>
            </div>

            <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-black text-white/70">
              {punicoes.length} punição(ões)
            </span>
          </div>

          {punicoes.length === 0 ? (
            <div className="rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-sm leading-7 text-yellow-50">
              Nenhuma punição cadastrada no momento.
            </div>
          ) : (
            <div className="space-y-4">
              {punicoes.map((p) => {
                const campeonato = p.campeonato_id
                  ? campeonatoPorId.get(p.campeonato_id)
                  : null;
                const contatoResponsavel =
                  (p.equipe_id ? contatoPorEquipeId.get(p.equipe_id) : null) ||
                  contatoPorNomeEquipe.get(normalizarTexto(p.equipe_nome));

                return (
                  <article
                    key={p.id}
                    className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-xl"
                  >
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-red-500/20 border border-red-500/30 px-3 py-1 text-xs font-black uppercase text-red-200">
                        {p.status || "Ativa"}
                      </span>

                      {p.origem && (
                        <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs text-white/70">
                          {p.origem === "regulamento_municipal" ? "Regulamento" : p.origem.toUpperCase()}
                        </span>
                      )}

                      {p.artigo_cbjd && (
                        <span className="rounded-full border border-blue-300/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-100">
                          {p.artigo_cbjd}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45 mb-1">
                      {campeonato?.nome || "Campeonato de Referência"}
                    </p>

                    <h3 className="text-xl font-black text-white uppercase">
                      {p.atleta_nome || "Atleta não informado"}
                    </h3>

                    <p className="text-sm font-bold text-emerald-300 uppercase mt-1">
                      {p.equipe_nome || "Equipe não informada"}
                      {p.categoria_nome ? ` — ${p.categoria_nome}` : ""}
                      {p.serie_nome ? ` — ${p.serie_nome}` : ""}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-white/70 bg-black/20 p-3 rounded-2xl border border-white/5">
                      <strong>Motivo:</strong> {p.motivo}
                    </p>

                    <div className="mt-4 grid gap-3 text-xs text-white/60 md:grid-cols-3">
                      <p className="flex items-center gap-2">
                        <CalendarDays size={14} className="text-yellow-200" />
                        Início: {formatarData(p.data_inicio)}
                      </p>

                      <p className="flex items-center gap-2">
                        <CalendarDays size={14} className="text-green-200" />
                        Fim: {formatarData(p.data_fim)}
                      </p>

                      {p.jogos_suspensao !== null && (
                        <p className="flex items-center gap-2">
                          <AlertTriangle size={14} className="text-red-200" />
                          Jogos: {p.jogos_suspensao}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <AdminAtletaFichaButton ficha={fichasPorPunicao.get(p.id) || null} />

                      <AdminPunicaoActions
                        punicao={{
                          id: p.id,
                          campeonato_nome:
                            campeonato?.nome || "Campeonato de Referência",
                          equipe_nome: p.equipe_nome,
                          atleta_nome: p.atleta_nome,
                          categoria_nome: p.categoria_nome,
                          serie_nome: p.serie_nome,
                          motivo: p.motivo,
                          artigo_cbjd: p.artigo_cbjd,
                          data_inicio: p.data_inicio,
                          data_fim: p.data_fim,
                          jogos_suspensao: p.jogos_suspensao,
                          status: p.status,
                          origem: p.origem,
                          responsavel_nome:
                            contatoResponsavel?.responsavel_nome || null,
                          responsavel_telefone:
                            contatoResponsavel?.responsavel_telefone || null,
                        }}
                      />

                      <form action={removerPunicao}>
                        <input type="hidden" name="punicao_id" value={p.id} />
                        <button
                          type="submit"
                          className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-black uppercase text-red-100 transition hover:bg-red-500/20"
                        >
                          <Trash2 size={14} />
                          Excluir Punição
                        </button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
