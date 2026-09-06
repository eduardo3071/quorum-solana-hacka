/**
 * Procura o que ficou de mentira: link morto, controle decorativo, dado falso.
 *
 *   npm run dev
 *   node scripts/nada-mockado.mjs
 *
 * Nasceu de uma auditoria que achou seis coisas assim de uma vez — o botão
 * flutuante que não levava a lugar nenhum, a aba "Festas" montando o endereço
 * de um evento com o slug da entidade, duas ações rápidas apontando para telas
 * que nunca existiram, a busca do livro-caixa que não buscava e as setas do
 * perfil que não navegavam.
 *
 * Nada disso quebra o build, nenhum teste de tipo pega, e todas são exatamente
 * o tipo de coisa em que um avaliador clica. Por isso viraram regra executável.
 *
 * Sai com código 1 se achar algo, então serve em CI.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const RAIZ = process.cwd();
const EXECUTAVEL =
  process.env.CHROMIUM_PATH ??
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/** Rotas visitadas na varredura. O slug da semente. */
const ROTAS = (process.env.ROTAS ?? [
  '/',
  '/entrar',
  '/estilo',
  '/e/aaaeng',
  '/e/aaaeng/aprovacoes',
  '/e/aaaeng/livro',
  '/e/aaaeng/festas',
  '/e/aaaeng/socios',
  '/e/aaaeng/propor',
  '/f/aaaeng-baile32',
  '/perfil',
].join(',')).split(',');

const problemas = [];
const anota = (rota, texto) => problemas.push(`${rota} — ${texto}`);

/* ── 1. Restos de mentira no código ─────────────────────────────────────── */

function arquivos(dir) {
  const saida = [];
  for (const nome of readdirSync(dir)) {
    if (nome === 'node_modules' || nome === '.next' || nome === '.git') continue;
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) saida.push(...arquivos(caminho));
    else if (/\.(tsx?|mjs)$/.test(caminho)) saida.push(caminho);
  }
  return saida;
}

// `mock` como identificador, não como palavra solta num comentário que explica
// que o mock foi embora.
const MARCAS = [
  { padrao: /\bTODO\b|\bFIXME\b|\bXXX\b/, o_que: 'marca de pendência' },
  // Identificador, não palavra solta: um comentário que diz "o mock saiu" não
  // é um mock. `MOCK_ALGO`, `mockAlgo` e `fakeAlgo` são.
  { padrao: /\bMOCK_[A-Z]|\b(?:mock|fake|dummy)[A-Z]\w*|lorem ipsum/i, o_que: 'dado de mentira' },
  { padrao: /href=(?:"|\{`)#(?:"|`\})/, o_que: 'link para lugar nenhum (href="#")' },
  { padrao: /onClick=\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/, o_que: 'clique que não faz nada' },
];

for (const caminho of arquivos(join(RAIZ, 'app')).concat(
  arquivos(join(RAIZ, 'components')),
  arquivos(join(RAIZ, 'lib')),
)) {
  const linhas = readFileSync(caminho, 'utf8').split('\n');
  linhas.forEach((linha, i) => {
    for (const { padrao, o_que } of MARCAS) {
      if (padrao.test(linha)) {
        anota(`${relative(RAIZ, caminho)}:${i + 1}`, `${o_que}: ${linha.trim().slice(0, 60)}`);
      }
    }
  });
}

/* ── 2. A tela, no navegador ────────────────────────────────────────────── */

const navegador = await chromium.launch({
  executablePath: EXECUTAVEL,
  args: ['--no-sandbox'],
});
const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 } });

/** Cada destino é visitado uma vez só, mesmo aparecendo em cinco telas. */
const destinos = new Map();

for (const rota of ROTAS) {
  const resposta = await pagina.goto(BASE + rota, { waitUntil: 'networkidle' });
  const status = resposta?.status() ?? 0;

  // 307 aqui é o portão de login mandando o visitante para /entrar, e é o
  // comportamento certo — não é rota quebrada.
  if (status >= 400) {
    anota(rota, `respondeu ${status}`);
    continue;
  }

  const achados = await pagina.evaluate((catalogo) => {
    const problemas = [];
    const links = [];

    for (const a of document.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto:')) continue;
      if (href === '#') problemas.push('link para "#"');
      else links.push(new URL(href, location.href).pathname + new URL(href, location.href).search);
    }

    /*
     * Controle que promete e não cumpre.
     *
     * Uma seta de navegação ou uma lupa dentro de algo que não é link, botão
     * nem campo é enfeite com cara de controle. Foi o caso das linhas do
     * perfil e da busca do livro-caixa.
     */
    // A folha de estilo mostra componentes como amostra: lá o ícone sem ação
    // é o espécime, não uma promessa quebrada.
    for (const svg of catalogo
      ? []
      : document.querySelectorAll('svg.lucide-chevron-right, svg.lucide-search')) {
      const acionavel = svg.closest('a[href],button,input,form,label,[role="button"]');
      if (!acionavel) {
        const perto = (svg.closest('div')?.textContent ?? '').trim().slice(0, 40);
        problemas.push(`ícone de ação sem ação, perto de "${perto}"`);
      }
    }

    // Campo de formulário fora de um form e sem manipulador é campo que não
    // envia nada.
    for (const input of document.querySelectorAll('input:not([type=hidden])')) {
      if (!input.closest('form')) {
        problemas.push(`campo fora de formulário: ${input.name || input.id || input.type}`);
      }
    }

    return { problemas, links };
  }, rota === '/estilo');

  for (const p of achados.problemas) anota(rota, p);
  for (const l of achados.links) {
    if (!destinos.has(l)) destinos.set(l, rota);
  }
}

/* ── 3. Todo link leva a algum lugar ────────────────────────────────────── */

for (const [destino, origem] of destinos) {
  if (ROTAS.includes(destino)) continue;

  const resposta = await pagina.goto(BASE + destino, { waitUntil: 'domcontentloaded' });
  const status = resposta?.status() ?? 0;

  if (status >= 400) {
    anota(origem, `link morto para ${destino} (${status})`);
    continue;
  }

  // O Next devolve 200 na página de "não encontrado" quando ela é renderizada
  // por `notFound()` dentro de uma rota que existe. Só o status não basta.
  // `innerText` e não `textContent`: o segundo inclui o conteúdo das tags
  // <script>, e o Next injeta ali o texto da página de "não encontrado" —
  // o que fazia toda página acusar 404 falso.
  const texto = await pagina.innerText('body');
  if (/não encontrad|This page could not be found/i.test(texto)) {
    anota(origem, `link para ${destino} cai em "não encontrado"`);
  }
}

await navegador.close();

if (problemas.length === 0) {
  console.log(`✓ ${destinos.size} destinos conferidos — nada mockado, nada morto`);
  process.exit(0);
}

console.error(`✗ ${problemas.length} achado(s):`);
for (const p of [...new Set(problemas)]) console.error('  ' + p);
process.exit(1);
