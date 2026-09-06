import { FUNDO_TINGIDO, TEXTO_ACENTO, type Acento } from './acentos';

/**
 * Etiqueta curta — rubrica, estado, contagem.
 *
 * Nunca quebra em duas linhas: uma pílula de duas linhas deixa de ser pílula.
 * Se o texto não couber, encurte o texto, não o chip.
 */
export function Chip({
  children,
  acento,
  className = '',
}: {
  children: React.ReactNode;
  acento: Acento;
  className?: string;
}) {
  return (
    <span
      className={`t-chip inline-flex flex-none items-center rounded-chip px-[7px] py-[5px] ${FUNDO_TINGIDO[acento]} ${TEXTO_ACENTO[acento]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Variante neutra, para metadado que não carrega semântica de cor. */
export function ChipNeutro({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`t-chip inline-flex flex-none items-center rounded-chip border border-line bg-surface px-[7px] py-[5px] text-ink-2 ${className}`}
    >
      {children}
    </span>
  );
}
