/**
 * Leitura do banco, sempre no servidor.
 *
 * Única fonte de dados do produto — não existe mais mock. Tudo roda em Server
 * Component ou Server
 * Action, com o cliente de sessão — ou seja, sob RLS. Se uma consulta devolve
 * vazio, é porque a política decidiu assim, e é isso que queremos: a segurança
 * não depende deste arquivo estar certo.
 *
 * Dinheiro continua sendo integer em centavos, do banco até a tela.
 */
import 'server-only';

import { cache } from 'react';

import type { Rubrica } from '@/components/acentos';
import { criarClienteServidor } from '@/lib/supabase/server';

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

export const nomeDoPapel: Record<Papel, string> = {
  presidente: 'Presidente',
  tesoureiro: 'Tesoureira',
  conselho: 'Conselho fiscal',
  socio: 'Sócia',
};

/**
 * Quantas assinaturas qualquer saída exige, de quantos signatários.
 *
 * Fixo em 2 de 3 enquanto o cofre é criado assim pelos Route Handlers. Quando a
 * entidade puder escolher o quórum, isto vira coluna em `entidades`.
 */
export const QUORUM = { de: 2, entre: 3 } as const;

/* ── Sessão ─────────────────────────────────────────────────────────────── */

/**
 * Quem está logado, e qual o papel dele.
 *
 * `cache` do React deduplica dentro de uma mesma renderização: a barra de abas,
 * o cabeçalho e o corpo da página pedem a mesma coisa e o banco responde uma
 * vez só.
 *
 * Na primeira visita liga a sessão à linha da diretoria pelo e-mail. Sem isso,
 * quem entra fica sem papel nenhum.
 */
export const usuarioAtual = cache(async () => {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const ler = () =>
    supabase
      .from('membros')
      .select('id, nome, papel, email, ativo, entidade_id')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .maybeSingle();

  let { data } = await ler();
  if (!data) {
    await vincularPeloEmail(user.id, user.email);
    ({ data } = await ler());
  }

  if (!data) return { user, membro: null as Membro | null, entidadeId: null };

  const { entidade_id, ...membro } = data;
  return { user, membro: membro as Membro, entidadeId: entidade_id as string };
});

/**
 * Casa a sessão com a linha que a diretoria cadastrou, pelo e-mail.
 *
 * Roda com a service role porque a política de `membros` não permite que o
 * usuário escreva — e não deve mesmo permitir. A escrita é estreita de
 * propósito: só a linha cujo e-mail é igual ao da sessão JÁ VERIFICADA pelo
 * magic link, e só enquanto `user_id` estiver vazio. Uma linha já vinculada
 * nunca é reapontada, então ninguém toma o lugar de outra pessoa trocando o
 * e-mail do próprio cadastro.
 *
 * Foi tentado antes como função `privado.vincular_membro()` chamada por RPC.
 * Não funciona: o schema `privado` existe justamente para NÃO ser publicado
 * pelo PostgREST, então a chamada nunca chegava — e falhava calada, deixando
 * quem entrava sem papel. Aqui não há intermediário.
 *
 * A comparação é `eq` em minúsculas, e não `ilike`: e-mail pode conter `_`, que
 * em `ilike` é curinga de um caractere — `joao_silva@x` casaria com
 * `joaoXsilva@x`. O banco guarda o e-mail sempre em minúsculas (migração 0006)
 * e o Supabase entrega o da sessão assim também, então igualdade basta e não
 * tem curinga nenhum no meio.
 */
async function vincularPeloEmail(userId: string, email?: string) {
  if (!email) return;

  const { criarClienteServiceRole } = await import('@/lib/supabase/server');
  const { error } = await criarClienteServiceRole()
    .from('membros')
    .update({ user_id: userId })
    .is('user_id', null)
    .eq('email', email.toLowerCase());

  if (error) console.error('[sessão] não conseguimos ligar o e-mail à diretoria', error);
}

/* ── Entidade ───────────────────────────────────────────────────────────── */

export const entidadePorSlug = cache(async (slug: string) => {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from('entidades')
    .select('id, nome, slug, tipo, universidade, publico, multisig_pda')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data as Entidade | null;
});

export const associados = cache(async (entidadeId: string) => {
  const supabase = await criarClienteServidor();
  const { count } = await supabase
    .from('membros')
    .select('id', { count: 'exact', head: true })
    .eq('entidade_id', entidadeId)
    .eq('ativo', true);
  return count ?? 0;
});

/** Todos os membros, para a lista de sócios. Signatários primeiro. */
export const membros = cache(async (entidadeId: string) => {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from('membros')
    .select('id, nome, papel, email, ativo')
    .eq('entidade_id', entidadeId)
    .eq('ativo', true)
    .order('papel')
    .order('nome');

  if (error) throw error;
  return (data ?? []) as Membro[];
});

export const signatarios = cache(async (entidadeId: string) => {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from('membros')
    .select('id, nome, papel, email, ativo')
    .eq('entidade_id', entidadeId)
    .eq('ativo', true)
    .neq('papel', 'socio')
    .order('papel');
  return (data ?? []) as Membro[];
});

/* ── Livro-caixa ────────────────────────────────────────────────────────── */

export type FiltroLivro = { rubrica?: Rubrica; busca?: string };

export const lancamentos = cache(
  async (entidadeId: string, limite?: number, filtro: FiltroLivro = {}) => {
    const supabase = await criarClienteServidor();
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

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Lancamento[];
  },
);

export type Totais = { entrou: number; saiu: number; saldo: number };

/**
 * Soma entradas e saídas.
 *
 * Feito em JavaScript sobre as linhas que a política deixou passar, e não por
 * `sum()` no banco: assim o total sempre corresponde ao extrato exibido logo
 * abaixo. Um resumo que não bate com a lista é o pior erro possível num
 * livro-caixa.
 */
export async function totais(entidadeId: string): Promise<Totais> {
  const linhas = await lancamentos(entidadeId);
  const entrou = linhas
    .filter((l) => l.tipo === 'entrada')
    .reduce((t, l) => t + l.valor_centavos, 0);
  const saiu = linhas
    .filter((l) => l.tipo === 'saida')
    .reduce((t, l) => t + l.valor_centavos, 0);
  return { entrou, saiu, saldo: entrou - saiu };
}

/* ── Propostas ──────────────────────────────────────────────────────────── */

export const propostas = cache(async (entidadeId: string) => {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from('propostas')
    .select(
      'id, destino, chave_pix, valor_centavos, rubrica, status, criado_em, criado_por, tx_index, assinaturas(membro_id, assinado_em)',
    )
    .eq('entidade_id', entidadeId)
    .order('criado_em', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Proposta[];
});

export const pendentes = cache(async (entidadeId: string) =>
  (await propostas(entidadeId)).filter((p) => p.status === 'pendente'),
);

export async function retido(entidadeId: string) {
  return (await pendentes(entidadeId)).reduce((t, p) => t + p.valor_centavos, 0);
}

/** Já assinada por quem está logado, mas ainda sem quórum — a do vídeo. */
export async function propostaRetida(entidadeId: string, membroId: string | null) {
  const lista = await pendentes(entidadeId);
  return (
    lista.find(
      (p) =>
        p.assinaturas.length > 0 &&
        p.assinaturas.length < QUORUM.de &&
        (!membroId || p.assinaturas.some((a) => a.membro_id === membroId)),
    ) ??
    lista[0] ??
    null
  );
}

/* ── Eventos ────────────────────────────────────────────────────────────── */

export type Evento = {
  id: string;
  nome: string;
  slug: string;
  data: string;
  local: string | null;
  capacidade: number | null;
};

/** As festas da entidade, da mais próxima para a mais antiga. */
export const eventosDaEntidade = cache(async (entidadeId: string) => {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from('eventos')
    .select('id, nome, slug, data, local, capacidade')
    .eq('entidade_id', entidadeId)
    .order('data', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Evento[];
});

export const eventoPorSlug = cache(async (slug: string) => {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from('eventos')
    .select('id, nome, slug, data, local, capacidade, entidade_id')
    .eq('slug', slug)
    .maybeSingle();

  // Erro estoura; ausência devolve null. São coisas diferentes e a tela diz
  // coisas diferentes — "essa festa não existe" não pode ser o que o
  // estudante lê quando o que houve foi o banco fora do ar.
  if (error) throw error;
  return data;
});

/**
 * O que a capa mostra a quem chega sem conta.
 *
 * Uma entidade pública e a próxima festa dela — as duas portas que abrem sem
 * login, e que são a tese do produto. Lê com o cliente anônimo de propósito: se
 * a política não deixasse passar, a capa mostraria menos, nunca mais.
 */
export const vitrinePublica = cache(async () => {
  const supabase = await criarClienteServidor();

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

  const { data: ultima } = futura
    ? { data: null }
    : await supabase
        .from('eventos')
        .select('nome, slug, data, local')
        .order('data', { ascending: false })
        .limit(1)
        .maybeSingle();

  return { entidade, evento: futura ?? ultima };
});

export type Lote = {
  id: string;
  nome: string;
  preco_centavos: number;
  total: number;
  vendidos: number;
};

/**
 * Os lotes de um evento, na ordem do cartaz.
 *
 * Lê com o cliente anônimo: lote é público por política, ao contrário de
 * `ingressos`. É por isso que `vendidos` é coluna e não `count(*)` — ver a
 * migração 0004.
 */
export const lotesDoEvento = cache(async (eventoId: string) => {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from('lotes')
    .select('id, nome, preco_centavos, total, vendidos')
    .eq('evento_id', eventoId)
    .order('ordem');

  if (error) throw error;
  return (data ?? []) as Lote[];
});
