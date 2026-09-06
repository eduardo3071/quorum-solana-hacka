/**
 * O circuito da festa: comprar ingresso vira entrada no livro-caixa.
 *
 * Ninguém digita nada. A compra gera uma referência única, o pagamento cita
 * essa referência, e a conciliação acha o pagamento por ela e grava o
 * lançamento. Os três endpoints de `app/api` são casca fina sobre este módulo.
 *
 * Escreve com a service role, que ignora RLS: é o servidor registrando o que a
 * rede confirmou, nunca o cliente dizendo que pagou. A política de `ingressos`
 * e `lancamentos` não dá INSERT a ninguém de propósito — é aqui, e só aqui.
 *
 * Sobre Pix: veja o cabeçalho de `lib/pagamento.ts`. Em produção esta etapa é
 * Pix por parceiro autorizado; aqui roda em devnet, e a interface não afirma o
 * contrário.
 */
import 'server-only';

import type { Rubrica } from '@/components/acentos';
import {
  centavosParaLamports,
  cofreDeCobranca,
  desenharQR,
  montarCobranca,
  novaReferencia,
  procurarPagamento,
  type Cobranca,
} from '@/lib/pagamento';
import { criarClienteServiceRole } from '@/lib/supabase/server';

/** O que a tela precisa para desenhar a cobrança e esperar. */
export type CompraAberta = {
  referencia: string;
  lote: string;
  valorCentavos: number;
  destino: string;
  /** O QR já desenhado, como SVG. A tela só insere. */
  qr: string;
  url: string;
};

export type SituacaoDaCompra =
  | { pago: false }
  | {
      pago: true;
      valorCentavos: number;
      lote: string;
      evento: string;
      /** Onde ver o comprovante na rede. */
      comprovante: string;
      livro: string;
    };

/* ── Leitura ────────────────────────────────────────────────────────────── */

type LoteCompleto = {
  id: string;
  nome: string;
  preco_centavos: number;
  total: number;
  vendidos: number;
  eventos: {
    id: string;
    nome: string;
    rubrica: Rubrica;
    entidades: { id: string; nome: string; slug: string; multisig_pda: string | null };
  };
};

async function loteCompleto(loteId: string) {
  const { data, error } = await criarClienteServiceRole()
    .from('lotes')
    .select(
      'id, nome, preco_centavos, total, vendidos, eventos!inner(id, nome, rubrica, entidades!inner(id, nome, slug, multisig_pda))',
    )
    .eq('id', loteId)
    .maybeSingle();

  if (error) throw error;
  return data as LoteCompleto | null;
}

/* ── Reserva ────────────────────────────────────────────────────────────── */

/** Lote esgotado não é erro de sistema: é o cartaz dizendo que acabou. */
export class LoteEsgotado extends Error {
  constructor(nome: string) {
    super(`O lote "${nome}" está esgotado.`);
    this.name = 'LoteEsgotado';
  }
}

/**
 * Reserva um ingresso e devolve a cobrança.
 *
 * Só reserva — nada de dinheiro acontece aqui. O ingresso nasce `reservado` e
 * só vira `pago` quando a conciliação encontrar o pagamento na rede. Enquanto
 * isso o lote não é debitado, então uma reserva abandonada não come inventário.
 */
export async function reservar(
  loteId: string,
  compradorId: string | null,
): Promise<CompraAberta> {
  const lote = await loteCompleto(loteId);
  if (!lote) throw new Error('Lote não encontrado.');
  if (lote.vendidos >= lote.total) throw new LoteEsgotado(lote.nome);

  const evento = lote.eventos;
  const entidade = evento.entidades;

  const referencia = novaReferencia();
  const lamports = centavosParaLamports(lote.preco_centavos);
  const destino = cofreDeCobranca(entidade.multisig_pda);

  const { error } = await criarClienteServiceRole().from('ingressos').insert({
    evento_id: evento.id,
    lote_id: lote.id,
    lote: lote.nome,
    preco_centavos: lote.preco_centavos,
    comprador_id: compradorId,
    referencia,
    lamports,
    status: 'reservado',
  });
  if (error) throw error;

  const cobranca = montarCobranca({
    destino,
    lamports,
    referencia,
    entidade: entidade.nome,
    evento: evento.nome,
  });

  return {
    referencia,
    lote: lote.nome,
    valorCentavos: lote.preco_centavos,
    destino: cobranca.destino,
    qr: await desenharQR(cobranca.url),
    url: cobranca.url,
  };
}

/* ── Conciliação ────────────────────────────────────────────────────────── */

type IngressoCompleto = {
  id: string;
  lote: string;
  preco_centavos: number;
  lamports: number | null;
  status: 'reservado' | 'pago' | 'usado';
  lote_id: string | null;
  tx_signature: string | null;
  eventos: {
    id: string;
    nome: string;
    rubrica: Rubrica;
    entidades: { id: string; nome: string; slug: string; multisig_pda: string | null };
  };
};

/**
 * Procura o pagamento desta compra e, se achou, fecha o circuito.
 *
 * Idempotente: a tela consulta em laço, e chamar dez vezes tem que gravar um
 * lançamento só. Quem garante isso não é este código — é o índice único em
 * `ingressos.lancamento_id` e o próprio status. Código que "lembra" de não
 * duplicar esquece; índice não.
 */
export async function conciliar(referencia: string): Promise<SituacaoDaCompra> {
  const supabase = criarClienteServiceRole();

  const { data, error } = await supabase
    .from('ingressos')
    .select(
      'id, lote, preco_centavos, lamports, status, lote_id, tx_signature, eventos!inner(id, nome, rubrica, entidades!inner(id, nome, slug, multisig_pda))',
    )
    .eq('referencia', referencia)
    .maybeSingle();

  if (error) throw error;
  const ingresso = data as IngressoCompleto | null;
  if (!ingresso) throw new Error('Compra não encontrada.');

  const evento = ingresso.eventos;
  const entidade = evento.entidades;

  const pronto = (assinatura: string | null): SituacaoDaCompra => ({
    pago: true,
    valorCentavos: ingresso.preco_centavos,
    lote: ingresso.lote,
    evento: evento.nome,
    comprovante: assinatura
      ? `https://explorer.solana.com/tx/${assinatura}?cluster=devnet`
      : '',
    livro: `/e/${entidade.slug}/livro`,
  });

  if (ingresso.status !== 'reservado') return pronto(ingresso.tx_signature);

  const achado = await procurarPagamento({
    referencia,
    destino: cofreDeCobranca(entidade.multisig_pda),
    lamports: ingresso.lamports ?? centavosParaLamports(ingresso.preco_centavos),
  });
  if (!achado) return { pago: false };

  // Vira o status ANTES de gravar no livro-caixa, condicionado a ele ainda
  // estar `reservado`. É esta atualização que decide quem ganhou a corrida: a
  // tela consulta em laço e duas voltas podem achar o mesmo pagamento ao mesmo
  // tempo. Só quem virar o status escreve o lançamento — na ordem inversa,
  // duas voltas gravariam duas entradas no livro-caixa antes de qualquer trava
  // fazer efeito, e livro-caixa com entrada dobrada é o pior defeito possível
  // neste produto.
  const { data: ganhou, error: erroIngresso } = await supabase
    .from('ingressos')
    .update({
      status: 'pago',
      pago_em: new Date().toISOString(),
      tx_signature: achado.assinatura,
    })
    .eq('id', ingresso.id)
    .eq('status', 'reservado')
    .select('id')
    .maybeSingle();
  if (erroIngresso) throw erroIngresso;

  // Outra volta chegou primeiro. Ela grava o lançamento; esta só relata.
  if (!ganhou) return pronto(achado.assinatura);

  // A entrada no livro-caixa. É isto que o associado vê aparecer sozinho.
  const { data: lancamento, error: erroLancamento } = await supabase
    .from('lancamentos')
    .insert({
      entidade_id: entidade.id,
      tipo: 'entrada',
      valor_centavos: ingresso.preco_centavos,
      rubrica: evento.rubrica,
      descricao: `${ingresso.lote} · ${evento.nome}`,
      tx_signature: achado.assinatura,
    })
    .select('id')
    .single();
  if (erroLancamento) throw erroLancamento;

  await supabase
    .from('ingressos')
    .update({ lancamento_id: lancamento.id })
    .eq('id', ingresso.id);

  if (ingresso.lote_id) await debitarLote(ingresso.lote_id);

  return pronto(achado.assinatura);
}

/**
 * Um a menos no lote.
 *
 * `vendidos` é contador denormalizado porque a página da festa abre sem login e
 * o anônimo não pode ler `ingressos` — ver a migração 0004. Soma um dentro do
 * próprio UPDATE (`vender_lote`, migração 0007), e não reconta: o cartaz parte
 * de um número que veio da gestão anterior, e recontar as linhas do banco novo
 * apagaria as vendas de antes. Somar dentro do UPDATE também fecha a janela
 * entre ler e gravar, que engolia uma de duas compras simultâneas.
 */
async function debitarLote(loteId: string) {
  const { error } = await criarClienteServiceRole().rpc('vender_lote', {
    p_lote: loteId,
  });

  // Contador errado não pode derrubar uma compra que já foi paga e já está no
  // livro-caixa. Fica no log para conferir depois.
  if (error) console.error('[ingresso] não conseguimos atualizar o lote', error);
}

/* ── Cobrança para o pagamento de demonstração ──────────────────────────── */

/** Remonta a cobrança de uma referência já reservada, sem tocar no banco. */
export async function cobrancaDe(referencia: string): Promise<Cobranca> {
  const { data, error } = await criarClienteServiceRole()
    .from('ingressos')
    .select(
      'preco_centavos, lamports, status, eventos!inner(nome, entidades!inner(nome, multisig_pda))',
    )
    .eq('referencia', referencia)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Compra não encontrada.');

  const ingresso = data as unknown as {
    preco_centavos: number;
    lamports: number | null;
    status: string;
    eventos: { nome: string; entidades: { nome: string; multisig_pda: string | null } };
  };

  return montarCobranca({
    destino: cofreDeCobranca(ingresso.eventos.entidades.multisig_pda),
    lamports: ingresso.lamports ?? centavosParaLamports(ingresso.preco_centavos),
    referencia,
    entidade: ingresso.eventos.entidades.nome,
    evento: ingresso.eventos.nome,
  });
}
