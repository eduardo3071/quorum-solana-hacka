import type { LucideIcon } from 'lucide-react';

import { TEXTO_ACENTO, type Acento } from './acentos';
import { TileIcone } from './TileIcone';

/**
 * Cartão da grade 2×2: rótulo em caixa alta à esquerda, tile tingido pequeno à
 * direita, número grande abaixo, uma linha de rodapé.
 *
 * O número herda a cor do acento quando o dado é semântico — mas nunca azul em
 * saldo: azul é ação e link. Passe `corDoNumero` só quando o dado carregar
 * significado (retido em vermelho, entrada em verde).
 *
 * O rótulo tem altura mínima para que os quatro cartões da grade fiquem
 * alinhados por dentro mesmo quando um rótulo ocupa duas linhas.
 */
export function CartaoStat({
  rotulo,
  valor,
  rodape,
  icone,
  acento,
  corDoNumero,
}: {
  rotulo: string;
  valor: string;
  rodape?: string;
  icone: LucideIcon;
  acento: Acento;
  corDoNumero?: Acento;
}) {
  return (
    <div className="rounded-card border border-line bg-surface px-[13px] py-[11px]">
      <div className="flex items-start justify-between gap-1.5">
        <span className="t-rotulo min-h-[25px] leading-[1.2] text-ink-2">
          {rotulo}
        </span>
        <TileIcone icone={icone} acento={acento} tamanho="sm" />
      </div>

      <div
        className={`t-ancora-sm mt-[11px] ${corDoNumero ? TEXTO_ACENTO[corDoNumero] : 'text-ink'}`}
      >
        {valor}
      </div>

      {rodape && <div className="t-meta mt-1.5 text-ink-3">{rodape}</div>}
    </div>
  );
}
