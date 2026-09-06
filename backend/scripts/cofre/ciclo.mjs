/**
 * O ciclo inteiro do cofre, do zero — sete passos.
 *
 *   npm run ciclo
 *
 * Cria o cofre 2-de-3, abastece, propõe a saída, assina uma vez, TENTA
 * EXECUTAR E A REDE RECUSA, assina de novo, executa e imprime o comprovante.
 *
 * O quinto passo é o produto inteiro: a recusa não é falha do script, é a
 * regra do cofre funcionando. Se ele não falhar, o ciclo está errado.
 */
import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  TransactionMessage,
} from '@solana/web3.js';
import * as multisig from '@sqds/multisig';
import bs58 from 'bs58';

import {
  conexao,
  confirmar,
  ehFaltaDeQuorum,
  explorador,
  gravarEstado,
  ok,
  paraBigInt,
  passo,
  RPC,
  signatario,
  sol,
} from './comum.mjs';

const { Permissions } = multisig.types;
const { Multisig, Proposal } = multisig.accounts;

/** Quanto entra no cofre e quanto sai — devnet, valores simbólicos. */
const ABASTECER = 0.2 * LAMPORTS_PER_SOL;
const SAIDA = 0.05 * LAMPORTS_PER_SOL;

const conn = conexao();

const tesoureira = signatario('tesoureira');
const presidente = signatario('presidente');
const conselho = signatario('conselho');

console.log(`\nRede: ${RPC}`);
console.log(`Cofre 2 de 3 · ${tesoureira.nome} · ${presidente.nome} · ${conselho.nome}`);

/* ── 1 · cria o cofre 2-de-3 ────────────────────────────────────────────── */

passo(1, 'Criando o cofre com quórum de 2 de 3');

const createKey = Keypair.generate();
const [multisigPda] = multisig.getMultisigPda({ createKey: createKey.publicKey });

const configPda = multisig.getProgramConfigPda({})[0];
const programConfig =
  await multisig.accounts.ProgramConfig.fromAccountAddress(conn, configPda);

const assinaturaCriacao = await multisig.rpc.multisigCreateV2({
  connection: conn,
  treasury: programConfig.treasury,
  createKey,
  creator: tesoureira.keypair,
  multisigPda,
  configAuthority: null,
  threshold: 2,
  members: [
    { key: tesoureira.keypair.publicKey, permissions: Permissions.all() },
    { key: presidente.keypair.publicKey, permissions: Permissions.all() },
    { key: conselho.keypair.publicKey, permissions: Permissions.all() },
  ],
  timeLock: 0,
  rentCollector: null,
  sendOptions: { skipPreflight: false },
});
await confirmar(conn, assinaturaCriacao);

const [vaultPda] = multisig.getVaultPda({ multisigPda, index: 0 });
ok(`cofre  ${multisigPda.toBase58()}`);
ok(`caixa  ${vaultPda.toBase58()}`);

/* ── 2 · abastece o caixa ───────────────────────────────────────────────── */

passo(2, `Abastecendo o caixa com ${sol(ABASTECER)} SOL`);

const abastecer = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: tesoureira.keypair.publicKey,
    toPubkey: vaultPda,
    lamports: ABASTECER,
  }),
);
// Envia e confirma por consulta, não por `sendAndConfirmTransaction`: aquele
// abre uma inscrição por websocket, e num RPC dedicado o wss pode estar em
// outro host ou exigir plano diferente. Com polling, o ciclo inteiro fala só
// HTTP e funciona em qualquer provedor.
const assinaturaAbastecer = await conn.sendTransaction(abastecer, [
  tesoureira.keypair,
]);
await confirmar(conn, assinaturaAbastecer);
ok(`saldo do caixa: ${sol(await conn.getBalance(vaultPda))} SOL`);

/* ── 3 · propõe a saída ─────────────────────────────────────────────────── */

passo(3, `Propondo saída de ${sol(SAIDA)} SOL`);

const destino = Keypair.generate().publicKey;
const infoMultisig = await Multisig.fromAccountAddress(conn, multisigPda);
const transactionIndex = paraBigInt(infoMultisig.transactionIndex) + 1n;

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

const assinaturaTransacao = await multisig.rpc.vaultTransactionCreate({
  connection: conn,
  feePayer: tesoureira.keypair,
  multisigPda,
  transactionIndex,
  creator: tesoureira.keypair.publicKey,
  vaultIndex: 0,
  ephemeralSigners: 0,
  transactionMessage: mensagem,
  memo: 'Som Beira-Mar ME · Eventos',
});
// A proposta só pode existir para um índice que a rede já conhece.
await confirmar(conn, assinaturaTransacao);

const assinaturaProposta = await multisig.rpc.proposalCreate({
  connection: conn,
  feePayer: tesoureira.keypair,
  creator: tesoureira.keypair,
  multisigPda,
  transactionIndex,
});
await confirmar(conn, assinaturaProposta);

gravarEstado({
  multisigPda,
  vaultPda,
  destino,
  transactionIndex,
  createKey: bs58.encode(createKey.secretKey),
  criadoEm: new Date().toISOString(),
});

ok(`proposta #${transactionIndex} registrada · destino ${destino.toBase58()}`);

/* ── 4 · a tesoureira assina ────────────────────────────────────────────── */

passo(4, `1ª assinatura — ${tesoureira.nome}`);

const assinatura1 = await multisig.rpc.proposalApprove({
  connection: conn,
  feePayer: tesoureira.keypair,
  member: tesoureira.keypair,
  multisigPda,
  transactionIndex,
});
await confirmar(conn, assinatura1);

const [proposalPda] = multisig.getProposalPda({ multisigPda, transactionIndex });
let proposta = await Proposal.fromAccountAddress(conn, proposalPda);
ok(`${proposta.approved.length} de ${infoMultisig.threshold} assinaturas`);

/* ── 5 · tenta executar e a rede recusa — ESTE É O TAKE ─────────────────── */

passo(5, 'Tentando executar com UMA assinatura');

try {
  const tentativa = await multisig.rpc.vaultTransactionExecute({
    connection: conn,
    feePayer: tesoureira.keypair,
    multisigPda,
    transactionIndex,
    member: tesoureira.keypair.publicKey,
    signers: [tesoureira.keypair],
  });
  // A recusa pode vir na simulação (lança acima) ou só on-chain. Sem
  // confirmar, uma execução que falhou na rede passaria por bem-sucedida.
  await confirmar(conn, tentativa);

  console.error('\n✗ A EXECUÇÃO PASSOU COM UMA ASSINATURA.');
  console.error('  O cofre não está segurando o dinheiro. Isto é um defeito');
  console.error('  grave: o produto inteiro depende desta recusa.');
  process.exit(1);
} catch (erro) {
  if (!ehFaltaDeQuorum(erro)) {
    console.error('\n✗ Falhou, mas não por falta de quórum:');
    console.error(`  ${erro?.message ?? erro}`);
    console.error('\n  Isso é problema de rede ou de RPC, não a regra do cofre.');
    process.exit(1);
  }

  console.log('      ✓ RECUSADO pela rede, como tem que ser');
  console.log(`        proposta em "${proposta.status.__kind}", precisa de "Approved"`);
  console.log(`        ${proposta.approved.length} de ${infoMultisig.threshold} assinaturas · saída retida`);
  console.log(`        caixa intacto: ${sol(await conn.getBalance(vaultPda))} SOL`);
}

/* ── 6 · a presidente assina ────────────────────────────────────────────── */

passo(6, `2ª assinatura — ${presidente.nome}`);

const assinatura2 = await multisig.rpc.proposalApprove({
  connection: conn,
  feePayer: presidente.keypair,
  member: presidente.keypair,
  multisigPda,
  transactionIndex,
});
await confirmar(conn, assinatura2);

proposta = await Proposal.fromAccountAddress(conn, proposalPda);
ok(`${proposta.approved.length} de ${infoMultisig.threshold} — quórum atingido`);

/* ── 7 · executa ────────────────────────────────────────────────────────── */

passo(7, 'Executando a saída');

const assinaturaExecucao = await multisig.rpc.vaultTransactionExecute({
  connection: conn,
  feePayer: presidente.keypair,
  multisigPda,
  transactionIndex,
  member: presidente.keypair.publicKey,
  signers: [presidente.keypair],
});
await confirmar(conn, assinaturaExecucao);

ok(`caixa depois: ${sol(await conn.getBalance(vaultPda))} SOL`);
ok(`destino recebeu: ${sol(await conn.getBalance(destino))} SOL`);

console.log('\n────────────────────────────────────────────────────────');
console.log('Comprovante:');
console.log(`  ${explorador(assinaturaExecucao)}`);
console.log('────────────────────────────────────────────────────────');
console.log('\nCiclo completo: recusou com uma assinatura, passou com duas.\n');
