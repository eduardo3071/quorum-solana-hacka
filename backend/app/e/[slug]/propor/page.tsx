import { notFound, redirect } from 'next/navigation';

import { BarraAbas } from '@/components/BarraAbas';
import { Vazio } from '@/components/Estados';
import { Hero } from '@/components/Hero';
import { CorpoTela, Tela } from '@/components/Tela';
import { QUORUM, entidadePorSlug, pendentes, usuarioAtual } from '@/lib/dados';

import { FormularioProposta } from './FormularioProposta';

export const metadata = { title: 'Propor saída · Quórum' };

/**
 * O destino do botão flutuante da barra de abas.
 *
 * Ele era o controle mais chamativo do produto e não levava a lugar nenhum —
 * `/e/[slug]/propor` não existia. Agora existe, e a proposta que ele cria é a
 * mesma que aparece na tela de aprovações esperando a segunda assinatura.
 */
export default async function Propor({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const sessao = await usuarioAtual();
  if (!sessao?.user) redirect(`/entrar?proxima=/e/${slug}/propor`);

  const entidade = await entidadePorSlug(slug);
  if (!entidade) notFound();

  const emAberto = await pendentes(entidade.id);
  const eu = sessao.membro;

  // Sócio não assina, e quem não assina não propõe. A política do banco já
  // recusaria; a tela diz antes, em vez de deixar a pessoa preencher tudo para
  // levar um erro no fim.
  if (!eu || eu.papel === 'socio') {
    return (
      <Moldura slug={slug} entidade={entidade.nome} pendencias={emAberto.length}>
        <Vazio
          titulo="Só a diretoria propõe saída"
          acao={{ texto: 'Ver o livro-caixa', href: `/e/${slug}/livro` }}
        >
          Propor uma saída é da presidência, da tesouraria e do conselho fiscal.
          O livro-caixa continua aberto a você, como a qualquer associado.
        </Vazio>
      </Moldura>
    );
  }

  return (
    <Moldura slug={slug} entidade={entidade.nome} pendencias={emAberto.length}>
      <FormularioProposta slug={slug} />
    </Moldura>
  );
}

function Moldura({
  slug,
  entidade,
  pendencias,
  children,
}: {
  slug: string;
  entidade: string;
  pendencias: number;
  children: React.ReactNode;
}) {
  return (
    <Tela>
      <Hero
        rotulo={entidade}
        titulo="Propor saída"
        subtitulo={`Retida até juntar ${QUORUM.de} de ${QUORUM.entre} assinaturas`}
      />
      <CorpoTela respiroAbas className="pt-3.5">
        {children}
      </CorpoTela>
      <BarraAbas ativa="aprovar" slug={slug} pendencias={pendencias} />
    </Tela>
  );
}
