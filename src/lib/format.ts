/**
 * Formatação de dinheiro, data e nome — tudo em pt-BR.
 *
 * Dinheiro é sempre integer em CENTAVOS. Nenhuma string de valor é escrita à
 * mão no produto: todo valor passa por aqui. É o que mantém as colunas
 * alinhadas entre telas e o que impede um `toFixed(2)` de aparecer no meio de
 * um extrato.
 */

/** Menos matemático, U+2212. Nunca hífen — o hífen quebra a linha. */
export const MENOS = '−';

export type TipoLancamento = 'entrada' | 'saida';

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const brlCompacto = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

/*
 * Versões sem o símbolo, para colunas onde "R$" repetido em toda linha só
 * ocupa espaço — a lista de propostas, o livro-caixa.
 *
 * São formatadores próprios, não `.replace('R$ ', '')` na saída: o Intl separa
 * o símbolo do número com espaço estreito inquebrável (U+202F), então o
 * replace com espaço comum não casa e falha em silêncio, deixando o "R$" na
 * tela.
 */
const numero = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numeroCompacto = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
});

export type OpcoesValor = {
  /** Sem centavos: `R$ 43.180`. */
  compacto?: boolean;
  /** Sem o "R$". Padrão: com. */
  simbolo?: boolean;
};

function valor(centavos: number, { compacto, simbolo = true }: OpcoesValor) {
  const reais = centavos / 100;
  if (simbolo) return compacto ? brlCompacto.format(reais) : brl.format(reais);
  return compacto ? numeroCompacto.format(reais) : numero.format(reais);
}

/**
 * Valor completo, para livro-caixa e comprovante.
 *
 * `4318025` → `"R$ 43.180,25"`
 *
 * O separador que o Intl põe entre `R$` e o número é espaço estreito
 * inquebrável (U+202F), então o valor nunca parte em duas linhas sozinho.
 */
export function formatBRL(centavos: number, opcoes: OpcoesValor = {}): string {
  return valor(centavos, opcoes);
}

/**
 * Valor abreviado, sem centavos, para cartão compacto.
 *
 * `4318025` → `"R$ 43.180"`
 */
export function formatCompacto(
  centavos: number,
  opcoes: Omit<OpcoesValor, 'compacto'> = {},
): string {
  return valor(centavos, { ...opcoes, compacto: true });
}

/**
 * Valor com sinal, para linha de lançamento.
 *
 * `formatComSinal(456000, 'entrada')` → `"+ R$ 4.560,00"`
 * `formatComSinal(840000, 'saida')`   → `"− R$ 8.400,00"`
 *
 * Recebe o valor sempre positivo — o sinal vem do tipo, não do número. Um
 * valor negativo no banco seria ambíguo com estorno.
 */
export function formatComSinal(
  centavos: number,
  tipo: TipoLancamento,
  opcoes: OpcoesValor = {},
): string {
  const sinal = tipo === 'entrada' ? '+' : MENOS;
  // Espaço inquebrável entre sinal e valor: "− R$ 8.400" nunca parte
  // depois do menos.
  return `${sinal} ${valor(Math.abs(centavos), opcoes)}`;
}

const HORA = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

const DIA_MES = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

const DIA_MES_CURTO = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'America/Sao_Paulo',
});

function mesmoDia(a: Date, b: Date): boolean {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
  return f.format(a) === f.format(b);
}

/**
 * Quando aconteceu, do jeito que o estudante lê.
 *
 * Hoje  → `"hoje, 18:12"`
 * Antes → `"02/09"`
 *
 * `agora` é injetável porque "hoje" depende de quando se pergunta: sem isso o
 * servidor e o browser podem discordar na virada da meia-noite e o React
 * reclama de hidratação.
 */
export function formatQuando(iso: string | Date, agora: Date = new Date()): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  return mesmoDia(d, agora) ? `hoje, ${HORA.format(d)}` : DIA_MES.format(d);
}

/** `"2026-09-02"` → `"02 set"`. Formato das linhas de movimentação. */
export function formatDataCurta(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  // O Intl devolve "02 de set."; a prancha usa "02 set".
  return DIA_MES_CURTO.format(d).replace(/\s*de\s*/, ' ').replace('.', '');
}

/** `"2026-09-02"` → `"02/09"`. */
export function formatData(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  return DIA_MES.format(d);
}

const QUANDO_FESTA = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'America/Sao_Paulo',
});

/**
 * O "quando" do cartaz da festa: `"Sáb, 26 set · 23h"`.
 *
 * Montado peça por peça porque nenhum formato pronto do Intl dá isso: o padrão
 * em pt-BR é "sáb., 26 de set. de 2026, 23:00", que não cabe no cartão da
 * prancha 5d e truncaria justamente no dado que importa. Hora redonda perde os
 * minutos — "23h" e não "23h00", como se fala.
 */
export function formatQuandoFesta(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';

  const partes = QUANDO_FESTA.formatToParts(d);
  const parte = (tipo: Intl.DateTimeFormatPartTypes) =>
    (partes.find((p) => p.type === tipo)?.value ?? '').replace('.', '');

  const semana = parte('weekday');
  const minuto = parte('minute');
  const hora = minuto === '00' ? `${parte('hour')}h` : `${parte('hour')}h${minuto}`;

  return `${semana.charAt(0).toUpperCase()}${semana.slice(1)}, ${parte('day')} ${parte('month')} · ${hora}`;
}

/** `"18:12"`. */
export function formatHora(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  return HORA.format(d);
}

// "de", "da", "dos"… não viram inicial: "Ana da Silva" é AS, não ADS.
const PARTICULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

/**
 * Iniciais para o avatar quadrado.
 *
 * `"Marina Salgado"` → `"MS"` · `"Letícia Marchetti"` → `"LM"`
 *
 * Primeiro e último nome, ignorando partículas. Nome único devolve uma letra.
 */
export function iniciais(nome: string): string {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter((p) => p && !PARTICULAS.has(p.toLowerCase()));

  if (partes.length === 0) return '';
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();

  const primeiro = partes[0].charAt(0);
  const ultimo = partes[partes.length - 1].charAt(0);
  return (primeiro + ultimo).toUpperCase();
}

/** `"Marina Salgado"` → `"Marina"`. Para linhas onde o nome cheio não cabe. */
export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? '';
}
