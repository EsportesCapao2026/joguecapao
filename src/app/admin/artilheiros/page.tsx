import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { exigirAdmin } from "@/lib/adminAuth";
import { AdminArtilheiroForm } from "@/components/admin/artilheiros/AdminArtilheiroForm";
import { AdminArtilheiroList } from "@/components/admin/artilheiros/AdminArtilheiroList";
import { Medal } from "lucide-react";

type SearchParams = Promise<{
  sucesso?: string;
  erro?: string;
  detalhe?: string;
}>;

type Campeonato = {
  id: string;
  nome: string;
  modalidade: string | null;
  categorias_lista: CategoriaConfig[] | string[] | null;
};

type CategoriaConfig = {
  nome: string;
  ativo: boolean;
  series_ativas: boolean;
  series_lista: string[];
};

type Jogo = {
  id: string;
  campeonato_id: string | null;
  equipe_mandante_id: string | null;
  equipe_visitante_id: string | null;
  equipe_mandante_nome: string | null;
  equipe_visitante_nome: string | null;
  categoria: string | null;
  serie: string | null;
  rodada: string | null;
};

type Atleta = {
  id: string;
  equipe_id: string | null;
  nome: string;
  numero_camisa: string | null;
};

type GolRegistro = {
  id: string;
  campeonato_id: string | null;
  jogo_id: string | null;
  equipe_id: string | null;
  atleta_id: string | null;
  atleta_nome: string | null;
  equipe_nome: string | null;
  quantidade: number | null;
  categoria_nome: string | null;
  serie_nome: string | null;
  created_at: string | null;
};

export default async function AdminArtilheirosPage({
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
    .select("id, nome, modalidade, categorias_lista")
    .neq("status", "encerrado")
    .order("created_at", { ascending: false });

  const campeonatos = (campeonatosData || []) as Campeonato[];

  // Buscar todos os jogos
  const { data: jogosData } = await supabase
    .from("jogos")
    .select(
      "id, campeonato_id, equipe_mandante_id, equipe_visitante_id, equipe_mandante_nome, equipe_visitante_nome, categoria, serie, rodada"
    )
    .order("created_at", { ascending: false });

  const jogos = (jogosData || []) as Jogo[];

  // Buscar atletas aprovados
  const { data: atletasData } = await supabase
    .from("atletas")
    .select("id, equipe_id, nome, numero_camisa")
    .order("nome", { ascending: true });

  const atletas = (atletasData || []) as Atleta[];

  // Buscar gols registrados
  const { data: golsData } = await supabase
    .from("gols")
    .select("*")
    .order("created_at", { ascending: false });

  const gols = (golsData || []) as GolRegistro[];

  return (
    <div className="space-y-6 text-white">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur">
        <div className="border-b border-white/10 bg-gradient-to-r from-yellow-300/15 via-green-400/10 to-blue-500/15 p-6 md:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-yellow-200">
            <Medal size={14} />
            Artilharia
          </span>

          <h1 className="mt-4 text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
            Gols e Artilharia
          </h1>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/72 md:text-base">
            Registre gols marcados por jogadores individuais em partidas reais para calcular o ranking oficial de artilheiros dos campeonatos.
          </p>
        </div>
      </div>

      {params.sucesso && (
        <div className="rounded-3xl border border-green-300/25 bg-green-400/10 p-4 text-sm font-black text-green-100 backdrop-blur">
          {params.sucesso === "registrado" && "Gols registrados com sucesso!"}
          {params.sucesso === "removido" && "Registro de gols excluído com sucesso!"}
        </div>
      )}

      {params.erro && (
        <div className="rounded-3xl border border-red-300/25 bg-red-400/10 p-4 text-sm font-black text-red-100 backdrop-blur">
          Erro ao salvar dados.
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
            REGISTRAR GOLS
          </span>

          <h2 className="mt-3 text-2xl font-black uppercase text-white">
            LANÇAR GOLS DE ATLETA
          </h2>

          <AdminArtilheiroForm
            campeonatos={campeonatos}
            jogos={jogos}
            atletas={atletas}
          />
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur">
          <AdminArtilheiroList
            campeonatos={campeonatos}
            atletas={atletas}
            gols={gols}
          />
        </section>
      </div>
    </div>
  );
}
