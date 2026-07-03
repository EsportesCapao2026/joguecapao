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

export async function alterarStatusInscricao(formData: FormData) {
  await exigirAdmin();

  const inscricaoId = String(formData.get("inscricao_id") || "").trim();
  const status = String(formData.get("status") || "").trim();

  if (!inscricaoId || !status) {
    redirect("/admin/inscricoes?erro=dados");
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("inscricoes")
    .update({
      status,
    })
    .eq("id", inscricaoId);

  if (error) {
    console.error(error);
    redirect("/admin/inscricoes?erro=status");
  }

  revalidatePath("/admin/inscricoes");
  revalidatePath("/campeonatos");

  redirect(`/admin/inscricoes?sucesso=${status}`);
}

export async function alterarStatusJogador(formData: FormData) {
  await exigirAdmin();

  const jogadorId = String(formData.get("jogador_id") || "").trim();
  const status = String(formData.get("status") || "").trim();

  if (!jogadorId || !status) {
    redirect("/admin/inscricoes?erro=jogador");
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("inscricao_jogadores")
    .update({
      status,
    })
    .eq("id", jogadorId);

  if (error) {
    console.error(error);
    redirect("/admin/inscricoes?erro=jogador-status");
  }

  revalidatePath("/admin/inscricoes");

  redirect("/admin/inscricoes?sucesso=jogador");
}
