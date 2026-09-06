/**
 * O ambiente azul das pranchas de capa e entrada.
 *
 * Vai no `background` do próprio elemento, e não num `<div>` posicionado atrás:
 * um div com `z-index: -1` cai atrás do fundo do `body`, que é opaco, e some.
 * Fundo que é fundo estruturalmente não tem como ser encoberto — foi a mesma
 * decisão da textura do `Hero`.
 *
 * Gradiente e não imagem: nada para baixar, nada que fique meio carregado numa
 * rede de campus.
 */
export const FUNDO_CAPA = {
  backgroundColor: 'var(--color-ground)',
  backgroundImage: [
    'radial-gradient(120% 62% at 50% -8%, #17416F 0%, #102B4E 34%, rgba(16,24,35,0) 74%)',
    'radial-gradient(58% 34% at 6% 6%, rgba(31,165,255,.28) 0%, rgba(16,24,35,0) 62%)',
    'radial-gradient(62% 40% at 98% 100%, rgba(90,242,200,.14) 0%, rgba(16,24,35,0) 64%)',
  ].join(','),
} as const;
