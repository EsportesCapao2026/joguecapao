import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";
import { CbjdFullReader } from "@/components/regras/CbjdFullReader";
import { DownloadCbjdPdf } from "@/components/regras/DownloadCbjdPdf";

export default function LerCbjdPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 -z-10 bg-[url('/bg-estadio.jpg')] bg-cover bg-center opacity-25" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-slate-950/85 via-slate-950/95 to-slate-950" />

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <Link
          href="/regras/cbjd"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white/75 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Voltar para consulta do CBJD
        </Link>

        <div className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-yellow-200">
            <Scale size={14} />
            Leitura completa
          </div>

          <h1 className="max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
            Todos os artigos do CBJD
          </h1>

          <p className="mt-4 max-w-4xl text-base leading-8 text-white/72 md:text-lg">
            Leia os artigos em sequência ou use o filtro interno para localizar
            rapidamente algum assunto.
          </p>

          <div className="mt-6">
            <DownloadCbjdPdf />
          </div>
        </div>

        <CbjdFullReader />
      </section>
    </main>
  );
}
