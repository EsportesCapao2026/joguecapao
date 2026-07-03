# CHECKPOINT ATUALIZADO — Jogue Capão

## Situação atual do projeto

Projeto local:
~/Desktop/joguecapao

Sistema:
Next.js + Supabase + Tailwind

Supabase já conectado.

## Módulos já feitos

### Login/Admin
- Login admin funcionando.
- Middleware protegendo área admin.
- Painel admin existe.
- Admin usa cookies de sessão.

### Campeonatos
- Admin consegue cadastrar campeonatos.
- Campeonato tem:
  - nome
  - modalidade
  - descrição
  - status
  - inscrições abertas
  - data início/fim
  - categorias
  - séries por categoria
- Página pública de campeonatos puxa dados reais do Supabase.
- Página individual do campeonato abre por ID.

### Regras/CBJD
- CBJD importado no banco.
- Busca do CBJD funcionando.
- Regras municipais funcionando.
- Admin consegue cadastrar regras municipais.
- CBJD pode ser ativado/desativado como regra subsidiária.

### Inscrições
- Página pública de inscrição funciona.
- Fluxo:
  - usuário escolhe campeonato
  - categoria
  - série
  - dados da equipe
  - cidade
  - técnico
  - responsável
  - WhatsApp
  - e-mail
  - logo do time
  - lista de jogadores
  - CPF/RG
  - documento do jogador
  - número da camisa
  - capitão opcional
- Inscrição salva como pendente.
- Corrigido problema de RLS usando Supabase Admin no server action.
- Corrigido campo antigo obrigatório `nome_time`.

### Admin Inscrições
- Admin vê inscrições pendentes.
- Pode aprovar/reprovar inscrição.
- Quando aprova, a inscrição sai da tela de pendentes.
- PDF da inscrição foi planejado/implementado parcialmente com botão Gerar PDF.

### Clubes e Atletas
- Equipes aprovadas aparecem na área de clubes e atletas.
- Mostra dados da equipe e atletas.

### Jogos
- Banco de jogos ajustado.
- Tela de jogos começou a ser criada.
- Problema atual: tela de criação de jogos ainda precisa ser padronizada e precisa puxar corretamente:
  - campeonatos reais já criados
  - categorias do campeonato
  - séries da categoria
  - equipes aprovadas daquele campeonato/categoria/série
- Não pode ter cadastro livre digitando campeonato/equipes manualmente.

## Problema atual principal

O admin está despadronizado visualmente.

O usuário quer que TODOS os itens do menu admin sigam exatamente o mesmo padrão visual da tela que ele gostou:

- menu lateral fixo no canto esquerdo
- conteúdo abrindo dentro do mesmo painel
- mesmo fundo do estádio
- mesma intensidade da imagem de fundo
- mesmo espaçamento
- nada abrindo como página solta
- todos os itens do menu abrindo no mesmo formato

Itens que precisam ficar padronizados:
- /admin/dashboard
- /admin/campeonatos
- /admin/inscricoes
- /admin/clubes-atletas
- /admin/jogos
- /admin/resultados
- /admin/artilheiros
- /admin/denuncias
- /admin/regras
- /admin/configuracoes

## Próximo passo exato

Revisar e corrigir a estrutura do admin de forma global.

Não fazer remendo página por página sem olhar a estrutura.

O ideal é:

1. Conferir se existe:
   src/app/admin/layout.tsx

2. Conferir se as páginas admin estão com `<main className=...>` próprio.
   Se tiverem, remover esses `<main>` internos e deixar apenas `<div className="text-white">`.

3. Criar componentes padrão, se necessário:
   - AdminPageShell
   - AdminHero
   - AdminCard

4. Aplicar o mesmo layout em todas as páginas.

5. Corrigir /admin/jogos:
   - formulário deve usar select para campeonato
   - categorias vêm de categorias_lista do campeonato
   - séries vêm da categoria escolhida
   - equipes vêm de inscrições aprovadas filtradas por campeonato/categoria/série
   - mandante e visitante não podem ser digitados manualmente

## Comando para ativar o projeto

cd ~/Desktop/joguecapao

npm run dev

Abrir:
http://localhost:3000

## Observação importante

Antes de publicar:
- rotacionar a SUPABASE_SERVICE_ROLE_KEY, porque ela já foi colada na conversa antiga.
