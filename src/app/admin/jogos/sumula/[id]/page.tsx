import React from "react";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { redirect } from "next/navigation";
import PrintButton from "@/components/admin/PrintButton";
import { parseJogoObservacoes } from "@/lib/tempoReal";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SumulaPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  // Buscar informações do jogo
  const { data: jogo } = await supabase
    .from("jogos")
    .select("*")
    .eq("id", id)
    .single();

  if (!jogo) {
    redirect("/admin/jogos?erro=jogo-nao-encontrado");
  }

  // Buscar atletas mandantes
  const { data: atletasMandante } = await supabase
    .from("inscricao_jogadores")
    .select("nome, numero_camisa, posicao")
    .eq("inscricao_id", jogo.equipe_mandante_id)
    .neq("status", "recusado")
    .order("nome");

  // Buscar atletas visitantes
  const { data: atletasVisitante } = await supabase
    .from("inscricao_jogadores")
    .select("nome, numero_camisa, posicao")
    .eq("inscricao_id", jogo.equipe_visitante_id)
    .neq("status", "recusado")
    .order("nome");

  // Buscar técnicos nas inscrições
  const { data: inscMandante } = await supabase
    .from("inscricoes")
    .select("nome_tecnico, nome_auxiliar, nome_preparador, responsavel_nome")
    .eq("id", jogo.equipe_mandante_id)
    .single();

  const { data: inscVisitante } = await supabase
    .from("inscricoes")
    .select("nome_tecnico, nome_auxiliar, nome_preparador, responsavel_nome")
    .eq("id", jogo.equipe_visitante_id)
    .single();

  // Parse dos detalhes da partida
  const jsonObs = parseJogoObservacoes(jogo.observacoes);
  const gols = jsonObs.gols_detalhe || [];
  const cartoes = jsonObs.cartoes_detalhe || [];

  const golsMandante = gols.filter((g) => g.equipe_id === jogo.equipe_mandante_id);
  const golsVisitante = gols.filter((g) => g.equipe_id === jogo.equipe_visitante_id);

  const cartoesMandante = cartoes.filter((c) => c.equipe_id === jogo.equipe_mandante_id);
  const cartoesVisitante = cartoes.filter((c) => c.equipe_id === jogo.equipe_visitante_id);

  const tecnicoMandante = inscMandante?.nome_tecnico || inscMandante?.responsavel_nome || "Não informado";
  const tecnicoVisitante = inscVisitante?.nome_tecnico || inscVisitante?.responsavel_nome || "Não informado";

  return (
    <div className="min-h-screen bg-neutral-100 p-6 md:p-12 print:bg-white print:p-0 font-sans text-neutral-800">
      {/* Botão administrativo para impressão - escondido no print */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden bg-white p-4 rounded-2xl shadow-sm border border-neutral-200">
        <div>
          <h1 className="font-bold text-neutral-900">Súmula da Partida</h1>
          <p className="text-xs text-neutral-500">Pronta para impressão física ou salvar como PDF.</p>
        </div>
        <PrintButton />
      </div>

      {/* Súmula A4 Layout */}
      <div className="max-w-4xl mx-auto bg-white p-8 border border-neutral-300 shadow-md rounded-[24px] print:shadow-none print:border-none print:rounded-none print:p-4 space-y-6">
        
        {/* Cabeçalho */}
        <div className="border-b-2 border-neutral-900 pb-4 text-center relative">
          <h2 className="text-xl font-black uppercase tracking-wider text-neutral-900">Súmula Oficial de Partida</h2>
          <p className="text-xs font-black uppercase text-red-600 mt-1">Campeonato Municipal Jogue Capão</p>
          
          <div className="grid grid-cols-4 gap-2 mt-4 text-left text-[10px] bg-neutral-50 p-3 rounded-xl border border-neutral-200 print:bg-neutral-50">
            <div>
              <span className="block font-black text-neutral-400 uppercase text-[8px]">Campeonato</span>
              <span className="font-bold text-neutral-800 truncate block">Municipal</span>
            </div>
            <div>
              <span className="block font-black text-neutral-400 uppercase text-[8px]">Categoria/Série</span>
              <span className="font-bold text-neutral-800">{jogo.categoria || "Principal"} {jogo.serie ? `• ${jogo.serie}` : ""}</span>
            </div>
            <div>
              <span className="block font-black text-neutral-400 uppercase text-[8px]">Rodada</span>
              <span className="font-bold text-neutral-800">{jogo.rodada || "Fase de Grupos"}</span>
            </div>
            <div>
              <span className="block font-black text-neutral-400 uppercase text-[8px]">Data & Horário</span>
              <span className="font-bold text-neutral-800">{jogo.data_jogo || "--/--/----"} • {jogo.horario || "--:--"}</span>
            </div>
          </div>
        </div>

        {/* Confronto e Placar */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-2 text-center border-b border-neutral-200">
          <div className="text-right text-base font-black uppercase text-neutral-900 truncate">
            {jogo.equipe_mandante_nome}
          </div>
          <div className="bg-neutral-900 text-white font-mono text-2xl font-black px-6 py-2.5 rounded-xl min-w-[100px]">
            {jogo.gols_mandante ?? 0} - {jogo.gols_visitante ?? 0}
          </div>
          <div className="text-left text-base font-black uppercase text-neutral-900 truncate">
            {jogo.equipe_visitante_nome}
          </div>
        </div>

        {/* Grades Laterais de Atletas */}
        <div className="grid grid-cols-2 gap-6 divide-x divide-neutral-300">
          
          {/* Lado Mandante */}
          <div className="space-y-4 pr-3">
            <div className="flex items-center justify-between border-b-2 border-neutral-900 pb-1.5">
              <h3 className="font-black uppercase text-sm text-neutral-900 truncate">{jogo.equipe_mandante_nome}</h3>
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Mandante</span>
            </div>
            
            <table className="w-full text-[10px] text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-300 text-neutral-400 font-bold uppercase text-[8px]">
                  <th className="py-1 w-8">Nº</th>
                  <th className="py-1">Nome do Atleta</th>
                  <th className="py-1 w-12 text-right">Assinatura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {atletasMandante && atletasMandante.length > 0 ? (
                  atletasMandante.map((atleta, index) => (
                    <tr key={index}>
                      <td className="py-1.5 font-bold font-mono text-neutral-600">{atleta.numero_camisa || "--"}</td>
                      <td className="py-1.5 font-bold text-neutral-800 uppercase">{atleta.nome}</td>
                      <td className="py-1.5 border-b border-neutral-300 w-16"></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-2 text-center italic text-neutral-400 text-[10px]">Nenhum jogador inscrito</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="pt-2 text-[10px] space-y-1 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
              <p className="text-[8px] uppercase font-black text-neutral-400">Comissão Técnica</p>
              <p className="font-bold text-neutral-800"><span className="font-medium text-neutral-500">Técnico:</span> {tecnicoMandante}</p>
              {inscMandante?.nome_auxiliar && <p className="font-bold text-neutral-800"><span className="font-medium text-neutral-500">Auxiliar:</span> {inscMandante.nome_auxiliar}</p>}
            </div>
          </div>

          {/* Lado Visitante */}
          <div className="space-y-4 pl-6">
            <div className="flex items-center justify-between border-b-2 border-neutral-900 pb-1.5">
              <h3 className="font-black uppercase text-sm text-neutral-900 truncate">{jogo.equipe_visitante_nome}</h3>
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Visitante</span>
            </div>
            
            <table className="w-full text-[10px] text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-300 text-neutral-400 font-bold uppercase text-[8px]">
                  <th className="py-1 w-8">Nº</th>
                  <th className="py-1">Nome do Atleta</th>
                  <th className="py-1 w-12 text-right">Assinatura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {atletasVisitante && atletasVisitante.length > 0 ? (
                  atletasVisitante.map((atleta, index) => (
                    <tr key={index}>
                      <td className="py-1.5 font-bold font-mono text-neutral-600">{atleta.numero_camisa || "--"}</td>
                      <td className="py-1.5 font-bold text-neutral-800 uppercase">{atleta.nome}</td>
                      <td className="py-1.5 border-b border-neutral-300 w-16"></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-2 text-center italic text-neutral-400 text-[10px]">Nenhum jogador inscrito</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="pt-2 text-[10px] space-y-1 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
              <p className="text-[8px] uppercase font-black text-neutral-400">Comissão Técnica</p>
              <p className="font-bold text-neutral-800"><span className="font-medium text-neutral-500">Técnico:</span> {tecnicoVisitante}</p>
              {inscVisitante?.nome_auxiliar && <p className="font-bold text-neutral-800"><span className="font-medium text-neutral-500">Auxiliar:</span> {inscVisitante.nome_auxiliar}</p>}
            </div>
          </div>
        </div>

        {/* Relatório de Eventos da Partida */}
        <div className="grid grid-cols-2 gap-6 pt-4 border-t-2 border-neutral-900">
          
          {/* Acontecimentos Mandante */}
          <div className="space-y-4">
            <p className="text-[8px] font-black uppercase text-neutral-400 tracking-wider">Eventos do Mandante</p>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-neutral-600 uppercase border-b border-neutral-200 pb-0.5">Gols</p>
              {golsMandante.length === 0 ? (
                <p className="text-[10px] italic text-neutral-400">Nenhum gol registrado.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {golsMandante.map((g, i) => (
                    <div key={i} className="text-[10px] font-bold text-neutral-800 flex items-center gap-1.5">
                      <span className="font-mono text-neutral-400">⚽ {g.minuto}&apos;</span>
                      <span className="uppercase">{g.atleta_nome}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-[10px] font-black text-neutral-600 uppercase border-b border-neutral-200 pb-0.5">Cartões</p>
              {cartoesMandante.length === 0 ? (
                <p className="text-[10px] italic text-neutral-400">Nenhuma punição.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {cartoesMandante.map((c, i) => (
                    <div key={i} className="text-[10px] font-bold text-neutral-800 flex items-center gap-1.5">
                      <span className="font-mono text-neutral-400">{c.tipo === "amarelo" ? "🟨" : "🟥"} {c.minuto}&apos;</span>
                      <span className="uppercase">{c.atleta_nome}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Acontecimentos Visitante */}
          <div className="space-y-4 pl-6 border-l border-neutral-300">
            <p className="text-[8px] font-black uppercase text-neutral-400 tracking-wider">Eventos do Visitante</p>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-neutral-600 uppercase border-b border-neutral-200 pb-0.5">Gols</p>
              {golsVisitante.length === 0 ? (
                <p className="text-[10px] italic text-neutral-400">Nenhum gol registrado.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {golsVisitante.map((g, i) => (
                    <div key={i} className="text-[10px] font-bold text-neutral-800 flex items-center gap-1.5">
                      <span className="font-mono text-neutral-400">⚽ {g.minuto}&apos;</span>
                      <span className="uppercase">{g.atleta_nome}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-[10px] font-black text-neutral-600 uppercase border-b border-neutral-200 pb-0.5">Cartões</p>
              {cartoesVisitante.length === 0 ? (
                <p className="text-[10px] italic text-neutral-400">Nenhuma punição.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {cartoesVisitante.map((c, i) => (
                    <div key={i} className="text-[10px] font-bold text-neutral-800 flex items-center gap-1.5">
                      <span className="font-mono text-neutral-400">{c.tipo === "amarelo" ? "🟨" : "🟥"} {c.minuto}&apos;</span>
                      <span className="uppercase">{c.atleta_nome}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Relatório e Observações da Arbitragem */}
        <div className="pt-4 border-t-2 border-neutral-900 space-y-4">
          <p className="text-[8px] font-black uppercase text-neutral-400 tracking-wider">Relatório de Observações do Árbitro / Anotações</p>
          <div className="border border-neutral-300 rounded-xl p-4 min-h-[140px] relative bg-neutral-50/50">
            {/* Linhas pautadas para escrita manual pós-impressão */}
            <div className="absolute inset-0 flex flex-col justify-between py-4 px-6 pointer-events-none">
              <div className="border-b border-neutral-200/80 h-6"></div>
              <div className="border-b border-neutral-200/80 h-6"></div>
              <div className="border-b border-neutral-200/80 h-6"></div>
              <div className="border-b border-neutral-200/80 h-6"></div>
              <div className="border-b border-neutral-200/80 h-6"></div>
            </div>
          </div>
        </div>

        {/* Assinaturas */}
        <div className="grid grid-cols-2 gap-12 pt-8 text-center text-[10px] font-bold">
          <div className="space-y-1.5">
            <div className="border-t border-neutral-500 pt-1.5 w-48 mx-auto"></div>
            <p className="text-neutral-500 uppercase text-[8px]">Assinatura do Árbitro Principal</p>
          </div>
          <div className="space-y-1.5">
            <div className="border-t border-neutral-500 pt-1.5 w-48 mx-auto"></div>
            <p className="text-neutral-500 uppercase text-[8px]">Representante da Liga / Diretor</p>
          </div>
        </div>

      </div>
    </div>
  );
}
