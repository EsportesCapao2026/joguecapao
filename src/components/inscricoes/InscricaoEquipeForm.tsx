"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, ShieldAlert } from "lucide-react";
import { enviarInscricao } from "@/app/inscricoes/actions";

type CategoriaConfig = {
  nome: string;
  ativo: boolean;
  series_ativas: boolean;
  series_lista: string[];
};

type Props = {
  campeonatoId: string;
  categorias: CategoriaConfig[];
};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-yellow-300 file:px-4 file:py-2 file:text-sm file:font-black file:text-slate-950 placeholder:text-white/35 focus:border-yellow-300/60 focus:ring-2 focus:ring-yellow-300/10";

const labelClass = "mb-2 block text-sm font-black uppercase tracking-[0.08em] text-white/75";

export function InscricaoEquipeForm({ campeonatoId, categorias }: Props) {
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [jogadores, setJogadores] = useState([1]);
  const [proximoJogadorId, setProximoJogadorId] = useState(2);
  const [erros, setErros] = useState<string[]>([]);

  const categoriaAtual = useMemo(() => {
    return categorias.find((categoria) => categoria.nome === categoriaSelecionada);
  }, [categoriaSelecionada, categorias]);

  function adicionarJogador() {
    setJogadores((atuais) => [...atuais, proximoJogadorId]);
    setProximoJogadorId((atual) => atual + 1);
  }

  function removerJogador(id: number) {
    setJogadores((atuais) => {
      if (atuais.length === 1) return atuais;
      return atuais.filter((item) => item !== id);
    });
  }

  function validarFormulario(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const dados = new FormData(form);
    const novosErros: string[] = [];

    const obrigatorios = [
      ["categoria", "Categoria"],
      ["nome_equipe", "Nome da equipe"],
      ["cidade", "Cidade"],
      ["nome_tecnico", "Nome do técnico"],
      ["responsavel_nome", "Nome do responsável"],
      ["responsavel_telefone", "WhatsApp do responsável"],
      ["responsavel_email", "E-mail do responsável"],
    ];

    obrigatorios.forEach(([campo, nome]) => {
      const valor = String(dados.get(campo) || "").trim();

      if (!valor) {
        novosErros.push(nome);
      }
    });

    if (jogadores.length === 0) {
      novosErros.push("Pelo menos um jogador");
    }

    jogadores.forEach((id, index) => {
      const numeroJogador = index + 1;

      const nome = String(dados.get(`jogador_nome_${id}`) || "").trim();
      const documentoRg = String(dados.get(`jogador_rg_${id}`) || "").trim();
      const documentoCpf = String(dados.get(`jogador_cpf_${id}`) || "").trim();
      const numeroCamisa = String(
        dados.get(`jogador_numero_camisa_${id}`) || ""
      ).trim();

      const documentoArquivo = dados.get(
        `jogador_documento_arquivo_${id}`
      ) as File | null;

      if (!nome) {
        novosErros.push(`Nome do Jogador ${numeroJogador}`);
      }

      if (!documentoRg) {
        novosErros.push(`RG do Jogador ${numeroJogador}`);
      }

      if (!documentoCpf) {
        novosErros.push(`CPF do Jogador ${numeroJogador}`);
      }

      if (!numeroCamisa) {
        novosErros.push(`Número da camisa do Jogador ${numeroJogador}`);
      }

      if (!documentoArquivo || documentoArquivo.size === 0) {
        novosErros.push(`Arquivo do documento do Jogador ${numeroJogador}`);
      }
    });

    if (novosErros.length > 0) {
      event.preventDefault();
      setErros(novosErros);

      setTimeout(() => {
        const aviso = document.getElementById("erros-inscricao");
        aviso?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } else {
      setErros([]);
    }
  }

  return (
    <form action={enviarInscricao} onSubmit={validarFormulario} className="space-y-8">
      <input type="hidden" name="campeonato_id" value={campeonatoId} />
      <input type="hidden" name="jogador_indices" value={jogadores.join(",")} />

      {erros.length > 0 && (
        <div
          id="erros-inscricao"
          className="rounded-3xl border border-red-300/30 bg-red-500/10 p-5 text-red-50"
        >
          <div className="flex gap-3">
            <ShieldAlert className="mt-1 shrink-0" size={24} />

            <div>
              <strong className="block text-lg font-black uppercase">
                Faltam informações obrigatórias
              </strong>

              <p className="mt-2 text-sm leading-6 text-red-50/80">
                Confira os campos abaixo antes de enviar a inscrição:
              </p>

              <ul className="mt-4 grid gap-2 text-sm font-bold text-red-50/90 md:grid-cols-2">
                {erros.map((erro) => (
                  <li
                    key={erro}
                    className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3"
                  >
                    {erro}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-5">
        <h2 className="text-2xl font-black uppercase text-white">Dados da inscrição</h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Categoria obrigatória</span>
            <select
              name="categoria"
              required
              className={inputClass}
              value={categoriaSelecionada}
              onChange={(event) => setCategoriaSelecionada(event.target.value)}
            >
              <option value="">Selecione uma categoria</option>
              {categorias.map((categoria) => (
                <option key={categoria.nome} value={categoria.nome}>
                  {categoria.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Série</span>
            <select name="serie" className={inputClass}>
              <option value="">Sem série ou não se aplica</option>
              {categoriaAtual?.series_ativas
                ? categoriaAtual.series_lista.map((serie) => (
                    <option key={serie} value={serie}>
                      {serie}
                    </option>
                  ))
                : null}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-5">
        <h2 className="text-2xl font-black uppercase text-white">Dados da equipe</h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Nome da equipe obrigatório</span>
            <input
              name="nome_equipe"
              required
              placeholder="Ex.: Real Capão"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Cidade obrigatória</span>
            <input
              name="cidade"
              required
              placeholder="Ex.: Capão da Canoa"
              className={inputClass}
            />
          </label>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Nome do técnico obrigatório</span>
            <input
              name="nome_tecnico"
              required
              placeholder="Nome completo do técnico"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Logotipo do time</span>
            <input
              name="logo_time"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className={inputClass}
            />
            <span className="mt-2 block text-xs leading-5 text-white/45">
              A logo é recomendada, mas não obrigatória.
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-5">
        <h2 className="text-2xl font-black uppercase text-white">
          Responsável pela inscrição
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <label className="block">
            <span className={labelClass}>Nome do responsável obrigatório</span>
            <input
              name="responsavel_nome"
              required
              placeholder="Nome completo"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>WhatsApp obrigatório</span>
            <input
              name="responsavel_telefone"
              required
              placeholder="Ex.: (51) 99999-9999"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className={labelClass}>E-mail obrigatório</span>
            <input
              name="responsavel_email"
              type="email"
              required
              placeholder="email@exemplo.com"
              className={inputClass}
            />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase text-white">
              Lista de jogadores
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Campos obrigatórios: nome, RG, CPF, arquivo do documento e número da camisa.
              O capitão é opcional.
            </p>
          </div>

          <button
            type="button"
            onClick={adicionarJogador}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-300 px-4 py-3 text-sm font-black uppercase text-slate-950 transition hover:scale-[1.01]"
          >
            <Plus size={18} />
            Adicionar jogador
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {jogadores.map((id, index) => (
            <div
              key={id}
              className="rounded-3xl border border-white/10 bg-black/25 p-5"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <h3 className="text-lg font-black uppercase text-white">
                  Jogador {index + 1}
                </h3>

                <button
                  type="button"
                  onClick={() => removerJogador(id)}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs font-black uppercase text-red-100 transition hover:bg-red-500/20"
                >
                  <Trash2 size={15} />
                  Remover
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <label className="block">
                  <span className={labelClass}>Nome do jogador obrigatório</span>
                  <input
                    name={`jogador_nome_${id}`}
                    required
                    placeholder="Nome completo"
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>RG obrigatório</span>
                  <input
                    name={`jogador_rg_${id}`}
                    required
                    placeholder="Digite o RG"
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>CPF obrigatório</span>
                  <input
                    name={`jogador_cpf_${id}`}
                    required
                    placeholder="Digite o CPF"
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Número da camisa obrigatório</span>
                  <input
                    name={`jogador_numero_camisa_${id}`}
                    required
                    placeholder="Ex.: 10"
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>Documento do jogador obrigatório</span>
                  <input
                    name={`jogador_documento_arquivo_${id}`}
                    type="file"
                    required
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="mt-5 flex items-center gap-3 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 p-4 text-sm font-black uppercase text-yellow-50">
                <input
                  type="radio"
                  name="capitao"
                  value={id}
                  className="h-5 w-5 accent-yellow-300"
                />
                Marcar como capitão do time
              </label>
            </div>
          ))}
        </div>
      </section>

      <label className="block">
        <span className={labelClass}>Observações</span>
        <textarea
          name="observacoes"
          rows={5}
          placeholder="Alguma informação importante sobre a equipe..."
          className={inputClass}
        />
      </label>

      <button
        type="submit"
        className="w-full rounded-2xl bg-gradient-to-r from-yellow-300 via-green-400 to-blue-500 px-5 py-4 text-sm font-black uppercase text-slate-950 shadow-lg transition hover:scale-[1.01]"
      >
        Enviar inscrição para análise
      </button>
    </form>
  );
}
