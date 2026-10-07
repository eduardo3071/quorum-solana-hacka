import { ChevronLeft } from 'lucide-react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';

import entrarRodape from '@/assets/entrar-rodape.webp';
import entrarTopo from '@/assets/entrar-topo.webp';
import entrarRodapeEn from '@/assets/entrar-rodape-en.png.asset.json';
import entrarTopoEn from '@/assets/entrar-topo-en.png.asset.json';
import { BotaoGoogle } from '@/componentes/BotaoGoogle';
import { useIdioma } from '@/lib/idioma';
import { useSessao } from '@/lib/sessao';

import { FormularioEntrada } from './FormularioEntrada';

/**
 * Cada idioma tem a sua prancha: em inglês, o topo diz "Student Treasury" e
 * a promessa traduzida. Os recortes seguem a mesma costura da arte em
 * português — topo até o início do cartão, pé depois do texto dos termos.
 */
const ARTE = {
  pt: { topo: entrarTopo, alturaTopo: 642, rodape: entrarRodape, alturaRodape: 130 },
  en: {
    topo: entrarTopoEn.url,
    alturaTopo: Math.round((730 / 834) * 780),
    rodape: entrarRodapeEn.url,
    alturaRodape: Math.round((106 / 834) * 780),
  },
} as const;

const AVISOS: Record<string, string> = {
  expirado: 'Sua sessão venceu. Entre de novo com e-mail e senha.',
  link: 'O link veio incompleto. Entre com e-mail e senha.',
  'outro-navegador': 'Entre com seu e-mail e sua senha para continuar.',
};



/**
 * O que é arte e o que é interface, nesta tela.
 *
 * A prancha vem inteira como imagem, e a imagem é ótima — mas ela desenha um
 * formulário, e formulário desenhado não digita. Então a arte entra recortada
 * em duas faixas — o topo, com a marca e os títulos, e o pé, com o rastro azul
 * — e o cartão do meio é DOM de verdade: campo com teclado de e-mail, aba que
 * troca, botão com foco visível, mensagem de erro que aparece.
 *
 * Cada aba tem o seu topo porque as duas pranchas têm: na de criar, a marca é
 * menor para o cartão mais alto caber. Usar um topo só deixaria uma das duas
 * fora de proporção.
 *
 * A barra de status da maquete (09:41 · 78%) foi cortada das duas. É o chrome
 * do aparelho, não do app: mantida, o celular desenha a dele por cima e ficam
 * duas.
 *
 * O degradê do miolo sai das cores medidas na última linha do recorte de cima
 * e na primeira do de baixo, então a costura não tem degrau.
 */
const MEIO = [
  // O rastro azul da esquerda não termina onde o recorte termina: ele continua
  // por baixo do cartão na prancha. Este radial é a continuação dele, saindo
  // da cor medida na última linha da imagem.
  'radial-gradient(78% 26% at 10% 0%, rgba(23,64,180,.5) 0%, rgba(2,26,70,0) 72%)',
  'linear-gradient(#021A46,#061B3B 32%,#001439)',
].join(',');

/** A margem lateral do cartão na prancha: 56px de 853 ≈ 25px de 390. */
const LATERAL = 'px-[25px]';

export function Entrar() {
  const [busca] = useSearchParams();
  const sessao = useSessao();
  const { idioma } = useIdioma();
  const arte = ARTE[idioma];

  const erro = busca.get('erro') ?? undefined;
  const proxima = busca.get('proxima') ?? undefined;

  // Esta tela cuida só de CONTA. Quem já tem sessão não tem o que fazer aqui.
  if (sessao.user) return <Navigate to={proxima ?? '/'} replace />;

  return (
    <main
      style={{ background: MEIO }}
      className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col"
    >
      {/*
        `alt` vazio e o mesmo conteúdo em texto logo abaixo, invisível à vista.
        Leitor de tela não lê pixel: sem isto, o nome do produto e a promessa
        não existiriam para quem usa.
      */}
      <img
        src={entrarTopo}
        alt=""
        width={780}
        height={642}
        className="block w-full select-none"
        draggable={false}
      />

      <div className="sr-only">
        <h1>Quórum — tesouraria estudantil</h1>
        <p>Mais transparência para uma atlética mais forte.</p>
      </div>

      <div className={`flex flex-1 flex-col ${LATERAL} pb-5`}>
        <section className="rounded-[20px] border border-white/10 bg-[#0C1B33]/85 p-4 backdrop-blur-md">
          {/*
            Aqui havia uma aba "Criar entidade", e ela juntava duas coisas que
            não são a mesma: fazer uma CONTA e fundar uma ENTIDADE. O formulário
            pedia e-mail — e pedir e-mail a quem vai virar o primeiro signatário
            é convidar o erro de digitação que ninguém percebe. Aconteceu:
            alguém fundou uma entidade com `…cardoso520@` e entrou com
            `…cardosi520@`, uma letra de diferença, e teve de pedir entrada na
            própria entidade.

            Agora esta tela cuida só de conta. Fundar é `/criar-entidade`, exige
            sessão, e usa o e-mail dela — que não se digita e não se erra.
          */}
          <FormularioEntrada
            aviso={erro ? AVISOS[erro] : undefined}
            rotulo="E-mail institucional"
            proxima={proxima}
          />

          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="t-rotulo text-ink-3">ou</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <BotaoGoogle proxima={proxima} />

          <Link
            to="/"
            className="mt-4 flex min-h-[38px] items-center justify-center gap-1 text-[13.5px] font-semibold text-ink-2"
          >
            <ChevronLeft size={15} strokeWidth={2} aria-hidden />
            Voltar
          </Link>
        </section>

        {/*
          Texto, não link: as duas páginas ainda não existem, e link que leva a
          lugar nenhum é pior que a frase sozinha — a pessoa toca, nada
          acontece, e passa a desconfiar do resto da tela.
        */}
        <p className="t-meta mt-auto pt-5 text-center text-pretty text-ink-3">
          Ao entrar você aceita os Termos e a Política de Privacidade.
        </p>
      </div>

      <img
        src={entrarRodape}
        alt=""
        width={780}
        height={130}
        className="block w-full select-none"
        draggable={false}
      />
    </main>
  );
}
