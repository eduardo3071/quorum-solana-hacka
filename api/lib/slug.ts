/**
 * O endereço de uma entidade (`/atletica-engenharia`).
 *
 * O slug é o primeiro segmento da URL, então precisa ser legível, estável e
 * não pode colidir com uma tela da interface.
 */

export const SLUG_MIN = 3;
export const SLUG_MAX = 40;

/** Primeiros segmentos de URL que já são telas ou rotas da interface. */
export const SLUGS_RESERVADOS = new Set([
  'entrar',
  'perfil',
  'criar-entidade',
  'redefinir-senha',
  'auth',
  'festa',
  'api',
]);

/**
 * "A.A.A. Engenharia" → "aaa-engenharia".
 *
 * Tira acento pela decomposição Unicode: `normalize('NFD')` separa a letra do
 * sinal, e o intervalo `̀-ͯ` são exatamente os sinais. Sem isso
 * "Atlética" viraria "atltica".
 */
export function paraSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, '');
}

/** Devolve a mensagem do problema, ou nulo se o endereço serve. */
export function problemaDoSlug(slug: string): string | null {
  if (slug.length < SLUG_MIN) return `Use pelo menos ${SLUG_MIN} caracteres.`;
  if (slug.length > SLUG_MAX) return `Use no máximo ${SLUG_MAX} caracteres.`;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return 'Use só letras minúsculas, números e hífen.';
  }
  if (SLUGS_RESERVADOS.has(slug)) return 'Este endereço é reservado. Escolha outro.';
  return null;
}
