import { Link, Navigate, useSearchParams } from 'react-router-dom';

import { useSessao } from '@/lib/sessao';

import { FormularioEntrada } from './FormularioEntrada';

const AVISOS: Record<string, string> = {
  expirado: 'Esse link já venceu ou já foi usado. Peça outro abaixo.',
  link: 'O link veio incompleto. Peça outro abaixo.',
  'outro-navegador':
    'Abra o link no mesmo aparelho em que você pediu. Se preferir, peça outro aqui.',
};

/**
 * Entrada por link no e-mail.
 *
 * O livro-caixa e a página da festa não passam por aqui — são públicos, e essa
 * é a tese do produto.
 */
export function Entrar() {
  const [busca] = useSearchParams();
  const sessao = useSessao();

  const erro = busca.get('erro') ?? undefined;
  const proxima = busca.get('proxima') ?? undefined;

  // Já logado não precisa de link nenhum.
  if (sessao.user) return <Navigate to={proxima ?? '/'} replace />;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col justify-center gap-6 px-4 py-10">
      <header>
        <p className="t-rotulo text-ink-3">Tesouraria estudantil</p>
        <h1 className="t-hero mt-2 text-ink">Quórum</h1>
        <p className="t-desc mt-1.5 text-pretty text-ink-2">
          O cofre da sua entidade, com duas assinaturas de três para qualquer
          saída.
        </p>
      </header>

      <FormularioEntrada
        aviso={erro ? AVISOS[erro] : undefined}
        proxima={proxima}
      />

      <p className="t-meta text-pretty text-ink-3">
        O{' '}
        <Link to="/e/aaaeng/livro" className="text-blue">
          livro-caixa
        </Link>{' '}
        é aberto e não pede login.
      </p>
    </main>
  );
}
