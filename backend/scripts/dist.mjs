/**
 * Espelho de `dist/` para a verificação da prévia gerenciada.
 *
 * O Quórum é um app de servidor: Server Components que leem o banco sob RLS,
 * Server Actions, Route Handlers que assinam na rede e middleware que renova a
 * sessão. Nada disso vira arquivo estático — `output: 'export'` do Next recusa
 * `cookies()`, Server Action e rota de API, que é metade do produto. A build de
 * verdade fica em `.next` e é servida por `next start` ou pela Vercel.
 *
 * A prévia gerenciada, porém, confere a existência de `dist/` depois do build,
 * por convenção de projeto estático. Este script cria essa pasta.
 *
 * O que ele NÃO faz: fingir que o app roda aqui. A primeira versão desta pasta
 * era um parágrafo dizendo "esta pasta existe apenas para a verificação de
 * build" — tecnicamente verdadeiro e inútil para quem abre a prévia e queria
 * ver o produto. Agora `dist/index.html` é uma página de verdade, no sistema
 * visual do Quórum, que leva ao app em um toque e abre direto o livro-caixa
 * público, que não pede login.
 */

import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const raiz = process.cwd();
const next = path.join(raiz, '.next');
const dist = path.join(raiz, 'dist');

if (!existsSync(next)) {
  console.error('[dist] .next não existe — rode `next build` antes.');
  process.exit(1);
}

/**
 * Onde o app roda de verdade.
 *
 * A ordem é da mais confiável para a menos: a variável que você define, depois
 * o domínio que a Vercel injeta no build, e só então o endereço conhecido do
 * projeto. Sem chute: se nada estiver definido, o endereço abaixo é o que está
 * publicado hoje.
 */
const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : '') ||
  'https://solana-hacka-university.vercel.app'
).replace(/\/+$/, '');

/** O slug da entidade da demonstração, semeada por `npm run seed`. */
const ENTIDADE = process.env.SLUG_DEMO ?? 'aaaeng';
const FESTA = process.env.SLUG_FESTA_DEMO ?? 'aaaeng-baile32';

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const estaticos = path.join(next, 'static');
if (existsSync(estaticos)) {
  await cp(estaticos, path.join(dist, '_next', 'static'), { recursive: true });
}

/*
 * Escrito à mão, sem depender do CSS do Next: esta página precisa funcionar
 * mesmo se a prévia servir só o `index.html` sem os assets. Os valores são os
 * mesmos tokens de `app/globals.css` — se a paleta mudar lá, mude aqui.
 */
const pagina = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Quórum · tesouraria com quórum</title>
    <meta
      name="description"
      content="O dinheiro da entidade num cofre que exige duas assinaturas de três, com livro-caixa aberto aos associados."
    />
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100dvh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px 16px;
        background: #101823;
        color: #fff;
        font: 500 13px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      main { width: 100%; max-width: 390px; }
      .hero {
        border-radius: 16px;
        padding: 20px 18px 22px;
        background-image:
          radial-gradient(70px 48px at 86% 22%, rgba(255,255,255,.16) 0 60%, transparent 61%),
          radial-gradient(96px 62px at 14% 104%, rgba(255,255,255,.16) 0 60%, transparent 61%),
          linear-gradient(160deg, #1e88e5, #29a3f5 52%, #1b7fd4);
      }
      .rotulo {
        margin: 0;
        font-size: 10.5px;
        font-weight: 600;
        letter-spacing: .09em;
        text-transform: uppercase;
        color: rgba(255,255,255,.75);
      }
      h1 {
        margin: 8px 0 0;
        font-size: 23px;
        font-weight: 800;
        letter-spacing: -.03em;
      }
      .sub { margin: 6px 0 0; font-size: 12.5px; color: rgba(255,255,255,.88); }
      .cartao {
        margin-top: 11px;
        border: 1px solid #243448;
        border-radius: 16px;
        background: #192434;
        padding: 16px;
      }
      h2 { margin: 0; font-size: 15.5px; font-weight: 700; letter-spacing: -.015em; }
      p { margin: 8px 0 0; font-size: 12.5px; font-weight: 400; color: #9aa9bd; }
      .acoes { display: flex; flex-direction: column; gap: 9px; margin-top: 14px; }
      a {
        display: block;
        border-radius: 13px;
        padding: 14px 16px;
        text-align: center;
        font-size: 13px;
        font-weight: 700;
        text-decoration: none;
      }
      a.primario { background: #1fa5ff; color: #101823; }
      a.secundario { border: 1px solid #243448; background: #192434; color: #fff; }
      a:focus-visible { outline: 2px solid #1fa5ff; outline-offset: 2px; }
      .nota { margin-top: 14px; font-size: 11.5px; color: #6b7c93; }
      .nota code {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 11px;
        color: #9aa9bd;
      }
    </style>
  </head>
  <body>
    <main>
      <header class="hero">
        <p class="rotulo">Tesouraria estudantil</p>
        <h1>Quórum</h1>
        <p class="sub">
          O dinheiro da entidade num cofre que exige duas assinaturas de três
          para qualquer saída, com livro-caixa aberto aos associados.
        </p>
      </header>

      <section class="cartao">
        <h2>O app roda no servidor</h2>
        <p>
          As telas leem o banco com a política de acesso ligada, e as saídas são
          assinadas no servidor — nada disso vira arquivo estático. Esta pasta é
          só a verificação de build da prévia. O produto está no ar aqui:
        </p>

        <div class="acoes">
          <a class="primario" href="${SITE}">Abrir o Quórum</a>
          <a class="secundario" href="${SITE}/e/${ENTIDADE}/livro">
            Livro-caixa público · sem login
          </a>
          <a class="secundario" href="${SITE}/f/${FESTA}">
            Página da festa · sem login
          </a>
        </div>

        <p class="nota">
          Para rodar na sua máquina: <code>npm run dev</code>. Para servir a
          build: <code>npm run build &amp;&amp; npm start</code>.
        </p>
      </section>
    </main>
  </body>
</html>
`;

await writeFile(path.join(dist, 'index.html'), pagina, 'utf8');

// A prévia pode pedir uma rota que não existe no estático; devolver a mesma
// página é melhor que devolver o 404 do servidor de arquivos.
await writeFile(path.join(dist, '404.html'), pagina, 'utf8');

console.log(`[dist] pronto — aponta para ${SITE}`);
