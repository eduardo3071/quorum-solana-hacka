/**
 * Semeia o banco com o cenário do vídeo.
 *
 *   npm run seed            # cria o que faltar, não mexe no que existe
 *   npm run seed --forcar   # apaga a entidade e refaz do zero
 *
 * Roda com a service role, que ignora RLS — é o único jeito de escrever em
 * tabelas cujas políticas não dão INSERT a ninguém, e é assim de propósito.
 * NUNCA aponte este script para um banco que não seja o da demonstração.
 *
 * Dinheiro é integer em CENTAVOS, do script até a tela. Há uma conferência no
 * fim que estoura se as contas não fecharem: um livro-caixa cujo total não bate
 * com as próprias linhas destrói a credibilidade da demonstração inteira, e é
 * melhor descobrir aqui do que no ar.
 *
 * Extensão .mjs, e não .ts como pede o caderno: todo script deste repositório
 * roda com `node` puro, sem carregador de TypeScript. Um script de semente que
 * não roda por causa do carregador é pior do que um que não é TypeScript.
 */
import { existsSync, readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const ENV = '.env.local';
const FORCAR = process.argv.includes('--forcar');

/** Lê uma variável do .env.local. Node não carrega o arquivo sozinho. */
function doEnv(chave) {
  const doProcesso = process.env[chave];
  if (doProcesso && !/^<.*>$/.test(doProcesso)) return doProcesso;
  if (!existsSync(ENV)) return undefined;

  const linha = readFileSync(ENV, 'utf8')
    .split('\n')
    .find((l) => l.startsWith(`${chave}=`));
  const valor = linha?.slice(chave.length + 1).trim();
  if (!valor || /^<.*>$/.test(valor)) return undefined;
  return valor;
}

const URL = doEnv('NEXT_PUBLIC_SUPABASE_URL');
const CHAVE = doEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!URL || !CHAVE) {
  console.error('✗ Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY.');
  console.error('  Copie .env.example para .env.local e preencha com os dados do painel.');
  process.exit(1);
}

const db = createClient(URL, CHAVE, { auth: { persistSession: false } });

/* ── O cenário ──────────────────────────────────────────────────────────── */

const ENTIDADE = {
  nome: 'A.A.A. Engenharia',
  slug: 'aaaeng',
  tipo: 'atletica',
  universidade: 'UFSC',
  publico: true,
};

/**
 * A diretoria, com e-mails de mentira por padrão.
 *
 * Ninguém recebe link num `@grad.ufsc.br` que não existe. Para entrar de
 * verdade — na sua máquina ou na demonstração — aponte a persona que você vai
 * usar para uma caixa que você abre, definindo no `.env.local`:
 *
 *   EMAIL_TESOUREIRA=voce@gmail.com
 *   EMAIL_PRESIDENTE=voce+presidente@gmail.com
 *
 * O `+alguma-coisa` do Gmail cai na mesma caixa e conta como endereço distinto,
 * o que dá as duas personas do teste de dois navegadores sem criar outra conta.
 *
 * Fica em variável, e não escrito aqui, porque e-mail pessoal não vai para o
 * repositório — e porque assim `npm run seed -- --forcar` não desfaz o que você
 * configurou.
 */
const DIRETORIA = [
  {
    nome: 'Letícia Marchetti',
    papel: 'presidente',
    email: doEnv('EMAIL_PRESIDENTE') ?? 'leticia.marchetti@grad.ufsc.br',
  },
  {
    nome: 'Marina Salgado',
    papel: 'tesoureiro',
    email: doEnv('EMAIL_TESOUREIRA') ?? 'marina.salgado@grad.ufsc.br',
  },
  {
    nome: 'Rafael Tonetto',
    papel: 'conselho',
    email: doEnv('EMAIL_CONSELHO') ?? 'rafael.tonetto@grad.ufsc.br',
  },
].map((m) => ({ ...m, email: m.email.toLowerCase() }));

/**
 * "62 associados" no cabeçalho da prancha 5a são 62 linhas de verdade.
 *
 * Um número inventado no cabeçalho e uma lista de três pessoas atrás dele é o
 * tipo de detalhe que alguém clica no meio da apresentação.
 */
const PRIMEIROS = [
  'Ana', 'Bruno', 'Camila', 'Diego', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique',
  'Isabela', 'João', 'Karina', 'Lucas', 'Mariana', 'Nathan', 'Olívia', 'Pedro',
  'Queila', 'Rodrigo', 'Sofia', 'Thiago', 'Vitória', 'Wesley', 'Yasmin', 'Caio',
  'Larissa', 'Murilo', 'Priscila', 'Tomás', 'Helena', 'Otávio',
];
const SOBRENOMES = [
  'Andrade', 'Bianchi', 'Cardoso', 'Duarte', 'Espíndola', 'Fontana', 'Guimarães',
  'Hoffmann', 'Iglesias', 'Jung', 'Koerich', 'Lemos', 'Moraes', 'Nunes', 'Ourique',
  'Pacheco', 'Reis', 'Schmitt', 'Tavares', 'Vieira',
];

const socios = Array.from({ length: 59 }, (_, i) => ({
  nome: `${PRIMEIROS[i % PRIMEIROS.length]} ${SOBRENOMES[(i * 7) % SOBRENOMES.length]}`,
  papel: 'socio',
  email: null,
}));

const EVENTO = {
  nome: 'Baile de Aniversário 32 anos',
  slug: 'aaaeng-baile32',
  data: '2026-09-26T23:00:00-03:00',
  local: 'Galpão Beira-Mar',
  capacidade: 1000,
  rubrica: 'Eventos',
};

/**
 * Três lotes, dois à venda — o primeiro esgotado, como na prancha 5d.
 *
 * `vendidos` vem da gestão do evento, não das linhas de `ingressos` deste
 * banco: o cartaz já mostrava "restam 48 de 300" antes de existir aplicativo.
 * A conciliação soma um a partir daqui (migração 0007).
 */
const LOTES = [
  { nome: '1º lote · sócio', preco_centavos: 6000, total: 300, vendidos: 300, ordem: 1 },
  { nome: '2º lote · sócio', preco_centavos: 8000, total: 300, vendidos: 252, ordem: 2 },
  { nome: '2º lote · não sócio', preco_centavos: 12000, total: 400, vendidos: 188, ordem: 3 },
];

/** Oito ingressos já vendidos pelo aplicativo, com referência de pagamento. */
const INGRESSOS_VENDIDOS = 8;

/**
 * O extrato.
 *
 * A primeira linha é o saldo transportado da gestão anterior. Sem ela o saldo
 * do cofre seria R$ 8.187,60 e não os R$ 43.180,25 da prancha 5a — e um
 * livro-caixa só é honesto quando o saldo é a soma das próprias linhas. Um
 * livro real abre exatamente assim.
 */
const LANCAMENTOS = [
  { dias: 34, tipo: 'entrada', valor_centavos: 3499265, rubrica: 'Associados', descricao: 'Saldo transportado · gestão 2025' },
  { dias: 17, tipo: 'saida',   valor_centavos:   60240, rubrica: 'Esporte',    descricao: 'Ônibus Intermed · Joinville' },
  { dias: 10, tipo: 'saida',   valor_centavos:   62000, rubrica: 'Esporte',    descricao: 'Arbitragem Intermed' },
  { dias:  8, tipo: 'saida',   valor_centavos:   89000, rubrica: 'Marketing',  descricao: 'Gráfica Trindade · cartazes' },
  { dias:  6, tipo: 'entrada', valor_centavos:  894000, rubrica: 'Associados', descricao: 'Mensalidades de agosto' },
  { dias:  5, tipo: 'saida',   valor_centavos:  320000, rubrica: 'Eventos',    descricao: 'Som Beira-Mar · sinal' },
  { dias:  4, tipo: 'entrada', valor_centavos:  456000, rubrica: 'Eventos',    descricao: 'Lote 1 · festa de aniversário' },
];

const SALDO_ESPERADO = 4318025;

/** Três propostas retidas: R$ 12.400,00, como no cabeçalho da prancha 5b. */
const PROPOSTAS = [
  {
    destino: 'Som Beira-Mar ME',
    chave_pix: '24.881.402/0001-77',
    valor_centavos: 840000,
    rubrica: 'Eventos',
    porPapel: 'tesoureiro',
    horas: 3,
    // A do vídeo: uma assinatura de duas, retida pelo cofre.
    assinadaPor: ['tesoureiro'],
  },
  {
    destino: 'Brindes Ilha Sul',
    chave_pix: 'contato@ilhasul.com.br',
    valor_centavos: 248000,
    rubrica: 'Marketing',
    porPapel: 'conselho',
    horas: 25,
    assinadaPor: [],
  },
  {
    destino: 'Gráfica Trindade',
    chave_pix: '11.204.556/0001-30',
    valor_centavos: 152000,
    rubrica: 'Marketing',
    porPapel: 'conselho',
    horas: 27,
    assinadaPor: [],
  },
];

const RETIDO_ESPERADO = 1240000;

/* ── Conferência antes de escrever ──────────────────────────────────────── */

const soma = (t) =>
  LANCAMENTOS.filter((l) => l.tipo === t).reduce((s, l) => s + l.valor_centavos, 0);
const saldo = soma('entrada') - soma('saida');
const retido = PROPOSTAS.reduce((s, p) => s + p.valor_centavos, 0);

if (saldo !== SALDO_ESPERADO) {
  console.error(`✗ Cenário inconsistente: o extrato fecha em ${saldo}, esperado ${SALDO_ESPERADO}.`);
  process.exit(1);
}
if (retido !== RETIDO_ESPERADO) {
  console.error(`✗ Cenário inconsistente: as propostas somam ${retido}, esperado ${RETIDO_ESPERADO}.`);
  process.exit(1);
}

/* ── Escrita ────────────────────────────────────────────────────────────── */

const atras = (dias, horas = 0) =>
  new Date(Date.now() - dias * 864e5 - horas * 36e5).toISOString();

function conferir(rotulo, { error }) {
  if (error) {
    console.error(`✗ ${rotulo}: ${error.message}`);
    process.exit(1);
  }
}

async function principal() {
  const { data: existente } = await db
    .from('entidades')
    .select('id')
    .eq('slug', ENTIDADE.slug)
    .maybeSingle();

  if (existente && !FORCAR) {
    console.log(`A entidade "${ENTIDADE.slug}" já existe. Nada foi alterado.`);
    console.log('Para refazer do zero: npm run seed -- --forcar');
    return;
  }

  if (existente) {
    // `on delete cascade` leva membros, eventos, lotes, ingressos, lançamentos,
    // propostas e assinaturas junto. Um só delete, sem ordem para errar.
    console.log('Apagando a entidade e tudo que pende dela…');
    conferir('apagar entidade', await db.from('entidades').delete().eq('id', existente.id));
  }

  const { data: entidade, error: erroEntidade } = await db
    .from('entidades')
    .insert(ENTIDADE)
    .select('id')
    .single();
  conferir('criar entidade', { error: erroEntidade });

  const { data: membros, error: erroMembros } = await db
    .from('membros')
    .insert([...DIRETORIA, ...socios].map((m) => ({ ...m, entidade_id: entidade.id })))
    .select('id, papel');
  conferir('criar membros', { error: erroMembros });

  const porPapel = (papel) => membros.find((m) => m.papel === papel).id;

  conferir(
    'criar lançamentos',
    await db.from('lancamentos').insert(
      LANCAMENTOS.map(({ dias, ...l }) => ({
        ...l,
        entidade_id: entidade.id,
        criado_em: atras(dias),
      })),
    ),
  );

  for (const { porPapel: autor, horas, assinadaPor, ...p } of PROPOSTAS) {
    const { data: proposta, error } = await db
      .from('propostas')
      .insert({
        ...p,
        entidade_id: entidade.id,
        criado_por: porPapel(autor),
        criado_em: atras(0, horas),
        status: 'pendente',
      })
      .select('id')
      .single();
    conferir(`criar proposta ${p.destino}`, { error });

    for (const papel of assinadaPor) {
      conferir(
        `assinar proposta ${p.destino}`,
        await db.from('assinaturas').insert({
          proposta_id: proposta.id,
          membro_id: porPapel(papel),
          assinado_em: atras(0, horas),
        }),
      );
    }
  }

  const { data: evento, error: erroEvento } = await db
    .from('eventos')
    .insert({ ...EVENTO, entidade_id: entidade.id })
    .select('id')
    .single();
  conferir('criar evento', { error: erroEvento });

  const { data: lotes, error: erroLotes } = await db
    .from('lotes')
    .insert(LOTES.map((l) => ({ ...l, evento_id: evento.id })))
    .select('id, nome, preco_centavos, ordem');
  conferir('criar lotes', { error: erroLotes });

  // Os oito ingressos que o aplicativo já vendeu, alternando entre os dois
  // lotes abertos. Fazem parte dos `vendidos` que os lotes já declaram — por
  // isso o contador não é recalculado a partir daqui.
  const abertos = lotes.filter((l) => l.ordem > 1).sort((a, b) => a.ordem - b.ordem);
  conferir(
    'criar ingressos',
    await db.from('ingressos').insert(
      Array.from({ length: INGRESSOS_VENDIDOS }, (_, i) => {
        const lote = abertos[i % abertos.length];
        return {
          evento_id: evento.id,
          lote_id: lote.id,
          lote: lote.nome,
          preco_centavos: lote.preco_centavos,
          status: 'pago',
          referencia: `semente-${EVENTO.slug}-${String(i + 1).padStart(2, '0')}`,
          pago_em: atras(3, i),
          reservado_em: atras(3, i + 1),
        };
      }),
    ),
  );

  console.log('');
  console.log(`✓ ${ENTIDADE.nome} · /e/${ENTIDADE.slug}`);
  console.log(`  ${DIRETORIA.length} signatários · ${socios.length + DIRETORIA.length} associados`);
  console.log(`  ${LANCAMENTOS.length} lançamentos · saldo ${(saldo / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
  console.log(`  ${PROPOSTAS.length} propostas retidas · ${(retido / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
  console.log(`  ${EVENTO.nome} · /f/${EVENTO.slug} · ${LOTES.length} lotes · ${INGRESSOS_VENDIDOS} ingressos`);
  console.log('');
  console.log('Entre com um destes e-mails, que o link por e-mail casa com a diretoria:');
  for (const m of DIRETORIA) console.log(`  ${m.email.padEnd(34)} ${m.nome}`);
  console.log('');
}

await principal();
