import { createClient } from '@supabase/supabase-js';

import { supabaseAnonKey, supabaseUrl } from '@/lib/env';
import { criarClienteServiceRole } from '@/lib/supabase/server';

/**
 * Quem está chamando, e pode chamar isto?
 *
 * Existe porque até aqui a resposta era "qualquer um". O CORS limitava a origem
 * do NAVEGADOR — está escrito no cabeçalho de `lib/cors.ts` que um `curl`
 * ignora tudo aquilo —, então os endpoints do cofre ficavam abertos a quem
 * soubesse a URL. Um cofre 2-de-3 que qualquer estranho manda executar não é um
 * cofre.
 *
 * O CORS continua e continua útil: ele impede que uma página de terceiro dispare
 * ações no navegador de quem está logado. São defesas de camadas diferentes, e
 * nenhuma substitui a outra.
 */

/** Os três assentos do cofre, no vocabulário do banco. */
const PAPEIS_DE_SIGNATARIO = ['presidente', 'tesoureiro', 'conselho'] as const;

export type PapelDeMembro = (typeof PAPEIS_DE_SIGNATARIO)[number] | 'socio';

export type Membro = {
  id: string;
  nome: string;
  papel: PapelDeMembro;
  entidade_id: string;
  entidade_slug: string;
};

/**
 * Recusa com status e mensagem já escritos para a tela.
 *
 * Erro de autorização é caso de negócio, não exceção a esconder — a tela
 * precisa saber a diferença entre "entre de novo" e "você não tem esse papel",
 * porque a saída é diferente para a pessoa.
 */
export class ErroDeAcesso extends Error {
  constructor(
    mensagem: string,
    readonly status: 400 | 401 | 403,
  ) {
    super(mensagem);
    this.name = 'ErroDeAcesso';
  }
}

/** `Authorization: Bearer <jwt>`, ou nada. */
function tokenDe(request: Request): string | null {
  const cabecalho = request.headers.get('authorization') ?? '';
  const [esquema, valor] = cabecalho.split(' ');
  if (!valor || esquema.toLowerCase() !== 'bearer') return null;
  return valor.trim() || null;
}

/**
 * Quem está chamando — só isso, sem exigir que já seja membro de nada.
 *
 * `exigirMembro` não serve para o vínculo: ele recusa justamente quem ainda não
 * tem linha ligada à sessão, que é a pessoa inteira que o vínculo existe para
 * atender. Aqui a pergunta é anterior — "este token é de alguém de verdade, e
 * qual é o e-mail dessa pessoa?" — e a resposta vem do token validado, nunca do
 * corpo da requisição.
 */
export async function usuarioDaRequisicao(request: Request) {
  const token = tokenDe(request);
  if (!token) {
    throw new ErroDeAcesso('Entre para continuar.', 401);
  }
  return usuarioDoToken(token);
}

/**
 * Valida o token contra o Supabase.
 *
 * Com a chave anônima, não com a service role: validar assinatura de JWT não
 * precisa de poder nenhum, e usar a chave que ignora RLS para uma leitura que
 * não exige isso só aumenta o estrago de um erro futuro.
 */
async function usuarioDoToken(token: string) {
  const cliente = createClient(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await cliente.auth.getUser(token);
  if (error || !data.user) {
    throw new ErroDeAcesso('Sua sessão expirou. Entre de novo.', 401);
  }
  return data.user;
}

/**
 * Exige que quem chama seja membro da entidade, com um dos papéis pedidos.
 *
 * A entidade vem por `slug` quando o endpoint sabe qual é. Quando não vem, cai
 * na única entidade da pessoa — e se ela estiver em mais de uma, recusa com 400
 * pedindo o identificador, em vez de escolher no chute. Adivinhar em qual cofre
 * mexer é exatamente o erro que ninguém percebe até o dinheiro sair do lugar
 * errado.
 *
 * A consulta usa a service role de propósito: aqui se está DECIDINDO o acesso,
 * e sob RLS a linha simplesmente não apareceria — "não é membro" ficaria
 * indistinguível de "entidade não existe", e as duas pedem respostas
 * diferentes.
 */
export async function exigirMembro(
  request: Request,
  opcoes: { slug?: string | null; papeis?: readonly string[] } = {},
): Promise<Membro> {
  const token = tokenDe(request);
  if (!token) {
    throw new ErroDeAcesso('Entre para continuar.', 401);
  }

  const usuario = await usuarioDoToken(token);
  const supabase = criarClienteServiceRole();

  let consulta = supabase
    .from('membros')
    .select('id, nome, papel, entidade_id, ativo, entidades!inner(slug)')
    .eq('user_id', usuario.id)
    .eq('ativo', true);

  if (opcoes.slug) consulta = consulta.eq('entidades.slug', opcoes.slug);

  const { data, error } = await consulta;

  if (error) {
    console.error('[acesso] falha ao consultar membros', error);
    throw new ErroDeAcesso('Não conseguimos conferir seu acesso agora.', 403);
  }

  const linhas = (data ?? []) as unknown as {
    id: string;
    nome: string;
    papel: PapelDeMembro;
    entidade_id: string;
    entidades: { slug: string };
  }[];

  if (linhas.length === 0) {
    throw new ErroDeAcesso(
      opcoes.slug
        ? 'Você não faz parte desta entidade.'
        : 'Sua conta ainda não está ligada a nenhuma entidade.',
      403,
    );
  }

  if (linhas.length > 1) {
    throw new ErroDeAcesso(
      'Você faz parte de mais de uma entidade. Diga qual.',
      400,
    );
  }

  const linha = linhas[0];
  const papeis = opcoes.papeis ?? PAPEIS_DE_SIGNATARIO;

  if (!papeis.includes(linha.papel)) {
    throw new ErroDeAcesso(
      'Só a diretoria pode fazer isso. Seu acesso é de associado.',
      403,
    );
  }

  return {
    id: linha.id,
    nome: linha.nome,
    papel: linha.papel,
    entidade_id: linha.entidade_id,
    entidade_slug: linha.entidades.slug,
  };
}

/**
 * Transforma um `ErroDeAcesso` na resposta dele. Qualquer outra coisa passa
 * adiante — engolir exceção que não é de acesso esconderia bug de verdade.
 */
export function respostaDeAcesso(e: unknown): Response | null {
  if (!(e instanceof ErroDeAcesso)) return null;
  return Response.json({ erro: e.message }, { status: e.status });
}
