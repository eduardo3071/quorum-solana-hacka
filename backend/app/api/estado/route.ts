import { NextResponse } from 'next/server';

import { lerEstado, situacao } from '@/lib/cofre/servidor';

import { erro } from '../_resposta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Situação atual do cofre e da proposta pendente.
 *
 * É o que a tela consulta ao abrir, para o indicador de assinaturas mostrar a
 * contagem real em vez do mock. Sem cofre criado devolve `{ existe: false }`
 * com 200 — não é erro, é o estado vazio da prancha 6a.
 */
export async function GET() {
  if (!lerEstado()) return NextResponse.json({ existe: false });

  try {
    return NextResponse.json({ existe: true, ...(await situacao()) });
  } catch (e) {
    return erro('Não conseguimos ler o cofre agora.', e, 503);
  }
}
