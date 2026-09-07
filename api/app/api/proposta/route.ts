import { NextResponse } from 'next/server';

import { respostaDeAcesso } from '@/lib/autorizacao';
import { contextoDaProposta } from '@/lib/cofre/contexto';
import { gravarPropostaNaRede } from '@/lib/cofre/entidade';
import { criarProposta } from '@/lib/cofre/servidor';
import { centavosParaLamports } from '@/lib/pagamento';

import { ehErroDeConfiguracao, erro } from '../_resposta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Leva uma proposta do banco para a rede.
 *
 * A linha de `propostas` já existe — quem a criou foi a tela de propor. O que
 * falta é ela existir no cofre: uma transação com o valor certo e uma proposta
 * que a governa. O índice que a rede devolve volta para `propostas.tx_index`, e
 * é ele que amarra as duas metades. Sem esse passo a proposta é um papel: a
 * tela mostra, ninguém consegue assinar.
 *
 * Idempotente de propósito. Tocar duas vezes no botão criaria duas saídas na
 * rede para a mesma linha, e a segunda ficaria órfã — proposta pendente que
 * ninguém vê e que continua podendo ser executada.
 */
export async function POST(req: Request) {
  let corpo: Record<string, unknown> = {};
  try {
    corpo = await req.json();
  } catch {
    // Sem corpo não há proposta a levar; o erro sai logo abaixo.
  }

  let ctx;
  try {
    ctx = await contextoDaProposta(req, corpo);
  } catch (e) {
    const recusa = respostaDeAcesso(e);
    if (recusa) return recusa;
    return erro((e as Error).message, e, 400);
  }

  const { proposta, cofre } = ctx;

  if (proposta.txIndex !== null) {
    return NextResponse.json({
      criada: true,
      jaExistia: true,
      transactionIndex: proposta.txIndex.toString(),
    });
  }

  try {
    const { destino, transactionIndex, assinatura } = await criarProposta(
      cofre.multisigPda,
      cofre.vaultPda,
      {
        lamports: centavosParaLamports(proposta.valorCentavos),
        // O memo fica na rede para sempre. Nome do fornecedor e rubrica bastam
        // para alguém auditando entender a saída sem abrir o app.
        memo: `${proposta.destino} · ${proposta.rubrica}`,
        // Quando quem propôs informou uma chave de recebimento de verdade, o
        // dinheiro vai para ela. É o que fecha o circuito: a saída de uma
        // entidade é a entrada de outra.
        destino: proposta.destinoDevnet,
      },
    );

    await gravarPropostaNaRede(proposta.id, transactionIndex, destino);

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
