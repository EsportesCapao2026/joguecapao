import {
  CalendarDays,
  Clock,
  MapPin,
  Trophy,
  XCircle,
} from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { exigirAdmin } from "@/lib/adminAuth";
import { AdminJogoForm } from "@/components/admin/jogos/AdminJogoForm";
import { AdminResultadoJogoForm } from "@/components/admin/jogos/AdminResultadoJogoForm";
import AdminJogoActions from "@/components/admin/jogos/AdminJogoActions";
import { alterarStatusJogo } from "./actions";

type SearchParams = Promise<{
  sucesso?: string;
  erro?: string;
  detalhe?: string;
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
  status: string | null;
  categorias_lista: CategoriaConfig[] | string[] | null;
};

type Equipe = {
  id: string;
  campeonato_id: string | null;
  nome_equipe: string | null;
  nome_time: string | null;
  categoria: string | null;
  serie: string | null;
  cidade: string | null;
  status: string | null;
};

type Jogo = {
  id: string;
  campeonato_id: string | null;
  categoria: string | null;
  serie: string | null;
  equipe_mandante_id: string | null;
  equipe_visitante_id: string | null;
  equipe_mandante_nome: string | null;
  equipe_visitante_nome: string | null;
  data_jogo: string | null;
  horario: string | null;
  local: string | null;
  rodada: string | null;
  gols_mandante: number | null;
  gols_visitante: number | null;
  status: string | null;
  observacoes: string | null;
  created_at: string | null;
};

type AtletaJogo = {
  id: string;
  inscricao_id: string | null;
  nome: string;
  numero_camisa: string | null;
};

type GolRegistro = {
  id: string;
  jogo_id: string | null;
  equipe_id: string | null;
  atleta_id: string | null;
  atleta_nome: string | null;
  quantidade: number | null;
};

function statusLabel(status: string | null) {
  if (status === "realizado") return "Realizado";
  if (status === "cancelado") return "Cancelado";
  if (status === "adiado") return "Adiado";
  if (status === "em_andamento") return "Ao Vivo";
  if (status === "anulado") return "Anulado";
  return "Agendado";
}

function statusClass(status: string | null) {
  if (status === "realizado") return "bg-green-300 text-slate-950";
  if (status === "cancelado") return "border border-red-300/30 bg-red-500/10 text-red-100";
  if (status === "adiado") return "border border-yellow-300/30 bg-yellow-300/10 text-yellow-100";
  if (status === "em_andamento") return "bg-red-500 text-slate-950 animate-pulse";
  if (status === "anulado") return "border border-red-500/40 bg-red-950/20 text-red-300";
  return "border border-blue-300/30 bg-blue-500/10 text-blue-100";
}

function formatarData(data: string | null) {
  if (!data) return "Data não informada";

  const partes = data.split("-");
  if (partes.length !== 3) return data;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export default async function AdminJogosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await exigirAdmin();

  const params = await searchParams;
  const supabase = getSupabaseAdmin();

  const { data: campeonatosData } = await supabase
    .from("campeonatos")
    .select("id, nome, modalidade, status, categorias_lista")
    .neq("status", "encerrado")
    .order("created_at", { ascending: false });

  const campeonatos = (campeonatosData || []) as Campeonato[];

  const { data: equipesData } = await supabase
    .from("inscricoes")
    .select("id, campeonato_id, nome_equipe, nome_time, categoria, serie, cidade, status")
    .eq("status", "aprovada")
    .order("nome_equipe", { ascending: true });

  const equipes = (equipesData || []) as Equipe[];

  const { data: jogosData } = await supabase
    .from("jogos")
    .select(
      "id, campeonato_id, categoria, serie, equipe_mandante_id, equipe_visitante_id, equipe_mandante_nome, equipe_visitante_nome, data_jogo, horario, local, rodada, gols_mandante, gols_visitante, status, observacoes, created_at"
    )
    .order("data_jogo", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const jogosBrutos = (jogosData || []) as Jogo[];

  const { data: atletasData } = await supabase
    .from("inscricao_jogadores")
    .select("id, inscricao_id, nome, numero_camisa")
    .neq("status", "recusado")
    .order("nome", { ascending: true });

  const atletas = (atletasData || []) as AtletaJogo[];

  const { data: golsData } = await supabase
    .from("gols")
    .select("id, jogo_id, equipe_id, atleta_id, atleta_nome, quantidade")
    .order("created_at", { ascending: true });

  const gols = (golsData || []) as GolRegistro[];

  const jogos = [...jogosBrutos].sort((a, b) => {
    const aFinalizado = ["realizado", "cancelado", "anulado"].includes(a.status || "");
    const bFinalizado = ["realizado", "cancelado", "anulado"].includes(b.status || "");
    
    if (!aFinalizado && bFinalizado) return -1;
    if (aFinalizado && !bFinalizado) return 1;
    
    const dataA = a.data_jogo ? new Date(`${a.data_jogo}T${a.horario || "00:00"}`) : new Date(0);
    const dataB = b.data_jogo ? new Date(`${b.data_jogo}T${b.horario || "00:00"}`) : new Date(0);
    return dataA.getTime() - dataB.getTime();
  });

  const campeonatoPorId = new Map(
    campeonatos.map((campeonato) => [campeonato.id, campeonato])
  );

  return (
    <div className="space-y-6 text-white">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur">
        <div className="border-b border-white/10 bg-gradient-to-r from-yellow-300/15 via-green-400/10 to-blue-500/15 p-6 md:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-yellow-200">
            <Trophy size={14} />
            JOGOS E RODADAS
          </span>

          <h1 className="mt-4 max-w-5xl text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
            JOGOS E RODADAS
          </h1>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/72 md:text-base">
            Cadastre partidas vinculadas aos campeonatos, categorias, séries e equipes já aprovadas.
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
          Não foi possível concluir a ação.
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
            NOVO JOGO
          </span>

          <h2 className="mt-3 text-2xl font-black uppercase text-white">
            CADASTRAR JOGO
          </h2>

          <AdminJogoForm campeonatos={campeonatos} equipes={equipes} />
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-yellow-100">
                JOGOS CADASTRADOS
              </span>

              <h2 className="mt-3 text-2xl font-black uppercase text-white">
                TABELA DE JOGOS
              </h2>
            </div>

            <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-black text-white/70">
              {jogos.length} jogo(s)
            </span>
          </div>

          {jogos.length === 0 ? (
            <div className="rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-sm leading-7 text-yellow-50">
              Nenhum jogo cadastrado ainda.
            </div>
          ) : (
            <div className="space-y-4">
              {jogos.map((jogo) => {
                const campeonato = jogo.campeonato_id
                  ? campeonatoPorId.get(jogo.campeonato_id)
                  : null;

                return (
                  <article
                    key={jogo.id}
                    className="rounded-3xl border border-white/10 bg-slate-950/55 p-5"
                  >
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black uppercase ${statusClass(
                          jogo.status
                        )}`}
                      >
                        {statusLabel(jogo.status)}
                      </span>

                      {jogo.rodada && (
                        <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-black text-white/70">
                          {jogo.rodada}
                        </span>
                      )}

                      {jogo.categoria && (
                        <span className="rounded-full border border-green-300/20 bg-green-400/10 px-3 py-1 text-xs font-black text-green-100">
                          {jogo.categoria}
                        </span>
                      )}

                      {jogo.serie && (
                        <span className="rounded-full border border-blue-300/20 bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-100">
                          {jogo.serie}
                        </span>
                      )}
                    </div>

                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-white/45">
                      {campeonato?.nome || "Campeonato não encontrado"}
                    </p>

                    <div className="grid items-center gap-4 rounded-3xl border border-white/10 bg-black/20 p-4 md:grid-cols-[1fr_auto_1fr]">
                      <p className="text-lg font-black uppercase text-white">
                        {jogo.equipe_mandante_nome || "Mandante"}
                      </p>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.08] px-5 py-3 text-center">
                        {jogo.status === "realizado" || jogo.status === "em_andamento" ? (
                          <p className="text-2xl font-black text-white">
                            {jogo.gols_mandante ?? 0} x {jogo.gols_visitante ?? 0}
                          </p>
                        ) : (
                          <p className="text-sm font-black uppercase text-white/60">
                            X
                          </p>
                        )}
                      </div>

                      <p className="text-left text-lg font-black uppercase text-white md:text-right">
                        {jogo.equipe_visitante_nome || "Visitante"}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-white/65 md:grid-cols-3">
                      <p className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-yellow-200" />
                        {formatarData(jogo.data_jogo)}
                      </p>

                      <p className="flex items-center gap-2">
                        <Clock size={16} className="text-green-200" />
                        {jogo.horario || "Horário não informado"}
                      </p>

                      <p className="flex items-center gap-2">
                        <MapPin size={16} className="text-blue-200" />
                        {jogo.local || "Local não informado"}
                      </p>
                    </div>

                    {jogo.observacoes && !jogo.observacoes.trim().startsWith("{") && (
                      <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/60">
                        {jogo.observacoes}
                      </p>
                    )}

                    <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                      <AdminResultadoJogoForm
                        jogo={jogo}
                        atletasMandante={atletas.filter(
                          (atleta) => atleta.inscricao_id === jogo.equipe_mandante_id
                        )}
                        atletasVisitante={atletas.filter(
                          (atleta) => atleta.inscricao_id === jogo.equipe_visitante_id
                        )}
                      />

                      <form action={alterarStatusJogo}>
                        <input type="hidden" name="jogo_id" value={jogo.id} />
                        <input
                          type="hidden"
                          name="campeonato_id"
                          value={jogo.campeonato_id || ""}
                        />
                        <input type="hidden" name="status" value="adiado" />

                        <button
                          type="submit"
                          className="w-full rounded-2xl border border-yellow-300/30 bg-yellow-300/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-yellow-100"
                        >
                          Adiar
                        </button>
                      </form>

                      <form action={alterarStatusJogo}>
                        <input type="hidden" name="jogo_id" value={jogo.id} />
                        <input
                          type="hidden"
                          name="campeonato_id"
                          value={jogo.campeonato_id || ""}
                        />
                        <input type="hidden" name="status" value="cancelado" />

                        <button
                          type="submit"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-red-100"
                        >
                          <XCircle size={16} />
                          Cancelar
                        </button>
                      </form>
                    </div>

                    <AdminJogoActions
                      jogo={jogo}
                      campeonatos={campeonatos}
                      equipes={equipes}
                      atletas={atletas}
                      gols={gols.filter((gol) => gol.jogo_id === jogo.id)}
                    />
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
