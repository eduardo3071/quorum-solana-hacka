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

import { supabase } from '@/lib/supabase';

/**
 * Onde a API mora.
 *
 * CUIDADO: não é o endereço desta interface. Os dois têm nome parecido —
 * `solana-hacka-university.lovable.app` é o SPA, `...vercel.app` é a API — e
 * apontar um para o outro faz toda chamada do cofre receber o index.html de
 * volta. O padrão abaixo já está certo; só mexa se a API mudar de domínio.
 */
const BASE = (
  import.meta.env.VITE_API_URL ?? 'https://solana-hacka-university.vercel.app'
).replace(/\/+$/, '');

if (
  typeof window !== 'undefined' &&
  BASE.replace(/^https?:\/\//, '') === window.location.host
) {
  console.error(
    `[api] VITE_API_URL aponta para esta mesma interface (${BASE}). ` +
      'A API é outro endereço — o do app Next. Deixe a variável em branco para ' +
      'usar o padrão.',
  );
}

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

/**
 * O crachá da sessão.
 *
 * Vai em toda chamada, inclusive nas públicas — comprar ingresso e criar
 * entidade não exigem sessão, e mandar o cabeçalho quando ela existe não muda
 * nada para elas. Já os endpoints do cofre recusam sem ele.
 *
 * `getSession()` lê do armazenamento local e renova sozinho se estiver perto de
 * vencer. Sem sessão devolve nulo, e a chamada sai sem cabeçalho — que é o
 * certo: token vazio seria pior que token nenhum, porque o servidor tentaria
 * validá-lo e responderia "sessão expirou" a quem nunca entrou.
 */
async function cabecalhoDeSessao(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { authorization: `Bearer ${token}` } : {};
  } catch {
    // Armazenamento bloqueado (janela anônima, cookies negados). Segue sem
    // crachá: o endpoint público continua funcionando, o privado recusa com
    // uma mensagem que a pessoa entende.
    return {};
  }
}

async function chamar<T>(rota: string, corpo?: unknown): Promise<T> {
  const autorizacao = await cabecalhoDeSessao();

  let resposta: Response;
  try {
    resposta = await fetch(BASE + rota, {
      method: corpo === undefined ? 'GET' : 'POST',
      headers:
        corpo === undefined
          ? autorizacao
          : { 'content-type': 'application/json', ...autorizacao },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    // Sem rede: é outra tela, não o mesmo erro de um 503 do servidor.
    throw new ErroDaApi('O celular está sem internet', 0);
  }

  const tipo = resposta.headers.get('content-type') ?? '';

  // HTML onde deveria vir JSON é quase sempre o mesmo engano: VITE_API_URL
  // apontando para a interface em vez da API. Dizer isso é mais útil que
  // "erro inesperado" — o sintoma some assim que a variável muda.
  if (!tipo.includes('json')) {
    throw new ErroDaApi(
      `O endereço da API respondeu ${resposta.status} sem JSON. Confira VITE_API_URL: ` +
        'ela precisa apontar para o app da API, não para esta interface.',
      resposta.status,
    );
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

/* ── Nascer uma entidade ────────────────────────────────────────────────── */

export type TipoEntidade = 'atletica' | 'ca' | 'ej' | 'formatura';

/**
 * Cria a entidade e o primeiro signatário.
 *
 * Passa pela API, e não direto pelo banco, porque a política de acesso proíbe
 * o navegador de inserir em `entidades` — e deve proibir mesmo: quem está
 * criando ainda não é membro de nada, então nenhuma política razoável o
 * autorizaria. É o servidor que escreve, com regra própria.
 */
export const criarEntidade = (dados: {
  nome: string;
  tipo: TipoEntidade;
  universidade: string;
  email: string;
}) => chamar<{ criada: true; slug: string; nome: string }>('/api/entidade', dados);

/**
 * Casa a sessão com a linha da diretoria, pelo e-mail.
 *
 * A linha de `membros` quase sempre nasce ANTES da sessão: a diretoria cadastra
 * alguém pelo e-mail semanas antes de essa pessoa entrar, e quem funda a própria
 * entidade tem a linha criada com `user_id` nulo, porque naquele instante ainda
 * não havia sessão nenhuma com que casar.
 *
 * Sem este passo a pessoa entra, a sessão é válida, e mesmo assim ela não é
 * membro de nada — fica no estado "sem entidade" para sempre, com a entidade
 * dela existindo no banco. Aconteceu, com duas.
 *
 * Quem decide o que casa é o servidor, pelo e-mail do token validado. Daqui só
 * se pede: mandar o e-mail na chamada seria deixar o navegador escolher de quem
 * ele é.
 */
export type EntidadePendente = { nome: string; slug: string };

export const vincularSessao = () =>
  chamar<{
    vinculadas: number;
    entidadeSlug: string | null;
    /** O pedido em aberto, quando há um. Só o servidor consegue lê-lo. */
    pendente: EntidadePendente | null;
  }>('/api/vinculo', {});

/* ── Pedir para entrar ──────────────────────────────────────────────────── */

export type EntidadeDaBusca = {
  slug: string;
  nome: string;
  tipo: TipoEntidade;
  universidade: string | null;
};

/**
 * A lista telefônica das entidades.
 *
 * Aberta e magra de propósito: nome, tipo e universidade, o que já está em
 * qualquer cartaz de corredor. Quem procura a própria atlética para pedir
 * entrada ainda não é de dentro — e não precisa ser para achar o nome dela.
 */
export const buscarEntidades = (busca: string) =>
  chamar<{ entidades: EntidadeDaBusca[] }>(
    `/api/entidades?busca=${encodeURIComponent(busca)}`,
  );

/** Pede entrada. Vira uma linha inativa, que a diretoria aprova ou recusa. */
export const pedirEntrada = (entidadeSlug: string) =>
  chamar<{ pedido: true; jaExistia: boolean; entidade: EntidadePendente }>(
    '/api/solicitacao',
    { entidadeSlug },
  );

/** A diretoria decide. Aprovar ativa a linha; recusar apaga. */
export const decidirSolicitacao = (dados: {
  entidadeSlug: string;
  membroId: string;
  aprovar: boolean;
}) =>
  chamar<{ decidido: true; aprovado: boolean; nome: string }>(
    '/api/solicitacao/decidir',
    dados,
  );

/* ── O cofre ────────────────────────────────────────────────────────────── */

export type Assento = 'tesoureira' | 'presidente' | 'conselho';

export type Situacao = {
  existe: boolean;
  /**
   * Por que não existe, quando não existe. `cofre` = a entidade ainda não tem
   * um; `proposta fora da rede` = a linha existe no banco mas nunca foi levada
   * ao cofre. São dois estados vazios diferentes e pedem botões diferentes.
   */
  motivo?: 'cofre' | 'entidade' | 'proposta' | 'proposta fora da rede' | string;
  status?: string;
  assinaturasFeitas?: number;
  assinaturasNecessarias?: number;
  assinaram?: Assento[];
  saldoCaixa?: number;
  saldoDestino?: number;
  transactionIndex?: string;
};

/**
 * Toda chamada do cofre diz DE QUAL entidade e DE QUAL proposta se trata.
 *
 * Antes nenhuma dizia: o servidor guardava um cofre só, num arquivo, e agia
 * sempre sobre ele. Com o cofre morando na entidade e a proposta tendo índice
 * próprio na rede, o alvo passa a ser explícito — e sem ele o servidor recusa,
 * em vez de escolher no chute qual dinheiro mexer.
 */
export type AlvoDoCofre = { entidadeSlug: string; propostaId: string };

export const estadoDoCofre = ({ entidadeSlug, propostaId }: AlvoDoCofre) =>
  chamar<Situacao>(
    `/api/estado?entidade=${encodeURIComponent(entidadeSlug)}` +
      `&proposta=${encodeURIComponent(propostaId)}`,
  );

/** Cria o cofre da entidade. Não abre proposta: isso é `levarPropostaAoCofre`. */
export const criarCofre = (entidadeSlug?: string) =>
  chamar<{ criado: true; multisigPda: string }>('/api/cofre', { entidadeSlug });

/** Leva uma proposta que já existe no banco para a rede. */
export const levarPropostaAoCofre = (alvo: AlvoDoCofre) =>
  chamar<{ criada: true; transactionIndex: string }>('/api/proposta', alvo);

export const assinarNoCofre = (papel: Assento, alvo: AlvoDoCofre) =>
  chamar<Situacao & { assinado: true; assinatura: string; explorador: string }>(
    '/api/assinar',
    { papel, ...alvo },
  );

export type ResultadoExecucao =
  | {
      executado: true;
      assinatura: string;
      explorador: string;
      saldoCaixa: number;
      saldoDestino: number;
      /** Falso quando outra execução lançou primeiro. Não é erro. */
      lancado: boolean;
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
export const executarSaida = (papel: Assento, alvo: AlvoDoCofre) =>
  chamar<ResultadoExecucao>('/api/executar', { papel, ...alvo });

/* ── A festa ────────────────────────────────────────────────────────────── */

/**
 * A diretoria cria uma festa.
 *
 * Vai por uma função do próprio banco, e não pelo domínio da API: `eventos` e
 * `lotes` não aceitam escrita do navegador — quem confere o papel de quem pede é
 * o servidor, com a chave de serviço, depois de validar o crachá da sessão.
 */
export async function criarFesta(dados: {
  entidadeSlug: string;
  nome: string;
  /** Instante da festa em ISO, já com o fuso de quem preencheu. */
  data: string;
  local: string;
  precoCentavos: number;
  total: number;
}): Promise<{ criada: true; slug: string; nome: string }> {
  const { data, error } = await supabase.functions.invoke('festa', { body: dados });

  if (error) {
    // A função devolve `{ erro }` escrito em português; a mensagem dela é
    // melhor que qualquer frase genérica daqui.
    const corpo = (await (error as { context?: Response }).context
      ?.json()
      .catch(() => null)) as { erro?: string } | null;
    throw new ErroDaApi(corpo?.erro ?? 'Não conseguimos criar a festa agora.', 0);
  }

  return data as { criada: true; slug: string; nome: string };
}



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
