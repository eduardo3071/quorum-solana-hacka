import { NextResponse } from 'next/server';

import { respostaDeAcesso, usuarioDaRequisicao } from '@/lib/autorizacao';
import { nomeDoEmail } from '@/lib/nomes';
import { criarClienteServiceRole } from '@/lib/supabase/server';

import { erro } from '../_resposta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Chave única `(entidade_id, user_id)` violada — a 0001 a criou para isto. */
const JA_EXISTE = '23505';

/**
 * Pedir para entrar numa entidade.
 *
 * O pedido é uma linha de `membros` com `papel = 'socio'` e `ativo = false`.
 * Não precisou de tabela nova nem de migração: o enum já tinha `socio`, a
 * coluna `ativo` já existia, e as políticas de RLS já filtram por ela. Ou seja,
 * um pedido pendente **já não enxerga** cofre, proposta nem a lista de
 * associados — sem que ninguém escreva uma política nova para isso.
 *
 * É este o caminho da maioria. Uma atlética tem três signatários e dezenas de
 * associados; para cada pessoa que funda uma entidade, muitas pedem para entrar
 * numa que já existe. Por muito tempo o produto só sabia atender a primeira.
 *
 * Escreve com a service role porque a política de `membros` não dá INSERT a
 * ninguém, e não deve dar mesmo: quem decide quem entra é a diretoria, não o
 * navegador de quem quer entrar. Aqui o servidor cria a linha já **inativa**,
 * que é um pedido — não uma entrada.
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
    return erro('Sua conta não tem e-mail. Entre com um e-mail para pedir.', null, 400);
  }

  let corpo: Record<string, unknown> = {};
  try {
    corpo = await req.json();
  } catch {
    // Cai na validação do slug logo abaixo.
  }

  const slug = typeof corpo.entidadeSlug === 'string' ? corpo.entidadeSlug.trim() : '';
  if (!slug) {
    return erro('Diga de qual entidade você quer fazer parte.', null, 400);
  }

  try {
    const supabase = criarClienteServiceRole();

    const { data: entidade } = await supabase
      .from('entidades')
      .select('id, nome, slug')
      .eq('slug', slug)
      .maybeSingle();

    if (!entidade) {
      return erro('Não achamos essa entidade.', null, 404);
    }

    const { error } = await supabase.from('membros').insert({
      entidade_id: entidade.id,
      user_id: usuario.id,
      nome: nomeDoEmail(email),
      papel: 'socio',
      email,
      ativo: false,
    });

    if (error) {
      /*
       * Pedir duas vezes não é erro de quem pediu — é a pessoa conferindo se o
       * pedido saiu. A chave única já impede a segunda linha; aqui só se traduz
       * o código do banco para uma frase que responde a dúvida dela.
       */
      if (error.code === JA_EXISTE) {
        return NextResponse.json({
          pedido: true,
          jaExistia: true,
          entidade: { nome: entidade.nome, slug: entidade.slug },
        });
      }
      throw error;
    }

    return NextResponse.json({
      pedido: true,
      jaExistia: false,
      entidade: { nome: entidade.nome, slug: entidade.slug },
    });
  } catch (e) {
    return erro('Não conseguimos enviar seu pedido agora.', e, 503);
  }
}
