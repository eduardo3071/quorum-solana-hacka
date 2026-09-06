import { Mail } from 'lucide-react';

/**
 * O campo de e-mail das pranchas: envelope à esquerda, dentro da moldura.
 *
 * O ícone e o `<input>` são irmãos num flex, e não um ícone posicionado por
 * cima. Absoluto ali significaria texto passando por baixo do envelope assim
 * que o endereço ficasse longo — e endereço institucional é longo. Com flex, o
 * campo simplesmente começa depois do ícone.
 *
 * A moldura mora no `<label>`, então tocar em qualquer ponto dela põe o cursor
 * no campo. `focus-within` traz a borda azul para a moldura inteira, senão o
 * anel de foco apareceria só em volta do `<input>`, desalinhado da caixa que a
 * pessoa vê.
 */
export function CampoEmail({
  id,
  rotulo,
  valor,
  aoMudar,
  placeholder = 'voce@grad.ufsc.br',
  rotuloOculto = false,
}: {
  id: string;
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  placeholder?: string;
  rotuloOculto?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className={rotuloOculto ? 'sr-only' : 't-item-sm mb-2 block text-ink'}
      >
        {rotulo}
      </label>

      <div className="flex min-h-[52px] items-center gap-2.5 rounded-[14px] border border-white/12 bg-[#0A1526] px-3.5 focus-within:border-blue">
        <Mail size={17} strokeWidth={1.7} className="flex-none text-ink-3" aria-hidden />
        <input
          id={id}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent py-3 text-[13.5px] font-medium text-ink placeholder:text-ink-3"
        />
      </div>
    </div>
  );
}
