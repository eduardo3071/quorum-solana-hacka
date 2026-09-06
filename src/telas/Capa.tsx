import { Navigate } from 'react-router-dom';
import { ArrowDown, BookOpen, Check, Clock, Info, ShieldCheck, Users } from 'lucide-react';

import { Botao } from '@/componentes/Botao';
import { Carregando } from '@/componentes/Estados';
import { Hero } from '@/componentes/Hero';
import { CenarioCapa } from '@/componentes/CenarioCapa';
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
      className="relative mx-auto flex min-h-dvh w-full max-w-[390px] flex-col overflow-hidden"
    >
      <CenarioCapa />

      {/*
        `relative` e não `z-10`: a cena vem antes no DOM e o conteúdo é
        posicionado, então já pinta por cima. Empilhar com z-index negativo na
        cena jogaria ela atrás do fundo opaco do body e ela sumiria — foi
        exatamente o que aconteceu na primeira tentativa.
      */}
      <div className="relative flex flex-1 flex-col px-4 pt-12 pb-6">
        <header className="flex flex-col items-center text-center">
          <MarcaQuorum tamanho={116} />
          <h1 className="mt-1 text-[42px] leading-none font-extrabold tracking-[-0.035em] text-ink">
            Quórum
          </h1>
          <p className="t-rotulo mt-3 text-[11px] tracking-[0.22em] text-blue-ink">
            Tesouraria estudantil
          </p>
        </header>

        <p className="mt-7 text-center text-[26px] leading-[1.16] font-extrabold tracking-[-0.03em] text-balance text-ink">
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

        <ul className="mt-5 grid grid-cols-3 gap-3">
          <Pilar icone={Users}>
            {QUORUM.de} de {QUORUM.entre}
            <br />
            assinaturas
          </Pilar>
          <Pilar icone={BookOpen}>
            Livro-caixa
            <br />
            aberto
          </Pilar>
          <Pilar icone={ShieldCheck}>
            Tudo
            <br />
            registrado
          </Pilar>
        </ul>

        <div className="mt-auto flex flex-col gap-2 pt-10">
          <a
            href="/entrar"
            className="flex min-h-[58px] items-center justify-center rounded-[18px] bg-blue px-4 text-center text-[16px] font-bold text-ground"
          >
            Entrar →
          </a>

          {/*
            O livro-caixa aberto é a tese do produto, e a capa precisa deixar
            entrar sem conta nenhuma. Só aparece quando existe uma entidade
            pública de verdade para abrir — link para o vazio não vai ao ar.
          */}
          {dados?.entidade && (
            <a
              href={`/e/${dados.entidade.slug}/livro`}
              className="flex min-h-[44px] items-center justify-center text-center text-[14px] font-bold text-blue"
            >
              Ver um livro-caixa aberto
            </a>
          )}

          <div className="mx-1 mt-1 h-px bg-white/12" />

          <p className="t-meta pt-1 text-center text-ink-3">
            Hackathon Universitário&nbsp;&nbsp;·&nbsp;&nbsp;Superteam Brasil
          </p>
        </div>
      </div>
    </main>
  );
}

/**
 * A regra em forma: duas assinaturas de três, e o que acontece depois.
 *
 * É diagrama, não extrato. Por isso as pessoas são iniciais e não nomes, e não
 * há data nem comprovante em lugar nenhum: inventar uma saída que teria
 * acontecido, com gente que existe, seria mentir para quem avalia. O que a peça
 * afirma é só a regra — e essa é verdadeira.
 */
function Diagrama() {
  return (
    <section
      aria-label="Como funciona"
      className="mx-auto mt-7 w-full max-w-[286px] rounded-[20px] border border-white/12 bg-[#0F2743]/60 p-3.5 backdrop-blur-md"
    >
      <div className="flex items-center justify-center gap-2.5">
        <Avatar iniciais="LM" assinou />
        <Avatar iniciais="MS" assinou />
        <Avatar iniciais="RT" />
      </div>

      {/*
        A chave que abraça os três. Desenhada e não composta com bordas: uma
        borda só encosta no que ela cerca, e aqui a linha precisa passar por
        baixo dos três e virar para cima nas pontas.
      */}
      <svg
        viewBox="0 0 190 14"
        className="mx-auto mt-2.5 h-3.5 w-[186px]"
        fill="none"
        aria-hidden
      >
        <path
          d="M4 0 L4 8 Q4 12 8 12 L182 12 Q186 12 186 8 L186 0"
          stroke="#9AA9BD"
          strokeOpacity=".6"
          strokeWidth="1.6"
          strokeLinecap="round"
          
        />
      </svg>

      <p className="t-corpo mt-2 text-center text-ink">
        {QUORUM.de} de {QUORUM.entre} assinaturas
      </p>

      <ArrowDown size={19} strokeWidth={2} className="mx-auto my-2 text-ink-2" aria-hidden />

      <div className="flex min-h-[74px] items-center gap-3.5 rounded-[16px] border border-white/12 bg-[#12304F]/55 px-4 py-3.5">
        <span className="flex size-[34px] flex-none items-center justify-center rounded-full bg-green">
          <Check size={19} strokeWidth={3} className="text-ground" aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="t-item text-ink">Saída aprovada</div>
          {/* Valor em tinta neutra: o verde já está no selo, e duas cores
              semânticas visíveis por tela é o teto. */}
          <div className="t-valor mt-1.5 text-ink-2">{formatBRL(EXEMPLO_CENTAVOS)}</div>
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
      className={`relative flex size-[54px] flex-none items-center justify-center rounded-[14px] text-[15px] font-extrabold ${
        assinou
          ? 'border border-green/45 bg-green-tint text-green'
          : 'border border-dashed border-dash text-ink-3'
      }`}
    >
      {iniciais}
      <span
        className={`absolute -right-1.5 -bottom-1.5 flex size-[21px] items-center justify-center rounded-full ${
          assinou ? 'bg-green' : 'border-[1.5px] border-ink-3/70 bg-transparent'
        }`}
      >
        {assinou && <Check size={13} strokeWidth={3.5} className="text-ground" aria-hidden />}
      </span>
    </span>
  );
}

function Pilar({ icone, children }: { icone: typeof Users; children: React.ReactNode }) {
  return (
    <li className="flex min-h-[104px] flex-col items-center gap-2.5 rounded-[16px] px-1 py-3 text-center">
      <TileIcone icone={icone} acento="blue" tamanho="xl" />
      <span className="text-[12.5px] leading-[1.35] font-semibold text-pretty text-ink">
        {children}
      </span>
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
