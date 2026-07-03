"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isAdminSessionValid } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { parseJogoObservacoes } from "@/lib/tempoReal";

async function exigirAdmin() {
  const cookieStore = await cookies();
  const sessao = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!isAdminSessionValid(sessao)) {
    redirect("/admin?bloqueado=1");
  }
}

// Inicializar a partida em tempo real
export async function iniciarTempoReal(jogoId: string) {
  await exigirAdmin();
  const supabase = getSupabaseAdmin();

  const { data: jogo } = await supabase
    .from("jogos")
    .select("*")
    .eq("id", jogoId)
    .single();

  if (!jogo) {
    throw new Error("Jogo não encontrado.");
  }

  // Inicializar estado em formato JSON na coluna observacoes
  const estadoInicial = {
    tempo_real: {
      status: "em_andamento",
      minuto: 0,
      periodo: "1T",
      rodando: false,
      ultima_atualizacao: new Date().toISOString(),
    },
    gols_detalhe: [],
  };

  const { error } = await supabase
    .from("jogos")
    .update({
      status: "em_andamento",
      gols_mandante: 0,
      gols_visitante: 0,
      observacoes: JSON.stringify(estadoInicial),
    })
    .eq("id", jogoId);

  if (error) {
    throw new Error(`Erro ao iniciar tempo real: ${error.message}`);
  }

  revalidatePath(`/admin/jogos/tempo-real/${jogoId}`);
  revalidatePath("/admin/jogos");
  revalidatePath("/");
}

// Atualizar o cronômetro avançado do jogo (minutos, segundos, acréscimos, prorrogação e pênaltis)
export async function atualizarCronometroCompleto(
  jogoId: string,
  minuto: number,
  segundo: number,
  periodo: string,
  rodando: boolean,
  duracaoTempo: number,
  acrescimo: number,
  prorrogacaoAtiva: boolean,
  penaltisAtivo: boolean,
  penaltisMandante: boolean[] | null,
  penaltisVisitante: boolean[] | null
) {
  await exigirAdmin();
  const supabase = getSupabaseAdmin();

  const { data: jogo } = await supabase
    .from("jogos")
    .select("observacoes")
    .eq("id", jogoId)
    .single();

  if (!jogo) {
    throw new Error("Jogo não encontrado.");
  }

  const jsonObs = parseJogoObservacoes(jogo.observacoes);

  jsonObs.tempo_real = {
    status: "em_andamento",
    minuto,
    segundo,
    periodo,
    rodando,
    duracao_tempo: duracaoTempo,
    acrescimo,
    prorrogacao_ativa: prorrogacaoAtiva,
    penaltis_ativo: penaltisAtivo,
    ultima_atualizacao: new Date().toISOString(),
  };

  if (penaltisAtivo) {
    jsonObs.penaltis = {
      mandante_cobrancas: penaltisMandante || [],
      visitante_cobrancas: penaltisVisitante || [],
    };
  } else {
    // Limpar pênaltis se não estiver ativo
    delete jsonObs.penaltis;
  }

  const { error } = await supabase
    .from("jogos")
    .update({
      status: "em_andamento",
      observacoes: JSON.stringify(jsonObs),
    })
    .eq("id", jogoId);

  if (error) {
    throw new Error(`Erro ao atualizar cronômetro: ${error.message}`);
  }

  revalidatePath(`/admin/jogos/tempo-real/${jogoId}`);
  revalidatePath("/");
}

// Registrar um gol em tempo real
export async function registrarGolTempoReal(
  jogoId: string,
  equipeId: string,
  atletaId: string,
  minuto: number
) {
  await exigirAdmin();
  const supabase = getSupabaseAdmin();

  // Buscar informações do jogo
  const { data: jogo } = await supabase
    .from("jogos")
    .select("*")
    .eq("id", jogoId)
    .single();

  if (!jogo) {
    throw new Error("Jogo não encontrado.");
  }

  // Buscar nome do atleta na tabela inscricao_jogadores
  const { data: atleta } = await supabase
    .from("inscricao_jogadores")
    .select("nome, inscricao_id")
    .eq("id", atletaId)
    .single();

  const atletaNome = atleta?.nome || "Atleta não informado";
  const isMandante = equipeId === jogo.equipe_mandante_id;
  const equipeNome = isMandante
    ? jogo.equipe_mandante_nome
    : jogo.equipe_visitante_nome;

  // Sincronizar na tabela atletas para garantir que a chave estrangeira em gols não quebre
  if (atleta) {
    // 1. Garantir que a equipe correspondente exista na tabela equipes (satisfazendo atletas_equipe_id_fkey)
    const { data: insc } = await supabase
      .from("inscricoes")
      .select("*")
      .eq("id", atleta.inscricao_id)
      .single();

    if (insc) {
      const { error: teamUpsertError } = await supabase
        .from("equipes")
        .upsert({
          id: insc.id,
          campeonato_id: insc.campeonato_id,
          nome: insc.nome_equipe || insc.nome_time || "Equipe sem nome",
          categoria_nome: insc.categoria,
          serie_nome: insc.serie,
          logo_url: insc.logo_url,
          status: "ativo",
        });

      if (teamUpsertError) {
        console.error("Erro ao sincronizar equipe:", teamUpsertError);
      }
    }

    // 2. Agora faz o upsert do atleta na tabela atletas (satisfazendo gols_atleta_id_fkey)
    const { error: upsertError } = await supabase
      .from("atletas")
      .upsert({
        id: atletaId,
        nome: atleta.nome,
        equipe_id: atleta.inscricao_id,
      });

    if (upsertError) {
      console.error("Erro ao sincronizar atleta em atletas:", upsertError);
    }
  }

  // Inserir registro oficial na tabela de gols (para a artilharia)
  const { data: golData, error: golError } = await supabase
    .from("gols")
    .insert({
      campeonato_id: jogo.campeonato_id,
      jogo_id: jogoId,
      equipe_id: equipeId,
      atleta_id: atletaId,
      atleta_nome: atletaNome,
      equipe_nome: equipeNome,
      quantidade: 1,
      categoria_nome: jogo.categoria,
      serie_nome: jogo.serie,
    })
    .select("id")
    .single();

  if (golError) {
    throw new Error(`Erro ao registrar gol na artilharia: ${golError.message}`);
  }

  // Incrementar placar no jogo
  const novosGolsMandante = isMandante ? (jogo.gols_mandante || 0) + 1 : (jogo.gols_mandante || 0);
  const novosGolsVisitante = !isMandante ? (jogo.gols_visitante || 0) + 1 : (jogo.gols_visitante || 0);

  // Atualizar eventos no JSON do jogo
  const jsonObs = parseJogoObservacoes(jogo.observacoes);

  if (!jsonObs.gols_detalhe) jsonObs.gols_detalhe = [];

  jsonObs.gols_detalhe.push({
    gol_id: golData.id,
    minuto,
    equipe_id: equipeId,
    atleta_id: atletaId,
    atleta_nome: atletaNome,
  });

  const { error: updateError } = await supabase
    .from("jogos")
    .update({
      gols_mandante: novosGolsMandante,
      gols_visitante: novosGolsVisitante,
      observacoes: JSON.stringify(jsonObs),
    })
    .eq("id", jogoId);

  if (updateError) {
    throw new Error(`Erro ao atualizar placar do jogo: ${updateError.message}`);
  }

  revalidatePath(`/admin/jogos/tempo-real/${jogoId}`);
  revalidatePath("/admin/jogos");
  revalidatePath("/admin/artilheiros");
  if (jogo.campeonato_id) {
    revalidatePath(`/campeonatos/${jogo.campeonato_id}`);
  }
  revalidatePath("/");
}

// Remover um gol registrado em tempo real (caso seja cancelado ou inserido errado)
export async function removerGolTempoReal(
  jogoId: string,
  golIdNoBanco: string,
  equipeId: string
) {
  await exigirAdmin();
  const supabase = getSupabaseAdmin();

  // Buscar informações do jogo
  const { data: jogo } = await supabase
    .from("jogos")
    .select("*")
    .eq("id", jogoId)
    .single();

  if (!jogo) {
    throw new Error("Jogo não encontrado.");
  }

  // 1. Excluir da tabela gols
  const { error: deleteError } = await supabase
    .from("gols")
    .delete()
    .eq("id", golIdNoBanco);

  if (deleteError) {
    throw new Error(`Erro ao remover gol no banco: ${deleteError.message}`);
  }

  // 2. Decrementar o placar no jogo
  const isMandante = equipeId === jogo.equipe_mandante_id;
  const novosGolsMandante = isMandante ? Math.max(0, (jogo.gols_mandante || 0) - 1) : (jogo.gols_mandante || 0);
  const novosGolsVisitante = !isMandante ? Math.max(0, (jogo.gols_visitante || 0) - 1) : (jogo.gols_visitante || 0);

  // 3. Remover do array no JSON de observações
  const jsonObs = parseJogoObservacoes(jogo.observacoes);

  if (jsonObs.gols_detalhe) {
    jsonObs.gols_detalhe = jsonObs.gols_detalhe.filter((g) => g.gol_id !== golIdNoBanco);
  }

  const { error: updateError } = await supabase
    .from("jogos")
    .update({
      gols_mandante: novosGolsMandante,
      gols_visitante: novosGolsVisitante,
      observacoes: JSON.stringify(jsonObs),
    })
    .eq("id", jogoId);

  if (updateError) {
    throw new Error(`Erro ao atualizar placar do jogo: ${updateError.message}`);
  }

  revalidatePath(`/admin/jogos/tempo-real/${jogoId}`);
  revalidatePath("/admin/jogos");
  revalidatePath("/admin/artilheiros");
  if (jogo.campeonato_id) {
    revalidatePath(`/campeonatos/${jogo.campeonato_id}`);
  }
  revalidatePath("/");
}

// Corrigir um gol já registrado em tempo real ou na edição da súmula
export async function editarGolTempoReal(
  jogoId: string,
  golIdNoBanco: string,
  equipeId: string,
  atletaId: string,
  minuto: number
) {
  await exigirAdmin();
  const supabase = getSupabaseAdmin();

  const { data: jogo } = await supabase
    .from("jogos")
    .select("*")
    .eq("id", jogoId)
    .single();

  if (!jogo) {
    throw new Error("Jogo não encontrado.");
  }

  const { data: atleta } = await supabase
    .from("inscricao_jogadores")
    .select("nome, inscricao_id")
    .eq("id", atletaId)
    .single();

  const atletaNome = atleta?.nome || "Atleta não informado";
  const isNovoMandante = equipeId === jogo.equipe_mandante_id;
  const equipeNome = isNovoMandante
    ? jogo.equipe_mandante_nome
    : jogo.equipe_visitante_nome;

  if (atleta) {
    const { data: insc } = await supabase
      .from("inscricoes")
      .select("*")
      .eq("id", atleta.inscricao_id)
      .single();

    if (insc) {
      await supabase.from("equipes").upsert({
        id: insc.id,
        campeonato_id: insc.campeonato_id,
        nome: insc.nome_equipe || insc.nome_time || "Equipe sem nome",
        categoria_nome: insc.categoria,
        serie_nome: insc.serie,
        logo_url: insc.logo_url,
        status: "ativo",
      });
    }

    await supabase.from("atletas").upsert({
      id: atletaId,
      nome: atleta.nome,
      equipe_id: atleta.inscricao_id,
    });
  }

  const jsonObs = parseJogoObservacoes(jogo.observacoes);
  const golsDetalhe = jsonObs.gols_detalhe || [];
  const golAnterior = golsDetalhe.find((gol) => gol.gol_id === golIdNoBanco);
  const equipeAnteriorId = golAnterior?.equipe_id || equipeId;
  const eraMandante = equipeAnteriorId === jogo.equipe_mandante_id;

  jsonObs.gols_detalhe = golsDetalhe.map((gol) => {
    if (gol.gol_id !== golIdNoBanco) return gol;

    return {
      ...gol,
      minuto,
      equipe_id: equipeId,
      atleta_id: atletaId,
      atleta_nome: atletaNome,
    };
  });

  const mudouEquipe = equipeAnteriorId !== equipeId;
  const golsMandanteAtual = jogo.gols_mandante || 0;
  const golsVisitanteAtual = jogo.gols_visitante || 0;
  const golsMandante = mudouEquipe
    ? eraMandante
      ? Math.max(0, golsMandanteAtual - 1)
      : golsMandanteAtual + 1
    : golsMandanteAtual;
  const golsVisitante = mudouEquipe
    ? eraMandante
      ? golsVisitanteAtual + 1
      : Math.max(0, golsVisitanteAtual - 1)
    : golsVisitanteAtual;

  const { error: golError } = await supabase
    .from("gols")
    .update({
      equipe_id: equipeId,
      atleta_id: atletaId,
      atleta_nome: atletaNome,
      equipe_nome: equipeNome,
      categoria_nome: jogo.categoria,
      serie_nome: jogo.serie,
    })
    .eq("id", golIdNoBanco);

  if (golError) {
    throw new Error(`Erro ao corrigir gol na artilharia: ${golError.message}`);
  }

  const { error: updateError } = await supabase
    .from("jogos")
    .update({
      gols_mandante: golsMandante,
      gols_visitante: golsVisitante,
      observacoes: JSON.stringify(jsonObs),
    })
    .eq("id", jogoId);

  if (updateError) {
    throw new Error(`Erro ao corrigir gol: ${updateError.message}`);
  }

  revalidatePath(`/admin/jogos/tempo-real/${jogoId}`);
  revalidatePath("/admin/jogos");
  revalidatePath("/admin/artilheiros");
  if (jogo.campeonato_id) {
    revalidatePath(`/campeonatos/${jogo.campeonato_id}`);
  }
  revalidatePath("/");
}

// Finalizar partida em tempo real com suspensão automática de jogadores expulsos
export async function finalizarTempoReal(jogoId: string) {
  await exigirAdmin();
  const supabase = getSupabaseAdmin();

  const { data: jogo } = await supabase
    .from("jogos")
    .select("*")
    .eq("id", jogoId)
    .single();

  if (!jogo) {
    throw new Error("Jogo não encontrado.");
  }

  const jsonObs = parseJogoObservacoes(jogo.observacoes);

  // Finalizar estado interno do cronômetro
  if (jsonObs.tempo_real) {
    jsonObs.tempo_real.status = "finalizado";
    jsonObs.tempo_real.rodando = false;
    jsonObs.tempo_real.ultima_atualizacao = new Date().toISOString();
  }

  // 1. Processar suspensões automáticas por cartões vermelhos ou duplo amarelos
  const cartoes = jsonObs.cartoes_detalhe || [];
  const cartoesPorAtleta: {
    [atletaId: string]: {
      amarelos: number;
      vermelhoDireto: boolean;
      atletaNome: string;
      equipeId: string | null;
    };
  } = {};

  for (const c of cartoes) {
    if (!c.atleta_id) continue;

    const atletaId = c.atleta_id;

    if (!cartoesPorAtleta[atletaId]) {
      cartoesPorAtleta[atletaId] = {
        amarelos: 0,
        vermelhoDireto: false,
        atletaNome: c.atleta_nome || "Atleta",
        equipeId: c.equipe_id || null,
      };
    }

    if (c.tipo === "amarelo") {
      cartoesPorAtleta[atletaId].amarelos += 1;
    } else if (c.tipo === "vermelho") {
      cartoesPorAtleta[atletaId].vermelhoDireto = true;
    }
  }

  const atletasSuspensos: string[] = [];

  for (const atletaId in cartoesPorAtleta) {
    const info = cartoesPorAtleta[atletaId];
    const expulso = info.vermelhoDireto || info.amarelos >= 2;

    if (expulso) {
      atletasSuspensos.push(info.atletaNome);

      const isMandante = info.equipeId === jogo.equipe_mandante_id;
      const equipeNome = isMandante ? jogo.equipe_mandante_nome : jogo.equipe_visitante_nome;

      await supabase.from("punicoes").insert({
        campeonato_id: jogo.campeonato_id,
        equipe_id: info.equipeId,
        equipe_nome: equipeNome,
        atleta_id: atletaId,
        atleta_nome: info.atletaNome,
        categoria_nome: jogo.categoria,
        serie_nome: jogo.serie,
        motivo: `Suspensão automática por expulsão na partida contra ${isMandante ? jogo.equipe_visitante_nome : jogo.equipe_mandante_nome} (Cartão ${info.vermelhoDireto ? "Vermelho Direto" : "Segundo Amarelo"})`,
        artigo_cbjd: "Suspensão Automática (1 jogo)",
        jogos_suspensao: 1,
        status: "Ativa",
        origem: "sumula_jogo",
      });
    }
  }

  const { error } = await supabase
    .from("jogos")
    .update({
      status: "realizado",
      observacoes: JSON.stringify(jsonObs),
    })
    .eq("id", jogoId);

  if (error) {
    throw new Error(`Erro ao finalizar jogo: ${error.message}`);
  }

  revalidatePath(`/admin/jogos/tempo-real/${jogoId}`);
  revalidatePath("/admin/jogos");
  revalidatePath("/admin/artilheiros");
  if (jogo.campeonato_id) {
    revalidatePath(`/campeonatos/${jogo.campeonato_id}`);
  }
  revalidatePath("/");

  return {
    sucesso: true,
    atletasSuspensos,
  };
}

// Registrar um cartão (amarelo/vermelho) em tempo real
export async function registrarCartaoTempoReal(
  jogoId: string,
  equipeId: string,
  atletaId: string,
  tipo: "amarelo" | "vermelho",
  minuto: number
) {
  await exigirAdmin();
  const supabase = getSupabaseAdmin();

  const { data: jogo } = await supabase
    .from("jogos")
    .select("*")
    .eq("id", jogoId)
    .single();

  if (!jogo) {
    throw new Error("Jogo não encontrado.");
  }

  const { data: atleta } = await supabase
    .from("inscricao_jogadores")
    .select("nome, inscricao_id")
    .eq("id", atletaId)
    .single();

  const atletaNome = atleta?.nome || "Atleta não informado";

  if (atleta) {
    const { data: insc } = await supabase
      .from("inscricoes")
      .select("*")
      .eq("id", atleta.inscricao_id)
      .single();

    if (insc) {
      await supabase
        .from("equipes")
        .upsert({
          id: insc.id,
          campeonato_id: insc.campeonato_id,
          nome: insc.nome_equipe || insc.nome_time || "Equipe sem nome",
          categoria_nome: insc.categoria,
          serie_nome: insc.serie,
          logo_url: insc.logo_url,
          status: "ativo",
        });
    }

    await supabase
      .from("atletas")
      .upsert({
        id: atletaId,
        nome: atleta.nome,
        equipe_id: atleta.inscricao_id,
      });
  }

  const jsonObs = parseJogoObservacoes(jogo.observacoes);

  if (!jsonObs.cartoes_detalhe) jsonObs.cartoes_detalhe = [];

  const cartaoId = crypto.randomUUID();

  jsonObs.cartoes_detalhe.push({
    cartao_id: cartaoId,
    minuto,
    equipe_id: equipeId,
    atleta_id: atletaId,
    atleta_nome: atletaNome,
    tipo,
  });

  const { error: updateError } = await supabase
    .from("jogos")
    .update({
      observacoes: JSON.stringify(jsonObs),
    })
    .eq("id", jogoId);

  if (updateError) {
    throw new Error(`Erro ao registrar cartão: ${updateError.message}`);
  }

  revalidatePath(`/admin/jogos/tempo-real/${jogoId}`);
  revalidatePath("/admin/jogos");
  revalidatePath("/");
}

// Corrigir um cartão já registrado
export async function editarCartaoTempoReal(
  jogoId: string,
  cartaoId: string,
  equipeId: string,
  atletaId: string,
  tipo: "amarelo" | "vermelho",
  minuto: number
) {
  await exigirAdmin();
  const supabase = getSupabaseAdmin();

  const { data: jogo } = await supabase
    .from("jogos")
    .select("*")
    .eq("id", jogoId)
    .single();

  if (!jogo) {
    throw new Error("Jogo não encontrado.");
  }

  const { data: atleta } = await supabase
    .from("inscricao_jogadores")
    .select("nome, inscricao_id")
    .eq("id", atletaId)
    .single();

  const atletaNome = atleta?.nome || "Atleta não informado";

  if (atleta) {
    const { data: insc } = await supabase
      .from("inscricoes")
      .select("*")
      .eq("id", atleta.inscricao_id)
      .single();

    if (insc) {
      await supabase.from("equipes").upsert({
        id: insc.id,
        campeonato_id: insc.campeonato_id,
        nome: insc.nome_equipe || insc.nome_time || "Equipe sem nome",
        categoria_nome: insc.categoria,
        serie_nome: insc.serie,
        logo_url: insc.logo_url,
        status: "ativo",
      });
    }

    await supabase.from("atletas").upsert({
      id: atletaId,
      nome: atleta.nome,
      equipe_id: atleta.inscricao_id,
    });
  }

  const jsonObs = parseJogoObservacoes(jogo.observacoes);

  jsonObs.cartoes_detalhe = (jsonObs.cartoes_detalhe || []).map((cartao) => {
    if (cartao.cartao_id !== cartaoId) return cartao;

    return {
      ...cartao,
      minuto,
      equipe_id: equipeId,
      atleta_id: atletaId,
      atleta_nome: atletaNome,
      tipo,
    };
  });

  const { error: updateError } = await supabase
    .from("jogos")
    .update({
      observacoes: JSON.stringify(jsonObs),
    })
    .eq("id", jogoId);

  if (updateError) {
    throw new Error(`Erro ao corrigir cartão: ${updateError.message}`);
  }

  revalidatePath(`/admin/jogos/tempo-real/${jogoId}`);
  revalidatePath("/admin/jogos");
  revalidatePath("/");
}

// Remover um cartão em tempo real
export async function removerCartaoTempoReal(
  jogoId: string,
  cartaoId: string
) {
  await exigirAdmin();
  const supabase = getSupabaseAdmin();

  const { data: jogo } = await supabase
    .from("jogos")
    .select("observacoes")
    .eq("id", jogoId)
    .single();

  if (!jogo) {
    throw new Error("Jogo não encontrado.");
  }

  const jsonObs = parseJogoObservacoes(jogo.observacoes);

  if (jsonObs.cartoes_detalhe) {
    jsonObs.cartoes_detalhe = jsonObs.cartoes_detalhe.filter((c) => c.cartao_id !== cartaoId);
  }

  const { error: updateError } = await supabase
    .from("jogos")
    .update({
      observacoes: JSON.stringify(jsonObs),
    })
    .eq("id", jogoId);

  if (updateError) {
    throw new Error(`Erro ao remover cartão: ${updateError.message}`);
  }

  revalidatePath(`/admin/jogos/tempo-real/${jogoId}`);
  revalidatePath("/admin/jogos");
  revalidatePath("/");
}
