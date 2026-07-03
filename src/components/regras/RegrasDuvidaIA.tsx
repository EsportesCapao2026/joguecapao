"use client";

import { useState, useTransition } from "react";
import { Bot, FileDown, Loader2, Send, ShieldCheck } from "lucide-react";
import { jsPDF } from "jspdf";
import {
  responderDuvidaRegras,
  type FonteDuvida,
} from "@/app/regras/duvidas/actions";

type ResultadoConsulta = {
  resposta: string;
  fontes: FonteDuvida[];
  modo: "ia" | "base";
};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/10";

function nomeArquivoRelatorio() {
  const data = new Date().toISOString().slice(0, 10);
  return `relatorio-regras-${data}.pdf`;
}

function escreverLinhas(pdf: jsPDF, texto: string, x: number, yInicial: number) {
  let y = yInicial;
  const linhas = pdf.splitTextToSize(texto, 174);

  linhas.forEach((linha: string) => {
    if (y > 276) {
      pdf.addPage();
      y = 20;
    }

    pdf.text(linha, x, y);
    y += 6;
  });

  return y;
}

export function RegrasDuvidaIA() {
  const [pergunta, setPergunta] = useState("");
  const [resultado, setResultado] = useState<ResultadoConsulta | null>(null);
  const [erro, setErro] = useState("");
  const [isPending, startTransition] = useTransition();

  function consultar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const perguntaLimpa = pergunta.trim();
    if (perguntaLimpa.length < 8) {
      setErro("Descreva a dúvida com um pouco mais de detalhe.");
      setResultado(null);
      return;
    }

    setErro("");

    startTransition(async () => {
      const resposta = await responderDuvidaRegras(perguntaLimpa);

      if (!resposta.sucesso) {
        setErro(resposta.resposta);
        setResultado(null);
        return;
      }

      setResultado({
        resposta: resposta.resposta,
        fontes: resposta.fontes,
        modo: resposta.modo,
      });
    });
  }

  function gerarPdf() {
    if (!resultado) return;

    const pdf = new jsPDF("p", "mm", "a4");
    const margemX = 18;
    let y = 18;

    pdf.setFillColor(3, 13, 10);
    pdf.rect(0, 0, 210, 42, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(103, 221, 122);
    pdf.text("JOGUE CAPÃO", margemX, y);

    y += 11;
    pdf.setFontSize(19);
    pdf.setTextColor(255, 255, 255);
    pdf.text("RELATÓRIO DE CONSULTA ÀS REGRAS", margemX, y);

    y = 56;
    pdf.setTextColor(20, 24, 28);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("Pergunta", margemX, y);
    pdf.setFont("helvetica", "normal");
    y = escreverLinhas(pdf, pergunta, margemX, y + 8) + 6;

    pdf.setFont("helvetica", "bold");
    pdf.text("Resposta", margemX, y);
    pdf.setFont("helvetica", "normal");
    y = escreverLinhas(pdf, resultado.resposta, margemX, y + 8) + 8;

    if (resultado.fontes.length > 0) {
      pdf.setFont("helvetica", "bold");
      pdf.text("Fontes utilizadas", margemX, y);
      pdf.setFont("helvetica", "normal");
      y += 8;

      resultado.fontes.slice(0, 8).forEach((fonte, index) => {
        const linha = `${index + 1}. ${fonte.tipo} - ${
          fonte.referencia || fonte.titulo
        }`;
        y = escreverLinhas(pdf, linha, margemX, y) + 2;
      });
    }

    pdf.setTextColor(90, 96, 105);
    pdf.setFontSize(9);
    pdf.text(
      `Documento gerado em ${new Date().toLocaleString("pt-BR")}`,
      margemX,
      286
    );

    pdf.save(nomeArquivoRelatorio());
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-2xl backdrop-blur md:p-7">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">
            <Bot size={14} />
            Tire sua dúvida
          </div>

          <h2 className="text-2xl font-black text-white md:text-3xl">
            Pergunte sobre regras e punições
          </h2>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-bold text-white/60">
          <ShieldCheck size={14} />
          Base do sistema
        </span>
      </div>

      <form onSubmit={consultar} className="space-y-3">
        <textarea
          value={pergunta}
          onChange={(event) => setPergunta(event.target.value)}
          placeholder="Ex.: Meu jogador foi escalado errado. Qual punição ele deve receber?"
          rows={4}
          className={`${inputClass} resize-none leading-6`}
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-green-400 to-blue-500 px-6 py-4 font-black text-slate-950 shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Consultando
              </>
            ) : (
              <>
                <Send size={18} />
                Consultar
              </>
            )}
          </button>

          <button
            type="button"
            onClick={gerarPdf}
            disabled={!resultado}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-6 py-4 font-black text-emerald-100 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <FileDown size={18} />
            Gerar PDF
          </button>
        </div>
      </form>

      {erro && (
        <div className="mt-5 rounded-2xl border border-red-300/30 bg-red-500/10 p-4 text-sm text-red-100">
          {erro}
        </div>
      )}

      {resultado && (
        <div className="mt-5 space-y-4">
          <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-5">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
              {resultado.modo === "ia"
                ? "Relatório gerado pela IA"
                : "Relatório preliminar"}
            </p>

            <p className="whitespace-pre-line text-sm leading-7 text-white/78">
              {resultado.resposta}
            </p>
          </div>

          {resultado.fontes.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-white/60">
                Fontes usadas
              </p>

              <div className="flex flex-wrap gap-2">
                {resultado.fontes.map((fonte) => (
                  <span
                    key={`${fonte.tipo}-${fonte.id}`}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white/68"
                  >
                    {fonte.tipo} - {fonte.referencia || fonte.titulo}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
