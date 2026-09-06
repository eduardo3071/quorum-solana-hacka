import { NextResponse } from 'next/server';

import { conciliar } from '@/lib/ingresso';

import { ehErroDeConfiguracao, erro } from '../_resposta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Conciliação: procura o pagamento desta compra e fecha o circuito.
 *
 * "Ainda não pagaram" responde 200 com `{ pago: false }`, nunca erro — é o
 * estado normal enquanto a tela espera, e a tela consulta em laço. Só falha de
 * rede é 503.
 *
 * Chamar dez vezes grava um lançamento só. Quem garante é o banco: índice
 * único em `ingressos.lancamento_id` e a atualização condicionada ao status.
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
    return NextResponse.json(await conciliar(referencia));
  } catch (e) {
    if (e instanceof Error && e.message === 'Compra não encontrada.') {
      return NextResponse.json({ erro: e.message }, { status: 404 });
    }
    if (ehErroDeConfiguracao(e)) return erro((e as Error).message, e, 400);
    return erro('Não conseguimos confirmar o pagamento agora.', e, 503);
  }
}
