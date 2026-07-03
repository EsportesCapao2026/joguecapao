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

// Opção A: Deixar o jogo sem resultado e nenhum time pontua (Anulado)
export async function anularTotalmenteJogo(jogoId: string) {
  await exigirAdmin();
  const supabase = getSupabaseAdmin();

  // 1. Limpar gols associados na tabela gols
  const { error: errorGols } = await supabase
    .from("gols")
    .delete()
    .eq("jogo_id", jogoId);

  if (errorGols) {
    console.error("Erro ao deletar gols da anulação:", errorGols);
  }

  // 2. Atualizar status e placar do jogo
  const { error: errorJogo } = await supabase
    .from("jogos")
    .update({
      status: "anulado",
      gols_mandante: null,
      gols_visitante: null,
      observacoes: "Jogo anulado por decisão administrativa. Nenhum time pontua.",
    })
    .eq("id", jogoId);

  if (errorJogo) {
    throw new Error(`Erro ao anular jogo: ${errorJogo.message}`);
  }

  revalidatePath("/admin/jogos");
  revalidatePath("/admin/resultados");
  revalidatePath("/");
  redirect("/admin/jogos?sucesso=jogo-anulado");
}

// Opção B: Passar vitória administrativa (W.O.) para um dos times
export async function registrarVitoriaWOFavor(
  jogoId: string,
  equipeVencedoraId: string,
  golsVencedor: number,
  golsPerdedor: number
) {
  await exigirAdmin();
  const supabase = getSupabaseAdmin();

  // 1. Buscar jogo para saber quem é mandante/visitante
  const { data: jogo } = await supabase
    .from("jogos")
    .select("*")
    .eq("id", jogoId)
    .single();

  if (!jogo) {
    throw new Error("Jogo não encontrado.");
  }

  // 2. Excluir eventuais gols anteriores para limpar artilharia
  const { error: errorGols } = await supabase
    .from("gols")
    .delete()
    .eq("jogo_id", jogoId);

  if (errorGols) {
    console.error("Erro ao limpar gols de artilharia:", errorGols);
  }

  // 3. Definir gols
  const isMandanteVencedor = equipeVencedoraId === jogo.equipe_mandante_id;
  const golsMandante = isMandanteVencedor ? golsVencedor : golsPerdedor;
  const golsVisitante = !isMandanteVencedor ? golsVencedor : golsPerdedor;
  const nomeVencedor = isMandanteVencedor ? jogo.equipe_mandante_nome : jogo.equipe_visitante_nome;

  // 4. Salvar jogo
  const { error: errorJogo } = await supabase
    .from("jogos")
    .update({
      status: "realizado",
      gols_mandante: golsMandante,
      gols_visitante: golsVisitante,
      observacoes: `Vitória administrativa por W.O. concedida a equipe ${nomeVencedor} pelo placar de ${golsVencedor}x${golsPerdedor}.`,
    })
    .eq("id", jogoId);

  if (errorJogo) {
    throw new Error(`Erro ao registrar W.O.: ${errorJogo.message}`);
  }

  revalidatePath("/admin/jogos");
  revalidatePath("/admin/resultados");
  revalidatePath("/");
  redirect("/admin/jogos?sucesso=wo-registrado");
}

// Opção C: Remarcar partida (volta para Agendado com nova data/hora/local)
export async function remarcarPartida(
  jogoId: string,
  novaData: string,
  novoHorario: string,
  novoLocal: string
) {
  await exigirAdmin();
  const supabase = getSupabaseAdmin();

  // 1. Limpar gols associados
  const { error: errorGols } = await supabase
    .from("gols")
    .delete()
    .eq("jogo_id", jogoId);

  if (errorGols) {
    console.error("Erro ao deletar gols da remarcação:", errorGols);
  }

  // 2. Atualizar jogo para agendado e definir novos dados
  const { error: errorJogo } = await supabase
    .from("jogos")
    .update({
      status: "agendado",
      gols_mandante: null,
      gols_visitante: null,
      data_jogo: novaData,
      horario: novoHorario,
      local: novoLocal,
      observacoes: `Jogo reagendado para o dia ${novaData.split("-").reverse().join("/")} às ${novoHorario} no local ${novoLocal}.`,
    })
    .eq("id", jogoId);

  if (errorJogo) {
    throw new Error(`Erro ao remarcar jogo: ${errorJogo.message}`);
  }

  revalidatePath("/admin/jogos");
  revalidatePath("/admin/resultados");
  revalidatePath("/");
  redirect("/admin/jogos?sucesso=jogo-remarcado");
}
