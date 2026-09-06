import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CalendarDays,
  Clock,
  Lock,
  Plus,
  ShieldCheck,
  Square,
  Users,
  Wallet,
} from 'lucide-react';

import { AcoesRapidas } from '@/components/AcoesRapidas';
import { BarraAbas } from '@/components/BarraAbas';
import { BlocoBloqueio } from '@/components/BlocoBloqueio';
import { Botao } from '@/components/Botao';
import { BarraProgresso } from '@/components/BarraProgresso';
import { CartaoBanner } from '@/components/CartaoBanner';
import { CartaoStat } from '@/components/CartaoStat';
import { Chip } from '@/components/Chip';
import { Hero } from '@/components/Hero';
import { IndicadorAssinaturas } from '@/components/IndicadorAssinaturas';
import { LinhaDetalhe, ListaDetalhes } from '@/components/LinhaDetalhe';
import { LinhaLista } from '@/components/LinhaLista';
import { TileIcone } from '@/components/TileIcone';
import { Tela } from '@/components/Tela';
import { formatBRL, formatCompacto, formatComSinal } from '@/lib/format';

export const metadata = {
  title: 'Quórum · Folha de estilo',
};

/**
 * Folha de estilo viva — a rota de conferência contra a prancha 4a.
 *
 * Não é tela do produto: serve para olhar componente por componente e comparar
 * com o desenho. Conteúdo real em português, nunca Lorem.
 */
export default function FolhaDeEstilo() {
  return (
    <Tela>
      <Hero
        rotulo="Sistema de design"
        titulo="Quórum"
        subtitulo={
          <span className="block max-w-[250px]">
            Cofre com duas assinaturas de três e livro-caixa aberto aos
            associados
          </span>
        }
        pilula="v0.2"
        className="px-5 py-5"
      />

      <div className="flex flex-col gap-[22px] px-4 pt-3.5 pb-6">
        <Secao numero="01" nome="Tipografia · Inter">
          <div className="flex flex-col gap-4 rounded-card border border-line bg-surface px-4 py-[18px]">
            <Amostra legenda="800 · 27 · -0.035em · valor-âncora">
              <div className="t-ancora text-blue">{formatCompacto(4318025)}</div>
            </Amostra>
            <Divisor />
            <Amostra legenda="800 · 16.5 · valor em lista · sinal menos matemático">
              <div className="t-valor text-ink">
                {formatComSinal(840000, 'saida')}
              </div>
            </Amostra>
            <Divisor />
            <Amostra legenda="700 · 16.5 · -0.02em · título de seção">
              <div className="t-secao text-ink">Propostas aguardando</div>
            </Amostra>
            <Divisor />
            <Amostra legenda="700 · 15.5 · nome de item">
              <div className="t-item text-ink">Som Beira-Mar ME</div>
            </Amostra>
            <Divisor />
            <Amostra legenda="600 · 10.5 · 0.09em · rótulo caixa alta">
              <div className="t-rotulo text-ink-2">Saldo em cofre</div>
            </Amostra>
            <Divisor />
            <Amostra legenda="500 · 13 · corpo e apoio · 400 · 12.5 descrição">
              <div className="t-corpo text-ink-2">
                Toda saída precisa de duas assinaturas entre os três
                signatários. Enquanto faltar uma, o dinheiro fica retido no
                cofre.
              </div>
            </Amostra>
          </div>
        </Secao>

        <Secao numero="02" nome="Paleta">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Superficie nome="página" hex="#101823" classe="bg-ground" />
              <Superficie nome="cartão" hex="#192434" classe="bg-surface" />
            </div>
            <div className="flex gap-2">
              <Superficie nome="elevado" hex="#1F2D41" classe="bg-surface-2" />
              <Superficie nome="abas" hex="#141E2C" classe="bg-tabbar" />
            </div>
          </div>

          <div className="mt-3 flex gap-3 rounded-tile border border-line bg-surface px-3.5 py-3">
            <Tinta nome="tinta" hex="#FFFFFF" classe="text-ink" />
            <div className="w-px bg-line" />
            <Tinta nome="tinta 2" hex="#9AA9BD" classe="text-ink-2" />
            <div className="w-px bg-line" />
            <Tinta nome="tinta 3" hex="#6B7C93" classe="text-ink-3" />
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <Acento
              icone={Square}
              acento="blue"
              titulo="azul · ação, valor, ativo"
              detalhe="#1FA5FF sobre #1A3852 · rubrica Eventos"
            />
            <Acento
              icone={ArrowUp}
              acento="green"
              titulo="verde · entrada, executada"
              detalhe="#32C869 sobre #173B2E · rubrica Esporte"
            />
            <Acento
              icone={Clock}
              acento="amber"
              titulo="âmbar · espera, progresso"
              detalhe="#F5C73D sobre #3A3018 · rubrica Marketing"
            />
            {/* Único acento que não passa em contraste como texto pequeno:
                3,88:1 sobre a superfície, contra os 4,5:1 da WCAG AA. Por isso
                o título desta linha é tinta, e não roxo — e por isso
                `TEXTO_SOBRE_TINGIDO` mapeia roxo para `ink-2` em todo o
                produto. Aqui está escrito, não subentendido. */}
            <Acento
              icone={Users}
              acento="purple"
              tituloEmAcento={false}
              titulo="roxo · associados, pessoas"
              detalhe="#AF57DB sobre #2F2C4D · só ícone e chip, nunca texto"
            />
            <Acento
              icone={Lock}
              acento="red"
              titulo="vermelho · retido, recusado, erro"
              detalhe="#FF5F6D sobre #3A1C24 · nunca em pessoa"
            />
          </div>
        </Secao>

        <Secao numero="03" nome="Cartão banner">
          <CartaoBanner
            icone={ShieldCheck}
            acento="blue"
            titulo="2 de 3 para qualquer saída"
            subtitulo="Nenhum membro move o dinheiro sozinho"
          />
        </Secao>

        <Secao numero="04" nome="Grade de estatísticas">
          <div className="grid grid-cols-2 gap-2.5">
            <CartaoStat
              rotulo="Em cofre"
              valor={formatCompacto(4318025)}
              rodape="saldo disponível"
              icone={Wallet}
              acento="blue"
            />
            <CartaoStat
              rotulo="Retido"
              valor={formatCompacto(1240000)}
              rodape="3 propostas paradas"
              icone={Lock}
              acento="red"
              corDoNumero="red"
            />
            <CartaoStat
              rotulo="Entradas"
              valor={formatCompacto(1350000)}
              rodape="agosto e setembro"
              icone={ArrowUp}
              acento="green"
              corDoNumero="green"
            />
            <CartaoStat
              rotulo="Associados"
              valor="62"
              rodape="mensalidade em dia"
              icone={Users}
              acento="purple"
              corDoNumero="purple"
            />
          </div>
          <Nota>
            O número herda a cor do acento só quando o dado é semântico: retido
            em vermelho, entrada em verde, associados em roxo.
            <br />
            <strong className="font-semibold text-amber">
              Divergência a decidir:
            </strong>{' '}
            a prancha 4a mostra o saldo em azul; a regra de cor diz
            &ldquo;blue só em ação e link — nunca em saldo ou valor
            estático&rdquo;. Aqui vale a regra, e o saldo ficou em branco. Se a
            prancha mandar, é uma linha em <code>CartaoStat</code>.
          </Nota>
        </Secao>

        <Secao numero="05" nome="Ações rápidas">
          <AcoesRapidas
            acoes={[
              {
                icone: Plus,
                rotulo: ['Propor', 'saída'],
                acento: 'blue',
                href: '/e/aaaeng/propor',
              },
              {
                icone: CalendarDays,
                rotulo: ['Ver', 'festas'],
                acento: 'green',
                href: '/e/aaaeng/festas',
              },
              {
                icone: BookOpen,
                rotulo: ['Livro-', 'caixa'],
                acento: 'amber',
                href: '/e/aaaeng/livro',
              },
              {
                icone: Users,
                rotulo: ['Sócios', 'ativos'],
                acento: 'purple',
                href: '/e/aaaeng/socios',
              },
            ]}
          />
        </Secao>

        <Secao numero="06" nome="Linha de lista">
          <div className="flex flex-col gap-2.5">
            <LinhaLista
              icone={ArrowUp}
              acento="green"
              titulo="Lote 1 · aniversário"
              meta={
                <>
                  <Chip acento="blue">Eventos</Chip>
                  <span className="t-meta text-ink-3">02 set</span>
                </>
              }
              valor={formatComSinal(456000, 'entrada', { compacto: true })}
              corDoValor="green"
              seta
            />
            <LinhaLista
              icone={ArrowDown}
              acento="amber"
              titulo="Gráfica Trindade"
              meta={
                <>
                  <Chip acento="amber">Marketing</Chip>
                  <span className="t-meta text-ink-3">28 ago</span>
                </>
              }
              valor={formatComSinal(89000, 'saida', { compacto: true })}
              seta
            />
          </div>
        </Secao>

        <Secao numero="07" nome="Indicador de assinaturas">
          <div className="flex flex-col gap-2.5">
            <Cartao>
              <IndicadorAssinaturas assinaturas={[]} necessarias={2} />
            </Cartao>
            <Cartao>
              <IndicadorAssinaturas
                assinaturas={[{ nome: 'Marina Salgado', hora: '18:12' }]}
                necessarias={2}
              />
            </Cartao>
            <Cartao>
              <IndicadorAssinaturas
                assinaturas={[
                  { nome: 'Marina Salgado', hora: '18:12' },
                  { nome: 'Letícia Marchetti', hora: '21:36' },
                ]}
                necessarias={2}
              />
            </Cartao>
          </div>
        </Secao>

        <Secao numero="08" nome="Caixa de bloqueio">
          <BlocoBloqueio />
          <Nota>
            O texto diz &ldquo;a saída é executada&rdquo;. Nunca &ldquo;o Pix é
            executado&rdquo; — o demo roda em devnet.
          </Nota>
        </Secao>

        <Secao numero="09" nome="Cartão de proposta · retida">
          <div className="rounded-card border border-line bg-surface-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="t-item text-ink">Som Beira-Mar ME</div>
                <div className="num mt-1.5 text-[12.5px] leading-[1.3] font-normal text-ink-3">
                  chave 24.881.402/0001-77
                </div>
              </div>
              <div className="t-valor text-ink">
                {formatComSinal(840000, 'saida', { compacto: true })}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-[7px]">
              <Chip acento="blue">Eventos</Chip>
              <Chip acento="red">Retida</Chip>
              <span className="t-meta text-ink-3">Marina · hoje 18:12</span>
            </div>

            <Divisor className="my-3.5" />

            <IndicadorAssinaturas
              assinaturas={[{ nome: 'Marina Salgado', hora: '18:12' }]}
              necessarias={2}
              legenda="Falta Letícia ou Rafael"
            />

            <BlocoBloqueio className="mt-3.5">
              Você já assinou. Falta a segunda assinatura para a saída sair.
            </BlocoBloqueio>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Botao variante="desabilitado">Executar saída</Botao>
              <Botao variante="secundario">Comprovantes</Botao>
            </div>
          </div>
        </Secao>

        <Secao numero="10" nome="Linha de detalhe">
          <Cartao>
            <ListaDetalhes>
              <LinhaDetalhe rotulo="Destinatário">
                Som Beira-Mar ME
              </LinhaDetalhe>
              <LinhaDetalhe rotulo="Chave" mono>
                24.881.402/0001-77
              </LinhaDetalhe>
              <LinhaDetalhe rotulo="Saldo após" destaque>
                {formatBRL(3478025)}
              </LinhaDetalhe>
            </ListaDetalhes>
          </Cartao>
          <Nota>
            O valor alinha à direita e desce para a linha seguinte quando não
            cabe — nunca por cima do rótulo. Saldo em branco, não em azul: azul
            é ação e link.
          </Nota>
        </Secao>

        <Secao numero="11" nome="Botões">
          <div className="grid grid-cols-2 gap-2">
            <Botao variante="primario">Assinar saída</Botao>
            <Botao variante="secundario">Ver detalhes</Botao>
            <Botao variante="destrutivo">Recusar</Botao>
            <Botao variante="desabilitado">Desabilitado</Botao>
          </div>
        </Secao>

        <Secao numero="12" nome="Campos">
          <div className="flex flex-col gap-3.5">
            <Campo rotulo="Valor da saída" foco>
              <span className="num text-[18px] leading-none font-extrabold tracking-[-0.03em] text-ink">
                {formatBRL(840000)}
              </span>
            </Campo>
            <Campo rotulo="Chave do fornecedor">
              <span className="text-[13px] leading-none font-medium text-ink-3">
                CNPJ, e-mail ou chave aleatória
              </span>
            </Campo>
            <div>
              <div className="t-rotulo mb-2 text-red">Comprovante</div>
              <div className="rounded-btn border border-red bg-surface p-3.5 text-[13px] leading-none font-medium text-ink">
                nota-fiscal
              </div>
              <div className="t-desc mt-[7px] text-red">
                Anexe o comprovante. Sem ele a proposta não entra na fila.
              </div>
            </div>
          </div>
        </Secao>

        <Secao numero="13" nome="Barra de progresso">
          <Cartao>
            <div className="flex flex-col gap-3.5">
              <BarraProgresso valor={0} acento="amber" neutro />
              <BarraProgresso valor={50} acento="amber" />
              <BarraProgresso valor={100} acento="green" />
            </div>
          </Cartao>
        </Secao>

        <Secao numero="14" nome="Barra de abas">
          <div className="overflow-hidden rounded-card border border-line">
            <BarraAbas ativa="cofre" slug="aaaeng" pendencias={3} />
          </div>
          <Nota>
            O botão flutuante é sempre azul, em todas as telas, e nunca fica
            desabilitado. O selo conta as pendências da aba Aprovar.
          </Nota>
        </Secao>
      </div>
    </Tela>
  );
}

/* ── Andaimes só desta página ──────────────────────────────────────────── */

function Secao({
  numero,
  nome,
  children,
}: {
  numero: string;
  nome: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="t-rotulo mb-[11px] text-ink-3">
        {numero} · {nome}
      </h2>
      {children}
    </section>
  );
}

function Cartao({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-surface p-3.5">
      {children}
    </div>
  );
}

function Divisor({ className = '' }: { className?: string }) {
  return <div className={`h-px bg-line ${className}`} />;
}

function Amostra({
  legenda,
  children,
}: {
  legenda: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {children}
      <div className="t-meta mt-[5px] text-ink-3">{legenda}</div>
    </div>
  );
}

function Nota({ children }: { children: React.ReactNode }) {
  return <p className="t-meta mt-2.5 text-pretty text-ink-3">{children}</p>;
}

function Superficie({
  nome,
  hex,
  classe,
}: {
  nome: string;
  hex: string;
  classe: string;
}) {
  return (
    <div className={`flex-1 rounded-tile border border-line p-3 ${classe}`}>
      <div className="text-[12.5px] leading-none font-bold text-ink">{nome}</div>
      <div className="t-meta mt-[5px] text-ink-3">{hex}</div>
    </div>
  );
}

function Tinta({
  nome,
  hex,
  classe,
}: {
  nome: string;
  hex: string;
  classe: string;
}) {
  return (
    <div>
      <div className={`text-[12.5px] leading-none font-bold ${classe}`}>
        {nome}
      </div>
      <div className="mt-1 text-[10.5px] leading-none font-normal text-ink-3">
        {hex}
      </div>
    </div>
  );
}

function Acento({
  icone,
  acento,
  titulo,
  detalhe,
  tituloEmAcento = true,
}: {
  icone: typeof Square;
  acento: 'blue' | 'green' | 'amber' | 'purple' | 'red';
  titulo: string;
  detalhe: string;
  /** Falso quando o acento não passa em contraste como texto pequeno. */
  tituloEmAcento?: boolean;
}) {
  const cor = tituloEmAcento
    ? {
        blue: 'text-blue',
        green: 'text-green',
        amber: 'text-amber',
        purple: 'text-purple',
        red: 'text-red',
      }[acento]
    : 'text-ink';

  return (
    <div className="flex items-center gap-3 rounded-tile border border-line bg-surface px-3 py-[11px]">
      <TileIcone icone={icone} acento={acento} tamanho="lg" />
      <div className="min-w-0 flex-1">
        <div className={`text-[13px] leading-none font-bold ${cor}`}>
          {titulo}
        </div>
        <div className="mt-[5px] text-[11px] leading-none font-normal text-ink-2">
          {detalhe}
        </div>
      </div>
    </div>
  );
}

function Campo({
  rotulo,
  foco = false,
  children,
}: {
  rotulo: string;
  foco?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="t-rotulo mb-2 text-ink-2">{rotulo}</div>
      <div
        className={`rounded-btn bg-surface px-3.5 py-[13px] ${
          foco ? 'border border-blue' : 'border border-line'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
