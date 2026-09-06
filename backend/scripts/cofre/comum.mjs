/**
 * Peças compartilhadas dos comandos do cofre na devnet.
 *
 * O vocabulário do produto não vale aqui: estes scripts são o terminal, não a
 * interface. Na tela, nada disso aparece — lá é cofre, assinatura e saída.
 *
 * DEVNET APENAS. Nunca aponte para mainnet neste repositório.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js';
import bs58 from 'bs58';

export const ENV = '.env.local';

/** Estado entre comandos, para gravar o vídeo em partes. Gitignored. */
export const ARQUIVO_ESTADO = '.cofre-devnet.json';

export function doEnv(chave) {
  if (!existsSync(ENV)) return undefined;
  const linha = readFileSync(ENV, 'utf8')
    .split('\n')
    .find((l) => l.startsWith(`${chave}=`));
  const valor = linha?.slice(chave.length + 1).trim();
  if (!valor || /^<.*>$/.test(valor)) return undefined;
  return valor;
}

export const RPC = doEnv('SOLANA_RPC_URL') ?? 'https://api.devnet.solana.com';

export function conexao() {
  return new Connection(RPC, 'confirmed');
}

/** Os três signatários, na ordem em que o cofre os conhece. */
export const PAPEIS = {
  tesoureira: { env: 'SIGNER_TESOUREIRA', nome: 'Marina Salgado' },
  presidente: { env: 'SIGNER_PRESIDENTE', nome: 'Letícia Marchetti' },
  conselho: { env: 'SIGNER_CONSELHO', nome: 'Rafael Tonetto' },
};

export function signatario(papel) {
  const def = PAPEIS[papel];
  if (!def) {
    throw new Error(
      `Papel desconhecido: "${papel}". Use: ${Object.keys(PAPEIS).join(', ')}`,
    );
  }
  const segredo = doEnv(def.env);
  if (!segredo) {
    throw new Error(
      `${def.env} não está em ${ENV}. Rode: npm run chaves`,
    );
  }
  return { ...def, papel, keypair: Keypair.fromSecretKey(bs58.decode(segredo)) };
}

export function todosSignatarios() {
  return Object.keys(PAPEIS).map(signatario);
}

/* ── Estado ─────────────────────────────────────────────────────────────── */

export function lerEstado() {
  if (!existsSync(ARQUIVO_ESTADO)) return null;
  const bruto = JSON.parse(readFileSync(ARQUIVO_ESTADO, 'utf8'));
  return {
    ...bruto,
    multisigPda: new PublicKey(bruto.multisigPda),
    vaultPda: new PublicKey(bruto.vaultPda),
    destino: new PublicKey(bruto.destino),
    transactionIndex: BigInt(bruto.transactionIndex),
  };
}

export function gravarEstado(estado) {
  writeFileSync(
    ARQUIVO_ESTADO,
    JSON.stringify(
      {
        ...estado,
        multisigPda: estado.multisigPda.toBase58(),
        vaultPda: estado.vaultPda.toBase58(),
        destino: estado.destino.toBase58(),
        transactionIndex: estado.transactionIndex.toString(),
      },
      null,
      2,
    ) + '\n',
  );
}

export function exigirEstado() {
  const e = lerEstado();
  if (!e) {
    console.error('✗ Nenhum cofre criado ainda. Rode primeiro: npm run ciclo');
    process.exit(1);
  }
  return e;
}

/* ── Saída no terminal ──────────────────────────────────────────────────── */

export const sol = (lamports) => (Number(lamports) / LAMPORTS_PER_SOL).toFixed(4);

export function passo(n, texto) {
  console.log(`\n[${n}/7] ${texto}`);
}

export function ok(texto) {
  console.log(`      ✓ ${texto}`);
}

export function explorador(assinatura) {
  return `https://explorer.solana.com/tx/${assinatura}?cluster=devnet`;
}

/**
 * Espera a transação ser confirmada pela rede.
 *
 * As funções `rpc.*` do SDK ENVIAM e devolvem a assinatura na hora, sem
 * esperar. Encadear duas sem confirmar a primeira é corrida: o passo seguinte
 * lê um estado que ainda não mudou. Foi o que derrubou o `proposalCreate`, que
 * pedia proposta para um índice que a rede ainda não conhecia.
 *
 * Consulta o status em vez de usar `confirmTransaction` com blockhash novo,
 * que expira por conta própria e falha por motivo errado.
 */
export async function confirmar(conn, assinatura, segundos = 60) {
  const limite = Date.now() + segundos * 1000;

  while (Date.now() < limite) {
    const { value } = await conn.getSignatureStatus(assinatura, {
      searchTransactionHistory: true,
    });

    if (value?.err) {
      throw new Error(
        `Transação ${assinatura} falhou na rede: ${JSON.stringify(value.err)}`,
      );
    }
    if (
      value?.confirmationStatus === 'confirmed' ||
      value?.confirmationStatus === 'finalized'
    ) {
      return assinatura;
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error(
    `Transação ${assinatura} não confirmou em ${segundos}s. ` +
      'RPC lento ou estrangulando por limite.',
  );
}

/**
 * Converte o `bignum` do beet para BigInt.
 *
 * O SDK devolve ora número, ora BN, dependendo do tamanho — passar direto para
 * BigInt() quebra com BN.
 */
export const paraBigInt = (v) => BigInt(v.toString());

/**
 * Distingue "faltou quórum" de "a rede falhou".
 *
 * Essa diferença é a coisa mais importante destes scripts: na interface, uma é
 * um estado desenhado — a caixa de bloqueio — e a outra é a tela de erro de
 * rede. Confundir as duas mostra a tela errada no meio do vídeo.
 *
 * O programa recusa a execução com `InvalidProposalStatus`, porque a proposta
 * ainda está `Active` em vez de `Approved`. Qualquer outra coisa é falha de
 * infraestrutura.
 */
export function ehFaltaDeQuorum(erro) {
  // Código do InvalidProposalStatus no programa. Em hexadecimal, 0x1778 — é
  // assim que ele aparece quando a transação falha on-chain em vez de na
  // simulação.
  const CODIGO = 6008;

  if (erro?.code === CODIGO) return true;

  const texto = [
    erro?.name,
    erro?.message,
    JSON.stringify(erro?.err ?? ''),
    ...(Array.isArray(erro?.logs) ? erro.logs : []),
  ]
    .filter(Boolean)
    .join(' ');

  return (
    /InvalidProposalStatus|Invalid proposal status/i.test(texto) ||
    new RegExp(`custom program error:\\s*0x${CODIGO.toString(16)}`, 'i').test(texto) ||
    new RegExp(`"Custom"\\s*:\\s*${CODIGO}\\b`).test(texto)
  );
}
