import { NextResponse } from 'next/server';

import { nomeDoEmail } from '@/lib/nomes';
import { paraSlug, problemaDoSlug, SLUGS_RESERVADOS } from '@/lib/slug';
import { criarClienteServiceRole } from '@/lib/supabase/server';

import { erro } from '../_resposta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Os quatro tipos da prancha, no vocabulário do banco. */
const TIPOS = {
  atletica: 'Atlética',
  ca: 'Centro acadêmico',
  ej: 'Empresa júnior',
  formatura: 'Comissão de formatura',
} as const;

type Tipo = keyof typeof TIPOS;

/**
 * Cria a entidade e o primeiro signatário.
 *
 * Aberto, sem sessão — e é uma escolha, não um esquecimento: a pessoa está
 * criando a entidade justamente porque ainda não tem conta em lugar nenhum.
 * Em produção isto viraria duas etapas, com a entidade nascendo só depois de o
 * e-mail ser confirmado; aqui a demonstração precisa acontecer em segundos, e
 * o que segura o abuso é a espera de cinco minutos por e-mail, mais abaixo.
 *
 * Quem chama é o navegador, então o CORS do middleware já limita a origem. Mas
 * CORS protege o navegador de terceiros, não o endpoint: um `curl` ignora tudo.
 * Se isto um dia guardar valor real, precisa de confirmação de e-mail antes da
 * escrita, não de CORS.
 */
export async function POST(request: Request) {
  let corpo: Record<string, unknown>;
  try {
    corpo = await request.json();
  } catch {
    return erro('Não entendemos o pedido.', null, 400);
  }

  const nome = texto(corpo.nome);
  const universidade = texto(corpo.universidade);
  const email = texto(corpo.email).toLowerCase();
  const tipo = texto(corpo.tipo) as Tipo;
  // Opcional: sem ele, o endereço sai do nome. Com ele, é a escolha de quem cria.
  const slugEscolhido = texto(corpo.slug) ? paraSlug(texto(corpo.slug)) : null;

  if (nome.length < 2 || nome.length > 80) {
    return erro('O nome da entidade precisa ter entre 2 e 80 caracteres.', null, 400);
  }
  if (!(tipo in TIPOS)) {
    return erro('Escolha o tipo da entidade.', null, 400);
  }
  if (universidade.length > 80) {
    return erro('O nome da universidade ficou longo demais.', null, 400);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return erro('Confira o e-mail — parece incompleto.', null, 400);
  }
  if (slugEscolhido) {
    const problema = problemaDoSlug(slugEscolhido);
    if (problema) return erro(`Endereço inválido. ${problema}`, null, 400);
  }

  try {
    const supabase = criarClienteServiceRole();

    /*
     * Uma entidade a cada cinco minutos por e-mail.
     *
     * Não é rate limit de verdade — quem quiser insistir troca o e-mail. É o
     * suficiente para o toque duplo no botão não criar duas entidades, que é o
     * acidente que realmente acontece.
     */
    const cincoMinutosAtras = new Date(Date.now() - 5 * 60_000).toISOString();

    // Duas consultas simples em vez de um join embutido do PostgREST. A sintaxe
    // de embed falha calada quando a relação não resolve, e throttle que falha
    // calado é throttle que não existe — já perdemos tempo com um desses.
    const { data: minhas } = await supabase
      .from('membros')
      .select('entidade_id')
      .eq('email', email);

    const recente = minhas?.length
      ? await supabase
          .from('entidades')
          .select('id')
          .in('id', minhas.map((m) => m.entidade_id))
          .gte('criado_em', cincoMinutosAtras)
          .limit(1)
      : null;

    if (recente?.data?.length) {
      return erro(
        'Você acabou de criar uma entidade com este e-mail. Confira sua caixa de entrada.',
        null,
        429,
      );
    }

    let slug: string;
    if (slugEscolhido) {
      // Escolhido por quem cria: se está ocupado, a pessoa precisa saber, em
      // vez de receber um endereço diferente do que digitou.
      const { data: ocupado } = await supabase
        .from('entidades')
        .select('id')
        .eq('slug', slugEscolhido)
        .maybeSingle();
      if (ocupado) return erro('Este endereço já está em uso. Escolha outro.', null, 409);
      slug = slugEscolhido;
    } else {
      slug = await slugLivre(supabase, nome);
    }

    const { data: entidade, error: erroEntidade } = await supabase
      .from('entidades')
      .insert({ nome, slug, tipo, universidade: universidade || null, publico: true })
      .select('id, slug')
      .single();

    if (erroEntidade || !entidade) throw erroEntidade ?? new Error('sem retorno');

    /*
     * O primeiro signatário. `user_id` fica nulo de propósito: a pessoa ainda
     * não entrou. Quem casa a sessão com esta linha é o vínculo por e-mail, na
     * primeira visita depois do link — o mesmo caminho da diretoria já
     * cadastrada.
     */
    const { error: erroMembro } = await supabase.from('membros').insert({
      entidade_id: entidade.id,
      nome: nomeDoEmail(email),
      papel: 'tesoureiro',
      email,
      ativo: true,
    });

    if (erroMembro) {
      // Entidade sem nenhum membro é entidade órfã: ninguém consegue entrar
      // nela nunca mais. Desfaz em vez de deixar lixo no banco.
      await supabase.from('entidades').delete().eq('id', entidade.id);
      throw erroMembro;
    }

    return NextResponse.json({ criada: true, slug: entidade.slug, nome });
  } catch (e) {
    return erro('Não conseguimos criar a entidade agora. Tente de novo.', e, 503);
  }
}

/* ── Auxiliares ─────────────────────────────────────────────────────────── */

function texto(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * O slug é único no banco. Em vez de deixar o insert estourar com erro de
 * constraint — que viraria "não conseguimos criar" sem motivo aparente —,
 * procura o primeiro livre.
 */
async function slugLivre(
  supabase: ReturnType<typeof criarClienteServiceRole>,
  nome: string,
): Promise<string> {
  const bruto = paraSlug(nome) || 'entidade';
  // O slug agora é o primeiro segmento da URL: não pode colidir com uma tela.
  const base = SLUGS_RESERVADOS.has(bruto) ? `${bruto}-entidade` : bruto;

  for (let n = 0; n < 50; n++) {
    const tentativa = n === 0 ? base : `${base}-${n + 1}`;
    const { data } = await supabase
      .from('entidades')
      .select('id')
      .eq('slug', tentativa)
      .maybeSingle();

    if (!data) return tentativa;
  }

  // Cinquenta homônimas é improvável o bastante para o sufixo aleatório ser
  // melhor que continuar contando.
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

