'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Check, QrCode, WifiOff } from 'lucide-react';

import { Botao } from '@/components/Botao';
import { RotuloSecao } from '@/components/Tela';
import { formatBRL } from '@/lib/format';

/**
 * A compra do ingresso, do lado de quem está na fila.
 *
 * Fecha o circuito da prancha 5d: escolher o lote, ler o QR, pagar, e a
 * entrada aparecer no livro-caixa sem ninguém digitar nada.
 *
 * Sobre Pix: em produção esta etapa é um QR de Pix emitido por parceiro
 * autorizado — o desenho é o mesmo, muda quem custodia. Aqui o pagamento
 * acontece em devnet, e por isso a tela em momento nenhum diz "Pix". Dizer o
 * que não é seria mentir para quem assiste.
 */

export type LoteVisivel = {
  id: string;
  nome: string;
  precoCentavos: number;
  total: number;
  vendidos: number;
};

type Compra = {
  referencia: string;
  lote: string;
  valorCentavos: number;
  destino: string;
  qr: string;
  url: string;
};

type Confirmada = {
  valorCentavos: number;
  lote: string;
  evento: string;
  comprovante: string;
  livro: string;
};

type Fase = 'escolhendo' | 'abrindo' | 'esperando' | 'confirmada' | 'offline';

const INTERVALO_DE_CONSULTA = 2500;

export function ComprarIngresso({
  lotes,
  livroHref,
  entidadeSlug,
  topo,
}: {
  lotes: LoteVisivel[];
  livroHref: string;
  entidadeSlug: string;
  /**
   * O cartão de quando e onde, renderizado no servidor.
   *
   * Entra por prop porque a prancha 5d põe o botão de comprar na barra
   * inferior, e barra e conteúdo precisam do mesmo estado — qual lote está
   * escolhido, se a compra já abriu. Um Client Component só pode compartilhar
   * estado com o que está dentro dele.
   */
  topo: React.ReactNode;
}) {
  const disponiveis = lotes.filter((l) => l.vendidos < l.total);
  const [escolhido, setEscolhido] = useState(disponiveis[0]?.id ?? null);
  const [fase, setFase] = useState<Fase>('escolhendo');
  const [compra, setCompra] = useState<Compra | null>(null);
  const [confirmada, setConfirmada] = useState<Confirmada | null>(null);
  const [segundos, setSegundos] = useState(0);
  const [mensagemErro, setMensagemErro] = useState('');
  const [pagando, setPagando] = useState(false);

  const lote = lotes.find((l) => l.id === escolhido) ?? null;

  /* ── Espera ───────────────────────────────────────────────────────────── */

  // Contador real de segundos decorridos, como na prancha 6d: quem espera um
  // pagamento precisa ver o tempo passar, não um giro sem fim.
  const inicio = useRef(0);
  useEffect(() => {
    if (fase !== 'esperando') return;
    inicio.current = Date.now();
    setSegundos(0);
    const t = setInterval(
      () => setSegundos(Math.floor((Date.now() - inicio.current) / 1000)),
      500,
    );
    return () => clearInterval(t);
  }, [fase]);

  const referencia = compra?.referencia;

  useEffect(() => {
    if (fase !== 'esperando' || !referencia) return;
    let vivo = true;

    const consultar = async () => {
      try {
        const r = await fetch('/api/conciliar', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ referencia }),
        });
        if (!vivo) return;
        const dados = await r.json();
        if (!r.ok) return; // Falha momentânea: a próxima volta tenta de novo.
        if (dados.pago) {
          setConfirmada(dados as Confirmada);
          setFase('confirmada');
        }
      } catch {
        // Sem rede agora não quer dizer sem rede daqui a dois segundos e meio.
        // A compra continua de pé, e a espera segue.
      }
    };

    const t = setInterval(() => void consultar(), INTERVALO_DE_CONSULTA);
    void consultar();
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, [fase, referencia]);

  /* ── Ações ────────────────────────────────────────────────────────────── */

  const comprar = useCallback(async () => {
    if (!lote) return;
    setFase('abrindo');
    setMensagemErro('');

    try {
      const r = await fetch('/api/ingresso', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ loteId: lote.id }),
      });
      const dados = await r.json();

      if (!r.ok) {
        setFase('offline');
        setMensagemErro(dados?.erro ?? 'Não conseguimos abrir a compra agora.');
        return;
      }

      setCompra(dados as Compra);
      setFase('esperando');
    } catch {
      setFase('offline');
      setMensagemErro('O celular está sem internet');
    }
  }, [lote]);

  async function pagarPelaDemonstracao() {
    if (!compra) return;
    setPagando(true);
    try {
      await fetch('/api/pagar-demo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ referencia: compra.referencia }),
      });
    } catch {
      // A consulta em laço decide se pagou ou não. Este botão só empurra.
    } finally {
      setPagando(false);
    }
  }

  /* ── Telas ────────────────────────────────────────────────────────────── */

  if (fase === 'offline') {
    return (
      <Moldura
        topo={topo}
        entidadeSlug={entidadeSlug}
        rodape={
          <Botao onClick={() => setFase('escolhendo')}>Tentar de novo</Botao>
        }
      >
        <div className="rounded-card bg-red-tint p-4" role="alert">
          <div className="flex items-start gap-3">
            <div className="flex size-[34px] flex-none items-center justify-center rounded-tile-sm bg-ground/30">
              <WifiOff size={18} strokeWidth={1.8} className="text-red" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className="t-item text-ink">{mensagemErro}</h2>
              <p className="t-desc mt-[7px] text-pretty text-red-ink">
                Nada foi cobrado. Tente de novo — o ingresso continua disponível.
              </p>
            </div>
          </div>
        </div>
      </Moldura>
    );
  }

  if (fase === 'confirmada' && confirmada) {
    return (
      <Moldura
        topo={topo}
        entidadeSlug={entidadeSlug}
        rodape={
          <Botao variante="secundario" href={confirmada.livro}>
            Abrir o livro-caixa
          </Botao>
        }
      >
        <article className="rounded-card border border-green/30 bg-green-tint p-4">
          <div className="flex items-center gap-2 text-green">
            <Check size={16} strokeWidth={2} aria-hidden />
            <span className="t-chip">Pagamento confirmado</span>
          </div>
          <div className="t-ancora mt-3 text-ink">
            {formatBRL(confirmada.valorCentavos)}
          </div>
          <p className="t-desc mt-2 text-pretty text-green-ink">
            {confirmada.lote} · o valor caiu no cofre da entidade e já está no
            livro-caixa.
          </p>
          {confirmada.comprovante && (
            <a
              href={confirmada.comprovante}
              target="_blank"
              rel="noreferrer"
              className="t-chip mt-3 inline-block text-blue"
            >
              Ver o comprovante na rede ›
            </a>
          )}
        </article>

        <div className="flex items-center gap-[11px] rounded-card border border-line bg-surface px-3.5 py-[13px]">
          <div className="flex size-[38px] flex-none items-center justify-center rounded-tile-sm bg-blue-tint">
            <BookOpen size={18} strokeWidth={1.8} className="text-blue" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="t-item-sm text-ink">Já está no livro-caixa</div>
            <div className="t-meta mt-[5px] text-ink-3">
              Aberto a qualquer associado, sem login
            </div>
          </div>
        </div>
      </Moldura>
    );
  }

  if (fase === 'esperando' && compra) {
    return (
      <Moldura
        topo={topo}
        entidadeSlug={entidadeSlug}
        rodape={
          /* Atalho de gravação: paga a MESMA cobrança do QR a partir da
             carteira de demonstração, para o vídeo não depender de um app de
             pagamento configurado no celular de alguém. */
          <Botao
            variante={pagando ? 'desabilitado' : 'secundario'}
            onClick={() => void pagarPelaDemonstracao()}
          >
            {pagando ? 'Enviando…' : 'Pagar pela carteira de demonstração'}
          </Botao>
        }
      >
        <article className="rounded-card border border-line bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="t-rotulo text-ink-2">A pagar</div>
              <div className="t-ancora mt-[11px] text-ink">
                {formatBRL(compra.valorCentavos)}
              </div>
              <div className="t-meta mt-1.5 truncate text-ink-3">{compra.lote}</div>
            </div>
            <div className="flex-none text-right">
              <div className="num text-[20px] leading-none font-extrabold tracking-[-0.035em] text-amber">
                {segundos}s
              </div>
              <div className="mt-1.5 text-[10.5px] leading-none text-ink-3">
                aguardando
              </div>
            </div>
          </div>

          {/* O QR vem desenhado do servidor: a página não baixa biblioteca
              nenhuma para isto. */}
          <div
            className="mx-auto mt-3.5 w-[176px] rounded-tile bg-white p-2.5 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: compra.qr }}
          />

          <p className="t-desc mt-3.5 text-center text-pretty text-ink-2">
            Aponte a câmera do app de pagamento para o código. O valor cai
            direto no cofre da entidade.
          </p>

          <div className="mt-3.5 border-t border-line pt-3">
            <div className="t-rotulo text-ink-2">Referência da compra</div>
            {/* Rola em vez de quebrar: referência partida no meio é referência
                que a pessoa copia errado. */}
            <div className="mt-2 overflow-x-auto">
              <div className="font-mono text-[11.5px] leading-none whitespace-nowrap text-ink-2">
                {compra.referencia}
              </div>
            </div>
          </div>
        </article>

        <p className="t-meta text-pretty text-ink-3">
          Assim que o pagamento entrar, o ingresso é emitido e a entrada aparece
          sozinha no{' '}
          <a href={livroHref} className="text-blue">
            livro-caixa público
          </a>
          .
        </p>
      </Moldura>
    );
  }

  /* Escolha do lote — o estado inicial da prancha 5d. */
  return (
    <Moldura
      topo={topo}
      entidadeSlug={entidadeSlug}
      rodape={
        lote ? (
          <Botao
            variante={fase === 'abrindo' ? 'desabilitado' : 'primario'}
            onClick={() => void comprar()}
          >
            {fase === 'abrindo'
              ? 'Abrindo a compra…'
              : `Comprar · ${formatBRL(lote.precoCentavos)}`}
          </Botao>
        ) : null
      }
    >
      <RotuloSecao>Lotes</RotuloSecao>

      <div className="flex flex-col gap-2">
        {lotes.map((l) => {
          const restam = l.total - l.vendidos;
          const esgotado = restam <= 0;
          const ativo = l.id === escolhido && !esgotado;

          return (
            <button
              key={l.id}
              type="button"
              disabled={esgotado}
              onClick={() => setEscolhido(l.id)}
              aria-pressed={ativo}
              className={`flex min-h-[62px] w-full items-center justify-between gap-3 rounded-card border px-[15px] py-3 text-left ${
                ativo
                  ? 'border-blue bg-blue-tint'
                  : esgotado
                    ? 'cursor-not-allowed border-line bg-surface'
                    : 'border-line bg-surface'
              }`}
            >
              <div className="min-w-0">
                <div className={`t-item ${esgotado ? 'text-ink-3' : 'text-ink'}`}>
                  {l.nome}
                </div>
                <div
                  className={`t-meta mt-1.5 ${esgotado ? 'text-ink-3' : 'text-amber'}`}
                >
                  {esgotado ? 'esgotado' : `restam ${restam} de ${l.total}`}
                </div>
              </div>
              <div
                className={`num flex-none text-[15px] leading-none font-extrabold tracking-[-0.03em] ${
                  esgotado ? 'text-ink-3 line-through' : 'text-ink'
                }`}
              >
                {formatBRL(l.precoCentavos)}
              </div>
            </button>
          );
        })}
      </div>

      {/* A proposta de valor inteira do produto. */}
      <div className="mt-0.5 flex items-center gap-[13px] rounded-card border border-green/30 bg-green-tint p-3.5">
        <div className="flex size-[68px] flex-none items-center justify-center rounded-tile border border-green/35 bg-[#0F2A20]">
          <QrCode size={30} strokeWidth={1.6} className="text-green" aria-hidden />
        </div>
        <div className="min-w-0">
          <div className="t-item text-ink">Pague pelo QR e receba na hora</div>
          <p className="t-desc mt-1.5 text-pretty text-green-ink">
            O valor cai direto no cofre da atlética. Nada passa por conta
            pessoal.
          </p>
        </div>
      </div>

      {!lote && (
        <div className="rounded-card border border-dashed border-dash bg-surface p-3.5">
          <div className="t-item-sm text-ink-2">Ingressos esgotados</div>
          <p className="t-meta mt-1.5 text-ink-3">
            Acompanhe a entidade para saber do próximo lote.
          </p>
        </div>
      )}
    </Moldura>
  );
}

/**
 * A moldura da prancha 5d: corpo que rola e barra inferior fixa.
 *
 * A barra é `flex-none` no fim da coluna, não `position: absolute` — a única
 * exceção à regra é o botão flutuante da barra de abas, e esta tela não tem
 * barra de abas.
 */
function Moldura({
  topo,
  children,
  rodape,
  entidadeSlug,
}: {
  topo: React.ReactNode;
  children: React.ReactNode;
  rodape: React.ReactNode;
  entidadeSlug: string;
}) {
  return (
    <>
      <div className="flex flex-1 flex-col gap-[11px] px-4 pt-3.5 pb-4">
        {topo}
        {children}
      </div>

      <div className="flex-none border-t border-line bg-tabbar px-4 pt-3 pb-[18px]">
        {rodape}
        <p
          className={`text-center text-[12.5px] leading-[1.4] text-ink-3 ${rodape ? 'mt-3' : ''}`}
        >
          Livro-caixa da entidade aberto em{' '}
          <a href={`/e/${entidadeSlug}/livro`} className="text-blue">
            quorum.app/{entidadeSlug}
          </a>
        </p>
      </div>
    </>
  );
}
