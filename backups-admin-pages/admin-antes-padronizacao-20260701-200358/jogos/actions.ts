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

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("jogos")
    .update({
      gols_mandante: Number(golsMandante),
      gols_visitante: Number(golsVisitante),
      status: "realizado",
    })
    .eq("id", jogoId);

  if (error) {
    console.error(error);
    redirect(`/admin/jogos?erro=resultado-salvar&detalhe=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/jogos");
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
