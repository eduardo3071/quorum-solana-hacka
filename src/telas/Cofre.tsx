import { useParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CalendarDays,
  Lock,
  Plus,
  Users,
  Wallet,
} from 'lucide-react';

import { AcoesRapidas } from '@/componentes/AcoesRapidas';
import { BarraAbas } from '@/componentes/BarraAbas';
import { CartaoBanner } from '@/componentes/CartaoBanner';
import { CartaoStat } from '@/componentes/CartaoStat';
import { Chip } from '@/componentes/Chip';
import { COR_DA_RUBRICA } from '@/componentes/acentos';
import { Carregando, Erro } from '@/componentes/Estados';
import { Hero } from '@/componentes/Hero';
import { LinhaLista } from '@/componentes/LinhaLista';
import { CorpoTela, Tela } from '@/componentes/Tela';
import {
  QUORUM,
  associados,
  entidadePorSlug,
  lancamentos,
  pendentes,
  propostas,
  retido,
  solicitacoes,
  totais,
} from '@/lib/dados';

import { formatCompacto, formatComSinal, formatDataCurta } from '@/lib/format';
import { useConsulta } from '@/lib/useConsulta';

import { NaoEncontrada } from './NaoEncontrada';

/**
 * 5a · Cofre da entidade.
 *
 * Os três signatários NÃO aparecem aqui: foram para o perfil. Tirá-los é o que
 * dá respiro à tela.
 */
export function Cofre() {
  const { slug = '' } = useParams();

  const { dados, carregando, erro } = useConsulta(async () => {
    const entidade = await entidadePorSlug(slug);
    if (!entidade) return null;

    // O saldo é somado sobre as MESMAS linhas que a tela mostra: um resumo que
    // não bate com a lista logo abaixo é o pior erro num livro-caixa.
    const [todas, lista, socios, esperando] = await Promise.all([
      lancamentos(entidade.id),
      propostas(entidade.id),
      associados(entidade.id),
      solicitacoes(entidade.id),
    ]);

    return {
      entidade,
      linhas: todas.slice(0, 3),
      soma: totais(todas),
      emAberto: pendentes(lista),
      valorRetido: retido(lista),
      socios,
      esperando: esperando.length,
    };
  }, [slug]);

  if (erro) {
    return (
      <Tela>
        <Hero titulo="Cofre" />
        <CorpoTela respiroAbas>
          <Erro>
            O saldo não carregou. Nenhum valor saiu do cofre — recarregue a
            página em instantes.
          </Erro>
        </CorpoTela>
        <BarraAbas ativa="cofre" slug={slug} />
      </Tela>
    );
  }

  if (carregando) {
    return (
      <Tela>
        <Hero titulo="Cofre" />
        <CorpoTela respiroAbas>
          <Carregando linhas={5} />
        </CorpoTela>
        <BarraAbas ativa="cofre" slug={slug} />
      </Tela>
    );
  }

  if (!dados) return <NaoEncontrada />;

  const { entidade, linhas, soma, emAberto, valorRetido, socios, esperando } = dados;

  return (
    <Tela>
      <Hero
        rotulo={`${entidade.tipo === 'atletica' ? 'Atlética' : entidade.tipo} · ${entidade.universidade ?? ''}`}
        titulo={entidade.nome}
        subtitulo={`${socios} ${socios === 1 ? 'associado' : 'associados'}`}
        pilula={`${QUORUM.de} de ${QUORUM.entre}`}
      />

      <CorpoTela respiroAbas className="gap-[9px] pt-3">
        <CartaoBanner
          icone={Lock}
          acento="blue"
          titulo="Cofre com quórum"
          subtitulo={`Nenhuma saída sem ${QUORUM.de} assinaturas`}
        />

        {/*
          Liga nova não perde a tela inteira por não ter movimentação: os quatro
          cartões aparecem zerados, as ações continuam ao alcance e o convite
          para criar o cofre na rede vira uma faixa, não uma parede.
        */}
        {!entidade.multisig_pda && (
          <a
            href={`/${slug}/aprovacoes?estado=vivo`}
            className="flex min-h-[52px] items-center justify-between gap-3 rounded-card border border-blue/30 bg-blue-tint px-3.5 py-3"
          >
            <span className="t-desc text-pretty text-ink">
              O cofre ainda não existe na rede. Criar leva alguns segundos.
            </span>
            <span className="t-chip whitespace-nowrap text-blue">Criar ›</span>
          </a>
        )}

        {/*
          A entidade também RECEBE. A chave é a do caixa do cofre — sem ela na
          tela, o cofre só sabia sair.
        */}
        {entidade.multisig_pda && (
          <a
            href={`/${slug}/receber`}
            className="flex min-h-[52px] items-center justify-between gap-3 rounded-card border border-green/30 bg-green-tint px-3.5 py-3"
          >
            <span className="t-desc text-pretty text-ink">
              Receber dinheiro na chave da entidade
            </span>
            <span className="t-chip whitespace-nowrap text-green">Ver ›</span>
          </a>
        )}

        {esperando > 0 && (
          <a
            href={`/${slug}/socios`}
            className="flex min-h-[52px] items-center justify-between gap-3 rounded-card border border-amber/30 bg-amber-tint px-3.5 py-3"
          >
            <span className="t-desc text-pretty text-ink">
              {esperando === 1
                ? '1 pessoa pediu para entrar'
                : `${esperando} pessoas pediram para entrar`}
            </span>
            <span className="t-chip whitespace-nowrap text-amber">Ver ›</span>
          </a>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <CartaoStat
            rotulo="Saldo"
            valor={formatCompacto(soma.saldo)}
            rodape="disponível"
            icone={Wallet}
            acento="blue"
          />
          <CartaoStat
            rotulo="Retido"
            valor={formatCompacto(valorRetido)}
            rodape={`${emAberto.length} ${emAberto.length === 1 ? 'proposta' : 'propostas'}`}
            icone={Lock}
            acento="red"
            corDoNumero={valorRetido > 0 ? 'red' : undefined}
          />
          <CartaoStat
            rotulo="Entrou"
            valor={formatCompacto(soma.entrou)}
            rodape="no período"
            icone={ArrowUp}
            acento="green"
            corDoNumero={soma.entrou > 0 ? 'green' : undefined}
          />
          <CartaoStat
            rotulo="Saiu"
            valor={formatCompacto(soma.saiu)}
            rodape="no período"
            icone={ArrowDown}
            acento="amber"
          />
        </div>

        <AcoesRapidas
          acoes={[
            {
              icone: Plus,
              rotulo: ['Propor', 'saída'],
              acento: 'blue',
              href: `/${slug}/propor`,
            },
            {
              icone: CalendarDays,
              rotulo: ['Ver', 'festas'],
              acento: 'green',
              href: `/${slug}/festas`,
            },
            {
              icone: BookOpen,
              rotulo: ['Livro-', 'caixa'],
              acento: 'amber',
              href: `/${slug}/livro-caixa`,
            },
            {
              icone: Users,
              rotulo: ['Sócios', 'ativos'],
              acento: 'purple',
              href: `/${slug}/socios`,
            },
          ]}
        />

        <div className="mt-0.5 flex items-baseline justify-between">
          <h2 className="t-secao text-ink">Movimentações</h2>
          <a href={`/${slug}/livro-caixa`} className="t-chip whitespace-nowrap text-blue">
            Ver todas ›
          </a>
        </div>

        {linhas.length === 0 ? (
          <div className="rounded-card border border-line bg-surface px-3.5 py-4">
            <p className="t-desc text-pretty text-ink-2">
              Nenhuma movimentação ainda. A primeira venda de ingresso ou saída
              aprovada aparece aqui — e no livro-caixa, aberto a qualquer
              associado.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {linhas.map((l) => (
              <LinhaLista
                key={l.id}
                icone={l.tipo === 'entrada' ? ArrowUp : ArrowDown}
                acento={COR_DA_RUBRICA[l.rubrica]}
                titulo={l.descricao}
                meta={
                  <>
                    <Chip acento={COR_DA_RUBRICA[l.rubrica]}>{l.rubrica}</Chip>
                    <span className="t-meta text-ink-3">
                      {formatDataCurta(l.criado_em)}
                    </span>
                  </>
                }
                valor={formatComSinal(l.valor_centavos, l.tipo, {
                  compacto: true,
                  simbolo: false,
                })}
                corDoValor={l.tipo === 'entrada' ? 'green' : undefined}
              />
            ))}
          </div>
        )}
      </CorpoTela>

      <BarraAbas ativa="cofre" slug={slug} pendencias={emAberto.length} />
    </Tela>
  );
}

