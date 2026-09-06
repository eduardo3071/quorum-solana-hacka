import { Calendar, MapPin } from 'lucide-react';

import { Erro, Vazio } from '@/components/Estados';
import { Tela } from '@/components/Tela';
import { TileIcone } from '@/components/TileIcone';
import { ComprarIngresso } from '@/components/vivo/ComprarIngresso';
import { eventoPorSlug, lotesDoEvento } from '@/lib/dados';
import { formatQuandoFesta } from '@/lib/format';
import { criarClienteServidor } from '@/lib/supabase/server';

/** Página pública: o cartaz muda quando a diretoria muda o evento. */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const evento = await eventoPorSlug(slug).catch(() => null);
  return { title: evento?.nome ?? 'Festa · Quórum' };
}

/**
 * 5d · Página da festa — pública, sem barra de abas, a mais vistosa.
 *
 * A única tela onde uma imagem grande é permitida.
 *
 * É aqui que o circuito fecha (B7): comprar um ingresso gera uma referência
 * única, o pagamento cita essa referência, e a entrada aparece sozinha no
 * livro-caixa público. Ninguém digita nada em lugar nenhum.
 */
export default async function PaginaDaFesta({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let evento, entidade, lotes;
  try {
    evento = await eventoPorSlug(slug);
    if (evento) {
      const supabase = await criarClienteServidor();
      const [{ data }, doEvento] = await Promise.all([
        supabase
          .from('entidades')
          .select('nome, slug')
          .eq('id', evento.entidade_id)
          .maybeSingle(),
        lotesDoEvento(evento.id),
      ]);
      entidade = data;
      lotes = doEvento;
    }
  } catch (e) {
    console.error('[festa] falha ao ler', e);
    return (
      <Tela>
        <div className="flex flex-1 flex-col justify-center px-4 py-10">
          <Erro titulo="Não conseguimos abrir a festa agora">
            A página não carregou. Tente de novo em instantes — o link continua
            valendo.
          </Erro>
        </div>
      </Tela>
    );
  }

  if (!evento) {
    return (
      <Tela>
        <div className="flex flex-1 flex-col justify-center gap-4 px-4 py-10">
          <Vazio titulo="Evento não encontrado">
            Nenhuma festa com esse endereço. Confira o link que você recebeu.
          </Vazio>
        </div>
      </Tela>
    );
  }

  return (
    <Tela>
      <div className="relative h-60 flex-none overflow-hidden bg-[repeating-linear-gradient(135deg,#1F2D41_0_8px,#192434_8px_16px)]">
        <div className="absolute inset-0 bg-gradient-to-t from-ground via-ground/75 to-transparent" />
        <div className="absolute inset-x-4 bottom-4">
          <div className="t-rotulo text-blue">{entidade?.nome} apresenta</div>
          <h1 className="mt-2.5 text-[26px] leading-[1.1] font-extrabold tracking-[-0.035em] text-white">
            {evento.nome}
          </h1>
        </div>
      </div>

      <ComprarIngresso
        topo={
          <div className="grid grid-cols-2 gap-2.5">
            <CartaoQuandoOnde
              icone={Calendar}
              acento="blue"
              rotulo="Quando"
              valor={formatQuandoFesta(evento.data)}
            />
            <CartaoQuandoOnde
              icone={MapPin}
              acento="purple"
              rotulo="Onde"
              valor={evento.local ?? 'a definir'}
            />
          </div>
        }
        lotes={(lotes ?? []).map((l) => ({
          id: l.id,
          nome: l.nome,
          precoCentavos: l.preco_centavos,
          total: l.total,
          vendidos: l.vendidos,
        }))}
        entidadeSlug={entidade?.slug ?? ''}
        livroHref={`/e/${entidade?.slug}/livro`}
      />
    </Tela>
  );
}

function CartaoQuandoOnde({
  icone,
  acento,
  rotulo,
  valor,
}: {
  icone: typeof Calendar;
  acento: 'blue' | 'purple';
  rotulo: string;
  valor: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-card border border-line bg-surface p-[13px]">
      <TileIcone icone={icone} acento={acento} tamanho="md" />
      <div className="min-w-0 flex-1">
        <div className="t-rotulo text-ink-2">{rotulo}</div>
        {/* Sem `truncate`: "Galpão Beira-Mar" cortado vira endereço errado.
            Quando não couber, desce para a linha seguinte — é a regra. */}
        <div className="mt-1.5 text-[12px] leading-[1.25] font-bold text-balance text-ink">
          {valor}
        </div>
      </div>
    </div>
  );
}
