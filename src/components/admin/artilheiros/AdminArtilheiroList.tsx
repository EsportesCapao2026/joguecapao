"use client";

import { useMemo, useState } from "react";
import { Filter, Medal, Trash2 } from "lucide-react";
import { removerRegistroGols } from "@/app/admin/artilheiros/actions";

type CategoriaConfig = {
  nome: string;
  ativo?: boolean;
  series_ativas?: boolean;
  series_lista?: string[];
};

type Campeonato = {
  id: string;
  nome: string;
  modalidade: string | null;
  categorias_lista: CategoriaConfig[] | string[] | null;
};

type Atleta = {
  id: string;
  equipe_id: string | null;
  nome: string;
  numero_camisa: string | null;
};

type GolRegistro = {
  id: string;
  campeonato_id: string | null;
  jogo_id: string | null;
  equipe_id: string | null;
  atleta_id: string | null;
  atleta_nome: string | null;
  equipe_nome: string | null;
  quantidade: number | null;
  categoria_nome: string | null;
  serie_nome: string | null;
  created_at: string | null;
};

type Props = {
  campeonatos: Campeonato[];
  atletas: Atleta[];
  gols: GolRegistro[];
};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-yellow-300/60 focus:ring-2 focus:ring-yellow-300/10";

const labelClass =
  "mb-2 block text-sm font-black uppercase tracking-[0.08em] text-white/75";

function normalizarCategorias(
  categorias: Campeonato["categorias_lista"]
): CategoriaConfig[] {
  if (!Array.isArray(categorias)) return [];

  return categorias
    .map((categoria) => {
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
        ativo: categoria.ativo !== false,
        series_ativas: categoria.series_ativas === true,
        series_lista: Array.isArray(categoria.series_lista)
          ? categoria.series_lista.filter(Boolean)
          : [],
      };
    })
    .filter((categoria) => categoria.ativo !== false && categoria.nome);
}

function nomeAtleta(
  registro: GolRegistro,
  atletaPorId: Map<string, Atleta>
) {
  if (registro.atleta_nome) return registro.atleta_nome;
  if (registro.atleta_id) return atletaPorId.get(registro.atleta_id)?.nome || null;
  return null;
}

export function AdminArtilheiroList({ campeonatos, atletas, gols }: Props) {
  const [campeonatoId, setCampeonatoId] = useState("");
  const [listagemAberta, setListagemAberta] = useState(false);
  const [categoriaNome, setCategoriaNome] = useState("");
  const [serieNome, setSerieNome] = useState("");

  const atletaPorId = useMemo(() => {
    return new Map(atletas.map((atleta) => [atleta.id, atleta]));
  }, [atletas]);

  const campeonatoSelecionado = useMemo(() => {
    return campeonatos.find((campeonato) => campeonato.id === campeonatoId);
  }, [campeonatos, campeonatoId]);

  const categoriasDoCampeonato = useMemo(() => {
    if (!campeonatoSelecionado) return [];

    const categorias = normalizarCategorias(campeonatoSelecionado.categorias_lista);
    const porNome = new Map(categorias.map((categoria) => [categoria.nome, categoria]));

    gols
      .filter((gol) => gol.campeonato_id === campeonatoSelecionado.id)
      .forEach((gol) => {
        if (!gol.categoria_nome || porNome.has(gol.categoria_nome)) return;
        porNome.set(gol.categoria_nome, {
          nome: gol.categoria_nome,
          ativo: true,
          series_ativas: Boolean(gol.serie_nome),
          series_lista: gol.serie_nome ? [gol.serie_nome] : [],
        });
      });

    return Array.from(porNome.values());
  }, [campeonatoSelecionado, gols]);

  const categoriaSelecionada = useMemo(() => {
    return categoriasDoCampeonato.find(
      (categoria) => categoria.nome === categoriaNome
    );
  }, [categoriasDoCampeonato, categoriaNome]);

  const seriesDisponiveis = useMemo(() => {
    if (!campeonatoSelecionado || !categoriaNome) return [];

    const series = new Set<string>(
      categoriaSelecionada?.series_lista?.filter(Boolean) || []
    );

    gols
      .filter(
        (gol) =>
          gol.campeonato_id === campeonatoSelecionado.id &&
          gol.categoria_nome === categoriaNome &&
          gol.serie_nome
      )
      .forEach((gol) => {
        if (gol.serie_nome) series.add(gol.serie_nome);
      });

    return Array.from(series.values()).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [campeonatoSelecionado, categoriaNome, categoriaSelecionada, gols]);

  const golsFiltrados = useMemo(() => {
    if (!campeonatoSelecionado || !categoriaNome) return [];

    return gols.filter((gol) => {
      const mesmoCampeonato = gol.campeonato_id === campeonatoSelecionado.id;
      const mesmaCategoria = gol.categoria_nome === categoriaNome;
      const mesmaSerie = serieNome ? gol.serie_nome === serieNome : true;

      return mesmoCampeonato && mesmaCategoria && mesmaSerie;
    });
  }, [campeonatoSelecionado, categoriaNome, serieNome, gols]);

  const ranking = useMemo(() => {
    const agrupado = new Map<
      string,
      {
        atleta_nome: string;
        equipe_nome: string;
        gols: number;
      }
    >();

    golsFiltrados.forEach((registro) => {
      const chave =
        registro.atleta_id ||
        `${registro.atleta_nome || "sem-atleta"}-${registro.equipe_id || ""}`;
      const existente = agrupado.get(chave) || {
        atleta_nome: nomeAtleta(registro, atletaPorId) || "Atleta não identificado",
        equipe_nome: registro.equipe_nome || "Equipe",
        gols: 0,
      };

      existente.gols += registro.quantidade || 0;
      agrupado.set(chave, existente);
    });

    return Array.from(agrupado.values()).sort((a, b) => b.gols - a.gols);
  }, [atletaPorId, golsFiltrados]);

  function abrirListagem() {
    if (!campeonatoId) return;

    const primeiraCategoria = categoriasDoCampeonato[0]?.nome || "";
    setCategoriaNome((categoriaAtual) => categoriaAtual || primeiraCategoria);
    setSerieNome("");
    setListagemAberta(true);
  }

  function trocarCampeonato(id: string) {
    setCampeonatoId(id);
    setListagemAberta(false);
    setCategoriaNome("");
    setSerieNome("");
  }

  function trocarCategoria(nome: string) {
    setCategoriaNome(nome);
    setSerieNome("");
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="inline-flex rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-yellow-100">
            GOLS LANÇADOS
          </span>

          <h2 className="mt-3 text-2xl font-black uppercase text-white">
            LISTA DE REGISTROS
          </h2>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-black text-white/70">
          {gols.length} registro(s)
        </span>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
        <label className="block">
          <span className={labelClass}>Campeonato</span>
          <select
            value={campeonatoId}
            onChange={(event) => trocarCampeonato(event.target.value)}
            className={inputClass}
          >
            <option value="">Selecione o campeonato</option>
            {campeonatos.map((campeonato) => (
              <option key={campeonato.id} value={campeonato.id}>
                {campeonato.nome}
                {campeonato.modalidade ? ` - ${campeonato.modalidade}` : ""}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={abrirListagem}
          disabled={!campeonatoId}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-green-400 to-blue-500 px-5 py-4 text-sm font-black uppercase text-slate-950 shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Filter size={18} />
          Abrir listagem
        </button>
      </div>

      {!listagemAberta && (
        <div className="mt-4 rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-sm leading-7 text-yellow-50">
          Selecione um campeonato para carregar os artilheiros registrados.
        </div>
      )}

      {listagemAberta && campeonatoSelecionado && (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Categoria</span>
              <select
                value={categoriaNome}
                onChange={(event) => trocarCategoria(event.target.value)}
                className={inputClass}
              >
                <option value="">Selecione a categoria</option>
                {categoriasDoCampeonato.map((categoria) => (
                  <option key={categoria.nome} value={categoria.nome}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={labelClass}>Série</span>
              <select
                value={serieNome}
                onChange={(event) => setSerieNome(event.target.value)}
                disabled={!categoriaNome || seriesDisponiveis.length === 0}
                className={inputClass}
              >
                <option value="">
                  {seriesDisponiveis.length > 0 ? "Todas as séries" : "Sem série"}
                </option>
                {seriesDisponiveis.map((serie) => (
                  <option key={serie} value={serie}>
                    {serie}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!categoriaNome && (
            <div className="rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-sm leading-7 text-yellow-50">
              Escolha uma categoria para exibir a artilharia.
            </div>
          )}

          {categoriaNome && golsFiltrados.length === 0 && (
            <div className="rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-sm leading-7 text-yellow-50">
              Nenhum gol lançado para esse filtro.
            </div>
          )}

          {categoriaNome && golsFiltrados.length > 0 && (
            <>
              <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-5">
                <div className="mb-4 flex items-center gap-2 text-emerald-100">
                  <Medal size={18} />
                  <h3 className="text-lg font-black uppercase">
                    Ranking do filtro
                  </h3>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.16em] text-white/52">
                      <tr>
                        <th className="px-3 py-3">#</th>
                        <th className="px-3 py-3">Atleta</th>
                        <th className="px-3 py-3">Equipe</th>
                        <th className="px-3 py-3 text-center">G</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {ranking.map((item, index) => (
                        <tr key={`${item.atleta_nome}-${item.equipe_nome}`} className="bg-black/16">
                          <td className="px-3 py-3 font-black text-emerald-300">
                            {index + 1}
                          </td>
                          <td className="px-3 py-3 font-black uppercase text-white">
                            {item.atleta_nome}
                          </td>
                          <td className="px-3 py-3 text-xs font-bold uppercase text-white/60">
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
              </div>

              <div className="space-y-4">
                {golsFiltrados.map((g) => (
                  <article
                    key={g.id}
                    className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-xl"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <div>
                        <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-black uppercase text-emerald-200">
                          {g.quantidade || 0} GOL(S)
                        </span>

                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-white/45">
                          {campeonatoSelecionado.nome}
                        </p>

                        <h3 className="mt-1 text-xl font-black uppercase text-white">
                          {nomeAtleta(g, atletaPorId) || "Atleta não identificado"}
                        </h3>

                        <p className="text-sm font-bold uppercase text-emerald-300">
                          {g.equipe_nome || "Equipe"}
                          {g.categoria_nome ? ` - ${g.categoria_nome}` : ""}
                          {g.serie_nome ? ` - ${g.serie_nome}` : ""}
                        </p>
                      </div>

                      <form action={removerRegistroGols}>
                        <input type="hidden" name="gol_id" value={g.id} />
                        <input
                          type="hidden"
                          name="campeonato_id"
                          value={g.campeonato_id || ""}
                        />
                        <button
                          type="submit"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-black uppercase text-red-100 transition hover:bg-red-500/20 md:w-auto"
                        >
                          <Trash2 size={14} />
                          Excluir
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
