"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  Gavel,
  Gauge,
  Home,
  LogOut,
  Medal,
  Settings,
  ShieldAlert,
  Trophy,
  Users,
} from "lucide-react";

const menu = [
  { title: "Início", href: "/admin/dashboard", icon: Home },
  { title: "Campeonatos", href: "/admin/campeonatos", icon: Trophy },
  { title: "Inscrições pendentes", href: "/admin/inscricoes", icon: ClipboardCheck },
  { title: "Clubes e atletas", href: "/admin/clubes-atletas", icon: Users },
  { title: "Jogos e rodadas", href: "/admin/jogos", icon: CalendarDays },
  { title: "Resultados", href: "/admin/resultados", icon: BarChart3 },
  { title: "Artilheiros", href: "/admin/artilheiros", icon: Medal },
  { title: "Denúncias", href: "/admin/denuncias", icon: ShieldAlert },
  { title: "Regras", href: "/admin/regras", icon: Gauge },
  { title: "Punições", href: "/admin/punicoes", icon: Gavel },
  { title: "Configurações", href: "/admin/configuracoes", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 h-screen w-[360px] border-r border-white/10 bg-black/65 px-5 py-5 backdrop-blur-2xl">
      <div className="flex h-full flex-col">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-green-300/25 bg-green-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-green-100">
            <Gauge size={14} />
            Administração
          </span>

          <h1 className="mt-4 text-3xl font-black uppercase leading-tight text-white">
            Painel Jogue Capão
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/65">
            Controle completo dos campeonatos municipais.
          </p>
        </div>

        <nav className="mt-6 flex-1 space-y-2 overflow-y-auto pr-1">
          {menu.map((item) => {
            const Icon = item.icon;
            const ativo =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.href === "/admin/dashboard" && pathname === "/admin");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "group flex items-center gap-4 rounded-2xl px-5 py-4 text-base font-black transition",
                  ativo
                    ? "bg-green-300/18 text-green-100 shadow-lg shadow-green-950/20"
                    : "text-white/72 hover:bg-green-300/12 hover:text-green-100",
                ].join(" ")}
              >
                <Icon
                  size={23}
                  className={[
                    "transition",
                    ativo ? "text-green-200" : "text-white/65 group-hover:text-green-200",
                  ].join(" ")}
                />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-white/10 pt-4">
          <Link
            href="/admin/logout"
            className="flex items-center gap-4 rounded-2xl px-5 py-4 text-base font-black text-red-100/80 transition hover:bg-red-500/15 hover:text-red-100"
          >
            <LogOut size={23} />
            Sair
          </Link>
        </div>
      </div>
    </aside>
  );
}
