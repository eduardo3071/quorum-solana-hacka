import { NextResponse } from 'next/server';

import { exigirMembro, respostaDeAcesso } from '@/lib/autorizacao';
import { assinar, ehPapel, explorador, situacao } from '@/lib/cofre/servidor';

import { ehErroDeConfiguracao, erro } from '../_resposta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Aprova a proposta pendente com o signatário indicado. */
export async function POST(req: Request) {
  let corpo: Record<string, unknown> = {};
  try {
    corpo = await req.json();
  } catch {
    // Corpo vazio é aceitável: o assento cai no padrão logo abaixo.
  }

  const papel = corpo.papel ?? 'tesoureira';

  try {
    await exigirMembro(req, {
      slug: typeof corpo.entidadeSlug === 'string' ? corpo.entidadeSlug : null,
    });
  } catch (e) {
    const recusa = respostaDeAcesso(e);
    if (recusa) return recusa;
    throw e;
  }

  if (!ehPapel(papel)) {
    return NextResponse.json(
      { erro: 'Papel inválido. Use tesoureira, presidente ou conselho.' },
      { status: 400 },
    );
  }

  try {
    const assinatura = await assinar(papel);
    // Devolve a situação já atualizada: a tela precisa da contagem nova para
    // o indicador de assinaturas, e uma segunda ida ao servidor abriria uma
    // janela onde a interface mostra número velho.
    return NextResponse.json({
      assinado: true,
      assinatura,
      explorador: explorador(assinatura),
      ...(await situacao()),
    });
  } catch (e) {
    if (ehErroDeConfiguracao(e)) return erro((e as Error).message, e, 400);
    return erro('Não conseguimos registrar a assinatura agora.', e, 503);
  }
}
