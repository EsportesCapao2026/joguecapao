import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Gavel,
  Scale,
  Search,
  ShieldCheck,
} from "lucide-react";
import { CbjdSearch } from "@/components/regras/CbjdSearch";
import { RegrasDuvidaIA } from "@/components/regras/RegrasDuvidaIA";
import { RegrasCampeonatoList } from "@/components/regras/RegrasCampeonatoList";

export default function RegrasPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020806] text-white">
      <Background />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-4 md:px-6">
        <Header />

        <section className="grid gap-5 pt-5 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="rounded-[26px] border border-white/10 bg-black/42 p-5 shadow-xl backdrop-blur-xl md:p-6">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-sm font-black text-emerald-200">
              <ShieldCheck size={16} />
              Módulo oficial de regras
            </div>

            <h1 className="text-3xl font-black leading-tight md:text-5xl">
              Regras e{" "}
              <span className="bg-gradient-to-r from-[#ffd400] via-[#67dd7a] to-[#00bde7] bg-clip-text text-transparent">
                regulamentos.
              </span>
            </h1>

            <p className="mt-4 text-base leading-7 text-white/68">
              Consulte as regras próprias dos campeonatos municipais e pesquise
              artigos do Código Brasileiro de Justiça Desportiva usados como base
              complementar quando houver omissão no regulamento.
            </p>

            <div className="mt-6 space-y-3">
              <Info
                icon={<Scale size={22} />}
                title="CBJD"
                text="Pesquise artigos, penas, infrações e palavras-chave."
              />
              <Info
                icon={<BookOpen size={22} />}
                title="Regulamentos"
                text="Acesse regras municipais cadastradas por campeonato."
              />
              <Info
                icon={<Gavel size={22} />}
                title="Decisões"
                text="Use as regras como base para julgamentos e denúncias."
              />
              <Info
                icon={<Search size={22} />}
                title="Consulta rápida"
                text="Encontre o conteúdo necessário sem abrir PDFs manualmente."
              />
            </div>
          </aside>

          <section className="rounded-[26px] border border-white/10 bg-black/44 p-5 shadow-xl backdrop-blur-xl md:p-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">
              Central de regras
            </p>

            <h2 className="mt-2 text-2xl font-black md:text-3xl">
              Consulta oficial
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Link
                href="/regras/cbjd"
                className="group rounded-[20px] border border-white/10 bg-white/[0.045] p-5 transition hover:border-emerald-300/35 hover:bg-white/[0.065]"
              >
                <Scale className="mb-4 text-emerald-300" size={30} />

                <h3 className="text-xl font-black">
                  Consultar CBJD
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/58">
                  Pesquisa direta por artigo, assunto, pena ou palavra-chave.
                </p>

                <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-emerald-300">
                  Abrir consulta <ArrowRight size={16} />
                </span>
              </Link>

              <Link
                href="/regras/campeonatos"
                className="group rounded-[20px] border border-white/10 bg-white/[0.045] p-5 transition hover:border-emerald-300/35 hover:bg-white/[0.065]"
              >
                <BookOpen className="mb-4 text-emerald-300" size={30} />

                <h3 className="text-xl font-black">
                  Regras dos campeonatos
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/58">
                  Regulamentos próprios cadastrados para cada competição.
                </p>

                <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-emerald-300">
                  Ver regulamentos <ArrowRight size={16} />
                </span>
              </Link>
            </div>

            <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.045] p-5">
              <div className="mb-5 flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-300/12 text-emerald-300">
                  <Gavel size={22} />
                </div>

                <div>
                  <h3 className="text-xl font-black">
                    Aplicação das regras
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-white/58">
                    O regulamento municipal prevalece. O CBJD entra como base
                    complementar nos casos em que o regulamento for omisso.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-5">
              <RegrasDuvidaIA />

              <div className="rounded-[20px] border border-white/10 bg-white/[0.045] p-5">
                <CbjdSearch />
              </div>

              <div className="rounded-[20px] border border-white/10 bg-white/[0.045] p-5">
                <RegrasCampeonatoList />
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function Background() {
  return (
    <>
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50"
        style={{ backgroundImage: "url('/bg-estadio.jpg')" }}
      />
      <div className="fixed inset-0 z-[1] bg-black/55" />
      <div className="fixed inset-0 z-[2] bg-[radial-gradient(circle_at_top_left,rgba(255,213,0,0.15),transparent_26%),radial-gradient(circle_at_top_right,rgba(0,195,255,0.16),transparent_30%),linear-gradient(to_bottom,rgba(0,0,0,0.12),rgba(0,0,0,0.72))]" />
      <div className="fixed inset-0 z-[3] bg-[linear-gradient(rgba(90,255,210,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(90,255,210,0.035)_1px,transparent_1px)] bg-[size:64px_64px]" />
    </>
  );
}

function Header() {
  return (
    <header className="rounded-[18px] border border-white/10 bg-black/42 px-4 py-4 shadow-xl backdrop-blur-xl md:px-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="block">
          <div className="relative h-16 w-[220px] sm:h-20 sm:w-[260px] xl:h-20 xl:w-[270px]">
            <Image
              src="/logo-capao.png"
              alt="Prefeitura de Capão da Canoa"
              fill
              priority
              sizes="(min-width: 1280px) 270px, (min-width: 640px) 260px, 220px"
              className="object-contain object-left"
            />
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-3 py-2.5 font-black text-white transition hover:bg-white/[0.1]"
        >
          <ArrowLeft size={18} />
          Voltar para início
        </Link>
      </div>
    </header>
  );
}

function Info({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4 rounded-[18px] border border-white/10 bg-white/[0.045] p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-300/12 text-emerald-300">
        {icon}
      </div>

      <div>
        <h3 className="font-black">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-white/58">{text}</p>
      </div>
    </div>
  );
}
