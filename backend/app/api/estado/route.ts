import { NextResponse } from 'next/server';

import { lerEstado, situacao } from '@/lib/cofre/servidor';

import { erro } from '../_resposta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Situação atual do cofre e da proposta pendente.
 *
 * Aberto de propósito, ao contrário de assinar, executar, propor e criar. Tudo
 * que ele devolve — saldo do cofre, quantas assinaturas já entraram — está na
 * devnet, legível por qualquer um com o endereço, e o livro-caixa do produto é
 * público por tese. Trancar aqui daria a sensação de proteção sem proteger
 * nada, e é essa sensação que faz alguém deixar de trancar onde importa.
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
