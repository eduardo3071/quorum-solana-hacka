import { PublicKey } from '@solana/web3.js';

import { criarClienteServiceRole } from '@/lib/supabase/server';

/**
 * O cofre da entidade, lido do banco.
 *
 * Substitui `.cofre-devnet.json` como fonte de verdade. Aquele arquivo era um
 * cofre por SERVIDOR: duas entidades apontavam para o mesmo dinheiro, e a
 * Vercel, que não guarda disco entre invocações, perdia o estado a cada deploy.
 *
 * A service role é a certa aqui: quem chama já passou por `exigirMembro`, e a
 * decisão de acesso foi tomada lá. Repetir a checagem por RLS só esconderia
 * "cofre não existe" atrás de "linha não encontrada", que são coisas
 * diferentes para quem lê a mensagem.
 */

export type CofreDaEntidade = {
  entidadeId: string;
  multisigPda: PublicKey;
  vaultPda: PublicKey;
};

/** Erro de configuração: o servidor está certo, o cofre é que não existe. */
export class SemCofre extends Error {
  constructor(nome: string) {
    super(
      `${nome} ainda não tem cofre. Crie um em Cofre → criar, ou por POST /api/cofre.`,
    );
    this.name = 'SemCofre';
  }
}

export async function cofreDaEntidade(
  entidadeId: string,
  nome = 'Esta entidade',
): Promise<CofreDaEntidade> {
  const { data, error } = await criarClienteServiceRole()
    .from('entidades')
    .select('id, nome, multisig_pda, vault_pda')
    .eq('id', entidadeId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.multisig_pda || !data.vault_pda) throw new SemCofre(data?.nome ?? nome);

  return {
    entidadeId: data.id,
    multisigPda: new PublicKey(data.multisig_pda),
    vaultPda: new PublicKey(data.vault_pda),
  };
}

/**
 * Aponta a entidade para um cofre novo — e solta as propostas do antigo.
 *
 * `propostas.tx_index` é um índice DENTRO de um multisig; ele não significa
 * nada fora dele. Trocar o cofre sem limpar os índices deixava cada proposta
 * apontando para uma proposta que não existe no cofre novo, e `situacao()`
 * estourava ao procurá-la — 503 na tela, "não conseguimos ler o cofre agora",
 * sem nada quebrado na rede.
 *
 * Pior: era uma armadilha sem saída. `POST /api/proposta` é idempotente e
 * desiste quando `tx_index` já tem valor, então a proposta ficava presa para
 * sempre num cofre que não é mais o da entidade, e nenhum botão da tela a
 * tirava de lá.
 *
 * Zerar é o certo, e não perde nada: a saída antiga continua na devnet, não
 * assinada e sem executar, e a linha do banco volta ao estado "existe no livro,
 * ainda não foi levada ao cofre" — que tem tela e botão próprios.
 */
export async function gravarCofreDaEntidade(
  entidadeId: string,
  multisigPda: PublicKey,
  vaultPda: PublicKey,
) {
  const supabase = criarClienteServiceRole();

  const { error } = await supabase
    .from('entidades')
    .update({ multisig_pda: multisigPda.toBase58(), vault_pda: vaultPda.toBase58() })
    .eq('id', entidadeId);

  if (error) throw error;

  const { error: erroPropostas } = await supabase
    .from('propostas')
    .update({ tx_index: null, destino_devnet: null })
    .eq('entidade_id', entidadeId)
    .not('tx_index', 'is', null);

  if (erroPropostas) throw erroPropostas;
}

/* ── A proposta ─────────────────────────────────────────────────────────── */

export type PropostaDoBanco = {
  id: string;
  entidadeId: string;
  destino: string;
  valorCentavos: number;
  rubrica: string;
  status: string;
  txIndex: bigint | null;
  destinoDevnet: PublicKey | null;
};

export class SemProposta extends Error {
  constructor() {
    super('Essa proposta não existe mais.');
    this.name = 'SemProposta';
  }
}

/**
 * Todo id daqui é UUID, e quem manda o id é a URL — ou seja, qualquer um.
 *
 * Sem esta conferência, `?proposta=teste` chegava ao Postgres, que respondia
 * 22P02 (`invalid input syntax for type uuid`), e o `throw error` abaixo
 * transformava um id malformado em 503 "não conseguimos ler o cofre agora" —
 * a mesma frase de um RPC fora do ar. Duas coisas opostas com a mesma cara:
 * uma é a rede que caiu, a outra é um texto que nunca poderia existir no banco.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Carrega a proposta e confere que ela é da entidade de quem chama.
 *
 * A conferência não é redundante com `exigirMembro`: aquela responde "você é da
 * entidade X?", esta responde "a proposta que você mandou é da entidade X?".
 * Sem as duas, um signatário de uma atlética assinaria a saída de outra só
 * mandando o id — e o id de uma proposta não é segredo, aparece na tela.
 */
export async function propostaDaEntidade(
  propostaId: string,
  entidadeId: string,
): Promise<PropostaDoBanco> {
  // Id que não tem forma de UUID não existe no banco por definição: é o mesmo
  // "não achei" de uma busca que voltou vazia, e não vale uma ida ao Postgres.
  if (!UUID.test(propostaId)) throw new SemProposta();

  const { data, error } = await criarClienteServiceRole()
    .from('propostas')
    .select('id, entidade_id, destino, valor_centavos, rubrica, status, tx_index, destino_devnet')
    .eq('id', propostaId)
    .eq('entidade_id', entidadeId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new SemProposta();

  return {
    id: data.id,
    entidadeId: data.entidade_id,
    destino: data.destino,
    valorCentavos: data.valor_centavos,
    rubrica: data.rubrica,
    status: data.status,
    txIndex: data.tx_index === null ? null : BigInt(data.tx_index),
    destinoDevnet: data.destino_devnet ? new PublicKey(data.destino_devnet) : null,
  };
}

export async function gravarPropostaNaRede(
  propostaId: string,
  txIndex: bigint,
  destinoDevnet: PublicKey,
) {
  const { error } = await criarClienteServiceRole()
    .from('propostas')
    .update({
      tx_index: txIndex.toString(),
      destino_devnet: destinoDevnet.toBase58(),
    })
    .eq('id', propostaId);

  if (error) throw error;
}

/* ── O que a assinatura e a execução deixam registrado ──────────────────── */

/**
 * Registra a assinatura.
 *
 * `unique (proposta_id, membro_id)` no banco impede a mesma pessoa de contar
 * duas vezes — o quórum conta assinaturas distintas. Um conflito aqui não é
 * erro: é a segunda tentativa da mesma pessoa, e a rede já teria recusado
 * também. Por isso o `upsert` em vez de `insert`: a tela recebe a situação
 * atual em vez de uma mensagem de erro que não ajuda ninguém.
 */
export async function registrarAssinatura(
  propostaId: string,
  membroId: string,
  txSignature: string,
) {
  const { error } = await criarClienteServiceRole()
    .from('assinaturas')
    .upsert(
      { proposta_id: propostaId, membro_id: membroId, tx_signature: txSignature },
      { onConflict: 'proposta_id,membro_id' },
    );

  if (error) throw error;
}

/**
 * Fecha a proposta e lança a saída no livro-caixa.
 *
 * A ORDEM importa, e é a mesma lição da conciliação de ingresso: primeiro vira
 * o status condicionado a ele ainda estar `pendente`, e só quem ganhar essa
 * corrida grava o lançamento. Ao contrário, duas execuções simultâneas — dois
 * toques, duas abas — lançariam a mesma saída duas vezes, e o livro-caixa de um
 * produto que existe para ser confiável passaria a mentir.
 *
 * Devolve `false` quando outra execução chegou antes. Não é erro: a saída
 * aconteceu, só não foi esta chamada que a registrou.
 */
export async function registrarExecucao(proposta: {
  id: string;
  entidadeId: string;
  destino: string;
  valorCentavos: number;
  rubrica: string;
  txSignature: string;
}): Promise<boolean> {
  const supabase = criarClienteServiceRole();

  const { data: ganhou, error: erroStatus } = await supabase
    .from('propostas')
    .update({ status: 'executada' })
    .eq('id', proposta.id)
    .eq('status', 'pendente')
    .select('id')
    .maybeSingle();

  if (erroStatus) throw erroStatus;
  if (!ganhou) return false;

  const { error } = await supabase.from('lancamentos').insert({
    entidade_id: proposta.entidadeId,
    tipo: 'saida',
    valor_centavos: proposta.valorCentavos,
    rubrica: proposta.rubrica,
    descricao: proposta.destino,
    tx_signature: proposta.txSignature,
  });

  if (error) throw error;
  return true;
}
