/**
 * Moldura da tela. Mobile-first de verdade: no celular ocupa a viewport
 * inteira; a partir de 390px o conteúdo fica centrado nessa largura, que é a
 * das pranchas.
 *
 * `min-h-dvh` e não `h-[844px]`: altura fixa em tela corta conteúdo em
 * aparelho menor. As pranchas são 390 × 844 como referência de composição, não
 * como caixa rígida.
 */
export function Tela({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-ground ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Corpo rolável entre o hero e a barra de abas.
 *
 * `respiroAbas` reserva os 96px livres no fim da rolagem que toda tela com
 * abas precisa — sem isso a ação principal fica embaixo do botão flutuante.
 */
export function CorpoTela({
  children,
  respiroAbas = false,
  className = '',
}: {
  children: React.ReactNode;
  respiroAbas?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-1 flex-col gap-[11px] px-4 pt-3.5 ${
        respiroAbas ? 'respiro-abas' : 'pb-4'
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** Rótulo em caixa alta que abre uma seção dentro da tela. */
export function RotuloSecao({ children }: { children: React.ReactNode }) {
  return <div className="t-rotulo text-ink-3">{children}</div>;
}
