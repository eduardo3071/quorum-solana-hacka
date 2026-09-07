import { Link } from 'react-router-dom';

type Variante = 'primario' | 'secundario' | 'destrutivo' | 'desabilitado';

const ESTILO: Record<Variante, string> = {
  primario: 'bg-blue text-ground',
  secundario: 'border border-line bg-surface text-ink',
  destrutivo: 'bg-red-tint text-red',
  // Cinza da linha (#243448), não da superfície elevada: dentro de um cartão
  // `surface-2` o botão precisa se destacar do fundo, senão vira texto solto.
  desabilitado: 'bg-line text-ink-3 cursor-not-allowed',
};

/**
 * Botão do sistema. Raio 13px, peso 700, sem sombra.
 *
 * O estado desabilitado é desenhado, não um `opacity: .5`: na tela de
 * aprovações ele precisa comunicar "a regra está funcionando", e um botão
 * apagado lê como bug.
 */
export function Botao({
  children,
  variante = 'primario',
  href,
  type = 'button',
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  variante?: Variante;
  href?: string;
  type?: 'button' | 'submit';
  onClick?: () => void;
  className?: string;
}) {
  const desabilitado = variante === 'desabilitado';
  const classe = `block w-full rounded-btn px-4 py-[14px] text-center text-[13px] leading-none font-bold ${ESTILO[variante]} ${className}`;

  if (href && !desabilitado) {
    // `mailto:` e endereços externos não são rota do app: `Link` os trataria
    // como caminho interno e a navegação morreria dentro da página.
    const externo = /^(mailto:|https?:)/.test(href);

    return externo ? (
      <a href={href} className={classe}>
        {children}
      </a>
    ) : (
      <Link to={href} className={classe}>
        {children}
      </Link>
    );
  }


  return (
    <button
      type={type}
      onClick={onClick}
      disabled={desabilitado}
      aria-disabled={desabilitado}
      className={classe}
    >
      {children}
    </button>
  );
}
