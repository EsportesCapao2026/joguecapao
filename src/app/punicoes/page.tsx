import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Gavel, Search, ShieldAlert, UserRound } from "lucide-react";
import { supabasePublic } from "@/lib/supabasePublic";

type SearchParams = Promise<{
  busca?: string;
}>;

type Punicao = {
  id: string;
  campeonato_id: string | null;
  equipe_nome: string | null;
  atleta_nome: string | null;
  categoria_nome: string | null;
  serie_nome: string | null;
  motivo: string | null;
  artigo_cbjd: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  jogos_suspensao: number | null;
  status: string | null;
  origem: string | null;
  created_at: string | null;
};

function formatarData(data: string | null) {
  if (!data) return "N/A";
  const partes = data.split("-");
  if (partes.length !== 3) return data;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export default async function PunicoesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const buscaQuery = params.busca || "";

  let query = supabasePublic
    .from("punicoes")
    .select("*")
    .order("created_at", { ascending: false });

  if (buscaQuery.trim() !== "") {
    query = query.or(
      `atleta_nome.ilike.%${buscaQuery}%,equipe_nome.ilike.%${buscaQuery}%,motivo.ilike.%${buscaQuery}%`
    );
  }

  const { data: punicoesData } = await query;
  const punicoes = (punicoesData || []) as Punicao[];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020806] text-white">
      <Background />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 md:px-8">
        <Header />

        <section className="grid gap-6 pt-8 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="rounded-[36px] border border-white/10 bg-black/42 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-black text-emerald-200">
              <Gavel size={16} />
              Punições e suspensões
            </div>

            <h1 className="text-4xl font-black leading-tight md:text-6xl">
              Consulte atletas{" "}
              <span className="bg-gradient-to-r from-[#ffd400] via-[#67dd7a] to-[#00bde7] bg-clip-text text-transparent">
                suspensos.
            </span>
            </h1>

            <p className="mt-5 text-lg leading-8 text-white/68">
              Veja punições ativas, decisões desportivas, períodos de suspensão
              e atletas impedidos de atuar nos campeonatos municipais.
            </p>

            <form
              method="GET"
              action="/punicoes"
              className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.045] p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <Search className="text-emerald-300" size={22} />
                <h3 className="text-xl font-black">Buscar punição</h3>
              </div>
              <input
                name="busca"
                defaultValue={buscaQuery}
                placeholder="Digite atleta, equipe ou motivo..."
                className="w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-4 font-bold text-white outline-none placeholder:text-white/28 focus:border-emerald-300"
              />
              <button type="submit" className="hidden" />
            </form>
          </aside>

          <section className="rounded-[36px] border border-white/10 bg-black/44 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">
              Lista pública
            </p>
            <h2 className="mt-2 text-3xl font-black md:text-4xl">
              Suspensões ativas
            </h2>

            {punicoes.length === 0 ? (
              <div className="mt-7 rounded-[28px] border border-yellow-300/20 bg-yellow-300/10 p-6 text-yellow-100/80 leading-7">
                Nenhum registro de punição encontrado{buscaQuery ? " para a busca realizada." : "."}
              </div>
            ) : (
              <div className="mt-7 space-y-4">
                {punicoes.map((punicao) => (
                  <article
                    key={punicao.id}
                    className="rounded-[28px] border border-white/10 bg-white/[0.055] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-300/12 text-emerald-300">
                          <UserRound size={25} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black uppercase">
                            {punicao.atleta_nome || "Atleta não informado"}
                          </h3>
                          <p className="mt-1 text-emerald-300 font-bold uppercase text-sm">
                            {punicao.equipe_nome || "Equipe não informada"}
                            {punicao.categoria_nome ? ` • ${punicao.categoria_nome}` : ""}
                            {punicao.serie_nome ? ` • ${punicao.serie_nome}` : ""}
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-red-500/20 border border-red-500/30 px-4 py-2 text-xs font-black text-red-200 uppercase">
                        {punicao.status || "Ativa"}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <Info
                        icon={<ShieldAlert size={18} />}
                        label="Motivo / Artigo"
                        value={`${punicao.motivo || "Não informado"}${
                          punicao.artigo_cbjd ? ` (${punicao.artigo_cbjd})` : ""
                        }`}
                      />
                      <Info
                        icon={<CalendarDays size={18} />}
                        label="Período / Jogos"
                        value={
                          punicao.jogos_suspensao
                            ? `${punicao.jogos_suspensao} jogo(s) de suspensão`
                            : `De ${formatarData(punicao.data_inicio)} até ${formatarData(
                                punicao.data_fim
                              )}`
                        }
                      />
                    </div>
                  </article>
                ))}
              </div>
            )}
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

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="mb-2 flex items-center gap-2 text-emerald-300">
        {icon}
        <span className="text-xs font-black uppercase tracking-[0.18em] text-white/45">{label}</span>
      </div>
      <p className="font-bold text-white/75">{value}</p>
    </div>
  );
}
