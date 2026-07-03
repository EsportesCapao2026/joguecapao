# CHECKPOINT — DESIGN ADMIN OK

Data: 01/07/2026

Status:
- Painel admin voltou a compilar.
- Menu duplicado corrigido.
- Layout global do admin funcionando.
- Campeonatos, Inscrições e Jogos estão abrindo no mesmo padrão.
- Página Jogos voltou a funcionar após recriar src/app/admin/jogos/actions.ts.
- Fundo do estádio e menu lateral estão padronizados.

Regra visual oficial:
- Manter um único menu lateral.
- Não usar AdminLayout antigo.
- Não criar fundo próprio dentro das páginas admin.
- O fundo e a lateral ficam no layout global:
  src/app/admin/layout.tsx
  src/components/admin/AdminFrame.tsx
  src/components/admin/AdminSidebar.tsx

Próxima etapa:
- Conferir as demais abas:
  /admin/clubes-atletas
  /admin/resultados
  /admin/artilheiros
  /admin/denuncias
  /admin/regras
  /admin/configuracoes

Depois:
- Voltar para a funcionalidade de Jogos:
  campeonato vindo do banco,
  categoria da configuração do campeonato,
  série da categoria,
  equipes aprovadas filtradas,
  e jogos aparecendo na página pública do campeonato.
