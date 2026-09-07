/**
 * Leitura do banco, direto do navegador.
 *
 * Não há servidor de aplicação nesta camada: o `supabase-js` fala com o
 * PostgREST e a política de acesso decide o que volta. Se uma consulta devolve
 * vazio, é porque a política decidiu assim — e é isso que queremos: a segurança
 * não depende deste arquivo estar certo.
 *
 * Dinheiro é integer em CENTAVOS, do banco até a tela. Nunca float, nem em
 * variável intermediária.
 */
import type { Rubrica } from '@/componentes/acentos';
import { supabase } from '@/lib/supabase';

export type Papel = 'presidente' | 'tesoureiro' | 'conselho' | 'socio';

export type Entidade = {
  id: string;
  nome: string;
  slug: string;
  tipo: 'atletica' | 'formatura' | 'ej' | 'ca';
  universidade: string | null;
  publico: boolean;
  multisig_pda: string | null;
};

export type Membro = {
  id: string;
  nome: string;
  papel: Papel;
  email: string | null;
  ativo: boolean;
};

export type Lancamento = {
  id: string;
  tipo: 'entrada' | 'saida';
  valor_centavos: number;
  rubrica: Rubrica;
  descricao: string;
  criado_em: string;
  tx_signature: string | null;
};

export type Proposta = {
  id: string;
  destino: string;
  chave_pix: string;
  valor_centavos: number;
  rubrica: Rubrica;
  status: 'pendente' | 'aprovada' | 'executada' | 'rejeitada';
  criado_em: string;
  criado_por: string;
  tx_index: number | null;
  assinaturas: { membro_id: string; assinado_em: string }[];
};

export type Evento = {
  id: string;
  nome: string;
  slug: string;
  data: string;
  local: string | null;
  capacidade: number | null;
  entidade_id: string;
  rubrica: Rubrica;
};

export type Lote = {
  id: string;
  nome: string;
  preco_centavos: number;
  total: number;
  vendidos: number;
};

export const nomeDoPapel: Record<Papel, string> = {
  presidente: 'Presidente',
  tesoureiro: 'Tesoureira',
  conselho: 'Conselho fiscal',
  socio: 'Sócia',
};

/**
 * Quantas assinaturas qualquer saída exige, de quantos signatários.
 *
 * Fixo em 2 de 3 enquanto o cofre é criado assim pela API. Quando a entidade
 * puder escolher o quórum, isto vira coluna em `entidades`.
 */
export const QUORUM = { de: 2, entre: 3 } as const;

/** Estoura com o erro do banco em vez de devolver lista vazia calada. */
function conferir<T>({ data, error }: { data: T | null; error: unknown }): T {
  if (error) throw error;
  return (data ?? []) as T;
}

/* ── Entidade ───────────────────────────────────────────────────────────── */

export async function entidadePorSlug(slug: string) {
  const { data, error } = await supabase
    .from('entidades')
    .select('id, nome, slug, tipo, universidade, publico, multisig_pda')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data as Entidade | null;
}

export async function associados(entidadeId: string) {
  const { count, error } = await supabase
    .from('membros')
    .select('id', { count: 'exact', head: true })
    .eq('entidade_id', entidadeId)
    .eq('ativo', true);

  if (error) throw error;
  return count ?? 0;
}

export async function membros(entidadeId: string) {
  return conferir<Membro[]>(
    await supabase
      .from('membros')
      .select('id, nome, papel, email, ativo')
      .eq('entidade_id', entidadeId)
      .eq('ativo', true)
      .order('papel')
      .order('nome'),
  );
}

/**
 * Quem pediu para entrar e ainda espera.
 *
 * `ativo = false` é o pedido pendente — não precisou de tabela nem de coluna
 * nova. A política de `membros` mostra os colegas das entidades de que você faz
 * parte, e não filtra por `ativo` na linha lida: por isso a diretoria enxerga
 * os pedidos, e quem pediu, que ainda não faz parte de nada, não enxerga nem o
 * próprio.
 */
export async function solicitacoes(entidadeId: string) {
  return conferir<Membro[]>(
    await supabase
      .from('membros')
      .select('id, nome, papel, email, ativo')
      .eq('entidade_id', entidadeId)
      .eq('ativo', false)
      .order('nome'),
  );
}

export async function signatarios(entidadeId: string) {
  return conferir<Membro[]>(
    await supabase
      .from('membros')
      .select('id, nome, papel, email, ativo')
      .eq('entidade_id', entidadeId)
      .eq('ativo', true)
      .neq('papel', 'socio')
      .order('papel'),
  );
}

/* ── Livro-caixa ────────────────────────────────────────────────────────── */

export type FiltroLivro = { rubrica?: Rubrica; busca?: string };

export async function lancamentos(
  entidadeId: string,
  limite?: number,
  filtro: FiltroLivro = {},
) {
  let q = supabase
    .from('lancamentos')
    .select('id, tipo, valor_centavos, rubrica, descricao, criado_em, tx_signature')
    .eq('entidade_id', entidadeId)
    .order('criado_em', { ascending: false });

  if (filtro.rubrica) q = q.eq('rubrica', filtro.rubrica);

  if (filtro.busca) {
    // `%` e `_` são curingas do LIKE. Sem escapar, quem digita "50%" recebe
    // tudo — e o livro-caixa passa a mentir sobre o que está mostrando.
    const termo = filtro.busca.replace(/([\\%_])/g, '\\$1');
    q = q.ilike('descricao', `%${termo}%`);
  }

  if (limite) q = q.limit(limite);

  return conferir<Lancamento[]>(await q);
}

export type Totais = { entrou: number; saiu: number; saldo: number };

/**
 * Soma entradas e saídas sobre as linhas que a política deixou passar.
 *
 * Feito aqui e não por `sum()` no banco para o total sempre corresponder ao
 * extrato exibido logo abaixo. Um resumo que não bate com a lista é o pior erro
 * possível num livro-caixa.
 */
export function totais(linhas: Lancamento[]): Totais {
  const entrou = linhas
    .filter((l) => l.tipo === 'entrada')
    .reduce((t, l) => t + l.valor_centavos, 0);
  const saiu = linhas
    .filter((l) => l.tipo === 'saida')
    .reduce((t, l) => t + l.valor_centavos, 0);
  return { entrou, saiu, saldo: entrou - saiu };
}

/* ── Propostas ──────────────────────────────────────────────────────────── */

export async function propostas(entidadeId: string) {
  return conferir<Proposta[]>(
    await supabase
      .from('propostas')
      .select(
        'id, destino, chave_pix, valor_centavos, rubrica, status, criado_em, criado_por, tx_index, assinaturas(membro_id, assinado_em)',
      )
      .eq('entidade_id', entidadeId)
      .order('criado_em', { ascending: false }),
  );
}

export const pendentes = (lista: Proposta[]) =>
  lista.filter((p) => p.status === 'pendente');

export const retido = (lista: Proposta[]) =>
  pendentes(lista).reduce((t, p) => t + p.valor_centavos, 0);

/** Já assinada por quem está logado, mas ainda sem quórum — a do vídeo. */
export function propostaRetida(lista: Proposta[], membroId: string | null) {
  const abertas = pendentes(lista);
  return (
    abertas.find(
      (p) =>
        p.assinaturas.length > 0 &&
        p.assinaturas.length < QUORUM.de &&
        (!membroId || p.assinaturas.some((a) => a.membro_id === membroId)),
    ) ??
    abertas[0] ??
    null
  );
}

/* ── Eventos ────────────────────────────────────────────────────────────── */

export async function eventosDaEntidade(entidadeId: string) {
  return conferir<Evento[]>(
    await supabase
      .from('eventos')
      .select('id, nome, slug, data, local, capacidade, entidade_id, rubrica')
      .eq('entidade_id', entidadeId)
      .order('data', { ascending: false }),
  );
}

export async function eventoPorSlug(slug: string) {
  const { data, error } = await supabase
    .from('eventos')
    .select('id, nome, slug, data, local, capacidade, entidade_id, rubrica')
    .eq('slug', slug)
    .maybeSingle();

  // Erro estoura; ausência devolve null. São coisas diferentes e a tela diz
  // coisas diferentes — "essa festa não existe" não pode ser o que o estudante
  // lê quando o que houve foi o banco fora do ar.
  if (error) throw error;
  return data as Evento | null;
}

export async function lotesDoEvento(eventoId: string) {
  return conferir<Lote[]>(
    await supabase
      .from('lotes')
      .select('id, nome, preco_centavos, total, vendidos')
      .eq('evento_id', eventoId)
      .order('ordem'),
  );
}

/* ── Vitrine da capa ────────────────────────────────────────────────────── */

/**
 * Uma entidade pública e a próxima festa dela.
 *
 * As duas portas que abrem sem login, e que são a tese do produto. Lê com a
 * chave anônima de propósito: se a política não deixasse passar, a capa
 * mostraria menos, nunca mais.
 */
export async function vitrinePublica() {
  const { data: entidade } = await supabase
    .from('entidades')
    .select('nome, slug')
    .eq('publico', true)
    .order('criado_em')
    .limit(1)
    .maybeSingle();

  if (!entidade) return { entidade: null, evento: null };

  // A próxima que ainda não aconteceu; se todas já passaram, a mais recente —
  // um cartaz vazio na capa é pior que um cartaz de festa que já rolou.
  const { data: futura } = await supabase
    .from('eventos')
    .select('nome, slug, data, local')
    .gte('data', new Date().toISOString())
    .order('data')
    .limit(1)
    .maybeSingle();

  if (futura) return { entidade, evento: futura };

  const { data: ultima } = await supabase
    .from('eventos')
    .select('nome, slug, data, local')
    .order('data', { ascending: false })
    .limit(1)
    .maybeSingle();

  return { entidade, evento: ultima };
}
