import { Navigate } from 'react-router-dom';
import { BookOpen, CalendarDays, ChevronRight, Clock, Info } from 'lucide-react';

import { Botao } from '@/componentes/Botao';
import { Carregando } from '@/componentes/Estados';
import { Chip } from '@/componentes/Chip';
import { Hero } from '@/componentes/Hero';
import { IndicadorAssinaturas } from '@/componentes/IndicadorAssinaturas';
import { CorpoTela, RotuloSecao, Tela } from '@/componentes/Tela';
import { TileIcone } from '@/componentes/TileIcone';
import { QUORUM, vitrinePublica } from '@/lib/dados';
import { formatQuandoFesta } from '@/lib/format';
import { sair, useSessao } from '@/lib/sessao';
import { useConsulta } from '@/lib/useConsulta';

import { FormularioEntrada } from './FormularioEntrada';

/**
 * A capa — a porta de entrada.
 *
 * Três destinos, decididos aqui e não pelo visitante:
 *   quem já entrou e tem entidade  → vai direto ao cofre, sem parada
 *   quem entrou e não tem entidade → convite pendente, não erro
 *   quem não entrou                → a porta
 */
export function Capa() {
  const sessao = useSessao();

  if (sessao.carregando) {
    return (
      <Tela>
        <Hero rotulo="Tesouraria estudantil" titulo="Quórum" />
        <CorpoTela>
          <Carregando linhas={3} />
        </CorpoTela>
      </Tela>
    );
  }

  if (sessao.user && sessao.entidadeSlug) {
    return <Navigate to={`/e/${sessao.entidadeSlug}`} replace />;
  }

  if (sessao.user) return <SemEntidade email={sessao.user.email ?? ''} />;

  return <Visitante />;
}

/* ── Visitante ──────────────────────────────────────────────────────────── */

function Visitante() {
  const { dados, carregando } = useConsulta(() => vitrinePublica(), []);

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

        {carregando && <Carregando linhas={2} />}

        {dados?.entidade && (
          <Porta
            href={`/e/${dados.entidade.slug}/livro`}
            icone={BookOpen}
            titulo="Livro-caixa"
            detalhe={`Toda entrada e saída · ${dados.entidade.nome}`}
            chip="aberto"
          />
        )}

        {dados?.evento && (
          <Porta
            href={`/f/${dados.evento.slug}`}
            icone={CalendarDays}
            titulo={dados.evento.nome}
            detalhe={`${formatQuandoFesta(dados.evento.data)}${dados.evento.local ? ` · ${dados.evento.local}` : ''}`}
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
 * Por isso o hero é âmbar — a cor da espera — e não vermelho. A pessoa fez tudo
 * certo: entrou com um e-mail que a diretoria ainda não cadastrou. O vermelho
 * está reservado para bloqueio, recusa e erro, e nada aqui é isso.
 */
function SemEntidade({ email }: { email: string }) {
  const { dados } = useConsulta(() => vitrinePublica(), []);

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

        {dados?.entidade && (
          <>
            <RotuloSecao>Enquanto isso</RotuloSecao>
            <Porta
              href={`/e/${dados.entidade.slug}/livro`}
              icone={BookOpen}
              titulo="Ver um livro-caixa público"
              detalhe={dados.entidade.nome}
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

        <div className="mt-auto pt-2">
          <Botao variante="secundario" onClick={() => void sair()}>
            Sair desta conta
          </Botao>
        </div>

        <p className="text-center text-[11.5px] leading-none text-ink-3">
          Quórum v0.1
        </p>
      </CorpoTela>
    </Tela>
  );
}

