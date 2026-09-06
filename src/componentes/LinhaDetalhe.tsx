/**
 * Par rótulo-valor de uma lista de detalhes — o bloco do comprovante.
 *
 * Flex com `justify-between`, `items-start` e gap. O valor alinha à direita e,
 * quando não cabe, desce para a linha seguinte ainda alinhado à direita —
 * nunca por cima do rótulo. Foi essa a cascata que quebrou a prancha 6c.
 *
 * `min-w-0` nos dois lados é o que permite o encolhimento; sem ele o flex
 * recusa a encolher e o texto transborda.
 */
export function LinhaDetalhe({
  rotulo,
  children,
  mono = false,
  destaque = false,
}: {
  rotulo: string;
  children: React.ReactNode;
  /** Chave, hash, referência — em fonte monoespaçada. */
  mono?: boolean;
  /** Valor monetário: peso 800 e tabular. */
  destaque?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="min-w-0 flex-none text-[12.5px] leading-[18px] font-normal text-ink-2">
        {rotulo}
      </span>
      <span
        className={`min-w-0 text-right leading-[18px] text-ink ${
          mono ? 'font-mono text-[12px]' : 'text-[12.5px]'
        } ${
          destaque
            ? 'num text-[13px] font-extrabold tracking-[-0.03em]'
            : mono
              ? 'num font-normal'
              : 'font-semibold'
        }`}
      >
        {children}
      </span>
    </div>
  );
}

/** Lista de pares, com 12px entre as linhas. */
export function ListaDetalhes({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3">{children}</div>;
}
