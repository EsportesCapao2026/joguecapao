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

  // 1. Atualizar status na tabela inscricoes
  const { error: updateError } = await supabase
    .from("inscricoes")
    .update({
      status,
    })
    .eq("id", inscricaoId);

  if (updateError) {
    console.error(updateError);
    redirect("/admin/inscricoes?erro=status");
  }

  // 2. Se for aprovada, sincronizar com tabelas equipes e atletas
  if (status === "aprovada") {
    // Buscar dados da inscrição
    const { data: inscricao, error: fetchInscricaoError } = await supabase
      .from("inscricoes")
      .select("*")
      .eq("id", inscricaoId)
      .single();

    if (fetchInscricaoError || !inscricao) {
      console.error("Erro ao buscar detalhes da inscrição:", fetchInscricaoError);
      redirect("/admin/inscricoes?erro=sincronizacao-fetch");
    }

    // Inserir/Upsert equipe na tabela equipes
    const { error: teamUpsertError } = await supabase
      .from("equipes")
      .upsert({
        id: inscricaoId,
        campeonato_id: inscricao.campeonato_id,
        nome: inscricao.nome_equipe || inscricao.nome_time || "Equipe sem nome",
        categoria_nome: inscricao.categoria,
        serie_nome: inscricao.serie,
        responsavel_nome: inscricao.responsavel_nome,
        responsavel_documento: inscricao.responsavel_documento,
        responsavel_whatsapp: inscricao.responsavel_telefone,
        responsavel_email: inscricao.responsavel_email,
        tecnico_nome: inscricao.nome_tecnico,
        logo_url: inscricao.logo_url,
        status: "ativo",
      });

    if (teamUpsertError) {
      console.error("Erro ao criar/atualizar equipe:", teamUpsertError);
      redirect(`/admin/inscricoes?erro=sincronizacao-equipe&detalhe=${encodeURIComponent(teamUpsertError.message)}`);
    }

    // Buscar jogadores vinculados à inscrição (que não estejam explicitamente recusados)
    const { data: jogadores, error: fetchJogadoresError } = await supabase
      .from("inscricao_jogadores")
      .select("*")
      .eq("inscricao_id", inscricaoId)
      .neq("status", "recusado");

    if (fetchJogadoresError) {
      console.error("Erro ao buscar jogadores da inscrição:", fetchJogadoresError);
    } else if (jogadores && jogadores.length > 0) {
      // Mapear jogadores para inserir na tabela atletas
      const atletasParaInserir = jogadores.map((jogador) => ({
        id: jogador.id,
        equipe_id: inscricaoId,
        campeonato_id: inscricao.campeonato_id,
        nome: jogador.nome,
        documento: jogador.documento_numero,
        numero_camisa: jogador.numero_camisa,
        capitao: jogador.capitao || false,
        documento_url: jogador.documento_arquivo_url,
        status: "ativo",
      }));

      // Realizar upsert dos atletas
      const { error: athletesUpsertError } = await supabase
        .from("atletas")
        .upsert(atletasParaInserir);

      if (athletesUpsertError) {
        console.error("Erro ao sincronizar atletas:", athletesUpsertError);
      }
    }
  } else {
    // Se a inscrição foi reprovada ou desativada, remover equipe e atletas
    // para manter integridade referencial se não houver registros filhos
    try {
      await supabase.from("atletas").delete().eq("equipe_id", inscricaoId);
      await supabase.from("equipes").delete().eq("id", inscricaoId);
    } catch (cleanupError) {
      console.error("Erro ao limpar dados sincronizados:", cleanupError);
    }
  }

  revalidatePath("/admin/inscricoes");
  revalidatePath("/admin/clubes-atletas");
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
