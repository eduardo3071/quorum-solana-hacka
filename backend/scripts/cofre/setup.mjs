/**
 * Prepara tudo para o ciclo: chaves e SOL.
 *
 *   npm run setup
 *
 * Gera as três chaves se ainda não existirem e depois confere os saldos. Não
 * pede ao faucet sozinho: o faucet público limita por IP e recusa chamada
 * automatizada, então quem cola cada endereço é você. O script diz quais
 * faltam e para.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

import { doEnv, ENV, PAPEIS } from './comum.mjs';

if (!existsSync(ENV)) {
  console.error(`✗ ${ENV} não existe. Copie .env.example para .env.local antes.`);
  process.exit(1);
}

const faltamChaves = Object.values(PAPEIS).some((p) => !doEnv(p.env));

if (faltamChaves) {
  console.log('Nenhuma chave encontrada. Gerando as três...\n');
  const r = spawnSync(process.execPath, ['scripts/gerar-chaves.mjs'], {
    stdio: 'inherit',
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
  console.log('Abasteça os endereços acima e rode `npm run setup` de novo.\n');
  process.exit(0);
}

console.log('Chaves no lugar. Conferindo saldos...\n');
const r = spawnSync(process.execPath, ['scripts/saldo.mjs'], { stdio: 'inherit' });

if (r.status !== 0) {
  console.log('Abasteça o que falta antes de rodar `npm run ciclo`.\n');
  process.exit(r.status ?? 1);
}

console.log('Pronto para `npm run ciclo`.\n');
