"use client";

import React from "react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black uppercase text-white hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm"
    >
      🖨️ Imprimir Súmula / Salvar PDF
    </button>
  );
}
