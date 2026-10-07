import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Copy } from 'lucide-react';

import { BarraAbas } from '@/componentes/BarraAbas';
import { Carregando, Erro, Vazio } from '@/componentes/Estados';
import { Hero } from '@/componentes/Hero';
import { CorpoTela, Tela } from '@/componentes/Tela';
import { chaveDeRecebimento } from '@/lib/api';
import { entidadePorSlug } from '@/lib/dados';
import { useConsulta } from '@/lib/useConsulta';

import { NaoEncontrada } from './NaoEncontrada';

/**
 * Receber dinheiro no cofre.
 *
 * A chave é a do caixa do próprio cofre — a mesma que já recebe o dinheiro dos
 * ingressos. Não existe chave pessoal aqui, e é essa a tese: o que entra nasce
 * atrás das duas assinaturas.
 */
export function Receber() {
  const { slug = '' } = useParams();

  const { dados, carregando, erro } = useConsulta(async () => {
    const entidade = await entidadePorSlug(slug);
    if (!entidade) return null;

    if (!entidade.multisig_pda) return { entidade, chave: null };

    try {
      const recebimento = await chaveDeRecebimento(slug);
      return { entidade, chave: recebimento };
    } catch {
      return { entidade, chave: null };
    }
  }, [slug]);

  if (carregando) {
    return (
      <Moldura slug={slug}>
        <Carregando linhas={4} />
      </Moldura>
    );
  }

  if (erro) {
    return (
      <Moldura slug={slug}>
        <Erro>
          A chave não carregou. Nada mudou no cofre — tente de novo em instantes.
        </Erro>
      </Moldura>
    );
  }

  if (!dados) return <NaoEncontrada />;

  if (!dados.chave) {
    return (
      <Moldura slug={slug}>
        <Vazio
          titulo="O cofre ainda não existe"
          acao={{ texto: 'Criar o cofre', href: `/${slug}/aprovacoes?estado=vivo` }}
        >
          A chave para receber é o caixa do cofre. Assim que o cofre existir, ela
          aparece aqui e a entidade já pode receber.
        </Vazio>
      </Moldura>
    );
  }

  return (
    <Moldura slug={slug}>
      <Painel slug={slug} chave={dados.chave.chave} />
    </Moldura>
  );
}

function Painel({ chave }: { slug: string; chave: string }) {
  const [copiado, setCopiado] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(chave);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setFalha('Não deu para copiar. Selecione a chave e copie à mão.');
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2 rounded-card border border-line bg-surface px-3.5 py-3">
        <span className="t-rotulo text-ink-3">Chave da entidade</span>
        <span className="break-all font-mono text-[12px] leading-[1.5] text-ink">
          {chave}
        </span>
        <button
          type="button"
          onClick={copiar}
          className="t-chip mt-1 flex min-h-[36px] items-center justify-center gap-1.5 rounded-btn border border-line bg-surface-2 px-3 text-blue"
        >
          <Copy size={14} strokeWidth={1.8} aria-hidden />
          {copiado ? 'Copiada' : 'Copiar chave'}
        </button>
      </div>

      <p className="t-desc text-pretty text-ink-2">
        Quem quiser pagar a entidade — outra liga, um patrocinador, um associado —
        envia para essa chave. O dinheiro cai no caixa do cofre, que continua
        exigindo duas assinaturas para qualquer saída.
      </p>

      {falha && <Erro>{falha}</Erro>}
    </>
  );
}

function Moldura({ slug, children }: { slug: string; children: React.ReactNode }) {
  return (
    <Tela>
      <Hero
        titulo="Receber"
        subtitulo="A chave da entidade, para entrar dinheiro no cofre"
      />
      <CorpoTela respiroAbas className="gap-2.5 pt-3">
        {children}
      </CorpoTela>
      <BarraAbas ativa="cofre" slug={slug} />
    </Tela>
  );
}
