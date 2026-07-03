"use client";

import { useMemo, useState } from "react";
import { Edit3, Plus, Save, Trash2, X } from "lucide-react";
import { editarJogoCompleto } from "@/app/admin/jogos/edicao/actions";
import { parseJogoObservacoes, type TipoCartao } from "@/lib/tempoReal";

type CategoriaConfig = {
  nome: string;
  ativo: boolean;
  series_ativas: boolean;
  series_lista: string[];
};

type Campeonato = {
  id: string;
  nome: string;
  modalidade?: string | null;
  categorias_lista?: CategoriaConfig[] | string[] | null;
};

type Equipe = {
  id: string;
  campeonato_id: string | null;
  nome_equipe: string | null;
  nome_time: string | null;
  categoria: string | null;
  serie: string | null;
  status: string | null;
};

type AtletaJogo = {
  id: string;
  inscricao_id: string | null;
  nome: string;
  numero_camisa: string | null;
};

type GolRegistro = {
  id: string;
  jogo_id: string | null;
  equipe_id: string | null;
  atleta_id: string | null;
  atleta_nome: string | null;
  quantidade: number | null;
};

type JogoCompleto = {
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
  observacoes: string | null;
};

type GolForm = {
  localId: string;
  equipeId: string;
  atletaId: string;
  minuto: number;
};

type CartaoForm = {
  localId: string;
  cartaoId: string;
  equipeId: string;
  atletaId: string;
  tipo: TipoCartao;
  minuto: number;
};

type EditarJogoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  jogo: JogoCompleto;
  campeonatos: Campeonato[];
  equipes: Equipe[];
  atletas: AtletaJogo[];
  gols: GolRegistro[];
};

const labelClass =
  "mb-2 block text-xs font-black uppercase tracking-wider text-white/60";
const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-300/60";
const selectClass =
  "w-full rounded-xl border border-white/10 bg-[#07130f] px-4 py-3 text-sm text-white outline-none focus:border-yellow-300/60";

function novoId() {
  return crypto.randomUUID();
}

function nomeEquipe(equipe: Equipe) {
  return equipe.nome_equipe || equipe.nome_time || "Equipe sem nome";
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

function golsIniciais(jogo: JogoCompleto, gols: GolRegistro[]): GolForm[] {
  const observacoes = parseJogoObservacoes(jogo.observacoes);

  if (observacoes.gols_detalhe && observacoes.gols_detalhe.length > 0) {
    return observacoes.gols_detalhe.map((gol) => ({
      localId: gol.gol_id || novoId(),
      equipeId: gol.equipe_id || "",
      atletaId: gol.atleta_id || "",
      minuto: gol.minuto ?? 0,
    }));
  }

  return gols.flatMap((gol) => {
    const quantidade = Math.max(1, gol.quantidade || 1);

    return Array.from({ length: quantidade }, (_, index) => ({
      localId: `${gol.id}-${index}`,
      equipeId: gol.equipe_id || "",
      atletaId: gol.atleta_id || "",
      minuto: 0,
    }));
  });
}

function cartoesIniciais(jogo: JogoCompleto): CartaoForm[] {
  const observacoes = parseJogoObservacoes(jogo.observacoes);

  return (observacoes.cartoes_detalhe || []).map((cartao) => ({
    localId: cartao.cartao_id || novoId(),
    cartaoId: cartao.cartao_id || novoId(),
    equipeId: cartao.equipe_id || "",
    atletaId: cartao.atleta_id || "",
    tipo: cartao.tipo === "vermelho" ? "vermelho" : "amarelo",
    minuto: cartao.minuto ?? 0,
  }));
}

export default function EditarJogoModal({
  isOpen,
  onClose,
  jogo,
  campeonatos,
  equipes,
  atletas,
  gols,
}: EditarJogoModalProps) {
  const [campeonatoId, setCampeonatoId] = useState(jogo.campeonato_id || "");
  const [categoria, setCategoria] = useState(jogo.categoria || "");
  const [serie, setSerie] = useState(jogo.serie || "");
  const [mandanteId, setMandanteId] = useState(jogo.equipe_mandante_id || "");
  const [visitanteId, setVisitanteId] = useState(jogo.equipe_visitante_id || "");
  const [golsMandante, setGolsMandante] = useState(jogo.gols_mandante ?? 0);
  const [golsVisitante, setGolsVisitante] = useState(jogo.gols_visitante ?? 0);
  const [listaGols, setListaGols] = useState<GolForm[]>(() =>
    golsIniciais(jogo, gols)
  );
  const [listaCartoes, setListaCartoes] = useState<CartaoForm[]>(() =>
    cartoesIniciais(jogo)
  );

  const campeonatoSelecionado = useMemo(() => {
    return campeonatos.find((c) => c.id === campeonatoId) || null;
  }, [campeonatoId, campeonatos]);

  const categoriasConfig = useMemo(() => {
    return normalizarCategorias(campeonatoSelecionado?.categorias_lista || null).filter((c) => c.ativo);
  }, [campeonatoSelecionado]);

  const categoriaSelecionadaConfig = useMemo(() => {
    return categoriasConfig.find((c) => c.nome === categoria) || null;
  }, [categoria, categoriasConfig]);

  const seriesConfig = categoriaSelecionadaConfig?.series_lista || [];
  const seriesAtivas = categoriaSelecionadaConfig?.series_ativas || false;

  const equipesFiltradas = useMemo(() => {
    const filtradas = equipes.filter((equipe) => {
      if (equipe.campeonato_id !== campeonatoId) return false;
      if (categoria && equipe.categoria !== categoria) return false;
      if (serie && equipe.serie && equipe.serie !== serie) return false;
      return true;
    });

    return filtradas.length > 0 ? filtradas : equipes;
  }, [campeonatoId, categoria, serie, equipes]);

  const equipeMandante = equipes.find((equipe) => equipe.id === mandanteId);
  const equipeVisitante = equipes.find((equipe) => equipe.id === visitanteId);
  const mandanteNome = equipeMandante ? nomeEquipe(equipeMandante) : jogo.equipe_mandante_nome || "";
  const visitanteNome = equipeVisitante ? nomeEquipe(equipeVisitante) : jogo.equipe_visitante_nome || "";

  function atletasDaEquipe(equipeId: string) {
    return atletas.filter((atleta) => atleta.inscricao_id === equipeId);
  }

  function recalcularPlacar(golsAtualizados: GolForm[]) {
    setGolsMandante(golsAtualizados.filter((gol) => gol.equipeId === mandanteId).length);
    setGolsVisitante(golsAtualizados.filter((gol) => gol.equipeId === visitanteId).length);
  }

  function atualizarGol(localId: string, patch: Partial<GolForm>) {
    setListaGols((golsAtuais) => {
      const atualizados = golsAtuais.map((gol) =>
        gol.localId === localId ? { ...gol, ...patch } : gol
      );
      recalcularPlacar(atualizados);
      return atualizados;
    });
  }

  function removerGol(localId: string) {
    setListaGols((golsAtuais) => {
      const atualizados = golsAtuais.filter((gol) => gol.localId !== localId);
      recalcularPlacar(atualizados);
      return atualizados;
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-6xl rounded-[2.5rem] border border-white/10 bg-[#030d0a] p-6 shadow-2xl md:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-xl font-black uppercase text-emerald-300">
            <Edit3 size={20} />
            Editar jogo completo
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/5 p-2 text-white/55 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <form action={editarJogoCompleto} className="space-y-6">
          <input type="hidden" name="jogo_id" value={jogo.id} />
          <input type="hidden" name="equipe_mandante_nome" value={mandanteNome} />
          <input type="hidden" name="equipe_visitante_nome" value={visitanteNome} />

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block lg:col-span-2">
                <span className={labelClass}>Campeonato *</span>
                <select
                  name="campeonato_id"
                  required
                  value={campeonatoId}
                  onChange={(e) => {
                    setCampeonatoId(e.target.value);
                    setCategoria("");
                    setSerie("");
                    setMandanteId("");
                    setVisitanteId("");
                  }}
                  className={selectClass}
                >
                  <option value="">Selecione o campeonato</option>
                  {campeonatos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className={labelClass}>Categoria *</span>
                <select
                  name="categoria"
                  required
                  value={categoria}
                  disabled={!campeonatoId}
                  onChange={(e) => {
                    setCategoria(e.target.value);
                    setSerie("");
                  }}
                  className={selectClass}
                >
                  <option value="">Selecione</option>
                  {categoriasConfig.map((cat) => (
                    <option key={cat.nome} value={cat.nome}>
                      {cat.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className={labelClass}>Série</span>
                <select
                  name="serie"
                  required={seriesAtivas}
                  disabled={!categoria || !seriesAtivas || seriesConfig.length === 0}
                  value={serie}
                  onChange={(e) => setSerie(e.target.value)}
                  className={selectClass}
                >
                  <option value="">
                    {!seriesAtivas ? "Sem série" : "Selecione"}
                  </option>
                  {seriesConfig.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className={labelClass}>Mandante *</span>
                <select
                  name="equipe_mandante_id"
                  required
                  value={mandanteId}
                  onChange={(e) => {
                    setMandanteId(e.target.value);
                    setListaGols((golsAtuais) =>
                      golsAtuais.filter((gol) => gol.equipeId !== mandanteId)
                    );
                    setListaCartoes((cartoesAtuais) =>
                      cartoesAtuais.filter((cartao) => cartao.equipeId !== mandanteId)
                    );
                  }}
                  className={selectClass}
                >
                  <option value="">Selecione</option>
                  {equipesFiltradas.map((equipe) => (
                    <option key={equipe.id} value={equipe.id}>
                      {nomeEquipe(equipe)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className={labelClass}>Visitante *</span>
                <select
                  name="equipe_visitante_id"
                  required
                  value={visitanteId}
                  onChange={(e) => {
                    setVisitanteId(e.target.value);
                    setListaGols((golsAtuais) =>
                      golsAtuais.filter((gol) => gol.equipeId !== visitanteId)
                    );
                    setListaCartoes((cartoesAtuais) =>
                      cartoesAtuais.filter((cartao) => cartao.equipeId !== visitanteId)
                    );
                  }}
                  className={selectClass}
                >
                  <option value="">Selecione</option>
                  {equipesFiltradas.map((equipe) => (
                    <option key={equipe.id} value={equipe.id}>
                      {nomeEquipe(equipe)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className={labelClass}>Status</span>
                <select name="status" defaultValue={jogo.status || "agendado"} className={selectClass}>
                  <option value="agendado">Agendado</option>
                  <option value="em_andamento">Ao vivo</option>
                  <option value="realizado">Realizado</option>
                  <option value="adiado">Adiado</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="anulado">Anulado</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelClass}>Gols M</span>
                  <input
                    name="gols_mandante"
                    type="number"
                    min="0"
                    value={golsMandante}
                    onChange={(e) => setGolsMandante(Number(e.target.value) || 0)}
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>Gols V</span>
                  <input
                    name="gols_visitante"
                    type="number"
                    min="0"
                    value={golsVisitante}
                    onChange={(e) => setGolsVisitante(Number(e.target.value) || 0)}
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="block">
                <span className={labelClass}>Data</span>
                <input type="date" name="data_jogo" defaultValue={jogo.data_jogo || ""} className={inputClass} />
              </label>

              <label className="block">
                <span className={labelClass}>Horário</span>
                <input type="time" name="horario" defaultValue={jogo.horario || ""} className={inputClass} />
              </label>

              <label className="block">
                <span className={labelClass}>Local</span>
                <input name="local" defaultValue={jogo.local || ""} className={inputClass} />
              </label>

              <label className="block">
                <span className={labelClass}>Rodada / fase</span>
                <input name="rodada" defaultValue={jogo.rodada || ""} className={inputClass} />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white/70">
                Gols e artilharia
              </h3>
              <button
                type="button"
                onClick={() =>
                  setListaGols((golsAtuais) => [
                    ...golsAtuais,
                    {
                      localId: novoId(),
                      equipeId: mandanteId || visitanteId,
                      atletaId: "",
                      minuto: 0,
                    },
                  ])
                }
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-2 text-xs font-black uppercase text-slate-950"
              >
                <Plus size={14} />
                Adicionar gol
              </button>
            </div>

            <div className="space-y-3">
              {listaGols.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/45">
                  Nenhum gol lançado.
                </p>
              ) : (
                listaGols.map((gol, index) => {
                  const atletasDisponiveis = atletasDaEquipe(gol.equipeId);

                  return (
                    <div key={gol.localId} className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 md:grid-cols-[1fr_1.4fr_110px_auto]">
                      <input type="hidden" name="gol_equipe_id" value={gol.equipeId} />
                      <input type="hidden" name="gol_atleta_id" value={gol.atletaId} />
                      <input type="hidden" name="gol_minuto" value={gol.minuto} />

                      <select
                        value={gol.equipeId}
                        onChange={(e) => atualizarGol(gol.localId, { equipeId: e.target.value, atletaId: "" })}
                        className={selectClass}
                      >
                        <option value="">Equipe do gol</option>
                        {mandanteId && <option value={mandanteId}>{mandanteNome || "Mandante"}</option>}
                        {visitanteId && <option value={visitanteId}>{visitanteNome || "Visitante"}</option>}
                      </select>

                      <select
                        value={gol.atletaId}
                        onChange={(e) => atualizarGol(gol.localId, { atletaId: e.target.value })}
                        className={selectClass}
                      >
                        <option value="">Gol {index + 1}: atleta</option>
                        {atletasDisponiveis.map((atleta) => (
                          <option key={atleta.id} value={atleta.id}>
                            {atleta.nome}
                            {atleta.numero_camisa ? ` - Nº ${atleta.numero_camisa}` : ""}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="0"
                        value={gol.minuto}
                        onChange={(e) => atualizarGol(gol.localId, { minuto: Number(e.target.value) || 0 })}
                        className={inputClass}
                        aria-label="Minuto do gol"
                      />

                      <button
                        type="button"
                        onClick={() => removerGol(gol.localId)}
                        className="inline-flex items-center justify-center rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-red-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white/70">
                Cartões
              </h3>
              <button
                type="button"
                onClick={() =>
                  setListaCartoes((cartoesAtuais) => [
                    ...cartoesAtuais,
                    {
                      localId: novoId(),
                      cartaoId: novoId(),
                      equipeId: mandanteId || visitanteId,
                      atletaId: "",
                      tipo: "amarelo",
                      minuto: 0,
                    },
                  ])
                }
                className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2 text-xs font-black uppercase text-slate-950"
              >
                <Plus size={14} />
                Adicionar cartão
              </button>
            </div>

            <div className="space-y-3">
              {listaCartoes.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/45">
                  Nenhum cartão lançado.
                </p>
              ) : (
                listaCartoes.map((cartao, index) => {
                  const atletasDisponiveis = atletasDaEquipe(cartao.equipeId);

                  return (
                    <div key={cartao.localId} className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 md:grid-cols-[1fr_1.4fr_130px_110px_auto]">
                      <input type="hidden" name="cartao_id" value={cartao.cartaoId} />
                      <input type="hidden" name="cartao_equipe_id" value={cartao.equipeId} />
                      <input type="hidden" name="cartao_atleta_id" value={cartao.atletaId} />
                      <input type="hidden" name="cartao_tipo" value={cartao.tipo} />
                      <input type="hidden" name="cartao_minuto" value={cartao.minuto} />

                      <select
                        value={cartao.equipeId}
                        onChange={(e) =>
                          setListaCartoes((cartoesAtuais) =>
                            cartoesAtuais.map((item) =>
                              item.localId === cartao.localId
                                ? { ...item, equipeId: e.target.value, atletaId: "" }
                                : item
                            )
                          )
                        }
                        className={selectClass}
                      >
                        <option value="">Equipe</option>
                        {mandanteId && <option value={mandanteId}>{mandanteNome || "Mandante"}</option>}
                        {visitanteId && <option value={visitanteId}>{visitanteNome || "Visitante"}</option>}
                      </select>

                      <select
                        value={cartao.atletaId}
                        onChange={(e) =>
                          setListaCartoes((cartoesAtuais) =>
                            cartoesAtuais.map((item) =>
                              item.localId === cartao.localId
                                ? { ...item, atletaId: e.target.value }
                                : item
                            )
                          )
                        }
                        className={selectClass}
                      >
                        <option value="">Cartão {index + 1}: atleta</option>
                        {atletasDisponiveis.map((atleta) => (
                          <option key={atleta.id} value={atleta.id}>
                            {atleta.nome}
                            {atleta.numero_camisa ? ` - Nº ${atleta.numero_camisa}` : ""}
                          </option>
                        ))}
                      </select>

                      <select
                        value={cartao.tipo}
                        onChange={(e) =>
                          setListaCartoes((cartoesAtuais) =>
                            cartoesAtuais.map((item) =>
                              item.localId === cartao.localId
                                ? { ...item, tipo: e.target.value as TipoCartao }
                                : item
                            )
                          )
                        }
                        className={selectClass}
                      >
                        <option value="amarelo">Amarelo</option>
                        <option value="vermelho">Vermelho</option>
                      </select>

                      <input
                        type="number"
                        min="0"
                        value={cartao.minuto}
                        onChange={(e) =>
                          setListaCartoes((cartoesAtuais) =>
                            cartoesAtuais.map((item) =>
                              item.localId === cartao.localId
                                ? { ...item, minuto: Number(e.target.value) || 0 }
                                : item
                            )
                          )
                        }
                        className={inputClass}
                        aria-label="Minuto do cartão"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setListaCartoes((cartoesAtuais) =>
                            cartoesAtuais.filter((item) => item.localId !== cartao.localId)
                          )
                        }
                        className="inline-flex items-center justify-center rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-red-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-3 text-xs font-black uppercase text-white transition hover:bg-white/[0.1]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-300 to-green-400 px-6 py-3 text-xs font-black uppercase text-slate-950 shadow transition hover:brightness-110"
            >
              <Save size={16} />
              Salvar tudo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
