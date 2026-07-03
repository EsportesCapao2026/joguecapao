"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Loader2, Search } from "lucide-react";
import { supabasePublic } from "@/lib/supabasePublic";

type Regra = {
  id: string;
  campeonato_nome: string | null;
  titulo: string;
  descricao: string;
  artigo_referencia: string | null;
  origem: string | null;
};

function origemLabel(origem: string | null) {
  if (origem === "regulamento_municipal") return "Regulamento municipal";
  if (origem === "cbjd") return "CBJD";
  if (origem === "decisao_administrativa") return "Decisão administrativa";
  if (origem === "outro_documento") return "Outro documento";
  return "Regra";
}

export function RegrasMunicipaisFullReader() {
  const [regras, setRegras] = useState<Regra[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarRegras() {
      const { data } = await supabasePublic
        .from("regras_campeonatos")
        .select("id, campeonato_nome, titulo, descricao, artigo_referencia, origem")
        .eq("ativo", true)
        .order("created_at", { ascending: false });

      setRegras((data || []) as Regra[]);
      setCarregando(false);
    }

    carregarRegras();
  }, []);

  const regrasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return regras;

    return regras.filter((regra) => {
      const texto = [
        regra.campeonato_nome,
        regra.titulo,
        regra.descricao,
        regra.artigo_referencia,
        regra.origem,
      ]
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });
  }, [regras, busca]);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-2xl backdrop-blur md:p-7">
      <div className="mb-5">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-green-300/30 bg-green-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-green-200">
          <BookOpen size={14} />
          Leitura completa
        </div>

        <h2 className="text-2xl font-black text-white md:text-3xl">
          Todas as regras municipais
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/70">
          Leia as regras próprias cadastradas para os campeonatos. A busca
          abaixo serve para localizar rapidamente um assunto específico.
        </p>
      </div>

      <div className="relative mb-6">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
          size={20}
        />

        <input
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder="Filtrar regras municipais..."
          className="w-full rounded-2xl border border-white/10 bg-black/30 py-4 pl-12 pr-4 text-white outline-none transition placeholder:text-white/35 focus:border-green-300/60"
        />
      </div>

      {carregando && (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-white/70">
          <Loader2 className="animate-spin" size={18} />
          Carregando regras...
        </div>
      )}

      {!carregando && regrasFiltradas.length === 0 && (
        <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-yellow-50">
          Nenhuma regra municipal encontrada.
        </div>
      )}

      {!carregando && regrasFiltradas.length > 0 && (
        <div className="space-y-5">
          <p className="text-sm font-bold text-white/60">
            {regrasFiltradas.length} regra(s) visível(is)
          </p>

          {regrasFiltradas.map((regra) => (
            <article
              key={regra.id}
              className="rounded-3xl border border-white/10 bg-slate-950/65 p-5 shadow-xl"
            >
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-green-300 px-3 py-1 text-xs font-black text-slate-950">
                  {origemLabel(regra.origem)}
                </span>

                {regra.campeonato_nome && (
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white/70">
                    {regra.campeonato_nome}
                  </span>
                )}

                {regra.artigo_referencia && (
                  <span className="rounded-full border border-blue-300/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-100">
                    {regra.artigo_referencia}
                  </span>
                )}
              </div>

              <h3 className="text-xl font-black text-white">{regra.titulo}</h3>

              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-white/78">
                {regra.descricao}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
