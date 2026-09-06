'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Faz a tela buscar de novo o que o servidor renderizou, de tempos em tempos.
 *
 * É o que fecha o circuito da festa do lado de quem assiste: o associado deixa
 * o livro-caixa aberto numa aba, alguém compra um ingresso na outra, e a
 * entrada aparece sozinha — sem recarregar, sem apertar nada.
 *
 * `router.refresh()` re-renderiza no servidor e troca só o que mudou, mantendo
 * a rolagem e o estado da página. Não é polling de API: é a mesma leitura sob
 * RLS que a página já faz.
 *
 * O navegador estrangula temporizador de aba escondida — é o certo, e por isso
 * a volta da aba também dispara uma atualização. Numa demonstração de duas
 * abas, é essa que importa: a atualização acontece no instante em que a pessoa
 * olha.
 */
export function AtualizaSozinho({ segundos = 8 }: { segundos?: number }) {
  const router = useRouter();

  useEffect(() => {
    const t = setInterval(() => router.refresh(), segundos * 1000);

    const aoVoltar = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };
    document.addEventListener('visibilitychange', aoVoltar);

    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', aoVoltar);
    };
  }, [router, segundos]);

  return null;
}
