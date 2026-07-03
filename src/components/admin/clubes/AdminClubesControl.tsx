"use client";

import React, { useState, useMemo } from "react";
import { Plus, Users, PlusCircle, FileText, ChevronRight, Trash2, Link as LinkIcon, FileUp } from "lucide-react";
import { cadastrarEquipeManualCompleta, cadastrarAtletaManual } from "@/app/admin/clubes/actions";

/* eslint-disable @next/next/no-img-element */

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
  categorias_lista: CategoriaConfig[] | string[] | null;
};

type Inscricao = {
  id: string;
  campeonato_id: string | null;
  categoria: string | null;
  serie: string | null;
  nome_equipe: string | null;
  nome_time: string | null;
  cidade: string | null;
  nome_tecnico: string | null;
  logo_url: string | null;
  observacoes: string | null;
  status: string | null;
};

type Jogador = {
  id: string;
  inscricao_id: string;
  nome: string;
  documento_tipo: string;
  documento_numero: string;
  numero_camisa: string;
  capitao: boolean | null;
  status: string | null;
  documento_arquivo_url: string | null;
  documento_url_assinado?: string | null;
};

type NovoTimeAtleta = {
  id_temp: string;
  nome: string;
  documentoTipo: string;
  documentoNumero: string;
  numeroCamisa: string;
  capitao: boolean;
};

type NovoTimeAtletaCampo = Exclude<keyof NovoTimeAtleta, "id_temp">;

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

interface AdminClubesControlProps {
  campeonatos: Campeonato[];
  inscricoes: Inscricao[];
  jogadores: Jogador[];
}

export default function AdminClubesControl({
  campeonatos,
  inscricoes,
  jogadores,
}: AdminClubesControlProps) {
  // 1. Filtros reativos
  const [campeonatoId, setCampeonatoId] = useState("");
  const [categoria, setCategoria] = useState("");
  
  // Equipe selecionada para detalhe
  const [equipeSelecionadaId, setEquipeSelecionadaId] = useState("");

  // Controlar formulário de Nova Equipe
  const [exibirFormEquipe, setExibirFormEquipe] = useState(false);

  // Lista dinâmica de atletas no formulário de nova equipe
  const [novoTimeAtletas, setNovoTimeAtletas] = useState<NovoTimeAtleta[]>([]);

  // Estados dos formulários de erros e carregamento
  const [loading, setLoading] = useState(false);

  // Estados reativos para cadastro manual de equipe
  const [novoTimeCampeonatoId, setNovoTimeCampeonatoId] = useState("");
  const [novoTimeCategoria, setNovoTimeCategoria] = useState("");
  const [novoTimeSerie, setNovoTimeSerie] = useState("");

  const novoTimeCampSelecionado = useMemo(() => {
    return campeonatos.find((c) => c.id === novoTimeCampeonatoId) || null;
  }, [novoTimeCampeonatoId, campeonatos]);

  const novoTimeCategoriasConfig = useMemo(() => {
    return normalizarCategorias(novoTimeCampSelecionado?.categorias_lista || null).filter(c => c.ativo);
  }, [novoTimeCampSelecionado]);

  const novoTimeCategoriaSelecionadaConfig = useMemo(() => {
    return novoTimeCategoriasConfig.find((c) => c.nome === novoTimeCategoria) || null;
  }, [novoTimeCategoria, novoTimeCategoriasConfig]);

  const novoTimeSeriesConfig = novoTimeCategoriaSelecionadaConfig?.series_lista || [];
  const novoTimeSeriesAtivas = novoTimeCategoriaSelecionadaConfig?.series_ativas || false;

  // 2. Extrair categorias dinâmicas do campeonato escolhido
  const categoriasDisponiveis = useMemo(() => {
    if (!campeonatoId) return [];
    const cats = new Set<string>();
    inscricoes
      .filter((e) => e.campeonato_id === campeonatoId && e.categoria)
      .forEach((e) => cats.add(e.categoria!));
    return Array.from(cats);
  }, [campeonatoId, inscricoes]);

  // 3. Filtrar inscrições/equipes com base no campeonato e categoria
  const equipesFiltradas = useMemo(() => {
    if (!campeonatoId) return [];
    return inscricoes.filter(
      (e) =>
        e.campeonato_id === campeonatoId &&
        (!categoria || e.categoria === categoria)
    );
  }, [campeonatoId, categoria, inscricoes]);

  // 4. Detalhes da equipe selecionada
  const equipeSelecionada = useMemo(() => {
    return inscricoes.find((e) => e.id === equipeSelecionadaId) || null;
  }, [equipeSelecionadaId, inscricoes]);

  // 5. Atletas da equipe selecionada
  const atletasDaEquipe = useMemo(() => {
    if (!equipeSelecionadaId) return [];
    return jogadores.filter((j) => j.inscricao_id === equipeSelecionadaId);
  }, [equipeSelecionadaId, jogadores]);

  // Adicionar linha de atleta
  const handleAdicionarAtletaLinha = () => {
    setNovoTimeAtletas([
      ...novoTimeAtletas,
      {
        id_temp: Math.random().toString(36).substring(2, 9),
        nome: "",
        documentoTipo: "RG",
        documentoNumero: "",
        numeroCamisa: "",
        capitao: false,
      },
    ]);
  };

  // Remover linha de atleta
  const handleRemoverAtletaLinha = (idTemp: string) => {
    setNovoTimeAtletas(novoTimeAtletas.filter((a) => a.id_temp !== idTemp));
  };

  // Alterar dados do atleta na linha
  const handleAtletaChange = (
    idTemp: string,
    campo: NovoTimeAtletaCampo,
    valor: string | boolean
  ) => {
    setNovoTimeAtletas(
      novoTimeAtletas.map((a) => {
        if (campo === "capitao") {
          return {
            ...a,
            capitao: a.id_temp === idTemp ? Boolean(valor) : false,
          };
        }

        if (a.id_temp !== idTemp) return a;

        switch (campo) {
          case "nome":
            return { ...a, nome: String(valor) };
          case "documentoTipo":
            return { ...a, documentoTipo: String(valor) };
          case "documentoNumero":
            return { ...a, documentoNumero: String(valor) };
          case "numeroCamisa":
            return { ...a, numeroCamisa: String(valor) };
        }

        return a;
      })
    );
  };

  const labelClass = "mb-2 block text-xs font-black uppercase tracking-wider text-white/60";
  const inputClass =
    "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-300/60";
  const selectClass =
    "w-full rounded-xl border border-white/10 bg-[#07130f] px-4 py-3 text-sm text-white outline-none focus:border-yellow-300/60";

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Ações */}
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 backdrop-blur flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="block min-w-[220px]">
            <select
              value={campeonatoId}
              onChange={(e) => {
                setCampeonatoId(e.target.value);
                setCategoria("");
                setEquipeSelecionadaId("");
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

          {campeonatoId && categoriasDisponiveis.length > 0 && (
            <label className="block min-w-[180px]">
              <select
                value={categoria}
                onChange={(e) => {
                  setCategoria(e.target.value);
                  setEquipeSelecionadaId("");
                }}
                className={selectClass}
              >
                <option value="">Todas as categorias</option>
                {categoriasDisponiveis.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <button
          onClick={() => {
            setExibirFormEquipe(!exibirFormEquipe);
            setNovoTimeAtletas([]);
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-green-400 to-blue-500 px-5 py-3.5 text-xs font-black uppercase text-slate-950 shadow-lg transition hover:scale-[1.01]"
        >
          <PlusCircle size={16} />
          {exibirFormEquipe ? "Fechar Cadastro" : "Cadastrar Equipe Manual"}
        </button>
      </section>

      {/* Formulário de Cadastro Manual de Equipe (Avançado) */}
      {exibirFormEquipe && (
        <section className="rounded-[2.5rem] border border-white/10 bg-[#030d0a] p-6 shadow-2xl backdrop-blur-md">
          <h2 className="text-xl font-black uppercase text-emerald-300 mb-4 flex items-center gap-2">
            <Plus size={18} />
            Cadastro de Clube e Atletas (Completo)
          </h2>
          <p className="text-xs text-white/50 mb-6 leading-5 uppercase tracking-wide">
            Insira os dados do time, faça upload de arquivos e cadastre a lista de jogadores com seus documentos simultaneamente.
          </p>

          <form
            action={cadastrarEquipeManualCompleta}
            onSubmit={() => setLoading(true)}
            className="space-y-6"
          >
            {/* Dados do Time */}
            <div className="grid gap-4 md:grid-cols-3 bg-black/20 p-5 rounded-3xl border border-white/5">
              <label className="block md:col-span-3 text-sm font-black uppercase tracking-wider text-emerald-300">
                1. Informações Básicas da Equipe
              </label>

              <label className="block">
                <span className={labelClass}>Campeonato *</span>
                <select
                  name="campeonato_id"
                  required
                  value={novoTimeCampeonatoId}
                  onChange={(e) => {
                    setNovoTimeCampeonatoId(e.target.value);
                    setNovoTimeCategoria("");
                    setNovoTimeSerie("");
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
                  value={novoTimeCategoria}
                  disabled={!novoTimeCampeonatoId}
                  onChange={(e) => {
                    setNovoTimeCategoria(e.target.value);
                    setNovoTimeSerie("");
                  }}
                  className={selectClass}
                >
                  <option value="">Selecione a categoria</option>
                  {novoTimeCategoriasConfig.map((cat) => (
                    <option key={cat.nome} value={cat.nome}>
                      {cat.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className={labelClass}>Série {novoTimeSeriesAtivas ? "*" : "(Não aplicável)"}</span>
                <select
                  name="serie"
                  required={novoTimeSeriesAtivas}
                  disabled={!novoTimeCategoria || !novoTimeSeriesAtivas || novoTimeSeriesConfig.length === 0}
                  value={novoTimeSerie}
                  onChange={(e) => setNovoTimeSerie(e.target.value)}
                  className={selectClass}
                >
                  <option value="">
                    {!novoTimeSeriesAtivas
                      ? "Sem série cadastrada"
                      : "Selecione a série"}
                  </option>
                  {novoTimeSeriesConfig.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className={labelClass}>Nome da Equipe *</span>
                <input name="nome_equipe" required placeholder="Ex: União Capão FC" className={inputClass} />
              </label>

              <label className="block">
                <span className={labelClass}>Nome do Técnico / Responsável</span>
                <input name="nome_tecnico" placeholder="Nome do responsável" className={inputClass} />
              </label>

              <label className="block">
                <span className={labelClass}>Cidade</span>
                <input name="cidade" placeholder="Ex: Capão da Canoa" className={inputClass} />
              </label>

              {/* Upload do Logotipo */}
              <div className="md:col-span-2 space-y-2">
                <span className={labelClass}>Logotipo do Time (Escolha uma opção)</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs">
                    <LinkIcon size={14} className="text-blue-300" />
                    <input
                      name="logo_url_link"
                      placeholder="Link da imagem (URL)"
                      className="bg-transparent outline-none flex-1 text-white text-xs placeholder:text-white/20"
                    />
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs cursor-pointer">
                    <FileUp size={14} className="text-green-300" />
                    <span className="text-white/40 truncate text-xs flex-1">Upload de arquivo local</span>
                    <input
                      type="file"
                      name="logo_arquivo"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const label = e.target.parentElement?.querySelector("span");
                          if (label) label.textContent = file.name;
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Documento do Responsável */}
              <label className="block">
                <span className={labelClass}>Doc. do Responsável (PDF/Imagem)</span>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs cursor-pointer h-[46px]">
                  <FileText size={14} className="text-yellow-200" />
                  <span className="text-white/40 truncate text-xs flex-1">Upload da Identidade</span>
                  <input
                    type="file"
                    name="documento_responsavel_arquivo"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const label = e.target.parentElement?.querySelector("span");
                        if (label) label.textContent = file.name;
                      }
                    }}
                  />
                </div>
              </label>
            </div>

            {/* Cadastro de Atletas */}
            <div className="bg-black/20 p-5 rounded-3xl border border-white/5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <label className="text-sm font-black uppercase tracking-wider text-yellow-300">
                  2. Lista de Atletas do Time ({novoTimeAtletas.length})
                </label>
                <button
                  type="button"
                  onClick={handleAdicionarAtletaLinha}
                  className="rounded-xl border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase text-yellow-200 hover:bg-yellow-300 hover:text-slate-950 transition"
                >
                  Adicionar Jogador
                </button>
              </div>

              {novoTimeAtletas.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-black/30 p-6 text-center text-xs text-white/40 italic">
                  Nenhum jogador na lista. Clique em &quot;Adicionar Jogador&quot; acima para montar a lista.
                </div>
              ) : (
                <div className="space-y-4">
                  <input type="hidden" name="atletas_count" value={novoTimeAtletas.length} />
                  
                  {novoTimeAtletas.map((atleta, index) => (
                    <div
                      key={atleta.id_temp}
                      className="grid gap-3 p-4 rounded-2xl border border-white/5 bg-black/45 relative md:grid-cols-[1.5fr_0.8fr_1fr_0.8fr_auto_auto]"
                    >
                      <label className="block">
                        <span className={labelClass}>Nome Completo *</span>
                        <input
                          name={`atleta_nome_${index}`}
                          required
                          value={atleta.nome}
                          onChange={(e) => handleAtletaChange(atleta.id_temp, "nome", e.target.value)}
                          placeholder="Nome do atleta"
                          className={inputClass}
                        />
                      </label>

                      <label className="block">
                        <span className={labelClass}>Documento *</span>
                        <select
                          name={`atleta_doc_tipo_${index}`}
                          required
                          value={atleta.documentoTipo}
                          onChange={(e) => handleAtletaChange(atleta.id_temp, "documentoTipo", e.target.value)}
                          className={selectClass}
                        >
                          <option value="RG">RG</option>
                          <option value="CPF">CPF</option>
                          <option value="CNH">CNH</option>
                        </select>
                      </label>

                      <label className="block">
                        <span className={labelClass}>Nº Doc *</span>
                        <input
                          name={`atleta_doc_num_${index}`}
                          required
                          value={atleta.documentoNumero}
                          onChange={(e) => handleAtletaChange(atleta.id_temp, "documentoNumero", e.target.value)}
                          placeholder="Número"
                          className={inputClass}
                        />
                      </label>

                      <label className="block">
                        <span className={labelClass}>Camisa</span>
                        <input
                          name={`atleta_camisa_${index}`}
                          type="number"
                          min="1"
                          max="99"
                          value={atleta.numeroCamisa}
                          onChange={(e) => handleAtletaChange(atleta.id_temp, "numeroCamisa", e.target.value)}
                          placeholder="Ex: 10"
                          className={inputClass}
                        />
                      </label>

                      {/* Enviar Documento do Jogador */}
                      <div className="block min-w-[150px]">
                        <span className={labelClass}>Doc. Atleta (PDF/Imagem)</span>
                        <label className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#07130f] px-3 py-3 text-xs cursor-pointer h-[46px] truncate">
                          <FileUp size={14} className="text-green-300" />
                          <span className="text-white/40 truncate text-xs">Identidade</span>
                          <input
                            type="file"
                            name={`atleta_arquivo_${index}`}
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const label = e.target.parentElement?.querySelector("span");
                                if (label) label.textContent = file.name;
                              }
                            }}
                          />
                        </label>
                      </div>

                      {/* Capitão & Exclusão */}
                      <div className="flex items-center gap-4 pt-6 pl-2">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            id={`cap_${atleta.id_temp}`}
                            checked={atleta.capitao}
                            onChange={(e) => handleAtletaChange(atleta.id_temp, "capitao", e.target.checked)}
                            className="h-4 w-4 rounded border-white/10 bg-black/40 text-emerald-500"
                          />
                          <input
                            type="hidden"
                            name={`atleta_capitao_${index}`}
                            value={atleta.capitao ? "true" : "false"}
                          />
                          <label
                            htmlFor={`cap_${atleta.id_temp}`}
                            className="text-xxs font-black uppercase text-white/50 cursor-pointer"
                          >
                            Capitão
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoverAtletaLinha(atleta.id_temp)}
                          className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-xl"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submissão */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setExibirFormEquipe(false)}
                className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-3 text-xs font-black uppercase hover:bg-white/[0.1] transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-yellow-300 to-green-400 px-6 py-3 text-xs font-black uppercase text-slate-950 hover:brightness-110 shadow transition"
              >
                {loading ? "Cadastrando..." : "Cadastrar Equipe e Atletas"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Conteúdo Principal (Lista de Equipes e Visualização do Time Selecionado) */}
      {!campeonatoId ? (
        <div className="rounded-[2rem] border border-yellow-300/10 bg-yellow-400/5 p-6 text-center text-yellow-200/80 backdrop-blur">
          Selecione um campeonato acima para visualizar as equipes e seus atletas correspondentes.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          
          {/* Coluna Esquerda: Listagem de Clubes */}
          <section className="rounded-[2.5rem] border border-white/10 bg-white/[0.05] p-5 backdrop-blur flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black uppercase mb-4 flex items-center justify-between">
                <span>Clubes Aprovados ({equipesFiltradas.length})</span>
              </h3>

              {equipesFiltradas.length === 0 ? (
                <p className="text-sm text-white/40 italic py-4">Nenhuma equipe cadastrada nesta categoria.</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {equipesFiltradas.map((e) => {
                    const ativo = e.id === equipeSelecionadaId;
                    const nome = e.nome_equipe || e.nome_time || "Time";

                    return (
                      <button
                        key={e.id}
                        onClick={() => setEquipeSelecionadaId(e.id)}
                        className={`w-full rounded-2xl border p-4 text-left flex items-center justify-between transition ${ativo ? "border-green-300/50 bg-green-500/10 text-white" : "border-white/5 bg-black/20 text-white/70 hover:bg-white/[0.05]"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.05] border border-white/10 overflow-hidden">
                            {e.logo_url ? (
                              <img src={e.logo_url} alt="Logo" className="h-full w-full object-cover" />
                            ) : (
                              <Users size={16} className="text-white/40" />
                            )}
                          </div>
                          <div>
                            <p className="font-black uppercase text-sm truncate max-w-[180px]">{nome}</p>
                            <p className="text-xxs text-white/40 uppercase tracking-wider mt-0.5">
                              {e.categoria} {e.serie ? `— Série ${e.serie}` : ""}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={16} className={`transition ${ativo ? "text-green-300 translate-x-1" : "text-white/30"}`} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 text-xxs text-white/30 uppercase tracking-widest">
              Clique em um clube para expandir dados e jogadores.
            </div>
          </section>

          {/* Coluna Direita: Detalhe do Clube e Jogadores */}
          <section className="rounded-[2.5rem] border border-white/10 bg-white/[0.05] p-6 backdrop-blur">
            {equipeSelecionada ? (
              <div className="space-y-6">
                
                {/* Cabeçalho do Detalhe */}
                <div className="flex gap-4 border-b border-white/5 pb-4">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-black/30 border border-white/10 overflow-hidden">
                    {equipeSelecionada.logo_url ? (
                      <img src={equipeSelecionada.logo_url} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <Users size={24} className="text-white/40" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase text-white">
                      {equipeSelecionada.nome_equipe || equipeSelecionada.nome_time}
                    </h3>
                    <p className="text-sm text-emerald-300 font-bold uppercase tracking-wider mt-0.5">
                      {equipeSelecionada.categoria} {equipeSelecionada.serie ? `— Série ${equipeSelecionada.serie}` : ""}
                    </p>
                  </div>
                </div>

                {/* Dados Consolidados do Clube */}
                <div className="grid gap-3 sm:grid-cols-2 text-sm bg-black/25 p-4 rounded-2xl border border-white/5">
                  <p><strong className="text-white/45 uppercase text-xs block">Cidade</strong> {equipeSelecionada.cidade || "Não informada"}</p>
                  <p><strong className="text-white/45 uppercase text-xs block">Técnico</strong> {equipeSelecionada.nome_tecnico || "Não informado"}</p>
                  
                  {/* Parse do documento do responsável técnico */}
                  {(() => {
                    let docUrl = null;
                    try {
                      if (equipeSelecionada.observacoes) {
                        const parsed = JSON.parse(equipeSelecionada.observacoes);
                        docUrl = parsed.documento_responsavel || null;
                      }
                    } catch {}

                    if (docUrl) {
                      return (
                        <div className="sm:col-span-2 mt-2 pt-2 border-t border-white/5">
                          <a
                            href={docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-yellow-300/10 border border-yellow-300/25 px-4 py-2 text-xs font-black uppercase text-yellow-200 hover:bg-yellow-300 hover:text-slate-950 transition"
                          >
                            <FileText size={14} />
                            Ver Documento do Responsável
                          </a>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Cadastro de Jogador Manual (DENTRO DA EQUIPE SELECIONADA) */}
                <div className="bg-[#05130f] p-4 rounded-2xl border border-white/5 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-green-300 flex items-center gap-1.5">
                    <PlusCircle size={14} />
                    Inscrever Atleta Manualmente nesta Equipe
                  </h4>
                  
                  <form action={cadastrarAtletaManual} className="grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="inscricao_id" value={equipeSelecionada.id} />
                    
                    <label className="block sm:col-span-2">
                      <span className={labelClass}>Nome Completo *</span>
                      <input name="nome" required placeholder="Nome do jogador" className={inputClass} />
                    </label>

                    <label className="block">
                      <span className={labelClass}>Tipo do Documento *</span>
                      <select name="documento_tipo" required className={selectClass}>
                        <option value="RG">RG</option>
                        <option value="CPF">CPF</option>
                        <option value="CNH">CNH</option>
                        <option value="Passaporte">Passaporte</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className={labelClass}>Nº Documento *</span>
                      <input name="documento_numero" required placeholder="Número do documento" className={inputClass} />
                    </label>

                    <label className="block">
                      <span className={labelClass}>Nº da Camisa</span>
                      <input name="numero_camisa" type="number" min="1" max="99" placeholder="Ex: 10" className={inputClass} />
                    </label>

                    <div className="flex items-center gap-2 pt-6 pl-2">
                      <input type="checkbox" name="capitao" id="capitao" className="h-4 w-4 rounded border-white/10 bg-black/40 text-emerald-500 focus:ring-0" />
                      <label htmlFor="capitao" className="text-xs font-black uppercase tracking-wider text-white/70 cursor-pointer">
                        É o Capitão da Equipe?
                      </label>
                    </div>

                    <div className="sm:col-span-2 flex justify-end pt-2">
                      <button
                        type="submit"
                        className="rounded-xl bg-emerald-400 px-5 py-3 text-xxs font-black uppercase text-slate-950 hover:bg-emerald-300 transition"
                      >
                        Inscrever Atleta
                      </button>
                    </div>
                  </form>
                </div>

                {/* Lista de Atletas */}
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-white/50 mb-3">Atletas Inscritos ({atletasDaEquipe.length})</h4>
                  
                  {atletasDaEquipe.length === 0 ? (
                    <p className="text-xs text-white/30 italic">Nenhum jogador inscrito para esta equipe.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2 max-h-[300px] overflow-y-auto pr-1">
                      {atletasDaEquipe.map((j) => (
                        <div
                          key={j.id}
                          className="bg-black/35 p-3 rounded-xl border border-white/5 flex items-center justify-between text-sm"
                        >
                          <div>
                            <p className="font-bold uppercase text-white truncate max-w-[150px]">{j.nome}</p>
                            <p className="text-xxs text-white/40 uppercase mt-0.5">
                              {j.documento_tipo}: {j.documento_numero} {j.numero_camisa ? `• Camisa #${j.numero_camisa}` : ""}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {j.capitao && (
                              <span className="rounded-full bg-yellow-300/10 border border-yellow-300/20 px-2.5 py-1 text-xxs font-black uppercase text-yellow-200">
                                Capitão
                              </span>
                            )}
                            {j.documento_url_assinado && (
                              <a
                                href={j.documento_url_assinado}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xxs font-bold text-green-300/80 hover:text-green-300 transition"
                              >
                                <FileText size={12} />
                                Documento
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-white/40 italic py-16">
                Escolha um clube na lista ao lado para ver seus detalhes e a lista de atletas.
              </div>
            )}
          </section>

        </div>
      )}
    </div>
  );
}
