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

export async function cadastrarRegraMunicipal(formData: FormData) {
  await exigirAdmin();

  const campeonatoNome = String(formData.get("campeonato_nome") || "").trim();
  const titulo = String(formData.get("titulo") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim();
  const artigoReferencia = String(formData.get("artigo_referencia") || "").trim();
  const origem = String(formData.get("origem") || "regulamento_municipal").trim();

  if (!titulo || !descricao) {
    redirect("/admin/regras?erro=campos");
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("regras_campeonatos").insert({
    campeonato_nome: campeonatoNome || null,
    titulo,
    descricao,
    artigo_referencia: artigoReferencia || null,
    origem,
    ativo: true,
  });

  if (error) {
    console.error(error);
    redirect("/admin/regras?erro=salvar");
  }

  revalidatePath("/admin/regras");
  revalidatePath("/regras");
  revalidatePath("/regras/campeonatos");
  revalidatePath("/regras/campeonatos/ler");

  redirect("/admin/regras?sucesso=regra");
}

export async function alterarStatusCbjd(formData: FormData) {
  await exigirAdmin();

  const ativo = String(formData.get("ativo")) === "true";
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("configuracoes")
    .upsert(
      {
        chave: "cbjd_config",
        valor: {
          ativo,
          titulo: "CBJD como regra subsidiária",
          descricao:
            "Na ausência de previsão específica no regulamento municipal, aplica-se subsidiariamente o Código Brasileiro de Justiça Desportiva.",
          observacao:
            "O regulamento próprio do campeonato prevalece. O CBJD será utilizado como base complementar em casos omissos.",
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "chave" }
    );

  if (error) {
    console.error(error);
    redirect("/admin/regras?erro=cbjd");
  }

  revalidatePath("/admin/regras");
  revalidatePath("/regras");

  redirect("/admin/regras?sucesso=cbjd");
}

export async function desativarRegraMunicipal(formData: FormData) {
  await exigirAdmin();

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    redirect("/admin/regras?erro=id");
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("regras_campeonatos")
    .update({
      ativo: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    redirect("/admin/regras?erro=desativar");
  }

  revalidatePath("/admin/regras");
  revalidatePath("/regras");
  revalidatePath("/regras/campeonatos");
  revalidatePath("/regras/campeonatos/ler");

  redirect("/admin/regras?sucesso=desativada");
}
