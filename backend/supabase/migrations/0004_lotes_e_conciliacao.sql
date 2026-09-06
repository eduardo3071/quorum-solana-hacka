-- 0004 · Lotes, e o que falta no ingresso para conciliar um pagamento (B7)
--
-- Fecha o circuito da festa: comprar ingresso vira entrada no livro-caixa sem
-- ninguém digitar nada.
--
-- Dinheiro continua sendo integer em CENTAVOS. O valor em lamports fica numa
-- coluna separada porque é outra unidade, de outra rede, e misturar as duas na
-- mesma coluna é como somar real com centavo.

-- ── Lotes ───────────────────────────────────────────────────────────────
--
-- A prancha 5d mostra três lotes com preço e "restam 48 de 300". `vendidos` é
-- contador denormalizado de propósito: a página da festa abre sem login, e o
-- anônimo não pode ler `ingressos` — lá moram comprador e referência de
-- pagamento. Contar por `count(*)` exigiria expor a tabela inteira ou uma view
-- que fura RLS. Um inteiro que só o servidor incrementa, na mesma chamada que
-- grava o lançamento, resolve sem abrir nada.
create table if not exists public.lotes (
  id             uuid primary key default gen_random_uuid(),
  evento_id      uuid not null references public.eventos(id) on delete cascade,
  nome           text not null,
  preco_centavos integer not null check (preco_centavos >= 0),
  total          integer not null check (total > 0),
  vendidos       integer not null default 0 check (vendidos >= 0),
  ordem          smallint not null default 0,
  unique (evento_id, nome),
  -- Não se vende mais ingresso do que o lote tem. O banco recusa; a tela nem
  -- chega a oferecer.
  constraint lote_nao_estoura check (vendidos <= total)
);

create index if not exists lotes_evento_id_idx on public.lotes (evento_id, ordem);

alter table public.lotes enable row level security;

-- Lote é cartaz: preço e disponibilidade são públicos por definição.
create policy "lotes são públicos"
  on public.lotes for select
  to anon, authenticated
  using (true);

-- Criar e alterar lote é do service role, como todo o resto que mexe em
-- dinheiro. A diretoria fará isso por endpoint, nunca escrevendo direto.


-- ── Ingressos ───────────────────────────────────────────────────────────
alter table public.ingressos
  add column if not exists lote_id      uuid references public.lotes(id) on delete set null,
  add column if not exists lamports     bigint check (lamports is null or lamports > 0),
  add column if not exists tx_signature text,
  add column if not exists lancamento_id uuid references public.lancamentos(id) on delete set null,
  add column if not exists reservado_em timestamptz not null default now();

create index if not exists ingressos_lote_id_idx on public.ingressos (lote_id);

-- Um pagamento gera um lançamento, nunca dois. Se a conciliação for chamada
-- duas vezes — e vai ser, porque a tela consulta em laço —, a segunda não pode
-- criar outra entrada no livro-caixa. É o índice que garante, não o código.
create unique index if not exists ingressos_lancamento_unico
  on public.ingressos (lancamento_id)
  where lancamento_id is not null;


-- ── Semente: o Baile de Aniversário da prancha 5d ───────────────────────
insert into public.eventos (entidade_id, nome, slug, data, local, capacidade)
select e.id,
       'Baile de Aniversário 32 anos',
       'aaaeng-baile32',
       '2026-09-26T23:00:00-03:00',
       'Galpão Beira-Mar',
       1000
  from public.entidades e
 where e.slug = 'aaaeng'
on conflict (slug) do nothing;

insert into public.lotes (evento_id, nome, preco_centavos, total, vendidos, ordem)
select ev.id, v.nome, v.preco, v.total, v.vendidos, v.ordem
  from public.eventos ev,
       (values ('1º lote · sócio',      6000, 300, 300, 1),
               ('2º lote · sócio',      8000, 300, 252, 2),
               ('2º lote · não sócio', 12000, 400, 188, 3))
       as v(nome, preco, total, vendidos, ordem)
 where ev.slug = 'aaaeng-baile32'
on conflict (evento_id, nome) do nothing;
