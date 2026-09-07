import { useParams } from 'react-router-dom';
import { CalendarDays, ChevronRight } from 'lucide-react';

import { BarraAbas } from '@/componentes/BarraAbas';
import { Chip } from '@/componentes/Chip';
import { Botao } from '@/componentes/Botao';
import { Carregando, Erro, Vazio } from '@/componentes/Estados';
import { Hero } from '@/componentes/Hero';
import { CorpoTela, Tela } from '@/componentes/Tela';
import { TileIcone } from '@/componentes/TileIcone';
import { entidadePorSlug, eventosDaEntidade, pendentes, propostas } from '@/lib/dados';
import { formatQuandoFesta } from '@/lib/format';
import { useConsulta } from '@/lib/useConsulta';

import { NaoEncontrada } from './NaoEncontrada';

/**
 * As festas da entidade.
 *
 * Uma entidade tem várias ao longo do ano, então o destino da aba "Festas" é a
 * lista — e daqui se entra em cada cartaz, que abre sem login.
 */
export function Festas() {
  const { slug = '' } = useParams();

  const { dados, carregando, erro } = useConsulta(async () => {
    const entidade = await entidadePorSlug(slug);
    if (!entidade) return null;

    const [eventos, todas] = await Promise.all([
      eventosDaEntidade(entidade.id),
      propostas(entidade.id),
    ]);
    return { entidade, eventos, emAberto: pendentes(todas) };
  }, [slug]);

  if (erro) {
    return (
      <Tela>
        <Hero titulo="Festas" />
        <CorpoTela respiroAbas>
          <Erro titulo="A agenda não carregou">
            Nada mudou no cofre. Tente recarregar em instantes.
          </Erro>
        </CorpoTela>
        <BarraAbas ativa="festas" slug={slug} />
      </Tela>
    );
  }

  if (carregando) {
    return (
      <Tela>
        <Hero titulo="Festas" />
        <CorpoTela respiroAbas>
          <Carregando linhas={3} />
        </CorpoTela>
        <BarraAbas ativa="festas" slug={slug} />
      </Tela>
    );
  }

  if (!dados) return <NaoEncontrada />;

  const { entidade, eventos, emAberto } = dados;
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
        <Botao href={`/e/${slug}/festas/nova`}>Criar nova festa</Botao>

        {eventos.length === 0 ? (
          <Vazio titulo="Nenhuma festa na agenda">
            Crie um evento com dia, hora, preço e quantos ingressos existem — o
            cartaz dele abre sem conta nenhuma, para vender no link.
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
                  <ChevronRight size={18} strokeWidth={1.8} className="flex-none text-blue" aria-hidden />
                </a>
              );
            })}
          </div>
        )}

        <p className="t-meta text-pretty text-ink-3">
          O dinheiro dos ingressos cai direto no cofre da entidade, e cada compra
          vira uma entrada no livro-caixa sem ninguém digitar nada.
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
