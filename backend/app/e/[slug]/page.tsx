import { notFound, redirect } from 'next/navigation';
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

import { AcoesRapidas } from '@/components/AcoesRapidas';
import { BarraAbas } from '@/components/BarraAbas';
import { CartaoBanner } from '@/components/CartaoBanner';
import { CartaoStat } from '@/components/CartaoStat';
import { Chip } from '@/components/Chip';
import { COR_DA_RUBRICA } from '@/components/acentos';
import { Erro, Vazio } from '@/components/Estados';
import { Hero } from '@/components/Hero';
import { LinhaLista } from '@/components/LinhaLista';
import { CorpoTela, Tela } from '@/components/Tela';
import {
  QUORUM,
  associados,
  entidadePorSlug,
  lancamentos,
  pendentes,
  retido,
  totais,
  usuarioAtual,
} from '@/lib/dados';
import { formatCompacto, formatComSinal, formatDataCurta } from '@/lib/format';

export const metadata = { title: 'Cofre · Quórum' };

/**
 * 5a · Cofre da entidade, lendo do banco.
 *
 * Os três signatários NÃO aparecem aqui: foram para o perfil. Tirá-los é o que
 * dá respiro à tela.
 */
export default async function Cofre({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const sessao = await usuarioAtual();
  if (!sessao?.user) redirect(`/entrar?proxima=/e/${slug}`);

  const entidade = await entidadePorSlug(slug);
  if (!entidade) notFound();

  let linhas, soma, emAberto, valorRetido, socios;
  try {
    [linhas, soma, emAberto, valorRetido, socios] = await Promise.all([
      lancamentos(entidade.id, 3),
      totais(entidade.id),
      pendentes(entidade.id),
      retido(entidade.id),
      associados(entidade.id),
    ]);
  } catch (e) {
    console.error('[cofre] falha ao ler', e);
    return (
      <Tela>
        <Hero titulo="Cofre" rotulo={entidade.nome} />
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
            primeira saída — a atlética deixa de usar o Pix pessoal do
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
                  // Era "Cobrar sócios", apontando para uma tela que nunca
                  // existiu. Quem cobra é a festa: o ingresso cai no cofre e
                  // vira entrada no livro-caixa sozinho.
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
              <a
                href={`/e/${slug}/livro`}
                className="t-chip whitespace-nowrap text-blue"
              >
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
