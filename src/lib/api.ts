/**
 * Os endpoints do cofre, que vivem noutro domínio.
 *
 * As bibliotecas da rede e as três chaves privadas dos signatários rodam só no
 * servidor. Chave privada no pacote do navegador é chave publicada — por isso
 * assinar, executar e conciliar não acontecem aqui: o front pede, o servidor
 * assina.
 *
 * Contrato completo em `docs/API.md` do repositório da API.
 */

const BASE = (
  import.meta.env.VITE_API_URL ?? 'https://solana-hacka-university.vercel.app'
).replace(/\/+$/, '');

/** Erro que já vem escrito para aparecer na tela, em português. */
export class ErroDaApi extends Error {
  constructor(
    mensagem: string,
    readonly status: number,
  ) {
    super(mensagem);
    this.name = 'ErroDaApi';
  }
}

async function chamar<T>(rota: string, corpo?: unknown): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(BASE + rota, {
      method: corpo === undefined ? 'GET' : 'POST',
      headers: corpo === undefined ? undefined : { 'content-type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    // Sem rede: é outra tela, não o mesmo erro de um 503 do servidor.
    throw new ErroDaApi('O celular está sem internet', 0);
  }

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new ErroDaApi(
      (dados as { erro?: string }).erro ?? 'Não conseguimos falar com o cofre agora.',
      resposta.status,
    );
  }
  return dados as T;
}

/* ── O cofre ────────────────────────────────────────────────────────────── */

export type Assento = 'tesoureira' | 'presidente' | 'conselho';

export type Situacao = {
  existe: boolean;
  status?: string;
  assinaturasFeitas?: number;
  assinaturasNecessarias?: number;
  assinaram?: Assento[];
  saldoCaixa?: number;
  saldoDestino?: number;
  transactionIndex?: string;
};

export const estadoDoCofre = () => chamar<Situacao>('/api/estado');

export const criarCofre = () => chamar<{ criado: true }>('/api/cofre', {});

export const assinarNoCofre = (papel: Assento) =>
  chamar<Situacao & { assinado: true; assinatura: string; explorador: string }>(
    '/api/assinar',
    { papel },
  );

export type ResultadoExecucao =
  | {
      executado: true;
      assinatura: string;
      explorador: string;
      saldoCaixa: number;
      saldoDestino: number;
    }
  | {
      bloqueado: true;
      assinaturasFeitas: number;
      assinaturasNecessarias: number;
      status: string;
      saldoCaixa: number;
      explorador?: string;
    };

/**
 * Tenta executar a saída.
 *
 * Falta de quórum volta como **200** com `bloqueado: true`. NÃO é erro e não
 * pode virar tela de erro: é a regra do cofre funcionando, e é a coisa que o
 * produto inteiro existe para mostrar. Erro de verdade — rede, RPC fora do ar —
 * vem como 503 e cai no `catch`.
 */
export const executarSaida = (papel: Assento) =>
  chamar<ResultadoExecucao>('/api/executar', { papel });

/* ── A festa ────────────────────────────────────────────────────────────── */

export type Cobranca = {
  referencia: string;
  lote: string;
  valorCentavos: number;
  destino: string;
  /** O QR já desenhado no servidor, como SVG. A tela só insere. */
  qr: string;
  url: string;
};

export const reservarIngresso = (loteId: string) =>
  chamar<Cobranca>('/api/ingresso', { loteId });

export type SituacaoDaCompra =
  | { pago: false }
  | {
      pago: true;
      valorCentavos: number;
      lote: string;
      evento: string;
      comprovante: string;
      livro: string;
    };

export const conciliarCompra = (referencia: string) =>
  chamar<SituacaoDaCompra>('/api/conciliar', { referencia });

export const pagarPelaDemonstracao = (referencia: string) =>
  chamar<{ pagou: true; assinatura: string }>('/api/pagar-demo', { referencia });
