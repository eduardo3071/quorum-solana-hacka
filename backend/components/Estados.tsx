import { BookOpen, Plus, WifiOff } from 'lucide-react';

import { Botao } from '@/components/Botao';
import { TileIcone } from '@/components/TileIcone';

/**
 * Carregando, vazio e erro — os três estados que toda tela precisa tratar.
 *
 * O vazio ensina o próximo passo em vez de só informar que está vazio, como na
 * prancha 6a. O erro fala em português de gente e diz o que NÃO aconteceu com
 * o dinheiro, como na 6e — é a primeira dúvida de quem vê a tela quebrar num
 * app de tesouraria.
 */

/** Esqueleto que ocupa o espaço do conteúdo enquanto ele não chega. */
export function Carregando({ linhas = 3 }: { linhas?: number }) {
  return (
    <div className="flex flex-col gap-2.5" aria-busy aria-label="Carregando">
      {Array.from({ length: linhas }, (_, i) => (
        <div
          key={i}
          className="min-h-[62px] animate-pulse rounded-card border border-line bg-surface"
        />
      ))}
    </div>
  );
}

export function Vazio({
  titulo,
  children,
  acao,
}: {
  titulo: string;
  children: React.ReactNode;
  acao?: { texto: string; href: string };
}) {
  return (
    <div className="flex items-start gap-3 rounded-card border border-dashed border-dash bg-surface p-4">
      <TileIcone icone={Plus} acento="blue" tamanho="md" />
      <div className="min-w-0 flex-1">
        <div className="t-item text-ink">{titulo}</div>
        <p className="t-desc mt-1.5 text-pretty text-ink-2">{children}</p>
        {acao && (
          <Botao className="mt-3.5" href={acao.href}>
            {acao.texto}
          </Botao>
        )}
      </div>
    </div>
  );
}

export function Erro({
  titulo = 'Não conseguimos falar com o cofre agora',
  children = 'Nada foi perdido e nenhum valor saiu. Tente de novo em instantes.',
}: {
  titulo?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-card bg-red-tint p-4" role="alert">
      <div className="flex items-start gap-3">
        <div className="flex size-[34px] flex-none items-center justify-center rounded-tile-sm bg-ground/30">
          <WifiOff size={18} strokeWidth={1.8} className="text-red" aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className="t-item text-ink">{titulo}</h2>
          <p className="t-desc mt-[7px] text-pretty text-red-ink">{children}</p>
        </div>
      </div>
    </div>
  );
}

/** Livro-caixa ainda sem lançamentos — o vazio do 6a, em versão discreta. */
export function LivroVazio() {
  return (
    <div className="flex items-center gap-[11px] rounded-card border border-dashed border-dash bg-surface p-3.5">
      <TileIcone icone={BookOpen} acento="purple" tamanho="md" />
      <div className="min-w-0 flex-1">
        <div className="t-item-sm text-ink-2">
          Livro-caixa ainda sem lançamentos
        </div>
        <div className="t-meta mt-[5px] text-ink-3">
          A primeira entrada aparece aqui automaticamente
        </div>
      </div>
    </div>
  );
}
