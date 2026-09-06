/**
 * Gera os três signatários do cofre e imprime os endereços públicos.
 *
 *   node scripts/gerar-chaves.mjs
 *
 * O cofre é 2-de-3: são TRÊS carteiras, não uma. Cada uma precisa de SOL
 * próprio para pagar taxa de transação — uma sozinha abastecida não fecha o
 * ciclo, e isso só aparece na hora de executar.
 *
 * Só os endereços públicos vão para a tela, para você colar no faucet. As
 * chaves privadas são escritas no .env.local, que está no .gitignore e nunca
 * é commitado. Não cole chave privada em chat, issue ou print.
 *
 * Tudo aqui é criptografia local: nenhuma chamada de rede. Funciona offline.
 *
 * DEVNET APENAS. Estas chaves não valem nada e não devem guardar valor real.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

const ENV = '.env.local';
const FORCAR = process.argv.includes('--forcar');

const SIGNATARIOS = [
  { env: 'SIGNER_TESOUREIRA', papel: 'Tesoureira', quem: 'Marina Salgado' },
  { env: 'SIGNER_PRESIDENTE', papel: 'Presidente', quem: 'Letícia Marchetti' },
  { env: 'SIGNER_CONSELHO', papel: 'Conselho fiscal', quem: 'Rafael Tonetto' },
];

if (!existsSync(ENV)) {
  console.error(`✗ ${ENV} não existe. Copie .env.example para .env.local antes.`);
  process.exit(1);
}

let env = readFileSync(ENV, 'utf8');

/**
 * Um valor `<assim>` é o placeholder do .env.example, não uma chave. Quem
 * clona o repositório copia o exemplo para .env.local, e sem esta checagem o
 * gerador acha que já existem chaves e se recusa a rodar — justamente na
 * primeira vez, que é quando ele mais precisa rodar.
 */
const ehPlaceholder = (v) => /^<.*>$/.test(v.trim());

// Não sobrescreve chave já preenchida sem pedido explícito: regerar depois de
// abastecer significa perder o SOL do faucet e esperar o limite liberar.
const jaPreenchidas = SIGNATARIOS.filter((s) => {
  const m = env.match(new RegExp(`^${s.env}=(.*)$`, 'm'));
  const valor = m?.[1]?.trim();
  return Boolean(valor) && !ehPlaceholder(valor);
}).map((s) => s.env);

if (jaPreenchidas.length > 0 && !FORCAR) {
  console.error(`✗ Já existem chaves em ${ENV}: ${jaPreenchidas.join(', ')}`);
  console.error('  Regerar descarta o SOL que elas já tenham recebido.');
  console.error('  Se é isso mesmo que você quer: node scripts/gerar-chaves.mjs --forcar');
  process.exit(1);
}

const gerados = SIGNATARIOS.map((s) => {
  const kp = Keypair.generate();
  return {
    ...s,
    endereco: kp.publicKey.toBase58(),
    segredo: bs58.encode(kp.secretKey),
  };
});

for (const g of gerados) {
  const linha = `${g.env}=${g.segredo}`;
  env = new RegExp(`^${g.env}=.*$`, 'm').test(env)
    ? env.replace(new RegExp(`^${g.env}=.*$`, 'm'), linha)
    : `${env.trimEnd()}\n${linha}\n`;
}

writeFileSync(ENV, env);

console.log('');
console.log('Três signatários gerados. Chaves privadas salvas em .env.local.');
console.log('');
console.log('Cole CADA endereço abaixo em https://faucet.solana.com (rede: devnet):');
console.log('');
for (const g of gerados) {
  console.log(`  ${g.papel.padEnd(16)} ${g.endereco}`);
  console.log(`  ${''.padEnd(16)} ${g.quem}`);
  console.log('');
}
console.log('Quanto pedir: ~1,5 SOL na tesoureira (é ela que cria o cofre e');
console.log('abastece o vault) e ~0,5 SOL em cada uma das outras duas.');
console.log('');
console.log('O faucet limita por IP. Se recusar, espere ou use outra conexão —');
console.log('não adianta insistir em sequência.');
console.log('');
