"use client";

import { useMemo, useState } from "react";
import { registrarGols } from "@/app/admin/artilheiros/actions";

type Campeonato = {
  id: string;
  nome: string;
  modalidade: string | null;
};

type Jogo = {
  id: string;
  campeonato_id: string | null;
  equipe_mandante_id: string | null;
  equipe_visitante_id: string | null;
  equipe_mandante_nome: string | null;
  equipe_visitante_nome: string | null;
  categoria: string | null;
  serie: string | null;
  rodada: string | null;
};

type Atleta = {
  id: string;
  equipe_id: string | null;
  nome: string;
  numero_camisa: string | null;
};

type Props = {
  campeonatos: Campeonato[];
  jogos: Jogo[];
  atletas: Atleta[];
};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-yellow-300/60 focus:ring-2 focus:ring-yellow-300/10";

const labelClass =
  "mb-2 block text-sm font-black uppercase tracking-[0.08em] text-white/75";

export function AdminArtilheiroForm({ campeonatos, jogos, atletas }: Props) {
  const [campeonatoId, setCampeonatoId] = useState("");
  const [jogoId, setJogoId] = useState("");
  const [equipeId, setEquipeId] = useState("");
  const [atletaId, setAtletaId] = useState("");

  const jogosFiltrados = useMemo(() => {
    if (!campeonatoId) return [];
    return jogos.filter((j) => j.campeonato_id === campeonatoId);
  }, [jogos, campeonatoId]);

  const jogoSelecionado = useMemo(() => {
    return jogos.find((j) => j.id === jogoId);
  }, [jogos, jogoId]);

  const equipesDoJogo = useMemo(() => {
    if (!jogoSelecionado) return [];
    return [
      {
        id: jogoSelecionado.equipe_mandante_id || "",
        nome: jogoSelecionado.equipe_mandante_nome || "Mandante",
      },
      {
        id: jogoSelecionado.equipe_visitante_id || "",
        nome: jogoSelecionado.equipe_visitante_nome || "Visitante",
      },
    ].filter((eq) => eq.id !== "");
  }, [jogoSelecionado]);

  const atletasFiltrados = useMemo(() => {
    if (!equipeId) return [];
    return atletas.filter((a) => a.equipe_id === equipeId);
  }, [atletas, equipeId]);

  const equipeSelecionada = useMemo(() => {
    return equipesDoJogo.find((e) => e.id === equipeId);
  }, [equipesDoJogo, equipeId]);

  const atletaSelecionado = useMemo(() => {
    return atletas.find((a) => a.id === atletaId);
  }, [atletas, atletaId]);

  function aoMudarCampeonato(id: string) {
    setCampeonatoId(id);
    setJogoId("");
    setEquipeId("");
    setAtletaId("");
  }

  function aoMudarJogo(id: string) {
    setJogoId(id);
    setEquipeId("");
    setAtletaId("");
  }

  function aoMudarEquipe(id: string) {
    setEquipeId(id);
    setAtletaId("");
  }

  return (
    <form action={registrarGols} className="mt-6 space-y-5">
      {/* Campos ocultos auxiliares */}
      <input
        type="hidden"
        name="equipe_nome"
        value={equipeSelecionada?.nome || ""}
      />
      <input
        type="hidden"
        name="atleta_nome"
        value={atletaSelecionado?.nome || ""}
      />
      <input
        type="hidden"
        name="categoria_nome"
        value={jogoSelecionado?.categoria || ""}
      />
      <input
        type="hidden"
        name="serie_nome"
        value={jogoSelecionado?.serie || ""}
      />

      <label className="block">
        <span className={labelClass}>Campeonato</span>
        <select
          name="campeonato_id"
          required
          className={inputClass}
          value={campeonatoId}
          onChange={(e) => aoMudarCampeonato(e.target.value)}
        >
          <option value="">Selecione o campeonato</option>
          {campeonatos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome} {c.modalidade ? `— ${c.modalidade}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={labelClass}>Partida / Jogo</span>
        <select
          name="jogo_id"
          required
          className={inputClass}
          value={jogoId}
          onChange={(e) => aoMudarJogo(e.target.value)}
          disabled={!campeonatoId}
        >
          <option value="">Selecione a partida</option>
          {jogosFiltrados.map((j) => (
            <option key={j.id} value={j.id}>
              {j.equipe_mandante_nome} x {j.equipe_visitante_nome}{" "}
              {j.rodada ? `(${j.rodada})` : ""}{" "}
              {j.categoria ? `— ${j.categoria}` : ""}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Equipe</span>
          <select
            name="equipe_id"
            required
            className={inputClass}
            value={equipeId}
            onChange={(e) => aoMudarEquipe(e.target.value)}
            disabled={!jogoId}
          >
            <option value="">Selecione a equipe</option>
            {equipesDoJogo.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelClass}>Atleta</span>
          <select
            name="atleta_id"
            required
            className={inputClass}
            value={atletaId}
            onChange={(e) => setAtletaId(e.target.value)}
            disabled={!equipeId}
          >
            <option value="">Selecione o atleta</option>
            {atletasFiltrados.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome} {a.numero_camisa ? `— Nº ${a.numero_camisa}` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>Quantidade de Gols</span>
        <input
          name="quantidade"
          type="number"
          min="1"
          defaultValue="1"
          required
          className={inputClass}
        />
      </label>

      <button
        type="submit"
        className="w-full rounded-2xl bg-gradient-to-r from-yellow-300 via-green-400 to-blue-500 px-5 py-4 text-sm font-black uppercase text-slate-950 shadow-lg transition hover:scale-[1.01]"
      >
        Registrar gols
      </button>
    </form>
  );
}
