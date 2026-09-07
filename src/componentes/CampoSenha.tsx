import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

/**
 * O campo de senha, irmão do de e-mail.
 *
 * Ícone e `<input>` são irmãos num flex — nada posicionado por cima, então
 * senha longa nunca passa por baixo do cadeado. O olho que revela é um botão
 * de verdade, com nome para leitor de tela: sem ele, quem erra a digitação no
 * celular não tem como conferir.
 */
export function CampoSenha({
  id,
  rotulo,
  valor,
  aoMudar,
  autoComplete = 'current-password',
  dica,
}: {
  id: string;
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  autoComplete?: 'current-password' | 'new-password';
  dica?: string;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="t-item-sm mb-2 block text-ink">
        {rotulo}
      </label>

      <div className="flex min-h-[52px] items-center gap-2.5 rounded-[14px] border border-white/12 bg-[#0A1526] px-3.5 focus-within:border-blue">
        <Lock size={17} strokeWidth={1.7} className="flex-none text-ink-3" aria-hidden />
        <input
          id={id}
          name={autoComplete === 'new-password' ? 'new-password' : 'password'}
          type={aberto ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          minLength={8}
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          placeholder="••••••••"
          className="w-full bg-transparent py-3 text-[13.5px] font-medium text-ink placeholder:text-ink-3"
        />
        <button
          type="button"
          onClick={() => setAberto((a) => !a)}
          aria-label={aberto ? 'Esconder a senha' : 'Mostrar a senha'}
          className="flex min-h-[38px] flex-none items-center px-1 text-ink-3"
        >
          {aberto ? (
            <EyeOff size={17} strokeWidth={1.7} aria-hidden />
          ) : (
            <Eye size={17} strokeWidth={1.7} aria-hidden />
          )}
        </button>
      </div>

      {dica && <p className="t-meta mt-1.5 text-pretty text-ink-3">{dica}</p>}
    </div>
  );
}
