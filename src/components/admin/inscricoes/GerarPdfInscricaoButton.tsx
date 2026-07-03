"use client";

import { FileDown } from "lucide-react";
import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";

type InscricaoPdf = {
  id: string;
  nome_equipe: string | null;
  cidade: string | null;
  categoria: string | null;
  serie: string | null;
  nome_tecnico: string | null;
  responsavel_nome: string | null;
  responsavel_telefone: string | null;
  responsavel_email: string | null;
  logo_url: string | null;
  observacoes: string | null;
  created_at: string | null;
};

type JogadorPdf = {
  id: string;
  nome: string;
  documento_tipo: string;
  documento_numero: string;
  numero_camisa: string;
  capitao: boolean | null;
  status: string | null;
  documento_url: string | null;
};

type Props = {
  inscricao: InscricaoPdf;
  campeonatoNome: string;
  campeonatoModalidade?: string | null;
  jogadores: JogadorPdf[];
};

function limparNomeArquivo(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .toLowerCase();
}

function quebrarTexto(texto: string, limite: number) {
  const palavras = texto.split(" ");
  const linhas: string[] = [];
  let linhaAtual = "";

  palavras.forEach((palavra) => {
    const tentativa = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;

    if (tentativa.length > limite) {
      if (linhaAtual) linhas.push(linhaAtual);
      linhaAtual = palavra;
    } else {
      linhaAtual = tentativa;
    }
  });

  if (linhaAtual) linhas.push(linhaAtual);

  return linhas;
}

function formatarData(data: string | null) {
  if (!data) return "Não informada";

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(data));
  } catch {
    return data;
  }
}

async function buscarBytes(url: string) {
  const resposta = await fetch(url);

  if (!resposta.ok) {
    throw new Error("Não foi possível baixar um dos arquivos anexados.");
  }

  return await resposta.arrayBuffer();
}

async function adicionarImagemComoPagina(
  pdfFinal: PDFDocument,
  arquivoBytes: ArrayBuffer,
  tipo: "png" | "jpg"
) {
  const imagem =
    tipo === "png"
      ? await pdfFinal.embedPng(arquivoBytes)
      : await pdfFinal.embedJpg(arquivoBytes);

  const pagina = pdfFinal.addPage([595.28, 841.89]);
  const larguraPagina = pagina.getWidth();
  const alturaPagina = pagina.getHeight();

  const margem = 40;
  const larguraMaxima = larguraPagina - margem * 2;
  const alturaMaxima = alturaPagina - margem * 2;

  const escala = Math.min(
    larguraMaxima / imagem.width,
    alturaMaxima / imagem.height
  );

  const largura = imagem.width * escala;
  const altura = imagem.height * escala;

  pagina.drawImage(imagem, {
    x: (larguraPagina - largura) / 2,
    y: (alturaPagina - altura) / 2,
    width: largura,
    height: altura,
  });
}

export function GerarPdfInscricaoButton({
  inscricao,
  campeonatoNome,
  campeonatoModalidade,
  jogadores,
}: Props) {
  async function gerarPdf() {
    const pdf = await PDFDocument.create();

    const fonteRegular = await pdf.embedFont(StandardFonts.Helvetica);
    const fonteBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const azulEscuro = rgb(0.03, 0.07, 0.16);
    const amarelo = rgb(0.95, 0.80, 0.18);
    const branco = rgb(1, 1, 1);
    const cinza = rgb(0.35, 0.39, 0.46);
    const verde = rgb(0.18, 0.72, 0.42);

    const pagina = pdf.addPage([595.28, 841.89]);
    const largura = pagina.getWidth();
    const altura = pagina.getHeight();

    pagina.drawRectangle({
      x: 0,
      y: 0,
      width: largura,
      height: altura,
      color: rgb(0.96, 0.97, 0.98),
    });

    pagina.drawRectangle({
      x: 0,
      y: altura - 145,
      width: largura,
      height: 145,
      color: azulEscuro,
    });

    pagina.drawText("JOGUE CAPÃO", {
      x: 40,
      y: altura - 55,
      size: 14,
      font: fonteBold,
      color: amarelo,
    });

    pagina.drawText("FICHA DE INSCRIÇÃO DA EQUIPE", {
      x: 40,
      y: altura - 93,
      size: 24,
      font: fonteBold,
      color: branco,
    });

    pagina.drawText(`Gerado em ${formatarData(new Date().toISOString())}`, {
      x: 40,
      y: altura - 120,
      size: 9,
      font: fonteRegular,
      color: rgb(0.78, 0.82, 0.88),
    });

    let y = altura - 185;

    if (inscricao.logo_url) {
      try {
        const logoBytes = await buscarBytes(inscricao.logo_url);
        const tipoLogo = inscricao.logo_url.toLowerCase().includes(".png")
          ? "png"
          : "jpg";

        const logo =
          tipoLogo === "png"
            ? await pdf.embedPng(logoBytes)
            : await pdf.embedJpg(logoBytes);

        pagina.drawImage(logo, {
          x: largura - 125,
          y: altura - 120,
          width: 70,
          height: 70,
        });
      } catch {
        // Se a logo falhar, o PDF continua sendo gerado.
      }
    }

    function tituloSecao(titulo: string) {
      pagina.drawText(titulo.toUpperCase(), {
        x: 40,
        y,
        size: 14,
        font: fonteBold,
        color: azulEscuro,
      });

      y -= 12;

      pagina.drawLine({
        start: { x: 40, y },
        end: { x: largura - 40, y },
        thickness: 1,
        color: rgb(0.82, 0.84, 0.88),
      });

      y -= 24;
    }

    function campo(rotulo: string, valor?: string | null) {
      pagina.drawText(`${rotulo}:`, {
        x: 40,
        y,
        size: 10,
        font: fonteBold,
        color: cinza,
      });

      const linhas = quebrarTexto(valor || "Não informado", 74);

      linhas.forEach((linha, index) => {
        pagina.drawText(linha, {
          x: 150,
          y: y - index * 14,
          size: 10,
          font: fonteRegular,
          color: azulEscuro,
        });
      });

      y -= Math.max(18, linhas.length * 14 + 4);
    }

    tituloSecao("Dados do campeonato");

    campo("Campeonato", campeonatoNome);
    campo("Modalidade", campeonatoModalidade || "Não informada");
    campo("Categoria", inscricao.categoria);
    campo("Série", inscricao.serie || "Sem série");
    campo("Data da inscrição", formatarData(inscricao.created_at));

    y -= 10;
    tituloSecao("Dados da equipe");

    campo("Equipe", inscricao.nome_equipe);
    campo("Cidade", inscricao.cidade);
    campo("Técnico", inscricao.nome_tecnico);

    y -= 10;
    tituloSecao("Responsável");

    campo("Nome", inscricao.responsavel_nome);
    campo("WhatsApp", inscricao.responsavel_telefone);
    campo("E-mail", inscricao.responsavel_email);

    if (inscricao.observacoes) {
      y -= 10;
      tituloSecao("Observações");
      campo("Observação", inscricao.observacoes);
    }

    y -= 14;
    tituloSecao("Lista de atletas");

    const cabecalhoY = y;

    pagina.drawRectangle({
      x: 40,
      y: cabecalhoY - 6,
      width: largura - 80,
      height: 24,
      color: azulEscuro,
    });

    pagina.drawText("Nº", {
      x: 50,
      y: cabecalhoY,
      size: 9,
      font: fonteBold,
      color: branco,
    });

    pagina.drawText("ATLETA", {
      x: 85,
      y: cabecalhoY,
      size: 9,
      font: fonteBold,
      color: branco,
    });

    pagina.drawText("DOC.", {
      x: 295,
      y: cabecalhoY,
      size: 9,
      font: fonteBold,
      color: branco,
    });

    pagina.drawText("CAMISA", {
      x: 430,
      y: cabecalhoY,
      size: 9,
      font: fonteBold,
      color: branco,
    });

    pagina.drawText("CAP.", {
      x: 505,
      y: cabecalhoY,
      size: 9,
      font: fonteBold,
      color: branco,
    });

    y -= 34;

    jogadores.forEach((jogador, index) => {
      if (y < 80) {
        const novaPagina = pdf.addPage([595.28, 841.89]);
        novaPagina.drawText("LISTA DE ATLETAS - CONTINUAÇÃO", {
          x: 40,
          y: 790,
          size: 16,
          font: fonteBold,
          color: azulEscuro,
        });
        y = 750;
      }

      pagina.drawText(String(index + 1), {
        x: 50,
        y,
        size: 9,
        font: fonteRegular,
        color: azulEscuro,
      });

      pagina.drawText(jogador.nome || "Não informado", {
        x: 85,
        y,
        size: 9,
        font: fonteRegular,
        color: azulEscuro,
      });

      pagina.drawText(
        `${jogador.documento_tipo}: ${jogador.documento_numero}`,
        {
          x: 295,
          y,
          size: 9,
          font: fonteRegular,
          color: azulEscuro,
        }
      );

      pagina.drawText(jogador.numero_camisa || "-", {
        x: 445,
        y,
        size: 9,
        font: fonteBold,
        color: azulEscuro,
      });

      pagina.drawText(jogador.capitao ? "SIM" : "-", {
        x: 505,
        y,
        size: 9,
        font: fonteBold,
        color: jogador.capitao ? verde : cinza,
      });

      y -= 22;
    });

    const paginaDocumentos = pdf.addPage([595.28, 841.89]);

    paginaDocumentos.drawRectangle({
      x: 0,
      y: 0,
      width: paginaDocumentos.getWidth(),
      height: paginaDocumentos.getHeight(),
      color: azulEscuro,
    });

    paginaDocumentos.drawText("DOCUMENTOS DOS ATLETAS", {
      x: 40,
      y: 760,
      size: 26,
      font: fonteBold,
      color: branco,
    });

    paginaDocumentos.drawText(
      "As próximas páginas contêm os documentos enviados pelos atletas na inscrição.",
      {
        x: 40,
        y: 725,
        size: 12,
        font: fonteRegular,
        color: rgb(0.82, 0.86, 0.92),
      }
    );

    for (const jogador of jogadores) {
      if (!jogador.documento_url) continue;

      try {
        const bytes = await buscarBytes(jogador.documento_url);
        const urlLower = jogador.documento_url.toLowerCase();

        const separador = pdf.addPage([595.28, 841.89]);

        separador.drawRectangle({
          x: 0,
          y: 0,
          width: separador.getWidth(),
          height: separador.getHeight(),
          color: rgb(0.96, 0.97, 0.98),
        });

        separador.drawText("DOCUMENTO DO ATLETA", {
          x: 40,
          y: 760,
          size: 22,
          font: fonteBold,
          color: azulEscuro,
        });

        separador.drawText(jogador.nome, {
          x: 40,
          y: 720,
          size: 16,
          font: fonteBold,
          color: azulEscuro,
        });

        separador.drawText(
          `${jogador.documento_tipo}: ${jogador.documento_numero}`,
          {
            x: 40,
            y: 695,
            size: 11,
            font: fonteRegular,
            color: cinza,
          }
        );

        if (urlLower.includes(".pdf")) {
          const pdfDocumento = await PDFDocument.load(bytes);
          const paginasCopiadas = await pdf.copyPages(
            pdfDocumento,
            pdfDocumento.getPageIndices()
          );

          paginasCopiadas.forEach((paginaCopiada) => {
            pdf.addPage(paginaCopiada);
          });
        } else if (urlLower.includes(".png")) {
          await adicionarImagemComoPagina(pdf, bytes, "png");
        } else {
          await adicionarImagemComoPagina(pdf, bytes, "jpg");
        }
      } catch {
        const paginaErro = pdf.addPage([595.28, 841.89]);

        paginaErro.drawText("NÃO FOI POSSÍVEL ANEXAR ESTE DOCUMENTO", {
          x: 40,
          y: 760,
          size: 16,
          font: fonteBold,
          color: rgb(0.75, 0.1, 0.1),
        });

        paginaErro.drawText(jogador.nome, {
          x: 40,
          y: 730,
          size: 12,
          font: fonteRegular,
          color: azulEscuro,
        });
      }
    }

    const bytesFinais = await pdf.save();

    const pdfArrayBuffer = bytesFinais.buffer.slice(
      bytesFinais.byteOffset,
      bytesFinais.byteOffset + bytesFinais.byteLength
    ) as ArrayBuffer;

    const blob = new Blob([pdfArrayBuffer], {
      type: "application/pdf",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `inscricao-${limparNomeArquivo(
      inscricao.nome_equipe || "equipe"
    )}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={gerarPdf}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-300/25 bg-blue-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-blue-100 transition hover:bg-blue-500/20"
    >
      <FileDown size={16} />
      Gerar PDF
    </button>
  );
}
