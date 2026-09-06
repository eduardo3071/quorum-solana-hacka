/**
 * Mostra o saldo em SOL dos signatários na devnet.
 *
 *   npm run saldo                  # os três do .env.local
 *   npm run saldo <endereço>       # um endereço qualquer
 *
 * Serve para conferir se o faucet caiu antes de rodar o ciclo. O cofre é
 * 2-de-3 e cada signatário paga a própria taxa: se um estiver zerado, a
 * execução falha no meio, e no meio é o pior lugar para descobrir.
 */
import { existsSync, readFileSync } from 'node:fs';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

const ENV = '.env.local';

/** Lê uma variável do .env.local. Node não carrega o arquivo sozinho. */
function doEnv(chave) {
  if (!existsSync(ENV)) return undefined;
  const linha = readFileSync(ENV, 'utf8')
    .split('\n')
    .find((l) => l.startsWith(`${chave}=`));
  const valor = linha?.slice(chave.length + 1).trim();
  // `<assim>` é o placeholder do .env.example — vale como não preenchido.
  if (!valor || /^<.*>$/.test(valor)) return undefined;
  return valor;
}

const RPC = doEnv('SOLANA_RPC_URL') ?? 'https://api.devnet.solana.com';

/** Quanto cada papel precisa para o ciclo fechar, segundo o caderno. */
const SIGNATARIOS = [
  { env: 'SIGNER_TESOUREIRA', papel: 'Tesoureira', minimo: 1.5 },
  { env: 'SIGNER_PRESIDENTE', papel: 'Presidente', minimo: 0.5 },
  { env: 'SIGNER_CONSELHO', papel: 'Conselho fiscal', minimo: 0.5 },
];

const argumento = process.argv[2];
let alvos;

if (argumento) {
  let chave;
  try {
    chave = new PublicKey(argumento);
  } catch {
    console.error(`✗ "${argumento}" não é um endereço Solana válido.`);
    process.exit(1);
  }
  alvos = [{ papel: 'Endereço', endereco: chave, minimo: 0 }];
} else {
  alvos = SIGNATARIOS.map((s) => {
    const segredo = doEnv(s.env);
    if (!segredo) return { ...s, erro: 'sem chave no .env.local' };
    try {
      const kp = Keypair.fromSecretKey(bs58.decode(segredo));
      return { ...s, endereco: kp.publicKey };
    } catch {
      return { ...s, erro: 'chave inválida — regere com npm run chaves' };
    }
  });

  if (alvos.every((a) => a.erro)) {
    console.error('✗ Nenhuma chave em .env.local. Rode: npm run chaves');
    process.exit(1);
  }
}

console.log(`\nRede: ${RPC}\n`);

const conexao = new Connection(RPC, 'confirmed');
let faltando = 0;

for (const alvo of alvos) {
  if (alvo.erro) {
    console.log(`  ${alvo.papel.padEnd(16)} — ${alvo.erro}`);
    faltando++;
    continue;
  }

  try {
    const lamports = await conexao.getBalance(alvo.endereco);
    const sol = lamports / LAMPORTS_PER_SOL;
    const ok = sol >= alvo.minimo;
    if (!ok) faltando++;

    console.log(`  ${alvo.papel.padEnd(16)} ${sol.toFixed(4)} SOL  ${ok ? '✓' : `✗ precisa de ~${alvo.minimo}`}`);
    console.log(`  ${''.padEnd(16)} ${alvo.endereco.toBase58()}`);
    console.log('');
  } catch (e) {
    // A falha mais comum não é o endereço: é o RPC fora do ar, estrangulando
    // por limite, ou a máquina sem saída para a devnet. Dizer isso poupa a
    // pessoa de procurar erro onde não está.
    console.error(`  ${alvo.papel.padEnd(16)} ✗ não deu para consultar`);
    console.error(`  ${''.padEnd(16)} ${e instanceof Error ? e.message : e}`);
    console.error('');
    console.error(`  Verifique se ${RPC} responde e se há saída de rede.`);
    process.exit(1);
  }
}

if (faltando > 0) {
  console.log(`${faltando} carteira(s) sem SOL suficiente.`);
  console.log('Peça em https://faucet.solana.com com a rede em devnet.\n');
  process.exit(1);
}

console.log('Todas abastecidas. Dá para rodar o ciclo.\n');
