import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';

import { TEXTO_ACENTO, type Acento } from './acentos';
import { TileIcone } from './TileIcone';

/**
 * Linha de lista: tile tingido à esquerda, nome e metadados no meio, valor
 * grande à direita, seta.
 *
 * `min-w-0` no bloco do meio deixa o nome truncar em vez de empurrar o valor
 * para fora. O valor nunca quebra — `t-valor` já traz `white-space: nowrap`.
 */
export function LinhaLista({
  icone,
  acento,
  titulo,
  meta,
  valor,
  corDoValor,
  href,
  seta = false,
}: {
  icone: LucideIcon;
  acento: Acento;
  titulo: string;
  /** Chip de rubrica e data, normalmente. */
  meta?: React.ReactNode;
  valor?: string;
  corDoValor?: Acento;
  href?: string;
  seta?: boolean;
}) {
  const conteudo = (
    <>
      <TileIcone icone={icone} acento={acento} tamanho="lg" />

      <div className="min-w-0 flex-1">
        <div className="t-item truncate text-ink">{titulo}</div>
        {meta && (
          <div className="mt-[5px] flex items-center gap-[7px]">{meta}</div>
        )}
      </div>

      {valor && (
        <div className="flex flex-none items-center gap-2">
          <span
            className={`t-valor ${corDoValor ? TEXTO_ACENTO[corDoValor] : 'text-ink'}`}
          >
            {valor}
          </span>
          {seta && (
            <ChevronRight
              size={16}
              strokeWidth={1.7}
              className="text-ink-3"
              aria-hidden
            />
          )}
        </div>
      )}

      {!valor && seta && (
        <ChevronRight
          size={16}
          strokeWidth={1.7}
          className="flex-none text-ink-3"
          aria-hidden
        />
      )}
    </>
  );

  const classe =
    'flex items-center gap-[11px] rounded-card border border-line bg-surface px-[13px] py-[9px] min-h-[58px]';

  if (href) {
    return (
      <Link href={href} className={classe}>
        {conteudo}
      </Link>
    );
  }

  return <div className={classe}>{conteudo}</div>;
}
