"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isAdminSessionValid } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

async function exigirAdmin() {
  const cookieStore = await cookies();
  const sessao = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!isAdminSessionValid(sessao)) {
    redirect("/admin?bloqueado=1");
  }
}

type SupabaseAdminClient = ReturnType<typeof getSupabaseAdmin>;

type InscricaoEquipeSync = {
  id: string;
  campeonato_id: string | null;
  nome_equipe: string | null;
  nome_time: string | null;
  categoria: string | null;
  serie: string | null;
  logo_url: string | null;
};

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
  numero_camisa: string | null;
};

function valoresFormData(formData: FormData, nome: string) {
  return formData
    .getAll(nome)
    .map((valor) => String(valor || "").trim())
    .filter(Boolean);
}

async function sincronizarCadastrosParaGols(
  supabase: SupabaseAdminClient,
  campeonatoId: string,
  equipeIds: string[],
  atletaIds: string[]
) {
  const equipesUnicas = Array.from(new Set(equipeIds.filter(Boolean)));
  const atletasUnicos = Array.from(new Set(atletaIds.filter(Boolean)));
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
        console.error("Erro ao sincronizar equipes para artilharia:", error);
        redirect(`/admin/jogos?erro=sincronizar-equipes&detalhe=${encodeURIComponent(error.message)}`);
      }
    }
  }

  if (atletasUnicos.length === 0) {
    return atletaPorId;
  }

  const { data: jogadoresData } = await supabase
    .from("inscricao_jogadores")
    .select("id, inscricao_id, nome, numero_camisa, documento_numero, documento_arquivo_url")
    .in("id", atletasUnicos);

  const jogadores = (jogadoresData || []) as JogadorSync[];

  if (jogadores.length > 0) {
    const atletasParaUpsert = jogadores
      .filter((jogador) => jogador.nome)
      .map((jogador) => ({
        id: jogador.id,
        equipe_id: jogador.inscricao_id,
        campeonato_id: campeonatoId,
        nome: jogador.nome || "Atleta sem nome",
        documento: jogador.documento_numero,
        numero_camisa: jogador.numero_camisa,
        documento_url: jogador.documento_arquivo_url,
        status: "ativo",
      }));

    if (atletasParaUpsert.length > 0) {
      const { error } = await supabase.from("atletas").upsert(atletasParaUpsert);

      if (error) {
        console.error("Erro ao sincronizar atletas para artilharia:", error);
        redirect(`/admin/jogos?erro=sincronizar-atletas&detalhe=${encodeURIComponent(error.message)}`);
      }
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
      .select("id, equipe_id, nome, numero_camisa")
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

async function sincronizarArtilhariaResultado(
  supabase: SupabaseAdminClient,
  formData: FormData,
  jogoId: string,
  campeonatoId: string,
  golsMandante: number,
  golsVisitante: number
) {
  if (formData.get("sincronizar_artilheiros") !== "true") return;

  const mandanteIds = valoresFormData(formData, "gols_mandante_atleta_id");
  const visitanteIds = valoresFormData(formData, "gols_visitante_atleta_id");
  const equipeMandanteId = String(formData.get("equipe_mandante_id") || "").trim();
  const equipeVisitanteId = String(formData.get("equipe_visitante_id") || "").trim();
  const equipeMandanteNome = String(formData.get("equipe_mandante_nome") || "").trim();
  const equipeVisitanteNome = String(formData.get("equipe_visitante_nome") || "").trim();
  const categoriaNome = String(formData.get("categoria_nome") || "").trim();
  const serieNome = String(formData.get("serie_nome") || "").trim();

  if (
    mandanteIds.length !== golsMandante ||
    visitanteIds.length !== golsVisitante ||
    (golsMandante > 0 && !equipeMandanteId) ||
    (golsVisitante > 0 && !equipeVisitanteId)
  ) {
    redirect("/admin/jogos?erro=autores-gols");
  }

  const atletaPorId = await sincronizarCadastrosParaGols(
    supabase,
    campeonatoId,
    [equipeMandanteId, equipeVisitanteId],
    [...mandanteIds, ...visitanteIds]
  );

  const { error: deleteError } = await supabase
    .from("gols")
    .delete()
    .eq("jogo_id", jogoId);

  if (deleteError) {
    console.error("Erro ao limpar artilharia do jogo:", deleteError);
    redirect(`/admin/jogos?erro=limpar-artilharia&detalhe=${encodeURIComponent(deleteError.message)}`);
  }

  const registros = [
    ...mandanteIds.map((atletaId) => ({
      campeonato_id: campeonatoId,
      jogo_id: jogoId,
      equipe_id: equipeMandanteId,
      atleta_id: atletaId,
      atleta_nome: atletaPorId.get(atletaId)?.nome || "Atleta não informado",
      equipe_nome: equipeMandanteNome || "Mandante",
      quantidade: 1,
      categoria_nome: categoriaNome || null,
      serie_nome: serieNome || null,
    })),
    ...visitanteIds.map((atletaId) => ({
      campeonato_id: campeonatoId,
      jogo_id: jogoId,
      equipe_id: equipeVisitanteId,
      atleta_id: atletaId,
      atleta_nome: atletaPorId.get(atletaId)?.nome || "Atleta não informado",
      equipe_nome: equipeVisitanteNome || "Visitante",
      quantidade: 1,
      categoria_nome: categoriaNome || null,
      serie_nome: serieNome || null,
    })),
  ];

  if (registros.length === 0) return;

  const { error: insertError } = await supabase.from("gols").insert(registros);

  if (insertError) {
    console.error("Erro ao atualizar artilharia do jogo:", insertError);
    redirect(`/admin/jogos?erro=salvar-artilharia&detalhe=${encodeURIComponent(insertError.message)}`);
  }
}

export async function cadastrarJogo(formData: FormData) {
  await exigirAdmin();

  const campeonatoId = String(formData.get("campeonato_id") || "").trim();
  const categoria = String(formData.get("categoria") || "").trim();
  const serie = String(formData.get("serie") || "").trim();

  const equipeMandanteId = String(formData.get("equipe_mandante_id") || "").trim();
  const equipeVisitanteId = String(formData.get("equipe_visitante_id") || "").trim();

  const equipeMandanteNome = String(formData.get("equipe_mandante_nome") || "").trim();
  const equipeVisitanteNome = String(formData.get("equipe_visitante_nome") || "").trim();

  const dataJogo = String(formData.get("data_jogo") || "").trim();
  const horario = String(formData.get("horario") || "").trim();
  const local = String(formData.get("local") || "").trim();
  const rodada = String(formData.get("rodada") || "").trim();
  const observacoes = String(formData.get("observacoes") || "").trim();

  if (
    !campeonatoId ||
    !categoria ||
    !equipeMandanteId ||
    !equipeVisitanteId ||
    !equipeMandanteNome ||
    !equipeVisitanteNome
  ) {
    redirect("/admin/jogos?erro=campos");
  }

  if (equipeMandanteId === equipeVisitanteId) {
    redirect("/admin/jogos?erro=equipes-iguais");
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("jogos").insert({
    campeonato_id: campeonatoId,
    categoria,
    serie: serie || null,
    equipe_mandante_id: equipeMandanteId,
    equipe_visitante_id: equipeVisitanteId,
    equipe_mandante_nome: equipeMandanteNome,
    equipe_visitante_nome: equipeVisitanteNome,
    data_jogo: dataJogo || null,
    horario: horario || null,
    local: local || null,
    rodada: rodada || null,
    gols_mandante: null,
    gols_visitante: null,
    status: "agendado",
    observacoes: observacoes || null,
  });

  if (error) {
    console.error(error);
    redirect(`/admin/jogos?erro=salvar&detalhe=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/jogos");
  revalidatePath(`/campeonatos/${campeonatoId}`);

  redirect("/admin/jogos?sucesso=cadastrado");
}

export async function atualizarResultadoJogo(formData: FormData) {
  await exigirAdmin();

  const jogoId = String(formData.get("jogo_id") || "").trim();
  const campeonatoId = String(formData.get("campeonato_id") || "").trim();

  const golsMandante = String(formData.get("gols_mandante") || "").trim();
  const golsVisitante = String(formData.get("gols_visitante") || "").trim();

  if (!jogoId || !campeonatoId || golsMandante === "" || golsVisitante === "") {
    redirect("/admin/jogos?erro=resultado");
  }

  const golsMandanteNumero = Number(golsMandante);
  const golsVisitanteNumero = Number(golsVisitante);

  if (
    !Number.isInteger(golsMandanteNumero) ||
    !Number.isInteger(golsVisitanteNumero) ||
    golsMandanteNumero < 0 ||
    golsVisitanteNumero < 0
  ) {
    redirect("/admin/jogos?erro=placar-invalido");
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("jogos")
    .update({
      gols_mandante: golsMandanteNumero,
      gols_visitante: golsVisitanteNumero,
      status: "realizado",
    })
    .eq("id", jogoId);

  if (error) {
    console.error(error);
    redirect(`/admin/jogos?erro=resultado-salvar&detalhe=${encodeURIComponent(error.message)}`);
  }

  await sincronizarArtilhariaResultado(
    supabase,
    formData,
    jogoId,
    campeonatoId,
    golsMandanteNumero,
    golsVisitanteNumero
  );

  revalidatePath("/admin/jogos");
  revalidatePath("/admin/artilheiros");
  revalidatePath(`/campeonatos/${campeonatoId}`);

  redirect("/admin/jogos?sucesso=resultado");
}

export async function alterarStatusJogo(formData: FormData) {
  await exigirAdmin();

  const jogoId = String(formData.get("jogo_id") || "").trim();
  const campeonatoId = String(formData.get("campeonato_id") || "").trim();
  const status = String(formData.get("status") || "").trim();

  if (!jogoId || !campeonatoId || !status) {
    redirect("/admin/jogos?erro=status");
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("jogos")
    .update({
      status,
    })
    .eq("id", jogoId);

  if (error) {
    console.error(error);
    redirect(`/admin/jogos?erro=status-salvar&detalhe=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/jogos");
  revalidatePath(`/campeonatos/${campeonatoId}`);

  redirect("/admin/jogos?sucesso=status");
}

export async function excluirJogo(formData: FormData) {
  await exigirAdmin();

  const jogoId = String(formData.get("jogo_id") || "").trim();
  const campeonatoIdForm = String(formData.get("campeonato_id") || "").trim();

  if (!jogoId) {
    redirect("/admin/jogos?erro=jogo-id");
  }

  const supabase = getSupabaseAdmin();

  const { data: jogo, error: jogoError } = await supabase
    .from("jogos")
    .select("id, campeonato_id")
    .eq("id", jogoId)
    .single();

  if (jogoError || !jogo) {
    console.error("Erro ao buscar jogo para exclusão:", jogoError);
    redirect("/admin/jogos?erro=jogo-nao-encontrado");
  }

  const campeonatoId = jogo.campeonato_id || campeonatoIdForm;

  const { error: golsError } = await supabase
    .from("gols")
    .delete()
    .eq("jogo_id", jogoId);

  if (golsError) {
    console.error("Erro ao excluir gols do jogo:", golsError);
    redirect(`/admin/jogos?erro=excluir-gols&detalhe=${encodeURIComponent(golsError.message)}`);
  }

  const { error: denunciasError } = await supabase
    .from("denuncias")
    .update({ jogo_id: null })
    .eq("jogo_id", jogoId);

  if (denunciasError) {
    console.error("Erro ao desvincular denúncias do jogo:", denunciasError);
    redirect(`/admin/jogos?erro=desvincular-denuncias&detalhe=${encodeURIComponent(denunciasError.message)}`);
  }

  const { error } = await supabase
    .from("jogos")
    .delete()
    .eq("id", jogoId);

  if (error) {
    console.error("Erro ao excluir jogo:", error);
    redirect(`/admin/jogos?erro=excluir-jogo&detalhe=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/jogos");
  revalidatePath("/admin/resultados");
  revalidatePath("/admin/artilheiros");
  revalidatePath("/denuncias");

  if (campeonatoId) {
    revalidatePath(`/campeonatos/${campeonatoId}`);
  }

  redirect("/admin/jogos?sucesso=excluido");
}
