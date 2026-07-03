import {
  ShieldCheck,
  Trophy,
  Users,
  UserCheck,
  FileText,
} from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type Inscricao = {
  id: string;
  campeonato_id: string | null;
  categoria: string | null;
  serie: string | null;
  nome_equipe: string | null;
  nome_time: string | null;
  cidade: string | null;
  nome_tecnico: string | null;
  logo_url: string | null;
  status: string | null;
  created_at: string | null;
};

type Jogador = {
  id: string;
  inscricao_id: string;
  nome: string;
  documento_tipo: string;
  documento_numero: string;
  numero_camisa: string;
  capitao: boolean | null;
  status: string | null;
  documento_arquivo_url: string | null;
};

type Campeonato = {
  id: string;
  nome: string;
  modalidade: string | null;
};

function formatarData(data: string | null) {
  if (!data) return "Não informada";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

export default async function AdminClubesPage() {
  const supabase = getSupabaseAdmin();

  const { data: inscricoesData } = await supabase
    .from("inscricoes")
    .select(
      "id, campeonato_id, categoria, serie, nome_equipe, nome_time, cidade, nome_tecnico, logo_url, status, created_at"
    )
    .eq("status", "aprovada")
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
          .select(
            "id, inscricao_id, nome, documento_tipo, documento_numero, numero_camisa, capitao, status, documento_arquivo_url"
          )
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

  return (
    <div className="space-y-6 text-white">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur">
          <div className="border-b border-white/10 bg-gradient-to-r from-yellow-300/15 via-green-400/10 to-blue-500/15 p-6 md:p-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-yellow-200">
              <ShieldCheck size={14} />
              CLUBES E ATLETAS
            </span>

            <h1 className="mt-4 max-w-5xl text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
              CLUBES E ATLETAS
            </h1>

            <p className="mt-4 max-w-4xl text-sm leading-7 text-white/72 md:text-base">
              Consulte equipes aprovadas, dados do campeonato, categoria, série,
              técnico e atletas vinculados.
            </p>
          </div>
        </div>

        {inscricoes.length === 0 ? (
          <div className="rounded-[2rem] border border-yellow-300/20 bg-yellow-300/10 p-6 text-yellow-50 shadow-2xl backdrop-blur">
            Nenhum clube aprovado ainda.
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            {inscricoes.map((inscricao) => {
              const nomeEquipe =
                inscricao.nome_equipe || inscricao.nome_time || "Equipe sem nome";

              const campeonato = inscricao.campeonato_id
                ? campeonatoPorId.get(inscricao.campeonato_id)
                : null;

              const jogadoresDaEquipe =
                jogadoresPorInscricao.get(inscricao.id) || [];

              return (
                <article
                  key={inscricao.id}
                  className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur"
                >
                  <div className="border-b border-white/10 bg-slate-950/45 p-6">
                    <div className="flex gap-4">
                      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-3xl border border-white/10 bg-black/25">
                        {inscricao.logo_url ? (
                          <img
                            src={inscricao.logo_url}
                            alt={`Logo da equipe ${nomeEquipe}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Users className="text-white/55" size={30} />
                        )}
                      </div>

                      <div>
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-green-300 px-3 py-1 text-xs font-black uppercase text-slate-950">
                            Aprovada
                          </span>

                          {inscricao.categoria && (
                            <span className="rounded-full border border-green-300/20 bg-green-400/10 px-3 py-1 text-xs font-black text-green-100">
                              {inscricao.categoria}
                            </span>
                          )}

                          {inscricao.serie && (
                            <span className="rounded-full border border-blue-300/20 bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-100">
                              {inscricao.serie}
                            </span>
                          )}
                        </div>

                        <h2 className="text-3xl font-black uppercase text-white">
                          {nomeEquipe}
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
                  </div>

                  <div className="grid gap-5 p-6">
                    <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
                      <h3 className="mb-4 flex items-center gap-2 text-lg font-black uppercase text-white">
                        <Trophy size={18} />
                        Dados do clube
                      </h3>

                      <div className="grid gap-2 text-sm leading-6 text-white/70 md:grid-cols-2">
                        <p>
                          <strong className="text-white">Cidade:</strong>{" "}
                          {inscricao.cidade || "Não informada"}
                        </p>

                        <p>
                          <strong className="text-white">Técnico:</strong>{" "}
                          {inscricao.nome_tecnico || "Não informado"}
                        </p>

                        <p>
                          <strong className="text-white">Categoria:</strong>{" "}
                          {inscricao.categoria || "Não informada"}
                        </p>

                        <p>
                          <strong className="text-white">Série:</strong>{" "}
                          {inscricao.serie || "Sem série"}
                        </p>

                        <p>
                          <strong className="text-white">Aprovada em:</strong>{" "}
                          {formatarData(inscricao.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-lg font-black uppercase text-white">
                          Atletas
                        </h3>

                        <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-black text-white/70">
                          {jogadoresDaEquipe.length} atleta(s)
                        </span>
                      </div>

                      {jogadoresDaEquipe.length === 0 ? (
                        <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4 text-sm text-yellow-50">
                          Nenhum atleta vinculado a esta equipe.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {jogadoresDaEquipe.map((jogador) => {
                            const documentoUrl = documentosAssinados.get(jogador.id);

                            return (
                              <div
                                key={jogador.id}
                                className="rounded-2xl border border-white/10 bg-black/20 p-4"
                              >
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                  <div>
                                    <div className="mb-2 flex flex-wrap gap-2">
                                      {jogador.capitao && (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-3 py-1 text-xs font-black text-yellow-100">
                                          <UserCheck size={13} />
                                          Capitão
                                        </span>
                                      )}

                                      <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-black text-white/70">
                                        {jogador.status || "pendente"}
                                      </span>
                                    </div>

                                    <h4 className="text-lg font-black uppercase text-white">
                                      {jogador.nome}
                                    </h4>

                                    <p className="mt-1 text-sm leading-6 text-white/65">
                                      {jogador.documento_tipo}:{" "}
                                      {jogador.documento_numero}
                                      <br />
                                      Camisa: {jogador.numero_camisa}
                                    </p>
                                  </div>

                                  {documentoUrl && (
                                    <a
                                      href={documentoUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-300/25 bg-blue-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-blue-100 transition hover:bg-blue-500/20"
                                    >
                                      <FileText size={16} />
                                      Documento
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
    </div>
  );
}
