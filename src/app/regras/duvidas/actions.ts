"use server";

import { supabasePublic } from "@/lib/supabasePublic";

export type FonteDuvida = {
  id: string;
  tipo: "CBJD" | "Regulamento municipal";
  titulo: string;
  referencia: string | null;
  texto: string;
};

export type RespostaDuvidaRegras = {
  sucesso: boolean;
  resposta: string;
  fontes: FonteDuvida[];
  modo: "ia" | "base";
};

type RegraCampeonato = {
  id: string;
  campeonato_nome: string | null;
  titulo: string | null;
  descricao: string | null;
  artigo_referencia: string | null;
  origem: string | null;
};

type CbjdArtigo = {
  id: string;
  numero_artigo: string | null;
  artigo_label: string | null;
  titulo: string | null;
  texto_completo: string | null;
  pena: string | null;
  palavras_chave: string[] | null;
};

type IntencaoConsulta = {
  id: string;
  nome: string;
  sinais: string[];
  artigosPreferidos: string[];
  termosFortes: string[];
  termosTecnicos: string[];
};

const INTENCOES_CONSULTA: IntencaoConsulta[] = [
  {
    id: "escalacao_irregular",
    nome: "escalação ou atuação irregular de atleta",
    sinais: [
      "escal",
      "irregular",
      "jogador errado",
      "atleta errado",
      "sem condicao",
      "sem condição",
      "nao inscrito",
      "não inscrito",
      "inscrito errado",
      "suspenso jogou",
      "atuou irregular",
      "atuacao irregular",
      "atuação irregular",
      "incluiu atleta",
      "incluir atleta",
      "categoria errada",
      "categoria irregular",
      "fora da categoria",
      "idade errada",
      "idade irregular",
      "jogador na categoria errada",
      "atleta na categoria errada",
      "jogador que nao podia jogar",
      "jogador que não podia jogar",
      "atleta que nao podia jogar",
      "atleta que não podia jogar",
      "nao poderia jogar",
      "não poderia jogar",
      "nao poderia estar jogando",
      "não poderia estar jogando",
    ],
    artigosPreferidos: ["214"],
    termosFortes: [
      "incluir",
      "inclusao",
      "inclusão",
      "atleta",
      "irregular",
      "partida",
      "prova",
      "equipe",
      "disputar",
      "condicao de jogo",
      "condição de jogo",
      "perda de pontos",
    ],
    termosTecnicos: [
      "inclusão de atleta irregular",
      "atuação irregular",
      "escalação irregular",
      "atleta sem condição de jogo",
      "jogador em categoria indevida",
      "participação de atleta que não poderia atuar",
    ],
  },
];

const TERMOS_ATLETA = [
  "atleta",
  "jogador",
  "jogadora",
  "inscrito",
  "inscricao",
  "inscrição",
  "time",
  "equipe",
];

const TERMOS_ATUACAO = [
  "joga",
  "jogar",
  "jogou",
  "jogando",
  "atuou",
  "atuar",
  "participou",
  "participar",
  "disputou",
  "disputar",
  "escalado",
  "escalou",
  "escalar",
  "colocou",
  "entrou",
];

const TERMOS_IRREGULARIDADE = [
  "errado",
  "errada",
  "irregular",
  "sem condicao",
  "sem condição",
  "nao podia",
  "não podia",
  "nao poderia",
  "não poderia",
  "nao permitido",
  "não permitido",
  "fora",
  "indevido",
  "indevida",
  "impedido",
  "proibido",
];

const TERMOS_CATEGORIA = [
  "categoria",
  "idade",
  "faixa etaria",
  "faixa etária",
  "sub",
  "serie",
  "série",
  "divisao",
  "divisão",
];

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function textoFonte(fonte: FonteDuvida) {
  return normalizar(
    `${fonte.tipo} ${fonte.titulo} ${fonte.referencia || ""} ${fonte.texto}`
  );
}

function artigoBateNumero(fonte: FonteDuvida, numero: string) {
  const textoReferencia = normalizar(
    `${fonte.referencia || ""} ${fonte.titulo}`
  );
  const numeroEscapado = numero.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\D)${numeroEscapado}(\\D|$)`).test(textoReferencia);
}

function contemAlgum(textoNormalizado: string, termos: string[]) {
  return termos.some((termo) => textoNormalizado.includes(normalizar(termo)));
}

function perguntaIndicaEscalacaoIrregular(textoNormalizado: string) {
  const temAtleta = contemAlgum(textoNormalizado, TERMOS_ATLETA);
  const temAtuacao = contemAlgum(textoNormalizado, TERMOS_ATUACAO);
  const temIrregularidade = contemAlgum(
    textoNormalizado,
    TERMOS_IRREGULARIDADE
  );
  const temCategoria = contemAlgum(textoNormalizado, TERMOS_CATEGORIA);

  return (
    contemAlgum(textoNormalizado, [
      "escal",
      "atuacao irregular",
      "atuação irregular",
      "participacao irregular",
      "participação irregular",
      "incluir atleta",
      "incluiu atleta",
      "jogador errado",
      "atleta errado",
    ]) ||
    (temAtleta && temAtuacao && temIrregularidade) ||
    (temAtleta && temCategoria && temIrregularidade) ||
    (temCategoria && temAtuacao && temIrregularidade)
  );
}

function detectarIntencoes(pergunta: string) {
  const texto = normalizar(pergunta);

  return INTENCOES_CONSULTA.filter((intencao) =>
    intencao.sinais.some((sinal) => texto.includes(normalizar(sinal))) ||
    (intencao.id === "escalacao_irregular" &&
      perguntaIndicaEscalacaoIrregular(texto))
  );
}

function tokensPergunta(pergunta: string) {
  const tokens = normalizar(pergunta)
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);

  const texto = normalizar(pergunta);
  const extras: string[] = [];

  const intencoes = detectarIntencoes(pergunta);
  const temEscalacaoIrregular = intencoes.some(
    (intencao) => intencao.id === "escalacao_irregular"
  );

  if (
    texto.includes("escal") ||
    texto.includes("irregular") ||
    temEscalacaoIrregular
  ) {
    extras.push(
      "escalação",
      "irregular",
      "atleta",
      "incluir",
      "inclusão",
      "condição",
      "pontos",
      "214"
    );
  }

  if (
    temEscalacaoIrregular &&
    (contemAlgum(texto, TERMOS_CATEGORIA) ||
      texto.includes("categoria") ||
      texto.includes("idade"))
  ) {
    extras.push(
      "categoria",
      "idade",
      "faixa etária",
      "atleta",
      "condição de jogo",
      "inclusão irregular",
      "214"
    );
  }

  if (texto.includes("suspens")) {
    extras.push("suspensão", "suspenso", "pena", "jogos");
  }

  if (texto.includes("agress")) {
    extras.push("agressão", "ofensa", "pena", "suspensão");
  }

  return Array.from(new Set([...tokens, ...extras.map(normalizar)]));
}

function scoreFonte(
  fonte: FonteDuvida,
  tokens: string[],
  intencoes: IntencaoConsulta[]
) {
  const texto = textoFonte(fonte);

  let score = tokens.reduce((pontuacao, token) => {
    if (!texto.includes(token)) return pontuacao;
    const tokenNoTitulo = normalizar(fonte.titulo).includes(token);
    const tokenNaReferencia = normalizar(fonte.referencia || "").includes(token);
    return pontuacao + (tokenNaReferencia ? 8 : tokenNoTitulo ? 4 : 1);
  }, 0);

  intencoes.forEach((intencao) => {
    const termosEncontrados = intencao.termosFortes.filter((termo) =>
      texto.includes(normalizar(termo))
    );
    const artigoPreferido = intencao.artigosPreferidos.some((artigo) =>
      artigoBateNumero(fonte, artigo)
    );

    if (artigoPreferido) {
      score += 260;
    }

    score += termosEncontrados.length * 10;

    if (
      fonte.tipo === "CBJD" &&
      intencao.artigosPreferidos.length > 0 &&
      !artigoPreferido &&
      termosEncontrados.length <= 1
    ) {
      score -= 45;
    }
  });

  return score;
}

function montarFontes(
  regrasMunicipais: RegraCampeonato[],
  artigosCbjd: CbjdArtigo[],
  pergunta: string
) {
  const municipais = regrasMunicipais.map<FonteDuvida>((regra) => ({
    id: regra.id,
    tipo: "Regulamento municipal",
    titulo: regra.campeonato_nome
      ? `${regra.titulo || "Regra"} - ${regra.campeonato_nome}`
      : regra.titulo || "Regra municipal",
    referencia: regra.artigo_referencia || regra.origem,
    texto: regra.descricao || "",
  }));

  const cbjd = artigosCbjd.map<FonteDuvida>((artigo) => ({
    id: artigo.id,
    tipo: "CBJD",
    titulo: artigo.titulo || artigo.artigo_label || "Artigo do CBJD",
    referencia: artigo.artigo_label || artigo.numero_artigo,
    texto: [
      artigo.texto_completo,
      artigo.pena ? `Pena: ${artigo.pena}` : "",
      artigo.palavras_chave?.length
        ? `Palavras-chave: ${artigo.palavras_chave.join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  }));

  const tokens = tokensPergunta(pergunta);
  const intencoes = detectarIntencoes(pergunta);
  const ranqueadas = [...municipais, ...cbjd]
    .map((fonte) => ({
      fonte,
      score: scoreFonte(fonte, tokens, intencoes),
    }))
    .filter((item) => item.fonte.texto.trim().length > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.fonte.tipo !== b.fonte.tipo) {
        return a.fonte.tipo === "Regulamento municipal" ? -1 : 1;
      }
      return a.fonte.titulo.localeCompare(b.fonte.titulo, "pt-BR");
    });

  const comPontuacao = ranqueadas.filter((item) => item.score > 0);
  return (comPontuacao.length > 0 ? comPontuacao : ranqueadas)
    .slice(0, 12)
    .map((item) => item.fonte);
}

function montarRelatorioBase(pergunta: string, fontes: FonteDuvida[]) {
  if (fontes.length === 0) {
    return [
      "Relatório da consulta",
      "",
      "Não encontrei uma base suficiente nas regras cadastradas para responder com segurança.",
      "",
      "Pergunta registrada:",
      pergunta,
      "",
      "Orientação:",
      "Procure a organização do campeonato para cadastrar ou revisar a regra aplicável antes de tomar uma decisão disciplinar.",
    ].join("\n");
  }

  const fontesResumo = fontes
    .slice(0, 5)
    .map((fonte, index) => {
      const trecho = fonte.texto.replace(/\s+/g, " ").slice(0, 520);
      return `${index + 1}. ${fonte.tipo} - ${fonte.referencia || fonte.titulo}\n${trecho}`;
    })
    .join("\n\n");

  return [
    "Relatório preliminar da consulta",
    "",
    "Resumo:",
    "Encontrei regras cadastradas que podem servir de base para análise. Abaixo está uma leitura inicial das fontes mais próximas da pergunta.",
    "",
    "Pergunta:",
    pergunta,
    "",
    "Base encontrada:",
    fontesResumo,
    "",
    "Orientação:",
    "Use as fontes acima como referência inicial. Para decisão oficial, valide o enquadramento com a organização, especialmente quando houver conflito entre regulamento municipal e CBJD.",
  ].join("\n");
}

function textoDasFontes(fontes: FonteDuvida[]) {
  return fontes
    .map((fonte, index) => {
      const texto = fonte.texto.replace(/\s+/g, " ").slice(0, 2200);
      return [
        `[Fonte ${index + 1}]`,
        `Tipo: ${fonte.tipo}`,
        `Referência: ${fonte.referencia || "Sem referência"}`,
        `Título: ${fonte.titulo}`,
        `Texto: ${texto}`,
      ].join("\n");
    })
    .join("\n\n");
}

function textoDasIntencoes(intencoes: IntencaoConsulta[]) {
  if (intencoes.length === 0) {
    return "Intenção detectada: consulta geral de regras.";
  }

  return [
    "Intenção detectada pelo sistema antes da IA:",
    ...intencoes.map((intencao) =>
      [
        `- ${intencao.nome}`,
        intencao.artigosPreferidos.length
          ? `Artigos que devem ser conferidos primeiro: ${intencao.artigosPreferidos.join(", ")}`
          : "",
        intencao.termosTecnicos.length
          ? `Termos técnicos relacionados: ${intencao.termosTecnicos.join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    ),
  ].join("\n");
}

function combinarArtigos(...listas: CbjdArtigo[][]) {
  const porId = new Map<string, CbjdArtigo>();

  listas.flat().forEach((artigo) => {
    if (artigo?.id) porId.set(artigo.id, artigo);
  });

  return Array.from(porId.values());
}

function extrairTextoResposta(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";

  const record = payload as Record<string, unknown>;

  if (typeof record.output_text === "string") {
    return record.output_text.trim();
  }

  if (!Array.isArray(record.output)) return "";

  const textos: string[] = [];

  record.output.forEach((item) => {
    if (!item || typeof item !== "object") return;

    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) return;

    content.forEach((parte) => {
      if (!parte || typeof parte !== "object") return;
      const texto = (parte as Record<string, unknown>).text;
      if (typeof texto === "string") textos.push(texto);
    });
  });

  return textos.join("\n").trim();
}

async function buscarArtigosCbjd(pergunta: string) {
  const termo = tokensPergunta(pergunta).slice(0, 12).join(" ");
  const intencoes = detectarIntencoes(pergunta);
  const artigosPreferidos = Array.from(
    new Set(intencoes.flatMap((intencao) => intencao.artigosPreferidos))
  );

  const [buscaTextual, artigosAtivos, artigosExatos] = await Promise.all([
    supabasePublic.rpc("buscar_cbjd", {
      termo: termo || pergunta,
    }),
    supabasePublic
      .from("cbjd_artigos")
      .select("id, numero_artigo, artigo_label, titulo, texto_completo, pena, palavras_chave")
      .eq("ativo", true)
      .order("ordem", { ascending: true })
      .limit(500),
    artigosPreferidos.length > 0
      ? supabasePublic
          .from("cbjd_artigos")
          .select("id, numero_artigo, artigo_label, titulo, texto_completo, pena, palavras_chave")
          .eq("ativo", true)
          .or(
            artigosPreferidos
              .map(
                (artigo) =>
                  `numero_artigo.eq.${artigo},artigo_label.ilike.%${artigo}%`
              )
              .join(",")
          )
      : Promise.resolve({ data: [] as CbjdArtigo[] }),
  ]);

  return combinarArtigos(
    ((artigosExatos.data || []) as CbjdArtigo[]),
    ((buscaTextual.data || []) as CbjdArtigo[]),
    ((artigosAtivos.data || []) as CbjdArtigo[])
  );
}

export async function responderDuvidaRegras(
  perguntaOriginal: string
): Promise<RespostaDuvidaRegras> {
  const pergunta = perguntaOriginal.trim();

  if (pergunta.length < 8) {
    return {
      sucesso: false,
      resposta: "Descreva a dúvida com um pouco mais de detalhe.",
      fontes: [],
      modo: "base",
    };
  }

  const [{ data: regrasData }, artigosCbjd] = await Promise.all([
    supabasePublic
      .from("regras_campeonatos")
      .select("id, campeonato_nome, titulo, descricao, artigo_referencia, origem")
      .eq("ativo", true)
      .limit(120),
    buscarArtigosCbjd(pergunta),
  ]);

  const fontes = montarFontes(
    (regrasData || []) as RegraCampeonato[],
    artigosCbjd,
    pergunta
  );
  const intencoes = detectarIntencoes(pergunta);

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || fontes.length === 0) {
    return {
      sucesso: true,
      resposta: montarRelatorioBase(pergunta, fontes),
      fontes,
      modo: "base",
    };
  }

  try {
    const resposta = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.5",
        instructions:
          "Você é um assistente público de regras esportivas municipais. Responda em português do Brasil. Use apenas as fontes fornecidas. A pessoa pode perguntar com palavras comuns, então traduza o sentido prático da pergunta para o enquadramento técnico mais provável antes de responder. As fontes chegam em ordem de relevância: priorize as primeiras e descarte artigos que não tratem diretamente do caso perguntado. Quando a dúvida envolver jogador em categoria errada, idade errada, atleta que não poderia jogar, atleta não inscrito, escalação, inclusão ou atuação irregular, trate como possível inclusão ou atuação irregular de atleta e confira expressamente o art. 214 do CBJD antes de citar outro artigo. Só cite artigos que tenham relação direta com o fato narrado. Se as fontes não forem suficientes, diga claramente que não há base suficiente. Estruture como relatório com: Resumo, Base encontrada, Orientação e Observação. Não invente artigo, pena ou decisão.",
        input: [
          `Pergunta do usuário:\n${pergunta}`,
          textoDasIntencoes(intencoes),
          "Fontes permitidas:",
          textoDasFontes(fontes),
        ].join("\n\n"),
      }),
    });

    if (!resposta.ok) {
      const textoErro = await resposta.text();
      console.error("Erro na consulta à OpenAI:", textoErro);
      return {
        sucesso: true,
        resposta: montarRelatorioBase(pergunta, fontes),
        fontes,
        modo: "base",
      };
    }

    const payload: unknown = await resposta.json();
    const texto = extrairTextoResposta(payload);

    return {
      sucesso: true,
      resposta: texto || montarRelatorioBase(pergunta, fontes),
      fontes,
      modo: texto ? "ia" : "base",
    };
  } catch (error) {
    console.error("Falha ao consultar IA de regras:", error);
    return {
      sucesso: true,
      resposta: montarRelatorioBase(pergunta, fontes),
      fontes,
      modo: "base",
    };
  }
}
