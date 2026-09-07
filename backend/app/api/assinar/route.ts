import { NextResponse } from 'next/server';

import { respostaDeAcesso } from '@/lib/autorizacao';
import { assentoPara, contextoDaProposta } from '@/lib/cofre/contexto';
import { registrarAssinatura } from '@/lib/cofre/entidade';
import { assinar, explorador, situacao } from '@/lib/cofre/servidor';

import { ehErroDeConfiguracao, erro } from '../_resposta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Assina a proposta: na rede e no banco.
 *
 * As duas coisas, e nessa ordem. A rede é quem decide — é o contrato que conta
 * o quórum e recusa a execução sem ele —, mas o banco é quem o produto mostra.
 * Antes só a rede era tocada, e a tabela `assinaturas` ficava com o que a
 * semente tinha plantado: a tela dizia uma coisa e o cofre outra.
 *
 * A rede primeiro porque ela é a que pode falhar de verdade. Gravar no banco e
 * depois falhar na rede deixaria uma assinatura que não existe — e uma
 * assinatura falsa num produto que existe para ser conferível é pior que
 * nenhuma.
 */
export async function POST(req: Request) {
  let corpo: Record<string, unknown> = {};
  try {
    corpo = await req.json();
  } catch {
    // Sem corpo não há proposta a assinar; o erro sai logo abaixo.
  }

  let ctx;
  try {
    ctx = await contextoDaProposta(req, corpo);
  } catch (e) {
    const recusa = respostaDeAcesso(e);
    if (recusa) return recusa;
    return erro((e as Error).message, e, 400);
  }

  const { membro, proposta, cofre } = ctx;

  if (proposta.txIndex === null) {
    return erro(
      'Esta proposta ainda não foi levada ao cofre. Registre-a antes de assinar.',
      null,
      400,
    );
  }

  let assento;
  try {
    assento = assentoPara(membro, corpo.papel);
  } catch (e) {
    return erro((e as Error).message, e, 403);
  }

  try {
    const assinatura = await assinar(assento, {
      multisigPda: cofre.multisigPda,
      transactionIndex: proposta.txIndex,
    });

    await registrarAssinatura(proposta.id, membro.id, assinatura);

    // Devolve a situação já atualizada: a tela precisa da contagem nova para o
    // indicador de assinaturas, e uma segunda ida ao servidor abriria uma
    // janela onde a interface mostra número velho.
    return NextResponse.json({
      assinado: true,
      assinatura,
      explorador: explorador(assinatura),
      ...(await situacao({
        multisigPda: cofre.multisigPda,
        vaultPda: cofre.vaultPda,
        destino: proposta.destinoDevnet ?? cofre.vaultPda,
        transactionIndex: proposta.txIndex,
      })),
    });
  } catch (e) {
    if (ehErroDeConfiguracao(e)) return erro((e as Error).message, e, 400);
    return erro('Não conseguimos registrar a assinatura agora.', e, 503);
  }
}
