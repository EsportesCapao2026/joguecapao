"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirMaster } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function atualizarSenhaAdmin(formData: FormData) {
  // Garantir que apenas o master consegue executar
  await exigirMaster();

  const newPassword = String(formData.get("new_password") || "").trim();
  const confirmPassword = String(formData.get("confirm_password") || "").trim();

  if (!newPassword || !confirmPassword) {
    redirect("/admin/configuracoes?erro=campos-obrigatorios");
  }

  if (newPassword !== confirmPassword) {
    redirect("/admin/configuracoes?erro=senhas-diferentes");
  }

  if (newPassword.length < 6) {
    redirect("/admin/configuracoes?erro=senha-curta");
  }

  const supabase = getSupabaseAdmin();

  // Salvar a nova senha na tabela configuracoes
  const { error } = await supabase
    .from("configuracoes")
    .upsert({
      chave: "admin_password",
      valor: { password: newPassword },
    });

  if (error) {
    console.error("Erro ao atualizar senha do admin:", error);
    redirect(`/admin/configuracoes?erro=salvar&detalhe=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/configuracoes");

  redirect("/admin/configuracoes?sucesso=senha-atualizada");
}

export async function atualizarSenhaMaster(formData: FormData) {
  // Garantir que apenas o master consegue executar
  await exigirMaster();

  const newPassword = String(formData.get("new_password_master") || "").trim();
  const confirmPassword = String(formData.get("confirm_password_master") || "").trim();

  if (!newPassword || !confirmPassword) {
    redirect("/admin/configuracoes?erro=campos-obrigatorios");
  }

  if (newPassword !== confirmPassword) {
    redirect("/admin/configuracoes?erro=senhas-diferentes");
  }

  if (newPassword.length < 6) {
    redirect("/admin/configuracoes?erro=senha-curta");
  }

  const supabase = getSupabaseAdmin();

  // Salvar a nova senha Master na tabela configuracoes
  const { error } = await supabase
    .from("configuracoes")
    .upsert({
      chave: "master_password",
      valor: { password: newPassword },
    });

  if (error) {
    console.error("Erro ao atualizar senha do master:", error);
    redirect(`/admin/configuracoes?erro=salvar-master&detalhe=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/configuracoes");

  redirect("/admin/configuracoes?sucesso=senha-master-atualizada");
}
