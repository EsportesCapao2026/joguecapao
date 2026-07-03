"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { supabasePublic } from "@/lib/supabasePublic";

type Regra = {
  campeonato_nome: string | null;
  titulo: string;
  descricao: string;
  artigo_referencia: string | null;
  origem: string | null;
};

export function DownloadRegrasMunicipaisPdf() {
  const [carregando, setCarregando] = useState(false);

  async function baixarPdf() {
    setCarregando(true);

    const { data, error } = await supabasePublic
      .from("regras_campeonatos")
      .select("campeonato_nome, titulo, descricao, artigo_referencia, origem")
      .eq("ativo", true)
      .order("created_at", { ascending: false });

    if (error || !data) {
      alert("Não foi possível gerar o PDF das regras municipais.");
      setCarregando(false);
      return;
    }

    const regras = data as Regra[];
    const pdf = new jsPDF("p", "mm", "a4");

    const margemX = 14;
    const larguraTexto = 182;
    let y = 18;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("Regras Municipais - Jogue Capão", margemX, y);

    y += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("Regulamentos próprios dos campeonatos municipais", margemX, y);

    y += 12;

    if (regras.length === 0) {
      pdf.text("Nenhuma regra municipal cadastrada até o momento.", margemX, y);
    }

    regras.forEach((regra) => {
      if (y > 265) {
        pdf.addPage();
        y = 18;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text(regra.titulo, margemX, y);
      y += 7;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);

      if (regra.campeonato_nome) {
        pdf.text(`Campeonato: ${regra.campeonato_nome}`, margemX, y);
        y += 5;
      }

      if (regra.artigo_referencia) {
        pdf.text(`Referência: ${regra.artigo_referencia}`, margemX, y);
        y += 5;
      }

      const textoLinhas = pdf.splitTextToSize(regra.descricao, larguraTexto);

      textoLinhas.forEach((linha: string) => {
        if (y > 280) {
          pdf.addPage();
          y = 18;
        }

        pdf.text(linha, margemX, y);
        y += 5;
      });

      y += 8;
    });

    pdf.save("regras-municipais-jogue-capao.pdf");
    setCarregando(false);
  }

  return (
    <button
      type="button"
      onClick={baixarPdf}
      disabled={carregando}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-300 to-blue-500 px-5 py-3 font-black text-slate-950 shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {carregando ? (
        <>
          <Loader2 className="animate-spin" size={18} />
          Gerando PDF
        </>
      ) : (
        <>
          <Download size={18} />
          Baixar PDF das regras
        </>
      )}
    </button>
  );
}
