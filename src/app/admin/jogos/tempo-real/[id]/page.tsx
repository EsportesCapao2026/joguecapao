import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { exigirAdmin } from "@/lib/adminAuth";
import { ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import TempoRealControl from "@/components/admin/jogos/TempoRealControl";

type Params = Promise<{
  id: string;
}>;

export default async function AdminJogoTempoRealPage({
  params,
}: {
  params: Params;
}) {
  await exigirAdmin();

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  // 1. Buscar jogo
  const { data: jogo } = await supabase
    .from("jogos")
    .select("*")
    .eq("id", id)
    .single();

  if (!jogo) {
    notFound();
  }

  // 2. Buscar atletas da equipe mandante
  const { data: atletasMandante } = await supabase
    .from("inscricao_jogadores")
    .select("id, nome")
    .eq("inscricao_id", jogo.equipe_mandante_id)
    .order("nome", { ascending: true });

  // 3. Buscar atletas da equipe visitante
  const { data: atletasVisitante } = await supabase
    .from("inscricao_jogadores")
    .select("id, nome")
    .eq("inscricao_id", jogo.equipe_visitante_id)
    .order("nome", { ascending: true });

  const mappedJogo = {
    id: jogo.id,
    equipe_mandante_id: jogo.equipe_mandante_id,
    equipe_visitante_id: jogo.equipe_visitante_id,
    equipe_mandante_nome: jogo.equipe_mandante_nome,
    equipe_visitante_nome: jogo.equipe_visitante_nome,
    gols_mandante: jogo.gols_mandante,
    gols_visitante: jogo.gols_visitante,
    status: jogo.status,
    observacoes: jogo.observacoes,
  };

  return (
    <div className="space-y-6 text-white">
      {/* Header com botão de voltar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin/jogos"
          prefetch={false}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.1]"
        >
          <ArrowLeft size={16} />
          Voltar para Jogos
        </Link>

        <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-yellow-200">
          <Clock size={14} />
          TEMPO REAL
        </span>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur md:p-8">
        <h1 className="text-3xl font-black uppercase text-white truncate max-w-full">
          Confronto: {jogo.equipe_mandante_nome} x {jogo.equipe_visitante_nome}
        </h1>
        <p className="text-sm text-white/50 mt-2 font-bold uppercase tracking-wider">
          {jogo.rodada || "Sem Rodada"} — Categoria {jogo.categoria || "Masculino"} — Série {jogo.serie || "Ouro"}
        </p>
      </div>

      <TempoRealControl
        jogo={mappedJogo}
        atletasMandante={atletasMandante || []}
        atletasVisitante={atletasVisitante || []}
      />
    </div>
  );
}
