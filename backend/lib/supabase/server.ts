import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

import { supabaseAnonKey, supabaseServiceRoleKey, supabaseUrl } from '@/lib/env';

/**
 * `createServerClient` aceita uma união de formatos de cookie (o atual e o
 * legado), e a união impede o TypeScript de inferir o parâmetro de `setAll`.
 * Anotar resolve sem afrouxar nada.
 */
type CookiesParaGravar = {
  name: string;
  value: string;
  options: CookieOptions;
}[];

/**
 * Cliente de servidor com a chave anônima e a sessão do usuário nos cookies.
 *
 * Continua sujeito a RLS: as políticas veem `auth.uid()` do usuário logado, e
 * quem não tem sessão é `anon` — que é como o livro-caixa público funciona.
 * Use em Server Components, Server Actions e Route Handlers.
 */
export async function criarClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookiesParaGravar) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components não podem escrever cookies. O middleware já
          // renova a sessão, então ignorar aqui é seguro.
        }
      },
    },
  });
}

/**
 * Cliente com a service role: IGNORA RLS COMPLETAMENTE.
 *
 * Só para escritas que a política de banco proíbe ao usuário — gravar
 * lançamento depois da execução on-chain, conciliar ingresso pago. Nunca
 * chame isto a partir de um caminho onde a entrada do usuário decide qual
 * entidade é lida ou escrita sem checagem própria: aqui não há rede de
 * segurança, o banco obedece.
 *
 * Só em Route Handlers e Server Actions. Nunca em Client Components.
 */
export function criarClienteServiceRole() {
  return createServerClient(supabaseUrl(), supabaseServiceRoleKey(), {
    cookies: {
      // Sem sessão: este cliente não é ninguém, é o próprio banco.
      getAll: () => [],
      setAll: () => {},
    },
  });
}
