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
import { Carregando, Erro, Vazio } from '@/componentes/Estados';
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
    const [todas, lista, socios] = await Promise.all([
      lancamentos(entidade.id),
      propostas(entidade.id),
      associados(entidade.id),
    ]);

    return {
      entidade,
      linhas: todas.slice(0, 3),
      soma: totais(todas),
      emAberto: pendentes(lista),
      valorRetido: retido(lista),
      socios,
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

  const { entidade, linhas, soma, emAberto, valorRetido, socios } = dados;
  const cofreVazio = linhas.length === 0 && soma.saldo === 0;

  return (
    <Tela>
      <Hero
        rotulo={`${entidade.tipo === 'atletica' ? 'Atlética' : entidade.tipo} · ${entidade.universidade ?? ''}`}
        titulo={entidade.nome}
        subtitulo={`${socios} associados`}
        pilula={`${QUORUM.de} de ${QUORUM.entre}`}
      />

      <CorpoTela respiroAbas className="gap-[9px] pt-3">
        <CartaoBanner
          icone={Lock}
          acento="blue"
          titulo="Cofre com quórum"
          subtitulo={`Nenhuma saída sem ${QUORUM.de} assinaturas`}
        />

        {cofreVazio ? (
          <Vazio
            titulo="Cofre recém-criado"
            acao={{ texto: 'Criar o cofre na rede', href: `/e/${slug}/aprovacoes?estado=vivo` }}
          >
            Ainda não há movimentação. Crie o cofre na rede e proponha a
            primeira saída — a atlética deixa de usar a conta pessoal do
            tesoureiro.
          </Vazio>
        ) : (
          <>
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
                corDoNumero="green"
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
                  href: `/e/${slug}/propor`,
                },
                {
                  icone: CalendarDays,
                  rotulo: ['Ver', 'festas'],
                  acento: 'green',
                  href: `/e/${slug}/festas`,
                },
                {
                  icone: BookOpen,
                  rotulo: ['Livro-', 'caixa'],
                  acento: 'amber',
                  href: `/e/${slug}/livro`,
                },
                {
                  icone: Users,
                  rotulo: ['Sócios', 'ativos'],
                  acento: 'purple',
                  href: `/e/${slug}/socios`,
                },
              ]}
            />

            <div className="mt-0.5 flex items-baseline justify-between">
              <h2 className="t-secao text-ink">Movimentações</h2>
              <a href={`/e/${slug}/livro`} className="t-chip whitespace-nowrap text-blue">
                Ver todas ›
              </a>
            </div>

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
          </>
        )}
      </CorpoTela>

      <BarraAbas ativa="cofre" slug={slug} pendencias={emAberto.length} />
    </Tela>
  );
}
