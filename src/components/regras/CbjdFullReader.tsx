"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Loader2, Search } from "lucide-react";
import { supabasePublic } from "@/lib/supabasePublic";

type CbjdArtigo = {
  id: string;
  artigo_label: string;
  titulo: string | null;
  texto_completo: string;
  pena: string | null;
  palavras_chave: string[] | null;
  ordem: number | null;
};

export function CbjdFullReader() {
  const [artigos, setArtigos] = useState<CbjdArtigo[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarArtigos() {
      const { data } = await supabasePublic
        .from("cbjd_artigos")
        .select("id, artigo_label, titulo, texto_completo, pena, palavras_chave, ordem")
        .eq("ativo", true)
        .order("ordem", { ascending: true });

      setArtigos((data || []) as CbjdArtigo[]);
      setCarregando(false);
    }

    carregarArtigos();
  }, []);

  const artigosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return artigos;

    return artigos.filter((artigo) => {
      const texto = [
        artigo.artigo_label,
        artigo.titulo,
        artigo.texto_completo,
        artigo.pena,
        artigo.palavras_chave?.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });
  }, [artigos, busca]);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-2xl backdrop-blur md:p-7">
      <div className="mb-5">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-yellow-200">
          <BookOpen size={14} />
          Leitura completa
        </div>

        <h2 className="text-2xl font-black text-white md:text-3xl">
          Todos os artigos do CBJD
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/70">
          Leia os artigos em sequência. A busca abaixo serve apenas para
          localizar rapidamente algum assunto específico dentro do texto.
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
          placeholder="Filtrar dentro da leitura completa..."
          className="w-full rounded-2xl border border-white/10 bg-black/30 py-4 pl-12 pr-4 text-white outline-none transition placeholder:text-white/35 focus:border-yellow-300/60"
        />
      </div>

      {carregando && (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-white/70">
          <Loader2 className="animate-spin" size={18} />
          Carregando artigos...
        </div>
      )}

      {!carregando && artigosFiltrados.length === 0 && (
        <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-5 text-yellow-50">
          Nenhum artigo encontrado para essa busca.
        </div>
      )}

      {!carregando && artigosFiltrados.length > 0 && (
        <div className="space-y-5">
          <p className="text-sm font-bold text-white/60">
            {artigosFiltrados.length} artigo(s) visível(is)
          </p>

          {artigosFiltrados.map((artigo) => (
            <article
              key={artigo.id}
              className="rounded-3xl border border-white/10 bg-slate-950/65 p-5 shadow-xl"
            >
              <span className="inline-flex rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-slate-950">
                {artigo.artigo_label}
              </span>

              <h3 className="mt-3 text-xl font-black text-white">
                {artigo.titulo || "Artigo do CBJD"}
              </h3>

              {artigo.pena && (
                <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm leading-relaxed text-red-50">
                  <strong>PENA:</strong> {artigo.pena}
                </div>
              )}

              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-white/78">
                {artigo.texto_completo}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
