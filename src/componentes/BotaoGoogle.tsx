import { useState } from 'react';

import { supabase } from '@/lib/supabase';

/**
 * Entrada pela conta Google.
 *
 * Faz uma chamada de verdade — nada de botão de enfeite. Se o provedor não
 * estiver ligado no painel do Supabase, o erro que volta é `provider is not
 * enabled`, e a tela diz isso em português em vez de fingir que tentou. Um
 * botão que não faz nada é pior que um botão ausente: a pessoa clica, não
 * acontece nada, e ela conclui que o app está quebrado.
 */
export function BotaoGoogle({ proxima }: { proxima?: string }) {
  const [pendente, setPendente] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entrar() {
    setPendente(true);
    setErro(null);

    const destino = new URL('/auth/confirmar', window.location.origin);
    if (proxima) destino.searchParams.set('proxima', proxima);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: destino.toString() },
    });

    // Sem erro o navegador já saiu desta página; o `setPendente(false)` só
    // roda no caminho que falhou.
    if (!error) return;

    setPendente(false);
    console.error('[auth] falha no Google', error);

    setErro(
      /not enabled|provider/i.test(error.message)
        ? 'A entrada pelo Google ainda não está ligada. Use o link por e-mail.'
        : 'Não conseguimos falar com o Google agora. Use o link por e-mail.',
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void entrar()}
        disabled={pendente}
        className="flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-btn border border-line bg-surface px-4 py-[13px] text-[13px] font-bold text-ink disabled:text-ink-3"
      >
        <MarcaGoogle />
        {pendente ? 'Abrindo o Google…' : 'Continuar com Google'}
      </button>

      {erro && <p className="t-desc text-pretty text-red">{erro}</p>}
    </div>
  );
}

/** As quatro cores oficiais. Decorativa — o nome do botão já está no texto. */
function MarcaGoogle() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-2.8-.4-4.1H24v7.4h12.1c-.2 2-1.6 5.1-4.6 7.1l-.1.3 6.7 5.2.5.1c4.2-3.9 6.6-9.7 6.6-16z"
      />
      <path
        fill="#34A853"
        d="M24 46c6.1 0 11.2-2 14.9-5.5l-7.1-5.5c-1.9 1.3-4.4 2.2-7.8 2.2-6 0-11-3.9-12.8-9.3l-.3.02-7 5.4-.1.3C10.5 41.1 16.7 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.2 27.9c-.5-1.4-.8-2.9-.8-4.4s.3-3 .7-4.4v-.3l-7.1-5.5-.2.1C2.3 16.5 1.5 20.1 1.5 23.5s.8 7 2.3 10.1l7.4-5.7z"
      />
      <path
        fill="#EB4335"
        d="M24 9.8c4.3 0 7.1 1.8 8.8 3.4l6.4-6.2C35.2 3.5 30.1 1.5 24 1.5 16.7 1.5 10.5 6.4 7.5 13.4l7.6 5.7C17 13.7 22 9.8 24 9.8z"
      />
    </svg>
  );
}
