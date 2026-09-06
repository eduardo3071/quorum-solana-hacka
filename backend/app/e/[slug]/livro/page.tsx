import { notFound } from 'next/navigation';
import { ArrowDown, ArrowUp, Search, SlidersHorizontal } from 'lucide-react';

import { Chip } from '@/components/Chip';
import { COR_DA_RUBRICA, type Rubrica } from '@/components/acentos';
import { Erro, LivroVazio, Vazio } from '@/components/Estados';
import { Hero } from '@/components/Hero';
import { CorpoTela, Tela } from '@/components/Tela';
import { TileIcone } from '@/components/TileIcone';
import { AtualizaSozinho } from '@/components/vivo/AtualizaSozinho';
import {
  QUORUM,
  associados,
  entidadePorSlug,
  lancamentos,
  totais,
} from '@/lib/dados';
import { formatBRL, formatComSinal, formatData } from '@/lib/format';

const RUBRICAS = ['Eventos', 'Marketing', 'Esporte', 'Associados'] as const;

/**
 * A prancha 5c escreve "Sócios" no chip, mas a rubrica no banco é
 * "Associados". O rótulo é da tela, o valor é do banco — e é por isso que os
 * dois moram aqui juntos, em vez de alguém traduzir na mão em dois lugares.
 */
const FILTROS: { rotulo: string; rubrica?: Rubrica }[] = [
  { rotulo: 'Todas' },
  { rotulo: 'Eventos', rubrica: 'Eventos' },
  { rotulo: 'Marketing', rubrica: 'Marketing' },
  { rotulo: 'Esporte', rubrica: 'Esporte' },
  { rotulo: 'Sócios', rubrica: 'Associados' },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // O título é enfeite; se o banco não responder, a página ainda abre e diz o
  // que houve. Não é aqui que uma falha de rede vira erro 500.
  const entidade = await entidadePorSlug(slug).catch(() => null);
  return {
    title: `Livro-caixa · ${entidade?.nome ?? 'Quórum'}`,
    description: `Livro-caixa público. Toda saída exige ${QUORUM.de} de ${QUORUM.entre} assinaturas.`,
  };
}

/**
 * 5c · Livro-caixa público.
 *
 * Abre sem sessão: é a página que um associado manda no grupo. A leitura passa
 * pelo cliente anônimo e é a política do banco que libera — só entidade com
 * `publico = true`. Se alguém fechar o livro-caixa, esta página escurece
 * sozinha, sem precisar de código aqui.
 */
export default async function LivroCaixa({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ rubrica?: string; busca?: string }>;
}) {
  const { slug } = await params;
  const { rubrica, busca } = await searchParams;

  // O filtro vive na URL, não em estado do cliente: assim o livro-caixa
  // filtrado é um link que se manda no grupo, e a página continua sendo lida
  // no servidor sob RLS.
  const filtro = {
    rubrica: (RUBRICAS as readonly string[]).includes(rubrica ?? '')
      ? (rubrica as Rubrica)
      : undefined,
    busca: busca?.trim() || undefined,
  };
  const filtrando = Boolean(filtro.rubrica || filtro.busca);

  // A leitura da entidade entra no mesmo `try` do extrato: esta é a página que
  // circula em grupo de WhatsApp, e um erro de rede aqui não pode virar a tela
  // de erro do Next. `notFound()` fica fora, porque ele próprio lança.
  let entidade, linhas, soma, socios;
  try {
    entidade = await entidadePorSlug(slug);
    if (entidade) {
      [linhas, soma, socios] = await Promise.all([
        lancamentos(entidade.id, undefined, filtro),
        totais(entidade.id),
        associados(entidade.id),
      ]);
    }
  } catch (e) {
    console.error('[livro] falha ao ler', e);
    return (
      <Tela>
        <Hero className="pb-4" titulo="Livro-caixa" />
        <CorpoTela>
          <Erro titulo="Não conseguimos abrir o livro-caixa agora">
            O extrato não carregou. Nada mudou no cofre — tente recarregar a
            página em instantes.
          </Erro>
        </CorpoTela>
      </Tela>
    );
  }

  if (!entidade || !linhas || !soma || socios === undefined) notFound();

  const periodo =
    linhas.length > 0
      ? `${formatData(linhas[linhas.length - 1].criado_em)} — ${formatData(linhas[0].criado_em)}`
      : 'sem lançamentos';

  return (
    <Tela>
      {/* Uma compra feita na página da festa aparece aqui sozinha. */}
      <AtualizaSozinho />

      <Hero className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <span className="t-rotulo whitespace-nowrap text-white/80">
            Livro-caixa público
          </span>
          <span className="t-chip flex-none rounded-chip border border-green/55 bg-green/30 px-2 py-[5px] text-[#D6F7E3]">
            aberto
          </span>
        </div>
        <h1 className="t-hero mt-2.5 text-white">{entidade.nome}</h1>
        <div className="mt-[5px] text-[12.5px] leading-[1.4] font-medium text-white/85">
          {periodo} · {socios} associados
        </div>
      </Hero>

      <CorpoTela className="pb-4">
        <div className="grid grid-cols-3 overflow-hidden rounded-card border border-line bg-surface">
          <Total rotulo="Entrou" valor={formatBRL(soma.entrou)} cor="text-green" borda />
          <Total rotulo="Saiu" valor={formatBRL(soma.saiu)} cor="text-ink" borda />
          <Total rotulo="Saldo" valor={formatBRL(soma.saldo)} cor="text-ink" />
        </div>

        {/*
          Formulário GET de verdade, sem JavaScript: a busca vira `?busca=` na
          URL, a página relê no servidor sob RLS e o resultado é um link que se
          manda no grupo. Uma caixa de busca que não busca é pior que caixa
          nenhuma — promete e não cumpre.
        */}
        <form method="get" className="flex gap-2">
          {filtro.rubrica && (
            <input type="hidden" name="rubrica" value={filtro.rubrica} />
          )}
          <label htmlFor="busca" className="sr-only">
            Buscar lançamento
          </label>
          <div className="flex flex-1 items-center gap-[9px] rounded-btn border border-line bg-surface px-[13px] py-[11px] focus-within:border-blue">
            <Search size={17} strokeWidth={1.8} className="text-ink-3" aria-hidden />
            <input
              id="busca"
              name="busca"
              type="search"
              defaultValue={filtro.busca ?? ''}
              placeholder="Buscar lançamento"
              /* Sem `outline-none`: o anel de foco é a única pista de onde o
                 teclado está. A borda azul do contêiner acompanha, não
                 substitui. */
              className="w-full bg-transparent text-[13px] leading-none font-medium text-ink placeholder:text-ink-3"
            />
          </div>
          <button
            type="submit"
            aria-label="Buscar"
            className="flex w-[43px] flex-none items-center justify-center rounded-btn border border-line bg-surface"
          >
            <SlidersHorizontal size={17} strokeWidth={1.8} className="text-blue" aria-hidden />
          </button>
        </form>

        <div className="flex gap-[7px] overflow-x-auto">
          {FILTROS.map((f) => {
            const ativo = f.rubrica === filtro.rubrica;
            const alvo = new URLSearchParams();
            if (f.rubrica && !ativo) alvo.set('rubrica', f.rubrica);
            if (filtro.busca) alvo.set('busca', filtro.busca);
            const consulta = alvo.toString();

            return (
              <a
                key={f.rotulo}
                href={consulta ? `?${consulta}` : '?'}
                aria-current={ativo ? 'true' : undefined}
                className={`t-chip flex-none rounded-[9px] px-2.5 py-2 ${
                  ativo
                    ? 'bg-blue text-ground'
                    : 'border border-line bg-surface text-ink-2'
                }`}
              >
                {f.rotulo}
              </a>
            );
          })}
        </div>

        {linhas.length === 0 ? (
          filtrando ? (
            <Vazio
              titulo="Nenhum lançamento com esse filtro"
              acao={{ texto: 'Limpar filtro', href: '?' }}
            >
              O livro-caixa tem lançamentos — nenhum deles casa com o que você
              procurou.
            </Vazio>
          ) : (
            <LivroVazio />
          )
        ) : (
          <div className="flex flex-col gap-2">
            {linhas.map((l) => (
              <article
                key={l.id}
                className="flex min-h-[58px] items-center gap-[11px] rounded-[14px] border border-line bg-surface px-3 py-2.5"
              >
                <TileIcone
                  icone={l.tipo === 'entrada' ? ArrowUp : ArrowDown}
                  acento={COR_DA_RUBRICA[l.rubrica]}
                  tamanho="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="t-item-sm truncate text-ink">{l.descricao}</div>
                  <div className="mt-[5px] flex items-center gap-[7px]">
                    <Chip acento={COR_DA_RUBRICA[l.rubrica]}>{l.rubrica}</Chip>
                    <span className="num t-meta text-ink-3">
                      {formatData(l.criado_em)}
                    </span>
                    {l.tx_signature && (
                      <a
                        href={`https://explorer.solana.com/tx/${l.tx_signature}?cluster=devnet`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10.5px] leading-none font-medium text-blue"
                      >
                        comprovante
                      </a>
                    )}
                  </div>
                </div>
                <span
                  className={`num flex-none text-[14px] leading-none font-extrabold tracking-[-0.03em] ${
                    l.tipo === 'entrada' ? 'text-green' : 'text-ink'
                  }`}
                >
                  {formatComSinal(l.valor_centavos, l.tipo, { simbolo: false })}
                </span>
              </article>
            ))}
          </div>
        )}

        <p className="mt-auto border-t border-line pt-[11px] text-[11px] leading-[1.5] text-ink-3">
          Publicado pela diretoria · toda saída exige {QUORUM.de} de{' '}
          {QUORUM.entre} assinaturas
        </p>
      </CorpoTela>
    </Tela>
  );
}

function Total({
  rotulo,
  valor,
  cor,
  borda = false,
}: {
  rotulo: string;
  valor: string;
  cor: string;
  borda?: boolean;
}) {
  return (
    <div className={`px-3 py-[13px] ${borda ? 'border-r border-line' : ''}`}>
      <div className="t-rotulo text-ink-2">{rotulo}</div>
      <div
        className={`num mt-2.5 text-[13.5px] leading-none font-extrabold tracking-[-0.03em] ${cor}`}
      >
        {valor}
      </div>
    </div>
  );
}
