import Link from "next/link";
import { ArrowRight, BookOpen, Gavel, Scale, ShieldCheck } from "lucide-react";
import { CbjdSearch } from "@/components/regras/CbjdSearch";
import { RegrasCampeonatoList } from "@/components/regras/RegrasCampeonatoList";

export default function RegrasPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 -z-10 bg-[url('/bg-estadio.jpg')] bg-cover bg-center opacity-25" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-slate-950/85 via-slate-950/95 to-slate-950" />

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-yellow-200">
            <ShieldCheck size={14} />
            Módulo oficial de regras
          </div>

          <h1 className="max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
            Regras, regulamentos e consulta ao CBJD
          </h1>

          <p className="mt-4 max-w-4xl text-base leading-8 text-white/72 md:text-lg">
            Consulte as regras próprias dos campeonatos municipais e pesquise
            artigos do Código Brasileiro de Justiça Desportiva usados como base
            subsidiária em casos omissos.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Link
              href="/regras/cbjd"
              className="group rounded-3xl border border-white/10 bg-slate-950/70 p-5 transition hover:border-yellow-300/50"
            >
              <Scale className="mb-4 text-yellow-200" size={28} />
              <h2 className="text-lg font-black">Consultar CBJD</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Pesquisa direta por artigo, assunto, pena ou palavra-chave.
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-yellow-200">
                Abrir consulta <ArrowRight size={16} />
              </span>
            </Link>

            <Link
              href="/regras/campeonatos"
              className="group rounded-3xl border border-white/10 bg-slate-950/70 p-5 transition hover:border-green-300/50"
            >
              <BookOpen className="mb-4 text-green-200" size={28} />
              <h2 className="text-lg font-black">Regras dos campeonatos</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Regulamentos próprios cadastrados para cada competição.
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-green-200">
                Ver regulamentos <ArrowRight size={16} />
              </span>
            </Link>

            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
              <Gavel className="mb-4 text-blue-200" size={28} />
              <h2 className="text-lg font-black">Aplicação das regras</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                O regulamento municipal prevalece. O CBJD entra como base
                complementar quando houver omissão.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <CbjdSearch />
          <RegrasCampeonatoList />
        </div>
      </section>
    </main>
  );
}
