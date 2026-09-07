import { NextResponse } from 'next/server';

import { exigirMembro, respostaDeAcesso } from '@/lib/autorizacao';
import { chaveDeRecebimento, conferirEntradas } from '@/lib/recebimento';

import { ehErroDeConfiguracao, erro } from '../_resposta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * A chave da entidade para RECEBER — e a leitura do que caiu nela.
 *
 * `POST { entidadeSlug }` devolve a chave e o saldo do caixa.
 * `POST { entidadeSlug, conferir: true }` lê a rede e lança no livro-caixa as
 * entradas que ainda não estavam lá.
 *
 * Qualquer membro ativo vê a chave: quem recebe é a entidade, e esconder o
 * endereço de quem paga não protege nada. Conferir também não move dinheiro —
 * só escreve no livro o que a rede já registrou.
 */
export async function POST(req: Request) {
  let corpo: Record<string, unknown> = {};
  try {
    corpo = await req.json();
  } catch {
    // Corpo vazio segue valendo: cai na entidade única de quem chama.
  }

  let membro;
  try {
    membro = await exigirMembro(req, {
      slug: typeof corpo.entidadeSlug === 'string' ? corpo.entidadeSlug : null,
      // Ver a chave e conferir o extrato é de qualquer associado: o livro-caixa
      // já é aberto, e esconder o endereço de quem paga não protege ninguém.
      papeis: ['presidente', 'tesoureiro', 'conselho', 'socio'],
    });
  } catch (e) {
    const recusa = respostaDeAcesso(e);
    if (recusa) return recusa;
    throw e;
  }

  try {
    const recebimento = await chaveDeRecebimento(membro.entidade_id, membro.entidade_slug);

    if (corpo.conferir === true) {
      const { lancadas, conferidas } = await conferirEntradas(
        membro.entidade_id,
        membro.entidade_slug,
      );
      return NextResponse.json({ ...recebimento, lancadas, conferidas });
    }

    return NextResponse.json(recebimento);
  } catch (e) {
    if (ehErroDeConfiguracao(e)) return erro((e as Error).message, e, 400);
    return erro('Não conseguimos ler a chave da entidade agora.', e, 503);
  }
}
