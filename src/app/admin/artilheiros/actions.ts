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

export async function registrarGols(formData: FormData) {
  await exigirAdmin();

  const campeonatoId = String(formData.get("campeonato_id") || "").trim();
  const jogoId = String(formData.get("jogo_id") || "").trim();
  const equipeId = String(formData.get("equipe_id") || "").trim();
  const atletaId = String(formData.get("atleta_id") || "").trim();
  const quantidadeRaw = String(formData.get("quantidade") || "").trim();

  const atletaNome = String(formData.get("atleta_nome") || "").trim();
  const equipeNome = String(formData.get("equipe_nome") || "").trim();
  const categoriaNome = String(formData.get("categoria_nome") || "").trim();
  const serieNome = String(formData.get("serie_nome") || "").trim();

  if (!campeonatoId || !jogoId || !equipeId || !atletaId || !quantidadeRaw) {
    redirect("/admin/artilheiros?erro=campos-obrigatorios");
  }

  const quantidade = Number(quantidadeRaw);
  if (isNaN(quantidade) || quantidade <= 0) {
    redirect("/admin/artilheiros?erro=quantidade-invalida");
  }

  const supabase = getSupabaseAdmin();

  // Registrar os gols
  const { error } = await supabase.from("gols").insert({
    campeonato_id: campeonatoId,
    jogo_id: jogoId,
    equipe_id: equipeId,
    atleta_id: atletaId,
    atleta_nome: atletaNome || null,
    equipe_nome: equipeNome || null,
    quantidade,
    categoria_nome: categoriaNome || null,
    serie_nome: serieNome || null,
  });

  if (error) {
    console.error("Erro ao registrar gols:", error);
    redirect(`/admin/artilheiros?erro=salvar&detalhe=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/artilheiros");
  revalidatePath(`/campeonatos/${campeonatoId}`);

  redirect("/admin/artilheiros?sucesso=registrado");
}

export async function removerRegistroGols(formData: FormData) {
  await exigirAdmin();

  const golId = String(formData.get("gol_id") || "").trim();
  const campeonatoId = String(formData.get("campeonato_id") || "").trim();

  if (!golId) {
    redirect("/admin/artilheiros?erro=id-invalido");
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("gols")
    .delete()
    .eq("id", golId);

  if (error) {
    console.error("Erro ao remover registro de gols:", error);
    redirect(`/admin/artilheiros?erro=remover&detalhe=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/artilheiros");
  if (campeonatoId) {
    revalidatePath(`/campeonatos/${campeonatoId}`);
  }

  redirect("/admin/artilheiros?sucesso=removido");
}
