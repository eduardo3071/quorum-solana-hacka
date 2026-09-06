import { Check } from 'lucide-react';

import { BarraProgresso } from '@/components/BarraProgresso';

export type EstadoPasso = 'feito' | 'agora' | 'futuro';

/**
 * Um passo da linha do tempo vertical da prancha 6d.
 *
 * Marcador à esquerda, duas linhas empilhadas à direita com respiro real entre
 * elas — título em 15.5/700 e detalhe em 12.5/400. Nunca sobrepostos: foi esse
 * o bug que a auditoria do design pegou duas vezes.
 */
export function PassoTempo({
  estado,
  titulo,
  detalhe,
  progresso,
  ultimo = false,
  conectorGradiente = false,
}: {
  estado: EstadoPasso;
  titulo: string;
  detalhe: string;
  /** 0–100 quando o passo está em curso. */
  progresso?: number;
  ultimo?: boolean;
  conectorGradiente?: boolean;
}) {
  const marcador =
    estado === 'feito' ? (
      <div className="flex size-8 items-center justify-center rounded-tile-sm bg-green-tint">
        <Check size={16} strokeWidth={2.2} className="text-green" aria-hidden />
      </div>
    ) : estado === 'agora' ? (
      <div className="flex size-8 items-center justify-center rounded-tile-sm border-[1.5px] border-amber bg-amber-tint">
        <div className="size-[9px] animate-pulse rounded-full bg-amber" />
      </div>
    ) : (
      <div className="size-8 rounded-tile-sm border-[1.5px] border-dashed border-dash" />
    );

  const corTitulo =
    estado === 'agora'
      ? 'text-amber'
      : estado === 'futuro'
        ? 'text-ink-3'
        : 'text-ink';

  return (
    <li className="flex gap-[13px]">
      <div className="flex w-8 flex-none flex-col items-center">
        {marcador}
        {!ultimo && (
          <div
            className={`my-1 w-0.5 flex-1 ${
              conectorGradiente
                ? 'bg-gradient-to-b from-green to-amber'
                : estado === 'feito'
                  ? 'bg-green'
                  : 'bg-line'
            }`}
          />
        )}
      </div>

      <div
        className={`flex min-w-0 flex-1 flex-col gap-1 ${ultimo ? '' : 'pb-5'}`}
      >
        <div className={`t-item ${corTitulo}`}>{titulo}</div>
        <div className="text-[12.5px] leading-[18px] font-normal text-ink-2">
          {detalhe}
        </div>
        {progresso !== undefined && (
          <BarraProgresso className="mt-[11px]" valor={progresso} acento="amber" />
        )}
      </div>
    </li>
  );
}
