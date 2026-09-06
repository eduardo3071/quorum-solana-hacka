/**
 * O cofre na devnet, do lado do servidor.
 *
 * Este módulo NUNCA pode ser importado por um Client Component: ele lê chaves
 * privadas do ambiente. Só Route Handlers e Server Actions, e todos com
 * `export const runtime = 'nodejs'` — as bibliotecas da Solana usam APIs de
 * Node e quebram no runtime edge da Vercel.
 *
 * O estado mora no mesmo `.cofre-devnet.json` que os scripts do terminal
 * usam, de propósito: dá para criar o cofre por `npm run ciclo` e ver o
 * resultado na tela, ou assinar pela tela e conferir pelo terminal. Sem banco
 * — o Supabase é o B3, e o caderno o tira do caminho crítico.
 */
import 'server-only';

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
} from '@solana/web3.js';
import * as multisig from '@sqds/multisig';
import bs58 from 'bs58';

const { Multisig, Proposal } = multisig.accounts;

export const ARQUIVO_ESTADO = join(process.cwd(), '.cofre-devnet.json');

export type Papel = 'tesoureira' | 'presidente' | 'conselho';

const ENV_DO_PAPEL: Record<Papel, string> = {
  tesoureira: 'SIGNER_TESOUREIRA',
  presidente: 'SIGNER_PRESIDENTE',
  conselho: 'SIGNER_CONSELHO',
};

export const NOME_DO_PAPEL: Record<Papel, string> = {
  tesoureira: 'Marina Salgado',
  presidente: 'Letícia Marchetti',
  conselho: 'Rafael Tonetto',
};

export function ehPapel(v: unknown): v is Papel {
  return typeof v === 'string' && v in ENV_DO_PAPEL;
}

/**
 * A conexão com a rede. Devnet, sempre.
 *
 * Duas guardas, e nenhuma delas é decoração:
 *
 * Mainnet é recusada em qualquer caminho, não só no pagamento de demonstração.
 * Este repositório não movimenta dinheiro de verdade, e a hora de descobrir o
 * contrário não é depois da transação confirmada.
 *
 * Em produção o RPC dedicado é obrigatório. O RPC público de devnet estrangula
 * por limite de requisições, e ele faz isso no meio da demonstração — foi
 * exatamente o que aconteceu na primeira rodada do ciclo aqui. Faltar a
 * variável tem que estourar com uma frase que diz o que fazer, não virar 429
 * intermitente no meio da gravação.
 */
export function conexao() {
  const url = process.env.SOLANA_RPC_URL?.trim();

  if (url && /mainnet/i.test(url)) {
    throw new Error(
      'SOLANA_RPC_URL aponta para mainnet. Este repositório é devnet, e só devnet.',
    );
  }

  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'SOLANA_RPC_URL não está no ambiente. Em produção o RPC dedicado é ' +
          'obrigatório: o público de devnet estrangula por limite no meio da demonstração.',
      );
    }
    return new Connection('https://api.devnet.solana.com', 'confirmed');
  }

  return new Connection(url, 'confirmed');
}

export function signatario(papel: Papel): Keypair {
  const segredo = process.env[ENV_DO_PAPEL[papel]];
  if (!segredo || /^<.*>$/.test(segredo)) {
    throw new Error(
      `${ENV_DO_PAPEL[papel]} não está no .env.local. Rode: npm run chaves`,
    );
  }
  return Keypair.fromSecretKey(bs58.decode(segredo));
}

/* ── Estado ─────────────────────────────────────────────────────────────── */

type EstadoBruto = {
  multisigPda: string;
  vaultPda: string;
  destino: string;
  transactionIndex: string;
  createKey?: string;
  criadoEm?: string;
};

export type Estado = {
  multisigPda: PublicKey;
  vaultPda: PublicKey;
  destino: PublicKey;
  transactionIndex: bigint;
};

export function lerEstado(): Estado | null {
  if (!existsSync(ARQUIVO_ESTADO)) return null;
  const b = JSON.parse(readFileSync(ARQUIVO_ESTADO, 'utf8')) as EstadoBruto;
  return {
    multisigPda: new PublicKey(b.multisigPda),
    vaultPda: new PublicKey(b.vaultPda),
    destino: new PublicKey(b.destino),
    transactionIndex: BigInt(b.transactionIndex),
  };
}

export function gravarEstado(e: Estado, extra: Record<string, string> = {}) {
  writeFileSync(
    ARQUIVO_ESTADO,
    JSON.stringify(
      {
        multisigPda: e.multisigPda.toBase58(),
        vaultPda: e.vaultPda.toBase58(),
        destino: e.destino.toBase58(),
        transactionIndex: e.transactionIndex.toString(),
        ...extra,
      },
      null,
      2,
    ) + '\n',
  );
}

export function exigirEstado(): Estado {
  const e = lerEstado();
  if (!e) throw new Error('Nenhum cofre criado. Chame POST /api/cofre antes.');
  return e;
}

/* ── Utilidades ─────────────────────────────────────────────────────────── */

export const paraBigInt = (v: unknown) => BigInt(String(v));

export const explorador = (assinatura: string) =>
  `https://explorer.solana.com/tx/${assinatura}?cluster=devnet`;

export const sol = (lamports: number) => lamports / LAMPORTS_PER_SOL;

/**
 * Espera a confirmação por consulta, não por websocket.
 *
 * Mesma razão do terminal: `sendAndConfirmTransaction` abre uma inscrição wss,
 * que num RPC dedicado pode não existir. Aqui, só HTTP.
 */
export async function confirmar(
  conn: Connection,
  assinatura: string,
  segundos = 60,
) {
  const limite = Date.now() + segundos * 1000;
  while (Date.now() < limite) {
    const { value } = await conn.getSignatureStatus(assinatura, {
      searchTransactionHistory: true,
    });
    if (value?.err) {
      const e = new Error(`Transação falhou: ${JSON.stringify(value.err)}`);
      // Preserva o erro cru para o classificador reconhecer o código 6008.
      (e as Error & { err?: unknown }).err = value.err;
      throw e;
    }
    if (
      value?.confirmationStatus === 'confirmed' ||
      value?.confirmationStatus === 'finalized'
    ) {
      return assinatura;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Transação ${assinatura} não confirmou em ${segundos}s.`);
}

/**
 * Falta de quórum ou falha de infraestrutura?
 *
 * É a distinção mais importante do produto: uma é a caixa de bloqueio, um
 * estado desenhado; a outra é a tela de erro de rede. Mostrar a errada no meio
 * do vídeo destrói a demonstração.
 *
 * Mantida idêntica à de `scripts/cofre/comum.mjs`. Se mudar aqui, mude lá.
 */
export function ehFaltaDeQuorum(erro: unknown): boolean {
  const CODIGO = 6008; // InvalidProposalStatus · 0x1778
  const e = erro as { code?: number; name?: string; message?: string; err?: unknown; logs?: string[] };

  if (e?.code === CODIGO) return true;

  const texto = [
    e?.name,
    e?.message,
    e?.err ? JSON.stringify(e.err) : '',
    ...(Array.isArray(e?.logs) ? e.logs : []),
  ]
    .filter(Boolean)
    .join(' ');

  return (
    /InvalidProposalStatus|Invalid proposal status/i.test(texto) ||
    new RegExp(`custom program error:\\s*0x${CODIGO.toString(16)}`, 'i').test(texto) ||
    new RegExp(`"Custom"\\s*:\\s*${CODIGO}\\b`).test(texto)
  );
}

/* ── Leitura do cofre ───────────────────────────────────────────────────── */

export type Situacao = {
  multisigPda: string;
  vaultPda: string;
  transactionIndex: string;
  status: string;
  assinaturasFeitas: number;
  assinaturasNecessarias: number;
  /** Papéis que já assinaram, para o indicador mostrar iniciais reais. */
  assinaram: Papel[];
  saldoCaixa: number;
  saldoDestino: number;
};

export async function situacao(): Promise<Situacao> {
  const conn = conexao();
  const { multisigPda, vaultPda, destino, transactionIndex } = exigirEstado();

  const [proposalPda] = multisig.getProposalPda({ multisigPda, transactionIndex });
  const [info, proposta] = await Promise.all([
    Multisig.fromAccountAddress(conn, multisigPda),
    Proposal.fromAccountAddress(conn, proposalPda),
  ]);

  // Cruza as chaves que aprovaram com os papéis conhecidos, para a tela
  // mostrar "Marina assinou" em vez de uma chave pública.
  const assinaram = (Object.keys(ENV_DO_PAPEL) as Papel[]).filter((p) => {
    try {
      const chave = signatario(p).publicKey;
      return proposta.approved.some((k) => k.equals(chave));
    } catch {
      return false;
    }
  });

  const [saldoCaixa, saldoDestino] = await Promise.all([
    conn.getBalance(vaultPda),
    conn.getBalance(destino),
  ]);

  return {
    multisigPda: multisigPda.toBase58(),
    vaultPda: vaultPda.toBase58(),
    transactionIndex: transactionIndex.toString(),
    status: proposta.status.__kind,
    assinaturasFeitas: proposta.approved.length,
    assinaturasNecessarias: info.threshold,
    assinaram,
    saldoCaixa: sol(saldoCaixa),
    saldoDestino: sol(saldoDestino),
  };
}

/* ── Escrita ────────────────────────────────────────────────────────────── */

const ABASTECER = 0.2 * LAMPORTS_PER_SOL;
const SAIDA = 0.05 * LAMPORTS_PER_SOL;

/** Cria o cofre 2-de-3 e abastece o caixa. */
export async function criarCofre() {
  const conn = conexao();
  const tesoureira = signatario('tesoureira');

  const createKey = Keypair.generate();
  const [multisigPda] = multisig.getMultisigPda({ createKey: createKey.publicKey });

  const [configPda] = multisig.getProgramConfigPda({});
  const programConfig = await multisig.accounts.ProgramConfig.fromAccountAddress(
    conn,
    configPda,
  );

  const criacao = await multisig.rpc.multisigCreateV2({
    connection: conn,
    treasury: programConfig.treasury,
    createKey,
    creator: tesoureira,
    multisigPda,
    configAuthority: null,
    threshold: 2,
    members: (Object.keys(ENV_DO_PAPEL) as Papel[]).map((p) => ({
      key: signatario(p).publicKey,
      permissions: multisig.types.Permissions.all(),
    })),
    timeLock: 0,
    rentCollector: null,
  });
  await confirmar(conn, criacao);

  const [vaultPda] = multisig.getVaultPda({ multisigPda, index: 0 });

  const { Transaction } = await import('@solana/web3.js');
  const abastecer = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: tesoureira.publicKey,
      toPubkey: vaultPda,
      lamports: ABASTECER,
    }),
  );
  await confirmar(conn, await conn.sendTransaction(abastecer, [tesoureira]));

  return { multisigPda, vaultPda, createKey, assinatura: criacao };
}

/** Cria a transação do vault e a proposta. */
export async function criarProposta(multisigPda: PublicKey, vaultPda: PublicKey) {
  const conn = conexao();
  const tesoureira = signatario('tesoureira');
  const destino = Keypair.generate().publicKey;

  const info = await Multisig.fromAccountAddress(conn, multisigPda);
  const transactionIndex = paraBigInt(info.transactionIndex) + 1n;

  const mensagem = new TransactionMessage({
    payerKey: vaultPda,
    recentBlockhash: (await conn.getLatestBlockhash()).blockhash,
    instructions: [
      SystemProgram.transfer({
        fromPubkey: vaultPda,
        toPubkey: destino,
        lamports: SAIDA,
      }),
    ],
  });

  const transacao = await multisig.rpc.vaultTransactionCreate({
    connection: conn,
    feePayer: tesoureira,
    multisigPda,
    transactionIndex,
    creator: tesoureira.publicKey,
    vaultIndex: 0,
    ephemeralSigners: 0,
    transactionMessage: mensagem,
    memo: 'Som Beira-Mar ME · Eventos',
  });
  // A proposta só existe para um índice que a rede já conhece.
  await confirmar(conn, transacao);

  const proposta = await multisig.rpc.proposalCreate({
    connection: conn,
    feePayer: tesoureira,
    creator: tesoureira,
    multisigPda,
    transactionIndex,
  });
  await confirmar(conn, proposta);

  return { destino, transactionIndex, assinatura: proposta };
}

/** Aprova a proposta pendente com o signatário indicado. */
export async function assinar(papel: Papel) {
  const conn = conexao();
  const { multisigPda, transactionIndex } = exigirEstado();
  const membro = signatario(papel);

  const assinatura = await multisig.rpc.proposalApprove({
    connection: conn,
    feePayer: membro,
    member: membro,
    multisigPda,
    transactionIndex,
  });
  await confirmar(conn, assinatura);

  return assinatura;
}

export type ResultadoExecucao =
  | { executado: true; assinatura: string; explorador: string; saldoCaixa: number; saldoDestino: number }
  | {
      bloqueado: true;
      assinaturasFeitas: number;
      assinaturasNecessarias: number;
      status: string;
      saldoCaixa: number;
      /** Link da tentativa recusada, quando houve transação na rede. */
      explorador?: string;
    };

/**
 * Tenta executar a saída.
 *
 * Quando falta assinatura NÃO devolve 500 nem a mensagem crua da biblioteca:
 * devolve o estado do bloqueio, para a interface renderizar a caixa vermelha
 * exatamente como na prancha 5b. Esse estado é a funcionalidade mais
 * importante do produto, tratada com o mesmo cuidado do caminho feliz.
 */
export async function executar(papel: Papel): Promise<ResultadoExecucao> {
  const conn = conexao();
  const { multisigPda, vaultPda, destino, transactionIndex } = exigirEstado();
  const membro = signatario(papel);

  let assinatura: string | undefined;

  try {
    assinatura = await multisig.rpc.vaultTransactionExecute({
      connection: conn,
      feePayer: membro,
      multisigPda,
      transactionIndex,
      member: membro.publicKey,
      signers: [membro],
    });
    await confirmar(conn, assinatura);

    const [saldoCaixa, saldoDestino] = await Promise.all([
      conn.getBalance(vaultPda),
      conn.getBalance(destino),
    ]);

    return {
      executado: true,
      assinatura,
      explorador: explorador(assinatura),
      saldoCaixa: sol(saldoCaixa),
      saldoDestino: sol(saldoDestino),
    };
  } catch (erro) {
    if (!ehFaltaDeQuorum(erro)) throw erro;

    const [proposalPda] = multisig.getProposalPda({ multisigPda, transactionIndex });
    const [info, proposta, saldoCaixa] = await Promise.all([
      Multisig.fromAccountAddress(conn, multisigPda),
      Proposal.fromAccountAddress(conn, proposalPda),
      conn.getBalance(vaultPda),
    ]);

    return {
      bloqueado: true,
      assinaturasFeitas: proposta.approved.length,
      assinaturasNecessarias: info.threshold,
      status: proposta.status.__kind,
      saldoCaixa: sol(saldoCaixa),
      explorador: assinatura ? explorador(assinatura) : undefined,
    };
  }
}
