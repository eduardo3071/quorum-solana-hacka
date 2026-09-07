/**
 * Um nome apresentável a partir do e-mail.
 *
 * Vive aqui porque dois caminhos criam a mesma linha de `membros` sem que
 * ninguém tenha digitado um nome: quem funda a entidade e quem pede para
 * entrar. As duas telas pedem o nome depois; até lá, "Marina Salgado" é melhor
 * companhia numa lista de diretoria do que "marina.salgado@grad.ufsc.br".
 */
export function nomeDoEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  const partes = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1));

  return partes.join(' ') || 'Associado';
}
