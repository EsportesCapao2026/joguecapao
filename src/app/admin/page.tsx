import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { loginAdmin } from "./actions";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ erro?: string; bloqueado?: string }>;
}) {
  const params = await searchParams;
  const hasError = params?.erro === "1";
  const blocked = params?.bloqueado === "1";

  return (
    <div className="space-y-6 text-white">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50"
        style={{ backgroundImage: "url('/bg-estadio.jpg')" }}
      />
      <div className="fixed inset-0 z-[1] bg-black/60" />
      <div className="fixed inset-0 z-[2] bg-[radial-gradient(circle_at_top_left,rgba(255,213,0,0.15),transparent_26%),radial-gradient(circle_at_top_right,rgba(0,195,255,0.16),transparent_30%),linear-gradient(to_bottom,rgba(0,0,0,0.12),rgba(0,0,0,0.76))]" />

      <section className="relative z-10 w-full max-w-xl rounded-[38px] border border-white/10 bg-black/48 p-7 shadow-2xl backdrop-blur-xl md:p-9">
        <Link href="/" className="mb-8 block">
          <div className="relative h-28 w-[340px]">
            <Image
              src="/logo-capao.png"
              alt="Prefeitura de Capão da Canoa"
              fill
              priority
              sizes="340px"
              className="object-contain object-left"
            />
          </div>
        </Link>

        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-black text-emerald-200">
          <ShieldCheck size={16} />
          Acesso restrito
        </div>

        <h1 className="text-4xl font-black leading-tight md:text-5xl">
          Área administrativa
        </h1>

        <p className="mt-4 leading-7 text-white/62">
          Digite a senha de acesso. O sistema identifica automaticamente se o
          login é de administrador ou master.
        </p>

        {blocked && (
          <div className="mt-5 rounded-2xl border border-yellow-300/25 bg-yellow-300/10 px-4 py-3 font-bold text-yellow-100">
            Faça login para acessar o painel administrativo.
          </div>
        )}

        {hasError && (
          <div className="mt-5 rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 font-bold text-red-100">
            Senha incorreta. Confira a senha e tente novamente.
          </div>
        )}

        <form action={loginAdmin} className="mt-7 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-black text-white/70">
              Senha de acesso
            </span>
            <input
              name="password"
              type="password"
              placeholder="Digite a senha admin ou master"
              className="w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-4 font-bold text-white outline-none placeholder:text-white/28 focus:border-emerald-300"
            />
          </label>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ffd400] via-[#67dd7a] to-[#00bde7] px-6 py-4 font-black text-black transition hover:scale-[1.02]"
          >
            <LockKeyhole size={18} />
            Entrar com segurança
          </button>

          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-4 font-black text-white transition hover:bg-white/[0.1]"
          >
            <ArrowLeft size={18} />
            Voltar para início
          </Link>
        </form>
      </section>
    </div>
  );
}
