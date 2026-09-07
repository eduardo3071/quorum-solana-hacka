import { NextResponse } from 'next/server';

import { exigirMembro, respostaDeAcesso } from '@/lib/autorizacao';
import { gravarCofreDaEntidade } from '@/lib/cofre/entidade';
import { criarCofre } from '@/lib/cofre/servidor';

import { ehErroDeConfiguracao, erro } from '../_resposta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cria o cofre 2-de-3 da entidade e abastece o caixa.
 *
 * Só isso. Antes ele abria uma proposta junto, para a tela de aprovações ter o
 * que mostrar — e isso deixou de fazer sentido: a proposta agora nasce de uma
 * linha de `propostas`, com destino e valor de verdade, por `POST /api/proposta`.
 * Cofre novo sem proposta cai no estado vazio, que é tela desenhada (prancha
 * 6a) e não buraco.
 *
 * O endereço vai para `entidades.multisig_pda` e `vault_pda`, e é dali que todo
 * o resto passa a ler. O `.cofre-devnet.json` não é mais fonte de verdade:
 * cofre por arquivo era cofre por servidor, e a Vercel não guarda disco entre
 * invocações.
 *
 * A `createKey` é gerada, usada e DESCARTADA. Ela não é signatária: serve uma
 * vez para derivar o endereço do multisig, e não aprova, não executa, não move
 * nada. Guardá-la só criaria mais um segredo para vazar — e já vazou uma vez,
 * no commit ba90b8b, dentro de um `.cofre-devnet.json` que entrou no git sem
 * ninguém notar.
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
    });
  } catch (e) {
    const recusa = respostaDeAcesso(e);
    if (recusa) return recusa;
    throw e;
  }

  try {
    const { multisigPda, vaultPda, assinatura } = await criarCofre();
    await gravarCofreDaEntidade(membro.entidade_id, multisigPda, vaultPda);

    return NextResponse.json({
      criado: true,
      multisigPda: multisigPda.toBase58(),
      vaultPda: vaultPda.toBase58(),
      assinatura,
    });
  } catch (e) {
    if (ehErroDeConfiguracao(e)) return erro((e as Error).message, e, 400);
    return erro('Não conseguimos criar o cofre agora.', e, 503);
  }
}
