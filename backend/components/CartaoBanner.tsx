import type { LucideIcon } from 'lucide-react';

import type { Acento } from './acentos';
import { TileIcone } from './TileIcone';

/**
 * Tile tingido à esquerda, título e subtítulo à direita. Usado para explicar a
 * regra do produto — "Nenhuma saída sem 2 assinaturas".
 *
 * `items-center` mantém o tile centralizado quando o subtítulo ocupa duas
 * linhas; alinhado ao topo ele fica órfão.
 */
export function CartaoBanner({
  icone,
  acento,
  titulo,
  subtitulo,
}: {
  icone: LucideIcon;
  acento: Acento;
  titulo: string;
  subtitulo: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-[11px] rounded-card border border-line bg-surface px-[13px] py-3">
      <TileIcone icone={icone} acento={acento} tamanho="xl" />
      <div className="min-w-0 flex-1">
        <div className="t-item text-ink">{titulo}</div>
        <div className="mt-1 text-[12.5px] leading-[1.35] font-normal text-ink-2">
          {subtitulo}
        </div>
      </div>
    </div>
  );
}
