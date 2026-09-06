-- 0003 · E-mail do membro, para o magic link achar a pessoa
--
-- Aplicada no projeto como 20260905185025_email_do_membro_para_magic_link.
--
-- O magic link entrega um `auth.users` com e-mail e nada mais. A diretoria é
-- cadastrada antes de qualquer um entrar, então é o e-mail que casa a sessão
-- com a linha de `membros` — e o casamento acontece uma vez só, na primeira
-- visita, por `privado.vincular_membro()`.

alter table public.membros
  add column if not exists email text;

-- Duas pessoas da mesma entidade não podem ter o mesmo e-mail; entidades
-- diferentes podem repetir (a mesma pessoa pode estar em duas). Comparação sem
-- caixa, porque e-mail não distingue maiúscula.
create unique index if not exists membros_email_por_entidade
  on public.membros (entidade_id, lower(email))
  where email is not null;

-- Diretoria do cenário.
update public.membros set email = 'leticia.marchetti@grad.ufsc.br'
 where papel = 'presidente' and email is null;
update public.membros set email = 'marina.salgado@grad.ufsc.br'
 where papel = 'tesoureiro' and email is null;
update public.membros set email = 'rafael.tonetto@grad.ufsc.br'
 where papel = 'conselho' and email is null;

/*
 * Liga a sessão à diretoria.
 *
 * Fica em `privado` — schema que o PostgREST não publica — pelo mesmo motivo
 * da 0002: é SECURITY DEFINER, e função SECURITY DEFINER exposta em
 * /rest/v1/rpc/ é superfície de ataque à toa.
 *
 * Só preenche `user_id` quando está nulo. Uma linha já vinculada nunca é
 * reapontada, então ninguém assume o lugar de outra pessoa trocando de e-mail.
 */
create or replace function privado.vincular_membro()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid   := auth.uid();
  v_email text;
begin
  if v_uid is null then
    return;
  end if;

  select email into v_email from auth.users where id = v_uid;
  if v_email is null then
    return;
  end if;

  update public.membros
     set user_id = v_uid
   where lower(email) = lower(v_email)
     and user_id is null;
end;
$$;

revoke all on function privado.vincular_membro() from public;
grant execute on function privado.vincular_membro() to authenticated;
