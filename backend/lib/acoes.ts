'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { criarClienteServidor } from '@/lib/supabase/server';

/**
 * Server Actions. Toda escrita passa por aqui — leitura fica em `lib/dados.ts`.
 */

export type EstadoEntrada = { erro?: string; enviado?: string };

/**
 * Para onde o link do e-mail deve voltar.
 *
 * É a falha número um de quem publica: o link chega e devolve a pessoa para
 * `localhost`. Acontece quando a origem é montada só a partir do cabeçalho
 * `host`, que num proxy vem sem protocolo — e `http://` num domínio https
 * quebra a sessão.
 *
 * A ordem é da mais confiável para a menos: a variável que você define, depois
 * o domínio que a Vercel injeta, e só então o cabeçalho da requisição — este
 * respeitando `x-forwarded-proto`, porque atrás de proxy é ele que diz se a
 * conexão original era segura.
 *
 * Definir `NEXT_PUBLIC_SITE_URL` continua sendo o certo em produção: o
 * cabeçalho `host` vem do cliente, e endereço de redirecionamento não é coisa
 * que se deixe o cliente escolher. O Supabase também recusa qualquer URL que
 * não esteja na lista de redirect do painel — é a segunda tranca.
 */
async function enderecoDoSite(): Promise<string> {
  const definido = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (definido) return definido.replace(/\/+$/, '');

  const daVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (daVercel) return `https://${daVercel}`;

  const cabecalhos = await headers();
  const host = cabecalhos.get('host') ?? 'localhost:3000';
  const protocolo =
    cabecalhos.get('x-forwarded-proto')?.split(',')[0].trim() ??
    (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? 'http' : 'https');

  return `${protocolo}://${host}`;
}

/**
 * Envia o link de acesso por e-mail.
 *
 * Sem senha: ninguém vai criar senha para entrar no app da atlética. E sem
 * revelar se o e-mail existe — responder "não encontrado" transformaria o
 * formulário num verificador de quem é da diretoria.
 */
export async function enviarLink(
  _anterior: EstadoEntrada,
  form: FormData,
): Promise<EstadoEntrada> {
  const email = String(form.get('email') ?? '').trim().toLowerCase();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { erro: 'Confira o e-mail — parece incompleto.' };
  }

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${await enderecoDoSite()}/auth/confirmar` },
  });

  if (error) {
    console.error('[auth] falha ao enviar o link', error);
    return { erro: 'Não conseguimos enviar o link agora. Tente de novo.' };
  }

  return { enviado: email };
}

export type EstadoProposta = { erro?: string };

/**
 * Propõe uma saída do cofre.
 *
 * Escreve com o cliente de sessão, não com a service role: a política de
 * `propostas` exige que quem insere tenha papel de signatário na entidade e
 * que `criado_por` seja o registro do próprio usuário. Se um sócio tentar, o
 * banco recusa — e é assim que tem que ser, porque a regra é do cofre e não
 * desta função.
 *
 * O valor chega como texto em reais e vira integer em CENTAVOS aqui, uma vez
 * só. Nunca float: `19.99 * 100` dá 1998.9999999999998, e um livro-caixa que
 * erra um centavo por lançamento perde a credibilidade inteira.
 */
export async function proporSaida(
  _anterior: EstadoProposta,
  form: FormData,
): Promise<EstadoProposta> {
  const slug = String(form.get('slug') ?? '');
  const destino = String(form.get('destino') ?? '').trim();
  const chave = String(form.get('chave') ?? '').trim();
  const rubrica = String(form.get('rubrica') ?? '');
  const valorBruto = String(form.get('valor') ?? '').trim();

  if (destino.length < 2) return { erro: 'Diga para quem é a saída.' };
  if (chave.length < 2) return { erro: 'Informe a chave do destinatário.' };
  if (!['Eventos', 'Marketing', 'Esporte', 'Associados'].includes(rubrica)) {
    return { erro: 'Escolha uma rubrica.' };
  }

  const centavos = paraCentavos(valorBruto);
  if (centavos === null || centavos <= 0) {
    return { erro: 'Valor inválido. Use algo como 840,00.' };
  }

  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?proxima=/e/${slug}/propor`);

  const { data: entidade } = await supabase
    .from('entidades')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!entidade) return { erro: 'Entidade não encontrada.' };

  const { data: eu } = await supabase
    .from('membros')
    .select('id, papel')
    .eq('user_id', user.id)
    .eq('entidade_id', entidade.id)
    .maybeSingle();

  if (!eu) return { erro: 'Você não está nesta entidade.' };
  if (eu.papel === 'socio') {
    return { erro: 'Só a diretoria propõe saída. Sócio não assina.' };
  }

  const { error } = await supabase.from('propostas').insert({
    entidade_id: entidade.id,
    criado_por: eu.id,
    destino,
    chave_pix: chave,
    valor_centavos: centavos,
    rubrica,
    status: 'pendente',
  });

  if (error) {
    console.error('[propostas] falha ao gravar', error);
    return { erro: 'Não conseguimos registrar a proposta agora.' };
  }

  redirect(`/e/${slug}/aprovacoes`);
}

/**
 * `"1.234,56"`, `"1234,56"`, `"1234.56"` ou `"1234"` → centavos.
 *
 * Feito com string e não com `parseFloat * 100` de propósito: float perde
 * centavo, e centavo perdido em livro-caixa é erro que ninguém consegue
 * explicar depois.
 */
function paraCentavos(texto: string): number | null {
  const limpo = texto.replace(/[R$\s ]/g, '');
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+([.,]\d{1,2})?$/.test(limpo)) return null;

  // Com milhar e decimal juntos, a vírgula é o decimal. Sozinha, também.
  const semMilhar = limpo.includes(',')
    ? limpo.replace(/\./g, '').replace(',', '.')
    : limpo;

  const [inteiros, decimais = ''] = semMilhar.split('.');
  const centavos = Number(inteiros) * 100 + Number(decimais.padEnd(2, '0').slice(0, 2));
  return Number.isSafeInteger(centavos) ? centavos : null;
}

export async function sair() {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect('/entrar');
}
