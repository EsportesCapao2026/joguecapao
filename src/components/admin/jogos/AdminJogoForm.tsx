"use client";

import { useMemo, useState } from "react";
import { cadastrarJogo } from "@/app/admin/jogos/actions";

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
  categorias_lista: CategoriaConfig[] | string[] | null;
};

type Equipe = {
  id: string;
  campeonato_id: string | null;
  nome_equipe: string | null;
  nome_time: string | null;
  categoria: string | null;
  serie: string | null;
  cidade: string | null;
};

type Props = {
  campeonatos: Campeonato[];
  equipes: Equipe[];
};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-yellow-300/60 focus:ring-2 focus:ring-yellow-300/10";

const labelClass =
  "mb-2 block text-sm font-black uppercase tracking-[0.08em] text-white/75";

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

export function AdminJogoForm({ campeonatos, equipes }: Props) {
  const [campeonatoId, setCampeonatoId] = useState("");
  const [categoria, setCategoria] = useState("");
  const [serie, setSerie] = useState("");
  const [mandanteId, setMandanteId] = useState("");
  const [visitanteId, setVisitanteId] = useState("");

  const campeonatoSelecionado = useMemo(() => {
    return campeonatos.find((campeonato) => campeonato.id === campeonatoId);
  }, [campeonatos, campeonatoId]);

  const categorias = useMemo(() => {
    return normalizarCategorias(campeonatoSelecionado?.categorias_lista || null);
  }, [campeonatoSelecionado]);

  const categoriaSelecionada = useMemo(() => {
    return categorias.find((item) => item.nome === categoria);
  }, [categorias, categoria]);

  const equipesFiltradas = useMemo(() => {
    return equipes.filter((equipe) => {
      if (!campeonatoId) return false;
      if (equipe.campeonato_id !== campeonatoId) return false;
      if (categoria && equipe.categoria !== categoria) return false;
      if (serie && equipe.serie !== serie) return false;

      return true;
    });
  }, [equipes, campeonatoId, categoria, serie]);

  const mandante = equipesFiltradas.find((equipe) => equipe.id === mandanteId);
  const visitante = equipesFiltradas.find((equipe) => equipe.id === visitanteId);

  function aoTrocarCampeonato(id: string) {
    setCampeonatoId(id);
    setCategoria("");
    setSerie("");
    setMandanteId("");
    setVisitanteId("");
  }

  function aoTrocarCategoria(valor: string) {
    setCategoria(valor);
    setSerie("");
    setMandanteId("");
    setVisitanteId("");
  }

  function aoTrocarSerie(valor: string) {
    setSerie(valor);
    setMandanteId("");
    setVisitanteId("");
  }

  return (
    <form action={cadastrarJogo} className="mt-6 space-y-5">
      <input type="hidden" name="equipe_mandante_nome" value={mandante ? nomeEquipe(mandante) : ""} />
      <input type="hidden" name="equipe_visitante_nome" value={visitante ? nomeEquipe(visitante) : ""} />

      <label className="block">
        <span className={labelClass}>Campeonato</span>
        <select
          name="campeonato_id"
          required
          className={inputClass}
          value={campeonatoId}
          onChange={(event) => aoTrocarCampeonato(event.target.value)}
        >
          <option value="">Selecione o campeonato</option>
          {campeonatos.map((campeonato) => (
            <option key={campeonato.id} value={campeonato.id}>
              {campeonato.nome}
              {campeonato.modalidade ? ` — ${campeonato.modalidade}` : ""}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Categoria</span>
          <select
            name="categoria"
            required
            className={inputClass}
            value={categoria}
            onChange={(event) => aoTrocarCategoria(event.target.value)}
            disabled={!campeonatoId}
          >
            <option value="">Selecione a categoria</option>
            {categorias.map((item) => (
              <option key={item.nome} value={item.nome}>
                {item.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelClass}>Série</span>
          <select
            name="serie"
            className={inputClass}
            value={serie}
            onChange={(event) => aoTrocarSerie(event.target.value)}
            disabled={!categoria}
          >
            <option value="">Sem série ou não se aplica</option>
            {categoriaSelecionada?.series_ativas
              ? categoriaSelecionada.series_lista.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))
              : null}
          </select>
        </label>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/60">
        Equipes disponíveis para este filtro:{" "}
        <strong className="text-white">{equipesFiltradas.length}</strong>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Equipe mandante</span>
          <select
            name="equipe_mandante_id"
            required
            className={inputClass}
            value={mandanteId}
            onChange={(event) => setMandanteId(event.target.value)}
            disabled={!campeonatoId || !categoria}
          >
            <option value="">Selecione a equipe mandante</option>
            {equipesFiltradas.map((equipe) => (
              <option key={equipe.id} value={equipe.id}>
                {nomeEquipe(equipe)}
                {equipe.cidade ? ` — ${equipe.cidade}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelClass}>Equipe visitante</span>
          <select
            name="equipe_visitante_id"
            required
            className={inputClass}
            value={visitanteId}
            onChange={(event) => setVisitanteId(event.target.value)}
            disabled={!campeonatoId || !categoria}
          >
            <option value="">Selecione a equipe visitante</option>
            {equipesFiltradas
              .filter((equipe) => equipe.id !== mandanteId)
              .map((equipe) => (
                <option key={equipe.id} value={equipe.id}>
                  {nomeEquipe(equipe)}
                  {equipe.cidade ? ` — ${equipe.cidade}` : ""}
                </option>
              ))}
          </select>
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <label className="block">
          <span className={labelClass}>Data</span>
          <input name="data_jogo" type="date" className={inputClass} />
        </label>

        <label className="block">
          <span className={labelClass}>Horário</span>
          <input
            name="horario"
            placeholder="Ex.: 20h"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Rodada</span>
          <input
            name="rodada"
            placeholder="Ex.: 1ª rodada"
            className={inputClass}
          />
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>Local</span>
        <input
          name="local"
          placeholder="Ex.: Ginásio Municipal"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Observações</span>
        <textarea
          name="observacoes"
          rows={4}
          placeholder="Informações importantes sobre este jogo..."
          className={inputClass}
        />
      </label>

      <button
        type="submit"
        className="w-full rounded-2xl bg-gradient-to-r from-yellow-300 via-green-400 to-blue-500 px-5 py-4 text-sm font-black uppercase text-slate-950 shadow-lg transition hover:scale-[1.01]"
      >
        Cadastrar jogo
      </button>
    </form>
  );
}
