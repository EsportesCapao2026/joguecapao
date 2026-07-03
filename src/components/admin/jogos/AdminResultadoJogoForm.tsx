"use client";

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { atualizarResultadoJogo } from "@/app/admin/jogos/actions";

type JogoResultado = {
  id: string;
  campeonato_id: string | null;
  categoria: string | null;
  serie: string | null;
  equipe_mandante_id: string | null;
  equipe_visitante_id: string | null;
  equipe_mandante_nome: string | null;
  equipe_visitante_nome: string | null;
  gols_mandante: number | null;
  gols_visitante: number | null;
};

type AtletaJogo = {
  id: string;
  inscricao_id: string | null;
  nome: string;
  numero_camisa: string | null;
};

type Props = {
  jogo: JogoResultado;
  atletasMandante: AtletaJogo[];
  atletasVisitante: AtletaJogo[];
};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-yellow-300/60 focus:ring-2 focus:ring-yellow-300/10";

const labelClass =
  "mb-2 block text-xs font-black uppercase tracking-[0.08em] text-white/65";

function numeroDeGols(valor: string) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0) return 0;
  return Math.floor(numero);
}

function slots(total: number) {
  return Array.from({ length: total }, (_, index) => index);
}

function AtletaOption({ atleta }: { atleta: AtletaJogo }) {
  return (
    <option value={atleta.id}>
      {atleta.nome}
      {atleta.numero_camisa ? ` - Nº ${atleta.numero_camisa}` : ""}
    </option>
  );
}

export function AdminResultadoJogoForm({
  jogo,
  atletasMandante,
  atletasVisitante,
}: Props) {
  const [golsMandante, setGolsMandante] = useState(
    jogo.gols_mandante === null ? "" : String(jogo.gols_mandante)
  );
  const [golsVisitante, setGolsVisitante] = useState(
    jogo.gols_visitante === null ? "" : String(jogo.gols_visitante)
  );

  const totalMandante = useMemo(
    () => numeroDeGols(golsMandante),
    [golsMandante]
  );
  const totalVisitante = useMemo(
    () => numeroDeGols(golsVisitante),
    [golsVisitante]
  );

  return (
    <form action={atualizarResultadoJogo} className="space-y-4">
      <input type="hidden" name="jogo_id" value={jogo.id} />
      <input type="hidden" name="campeonato_id" value={jogo.campeonato_id || ""} />
      <input type="hidden" name="sincronizar_artilheiros" value="true" />
      <input
        type="hidden"
        name="equipe_mandante_id"
        value={jogo.equipe_mandante_id || ""}
      />
      <input
        type="hidden"
        name="equipe_visitante_id"
        value={jogo.equipe_visitante_id || ""}
      />
      <input
        type="hidden"
        name="equipe_mandante_nome"
        value={jogo.equipe_mandante_nome || ""}
      />
      <input
        type="hidden"
        name="equipe_visitante_nome"
        value={jogo.equipe_visitante_nome || ""}
      />
      <input type="hidden" name="categoria_nome" value={jogo.categoria || ""} />
      <input type="hidden" name="serie_nome" value={jogo.serie || ""} />

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <label className="block">
          <span className={labelClass}>Gols mandante</span>
          <input
            name="gols_mandante"
            type="number"
            min="0"
            placeholder="Gols mandante"
            value={golsMandante}
            onChange={(event) => setGolsMandante(event.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Gols visitante</span>
          <input
            name="gols_visitante"
            type="number"
            min="0"
            placeholder="Gols visitante"
            value={golsVisitante}
            onChange={(event) => setGolsVisitante(event.target.value)}
            className={inputClass}
          />
        </label>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-300 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-950 md:self-end"
        >
          <CheckCircle2 size={16} />
          Salvar
        </button>
      </div>

      {(totalMandante > 0 || totalVisitante > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {totalMandante > 0 && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-white/55">
                Autores dos gols - {jogo.equipe_mandante_nome || "Mandante"}
              </p>

              <div className="space-y-2">
                {slots(totalMandante).map((index) => (
                  <select
                    key={`mandante-${index}`}
                    name="gols_mandante_atleta_id"
                    required
                    className={inputClass}
                  >
                    <option value="">Gol {index + 1}: selecione o atleta</option>
                    {atletasMandante.map((atleta) => (
                      <AtletaOption key={atleta.id} atleta={atleta} />
                    ))}
                  </select>
                ))}
              </div>
            </div>
          )}

          {totalVisitante > 0 && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-white/55">
                Autores dos gols - {jogo.equipe_visitante_nome || "Visitante"}
              </p>

              <div className="space-y-2">
                {slots(totalVisitante).map((index) => (
                  <select
                    key={`visitante-${index}`}
                    name="gols_visitante_atleta_id"
                    required
                    className={inputClass}
                  >
                    <option value="">Gol {index + 1}: selecione o atleta</option>
                    {atletasVisitante.map((atleta) => (
                      <AtletaOption key={atleta.id} atleta={atleta} />
                    ))}
                  </select>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
