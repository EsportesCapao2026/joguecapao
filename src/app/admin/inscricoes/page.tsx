import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Trophy,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { exigirAdmin } from "@/lib/adminAuth";
import {
  buscarRestricaoAtleta,
  extrairDocumentosAtleta,
  formatarDocumentoAtleta,
  type RestricaoAtleta,
} from "@/lib/restricoesAtletas";
import { GerarPdfInscricaoButton } from "@/components/admin/inscricoes/GerarPdfInscricaoButton";
import {
  alterarStatusInscricao,
  alterarStatusJogador,
  resolverRestricaoJogador,
} from "./actions";

/* eslint-disable @next/next/no-img-element -- Logos de equipes vêm do storage e podem usar URLs externas assinadas. */

type SearchParams = Promise<{
  sucesso?: string;
  erro?: string;
}>;

type Inscricao = {
  id: string;
  campeonato_id: string | null;
  categoria: string | null;
  serie: string | null;
  nome_equipe: string | null;
  responsavel_nome: string | null;
  responsavel_telefone: string | null;
  responsavel_email: string | null;
  cidade: string | null;
  nome_tecnico: string | null;
  logo_url: string | null;
  observacoes: string | null;
  status: string | null;
  alerta_punicao: boolean | null;
  alerta_punicao_detalhes: string | null;
  created_at: string | null;
};

type Jogador = {
  id: string;
  inscricao_id: string;
  nome: string;
  documento_tipo: string;
  documento_numero: string;
  documento_rg?: string | null;
  documento_cpf?: string | null;
  documento_arquivo_url: string | null;
  numero_camisa: string;
  capitao: boolean | null;
  possivel_punicao: boolean | null;
  possivel_punicao_detalhes: string | null;
  status: string | null;
};

type Campeonato = {
  id: string;
  nome: string;
  modalidade: string | null;
};

function statusLabel(status: string | null) {
  if (status === "aprovada" || status === "aprovado") return "Aprovada";
  if (status === "reprovada" || status === "reprovado") return "Reprovada";
  if (status === "pendente") return "Pendente";
  return "Sem status";
}

function statusClass(status: string | null) {
  if (status === "aprovada" || status === "aprovado") return "bg-green-300 text-slate-950";
  if (status === "reprovada" || status === "reprovado") {
    return "border border-red-300/30 bg-red-500/10 text-red-100";
  }
  return "border border-yellow-300/30 bg-yellow-300/10 text-yellow-100";
}

function formatarData(data: string | null) {
  if (!data) return "Não informada";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

export default async function AdminInscricoesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await exigirAdmin();

  const params = await searchParams;
  const supabase = getSupabaseAdmin();

  const { data: inscricoesData } = await supabase
    .from("inscricoes")
    .select(
      "id, campeonato_id, categoria, serie, nome_equipe, responsavel_nome, responsavel_telefone, responsavel_email, cidade, nome_tecnico, logo_url, observacoes, status, alerta_punicao, alerta_punicao_detalhes, created_at"
    )
    .eq("status", "pendente")
    .order("created_at", { ascending: false });

  const inscricoes = (inscricoesData || []) as Inscricao[];

  const inscricaoIds = inscricoes.map((item) => item.id);
  const campeonatoIds = Array.from(
    new Set(inscricoes.map((item) => item.campeonato_id).filter(Boolean))
  ) as string[];

  const { data: jogadoresData } =
    inscricaoIds.length > 0
      ? await supabase
          .from("inscricao_jogadores")
          .select("*")
          .in("inscricao_id", inscricaoIds)
          .order("created_at", { ascending: true })
      : { data: [] };

  const jogadores = (jogadoresData || []) as Jogador[];

  const { data: campeonatosData } =
    campeonatoIds.length > 0
      ? await supabase
          .from("campeonatos")
          .select("id, nome, modalidade")
          .in("id", campeonatoIds)
      : { data: [] };

  const campeonatos = (campeonatosData || []) as Campeonato[];

  const campeonatoPorId = new Map(
    campeonatos.map((campeonato) => [campeonato.id, campeonato])
  );

  const jogadoresPorInscricao = new Map<string, Jogador[]>();

  jogadores.forEach((jogador) => {
    const lista = jogadoresPorInscricao.get(jogador.inscricao_id) || [];
    lista.push(jogador);
    jogadoresPorInscricao.set(jogador.inscricao_id, lista);
  });

  const documentosAssinados = new Map<string, string>();

  for (const jogador of jogadores) {
    if (jogador.documento_arquivo_url) {
      const { data } = await supabase.storage
        .from("documentos-atletas")
        .createSignedUrl(jogador.documento_arquivo_url, 60 * 60);

      if (data?.signedUrl) {
        documentosAssinados.set(jogador.id, data.signedUrl);
      }
    }
  }

  const restricoesPorJogador = new Map<string, RestricaoAtleta>();

  for (const jogador of jogadores.filter((item) => item.possivel_punicao)) {
    const documentos = extrairDocumentosAtleta(jogador);
    const restricao = await buscarRestricaoAtleta(supabase, {
      nome: jogador.nome,
      rg: documentos.rg,
      cpf: documentos.cpf,
    });

    if (restricao) {
      restricoesPorJogador.set(jogador.id, restricao);
    }
  }

  return (
    <div className="space-y-6 text-white">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur">
          <div className="border-b border-white/10 bg-gradient-to-r from-yellow-300/15 via-green-400/10 to-blue-500/15 p-6 md:p-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-yellow-200">
              <Trophy size={14} />
              INSCRIÇÕES
            </span>

            <h1 className="mt-4 max-w-5xl text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
              INSCRIÇÕES PENDENTES
            </h1>

            <p className="mt-4 max-w-4xl text-sm leading-7 text-white/72 md:text-base">
              Analise as equipes inscritas, confira dados do responsável,
              jogadores, documentos enviados e aprove ou reprove a inscrição.
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
            Não foi possível concluir a ação. Confira os dados e tente novamente.
          </div>
        )}

        {inscricoes.length === 0 ? (
          <div className="rounded-[2rem] border border-yellow-300/20 bg-yellow-300/10 p-6 text-yellow-50 shadow-2xl backdrop-blur">
            Nenhuma inscrição pendente no momento.
          </div>
        ) : (
          <div className="space-y-6">
            {inscricoes.map((inscricao) => {
              const campeonato = inscricao.campeonato_id
                ? campeonatoPorId.get(inscricao.campeonato_id)
                : null;

              const jogadoresDaInscricao =
                jogadoresPorInscricao.get(inscricao.id) || [];

              return (
                <article
                  key={inscricao.id}
                  className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur"
                >
                  <div className="border-b border-white/10 bg-slate-950/45 p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex gap-4">
                        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-3xl border border-white/10 bg-black/25">
                          {inscricao.logo_url ? (
                            <img
                              src={inscricao.logo_url}
                              alt={`Logo da equipe ${inscricao.nome_equipe}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Users className="text-white/55" size={30} />
                          )}
                        </div>

                        <div>
                          <div className="mb-3 flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(
                                inscricao.status
                              )}`}
                            >
                              {statusLabel(inscricao.status)}
                            </span>

                            {inscricao.alerta_punicao && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1 text-xs font-black text-red-100">
                                <AlertTriangle size={13} />
                                Possível jogador com restrição
                              </span>
                            )}
                          </div>

                          <h2 className="text-3xl font-black uppercase text-white">
                            {inscricao.nome_equipe || "Equipe sem nome"}
                          </h2>

                          <p className="mt-2 text-sm leading-6 text-white/65">
                            {campeonato
                              ? `${campeonato.nome}${
                                  campeonato.modalidade
                                    ? ` — ${campeonato.modalidade}`
                                    : ""
                                }`
                              : "Campeonato não encontrado"}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                        <form action={alterarStatusInscricao}>
                          <input
                            type="hidden"
                            name="inscricao_id"
                            value={inscricao.id}
                          />
                          <input type="hidden" name="status" value="aprovada" />
                          <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-300 px-4 py-3 text-xs font-black uppercase tracking-[0.15em] text-slate-950 transition hover:scale-[1.01]"
                          >
                            <CheckCircle2 size={16} />
                            Aprovar
                          </button>
                        </form>

                        <form action={alterarStatusInscricao}>
                          <input
                            type="hidden"
                            name="inscricao_id"
                            value={inscricao.id}
                          />
                          <input type="hidden" name="status" value="reprovada" />
                          <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.15em] text-red-100 transition hover:bg-red-500/20"
                          >
                            <XCircle size={16} />
                            Reprovar
                          </button>
                        </form>

                        <form action={alterarStatusInscricao}>
                          <input
                            type="hidden"
                            name="inscricao_id"
                            value={inscricao.id}
                          />
                          <input type="hidden" name="status" value="pendente" />
                          <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center rounded-2xl border border-yellow-300/30 bg-yellow-300/10 px-4 py-3 text-xs font-black uppercase tracking-[0.15em] text-yellow-100 transition hover:bg-yellow-300/20"
                          >
                            Pendente
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 p-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <section className="space-y-4">
                      <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
                        <h3 className="mb-4 text-lg font-black uppercase text-white">
                          Dados da inscrição
                        </h3>

                        <div className="space-y-2 text-sm leading-6 text-white/70">
                          <p>
                            <strong className="text-white">Categoria:</strong>{" "}
                            {inscricao.categoria || "Não informada"}
                          </p>
                          <p>
                            <strong className="text-white">Série:</strong>{" "}
                            {inscricao.serie || "Sem série"}
                          </p>
                          <p>
                            <strong className="text-white">Cidade:</strong>{" "}
                            {inscricao.cidade || "Não informada"}
                          </p>
                          <p>
                            <strong className="text-white">Técnico:</strong>{" "}
                            {inscricao.nome_tecnico || "Não informado"}
                          </p>
                          <p>
                            <strong className="text-white">Enviada em:</strong>{" "}
                            {formatarData(inscricao.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
                        <h3 className="mb-4 text-lg font-black uppercase text-white">
                          Responsável
                        </h3>

                        <div className="space-y-2 text-sm leading-6 text-white/70">
                          <p>
                            <strong className="text-white">Nome:</strong>{" "}
                            {inscricao.responsavel_nome || "Não informado"}
                          </p>
                          <p>
                            <strong className="text-white">WhatsApp:</strong>{" "}
                            {inscricao.responsavel_telefone || "Não informado"}
                          </p>
                          <p>
                            <strong className="text-white">E-mail:</strong>{" "}
                            {inscricao.responsavel_email || "Não informado"}
                          </p>
                        </div>
                      </div>

                      {inscricao.observacoes && (
                        <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
                          <h3 className="mb-4 text-lg font-black uppercase text-white">
                            Observações
                          </h3>

                          <p className="whitespace-pre-line text-sm leading-7 text-white/70">
                            {inscricao.observacoes}
                          </p>
                        </div>
                      )}
                    </section>

                    <section className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-lg font-black uppercase text-white">
                          Jogadores inscritos
                        </h3>

                        <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-black text-white/70">
                          {jogadoresDaInscricao.length} jogador(es)
                        </span>
                      </div>

                      {jogadoresDaInscricao.length === 0 ? (
                        <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4 text-sm text-yellow-50">
                          Nenhum jogador vinculado a esta inscrição.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {jogadoresDaInscricao.map((jogador) => {
                            const documentoUrl = documentosAssinados.get(
                              jogador.id
                            );
                            const restricao = restricoesPorJogador.get(jogador.id);

                            return (
                              <div
                                key={jogador.id}
                                className="rounded-3xl border border-white/10 bg-black/20 p-4"
                              >
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                  <div>
                                    <div className="mb-2 flex flex-wrap gap-2">
                                      <span
                                        className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(
                                          jogador.status
                                        )}`}
                                      >
                                        {statusLabel(jogador.status)}
                                      </span>

                                      {jogador.capitao && (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-3 py-1 text-xs font-black text-yellow-100">
                                          <UserCheck size={13} />
                                          Capitão
                                        </span>
                                      )}

                                      {jogador.possivel_punicao && (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1 text-xs font-black text-red-100">
                                          <ShieldAlert size={13} />
                                          Possível restrição
                                        </span>
                                      )}
                                    </div>

                                    <h4 className="text-xl font-black uppercase text-white">
                                      {jogador.nome}
                                    </h4>

                                    <p className="mt-2 text-sm leading-6 text-white/65">
                                      {formatarDocumentoAtleta(jogador)}
                                      <br />
                                      Camisa: {jogador.numero_camisa}
                                    </p>
                                  </div>

                                  <div className="grid gap-2 md:min-w-[220px]">
                                    {documentoUrl && (
                                      <a
                                        href={documentoUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-300/30 bg-blue-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-blue-100"
                                      >
                                        <FileText size={16} />
                                        Ver documento
                                      </a>
                                    )}

                                    <GerarPdfInscricaoButton
                                      inscricao={{
                                        id: inscricao.id,
                                        nome_equipe: inscricao.nome_equipe,
                                        cidade: inscricao.cidade,
                                        categoria: inscricao.categoria,
                                        serie: inscricao.serie,
                                        nome_tecnico: inscricao.nome_tecnico,
                                        responsavel_nome: inscricao.responsavel_nome,
                                        responsavel_telefone: inscricao.responsavel_telefone,
                                        responsavel_email: inscricao.responsavel_email,
                                        logo_url: inscricao.logo_url,
                                        observacoes: inscricao.observacoes,
                                        created_at: inscricao.created_at,
                                      }}
                                      campeonatoNome={campeonato?.nome || "Campeonato não encontrado"}
                                      campeonatoModalidade={campeonato?.modalidade}
                                      jogadores={jogadoresDaInscricao.map((atleta) => ({
                                        id: atleta.id,
                                        nome: atleta.nome,
                                        documento_tipo: atleta.documento_tipo,
                                        documento_numero: atleta.documento_numero,
                                        documento_rg: atleta.documento_rg,
                                        documento_cpf: atleta.documento_cpf,
                                        numero_camisa: atleta.numero_camisa,
                                        capitao: atleta.capitao,
                                        status: atleta.status,
                                        documento_url: documentosAssinados.get(atleta.id) || null,
                                      }))}
                                    />

                                    <form action={alterarStatusJogador}>
                                      <input
                                        type="hidden"
                                        name="jogador_id"
                                        value={jogador.id}
                                      />
                                      <input
                                        type="hidden"
                                        name="status"
                                        value="aprovado"
                                      />
                                      <button
                                        type="submit"
                                        className="w-full rounded-2xl bg-green-300 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-950"
                                      >
                                        Aprovar atleta
                                      </button>
                                    </form>

                                    <form action={alterarStatusJogador}>
                                      <input
                                        type="hidden"
                                        name="jogador_id"
                                        value={jogador.id}
                                      />
                                      <input
                                        type="hidden"
                                        name="status"
                                        value="reprovado"
                                      />
                                      <button
                                        type="submit"
                                        className="w-full rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-red-100"
                                      >
                                        Reprovar atleta
                                      </button>
                                    </form>
                                  </div>
                                </div>

                                {jogador.possivel_punicao_detalhes && (
                                  <div className="mt-4 rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm leading-6 text-red-50">
                                    <strong className="mb-2 block text-base font-black uppercase">
                                      Possível jogador com restrição no campeonato
                                    </strong>
                                    <p>
                                      {restricao?.detalhe || jogador.possivel_punicao_detalhes}
                                    </p>

                                    <div className="mt-4 grid gap-2 md:grid-cols-3">
                                      <form action={resolverRestricaoJogador}>
                                        <input type="hidden" name="jogador_id" value={jogador.id} />
                                        <input type="hidden" name="acao" value="confirmar" />
                                        <input
                                          type="hidden"
                                          name="punicao_id"
                                          value={restricao?.punicaoId || ""}
                                        />
                                        <button
                                          type="submit"
                                          className="w-full rounded-2xl bg-red-300 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-950"
                                        >
                                          Confirmar punição
                                        </button>
                                      </form>

                                      <form action={resolverRestricaoJogador}>
                                        <input type="hidden" name="jogador_id" value={jogador.id} />
                                        <input type="hidden" name="acao" value="retirar" />
                                        <input
                                          type="hidden"
                                          name="punicao_id"
                                          value={restricao?.punicaoId || ""}
                                        />
                                        <button
                                          type="submit"
                                          className="w-full rounded-2xl border border-yellow-300/30 bg-yellow-300/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-yellow-50"
                                        >
                                          Retirar punição
                                        </button>
                                      </form>

                                      <form action={resolverRestricaoJogador}>
                                        <input type="hidden" name="jogador_id" value={jogador.id} />
                                        <input type="hidden" name="acao" value="nao_punido" />
                                        <button
                                          type="submit"
                                          className="w-full rounded-2xl border border-green-300/30 bg-green-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-green-50"
                                        >
                                          Não é jogador punido
                                        </button>
                                      </form>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  </div>
                </article>
              );
            })}
          </div>
        )}
    </div>
  );
}
