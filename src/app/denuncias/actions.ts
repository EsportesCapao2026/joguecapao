"use server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getErrorMessage } from "@/lib/tempoReal";

export async function enviarDenuncia(formData: FormData) {
  try {
    const supabase = getSupabaseAdmin();

    // 1. Ler os dados do formulário
    const nome = String(formData.get("nome") || "").trim();
    const whatsapp = String(formData.get("whatsapp") || "").trim();
    const equipeReclamante = String(formData.get("equipe_reclamante") || "").trim();
    const campeonatoId = formData.get("campeonato_id") ? String(formData.get("campeonato_id")) : null;
    const categoria = formData.get("categoria") ? String(formData.get("categoria")) : null;
    const serie = formData.get("serie") ? String(formData.get("serie")) : null;
    const equipeDenunciadaId = formData.get("equipe_denunciada_id") ? String(formData.get("equipe_denunciada_id")) : null;
    const equipeDenunciadaNome = formData.get("equipe_denunciada_nome") ? String(formData.get("equipe_denunciada_nome")) : null;
    const jogoId = formData.get("jogo_id") ? String(formData.get("jogo_id")) : null;
    const partidaRodada = formData.get("partida_rodada") ? String(formData.get("partida_rodada")) : null;
    const alvoTipo = String(formData.get("alvo_tipo") || "geral").trim();
    const atletaDenunciadoId = formData.get("atleta_denunciado_id") ? String(formData.get("atleta_denunciado_id")) : null;
    const atletaDenunciadoNome = formData.get("atleta_denunciado_nome") ? String(formData.get("atleta_denunciado_nome")) : null;
    const descricao = String(formData.get("descricao") || "").trim();

    if (!nome || !whatsapp || !campeonatoId || !descricao) {
      return { sucesso: false, erro: "Campos obrigatórios ausentes." };
    }

    // 2. Gerar número de protocolo legível
    const ano = new Date().getFullYear();
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const protocolo = `DEN-${ano}-${randomPart}`;

    let pdfDenunciaUrl: string | null = null;

    // 3. Fazer upload do arquivo de prova se houver
    const file = formData.get("anexo") as File | null;
    if (file && file.size > 0) {
      // Garantir que o bucket existe
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExiste = buckets?.some(b => b.name === "documentos-denuncias");
      
      if (!bucketExiste) {
        await supabase.storage.createBucket("documentos-denuncias", { public: true });
      }

      const ext = file.name.split(".").pop() || "bin";
      const fileName = `${protocolo}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from("documentos-denuncias")
        .upload(fileName, buffer, {
          contentType: file.type,
          duplex: "half",
        });

      if (uploadError) {
        console.error("Erro no upload do anexo da denúncia:", uploadError);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from("documentos-denuncias")
          .getPublicUrl(fileName);
        pdfDenunciaUrl = publicUrlData.publicUrl;
      }
    }

    // 4. Inserir registro na tabela denuncias
    const { error: insertError } = await supabase
      .from("denuncias")
      .insert({
        protocolo,
        nome,
        whatsapp,
        campeonato_id: campeonatoId,
        categoria_nome: categoria,
        serie_nome: serie,
        equipe_reclamante: equipeReclamante,
        equipe_denunciada_id: equipeDenunciadaId,
        equipe_denunciada_nome: equipeDenunciadaNome,
        jogo_id: jogoId,
        partida_rodada: partidaRodada,
        alvo_tipo: alvoTipo,
        atleta_denunciado_id: atletaDenunciadoId,
        atleta_denunciado_nome: atletaDenunciadoNome,
        descricao,
        pdf_denuncia_url: pdfDenunciaUrl,
        status: "pendente",
      });

    if (insertError) {
      console.error("Erro ao inserir denúncia no banco:", insertError);
      return { sucesso: false, erro: `Erro ao salvar no banco de dados: ${insertError.message}` };
    }

    return { sucesso: true, protocolo };
  } catch (err) {
    console.error(err);
    return { sucesso: false, erro: getErrorMessage(err, "Erro interno do servidor.") };
  }
}
