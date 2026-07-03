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

export async function julgarDenuncia(formData: FormData) {
  await exigirAdmin();

  const id = String(formData.get("id") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const decisao = String(formData.get("decisao") || "").trim();

  if (!id || !status) {
    redirect("/admin/denuncias?erro=campos-obrigatorios");
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("denuncias")
    .update({
      status,
      decisao: decisao || null,
    })
    .eq("id", id);

  if (error) {
    console.error("Erro ao julgar denúncia:", error);
    redirect(`/admin/denuncias?erro=salvar&detalhe=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/denuncias");
  redirect("/admin/denuncias?sucesso=julgada");
}
