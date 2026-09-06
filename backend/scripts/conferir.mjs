/**
 * Confere uma rota contra as regras de layout do projeto.
 *
 *   npm run dev
 *   node scripts/conferir.mjs /estilo
 *
 * As regras do CLAUDE.md viram teste executável aqui, porque olhar print a
 * print não escala para 12 pranchas e é justamente esse tipo de erro —
 * sobreposição, chip em duas linhas, valor partido no meio — que apareceu em
 * todas as rodadas de auditoria do design.
 *
 * Sai com código 1 se alguma regra falhar, então serve em CI.
 */
import { chromium } from 'playwright';

const ROTA = process.argv[2] ?? '/estilo';
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const LARGURA = 390;

// O ambiente já traz o Chromium; não baixe outro.
const EXECUTAVEL =
  process.env.CHROMIUM_PATH ??
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const navegador = await chromium.launch({
  executablePath: EXECUTAVEL,
  args: ['--no-sandbox'],
});
const pagina = await navegador.newPage({
  viewport: { width: LARGURA, height: 844 },
});

const resposta = await pagina.goto(BASE + ROTA, { waitUntil: 'networkidle' });
if (!resposta?.ok()) {
  console.error(`✗ ${ROTA} respondeu ${resposta?.status()}`);
  await navegador.close();
  process.exit(1);
}

const { problemas, avisos } = await pagina.evaluate((largura) => {
  const problemas = [];
  const avisos = [];

  /**
   * Quantas linhas o conteúdo ocupa de verdade.
   *
   * Contar retângulos não serve: um flex com dois filhos lado a lado produz
   * dois retângulos na mesma linha. O que importa é quantos topos distintos
   * existem — aí sim o texto desceu de linha.
   */
  const linhasDe = (el) => {
    const r = document.createRange();
    r.selectNodeContents(el);
    const topos = [...r.getClientRects()]
      .filter((x) => x.width > 0 && x.height > 0)
      .map((x) => Math.round(x.top));
    return new Set(topos).size || 1;
  };

  // Nenhum texto se sobrepõe a outro.
  const folhas = [...document.querySelectorAll('div,span,p,h1,h2,a,strong')]
    .filter((e) => e.children.length === 0 && e.textContent.trim());
  for (let i = 0; i < folhas.length; i++) {
    const a = folhas[i].getBoundingClientRect();
    if (!a.width || !a.height) continue;
    for (let j = i + 1; j < folhas.length; j++) {
      const b = folhas[j].getBoundingClientRect();
      if (!b.width || !b.height) continue;
      const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (x > 2 && y > 2) {
        problemas.push(
          `sobreposição: "${folhas[i].textContent.trim().slice(0, 24)}" × "${folhas[j].textContent.trim().slice(0, 24)}"`,
        );
      }
    }
  }

  // Contêiner de layout não é trecho de texto: seus filhos ficam lado a lado
  // por definição, e medir quebra de linha nele não quer dizer nada.
  const ehContainer = (el) => {
    const d = getComputedStyle(el).display;
    return d === 'flex' || d === 'grid' || d === 'inline-flex' || d === 'inline-grid';
  };

  // Pílula, chip e etiqueta nunca quebram em duas linhas.
  for (const el of document.querySelectorAll('.t-chip')) {
    if (ehContainer(el) || el.innerHTML.includes('<br')) continue;
    if (linhasDe(el) > 1) {
      problemas.push(`chip em duas linhas: "${el.textContent.trim().slice(0, 24)}"`);
    }
  }

  // Número e valor monetário nunca quebram.
  for (const el of document.querySelectorAll('.t-valor,.t-ancora,.t-ancora-sm,.num')) {
    if (ehContainer(el)) continue;
    if (linhasDe(el) > 1) {
      problemas.push(`valor partido: "${el.textContent.trim().slice(0, 24)}"`);
    }
  }

  // Nada transborda a largura da prancha.
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && (r.right > largura + 0.5 || r.left < -0.5)) {
      problemas.push(`transbordo: ${el.tagName.toLowerCase()}.${String(el.className).slice(0, 30)}`);
    }
  }

  // A página não rola na horizontal.
  if (document.documentElement.scrollWidth > largura + 0.5) {
    problemas.push(`rolagem horizontal: ${document.documentElement.scrollWidth}px`);
  }

  /* ── Acessibilidade ─────────────────────────────────────────────────── */

  const INTERATIVOS = 'a[href],button,input,select,textarea,[tabindex]';

  // Todo controle tem nome. Um botão que só contém ícone é lido como "botão"
  // por um leitor de tela — inútil para quem não vê o desenho.
  for (const el of document.querySelectorAll(INTERATIVOS)) {
    if (el.getAttribute('aria-hidden') === 'true') continue;
    if (el.type === 'hidden') continue;

    // `<label for>` e `<label>` envolvente também nomeiam o campo.
    const rotulo =
      (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) ||
      el.closest('label');

    const nome = (
      el.getAttribute('aria-label') ||
      el.getAttribute('title') ||
      rotulo?.textContent ||
      el.textContent ||
      ''
    ).trim();
    if (!nome) {
      problemas.push(
        `controle sem nome: ${el.tagName.toLowerCase()}.${String(el.className).slice(0, 30)}`,
      );
    }
  }

  // Nada é tirado da ordem do teclado com tabindex negativo, e nada fura a
  // ordem natural com tabindex positivo.
  for (const el of document.querySelectorAll('[tabindex]')) {
    const t = Number(el.getAttribute('tabindex'));
    if (t !== 0) problemas.push(`tabindex=${t} em ${el.tagName.toLowerCase()}`);
  }

  // Clique em div é armadilha: não recebe foco nem responde a Enter.
  for (const el of document.querySelectorAll('div[onclick],span[onclick]')) {
    problemas.push(`clique em ${el.tagName.toLowerCase()}, que o teclado não alcança`);
  }

  // O foco continua visível. Um `outline: none` sem substituto some com a
  // única pista de onde o teclado está.
  const alvoDeFoco = document.querySelector(INTERATIVOS);
  if (alvoDeFoco) {
    alvoDeFoco.focus();
    const e = getComputedStyle(alvoDeFoco);
    const semAnel =
      (e.outlineStyle === 'none' || parseFloat(e.outlineWidth) === 0) &&
      e.boxShadow === 'none';
    if (semAnel && document.activeElement === alvoDeFoco) {
      problemas.push('foco sem indicação visível');
    }
    alvoDeFoco.blur();
  }

  /* Contraste do texto sobre o fundo em que ele de fato está. */

  const canal = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const luminancia = ([r, g, b]) =>
    0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
  const cor = (txt) => {
    const n = txt.match(/[\d.]+/g);
    return n ? [+n[0], +n[1], +n[2], n[3] === undefined ? 1 : +n[3]] : null;
  };

  // Sobrepõe a cor de cima na de baixo, respeitando a transparência: um fundo
  // `bg-white/10` não é branco, é o que sobra dele sobre o que estiver atrás.
  const sobrepor = (frente, fundo) =>
    frente.slice(0, 3).map((c, i) => c * frente[3] + fundo[i] * (1 - frente[3]));

  /**
   * O fundo em que o texto de fato está.
   *
   * Devolve null quando alguma camada é gradiente ou imagem: aí a cor varia ao
   * longo do elemento e uma razão única seria invenção. Preferimos declarar
   * que não sabemos a publicar um número errado — o Hero e o cartaz da festa
   * caem neste caso, e é lá que o texto é branco sobre cor forte.
   */
  const fundoDe = (el) => {
    let atual = el;
    let acumulado = [16, 24, 35]; // --color-ground
    const camadas = [];
    while (atual && atual !== document.documentElement) {
      const e = getComputedStyle(atual);
      if (e.backgroundImage !== 'none') return null;
      const c = cor(e.backgroundColor);
      if (c && c[3] > 0) camadas.push(c);
      atual = atual.parentElement;
    }
    for (const c of camadas.reverse()) acumulado = sobrepor(c, acumulado);
    return acumulado;
  };

  /**
   * A exceção declarada: `--color-ink-3` (#6b7c93).
   *
   * É o terceiro degrau da escala de texto, e nas pranchas ele fica entre
   * 3,26:1 e 4,19:1 — abaixo do 4,5:1 que a WCAG AA pede para texto pequeno.
   * Subir o token até passar (≈ #8997A9) o encosta no `ink-2` e achata a
   * hierarquia de três níveis que o design usa em toda tela.
   *
   * O design está fechado e as pranchas são a especificação, então este
   * conferidor NÃO decide sozinho: relata como aviso, com o número medido, e
   * continua reprovando qualquer outra cor que fique abaixo do mínimo. Trocar
   * o token é uma linha em `app/globals.css` — e é decisão de quem desenhou.
   */
  const INK_3 = [107, 124, 147];
  const ehInk3 = (c) => c && INK_3.every((v, i) => Math.abs(c[i] - v) <= 1);

  let semMedida = 0;

  for (const el of folhas) {
    const e = getComputedStyle(el);
    if (e.visibility === 'hidden' || e.opacity === '0') continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;

    const frente = cor(e.color);
    if (!frente) continue;

    const fundo = fundoDe(el);
    if (!fundo) {
      semMedida++;
      continue;
    }

    const texto = sobrepor(frente, fundo);
    const [a, b] = [luminancia(texto), luminancia(fundo)].sort((x, y) => y - x);
    const razao = (a + 0.05) / (b + 0.05);

    // WCAG AA: 3:1 para texto grande (≥24px, ou ≥18.66px em negrito), 4.5:1
    // para o resto.
    const tamanho = parseFloat(e.fontSize);
    const peso = Number(e.fontWeight) || 400;
    const grande = tamanho >= 24 || (tamanho >= 18.66 && peso >= 700);
    const minimo = grande ? 3 : 4.5;

    if (razao >= minimo) continue;

    const onde = `${razao.toFixed(2)}:1 (mínimo ${minimo}) em "${el.textContent.trim().slice(0, 28)}"`;
    if (ehInk3(frente) && razao >= 3) avisos.push(`contraste ink-3 ${onde}`);
    else problemas.push(`contraste ${onde}`);
  }

  if (semMedida > 0) {
    avisos.push(
      `${semMedida} trecho(s) sobre gradiente — contraste não medido, confira a olho`,
    );
  }

  return { problemas: [...new Set(problemas)], avisos: [...new Set(avisos)] };
}, LARGURA);

await navegador.close();

for (const a of avisos) console.warn(`  ~ ${a}`);

if (problemas.length === 0) {
  console.log(`✓ ${ROTA} — nenhuma regra violada`);
  process.exit(0);
}

console.error(`✗ ${ROTA} — ${problemas.length} problema(s):`);
for (const p of problemas) console.error('  ' + p);
process.exit(1);
