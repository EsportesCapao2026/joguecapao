"use client";

import { useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import { atualizarCampeonato } from "@/app/admin/campeonatos/actions";

type CategoriaConfig = {
  nome: string;
  ativo?: boolean;
  series_ativas?: boolean;
  series_lista?: string[];
};

type CampeonatoEditavel = {
  id: string;
  nome: string;
  modalidade: string | null;
  descricao: string | null;
  status: string | null;
  categorias_lista: CategoriaConfig[] | string[] | null;
  inscricoes_abertas: boolean | null;
  data_inicio: string | null;
  data_fim: string | null;
};

type Props = {
  campeonato: CampeonatoEditavel;
};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-yellow-300/60 focus:ring-2 focus:ring-yellow-300/10";

const labelClass = "mb-2 block text-sm font-black text-white/75";

const seriesPadrao = ["Série Ouro", "Série Prata", "Série Bronze"];

function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizarCategorias(
  categorias: CampeonatoEditavel["categorias_lista"]
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
          ? categoria.series_lista
          : [],
      };
    })
    .filter((categoria) => categoria.nome);
}

function categoriaPorNome(categorias: CategoriaConfig[], nome: string) {
  const nomeNormalizado = normalizarTexto(nome);
  return categorias.find(
    (categoria) => normalizarTexto(categoria.nome) === nomeNormalizado
  );
}

function seriesExtras(categoria: CategoriaConfig | undefined) {
  if (!categoria?.series_lista) return "";

  return categoria.series_lista
    .filter(
      (serie) =>
        !seriesPadrao.some(
          (seriePadrao) => normalizarTexto(seriePadrao) === normalizarTexto(serie)
        )
    )
    .join(", ");
}

function categoriaTemSerie(categoria: CategoriaConfig | undefined, serie: string) {
  return Boolean(
    categoria?.series_lista?.some(
      (serieCadastrada) =>
        normalizarTexto(serieCadastrada) === normalizarTexto(serie)
    )
  );
}

function nomesCategoriasExtras(categorias: CategoriaConfig[]) {
  return categorias
    .filter((categoria) => {
      const nome = normalizarTexto(categoria.nome);
      return nome !== "masculino" && nome !== "feminino";
    })
    .map((categoria) => categoria.nome)
    .join(", ");
}

export function AdminCampeonatoEditButton({ campeonato }: Props) {
  const [aberto, setAberto] = useState(false);
  const categorias = normalizarCategorias(campeonato.categorias_lista);
  const masculino = categoriaPorNome(categorias, "Masculino");
  const feminino = categoriaPorNome(categorias, "Feminino");

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-300/30 bg-blue-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.15em] text-blue-100 transition hover:bg-blue-500/20"
      >
        <Pencil size={15} />
        Editar
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-[#07110d] p-5 text-white shadow-2xl md:p-7">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <span className="inline-flex rounded-full border border-blue-300/25 bg-blue-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                  Editar campeonato
                </span>

                <h3 className="mt-3 text-2xl font-black text-white">
                  {campeonato.nome}
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/60">
                  As alterações podem ser feitas mesmo com inscrições abertas ou
                  campeonato em andamento.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAberto(false)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-xs font-black uppercase text-white/75 transition hover:bg-white/[0.1]"
              >
                <X size={16} />
                Fechar
              </button>
            </div>

            <form action={atualizarCampeonato} className="space-y-4">
              <input type="hidden" name="id" value={campeonato.id} />

              <label className="block">
                <span className={labelClass}>Nome do campeonato</span>
                <input
                  name="nome"
                  required
                  defaultValue={campeonato.nome}
                  className={inputClass}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Modalidade</span>
                  <input
                    name="modalidade"
                    defaultValue={campeonato.modalidade || ""}
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>Status</span>
                  <select
                    name="status"
                    className={inputClass}
                    defaultValue={campeonato.status || "ativo"}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="pausado">Pausado</option>
                    <option value="encerrado">Encerrado</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className={labelClass}>Descrição</span>
                <textarea
                  name="descricao"
                  rows={5}
                  defaultValue={campeonato.descricao || ""}
                  className={inputClass}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Data de início</span>
                  <input
                    name="data_inicio"
                    type="date"
                    defaultValue={campeonato.data_inicio || ""}
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>Data de fim</span>
                  <input
                    name="data_fim"
                    type="date"
                    defaultValue={campeonato.data_fim || ""}
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="mb-4">
                  <span className="inline-flex rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-yellow-100">
                    Categorias e séries
                  </span>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                    <label className="flex items-center gap-3 text-sm font-black text-white">
                      <input
                        name="masculino_ativa"
                        type="checkbox"
                        defaultChecked={Boolean(masculino)}
                        className="h-5 w-5 accent-yellow-300"
                      />
                      Categoria Masculino
                    </label>

                    <label className="mt-4 flex items-center gap-3 text-sm font-bold text-white/75">
                      <input
                        name="masculino_series_ativas"
                        type="checkbox"
                        defaultChecked={masculino?.series_ativas === true}
                        className="h-5 w-5 accent-yellow-300"
                      />
                      Usar séries no masculino
                    </label>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {seriesPadrao.map((serie) => (
                        <label
                          key={`masculino-${serie}`}
                          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-3 text-sm font-bold text-white/70"
                        >
                          <input
                            name={`masculino_serie_${normalizarTexto(serie).replace(
                              "serie ",
                              ""
                            )}`}
                            type="checkbox"
                            defaultChecked={categoriaTemSerie(masculino, serie)}
                            className="h-4 w-4 accent-yellow-300"
                          />
                          {serie}
                        </label>
                      ))}
                    </div>

                    <label className="mt-4 block">
                      <span className={labelClass}>
                        Séries extras do masculino
                      </span>
                      <input
                        name="masculino_series_extras"
                        defaultValue={seriesExtras(masculino)}
                        className={inputClass}
                      />
                    </label>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                    <label className="flex items-center gap-3 text-sm font-black text-white">
                      <input
                        name="feminino_ativa"
                        type="checkbox"
                        defaultChecked={Boolean(feminino)}
                        className="h-5 w-5 accent-yellow-300"
                      />
                      Categoria Feminino
                    </label>

                    <label className="mt-4 flex items-center gap-3 text-sm font-bold text-white/75">
                      <input
                        name="feminino_series_ativas"
                        type="checkbox"
                        defaultChecked={feminino?.series_ativas === true}
                        className="h-5 w-5 accent-yellow-300"
                      />
                      Usar séries no feminino
                    </label>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {seriesPadrao.map((serie) => (
                        <label
                          key={`feminino-${serie}`}
                          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-3 text-sm font-bold text-white/70"
                        >
                          <input
                            name={`feminino_serie_${normalizarTexto(serie).replace(
                              "serie ",
                              ""
                            )}`}
                            type="checkbox"
                            defaultChecked={categoriaTemSerie(feminino, serie)}
                            className="h-4 w-4 accent-yellow-300"
                          />
                          {serie}
                        </label>
                      ))}
                    </div>

                    <label className="mt-4 block">
                      <span className={labelClass}>
                        Séries extras do feminino
                      </span>
                      <input
                        name="feminino_series_extras"
                        defaultValue={seriesExtras(feminino)}
                        className={inputClass}
                      />
                    </label>
                  </div>
                </div>

                <label className="mt-4 block">
                  <span className={labelClass}>Categorias extras</span>
                  <input
                    name="categorias_extras"
                    defaultValue={nomesCategoriasExtras(categorias)}
                    className={inputClass}
                  />
                  <span className="mt-2 block text-xs leading-5 text-white/45">
                    Separe por vírgula. Categorias extras entram sem séries
                    próprias neste formulário.
                  </span>
                </label>
              </div>

              <label className="flex items-center gap-3 rounded-3xl border border-blue-300/20 bg-blue-500/10 p-4 text-sm font-black text-blue-50">
                <input
                  name="inscricoes_abertas"
                  type="checkbox"
                  defaultChecked={campeonato.inscricoes_abertas === true}
                  className="h-5 w-5 accent-yellow-300"
                />
                Inscrições abertas
              </label>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-green-400 to-blue-500 px-5 py-4 text-sm font-black uppercase text-slate-950 shadow-lg transition hover:scale-[1.01]"
              >
                <Save size={18} />
                Salvar alterações
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
