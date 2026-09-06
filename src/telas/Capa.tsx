import { Navigate } from 'react-router-dom';
import { ArrowDown, BookOpen, Check, Clock, Info, ShieldCheck, Users } from 'lucide-react';

import { Botao } from '@/componentes/Botao';
import { Carregando } from '@/componentes/Estados';
import { Hero } from '@/componentes/Hero';
import { FUNDO_CAPA } from '@/componentes/fundo';
import { MarcaQuorum } from '@/componentes/MarcaQuorum';
import { CorpoTela, RotuloSecao, Tela } from '@/componentes/Tela';
import { TileIcone } from '@/componentes/TileIcone';
import { QUORUM, vitrinePublica } from '@/lib/dados';
import { formatBRL } from '@/lib/format';
import { sair, useSessao } from '@/lib/sessao';
import { useConsulta } from '@/lib/useConsulta';

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

/** O valor da prancha. Ilustra a regra; não é registro de saída nenhuma. */
const EXEMPLO_CENTAVOS = 840000;

function Visitante() {
  const { dados } = useConsulta(() => vitrinePublica(), []);

  return (
    <main
      style={FUNDO_CAPA}
      className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col px-4 pt-10 pb-6"
    >
      <header className="flex flex-col items-center text-center">
        <MarcaQuorum tamanho={104} />
        <h1 className="mt-3 text-[38px] leading-none font-extrabold tracking-[-0.035em] text-ink">
          Quórum
        </h1>
        <p className="t-rotulo mt-2.5 text-blue-ink">Tesouraria estudantil</p>
      </header>

      <p className="mt-7 text-center text-[27px] leading-[1.15] font-extrabold tracking-[-0.03em] text-balance text-ink">
        O caixa da atlética
        <br />
        <span className="text-blue">na sua mão.</span>
      </p>

      <p className="t-corpo mt-3 text-center text-pretty text-ink">
        Mais transparência. Mais confiança.
        <br />
        Mais conquistas.
      </p>

      <Diagrama />

      <ul className="mt-4 grid grid-cols-3 gap-2.5">
        <Pilar icone={Users} acento="blue">
          {QUORUM.de} de {QUORUM.entre}
          <br />
          assinaturas
        </Pilar>
        <Pilar icone={BookOpen} acento="blue">
          Livro-caixa
          <br />
          aberto
        </Pilar>
        <Pilar icone={ShieldCheck} acento="blue">
          Tudo
          <br />
          registrado
        </Pilar>
      </ul>

      <div className="mt-auto flex flex-col gap-3 pt-8">
        <Botao href="/entrar">Entrar →</Botao>

        {/*
          O livro-caixa aberto é a tese do produto, e a capa precisa deixar
          entrar sem conta nenhuma. Só aparece quando existe uma entidade
          pública de verdade para abrir — link para o vazio não vai ao ar.
        */}
        {dados?.entidade && (
          <a
            href={`/e/${dados.entidade.slug}/livro`}
            className="min-h-[36px] py-2 text-center text-[13px] font-bold text-blue"
          >
            Ver um livro-caixa aberto
          </a>
        )}

        <div className="mt-1 h-px bg-line" />

        <p className="t-meta text-center text-ink-3">
          Hackathon Universitário · Superteam Brasil
        </p>
      </div>
    </main>
  );
}

/**
 * A regra em forma: duas assinaturas de três, e o que acontece depois.
 *
 * É diagrama, não extrato. Por isso as pessoas são iniciais e não nomes, e não
 * há data nem comprovante em lugar nenhum: inventar uma saída que teria
 * acontecido, com gente que existe, seria mentir para quem avalia. O que a
 * peça afirma é só a regra — e essa é verdadeira.
 */
function Diagrama() {
  return (
    <section
      aria-label="Como funciona"
      className="mt-6 rounded-card border border-line bg-surface/80 p-4 backdrop-blur-sm"
    >
      <div className="flex items-center justify-center gap-2.5">
        <Avatar iniciais="LM" assinou />
        <Avatar iniciais="MS" assinou />
        <Avatar iniciais="RT" />
      </div>

      <p className="t-meta mt-3 text-center text-ink-2">
        {QUORUM.de} de {QUORUM.entre} assinaturas
      </p>

      <ArrowDown
        size={17}
        strokeWidth={2}
        className="mx-auto my-2 text-ink-3"
        aria-hidden
      />

      <div className="flex min-h-[62px] items-center gap-3 rounded-card border border-green/30 bg-green-tint px-3.5 py-3">
        <span className="flex size-[30px] flex-none items-center justify-center rounded-full bg-green">
          <Check size={17} strokeWidth={3} className="text-ground" aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="t-item-sm text-ink">Saída aprovada</div>
          <div className="t-valor mt-1 text-green">
            {formatBRL(EXEMPLO_CENTAVOS)}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Quem assinou e quem falta.
 *
 * O que falta é tracejado e cinza, nunca vermelho: a pessoa não recusou, só
 * ainda não assinou. Vermelho em avatar de gente é regra quebrada.
 */
function Avatar({ iniciais, assinou = false }: { iniciais: string; assinou?: boolean }) {
  return (
    <span
      className={`relative flex size-[46px] flex-none items-center justify-center rounded-tile text-[14px] font-extrabold ${
        assinou
          ? 'border border-green/40 bg-green-tint text-green'
          : 'border border-dashed border-dash text-ink-3'
      }`}
    >
      {iniciais}
      {assinou && (
        <span className="absolute -right-1 -bottom-1 flex size-[17px] items-center justify-center rounded-full bg-green">
          <Check size={11} strokeWidth={3.5} className="text-ground" aria-hidden />
        </span>
      )}
    </span>
  );
}

function Pilar({
  icone,
  acento,
  children,
}: {
  icone: typeof Users;
  acento: 'blue';
  children: React.ReactNode;
}) {
  return (
    <li className="flex min-h-[96px] flex-col items-center gap-2 rounded-card border border-line bg-surface/70 px-2 py-3.5 text-center backdrop-blur-sm">
      <TileIcone icone={icone} acento={acento} tamanho="lg" />
      <span className="t-meta text-pretty text-ink-2">{children}</span>
    </li>
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
            <a
              href={`/e/${dados.entidade.slug}/livro`}
              className="flex min-h-[68px] items-center gap-[13px] rounded-card border border-line bg-surface px-3.5 py-3"
            >
              <TileIcone icone={BookOpen} acento="blue" tamanho="lg" />
              <div className="min-w-0 flex-1">
                <div className="t-item truncate text-ink">
                  Ver um livro-caixa público
                </div>
                <div className="mt-[5px] truncate text-[12.5px] leading-[1.3] text-ink-2">
                  {dados.entidade.nome}
                </div>
              </div>
            </a>
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
