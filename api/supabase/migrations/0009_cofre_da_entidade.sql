-- 0009 · O cofre passa a ser da entidade
--
-- Até aqui o multisig vivia em `backend/.cofre-devnet.json`, um por servidor, e
-- os endpoints não recebiam identificador nenhum: operavam sempre sobre aquele
-- cofre único. `entidades.multisig_pda` existia desde a 0001, era lida em seis
-- lugares e NUNCA escrita. Com duas entidades no banco, as duas apontavam para
-- o mesmo dinheiro.
--
-- Três colunas fecham isso.

-- O endereço do cofre em si. Deriva de `multisig_pda`, mas guardar evita
-- refazer a derivação a cada leitura e deixa a linha legível por quem consulta
-- o banco direto.
alter table public.entidades
  add column if not exists vault_pda text unique;

/*
 * Para onde a saída vai NA DEVNET.
 *
 * `destino` já existe e é o nome do fornecedor ("Som Beira-Mar ME"), que é o
 * que a tela mostra; `chave_pix` é como ele receberia de verdade. Nenhum dos
 * dois é endereço de rede, e a demonstração precisa de um para a transferência
 * existir. Fica por proposta, e não por entidade, porque cada saída vai para um
 * fornecedor diferente.
 *
 * Nome explícito: quem ler esta coluna daqui a seis meses precisa entender na
 * hora que ela é da devnet e não vira conta bancária de ninguém.
 */
alter table public.propostas
  add column if not exists destino_devnet text;

-- `tx_index` já existia, com `unique (entidade_id, tx_index)` desde a 0001.
-- Nada a fazer: ela só estava sempre nula porque ninguém criava a proposta na
-- rede.

comment on column public.entidades.multisig_pda is
  'Endereço do cofre 2-de-3 na devnet. Escrito por POST /api/cofre.';
comment on column public.entidades.vault_pda is
  'Endereço do caixa dentro do cofre — é dele que a saída sai.';
comment on column public.propostas.destino_devnet is
  'Destino da transferência na devnet. Não é conta bancária: ver 0009.';
