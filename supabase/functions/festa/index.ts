import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * A diretoria cria uma festa.
 *
 * Passa por aqui e não direto pelo banco porque `eventos` e `lotes` não aceitam
 * escrita do navegador — e não devem aceitar: quem confere o papel de quem está
 * pedindo é o servidor, com a chave de serviço, depois de validar o crachá da
 * sessão. O cliente só descreve a festa.
 *
 * Dinheiro em CENTAVOS, sempre integer.
 */

const DIRETORIA = ['presidente', 'tesoureiro', 'conselho'];

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const erro = (mensagem: string, status: number) => json({ erro: mensagem }, status);

/** "Baile de 32 anos" → "baile-de-32-anos". */
function apelido(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return erro('Use POST.', 405);

  const cru = req.headers.get('authorization') ?? '';
  const token = cru.toLowerCase().startsWith('bearer ') ? cru.slice(7) : '';
  if (!token) return erro('Entre para continuar.', 401);

  let corpo: Record<string, unknown> = {};
  try {
    corpo = await req.json();
  } catch {
    return erro('Descreva a festa.', 400);
  }

  const entidadeSlug = typeof corpo.entidadeSlug === 'string' ? corpo.entidadeSlug : '';
  const nome = typeof corpo.nome === 'string' ? corpo.nome.trim() : '';
  const quando = typeof corpo.data === 'string' ? corpo.data : '';
  const local = typeof corpo.local === 'string' ? corpo.local.trim() : '';
  const precoCentavos = Number(corpo.precoCentavos);
  const total = Number(corpo.total);

  if (!entidadeSlug) return erro('Diga de qual entidade é a festa.', 400);
  if (nome.length < 2) return erro('Dê um nome à festa.', 400);
  if (!quando || Number.isNaN(Date.parse(quando))) return erro('Data inválida.', 400);
  if (!Number.isSafeInteger(precoCentavos) || precoCentavos < 0) {
    return erro('Preço inválido.', 400);
  }
  if (!Number.isSafeInteger(total) || total < 1) {
    return erro('Diga quantos ingressos existem, no mínimo 1.', 400);
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const servico = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const comCracha = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: usuario } = await comCracha.auth.getUser();
  if (!usuario?.user) return erro('Sua sessão expirou. Entre de novo.', 401);

  const admin = createClient(url, servico);

  const { data: entidade } = await admin
    .from('entidades')
    .select('id')
    .eq('slug', entidadeSlug)
    .maybeSingle();
  if (!entidade) return erro('Essa entidade não existe.', 404);

  const { data: membro } = await admin
    .from('membros')
    .select('id, papel')
    .eq('entidade_id', entidade.id)
    .eq('user_id', usuario.user.id)
    .eq('ativo', true)
    .maybeSingle();

  if (!membro || !DIRETORIA.includes(membro.papel as string)) {
    return erro('Só a diretoria cria festa.', 403);
  }

  // O slug do cartaz é público e único. Colisão só acontece quando a mesma
  // entidade repete o nome da festa — aí entra um sufixo curto, e ninguém
  // precisa inventar outro nome.
  const base = `${entidadeSlug}-${apelido(nome)}`.slice(0, 70);
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const { data: ocupado } = await admin
      .from('eventos')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!ocupado) break;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const { data: evento, error: falhaEvento } = await admin
    .from('eventos')
    .insert({
      entidade_id: entidade.id,
      nome,
      slug,
      data: new Date(quando).toISOString(),
      local: local || null,
      capacidade: total,
      rubrica: 'Eventos',
    })
    .select('id, slug')
    .single();

  if (falhaEvento || !evento) {
    console.error('[festa] falha ao gravar o evento', falhaEvento);
    return erro('Não conseguimos criar a festa agora.', 503);
  }

  const { error: falhaLote } = await admin.from('lotes').insert({
    evento_id: evento.id,
    nome: 'Lote 1',
    preco_centavos: precoCentavos,
    total,
    ordem: 0,
  });

  if (falhaLote) {
    // Sem lote não há ingresso a vender, e um cartaz que não vende nada engana
    // quem abre o link. Desfaz para a diretoria tentar de novo.
    await admin.from('eventos').delete().eq('id', evento.id);
    console.error('[festa] falha ao gravar o lote', falhaLote);
    return erro('Não conseguimos criar a festa agora.', 503);
  }

  return json({ criada: true, slug: evento.slug, nome });
});
