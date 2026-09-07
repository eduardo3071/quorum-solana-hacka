import { NextResponse } from 'next/server';

import { exigirMembro, respostaDeAcesso } from '@/lib/autorizacao';
import { criarClienteServiceRole } from '@/lib/supabase/server';

import { erro } from '../../_resposta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Quem decide quem entra. Associado não aprova associado. */
const DIRETORIA = ['presidente', 'tesoureiro', 'conselho'] as const;

/**
 * A diretoria aprova ou recusa um pedido de entrada.
 *
 * Aprovar é `ativo = true` — e a partir daí as políticas de RLS passam a
 * enxergar a pessoa como da casa. Recusar apaga a linha, e apagar é melhor que
 * marcar como recusada por dois motivos: a chave única `(entidade_id, user_id)`
 * ficaria ocupada por uma recusa e a pessoa nunca mais poderia pedir; e uma
 * lista de "recusados" é um registro sobre gente que não faz parte, guardado
 * por quem não deveria guardá-lo.
 *
 * Só mexe em linha **inativa**. Sem essa trava, o mesmo endpoint desativaria um
 * signatário em exercício — expulsar alguém da diretoria é outra decisão, com
 * outras consequências, e vai precisar da própria tela.
 */
export async function POST(req: Request) {
  let corpo: Record<string, unknown> = {};
  try {
    corpo = await req.json();
  } catch {
    // Cai na validação abaixo.
  }

  const entidadeSlug =
    typeof corpo.entidadeSlug === 'string' ? corpo.entidadeSlug : null;

  let membro;
  try {
    membro = await exigirMembro(req, { slug: entidadeSlug, papeis: DIRETORIA });
  } catch (e) {
    const recusa = respostaDeAcesso(e);
    if (recusa) return recusa;
    throw e;
  }

  const membroId = typeof corpo.membroId === 'string' ? corpo.membroId : '';
  if (!membroId) {
    return erro('Diga qual pedido: falta `membroId`.', null, 400);
  }
  if (typeof corpo.aprovar !== 'boolean') {
    return erro('Diga se é para aprovar ou recusar.', null, 400);
  }

  try {
    const supabase = criarClienteServiceRole();

    /*
     * O pedido tem de ser DESTA entidade, e não de outra.
     *
     * `exigirMembro` respondeu "você é da diretoria de X". Esta consulta
     * responde "o pedido que você mandou também é de X". Sem as duas, um
     * presidente aprovaria entradas na atlética alheia só trocando o id — e id
     * de pedido não é segredo, aparece na tela de quem tem acesso.
     */
    const alvo = <T extends { eq: (c: string, v: unknown) => T }>(q: T) =>
      q.eq('id', membroId).eq('entidade_id', membro.entidade_id).eq('ativo', false);

    const { data, error } = corpo.aprovar
      ? await alvo(supabase.from('membros').update({ ativo: true }))
          .select('id, nome')
          .maybeSingle()
      : await alvo(supabase.from('membros').delete()).select('id, nome').maybeSingle();

    if (error) throw error;

    if (!data) {
      return erro('Esse pedido não está mais pendente.', null, 404);
    }

    return NextResponse.json({
      decidido: true,
      aprovado: corpo.aprovar,
      nome: (data as { nome: string }).nome,
    });
  } catch (e) {
    return erro('Não conseguimos registrar sua decisão agora.', e, 503);
  }
}
