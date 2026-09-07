import { NextResponse } from 'next/server';

import { cofreDaEntidade, propostaDaEntidade, SemCofre, SemProposta } from '@/lib/cofre/entidade';
import { situacao } from '@/lib/cofre/servidor';
import { criarClienteServiceRole } from '@/lib/supabase/server';

import { ehErroDeConfiguracao, erro } from '../_resposta';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Situação do cofre e de uma proposta, lidas da rede.
 *
 *   GET /api/estado?entidade=aaaeng&proposta=<id>
 *
 * Aberto de propósito, ao contrário de assinar, executar, propor e criar. Tudo
 * que ele devolve — saldo do cofre, quantas assinaturas já entraram — está na
 * devnet, legível por qualquer um com o endereço, e o livro-caixa do produto é
 * público por tese. Trancar aqui daria sensação de proteção sem proteger nada,
 * e é essa sensação que faz alguém deixar de trancar onde importa.
 *
 * Sem cofre, sem proposta ou sem proposta na rede, devolve `{ existe: false }`
 * com 200. Nenhum dos três é erro: são o estado vazio da prancha 6a, e uma tela
 * que mostra erro onde deveria mostrar "ainda não há nada" ensina a pessoa a
 * desconfiar do que está certo.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('entidade');
  const propostaId = url.searchParams.get('proposta');

  if (!slug || !propostaId) {
    return NextResponse.json({ existe: false, motivo: 'faltam entidade e proposta' });
  }

  try {
    const { data: entidade } = await criarClienteServiceRole()
      .from('entidades')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (!entidade) return NextResponse.json({ existe: false, motivo: 'entidade' });

    const cofre = await cofreDaEntidade(entidade.id);
    const proposta = await propostaDaEntidade(propostaId, entidade.id);

    if (proposta.txIndex === null || !proposta.destinoDevnet) {
      return NextResponse.json({ existe: false, motivo: 'proposta fora da rede' });
    }

    return NextResponse.json({
      existe: true,
      ...(await situacao({
        multisigPda: cofre.multisigPda,
        vaultPda: cofre.vaultPda,
        destino: proposta.destinoDevnet,
        transactionIndex: proposta.txIndex,
      })),
    });
  } catch (e) {
    if (e instanceof SemCofre) return NextResponse.json({ existe: false, motivo: 'cofre' });
    if (e instanceof SemProposta) return NextResponse.json({ existe: false, motivo: 'proposta' });

    // Variável faltando no ambiente não é "a rede caiu": é 400, e a mensagem
    // diz o nome dela. Este é o primeiro endpoint que qualquer tela chama, e
    // portanto o primeiro a topar com um ambiente pela metade — devolver 503
    // aqui manda procurar problema na devnet quando o problema é um campo em
    // branco no painel.
    if (ehErroDeConfiguracao(e)) return erro((e as Error).message, e, 400);

    return erro('Não conseguimos ler o cofre agora.', e, 503);
  }
}
