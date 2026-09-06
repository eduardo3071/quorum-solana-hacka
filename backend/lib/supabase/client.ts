import { createBrowserClient } from '@supabase/ssr';

import { supabaseAnonKey, supabaseUrl } from '@/lib/env';

/**
 * Cliente do browser. Carrega a chave anônima, então tudo que ele lê ou escreve
 * passa por RLS — é a política do banco que decide, não este código.
 *
 * Use em Client Components. Para leitura em Server Components, use
 * `lib/supabase/server.ts`.
 */
export function criarClienteBrowser() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}
