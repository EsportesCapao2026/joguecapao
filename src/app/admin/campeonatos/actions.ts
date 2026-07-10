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

type CategoriaCampeonato = NonNullable<ReturnType<typeof montarCategoria>>;

function categoriaPreenchida(
  categoria: ReturnType<typeof montarCategoria>
): categoria is CategoriaCampeonato {
  return categoria !== null;
}

function montarDadosCampeonato(formData: FormData) {
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
  ].filter(categoriaPreenchida);

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

  const seriesUsadas = categorias.flatMap((categoria) =>
    Array.isArray(categoria.series_lista) ? categoria.series_lista : []
  );

  const categoriasAtivas = categorias.length > 0;
  const seriesAtivas = seriesUsadas.length > 0;

  return {
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
  };
}

function revalidarCampeonato(id?: string) {
  revalidatePath("/");
  revalidatePath("/admin/campeonatos");
  revalidatePath("/admin/jogos");
  revalidatePath("/admin/artilheiros");
  revalidatePath("/admin/punicoes");
  revalidatePath("/admin/inscricoes");
  revalidatePath("/admin/clubes-atletas");
  revalidatePath("/admin/denuncias");
  revalidatePath("/admin/resultados");
  revalidatePath("/campeonatos");
  revalidatePath("/inscricoes");
  revalidatePath("/denuncias");
  revalidatePath("/punicoes");

  if (id) {
    revalidatePath(`/campeonatos/${id}`);
  }
}

type ResultadoOperacao = {
  error: { message: string } | null;
};

async function garantirOperacao(
  operacao: PromiseLike<ResultadoOperacao>,
  contexto: string
) {
  const { error } = await operacao;

  if (error) {
    console.error(`Erro ao ${contexto}:`, error);
    redirect(`/admin/campeonatos?erro=${encodeURIComponent(contexto)}&detalhe=${encodeURIComponent(error.message)}`);
  }
}

export async function cadastrarCampeonato(formData: FormData) {
  await exigirAdmin();

  const dadosCampeonato = montarDadosCampeonato(formData);
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("campeonatos").insert(dadosCampeonato);

  if (error) {
    console.error(error);
    redirect("/admin/campeonatos?erro=salvar");
  }

  revalidarCampeonato();

  redirect("/admin/campeonatos?sucesso=criado");
}

export async function atualizarCampeonato(formData: FormData) {
  await exigirAdmin();

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    redirect("/admin/campeonatos?erro=id");
  }

  const dadosCampeonato = montarDadosCampeonato(formData);
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("campeonatos")
    .update(dadosCampeonato)
    .eq("id", id);

  if (error) {
    console.error(error);
    redirect("/admin/campeonatos?erro=editar");
  }

  revalidarCampeonato(id);

  redirect("/admin/campeonatos?sucesso=editado");
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

  revalidarCampeonato(id);

  redirect("/admin/campeonatos?sucesso=status");
}

export async function excluirCampeonato(formData: FormData) {
  await exigirAdmin();

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    redirect("/admin/campeonatos?erro=id");
  }

  const supabase = getSupabaseAdmin();

  const { data: campeonato, error: campeonatoError } = await supabase
    .from("campeonatos")
    .select("id, nome")
    .eq("id", id)
    .single();

  if (campeonatoError || !campeonato) {
    console.error("Erro ao buscar campeonato para exclusão:", campeonatoError);
    redirect("/admin/campeonatos?erro=nao-encontrado");
  }

  const { data: jogosData } = await supabase
    .from("jogos")
    .select("id")
    .eq("campeonato_id", id);

  const jogoIds = (jogosData || [])
    .map((jogo) => String(jogo.id || ""))
    .filter(Boolean);

  const { data: inscricoesData } = await supabase
    .from("inscricoes")
    .select("id")
    .eq("campeonato_id", id);

  const inscricaoIds = (inscricoesData || [])
    .map((inscricao) => String(inscricao.id || ""))
    .filter(Boolean);

  await garantirOperacao(
    supabase.from("gols").delete().eq("campeonato_id", id),
    "excluir-gols"
  );

  if (jogoIds.length > 0) {
    await garantirOperacao(
      supabase.from("gols").delete().in("jogo_id", jogoIds),
      "excluir-gols-jogos"
    );
  }

  await garantirOperacao(
    supabase
      .from("denuncias")
      .update({
        campeonato_id: null,
        jogo_id: null,
        equipe_denunciada_id: null,
        atleta_denunciado_id: null,
      })
      .eq("campeonato_id", id),
    "desvincular-denuncias"
  );

  await garantirOperacao(
    supabase
      .from("punicoes")
      .update({
        campeonato_id: null,
        equipe_id: null,
        atleta_id: null,
      })
      .eq("campeonato_id", id),
    "preservar-punicoes"
  );

  await garantirOperacao(
    supabase.from("jogos").delete().eq("campeonato_id", id),
    "excluir-jogos"
  );

  await garantirOperacao(
    supabase.from("atletas").delete().eq("campeonato_id", id),
    "excluir-atletas"
  );

  if (inscricaoIds.length > 0) {
    await garantirOperacao(
      supabase.from("inscricao_jogadores").delete().in("inscricao_id", inscricaoIds),
      "excluir-jogadores-inscricao"
    );
  }

  await garantirOperacao(
    supabase.from("equipes").delete().eq("campeonato_id", id),
    "excluir-equipes"
  );

  await garantirOperacao(
    supabase.from("inscricoes").delete().eq("campeonato_id", id),
    "excluir-inscricoes"
  );

  if (campeonato.nome) {
    await garantirOperacao(
      supabase.from("regras_campeonatos").delete().eq("campeonato_nome", campeonato.nome),
      "excluir-regras"
    );
  }

  await garantirOperacao(
    supabase.from("campeonatos").delete().eq("id", id),
    "excluir-campeonato"
  );

  revalidarCampeonato(id);

  redirect("/admin/campeonatos?sucesso=excluido");
}
