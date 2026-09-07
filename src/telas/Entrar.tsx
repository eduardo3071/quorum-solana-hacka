import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';

import criarTopo from '@/assets/criar-topo.webp';
import entrarRodape from '@/assets/entrar-rodape.webp';
import entrarTopo from '@/assets/entrar-topo.webp';
import { BotaoGoogle } from '@/componentes/BotaoGoogle';
import { useSessao } from '@/lib/sessao';

import { FormularioCriarEntidade } from './FormularioCriarEntidade';
import { FormularioEntrada } from './FormularioEntrada';

const AVISOS: Record<string, string> = {
  expirado: 'Esse link já venceu ou já foi usado. Peça outro abaixo.',
  link: 'O link veio incompleto. Peça outro abaixo.',
  'outro-navegador':
    'Abra o link no mesmo aparelho em que você pediu. Se preferir, peça outro aqui.',
};

type Aba = 'entrar' | 'criar';

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

  // Quem chega por link vencido quer entrar, não criar. `?aba=criar` abre na
  // outra, para a capa poder mandar direto.
  const querCriar = busca.get('aba') === 'criar';
  const [aba, setAba] = useState<Aba>(querCriar ? 'criar' : 'entrar');

  const erro = busca.get('erro') ?? undefined;
  const proxima = busca.get('proxima') ?? undefined;

  /*
   * Quem já entrou não precisa entrar de novo — mas pode muito bem estar
   * fundando uma entidade.
   *
   * O desvio abaixo mandava toda sessão válida de volta para a capa, e isso
   * fechava um ciclo: a capa de quem não tem entidade oferece "criar uma", o
   * link vem para cá, e daqui a pessoa era devolvida à mesma tela que a
   * mandou. O botão parecia quebrado, e o formulário — que existe e funciona —
   * continuava inalcançável para exatamente quem mais precisava dele.
   */
  if (sessao.user && !querCriar) return <Navigate to={proxima ?? '/'} replace />;

  const entrando = aba === 'entrar';

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
        src={entrando ? entrarTopo : criarTopo}
        alt=""
        width={780}
        height={entrando ? 642 : 478}
        className="block w-full select-none"
        draggable={false}
      />

      <div className="sr-only">
        <h1>Quórum — tesouraria estudantil</h1>
        <p>Mais transparência para uma atlética mais forte.</p>
      </div>

      <div className={`flex flex-1 flex-col ${LATERAL} pb-5`}>
        <section className="rounded-[20px] border border-white/10 bg-[#0C1B33]/85 p-4 backdrop-blur-md">
          <div
            role="tablist"
            aria-label="Entrar ou criar entidade"
            className="mb-4 grid grid-cols-2 gap-2"
          >
            <BotaoAba atual={aba} valor="entrar" ao={setAba}>
              Entrar
            </BotaoAba>
            <BotaoAba atual={aba} valor="criar" ao={setAba}>
              Criar entidade
            </BotaoAba>
          </div>

          {entrando ? (
            <div id="painel-entrar" role="tabpanel" aria-labelledby="aba-entrar">
              <FormularioEntrada
                aviso={erro ? AVISOS[erro] : undefined}
                rotulo="E-mail institucional"
                proxima={proxima}
              />
            </div>
          ) : (
            <div id="painel-criar" role="tabpanel" aria-labelledby="aba-criar">
              <FormularioCriarEntidade />
            </div>
          )}

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

function BotaoAba({
  atual,
  valor,
  ao,
  children,
}: {
  atual: Aba;
  valor: Aba;
  ao: (a: Aba) => void;
  children: React.ReactNode;
}) {
  const ativo = atual === valor;

  return (
    <button
      id={`aba-${valor}`}
      type="button"
      role="tab"
      aria-selected={ativo}
      aria-controls={`painel-${valor}`}
      onClick={() => ao(valor)}
      className={`min-h-[48px] rounded-[14px] border px-3 py-3 text-[14px] font-bold whitespace-nowrap ${
        ativo
          ? 'border-blue bg-[#0E2A48] text-ink'
          : 'border-transparent bg-transparent text-ink-2'
      }`}
    >
      {children}
    </button>
  );
}
