import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * A diretoria muda o papel de quem já faz parte.
 *
 * `membros` não aceita escrita do navegador — e não deve: quem confere o papel
 * de quem está pedindo é o servidor, com a chave de serviço, depois de validar
 * o crachá da sessão. Promover é dar assento no cofre, então é a decisão mais
 * pesada do produto e não pode depender de política de linha nenhuma.
 *
 * Regras:
 * - só presidente e tesoureiro promovem;
 * - ninguém muda o próprio papel (um assento não se dá a si mesmo);
 * - a entidade nunca fica sem ninguém que assine.
 */

const PROMOVEM = ['presidente', 'tesoureiro'];
const PAPEIS = ['presidente', 'tesoureiro', 'conselho', 'socio'];

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const erro = (mensagem: string, status: number) => json({ erro: mensagem }, status);

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
    return erro('Diga quem muda de papel.', 400);
  }

  const entidadeSlug = typeof corpo.entidadeSlug === 'string' ? corpo.entidadeSlug : '';
  const membroId = typeof corpo.membroId === 'string' ? corpo.membroId : '';
  const papel = typeof corpo.papel === 'string' ? corpo.papel : '';

  if (!entidadeSlug) return erro('Diga de qual entidade se trata.', 400);
  if (!membroId) return erro('Diga de quem é o papel.', 400);
  if (!PAPEIS.includes(papel)) return erro('Papel inválido.', 400);

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

  const { data: quemPede } = await admin
    .from('membros')
    .select('id, papel')
    .eq('entidade_id', entidade.id)
    .eq('user_id', usuario.user.id)
    .eq('ativo', true)
    .maybeSingle();

  if (!quemPede || !PROMOVEM.includes(quemPede.papel as string)) {
    return erro('Só a presidência e a tesouraria mudam papéis.', 403);
  }

  const { data: alvo } = await admin
    .from('membros')
    .select('id, nome, papel, ativo')
    .eq('entidade_id', entidade.id)
    .eq('id', membroId)
    .maybeSingle();

  if (!alvo) return erro('Essa pessoa não é desta entidade.', 404);
  if (alvo.id === quemPede.id) return erro('Você não muda o seu próprio papel.', 403);
  if (!alvo.ativo) return erro('Aprove o pedido de entrada primeiro.', 409);
  if (alvo.papel === papel) return json({ mudado: true, nome: alvo.nome, papel });

  // Rebaixar o último assento deixaria a entidade sem ninguém para assinar uma
  // saída — o cofre viraria um cofre sem chave.
  if (papel === 'socio' && alvo.papel !== 'socio') {
    const { count } = await admin
      .from('membros')
      .select('id', { count: 'exact', head: true })
      .eq('entidade_id', entidade.id)
      .eq('ativo', true)
      .neq('papel', 'socio');

    if ((count ?? 0) <= 1) {
      return erro('A entidade precisa de pelo menos uma pessoa que assine.', 409);
    }
  }

  const { error: falha } = await admin
    .from('membros')
    .update({ papel })
    .eq('id', alvo.id);

  if (falha) {
    console.error('[papel] falha ao gravar', falha);
    return erro('Não conseguimos registrar agora.', 503);
  }

  return json({ mudado: true, nome: alvo.nome, papel });
});
