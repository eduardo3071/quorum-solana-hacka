/**
 * Assina a proposta pendente com um signatário.
 *
 *   npm run assinar                  # tesoureira (padrão)
 *   npm run assinar presidente
 *   npm run assinar conselho
 *
 * Guarda estado entre execuções, para gravar o vídeo em partes.
 */
import * as multisig from '@sqds/multisig';

import {
  conexao,
  confirmar,
  exigirEstado,
  explorador,
  RPC,
  signatario,
} from './comum.mjs';

const { Multisig, Proposal } = multisig.accounts;

const papel = process.argv[2] ?? 'tesoureira';
const quem = signatario(papel);
const estado = exigirEstado();
const conn = conexao();

const { multisigPda, transactionIndex } = estado;
const [proposalPda] = multisig.getProposalPda({ multisigPda, transactionIndex });

const infoMultisig = await Multisig.fromAccountAddress(conn, multisigPda);
const antes = await Proposal.fromAccountAddress(conn, proposalPda);

console.log(`\nRede: ${RPC}`);
console.log(`Proposta #${transactionIndex} · ${antes.approved.length} de ${infoMultisig.threshold} assinaturas`);

if (antes.approved.some((k) => k.equals(quem.keypair.publicKey))) {
  console.log(`\n${quem.nome} já assinou esta proposta. Nada a fazer.\n`);
  process.exit(0);
}

console.log(`\nAssinando como ${quem.nome} (${papel})...`);

const assinatura = await multisig.rpc.proposalApprove({
  connection: conn,
  feePayer: quem.keypair,
  member: quem.keypair,
  multisigPda,
  transactionIndex,
});
await confirmar(conn, assinatura);

const depois = await Proposal.fromAccountAddress(conn, proposalPda);
const feitas = depois.approved.length;
const necessarias = infoMultisig.threshold;

console.log(`\n  ${feitas} de ${necessarias} assinaturas`);
console.log(`  ${explorador(assinatura)}`);

if (feitas < necessarias) {
  console.log(`\n  Saída retida pelo cofre. Falta ${necessarias - feitas} assinatura.`);
  console.log('  npm run executar  →  vai ser recusado, e é esse o take.\n');
} else {
  console.log('\n  Quórum atingido. npm run executar\n');
}
