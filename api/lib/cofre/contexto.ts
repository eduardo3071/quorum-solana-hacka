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
 * O certo é o assento sair de quem chama, e é esse o padrão: cada signatário
 * assina pelo próprio lugar. O caminho de exceção existe por um motivo honesto
 * e temporário — as três chaves privadas moram no ambiente do servidor, não com
 * as pessoas, então ninguém é "dono" de um assento ainda. Enquanto for assim,
 * uma demonstração com um aparelho só precisa produzir duas assinaturas.
 *
 * `DEMO_ASSINA_POR_TODOS=1` libera isso, e nada mais. Fora dele, pedir o
 * assento de outra pessoa é recusado. No dia em que cada signatário guardar a
 * própria chave, a variável some e este parágrafo com ela.
 */
export function assentoPara(membro: Membro, pedido: unknown): Papel {
  const meu = ASSENTO_DO_PAPEL[membro.papel];

  if (!meu) {
    throw new Error('Seu acesso é de associado, e associado não assina.');
  }

  if (typeof pedido !== 'string' || pedido === meu) return meu;

  if (process.env.DEMO_ASSINA_POR_TODOS === '1') {
    if (pedido in { tesoureira: 1, presidente: 1, conselho: 1 }) {
      return pedido as Papel;
    }
    throw new Error('Assento inválido. Use tesoureira, presidente ou conselho.');
  }

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
