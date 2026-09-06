import { NextResponse } from 'next/server';

import { ehPapel, executar } from '@/lib/cofre/servidor';

import { ehErroDeConfiguracao, erro } from '../_resposta';

// As bibliotecas da Solana usam APIs de Node e quebram no runtime edge.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Tenta executar a saída.
 *
 * Quando falta assinatura, responde 200 com
 *   { bloqueado: true, assinaturasFeitas, assinaturasNecessarias }
 * e NÃO 500. O bloqueio não é uma exceção a esconder — é o estado de interface
 * mais importante do produto, e um 500 faria a tela mostrar erro de sistema
 * onde deveria mostrar a regra do cofre funcionando.
 */
export async function POST(req: Request) {
  let papel: unknown;
  try {
    ({ papel } = await req.json());
  } catch {
    papel = 'tesoureira';
  }

  if (!ehPapel(papel)) {
    return NextResponse.json(
      { erro: 'Papel inválido. Use tesoureira, presidente ou conselho.' },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await executar(papel));
  } catch (e) {
    if (ehErroDeConfiguracao(e)) {
      return erro((e as Error).message, e, 400);
    }
    // Chegou aqui: não é falta de quórum — `executar` já teria devolvido o
    // bloqueio. É rede, RPC ou saldo. A tela mostra o estado offline.
    return erro('Não conseguimos falar com o cofre agora.', e, 503);
  }
}
