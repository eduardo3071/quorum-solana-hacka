import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';

import { BotaoGoogle } from '@/componentes/BotaoGoogle';
import { FUNDO_CAPA } from '@/componentes/fundo';
import { MarcaQuorum } from '@/componentes/MarcaQuorum';
import { useSessao } from '@/lib/sessao';

import { FormularioCriarEntidade } from './FormularioCriarEntidade';
import { FormularioEntrada } from './FormularioEntrada';

const AVISOS: Record<string, string> = {
  expirado: 'Esse link já venceu ou já foi usado. Peça outro abaixo.',
  link: 'O link veio incompleto. Peça outro abaixo.',
  'outro-navegador':
    'Abra o link no mesmo aparelho em que você pediu. Se preferir, peça outro aqui.',
};

type Aba = 'entrar' | 'criar';

/**
 * A porta: entrar, ou fazer nascer uma entidade.
 *
 * O livro-caixa e a página da festa não passam por aqui — são públicos, e essa
 * é a tese do produto.
 */
export function Entrar() {
  const [busca] = useSearchParams();
  const sessao = useSessao();

  // Quem chega por link vencido quer entrar, não criar. `?aba=criar` abre na
  // outra, para a capa poder mandar direto.
  const [aba, setAba] = useState<Aba>(busca.get('aba') === 'criar' ? 'criar' : 'entrar');

  const erro = busca.get('erro') ?? undefined;
  const proxima = busca.get('proxima') ?? undefined;

  if (sessao.user) return <Navigate to={proxima ?? '/'} replace />;

  return (
    <main
      style={FUNDO_CAPA}
      className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col justify-center gap-6 px-4 py-10"
    >
      <header className="flex flex-col items-center text-center">
        <MarcaQuorum tamanho={92} />
        <h1 className="mt-3 text-[34px] leading-none font-extrabold tracking-[-0.03em] text-ink">
          Quórum
        </h1>
        <p className="t-rotulo mt-2 text-blue-ink">Tesouraria estudantil</p>
        <p className="t-corpo mt-3 text-pretty text-ink">
          Mais transparência para
          <br />
          uma atlética mais forte.
        </p>
      </header>

      <section className="rounded-card border border-line bg-surface/85 p-4 backdrop-blur-sm">
        <div
          role="tablist"
          aria-label="Entrar ou criar entidade"
          className="mb-4 grid grid-cols-2 gap-2"
        >
          <BotaoAba atual={aba} valor="entrar" ao={setAba}>
            Entrar
          </BotaoAba>
          <BotaoAba atual={aba} valor="criar" ao={setAba}>
            Criar entidade
          </BotaoAba>
        </div>

        {aba === 'entrar' ? (
          <div id="painel-entrar" role="tabpanel" aria-labelledby="aba-entrar">
            <FormularioEntrada
              aviso={erro ? AVISOS[erro] : undefined}
              rotulo="E-mail institucional"
              proxima={proxima}
            />
          </div>
        ) : (
          <div id="painel-criar" role="tabpanel" aria-labelledby="aba-criar">
            <FormularioCriarEntidade />
          </div>
        )}

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="t-rotulo text-ink-3">ou</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <BotaoGoogle proxima={proxima} />

        <Link
          to="/"
          className="mt-4 flex min-h-[36px] items-center justify-center gap-1 text-[13px] font-semibold text-ink-2"
        >
          <ChevronLeft size={15} strokeWidth={2} aria-hidden />
          Voltar
        </Link>
      </section>

      {/*
        Texto, não link: as duas páginas ainda não existem, e link que leva a
        lugar nenhum é pior que a frase sozinha — a pessoa toca, nada acontece,
        e passa a desconfiar do resto da tela.
      */}
      <p className="t-meta text-center text-pretty text-ink-3">
        Ao entrar você aceita os Termos e a Política de Privacidade.
      </p>
    </main>
  );
}

function BotaoAba({
  atual,
  valor,
  ao,
  children,
}: {
  atual: Aba;
  valor: Aba;
  ao: (a: Aba) => void;
  children: React.ReactNode;
}) {
  const ativo = atual === valor;

  return (
    <button
      id={`aba-${valor}`}
      type="button"
      role="tab"
      aria-selected={ativo}
      aria-controls={`painel-${valor}`}
      onClick={() => ao(valor)}
      className={`min-h-[46px] rounded-btn border px-3 py-3 text-[13.5px] font-bold whitespace-nowrap ${
        ativo
          ? 'border-blue bg-blue-tint text-ink'
          : 'border-transparent bg-transparent text-ink-2'
      }`}
    >
      {children}
    </button>
  );
}

