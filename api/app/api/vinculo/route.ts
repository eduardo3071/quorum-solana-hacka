import { NextResponse } from 'next/server';

import { respostaDeAcesso, usuarioDaRequisicao } from '@/lib/autorizacao';
import { criarClienteServiceRole } from '@/lib/supabase/server';

import { erro } from '../_resposta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Liga a sessão à linha da diretoria, pelo e-mail.
 *
 * Este passo existe porque as duas metades nascem separadas e em ordens
 * diferentes. A diretoria cadastra alguém pelo e-mail muito antes dessa pessoa
 * entrar; e quem funda a própria entidade tem a linha criada por
 * `POST /api/entidade` com `user_id` nulo, porque naquele instante ainda não
 * havia sessão. Nos dois casos falta o mesmo: casar `membros.user_id` com o
 * `auth.uid()` de quem acabou de entrar.
 *
 * Já foi `privado.vincular_membro()`, uma função SECURITY DEFINER — e ela nunca
 * rodou uma vez: morava num schema que o PostgREST não publica, então a chamada
 * do navegador não chegava a lugar nenhum e falhava calada. A 0006 removeu a
 * função e passou o vínculo para o servidor. O servidor perdeu o arquivo numa
 * limpeza, e ninguém notou, porque quem já estava vinculado continuou entrando:
 * só quem chegava DEPOIS ficava eternamente "sem entidade". Duas entidades
 * foram criadas assim, com o dono trancado do lado de fora.
 *
 * Três coisas mantêm isto seguro, e nenhuma é dispensável:
 *
 * 1. O e-mail vem do TOKEN VALIDADO, nunca do corpo. Aceitar o e-mail que a
 *    requisição manda seria deixar qualquer um dizer "sou a tesoureira".
 * 2. Só preenche onde `user_id` está nulo. Linha já vinculada nunca muda de
 *    dono, então ninguém assume o lugar de outra pessoa trocando de endereço.
 * 3. Compara por igualdade sobre a coluna normalizada em minúsculas (o `check`
 *    da 0006). `ilike` seria pior aqui: `_` é curinga, e e-mail com underscore
 *    casaria com o de outra pessoa — numa comparação que decide quem entra na
 *    diretoria.
 */
export async function POST(req: Request) {
  let usuario;
  try {
    usuario = await usuarioDaRequisicao(req);
  } catch (e) {
    const recusa = respostaDeAcesso(e);
    if (recusa) return recusa;
    throw e;
  }

  const email = usuario.email?.trim().toLowerCase();
  if (!email) {
    // Sessão sem e-mail é sessão que não dá para casar com nada. Não é erro de
    // quem chamou: é um login por um caminho que este produto ainda não usa.
    return NextResponse.json({ vinculadas: 0, entidadeSlug: null });
  }

  try {
    const supabase = criarClienteServiceRole();

    const { data, error } = await supabase
      .from('membros')
      .update({ user_id: usuario.id })
      .eq('email', email)
      .is('user_id', null)
      .select('id, entidades!inner(slug)');

    if (error) throw error;

    const linhas = (data ?? []) as unknown as { id: string; entidades: { slug: string } }[];

    return NextResponse.json({
      vinculadas: linhas.length,
      // Uma só entidade é o caso comum, e devolver o slug poupa a tela de uma
      // segunda consulta para saber para onde ir. Em mais de uma, quem escolhe
      // é a pessoa, e a tela já sabe listar.
      entidadeSlug: linhas.length === 1 ? linhas[0].entidades.slug : null,
    });
  } catch (e) {
    return erro('Não conseguimos confirmar seu acesso agora.', e, 503);
  }
}
