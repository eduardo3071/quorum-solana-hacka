import { redirect } from 'next/navigation';
import { BookOpen, CalendarDays, ChevronRight, Clock, Info } from 'lucide-react';

import { Botao } from '@/components/Botao';
import { Chip } from '@/components/Chip';
import { Hero } from '@/components/Hero';
import { IndicadorAssinaturas } from '@/components/IndicadorAssinaturas';
import { CorpoTela, RotuloSecao, Tela } from '@/components/Tela';
import { TileIcone } from '@/components/TileIcone';
import { FormularioEntrada } from '@/app/entrar/FormularioEntrada';
import { sair } from '@/lib/acoes';
import { QUORUM, usuarioAtual, vitrinePublica } from '@/lib/dados';
import { formatQuandoFesta } from '@/lib/format';
import { criarClienteServidor } from '@/lib/supabase/server';

export const metadata = { title: 'Quórum' };
export const dynamic = 'force-dynamic';

/**
 * A capa — a porta de entrada, prancha 5f.
 *
 * Três destinos, decididos aqui e não pelo visitante:
 *   quem já entrou e tem entidade  → vai direto ao cofre, sem parada
 *   quem entrou e não tem entidade → convite pendente, não erro
 *   quem não entrou                → a porta
 *
 * A tela do visitante tem uma ordem que não é acidental: primeiro o que o
 * produto É, depois a regra que o sustenta, depois a porta de quem trabalha
 * nele, e por último — mas visíveis, não em rodapé — as duas páginas que abrem
 * sem conta nenhuma. São elas a prova do discurso, e é nelas que alguém clica
 * antes de acreditar em qualquer frase.
 */
export default async function Capa() {
  const sessao = await usuarioAtual();

  if (sessao?.user && sessao.entidadeId) {
    const supabase = await criarClienteServidor();
    const { data } = await supabase
      .from('entidades')
      .select('slug')
      .eq('id', sessao.entidadeId)
      .maybeSingle();
    if (data?.slug) redirect(`/e/${data.slug}`);
  }

  if (sessao?.user) return <SemEntidade email={sessao.user.email ?? ''} />;

  return <Visitante />;
}

/* ── Visitante ──────────────────────────────────────────────────────────── */

async function Visitante() {
  const { entidade, evento } = await vitrinePublica();

  return (
    <Tela>
      <Hero
        rotulo="Tesouraria estudantil"
        titulo="Quórum"
        subtitulo="O caixa da sua entidade num cofre coletivo, com livro-caixa aberto aos associados."
        pilula="Visitante"
      />

      <CorpoTela className="pt-3.5 pb-4">
        {/* A regra que sustenta o produto inteiro, mostrada e não só dita. */}
        <section className="rounded-card border border-line bg-surface p-4">
          <h2 className="t-secao text-ink">Duas assinaturas de três</h2>
          <p className="t-desc mt-2 text-pretty text-ink-2">
            Nenhum membro da diretoria move o dinheiro sozinho. Toda saída
            precisa da assinatura de dois dos três signatários.
          </p>

          <div className="my-3.5 h-px bg-line" />

          {/*
            Ilustração da regra, não registro de uma saída que aconteceu: por
            isso a legenda fala do quórum e não de quem assinou. Inventar
            assinatura de gente real numa capa seria mentir para quem avalia.
          */}
          <IndicadorAssinaturas
            assinaturas={[{ nome: 'Letícia Marchetti' }, { nome: 'Marina Salgado' }]}
            necessarias={QUORUM.de}
            total={QUORUM.entre}
            titulo={`${QUORUM.de} de ${QUORUM.entre} · quórum atingido`}
            legenda="Com duas assinaturas, a saída é executada na hora"
            barra={false}
          />
        </section>

        <section className="rounded-card border border-line bg-surface p-4">
          <RotuloSecao>Acesso da diretoria</RotuloSecao>
          <FormularioEntrada rotuloOculto />
        </section>

        <RotuloSecao>Abertas sem conta</RotuloSecao>

        {entidade && (
          <Porta
            href={`/e/${entidade.slug}/livro`}
            icone={BookOpen}
            titulo="Livro-caixa"
            detalhe={`Toda entrada e saída · ${entidade.nome}`}
            chip="aberto"
          />
        )}

        {evento && (
          <Porta
            href={`/f/${evento.slug}`}
            icone={CalendarDays}
            titulo={evento.nome}
            detalhe={`${formatQuandoFesta(evento.data)}${evento.local ? ` · ${evento.local}` : ''}`}
          />
        )}

        <p className="mt-auto pt-2 text-center text-[11.5px] leading-none text-ink-3">
          Quórum v0.1
        </p>
      </CorpoTela>
    </Tela>
  );
}

function Porta({
  href,
  icone,
  titulo,
  detalhe,
  chip,
}: {
  href: string;
  icone: typeof BookOpen;
  titulo: string;
  detalhe: string;
  chip?: string;
}) {
  return (
    <a
      href={href}
      className="flex min-h-[68px] items-center gap-[13px] rounded-card border border-line bg-surface px-3.5 py-3"
    >
      <TileIcone icone={icone} acento="blue" tamanho="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="t-item truncate text-ink">{titulo}</span>
          {chip && (
            <span className="flex-none">
              <Chip acento="green">{chip}</Chip>
            </span>
          )}
        </div>
        <div className="mt-[5px] truncate text-[12.5px] leading-[1.3] text-ink-2">
          {detalhe}
        </div>
      </div>
      <ChevronRight size={18} strokeWidth={1.8} className="flex-none text-blue" aria-hidden />
    </a>
  );
}

/* ── Entrou, mas ninguém o cadastrou ────────────────────────────────────── */

/**
 * Convite pendente, não erro.
 *
 * Por isso o hero é âmbar — a cor da espera — e não vermelho. A pessoa fez
 * tudo certo: entrou com um e-mail que a diretoria ainda não cadastrou. O
 * vermelho está reservado para bloqueio, recusa e erro, e nada aqui é isso.
 */
async function SemEntidade({ email }: { email: string }) {
  const { entidade } = await vitrinePublica();

  return (
    <Tela>
      <Hero
        variante="amber"
        rotulo="Quórum"
        titulo="Você entrou, mas ainda não tem entidade"
        subtitulo={email}
        pilula="Aguardando"
      />

      <CorpoTela className="pt-3.5 pb-4">
        <section className="flex items-start gap-3 rounded-card border border-line bg-surface p-4">
          <TileIcone icone={Clock} acento="amber" tamanho="lg" />
          <div className="min-w-0">
            <h2 className="t-item text-ink">Falta a diretoria te cadastrar</h2>
            <p className="t-desc mt-1.5 text-pretty text-ink-2">
              Seu e-mail está reconhecido, mas nenhuma entidade adicionou você
              como signatário ou associado. Assim que a diretoria cadastrar, o
              cofre aparece aqui.
            </p>
          </div>
        </section>

        {entidade && (
          <>
            <RotuloSecao>Enquanto isso</RotuloSecao>
            <Porta
              href={`/e/${entidade.slug}/livro`}
              icone={BookOpen}
              titulo="Ver um livro-caixa público"
              detalhe={entidade.nome}
            />
          </>
        )}

        <section className="flex items-start gap-3 rounded-card border border-line bg-surface p-4">
          <TileIcone icone={Info} acento="blue" tamanho="lg" />
          <div className="min-w-0">
            <h2 className="t-item-sm text-ink">Já pediu para entrar?</h2>
            <p className="t-desc mt-1.5 text-pretty text-ink-2">
              Peça à diretoria para te cadastrar com este mesmo e-mail.
            </p>
          </div>
        </section>

        <form action={sair} className="mt-auto pt-2">
          <Botao type="submit" variante="secundario">
            Sair desta conta
          </Botao>
        </form>

        <p className="text-center text-[11.5px] leading-none text-ink-3">
          Quórum v0.1
        </p>
      </CorpoTela>
    </Tela>
  );
}
