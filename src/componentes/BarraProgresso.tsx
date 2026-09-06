import { FUNDO_SOLIDO, type Acento } from './acentos';

/**
 * Trilho de 5px com preenchimento na cor do estado.
 *
 * `valor` é 0–100. Em 0 o preenchimento fica com uma lasca visível: uma barra
 * completamente vazia lê como componente quebrado, não como "ninguém assinou".
 */
export function BarraProgresso({
  valor,
  acento,
  neutro = false,
  className = '',
}: {
  valor: number;
  acento: Acento;
  /** Estado sem semântica ainda — cinza em vez de cor. */
  neutro?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, valor));

  return (
    <div
      className={`h-[5px] overflow-hidden rounded-chip bg-line ${className}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full ${neutro ? 'bg-ink-3' : FUNDO_SOLIDO[acento]}`}
        style={{ width: `${pct === 0 ? 2 : pct}%` }}
      />
    </div>
  );
}
