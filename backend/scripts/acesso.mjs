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
import { createRequire } from 'node:module';
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
  /*
   * Chama o `next` pelo caminho do arquivo, com o mesmo Node que roda este
   * script — e não `spawn('npx', …)`.
   *
   * No Windows o executável é `npx.cmd`, e `spawn` sem `shell` não resolve a
   * extensão: dá `ENOENT` e o script morre antes de conferir nada. `shell:true`
   * consertaria a chamada e quebraria a limpeza, porque aí quem morre no
   * `kill()` é o shell, não o servidor — e a porta fica ocupada até alguém
   * reiniciar a máquina.
   *
   * Resolvendo o arquivo, o filho é um processo Node direto: funciona igual nos
   * três sistemas e o `kill()` acerta quem deve.
   */
  let next;
  try {
    next = createRequire(import.meta.url).resolve('next/dist/bin/next');
  } catch {
    console.error(
      'Não achei o Next aqui. Rode `npm install` dentro de backend/ — o do\n' +
        'diretório de cima não serve, são dois projetos.',
    );
    process.exit(1);
  }

  const base = `http://127.0.0.1:${PORTA_API}`;
  console.log(`Subindo a API em ${base}`);
  console.log('Na primeira vez ela compila, e isso leva um tempo.\n');

  const filho = spawn(process.execPath, [next, 'dev', '-p', String(PORTA_API)], {
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${PORTA_FALSA}`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-de-mentira',
      SUPABASE_SERVICE_ROLE_KEY: 'servico-de-mentira',

      /*
       * As chaves do cofre saem de cena, e isto NÃO é detalhe.
       *
       * O Next carrega o `.env.local` de quem roda, e quem já gerou as chaves
       * tem ali as três de verdade. Sem estas linhas, o caso "signatária no
       * cofre dela → passa" atravessava a autorização e ia até o fim: criava um
       * multisig na devnet, abastecia o caixa, abria uma proposta e
       * SOBRESCREVIA o `.cofre-devnet.json` — trocando o cofre para o qual a
       * demonstração aponta. A cada execução, outro. Aconteceu de verdade antes
       * desta correção.
       *
       * O formato `<...>` é o que `signatario()` já reconhece como não
       * preenchido: ele recusa antes de qualquer ida à rede, e a recusa vira
       * 400 — que é o que este conferidor quer ver, porque significa "passou
       * pela fechadura e parou na configuração".
       *
       * Um conferidor de fechadura não abre a porta para ver se abriu.
       */
      SIGNER_TESOUREIRA: '<conferidor-de-acesso>',
      SIGNER_PRESIDENTE: '<conferidor-de-acesso>',
      SIGNER_CONSELHO: '<conferidor-de-acesso>',
      // Segunda tranca: se algum caminho futuro escapar da primeira, a rede é
      // uma porta fechada em vez da devnet.
      SOLANA_RPC_URL: 'http://127.0.0.1:1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  /*
   * O que o Next disser fica guardado, e só aparece se algo der errado.
   *
   * Antes isto era `stdio: 'ignore'`: quando o Next falhava, o script ficava
   * dois minutos calado e terminava dizendo "não subiu", sem a única
   * informação que resolveria — o que o Next tinha reclamado.
   */
  let saida = '';
  const guardar = (d) => {
    saida += d.toString();
    if (saida.length > 20000) saida = saida.slice(-20000);
  };
  filho.stdout.on('data', guardar);
  filho.stderr.on('data', guardar);

  let morreu = null;
  filho.on('error', (e) => (morreu = e.message));
  filho.on('exit', (codigo) => {
    if (morreu === null) morreu = `o Next encerrou sozinho (código ${codigo})`;
  });

  const explodir = (motivo) => {
    derrubar(filho);
    const cauda = saida.trim().split('\n').slice(-25).join('\n');
    console.error(`\n✗ ${motivo}`);
    if (cauda) console.error(`\nO que o Next disse:\n${cauda}`);
    process.exit(1);
  };

  const LIMITE = 180;
  for (let s = 1; s <= LIMITE; s++) {
    await new Promise((r) => setTimeout(r, 1000));

    if (morreu) explodir(morreu);

    /*
     * Se a porta estiver ocupada, o Next NÃO falha: ele sobe na porta seguinte
     * e avisa. Sem esta checagem o script sondaria a 3311 para sempre, que é
     * exatamente a cara de um travamento.
     */
    if (/Port \d+ is in use/i.test(saida)) {
      explodir(
        `A porta ${PORTA_API} está ocupada, então o Next subiu noutra. ` +
          'Feche o que está usando essa porta e rode de novo.',
      );
    }

    try {
      const r = await fetch(`${base}/api/executar`, { method: 'POST' });
      if (r.status === 401) {
        console.log(`API de pé em ${s}s.\n`);
        return { filho, base };
      }
    } catch {
      // Ainda subindo.
    }

    // Um sinal de vida a cada cinco segundos. Silêncio prolongado num terminal
    // é indistinguível de processo travado, e a pessoa mata o script.
    if (s % 5 === 0) process.stdout.write(`  … ${s}s\n`);
  }

  explodir(
    `A API não respondeu em ${LIMITE}s. Confira se a porta ${PORTA_API} está ` +
      'livre e se `npm install` já rodou aqui.',
  );
}

/**
 * Derruba o servidor e o que ele tiver aberto.
 *
 * `kill()` manda o sinal só para o filho direto. No Linux e no Mac o `next dev`
 * entende o sinal e leva os processos dele junto; no Windows não existe sinal —
 * `TerminateProcess` mata só aquele PID e os netos ficam segurando a porta.
 * `taskkill /T` derruba a árvore inteira.
 */
function derrubar(filho) {
  if (!filho || filho.killed) return;

  if (process.platform === 'win32') {
    try {
      spawn('taskkill', ['/pid', String(filho.pid), '/T', '/F'], { stdio: 'ignore' });
      return;
    } catch {
      // Sem taskkill (raro): cai no kill comum, melhor que nada.
    }
  }
  filho.kill();
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

// Ctrl+C no meio da espera não pode deixar o Next rodando atrás: a porta ficaria
// presa e a próxima execução falharia por um motivo que não tem nada a ver.
let emAndamento = null;
process.on('SIGINT', () => {
  console.log('\n\nInterrompido. Derrubando a API…');
  derrubar(emAndamento);
  process.exit(130);
});
const problemas = [];

let filho = null;
let falso = null;
let base = remoto;

try {
  if (!remoto) {
    falso = await subirFalso();
    ({ filho, base } = await subirApi());
    emAndamento = filho;
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
  derrubar(filho);
  falso?.close();
}

if (problemas.length) {
  console.error(`\n✗ ${problemas.length} problema(s):`);
  for (const p of problemas) console.error(`  ${p}`);
  process.exit(1);
}

console.log('\n✓ a API recusa quem não devia entrar');
