"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function limparNomeArquivo(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .toLowerCase();
}

async function enviarArquivoStorage({
  supabase,
  bucket,
  arquivo,
  pasta,
}: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  bucket: string;
  arquivo: File;
  pasta: string;
}) {
  if (!arquivo || arquivo.size === 0) {
    return null;
  }

  const nomeSeguro = limparNomeArquivo(arquivo.name || "arquivo");
  const caminho = `${pasta}/${crypto.randomUUID()}-${nomeSeguro}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(caminho, arquivo, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Erro no upload:", error);
    return null;
  }

  if (bucket === "logos-equipes") {
    const { data } = supabase.storage.from(bucket).getPublicUrl(caminho);
    return data.publicUrl;
  }

  return caminho;
}

function redirecionarComFaltando({
  campeonatoId,
  erro,
  campos,
}: {
  campeonatoId: string;
  erro: string;
  campos: string[];
}) {
  const faltando = encodeURIComponent(campos.join(", "));
  redirect(`/inscricoes?campeonato=${campeonatoId}&erro=${erro}&faltando=${faltando}`);
}

export async function enviarInscricao(formData: FormData) {
  const supabase = getSupabaseAdmin();

  const campeonatoId = String(formData.get("campeonato_id") || "").trim();
  const categoria = String(formData.get("categoria") || "").trim();
  const serie = String(formData.get("serie") || "").trim();

  const nomeEquipe = String(formData.get("nome_equipe") || "").trim();
  const cidade = String(formData.get("cidade") || "").trim();
  const nomeTecnico = String(formData.get("nome_tecnico") || "").trim();

  const responsavelNome = String(formData.get("responsavel_nome") || "").trim();
  const responsavelTelefone = String(
    formData.get("responsavel_telefone") || ""
  ).trim();
  const responsavelEmail = String(formData.get("responsavel_email") || "").trim();

  const observacoes = String(formData.get("observacoes") || "").trim();

  const jogadorIndices = String(formData.get("jogador_indices") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const camposFaltando: string[] = [];

  if (!campeonatoId) camposFaltando.push("Campeonato");
  if (!categoria) camposFaltando.push("Categoria");
  if (!nomeEquipe) camposFaltando.push("Nome da equipe");
  if (!cidade) camposFaltando.push("Cidade");
  if (!nomeTecnico) camposFaltando.push("Nome do técnico");
  if (!responsavelNome) camposFaltando.push("Nome do responsável");
  if (!responsavelTelefone) camposFaltando.push("WhatsApp do responsável");
  if (!responsavelEmail) camposFaltando.push("E-mail do responsável");
  if (jogadorIndices.length === 0) camposFaltando.push("Pelo menos um jogador");

  if (camposFaltando.length > 0) {
    redirecionarComFaltando({
      campeonatoId,
      erro: "campos",
      campos: camposFaltando,
    });
  }

  for (const indice of jogadorIndices) {
    const nome = String(formData.get(`jogador_nome_${indice}`) || "").trim();
    const documentoTipo = String(
      formData.get(`jogador_documento_tipo_${indice}`) || ""
    ).trim();
    const documentoNumero = String(
      formData.get(`jogador_documento_numero_${indice}`) || ""
    ).trim();
    const numeroCamisa = String(
      formData.get(`jogador_numero_camisa_${indice}`) || ""
    ).trim();

    const documentoArquivo = formData.get(
      `jogador_documento_arquivo_${indice}`
    ) as File | null;

    const camposJogadorFaltando: string[] = [];

    if (!nome) camposJogadorFaltando.push(`Nome do jogador ${indice}`);
    if (!documentoTipo) camposJogadorFaltando.push(`Tipo de documento do jogador ${indice}`);
    if (!documentoNumero) camposJogadorFaltando.push(`Número do documento do jogador ${indice}`);
    if (!numeroCamisa) camposJogadorFaltando.push(`Número da camisa do jogador ${indice}`);
    if (!documentoArquivo || documentoArquivo.size === 0) {
      camposJogadorFaltando.push(`Arquivo do documento do jogador ${indice}`);
    }

    if (camposJogadorFaltando.length > 0) {
      redirecionarComFaltando({
        campeonatoId,
        erro: "jogadores",
        campos: camposJogadorFaltando,
      });
    }
  }

  const logoArquivo = formData.get("logo_time") as File | null;

  const logoUrl =
    logoArquivo && logoArquivo.size > 0
      ? await enviarArquivoStorage({
          supabase,
          bucket: "logos-equipes",
          arquivo: logoArquivo,
          pasta: `campeonatos/${campeonatoId}`,
        })
      : null;

  const { data: inscricaoCriada, error: erroInscricao } = await supabase
    .from("inscricoes")
    .insert({
      campeonato_id: campeonatoId,
      categoria,
      serie: serie || null,
      nome_equipe: nomeEquipe,
      nome_time: nomeEquipe,
      cidade,
      nome_tecnico: nomeTecnico,
      responsavel_nome: responsavelNome,
      responsavel_telefone: responsavelTelefone,
      responsavel_email: responsavelEmail,
      observacoes: observacoes || null,
      logo_url: logoUrl,
      status: "pendente",
      alerta_punicao: false,
    })
    .select("id")
    .single();

  if (erroInscricao || !inscricaoCriada) {
    console.error("Erro ao salvar inscrição:", erroInscricao);

    const detalhe = encodeURIComponent(
      erroInscricao?.message || "Erro desconhecido ao salvar inscrição."
    );

    redirect(`/inscricoes?campeonato=${campeonatoId}&erro=salvar&detalhe=${detalhe}`);
  }

  for (const indice of jogadorIndices) {
    const nome = String(formData.get(`jogador_nome_${indice}`) || "").trim();
    const documentoTipo = String(
      formData.get(`jogador_documento_tipo_${indice}`) || ""
    ).trim();
    const documentoNumero = String(
      formData.get(`jogador_documento_numero_${indice}`) || ""
    ).trim();
    const numeroCamisa = String(
      formData.get(`jogador_numero_camisa_${indice}`) || ""
    ).trim();
    const capitao = String(formData.get("capitao")) === indice;

    const documentoArquivo = formData.get(
      `jogador_documento_arquivo_${indice}`
    ) as File;

    const documentoArquivoUrl = await enviarArquivoStorage({
      supabase,
      bucket: "documentos-atletas",
      arquivo: documentoArquivo,
      pasta: `inscricoes/${inscricaoCriada.id}`,
    });

    if (!documentoArquivoUrl) {
      const faltando = encodeURIComponent(`Documento do jogador ${indice}`);
      redirect(`/inscricoes?campeonato=${campeonatoId}&erro=documento&faltando=${faltando}`);
    }

    const { error: erroJogador } = await supabase
      .from("inscricao_jogadores")
      .insert({
        inscricao_id: inscricaoCriada.id,
        nome,
        documento_tipo: documentoTipo,
        documento_numero: documentoNumero,
        documento_arquivo_url: documentoArquivoUrl,
        numero_camisa: numeroCamisa,
        capitao,
        status: "pendente",
        possivel_punicao: false,
      });

    if (erroJogador) {
      console.error("Erro ao salvar jogador:", erroJogador);

      const detalhe = encodeURIComponent(
        erroJogador.message || "Erro desconhecido ao salvar jogador."
      );

      redirect(`/inscricoes?campeonato=${campeonatoId}&erro=jogadores&detalhe=${detalhe}`);
    }
  }

  revalidatePath("/inscricoes");
  revalidatePath(`/campeonatos/${campeonatoId}`);

  redirect(`/inscricoes?campeonato=${campeonatoId}&sucesso=1`);
}
