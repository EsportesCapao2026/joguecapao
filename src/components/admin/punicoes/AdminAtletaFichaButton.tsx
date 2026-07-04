"use client";

import { useState } from "react";
import { ExternalLink, FileDown, FileText, MessageSquarePlus, Trash2, X } from "lucide-react";
import { jsPDF } from "jspdf";
import {
  adicionarObservacaoPunicao,
  removerPunicao,
} from "@/app/admin/punicoes/actions";

export type AtletaFichaHistorico = {
  id: string;
  time: string;
  campeonato: string;
  categoria: string | null;
  serie: string | null;
  numeroCamisa: string | null;
  status: string | null;
  dataInscricao: string | null;
};

export type AtletaFicha = {
  punicaoId: string;
  nome: string;
  documentos: string;
  numeroCamisa: string | null;
  status: string | null;
  ultimoTime: string;
  ultimoCampeonato: string;
  ultimaCategoria: string | null;
  ultimaSerie: string | null;
  ultimaInscricaoEm: string | null;
  ultimoDocumentoUrl: string | null;
  historico: AtletaFichaHistorico[];
};

function limparNomeArquivo(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .toLowerCase();
}

function formatarData(data: string | null) {
  if (!data) return "Nao informada";

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(data));
  } catch {
    return data;
  }
}

function campoPdf(pdf: jsPDF, rotulo: string, valor: string | null, y: number) {
  pdf.setFont("helvetica", "bold");
  pdf.text(`${rotulo}:`, 18, y);
  pdf.setFont("helvetica", "normal");
  const linhas = pdf.splitTextToSize(valor || "Nao informado", 128);
  pdf.text(linhas, 68, y);
  return y + Math.max(8, linhas.length * 6 + 2);
}

function gerarPdfFicha(ficha: AtletaFicha) {
  const pdf = new jsPDF("p", "mm", "a4");
  let y = 18;

  pdf.setFillColor(3, 13, 10);
  pdf.rect(0, 0, 210, 42, "F");
  pdf.setTextColor(255, 212, 0);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("JOGUE CAPAO", 18, y);

  y += 11;
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.text("FICHA DO ATLETA", 18, y);

  y = 56;
  pdf.setTextColor(20, 24, 28);
  pdf.setFontSize(11);

  y = campoPdf(pdf, "Nome", ficha.nome, y);
  y = campoPdf(pdf, "Documentos", ficha.documentos, y);
  y = campoPdf(pdf, "Numero", ficha.numeroCamisa || "Nao informado", y);
  y = campoPdf(pdf, "Status", ficha.status || "Nao informado", y);
  y = campoPdf(pdf, "Ultimo time", ficha.ultimoTime, y);
  y = campoPdf(pdf, "Ultimo campeonato", ficha.ultimoCampeonato, y);
  y = campoPdf(pdf, "Categoria", ficha.ultimaCategoria || "Nao informada", y);
  y = campoPdf(pdf, "Serie", ficha.ultimaSerie || "Sem serie", y);
  y = campoPdf(pdf, "Ultima inscricao", formatarData(ficha.ultimaInscricaoEm), y);
  y = campoPdf(
    pdf,
    "Documento enviado",
    ficha.ultimoDocumentoUrl ? "Documento disponivel na ficha online" : "Nao informado",
    y
  );

  y += 8;
  pdf.setFont("helvetica", "bold");
  pdf.text("Historico encontrado", 18, y);
  y += 8;
  pdf.setFont("helvetica", "normal");

  ficha.historico.slice(0, 8).forEach((item, index) => {
    if (y > 270) {
      pdf.addPage();
      y = 18;
    }

    const texto = `${index + 1}. ${item.time} - ${item.campeonato} - ${
      item.categoria || "Sem categoria"
    }${item.serie ? ` / Serie ${item.serie}` : ""} - Camisa ${
      item.numeroCamisa || "-"
    } - ${formatarData(item.dataInscricao)}`;
    const linhas = pdf.splitTextToSize(texto, 172);
    pdf.text(linhas, 18, y);
    y += Math.max(8, linhas.length * 6 + 2);
  });

  pdf.setTextColor(90, 96, 105);
  pdf.setFontSize(9);
  pdf.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 18, 286);
  pdf.save(`ficha-atleta-${limparNomeArquivo(ficha.nome)}.pdf`);
}

export function AdminAtletaFichaButton({ ficha }: { ficha: AtletaFicha | null }) {
  const [aberto, setAberto] = useState(false);

  if (!ficha) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-black uppercase text-white/35"
      >
        <FileText size={14} />
        Mostrar Mais
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-2 rounded-2xl border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase text-yellow-100 transition hover:bg-yellow-300/20"
      >
        <FileText size={14} />
        Mostrar Mais
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/72 p-4 backdrop-blur">
          <section className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950 p-6 text-white shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <span className="inline-flex rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-yellow-100">
                  Ficha do atleta
                </span>
                <h3 className="mt-3 text-3xl font-black uppercase">{ficha.nome}</h3>
                <p className="mt-2 text-sm font-bold text-white/60">{ficha.documentos}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => gerarPdfFicha(ficha)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-yellow-300 px-4 py-3 text-xs font-black uppercase text-slate-950"
                >
                  <FileDown size={15} />
                  Gerar PDF
                </button>
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-xs font-black uppercase text-white"
                >
                  <X size={15} />
                  Fechar
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                <h4 className="text-sm font-black uppercase text-white/50">Dados principais</h4>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="font-black text-white">Nome</dt>
                    <dd className="text-white/70">{ficha.nome}</dd>
                  </div>
                  <div>
                    <dt className="font-black text-white">Documentos</dt>
                    <dd className="text-white/70">{ficha.documentos}</dd>
                  </div>
                  <div>
                    <dt className="font-black text-white">Numero</dt>
                    <dd className="text-white/70">{ficha.numeroCamisa || "Nao informado"}</dd>
                  </div>
                  <div>
                    <dt className="font-black text-white">Status</dt>
                    <dd className="text-white/70">{ficha.status || "Nao informado"}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                <h4 className="text-sm font-black uppercase text-white/50">Ultimo campeonato</h4>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="font-black text-white">Time</dt>
                    <dd className="text-white/70">{ficha.ultimoTime}</dd>
                  </div>
                  <div>
                    <dt className="font-black text-white">Campeonato</dt>
                    <dd className="text-white/70">{ficha.ultimoCampeonato}</dd>
                  </div>
                  <div>
                    <dt className="font-black text-white">Categoria e serie</dt>
                    <dd className="text-white/70">
                      {ficha.ultimaCategoria || "Nao informada"}
                      {ficha.ultimaSerie ? ` / Serie ${ficha.ultimaSerie}` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-black text-white">Inscricao</dt>
                    <dd className="text-white/70">{formatarData(ficha.ultimaInscricaoEm)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-sm font-black uppercase text-white/50">
                  Ultimo documento enviado
                </h4>
                {ficha.ultimoDocumentoUrl ? (
                  <a
                    href={ficha.ultimoDocumentoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-blue-300/30 bg-blue-500/10 px-4 py-2 text-xs font-black uppercase text-blue-100"
                  >
                    <ExternalLink size={14} />
                    Abrir documento
                  </a>
                ) : (
                  <span className="text-xs font-bold text-white/45">Documento nao encontrado</span>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <h4 className="text-sm font-black uppercase text-white/50">
                Historico localizado
              </h4>
              <div className="mt-4 space-y-3">
                {ficha.historico.length === 0 ? (
                  <p className="text-sm text-white/55">Nenhum historico encontrado.</p>
                ) : (
                  ficha.historico.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm"
                    >
                      <p className="font-black uppercase text-white">{item.time}</p>
                      <p className="mt-1 text-white/65">
                        {item.campeonato} - {item.categoria || "Sem categoria"}
                        {item.serie ? ` / Serie ${item.serie}` : ""} - Camisa{" "}
                        {item.numeroCamisa || "-"}
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase text-white/40">
                        {item.status || "Sem status"} - {formatarData(item.dataInscricao)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-5">
              <h4 className="text-sm font-black uppercase text-yellow-100">
                Acrescentar informacao na punicao
              </h4>
              <form action={adicionarObservacaoPunicao} className="mt-4 space-y-3">
                <input type="hidden" name="punicao_id" value={ficha.punicaoId} />
                <textarea
                  name="observacao"
                  required
                  rows={4}
                  placeholder="Escreva aqui uma observacao complementar sobre esta punicao..."
                  className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-300"
                />
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-300 px-4 py-3 text-xs font-black uppercase text-slate-950 md:w-auto"
                >
                  <MessageSquarePlus size={15} />
                  Acrescentar observacao
                </button>
              </form>
            </div>

            <div className="mt-4 rounded-3xl border border-red-300/20 bg-red-500/10 p-5">
              <h4 className="text-sm font-black uppercase text-red-100">
                Excluir punicao
              </h4>
              <p className="mt-2 text-sm leading-6 text-red-50/75">
                Esta acao remove o registro da punicao do sistema.
              </p>
              <form
                action={removerPunicao}
                onSubmit={(event) => {
                  if (!window.confirm("Tem certeza que deseja excluir esta punicao?")) {
                    event.preventDefault();
                  }
                }}
                className="mt-4"
              >
                <input type="hidden" name="punicao_id" value={ficha.punicaoId} />
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-300/30 bg-red-500/20 px-4 py-3 text-xs font-black uppercase text-red-50 md:w-auto"
                >
                  <Trash2 size={15} />
                  Excluir punicao
                </button>
              </form>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
