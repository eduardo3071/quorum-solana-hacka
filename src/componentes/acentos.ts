/**
 * Os cinco acentos do sistema e seus pares de cor.
 *
 * Cada acento vem com o fundo tingido correspondente. O mapa é explícito
 * porque o Tailwind varre o código em busca de nomes de classe literais —
 * `bg-${cor}-tint` interpolado não geraria CSS nenhum.
 *
 * A regra de uso, que não se quebra:
 *   red   só em bloqueio, recusa e erro — nunca em avatar de pessoa
 *   green só em entrada de dinheiro e confirmação
 *   amber só em espera e progresso
 *   blue  só em ação e link — nunca em saldo ou valor estático
 * No máximo duas cores semânticas visíveis por tela.
 */

export type Acento = 'blue' | 'green' | 'amber' | 'purple' | 'red';

/** Fundo tingido — o quadrado do tile, o fundo do chip, a caixa de bloqueio. */
export const FUNDO_TINGIDO: Record<Acento, string> = {
  blue: 'bg-blue-tint',
  green: 'bg-green-tint',
  amber: 'bg-amber-tint',
  purple: 'bg-purple-tint',
  red: 'bg-red-tint',
};

/** Cor do traço do ícone e do texto do chip. */
export const TEXTO_ACENTO: Record<Acento, string> = {
  blue: 'text-blue',
  green: 'text-green',
  amber: 'text-amber',
  purple: 'text-purple',
  red: 'text-red',
};

/** Texto dessaturado sobre fundo tingido, quando o acento puro agride. */
export const TEXTO_SOBRE_TINGIDO: Record<Acento, string> = {
  blue: 'text-blue-ink',
  green: 'text-green-ink',
  amber: 'text-amber',
  purple: 'text-ink-2',
  red: 'text-red-ink',
};

/** Preenchimento da barra de progresso. */
export const FUNDO_SOLIDO: Record<Acento, string> = {
  blue: 'bg-blue',
  green: 'bg-green',
  amber: 'bg-amber',
  purple: 'bg-purple',
  red: 'bg-red',
};

/**
 * Rubrica é categoria contábil — nunca sinônimo de assinatura.
 * O par rubrica→cor é fixo em todo o produto.
 */
export type Rubrica = 'Eventos' | 'Marketing' | 'Esporte' | 'Associados';

export const COR_DA_RUBRICA: Record<Rubrica, Acento> = {
  Eventos: 'blue',
  Marketing: 'amber',
  Esporte: 'green',
  Associados: 'purple',
};

/** Estados de proposta e sua cor. */
export type EstadoProposta = 'Executada' | 'Aguardando' | 'Retida' | 'Recusada';

export const COR_DO_ESTADO: Record<EstadoProposta, Acento> = {
  Executada: 'green',
  Aguardando: 'amber',
  Retida: 'red',
  Recusada: 'red',
};
