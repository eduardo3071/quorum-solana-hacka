/**
 * Tenta executar a saída.
 *
 *   npm run executar                 # como tesoureira
 *   npm run executar presidente
 *
 * Com uma assinatura só, a rede recusa — e essa recusa é a funcionalidade
 * mais importante do produto, não um erro a esconder. O script distingue as
 * duas causas possíveis de falha, porque na interface elas são telas
 * diferentes: falta de quórum é a caixa de bloqueio, falha de rede é a tela
 * de offline.
 *
 * Sai com código 2 quando é bloqueio por quórum, 1 quando é falha de verdade.
 * Assim dá para roteirizar a gravação sem confundir os dois.
 */
import * as multisig from '@sqds/multisig';

import {
  conexao,
  confirmar,
  ehFaltaDeQuorum,
  exigirEstado,
  explorador,
  RPC,
  signatario,
  sol,
} from './comum.mjs';

const { Multisig, Proposal } = multisig.accounts;

const papel = process.argv[2] ?? 'tesoureira';
const quem = signatario(papel);
const estado = exigirEstado();
const conn = conexao();

const { multisigPda, vaultPda, destino, transactionIndex } = estado;
const [proposalPda] = multisig.getProposalPda({ multisigPda, transactionIndex });

const infoMultisig = await Multisig.fromAccountAddress(conn, multisigPda);
const proposta = await Proposal.fromAccountAddress(conn, proposalPda);
const feitas = proposta.approved.length;
const necessarias = infoMultisig.threshold;

console.log(`\nRede: ${RPC}`);
console.log(`Proposta #${transactionIndex} · ${feitas} de ${necessarias} assinaturas · ${proposta.status.__kind}`);
console.log(`\nExecutando como ${quem.nome} (${papel})...`);

try {
  const assinatura = await multisig.rpc.vaultTransactionExecute({
    connection: conn,
    feePayer: quem.keypair,
    multisigPda,
    transactionIndex,
    member: quem.keypair.publicKey,
    signers: [quem.keypair],
  });
  await confirmar(conn, assinatura);

  console.log('\n  ✓ SAÍDA EXECUTADA');
  console.log(`  caixa depois:     ${sol(await conn.getBalance(vaultPda))} SOL`);
  console.log(`  destino recebeu:  ${sol(await conn.getBalance(destino))} SOL`);
  console.log('\n  Comprovante:');
  console.log(`  ${explorador(assinatura)}\n`);
} catch (erro) {
  if (ehFaltaDeQuorum(erro)) {
    console.log('\n  ✗ SAÍDA RETIDA PELO COFRE');
    console.log(`    ${feitas} de ${necessarias} assinaturas — falta ${necessarias - feitas}.`);
    console.log(`    A proposta está em "${proposta.status.__kind}" e só executa em "Approved".`);
    console.log(`    Nenhum valor saiu: caixa em ${sol(await conn.getBalance(vaultPda))} SOL.`);
    console.log('\n    Não é erro do sistema. É a regra do cofre funcionando.');
    console.log('    Para liberar: npm run assinar presidente\n');
    process.exit(2);
  }

  console.error('\n  ✗ FALHA DE REDE OU DE RPC — não é falta de quórum');
  console.error(`    ${erro?.message ?? erro}`);
  console.error(`\n    Verifique se ${RPC} está respondendo.`);
  console.error('    Um RPC dedicado resolve; o público estrangula por limite.\n');
  process.exit(1);
}
