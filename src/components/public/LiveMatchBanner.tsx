"use client";

import { useState, useEffect, useMemo } from "react";
import { supabasePublic } from "@/lib/supabasePublic";
import { parseJogoObservacoes } from "@/lib/tempoReal";

export type JogoAoVivo = {
  id: string;
  rodada: string | null;
  categoria: string | null;
  serie: string | null;
  equipe_mandante_id: string | null;
  equipe_visitante_id: string | null;
  equipe_mandante_nome: string | null;
  equipe_visitante_nome: string | null;
  data_jogo: string | null;
  horario: string | null;
  local: string | null;
  status: string | null;
  gols_mandante: number | null;
  gols_visitante: number | null;
  observacoes: string | null;
};

interface LiveMatchBannerProps {
  jogosIniciais: JogoAoVivo[];
}

export default function LiveMatchBanner({ jogosIniciais }: LiveMatchBannerProps) {
  const [jogos, setJogos] = useState<JogoAoVivo[]>(jogosIniciais);

  // Escutar atualizações da tabela jogos via Supabase Realtime (se ativado no banco)
  useEffect(() => {
    const channel = supabasePublic
      .channel("jogos-ao-vivo-public")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "jogos" },
        (payload) => {
          const jogoAtualizado = payload.new as JogoAoVivo;

          setJogos((prevJogos) => {
            if (jogoAtualizado.status === "em_andamento") {
              const index = prevJogos.findIndex((j) => j.id === jogoAtualizado.id);
              if (index >= 0) {
                const novos = [...prevJogos];
                novos[index] = { ...novos[index], ...jogoAtualizado };
                return novos;
              } else {
                return [...prevJogos, jogoAtualizado];
              }
            } else {
              return prevJogos.filter((j) => j.id !== jogoAtualizado.id);
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabasePublic.removeChannel(channel);
    };
  }, []);

  if (jogos.length === 0) return null;

  return (
    <div className="mb-6 rounded-[36px] border-2 border-red-500 bg-red-950/20 p-6 md:p-8 shadow-2xl shadow-red-500/10 backdrop-blur-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-red-500/10 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3.5 py-1.5 text-xs font-black uppercase text-white animate-pulse">
            <span className="h-2 w-2 rounded-full bg-white animate-ping" />
            AO VIVO AGORA
          </span>
          <span className="text-sm font-bold text-red-200">
            Acompanhe a partida em tempo real
          </span>
        </div>
      </div>

      <div className="space-y-8 divide-y divide-red-500/10">
        {jogos.map((jogo, i) => (
          <div key={jogo.id} className={i > 0 ? "pt-8" : ""}>
            <div className="flex justify-center mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-red-300 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
                {jogo.categoria || "Geral"} {jogo.serie ? `• ${jogo.serie}` : ""}
              </span>
            </div>
            <LiveMatchCard
              key={[
                jogo.id,
                jogo.status,
                jogo.gols_mandante,
                jogo.gols_visitante,
                jogo.observacoes,
              ].join(":")}
              jogo={jogo}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveMatchCard({ jogo }: { jogo: JogoAoVivo }) {
  const observacoesIniciais = useMemo(
    () => parseJogoObservacoes(jogo.observacoes),
    [jogo.observacoes]
  );
  const [estado, setEstado] = useState(() => ({
    jogo,
    minuto: observacoesIniciais.tempo_real?.minuto ?? 0,
    segundo: observacoesIniciais.tempo_real?.segundo ?? 0,
  }));
  const jogoState = estado.jogo;

  // Polling de fallback de 5 segundos para garantir que gols, tempo e pênaltis atualizem mesmo sem Realtime ativado no Supabase
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabasePublic
          .from("jogos")
          .select("id, status, gols_mandante, gols_visitante, observacoes")
          .eq("id", jogo.id)
          .single();

        if (data && !error) {
          setEstado((prevState) => {
            const mudouGols =
              prevState.jogo.gols_mandante !== data.gols_mandante ||
              prevState.jogo.gols_visitante !== data.gols_visitante;
            const mudouStatus = prevState.jogo.status !== data.status;
            const mudouObs = prevState.jogo.observacoes !== data.observacoes;

            if (mudouGols || mudouStatus || mudouObs) {
              const observacoesAtualizadas = parseJogoObservacoes(data.observacoes);

              return {
                jogo: { ...prevState.jogo, ...data },
                minuto: observacoesAtualizadas.tempo_real?.minuto ?? 0,
                segundo: observacoesAtualizadas.tempo_real?.segundo ?? 0,
              };
            }

            return prevState;
          });
        }
      } catch (err) {
        console.error("Erro no polling de jogo ao vivo:", err);
      }
    }, 5000); // Polling rápido a cada 5 segundos

    return () => clearInterval(interval);
  }, [jogo.id]);

  const jsonObs = useMemo(
    () => parseJogoObservacoes(jogoState.observacoes),
    [jogoState.observacoes]
  );

  const tempoReal = jsonObs.tempo_real || {};
  const golsDetalhe = jsonObs.gols_detalhe || [];
  const cartoesDetalhe = jsonObs.cartoes_detalhe || [];
  const penaltis = jsonObs.penaltis || { mandante_cobrancas: [], visitante_cobrancas: [] };

  const minuto = estado.minuto;
  const segundo = estado.segundo;
  const rodando = tempoReal.rodando ?? false;
  const duracaoTempo = tempoReal.duracao_tempo ?? 40;
  const acrescimo = tempoReal.acrescimo ?? 0;
  const periodoCronometro = tempoReal.periodo ?? "1T";
  const isPenaltis = tempoReal.penaltis_ativo || periodoCronometro === "PEN";

  const penMandante = (penaltis.mandante_cobrancas || []).filter(Boolean).length;
  const penVisitante = (penaltis.visitante_cobrancas || []).filter(Boolean).length;

  // Rodar os segundos localmente no navegador do torcedor
  useEffect(() => {
    if (!rodando) return;

    const interval = setInterval(() => {
      setEstado((prevState) => {
        if (prevState.segundo >= 59) {
          const novoMinuto = prevState.minuto + 1;
          const tempoMax = duracaoTempo + acrescimo;

          if (novoMinuto >= tempoMax) {
            return {
              ...prevState,
              segundo: 0,
            };
          }

          return {
            ...prevState,
            minuto: novoMinuto,
            segundo: 0,
          };
        }

        return {
          ...prevState,
          segundo: prevState.segundo + 1,
        };
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [rodando, duracaoTempo, acrescimo]);

  let timeString = `${minuto}:${segundo < 10 ? "0" + segundo : segundo}`;
  if (acrescimo > 0) {
    timeString += ` +${acrescimo}'`;
  }

  let periodoLabel = periodoCronometro;
  if (periodoCronometro === "1T") periodoLabel = "1º Tempo";
  if (periodoCronometro === "2T") periodoLabel = "2º Tempo";
  if (periodoCronometro === "INT") periodoLabel = "Intervalo";
  if (periodoCronometro === "1T-PR") periodoLabel = "Prorrog. (1ºT)";
  if (periodoCronometro === "INT-PR") periodoLabel = "Prorrog. (Intervalo)";
  if (periodoCronometro === "2T-PR") periodoLabel = "Prorrog. (2ºT)";
  if (periodoCronometro === "PEN") periodoLabel = "Penalidades";

  const golsMandante = golsDetalhe.filter((g) => g.equipe_id === jogoState.equipe_mandante_id);
  const golsVisitante = golsDetalhe.filter((g) => g.equipe_id === jogoState.equipe_visitante_id);
  const cartoesMandante = cartoesDetalhe.filter((c) => c.equipe_id === jogoState.equipe_mandante_id);
  const cartoesVisitante = cartoesDetalhe.filter((c) => c.equipe_id === jogoState.equipe_visitante_id);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
        {/* Mandante */}
        <div className="text-right text-2xl font-black md:text-4xl uppercase text-white truncate">
          {jogoState.equipe_mandante_nome}
        </div>

        {/* Placar e Cronômetro */}
        <div className="rounded-[2rem] border border-red-500/30 bg-black/60 px-8 py-5 text-center flex flex-col items-center justify-center min-w-[160px] shadow-lg shadow-black/40">
          <p className="text-5xl font-black text-yellow-200 font-mono tracking-widest leading-none">
            {jogoState.gols_mandante ?? 0} - {jogoState.gols_visitante ?? 0}
          </p>
          <span className="mt-3.5 inline-flex items-center gap-1.5 rounded-full border border-red-500/35 bg-red-500/10 px-4 py-2 text-sm font-black font-mono text-red-200 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            {timeString} ({periodoLabel})
          </span>
          {isPenaltis && (
            <p className="text-xs font-black text-red-400 uppercase tracking-wider mt-2.5 animate-pulse">
              Pênaltis: {penMandante} x {penVisitante}
            </p>
          )}
        </div>

        {/* Visitante */}
        <div className="text-left text-2xl font-black md:text-4xl uppercase text-white truncate">
          {jogoState.equipe_visitante_nome}
        </div>
      </div>

      {/* Histórico de Acontecimentos do Jogo */}
      {(golsDetalhe.length > 0 || cartoesDetalhe.length > 0) && (
        <div className="rounded-3xl border border-red-500/10 bg-red-950/10 p-5 shadow-inner max-w-2xl mx-auto grid grid-cols-2 gap-6 divide-x divide-red-500/10">
          {/* Lado Mandante */}
          <div className="space-y-4">
            <p className="text-xxs font-black uppercase tracking-wider text-red-300/40 text-center">Gols e Cartões Mandante</p>
            
            {/* Gols */}
            <div className="space-y-2">
              {golsMandante.map((gol, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-white/80">
                  <span className="text-yellow-300 text-xxs font-black bg-yellow-400/10 border border-yellow-300/20 px-2 py-0.5 rounded-md">
                    {gol.minuto}&apos;
                  </span>
                  <span>⚽</span>
                  <strong className="uppercase font-black text-white/90 truncate">{gol.atleta_nome}</strong>
                </div>
              ))}
            </div>

            {/* Cartões */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              {cartoesMandante.map((c, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-white/80">
                  <span className="text-yellow-300 text-xxs font-black bg-yellow-400/10 border border-yellow-300/20 px-2 py-0.5 rounded-md">
                    {c.minuto}&apos;
                  </span>
                  <span>{c.tipo === "amarelo" ? "🟨" : "🟥"}</span>
                  <strong className="uppercase font-black text-white/90 truncate">{c.atleta_nome}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Lado Visitante */}
          <div className="space-y-4 pl-6">
            <p className="text-xxs font-black uppercase tracking-wider text-red-300/40 text-center">Gols e Cartões Visitante</p>
            
            {/* Gols */}
            <div className="space-y-2">
              {golsVisitante.map((gol, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-white/80">
                  <span className="text-yellow-300 text-xxs font-black bg-yellow-400/10 border border-yellow-300/20 px-2 py-0.5 rounded-md">
                    {gol.minuto}&apos;
                  </span>
                  <span>⚽</span>
                  <strong className="uppercase font-black text-white/90 truncate">{gol.atleta_nome}</strong>
                </div>
              ))}
            </div>

            {/* Cartões */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              {cartoesVisitante.map((c, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-white/80">
                  <span className="text-yellow-300 text-xxs font-black bg-yellow-400/10 border border-yellow-300/20 px-2 py-0.5 rounded-md">
                    {c.minuto}&apos;
                  </span>
                  <span>{c.tipo === "amarelo" ? "🟨" : "🟥"}</span>
                  <strong className="uppercase font-black text-white/90 truncate">{c.atleta_nome}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
