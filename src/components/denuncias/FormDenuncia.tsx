"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { enviarDenuncia } from "@/app/denuncias/actions";
import { getErrorMessage } from "@/lib/tempoReal";
import { FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type Campeonato = {
  id: string;
  nome: string;
};

type Jogo = {
  id: string;
  campeonato_id: string | null;
  categoria: string | null;
  serie: string | null;
  rodada: string | null;
  equipe_mandante_nome: string | null;
  equipe_visitante_nome: string | null;
};

type Equipe = {
  id: string;
  campeonato_id: string | null;
  categoria: string | null;
  serie: string | null;
  nome: string;
};

type Atleta = {
  id: string;
  equipe_id: string | null;
  nome: string;
};

interface FormDenunciaProps {
  campeonatos: Campeonato[];
  jogos: Jogo[];
  equipes: Equipe[];
  atletas: Atleta[];
}

export default function FormDenuncia({
  campeonatos,
  jogos,
  equipes,
  atletas,
}: FormDenunciaProps) {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [equipeReclamante, setEquipeReclamante] = useState("");
  const [campeonatoId, setCampeonatoId] = useState("");
  const [categoria, setCategoria] = useState("");
  const [serie, setSerie] = useState("");
  const [equipeDenunciadaId, setEquipeDenunciadaId] = useState("");
  const [jogoId, setJogoId] = useState("");
  const [alvoTipo, setAlvoTipo] = useState("geral");
  const [atletaDenunciadoId, setAtletaDenunciadoId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [anexo, setAnexo] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [protocoloGerado, setProtocoloGerado] = useState("");

  // 1. Filtrar categorias do campeonato selecionado
  const categoriasDisponiveis = useMemo(() => {
    if (!campeonatoId) return [];
    const cats = new Set<string>();
    equipes
      .filter((e) => e.campeonato_id === campeonatoId && e.categoria)
      .forEach((e) => cats.add(e.categoria!));
    jogos
      .filter((j) => j.campeonato_id === campeonatoId && j.categoria)
      .forEach((j) => cats.add(j.categoria!));
    return Array.from(cats);
  }, [campeonatoId, equipes, jogos]);

  // 2. Filtrar séries do campeonato e categoria selecionados
  const seriesDisponiveis = useMemo(() => {
    if (!campeonatoId || !categoria) return [];
    const sers = new Set<string>();
    equipes
      .filter(
        (e) =>
          e.campeonato_id === campeonatoId &&
          e.categoria === categoria &&
          e.serie
      )
      .forEach((e) => sers.add(e.serie!));
    jogos
      .filter(
        (j) =>
          j.campeonato_id === campeonatoId &&
          j.categoria === categoria &&
          j.serie
      )
      .forEach((j) => sers.add(j.serie!));
    return Array.from(sers);
  }, [campeonatoId, categoria, equipes, jogos]);

  // 3. Filtrar equipes denunciadas com base nos filtros
  const equipesFiltradas = useMemo(() => {
    if (!campeonatoId) return [];
    return equipes.filter(
      (e) =>
        e.campeonato_id === campeonatoId &&
        (!categoria || e.categoria === categoria) &&
        (!serie || e.serie === serie)
    );
  }, [campeonatoId, categoria, serie, equipes]);

  // 4. Filtrar jogos (partidas) com base nos filtros
  const jogosFiltrados = useMemo(() => {
    if (!campeonatoId) return [];
    return jogos.filter(
      (j) =>
        j.campeonato_id === campeonatoId &&
        (!categoria || j.categoria === categoria) &&
        (!serie || j.serie === serie)
    );
  }, [campeonatoId, categoria, serie, jogos]);

  // 5. Filtrar atletas da equipe denunciada selecionada
  const atletasFiltrados = useMemo(() => {
    if (!equipeDenunciadaId) return [];
    return atletas.filter((a) => a.equipe_id === equipeDenunciadaId);
  }, [equipeDenunciadaId, atletas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !whatsapp || !campeonatoId || !descricao) {
      setErrorMsg("Preencha todos os campos obrigatórios (*).");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const data = new FormData();
      data.append("nome", nome);
      data.append("whatsapp", whatsapp);
      data.append("equipe_reclamante", equipeReclamante);
      data.append("campeonato_id", campeonatoId);
      data.append("categoria", categoria);
      data.append("serie", serie);
      data.append("equipe_denunciada_id", equipeDenunciadaId);
      
      const equipeDenunciadaNome = equipes.find(e => e.id === equipeDenunciadaId)?.nome || "";
      data.append("equipe_denunciada_nome", equipeDenunciadaNome);

      data.append("jogo_id", jogoId);
      const jogo = jogos.find(j => j.id === jogoId);
      const partidaRodada = jogo ? `${jogo.rodada || "Rodada"} - ${jogo.equipe_mandante_nome} x ${jogo.equipe_visitante_nome}` : "";
      data.append("partida_rodada", partidaRodada);

      data.append("alvo_tipo", alvoTipo);
      data.append("atleta_denunciado_id", atletaDenunciadoId);
      const atletaNome = atletas.find(a => a.id === atletaDenunciadoId)?.nome || "";
      data.append("atleta_denunciado_nome", atletaNome);
      data.append("descricao", descricao);

      if (anexo) {
        data.append("anexo", anexo);
      }

      const res = await enviarDenuncia(data);

      if (res.sucesso && res.protocolo) {
        setProtocoloGerado(res.protocolo);
      } else {
        setErrorMsg(res.erro || "Erro inexplicado ao registrar a denúncia.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(getErrorMessage(err, "Ocorreu um erro ao enviar a denúncia."));
    } finally {
      setIsLoading(false);
    }
  };

  const labelClass = "mb-2 block text-sm font-black text-white/70";
  const inputClass =
    "w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-4 font-bold text-white outline-none transition placeholder:text-white/28 focus:border-emerald-300";
  const selectClass =
    "w-full rounded-2xl border border-white/12 bg-[#081510] px-4 py-4 font-bold text-white outline-none transition focus:border-emerald-300";

  if (protocoloGerado) {
    return (
      <div className="rounded-[36px] border border-green-300/20 bg-green-950/20 p-6 text-center md:p-8">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-500/10 text-green-300 mb-6">
          <CheckCircle2 size={36} />
        </div>
        <h2 className="text-3xl font-black text-white">Denúncia Enviada!</h2>
        <p className="mt-4 text-white/70 leading-7">
          Sua denúncia foi registrada com sucesso e encaminhada à comissão organizadora para análise. Guarde o número do seu protocolo para consultas futuras:
        </p>
        <div className="my-6 inline-block rounded-2xl border border-white/10 bg-black/40 px-6 py-4 text-2xl font-black tracking-widest text-yellow-200">
          {protocoloGerado}
        </div>
        <p className="text-xs text-white/45">
          O prazo regulamentar para análise inicial é de até 48 horas úteis.
        </p>
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => {
              setProtocoloGerado("");
              setNome("");
              setWhatsapp("");
              setEquipeReclamante("");
              setCampeonatoId("");
              setCategoria("");
              setSerie("");
              setEquipeDenunciadaId("");
              setJogoId("");
              setAlvoTipo("geral");
              setAtletaDenunciadoId("");
              setDescricao("");
              setAnexo(null);
            }}
            className="rounded-2xl bg-gradient-to-r from-[#ffd400] via-[#67dd7a] to-[#00bde7] px-6 py-3 font-black text-black transition hover:scale-[1.02]"
          >
            Registrar Nova Denúncia
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="rounded-2xl border border-red-300/25 bg-red-400/10 p-4 text-sm font-black text-red-100 flex items-center gap-2">
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Seu Nome *</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            placeholder="Nome completo do reclamante"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Seu WhatsApp *</span>
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            required
            placeholder="(51) 99999-9999"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Clube que você representa</span>
          <input
            value={equipeReclamante}
            onChange={(e) => setEquipeReclamante(e.target.value)}
            placeholder="Ex.: Unidos FC (se aplicável)"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Campeonato *</span>
          <select
            value={campeonatoId}
            onChange={(e) => {
              setCampeonatoId(e.target.value);
              setCategoria("");
              setSerie("");
              setEquipeDenunciadaId("");
              setJogoId("");
              setAtletaDenunciadoId("");
            }}
            required
            className={selectClass}
          >
            <option value="">Selecione o campeonato</option>
            {campeonatos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>

        {campeonatoId && categoriasDisponiveis.length > 0 && (
          <label className="block">
            <span className={labelClass}>Categoria</span>
            <select
              value={categoria}
              onChange={(e) => {
                setCategoria(e.target.value);
                setSerie("");
                setEquipeDenunciadaId("");
                setJogoId("");
                setAtletaDenunciadoId("");
              }}
              className={selectClass}
            >
              <option value="">Selecione a categoria</option>
              {categoriasDisponiveis.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>
        )}

        {campeonatoId && categoria && seriesDisponiveis.length > 0 && (
          <label className="block">
            <span className={labelClass}>Série</span>
            <select
              value={serie}
              onChange={(e) => {
                setSerie(e.target.value);
                setEquipeDenunciadaId("");
                setJogoId("");
                setAtletaDenunciadoId("");
              }}
              className={selectClass}
            >
              <option value="">Selecione a série</option>
              {seriesDisponiveis.map((ser) => (
                <option key={ser} value={ser}>
                  {ser}
                </option>
              ))}
            </select>
          </label>
        )}

        {campeonatoId && (
          <label className="block">
            <span className={labelClass}>Equipe Denunciada</span>
            <select
              value={equipeDenunciadaId}
              onChange={(e) => {
                setEquipeDenunciadaId(e.target.value);
                setAtletaDenunciadoId("");
              }}
              className={selectClass}
            >
              <option value="">Selecione a equipe</option>
              {equipesFiltradas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </select>
          </label>
        )}

        {campeonatoId && (
          <label className="block">
            <span className={labelClass}>Partida / Rodada</span>
            <select
              value={jogoId}
              onChange={(e) => setJogoId(e.target.value)}
              className={selectClass}
            >
              <option value="">Selecione a partida</option>
              {jogosFiltrados.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.rodada || "Jogo"} — {j.equipe_mandante_nome} x {j.equipe_visitante_nome}
                </option>
              ))}
            </select>
          </label>
        )}

        {campeonatoId && (
          <label className="block">
            <span className={labelClass}>Alvo da Denúncia</span>
            <select
              value={alvoTipo}
              onChange={(e) => {
                setAlvoTipo(e.target.value);
                setAtletaDenunciadoId("");
              }}
              className={selectClass}
            >
              <option value="geral">Denúncia Geral contra Clube / Torcida</option>
              <option value="atleta">Atleta Específico</option>
              <option value="comissao">Membro de Comissão Técnica</option>
            </select>
          </label>
        )}

        {alvoTipo !== "geral" && equipeDenunciadaId && (
          <label className="block">
            <span className={labelClass}>
              {alvoTipo === "atleta" ? "Atleta Envolvido" : "Membro da Comissão"}
            </span>
            <select
              value={atletaDenunciadoId}
              onChange={(e) => setAtletaDenunciadoId(e.target.value)}
              className={selectClass}
            >
              <option value="">Selecione o envolvido</option>
              {atletasFiltrados.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <label className="block">
        <span className={labelClass}>Descrição da Denúncia *</span>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
          placeholder="Descreva de forma clara e objetiva o que aconteceu, citando as infrações cometidas se souber..."
          className="min-h-40 w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-4 font-bold text-white outline-none transition placeholder:text-white/28 focus:border-emerald-300"
        />
      </label>

      <div className="rounded-[28px] border border-dashed border-white/18 bg-white/[0.045] p-5">
        <div className="flex items-center gap-3">
          <FileText className="text-emerald-300" size={24} />
          <div className="flex-1">
            <h3 className="font-black text-sm">Anexos de Provas (Fotos/PDFs)</h3>
            <p className="text-xs text-white/55 mt-0.5">
              Envie fotos ou relatórios de súmula de apoio. Tamanho máximo: 5MB.
            </p>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setAnexo(e.target.files[0]);
                }
              }}
              className="mt-3 block w-full text-xs text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-300/10 file:text-emerald-200 file:cursor-pointer hover:file:bg-emerald-300/20"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#ffd400] via-[#67dd7a] to-[#00bde7] px-6 py-4 font-black text-black transition hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Enviando...
            </>
          ) : (
            "Enviar denúncia"
          )}
        </button>

        <Link
          href="/"
          className="rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-4 font-black text-white transition hover:bg-white/[0.1] text-center"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
