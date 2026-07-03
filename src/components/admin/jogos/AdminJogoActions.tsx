"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Clock, AlertOctagon, Edit3 } from "lucide-react";
import AnulacaoJogoModal from "./AnulacaoJogoModal";
import EditarJogoModal from "./EditarJogoModal";

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

interface AdminJogoActionsProps {
  jogo: JogoCompleto;
  campeonatos: Campeonato[];
  equipes: Equipe[];
  atletas: AtletaJogo[];
  gols: GolRegistro[];
}

export default function AdminJogoActions({
  jogo,
  campeonatos,
  equipes,
  atletas,
  gols,
}: AdminJogoActionsProps) {
  const [anulacaoModalOpen, setAnulacaoModalOpen] = useState(false);
  const [editarModalOpen, setEditarModalOpen] = useState(false);

  const isLive = jogo.status === "em_andamento";
  const isScheduled = jogo.status === "agendado";
  const isRealized = jogo.status === "realizado";
  const podeControlarEventos = isScheduled || isLive || isRealized;

  return (
    <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-3">
      {/* Botão de Tempo Real para jogos agendados ou em andamento */}
      {podeControlarEventos && (
        <Link
          href={`/admin/jogos/tempo-real/${jogo.id}`}
          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.12em] transition hover:scale-[1.01] ${isLive ? "bg-red-500 text-slate-950 animate-pulse" : "border border-emerald-300/30 bg-emerald-500/10 text-emerald-100"}`}
        >
          <Clock size={16} />
          {isLive ? "Partida Ao Vivo" : isRealized ? "Editar Eventos" : "Iniciar Tempo Real"}
        </Link>
      )}

      {/* Botão de Editar Jogo (Sempre visível) */}
      <button
        onClick={() => setEditarModalOpen(true)}
        className="inline-flex items-center gap-2 rounded-2xl border border-yellow-300/30 bg-yellow-300/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-yellow-200 transition hover:bg-yellow-300 hover:text-slate-950"
      >
        <Edit3 size={16} />
        Editar Jogo
      </button>

      {/* Botão de Súmula / PDF (Sempre visível) */}
      <Link
        href={`/admin/jogos/sumula/${jogo.id}`}
        target="_blank"
        className="inline-flex items-center gap-2 rounded-2xl border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-blue-200 transition hover:bg-blue-500 hover:text-slate-950"
      >
        📄 Gerar Súmula / PDF
      </Link>

      {/* Botão de Anulação para jogos concluídos */}
      {isRealized && (
        <button
          onClick={() => setAnulacaoModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-red-200 transition hover:bg-red-500 hover:text-slate-950"
        >
          <AlertOctagon size={16} />
          Anular Jogo
        </button>
      )}

      {/* Modais */}
      <AnulacaoJogoModal
        isOpen={anulacaoModalOpen}
        onClose={() => setAnulacaoModalOpen(false)}
        jogo={jogo}
      />

      <EditarJogoModal
        isOpen={editarModalOpen}
        onClose={() => setEditarModalOpen(false)}
        jogo={jogo}
        campeonatos={campeonatos}
        equipes={equipes}
        atletas={atletas}
        gols={gols}
      />
    </div>
  );
}
