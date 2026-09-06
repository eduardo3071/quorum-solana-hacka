-- Quórum · schema inicial (prompt B3)
--
-- Sete tabelas, nenhuma a mais. RLS ligado em todas, sem exceção.
-- Todo valor monetário é integer em CENTAVOS. Nunca float. Nunca.

create extension if not exists "pgcrypto";

-- ── Domínios ────────────────────────────────────────────────────────────
create type public.tipo_entidade as enum ('atletica', 'formatura', 'ej', 'ca');
create type public.papel_membro  as enum ('presidente', 'tesoureiro', 'conselho', 'socio');
create type public.tipo_lancamento as enum ('entrada', 'saida');
create type public.status_ingresso as enum ('reservado', 'pago', 'usado');
create type public.status_proposta as enum ('pendente', 'aprovada', 'executada', 'rejeitada');

-- Rubrica é categoria contábil — nunca sinônimo de assinatura.
-- Cada uma tem cor fixa em todo o produto: Eventos azul · Marketing âmbar ·
-- Esporte verde · Associados roxo.
create type public.rubrica as enum ('Eventos', 'Marketing', 'Esporte', 'Associados');


-- ── Tabelas ─────────────────────────────────────────────────────────────

create table public.entidades (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  slug          text not null unique,
  tipo          public.tipo_entidade not null,
  universidade  text,
  multisig_pda  text unique,              -- endereço do cofre na devnet
  publico       boolean not null default true,  -- livro-caixa aberto?
  criado_em     timestamptz not null default now()
);

create table public.membros (
  id          uuid primary key default gen_random_uuid(),
  entidade_id uuid not null references public.entidades(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  nome        text not null,
  papel       public.papel_membro not null,
  pubkey      text,                       -- chave pública do signatário
  ativo       boolean not null default true,
  unique (entidade_id, user_id)
);

create table public.eventos (
  id          uuid primary key default gen_random_uuid(),
  entidade_id uuid not null references public.entidades(id) on delete cascade,
  nome        text not null,
  slug        text not null unique,
  data        timestamptz not null,
  local       text,
  capacidade  integer check (capacidade is null or capacidade > 0)
);

create table public.ingressos (
  id            uuid primary key default gen_random_uuid(),
  evento_id     uuid not null references public.eventos(id) on delete cascade,
  lote          text not null,
  preco_centavos integer not null check (preco_centavos >= 0),
  comprador_id  uuid references auth.users(id) on delete set null,
  status        public.status_ingresso not null default 'reservado',
  referencia    text not null unique,     -- referência única de pagamento
  pago_em       timestamptz
);

create table public.lancamentos (
  id            uuid primary key default gen_random_uuid(),
  entidade_id   uuid not null references public.entidades(id) on delete cascade,
  tipo          public.tipo_lancamento not null,
  valor_centavos integer not null check (valor_centavos > 0),
  rubrica       public.rubrica not null,
  descricao     text not null,
  tx_signature  text,                     -- comprovante da transação
  criado_em     timestamptz not null default now()
);

create table public.propostas (
  id            uuid primary key default gen_random_uuid(),
  entidade_id   uuid not null references public.entidades(id) on delete cascade,
  criado_por    uuid not null references public.membros(id) on delete restrict,
  destino       text not null,            -- "Som Beira-Mar ME"
  chave_pix     text not null,
  valor_centavos integer not null check (valor_centavos > 0),
  rubrica       public.rubrica not null,
  tx_index      bigint,                   -- índice da transação no multisig
  status        public.status_proposta not null default 'pendente',
  criado_em     timestamptz not null default now(),
  unique (entidade_id, tx_index)
);

create table public.assinaturas (
  id          uuid primary key default gen_random_uuid(),
  proposta_id uuid not null references public.propostas(id) on delete cascade,
  membro_id   uuid not null references public.membros(id) on delete restrict,
  assinado_em timestamptz not null default now(),
  tx_signature text,
  -- O quórum conta assinaturas distintas: ninguém assina duas vezes.
  unique (proposta_id, membro_id)
);

create index on public.membros (entidade_id);
create index on public.membros (user_id);
create index on public.eventos (entidade_id);
create index on public.ingressos (evento_id);
create index on public.ingressos (comprador_id);
create index on public.lancamentos (entidade_id, criado_em desc);
create index on public.propostas (entidade_id, status);
create index on public.assinaturas (proposta_id);


-- ── Helpers de autorização ──────────────────────────────────────────────
--
-- SECURITY DEFINER de propósito: estas funções leem `membros` por dentro das
-- políticas que protegem `membros`. Sem o definer, a política se consultaria a
-- si mesma e o Postgres estoura com recursão infinita.
-- `search_path` fixo para que ninguém redirecione as tabelas por baixo.

create or replace function public.entidades_do_usuario()
returns setof uuid
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select entidade_id
  from public.membros
  where user_id = auth.uid() and ativo
$$;

create or replace function public.tem_papel(
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
    where user_id = auth.uid()
      and entidade_id = p_entidade
      and ativo
      and papel = any(p_papeis)
  )
$$;

revoke execute on function public.entidades_do_usuario() from public;
revoke execute on function public.tem_papel(uuid, public.papel_membro[]) from public;
grant execute on function public.entidades_do_usuario() to authenticated;
grant execute on function public.tem_papel(uuid, public.papel_membro[]) to authenticated;


-- ── RLS ligado em todas as tabelas, sem exceção ─────────────────────────

alter table public.entidades   enable row level security;
alter table public.membros     enable row level security;
alter table public.eventos     enable row level security;
alter table public.ingressos   enable row level security;
alter table public.lancamentos enable row level security;
alter table public.propostas   enable row level security;
alter table public.assinaturas enable row level security;

-- Sem política que permita, ninguém escreve. As escritas de dinheiro passam
-- todas pelo service role, depois da execução on-chain — é o servidor que
-- registra o que a rede confirmou, nunca o cliente.


-- entidades ─────────────────────────────────────────────────────────────
-- A página pública precisa resolver o slug para mostrar o cabeçalho.
create policy "entidades públicas são legíveis por qualquer um"
  on public.entidades for select
  to anon, authenticated
  using (publico = true);

create policy "membro lê a própria entidade"
  on public.entidades for select
  to authenticated
  using (id in (select public.entidades_do_usuario()));


-- membros ───────────────────────────────────────────────────────────────
-- Nada para anon: `pubkey` mora aqui ao lado de nome e papel, e a regra é
-- não expor chave junto de dado pessoal. As páginas públicas não precisam
-- da lista de membros.
create policy "membro vê os colegas da própria entidade"
  on public.membros for select
  to authenticated
  using (entidade_id in (select public.entidades_do_usuario()));


-- eventos ───────────────────────────────────────────────────────────────
-- A página da festa abre sem login.
create policy "eventos são públicos"
  on public.eventos for select
  to anon, authenticated
  using (true);


-- ingressos ─────────────────────────────────────────────────────────────
create policy "comprador vê o próprio ingresso"
  on public.ingressos for select
  to authenticated
  using (comprador_id = (select auth.uid()));

create policy "diretoria vê os ingressos da própria entidade"
  on public.ingressos for select
  to authenticated
  using (
    exists (
      select 1
      from public.eventos e
      where e.id = ingressos.evento_id
        and public.tem_papel(
          e.entidade_id,
          array['presidente', 'tesoureiro', 'conselho']::public.papel_membro[]
        )
    )
  );

-- Reserva e pagamento passam pelo endpoint de conciliação (service role):
-- quem paga não escreve o próprio status.


-- lancamentos ───────────────────────────────────────────────────────────
-- O livro-caixa público é a tese do produto: abre sem login, para qualquer um.
create policy "livro-caixa de entidade pública é legível por qualquer um"
  on public.lancamentos for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.entidades e
      where e.id = lancamentos.entidade_id
        and e.publico = true
    )
  );

create policy "membro lê os lançamentos da própria entidade"
  on public.lancamentos for select
  to authenticated
  using (entidade_id in (select public.entidades_do_usuario()));

-- INSERT e UPDATE: só service role. Um lançamento só nasce depois que a rede
-- confirmou a saída, e quem registra isso é o servidor.


-- propostas ─────────────────────────────────────────────────────────────
create policy "membro lê as propostas da própria entidade"
  on public.propostas for select
  to authenticated
  using (entidade_id in (select public.entidades_do_usuario()));

create policy "signatário propõe saída na própria entidade"
  on public.propostas for insert
  to authenticated
  with check (
    public.tem_papel(
      entidade_id,
      array['presidente', 'tesoureiro', 'conselho']::public.papel_membro[]
    )
    and criado_por in (
      select m.id from public.membros m
      where m.user_id = (select auth.uid()) and m.entidade_id = propostas.entidade_id
    )
  );

-- A mudança de status acompanha o que aconteceu on-chain: só service role.


-- assinaturas ───────────────────────────────────────────────────────────
create policy "membro lê as assinaturas da própria entidade"
  on public.assinaturas for select
  to authenticated
  using (
    exists (
      select 1
      from public.propostas p
      where p.id = assinaturas.proposta_id
        and p.entidade_id in (select public.entidades_do_usuario())
    )
  );

-- Sócio não assina. Só presidente, tesoureiro e conselho — e só em nome
-- próprio: `membro_id` tem que ser o registro do próprio usuário.
create policy "só signatário assina, e só por si"
  on public.assinaturas for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.propostas p
      join public.membros m on m.id = assinaturas.membro_id
      where p.id = assinaturas.proposta_id
        and m.user_id = (select auth.uid())
        and m.entidade_id = p.entidade_id
        and m.ativo
        and m.papel in ('presidente', 'tesoureiro', 'conselho')
    )
  );

-- Assinatura não se apaga nem se edita: o histórico do cofre é imutável.
