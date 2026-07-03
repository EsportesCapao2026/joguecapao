"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Play, Pause, Plus, Minus, Trash2, Check, X, Award, Edit3, Save } from "lucide-react";
import {
  atualizarCronometroCompleto,
  registrarGolTempoReal,
  editarGolTempoReal,
  removerGolTempoReal,
  finalizarTempoReal,
  registrarCartaoTempoReal,
  editarCartaoTempoReal,
  removerCartaoTempoReal,
} from "@/app/admin/jogos/tempo-real/actions";
import { getErrorMessage, parseJogoObservacoes, type TipoCartao } from "@/lib/tempoReal";

type Atleta = {
  id: string;
  nome: string;
};

type JogoTempoReal = {
  id: string;
  equipe_mandante_id: string | null;
  equipe_visitante_id: string | null;
  equipe_mandante_nome: string | null;
  equipe_visitante_nome: string | null;
  gols_mandante: number | null;
  gols_visitante: number | null;
  status: string | null;
  observacoes: string | null;
};

interface TempoRealControlProps {
  jogo: JogoTempoReal;
  atletasMandante: Atleta[];
  atletasVisitante: Atleta[];
}

export default function TempoRealControl({
  jogo,
  atletasMandante,
  atletasVisitante,
}: TempoRealControlProps) {
  const jsonObs = useMemo(
    () => parseJogoObservacoes(jogo.observacoes),
    [jogo.observacoes]
  );

  const tempoRealInfo = jsonObs.tempo_real || {
    status: "em_andamento",
    minuto: 0,
    segundo: 0,
    periodo: "1T",
    rodando: false,
    duracao_tempo: 40,
    acrescimo: 0,
    prorrogacao_ativa: false,
    penaltis_ativo: false,
  };

  const golsDetalhe = jsonObs.gols_detalhe || [];
  const cartoesDetalhe = jsonObs.cartoes_detalhe || [];
  const penaltisData = jsonObs.penaltis || { mandante_cobrancas: [], visitante_cobrancas: [] };

  // Estados locais
  const [minuto, setMinuto] = useState(tempoRealInfo.minuto ?? 0);
  const [segundo, setSegundo] = useState(tempoRealInfo.segundo ?? 0);
  const [periodo, setPeriodo] = useState(tempoRealInfo.periodo ?? "1T");
  const [rodando, setRodando] = useState(tempoRealInfo.rodando ?? false);
  const [duracaoTempo, setDuracaoTempo] = useState(tempoRealInfo.duracao_tempo ?? 40);
  const [isCustomTempo, setIsCustomTempo] = useState(tempoRealInfo.duracao_tempo !== 20 && tempoRealInfo.duracao_tempo !== 45);
  const [acrescimo, setAcrescimo] = useState(tempoRealInfo.acrescimo ?? 0);
  const [prorrogacaoAtiva, setProrrogacaoAtiva] = useState(tempoRealInfo.prorrogacao_ativa ?? false);
  const [penaltisAtivo, setPenaltisAtivo] = useState(tempoRealInfo.penaltis_ativo ?? false);
  
  // Pênaltis
  const [penaltisMandante, setPenaltisMandante] = useState<boolean[]>(penaltisData.mandante_cobrancas || []);
  const [penaltisVisitante, setPenaltisVisitante] = useState<boolean[]>(penaltisData.visitante_cobrancas || []);

  const [loading, setLoading] = useState(false);

  // Seletores de atleta para gol
  const [atletaMandanteGol, setAtletaMandanteGol] = useState("");
  const [atletaVisitanteGol, setAtletaVisitanteGol] = useState("");

  // Seletores de atleta para cartões
  const [atletaMandanteCartao, setAtletaMandanteCartao] = useState("");
  const [tipoMandanteCartao, setTipoMandanteCartao] = useState<"amarelo" | "vermelho">("amarelo");
  const [atletaVisitanteCartao, setAtletaVisitanteCartao] = useState("");
  const [tipoVisitanteCartao, setTipoVisitanteCartao] = useState<"amarelo" | "vermelho">("amarelo");
  const [golEditando, setGolEditando] = useState<{
    golId: string;
    equipeId: string;
    atletaId: string;
    minuto: number;
  } | null>(null);
  const [cartaoEditando, setCartaoEditando] = useState<{
    cartaoId: string;
    equipeId: string;
    atletaId: string;
    tipo: TipoCartao;
    minuto: number;
  } | null>(null);

  // Refs de controle de tempo
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Efeito para rodar o cronômetro localmente segundo a segundo
  useEffect(() => {
    if (rodando) {
      intervalRef.current = setInterval(() => {
        setSegundo((prevSeg: number) => {
          if (prevSeg >= 59) {
            // Avança o minuto
            setMinuto((prevMin: number) => {
              const novoMin = prevMin + 1;
              const tempoMax = duracaoTempo + acrescimo;

              // Fim do período (regulamentar + acréscimo)
              if (novoMin >= tempoMax) {
                setRodando(false);
                atualizarCronometroCompleto(
                  jogo.id,
                  novoMin,
                  0,
                  periodo,
                  false,
                  duracaoTempo,
                  acrescimo,
                  prorrogacaoAtiva,
                  penaltisAtivo,
                  penaltisMandante,
                  penaltisVisitante
                ).catch(console.error);
                return novoMin;
              }

              // Sincroniza no banco a cada 1 minuto de jogo regulamentar
              atualizarCronometroCompleto(
                jogo.id,
                novoMin,
                0,
                periodo,
                true,
                duracaoTempo,
                acrescimo,
                prorrogacaoAtiva,
                penaltisAtivo,
                penaltisMandante,
                penaltisVisitante
              ).catch(console.error);

              return novoMin;
            });
            return 0;
          }
          return prevSeg + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [rodando, periodo, duracaoTempo, acrescimo, prorrogacaoAtiva, penaltisAtivo, penaltisMandante, penaltisVisitante, jogo.id]);

  // Função para dar Play/Pause manual
  const handlePlayPause = async () => {
    const novoEstadoRodando = !rodando;
    setRodando(novoEstadoRodando);
    try {
      await atualizarCronometroCompleto(
        jogo.id,
        minuto,
        segundo,
        periodo,
        novoEstadoRodando,
        duracaoTempo,
        acrescimo,
        prorrogacaoAtiva,
        penaltisAtivo,
        penaltisMandante,
        penaltisVisitante
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao sincronizar cronômetro com o servidor.");
    }
  };

  // Alterar minutos manualmente
  const handleAlterarMinuto = async (quantidade: number) => {
    const novoMinuto = Math.max(0, minuto + quantidade);
    setMinuto(novoMinuto);
    setSegundo(0);
    try {
      await atualizarCronometroCompleto(
        jogo.id,
        novoMinuto,
        0,
        periodo,
        rodando,
        duracaoTempo,
        acrescimo,
        prorrogacaoAtiva,
        penaltisAtivo,
        penaltisMandante,
        penaltisVisitante
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Mudar Período (1T, INT, 2T, etc.)
  const handleMudarPeriodo = async (novoPeriodo: string) => {
    setPeriodo(novoPeriodo);
    
    // Se mudar para um novo tempo de jogo, o cronômetro começa do zero (00:00) por período
    const isNovoTempoDeJogo = ["1T", "2T", "1T-PR", "2T-PR"].includes(novoPeriodo);
    const novoMinuto = isNovoTempoDeJogo ? 0 : minuto;
    const novoSegundo = isNovoTempoDeJogo ? 0 : segundo;
    
    if (isNovoTempoDeJogo) {
      setMinuto(0);
      setSegundo(0);
    }
    
    // Se mudar para intervalo, fim de jogo ou disputa de pênaltis, pausa o cronômetro
    const naoPodeRodar = ["INT", "FIM", "PEN", "INT-PR"].includes(novoPeriodo);
    const novoRodando = naoPodeRodar ? false : rodando;
    if (naoPodeRodar) setRodando(false);

    // Se selecionar disputa de pênaltis, ativa a disputa de pênaltis automaticamente
    const novoPenaltisAtivo = novoPeriodo === "PEN" ? true : penaltisAtivo;
    if (novoPeriodo === "PEN") setPenaltisAtivo(true);

    try {
      await atualizarCronometroCompleto(
        jogo.id,
        novoMinuto,
        novoSegundo,
        novoPeriodo,
        novoRodando,
        duracaoTempo,
        acrescimo,
        prorrogacaoAtiva,
        novoPenaltisAtivo,
        penaltisMandante,
        penaltisVisitante
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Alterar a Duração Regulamentar por Tempo
  const handleMudarDuracaoTempo = async (duracao: number) => {
    setDuracaoTempo(duracao);
    try {
      await atualizarCronometroCompleto(
        jogo.id,
        minuto,
        segundo,
        periodo,
        rodando,
        duracao,
        acrescimo,
        prorrogacaoAtiva,
        penaltisAtivo,
        penaltisMandante,
        penaltisVisitante
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Alterar Acréscimo do Tempo Atual
  const handleMudarAcrescimo = async (minutosAcrescimo: number) => {
    setAcrescimo(minutosAcrescimo);
    try {
      await atualizarCronometroCompleto(
        jogo.id,
        minuto,
        segundo,
        periodo,
        rodando,
        duracaoTempo,
        minutosAcrescimo,
        prorrogacaoAtiva,
        penaltisAtivo,
        penaltisMandante,
        penaltisVisitante
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Ativar ou desativar Prorrogação
  const handleMudarProrrogacao = async (ativa: boolean) => {
    setProrrogacaoAtiva(ativa);
    try {
      await atualizarCronometroCompleto(
        jogo.id,
        minuto,
        segundo,
        periodo,
        rodando,
        duracaoTempo,
        acrescimo,
        ativa,
        penaltisAtivo,
        penaltisMandante,
        penaltisVisitante
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Ativar/Desativar Disputa de Pênaltis
  const handleMudarPenaltisAtivo = async (ativo: boolean) => {
    setPenaltisAtivo(ativo);
    if (ativo) {
      setPeriodo("PEN");
      setRodando(false);
    } else {
      setPeriodo("2T");
    }
    try {
      await atualizarCronometroCompleto(
        jogo.id,
        minuto,
        segundo,
        ativo ? "PEN" : "2T",
        false,
        duracaoTempo,
        acrescimo,
        prorrogacaoAtiva,
        ativo,
        penaltisMandante,
        penaltisVisitante
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Registrar Cobrança de Pênalti
  const handleLancarPenalti = async (equipe: "mandante" | "visitante", convertido: boolean) => {
    const novoArray = equipe === "mandante"
      ? [...penaltisMandante, convertido]
      : [...penaltisVisitante, convertido];

    if (equipe === "mandante") {
      setPenaltisMandante(novoArray);
    } else {
      setPenaltisVisitante(novoArray);
    }

    try {
      await atualizarCronometroCompleto(
        jogo.id,
        minuto,
        segundo,
        periodo,
        rodando,
        duracaoTempo,
        acrescimo,
        prorrogacaoAtiva,
        true,
        equipe === "mandante" ? novoArray : penaltisMandante,
        equipe === "visitante" ? novoArray : penaltisVisitante
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Apagar Disputa de Pênaltis
  const handleResetarPenaltis = async () => {
    if (!confirm("Tem certeza que deseja limpar as cobranças de pênaltis?")) return;
    setPenaltisMandante([]);
    setPenaltisVisitante([]);
    try {
      await atualizarCronometroCompleto(
        jogo.id,
        minuto,
        segundo,
        periodo,
        rodando,
        duracaoTempo,
        acrescimo,
        prorrogacaoAtiva,
        penaltisAtivo,
        [],
        []
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Registrar um gol regulamentar
  const handleRegistrarGol = async (equipeId: string, atletaId: string) => {
    if (!atletaId) {
      alert("Selecione um atleta para registrar o gol.");
      return;
    }

    setLoading(true);
    try {
      await registrarGolTempoReal(jogo.id, equipeId, atletaId, minuto);
      setAtletaMandanteGol("");
      setAtletaVisitanteGol("");
    } catch (err) {
      alert(getErrorMessage(err, "Erro ao registrar gol."));
    } finally {
      setLoading(false);
    }
  };

  // Remover um gol regulamentar
  const handleRemoverGol = async (golIdNoBanco: string, equipeId: string) => {
    if (!confirm("Tem certeza que deseja anular este gol? O placar será corrigido.")) {
      return;
    }

    setLoading(true);
    try {
      await removerGolTempoReal(jogo.id, golIdNoBanco, equipeId);
    } catch (err) {
      alert(getErrorMessage(err, "Erro ao remover gol."));
    } finally {
      setLoading(false);
    }
  };

  const atletasDaEquipe = (equipeId: string) => {
    if (equipeId === jogo.equipe_mandante_id) return atletasMandante;
    if (equipeId === jogo.equipe_visitante_id) return atletasVisitante;
    return [];
  };

  const handleSalvarEdicaoGol = async () => {
    if (!golEditando) return;
    if (!golEditando.equipeId || !golEditando.atletaId) {
      alert("Selecione equipe e atleta para corrigir o gol.");
      return;
    }

    setLoading(true);
    try {
      await editarGolTempoReal(
        jogo.id,
        golEditando.golId,
        golEditando.equipeId,
        golEditando.atletaId,
        golEditando.minuto
      );
      setGolEditando(null);
    } catch (err) {
      alert(getErrorMessage(err, "Erro ao corrigir gol."));
    } finally {
      setLoading(false);
    }
  };

  // Registrar um cartão
  const handleRegistrarCartao = async (equipeId: string, atletaId: string, tipo: "amarelo" | "vermelho") => {
    if (!atletaId) {
      alert("Selecione um atleta para aplicar o cartão.");
      return;
    }

    setLoading(true);
    try {
      await registrarCartaoTempoReal(jogo.id, equipeId, atletaId, tipo, minuto);
      if (equipeId === jogo.equipe_mandante_id) {
        setAtletaMandanteCartao("");
      } else {
        setAtletaVisitanteCartao("");
      }
    } catch (err) {
      alert(getErrorMessage(err, "Erro ao registrar cartão."));
    } finally {
      setLoading(false);
    }
  };

  // Remover um cartão
  const handleRemoverCartao = async (cartaoId: string) => {
    if (!confirm("Tem certeza que deseja anular este cartão?")) {
      return;
    }

    setLoading(true);
    try {
      await removerCartaoTempoReal(jogo.id, cartaoId);
    } catch (err) {
      alert(getErrorMessage(err, "Erro ao remover cartão."));
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarEdicaoCartao = async () => {
    if (!cartaoEditando) return;
    if (!cartaoEditando.equipeId || !cartaoEditando.atletaId) {
      alert("Selecione equipe e atleta para corrigir o cartão.");
      return;
    }

    setLoading(true);
    try {
      await editarCartaoTempoReal(
        jogo.id,
        cartaoEditando.cartaoId,
        cartaoEditando.equipeId,
        cartaoEditando.atletaId,
        cartaoEditando.tipo,
        cartaoEditando.minuto
      );
      setCartaoEditando(null);
    } catch (err) {
      alert(getErrorMessage(err, "Erro ao corrigir cartão."));
    } finally {
      setLoading(false);
    }
  };

  // Finalizar a partida
  const handleFinalizarJogo = async () => {
    if (!confirm("Deseja mesmo finalizar a partida? Esta ação gravará o placar final, suspenderá atletas expulsos e definirá o jogo como 'Realizado'.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await finalizarTempoReal(jogo.id);
      if (res && res.atletasSuspensos && res.atletasSuspensos.length > 0) {
        alert(`Partida finalizada com sucesso!\n\n🔴 OS SEGUINTES ATLETAS FORAM EXPULSOS E ESTÃO SUSPENSOS AUTOMATICAMENTE POR 1 JOGO:\n${res.atletasSuspensos.map(nome => `- ${nome}`).join("\n")}`);
      } else {
        alert("Partida finalizada com sucesso!");
      }
      
      // Oferecer opção de gerar súmula em PDF
      if (confirm("Deseja gerar e imprimir a Súmula Oficial em PDF desta partida agora?")) {
        window.open(`/admin/jogos/sumula/${jogo.id}`, "_blank");
      }
      
      window.location.href = "/admin/jogos?sucesso=partida-finalizada";
    } catch (err) {
      alert(getErrorMessage(err, "Erro ao finalizar partida."));
      setLoading(false);
    }
  };

  // Mapear gols por equipe
  const golsMandanteList = golsDetalhe.filter((g) => g.equipe_id === jogo.equipe_mandante_id);
  const golsVisitanteList = golsDetalhe.filter((g) => g.equipe_id === jogo.equipe_visitante_id);

  // Mapear cartões por equipe
  const cartoesMandanteList = cartoesDetalhe.filter((c) => c.equipe_id === jogo.equipe_mandante_id);
  const cartoesVisitanteList = cartoesDetalhe.filter((c) => c.equipe_id === jogo.equipe_visitante_id);

  // Totais de pênaltis convertidos
  const totalPenaltisMandante = penaltisMandante.filter(Boolean).length;
  const totalPenaltisVisitante = penaltisVisitante.filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Central do Cronômetro Automático */}
      <section className="rounded-[2.5rem] border border-white/10 bg-slate-950/70 p-6 md:p-8 text-center backdrop-blur shadow-2xl space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-black uppercase text-red-300">
            <span className={`h-2.5 w-2.5 rounded-full bg-red-500 ${rodando ? "animate-pulse" : ""}`} />
            Transmissão Automática Ao Vivo
          </span>

          {/* Duração regulamentar do tempo */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-white/50 uppercase">Tempo Regulamentar:</span>
            <select
              value={isCustomTempo ? "custom" : duracaoTempo}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "custom") {
                  setIsCustomTempo(true);
                } else {
                  setIsCustomTempo(false);
                  handleMudarDuracaoTempo(parseInt(val));
                }
              }}
              disabled={rodando}
              className="rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-white outline-none text-xs"
            >
              <option value="20">20 Minutos (Futsal)</option>
              <option value="45">45 Minutos (Campo)</option>
              <option value="custom">Personalizado</option>
            </select>

            {isCustomTempo && (
              <input
                type="number"
                min="1"
                max="99"
                value={duracaoTempo}
                disabled={rodando}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val > 0) {
                    handleMudarDuracaoTempo(val);
                  }
                }}
                className="w-16 rounded-xl border border-white/10 bg-black/45 px-2 py-1.5 text-white outline-none text-center text-xs"
                placeholder="Minutos"
              />
            )}
          </div>
        </div>

        {/* Mostrador Digital */}
        <div className="relative inline-block mx-auto">
          <p className="text-8xl font-black font-mono tracking-wider text-white select-none">
            {minuto < 10 ? `0${minuto}` : minuto}:{segundo < 10 ? `0${segundo}` : segundo}
          </p>
          
          {acrescimo > 0 && (
            <span className="absolute -top-3 -right-16 rounded-full bg-yellow-400/20 border border-yellow-300/30 px-2.5 py-1 text-xs font-black text-yellow-200 animate-pulse">
              + {acrescimo} min
            </span>
          )}

          <p className="text-lg font-black uppercase tracking-[0.2em] text-emerald-300 mt-2">
            {periodo === "1T" && "1º Tempo"}
            {periodo === "INT" && "Intervalo"}
            {periodo === "2T" && "2º Tempo"}
            {periodo === "1T-PR" && "Prorrogação (1ºT)"}
            {periodo === "INT-PR" && "Prorrogação (INT)"}
            {periodo === "2T-PR" && "Prorrogação (2ºT)"}
            {periodo === "PEN" && "Disputa de Pênaltis"}
            {periodo === "FIM" && "Fim de Jogo"}
          </p>
        </div>

        {/* Controles do Cronômetro */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          
          {/* Play/Pause */}
          <button
            onClick={handlePlayPause}
            className={`flex h-16 w-16 items-center justify-center rounded-full text-slate-950 transition hover:scale-105 shadow-lg ${rodando ? "bg-amber-300" : "bg-emerald-300"}`}
          >
            {rodando ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
          </button>

          {/* Ajustes Manuais */}
          <button
            onClick={() => handleAlterarMinuto(1)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.12] transition"
            title="Avançar 1 Minuto"
          >
            <Plus size={20} />
          </button>

          <button
            onClick={() => handleAlterarMinuto(-1)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.12] transition"
            title="Recuar 1 Minuto"
          >
            <Minus size={20} />
          </button>

          {/* Acréscimos (Aparece a qualquer momento) */}
          <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-black/40 p-1">
            <span className="text-xxs font-black text-white/40 uppercase px-2">Acréscimo:</span>
            {[0, 2, 3, 5].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleMudarAcrescimo(m)}
                className={`px-3 py-1.5 rounded-xl text-xxs font-black transition ${acrescimo === m ? "bg-yellow-300 text-slate-950" : "text-white/60 hover:text-white"}`}
              >
                {m === 0 ? "Nenhum" : `+${m}'`}
              </button>
            ))}
          </div>
        </div>

        {/* Seletores do Período Atual da Partida */}
        <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-center gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xxs font-black text-white/40 uppercase tracking-wider">Tempo Regular</span>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-1 flex gap-1 text-xs font-black">
              {["1T", "INT", "2T"].map((p) => (
                <button
                  key={p}
                  onClick={() => handleMudarPeriodo(p)}
                  className={`px-3.5 py-2 rounded-xl transition ${periodo === p ? "bg-gradient-to-r from-yellow-300 to-green-400 text-slate-950" : "text-white/60 hover:text-white"}`}
                >
                  {p === "1T" ? "1º Tempo" : p === "INT" ? "Intervalo" : "2º Tempo"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xxs font-black text-white/40 uppercase tracking-wider">Prorrogação / Penalidades</span>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-1 flex gap-1 text-xs font-black">
              <button
                onClick={() => {
                  handleMudarProrrogacao(!prorrogacaoAtiva);
                  if (!prorrogacaoAtiva) {
                    handleMudarPeriodo("1T-PR");
                  }
                }}
                className={`px-3.5 py-2 rounded-xl transition ${prorrogacaoAtiva ? "bg-amber-500/20 text-amber-200 border border-amber-500/30" : "text-white/40 hover:text-white"}`}
              >
                Prorrogação
              </button>

              {prorrogacaoAtiva && (
                <>
                  {["1T-PR", "INT-PR", "2T-PR"].map((p) => (
                    <button
                      key={p}
                      onClick={() => handleMudarPeriodo(p)}
                      className={`px-3 py-2 rounded-xl transition ${periodo === p ? "bg-yellow-300 text-slate-950" : "text-white/60 hover:text-white"}`}
                    >
                      {p === "1T-PR" ? "1ºT-PR" : p === "INT-PR" ? "INT-PR" : "2ºT-PR"}
                    </button>
                  ))}
                </>
              )}

              <button
                onClick={() => handleMudarPenaltisAtivo(!penaltisAtivo)}
                className={`px-3.5 py-2 rounded-xl transition ${penaltisAtivo ? "bg-red-500/20 text-red-200 border border-red-500/30 animate-pulse" : "text-white/40 hover:text-white"}`}
              >
                Pênaltis
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Disputa de Pênaltis Interativa */}
      {penaltisAtivo && (
        <section className="rounded-[2.5rem] border border-red-500/20 bg-red-950/5 p-6 backdrop-blur shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-red-500/10 pb-3">
            <h3 className="text-lg font-black uppercase text-red-300 flex items-center gap-2">
              <Award size={20} />
              DISPUTA DE PÊNALTIS ({totalPenaltisMandante} x {totalPenaltisVisitante})
            </h3>
            <button
              onClick={handleResetarPenaltis}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xxs font-black uppercase text-red-300 hover:bg-red-500 hover:text-slate-950 transition"
            >
              Resetar Pênaltis
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Cobranças Mandante */}
            <div className="bg-black/35 p-5 rounded-3xl border border-white/5 space-y-4">
              <p className="font-black text-white text-center uppercase tracking-wide">{jogo.equipe_mandante_nome}</p>
              
              {/* Círculos das Cobranças */}
              <div className="flex justify-center gap-2.5 my-3">
                {Array.from({ length: Math.max(5, penaltisMandante.length + 1) }).map((_, i) => {
                  const convertido = penaltisMandante[i];
                  return (
                    <div
                      key={i}
                      className={`h-9 w-9 rounded-full border grid place-items-center font-bold text-xs ${convertido === true ? "border-green-500 bg-green-500/25 text-green-300" : convertido === false ? "border-red-500 bg-red-500/25 text-red-300" : "border-white/10 bg-white/[0.04] text-white/20"}`}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>

              {/* Botões rápidos de Lançamento */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleLancarPenalti("mandante", true)}
                  className="flex-1 rounded-xl bg-green-400 py-3 text-xs font-black uppercase text-slate-950 hover:bg-green-300 transition flex items-center justify-center gap-1.5"
                >
                  <Check size={16} /> Acertou
                </button>
                <button
                  onClick={() => handleLancarPenalti("mandante", false)}
                  className="flex-1 rounded-xl bg-red-500 py-3 text-xs font-black uppercase text-white hover:bg-red-400 transition flex items-center justify-center gap-1.5"
                >
                  <X size={16} /> Errou
                </button>
              </div>
            </div>

            {/* Cobranças Visitante */}
            <div className="bg-black/35 p-5 rounded-3xl border border-white/5 space-y-4">
              <p className="font-black text-white text-center uppercase tracking-wide">{jogo.equipe_visitante_nome}</p>
              
              {/* Círculos das Cobranças */}
              <div className="flex justify-center gap-2.5 my-3">
                {Array.from({ length: Math.max(5, penaltisVisitante.length + 1) }).map((_, i) => {
                  const convertido = penaltisVisitante[i];
                  return (
                    <div
                      key={i}
                      className={`h-9 w-9 rounded-full border grid place-items-center font-bold text-xs ${convertido === true ? "border-green-500 bg-green-500/25 text-green-300" : convertido === false ? "border-red-500 bg-red-500/25 text-red-300" : "border-white/10 bg-white/[0.04] text-white/20"}`}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>

              {/* Botões rápidos de Lançamento */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleLancarPenalti("visitante", true)}
                  className="flex-1 rounded-xl bg-green-400 py-3 text-xs font-black uppercase text-slate-950 hover:bg-green-300 transition flex items-center justify-center gap-1.5"
                >
                  <Check size={16} /> Acertou
                </button>
                <button
                  onClick={() => handleLancarPenalti("visitante", false)}
                  className="flex-1 rounded-xl bg-red-500 py-3 text-xs font-black uppercase text-white hover:bg-red-400 transition flex items-center justify-center gap-1.5"
                >
                  <X size={16} /> Errou
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Central das Equipes e Gols */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Mandante */}
        <section className="rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase text-center mb-4 text-white truncate">
              {jogo.equipe_mandante_nome}
            </h2>

            <p className="text-8xl font-black text-center text-yellow-200 font-mono my-4">
              {jogo.gols_mandante ?? 0}
            </p>

            {/* Registrar Gol Mandante */}
            <div className="bg-black/20 p-4 rounded-3xl border border-white/5 space-y-3 mt-6">
              <label className="block text-xs font-black uppercase tracking-wider text-white/50 mb-1">
                Registrar Gol para o Mandante
              </label>
              <div className="flex gap-2">
                <select
                  value={atletaMandanteGol}
                  onChange={(e) => setAtletaMandanteGol(e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-[#07130f] px-3 py-3 text-sm text-white outline-none"
                >
                  <option value="">Selecione o jogador</option>
                  {atletasMandante.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleRegistrarGol(jogo.equipe_mandante_id || "", atletaMandanteGol)}
                  disabled={loading}
                  className="rounded-xl bg-emerald-400 px-4 py-3 text-xs font-black uppercase text-slate-950 hover:bg-emerald-300 transition"
                >
                  Gol!
                </button>
              </div>
            </div>

            {/* Registrar Cartão Mandante */}
            <div className="bg-black/20 p-4 rounded-3xl border border-white/5 space-y-3 mt-4">
              <label className="block text-xs font-black uppercase tracking-wider text-white/50 mb-1">
                Registrar Cartão para o Mandante
              </label>
              <div className="flex gap-2">
                <select
                  value={atletaMandanteCartao}
                  onChange={(e) => setAtletaMandanteCartao(e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-[#07130f] px-3 py-3 text-sm text-white outline-none"
                >
                  <option value="">Selecione o jogador</option>
                  {atletasMandante.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </select>
                <select
                  value={tipoMandanteCartao}
                  onChange={(e) => setTipoMandanteCartao(e.target.value as TipoCartao)}
                  className="rounded-xl border border-white/10 bg-[#07130f] px-2 py-3 text-sm text-white outline-none w-28"
                >
                  <option value="amarelo">🟨 Amarelo</option>
                  <option value="vermelho">🟥 Vermelho</option>
                </select>
                <button
                  onClick={() => handleRegistrarCartao(jogo.equipe_mandante_id || "", atletaMandanteCartao, tipoMandanteCartao)}
                  disabled={loading}
                  className="rounded-xl bg-amber-400 px-4 py-3 text-xs font-black uppercase text-slate-950 hover:bg-amber-300 transition"
                >
                  Cartão!
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 border-t border-white/5 pt-4">
            {/* Lista de Gols Mandante */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white/40 mb-3">Histórico de Gols</h3>
              {golsMandanteList.length === 0 ? (
                <p className="text-xs text-white/30 italic">Nenhum gol.</p>
              ) : (
                <ul className="space-y-2">
                  {golsMandanteList.map((gol) => (
                    <li key={gol.gol_id} className="bg-black/35 px-3 py-2 rounded-xl border border-white/5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold truncate">
                          ⚽ {gol.atleta_nome} <span className="text-[10px] text-emerald-300">({gol.minuto}&apos;)</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setGolEditando({
                                golId: gol.gol_id || "",
                                equipeId: gol.equipe_id || jogo.equipe_mandante_id || "",
                                atletaId: gol.atleta_id || "",
                                minuto: gol.minuto || 0,
                              })
                            }
                            disabled={loading || !gol.gol_id}
                            className="text-blue-300 hover:text-blue-200 transition p-1 shrink-0"
                            title="Editar Gol"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => handleRemoverGol(gol.gol_id || "", jogo.equipe_mandante_id || "")}
                            disabled={loading || !gol.gol_id}
                            className="text-red-400 hover:text-red-300 transition p-1 shrink-0"
                            title="Anular Gol"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {golEditando?.golId === gol.gol_id && (
                        <div className="mt-2 grid gap-2">
                          <select
                            value={golEditando!.equipeId}
                            onChange={(e) =>
                              setGolEditando({
                                ...golEditando!,
                                equipeId: e.target.value,
                                atletaId: "",
                              })
                            }
                            className="rounded-lg border border-white/10 bg-[#07130f] px-2 py-2 text-xs text-white outline-none"
                          >
                            <option value={jogo.equipe_mandante_id || ""}>{jogo.equipe_mandante_nome}</option>
                            <option value={jogo.equipe_visitante_id || ""}>{jogo.equipe_visitante_nome}</option>
                          </select>

                          <select
                            value={golEditando!.atletaId}
                            onChange={(e) =>
                              setGolEditando({ ...golEditando!, atletaId: e.target.value })
                            }
                            className="rounded-lg border border-white/10 bg-[#07130f] px-2 py-2 text-xs text-white outline-none"
                          >
                            <option value="">Atleta</option>
                            {atletasDaEquipe(golEditando!.equipeId).map((atleta) => (
                              <option key={atleta.id} value={atleta.id}>
                                {atleta.nome}
                              </option>
                            ))}
                          </select>

                          <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                            <input
                              type="number"
                              min="0"
                              value={golEditando!.minuto}
                              onChange={(e) =>
                                setGolEditando({
                                  ...golEditando!,
                                  minuto: Number(e.target.value) || 0,
                                })
                              }
                              className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-white outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleSalvarEdicaoGol}
                              className="rounded-lg bg-emerald-300 px-3 py-2 text-slate-950"
                            >
                              <Save size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setGolEditando(null)}
                              className="rounded-lg border border-white/10 px-3 py-2 text-white/60"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Lista de Cartões Mandante */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white/40 mb-3">Histórico de Cartões</h3>
              {cartoesMandanteList.length === 0 ? (
                <p className="text-xs text-white/30 italic">Nenhum cartão.</p>
              ) : (
                <ul className="space-y-2">
                  {cartoesMandanteList.map((c) => (
                    <li key={c.cartao_id} className="bg-black/35 px-3 py-2 rounded-xl border border-white/5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold truncate flex items-center gap-1">
                          {c.tipo === "amarelo" ? "🟨" : "🟥"} {c.atleta_nome} <span className="text-[10px] text-amber-300">({c.minuto}&apos;)</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setCartaoEditando({
                                cartaoId: c.cartao_id || "",
                                equipeId: c.equipe_id || jogo.equipe_mandante_id || "",
                                atletaId: c.atleta_id || "",
                                tipo: c.tipo === "vermelho" ? "vermelho" : "amarelo",
                                minuto: c.minuto || 0,
                              })
                            }
                            disabled={loading || !c.cartao_id}
                            className="text-blue-300 hover:text-blue-200 transition p-1 shrink-0"
                            title="Editar Cartão"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => handleRemoverCartao(c.cartao_id || "")}
                            disabled={loading || !c.cartao_id}
                            className="text-red-400 hover:text-red-300 transition p-1 shrink-0"
                            title="Anular Cartão"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {cartaoEditando?.cartaoId === c.cartao_id && (
                        <div className="mt-2 grid gap-2">
                          <select
                            value={cartaoEditando!.equipeId}
                            onChange={(e) =>
                              setCartaoEditando({
                                ...cartaoEditando!,
                                equipeId: e.target.value,
                                atletaId: "",
                              })
                            }
                            className="rounded-lg border border-white/10 bg-[#07130f] px-2 py-2 text-xs text-white outline-none"
                          >
                            <option value={jogo.equipe_mandante_id || ""}>{jogo.equipe_mandante_nome}</option>
                            <option value={jogo.equipe_visitante_id || ""}>{jogo.equipe_visitante_nome}</option>
                          </select>

                          <select
                            value={cartaoEditando!.atletaId}
                            onChange={(e) =>
                              setCartaoEditando({ ...cartaoEditando!, atletaId: e.target.value })
                            }
                            className="rounded-lg border border-white/10 bg-[#07130f] px-2 py-2 text-xs text-white outline-none"
                          >
                            <option value="">Atleta</option>
                            {atletasDaEquipe(cartaoEditando!.equipeId).map((atleta) => (
                              <option key={atleta.id} value={atleta.id}>
                                {atleta.nome}
                              </option>
                            ))}
                          </select>

                          <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2">
                            <select
                              value={cartaoEditando!.tipo}
                              onChange={(e) =>
                                setCartaoEditando({
                                  ...cartaoEditando!,
                                  tipo: e.target.value as TipoCartao,
                                })
                              }
                              className="rounded-lg border border-white/10 bg-[#07130f] px-2 py-2 text-xs text-white outline-none"
                            >
                              <option value="amarelo">Amarelo</option>
                              <option value="vermelho">Vermelho</option>
                            </select>
                            <input
                              type="number"
                              min="0"
                              value={cartaoEditando!.minuto}
                              onChange={(e) =>
                                setCartaoEditando({
                                  ...cartaoEditando!,
                                  minuto: Number(e.target.value) || 0,
                                })
                              }
                              className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-white outline-none"
                            />
                            <button type="button" onClick={handleSalvarEdicaoCartao} className="rounded-lg bg-emerald-300 px-3 py-2 text-slate-950">
                              <Save size={12} />
                            </button>
                            <button type="button" onClick={() => setCartaoEditando(null)} className="rounded-lg border border-white/10 px-3 py-2 text-white/60">
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* Visitante */}
        <section className="rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase text-center mb-4 text-white truncate">
              {jogo.equipe_visitante_nome}
            </h2>

            <p className="text-8xl font-black text-center text-yellow-200 font-mono my-4">
              {jogo.gols_visitante ?? 0}
            </p>

            {/* Registrar Gol Visitante */}
            <div className="bg-black/20 p-4 rounded-3xl border border-white/5 space-y-3 mt-6">
              <label className="block text-xs font-black uppercase tracking-wider text-white/50 mb-1">
                Registrar Gol para o Visitante
              </label>
              <div className="flex gap-2">
                <select
                  value={atletaVisitanteGol}
                  onChange={(e) => setAtletaVisitanteGol(e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-[#07130f] px-3 py-3 text-sm text-white outline-none"
                >
                  <option value="">Selecione o jogador</option>
                  {atletasVisitante.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleRegistrarGol(jogo.equipe_visitante_id || "", atletaVisitanteGol)}
                  disabled={loading}
                  className="rounded-xl bg-emerald-400 px-4 py-3 text-xs font-black uppercase text-slate-950 hover:bg-emerald-300 transition"
                >
                  Gol!
                </button>
              </div>
            </div>

            {/* Registrar Cartão Visitante */}
            <div className="bg-black/20 p-4 rounded-3xl border border-white/5 space-y-3 mt-4">
              <label className="block text-xs font-black uppercase tracking-wider text-white/50 mb-1">
                Registrar Cartão para o Visitante
              </label>
              <div className="flex gap-2">
                <select
                  value={atletaVisitanteCartao}
                  onChange={(e) => setAtletaVisitanteCartao(e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-[#07130f] px-3 py-3 text-sm text-white outline-none"
                >
                  <option value="">Selecione o jogador</option>
                  {atletasVisitante.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </select>
                <select
                  value={tipoVisitanteCartao}
                  onChange={(e) => setTipoVisitanteCartao(e.target.value as TipoCartao)}
                  className="rounded-xl border border-white/10 bg-[#07130f] px-2 py-3 text-sm text-white outline-none w-28"
                >
                  <option value="amarelo">🟨 Amarelo</option>
                  <option value="vermelho">🟥 Vermelho</option>
                </select>
                <button
                  onClick={() => handleRegistrarCartao(jogo.equipe_visitante_id || "", atletaVisitanteCartao, tipoVisitanteCartao)}
                  disabled={loading}
                  className="rounded-xl bg-amber-400 px-4 py-3 text-xs font-black uppercase text-slate-950 hover:bg-amber-300 transition"
                >
                  Cartão!
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 border-t border-white/5 pt-4">
            {/* Lista de Gols Visitante */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white/40 mb-3">Histórico de Gols</h3>
              {golsVisitanteList.length === 0 ? (
                <p className="text-xs text-white/30 italic">Nenhum gol.</p>
              ) : (
                <ul className="space-y-2">
                  {golsVisitanteList.map((gol) => (
                    <li key={gol.gol_id} className="bg-black/35 px-3 py-2 rounded-xl border border-white/5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold truncate">
                          ⚽ {gol.atleta_nome} <span className="text-[10px] text-emerald-300">({gol.minuto}&apos;)</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setGolEditando({
                                golId: gol.gol_id || "",
                                equipeId: gol.equipe_id || jogo.equipe_visitante_id || "",
                                atletaId: gol.atleta_id || "",
                                minuto: gol.minuto || 0,
                              })
                            }
                            disabled={loading || !gol.gol_id}
                            className="text-blue-300 hover:text-blue-200 transition p-1 shrink-0"
                            title="Editar Gol"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => handleRemoverGol(gol.gol_id || "", jogo.equipe_visitante_id || "")}
                            disabled={loading || !gol.gol_id}
                            className="text-red-400 hover:text-red-300 transition p-1 shrink-0"
                            title="Anular Gol"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {golEditando?.golId === gol.gol_id && (
                        <div className="mt-2 grid gap-2">
                          <select
                            value={golEditando!.equipeId}
                            onChange={(e) =>
                              setGolEditando({
                                ...golEditando!,
                                equipeId: e.target.value,
                                atletaId: "",
                              })
                            }
                            className="rounded-lg border border-white/10 bg-[#07130f] px-2 py-2 text-xs text-white outline-none"
                          >
                            <option value={jogo.equipe_mandante_id || ""}>{jogo.equipe_mandante_nome}</option>
                            <option value={jogo.equipe_visitante_id || ""}>{jogo.equipe_visitante_nome}</option>
                          </select>

                          <select
                            value={golEditando!.atletaId}
                            onChange={(e) =>
                              setGolEditando({ ...golEditando!, atletaId: e.target.value })
                            }
                            className="rounded-lg border border-white/10 bg-[#07130f] px-2 py-2 text-xs text-white outline-none"
                          >
                            <option value="">Atleta</option>
                            {atletasDaEquipe(golEditando!.equipeId).map((atleta) => (
                              <option key={atleta.id} value={atleta.id}>
                                {atleta.nome}
                              </option>
                            ))}
                          </select>

                          <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                            <input
                              type="number"
                              min="0"
                              value={golEditando!.minuto}
                              onChange={(e) =>
                                setGolEditando({
                                  ...golEditando!,
                                  minuto: Number(e.target.value) || 0,
                                })
                              }
                              className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-white outline-none"
                            />
                            <button type="button" onClick={handleSalvarEdicaoGol} className="rounded-lg bg-emerald-300 px-3 py-2 text-slate-950">
                              <Save size={12} />
                            </button>
                            <button type="button" onClick={() => setGolEditando(null)} className="rounded-lg border border-white/10 px-3 py-2 text-white/60">
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Lista de Cartões Visitante */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white/40 mb-3">Histórico de Cartões</h3>
              {cartoesVisitanteList.length === 0 ? (
                <p className="text-xs text-white/30 italic">Nenhum cartão.</p>
              ) : (
                <ul className="space-y-2">
                  {cartoesVisitanteList.map((c) => (
                    <li key={c.cartao_id} className="bg-black/35 px-3 py-2 rounded-xl border border-white/5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold truncate flex items-center gap-1">
                          {c.tipo === "amarelo" ? "🟨" : "🟥"} {c.atleta_nome} <span className="text-[10px] text-amber-300">({c.minuto}&apos;)</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setCartaoEditando({
                                cartaoId: c.cartao_id || "",
                                equipeId: c.equipe_id || jogo.equipe_visitante_id || "",
                                atletaId: c.atleta_id || "",
                                tipo: c.tipo === "vermelho" ? "vermelho" : "amarelo",
                                minuto: c.minuto || 0,
                              })
                            }
                            disabled={loading || !c.cartao_id}
                            className="text-blue-300 hover:text-blue-200 transition p-1 shrink-0"
                            title="Editar Cartão"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => handleRemoverCartao(c.cartao_id || "")}
                            disabled={loading || !c.cartao_id}
                            className="text-red-400 hover:text-red-300 transition p-1 shrink-0"
                            title="Anular Cartão"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {cartaoEditando?.cartaoId === c.cartao_id && (
                        <div className="mt-2 grid gap-2">
                          <select
                            value={cartaoEditando!.equipeId}
                            onChange={(e) =>
                              setCartaoEditando({
                                ...cartaoEditando!,
                                equipeId: e.target.value,
                                atletaId: "",
                              })
                            }
                            className="rounded-lg border border-white/10 bg-[#07130f] px-2 py-2 text-xs text-white outline-none"
                          >
                            <option value={jogo.equipe_mandante_id || ""}>{jogo.equipe_mandante_nome}</option>
                            <option value={jogo.equipe_visitante_id || ""}>{jogo.equipe_visitante_nome}</option>
                          </select>

                          <select
                            value={cartaoEditando!.atletaId}
                            onChange={(e) =>
                              setCartaoEditando({ ...cartaoEditando!, atletaId: e.target.value })
                            }
                            className="rounded-lg border border-white/10 bg-[#07130f] px-2 py-2 text-xs text-white outline-none"
                          >
                            <option value="">Atleta</option>
                            {atletasDaEquipe(cartaoEditando!.equipeId).map((atleta) => (
                              <option key={atleta.id} value={atleta.id}>
                                {atleta.nome}
                              </option>
                            ))}
                          </select>

                          <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2">
                            <select
                              value={cartaoEditando!.tipo}
                              onChange={(e) =>
                                setCartaoEditando({
                                  ...cartaoEditando!,
                                  tipo: e.target.value as TipoCartao,
                                })
                              }
                              className="rounded-lg border border-white/10 bg-[#07130f] px-2 py-2 text-xs text-white outline-none"
                            >
                              <option value="amarelo">Amarelo</option>
                              <option value="vermelho">Vermelho</option>
                            </select>
                            <input
                              type="number"
                              min="0"
                              value={cartaoEditando!.minuto}
                              onChange={(e) =>
                                setCartaoEditando({
                                  ...cartaoEditando!,
                                  minuto: Number(e.target.value) || 0,
                                })
                              }
                              className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-white outline-none"
                            />
                            <button type="button" onClick={handleSalvarEdicaoCartao} className="rounded-lg bg-emerald-300 px-3 py-2 text-slate-950">
                              <Save size={12} />
                            </button>
                            <button type="button" onClick={() => setCartaoEditando(null)} className="rounded-lg border border-white/10 px-3 py-2 text-white/60">
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Ação Principal: Finalizar Jogo */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleFinalizarJogo}
          disabled={loading}
          className="rounded-2xl bg-gradient-to-r from-red-500 via-amber-500 to-yellow-500 px-8 py-5 text-sm font-black uppercase text-slate-950 shadow-xl transition hover:scale-[1.01] hover:brightness-110 disabled:opacity-50 disabled:scale-100"
        >
          Finalizar Partida e Encerrar Transmissão
        </button>
      </div>
    </div>
  );
}
