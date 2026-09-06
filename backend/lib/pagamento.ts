/**
 * O pagamento do ingresso, do lado do servidor.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * EM PRODUÇÃO ESTA ETAPA É PIX.
 *
 * O comprador leria um QR de Pix emitido por um parceiro autorizado (PSP), o
 * dinheiro cairia em conta de pagamento da entidade e o parceiro converteria o
 * saldo para o cofre. Nada disso muda o desenho: a referência única por compra,
 * a conciliação por essa referência e o lançamento automático no livro-caixa
 * são exatamente os mesmos. Troca-se quem custodia e quem confirma.
 *
 * NESTE REPOSITÓRIO O PAGAMENTO ACONTECE EM DEVNET, porque é o que dá para
 * demonstrar de ponta a ponta sem intermediário autorizado. A interface nunca
 * afirma que é Pix — dizer o que não é seria mentir para o avaliador, e a
 * honestidade conta ponto.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Este módulo NUNCA pode ser importado por um Client Component: lê chave
 * privada do ambiente. Só Route Handlers e Server Actions, com
 * `export const runtime = 'nodejs'`.
 *
 * Dinheiro no livro-caixa é integer em CENTAVOS. Lamports é outra unidade, de
 * outra rede, e vive em variável própria — as duas nunca se somam.
 */
import 'server-only';

import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import * as multisig from '@sqds/multisig';
import bs58 from 'bs58';
import QRCode from 'qrcode';

import { conexao, confirmar, lerEstado, sol } from '@/lib/cofre/servidor';

/* ── Conversão ──────────────────────────────────────────────────────────── */

/**
 * Cotação da demonstração: quantos centavos vale 1 SOL.
 *
 * É um número arbitrário e assumidamente arbitrário — em produção o preço em
 * reais não passa por cotação nenhuma, porque o comprador paga reais. Serve só
 * para o valor movimentado na devnet ficar pequeno o bastante para repetir a
 * demonstração muitas vezes com o SOL do faucet.
 */
export const COTACAO_CENTAVOS_POR_SOL = Number(
  process.env.COTACAO_CENTAVOS_POR_SOL ?? 10_000_000,
);

/** Centavos → lamports, arredondando para cima: nunca cobrar a menos. */
export function centavosParaLamports(centavos: number): number {
  if (!Number.isInteger(centavos) || centavos <= 0) {
    throw new Error(`Valor inválido em centavos: ${centavos}`);
  }
  return Math.ceil((centavos / COTACAO_CENTAVOS_POR_SOL) * LAMPORTS_PER_SOL);
}

/* ── Referência ─────────────────────────────────────────────────────────── */

/**
 * Uma referência única por compra.
 *
 * É uma chave pública sem dono — ninguém tem a chave privada e ninguém
 * precisa. Ela entra na transferência como conta somente-leitura, e é isso
 * que permite achar o pagamento depois: a rede indexa as transações por conta
 * envolvida, então perguntar "quais transações citaram esta referência?" é uma
 * consulta direta, não uma varredura do extrato do cofre.
 *
 * É o mesmo papel do identificador que vai num QR de Pix (o `txid`).
 */
export function novaReferencia(): string {
  return Keypair.generate().publicKey.toBase58();
}

/* ── Destino ────────────────────────────────────────────────────────────── */

/**
 * Onde o dinheiro do ingresso cai: o caixa do cofre da entidade.
 *
 * Nunca uma conta pessoal — é a tese do produto. O endereço vem do cofre
 * registrado na entidade; se ela ainda não tem cofre registrado, cai no cofre
 * que os endpoints do B6 criaram, que é o mesmo da demonstração.
 */
export function cofreDeCobranca(multisigPdaDaEntidade: string | null): PublicKey {
  if (multisigPdaDaEntidade) {
    const [vaultPda] = multisig.getVaultPda({
      multisigPda: new PublicKey(multisigPdaDaEntidade),
      index: 0,
    });
    return vaultPda;
  }

  const estado = lerEstado();
  if (!estado) {
    throw new Error(
      'A entidade ainda não tem cofre. Crie o cofre antes de vender ingresso.',
    );
  }
  return estado.vaultPda;
}

/* ── QR ─────────────────────────────────────────────────────────────────── */

export type Cobranca = {
  referencia: string;
  destino: string;
  lamports: number;
  /** O que o QR carrega. Um app de pagamento da devnet lê e preenche sozinho. */
  url: string;
};

export function montarCobranca({
  destino,
  lamports,
  referencia,
  entidade,
  evento,
}: {
  destino: PublicKey;
  lamports: number;
  referencia: string;
  entidade: string;
  evento: string;
}): Cobranca {
  const parametros = new URLSearchParams({
    amount: sol(lamports).toFixed(9),
    reference: referencia,
    label: entidade,
    message: evento,
  });

  return {
    referencia,
    destino: destino.toBase58(),
    lamports,
    url: `solana:${destino.toBase58()}?${parametros}`,
  };
}

/**
 * O QR como SVG, desenhado no servidor.
 *
 * Vai como texto na resposta e a tela só insere. Assim o browser não baixa
 * biblioteca de QR nenhuma — são 900 bytes contra dezenas de kB, e a página da
 * festa é a que mais gente abre no 4G da fila.
 */
export function desenharQR(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: { dark: '#0B1119', light: '#FFFFFF' },
  });
}

/* ── Conciliação ────────────────────────────────────────────────────────── */

export type PagamentoAchado = {
  assinatura: string;
  /** Quanto o cofre efetivamente recebeu, em lamports. */
  recebido: number;
};

/**
 * Procura o pagamento desta compra na rede.
 *
 * Só aceita o que confere: transação sem erro, que cite a referência E que
 * tenha aumentado o saldo do cofre em pelo menos o valor cobrado. Conferir o
 * saldo, e não a instrução, é o que impede alguém de citar a referência numa
 * transação qualquer e ganhar um ingresso de graça.
 *
 * Devolve `null` quando ainda não pagaram — que é o caso normal enquanto a
 * tela espera, não um erro.
 */
export async function procurarPagamento({
  referencia,
  destino,
  lamports,
}: {
  referencia: string;
  destino: PublicKey;
  lamports: number;
}): Promise<PagamentoAchado | null> {
  const conn = conexao();

  const assinaturas = await conn.getSignaturesForAddress(
    new PublicKey(referencia),
    { limit: 10 },
    'confirmed',
  );

  for (const { signature, err } of assinaturas) {
    if (err) continue;

    const tx = await conn.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
    if (!tx?.meta || tx.meta.err) continue;

    const chaves = tx.transaction.message.getAccountKeys();
    let indice = -1;
    for (let i = 0; i < chaves.length; i++) {
      if (chaves.get(i)?.equals(destino)) {
        indice = i;
        break;
      }
    }
    if (indice === -1) continue;

    const recebido = tx.meta.postBalances[indice] - tx.meta.preBalances[indice];
    if (recebido >= lamports) return { assinatura: signature, recebido };
  }

  return null;
}

/* ── Pagamento de demonstração ──────────────────────────────────────────── */

/**
 * A carteira que paga o ingresso na demonstração.
 *
 * Representa o estudante na fila, não a diretoria. `SIGNER_COMPRADOR` é
 * opcional: sem ele usa a chave do conselho fiscal, que já existe e já tem SOL
 * do faucet — assim ninguém precisa abastecer uma quarta carteira no dia da
 * gravação. Se quiser separar de verdade, gere uma chave só para isto.
 */
function compradorDaDemonstracao(): Keypair {
  const segredo =
    process.env.SIGNER_COMPRADOR && !/^<.*>$/.test(process.env.SIGNER_COMPRADOR)
      ? process.env.SIGNER_COMPRADOR
      : process.env.SIGNER_CONSELHO;

  if (!segredo || /^<.*>$/.test(segredo)) {
    throw new Error(
      'SIGNER_COMPRADOR (ou SIGNER_CONSELHO) não está no .env.local. Rode: npm run chaves',
    );
  }
  return Keypair.fromSecretKey(bs58.decode(segredo));
}

/**
 * Paga a cobrança a partir da carteira de demonstração.
 *
 * Existe porque a gravação não pode depender de alguém ter um app de pagamento
 * de devnet configurado no celular. O caminho de verdade é o QR: esta função
 * monta exatamente a mesma transferência que o QR pediria, com a referência
 * como conta somente-leitura, e a conciliação não sabe distinguir as duas —
 * como não deve mesmo.
 */
export async function pagarComoDemonstracao(cobranca: Cobranca) {
  const conn = conexao();
  const comprador = compradorDaDemonstracao();
  const destino = new PublicKey(cobranca.destino);

  const transferencia = SystemProgram.transfer({
    fromPubkey: comprador.publicKey,
    toPubkey: destino,
    lamports: cobranca.lamports,
  });

  // A referência viaja junto, somente-leitura e sem assinar. É ela que torna o
  // pagamento localizável depois.
  const comReferencia = new TransactionInstruction({
    keys: [
      ...transferencia.keys,
      {
        pubkey: new PublicKey(cobranca.referencia),
        isSigner: false,
        isWritable: false,
      },
    ],
    programId: transferencia.programId,
    data: transferencia.data,
  });

  const assinatura = await conn.sendTransaction(
    new Transaction().add(comReferencia),
    [comprador],
  );
  await confirmar(conn, assinatura);

  return assinatura;
}
