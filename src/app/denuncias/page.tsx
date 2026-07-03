import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeAlert,
  CalendarDays,
  FileImage,
  Trophy,
  UserRound,
} from "lucide-react";
import { supabasePublic } from "@/lib/supabasePublic";
import FormDenuncia from "@/components/denuncias/FormDenuncia";

export default async function DenunciasPage() {
  // 1. Buscar campeonatos ativos
  const { data: campeonatosData } = await supabasePublic
    .from("campeonatos")
    .select("id, nome")
    .neq("status", "encerrado");

  // 2. Buscar jogos agendados
  const { data: jogosData } = await supabasePublic
    .from("jogos")
    .select("id, campeonato_id, categoria, serie, rodada, equipe_mandante_nome, equipe_visitante_nome");

  // 3. Buscar equipes aprovadas/ativas
  const { data: equipesData } = await supabasePublic
    .from("equipes")
    .select("id, campeonato_id, categoria, serie, nome");

  // 4. Buscar atletas
  const { data: atletasData } = await supabasePublic
    .from("atletas")
    .select("id, equipe_id, nome");

  const campeonatos = (campeonatosData || []).map((c) => ({
    id: c.id,
    nome: c.nome,
  }));

  const jogos = (jogosData || []).map((j) => ({
    id: j.id,
    campeonato_id: j.campeonato_id,
    categoria: j.categoria,
    serie: j.serie,
    rodada: j.rodada,
    equipe_mandante_nome: j.equipe_mandante_nome,
    equipe_visitante_nome: j.equipe_visitante_nome,
  }));

  const equipes = (equipesData || []).map((e) => ({
    id: e.id,
    campeonato_id: e.campeonato_id,
    categoria: e.categoria,
    serie: e.serie,
    nome: e.nome,
  }));

  const atletas = (atletasData || []).map((a) => ({
    id: a.id,
    equipe_id: a.equipe_id,
    nome: a.nome,
  }));

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020806] text-white">
      <Background />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 md:px-8">
        <Header />

        <section className="grid gap-6 pt-8 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="rounded-[36px] border border-white/10 bg-black/42 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-black text-emerald-200">
              <BadgeAlert size={16} />
              Denúncia pública
            </div>

            <h1 className="text-4xl font-black leading-tight md:text-6xl">
              Registre uma{" "}
              <span className="bg-gradient-to-r from-[#ffd400] via-[#67dd7a] to-[#00bde7] bg-clip-text text-transparent">
                denúncia oficial.
              </span>
            </h1>

            <p className="mt-5 text-lg leading-8 text-white/68">
              Informe campeonato, categoria, série, equipe denunciada, partida,
              atleta ou comissão envolvida e descreva o ocorrido. A denúncia será
              analisada pela comissão de julgamento.
            </p>

            <div className="mt-8 space-y-3">
              <Info icon={<Trophy size={22} />} title="Campeonato" text="Selecione a competição correta." />
              <Info icon={<CalendarDays size={22} />} title="Partida" text="Vincule a denúncia à rodada ou jogo." />
              <Info icon={<UserRound size={22} />} title="Alvo" text="Indique atleta, comissão ou denúncia geral." />
              <Info icon={<FileImage size={22} />} title="Anexos" text="Inclua imagens ou documentos de apoio." />
            </div>
          </aside>

          <section className="rounded-[36px] border border-white/10 bg-black/44 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">
              Formulário de denúncia
            </p>
            <h2 className="mt-2 text-3xl font-black md:text-4xl mb-6">
              Dados da denúncia
            </h2>

            <FormDenuncia
              campeonatos={campeonatos}
              jogos={jogos}
              equipes={equipes}
              atletas={atletas}
            />
          </section>
        </section>
      </div>
    </main>
  );
}

function Background() {
  return (
    <>
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50" style={{ backgroundImage: "url('/bg-estadio.jpg')" }} />
      <div className="fixed inset-0 z-[1] bg-black/55" />
      <div className="fixed inset-0 z-[2] bg-[radial-gradient(circle_at_top_left,rgba(255,213,0,0.15),transparent_26%),radial-gradient(circle_at_top_right,rgba(0,195,255,0.16),transparent_30%),linear-gradient(to_bottom,rgba(0,0,0,0.12),rgba(0,0,0,0.72))]" />
      <div className="fixed inset-0 z-[3] bg-[linear-gradient(rgba(90,255,210,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(90,255,210,0.035)_1px,transparent_1px)] bg-[size:64px_64px]" />
    </>
  );
}

function Header() {
  return (
    <header className="rounded-[34px] border border-white/10 bg-black/42 px-5 py-5 shadow-2xl backdrop-blur-xl md:px-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="block">
          <div className="relative h-24 w-[300px] sm:h-28 sm:w-[340px] xl:h-32 xl:w-[340px]">
            <Image
              src="/logo-capao.png"
              alt="Prefeitura de Capão da Canoa"
              fill
              priority
              sizes="(min-width: 1280px) 340px, (min-width: 640px) 340px, 300px"
              className="object-contain object-left"
            />
          </div>
        </Link>

        <Link href="/" className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-5 py-3 font-black text-white transition hover:bg-white/[0.1]">
          <ArrowLeft size={18} />
          Voltar para início
        </Link>
      </div>
    </header>
  );
}

function Info({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-4 rounded-[24px] border border-white/10 bg-white/[0.045] p-4">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-300/12 text-emerald-300">
        {icon}
      </div>
      <div>
        <h3 className="font-black">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-white/58">{text}</p>
      </div>
    </div>
  );
}
