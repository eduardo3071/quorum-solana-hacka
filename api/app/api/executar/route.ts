import { NextResponse } from 'next/server';

import { respostaDeAcesso } from '@/lib/autorizacao';
import { assentoPara, contextoDaProposta } from '@/lib/cofre/contexto';
import { registrarExecucao } from '@/lib/cofre/entidade';
import { executar } from '@/lib/cofre/servidor';

import { ehErroDeConfiguracao, erro } from '../_resposta';

// As bibliotecas da Solana usam APIs de Node e quebram no runtime edge.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Tenta executar a saída — e, quando ela sai, escreve no livro-caixa.
 *
 * Este endpoint é o produto inteiro num lugar só, e as duas metades importam:
 *
 * Quando falta assinatura, responde 200 com
 *   { bloqueado: true, assinaturasFeitas, assinaturasNecessarias }
 * e NÃO 500. O bloqueio não é exceção a esconder — é o estado de interface mais
 * importante do produto, e um 500 faria a tela mostrar erro de sistema onde
 * deveria mostrar a regra do cofre funcionando.
 *
 * Quando a saída acontece, a proposta vira `executada` e um lançamento entra no
 * livro-caixa. Antes isso não existia: o dinheiro saía na devnet e o
 * livro-caixa — que é a tese do produto, aberto a qualquer associado — não
 * ficava sabendo. Um livro que não registra a saída é pior que livro nenhum,
 * porque parece completo.
 */
export async function POST(req: Request) {
  let corpo: Record<string, unknown> = {};
  try {
    corpo = await req.json();
  } catch {
    // Sem corpo não há proposta a executar; o erro sai logo abaixo.
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

  if (proposta.txIndex === null || !proposta.destinoDevnet) {
    return erro(
      'Esta proposta ainda não foi levada ao cofre. Registre-a antes de executar.',
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
    const resultado = await executar(assento, {
      multisigPda: cofre.multisigPda,
      vaultPda: cofre.vaultPda,
      destino: proposta.destinoDevnet,
      transactionIndex: proposta.txIndex,
    });

    if ('executado' in resultado) {
      /*
       * `registrarExecucao` devolve false quando outra chamada chegou antes —
       * dois toques, duas abas. Não é erro: a saída aconteceu, só não foi esta
       * chamada que a lançou. Repetir o lançamento faria o livro-caixa contar
       * a mesma saída duas vezes.
       */
      const lancou = await registrarExecucao({
        id: proposta.id,
        entidadeId: proposta.entidadeId,
        destino: proposta.destino,
        valorCentavos: proposta.valorCentavos,
        rubrica: proposta.rubrica,
        txSignature: resultado.assinatura,
      });

      return NextResponse.json({ ...resultado, lancado: lancou });
    }

    return NextResponse.json(resultado);
  } catch (e) {
    if (ehErroDeConfiguracao(e)) {
      return erro((e as Error).message, e, 400);
    }
    // Chegou aqui: não é falta de quórum — `executar` já teria devolvido o
    // bloqueio. É rede, RPC ou saldo. A tela mostra o estado offline.
    return erro('Não conseguimos falar com o cofre agora.', e, 503);
  }
}
