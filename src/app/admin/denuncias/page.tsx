import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { ShieldAlert, Calendar, User, Phone, Trophy, FileText, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { julgarDenuncia } from "./actions";

type Denuncia = {
  id: string;
  protocolo: string;
  nome: string;
  whatsapp: string;
  campeonato_id: string | null;
  categoria_nome: string | null;
  serie_nome: string | null;
  equipe_reclamante: string | null;
  equipe_denunciada_id: string | null;
  equipe_denunciada_name?: string | null;
  equipe_denunciada_nome: string | null;
  jogo_id: string | null;
  partida_rodada: string | null;
  alvo_tipo: string | null;
  atleta_denunciado_id: string | null;
  atleta_denunciado_nome: string | null;
  descricao: string | null;
  pdf_denuncia_url: string | null;
  status: string | null;
  decisao: string | null;
  created_at: string | null;
};

type Campeonato = {
  id: string;
  nome: string;
};

type SearchParams = Promise<{
  sucesso?: string;
  erro?: string;
  detalhe?: string;
}>;

function formatarData(data: string | null) {
  if (!data) return "N/A";
  const d = new Date(data);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminDenunciasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = getSupabaseAdmin();

  // 1. Buscar campeonatos para mapear nomes
  const { data: campeonatosData } = await supabase
    .from("campeonatos")
    .select("id, nome");

  const campeonatos = (campeonatosData || []) as Campeonato[];
  const campeonatoPorId = new Map(campeonatos.map((c) => [c.id, c]));

  // 2. Buscar todas as denúncias ordenadas por criadas recentemente
  const { data: denunciasData } = await supabase
    .from("denuncias")
    .select("*")
    .order("created_at", { ascending: false });

  const denuncias = (denunciasData || []) as Denuncia[];

  const selectClass =
    "w-full rounded-2xl border border-white/10 bg-[#0c1b15] px-4 py-3 text-sm text-white outline-none transition focus:border-yellow-300/60 focus:ring-2 focus:ring-yellow-300/10";

  const textareaClass =
    "w-full min-h-20 rounded-2xl border border-white/10 bg-[#0c1b15] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-yellow-300/60 focus:ring-2 focus:ring-yellow-300/10";

  return (
    <div className="space-y-6 text-white">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur">
        <div className="border-b border-white/10 bg-gradient-to-r from-yellow-300/15 via-green-400/10 to-blue-500/15 p-6 md:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-yellow-200">
            <ShieldAlert size={14} />
            PAINEL DE JULGAMENTOS
          </span>

          <h1 className="mt-4 text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
            Denúncias Recebidas
          </h1>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/72 md:text-base">
            Analise e responda às denúncias enviadas pelos clubes e cidadãos. Mude os status e registre decisões oficiais para dar satisfação aos envolvidos.
          </p>
        </div>
      </div>

      {params.sucesso && (
        <div className="rounded-3xl border border-green-300/25 bg-green-400/10 p-4 text-sm font-black text-green-100 backdrop-blur flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>Julgamento registrado e salvo com sucesso!</span>
        </div>
      )}

      {params.erro && (
        <div className="rounded-3xl border border-red-300/25 bg-red-400/10 p-4 text-sm font-black text-red-100 backdrop-blur flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>Erro ao processar julgamento.</span>
          </div>
          {params.detalhe && (
            <span className="text-xs font-bold text-red-50/80">Detalhe: {params.detalhe}</span>
          )}
        </div>
      )}

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-wide">Fila de Denúncias ({denuncias.length})</h2>

        {denuncias.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-8 text-center text-white/50 backdrop-blur">
            Nenhuma denúncia registrada na plataforma até o momento.
          </div>
        ) : (
          <div className="grid gap-6">
            {denuncias.map((denuncia) => {
              const camp = denuncia.campeonato_id ? campeonatoPorId.get(denuncia.campeonato_id) : null;
              
              // Determinar cores do badge de status
              let statusBadge = "border-yellow-300/20 bg-yellow-400/10 text-yellow-200";
              let statusLabel = "Pendente";
              if (denuncia.status === "em_analise") {
                statusBadge = "border-blue-300/20 bg-blue-400/10 text-blue-200";
                statusLabel = "Em análise";
              } else if (denuncia.status === "procedente") {
                statusBadge = "border-green-300/20 bg-green-400/10 text-green-200";
                statusLabel = "Procedente (Aprovada)";
              } else if (denuncia.status === "improcedente") {
                statusBadge = "border-red-300/20 bg-red-400/10 text-red-200";
                statusLabel = "Improcedente (Rejeitada)";
              }

              return (
                <article
                  key={denuncia.id}
                  className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/60 shadow-xl backdrop-blur transition hover:border-white/15"
                >
                  {/* Cabeçalho do Cartão */}
                  <div className="border-b border-white/5 bg-white/[0.02] p-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black tracking-wider text-yellow-200">
                        {denuncia.protocolo}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusBadge}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <p className="text-xs text-white/40 flex items-center gap-1">
                      <Clock size={12} />
                      Enviada em: {formatarData(denuncia.created_at)}
                    </p>
                  </div>

                  {/* Informações da Denúncia */}
                  <div className="p-6 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.16em] text-white/45 mb-2">
                          Dados Gerais do Fato
                        </h3>
                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-2 text-sm text-white/80">
                          <p className="flex items-center gap-2">
                            <Trophy size={14} className="text-yellow-200" />
                            <strong>Camp:</strong> {camp?.nome || "Não informado"}
                          </p>
                          {(denuncia.categoria_nome || denuncia.serie_nome) && (
                            <p className="flex items-center gap-2">
                              <ShieldAlert size={14} className="text-green-300" />
                              <strong>Categoria/Série:</strong> {denuncia.categoria_nome || "Geral"} {denuncia.serie_nome ? ` — Série ${denuncia.serie_nome}` : ""}
                            </p>
                          )}
                          {denuncia.partida_rodada && (
                            <p className="flex items-center gap-2">
                              <Calendar size={14} className="text-blue-300" />
                              <strong>Jogo/Rodada:</strong> {denuncia.partida_rodada}
                            </p>
                          )}
                          <p className="flex items-center gap-2">
                            <User size={14} className="text-emerald-300" />
                            <strong>Alvo:</strong> {denuncia.alvo_tipo === "atleta" ? `Atleta — ${denuncia.atleta_denunciado_nome}` : denuncia.alvo_tipo === "comissao" ? `Comissão — ${denuncia.atleta_denunciado_nome}` : `Clube / Geral — ${denuncia.equipe_denunciada_nome}`}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.16em] text-white/45 mb-2">
                          Descrição detalhada do Reclamante
                        </h3>
                        <div className="bg-black/25 p-4 rounded-2xl border border-white/5 text-sm leading-6 text-white/90">
                          {denuncia.descricao || "Nenhuma descrição fornecida."}
                        </div>
                      </div>

                      {denuncia.pdf_denuncia_url && (
                        <div className="pt-2">
                          <a
                            href={denuncia.pdf_denuncia_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-white/[0.07] border border-white/10 px-4 py-2 text-xs font-bold text-emerald-200 transition hover:bg-white/[0.15]"
                          >
                            <FileText size={14} />
                            Visualizar Prova / Documento Anexo
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Lado Direito: Julgamento e Informações do Reclamante */}
                    <div className="space-y-6 flex flex-col justify-between">
                      {/* Dados do Reclamante */}
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.16em] text-white/45 mb-2">
                          Autor da Reclamação
                        </h3>
                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5 text-xs space-y-2 text-white/70">
                          <p className="flex items-center gap-2">
                            <User size={12} className="text-yellow-200" />
                            <strong>Nome:</strong> {denuncia.nome}
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone size={12} className="text-green-200" />
                            <strong>WhatsApp:</strong> {denuncia.whatsapp}
                          </p>
                          {denuncia.equipe_reclamante && (
                            <p className="flex items-center gap-2">
                              <Trophy size={12} className="text-blue-200" />
                              <strong>Representa:</strong> {denuncia.equipe_reclamante}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Formulário de Julgamento */}
                      <div className="bg-white/[0.04] p-4 rounded-2xl border border-white/5">
                        <h3 className="text-sm font-black uppercase tracking-wider mb-3">Registrar Julgamento</h3>
                        
                        <form action={julgarDenuncia} className="space-y-3">
                          <input type="hidden" name="id" value={denuncia.id} />
                          
                          <div>
                            <select
                              name="status"
                              defaultValue={denuncia.status || "pendente"}
                              className={selectClass}
                            >
                              <option value="pendente">Pendente</option>
                              <option value="em_analise">Em análise</option>
                              <option value="procedente">Procedente (Aprovada)</option>
                              <option value="improcedente">Improcedente (Rejeitada)</option>
                            </select>
                          </div>

                          <div>
                            <textarea
                              name="decisao"
                              defaultValue={denuncia.decisao || ""}
                              placeholder="Digite a resposta ou decisão oficial..."
                              className={textareaClass}
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full rounded-xl bg-gradient-to-r from-yellow-300 via-green-400 to-blue-500 py-3 text-xs font-black uppercase text-slate-950 shadow transition hover:scale-[1.01]"
                          >
                            Salvar Julgamento
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
