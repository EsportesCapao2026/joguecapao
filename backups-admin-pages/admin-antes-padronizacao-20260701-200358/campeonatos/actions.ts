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

function textoParaLista(texto: string) {
  return texto
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function removerDuplicados(lista: string[]) {
  return Array.from(new Set(lista));
}

function montarCategoria(formData: FormData, prefixo: string, nome: string) {
  const ativa = String(formData.get(`${prefixo}_ativa`)) === "on";

  if (!ativa) {
    return null;
  }

  const seriesAtivas = String(formData.get(`${prefixo}_series_ativas`)) === "on";

  const series: string[] = [];

  if (String(formData.get(`${prefixo}_serie_ouro`)) === "on") {
    series.push("Série Ouro");
  }

  if (String(formData.get(`${prefixo}_serie_prata`)) === "on") {
    series.push("Série Prata");
  }

  if (String(formData.get(`${prefixo}_serie_bronze`)) === "on") {
    series.push("Série Bronze");
  }

  const seriesExtras = textoParaLista(
    String(formData.get(`${prefixo}_series_extras`) || "")
  );

  series.push(...seriesExtras);

  return {
    nome,
    ativo: true,
    series_ativas: seriesAtivas,
    series_lista: seriesAtivas ? removerDuplicados(series) : [],
  };
}

export async function cadastrarCampeonato(formData: FormData) {
  await exigirAdmin();

  const nome = String(formData.get("nome") || "").trim();
  const modalidade = String(formData.get("modalidade") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim();
  const status = String(formData.get("status") || "ativo").trim();

  const inscricoesAbertas = String(formData.get("inscricoes_abertas")) === "on";

  const dataInicio = String(formData.get("data_inicio") || "").trim();
  const dataFim = String(formData.get("data_fim") || "").trim();

  if (!nome) {
    redirect("/admin/campeonatos?erro=nome");
  }

  const categorias = [
    montarCategoria(formData, "masculino", "Masculino"),
    montarCategoria(formData, "feminino", "Feminino"),
  ].filter(Boolean);

  const categoriasExtras = textoParaLista(
    String(formData.get("categorias_extras") || "")
  );

  categoriasExtras.forEach((categoria) => {
    categorias.push({
      nome: categoria,
      ativo: true,
      series_ativas: false,
      series_lista: [],
    });
  });

  const seriesUsadas = categorias.flatMap((categoria: any) =>
    Array.isArray(categoria.series_lista) ? categoria.series_lista : []
  );

  const categoriasAtivas = categorias.length > 0;
  const seriesAtivas = seriesUsadas.length > 0;

  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("campeonatos").insert({
    nome,
    modalidade: modalidade || null,
    descricao: descricao || null,
    status,
    categorias_ativas: categoriasAtivas,
    categorias_lista: categorias,
    series_ativas: seriesAtivas,
    series_lista: removerDuplicados(seriesUsadas),
    inscricoes_abertas: inscricoesAbertas,
    data_inicio: dataInicio || null,
    data_fim: dataFim || null,
  });

  if (error) {
    console.error(error);
    redirect("/admin/campeonatos?erro=salvar");
  }

  revalidatePath("/admin/campeonatos");
  revalidatePath("/campeonatos");

  redirect("/admin/campeonatos?sucesso=criado");
}

export async function alterarStatusCampeonato(formData: FormData) {
  await exigirAdmin();

  const id = String(formData.get("id") || "").trim();
  const status = String(formData.get("status") || "ativo").trim();

  if (!id) {
    redirect("/admin/campeonatos?erro=id");
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("campeonatos")
    .update({
      status,
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    redirect("/admin/campeonatos?erro=status");
  }

  revalidatePath("/admin/campeonatos");
  revalidatePath("/campeonatos");

  redirect("/admin/campeonatos?sucesso=status");
}
