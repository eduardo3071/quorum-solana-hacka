import { notFound, redirect } from 'next/navigation';
import { CalendarDays, ChevronRight } from 'lucide-react';

import { BarraAbas } from '@/components/BarraAbas';
import { Chip } from '@/components/Chip';
import { Erro, Vazio } from '@/components/Estados';
import { Hero } from '@/components/Hero';
import { CorpoTela, Tela } from '@/components/Tela';
import { TileIcone } from '@/components/TileIcone';
import { entidadePorSlug, eventosDaEntidade, pendentes, usuarioAtual } from '@/lib/dados';
import { formatQuandoFesta } from '@/lib/format';

export const metadata = { title: 'Festas · Quórum' };

/**
 * As festas da entidade.
 *
 * A aba "Festas" apontava para `/f/[slug da entidade]` — endereço de evento
 * montado com o slug errado, que caía sempre em "Evento não encontrado".
 * Uma entidade tem várias festas ao longo do ano, então o destino certo da aba
 * é a lista, e daqui se entra em cada cartaz.
 */
export default async function Festas({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const sessao = await usuarioAtual();
  if (!sessao?.user) redirect(`/entrar?proxima=/e/${slug}/festas`);

  const entidade = await entidadePorSlug(slug);
  if (!entidade) notFound();

  let eventos, emAberto;
  try {
    [eventos, emAberto] = await Promise.all([
      eventosDaEntidade(entidade.id),
      pendentes(entidade.id),
    ]);
  } catch (e) {
    console.error('[festas] falha ao ler', e);
    return (
      <Tela>
        <Hero rotulo={entidade.nome} titulo="Festas" />
        <CorpoTela respiroAbas>
          <Erro titulo="A agenda não carregou">
            Nada mudou no cofre. Tente recarregar em instantes.
          </Erro>
        </CorpoTela>
        <BarraAbas ativa="festas" slug={slug} />
      </Tela>
    );
  }

  const agora = Date.now();

  return (
    <Tela>
      <Hero
        rotulo={entidade.nome}
        titulo="Festas"
        subtitulo={
          eventos.length === 0
            ? 'Nenhuma na agenda'
            : `${eventos.length} ${eventos.length === 1 ? 'evento' : 'eventos'} · a página de cada uma abre sem login`
        }
      />

      <CorpoTela respiroAbas className="pt-3">
        {eventos.length === 0 ? (
          <Vazio titulo="Nenhuma festa na agenda">
            Quando a diretoria criar um evento, o cartaz aparece aqui — e a
            página dele abre sem conta nenhuma, para vender ingresso no link.
          </Vazio>
        ) : (
          <div className="flex flex-col gap-2.5">
            {eventos.map((e) => {
              const passou = new Date(e.data).getTime() < agora;
              return (
                <a
                  key={e.id}
                  href={`/f/${e.slug}`}
                  className="flex min-h-[68px] items-center gap-[13px] rounded-card border border-line bg-surface px-3.5 py-3"
                >
                  <TileIcone icone={CalendarDays} acento="blue" tamanho="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="t-item truncate text-ink">{e.nome}</div>
                    <div className="mt-[5px] flex items-center gap-[7px]">
                      <span className="num t-meta whitespace-nowrap text-ink-2">
                        {formatQuandoFesta(e.data)}
                      </span>
                      {passou && <Chip acento="purple">encerrada</Chip>}
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    strokeWidth={1.8}
                    className="flex-none text-blue"
                    aria-hidden
                  />
                </a>
              );
            })}
          </div>
        )}

        <p className="t-meta text-pretty text-ink-3">
          O dinheiro dos ingressos cai direto no cofre da entidade, e cada
          compra vira uma entrada no livro-caixa sem ninguém digitar nada.
        </p>
      </CorpoTela>

      <BarraAbas
        ativa="festas"
        slug={slug}
        pendencias={emAberto.length}
        festaHref={`/e/${slug}/festas`}
      />
    </Tela>
  );
}
