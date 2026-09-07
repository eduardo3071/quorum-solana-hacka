import { NextResponse } from 'next/server';

import { exigirMembro, respostaDeAcesso } from '@/lib/autorizacao';
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
export async function POST(req: Request) {
  /*
   * Lê o corpo só para saber de qual entidade se está falando. Sem isto a
   * autorização cairia na "única entidade de quem chama" — e alguém pedindo o
   * cofre da entidade B teria o da A mexido, calado. O conferidor `npm run
   * acesso` pegou exatamente isso.
   */
  let corpo: Record<string, unknown> = {};
  try {
    corpo = await req.json();
  } catch {
    // Corpo vazio segue valendo: cai na entidade única.
  }

  try {
    await exigirMembro(req, {
      slug: typeof corpo.entidadeSlug === 'string' ? corpo.entidadeSlug : null,
    });
  } catch (e) {
    const recusa = respostaDeAcesso(e);
    if (recusa) return recusa;
    throw e;
  }

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
