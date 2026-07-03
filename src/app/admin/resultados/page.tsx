import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { exigirAdmin } from "@/lib/adminAuth";
import { BarChart3, CalendarDays, Clock, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";

type JogoRealizado = {
  id: string;
  campeonato_id: string | null;
  categoria: string | null;
  serie: string | null;
  equipe_mandante_nome: string | null;
  equipe_visitante_nome: string | null;
  gols_mandante: number | null;
  gols_visitante: number | null;
  data_jogo: string | null;
  horario: string | null;
  local: string | null;
  rodada: string | null;
  observacoes: string | null;
};

type Campeonato = {
  id: string;
  nome: string;
};

function formatarData(data: string | null) {
  if (!data) return "N/A";
  const partes = data.split("-");
  if (partes.length !== 3) return data;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export default async function AdminResultadosPage() {
  await exigirAdmin();

  const supabase = getSupabaseAdmin();

  // Buscar campeonatos para mapear nomes
  const { data: campeonatosData } = await supabase
    .from("campeonatos")
    .select("id, nome");

  const campeonatos = (campeonatosData || []) as Campeonato[];
  const campeonatoPorId = new Map(campeonatos.map((c) => [c.id, c]));

  // Buscar todos os jogos finalizados (realizados)
  const { data: jogosData } = await supabase
    .from("jogos")
    .select("*")
    .eq("status", "realizado")
    .order("data_jogo", { ascending: false });

  const jogos = (jogosData || []) as JogoRealizado[];

  return (
    <div className="space-y-6 text-white">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur">
        <div className="border-b border-white/10 bg-gradient-to-r from-yellow-300/15 via-green-400/10 to-blue-500/15 p-6 md:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-yellow-200">
            <BarChart3 size={14} />
            RESULTADOS
          </span>

          <h1 className="mt-4 text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
            Resultados Consolidados
          </h1>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/72 md:text-base">
            Visualize os placares e resultados finais dos confrontos já encerrados. Os resultados podem ser cadastrados ou editados na seção de Jogos.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          href="/admin/jogos"
          prefetch={false}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-green-400 to-blue-500 px-5 py-4 text-xs font-black uppercase text-slate-950 shadow-lg transition hover:scale-[1.01]"
        >
          Lançar Novos Resultados
          <ArrowRight size={14} />
        </Link>
      </div>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur">
        <h2 className="text-2xl font-black uppercase mb-6">Partidas Encerradas</h2>

        {jogos.length === 0 ? (
          <div className="rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-sm leading-7 text-yellow-50">
            Nenhum resultado de jogo lançado no momento. Cadastre os placares na página de Jogos e rodadas.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {jogos.map((jogo) => {
              const camp = jogo.campeonato_id ? campeonatoPorId.get(jogo.campeonato_id) : null;

              return (
                <article
                  key={jogo.id}
                  className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-green-300/10 border border-green-300/25 px-3 py-1 text-xs font-black uppercase text-green-200">
                        Encerrado
                      </span>
                      {jogo.rodada && (
                        <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs text-white/70">
                          {jogo.rodada}
                        </span>
                      )}
                      {jogo.categoria && (
                        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
                          {jogo.categoria}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45 mb-2">
                      {camp?.nome || "Campeonato"}
                    </p>

                    <div className="grid items-center gap-4 rounded-3xl border border-white/10 bg-black/20 p-4 grid-cols-[1fr_auto_1fr]">
                      <p className="text-base font-black uppercase text-white truncate text-left">
                        {jogo.equipe_mandante_nome}
                      </p>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-2 text-center">
                        <p className="text-xl font-black text-white">
                          {jogo.gols_mandante ?? 0} x {jogo.gols_visitante ?? 0}
                        </p>
                      </div>

                      <p className="text-base font-black uppercase text-white truncate text-right">
                        {jogo.equipe_visitante_nome}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 grid gap-3 text-xs text-white/60 grid-cols-3">
                    <p className="flex items-center gap-1.5 truncate">
                      <CalendarDays size={14} className="text-yellow-200" />
                      {formatarData(jogo.data_jogo)}
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <Clock size={14} className="text-green-200" />
                      {jogo.horario || "Horário N/I"}
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <MapPin size={14} className="text-blue-200" />
                      {jogo.local || "Local N/I"}
                    </p>
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
