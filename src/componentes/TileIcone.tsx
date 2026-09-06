import type { LucideIcon } from 'lucide-react';

import { FUNDO_TINGIDO, TEXTO_ACENTO, type Acento } from './acentos';

/** Tamanhos usados nas pranchas. O ícone escala junto. */
const TAMANHOS = {
  sm: { caixa: 'size-[26px] rounded-tile-sm', icone: 14 },
  md: { caixa: 'size-[34px] rounded-tile-sm', icone: 17 },
  lg: { caixa: 'size-[38px] rounded-avatar', icone: 18 },
  xl: { caixa: 'size-[42px] rounded-tile', icone: 20 },
} as const;

export type TamanhoTile = keyof typeof TAMANHOS;

/**
 * A assinatura visual do sistema: quadrado arredondado com o fundo tingido do
 * acento e o ícone na cor do acento. É ele que dá vida à tela sem poluir.
 * Use muito.
 */
export function TileIcone({
  icone: Icone,
  acento,
  tamanho = 'md',
  className = '',
}: {
  icone: LucideIcon;
  acento: Acento;
  tamanho?: TamanhoTile;
  className?: string;
}) {
  const { caixa, icone } = TAMANHOS[tamanho];

  return (
    <div
      className={`flex flex-none items-center justify-center ${caixa} ${FUNDO_TINGIDO[acento]} ${className}`}
    >
      <Icone
        size={icone}
        strokeWidth={1.7}
        className={TEXTO_ACENTO[acento]}
        aria-hidden
      />
    </div>
  );
}
