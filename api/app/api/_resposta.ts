import { NextResponse } from 'next/server';

/**
 * Resposta de erro dos endpoints do cofre.
 *
 * Nunca devolve a mensagem crua da biblioteca ao cliente: elas falam de
 * `AnchorError` e `PublicKey`, vocabulário que não existe no produto. A causa
 * técnica vai para o log do servidor, onde é útil; a tela recebe uma frase que
 * um estudante entende.
 */
export function erro(mensagem: string, causa: unknown, status = 500) {
  console.error(`[cofre] ${mensagem}`, causa);
  return NextResponse.json({ erro: mensagem }, { status });
}

/**
 * Falta de configuração é 400: o servidor está certo, o ambiente é que não.
 *
 * A lista precisa acompanhar quem escreve as mensagens, e por um tempo não
 * acompanhou: `lib/env.ts` diz "Variável de ambiente ausente: X" e nenhum
 * padrão daqui casava com isso. Dava no pior tipo de erro — um 503 opaco para
 * a única falha cuja causa o servidor sabia nomear, e que se resolve
 * preenchendo um campo no painel da Vercel.
 */
export function ehErroDeConfiguracao(e: unknown): boolean {
  return (
    e instanceof Error &&
    /Variável de ambiente ausente|não está no \.env\.local|não está no ambiente|Nenhum cofre criado|ainda não tem cofre|aponta para mainnet/.test(
      e.message,
    )
  );
}
