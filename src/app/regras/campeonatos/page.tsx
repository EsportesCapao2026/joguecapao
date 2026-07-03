import Link from "next/link";
import { ArrowLeft, BookOpen, Search } from "lucide-react";
import { RegrasCampeonatoList } from "@/components/regras/RegrasCampeonatoList";
import { DownloadRegrasMunicipaisPdf } from "@/components/regras/DownloadRegrasMunicipaisPdf";

export default function RegrasCampeonatosPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 -z-10 bg-[url('/bg-estadio.jpg')] bg-cover bg-center opacity-25" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-slate-950/85 via-slate-950/95 to-slate-950" />

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <Link
          href="/regras"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white/75 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Voltar para regras
        </Link>

        <div className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-300/30 bg-green-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-green-200">
            <BookOpen size={14} />
            Regulamentos próprios
          </div>

          <h1 className="max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
            Regras dos campeonatos municipais
          </h1>

          <p className="mt-4 max-w-4xl text-base leading-8 text-white/72 md:text-lg">
            As regras municipais podem ser lidas por completo, baixadas em PDF
            ou consultadas por pesquisa.
          </p>

          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            <Link
              href="/regras/campeonatos/ler"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-300/40 bg-green-300/10 px-5 py-3 font-black text-green-100 transition hover:bg-green-300/20"
            >
              <BookOpen size={18} />
              Ler todas as regras
            </Link>

            <DownloadRegrasMunicipaisPdf />
          </div>
        </div>

        <div className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-white/50">
          <Search size={16} />
          Regras cadastradas
        </div>

        <RegrasCampeonatoList />
      </section>
    </main>
  );
}
