# Quitta

App web mobile-first (PWA) de finanças pessoais: contas, cartões, parcelamentos, financiamentos,
assinaturas, orçamento, investimentos e relatórios. Cada usuário só enxerga os próprios dados (RLS).

## Stack

Next.js (App Router, TypeScript strict) · Tailwind CSS v4 · shadcn/ui · react-hook-form + zod ·
Recharts · date-fns · nuqs · exceljs · Supabase cloud (`@supabase/ssr`) · Vercel.

## Como rodar

Requer Node.js 20+.

```bash
npm install
# crie um .env com as variáveis abaixo (seção Supabase)
npm run dev                  # http://localhost:3000
```

| Comando             | O que faz                     |
| ------------------- | ----------------------------- |
| `npm run dev`       | Servidor de desenvolvimento   |
| `npm run build`     | Build de produção             |
| `npm run lint`      | ESLint                        |
| `npm run typecheck` | Gera tipos de rotas + `tsc`   |
| `npm test`          | Testes (Vitest)               |
| `npm run format`    | Formata o código com Prettier |

## Supabase (sem Docker)

O banco é só o projeto na nuvem — não há Supabase local.

1. Crie um projeto em [supabase.com](https://supabase.com) e copie a URL e a chave publishable
   (ou anon) para `.env`:
   ```
   SUPABASE_URL=
   SUPABASE_PUBLISHABLE_KEY=
   SITE_URL=http://localhost:3000
   ```
   Nunca use a service_role/secret key no app.
2. Aplique as migrations e gere os tipos:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref>
   npx supabase db push
   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
   ```
   Sem CLI: cole o SQL de `supabase/migrations/` no SQL Editor do painel.
3. Em Auth → URL Configuration: `Site URL` = URL da Vercel; Redirect URLs =
   `http://localhost:3000/**` e `https://*.vercel.app/**`.

Não use `supabase start`, `supabase db reset` nem `supabase db diff` — exigem Docker.
Para mudar o schema: `npx supabase migration new <nome>` → editar o SQL → `npx supabase db push`.
Nunca edite uma migration já aplicada; crie uma nova.

## Mensagens e alertas (pg_cron)

Os avisos da central de mensagens (faturas e contas vencendo, assinaturas renovando, parcelas de
financiamento, limite do cartão ≥ 80%) são criados uma vez por dia pela função
`private.generate_notifications()`. Sem o agendamento, a central fica vazia.

1. No painel: **Database → Extensions** → ative `pg_cron`.
2. No **SQL Editor**, agende (11:00 UTC = 08:00 em Brasília):
   ```sql
   select cron.schedule('notificacoes-diarias', '0 11 * * *',
     $$select private.generate_notifications()$$);
   ```
3. Para testar na hora: `select private.generate_notifications();`
   Para conferir: `select * from cron.job;` · Para remover: `select cron.unschedule('notificacoes-diarias');`

A antecedência dos avisos (padrão 3 dias) é ajustada por cada usuário em **Mensagens**.

## Deploy

Importe o repositório na Vercel e configure as mesmas variáveis de ambiente.
