import { Settings, ShieldCheck, Key, Cpu, Database, AlertCircle, CheckCircle2 } from "lucide-react";
import { obterRoleAtual } from "@/lib/adminAuth";
import { atualizarSenhaAdmin, atualizarSenhaMaster } from "./actions";

type SearchParams = Promise<{
  sucesso?: string;
  erro?: string;
  detalhe?: string;
}>;

export default async function AdminConfiguracoesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const role = await obterRoleAtual();
  const isMaster = role === "master";

  const envStatus = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configurado (Conectado)" : "Ausente",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Configurado" : "Ausente",
    adminPassword: process.env.ADMIN_PASSWORD ? "Definida" : "Não definida",
    masterPassword: process.env.MASTER_PASSWORD ? "Definida" : "Não definida",
    sessionSecret: process.env.SESSION_SECRET ? "Gerado" : "Não gerado",
  };

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-yellow-300/60 focus:ring-2 focus:ring-yellow-300/10";

  const labelClass =
    "mb-2 block text-sm font-black uppercase tracking-[0.08em] text-white/75";

  return (
    <div className="space-y-6 text-white">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur">
        <div className="border-b border-white/10 bg-gradient-to-r from-yellow-300/15 via-green-400/10 to-blue-500/15 p-6 md:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-yellow-200">
            <Settings size={14} />
            CONFIGURAÇÕES
          </span>

          <h1 className="mt-4 text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
            Ajustes do Sistema
          </h1>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/72 md:text-base">
            Gerencie as variáveis do sistema, configurações de segurança e confira o status dos serviços conectados à plataforma.
          </p>
        </div>
      </div>

      {params.sucesso && (
        <div className="rounded-3xl border border-green-300/25 bg-green-400/10 p-4 text-sm font-black text-green-100 backdrop-blur flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-300" />
            <span>Sucesso ao atualizar configurações!</span>
          </div>
          {params.sucesso === "senha-atualizada" && (
            <span className="text-xs font-bold text-green-200/80">Senha do Administrador comum atualizada com sucesso!</span>
          )}
          {params.sucesso === "senha-master-atualizada" && (
            <span className="text-xs font-bold text-green-200/80">Senha Master do superusuário atualizada com sucesso!</span>
          )}
        </div>
      )}

      {params.erro && (
        <div className="rounded-3xl border border-red-300/25 bg-red-400/10 p-4 text-sm font-black text-red-100 backdrop-blur flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>Erro ao salvar configurações.</span>
          </div>
          {params.erro === "senhas-diferentes" && (
            <span className="text-xs font-bold text-red-50/80">As senhas digitadas no campo de Nova Senha e Confirmação não são idênticas. Digite a mesma senha em ambos os campos de um mesmo formulário.</span>
          )}
          {params.erro === "senha-curta" && (
            <span className="text-xs font-bold text-red-50/80">A nova senha deve conter no mínimo 6 caracteres.</span>
          )}
          {params.erro === "campos-obrigatorios" && (
            <span className="text-xs font-bold text-red-50/80">Todos os campos de senha são obrigatórios.</span>
          )}
          {params.detalhe && (
            <span className="mt-2 block text-xs font-bold text-red-50/80">
              Detalhe: {params.detalhe}
            </span>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Formulário de alteração de senhas (apenas para Master) */}
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-yellow-300/12 text-yellow-300">
                <Key size={22} />
              </div>
              <h2 className="text-2xl font-black uppercase">Gerenciar Acessos</h2>
            </div>

            <p className="text-sm leading-6 text-white/60">
              Somente usuários com nível de acesso **Master** podem alterar as senhas de acesso do sistema. Cada formulário abaixo gerencia uma senha individual de forma independente.
            </p>

            {isMaster ? (
              <div className="space-y-6">
                <span className="inline-flex rounded-full border border-yellow-300/30 bg-yellow-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-yellow-200">
                  Acesso Master Confirmado
                </span>

                <div className="bg-black/20 p-5 rounded-3xl border border-white/5 space-y-4">
                  <h3 className="text-lg font-black uppercase text-emerald-300">1. Senha do Administrador Comum</h3>
                  <p className="text-xs leading-5 text-white/50">Esta senha concede acesso ao painel de campeonatos e rodadas, mas sem permissão de alterar senhas.</p>
                  
                  <form action={atualizarSenhaAdmin} className="space-y-4">
                    <label className="block">
                      <span className={labelClass}>Nova Senha do Admin</span>
                      <input
                        name="new_password"
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="Digite a nova senha do admin"
                        className={inputClass}
                      />
                    </label>

                    <label className="block">
                      <span className={labelClass}>Confirme a Nova Senha do Admin (Repita a mesma senha)</span>
                      <input
                        name="confirm_password"
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="Digite exatamente a mesma senha do campo acima"
                        className={inputClass}
                      />
                    </label>

                    <button
                      type="submit"
                      className="w-full rounded-2xl bg-gradient-to-r from-yellow-300 via-green-400 to-blue-500 px-5 py-4 text-sm font-black uppercase text-slate-950 shadow-lg transition hover:scale-[1.01]"
                    >
                      Atualizar Senha do Admin
                    </button>
                  </form>
                </div>

                <div className="bg-black/20 p-5 rounded-3xl border border-white/5 space-y-4">
                  <h3 className="text-lg font-black uppercase text-yellow-200">2. Senha Master (Seu Acesso)</h3>
                  <p className="text-xs leading-5 text-white/50">Esta senha concede acesso total e administrativo de privilégios (incluindo o controle deste painel de acessos).</p>
                  
                  <form action={atualizarSenhaMaster} className="space-y-4">
                    <label className="block">
                      <span className={labelClass}>Nova Senha Master</span>
                      <input
                        name="new_password_master"
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="Digite a nova senha master"
                        className={inputClass}
                      />
                    </label>

                    <label className="block">
                      <span className={labelClass}>Confirme a Nova Senha Master (Repita a mesma senha)</span>
                      <input
                        name="confirm_password_master"
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="Digite exatamente a mesma senha do campo acima"
                        className={inputClass}
                      />
                    </label>

                    <button
                      type="submit"
                      className="w-full rounded-2xl bg-gradient-to-r from-yellow-300 via-green-400 to-blue-500 px-5 py-4 text-sm font-black uppercase text-slate-950 shadow-lg transition hover:scale-[1.01]"
                    >
                      Atualizar Senha Master
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-red-400/25 bg-red-400/10 p-5 text-sm leading-6 text-red-200">
                <div className="flex items-center gap-2 font-bold mb-2">
                  <AlertCircle size={18} />
                  <span>Acesso Restrito ao Administrador</span>
                </div>
                Seu perfil atual é **Administrador**. Você possui acesso completo às ferramentas de campeonatos e atletas, mas não tem permissão para gerenciar as senhas do sistema. Entre com a conta **Master** para alterar as senhas.
              </div>
            )}
          </div>

          <div className="mt-6 text-xs text-white/40">
            Segurança de acesso regida por cookies assinados e autenticação por banco de dados.
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/12 text-blue-300">
                <Database size={22} />
              </div>
              <h2 className="text-2xl font-black uppercase">Banco de Dados</h2>
            </div>
            
            <p className="text-sm leading-6 text-white/60 mb-5">
              Conexão com o Supabase para armazenamento de dados, inscrições, logs, fotos dos clubes e documentos anexados.
            </p>

            <div className="space-y-3 bg-black/20 p-4 rounded-2xl border border-white/5 text-sm">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/50">Provedor</span>
                <span className="font-bold">Supabase Cloud</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/50">URL da API</span>
                <span className="font-bold text-xs truncate max-w-[200px]" title={process.env.NEXT_PUBLIC_SUPABASE_URL}>
                  {process.env.NEXT_PUBLIC_SUPABASE_URL || "Não configurada"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-white/50">Status</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-green-300">
                  <span className="h-2 w-2 rounded-full bg-green-300" />
                  {envStatus.supabaseUrl}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-xs text-white/40">
            A chave de serviço administrativa do banco está ativa.
          </div>
        </section>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-yellow-300/12 text-yellow-300">
                <ShieldCheck size={22} />
              </div>
              <h2 className="text-2xl font-black uppercase">Segurança de Ambiente</h2>
            </div>

            <p className="text-sm leading-6 text-white/60 mb-5">
              Controle de ambiente de autenticação por cookies.
            </p>

            <div className="space-y-3 bg-black/20 p-4 rounded-2xl border border-white/5 text-sm">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/50">Fallback Senha Admin</span>
                <span className="font-bold text-green-300">{envStatus.adminPassword}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/50">Fallback Senha Master</span>
                <span className="font-bold text-green-300">{envStatus.masterPassword}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-white/50">Secret de Sessão</span>
                <span className="font-bold text-blue-300">{envStatus.sessionSecret}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-xs text-yellow-200/50">
            Atenção: A alteração no painel troca a senha correspondente (Admin ou Master) gravada de forma dinâmica no banco. As senhas do arquivo .env.local servem como fallback caso não haja registros no banco de dados.
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/12 text-emerald-300">
                <Cpu size={22} />
              </div>
              <h2 className="text-2xl font-black uppercase">Ambiente de Execução</h2>
            </div>

            <p className="text-sm leading-6 text-white/60 mb-5">
              Parâmetros de execução do Next.js e ambiente de computação local.
            </p>

            <div className="space-y-3 bg-black/20 p-4 rounded-2xl border border-white/5 text-sm">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/50">Estrutura</span>
                <span className="font-bold">Next.js 16.2.9</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/50">Node Runtime</span>
                <span className="font-bold">NodeJS v24.18.0</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-white/50">Engine Mode</span>
                <span className="font-bold">Webpack Fallback</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-xs text-white/40">
            Logs do sistema gravados localmente em tempo de execução.
          </div>
        </section>
      </div>
    </div>
  );
}
