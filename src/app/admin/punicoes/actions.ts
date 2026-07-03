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

export async function cadastrarPunicao(formData: FormData) {
  await exigirAdmin();

  const campeonatoId = String(formData.get("campeonato_id") || "").trim();
  const equipeId = String(formData.get("equipe_id") || "").trim();
  const equipeNome = String(formData.get("equipe_nome") || "").trim();
  const atletaId = String(formData.get("atleta_id") || "").trim();
  const atletaNome = String(formData.get("atleta_nome") || "").trim();
  const categoriaNome = String(formData.get("categoria_nome") || "").trim();
  const serieNome = String(formData.get("serie_nome") || "").trim();
  const motivo = String(formData.get("motivo") || "").trim();
  const artigoCbjd = String(formData.get("artigo_cbjd") || "").trim();
  const dataInicio = String(formData.get("data_inicio") || "").trim();
  const dataFim = String(formData.get("data_fim") || "").trim();
  const jogosSuspensaoRaw = String(formData.get("jogos_suspensao") || "").trim();
  const status = String(formData.get("status") || "Ativa").trim();
  const origem = String(formData.get("origem") || "regulamento_municipal").trim();

  if (!campeonatoId || !equipeId || !atletaId || !motivo) {
    redirect("/admin/punicoes?erro=campos-obrigatorios");
  }

  const jogosSuspensao = jogosSuspensaoRaw ? Number(jogosSuspensaoRaw) : null;

  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("punicoes").insert({
    campeonato_id: campeonatoId,
    equipe_id: equipeId,
    equipe_nome: equipeNome || null,
    atleta_id: atletaId,
    atleta_nome: atletaNome || null,
    categoria_nome: categoriaNome || null,
    serie_nome: serieNome || null,
    motivo,
    artigo_cbjd: artigoCbjd || null,
    data_inicio: dataInicio || null,
    data_fim: dataFim || null,
    jogos_suspensao: jogosSuspensao,
    status,
    origem,
  });

  if (error) {
    console.error("Erro ao cadastrar punição:", error);
    redirect(`/admin/punicoes?erro=salvar&detalhe=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/punicoes");
  revalidatePath("/punicoes");

  redirect("/admin/punicoes?sucesso=cadastrada");
}

export async function removerPunicao(formData: FormData) {
  await exigirAdmin();

  const punicaoId = String(formData.get("punicao_id") || "").trim();

  if (!punicaoId) {
    redirect("/admin/punicoes?erro=id-invalido");
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("punicoes")
    .delete()
    .eq("id", punicaoId);

  if (error) {
    console.error("Erro ao remover punição:", error);
    redirect(`/admin/punicoes?erro=remover&detalhe=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/punicoes");
  revalidatePath("/punicoes");

  redirect("/admin/punicoes?sucesso=removida");
}
