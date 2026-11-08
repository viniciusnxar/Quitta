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
cp .env.example .env.local   # preencha com os dados do seu projeto Supabase
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
   (ou anon) para `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
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

## Deploy

Importe o repositório na Vercel e configure as mesmas variáveis de ambiente.
