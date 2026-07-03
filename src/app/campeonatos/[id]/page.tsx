import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Layers,
  Medal,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { supabasePublic } from "@/lib/supabasePublic";

type CategoriaConfig = {
  nome: string;
  ativo: boolean;
  series_ativas: boolean;
  series_lista: string[];
};

type Campeonato = {
  id: string;
  nome: string;
  modalidade: string | null;
  descricao: string | null;
  status: string | null;
  categorias_lista: CategoriaConfig[] | string[] | null;
  series_lista: string[] | null;
  inscricoes_abertas: boolean | null;
  data_inicio: string | null;
  data_fim: string | null;
};

type EquipeAprovada = {
  id: string;
  nome_equipe: string | null;
  cidade: string | null;
  categoria: string | null;
  serie: string | null;
  nome_tecnico: string | null;
  logo_url: string | null;
};

type Jogo = {
  id: string;
  campeonato_id: string | null;
  categoria: string | null;
  serie: string | null;
  equipe_mandante_id: string | null;
  equipe_visitante_id: string | null;
  equipe_mandante_nome: string | null;
  equipe_visitante_nome: string | null;
  data_jogo: string | null;
  horario: string | null;
  local: string | null;
  rodada: string | null;
  gols_mandante: number | null;
  gols_visitante: number | null;
  status: string | null;
};

type PageParams = Promise<{
  id: string;
}>;

type PageSearchParams = Promise<{
  categoria?: string;
}>;

function statusLabel(status: string | null) {
  if (status === "ativo") return "Ativo";
  if (status === "pausado") return "Pausado";
  if (status === "encerrado") return "Encerrado";
  return "Sem status";
}

function statusClass(status: string | null) {
  if (status === "ativo") return "bg-emerald-300 text-black";
  if (status === "pausado") return "border border-yellow-300/30 bg-yellow-300/10 text-yellow-100";
  if (status === "encerrado") return "border border-red-300/30 bg-red-500/10 text-red-100";
  return "border border-white/10 bg-white/10 text-white/70";
}

function formatarData(data: string | null) {
  if (!data) return "Não informada";

  const partes = data.split("-");
  if (partes.length !== 3) return data;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function normalizarCategorias(categorias: Campeonato["categorias_lista"]) {
  if (!categorias || categorias.length === 0) return [];

  return categorias.map((categoria) => {
    if (typeof categoria === "string") {
      return {
        nome: categoria,
        ativo: true,
        series_ativas: false,
        series_lista: [],
      };
    }

    return {
      nome: categoria.nome,
      ativo: categoria.ativo,
      series_ativas: categoria.series_ativas,
      series_lista: categoria.series_lista || [],
    };
  });
}

function montarClassificacao(equipes: EquipeAprovada[], jogos: Jogo[]) {
  const tabela = new Map<
    string,
    {
      id: string;
      nome: string;
      jogos: number;
      vitorias: number;
      empates: number;
      derrotas: number;
      golsPro: number;
      golsContra: number;
      saldo: number;
      pontos: number;
    }
  >();

  for (const equipe of equipes) {
    tabela.set(equipe.id, {
      id: equipe.id,
      nome: equipe.nome_equipe || "Equipe sem nome",
      jogos: 0,
      vitorias: 0,
      empates: 0,
      derrotas: 0,
      golsPro: 0,
      golsContra: 0,
      saldo: 0,
      pontos: 0,
    });
  }

  const jogosRealizados = jogos.filter(
    (jogo) =>
      jogo.status === "realizado" &&
      jogo.gols_mandante !== null &&
      jogo.gols_visitante !== null
  );

  for (const jogo of jogosRealizados) {
    const mandanteId = jogo.equipe_mandante_id || "";
    const visitanteId = jogo.equipe_visitante_id || "";

    if (!tabela.has(mandanteId)) {
      tabela.set(mandanteId, {
        id: mandanteId,
        nome: jogo.equipe_mandante_nome || "Mandante",
        jogos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        golsPro: 0,
        golsContra: 0,
        saldo: 0,
        pontos: 0,
      });
    }

    if (!tabela.has(visitanteId)) {
      tabela.set(visitanteId, {
        id: visitanteId,
        nome: jogo.equipe_visitante_nome || "Visitante",
        jogos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        golsPro: 0,
        golsContra: 0,
        saldo: 0,
        pontos: 0,
      });
    }

    const mandante = tabela.get(mandanteId);
    const visitante = tabela.get(visitanteId);

    if (!mandante || !visitante) continue;

    const golsMandante = jogo.gols_mandante || 0;
    const golsVisitante = jogo.gols_visitante || 0;

    mandante.jogos += 1;
    visitante.jogos += 1;

    mandante.golsPro += golsMandante;
    mandante.golsContra += golsVisitante;

    visitante.golsPro += golsVisitante;
    visitante.golsContra += golsMandante;

    if (golsMandante > golsVisitante) {
      mandante.vitorias += 1;
      mandante.pontos += 3;
      visitante.derrotas += 1;
    } else if (golsMandante < golsVisitante) {
      visitante.vitorias += 1;
      visitante.pontos += 3;
      mandante.derrotas += 1;
    } else {
      mandante.empates += 1;
      visitante.empates += 1;
      mandante.pontos += 1;
      visitante.pontos += 1;
    }
  }

  return Array.from(tabela.values())
    .map((item) => ({
      ...item,
      saldo: item.golsPro - item.golsContra,
    }))
    .sort((a, b) => {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
      if (b.saldo !== a.saldo) return b.saldo - a.saldo;
      if (b.golsPro !== a.golsPro) return b.golsPro - a.golsPro;
      return a.nome.localeCompare(b.nome);
    });
}

export default async function CampeonatoDetalhePage({
  params,
  searchParams,
}: {
  params: PageParams;
  searchParams: PageSearchParams;
}) {
  const { id } = await params;
  const busca = await searchParams;

  const { data, error } = await supabasePublic
    .from("campeonatos")
    .select(
      "id, nome, modalidade, descricao, status, categorias_lista, series_lista, inscricoes_abertas, data_inicio, data_fim"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const campeonato = data as Campeonato;
  const categorias = normalizarCategorias(campeonato.categorias_lista).filter(
    (categoria) => categoria.ativo !== false
  );

  const categoriaAtiva =
    busca.categoria && categorias.some((categoria) => categoria.nome === busca.categoria)
      ? busca.categoria
      : categorias[0]?.nome || "Geral";

  const { data: equipesData } = await supabasePublic
    .from("inscricoes")
    .select("id, nome_equipe, cidade, categoria, serie, nome_tecnico, logo_url")
    .eq("campeonato_id", campeonato.id)
    .eq("status", "aprovada")
    .order("nome_equipe", { ascending: true });

  const equipesAprovadas = (equipesData || []) as EquipeAprovada[];

  const { data: jogosData } = await supabasePublic
    .from("jogos")
    .select(
      "id, campeonato_id, categoria, serie, equipe_mandante_id, equipe_visitante_id, equipe_mandante_nome, equipe_visitante_nome, data_jogo, horario, local, rodada, gols_mandante, gols_visitante, status"
    )
    .eq("campeonato_id", campeonato.id)
    .order("data_jogo", { ascending: true });

  const jogos = (jogosData || []) as Jogo[];

  // Buscar gols deste campeonato
  const { data: golsData } = await supabasePublic
    .from("gols")
    .select("atleta_id, atleta_nome, equipe_nome, quantidade, categoria_nome")
    .eq("campeonato_id", campeonato.id);

  const gols = (golsData || []) as {
    atleta_id: string;
    atleta_nome: string | null;
    equipe_nome: string | null;
    quantidade: number;
    categoria_nome: string | null;
  }[];

  const equipesDaCategoria = equipesAprovadas.filter((equipe) => {
    if (categoriaAtiva === "Geral") return true;
    return equipe.categoria === categoriaAtiva;
  });

  const jogosDaCategoria = jogos.filter((jogo) => {
    if (categoriaAtiva === "Geral") return true;
    return jogo.categoria === categoriaAtiva;
  });

  const golsDaCategoria = gols.filter((gol) => {
    if (categoriaAtiva === "Geral") return true;
    return gol.categoria_nome === categoriaAtiva;
  });

  const classificacao = montarClassificacao(equipesDaCategoria, jogosDaCategoria);

  const jogosRealizados = jogosDaCategoria.filter((jogo) => jogo.status === "realizado").length;
  const proximosJogos = jogosDaCategoria.filter((jogo) => jogo.status !== "realizado").slice(0, 5);

  // Calcular ranking de artilharia
  const artilhariaMap = new Map<string, { atleta_nome: string; equipe_nome: string; gols: number }>();
  golsDaCategoria.forEach((g) => {
    const chave = g.atleta_id;
    const existente = artilhariaMap.get(chave) || {
      atleta_nome: g.atleta_nome || "Atleta",
      equipe_nome: g.equipe_nome || "Equipe",
      gols: 0,
    };
    existente.gols += g.quantidade;
    artilhariaMap.set(chave, existente);
  });

  const artilhariaRanking = Array.from(artilhariaMap.values())
    .sort((a, b) => b.gols - a.gols)
    .slice(0, 10);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020806] text-white">
      <Background />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-4 md:px-6">
        <Link
          href="/campeonatos"
          className="mb-5 inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-black/42 px-4 py-2.5 text-sm font-black text-white backdrop-blur-xl transition hover:bg-white/[0.1]"
        >
          <ArrowLeft size={17} />
          Voltar para campeonatos
        </Link>

        <section className="rounded-[26px] border border-white/10 bg-black/42 p-5 shadow-xl backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
                  <Trophy size={13} />
                  Campeonato
                </span>

                <span className={`rounded-full px-3 py-1.5 text-xs font-black ${statusClass(campeonato.status)}`}>
                  {statusLabel(campeonato.status)}
                </span>

                {campeonato.inscricoes_abertas && (
                  <span className="rounded-full border border-blue-300/25 bg-blue-500/10 px-3 py-1.5 text-xs font-black text-blue-100">
                    Inscrições abertas
                  </span>
                )}

                {campeonato.modalidade && (
                  <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-xs font-bold text-white/75">
                    {campeonato.modalidade}
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-black leading-tight md:text-4xl">
                {campeonato.nome}
              </h1>

              {campeonato.descricao && (
                <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-white/62">
                  {campeonato.descricao}
                </p>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:w-[430px]">
              <Resumo icon={<CalendarDays size={18} />} label="Período" value={`${formatarData(campeonato.data_inicio)} até ${formatarData(campeonato.data_fim)}`} />
              <Resumo icon={<Users size={18} />} label="Equipes" value={`${equipesAprovadas.length}`} />
              <Resumo icon={<Layers size={18} />} label="Categorias" value={`${categorias.length || 1}`} />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="rounded-[26px] border border-white/10 bg-black/42 p-5 shadow-xl backdrop-blur-xl md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
                  Categorias
                </p>
                <h2 className="mt-1 text-2xl font-black">Resumo</h2>
              </div>

              <ShieldCheck className="text-emerald-300" size={24} />
            </div>

            <div className="space-y-3">
              {(categorias.length > 0 ? categorias : [{ nome: "Geral", ativo: true, series_ativas: false, series_lista: [] }]).map((categoria) => {
                const equipesCategoria = equipesAprovadas.filter((equipe) =>
                  categoria.nome === "Geral" ? true : equipe.categoria === categoria.nome
                );

                const jogosCategoria = jogos.filter((jogo) =>
                  categoria.nome === "Geral" ? true : jogo.categoria === categoria.nome
                );

                const ativo = categoriaAtiva === categoria.nome;

                return (
                  <Link
                    key={categoria.nome}
                    href={`/campeonatos/${campeonato.id}?categoria=${encodeURIComponent(categoria.nome)}`}
                    className={`block rounded-[20px] border p-4 transition ${
                      ativo
                        ? "border-emerald-300/40 bg-emerald-300/10"
                        : "border-white/10 bg-white/[0.045] hover:border-white/20 hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-black">{categoria.nome}</h3>
                      <ChevronRight size={18} className={ativo ? "text-emerald-300" : "text-white/35"} />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <span className="rounded-2xl bg-black/24 px-3 py-2 text-white/65">
                        {equipesCategoria.length} equipes
                      </span>
                      <span className="rounded-2xl bg-black/24 px-3 py-2 text-white/65">
                        {jogosCategoria.length} jogos
                      </span>
                    </div>

                    {categoria.series_ativas && categoria.series_lista.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {categoria.series_lista.map((serie) => (
                          <span
                            key={serie}
                            className="rounded-full border border-blue-300/20 bg-blue-500/10 px-2.5 py-1 text-[11px] font-black text-blue-100"
                          >
                            {serie}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 grid gap-3">
              {campeonato.inscricoes_abertas && (
                <Link
                  href={`/inscricoes?campeonato=${campeonato.id}`}
                  className="rounded-2xl bg-gradient-to-r from-[#ffd400] via-[#67dd7a] to-[#00bde7] px-4 py-3 text-center text-sm font-black text-black transition hover:scale-[1.01]"
                >
                  Inscrever equipe
                </Link>
              )}

              <Link
                href="/regras"
                className="rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-center text-sm font-black text-white transition hover:bg-white/[0.1]"
              >
                Ver regras
              </Link>
            </div>
          </aside>

          <section className="space-y-5">
            <div className="rounded-[26px] border border-white/10 bg-black/44 p-5 shadow-xl backdrop-blur-xl md:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
                    Categoria selecionada
                  </p>
                  <h2 className="mt-1 text-2xl font-black">{categoriaAtiva}</h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-black text-white/70">
                    {equipesDaCategoria.length} equipes
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-black text-white/70">
                    {jogosDaCategoria.length} jogos
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-black text-white/70">
                    {jogosRealizados} realizados
                  </span>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-[20px] border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.16em] text-white/52">
                    <tr>
                      <th className="px-3 py-3">#</th>
                      <th className="px-3 py-3">Equipe</th>
                      <th className="px-3 py-3 text-center">P</th>
                      <th className="px-3 py-3 text-center">J</th>
                      <th className="px-3 py-3 text-center">V</th>
                      <th className="px-3 py-3 text-center">E</th>
                      <th className="px-3 py-3 text-center">D</th>
                      <th className="px-3 py-3 text-center">SG</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/10">
                    {classificacao.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-3 py-5 text-center text-white/55">
                          Nenhuma equipe aprovada nesta categoria.
                        </td>
                      </tr>
                    ) : (
                      classificacao.map((item, index) => (
                        <tr key={item.id || item.nome} className="bg-black/16">
                          <td className="px-3 py-3 font-black text-emerald-300">
                            {index + 1}
                          </td>
                          <td className="px-3 py-3 font-black text-white">
                            {item.nome}
                          </td>
                          <td className="px-3 py-3 text-center font-black">{item.pontos}</td>
                          <td className="px-3 py-3 text-center text-white/65">{item.jogos}</td>
                          <td className="px-3 py-3 text-center text-white/65">{item.vitorias}</td>
                          <td className="px-3 py-3 text-center text-white/65">{item.empates}</td>
                          <td className="px-3 py-3 text-center text-white/65">{item.derrotas}</td>
                          <td className="px-3 py-3 text-center text-white/65">{item.saldo}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-[26px] border border-white/10 bg-black/44 p-5 shadow-xl backdrop-blur-xl md:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <CalendarDays className="text-emerald-300" size={22} />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
                      Jogos
                    </p>
                    <h3 className="text-xl font-black">Próximos confrontos</h3>
                  </div>
                </div>

                {proximosJogos.length === 0 ? (
                  <div className="rounded-[20px] border border-yellow-300/20 bg-yellow-300/10 p-4 text-sm leading-6 text-yellow-50">
                    Nenhum próximo jogo cadastrado nesta categoria.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {proximosJogos.map((jogo) => (
                      <div
                        key={jogo.id}
                        className="rounded-[20px] border border-white/10 bg-white/[0.045] p-4"
                      >
                        <p className="text-sm font-black">
                          {jogo.equipe_mandante_nome || "Mandante"} x{" "}
                          {jogo.equipe_visitante_nome || "Visitante"}
                        </p>

                        <p className="mt-2 text-xs leading-5 text-white/55">
                          {formatarData(jogo.data_jogo)} {jogo.horario ? `às ${jogo.horario}` : ""}
                          {jogo.local ? ` • ${jogo.local}` : ""}
                          {jogo.rodada ? ` • ${jogo.rodada}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-[26px] border border-white/10 bg-black/44 p-5 shadow-xl backdrop-blur-xl md:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Medal className="text-emerald-300" size={22} />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
                      Artilharia
                    </p>
                    <h3 className="text-xl font-black">Goleadores</h3>
                  </div>
                </div>

                {artilhariaRanking.length === 0 ? (
                  <div className="rounded-[20px] border border-blue-300/20 bg-blue-500/10 p-4 text-sm leading-6 text-blue-50">
                    A artilharia será exibida aqui quando os gols dos atletas
                    forem lançados pela organização.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-[20px] border border-white/10">
                    <table className="w-full text-left text-sm text-white">
                      <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.16em] text-white/52">
                        <tr>
                          <th className="px-3 py-3">#</th>
                          <th className="px-3 py-3">Atleta</th>
                          <th className="px-3 py-3">Equipe</th>
                          <th className="px-3 py-3 text-center">G</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {artilhariaRanking.map((item, index) => (
                          <tr key={index} className="bg-black/16">
                            <td className="px-3 py-3 font-black text-emerald-300">
                              {index + 1}
                            </td>
                            <td className="px-3 py-3 font-black">
                              {item.atleta_nome}
                            </td>
                            <td className="px-3 py-3 text-xs uppercase font-bold text-white/60">
                              {item.equipe_nome}
                            </td>
                            <td className="px-3 py-3 text-center font-black text-emerald-300">
                              {item.gols}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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

function Resumo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.045] p-4">
      <div className="mb-2 text-emerald-300">{icon}</div>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-white/42">
        {label}
      </p>
      <p className="mt-1 text-sm font-black leading-5 text-white">{value}</p>
    </div>
  );
}
