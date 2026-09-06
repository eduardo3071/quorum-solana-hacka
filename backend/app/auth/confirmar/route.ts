import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

import { criarClienteServidor } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Volta do link enviado por e-mail.
 *
 * O Supabase entrega essa volta em três formatos diferentes, e qual deles chega
 * depende de configuração no painel — não de código. Tratar só um é receita
 * para o link "não funcionar" em produção sem explicação:
 *
 *   1. `?token_hash=…&type=…` — quando o modelo de e-mail aponta direto para
 *      cá, usando `{{ .TokenHash }}`. É o caminho preferido: uma parada só, e
 *      não depende de cookie nenhum, então o link abre em qualquer navegador.
 *   2. `?code=…` — quando o modelo usa `{{ .ConfirmationURL }}`. O Supabase
 *      verifica no domínio dele e devolve um código para trocar por sessão.
 *      Exige que o link seja aberto no MESMO navegador que pediu, porque o
 *      verificador do PKCE mora num cookie.
 *   3. `?error=…&error_description=…` — o Supabase recusou antes de chegar
 *      aqui. Repassamos o motivo dele em vez de inventar um nosso.
 *
 * `type` vem do modelo de e-mail: `email` na confirmação de cadastro,
 * `magiclink` no link de acesso. Os dois passam por aqui.
 */
const TIPOS: EmailOtpType[] = [
  'email',
  'magiclink',
  'signup',
  'invite',
  'recovery',
  'email_change',
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parametro = (n: string) => url.searchParams.get(n);

  const proxima = parametro('proxima') ?? '/';
  const paraEntrar = (erro: string) =>
    NextResponse.redirect(new URL(`/entrar?erro=${erro}`, url.origin));

  // O Supabase já recusou. O motivo dele vale mais que um genérico nosso.
  if (parametro('error') || parametro('error_code')) {
    console.error(
      '[auth] o Supabase recusou o link',
      parametro('error_code'),
      parametro('error_description'),
    );
    return paraEntrar('expirado');
  }

  const supabase = await criarClienteServidor();

  const tokenHash = parametro('token_hash');
  const tipo = parametro('type');

  if (tokenHash && tipo) {
    if (!TIPOS.includes(tipo as EmailOtpType)) {
      console.error('[auth] tipo de link desconhecido', tipo);
      return paraEntrar('link');
    }

    const { error } = await supabase.auth.verifyOtp({
      type: tipo as EmailOtpType,
      token_hash: tokenHash,
    });
    if (error) {
      console.error('[auth] link inválido ou expirado', error);
      return paraEntrar('expirado');
    }
    return NextResponse.redirect(new URL(proxima, url.origin));
  }

  const codigo = parametro('code');
  if (codigo) {
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (error) {
      console.error('[auth] não conseguimos trocar o código por sessão', error);
      // Causa mais comum: o link foi aberto em outro navegador, e o cookie do
      // PKCE ficou no primeiro. A tela pede outro link, que é o que resolve.
      return paraEntrar('outro-navegador');
    }
    return NextResponse.redirect(new URL(proxima, url.origin));
  }

  // Chegou sem nada. Quase sempre é a URL de redirecionamento do painel
  // apontando para cá sem parâmetro, ou um clique no link já consumido.
  console.error('[auth] volta sem token nem código', url.search);
  return paraEntrar('link');
}
