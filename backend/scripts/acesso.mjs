/**
 * Confere que a API não é aberta.
 *
 *   npm run acesso                          local, completo
 *   npm run acesso -- https://…vercel.app   contra o que está no ar
 *
 * Sai com código 1 se qualquer caso falhar, para servir em CI.
 *
 * Por que existe um Supabase de mentira aqui dentro: sem ele, um token
 * qualquer é recusado porque a validação não consegue falar com o Supabase de
 * verdade — e o teste "token inválido → 401" passaria pelo motivo errado, sem
 * nunca provar que um token BOM é aceito. Uma fechadura que trava com qualquer
 * chave não foi testada; foi só observada emperrada.
 *
 * No modo remoto o falso não entra: contra o que está no ar, os casos que
 * exigem um usuário conhecido ficam de fora, e o relatório diz quais e por quê.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import process from 'node:process';

const PORTA_API = 3311;
const PORTA_FALSA = 54322;

/* ── O Supabase de mentira ──────────────────────────────────────────────── */

const USUARIO = { id: 'user-1', aud: 'authenticated', email: 'marina@grad.ufsc.br' };

/** Quem é quem, por token. `null` = entrou, mas ninguém o cadastrou. */
const MEMBROS = {
  'token-signataria': {
    id: 'm-1',
    nome: 'Marina Salgado',
    papel: 'tesoureiro',
    entidade_id: 'ent-1',
    entidades: { slug: 'aaaeng' },
  },
  'token-socio': {
    id: 'm-9',
    nome: 'João Sócio',
    papel: 'socio',
    entidade_id: 'ent-1',
    entidades: { slug: 'aaaeng' },
  },
  'token-sem-entidade': null,
};

function subirFalso() {
  let ultimo = null;

  const servidor = createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const json = (codigo, corpo) => {
      res.writeHead(codigo, { 'content-type': 'application/json' });
      res.end(JSON.stringify(corpo));
    };

    if (url.pathname === '/auth/v1/user') {
      const token = (req.headers.authorization ?? '').replace(/^Bearer /i, '');
      if (!(token in MEMBROS)) return json(401, { message: 'invalid claim' });
      ultimo = token;
      return json(200, USUARIO);
    }

    if (url.pathname === '/rest/v1/membros') {
      const membro = MEMBROS[ultimo];
      if (!membro) return json(200, []);
      const filtro = url.searchParams.get('entidades.slug');
      if (filtro && filtro !== `eq.${membro.entidades.slug}`) return json(200, []);
      return json(200, [membro]);
    }

    json(200, []);
  });

  return new Promise((ok) => servidor.listen(PORTA_FALSA, () => ok(servidor)));
}

/* ── A API ──────────────────────────────────────────────────────────────── */

async function subirApi() {
  const filho = spawn('npx', ['next', 'dev', '-p', String(PORTA_API)], {
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${PORTA_FALSA}`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-de-mentira',
      SUPABASE_SERVICE_ROLE_KEY: 'servico-de-mentira',
    },
    stdio: 'ignore',
  });

  const base = `http://127.0.0.1:${PORTA_API}`;

  /*
   * Espera pelo 401 de `/api/executar`, e não por `/api/estado`: a recusa por
   * falta de token acontece antes de qualquer ida à rede, então ela responde
   * na hora. `estado` iria à devnet e demoraria — ou penduraria, num ambiente
   * sem saída.
   */
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const r = await fetch(`${base}/api/executar`, { method: 'POST' });
      if (r.status === 401) return { filho, base };
    } catch {
      // Ainda subindo.
    }
  }

  filho.kill();
  throw new Error(`A API não subiu em ${PORTA_API} depois de 2 minutos.`);
}

/* ── Os casos ───────────────────────────────────────────────────────────── */

const ENDPOINTS = ['/api/executar', '/api/assinar', '/api/proposta', '/api/cofre'];

/** Casos que valem contra qualquer API, inclusive a de produção. */
const SEM_USUARIO = [
  { nome: 'sem cabeçalho', cabecalhos: {}, esperado: 401 },
  {
    nome: 'esquema errado (Basic)',
    cabecalhos: { authorization: 'Basic YWJjOjEyMw==' },
    esperado: 401,
  },
  {
    nome: 'token que não é JWT',
    cabecalhos: { authorization: 'Bearer nao-e-um-jwt' },
    esperado: 401,
  },
];

/** Casos que precisam de um usuário conhecido — só no modo local. */
const COM_USUARIO = [
  {
    nome: 'sócio tenta mexer no cofre',
    cabecalhos: { authorization: 'Bearer token-socio' },
    esperado: 403,
  },
  {
    nome: 'entrou, mas não é de entidade nenhuma',
    cabecalhos: { authorization: 'Bearer token-sem-entidade' },
    esperado: 403,
  },
  {
    nome: 'signatária pedindo cofre de outra entidade',
    cabecalhos: { authorization: 'Bearer token-signataria' },
    corpo: { entidadeSlug: 'outra-atletica' },
    esperado: 403,
  },
  {
    /*
     * O caso que importa: tem de PASSAR. Não checa 200 — a lógica do cofre
     * responde o que responder (400 sem cofre criado, 503 sem rede) —, checa
     * que NÃO é 401 nem 403. Exigir 200 aqui faria o teste falhar por motivo
     * que não é acesso.
     */
    nome: 'signatária no cofre dela → passa',
    cabecalhos: { authorization: 'Bearer token-signataria' },
    corpo: { entidadeSlug: 'aaaeng' },
    recusar: [401, 403],
  },
];

async function bate(base, rota, caso) {
  const r = await fetch(base + rota, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...caso.cabecalhos },
    body: JSON.stringify({ papel: 'tesoureira', ...(caso.corpo ?? {}) }),
  });

  const corpo = await r.json().catch(() => ({}));
  const ok = caso.recusar ? !caso.recusar.includes(r.status) : r.status === caso.esperado;

  return { ok, status: r.status, erro: corpo.erro ?? '' };
}

/* ── O relatório ────────────────────────────────────────────────────────── */

const remoto = process.argv[2]?.replace(/\/+$/, '');
const problemas = [];

let filho = null;
let falso = null;
let base = remoto;

try {
  if (!remoto) {
    falso = await subirFalso();
    ({ filho, base } = await subirApi());
  }

  console.log(`Conferindo o acesso em ${base}\n`);

  const casos = remoto ? SEM_USUARIO : [...SEM_USUARIO, ...COM_USUARIO];

  for (const caso of casos) {
    const linhas = [];
    let falhou = false;

    for (const rota of ENDPOINTS) {
      const r = await bate(base, rota, caso);
      if (!r.ok) {
        falhou = true;
        problemas.push(
          `${rota} · ${caso.nome}: respondeu ${r.status}` +
            (caso.esperado ? `, esperado ${caso.esperado}` : ', e não devia recusar'),
        );
      }
      linhas.push(`${rota.replace('/api/', '')} ${r.status}`);
    }

    console.log(`${falhou ? '✗' : '✓'} ${caso.nome.padEnd(38)} ${linhas.join('  ')}`);
  }

  // `/api/estado` fica aberta de propósito. Se um dia alguém a trancar sem
  // querer, o livro-caixa público perde a fonte — melhor descobrir aqui.
  const estado = await fetch(`${base}/api/estado`);
  if (estado.status === 401 || estado.status === 403) {
    problemas.push(`/api/estado trancou (${estado.status}); ela é pública de propósito`);
  }
  console.log(`✓ ${'/api/estado segue aberta'.padEnd(38)} estado ${estado.status}`);

  if (remoto) {
    console.log(
      '\n~ 4 casos ficaram de fora: exigem um usuário conhecido, e contra o que\n' +
        '  está no ar não há como criar um. Rode `npm run acesso` sem endereço\n' +
        '  para cobri-los.',
    );
  }
} finally {
  filho?.kill();
  falso?.close();
}

if (problemas.length) {
  console.error(`\n✗ ${problemas.length} problema(s):`);
  for (const p of problemas) console.error(`  ${p}`);
  process.exit(1);
}

console.log('\n✓ a API recusa quem não devia entrar');
