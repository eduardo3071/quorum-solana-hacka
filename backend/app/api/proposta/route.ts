import { NextResponse } from 'next/server';

import { criarProposta, exigirEstado, gravarEstado } from '@/lib/cofre/servidor';

import { ehErroDeConfiguracao, erro } from '../_resposta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cria uma nova proposta de saída no cofre existente.
 *
 * Reaproveita o cofre já criado — só o índice da transação avança. Serve para
 * repetir a demonstração sem refazer o cofre, que custa taxa e rent.
 */
export async function POST() {
  try {
    const { multisigPda, vaultPda } = exigirEstado();
    const { destino, transactionIndex, assinatura } = await criarProposta(
      multisigPda,
      vaultPda,
    );

    gravarEstado({ multisigPda, vaultPda, destino, transactionIndex });

    return NextResponse.json({
      criada: true,
      transactionIndex: transactionIndex.toString(),
      destino: destino.toBase58(),
      assinatura,
    });
  } catch (e) {
    if (ehErroDeConfiguracao(e)) return erro((e as Error).message, e, 400);
    return erro('Não conseguimos registrar a proposta agora.', e, 503);
  }
}
