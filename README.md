# Monitor de Acertos — Vestibular Tracker

App para acompanhar acertos por prova, área e conteúdo específico ao longo da reta final
para IME-USP, Unicamp, ENEM/SISU, Fuvest e Provão Paulista — comparando sempre com metas
de referência.

## Como funciona

- **Provas**: ENEM-USP, ENEM/SISU (Unicamp), Vestibular Unicamp (COMVEST), Fuvest, Provão
  Paulista — já vêm cadastradas com as áreas e metas do relatório enviado.
- **Simulados**: a cada simulado feito, você registra os acertos por área e (opcional) os
  conteúdos específicos que errou (ex: "frações", "funções do 2º grau").
- **Dashboard**: mostra o progresso de cada área em relação à meta.
- **Página de cada prova**: ao abrir uma área, aparece o gráfico de evolução ao longo do
  tempo e a lista dos conteúdos que você mais tem errado — para saber onde focar a revisão.

## Stack

Next.js (Pages Router) + TypeScript + Prisma + PostgreSQL + Tailwind + Recharts.
Escolhido por ser gratuito para hospedar (Vercel + Neon/Supabase, camada free) e por usar
as mesmas tecnologias que você já usa no Aspen Core (TypeScript, Prisma, Postgres).

## Rodando localmente

```bash
npm install
cp .env.example .env
```

Depois, **abra o arquivo `.env` e substitua o valor de `DATABASE_URL` pela string real do
seu banco** (veja "Colocando no ar de graça" abaixo para criar um banco gratuito no Neon).
O valor que vem no `.env.example` é só um exemplo — se você deixar `host:5432` do jeito que
está, os comandos abaixo vão falhar com "Can't reach database server".

```bash
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Abra http://localhost:3000

## Colocando no ar de graça (Vercel + Neon)

### 1. Banco de dados gratuito (Neon)

1. Crie uma conta em https://neon.tech (tem camada gratuita permanente).
2. Crie um novo projeto/banco.
3. Copie a "Connection string" (algo como
   `postgresql://usuario:senha@ep-xxxx.neon.tech/neondb?sslmode=require`).
4. Cole essa string no seu `.env` local como `DATABASE_URL` para testar, e guarde para o
   passo do Vercel.

   *(Supabase também funciona do mesmo jeito, se preferir: https://supabase.com — camada
   gratuita, também usa Postgres.)*

### 2. Subir o código pro GitHub

```bash
git init
git add .
git commit -m "primeira versão do monitor de acertos"
```

Crie um repositório novo no GitHub e siga as instruções dele para dar push.

### 3. Deploy na Vercel

1. Crie uma conta em https://vercel.com (gratuita) e conecte com seu GitHub.
2. Clique em "Add New Project" e selecione o repositório.
3. Em "Environment Variables", adicione `DATABASE_URL` com a mesma string do Neon.
4. Deploy.

### 4. Rodar as migrations e o seed em produção

Depois do primeiro deploy, rode localmente (apontando pro banco de produção) para criar as
tabelas e popular as metas:

```bash
# com o .env local apontando para a DATABASE_URL de produção (Neon)
npx prisma migrate deploy
npm run prisma:seed
```

Pronto — o app está no ar, gratuito, e os dados ficam salvos no Postgres entre sessões.

## Estrutura do banco (resumo)

- `Prova` → cada vestibular (ENEM-USP, Unicamp SISU, Unicamp COMVEST, Fuvest, Provão)
- `Area` → cada prova/matéria dentro do vestibular (Matemática, Linguagens, etc.)
- `Meta` → metas de acertos/nota por área, pré-carregadas do relatório e editáveis
- `Simulado` → um simulado feito em uma data
- `Resultado` → o resultado de uma área dentro de um simulado (acertos/total)
- `ConteudoErrado` → conteúdos específicos errados dentro de um resultado

## Ideias para evoluir depois

- Editar/gerenciar metas pela interface (hoje só vêm do seed, mas dá pra criar uma tela
  de edição em cima do model `Meta`).
- Autocomplete de conteúdos já usados (a API `/api/areas/[id]/conteudos` já devolve isso,
  só falta ligar no campo de texto do formulário).
- Exportar histórico em CSV/planilha.
- Alertas automáticos ("você está 4 acertos abaixo da meta em Matemática").
