import { notFound, redirect } from 'next/navigation';
import { User } from 'lucide-react';

import { BarraAbas } from '@/components/BarraAbas';
import { Chip } from '@/components/Chip';
import { Erro, Vazio } from '@/components/Estados';
import { Hero } from '@/components/Hero';
import { CorpoTela, Tela } from '@/components/Tela';
import {
  entidadePorSlug,
  eventosDaEntidade,
  membros,
  nomeDoPapel,
  pendentes,
  usuarioAtual,
} from '@/lib/dados';
import { iniciais } from '@/lib/format';

export const metadata = { title: 'Sócios · Quórum' };

/**
 * Quem é da entidade.
 *
 * A tela existe porque o cofre anunciava "62 associados" e a ação rápida
 * "Sócios ativos" não levava a lugar nenhum. Número no cabeçalho com atalho
 * morto embaixo é o tipo de coisa em que se clica no meio da apresentação.
 *
 * A política de `membros` só deixa ver os colegas da própria entidade — quem
 * não é de dentro recebe lista vazia, e é o banco que decide isso.
 */
export default async function Socios({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const sessao = await usuarioAtual();
  if (!sessao?.user) redirect(`/entrar?proxima=/e/${slug}/socios`);

  const entidade = await entidadePorSlug(slug);
  if (!entidade) notFound();

  let lista, emAberto, festas;
  try {
    [lista, emAberto, festas] = await Promise.all([
      membros(entidade.id),
      pendentes(entidade.id),
      eventosDaEntidade(entidade.id),
    ]);
  } catch (e) {
    console.error('[socios] falha ao ler', e);
    return (
      <Tela>
        <Hero variante="purple" rotulo={entidade.nome} titulo="Sócios" />
        <CorpoTela respiroAbas>
          <Erro titulo="A lista não carregou">
            Nada mudou no cofre. Tente recarregar em instantes.
          </Erro>
        </CorpoTela>
        <BarraAbas ativa="cofre" slug={slug} />
      </Tela>
    );
  }

  const assinantes = lista.filter((m) => m.papel !== 'socio');
  const socios = lista.filter((m) => m.papel === 'socio');

  return (
    <Tela>
      <Hero
        variante="purple"
        rotulo={entidade.nome}
        titulo="Sócios"
        subtitulo={`${lista.length} ${lista.length === 1 ? 'associado' : 'associados'} · ${assinantes.length} assinam`}
      />

      <CorpoTela respiroAbas className="pt-3">
        {lista.length === 0 ? (
          <Vazio titulo="Nenhum associado ainda">
            Quando a diretoria cadastrar as pessoas, elas aparecem aqui.
          </Vazio>
        ) : (
          <>
            <Secao titulo="Diretoria" pessoas={assinantes} />
            <Secao titulo="Associados" pessoas={socios} />
          </>
        )}
      </CorpoTela>

      <BarraAbas
        ativa="cofre"
        slug={slug}
        pendencias={emAberto.length}
        festaHref={festas[0] ? `/f/${festas[0].slug}` : `/e/${slug}/festas`}
      />
    </Tela>
  );
}

function Secao({
  titulo,
  pessoas,
}: {
  titulo: string;
  pessoas: { id: string; nome: string; papel: keyof typeof nomeDoPapel }[];
}) {
  if (pessoas.length === 0) return null;

  return (
    <>
      <div className="t-rotulo text-ink-3">{titulo}</div>
      <div className="flex flex-col gap-2">
        {pessoas.map((m) => (
          <div
            key={m.id}
            className="flex min-h-[58px] items-center gap-[11px] rounded-card border border-line bg-surface px-3.5 py-2.5"
          >
            {/*
              Avatar roxo: roxo é a cor de pessoas em todo o produto. Nunca
              vermelho — vermelho é bloqueio, e ninguém é um bloqueio.
            */}
            <div className="flex size-9 flex-none items-center justify-center rounded-avatar bg-purple-tint text-[12.5px] leading-none font-bold text-purple">
              {iniciais(m.nome)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="t-item-sm truncate text-ink">{m.nome}</div>
              <div className="mt-[5px] flex items-center gap-[7px]">
                <Chip acento={m.papel === 'socio' ? 'purple' : 'blue'}>
                  {nomeDoPapel[m.papel]}
                </Chip>
              </div>
            </div>
            {m.papel !== 'socio' && (
              <User size={16} strokeWidth={1.7} className="flex-none text-ink-3" aria-hidden />
            )}
          </div>
        ))}
      </div>
    </>
  );
}
