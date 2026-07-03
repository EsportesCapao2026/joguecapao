import { ShieldCheck } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import AdminClubesControl from "@/components/admin/clubes/AdminClubesControl";

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
  observacoes: string | null;
  status: string | null;
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
  documento_url_assinado?: string | null;
};

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
  categorias_lista: CategoriaConfig[] | string[] | null;
};

type SearchParams = Promise<{
  sucesso?: string;
  erro?: string;
  detalhe?: string;
}>;

export default async function AdminClubesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = getSupabaseAdmin();

  // 1. Buscar todos os campeonatos ativos
  const { data: campeonatosData } = await supabase
    .from("campeonatos")
    .select("id, nome, modalidade, categorias_lista")
    .neq("status", "encerrado")
    .order("created_at", { ascending: false });

  const campeonatos = (campeonatosData || []) as Campeonato[];

  // 2. Buscar todas as inscrições aprovadas (equipes)
  const { data: inscricoesData } = await supabase
    .from("inscricoes")
    .select("id, campeonato_id, categoria, serie, nome_equipe, nome_time, cidade, nome_tecnico, logo_url, status, observacoes")
    .eq("status", "aprovada")
    .order("created_at", { ascending: false });

  const inscricoes = (inscricoesData || []) as Inscricao[];

  // 3. Buscar todos os jogadores das inscrições aprovadas
  const { data: jogadoresData } = await supabase
    .from("inscricao_jogadores")
    .select("id, inscricao_id, nome, documento_tipo, documento_numero, numero_camisa, capitao, status, documento_arquivo_url")
    .eq("status", "aprovada")
    .order("nome", { ascending: true });

  const jogadoresBrutos = (jogadoresData || []) as Jogador[];

  const jogadores = await Promise.all(
    jogadoresBrutos.map(async (jogador) => {
      let documentoUrlAssinado: string | null = null;
      if (jogador.documento_arquivo_url) {
        const { data } = await supabase.storage
          .from("documentos-atletas")
          .createSignedUrl(jogador.documento_arquivo_url, 60 * 60);
        documentoUrlAssinado = data?.signedUrl || null;
      }
      return {
        ...jogador,
        documento_url_assinado: documentoUrlAssinado,
      };
    })
  );

  return (
    <div className="space-y-6 text-white">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur">
        <div className="border-b border-white/10 bg-gradient-to-r from-yellow-300/15 via-green-400/10 to-blue-500/15 p-6 md:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-yellow-200">
            <ShieldCheck size={14} />
            CLUBES E ATLETAS
          </span>

          <h1 className="mt-4 max-w-5xl text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
            Clubes e Atletas
          </h1>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/72 md:text-base">
            Consulte a listagem de equipes e atletas por campeonato/categoria, e cadastre novos clubes e atletas de forma manual.
          </p>
        </div>
      </div>

      {params.sucesso && (
        <div className="rounded-3xl border border-green-300/25 bg-green-400/10 p-4 text-sm font-black text-green-100 backdrop-blur">
          {params.sucesso === "equipe-cadastrada" && "Clube cadastrado manualmente com sucesso!"}
          {params.sucesso === "jogador-cadastrado" && "Atleta inscrito com sucesso!"}
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

      <AdminClubesControl
        campeonatos={campeonatos}
        inscricoes={inscricoes}
        jogadores={jogadores}
      />
    </div>
  );
}
