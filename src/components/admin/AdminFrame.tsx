"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export function AdminFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin";

  if (isLoginPage) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-10 text-white">
        <div className="fixed inset-0 -z-30 bg-[url('/bg-estadio.jpg')] bg-cover bg-center opacity-75" />
        <div className="fixed inset-0 -z-20 bg-gradient-to-b from-slate-950/35 via-slate-950/62 to-slate-950/92" />
        <div className="fixed inset-0 -z-10 bg-gradient-to-r from-slate-950/52 via-slate-950/22 to-blue-950/40" />
        {children}
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <div className="fixed inset-0 -z-30 bg-[url('/bg-estadio.jpg')] bg-cover bg-center opacity-75" />
      <div className="fixed inset-0 -z-20 bg-gradient-to-b from-slate-950/35 via-slate-950/62 to-slate-950/92" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-r from-slate-950/52 via-slate-950/22 to-blue-950/40" />
      <div className="fixed -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="fixed -left-24 top-40 -z-10 h-80 w-80 rounded-full bg-yellow-300/10 blur-3xl" />

      <AdminSidebar />

      <section className="ml-[360px] min-h-screen w-[calc(100%-360px)] px-8 py-8">
        <div className="mx-auto w-full max-w-[1500px]">
          {children}
        </div>
      </section>
    </main>
  );
}
