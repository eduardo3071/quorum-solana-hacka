/**
 * Rubrica é categoria contábil — nunca sinônimo de assinatura.
 *
 * O tipo vivia junto do mapa rubrica→cor, em `components/acentos.ts`. Cor é
 * assunto da interface e a interface não mora mais aqui; o que a API precisa
 * saber é só quais são as quatro rubricas que o banco aceita — a mesma lista do
 * `check` na coluna `lancamentos.rubrica`.
 */
export type Rubrica = 'Eventos' | 'Marketing' | 'Esporte' | 'Associados';

export const RUBRICAS: readonly Rubrica[] = [
  'Eventos',
  'Marketing',
  'Esporte',
  'Associados',
];

export function ehRubrica(valor: unknown): valor is Rubrica {
  return typeof valor === 'string' && (RUBRICAS as readonly string[]).includes(valor);
}
