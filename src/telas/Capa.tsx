import { useState } from 'react';
import { Navigate } from 'react-router-dom';

import capa from '@/assets/capa.webp';
import capaEn from '@/assets/capa-en.webp';
import { BookOpen, Clock, Plus, Search, Users } from 'lucide-react';

import { Botao } from '@/componentes/Botao';
import { Carregando } from '@/componentes/Estados';
import {
  buscarEntidades,
  ErroDaApi,
  pedirEntrada,
  type EntidadeDaBusca,
  type EntidadePendente,
} from '@/lib/api';
import { Hero } from '@/componentes/Hero';
import { CorpoTela, Tela } from '@/componentes/Tela';
import { TileIcone } from '@/componentes/TileIcone';
import { vitrinePublica } from '@/lib/dados';
import { useIdioma } from '@/lib/idioma';
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


/* ── Entrou, e ainda não faz parte de nenhuma entidade ──────────────────── */

/**
 * O tipo da entidade em português, para a lista de busca.
 *
 * O banco guarda a sigla; a tela mostra o nome. Quem procura a própria atlética
 * não sabe o que é `ej`, e não deveria precisar saber.
 */
const NOME_DO_TIPO: Record<EntidadeDaBusca['tipo'], string> = {
  atletica: 'Atlética',
  ca: 'Centro acadêmico',
  ej: 'Empresa júnior',
  formatura: 'Comissão de formatura',
};

/**
 * A tela que decide quem o produto acha que você é.
 *
 * Hero âmbar, a cor da espera, e não vermelho: a pessoa fez tudo certo. O
 * vermelho é de bloqueio, recusa e erro, e nada aqui é isso.
 *
 * Esta tela já esteve errada duas vezes, e as duas por conhecer só um tipo de
 * gente. Primeiro ela só sabia dizer "espere a diretoria te cadastrar", sem
 * porta nenhuma. Depois ganhou "Criar uma entidade" em primeiro lugar — o que
 * atende quem funda, e quem funda é a minoria: uma atlética tem três
 * signatários e dezenas de associados.
 *
 * Agora a pergunta principal é a da maioria — **de qual entidade você faz
 * parte?** — com busca pelo nome e um pedido que a diretoria aprova. Fundar
 * virou o link do fim, onde quem realmente veio fundar vai olhar.
 */
function SemEntidade({ email }: { email: string }) {
  const sessao = useSessao();
  const [termo, setTermo] = useState('');
  const [pedida, setPedida] = useState<EntidadePendente | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pedindo, setPedindo] = useState<string | null>(null);

  const busca = useConsulta(() => buscarEntidades(termo), [termo]);
  const espera = pedida ?? sessao.pendente;

  async function pedir(entidade: EntidadeDaBusca) {
    setPedindo(entidade.slug);
    setErro(null);
    try {
      const r = await pedirEntrada(entidade.slug);
      setPedida(r.entidade);
    } catch (e) {
      setErro(
        e instanceof ErroDaApi ? e.message : 'Não conseguimos enviar seu pedido agora.',
      );
    } finally {
      setPedindo(null);
    }
  }

  /*
   * Pedido enviado é outro estado, não um aviso em cima do mesmo.
   *
   * Antes as duas situações — "não pertenço a nada" e "pedi e estou esperando"
   * — mostravam a mesma tela, e a pessoa não tinha como saber se o pedido saiu.
   * Reoferecer a busca aqui só convidaria a pedir de novo.
   */
  if (espera) {
    return (
      <Tela>
        <Hero
          variante="amber"
          rotulo="Quórum"
          titulo="Pedido enviado"
          subtitulo={email}
          pilula="Aguardando"
        />
        <CorpoTela className="pt-3.5 pb-4">
          <section className="flex items-start gap-3 rounded-card border border-line bg-surface p-4">
            <TileIcone icone={Clock} acento="amber" tamanho="lg" />
            <div className="min-w-0">
              <h2 className="t-item text-pretty text-ink">
                A diretoria da {espera.nome} vai decidir
              </h2>
              <p className="t-desc mt-1.5 text-pretty text-ink-2">
                Assim que aprovarem, o saldo e os seus recibos aparecem aqui.
                Você não precisa pedir de novo.
              </p>
            </div>
          </section>

          <a
            href={`/e/${espera.slug}/livro`}
            className="flex min-h-[68px] items-center gap-[13px] rounded-card border border-line bg-surface px-3.5 py-3"
          >
            <TileIcone icone={BookOpen} acento="blue" tamanho="lg" />
            <div className="min-w-0 flex-1">
              <div className="t-item truncate text-ink">Ver o livro-caixa</div>
              <div className="mt-[5px] truncate text-[12.5px] leading-[1.3] text-ink-2">
                Público, sem depender da aprovação
              </div>
            </div>
          </a>

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

  return (
    <Tela>
      <Hero
        variante="amber"
        rotulo="Quórum"
        titulo="De qual entidade você faz parte?"
        subtitulo={email}
        pilula="Aguardando"
      />

      <CorpoTela className="pt-3.5 pb-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setTermo(String(new FormData(e.currentTarget).get('entidade') ?? '').trim());
          }}
        >
          <label htmlFor="entidade" className="sr-only">
            Buscar entidade pelo nome
          </label>
          <div className="flex flex-1 items-center gap-[9px] rounded-btn border border-line bg-surface px-[13px] py-[11px] focus-within:border-blue">
            <Search size={17} strokeWidth={1.8} className="text-ink-3" aria-hidden />
            <input
              id="entidade"
              name="entidade"
              type="search"
              defaultValue={termo}
              placeholder="Nome da atlética ou faculdade"
              className="w-full bg-transparent text-[13px] leading-none font-medium text-ink placeholder:text-ink-3"
            />
          </div>
          <button
            type="submit"
            className="flex-none rounded-btn bg-blue px-3.5 text-[13px] font-bold whitespace-nowrap text-ground"
          >
            Buscar
          </button>
        </form>

        {erro && <p className="t-desc text-pretty text-red">{erro}</p>}

        {busca.carregando && <Carregando linhas={3} />}

        {!busca.carregando && busca.dados?.entidades.length === 0 && (
          <p className="t-desc text-pretty text-ink-2">
            Nenhuma entidade com esse nome. Confira a grafia — ou funde a sua,
            no fim da página.
          </p>
        )}

        {busca.dados?.entidades.map((e) => (
          <article
            key={e.slug}
            className="flex min-h-[68px] items-center gap-[13px] rounded-card border border-line bg-surface px-3.5 py-3"
          >
            <TileIcone icone={Users} acento="purple" tamanho="lg" />
            <div className="min-w-0 flex-1">
              <div className="t-item truncate text-ink">{e.nome}</div>
              <div className="mt-[5px] truncate text-[12.5px] leading-[1.3] text-ink-2">
                {NOME_DO_TIPO[e.tipo] ?? 'Entidade'}
                {e.universidade ? ` · ${e.universidade}` : ''}
              </div>
            </div>
            <button
              type="button"
              disabled={pedindo !== null}
              onClick={() => void pedir(e)}
              className="min-h-[38px] flex-none rounded-btn bg-blue px-3 text-[12.5px] font-bold whitespace-nowrap text-ground disabled:bg-line disabled:text-ink-3"
            >
              {pedindo === e.slug ? 'Enviando…' : 'Pedir'}
            </button>
          </article>
        ))}

        {/*
          Fundar é o link do fim, e de propósito. Quem vem fundar sabe que veio;
          quem vem procurar a própria atlética não deve tropeçar num convite
          para criar outra com o mesmo nome.
        */}
        <div className="mt-auto pt-3">
          <a
            href="/criar-entidade"
            className="flex min-h-[44px] items-center justify-center gap-1.5 text-[13px] font-semibold text-blue"
          >
            <Plus size={15} strokeWidth={2.2} aria-hidden />
            Ou crie uma entidade nova
          </a>
          <Botao className="mt-2" variante="secundario" onClick={() => void sair()}>
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
