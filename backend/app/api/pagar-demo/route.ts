import { NextResponse } from 'next/server';

import { cobrancaDe } from '@/lib/ingresso';
import { pagarComoDemonstracao } from '@/lib/pagamento';

import { ehErroDeConfiguracao, erro } from '../_resposta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Paga a cobrança a partir da carteira de demonstração.
 *
 * Existe para a gravação não depender de alguém ter um app de pagamento de
 * devnet configurado no celular. O caminho de verdade é o QR: esta rota monta a
 * MESMA transferência que o QR pediria, e a conciliação não distingue as duas.
 *
 * Só devnet — a guarda está em `conexao()`, que recusa mainnet em qualquer
 * caminho do produto, e não só neste. Uma rota que gasta sozinha é o pior lugar
 * para descobrir que a rede era outra, mas as demais também não são bons.
 */
export async function POST(req: Request) {
  let referencia: unknown;
  try {
    ({ referencia } = await req.json());
  } catch {
    referencia = null;
  }

  if (typeof referencia !== 'string' || referencia.length === 0) {
    return NextResponse.json({ erro: 'Referência ausente.' }, { status: 400 });
  }

  try {
    const assinatura = await pagarComoDemonstracao(await cobrancaDe(referencia));
    return NextResponse.json({ pagou: true, assinatura });
  } catch (e) {
    if (e instanceof Error && e.message === 'Compra não encontrada.') {
      return NextResponse.json({ erro: e.message }, { status: 404 });
    }
    if (ehErroDeConfiguracao(e)) return erro((e as Error).message, e, 400);
    return erro('Não conseguimos enviar o pagamento agora.', e, 503);
  }
}
