import { Lock } from 'lucide-react';

/**
 * O clímax do produto: a saída retida porque falta assinatura.
 *
 * Precisa parecer uma regra do sistema funcionando, nunca um erro. Fundo
 * vermelho tingido, cadeado, título em 700 vermelho, explicação em rosa
 * dessaturado. Este é o único lugar do app onde o vermelho aparece junto do
 * bloqueio — em avatar de pessoa, nunca.
 *
 * O texto padrão diz "a saída é executada", jamais "o Pix é executado": o demo
 * roda em devnet e a interface não afirma o que não faz.
 */
export function BlocoBloqueio({
  titulo = 'Saída retida pelo cofre',
  children = 'Ao assinar, a saída é executada na hora.',
  className = '',
}: {
  titulo?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start gap-[11px] rounded-tile bg-red-tint px-[14px] py-[13px] ${className}`}
      role="status"
    >
      <Lock
        size={18}
        strokeWidth={1.7}
        className="mt-px flex-none text-red"
        aria-hidden
      />
      <div className="min-w-0">
        <div className="text-[13px] leading-[1.25] font-bold text-red">
          {titulo}
        </div>
        <div className="t-desc mt-[5px] text-pretty text-red-ink">{children}</div>
      </div>
    </div>
  );
}
