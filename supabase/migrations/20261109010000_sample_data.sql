-- =====================================================================
-- DADOS DE EXEMPLO para novos usuários + remoção de uma vez.
-- seed_sample_data(): roda no 1º login; só cria se o usuário ainda não tem contas.
-- delete_sample_data(): apaga tudo que foi criado como exemplo (e o que foi
-- lançado dentro das contas/cartões de exemplo).
-- =====================================================================

alter table public.profiles add column sample_seeded_at timestamptz;

-- Registros raiz criados como exemplo.
create table public.sample_records (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  table_name text not null check (table_name in ('accounts','credit_cards','transactions','installment_plans',
                                                  'recurring_rules','subscriptions','financings','investments','budgets')),
  record_id  uuid not null,
  primary key (table_name, record_id)
);
create index sample_records_user_idx on public.sample_records(user_id);

alter table public.sample_records enable row level security;
create policy "dono: select" on public.sample_records for select to authenticated using ((select auth.uid()) = user_id);
create policy "dono: insert" on public.sample_records for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "dono: delete" on public.sample_records for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.seed_sample_data() returns boolean
language plpgsql security invoker set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  m0 date := date_trunc('month', current_date)::date;   -- 1º dia do mês atual
  v_checking uuid; v_savings uuid; v_card uuid; v_id uuid; v_inv uuid;
  -- Categorias vêm do seed_default_categories (busca pelo nome).
  r record;
begin
  if v_uid is null then raise exception 'Sem sessão'; end if;

  -- Marca antes de criar: roda uma única vez por usuário.
  update public.profiles set sample_seeded_at = now() where id = v_uid and sample_seeded_at is null;
  if not found then return false; end if;
  if exists (select 1 from public.accounts where user_id = v_uid) then return false; end if;

  -- Contas
  insert into public.accounts(name, institution, type, initial_balance, initial_balance_date, color, sort_order)
  values ('Conta corrente (exemplo)', 'Banco Exemplo', 'corrente', 3500, (m0 - interval '1 month')::date, '#2563eb', 0)
  returning id into v_checking;
  insert into public.accounts(name, institution, type, initial_balance, initial_balance_date, color, sort_order)
  values ('Poupança (exemplo)', 'Banco Exemplo', 'poupanca', 8000, (m0 - interval '1 month')::date, '#16a34a', 1)
  returning id into v_savings;

  -- Cartão
  insert into public.credit_cards(name, issuer, brand, last_digits, credit_limit, closing_day, due_day, payment_account_id, color)
  values ('Cartão (exemplo)', 'Banco Exemplo', 'mastercard', '1234', 5000, 25, 5, v_checking, '#7c3aed')
  returning id into v_card;

  insert into public.sample_records(table_name, record_id)
  values ('accounts', v_checking), ('accounts', v_savings), ('credit_cards', v_card);

  -- Lançamentos avulsos (conta e cartão)
  for r in select * from (values
      ('despesa', 'Conta de luz',          182.40, 7,  'Energia',      'account'),
      ('despesa', 'Mercado do mês',        412.35, 3,  'Mercado',      'card'),
      ('despesa', 'Jantar fora',            96.80, 10, 'Restaurantes', 'card'),
      ('despesa', 'Combustível',           220.00, 14, 'Combustível',  'card'),
      ('despesa', 'Farmácia',               58.90, 20, 'Saúde',        'account'),
      ('receita', 'Freelance de design',   850.00, 12, 'Freelance',    'account')
    ) as v(type, description, amount, days_ago, category, source) loop
    insert into public.transactions(type, status, description, amount, date, account_id, card_id, category_id)
    values (r.type::public.transaction_type, 'pago', r.description, r.amount, current_date - r.days_ago,
            case when r.source = 'account' then v_checking end,
            case when r.source = 'card' then v_card end,
            (select id from public.categories where user_id = v_uid and name = r.category
              and kind = r.type::public.category_kind limit 1))
    returning id into v_id;
    insert into public.sample_records(table_name, record_id) values ('transactions', v_id);
  end loop;

  -- Transferência para a poupança
  insert into public.transactions(type, status, description, amount, date, account_id, to_account_id)
  values ('transferencia', 'pago', 'Reserva de emergência', 500, current_date - 2, v_checking, v_savings)
  returning id into v_id;
  insert into public.sample_records(table_name, record_id) values ('transactions', v_id);

  -- Recorrências: salário (automático) e aluguel
  insert into public.recurring_rules(description, type, amount, cycle, start_date, account_id, category_id, auto_confirm)
  values ('Salário (exemplo)', 'receita', 5200, 'mensal', (m0 - interval '1 month' + interval '4 days')::date, v_checking,
          (select id from public.categories where user_id = v_uid and name = 'Salário' and kind = 'receita' limit 1), true)
  returning id into v_id;
  insert into public.sample_records(table_name, record_id) values ('recurring_rules', v_id);

  insert into public.recurring_rules(description, type, amount, cycle, start_date, account_id, category_id)
  values ('Aluguel (exemplo)', 'despesa', 1450, 'mensal', (m0 - interval '1 month' + interval '9 days')::date, v_checking,
          (select id from public.categories where user_id = v_uid and name = 'Aluguel' and kind = 'despesa' limit 1))
  returning id into v_id;
  insert into public.sample_records(table_name, record_id) values ('recurring_rules', v_id);

  -- Parcelamento no cartão, já na 3ª de 10
  v_id := public.create_installment_plan(
    p_description => 'Celular (exemplo)', p_installment_count => 10, p_first_date => current_date - 5,
    p_total_amount => 2400, p_card_id => v_card,
    p_category_id => (select id from public.categories where user_id = v_uid and name = 'Compras' and kind = 'despesa' limit 1),
    p_start_installment => 3);
  insert into public.sample_records(table_name, record_id) values ('installment_plans', v_id);

  -- Assinaturas no cartão
  for r in select * from (values ('netflix', 'Netflix', 44.90, 18), ('spotify', 'Spotify', 21.90, 8)) as v(provider, name, amount, days_ago) loop
    insert into public.subscriptions(provider, name, amount, cycle, start_date, card_id, category_id)
    values (r.provider, r.name, r.amount, 'mensal', current_date - r.days_ago, v_card,
            (select id from public.categories where user_id = v_uid and name = 'Assinaturas' and kind = 'despesa' limit 1))
    returning id into v_id;
    insert into public.sample_records(table_name, record_id) values ('subscriptions', v_id);
  end loop;

  -- Financiamento de carro em andamento (6 de 48 pagas)
  insert into public.financings(name, kind, institution, financed_amount, down_payment, interest_rate, rate_period,
                                system, term_months, first_due_date, paid_installments_before, account_id, category_id)
  values ('Carro (exemplo)', 'veiculo', 'Banco Exemplo', 40000, 10000, 1.49, 'mes', 'price', 48,
          (m0 - interval '6 months' + interval '14 days')::date, 6, v_checking,
          (select id from public.categories where user_id = v_uid and name = 'Financiamentos' and kind = 'despesa' limit 1))
  returning id into v_id;
  insert into public.sample_records(table_name, record_id) values ('financings', v_id);
  perform public.generate_financing_schedule(v_id);

  -- Investimento: CDB 110% do CDI com aporte e rendimento (sem mexer no saldo da conta)
  insert into public.investments(name, kind, institution, rate_mode, rate, start_date, maturity_date, liquidity)
  values ('CDB (exemplo)', 'cdb', 'Banco Exemplo', 'pos_cdi', 110, current_date - 200, current_date + 530, 'diaria')
  returning id into v_inv;
  insert into public.investment_movements(investment_id, kind, date, amount)
  values (v_inv, 'aporte', current_date - 200, 5000), (v_inv, 'rendimento', current_date - 5, 412.30);
  insert into public.sample_records(table_name, record_id) values ('investments', v_inv);

  -- Orçamento: limite global e de alimentação
  insert into public.budgets(category_id, month, amount) values (null, null, 4500) returning id into v_id;
  insert into public.sample_records(table_name, record_id) values ('budgets', v_id);
  insert into public.budgets(category_id, month, amount)
  values ((select id from public.categories where user_id = v_uid and name = 'Alimentação' and kind = 'despesa'
            and parent_id is null limit 1), null, 1200)
  returning id into v_id;
  insert into public.sample_records(table_name, record_id) values ('budgets', v_id);

  -- Gera salário, aluguel e assinaturas dos próximos 90 dias.
  perform public.generate_recurring();
  return true;
end $$;

create or replace function public.delete_sample_data() returns integer
language plpgsql security invoker set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_accounts uuid[]; v_cards uuid[]; v_n int;
begin
  if v_uid is null then raise exception 'Sem sessão'; end if;
  select coalesce(array_agg(record_id), '{}') into v_accounts
    from public.sample_records where user_id = v_uid and table_name = 'accounts';
  select coalesce(array_agg(record_id), '{}') into v_cards
    from public.sample_records where user_id = v_uid and table_name = 'credit_cards';
  select count(*) into v_n from public.sample_records where user_id = v_uid;
  if v_n = 0 then return 0; end if;

  delete from public.budgets b using public.sample_records s
   where s.user_id = v_uid and s.table_name = 'budgets' and b.id = s.record_id;

  -- Investimentos (movimentos em cascata; o trigger apaga as transações deles)
  delete from public.investments i using public.sample_records s
   where s.user_id = v_uid and s.table_name = 'investments' and i.id = s.record_id;

  -- Tudo que depende das contas/cartões de exemplo, criado como exemplo ou não.
  delete from public.financings where user_id = v_uid
     and (account_id = any(v_accounts) or id in (select record_id from public.sample_records
                                                  where user_id = v_uid and table_name = 'financings'));
  delete from public.installment_plans where user_id = v_uid
     and (account_id = any(v_accounts) or card_id = any(v_cards)
          or id in (select record_id from public.sample_records where user_id = v_uid and table_name = 'installment_plans'));
  delete from public.subscriptions where user_id = v_uid
     and (account_id = any(v_accounts) or card_id = any(v_cards)
          or id in (select record_id from public.sample_records where user_id = v_uid and table_name = 'subscriptions'));
  delete from public.recurring_rules where user_id = v_uid
     and (account_id = any(v_accounts) or to_account_id = any(v_accounts) or card_id = any(v_cards)
          or id in (select record_id from public.sample_records where user_id = v_uid and table_name = 'recurring_rules'));

  delete from public.transactions where user_id = v_uid
     and (account_id = any(v_accounts) or to_account_id = any(v_accounts) or card_id = any(v_cards)
          or id in (select record_id from public.sample_records where user_id = v_uid and table_name = 'transactions'));
  -- Movimentos de investimentos reais que usavam conta de exemplo perdem o vínculo.
  update public.investment_movements set account_id = null where user_id = v_uid and account_id = any(v_accounts);
  update public.investments set account_id = null where user_id = v_uid and account_id = any(v_accounts);

  delete from public.credit_cards where user_id = v_uid and id = any(v_cards);   -- faturas em cascata
  delete from public.accounts where user_id = v_uid and id = any(v_accounts);

  delete from public.sample_records where user_id = v_uid;
  return v_n;
end $$;

revoke execute on function public.seed_sample_data()   from public, anon;
revoke execute on function public.delete_sample_data() from public, anon;
grant execute on function public.seed_sample_data()   to authenticated;
grant execute on function public.delete_sample_data() to authenticated;
