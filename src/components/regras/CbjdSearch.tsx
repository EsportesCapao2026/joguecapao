"use client";

import { useState } from "react";
import { Search, Scale, AlertTriangle, Loader2 } from "lucide-react";
import { supabasePublic } from "@/lib/supabasePublic";

type CbjdArtigo = {
  id: string;
  numero_artigo: string;
  artigo_label: string;
  titulo: string | null;
  texto_completo: string;
  pena: string | null;
  palavras_chave: string[] | null;
};

export function CbjdSearch() {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<CbjdArtigo[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [pesquisou, setPesquisou] = useState(false);
  const [erro, setErro] = useState("");

  async function pesquisarCbjd(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const termoLimpo = termo.trim();

    if (!termoLimpo) {
      setResultados([]);
      setPesquisou(false);
      setErro("");
      return;
    }

    setCarregando(true);
    setErro("");
    setPesquisou(true);

    const { data, error } = await supabasePublic.rpc("buscar_cbjd", {
      termo: termoLimpo,
    });

    if (error) {
      setErro("Não foi possível consultar o CBJD neste momento.");
      setResultados([]);
      setCarregando(false);
      return;
    }

    setResultados((data || []) as CbjdArtigo[]);
    setCarregando(false);
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-2xl backdrop-blur md:p-7">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-yellow-200">
            <Scale size={14} />
            Consulta ao CBJD
          </div>

          <h2 className="text-2xl font-black text-white md:text-3xl">
            Pesquisar regras e punições
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/70">
            Pesquise por artigo ou por assunto. Exemplo: escalação irregular,
            atleta suspenso, agressão, denúncia, multa, perda de pontos ou
            cartão vermelho.
          </p>
        </div>
      </div>

      <form onSubmit={pesquisarCbjd} className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            size={20}
          />

          <input
            value={termo}
            onChange={(event) => setTermo(event.target.value)}
            placeholder="Pesquisar no CBJD..."
            className="w-full rounded-2xl border border-white/10 bg-black/30 py-4 pl-12 pr-4 text-white outline-none transition placeholder:text-white/35 focus:border-yellow-300/60"
          />
        </div>

        <button
          type="submit"
          disabled={carregando}
          className="rounded-2xl bg-gradient-to-r from-yellow-300 via-green-400 to-blue-500 px-6 py-4 font-black text-slate-950 shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {carregando ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="animate-spin" size={18} />
              Buscando
            </span>
          ) : (
            "Pesquisar"
          )}
        </button>
      </form>

      <div className="mt-5 rounded-2xl border border-blue-300/20 bg-blue-500/10 p-4 text-sm leading-relaxed text-blue-50">
        <strong>Regra de aplicação:</strong> o regulamento próprio do campeonato
        prevalece. Na ausência de previsão específica, o CBJD poderá ser usado
        como regra subsidiária.
      </div>

      {erro && (
        <div className="mt-5 rounded-2xl border border-red-300/30 bg-red-500/10 p-4 text-sm text-red-100">
          {erro}
        </div>
      )}

      {carregando && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-white/70">
          Consultando artigos...
        </div>
      )}

      {!carregando && pesquisou && resultados.length === 0 && !erro && (
        <div className="mt-6 flex gap-3 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-yellow-50">
          <AlertTriangle className="mt-0.5 shrink-0" size={20} />
          <div>
            <strong>Nenhum artigo encontrado.</strong>
            <p className="mt-1 text-sm text-yellow-50/75">
              Tente pesquisar por outro termo, como “irregular”, “pontos”,
              “agressão”, “suspensão” ou “multa”.
            </p>
          </div>
        </div>
      )}

      {!carregando && resultados.length > 0 && (
        <div className="mt-6 space-y-4">
          <p className="text-sm font-bold text-white/60">
            {resultados.length} resultado(s) encontrado(s)
          </p>

          {resultados.map((artigo) => (
            <article
              key={artigo.id}
              className="rounded-3xl border border-white/10 bg-slate-950/65 p-5 shadow-xl"
            >
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <span className="inline-flex rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-slate-950">
                    {artigo.artigo_label}
                  </span>

                  <h3 className="mt-3 text-xl font-black text-white">
                    {artigo.titulo || "Artigo do CBJD"}
                  </h3>
                </div>
              </div>

              {artigo.pena && (
                <div className="mb-4 rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm leading-relaxed text-red-50">
                  <strong>PENA:</strong> {artigo.pena}
                </div>
              )}

              <p className="whitespace-pre-line text-sm leading-7 text-white/78">
                {artigo.texto_completo}
              </p>

              {artigo.palavras_chave && artigo.palavras_chave.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {artigo.palavras_chave.map((palavra) => (
                    <span
                      key={palavra}
                      className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white/60"
                    >
                      {palavra}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
