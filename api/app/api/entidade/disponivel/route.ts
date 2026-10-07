import { NextResponse } from 'next/server';

import { paraSlug, problemaDoSlug } from '@/lib/slug';
import { criarClienteServiceRole } from '@/lib/supabase/server';

import { erro } from '../../_resposta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Este endereço está livre?
 *
 *   GET /api/entidade/disponivel?slug=atletica-engenharia
 *
 * Aberta, sem sessão: quem está criando a entidade ainda não tem nenhuma. Só
 * diz sim ou não — não devolve nada da entidade que já ocupa o endereço.
 */
export async function GET(req: Request) {
  const bruto = new URL(req.url).searchParams.get('slug') ?? '';
  const slug = paraSlug(bruto);

  const problema = problemaDoSlug(slug);
  if (problema) {
    return NextResponse.json({ slug, disponivel: false, motivo: problema });
  }

  try {
    const { data, error } = await criarClienteServiceRole()
      .from('entidades')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;

    return NextResponse.json({
      slug,
      disponivel: !data,
      motivo: data ? 'Este endereço já está em uso.' : null,
    });
  } catch (e) {
    return erro('Não conseguimos conferir o endereço agora.', e, 503);
  }
}
