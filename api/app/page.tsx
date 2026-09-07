import Link from 'next/link';

/**
 * A raiz desta porta não é o app.
 *
 * Esta pasta já se chamou `backend/` e carregava uma cópia inteira das telas —
 * onze páginas de antes da separação. Elas liam o banco pela versão antiga, não
 * passavam pela autorização nova e, pior, PARECIAM o produto: quem abrisse
 * localhost:3000 achava que estava vendo o Quórum, e via uma interface velha.
 *
 * Não é hipótese: aconteceu. A dúvida "por que a interface está antiga?" custou
 * uma rodada inteira. Daí o nome `api/` e daí esta página: as duas dizem a
 * mesma coisa, e nenhuma das duas custa nada.
 */
export default function Raiz() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[520px] flex-col justify-center gap-5 px-6">
      <div>
        <p className="t-rotulo text-ink-3">Quórum</p>
        <h1 className="t-hero mt-2 text-ink">Isto é a API</h1>
      </div>

      <p className="t-corpo text-pretty text-ink-2">
        A interface do Quórum não mora aqui. Ela é um projeto separado, na raiz
        do repositório, e sobe noutra porta:
      </p>

      <pre className="overflow-x-auto rounded-card border border-line bg-surface p-4 text-[12.5px] leading-[1.7] text-ink-2">
        <code>
          {'# a interface\ncd ..\nnpm run dev      → http://localhost:8080\n\n'}
          {'# a API (esta porta)\ncd api\nnpm run dev      → http://localhost:3000'}
        </code>
      </pre>

      <p className="t-desc text-pretty text-ink-2">
        No <code className="text-ink">.env</code> da raiz, aponte a interface
        para cá com{' '}
        <code className="text-ink">VITE_API_URL=http://localhost:3000</code> —
        sem isso ela fala com a API publicada, que pode estar noutra versão.
      </p>

      <Link
        href="/estilo"
        className="flex min-h-[50px] items-center justify-center rounded-btn bg-blue px-4 text-[13.5px] font-bold text-ground"
      >
        Ver a folha de estilo
      </Link>

      <p className="t-meta text-pretty text-ink-3">
        Os endpoints ficam em <code>/api</code>. Sem sessão, os do cofre
        respondem 401 — <code>npm run acesso</code> confere isso.
      </p>
    </main>
  );
}
