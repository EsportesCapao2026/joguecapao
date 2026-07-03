import { BarChart3 } from "lucide-react";

export default function AdminResultadosPage() {
  return (
    <div className="space-y-6 text-white">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur">
        <div className="border-b border-white/10 bg-gradient-to-r from-yellow-300/15 via-green-400/10 to-blue-500/15 p-6 md:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-yellow-200">
            <BarChart3 size={14} />
            Resultados
          </span>

          <h1 className="mt-4 text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
            Resultados
          </h1>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/72 md:text-base">
            Área para acompanhar os resultados lançados nos jogos.
          </p>
        </div>
      </div>
    </div>
  );
}
