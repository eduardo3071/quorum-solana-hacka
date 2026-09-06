import { Navigate } from 'react-router-dom';

import capa from '@/assets/capa.webp';
import { BookOpen, Clock, Info } from 'lucide-react';

import { Botao } from '@/componentes/Botao';
import { Carregando } from '@/componentes/Estados';
import { Hero } from '@/componentes/Hero';
import { CorpoTela, RotuloSecao, Tela } from '@/componentes/Tela';
import { TileIcone } from '@/componentes/TileIcone';
import { vitrinePublica } from '@/lib/dados';
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

/**
 * A capa é uma peça só: a arte da prancha, inteira.
 *
 * Decisão consciente de trocar código por imagem. A capa não mostra dado do
 * banco — é argumento, não tela de trabalho —, então nada aqui precisa mudar
 * quando o cofre muda. O que se perde é real e está tratado logo abaixo.
 *
 * O corte tem dois motivos, e nenhum é estético:
 *
 * 1. A barra de status da maquete (09:41 · 78%) saiu. Ela é o chrome do
 *    aparelho, não do app: mantida, o celular desenha a dele por cima e ficam
 *    duas.
 * 2. A arte termina logo abaixo dos pilares, numa faixa lisa. Dali para baixo
 *    é DOM de verdade, porque o botão e o link precisam ser botão e link —
 *    com área de toque, foco visível e texto que escala. Controle desenhado
 *    dentro de um PNG não clica, e "Ver um livro-caixa aberto" é a tese do
 *    produto.
 *
 * A costura é invisível porque o degradê abaixo sai exatamente das cores da
 * última linha da imagem: #01102F à esquerda, #000D26 à direita.
 */
const COSTURA =
  'linear-gradient(100deg,#01102F,#000D26)';

function Visitante() {
  const { dados } = useConsulta(() => vitrinePublica(), []);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-ground">
      {/*
        `alt` vazio e o conteúdo em texto logo abaixo, invisível à vista.
        Leitor de tela não lê pixel: sem isto, a manchete, a regra do quórum e
        o valor simplesmente não existem para quem usa. Descrever tudo dentro
        de um `alt` daria um parágrafo único e sem estrutura — separado, tem
        título, hierarquia e ordem de leitura.
      */}
      <img
        src={capa}
        alt=""
        width={780}
        height={1232}
        className="block w-full select-none"
        draggable={false}
      />

      <div className="sr-only">
        <h1>Quórum — tesouraria estudantil</h1>
        <p>O caixa da atlética na sua mão. Mais transparência, mais confiança, mais conquistas.</p>
        <p>
          Duas assinaturas de três: com o quórum atingido, a saída é aprovada.
          Livro-caixa aberto. Tudo registrado.
        </p>
      </div>

      <div
        style={{ background: COSTURA }}
        className="flex flex-1 flex-col gap-2 px-4 pt-5 pb-6"
      >
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
            className="flex min-h-[46px] items-center justify-center text-center text-[14px] font-bold text-blue"
          >
            Ver um livro-caixa aberto
          </a>
        )}

        <div className="mx-1 mt-1 h-px bg-white/12" />

        <p className="t-meta pt-1 text-center text-ink-3">
          Hackathon Universitário&nbsp;&nbsp;·&nbsp;&nbsp;Superteam Brasil
        </p>
      </div>
    </main>
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
