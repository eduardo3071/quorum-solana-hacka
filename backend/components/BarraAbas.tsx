import Link from 'next/link';
import { Calendar, Check, Plus, User, Wallet } from 'lucide-react';

export type AbaAtiva = 'cofre' | 'aprovar' | 'festas' | 'perfil' | null;

/**
 * Cinco posições: Cofre · Aprovar · [botão flutuante Propor] · Festas · Perfil.
 *
 * A aba ativa em azul. A aba Aprovar leva um selo vermelho circular com a
 * contagem de pendências — é o único vermelho fora do bloqueio, e ele conta
 * coisa retida, então a regra se mantém.
 *
 * O botão flutuante é SEMPRE azul, em todas as telas, nunca cinza e nunca
 * desabilitado: é uma ação global. Ele sobe com margem negativa, não com
 * `position: absolute` — a única exceção ao absoluto neste projeto é o selo de
 * contagem, que é decoração colada no ícone.
 *
 * Não aparece em `/e/[slug]/livro` nem em `/f/[slug]`: são páginas públicas.
 */
export function BarraAbas({
  ativa,
  slug,
  pendencias = 0,
  festaHref,
}: {
  ativa: AbaAtiva;
  slug: string;
  pendencias?: number;
  /** Atalho direto para uma festa. Sem ele, a aba abre a lista. */
  festaHref?: string;
}) {
  return (
    <nav
      className="grid flex-none grid-cols-5 items-end border-t border-line bg-tabbar px-2 pt-2.5 pb-4"
      aria-label="Navegação principal"
    >
      <Aba
        href={`/e/${slug}`}
        icone={Wallet}
        rotulo="Cofre"
        ativa={ativa === 'cofre'}
      />
      <Aba
        href={`/e/${slug}/aprovacoes`}
        icone={Check}
        rotulo="Aprovar"
        ativa={ativa === 'aprovar'}
        selo={pendencias}
      />

      <div className="flex justify-center">
        <Link
          href={`/e/${slug}/propor`}
          aria-label="Propor saída"
          className="-mt-[30px] flex size-[58px] items-center justify-center rounded-full border-4 border-tabbar bg-blue shadow-[0_8px_22px_rgba(31,165,255,.4)]"
        >
          <Plus size={24} strokeWidth={2.2} className="text-ground" aria-hidden />
        </Link>
      </div>

      {/*
        `festaHref` e não `/f/${slug}`: aquele endereço montava a página de um
        EVENTO com o slug da ENTIDADE, e caía sempre em "evento não
        encontrado". Uma entidade tem várias festas; o destino da aba é a
        lista, e quem sabe qual é a próxima passa o atalho direto.
      */}
      <Aba
        href={festaHref ?? `/e/${slug}/festas`}
        icone={Calendar}
        rotulo="Festas"
        ativa={ativa === 'festas'}
      />
      <Aba
        href="/perfil"
        icone={User}
        rotulo="Perfil"
        ativa={ativa === 'perfil'}
      />
    </nav>
  );
}

function Aba({
  href,
  icone: Icone,
  rotulo,
  ativa,
  selo = 0,
}: {
  href: string;
  icone: typeof Wallet;
  rotulo: string;
  ativa: boolean;
  selo?: number;
}) {
  const cor = ativa ? 'text-blue' : 'text-ink-3';

  return (
    <Link
      href={href}
      aria-current={ativa ? 'page' : undefined}
      className="flex flex-col items-center gap-1.5"
    >
      <span className="relative">
        <Icone size={21} strokeWidth={1.8} className={cor} aria-hidden />
        {selo > 0 && (
          // Absoluto de propósito: é um selo colado no ícone, não conteúdo em
          // fluxo. Nada abaixo dele se desloca.
          <span className="num absolute -top-1.5 -right-[9px] flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-tabbar bg-red px-1 text-[10px] leading-none font-bold text-ground">
            {selo}
          </span>
        )}
      </span>
      <span className={`t-chip ${cor}`}>{rotulo}</span>
    </Link>
  );
}
