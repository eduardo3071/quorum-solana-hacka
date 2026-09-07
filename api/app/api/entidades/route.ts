import { NextResponse } from 'next/server';

import { criarClienteServiceRole } from '@/lib/supabase/server';

import { erro } from '../_resposta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * A lista telefônica das entidades.
 *
 *   GET /api/entidades?busca=engenharia
 *
 * Aberta, sem sessão, e devolvendo apenas o que já está em qualquer cartaz de
 * corredor: nome, tipo e universidade. **Nada de saldo, nada de endereço de
 * cofre, nenhum membro.** Quem procura a própria atlética para pedir entrada
 * ainda não é de dentro, e não precisa ser para achar o nome dela.
 *
 * Lê com a service role porque a política de `entidades` publica só as de
 * livro-caixa aberto, e uma entidade pode ter fechado o livro e continuar
 * aceitando associados. As duas coisas são decisões diferentes, e confundi-las
 * esconderia a entidade de quem quer entrar nela.
 *
 * Sem termo de busca devolve as mais recentes — numa tela de "encontre a sua",
 * lista vazia parece produto vazio.
 */
const LIMITE = 20;

export async function GET(req: Request) {
  const busca = (new URL(req.url).searchParams.get('busca') ?? '').trim();

  try {
    let consulta = criarClienteServiceRole()
      .from('entidades')
      .select('slug, nome, tipo, universidade')
      .order('criado_em', { ascending: false })
      .limit(LIMITE);

    if (busca) {
      /*
       * `%` e `_` são curingas do LIKE, e `,` separa as condições do
       * PostgREST — os três precisam sair do texto que a pessoa digitou. Sem
       * isso, buscar por "_" listaria tudo, e uma vírgula quebraria a consulta
       * de um jeito que vira 500 sem explicação.
       */
      const limpo = busca.replace(/[%_,]/g, ' ').slice(0, 60);
      consulta = consulta.or(`nome.ilike.%${limpo}%,universidade.ilike.%${limpo}%`);
    }

    const { data, error } = await consulta;
    if (error) throw error;

    return NextResponse.json({ entidades: data ?? [] });
  } catch (e) {
    return erro('Não conseguimos buscar as entidades agora.', e, 503);
  }
}
