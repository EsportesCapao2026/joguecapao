"use client";

import { useMemo, useState } from "react";
import { cadastrarPunicao } from "@/app/admin/punicoes/actions";

type Campeonato = {
  id: string;
  nome: string;
  modalidade: string | null;
};

type Equipe = {
  id: string;
  campeonato_id: string | null;
  nome: string;
  categoria_nome: string | null;
  serie_nome: string | null;
};

type Atleta = {
  id: string;
  equipe_id: string | null;
  nome: string;
  numero_camisa: string | null;
};

type Props = {
  campeonatos: Campeonato[];
  equipes: Equipe[];
  atletas: Atleta[];
};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-yellow-300/60 focus:ring-2 focus:ring-yellow-300/10";

const labelClass =
  "mb-2 block text-sm font-black uppercase tracking-[0.08em] text-white/75";

export function AdminPunicaoForm({ campeonatos, equipes, atletas }: Props) {
  const [campeonatoId, setCampeonatoId] = useState("");
  const [equipeId, setEquipeId] = useState("");
  const [atletaId, setAtletaId] = useState("");

  const equipesFiltradas = useMemo(() => {
    if (!campeonatoId) return [];
    return equipes.filter((e) => e.campeonato_id === campeonatoId);
  }, [equipes, campeonatoId]);

  const atletasFiltrados = useMemo(() => {
    if (!equipeId) return [];
    return atletas.filter((a) => a.equipe_id === equipeId);
  }, [atletas, equipeId]);

  const equipeSelecionada = useMemo(() => {
    return equipes.find((e) => e.id === equipeId);
  }, [equipes, equipeId]);

  const atletaSelecionado = useMemo(() => {
    return atletas.find((a) => a.id === atletaId);
  }, [atletas, atletaId]);

  function aoMudarCampeonato(id: string) {
    setCampeonatoId(id);
    setEquipeId("");
    setAtletaId("");
  }

  function aoMudarEquipe(id: string) {
    setEquipeId(id);
    setAtletaId("");
  }

  return (
    <form action={cadastrarPunicao} className="mt-6 space-y-5">
      {/* Campos auxiliares ocultos para mandar nomes e categorias sem queries extras na action */}
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
        value={equipeSelecionada?.categoria_nome || ""}
      />
      <input
        type="hidden"
        name="serie_nome"
        value={equipeSelecionada?.serie_nome || ""}
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

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Equipe</span>
          <select
            name="equipe_id"
            required
            className={inputClass}
            value={equipeId}
            onChange={(e) => aoMudarEquipe(e.target.value)}
            disabled={!campeonatoId}
          >
            <option value="">Selecione a equipe</option>
            {equipesFiltradas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome} {e.categoria_nome ? `(${e.categoria_nome})` : ""}
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

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Origem da regra</span>
          <select name="origem" className={inputClass}>
            <option value="regulamento_municipal">Regulamento municipal</option>
            <option value="cbjd">CBJD (Código Brasileiro)</option>
            <option value="decisao_administrativa">Decisão administrativa</option>
            <option value="outro">Outra origem</option>
          </select>
        </label>

        <label className="block">
          <span className={labelClass}>Artigo / regulamento de referência</span>
          <input
            name="artigo_cbjd"
            placeholder="Ex.: Art. 254 do CBJD ou Art. 12 do Reg."
            className={inputClass}
          />
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>Motivo / descrição detalhada</span>
        <textarea
          name="motivo"
          required
          rows={3}
          placeholder="Descreva detalhadamente o incidente e a decisão disciplinar..."
          className={inputClass}
        />
      </label>

      <div className="grid gap-5 md:grid-cols-3">
        <label className="block">
          <span className={labelClass}>Data de início</span>
          <input name="data_inicio" type="date" className={inputClass} />
        </label>

        <label className="block">
          <span className={labelClass}>Data final</span>
          <input name="data_fim" type="date" className={inputClass} />
        </label>

        <label className="block">
          <span className={labelClass}>Jogos de suspensão</span>
          <input
            name="jogos_suspensao"
            type="number"
            min="1"
            placeholder="Ex.: 2"
            className={inputClass}
          />
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>Status da punição</span>
        <select name="status" className={inputClass}>
          <option value="Ativa">Ativa (Pendente/Não cumprida)</option>
          <option value="Em cumprimento">Em cumprimento</option>
          <option value="Encerrada">Encerrada (Cumprida)</option>
        </select>
      </label>

      <button
        type="submit"
        className="w-full rounded-2xl bg-gradient-to-r from-yellow-300 via-green-400 to-blue-500 px-5 py-4 text-sm font-black uppercase text-slate-950 shadow-lg transition hover:scale-[1.01]"
      >
        Salvar punição
      </button>
    </form>
  );
}
