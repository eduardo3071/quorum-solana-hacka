/**
 * Espelho de `api/lib/slug.ts`: o mesmo texto vira o mesmo endereço aqui e no
 * servidor. A validação de verdade é do servidor; isto só pré-preenche o campo.
 */
export const SLUG_MAX = 40;

/** "A.A.A. Engenharia" → "aaa-engenharia". */
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
