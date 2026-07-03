"use client";

import React, { useState } from "react";
import { X, AlertOctagon, Check, RotateCcw, Calendar } from "lucide-react";
import { getErrorMessage } from "@/lib/tempoReal";
import {
  anularTotalmenteJogo,
  registrarVitoriaWOFavor,
  remarcarPartida,
} from "@/app/admin/jogos/anulacao/actions";

interface AnulacaoJogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  jogo: {
    id: string;
    equipe_mandante_id: string | null;
    equipe_visitante_id: string | null;
    equipe_mandante_nome: string | null;
    equipe_visitante_nome: string | null;
  } | null;
}

export default function AnulacaoJogoModal({
  isOpen,
  onClose,
  jogo,
}: AnulacaoJogoModalProps) {
  const [opcao, setOpcao] = useState<"A" | "B" | "C" | null>(null);
  const [loading, setLoading] = useState(false);

  // Estados Opção B (W.O.)
  const [equipeVencedoraId, setEquipeVencedoraId] = useState("");
  const [golsVencedor, setGolsVencedor] = useState(3);
  const [golsPerdedor, setGolsPerdedor] = useState(0);

  // Estados Opção C (Remarcar)
  const [novaData, setNovaData] = useState("");
  const [novoHorario, setNovoHorario] = useState("");
  const [novoLocal, setNovoLocal] = useState("");

  if (!isOpen || !jogo) return null;

  const handleAnularTotalmente = async () => {
    if (!confirm("Confirmar anulação completa? O jogo perderá o placar e nenhum time pontuará.")) {
      return;
    }
    setLoading(true);
    try {
      await anularTotalmenteJogo(jogo.id);
    } catch (err) {
      alert(getErrorMessage(err, "Erro ao anular jogo."));
      setLoading(false);
    }
  };

  const handleVitoriaWO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipeVencedoraId) {
      alert("Selecione a equipe vencedora.");
      return;
    }
    setLoading(true);
    try {
      await registrarVitoriaWOFavor(jogo.id, equipeVencedoraId, golsVencedor, golsPerdedor);
    } catch (err) {
      alert(getErrorMessage(err, "Erro ao registrar vitória administrativa."));
      setLoading(false);
    }
  };

  const handleRemarcar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaData || !novoHorario || !novoLocal) {
      alert("Preencha todos os dados de remarcação.");
      return;
    }
    setLoading(true);
    try {
      await remarcarPartida(jogo.id, novaData, novoHorario, novoLocal);
    } catch (err) {
      alert(getErrorMessage(err, "Erro ao remarcar partida."));
      setLoading(false);
    }
  };

  const labelClass = "mb-2 block text-xs font-black uppercase tracking-wider text-white/60";
  const inputClass =
    "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-300/60";
  const selectClass =
    "w-full rounded-xl border border-white/10 bg-[#07130f] px-4 py-3 text-sm text-white outline-none focus:border-yellow-300/60";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#030d0a] shadow-2xl">
        
        {/* Cabeçalho */}
        <div className="border-b border-white/5 bg-gradient-to-r from-red-500/10 via-amber-500/5 to-transparent p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertOctagon className="text-red-400" size={24} />
            <div>
              <h2 className="text-xl font-black uppercase text-white">Resolver/Anular Jogo</h2>
              <p className="text-xs text-white/50 font-bold uppercase tracking-wider mt-0.5">
                {jogo.equipe_mandante_nome} x {jogo.equipe_visitante_nome}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/[0.05] p-2 text-white/70 hover:bg-white/[0.1] hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Seletor de Opção */}
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              onClick={() => setOpcao("A")}
              className={`rounded-2xl border p-4 text-center transition flex flex-col items-center justify-center gap-2 ${opcao === "A" ? "border-red-400 bg-red-500/10 text-red-200" : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white"}`}
            >
              <AlertOctagon size={24} />
              <span className="text-xs font-black uppercase">Anular Totalmente</span>
            </button>

            <button
              onClick={() => setOpcao("B")}
              className={`rounded-2xl border p-4 text-center transition flex flex-col items-center justify-center gap-2 ${opcao === "B" ? "border-emerald-400 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white"}`}
            >
              <Check size={24} />
              <span className="text-xs font-black uppercase">Vitória Admin (W.O.)</span>
            </button>

            <button
              onClick={() => setOpcao("C")}
              className={`rounded-2xl border p-4 text-center transition flex flex-col items-center justify-center gap-2 ${opcao === "C" ? "border-blue-400 bg-blue-500/10 text-blue-200" : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white"}`}
            >
              <RotateCcw size={24} />
              <span className="text-xs font-black uppercase">Remarcar Jogo</span>
            </button>
          </div>

          {/* Form Opção A: Anular Totalmente */}
          {opcao === "A" && (
            <div className="space-y-4 rounded-3xl border border-red-500/20 bg-red-500/5 p-5">
              <h3 className="text-sm font-black uppercase text-red-300 flex items-center gap-2">
                <AlertOctagon size={16} />
                Confirmar Anulação Completa
              </h3>
              <p className="text-xs leading-5 text-white/60">
                O jogo terá seu status mudado para **&quot;Anulado&quot;**. O placar de gols será apagado e os gols registrados na artilharia serão removidos. Nenhum time pontuará na classificação geral do campeonato.
              </p>
              <button
                onClick={handleAnularTotalmente}
                disabled={loading}
                className="w-full rounded-xl bg-red-500 py-3 text-xs font-black uppercase text-slate-950 hover:bg-red-400 transition"
              >
                {loading ? "Processando..." : "Confirmar e Anular Jogo"}
              </button>
            </div>
          )}

          {/* Form Opção B: Vitória Administrativa (W.O.) */}
          {opcao === "B" && (
            <form onSubmit={handleVitoriaWO} className="space-y-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <h3 className="text-sm font-black uppercase text-emerald-300 flex items-center gap-2">
                <Check size={16} />
                Configurar Vitória por Decisão (W.O.)
              </h3>
              <p className="text-xs leading-5 text-white/60">
                Escolha qual time sairá vitorioso do confronto e defina o placar administrativo. Quaisquer gols anteriormente computados na artilharia serão limpos.
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block sm:col-span-1">
                  <span className={labelClass}>Time Vencedor *</span>
                  <select
                    value={equipeVencedoraId}
                    onChange={(e) => setEquipeVencedoraId(e.target.value)}
                    required
                    className={selectClass}
                  >
                    <option value="">Selecione...</option>
                    <option value={jogo.equipe_mandante_id || ""}>{jogo.equipe_mandante_nome}</option>
                    <option value={jogo.equipe_visitante_id || ""}>{jogo.equipe_visitante_nome}</option>
                  </select>
                </label>

                <label className="block">
                  <span className={labelClass}>Gols do Vencedor</span>
                  <input
                    type="number"
                    min="0"
                    value={golsVencedor}
                    onChange={(e) => setGolsVencedor(parseInt(e.target.value) || 0)}
                    required
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>Gols do Perdedor</span>
                  <input
                    type="number"
                    min="0"
                    value={golsPerdedor}
                    onChange={(e) => setGolsPerdedor(parseInt(e.target.value) || 0)}
                    required
                    className={inputClass}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-400 py-3 text-xs font-black uppercase text-slate-950 hover:bg-emerald-300 transition"
              >
                {loading ? "Processando..." : "Confirmar Vitória por W.O."}
              </button>
            </form>
          )}

          {/* Form Opção C: Remarcar */}
          {opcao === "C" && (
            <form onSubmit={handleRemarcar} className="space-y-4 rounded-3xl border border-blue-500/20 bg-blue-500/5 p-5">
              <h3 className="text-sm font-black uppercase text-blue-300 flex items-center gap-2">
                <Calendar size={16} />
                Definir Novo Agendamento
              </h3>
              <p className="text-xs leading-5 text-white/60">
                A partida voltará para o status de **&quot;Agendada&quot;**. O placar de gols atual será zerado e os gols registrados na artilharia serão removidos. Insira os novos dados do confronto:
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className={labelClass}>Nova Data *</span>
                  <input
                    type="date"
                    value={novaData}
                    onChange={(e) => setNovaData(e.target.value)}
                    required
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>Novo Horário *</span>
                  <input
                    type="time"
                    value={novoHorario}
                    onChange={(e) => setNovoHorario(e.target.value)}
                    required
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>Novo Local *</span>
                  <input
                    type="text"
                    value={novoLocal}
                    onChange={(e) => setNovoLocal(e.target.value)}
                    required
                    placeholder="Ex: Ginásio Municipal"
                    className={inputClass}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-400 py-3 text-xs font-black uppercase text-slate-950 hover:bg-blue-300 transition"
              >
                {loading ? "Processando..." : "Remarcar e Agendar Jogo"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
