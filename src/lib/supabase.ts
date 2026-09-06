import { createClient } from '@supabase/supabase-js';

/**
 * O cliente do banco, no navegador.
 *
 * A chave é a anônima, e ela é pública por natureza: quem protege os dados é a
 * política de acesso do banco (RLS), não o segredo da chave. Se esta chave
 * vazasse, um estranho continuaria vendo só o que a política deixa ver — o
 * livro-caixa de entidade pública e os cartazes de festa.
 *
 * A chave `service_role` NUNCA entra aqui. Ela ignora toda política, e no
 * navegador seria o banco inteiro aberto. Toda escrita que precisa dela mora
 * na API — ver `lib/api.ts`.
 *
 * A prévia gerenciada entrega as credenciais com prefixo VITE_; aceito também
 * os nomes sem prefixo para quem copiar de outro ambiente.
 */
const url =
  import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.VITE_PUBLIC_SUPABASE_URL;

const chave =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Falta configurar?
 *
 * Não estoura aqui. Um `throw` no escopo do módulo derruba a avaliação antes
 * de o React montar, e o resultado é uma tela vazia sem explicação nenhuma —
 * o pior sintoma possível, porque não diz o que fazer. Quem trata é o
 * `main.tsx`, com uma tela que nomeia as variáveis que faltam.
 */
export const faltaConfigurar = !url || !chave;

export const supabase = createClient(url ?? 'https://configuracao.invalida', chave ?? 'sem-chave', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // O link do e-mail volta com o código na URL; o cliente troca por sessão.
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
