-- Exclusão da própria conta: apaga o usuário do Auth; todas as tabelas têm
-- user_id ... on delete cascade, então os dados vão junto.
-- security definer porque auth.users não é acessível ao papel authenticated;
-- só apaga o próprio usuário (auth.uid()). As fotos do Storage são removidas pelo app antes.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'Sem sessão'; end if;
  delete from auth.users where id = v_uid;
end $$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
