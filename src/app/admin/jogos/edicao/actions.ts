"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isAdminSessionValid } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { parseJogoObservacoes, type TipoCartao } from "@/lib/tempoReal";

async function exigirAdmin() {
  const cookieStore = await cookies();
  const sessao = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!isAdminSessionValid(sessao)) {
    redirect("/admin?bloqueado=1");
  }
}

type SupabaseAdminClient = ReturnType<typeof getSupabaseAdmin>;

type JogadorSync = {
  id: string;
  inscricao_id: string | null;
  nome: string | null;
  numero_camisa: string | null;
  documento_numero: string | null;
  documento_arquivo_url: string | null;
};

type AtletaTabela = {
  id: string;
  equipe_id: string | null;
  nome: string | null;
};

type InscricaoEquipeSync = {
  id: string;
  campeonato_id: string | null;
  nome_equipe: string | null;
  nome_time: string | null;
  categoria: string | null;
  serie: string | null;
  logo_url: string | null;
};

type GolEditavel = {
  equipe_id: string;
  atleta_id: string;
  atleta_nome: string;
  minuto: number;
};

type CartaoEditavel = {
  cartao_id: string;
  equipe_id: string;
  atleta_id: string;
  atleta_nome: string;
  tipo: TipoCartao;
  minuto: number;
};

function valores(formData: FormData, nome: string) {
  return formData.getAll(nome).map((valor) => String(valor || "").trim());
}

function numeroInteiro(valor: FormDataEntryValue | null, fallback = 0) {
  const numero = Number(String(valor || "").trim());
  if (!Number.isFinite(numero)) return fallback;
  return Math.max(0, Math.floor(numero));
}

function nomeEquipePorId(
  equipeId: string,
  mandanteId: string,
  mandanteNome: string,
  visitanteId: string,
  visitanteNome: string
) {
  if (equipeId === mandanteId) return mandanteNome;
  if (equipeId === visitanteId) return visitanteNome;
  return "Equipe";
}

async function buscarAtletasPorId(
  supabase: SupabaseAdminClient,
  campeonatoId: string,
  atletaIds: string[],
  equipeIds: string[]
) {
  const atletasUnicos = Array.from(new Set(atletaIds.filter(Boolean)));
  const equipesUnicas = Array.from(new Set(equipeIds.filter(Boolean)));
  const atletaPorId = new Map<string, { nome: string; equipe_id: string | null }>();

  if (equipesUnicas.length > 0) {
    const { data: inscricoesData } = await supabase
      .from("inscricoes")
      .select("id, campeonato_id, nome_equipe, nome_time, categoria, serie, logo_url")
      .in("id", equipesUnicas);

    const inscricoes = (inscricoesData || []) as InscricaoEquipeSync[];

    if (inscricoes.length > 0) {
      const { error } = await supabase.from("equipes").upsert(
        inscricoes.map((inscricao) => ({
          id: inscricao.id,
          campeonato_id: inscricao.campeonato_id || campeonatoId,
          nome: inscricao.nome_equipe || inscricao.nome_time || "Equipe sem nome",
          categoria_nome: inscricao.categoria,
          serie_nome: inscricao.serie,
          logo_url: inscricao.logo_url,
          status: "ativo",
        }))
      );

      if (error) {
        throw new Error(`Erro ao sincronizar equipes: ${error.message}`);
      }
    }
  }

  if (atletasUnicos.length === 0) return atletaPorId;

  const { data: jogadoresData } = await supabase
    .from("inscricao_jogadores")
    .select("id, inscricao_id, nome, numero_camisa, documento_numero, documento_arquivo_url")
    .in("id", atletasUnicos);

  const jogadores = (jogadoresData || []) as JogadorSync[];

  if (jogadores.length > 0) {
    const atletasParaUpsert = jogadores.map((jogador) => ({
      id: jogador.id,
      equipe_id: jogador.inscricao_id,
      campeonato_id: campeonatoId,
      nome: jogador.nome || "Atleta não informado",
      documento: jogador.documento_numero,
      numero_camisa: jogador.numero_camisa,
      documento_url: jogador.documento_arquivo_url,
      status: "ativo",
    }));

    const { error } = await supabase.from("atletas").upsert(atletasParaUpsert);

    if (error) {
      throw new Error(`Erro ao sincronizar atletas: ${error.message}`);
    }

    jogadores.forEach((jogador) => {
      atletaPorId.set(jogador.id, {
        nome: jogador.nome || "Atleta não informado",
        equipe_id: jogador.inscricao_id,
      });
    });
  }

  const faltantes = atletasUnicos.filter((atletaId) => !atletaPorId.has(atletaId));

  if (faltantes.length > 0) {
    const { data: atletasData } = await supabase
      .from("atletas")
      .select("id, equipe_id, nome")
      .in("id", faltantes);

    const atletas = (atletasData || []) as AtletaTabela[];

    atletas.forEach((atleta) => {
      atletaPorId.set(atleta.id, {
        nome: atleta.nome || "Atleta não informado",
        equipe_id: atleta.equipe_id,
      });
    });
  }

  return atletaPorId;
}

function montarGols(
  formData: FormData,
  atletaPorId: Map<string, { nome: string; equipe_id: string | null }>
) {
  const equipes = valores(formData, "gol_equipe_id");
  const atletas = valores(formData, "gol_atleta_id");
  const minutos = valores(formData, "gol_minuto");

  return equipes
    .map<GolEditavel | null>((equipeId, index) => {
      const atletaId = atletas[index] || "";
      if (!equipeId || !atletaId) return null;

      return {
        equipe_id: equipeId,
        atleta_id: atletaId,
        atleta_nome: atletaPorId.get(atletaId)?.nome || "Atleta não informado",
        minuto: Math.max(0, Number(minutos[index] || 0) || 0),
      };
    })
    .filter((gol): gol is GolEditavel => gol !== null);
}

function montarCartoes(
  formData: FormData,
  atletaPorId: Map<string, { nome: string; equipe_id: string | null }>
) {
  const ids = valores(formData, "cartao_id");
  const equipes = valores(formData, "cartao_equipe_id");
  const atletas = valores(formData, "cartao_atleta_id");
  const tipos = valores(formData, "cartao_tipo");
  const minutos = valores(formData, "cartao_minuto");

  return equipes
    .map<CartaoEditavel | null>((equipeId, index) => {
      const atletaId = atletas[index] || "";
      const tipo = tipos[index] === "vermelho" ? "vermelho" : "amarelo";
      if (!equipeId || !atletaId) return null;

      return {
        cartao_id: ids[index] || crypto.randomUUID(),
        equipe_id: equipeId,
        atleta_id: atletaId,
        atleta_nome: atletaPorId.get(atletaId)?.nome || "Atleta não informado",
        tipo,
        minuto: Math.max(0, Number(minutos[index] || 0) || 0),
      };
    })
    .filter((cartao): cartao is CartaoEditavel => cartao !== null);
}

function revalidarJogo(jogoId: string, campeonatoId: string) {
  revalidatePath("/");
  revalidatePath("/admin/jogos");
  revalidatePath("/admin/artilheiros");
  revalidatePath(`/admin/jogos/tempo-real/${jogoId}`);
  revalidatePath(`/admin/jogos/sumula/${jogoId}`);
  if (campeonatoId) {
    revalidatePath(`/campeonatos/${campeonatoId}`);
  }
}

export async function editarJogoCompleto(formData: FormData) {
  await exigirAdmin();
  const supabase = getSupabaseAdmin();

  const jogoId = String(formData.get("jogo_id") || "").trim();
  const campeonatoId = String(formData.get("campeonato_id") || "").trim();
  const categoria = String(formData.get("categoria") || "").trim();
  const serie = String(formData.get("serie") || "").trim();
  const equipeMandanteId = String(formData.get("equipe_mandante_id") || "").trim();
  const equipeVisitanteId = String(formData.get("equipe_visitante_id") || "").trim();
  const equipeMandanteNome = String(formData.get("equipe_mandante_nome") || "").trim();
  const equipeVisitanteNome = String(formData.get("equipe_visitante_nome") || "").trim();
  const status = String(formData.get("status") || "agendado").trim();
  const dataJogo = String(formData.get("data_jogo") || "").trim();
  const horario = String(formData.get("horario") || "").trim();
  const local = String(formData.get("local") || "").trim();
  const rodada = String(formData.get("rodada") || "").trim();
  const golsMandante = numeroInteiro(formData.get("gols_mandante"));
  const golsVisitante = numeroInteiro(formData.get("gols_visitante"));

  if (
    !jogoId ||
    !campeonatoId ||
    !equipeMandanteId ||
    !equipeVisitanteId ||
    !equipeMandanteNome ||
    !equipeVisitanteNome
  ) {
    redirect("/admin/jogos?erro=campos-obrigatorios");
  }

  if (equipeMandanteId === equipeVisitanteId) {
    redirect("/admin/jogos?erro=equipes-iguais");
  }

  const { data: jogoAtual } = await supabase
    .from("jogos")
    .select("observacoes")
    .eq("id", jogoId)
    .single();

  const todosAtletas = [
    ...valores(formData, "gol_atleta_id"),
    ...valores(formData, "cartao_atleta_id"),
  ].filter(Boolean);

  let atletaPorId: Map<string, { nome: string; equipe_id: string | null }>;

  try {
    atletaPorId = await buscarAtletasPorId(
      supabase,
      campeonatoId,
      todosAtletas,
      [equipeMandanteId, equipeVisitanteId]
    );
  } catch (error) {
    console.error("Erro ao preparar edição do jogo:", error);
    redirect(
      `/admin/jogos?erro=preparar-edicao&detalhe=${encodeURIComponent(
        error instanceof Error ? error.message : "Erro desconhecido"
      )}`
    );
  }

  const gols = montarGols(formData, atletaPorId);
  const cartoes = montarCartoes(formData, atletaPorId);
  const observacoes = parseJogoObservacoes(jogoAtual?.observacoes);

  if (status === "em_andamento") {
    observacoes.tempo_real = {
      ...(observacoes.tempo_real || {}),
      status: "em_andamento",
      rodando: observacoes.tempo_real?.rodando ?? false,
      minuto: observacoes.tempo_real?.minuto ?? 0,
      segundo: observacoes.tempo_real?.segundo ?? 0,
      periodo: observacoes.tempo_real?.periodo ?? "1T",
      ultima_atualizacao: new Date().toISOString(),
    };
  }

  if (status === "realizado" && observacoes.tempo_real) {
    observacoes.tempo_real.status = "finalizado";
    observacoes.tempo_real.rodando = false;
    observacoes.tempo_real.ultima_atualizacao = new Date().toISOString();
  }

  const { error: deleteGolsError } = await supabase
    .from("gols")
    .delete()
    .eq("jogo_id", jogoId);

  if (deleteGolsError) {
    console.error("Erro ao limpar gols do jogo:", deleteGolsError);
    redirect(`/admin/jogos?erro=limpar-gols&detalhe=${encodeURIComponent(deleteGolsError.message)}`);
  }

  const golsParaInserir = gols.map((gol) => ({
    campeonato_id: campeonatoId,
    jogo_id: jogoId,
    equipe_id: gol.equipe_id,
    atleta_id: gol.atleta_id,
    atleta_nome: gol.atleta_nome,
    equipe_nome: nomeEquipePorId(
      gol.equipe_id,
      equipeMandanteId,
      equipeMandanteNome,
      equipeVisitanteId,
      equipeVisitanteNome
    ),
    quantidade: 1,
    categoria_nome: categoria || null,
    serie_nome: serie || null,
  }));

  const golsInseridos = golsParaInserir.length > 0
    ? await supabase.from("gols").insert(golsParaInserir).select("id")
    : { data: [], error: null };

  if (golsInseridos.error) {
    console.error("Erro ao recriar gols do jogo:", golsInseridos.error);
    redirect(`/admin/jogos?erro=salvar-gols&detalhe=${encodeURIComponent(golsInseridos.error.message)}`);
  }

  observacoes.gols_detalhe = gols.map((gol, index) => ({
    gol_id: golsInseridos.data?.[index]?.id || crypto.randomUUID(),
    minuto: gol.minuto,
    equipe_id: gol.equipe_id,
    atleta_id: gol.atleta_id,
    atleta_nome: gol.atleta_nome,
  }));

  observacoes.cartoes_detalhe = cartoes.map((cartao) => ({
    cartao_id: cartao.cartao_id,
    minuto: cartao.minuto,
    equipe_id: cartao.equipe_id,
    atleta_id: cartao.atleta_id,
    atleta_nome: cartao.atleta_nome,
    tipo: cartao.tipo,
  }));

  const { error } = await supabase
    .from("jogos")
    .update({
      campeonato_id: campeonatoId,
      categoria: categoria || null,
      serie: serie || null,
      equipe_mandante_id: equipeMandanteId,
      equipe_visitante_id: equipeVisitanteId,
      equipe_mandante_nome: equipeMandanteNome,
      equipe_visitante_nome: equipeVisitanteNome,
      gols_mandante: golsMandante,
      gols_visitante: golsVisitante,
      status,
      data_jogo: dataJogo || null,
      horario: horario || null,
      local: local || null,
      rodada: rodada || null,
      observacoes: JSON.stringify(observacoes),
    })
    .eq("id", jogoId);

  if (error) {
    console.error("Erro ao editar jogo:", error);
    redirect(`/admin/jogos?erro=editar-jogo&detalhe=${encodeURIComponent(error.message)}`);
  }

  revalidarJogo(jogoId, campeonatoId);
  redirect("/admin/jogos?sucesso=jogo-editado");
}
