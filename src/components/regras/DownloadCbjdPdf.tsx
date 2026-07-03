"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { supabasePublic } from "@/lib/supabasePublic";

type CbjdArtigo = {
  artigo_label: string;
  titulo: string | null;
  texto_completo: string;
  pena: string | null;
  ordem: number | null;
};

export function DownloadCbjdPdf() {
  const [carregando, setCarregando] = useState(false);

  async function baixarPdf() {
    setCarregando(true);

    const { data, error } = await supabasePublic
      .from("cbjd_artigos")
      .select("artigo_label, titulo, texto_completo, pena, ordem")
      .eq("ativo", true)
      .order("ordem", { ascending: true });

    if (error || !data) {
      alert("Não foi possível gerar o PDF do CBJD.");
      setCarregando(false);
      return;
    }

    const artigos = data as CbjdArtigo[];
    const pdf = new jsPDF("p", "mm", "a4");

    const margemX = 14;
    const larguraTexto = 182;
    let y = 18;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("CBJD - Código Brasileiro de Justiça Desportiva", margemX, y);

    y += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("Consulta pública de artigos e penalidades", margemX, y);

    y += 12;

    artigos.forEach((artigo) => {
      if (y > 265) {
        pdf.addPage();
        y = 18;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text(`${artigo.artigo_label}${artigo.titulo ? ` - ${artigo.titulo}` : ""}`, margemX, y);
      y += 7;

      if (artigo.pena) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        const penaLinhas = pdf.splitTextToSize(`PENA: ${artigo.pena}`, larguraTexto);
        pdf.text(penaLinhas, margemX, y);
        y += penaLinhas.length * 5 + 3;
      }

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      const textoLinhas = pdf.splitTextToSize(artigo.texto_completo, larguraTexto);

      textoLinhas.forEach((linha: string) => {
        if (y > 280) {
          pdf.addPage();
          y = 18;
        }

        pdf.text(linha, margemX, y);
        y += 5;
      });

      y += 7;
    });

    pdf.save("cbjd-jogue-capao.pdf");
    setCarregando(false);
  }

  return (
    <button
      type="button"
      onClick={baixarPdf}
      disabled={carregando}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-green-400 to-blue-500 px-5 py-3 font-black text-slate-950 shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {carregando ? (
        <>
          <Loader2 className="animate-spin" size={18} />
          Gerando PDF
        </>
      ) : (
        <>
          <Download size={18} />
          Baixar PDF do CBJD
        </>
      )}
    </button>
  );
}
