"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isAdminSessionValid } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  buscarRestricaoAtleta,
  montarDocumentoAtleta,
} from "@/lib/restricoesAtletas";

async function exigirAdmin() {
  const cookieStore = await cookies();
  const sessao = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!isAdminSessionValid(sessao)) {
    redirect("/admin?bloqueado=1");
  }
}

// Cadastrar uma equipe manualmente (já aprovada de forma direta) - Legado
export async function cadastrarEquipeManual(formData: FormData) {
  await exigirAdmin();
  const supabase = getSupabaseAdmin();

  const campeonatoId = String(formData.get("campeonato_id") || "").trim();
  const categoria = String(formData.get("categoria") || "").trim();
  const serie = String(formData.get("serie") || "").trim();
  const nomeEquipe = String(formData.get("nome_equipe") || "").trim();
  const nomeTecnico = String(formData.get("nome_tecnico") || "").trim();
  const cidade = String(formData.get("cidade") || "").trim();
  const logoUrl = String(formData.get("logo_url") || "").trim();

  if (!campeonatoId || !categoria || !nomeEquipe) {
    redirect("/admin/clubes-atletas?erro=campos-obrigatorios");
  }

  // 1. Criar inscrição com status 'aprovada'
  const { data: inscricao, error: insError } = await supabase
    .from("inscricoes")
    .insert({
      campeonato_id: campeonatoId,
      categoria,
      serie: serie || null,
      nome_equipe: nomeEquipe,
      nome_time: nomeEquipe,
      nome_tecnico: nomeTecnico || null,
      cidade: cidade || null,
      logo_url: logoUrl || null,
      status: "aprovada",
    })
    .select("id")
    .single();

  if (insError || !inscricao) {
    console.error("Erro ao cadastrar inscrição manual:", insError);
    redirect(`/admin/clubes-atletas?erro=salvar&detalhe=${encodeURIComponent(insError?.message || "Erro desconhecido")}`);
  }

  // 2. Sincronizar na tabela equipes
  const { error: eqError } = await supabase
    .from("equipes")
    .upsert({
      id: inscricao.id,
      campeonato_id: campeonatoId,
      categoria,
      serie: serie || null,
      nome: nomeEquipe,
      logo_url: logoUrl || null,
    });

  if (eqError) {
    console.error("Erro ao sincronizar na tabela equipes:", eqError);
  }

  revalidatePath("/admin/clubes-atletas");
  redirect(`/admin/clubes-atletas?sucesso=equipe-cadastrada&equipeId=${inscricao.id}`);
}

// Cadastrar uma equipe manualmente com múltiplos atletas e uploads (Avançado)
export async function cadastrarEquipeManualCompleta(formData: FormData) {
  await exigirAdmin();
  const supabase = getSupabaseAdmin();

  // 1. Ler dados do time
  const campeonatoId = String(formData.get("campeonato_id") || "").trim();
  const categoria = String(formData.get("categoria") || "").trim();
  const serie = String(formData.get("serie") || "").trim();
  const nomeEquipe = String(formData.get("nome_equipe") || "").trim();
  const nomeTecnico = String(formData.get("nome_tecnico") || "").trim();
  const cidade = String(formData.get("cidade") || "").trim();
  const logoUrlLink = String(formData.get("logo_url_link") || "").trim();

  if (!campeonatoId || !categoria || !nomeEquipe) {
    redirect("/admin/clubes-atletas?erro=campos-obrigatorios");
  }

  // Buckets: Garantir que existam
  const { data: buckets } = await supabase.storage.listBuckets();
  const checkBucket = async (name: string) => {
    if (!buckets?.some((b) => b.name === name)) {
      await supabase.storage.createBucket(name, { public: true });
    }
  };
  await checkBucket("logos-equipes");
  await checkBucket("documentos-atletas");

  // 2. Fazer upload do logotipo se for arquivo
  let logoUrl: string | null = logoUrlLink || null;
  const logoArquivo = formData.get("logo_arquivo") as File | null;
  if (logoArquivo && logoArquivo.size > 0) {
    const ext = logoArquivo.name.split(".").pop() || "png";
    const fileName = `logo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
    const arrayBuffer = await logoArquivo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("logos-equipes")
      .upload(fileName, buffer, {
        contentType: logoArquivo.type,
        duplex: "half",
      });

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage
        .from("logos-equipes")
        .getPublicUrl(fileName);
      logoUrl = publicUrlData.publicUrl;
    } else {
      console.error("Erro no upload do logotipo:", uploadError);
    }
  }

  // 3. Fazer upload do documento do responsável
  let documentoResponsavelUrl: string | null = null;
  const documentoResponsavelArquivo = formData.get("documento_responsavel_arquivo") as File | null;
  if (documentoResponsavelArquivo && documentoResponsavelArquivo.size > 0) {
    const ext = documentoResponsavelArquivo.name.split(".").pop() || "pdf";
    const fileName = `resp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
    const arrayBuffer = await documentoResponsavelArquivo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("documentos-atletas")
      .upload(fileName, buffer, {
        contentType: documentoResponsavelArquivo.type,
        duplex: "half",
      });

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage
        .from("documentos-atletas")
        .getPublicUrl(fileName);
      documentoResponsavelUrl = publicUrlData.publicUrl;
    } else {
      console.error("Erro no upload do documento do responsável:", uploadError);
    }
  }

  // 4. Inserir a equipe em inscricoes (com status 'aprovada')
  const { data: inscricao, error: insError } = await supabase
    .from("inscricoes")
    .insert({
      campeonato_id: campeonatoId,
      categoria,
      serie: serie || null,
      nome_equipe: nomeEquipe,
      nome_time: nomeEquipe,
      nome_tecnico: nomeTecnico || null,
      cidade: cidade || null,
      logo_url: logoUrl,
      observacoes: documentoResponsavelUrl ? JSON.stringify({ documento_responsavel: documentoResponsavelUrl }) : null,
      status: "aprovada",
      alerta_punicao: false,
    })
    .select("id")
    .single();

  if (insError || !inscricao) {
    console.error("Erro ao cadastrar equipe manual avançada:", insError);
    redirect(`/admin/clubes-atletas?erro=salvar&detalhe=${encodeURIComponent(insError?.message || "Erro de banco")}`);
  }

  // 5. Sincronizar na tabela equipes
  const { error: eqError } = await supabase
    .from("equipes")
    .upsert({
      id: inscricao.id,
      campeonato_id: campeonatoId,
      categoria,
      serie: serie || null,
      nome: nomeEquipe,
      logo_url: logoUrl,
    });

  if (eqError) {
    console.error("Erro ao sincronizar na tabela equipes:", eqError);
  }

  // 6. Cadastrar os atletas que vieram na lista do FormData
  const atletasCount = parseInt(String(formData.get("atletas_count") || "0")) || 0;
  const alertasPunicao: string[] = [];

  for (let i = 0; i < atletasCount; i++) {
    const nome = String(formData.get(`atleta_nome_${i}`) || "").trim();
    const documentoRg = String(formData.get(`atleta_rg_${i}`) || "").trim();
    const documentoCpf = String(formData.get(`atleta_cpf_${i}`) || "").trim();
    const documentoNumero = montarDocumentoAtleta(documentoRg, documentoCpf);
    const numeroCamisa = String(formData.get(`atleta_camisa_${i}`) || "").trim();
    const capitao = String(formData.get(`atleta_capitao_${i}`)) === "true";
    const arquivoAtleta = formData.get(`atleta_arquivo_${i}`) as File | null;

    if (!nome || !documentoRg || !documentoCpf) continue;

    const restricao = await buscarRestricaoAtleta(supabase, {
      nome,
      rg: documentoRg,
      cpf: documentoCpf,
    });

    if (restricao) {
      alertasPunicao.push(`${nome}: ${restricao.detalhe}`);
    }

    let atletaDocUrl: string | null = null;

    // Fazer upload do documento do atleta
    if (arquivoAtleta && arquivoAtleta.size > 0) {
      const ext = arquivoAtleta.name.split(".").pop() || "png";
      const fileName = `atleta-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
      const arrayBuffer = await arquivoAtleta.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from("documentos-atletas")
        .upload(fileName, buffer, {
          contentType: arquivoAtleta.type,
          duplex: "half",
        });

      if (!uploadError) {
        // Salvar o path relativo no banco (pois o download assinado do atleta espera o path!)
        atletaDocUrl = fileName;
      } else {
        console.error("Erro no upload do documento do atleta:", uploadError);
      }
    }

    // Inserir atleta em inscricao_jogadores
    const { data: jogador, error: jogError } = await supabase
      .from("inscricao_jogadores")
      .insert({
        inscricao_id: inscricao.id,
        nome,
        documento_tipo: "RG/CPF",
        documento_numero: documentoNumero,
        numero_camisa: numeroCamisa || null,
        capitao,
        documento_arquivo_url: atletaDocUrl,
        status: "aprovada",
        possivel_punicao: Boolean(restricao),
        possivel_punicao_detalhes: restricao?.detalhe || null,
      })
      .select("id")
      .single();

    if (jogError || !jogador) {
      console.error("Erro ao cadastrar atleta dinâmico:", jogError);
      continue;
    }

    // Sincronizar na tabela atletas
    const { error: atlError } = await supabase
      .from("atletas")
      .upsert({
        id: jogador.id,
        equipe_id: inscricao.id,
        nome,
        documento: documentoNumero,
        numero_camisa: numeroCamisa || null,
        capitao,
        documento_url: atletaDocUrl,
        status: "ativo",
      });

    if (atlError) {
      console.error("Erro ao sincronizar na tabela atletas:", atlError);
    }
  }

  if (alertasPunicao.length > 0) {
    await supabase
      .from("inscricoes")
      .update({
        alerta_punicao: true,
        alerta_punicao_detalhes: alertasPunicao.join("\n"),
      })
      .eq("id", inscricao.id);
  }

  revalidatePath("/admin/clubes-atletas");
  const alerta = alertasPunicao.length > 0 ? "&alerta=punicao" : "";
  redirect(`/admin/clubes-atletas?sucesso=equipe-cadastrada&equipeId=${inscricao.id}${alerta}`);
}

// Cadastrar um atleta manualmente em uma equipe (já aprovado de forma direta)
export async function cadastrarAtletaManual(formData: FormData) {
  await exigirAdmin();
  const supabase = getSupabaseAdmin();

  const inscricaoId = String(formData.get("inscricao_id") || "").trim();
  const nome = String(formData.get("nome") || "").trim();
  const documentoRg = String(formData.get("documento_rg") || "").trim();
  const documentoCpf = String(formData.get("documento_cpf") || "").trim();
  const documentoNumero = montarDocumentoAtleta(documentoRg, documentoCpf);
  const numeroCamisa = String(formData.get("numero_camisa") || "").trim();
  const capitao = formData.get("capitao") === "on";

  if (!inscricaoId || !nome || !documentoRg || !documentoCpf) {
    redirect("/admin/clubes-atletas?erro=campos-obrigatorios");
  }

  const restricao = await buscarRestricaoAtleta(supabase, {
    nome,
    rg: documentoRg,
    cpf: documentoCpf,
  });

  // 1. Cadastrar na tabela inscricao_jogadores
  const { data: jogador, error: jogError } = await supabase
    .from("inscricao_jogadores")
    .insert({
      inscricao_id: inscricaoId,
      nome,
      documento_tipo: "RG/CPF",
      documento_numero: documentoNumero,
      numero_camisa: numeroCamisa || null,
      capitao,
      status: "aprovada",
      possivel_punicao: Boolean(restricao),
      possivel_punicao_detalhes: restricao?.detalhe || null,
    })
    .select("id")
    .single();

  if (jogError || !jogador) {
    console.error("Erro ao cadastrar jogador manual:", jogError);
    redirect(`/admin/clubes-atletas?erro=salvar-jogador&detalhe=${encodeURIComponent(jogError?.message || "Erro desconhecido")}`);
  }

  // 2. Sincronizar na tabela atletas (essencial para chaves estrangeiras)
  const { error: atlError } = await supabase
    .from("atletas")
    .upsert({
      id: jogador.id,
      equipe_id: inscricaoId,
      nome,
      documento: documentoNumero,
      numero_camisa: numeroCamisa || null,
      capitao,
      status: "ativo",
    });

  if (atlError) {
    console.error("Erro ao sincronizar na tabela atletas:", atlError);
  }

  if (restricao) {
    await supabase
      .from("inscricoes")
      .update({
        alerta_punicao: true,
        alerta_punicao_detalhes: `${nome}: ${restricao.detalhe}`,
      })
      .eq("id", inscricaoId);
  }

  revalidatePath("/admin/clubes-atletas");
  const alerta = restricao ? "&alerta=punicao" : "";
  redirect(`/admin/clubes-atletas?sucesso=jogador-cadastrado&equipeId=${inscricaoId}${alerta}`);
}
