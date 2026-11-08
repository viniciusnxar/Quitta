-- =====================================================================
-- Finanças Pessoais — schema inicial
-- Supabase (Postgres 15+). Todas as tabelas com RLS por usuário.
-- Valores monetários: numeric(14,2). Datas de competência: date.
-- =====================================================================

create schema if not exists private;  -- funções internas, NÃO expostas pela API

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
create type public.account_type        as enum ('corrente','poupanca','carteira','investimento','beneficio','outro');
create type public.category_kind       as enum ('receita','despesa');
create type public.category_nature     as enum ('salario','renda_extra','beneficio','reembolso','fixa','variavel','imposto','taxa','juros','ajuste','outro');
create type public.transaction_type    as enum ('receita','despesa','transferencia','pagamento_fatura','aplicacao','resgate');
create type public.transaction_status  as enum ('previsto','pago','cancelado');
create type public.billing_cycle       as enum ('semanal','quinzenal','mensal','bimestral','trimestral','semestral','anual');
create type public.subscription_status as enum ('ativa','pausada','cancelada');
create type public.financing_kind      as enum ('imovel','veiculo','pessoal','consignado','estudantil','outro');
create type public.amortization_system as enum ('price','sac','sem_juros');
create type public.rate_period         as enum ('mes','ano');
create type public.investment_kind     as enum ('cdb','lci','lca','cri','cra','debenture','tesouro_selic','tesouro_ipca','tesouro_prefixado','poupanca','fundo','acao','fii','etf','cripto','previdencia','outro');
create type public.rate_mode           as enum ('prefixado','pos_cdi','pos_selic','ipca_mais','poupanca','variavel');
create type public.investment_movement_kind as enum ('aporte','resgate','rendimento','imposto','taxa','atualizacao');
create type public.notification_kind   as enum ('fatura_fechando','fatura_vencendo','assinatura_renovando','conta_vencendo','parcela_financiamento','orcamento_excedido','limite_cartao','investimento_vencendo','sistema');

-- ---------------------------------------------------------------------
-- HELPERS
-- ---------------------------------------------------------------------
create or replace function private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- intervalo de cada ciclo de cobrança
create or replace function public.cycle_interval(c public.billing_cycle) returns interval
language sql immutable set search_path = '' as $$
  select case c
    when 'semanal'    then interval '7 days'
    when 'quinzenal'  then interval '15 days'
    when 'mensal'     then interval '1 month'
    when 'bimestral'  then interval '2 months'
    when 'trimestral' then interval '3 months'
    when 'semestral'  then interval '6 months'
    when 'anual'      then interval '1 year'
  end
$$;

-- fator para converter o valor do ciclo em "equivalente mensal"
create or replace function public.cycle_monthly_factor(c public.billing_cycle) returns numeric
language sql immutable set search_path = '' as $$
  select case c
    when 'semanal'    then 365.0/7/12
    when 'quinzenal'  then 365.0/15/12
    when 'mensal'     then 1
    when 'bimestral'  then 1.0/2
    when 'trimestral' then 1.0/3
    when 'semestral'  then 1.0/6
    when 'anual'      then 1.0/12
  end
$$;

-- próxima ocorrência >= p_from a partir de uma data âncora
create or replace function public.next_occurrence(p_anchor date, p_cycle public.billing_cycle, p_from date default current_date)
returns date language plpgsql immutable set search_path = '' as $$
declare k int := 0; d date;
begin
  loop
    d := (p_anchor + public.cycle_interval(p_cycle) * k)::date;
    exit when d >= p_from or k > 5000;
    k := k + 1;
  end loop;
  return d;
end $$;

-- dia do mês limitado ao último dia (ex.: dia 31 em fevereiro -> 28/29)
create or replace function public.clamp_day(p_month date, p_day int) returns date
language sql immutable set search_path = '' as $$
  select (date_trunc('month', p_month)::date
          + (least(p_day, extract(day from (date_trunc('month', p_month) + interval '1 month - 1 day'))::int) - 1))
$$;

-- ---------------------------------------------------------------------
-- PERFIL
-- ---------------------------------------------------------------------
create table public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  full_name          text,
  currency           char(3) not null default 'BRL',
  notify_days_before smallint not null default 3 check (notify_days_before between 0 and 30),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- CONTAS BANCÁRIAS (Banco do Brasil, Nubank, Bradesco, carteira...)
-- ---------------------------------------------------------------------
create table public.accounts (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name                 text not null check (char_length(name) between 1 and 60),
  institution          text,
  type                 public.account_type not null default 'corrente',
  initial_balance      numeric(14,2) not null default 0,
  initial_balance_date date not null default current_date,  -- transações anteriores não afetam o saldo
  color                text,
  icon                 text,
  include_in_total     boolean not null default true,
  sort_order           int not null default 0,
  archived_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (id, user_id)
);
create index accounts_user_idx on public.accounts(user_id);

-- ---------------------------------------------------------------------
-- CARTÕES DE CRÉDITO
-- ---------------------------------------------------------------------
create table public.credit_cards (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name               text not null check (char_length(name) between 1 and 60),
  issuer             text,                       -- Nubank, Itaú...
  brand              text,                       -- visa, mastercard, elo...
  last_digits        text check (last_digits ~ '^[0-9]{4}$'),
  credit_limit       numeric(14,2) not null check (credit_limit >= 0),
  closing_day        smallint not null check (closing_day between 1 and 31),
  due_day            smallint not null check (due_day between 1 and 31),
  payment_account_id uuid,                       -- conta padrão para pagar a fatura
  color              text,
  archived_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (id, user_id),
  foreign key (payment_account_id, user_id) references public.accounts(id, user_id) on delete set null (payment_account_id)
);
create index credit_cards_user_idx on public.credit_cards(user_id);
create index credit_cards_payment_account_idx on public.credit_cards(payment_account_id);

-- Fatura: uma por cartão por mês de vencimento. Criada automaticamente.
create table public.card_invoices (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  card_id         uuid not null,
  reference_month date not null check (extract(day from reference_month) = 1), -- mês do vencimento
  closing_date    date not null,
  due_date        date not null,
  notes           text,
  created_at      timestamptz not null default now(),
  unique (card_id, reference_month),
  unique (id, user_id),
  foreign key (card_id, user_id) references public.credit_cards(id, user_id) on delete cascade
);
create index card_invoices_user_due_idx on public.card_invoices(user_id, due_date);

-- ---------------------------------------------------------------------
-- CATEGORIAS (com subcategorias) e TAGS
-- ---------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  parent_id   uuid,
  name        text not null check (char_length(name) between 1 and 60),
  kind        public.category_kind not null,
  nature      public.category_nature not null default 'variavel',
  color       text,
  icon        text,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, user_id),
  unique nulls not distinct (user_id, parent_id, name),
  foreign key (parent_id, user_id) references public.categories(id, user_id) on delete cascade
);
create index categories_parent_idx on public.categories(parent_id);

create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 40),
  color      text,
  created_at timestamptz not null default now(),
  unique (user_id, name),
  unique (id, user_id)
);

-- Orçamento: category_id NULL = limite global de gastos; month NULL = padrão para todos os meses
create table public.budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id uuid,
  month       date check (month is null or extract(day from month) = 1),
  amount      numeric(14,2) not null check (amount >= 0),
  created_at  timestamptz not null default now(),
  unique nulls not distinct (user_id, category_id, month),
  foreign key (category_id, user_id) references public.categories(id, user_id) on delete cascade
);
create index budgets_category_idx on public.budgets(category_id);

-- ---------------------------------------------------------------------
-- PARCELAMENTOS
-- ---------------------------------------------------------------------
create table public.installment_plans (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users(id) on delete cascade,
  description        text not null,
  card_id            uuid,           -- parcelado no cartão
  account_id         uuid,           -- ou carnê/boleto parcelado debitado de uma conta
  category_id        uuid,
  total_amount       numeric(14,2) not null check (total_amount > 0),
  installment_amount numeric(14,2) not null check (installment_amount > 0),
  installment_count  smallint not null check (installment_count between 1 and 420),
  start_installment  smallint not null default 1,   -- cadastrar compra já em andamento (ex.: parcela 4 de 10)
  first_date         date not null,                 -- data da parcela "start_installment"
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (id, user_id),
  check (num_nonnulls(card_id, account_id) = 1),
  check (start_installment between 1 and installment_count),
  foreign key (card_id, user_id)     references public.credit_cards(id, user_id),
  foreign key (account_id, user_id)  references public.accounts(id, user_id),
  foreign key (category_id, user_id) references public.categories(id, user_id) on delete set null (category_id)
);
create index installment_plans_user_idx on public.installment_plans(user_id);
create index installment_plans_card_idx on public.installment_plans(card_id);
create index installment_plans_account_idx on public.installment_plans(account_id);
create index installment_plans_category_idx on public.installment_plans(category_id);

-- ---------------------------------------------------------------------
-- RECORRÊNCIAS (salário, aluguel, contas fixas, transferências mensais)
-- ---------------------------------------------------------------------
create table public.recurring_rules (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  description     text not null,
  type            public.transaction_type not null check (type in ('receita','despesa','transferencia')),
  amount          numeric(14,2) not null check (amount > 0),
  cycle           public.billing_cycle not null default 'mensal',
  start_date      date not null,     -- âncora: 1ª ocorrência
  end_date        date,
  account_id      uuid,
  to_account_id   uuid,
  card_id         uuid,
  category_id     uuid,
  auto_confirm    boolean not null default false,  -- marca como pago ao chegar a data (débito automático)
  is_active       boolean not null default true,
  generated_until date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (id, user_id),
  check (case type
           when 'transferencia' then account_id is not null and to_account_id is not null and card_id is null and account_id <> to_account_id
           else num_nonnulls(account_id, card_id) = 1 and to_account_id is null end),
  foreign key (account_id, user_id)    references public.accounts(id, user_id),
  foreign key (to_account_id, user_id) references public.accounts(id, user_id),
  foreign key (card_id, user_id)       references public.credit_cards(id, user_id),
  foreign key (category_id, user_id)   references public.categories(id, user_id) on delete set null (category_id)
);
create index recurring_rules_user_idx on public.recurring_rules(user_id);
create index recurring_rules_account_idx on public.recurring_rules(account_id);
create index recurring_rules_to_account_idx on public.recurring_rules(to_account_id);
create index recurring_rules_card_idx on public.recurring_rules(card_id);
create index recurring_rules_category_idx on public.recurring_rules(category_id);

-- ---------------------------------------------------------------------
-- ASSINATURAS (Spotify, Netflix, Google Drive, Prime, Meli+...)
-- ---------------------------------------------------------------------
create table public.subscriptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name            text not null,
  provider        text,              -- slug do catálogo: 'spotify','netflix','google_one'...
  amount          numeric(14,2) not null check (amount > 0),
  cycle           public.billing_cycle not null default 'mensal',
  start_date      date not null,     -- data de uma cobrança (âncora do ciclo)
  end_date        date,              -- última cobrança (cancelamento)
  status          public.subscription_status not null default 'ativa',
  card_id         uuid,
  account_id      uuid,
  category_id     uuid,
  url             text,
  notes           text,
  generated_until date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (id, user_id),
  check (num_nonnulls(card_id, account_id) = 1),
  foreign key (card_id, user_id)     references public.credit_cards(id, user_id),
  foreign key (account_id, user_id)  references public.accounts(id, user_id),
  foreign key (category_id, user_id) references public.categories(id, user_id) on delete set null (category_id)
);
create index subscriptions_user_idx on public.subscriptions(user_id);
create index subscriptions_card_idx on public.subscriptions(card_id);
create index subscriptions_account_idx on public.subscriptions(account_id);
create index subscriptions_category_idx on public.subscriptions(category_id);

create table public.subscription_price_changes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subscription_id uuid not null,
  old_amount      numeric(14,2) not null,
  new_amount      numeric(14,2) not null,
  changed_at      timestamptz not null default now(),
  foreign key (subscription_id, user_id) references public.subscriptions(id, user_id) on delete cascade
);
create index subscription_price_changes_sub_idx on public.subscription_price_changes(subscription_id);
create index subscription_price_changes_user_idx on public.subscription_price_changes(user_id);

-- ---------------------------------------------------------------------
-- FINANCIAMENTOS (PRICE / SAC, amortização extraordinária)
-- ---------------------------------------------------------------------
create table public.financings (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name                     text not null,
  kind                     public.financing_kind not null default 'outro',
  institution              text,
  asset_value              numeric(14,2),
  down_payment             numeric(14,2) not null default 0,
  financed_amount          numeric(14,2) not null check (financed_amount > 0),
  interest_rate            numeric(9,6) not null default 0 check (interest_rate >= 0), -- em %
  rate_period              public.rate_period not null default 'mes',
  cet_annual               numeric(9,6),                                               -- informativo
  system                   public.amortization_system not null default 'price',
  term_months              smallint not null check (term_months between 1 and 480),
  first_due_date           date not null,
  monthly_fees             numeric(14,2) not null default 0,  -- seguros (MIP/DFI), taxa adm.
  paid_installments_before smallint not null default 0,       -- parcelas pagas antes do cadastro
  account_id               uuid not null,                     -- conta de débito
  category_id              uuid,
  status                   text not null default 'ativo' check (status in ('ativo','quitado','cancelado')),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (id, user_id),
  check (paid_installments_before between 0 and term_months),
  foreign key (account_id, user_id)  references public.accounts(id, user_id),
  foreign key (category_id, user_id) references public.categories(id, user_id) on delete set null (category_id)
);
create index financings_user_idx on public.financings(user_id);
create index financings_account_idx on public.financings(account_id);
create index financings_category_idx on public.financings(category_id);

create table public.financing_extra_payments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  financing_id   uuid not null,
  payment_date   date not null,
  amount         numeric(14,2) not null check (amount > 0),
  strategy       text not null default 'reduzir_prazo' check (strategy in ('reduzir_prazo','reduzir_parcela')),
  transaction_id uuid,
  created_at     timestamptz not null default now(),
  foreign key (financing_id, user_id) references public.financings(id, user_id) on delete cascade
);
create index financing_extra_payments_fin_idx on public.financing_extra_payments(financing_id);
create index financing_extra_payments_user_idx on public.financing_extra_payments(user_id);

-- ---------------------------------------------------------------------
-- INVESTIMENTOS
-- ---------------------------------------------------------------------
create table public.investments (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name              text not null,
  kind              public.investment_kind not null,
  institution       text,
  account_id        uuid,                      -- conta/corretora de origem dos aportes
  rate_mode         public.rate_mode not null default 'pos_cdi',
  rate              numeric(9,4),              -- prefixado: % no período | pos_cdi: % do CDI | ipca_mais: spread % a.a.
  rate_period       public.rate_period not null default 'ano',
  start_date        date not null,
  maturity_date     date,
  liquidity         text not null default 'diaria' check (liquidity in ('diaria','no_vencimento','d_mais_n')),
  liquidity_days    smallint,
  tax_exempt        boolean not null default false,  -- ex.: LCI/LCA PF (confira legislação vigente)
  ir_rate_override  numeric(5,2),                    -- alíquota fixa, se não seguir a tabela regressiva
  current_value     numeric(14,2),                   -- última posição informada manualmente
  current_value_at  date,
  status            text not null default 'ativo' check (status in ('ativo','resgatado')),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (id, user_id),
  foreign key (account_id, user_id) references public.accounts(id, user_id) on delete set null (account_id)
);
create index investments_user_idx on public.investments(user_id);
create index investments_account_idx on public.investments(account_id);

create table public.investment_movements (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  investment_id  uuid not null,
  kind           public.investment_movement_kind not null,
  date           date not null,
  amount         numeric(14,2) not null check (amount > 0),
  account_id     uuid,          -- se informado em aporte/resgate, gera transação na conta
  transaction_id uuid,
  notes          text,
  created_at     timestamptz not null default now(),
  foreign key (investment_id, user_id) references public.investments(id, user_id) on delete cascade,
  foreign key (account_id, user_id)    references public.accounts(id, user_id)
);
create index investment_movements_inv_idx on public.investment_movements(investment_id, date);
create index investment_movements_user_idx on public.investment_movements(user_id);
create index investment_movements_account_idx on public.investment_movements(account_id);

-- Taxas de referência (CDI, Selic, IPCA...). user_id NULL = global (atualizada pelo sistema);
-- usuário pode cadastrar a própria taxa, que tem prioridade.
create table public.index_rates (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade,
  code           text not null check (code in ('CDI','SELIC','IPCA','TR')),
  reference_date date not null,
  annual_rate    numeric(9,4) not null,   -- % a.a. (IPCA: acumulado 12m)
  source         text not null default 'manual',
  created_at     timestamptz not null default now(),
  unique nulls not distinct (user_id, code, reference_date)
);
create index index_rates_code_idx on public.index_rates(code, reference_date desc);

-- ---------------------------------------------------------------------
-- TRANSAÇÕES (núcleo do sistema)
-- ---------------------------------------------------------------------
create table public.transactions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type                public.transaction_type not null,
  status              public.transaction_status not null default 'pago',
  description         text not null check (char_length(description) between 1 and 140),
  amount              numeric(14,2) not null check (amount > 0),   -- sempre positivo; o tipo define o sinal
  date                date not null,          -- competência: data da compra / vencimento
  paid_at             date,                   -- quando efetivou no caixa
  account_id          uuid,
  to_account_id       uuid,                   -- destino (transferência)
  card_id             uuid,
  invoice_id          uuid,                   -- preenchido por trigger para compras no cartão
  category_id         uuid,
  installment_plan_id uuid,
  installment_number  smallint,
  installment_total   smallint,
  subscription_id     uuid,
  recurring_rule_id   uuid,
  financing_id        uuid,
  investment_id       uuid,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (id, user_id),
  constraint transactions_shape check (case type
    when 'receita'          then num_nonnulls(account_id, card_id) = 1 and to_account_id is null     -- receita no cartão = estorno
    when 'despesa'          then num_nonnulls(account_id, card_id) = 1 and to_account_id is null
    when 'transferencia'    then account_id is not null and to_account_id is not null and account_id <> to_account_id and card_id is null
    when 'pagamento_fatura' then account_id is not null and invoice_id is not null and card_id is not null and to_account_id is null
    when 'aplicacao'        then account_id is not null and investment_id is not null and card_id is null
    when 'resgate'          then account_id is not null and investment_id is not null and card_id is null
  end),
  constraint transactions_card_invoice check (card_id is null or invoice_id is not null),
  foreign key (account_id, user_id)          references public.accounts(id, user_id),
  foreign key (to_account_id, user_id)       references public.accounts(id, user_id),
  foreign key (card_id, user_id)             references public.credit_cards(id, user_id),
  foreign key (invoice_id, user_id)          references public.card_invoices(id, user_id),
  foreign key (category_id, user_id)         references public.categories(id, user_id) on delete set null (category_id),
  foreign key (installment_plan_id, user_id) references public.installment_plans(id, user_id) on delete cascade,
  foreign key (subscription_id, user_id)     references public.subscriptions(id, user_id) on delete set null (subscription_id),
  foreign key (recurring_rule_id, user_id)   references public.recurring_rules(id, user_id) on delete set null (recurring_rule_id),
  foreign key (financing_id, user_id)        references public.financings(id, user_id) on delete cascade,
  foreign key (investment_id, user_id)       references public.investments(id, user_id) on delete set null (investment_id)
);
create index transactions_user_date_idx    on public.transactions(user_id, date desc);
create index transactions_account_idx      on public.transactions(account_id, date);
create index transactions_to_account_idx   on public.transactions(to_account_id) where to_account_id is not null;
create index transactions_card_idx         on public.transactions(card_id, date) where card_id is not null;
create index transactions_invoice_idx      on public.transactions(invoice_id) where invoice_id is not null;
create index transactions_category_idx     on public.transactions(category_id);
create index transactions_plan_idx         on public.transactions(installment_plan_id) where installment_plan_id is not null;
create index transactions_financing_idx    on public.transactions(financing_id) where financing_id is not null;
create index transactions_investment_idx   on public.transactions(investment_id) where investment_id is not null;
create index transactions_pending_idx      on public.transactions(user_id, date) where status = 'previsto';
create unique index transactions_subscription_occurrence_uq on public.transactions(subscription_id, date) where subscription_id is not null;
create unique index transactions_recurring_occurrence_uq    on public.transactions(recurring_rule_id, date) where recurring_rule_id is not null;

create table public.transaction_tags (
  transaction_id uuid not null,
  tag_id         uuid not null,
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  primary key (transaction_id, tag_id),
  foreign key (transaction_id, user_id) references public.transactions(id, user_id) on delete cascade,
  foreign key (tag_id, user_id)         references public.tags(id, user_id) on delete cascade
);
create index transaction_tags_tag_idx  on public.transaction_tags(tag_id);
create index transaction_tags_user_idx on public.transaction_tags(user_id);

-- vínculos que dependem de transactions
create table public.financing_installments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  financing_id   uuid not null,
  number         smallint not null,
  due_date       date not null,
  amortization   numeric(14,2) not null,
  interest       numeric(14,2) not null,
  fees           numeric(14,2) not null default 0,
  total          numeric(14,2) generated always as (amortization + interest + fees) stored,
  balance_after  numeric(14,2) not null,
  transaction_id uuid,
  unique (financing_id, number),
  foreign key (financing_id, user_id)   references public.financings(id, user_id) on delete cascade,
  foreign key (transaction_id, user_id) references public.transactions(id, user_id) on delete set null (transaction_id)
);
create index financing_installments_user_idx on public.financing_installments(user_id);
create index financing_installments_tx_idx   on public.financing_installments(transaction_id);

alter table public.financing_extra_payments
  add foreign key (transaction_id, user_id) references public.transactions(id, user_id) on delete set null (transaction_id);
create index financing_extra_payments_tx_idx on public.financing_extra_payments(transaction_id);

alter table public.investment_movements
  add foreign key (transaction_id, user_id) references public.transactions(id, user_id) on delete set null (transaction_id);
create index investment_movements_tx_idx on public.investment_movements(transaction_id);

-- ---------------------------------------------------------------------
-- NOTIFICAÇÕES / MENSAGENS
-- ---------------------------------------------------------------------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind       public.notification_kind not null,
  title      text not null,
  body       text,
  ref_table  text,
  ref_id     uuid,
  due_date   date,
  read_at    timestamptz,
  created_at timestamptz not null default now(),
  unique nulls not distinct (user_id, kind, ref_id, due_date)
);
create index notifications_user_unread_idx on public.notifications(user_id, created_at desc) where read_at is null;

-- =====================================================================
-- REGRAS DE NEGÓCIO (triggers)
-- =====================================================================

-- Calcula em qual fatura cai uma compra. Compra NO dia do fechamento ou depois vai para a próxima.
create or replace function public.invoice_dates(
  p_closing_day int, p_due_day int, p_purchase date,
  out reference_month date, out closing_date date, out due_date date)
language plpgsql immutable set search_path = '' as $$
declare m date := date_trunc('month', p_purchase)::date;
begin
  closing_date := public.clamp_day(m, p_closing_day);
  if p_purchase >= closing_date then
    m := (m + interval '1 month')::date;
    closing_date := public.clamp_day(m, p_closing_day);
  end if;
  if p_due_day > p_closing_day then
    due_date := public.clamp_day(m, p_due_day);
  else
    due_date := public.clamp_day((m + interval '1 month')::date, p_due_day);
  end if;
  reference_month := date_trunc('month', due_date)::date;
end $$;

-- Retorna (criando se necessário) a fatura do cartão para a data da compra.
create or replace function public.ensure_invoice(p_card_id uuid, p_date date) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  c record; d record; v_id uuid;
begin
  select id, user_id, closing_day, due_day into c from public.credit_cards where id = p_card_id;
  if not found then raise exception 'Cartão não encontrado' using errcode = 'P0002'; end if;
  select * into d from public.invoice_dates(c.closing_day, c.due_day, p_date);
  insert into public.card_invoices(user_id, card_id, reference_month, closing_date, due_date)
  values (c.user_id, c.id, d.reference_month, d.closing_date, d.due_date)
  on conflict (card_id, reference_month) do nothing
  returning id into v_id;
  if v_id is null then
    select id into v_id from public.card_invoices where card_id = c.id and reference_month = d.reference_month;
  end if;
  return v_id;
end $$;

create or replace function private.transactions_before_write() returns trigger
language plpgsql set search_path = '' as $$
begin
  -- compras/estornos no cartão: vincula à fatura correta
  if new.type in ('receita','despesa') then
    if new.card_id is null then
      new.invoice_id := null;
    elsif new.invoice_id is null
       or (tg_op = 'UPDATE' and new.invoice_id is not distinct from old.invoice_id
           and (new.card_id is distinct from old.card_id or new.date is distinct from old.date)) then
      new.invoice_id := public.ensure_invoice(new.card_id, new.date);
    end if;
  end if;

  -- pagamento de fatura: herda o cartão da fatura
  if new.type = 'pagamento_fatura' and new.invoice_id is not null then
    select card_id into new.card_id from public.card_invoices where id = new.invoice_id;
  end if;

  -- data de efetivação
  if new.status = 'pago' and new.paid_at is null then
    new.paid_at := new.date;
  elsif new.status <> 'pago' then
    new.paid_at := null;
  end if;
  return new;
end $$;

create trigger transactions_before_write
  before insert or update on public.transactions
  for each row execute function private.transactions_before_write();

-- Assinatura alterada: registra mudança de preço e propaga para cobranças futuras previstas
create or replace function private.subscriptions_before_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.amount <> old.amount then
    insert into public.subscription_price_changes(user_id, subscription_id, old_amount, new_amount)
    values (new.user_id, new.id, old.amount, new.amount);
  end if;

  if new.status <> 'ativa' and old.status = 'ativa' then
    delete from public.transactions
     where subscription_id = new.id and status = 'previsto' and date > current_date;
    new.generated_until := current_date;
  elsif new.status = 'ativa' and old.status <> 'ativa' then
    new.generated_until := current_date;   -- volta a gerar a partir de hoje
  elsif (new.amount, new.name, new.card_id, new.account_id, new.category_id)
        is distinct from (old.amount, old.name, old.card_id, old.account_id, old.category_id) then
    update public.transactions
       set amount = new.amount, description = new.name, card_id = new.card_id,
           account_id = new.account_id, category_id = new.category_id, invoice_id = null
     where subscription_id = new.id and status = 'previsto' and date > current_date;
  end if;

  if new.cycle <> old.cycle or new.start_date <> old.start_date then
    delete from public.transactions
     where subscription_id = new.id and status = 'previsto' and date > current_date;
    new.generated_until := current_date;
  end if;
  return new;
end $$;

create trigger subscriptions_before_update
  before update on public.subscriptions
  for each row execute function private.subscriptions_before_update();

create or replace function private.recurring_rules_before_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (new.cycle, new.start_date, new.is_active) is distinct from (old.cycle, old.start_date, old.is_active) then
    delete from public.transactions
     where recurring_rule_id = new.id and status = 'previsto' and date > current_date;
    new.generated_until := current_date;
  elsif (new.amount, new.description, new.account_id, new.to_account_id, new.card_id, new.category_id)
        is distinct from (old.amount, old.description, old.account_id, old.to_account_id, old.card_id, old.category_id) then
    update public.transactions
       set amount = new.amount, description = new.description, account_id = new.account_id,
           to_account_id = new.to_account_id, card_id = new.card_id, category_id = new.category_id, invoice_id = null
     where recurring_rule_id = new.id and status = 'previsto' and date > current_date;
  end if;
  return new;
end $$;

create trigger recurring_rules_before_update
  before update on public.recurring_rules
  for each row execute function private.recurring_rules_before_update();

-- Ao excluir assinatura/recorrência: remove cobranças futuras previstas (o histórico pago fica)
create or replace function private.delete_future_generated() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_table_name = 'subscriptions' then
    delete from public.transactions where subscription_id = old.id and status = 'previsto';
  else
    delete from public.transactions where recurring_rule_id = old.id and status = 'previsto';
  end if;
  return old;
end $$;

create trigger subscriptions_before_delete before delete on public.subscriptions
  for each row execute function private.delete_future_generated();
create trigger recurring_rules_before_delete before delete on public.recurring_rules
  for each row execute function private.delete_future_generated();

-- Aporte/resgate com conta informada gera a transação correspondente
create or replace function private.investment_movements_after_insert() returns trigger
language plpgsql set search_path = '' as $$
declare v_tx uuid; v_name text;
begin
  if new.account_id is not null and new.kind in ('aporte','resgate') and new.transaction_id is null then
    select name into v_name from public.investments where id = new.investment_id;
    insert into public.transactions(user_id, type, status, description, amount, date, account_id, investment_id)
    values (new.user_id,
            case new.kind when 'aporte' then 'aplicacao'::public.transaction_type else 'resgate'::public.transaction_type end,
            case when new.date <= current_date then 'pago'::public.transaction_status else 'previsto'::public.transaction_status end,
            initcap(new.kind::text) || ' — ' || v_name, new.amount, new.date, new.account_id, new.investment_id)
    returning id into v_tx;
    update public.investment_movements set transaction_id = v_tx where id = new.id;
  end if;
  return null;
end $$;

create trigger investment_movements_after_insert after insert on public.investment_movements
  for each row execute function private.investment_movements_after_insert();

create or replace function private.investment_movements_after_delete() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.transaction_id is not null then
    delete from public.transactions where id = old.transaction_id;
  end if;
  return null;
end $$;

create trigger investment_movements_after_delete after delete on public.investment_movements
  for each row execute function private.investment_movements_after_delete();

-- updated_at
do $$
declare t text;
begin
  foreach t in array array['profiles','accounts','credit_cards','categories','installment_plans','recurring_rules',
                           'subscriptions','financings','investments','transactions'] loop
    execute format('create trigger %I before update on public.%I for each row execute function private.set_updated_at()',
                   t || '_updated_at', t);
  end loop;
end $$;

-- =====================================================================
-- VIEWS (security_invoker = respeitam RLS de quem consulta)
-- =====================================================================

-- Movimentos por conta com sinal (+ entra, - sai)
create view public.v_account_movements with (security_invoker = true) as
select t.user_id, t.account_id, t.id as transaction_id, t.type, t.status, t.date, t.paid_at,
       case when t.type in ('receita','resgate') then t.amount else -t.amount end as delta
  from public.transactions t
 where t.account_id is not null and t.card_id is null and t.status <> 'cancelado'
union all
select t.user_id, t.account_id, t.id, t.type, t.status, t.date, t.paid_at, -t.amount
  from public.transactions t
 where t.type = 'pagamento_fatura' and t.status <> 'cancelado'
union all
select t.user_id, t.to_account_id, t.id, t.type, t.status, t.date, t.paid_at, t.amount
  from public.transactions t
 where t.type = 'transferencia' and t.status <> 'cancelado';

create view public.v_account_balances with (security_invoker = true) as
select a.id, a.user_id, a.name, a.institution, a.type, a.color, a.icon, a.include_in_total, a.archived_at, a.sort_order,
       a.initial_balance + coalesce(m.realized, 0)                         as balance,
       a.initial_balance + coalesce(m.realized, 0) + coalesce(m.pending, 0) as projected_balance_month_end
  from public.accounts a
  left join lateral (
    select sum(mv.delta) filter (where mv.status = 'pago') as realized,
           sum(mv.delta) filter (where mv.status = 'previsto'
                                   and mv.date <= (date_trunc('month', current_date) + interval '1 month - 1 day')::date) as pending
      from public.v_account_movements mv
     where mv.account_id = a.id
       and coalesce(mv.paid_at, mv.date) >= a.initial_balance_date
  ) m on true;

create view public.v_invoices with (security_invoker = true) as
select i.id, i.user_id, i.card_id, c.name as card_name, i.reference_month, i.closing_date, i.due_date,
       coalesce(s.charges, 0)                          as total,
       coalesce(s.payments, 0)                         as paid,
       coalesce(s.charges, 0) - coalesce(s.payments, 0) as remaining,
       case
         when coalesce(s.charges, 0) > 0 and coalesce(s.charges, 0) - coalesce(s.payments, 0) <= 0 then 'paga'
         when current_date > i.due_date  then 'vencida'
         when current_date >= i.closing_date then 'fechada'
         else 'aberta'
       end as status
  from public.card_invoices i
  join public.credit_cards c on c.id = i.card_id
  left join lateral (
    select sum(case t.type when 'despesa' then t.amount when 'receita' then -t.amount else 0 end) as charges,
           sum(t.amount) filter (where t.type = 'pagamento_fatura' and t.status = 'pago')          as payments
      from public.transactions t
     where t.invoice_id = i.id and t.status <> 'cancelado'
  ) s on true;

-- Limite: parcelas futuras consomem limite; assinaturas futuras ainda não.
create view public.v_card_limits with (security_invoker = true) as
select c.id, c.user_id, c.name, c.issuer, c.brand, c.color, c.credit_limit, c.closing_day, c.due_day, c.archived_at,
       coalesce(u.used, 0)                  as used,
       c.credit_limit - coalesce(u.used, 0) as available,
       case when c.credit_limit > 0 then round(coalesce(u.used, 0) / c.credit_limit * 100, 1) end as used_pct
  from public.credit_cards c
  left join lateral (
    select sum(case
                 when t.type = 'despesa' and (t.date <= current_date or t.installment_plan_id is not null) then t.amount
                 when t.type = 'receita' and t.date <= current_date then -t.amount
                 when t.type = 'pagamento_fatura' and t.status = 'pago' then -t.amount
                 else 0 end) as used
      from public.transactions t
     where t.card_id = c.id and t.status <> 'cancelado'
  ) u on true;

create view public.v_installment_plans with (security_invoker = true) as
select p.*,
       coalesce(x.paid_count, 0) + p.start_installment - 1                as paid_installments,
       p.installment_count - (coalesce(x.paid_count, 0) + p.start_installment - 1) as remaining_installments,
       coalesce(x.remaining_amount, 0)                                     as remaining_amount,
       x.next_date,
       coalesce(x.remaining_amount, 0) > 0                                 as is_active
  from public.installment_plans p
  left join lateral (
    select count(*) filter (where paid)              as paid_count,
           sum(t.amount) filter (where not paid)     as remaining_amount,
           min(t.date) filter (where not paid)       as next_date
      from (select t.*,
                   case when t.card_id is not null then coalesce(i.due_date < current_date, false)
                        else t.status = 'pago' end as paid
              from public.transactions t
              left join public.card_invoices i on i.id = t.invoice_id
             where t.installment_plan_id = p.id and t.status <> 'cancelado') t
  ) x on true;

create view public.v_subscriptions with (security_invoker = true) as
select s.*,
       round(s.amount * public.cycle_monthly_factor(s.cycle), 2)      as monthly_equivalent,
       round(s.amount * public.cycle_monthly_factor(s.cycle) * 12, 2) as yearly_equivalent,
       case when s.status = 'ativa' then
         nullif(public.next_occurrence(s.start_date, s.cycle, current_date),
                case when s.end_date is not null and public.next_occurrence(s.start_date, s.cycle, current_date) > s.end_date
                     then public.next_occurrence(s.start_date, s.cycle, current_date) end)
       end as next_charge
  from public.subscriptions s;

create view public.v_financings with (security_invoker = true) as
select f.*,
       coalesce(x.paid_count, 0)                         as paid_installments,
       coalesce(x.total_count, 0) - coalesce(x.paid_count, 0) as remaining_installments,
       x.outstanding_balance,
       x.next_due_date,
       x.next_amount,
       x.total_interest_remaining
  from public.financings f
  left join lateral (
    select count(*)                                            as total_count,
           count(*) filter (where paid)                        as paid_count,
           coalesce((array_agg(fi.balance_after order by fi.number desc) filter (where paid))[1], f.financed_amount) as outstanding_balance,
           min(fi.due_date) filter (where not paid)            as next_due_date,
           (array_agg(fi.total order by fi.number) filter (where not paid))[1] as next_amount,
           sum(fi.interest) filter (where not paid)            as total_interest_remaining
      from (select fi.*, (fi.number <= f.paid_installments_before or t.status = 'pago') as paid
              from public.financing_installments fi
              left join public.transactions t on t.id = fi.transaction_id
             where fi.financing_id = f.id) fi
  ) x on true;

create view public.v_investment_positions with (security_invoker = true) as
select i.*,
       coalesce(m.invested, 0)                                 as net_invested,
       coalesce(m.earnings, 0)                                 as net_earnings,
       coalesce(i.current_value, coalesce(m.invested, 0) + coalesce(m.earnings, 0)) as position
  from public.investments i
  left join lateral (
    select sum(case kind when 'aporte' then amount when 'resgate' then -amount else 0 end) as invested,
           sum(case kind when 'rendimento' then amount when 'imposto' then -amount when 'taxa' then -amount else 0 end) as earnings
      from public.investment_movements mv
     where mv.investment_id = i.id
  ) m on true;

create view public.v_latest_rates with (security_invoker = true) as
select distinct on (code) code, annual_rate, reference_date, source, user_id is not null as is_custom
  from public.index_rates
 order by code, (user_id is not null) desc, reference_date desc;

-- Gastos/receitas por mês e categoria (competência). Base para relatórios e exportação.
create view public.v_monthly_by_category with (security_invoker = true) as
select t.user_id,
       date_trunc('month', t.date)::date as month,
       t.type,
       t.category_id,
       c.name  as category_name,
       c.nature,
       pc.name as parent_category_name,
       sum(t.amount) as total,
       count(*)      as count
  from public.transactions t
  left join public.categories c  on c.id = t.category_id
  left join public.categories pc on pc.id = c.parent_id
 where t.type in ('receita','despesa') and t.status <> 'cancelado'
 group by 1, 2, 3, 4, 5, 6, 7;

-- =====================================================================
-- RPCs (chamadas pelo app via supabase.rpc)
-- =====================================================================

-- Cria parcelamento + todas as parcelas. Informe total OU valor da parcela.
create or replace function public.create_installment_plan(
  p_description        text,
  p_installment_count  int,
  p_first_date         date,
  p_total_amount       numeric default null,
  p_installment_amount numeric default null,
  p_card_id            uuid    default null,
  p_account_id         uuid    default null,
  p_category_id        uuid    default null,
  p_start_installment  int     default 1,
  p_notes              text    default null)
returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid; v_total numeric(14,2); v_inst numeric(14,2); v_amount numeric(14,2); v_date date; i int;
begin
  if p_total_amount is null and p_installment_amount is null then
    raise exception 'Informe o valor total ou o valor da parcela';
  end if;
  if p_installment_amount is not null then
    v_inst  := p_installment_amount;
    v_total := coalesce(p_total_amount, p_installment_amount * p_installment_count);
  else
    v_total := p_total_amount;
    v_inst  := round(p_total_amount / p_installment_count, 2);
  end if;

  insert into public.installment_plans(description, card_id, account_id, category_id, total_amount,
                                       installment_amount, installment_count, start_installment, first_date, notes)
  values (p_description, p_card_id, p_account_id, p_category_id, v_total, v_inst,
          p_installment_count, p_start_installment, p_first_date, p_notes)
  returning id into v_id;

  for i in p_start_installment .. p_installment_count loop
    v_date := (p_first_date + interval '1 month' * (i - p_start_installment))::date;
    v_amount := case when p_installment_amount is null and i = p_installment_count
                     then v_total - v_inst * (p_installment_count - 1) else v_inst end;
    insert into public.transactions(type, status, description, amount, date, account_id, card_id, category_id,
                                    installment_plan_id, installment_number, installment_total)
    values ('despesa',
            case when p_card_id is not null and v_date <= current_date then 'pago'::public.transaction_status
                 else 'previsto'::public.transaction_status end,
            p_description || ' (' || i || '/' || p_installment_count || ')',
            v_amount, v_date, p_account_id, p_card_id, p_category_id, v_id, i, p_installment_count);
  end loop;
  return v_id;
end $$;

-- Paga (total ou parcialmente) uma fatura a partir de uma conta.
create or replace function public.pay_invoice(
  p_invoice_id uuid, p_account_id uuid, p_amount numeric default null, p_date date default current_date)
returns uuid
language plpgsql security invoker set search_path = '' as $$
declare v_inv record; v_id uuid; v_amount numeric(14,2);
begin
  select * into v_inv from public.v_invoices where id = p_invoice_id;
  if not found then raise exception 'Fatura não encontrada'; end if;
  v_amount := coalesce(p_amount, v_inv.remaining);
  if v_amount <= 0 then raise exception 'Nada a pagar nesta fatura'; end if;
  insert into public.transactions(type, status, description, amount, date, account_id, invoice_id)
  values ('pagamento_fatura', 'pago',
          'Fatura ' || v_inv.card_name || ' ' || to_char(v_inv.reference_month, 'MM/YYYY'),
          v_amount, p_date, p_account_id, p_invoice_id)
  returning id into v_id;
  return v_id;
end $$;

-- Materializa ocorrências de assinaturas e recorrências até p_until e efetiva o que venceu.
-- Idempotente. Chamar no login / ao abrir o dashboard.
create or replace function public.generate_recurring(p_until date default (current_date + 90))
returns integer
language plpgsql security invoker set search_path = '' as $$
declare
  r record; d date; k int; v_from date; v_n int := 0; v_rows int;
  v_uid uuid := (select auth.uid());
begin
  -- assinaturas
  for r in select * from public.subscriptions
            where user_id = v_uid and status = 'ativa'
              and coalesce(generated_until, '-infinity'::date) < p_until loop
    v_from := coalesce(r.generated_until + 1, date_trunc('month', r.created_at)::date);
    k := 0;
    loop
      d := (r.start_date + public.cycle_interval(r.cycle) * k)::date;
      exit when d > p_until or (r.end_date is not null and d > r.end_date);
      if d >= v_from then
        insert into public.transactions(user_id, type, status, description, amount, date,
                                        account_id, card_id, category_id, subscription_id)
        values (r.user_id, 'despesa', case when d <= current_date then 'pago'::public.transaction_status
                                           else 'previsto'::public.transaction_status end,
                r.name, r.amount, d, r.account_id, r.card_id, r.category_id, r.id)
        on conflict (subscription_id, date) where subscription_id is not null do nothing;
        get diagnostics v_rows = row_count; v_n := v_n + v_rows;
      end if;
      k := k + 1;
    end loop;
    update public.subscriptions set generated_until = p_until where id = r.id;
  end loop;

  -- recorrências (salário, aluguel, contas fixas...)
  for r in select * from public.recurring_rules
            where user_id = v_uid and is_active
              and coalesce(generated_until, '-infinity'::date) < p_until loop
    v_from := coalesce(r.generated_until + 1, date_trunc('month', r.created_at)::date);
    k := 0;
    loop
      d := (r.start_date + public.cycle_interval(r.cycle) * k)::date;
      exit when d > p_until or (r.end_date is not null and d > r.end_date);
      if d >= v_from then
        insert into public.transactions(user_id, type, status, description, amount, date,
                                        account_id, to_account_id, card_id, category_id, recurring_rule_id)
        values (r.user_id, r.type,
                case when r.auto_confirm and d <= current_date then 'pago'::public.transaction_status
                     else 'previsto'::public.transaction_status end,
                r.description, r.amount, d, r.account_id, r.to_account_id, r.card_id, r.category_id, r.id)
        on conflict (recurring_rule_id, date) where recurring_rule_id is not null do nothing;
        get diagnostics v_rows = row_count; v_n := v_n + v_rows;
      end if;
      k := k + 1;
    end loop;
    update public.recurring_rules set generated_until = p_until where id = r.id;
  end loop;

  -- efetiva automaticamente o que já venceu
  update public.transactions t set status = 'pago'
   where t.user_id = v_uid and t.status = 'previsto' and t.date <= current_date
     and (t.card_id is not null and t.type in ('receita','despesa'));

  update public.transactions t set status = 'pago'
    from public.subscriptions s
   where t.subscription_id = s.id and t.user_id = v_uid and t.status = 'previsto' and t.date <= current_date;

  update public.transactions t set status = 'pago'
    from public.recurring_rules rr
   where t.recurring_rule_id = rr.id and rr.auto_confirm and t.user_id = v_uid
     and t.status = 'previsto' and t.date <= current_date;

  return v_n;
end $$;

-- (Re)gera a tabela de parcelas de um financiamento (PRICE, SAC ou sem juros),
-- aplicando amortizações extraordinárias. Parcelas já pagas mantêm a transação original.
create or replace function public.generate_financing_schedule(p_financing_id uuid)
returns integer
language plpgsql security invoker set search_path = '' as $$
declare
  f public.financings%rowtype;
  e record;
  i numeric; bal numeric(14,2); pmt numeric; amort_fixed numeric;
  due date; prev_due date := null; rem int;
  v_interest numeric(14,2); v_amort numeric(14,2);
  v_inst_id uuid; v_tx uuid; v_last int := 0;
begin
  select * into f from public.financings where id = p_financing_id;
  if not found then raise exception 'Financiamento não encontrado'; end if;

  i := case when f.system = 'sem_juros' or f.interest_rate = 0 then 0
            when f.rate_period = 'ano' then power(1 + f.interest_rate / 100, 1.0 / 12) - 1
            else f.interest_rate / 100 end;
  bal := f.financed_amount;
  pmt := case when i = 0 then bal / f.term_months else bal * i / (1 - power(1 + i, -f.term_months)) end;
  amort_fixed := bal / f.term_months;

  for num in 1 .. f.term_months loop
    due := (f.first_due_date + interval '1 month' * (num - 1))::date;
    rem := f.term_months - num + 1;

    for e in select amount, strategy from public.financing_extra_payments
              where financing_id = f.id and (prev_due is null or payment_date > prev_due) and payment_date <= due
              order by payment_date loop
      bal := greatest(bal - e.amount, 0);
      if e.strategy = 'reduzir_parcela' and bal > 0 then
        pmt := case when i = 0 then bal / rem else bal * i / (1 - power(1 + i, -rem)) end;
        amort_fixed := bal / rem;
      end if;
    end loop;
    prev_due := due;
    exit when bal <= 0;

    v_interest := round(bal * i, 2);
    v_amort := case when f.system = 'sac' then round(amort_fixed, 2)
                    else round(pmt - v_interest, 2) end;
    if v_amort > bal or num = f.term_months then v_amort := bal; end if;
    bal := bal - v_amort;

    insert into public.financing_installments(user_id, financing_id, number, due_date, amortization, interest, fees, balance_after)
    values (f.user_id, f.id, num, due, v_amort, v_interest, f.monthly_fees, bal)
    on conflict (financing_id, number) do update
      set due_date = excluded.due_date, amortization = excluded.amortization, interest = excluded.interest,
          fees = excluded.fees, balance_after = excluded.balance_after
    returning id, transaction_id into v_inst_id, v_tx;
    v_last := num;

    if num > f.paid_installments_before then
      if v_tx is null then
        insert into public.transactions(user_id, type, status, description, amount, date, account_id, category_id, financing_id)
        values (f.user_id, 'despesa', 'previsto', f.name || ' (' || num || '/' || f.term_months || ')',
                v_amort + v_interest + f.monthly_fees, due, f.account_id, f.category_id, f.id)
        returning id into v_tx;
        update public.financing_installments set transaction_id = v_tx where id = v_inst_id;
      else
        update public.transactions
           set amount = v_amort + v_interest + f.monthly_fees, date = due, account_id = f.account_id, category_id = f.category_id
         where id = v_tx and status = 'previsto';
      end if;
    end if;
  end loop;

  -- quitação antecipada / redução de prazo: remove o excedente ainda não pago
  delete from public.transactions t
   using public.financing_installments fi
   where fi.financing_id = f.id and fi.number > v_last and t.id = fi.transaction_id and t.status = 'previsto';
  delete from public.financing_installments where financing_id = f.id and number > v_last;

  return v_last;
end $$;

-- Dados da página inicial em uma única chamada.
create or replace function public.get_dashboard(p_month date default current_date)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  m_start date := date_trunc('month', p_month)::date;
  m_end   date := (date_trunc('month', p_month) + interval '1 month - 1 day')::date;
  v_budget numeric; v_spent numeric; v_committed numeric; r jsonb;
begin
  select amount into v_budget from public.budgets
   where category_id is null and (month = m_start or month is null)
   order by month nulls last limit 1;

  -- gastos do mês por competência: despesas em conta + compras no cartão, menos estornos
  select coalesce(sum(case when type = 'despesa' then amount else -amount end)
                  filter (where status = 'pago' or date <= current_date), 0),
         coalesce(sum(case when type = 'despesa' then amount else -amount end), 0)
    into v_spent, v_committed
    from public.transactions
   where date between m_start and m_end and status <> 'cancelado'
     and (type = 'despesa' or (type = 'receita' and card_id is not null));

  select jsonb_build_object(
    'month', m_start,
    'total_balance', (select coalesce(sum(balance), 0) from public.v_account_balances
                       where include_in_total and archived_at is null),
    'projected_balance', (select coalesce(sum(projected_balance_month_end), 0) from public.v_account_balances
                           where include_in_total and archived_at is null),
    'accounts', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'institution', institution,
                                   'color', color, 'balance', balance) order by sort_order, name), '[]')
                   from public.v_account_balances where archived_at is null),
    'cash_flow', (select jsonb_build_object(
          'income_realized',  coalesce(sum(amount) filter (where type = 'receita' and status = 'pago'), 0),
          'income_expected',  coalesce(sum(amount) filter (where type = 'receita'), 0),
          'expense_realized', coalesce(sum(amount) filter (where type in ('despesa','pagamento_fatura') and status = 'pago'), 0),
          'expense_expected', coalesce(sum(amount) filter (where type in ('despesa','pagamento_fatura')), 0))
        from public.transactions
       where account_id is not null and (card_id is null or type = 'pagamento_fatura')
         and status <> 'cancelado' and date between m_start and m_end
         and type in ('receita','despesa','pagamento_fatura')),
    'spending', jsonb_build_object('budget', v_budget,
                                   'spent', v_spent,            -- já gasto (realizado)
                                   'committed', v_committed,    -- realizado + previsto no mês
                                   'remaining', case when v_budget is not null then v_budget - v_committed end),
    'installments', (select jsonb_build_object('active_count', count(*) filter (where is_active),
                                               'remaining_amount', coalesce(sum(remaining_amount), 0),
                                               'month_amount', (select coalesce(sum(amount), 0) from public.transactions
                                                                 where installment_plan_id is not null and status <> 'cancelado'
                                                                   and date between m_start and m_end))
                       from public.v_installment_plans),
    'cards', (select jsonb_build_object('limit', coalesce(sum(credit_limit), 0),
                                        'used', coalesce(sum(used), 0),
                                        'available', coalesce(sum(available), 0),
                                        'items', coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'color', color,
                                                   'limit', credit_limit, 'used', used, 'available', available, 'used_pct', used_pct)), '[]'))
                from public.v_card_limits where archived_at is null),
    'subscriptions', (select jsonb_build_object('active_count', count(*), 'monthly_total', coalesce(sum(monthly_equivalent), 0))
                        from public.v_subscriptions where status = 'ativa'),
    'investments_total', (select coalesce(sum(position), 0) from public.v_investment_positions where status = 'ativo'),
    'top_categories', (select coalesce(jsonb_agg(x order by x.total desc), '[]') from (
                         select category_id, coalesce(category_name, 'Sem categoria') as name, sum(total) as total
                           from public.v_monthly_by_category
                          where month = m_start and type = 'despesa'
                          group by 1, 2 order by 3 desc limit 6) x),
    'upcoming', (select coalesce(jsonb_agg(u order by u.date), '[]') from (
                   select 'transacao' as source, id, description, amount, date, type::text as type
                     from public.transactions
                    where status = 'previsto' and card_id is null and date between current_date and current_date + 10
                   union all
                   select 'fatura', id, 'Fatura ' || card_name, remaining, due_date, 'pagamento_fatura'
                     from public.v_invoices
                    where status in ('fechada','aberta') and remaining > 0 and due_date between current_date and current_date + 10
                   order by date limit 10) u)
  ) into r;
  return r;
end $$;

-- Eventos do calendário (transações + vencimentos de fatura) num intervalo.
create or replace function public.get_calendar(p_from date, p_to date)
returns table (event_date date, source text, ref_id uuid, title text, amount numeric, type text, status text,
               account_id uuid, card_id uuid, category_id uuid)
language sql stable security invoker set search_path = '' as $$
  select t.date, 'transacao', t.id, t.description, t.amount, t.type::text, t.status::text, t.account_id, t.card_id, t.category_id
    from public.transactions t
   where t.date between p_from and p_to and t.status <> 'cancelado' and t.type <> 'pagamento_fatura'
  union all
  select i.due_date, 'fatura', i.id, 'Fatura ' || i.card_name,
         case when i.status = 'paga' then i.total else i.remaining end, 'pagamento_fatura', i.status, null, i.card_id, null
    from public.v_invoices i
   where i.due_date between p_from and p_to and i.total > 0
  union all
  select i.closing_date, 'fechamento', i.id, 'Fechamento ' || i.card_name, i.total, 'fechamento', i.status, null, i.card_id, null
    from public.v_invoices i
   where i.closing_date between p_from and p_to
  order by 1;
$$;

-- =====================================================================
-- CADASTRO DE NOVO USUÁRIO: perfil + categorias padrão
-- =====================================================================
create or replace function private.seed_default_categories(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_parent uuid; rec record;
begin
  for rec in select * from (values
    ('receita','Salário','salario',null::text),
    ('receita','13º e férias','salario',null),
    ('receita','Renda extra','renda_extra',null),
    ('receita','Freelance','renda_extra','Renda extra'),
    ('receita','Rendimentos','renda_extra',null),
    ('receita','Benefícios','beneficio',null),
    ('receita','Reembolsos','reembolso',null),
    ('receita','Ajuste de saldo','ajuste',null),
    ('receita','Outras receitas','outro',null),
    ('despesa','Moradia','fixa',null),
    ('despesa','Aluguel','fixa','Moradia'),
    ('despesa','Condomínio','fixa','Moradia'),
    ('despesa','Contas da casa','fixa',null),
    ('despesa','Energia','fixa','Contas da casa'),
    ('despesa','Água','fixa','Contas da casa'),
    ('despesa','Internet e telefone','fixa','Contas da casa'),
    ('despesa','Alimentação','variavel',null),
    ('despesa','Mercado','variavel','Alimentação'),
    ('despesa','Restaurantes','variavel','Alimentação'),
    ('despesa','Delivery','variavel','Alimentação'),
    ('despesa','Transporte','variavel',null),
    ('despesa','Combustível','variavel','Transporte'),
    ('despesa','App e táxi','variavel','Transporte'),
    ('despesa','Transporte público','variavel','Transporte'),
    ('despesa','Saúde','variavel',null),
    ('despesa','Educação','fixa',null),
    ('despesa','Lazer','variavel',null),
    ('despesa','Assinaturas','fixa',null),
    ('despesa','Compras','variavel',null),
    ('despesa','Pets','variavel',null),
    ('despesa','Presentes e doações','variavel',null),
    ('despesa','Financiamentos','fixa',null),
    ('despesa','Impostos','imposto',null),
    ('despesa','IPVA','imposto','Impostos'),
    ('despesa','IPTU','imposto','Impostos'),
    ('despesa','Imposto de renda','imposto','Impostos'),
    ('despesa','Taxas e tarifas','taxa',null),
    ('despesa','Tarifa bancária','taxa','Taxas e tarifas'),
    ('despesa','Anuidade do cartão','taxa','Taxas e tarifas'),
    ('despesa','IOF','taxa','Taxas e tarifas'),
    ('despesa','Juros e multas','juros',null),
    ('despesa','Ajuste de saldo','ajuste',null),
    ('despesa','Outras despesas','outro',null)
  ) as v(kind, name, nature, parent) loop
    v_parent := null;
    if rec.parent is not null then
      select id into v_parent from public.categories
       where user_id = p_user and name = rec.parent and kind = rec.kind::public.category_kind and parent_id is null;
    end if;
    insert into public.categories(user_id, parent_id, name, kind, nature)
    values (p_user, v_parent, rec.name, rec.kind::public.category_kind, rec.nature::public.category_nature)
    on conflict do nothing;
  end loop;
end $$;

create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name) values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  perform private.seed_default_categories(new.id);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- =====================================================================
-- NOTIFICAÇÕES (rodar diariamente via pg_cron — roda como postgres, todos os usuários)
-- =====================================================================
create or replace function private.generate_notifications() returns integer
language plpgsql security definer set search_path = '' as $$
declare v_n int := 0; v_rows int;
begin
  -- faturas vencendo
  insert into public.notifications(user_id, kind, title, body, ref_table, ref_id, due_date)
  select i.user_id, 'fatura_vencendo', 'Fatura ' || i.card_name || ' vence em ' || to_char(i.due_date, 'DD/MM'),
         'Valor em aberto: R$ ' || to_char(i.remaining, 'FM999G999G990D00'), 'card_invoices', i.id, i.due_date
    from public.v_invoices i join public.profiles p on p.id = i.user_id
   where i.remaining > 0 and i.due_date between current_date and current_date + p.notify_days_before
  on conflict do nothing;
  get diagnostics v_rows = row_count; v_n := v_n + v_rows;

  -- contas/assinaturas/parcelas previstas em conta
  insert into public.notifications(user_id, kind, title, body, ref_table, ref_id, due_date)
  select t.user_id,
         case when t.subscription_id is not null then 'assinatura_renovando'::public.notification_kind
              when t.financing_id   is not null then 'parcela_financiamento'::public.notification_kind
              else 'conta_vencendo'::public.notification_kind end,
         t.description || ' — ' || to_char(t.date, 'DD/MM'),
         'Valor: R$ ' || to_char(t.amount, 'FM999G999G990D00'), 'transactions', t.id, t.date
    from public.transactions t join public.profiles p on p.id = t.user_id
   where t.status = 'previsto' and t.type in ('despesa','transferencia')
     and t.date between current_date and current_date + p.notify_days_before
     and (t.card_id is null or t.subscription_id is not null)
  on conflict do nothing;
  get diagnostics v_rows = row_count; v_n := v_n + v_rows;

  -- limite do cartão acima de 80%
  insert into public.notifications(user_id, kind, title, body, ref_table, ref_id, due_date)
  select c.user_id, 'limite_cartao', 'Limite do ' || c.name || ' em ' || c.used_pct || '%',
         'Disponível: R$ ' || to_char(c.available, 'FM999G999G990D00'), 'credit_cards', c.id,
         date_trunc('month', current_date)::date
    from public.v_card_limits c
   where c.archived_at is null and c.used_pct >= 80
  on conflict do nothing;
  get diagnostics v_rows = row_count; v_n := v_n + v_rows;

  return v_n;
end $$;

-- Para ativar (Dashboard → Database → Extensions → pg_cron):
-- select cron.schedule('notificacoes-diarias', '0 11 * * *', $$select private.generate_notifications()$$);

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.profiles enable row level security;
create policy "perfil: dono lê"      on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "perfil: dono altera"  on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

do $$
declare t text;
begin
  foreach t in array array['accounts','credit_cards','card_invoices','categories','tags','budgets','installment_plans',
                           'recurring_rules','subscriptions','subscription_price_changes','financings',
                           'financing_installments','financing_extra_payments','investments','investment_movements',
                           'transactions','transaction_tags','notifications'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "dono: select" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "dono: insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "dono: update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "dono: delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

alter table public.index_rates enable row level security;
create policy "taxas: lê globais e próprias" on public.index_rates for select to authenticated
  using (user_id is null or (select auth.uid()) = user_id);
create policy "taxas: insere próprias" on public.index_rates for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "taxas: altera próprias" on public.index_rates for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "taxas: exclui próprias" on public.index_rates for delete to authenticated
  using ((select auth.uid()) = user_id);

-- =====================================================================
-- PERMISSÕES DE FUNÇÕES
-- =====================================================================
revoke all on schema private from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;

revoke execute on function public.create_installment_plan(text,int,date,numeric,numeric,uuid,uuid,uuid,int,text) from public, anon;
revoke execute on function public.pay_invoice(uuid,uuid,numeric,date)        from public, anon;
revoke execute on function public.generate_recurring(date)                   from public, anon;
revoke execute on function public.generate_financing_schedule(uuid)          from public, anon;
revoke execute on function public.get_dashboard(date)                        from public, anon;
revoke execute on function public.get_calendar(date,date)                    from public, anon;
revoke execute on function public.ensure_invoice(uuid,date)                  from public, anon;

grant execute on function public.create_installment_plan(text,int,date,numeric,numeric,uuid,uuid,uuid,int,text) to authenticated;
grant execute on function public.pay_invoice(uuid,uuid,numeric,date)        to authenticated;
grant execute on function public.generate_recurring(date)                   to authenticated;
grant execute on function public.generate_financing_schedule(uuid)          to authenticated;
grant execute on function public.get_dashboard(date)                        to authenticated;
grant execute on function public.get_calendar(date,date)                    to authenticated;
grant execute on function public.ensure_invoice(uuid,date)                  to authenticated;

-- Taxas iniciais: VALORES DE EXEMPLO. Atualize em Configurações ou via Edge Function do BCB.
insert into public.index_rates(user_id, code, reference_date, annual_rate, source) values
  (null, 'CDI',   current_date, 14.90, 'seed'),
  (null, 'SELIC', current_date, 15.00, 'seed'),
  (null, 'IPCA',  current_date,  4.80, 'seed'),
  (null, 'TR',    current_date,  1.80, 'seed');
