-- =====================================================================
-- Better Auth: usuários saem do auth.users (Supabase Auth) para public."user".
-- Ids são mantidos, então auth.uid() (sub do JWT assinado pelo app) continua
-- batendo com user_id em todas as tabelas e o RLS segue igual.
-- Schema = núcleo do Better Auth 1.7 com generateId "uuid".
-- =====================================================================

create table public."user" (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  email           text not null unique,
  "emailVerified" boolean not null default false,
  image           text,
  "createdAt"     timestamptz not null default now(),
  "updatedAt"     timestamptz not null default now()
);

create table public.session (
  id          uuid primary key default gen_random_uuid(),
  "expiresAt" timestamptz not null,
  token       text not null unique,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "ipAddress" text,
  "userAgent" text,
  "userId"    uuid not null references public."user"(id) on delete cascade
);
create index session_user_idx on public.session("userId");

create table public.account (
  id                      uuid primary key default gen_random_uuid(),
  "accountId"             text not null,
  "providerId"            text not null,
  "userId"                uuid not null references public."user"(id) on delete cascade,
  "accessToken"           text,
  "refreshToken"          text,
  "idToken"               text,
  "accessTokenExpiresAt"  timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope                   text,
  password                text,
  "createdAt"             timestamptz not null default now(),
  "updatedAt"             timestamptz not null default now()
);
create index account_user_idx on public.account("userId");

create table public.verification (
  id          uuid primary key default gen_random_uuid(),
  identifier  text not null,
  value       text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index verification_identifier_idx on public.verification(identifier);

-- Só o Better Auth (conexão postgres via DATABASE_URL) lê estas tabelas.
-- RLS sem policies + revoke: a API pública nunca expõe senhas/tokens.
alter table public."user"       enable row level security;
alter table public.session      enable row level security;
alter table public.account      enable row level security;
alter table public.verification enable row level security;
revoke all on public."user", public.session, public.account, public.verification
  from anon, authenticated;

-- ---------------------------------------------------------------------
-- Copia os usuários existentes (mesmo id; senha bcrypt verificada pelo app).
-- ---------------------------------------------------------------------
insert into public."user"(id, name, email, "emailVerified", image, "createdAt", "updatedAt")
select u.id,
       coalesce(p.full_name, u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''),
       lower(u.email),
       u.email_confirmed_at is not null,
       u.raw_user_meta_data ->> 'avatar_url',
       u.created_at,
       coalesce(u.updated_at, u.created_at)
  from auth.users u
  left join public.profiles p on p.id = u.id
 where u.email is not null and u.deleted_at is null
on conflict do nothing;

insert into public.account("accountId", "providerId", "userId", password, "createdAt", "updatedAt")
select u.id::text, 'credential', u.id, u.encrypted_password, u.created_at, now()
  from auth.users u
  join public."user" b on b.id = u.id
 where coalesce(u.encrypted_password, '') <> '';

insert into public.account("accountId", "providerId", "userId", "createdAt", "updatedAt")
select coalesce(i.identity_data ->> 'sub', i.provider_id), i.provider, i.user_id, i.created_at, now()
  from auth.identities i
  join public."user" b on b.id = i.user_id
 where i.provider <> 'email';

-- ---------------------------------------------------------------------
-- Todas as FKs para auth.users passam a apontar para public."user".
-- ---------------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select c.conname, c.conrelid::regclass as tbl, a.attname as col
      from pg_constraint c
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
     where c.contype = 'f'
       and c.confrelid = 'auth.users'::regclass
       and c.connamespace = 'public'::regnamespace
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
    execute format(
      'alter table %s add constraint %I foreign key (%I) references public."user"(id) on delete cascade',
      r.tbl, r.conname, r.col);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Novo usuário: perfil + categorias padrão (antes era trigger em auth.users).
-- ---------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;

create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name) values (new.id, nullif(new.name, ''))
  on conflict (id) do nothing;
  perform private.seed_default_categories(new.id);
  return new;
end $$;

create trigger on_user_created
  after insert on public."user"
  for each row execute function private.handle_new_user();

-- Exclusão da própria conta: apaga o usuário do Better Auth (dados em cascata)
-- e o registro antigo do Supabase Auth, se existir.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'Sem sessão'; end if;
  delete from public."user" where id = v_uid;
  delete from auth.users where id = v_uid;
end $$;
