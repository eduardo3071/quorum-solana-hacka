/**
 * O dinheiro ENTRANDO no cofre da entidade.
 *
 * Até aqui o cofre só sabia sair: proposta, quórum, execução. Faltava a outra
 * metade — uma chave própria de cada entidade para receber, e a leitura do que
 * caiu nela virando entrada no livro-caixa.
 *
 * A chave de recebimento NÃO é uma chave nova: é o caixa do próprio cofre
 * (`entidades.vault_pda`). Criar um endereço separado só para receber seria
 * criar dinheiro fora do quórum — o que entra tem de nascer atrás das duas
 * assinaturas, igual ao que já entra por venda de ingresso.
 *
 * Este módulo lê chave privada nenhuma, mas importa biblioteca de rede: só
 * Route Handler com `export const runtime = 'nodejs'`.
 */
import 'server-only';

import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

import { cofreDaEntidade } from '@/lib/cofre/entidade';
import { conexao } from '@/lib/cofre/servidor';
import { COTACAO_CENTAVOS_POR_SOL } from '@/lib/pagamento';
import { criarClienteServiceRole } from '@/lib/supabase/server';

/** Lamports → centavos. Arredonda para o mais próximo: leitura, não cobrança. */
export function lamportsParaCentavos(lamports: number): number {
  return Math.round((lamports / LAMPORTS_PER_SOL) * COTACAO_CENTAVOS_POR_SOL);
}

export type Recebimento = {
  /** O endereço que a entidade divulga para receber. */
  chave: string;
  /** O que um app de pagamento da rede de testes lê e preenche sozinho. */
  url: string;
  /** Saldo do caixa, em centavos, lido na rede. */
  saldoCentavos: number;
};

export async function chaveDeRecebimento(
  entidadeId: string,
  nomeDaEntidade: string,
): Promise<Recebimento> {
  const { vaultPda } = await cofreDaEntidade(entidadeId, nomeDaEntidade);
  const saldo = await conexao().getBalance(vaultPda, 'confirmed');

  const parametros = new URLSearchParams({ label: nomeDaEntidade });

  return {
    chave: vaultPda.toBase58(),
    url: `solana:${vaultPda.toBase58()}?${parametros}`,
    saldoCentavos: lamportsParaCentavos(saldo),
  };
}

/* ── Conferência das entradas ───────────────────────────────────────────── */

export type EntradaLancada = {
  assinatura: string;
  valorCentavos: number;
};

/**
 * Procura o que caiu na chave da entidade e lança as entradas que faltam.
 *
 * Idempotente por `lancamentos.tx_signature`: conferir dez vezes lança uma vez.
 * Venda de ingresso já grava a assinatura dela, então o mesmo depósito nunca
 * aparece duas vezes no livro-caixa.
 *
 * Só conta transferência que AUMENTOU o saldo do caixa. Saída executada mexe na
 * mesma conta e no sentido oposto: ela é registrada por quem a executou.
 */
export async function conferirEntradas(
  entidadeId: string,
  nomeDaEntidade: string,
): Promise<{ lancadas: EntradaLancada[]; conferidas: number }> {
  const { vaultPda } = await cofreDaEntidade(entidadeId, nomeDaEntidade);
  const conn = conexao();
  const supabase = criarClienteServiceRole();

  const assinaturas = await conn.getSignaturesForAddress(
    vaultPda,
    { limit: 25 },
    'confirmed',
  );

  const candidatas = assinaturas
    .filter((a: { err: unknown }) => !a.err)
    .map((a: { signature: string }) => a.signature);
  if (candidatas.length === 0) return { lancadas: [], conferidas: 0 };

  const { data: jaLancadas, error: erroLeitura } = await supabase
    .from('lancamentos')
    .select('tx_signature')
    .eq('entidade_id', entidadeId)
    .in('tx_signature', candidatas);

  if (erroLeitura) throw erroLeitura;

  const conhecidas = new Set(
    (jaLancadas ?? []).map((l: { tx_signature: string | null }) => l.tx_signature),
  );

  const lancadas: EntradaLancada[] = [];

  for (const assinatura of candidatas) {
    if (conhecidas.has(assinatura)) continue;

    const tx = await conn.getTransaction(assinatura, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
    if (!tx?.meta || tx.meta.err) continue;

    const chaves = tx.transaction.message.getAccountKeys();
    let indice = -1;
    for (let i = 0; i < chaves.length; i++) {
      if (chaves.get(i)?.equals(new PublicKey(vaultPda))) {
        indice = i;
        break;
      }
    }
    if (indice === -1) continue;

    const recebido = tx.meta.postBalances[indice] - tx.meta.preBalances[indice];
    if (recebido <= 0) continue;

    const valorCentavos = lamportsParaCentavos(recebido);
    // Depósito de poeira: menos de um centavo não é entrada, é arredondamento.
    if (valorCentavos <= 0) continue;

    const { error } = await supabase.from('lancamentos').insert({
      entidade_id: entidadeId,
      tipo: 'entrada',
      valor_centavos: valorCentavos,
      rubrica: 'Associados',
      descricao: 'Entrada recebida na chave da entidade',
      tx_signature: assinatura,
    });

    // Corrida entre duas conferências simultâneas: a outra lançou primeiro, e
    // isso é o resultado certo — não um erro para mostrar na tela.
    if (error) {
      if (error.code === '23505' || error.code === '23514') continue;
      throw error;
    }

    lancadas.push({ assinatura, valorCentavos });
  }

  return { lancadas, conferidas: candidatas.length };
}
