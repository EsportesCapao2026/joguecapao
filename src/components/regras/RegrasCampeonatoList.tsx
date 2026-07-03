"use client";

import { useEffect, useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { supabasePublic } from "@/lib/supabasePublic";

type RegraCampeonato = {
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

export function RegrasCampeonatoList() {
  const [regras, setRegras] = useState<RegraCampeonato[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarRegras() {
      const { data } = await supabasePublic
        .from("regras_campeonatos")
        .select("id, campeonato_nome, titulo, descricao, artigo_referencia, origem")
        .eq("ativo", true)
        .order("created_at", { ascending: false });

      setRegras((data || []) as RegraCampeonato[]);
      setCarregando(false);
    }

    carregarRegras();
  }, []);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-2xl backdrop-blur md:p-7">
      <div className="mb-5">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-green-300/30 bg-green-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-green-200">
          <BookOpen size={14} />
          Regulamentos próprios
        </div>

        <h2 className="text-2xl font-black text-white md:text-3xl">
          Regras dos campeonatos
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/70">
          Aqui aparecem as regras próprias cadastradas para cada campeonato.
          Quando houver regra própria, ela prevalece sobre o CBJD.
        </p>
      </div>

      {carregando && (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-white/70">
          <Loader2 className="animate-spin" size={18} />
          Carregando regras...
        </div>
      )}

      {!carregando && regras.length === 0 && (
        <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-sm leading-relaxed text-yellow-50">
          Nenhuma regra própria de campeonato foi cadastrada ainda. Enquanto
          isso, a consulta ao CBJD continua disponível como referência
          subsidiária.
        </div>
      )}

      {!carregando && regras.length > 0 && (
        <div className="space-y-4">
          {regras.map((regra) => (
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

              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-white/75">
                {regra.descricao}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
