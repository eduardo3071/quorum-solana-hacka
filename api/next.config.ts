import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /*
   * A prévia gerenciada fornece as credenciais públicas com o prefixo VITE_.
   * O app é Next e lê NEXT_PUBLIC_; este mapeamento mantém um único valor
   * disponível no middleware, nos Server Components e no navegador.
   */
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      process.env.VITE_SUPABASE_URL ??
      process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
      process.env.SUPABASE_PUBLISHABLE_KEY,
  },
  /*
   * A raiz é esta pasta, sempre.
   *
   * Sem isto, o Next procura lockfiles pelos diretórios acima e, se achar um
   * órfão — um `npm install` rodado sem querer na pasta do usuário, por
   * exemplo —, elege aquele diretório como raiz. O `dev` sobrevive, mas o
   * rastreamento de arquivos do `build` passa a olhar a árvore errada, e o
   * sintoma aparece só no deploy.
   */
  outputFileTracingRoot: process.cwd(),
  // O selo de desenvolvimento do Next fica sobre o canto inferior esquerdo e
  // cobre conteúdo em telas de 390px — atrapalha a conferência contra as
  // pranchas.
  devIndicators: false,
};

export default nextConfig;
