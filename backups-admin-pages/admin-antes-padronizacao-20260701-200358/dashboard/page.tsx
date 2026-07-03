import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  Medal,
  Settings,
  ShieldAlert,
  Trophy,
  Users,
} from "lucide-react";

const cards = [
  ["Campeonatos", "Criar e gerenciar campeonatos, categorias e séries.", "/admin/campeonatos", Trophy],
  ["Inscrições pendentes", "Aprovar ou reprovar equipes inscritas.", "/admin/inscricoes", ClipboardCheck],
  ["Clubes e atletas", "Consultar equipes aprovadas e atletas vinculados.", "/admin/clubes-atletas", Users],
  ["Jogos e rodadas", "Cadastrar partidas e lançar resultados.", "/admin/jogos", CalendarDays],
  ["Resultados", "Consultar placares e jogos finalizados.", "/admin/resultados", BarChart3],
  ["Artilheiros", "Gerenciar gols e ranking de atletas.", "/admin/artilheiros", Medal],
  ["Denúncias", "Analisar denúncias enviadas ao sistema.", "/admin/denuncias", ShieldAlert],
  ["Configurações", "Ajustes gerais do sistema administrativo.", "/admin/configuracoes", Settings],
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6 text-white">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur">
        <div className="border-b border-white/10 bg-gradient-to-r from-yellow-300/15 via-green-400/10 to-blue-500/15 p-6 md:p-8">
          <span className="inline-flex rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-yellow-200">
            Painel administrativo
          </span>

          <h1 className="mt-4 text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
            Administração
          </h1>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/72 md:text-base">
            Gerencie campeonatos, inscrições, clubes, atletas, jogos, resultados,
            artilharia, denúncias e configurações em um único painel.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(([title, description, href, Icon]) => {
          const IconComponent = Icon as typeof Trophy;

          return (
            <Link
              key={String(href)}
              href={String(href)}
              className="group rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur transition hover:scale-[1.01] hover:bg-white/[0.11]"
            >
              <div className="grid h-14 w-14 place-items-center rounded-2xl border border-yellow-300/25 bg-yellow-300/10 text-yellow-200">
                <IconComponent size={26} />
              </div>

              <h2 className="mt-5 text-2xl font-black uppercase text-white">
                {String(title)}
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/62">
                {String(description)}
              </p>

              <span className="mt-5 inline-flex rounded-full border border-green-300/25 bg-green-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-green-100">
                Abrir
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
