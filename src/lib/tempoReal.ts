export type TipoCartao = "amarelo" | "vermelho";

export type TempoRealInfo = {
  status?: string;
  minuto?: number;
  segundo?: number;
  periodo?: string;
  rodando?: boolean;
  duracao_tempo?: number;
  acrescimo?: number;
  prorrogacao_ativa?: boolean;
  penaltis_ativo?: boolean;
  ultima_atualizacao?: string;
};

export type GolDetalhe = {
  gol_id?: string;
  minuto?: number;
  equipe_id?: string | null;
  atleta_id?: string;
  atleta_nome?: string;
};

export type CartaoDetalhe = {
  cartao_id?: string;
  minuto?: number;
  equipe_id?: string | null;
  atleta_id?: string;
  atleta_nome?: string;
  tipo?: TipoCartao;
};

export type PenaltisDetalhe = {
  mandante_cobrancas?: boolean[];
  visitante_cobrancas?: boolean[];
};

export type JogoObservacoes = {
  tempo_real?: TempoRealInfo;
  gols_detalhe?: GolDetalhe[];
  cartoes_detalhe?: CartaoDetalhe[];
  penaltis?: PenaltisDetalhe;
};

export function parseJogoObservacoes(observacoes?: string | null): JogoObservacoes {
  try {
    const parsed = observacoes ? JSON.parse(observacoes) : {};

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed as JogoObservacoes;
  } catch {
    return {};
  }
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
