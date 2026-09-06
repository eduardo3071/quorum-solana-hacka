import { NextResponse } from 'next/server';
import bs58 from 'bs58';

import { criarCofre, criarProposta, gravarEstado } from '@/lib/cofre/servidor';

import { ehErroDeConfiguracao, erro } from '../_resposta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cria o cofre 2-de-3, abastece o caixa e já deixa uma proposta pendente.
 *
 * Faz os dois de uma vez porque a tela de aprovações precisa de algo para
 * mostrar: um cofre recém-criado sem proposta cai no estado vazio (6a), que é
 * outra tela. Para o vídeo, o ponto de partida é a proposta esperando.
 */
export async function POST() {
  try {
    const { multisigPda, vaultPda, createKey, assinatura } = await criarCofre();
    const { destino, transactionIndex } = await criarProposta(multisigPda, vaultPda);

    gravarEstado(
      { multisigPda, vaultPda, destino, transactionIndex },
      {
        createKey: bs58.encode(createKey.secretKey),
        criadoEm: new Date().toISOString(),
      },
    );

    return NextResponse.json({
      criado: true,
      multisigPda: multisigPda.toBase58(),
      vaultPda: vaultPda.toBase58(),
      transactionIndex: transactionIndex.toString(),
      assinatura,
    });
  } catch (e) {
    if (ehErroDeConfiguracao(e)) return erro((e as Error).message, e, 400);
    return erro('Não conseguimos criar o cofre agora.', e, 503);
  }
}
