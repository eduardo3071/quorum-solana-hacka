/**
 * Leitura das variáveis de ambiente com falha explícita.
 *
 * Uma variável faltando deve estourar no boot com uma mensagem que diz qual é,
 * não virar `undefined` que só aparece como 401 obscuro três telas adiante.
 */

function obrigatoria(nome: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(
      `Variável de ambiente ausente: ${nome}. Copie .env.example para .env.local e preencha.`,
    );
  }
  return valor;
}

/** Público: vai para o bundle do browser. Protegido por RLS. */
export const supabaseUrl = () =>
  obrigatoria('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);

/** Público: vai para o bundle do browser. Protegido por RLS. */
export const supabaseAnonKey = () =>
  obrigatoria(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

/**
 * Só no servidor. Ignora RLS por completo.
 *
 * Importar este módulo a partir de um Client Component não vaza a chave — o
 * bundler do Next remove `process.env.SUPABASE_SERVICE_ROLE_KEY` do bundle do
 * browser por não ter prefixo NEXT_PUBLIC_ —, mas a chamada estoura em runtime.
 * Use apenas em Route Handlers e Server Actions.
 */
export const supabaseServiceRoleKey = () =>
  obrigatoria(
    'SUPABASE_SERVICE_ROLE_KEY',
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
