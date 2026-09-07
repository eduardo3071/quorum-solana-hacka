-- Tira as funções auxiliares do schema exposto pela API.
--
-- Elas são SECURITY DEFINER por necessidade: leem `membros` por dentro das
-- políticas que protegem `membros`, e sem o definer a política se consultaria a
-- si mesma e o Postgres estoura com recursão.
--
-- Só que `public` é publicado pelo PostgREST, então cada função virava um
-- endpoint /rest/v1/rpc/ — quatro alertas nos advisors de segurança. Revogar de
-- `authenticated` não serve: as políticas são avaliadas com o papel de quem
-- consulta, e sem EXECUTE elas parariam de funcionar. A saída é o schema
-- `privado`, que a API não publica: as políticas continuam chamando, e ninguém
-- alcança por HTTP.
--
-- Aproveita para envolver `auth.uid()` em subconsulta. O Postgres passa a
-- avaliá-la uma vez por consulta em vez de uma vez por linha.

create schema if not exists privado;

revoke all on schema privado from public, anon;
grant usage on schema privado to authenticated;

create function privado.entidades_do_usuario()
returns setof uuid
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select entidade_id
  from public.membros
  where user_id = (select auth.uid()) and ativo
$$;

create function privado.tem_papel(
  p_entidade uuid,
  p_papeis public.papel_membro[]
)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.membros
    where user_id = (select auth.uid())
      and entidade_id = p_entidade
      and ativo
      and papel = any(p_papeis)
  )
$$;

revoke execute on function privado.entidades_do_usuario() from public, anon;
revoke execute on function privado.tem_papel(uuid, public.papel_membro[]) from public, anon;
grant execute on function privado.entidades_do_usuario() to authenticated;
grant execute on function privado.tem_papel(uuid, public.papel_membro[]) to authenticated;


-- ── Políticas recriadas apontando para o schema privado ─────────────────

drop policy "membro le a propria entidade" on public.entidades;
create policy "membro le a propria entidade"
  on public.entidades for select
  to authenticated
  using (id in (select privado.entidades_do_usuario()));

drop policy "membro ve os colegas da propria entidade" on public.membros;
create policy "membro ve os colegas da propria entidade"
  on public.membros for select
  to authenticated
  using (entidade_id in (select privado.entidades_do_usuario()));

drop policy "diretoria ve os ingressos da propria entidade" on public.ingressos;
create policy "diretoria ve os ingressos da propria entidade"
  on public.ingressos for select
  to authenticated
  using (
    exists (
      select 1
      from public.eventos e
      where e.id = ingressos.evento_id
        and privado.tem_papel(
          e.entidade_id,
          array['presidente', 'tesoureiro', 'conselho']::public.papel_membro[]
        )
    )
  );

drop policy "membro le os lancamentos da propria entidade" on public.lancamentos;
create policy "membro le os lancamentos da propria entidade"
  on public.lancamentos for select
  to authenticated
  using (entidade_id in (select privado.entidades_do_usuario()));

drop policy "membro le as propostas da propria entidade" on public.propostas;
create policy "membro le as propostas da propria entidade"
  on public.propostas for select
  to authenticated
  using (entidade_id in (select privado.entidades_do_usuario()));

drop policy "signatario propoe saida na propria entidade" on public.propostas;
create policy "signatario propoe saida na propria entidade"
  on public.propostas for insert
  to authenticated
  with check (
    privado.tem_papel(
      entidade_id,
      array['presidente', 'tesoureiro', 'conselho']::public.papel_membro[]
    )
    and criado_por in (
      select m.id from public.membros m
      where m.user_id = (select auth.uid()) and m.entidade_id = propostas.entidade_id
    )
  );

drop policy "membro le as assinaturas da propria entidade" on public.assinaturas;
create policy "membro le as assinaturas da propria entidade"
  on public.assinaturas for select
  to authenticated
  using (
    exists (
      select 1
      from public.propostas p
      where p.id = assinaturas.proposta_id
        and p.entidade_id in (select privado.entidades_do_usuario())
    )
  );

drop function public.entidades_do_usuario();
drop function public.tem_papel(uuid, public.papel_membro[]);
