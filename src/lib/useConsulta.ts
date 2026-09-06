import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Uma leitura do banco, com os três estados que toda tela precisa tratar.
 *
 * No Next isto era um Server Component com `try/catch`: carregando não existia,
 * porque o HTML já chegava pronto. Num SPA o carregando é real e precisa de
 * esqueleto — spinner não ocupa o espaço do conteúdo e a tela pula quando os
 * dados chegam.
 *
 * `recarregar` existe para o livro-caixa se atualizar sozinho: quem compra um
 * ingresso numa aba vê a entrada aparecer na outra sem tocar em nada.
 */
export type Consulta<T> = {
  dados: T | null;
  carregando: boolean;
  erro: unknown;
  recarregar: () => void;
};

export function useConsulta<T>(
  ler: () => Promise<T>,
  dependencias: unknown[] = [],
  opcoes: { intervalo?: number; pular?: boolean } = {},
): Consulta<T> {
  const [dados, setDados] = useState<T | null>(null);
  const [carregando, setCarregando] = useState(!opcoes.pular);
  const [erro, setErro] = useState<unknown>(null);

  // A função de leitura é recriada a cada render; guardá-la numa ref evita que
  // o efeito rode em laço sem que ninguém peça.
  const lerRef = useRef(ler);
  lerRef.current = ler;

  const [gatilho, setGatilho] = useState(0);
  const recarregar = useCallback(() => setGatilho((g) => g + 1), []);

  useEffect(() => {
    if (opcoes.pular) {
      setCarregando(false);
      return;
    }

    let vivo = true;
    // Só mostra esqueleto na primeira vez: numa recarga automática a tela não
    // pode piscar em branco com o conteúdo que já estava lá.
    setCarregando((c) => (dados === null ? true : c));
    setErro(null);

    lerRef
      .current()
      .then((r) => {
        if (vivo) {
          setDados(r);
          setCarregando(false);
        }
      })
      .catch((e) => {
        if (vivo) {
          console.error('[consulta] falhou', e);
          setErro(e);
          setCarregando(false);
        }
      });

    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, gatilho, opcoes.pular]);

  const intervalo = opcoes.intervalo;
  useEffect(() => {
    if (!intervalo) return;

    const t = setInterval(recarregar, intervalo);

    // O navegador estrangula temporizador de aba escondida — é o certo. Por
    // isso a volta da aba também recarrega: numa demonstração de duas abas, é
    // essa atualização que importa.
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') recarregar();
    };
    document.addEventListener('visibilitychange', aoVoltar);

    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', aoVoltar);
    };
  }, [intervalo, recarregar]);

  return { dados, carregando, erro, recarregar };
}
