import { NextResponse } from 'next/server';

import { LoteEsgotado, reservar } from '@/lib/ingresso';
import { criarClienteServidor } from '@/lib/supabase/server';

import { ehErroDeConfiguracao, erro } from '../_resposta';

// As bibliotecas da rede usam APIs de Node e quebram no runtime edge.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Reserva um ingresso e devolve a cobrança: referência única e QR.
 *
 * Abre sem login — quem compra ingresso de festa não tem conta na tesouraria
 * da atlética, e exigir cadastro para pagar mataria a venda na fila. Se houver
 * sessão, o ingresso fica ligado a ela; se não, fica anônimo e vale pela
 * referência, como um ingresso de papel.
 *
 * O preço vem do lote no banco, nunca do corpo da requisição. Preço que o
 * cliente manda é preço que o cliente escolhe.
 */
export async function POST(req: Request) {
  let loteId: unknown;
  try {
    ({ loteId } = await req.json());
  } catch {
    loteId = null;
  }

  if (typeof loteId !== 'string' || loteId.length === 0) {
    return NextResponse.json({ erro: 'Escolha um lote antes.' }, { status: 400 });
  }

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    return NextResponse.json(await reservar(loteId, user?.id ?? null));
  } catch (e) {
    if (e instanceof LoteEsgotado) {
      // 409: o pedido está certo, o mundo é que mudou. A tela mostra
      // "esgotado" no lote, não uma tela de erro.
      return NextResponse.json({ erro: e.message, esgotado: true }, { status: 409 });
    }
    if (ehErroDeConfiguracao(e)) return erro((e as Error).message, e, 400);
    return erro('Não conseguimos abrir a compra agora.', e, 503);
  }
}
