"use client";

import { FileDown, MessageCircle } from "lucide-react";
import { jsPDF } from "jspdf";

export type PunicaoPdf = {
  id: string;
  campeonato_nome: string;
  equipe_nome: string | null;
  atleta_nome: string | null;
  categoria_nome: string | null;
  serie_nome: string | null;
  motivo: string | null;
  artigo_cbjd: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  jogos_suspensao: number | null;
  status: string | null;
  origem: string | null;
  responsavel_nome: string | null;
  responsavel_telefone: string | null;
};

function formatarData(data: string | null) {
  if (!data) return "Não informada";
  const partes = data.split("-");
  if (partes.length !== 3) return data;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function limparNomeArquivo(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .toLowerCase();
}

function telefoneParaWhatsApp(telefone: string | null) {
  const numeros = (telefone || "").replace(/\D/g, "");
  if (!numeros) return "";
  return numeros.startsWith("55") ? numeros : `55${numeros}`;
}

function origemLabel(origem: string | null) {
  if (origem === "regulamento_municipal") return "Regulamento municipal";
  if (origem === "cbjd") return "CBJD";
  if (origem === "decisao_administrativa") return "Decisão administrativa";
  return origem || "Não informada";
}

function preencherPdf(pdf: jsPDF, punicao: PunicaoPdf) {
  const margemX = 18;
  let y = 18;

  pdf.setFillColor(3, 13, 10);
  pdf.rect(0, 0, 210, 42, "F");
  pdf.setTextColor(255, 212, 0);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("JOGUE CAPÃO", margemX, y);

  y += 11;
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.text("COMUNICAÇÃO DE PUNIÇÃO", margemX, y);

  y = 56;
  pdf.setTextColor(20, 24, 28);
  pdf.setFontSize(11);

  function campo(rotulo: string, valor: string | number | null | undefined) {
    pdf.setFont("helvetica", "bold");
    pdf.text(`${rotulo}:`, margemX, y);
    pdf.setFont("helvetica", "normal");

    const texto = String(valor ?? "Não informado");
    const linhas = pdf.splitTextToSize(texto, 130);
    pdf.text(linhas, 66, y);
    y += Math.max(8, linhas.length * 6 + 2);
  }

  campo("Campeonato", punicao.campeonato_nome);
  campo("Equipe", punicao.equipe_nome);
  campo("Atleta", punicao.atleta_nome);
  campo("Categoria", punicao.categoria_nome);
  campo("Série", punicao.serie_nome || "Sem série");
  campo("Origem", origemLabel(punicao.origem));
  campo("Referência", punicao.artigo_cbjd);
  campo("Status", punicao.status || "Ativa");
  campo("Início", formatarData(punicao.data_inicio));
  campo("Fim", formatarData(punicao.data_fim));
  campo("Jogos de suspensão", punicao.jogos_suspensao ?? "Não informado");

  y += 6;
  pdf.setFillColor(244, 246, 248);
  pdf.roundedRect(margemX, y, 174, 58, 4, 4, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(20, 24, 28);
  pdf.text("Motivo / decisão disciplinar", margemX + 6, y + 10);

  pdf.setFont("helvetica", "normal");
  const linhasMotivo = pdf.splitTextToSize(punicao.motivo || "Não informado", 160);
  pdf.text(linhasMotivo.slice(0, 8), margemX + 6, y + 20);

  y += 72;
  campo("Responsável", punicao.responsavel_nome);
  campo("WhatsApp", punicao.responsavel_telefone);

  pdf.setTextColor(90, 96, 105);
  pdf.setFontSize(9);
  pdf.text(
    `Documento gerado em ${new Date().toLocaleString("pt-BR")}`,
    margemX,
    286
  );
}

function criarPdf(punicao: PunicaoPdf) {
  const pdf = new jsPDF("p", "mm", "a4");
  preencherPdf(pdf, punicao);
  return pdf;
}

export function AdminPunicaoActions({ punicao }: { punicao: PunicaoPdf }) {
  const telefone = telefoneParaWhatsApp(punicao.responsavel_telefone);
  const nomeArquivo = `punicao-${limparNomeArquivo(
    `${punicao.equipe_nome || "equipe"}-${punicao.atleta_nome || "atleta"}`
  )}.pdf`;

  function gerarPdf() {
    criarPdf(punicao).save(nomeArquivo);
  }

  function enviarWhatsApp() {
    gerarPdf();

    if (!telefone) return;

    const mensagem = [
      `Olá${punicao.responsavel_nome ? `, ${punicao.responsavel_nome}` : ""}.`,
      `Segue comunicação de punição do Jogue Capão para a equipe ${punicao.equipe_nome || "informada"}.`,
      `Atleta: ${punicao.atleta_nome || "não informado"}.`,
      `Motivo: ${punicao.motivo || "não informado"}.`,
      "O PDF foi gerado para anexar nesta conversa.",
    ].join("\n");

    window.open(`https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`, "_blank");
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button
        type="button"
        onClick={gerarPdf}
        className="inline-flex items-center gap-2 rounded-2xl border border-blue-300/30 bg-blue-500/10 px-4 py-2 text-xs font-black uppercase text-blue-100 transition hover:bg-blue-500/20"
      >
        <FileDown size={14} />
        Gerar PDF
      </button>

      <button
        type="button"
        onClick={enviarWhatsApp}
        disabled={!telefone}
        className="inline-flex items-center gap-2 rounded-2xl border border-green-300/30 bg-green-500/10 px-4 py-2 text-xs font-black uppercase text-green-100 transition hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-45"
        title={telefone ? "Enviar para WhatsApp" : "Responsável sem WhatsApp cadastrado"}
      >
        <MessageCircle size={14} />
        WhatsApp
      </button>
    </div>
  );
}
