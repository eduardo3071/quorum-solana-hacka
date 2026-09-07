import { exigirMembro, type Membro } from '@/lib/autorizacao';

import {
  cofreDaEntidade,
  propostaDaEntidade,
  type CofreDaEntidade,
  type PropostaDoBanco,
} from './entidade';
import type { Papel } from './servidor';

/**
 * O que os endpoints do cofre precisam antes de tocar na rede: quem chama, qual
 * proposta, e qual cofre.
 *
 * Junto num lugar só porque os três andam sempre juntos, e porque a ordem
 * importa: autoriza a pessoa, depois confere que a proposta é da entidade dela,
 * depois busca o cofre. Invertido, um signatário de uma atlética assinaria a
 * saída de outra só mandando o id — e id de proposta não é segredo, aparece na
 * tela.
 */

/** Do papel na diretoria para o assento no cofre. */
const ASSENTO_DO_PAPEL: Record<string, Papel> = {
  tesoureiro: 'tesoureira',
  presidente: 'presidente',
  conselho: 'conselho',
};

/**
 * Qual chave assina.
 *
 * O assento sai de quem chama, sempre: cada signatário assina pelo próprio
 * lugar. Pedir o assento de outra pessoa é recusado — uma assinatura que não é
 * de quem consta na tela não vale nada num produto feito para ser conferível.
 */
export function assentoPara(membro: Membro, pedido: unknown): Papel {
  const meu = ASSENTO_DO_PAPEL[membro.papel];

  if (!meu) {
    throw new Error('Seu acesso é de associado, e associado não assina.');
  }

  if (typeof pedido !== 'string' || pedido === meu) return meu;

  throw new Error(
    `Você assina como ${meu}. Cada signatário assina pelo próprio lugar.`,
  );
}


export type ContextoDaProposta = {
  membro: Membro;
  proposta: PropostaDoBanco;
  cofre: CofreDaEntidade;
};

export async function contextoDaProposta(
  req: Request,
  corpo: Record<string, unknown>,
): Promise<ContextoDaProposta> {
  const membro = await exigirMembro(req, {
    slug: typeof corpo.entidadeSlug === 'string' ? corpo.entidadeSlug : null,
  });

  const id = corpo.propostaId;
  if (typeof id !== 'string' || !id) {
    throw new Error('Diga qual proposta: falta `propostaId`.');
  }

  const proposta = await propostaDaEntidade(id, membro.entidade_id);
  const cofre = await cofreDaEntidade(membro.entidade_id);

  return { membro, proposta, cofre };
}
