type RegistroDocumento = {
  documento_tipo?: string | null;
  documento_numero?: string | null;
  documento?: string | null;
  documento_rg?: string | null;
  documento_cpf?: string | null;
  rg?: string | null;
  cpf?: string | null;
};

type PunicaoRegistro = {
  id: string;
  atleta_id: string | null;
  atleta_nome: string | null;
  equipe_nome: string | null;
  motivo: string | null;
  artigo_cbjd: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  jogos_suspensao: number | null;
  status: string | null;
};

type RegistroAtletaComId = RegistroDocumento & {
  id?: string | null;
  nome?: string | null;
};

type ResultadoSupabaseLista<T> = {
  data: T[] | null;
  error?: { message?: string } | null;
};

type SupabaseConsultaLista<T> = {
  order: (
    coluna: string,
    opcoes: { ascending: boolean }
  ) => Promise<ResultadoSupabaseLista<T>>;
  in: (coluna: string, valores: string[]) => Promise<ResultadoSupabaseLista<T>>;
};

type SupabaseLeitura = {
  from: (tabela: string) => {
    select: <T = unknown>(colunas: string) => SupabaseConsultaLista<T>;
  };
};

export type RestricaoAtleta = {
  punicaoId: string;
  atletaNome: string;
  equipeNome: string | null;
  motivo: string | null;
  artigo: string | null;
  status: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  jogosSuspensao: number | null;
  coincidencias: string[];
  detalhe: string;
};

export function normalizarNomeAtleta(valor: string | null | undefined) {
  return (valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function normalizarDocumentoAtleta(valor: string | null | undefined) {
  return (valor || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function montarDocumentoAtleta(rg: string, cpf: string) {
  const rgLimpo = rg.trim();
  const cpfLimpo = cpf.trim();
  return `RG: ${rgLimpo} | CPF: ${cpfLimpo}`;
}

function extrairValorRotulado(texto: string, rotulo: "RG" | "CPF") {
  const regex = new RegExp(`${rotulo}\\s*[:\\-]?\\s*([^|/]+)`, "i");
  return texto.match(regex)?.[1]?.trim() || "";
}

export function extrairDocumentosAtleta(registro: RegistroDocumento) {
  const documentoTipo = (registro.documento_tipo || "").toUpperCase();
  const documentoNumero = registro.documento_numero || registro.documento || "";
  const textoCompleto = [
    registro.documento_rg,
    registro.documento_cpf,
    registro.rg,
    registro.cpf,
    documentoNumero,
  ]
    .filter(Boolean)
    .join(" | ");

  const rg =
    registro.documento_rg ||
    registro.rg ||
    extrairValorRotulado(textoCompleto, "RG") ||
    (documentoTipo === "RG" ? documentoNumero : "");

  const cpf =
    registro.documento_cpf ||
    registro.cpf ||
    extrairValorRotulado(textoCompleto, "CPF") ||
    (documentoTipo === "CPF" ? documentoNumero : "");

  return {
    rg: rg.trim(),
    cpf: cpf.trim(),
  };
}

export function documentosNormalizadosAtleta(registro: RegistroDocumento) {
  const documentos = new Set<string>();
  const { rg, cpf } = extrairDocumentosAtleta(registro);

  [rg, cpf, registro.documento_numero, registro.documento].forEach((valor) => {
    const normalizado = normalizarDocumentoAtleta(valor);
    if (normalizado) documentos.add(normalizado);
  });

  return documentos;
}

export function formatarDocumentoAtleta(registro: RegistroDocumento) {
  const { rg, cpf } = extrairDocumentosAtleta(registro);
  const partes = [];

  if (rg) partes.push(`RG: ${rg}`);
  if (cpf) partes.push(`CPF: ${cpf}`);

  if (partes.length > 0) return partes.join(" | ");
  return registro.documento_numero || "Documentos não informados";
}

function punicaoAberta(punicao: PunicaoRegistro) {
  const status = normalizarNomeAtleta(punicao.status);
  const statusEncerrado = [
    "encerrada",
    "encerrado",
    "cumprida",
    "cumprido",
    "cancelada",
    "cancelado",
    "removida",
    "removido",
    "inativa",
    "inativo",
  ];

  return !statusEncerrado.includes(status);
}

function formatarDataSimples(data: string | null) {
  if (!data) return null;
  const partes = data.split("-");
  if (partes.length !== 3) return data;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function montarDetalheRestricao(punicao: PunicaoRegistro, coincidencias: string[]) {
  const trechos = [
    `Possível jogador com restrição: ${punicao.atleta_nome || "atleta não informado"}.`,
    coincidencias.length > 0 ? `Coincidência encontrada por ${coincidencias.join(" e ")}.` : "",
    punicao.equipe_nome ? `Equipe da punição: ${punicao.equipe_nome}.` : "",
    punicao.motivo ? `Motivo: ${punicao.motivo}.` : "",
    punicao.artigo_cbjd ? `Referência: ${punicao.artigo_cbjd}.` : "",
    punicao.status ? `Status: ${punicao.status}.` : "",
    punicao.data_inicio || punicao.data_fim
      ? `Período: ${formatarDataSimples(punicao.data_inicio) || "sem início"} até ${
          formatarDataSimples(punicao.data_fim) || "sem fim"
        }.`
      : "",
    punicao.jogos_suspensao ? `Suspensão: ${punicao.jogos_suspensao} jogo(s).` : "",
  ];

  return trechos.filter(Boolean).join(" ");
}

export async function buscarRestricaoAtleta(
  supabase: unknown,
  atleta: { nome: string; rg: string; cpf: string }
): Promise<RestricaoAtleta | null> {
  const db = supabase as SupabaseLeitura;
  const nomeBuscado = normalizarNomeAtleta(atleta.nome);
  const documentosBuscados = new Set(
    [atleta.rg, atleta.cpf].map(normalizarDocumentoAtleta).filter(Boolean)
  );

  if (!nomeBuscado && documentosBuscados.size === 0) return null;

  const { data: punicoesData, error: punicoesError } = await db
    .from("punicoes")
    .select<PunicaoRegistro>("*")
    .order("created_at", { ascending: false });

  if (punicoesError || !punicoesData) {
    console.error("Erro ao buscar punições para validação:", punicoesError);
    return null;
  }

  const punicoes = (punicoesData as PunicaoRegistro[]).filter(punicaoAberta);
  const atletaIds = Array.from(
    new Set(punicoes.map((punicao) => punicao.atleta_id).filter(Boolean))
  ) as string[];

  const documentosPorAtleta = new Map<string, Set<string>>();
  const nomesPorAtleta = new Map<string, Set<string>>();

  if (atletaIds.length > 0) {
    const [{ data: inscricaoJogadores }, { data: atletas }] = await Promise.all([
      db
        .from("inscricao_jogadores")
        .select<RegistroAtletaComId>("*")
        .in("id", atletaIds),
      db.from("atletas").select<RegistroAtletaComId>("*").in("id", atletaIds),
    ]);

    [...(inscricaoJogadores || []), ...(atletas || [])].forEach((registro) => {
      const id = String(registro.id || "");
      if (!id) return;

      const documentos = documentosPorAtleta.get(id) || new Set<string>();
      documentosNormalizadosAtleta(registro).forEach((documento) =>
        documentos.add(documento)
      );
      documentosPorAtleta.set(id, documentos);

      const nomes = nomesPorAtleta.get(id) || new Set<string>();
      const nomeNormalizado = normalizarNomeAtleta(registro.nome);
      if (nomeNormalizado) nomes.add(nomeNormalizado);
      nomesPorAtleta.set(id, nomes);
    });
  }

  for (const punicao of punicoes) {
    const coincidencias: string[] = [];
    const nomesDaPunicao = new Set<string>();
    const documentosDaPunicao = new Set<string>();

    const nomePunicao = normalizarNomeAtleta(punicao.atleta_nome);
    if (nomePunicao) nomesDaPunicao.add(nomePunicao);

    if (punicao.atleta_id) {
      nomesPorAtleta.get(punicao.atleta_id)?.forEach((nome) => nomesDaPunicao.add(nome));
      documentosPorAtleta
        .get(punicao.atleta_id)
        ?.forEach((documento) => documentosDaPunicao.add(documento));
    }

    if (nomeBuscado && nomesDaPunicao.has(nomeBuscado)) {
      coincidencias.push("nome");
    }

    for (const documento of documentosBuscados) {
      if (documentosDaPunicao.has(documento)) {
        coincidencias.push("documento");
        break;
      }
    }

    if (coincidencias.length === 0) continue;

    return {
      punicaoId: punicao.id,
      atletaNome: punicao.atleta_nome || atleta.nome,
      equipeNome: punicao.equipe_nome,
      motivo: punicao.motivo,
      artigo: punicao.artigo_cbjd,
      status: punicao.status,
      dataInicio: punicao.data_inicio,
      dataFim: punicao.data_fim,
      jogosSuspensao: punicao.jogos_suspensao,
      coincidencias,
      detalhe: montarDetalheRestricao(punicao, coincidencias),
    };
  }

  return null;
}
