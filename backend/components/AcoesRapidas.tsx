import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

import { TEXTO_ACENTO, type Acento } from './acentos';

export type AcaoRapida = {
  icone: LucideIcon;
  /** Duas linhas, quebradas de propósito: "Propor" / "saída". */
  rotulo: [string, string];
  acento: Acento;
  href: string;
};

/**
 * Quatro tiles quadrados em linha. O primeiro vem preenchido de azul sólido,
 * os outros com fundo de cartão.
 *
 * Todos têm a mesma altura mínima e o rótulo é sempre de duas linhas — sem
 * isso, o cartão azul fica mais alto que os três vizinhos, que era o
 * desalinhamento da auditoria.
 */
export function AcoesRapidas({ acoes }: { acoes: AcaoRapida[] }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {acoes.map(({ icone: Icone, rotulo, acento, href }, i) => {
        const preenchido = i === 0;
        return (
          <Link
            key={rotulo.join(' ')}
            href={href}
            className={`flex min-h-[78px] flex-col items-center justify-center gap-2 rounded-btn px-1.5 py-[11px] ${
              preenchido
                ? 'bg-blue'
                : 'border border-line bg-surface'
            }`}
          >
            <Icone
              size={19}
              strokeWidth={preenchido ? 2 : 1.7}
              className={preenchido ? 'text-ground' : TEXTO_ACENTO[acento]}
              aria-hidden
            />
            <span
              className={`t-chip text-center leading-[1.25] ${
                preenchido ? 'text-ground' : 'text-ink-2'
              }`}
            >
              {rotulo[0]}
              <br />
              {rotulo[1]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
