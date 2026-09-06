import { NextResponse, type NextRequest } from 'next/server';

import { comCors, respostaPreflight } from '@/lib/cors';
import { atualizarSessao } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Os endpoints saem do portão de navegação.
   *
   * O portão existe para mandar VISITANTE para a tela de entrar. Aplicado a um
   * endpoint ele responde um 307 para `/entrar` — que é HTML, não JSON, e que
   * do outro lado aparece como "erro estranho de parse". Interface em outro
   * domínio não manda cookie nenhum, então todo pedido cairia aí.
   *
   * Quem protege dado é o RLS no banco, e ele continua valendo: o endpoint que
   * lê com a chave anônima só enxerga o que a política deixa.
   */
  if (pathname.startsWith('/api/')) {
    const origem = request.headers.get('origin');

    if (request.method === 'OPTIONS') return respostaPreflight(origem);
    return comCors(NextResponse.next({ request }), origem);
  }

  return atualizarSessao(request);
}

export const config = {
  matcher: [
    /*
     * Tudo, menos assets estáticos e imagens — eles não têm sessão a renovar
     * e passar por aqui só custa latência.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
};
