import { notFound, redirect } from 'next/navigation';
import { Lock } from 'lucide-react';

import { BarraAbas } from '@/components/BarraAbas';
import { BlocoBloqueio } from '@/components/BlocoBloqueio';
import { Botao } from '@/components/Botao';
import { Chip } from '@/components/Chip';
import { COR_DA_RUBRICA } from '@/components/acentos';
import { Erro, Vazio } from '@/components/Estados';
import { Hero } from '@/components/Hero';
import { IndicadorAssinaturas } from '@/components/IndicadorAssinaturas';
import { CorpoTela, RotuloSecao, Tela } from '@/components/Tela';
import { TileIcone } from '@/components/TileIcone';
import { PainelCofre, type Assento } from '@/components/vivo/PainelCofre';
import {
  QUORUM,
  associados,
  entidadePorSlug,
  nomeDoPapel,
  pendentes,
  propostaRetida,
  retido,
  signatarios,
  totais,
  usuarioAtual,
} from '@/lib/dados';
import type { Membro } from '@/lib/dados';
import {
  formatBRL,
  formatCompacto,
  formatComSinal,
  formatHora,
  formatQuando,
} from '@/lib/format';

export const metadata = { title: 'Aprovações · Quórum' };

/**
 * 5b · Aprovações — a tela do vídeo.
 *
 * Lê as propostas do banco sob RLS, então dois navegadores logados como
 * pessoas diferentes veem a MESMA proposta com a MESMA contagem: o estado é do
 * cofre, não do cliente. O que muda entre eles é só o que cada um pode fazer.
 *
 * `?estado=vivo` troca o painel pelo que fala com a devnet.
 */
export default async function Aprovacoes({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ estado?: string }>;
}) {
  const { slug } = await params;
  const { estado } = await searchParams;

  const sessao = await usuarioAtual();
  if (!sessao?.user) redirect(`/entrar?proxima=/e/${slug}/aprovacoes`);

  const entidade = await entidadePorSlug(slug);
  if (!entidade) notFound();

  const eu = sessao.membro;

  let lista, valorRetido, diretoria;
  try {
    [lista, valorRetido, diretoria] = await Promise.all([
      pendentes(entidade.id),
      retido(entidade.id),
      signatarios(entidade.id),
    ]);
  } catch (e) {
    console.error('[aprovacoes] falha ao ler', e);
    return (
      <Moldura slug={slug} entidade={entidade.nome} subtitulo="">
        <Erro>
          As propostas não carregaram. Nenhum valor saiu do cofre — recarregue a
          página em instantes.
        </Erro>
      </Moldura>
    );
  }

  if (estado === 'vivo') {
    const alvo = await propostaRetida(entidade.id, eu?.id ?? null);
    const [soma, quantos] = await Promise.all([
      totais(entidade.id),
      associados(entidade.id),
    ]);

    return (
      <Moldura
        slug={slug}
        entidade={entidade.nome}
        subtitulo={`Cofre ${QUORUM.de} de ${QUORUM.entre} na rede`}
        pilula="ao vivo"
        pendencias={lista.length}
      >
        <RotuloSecao>Aguardando a segunda assinatura</RotuloSecao>
        {alvo ? (
          <PainelCofre
            proposta={{
              destino: alvo.destino,
              chave: alvo.chave_pix,
              valorCentavos: alvo.valor_centavos,
              rubrica: alvo.rubrica,
            }}
            nomes={nomesDosAssentos(diretoria)}
            saldoCentavos={soma.saldo}
            associados={quantos}
          />
        ) : (
          <Vazio titulo="Nenhuma proposta para levar ao cofre">
            Cadastre uma saída em propostas para acompanhar a execução com as
            duas assinaturas.
          </Vazio>
        )}
      </Moldura>
    );
  }

  if (lista.length === 0) {
    return (
      <Moldura
        slug={slug}
        entidade={entidade.nome}
        subtitulo="Nenhuma saída retida"
        variante="blue"
      >
        <Vazio
          titulo="Nada aguardando assinatura"
          acao={{ texto: 'Propor uma saída', href: `/e/${slug}/aprovacoes?estado=vivo` }}
        >
          Quando alguém da diretoria propuser uma saída, ela aparece aqui e fica
          retida até juntar {QUORUM.de} assinaturas.
        </Vazio>
      </Moldura>
    );
  }

  // A que precisa de ação vem expandida; as outras, colapsadas em uma linha.
  const emFoco = lista[0];
  const outras = lista.slice(1);
  const autor = diretoria.find((m) => m.id === emFoco.criado_por);
  const feitas = emFoco.assinaturas.length;
  const jaAssinei = eu ? emFoco.assinaturas.some((a) => a.membro_id === eu.id) : false;
  const podeAssinar = eu ? eu.papel !== 'socio' && !jaAssinei : false;

  return (
    <Moldura
      slug={slug}
      entidade={entidade.nome}
      subtitulo={<span className="num">{formatBRL(valorRetido)} retidos</span>}
      pilula={`${lista.length} ${lista.length === 1 ? 'pendente' : 'pendentes'}`}
      pendencias={lista.length}
    >
      <RotuloSecao>
        {jaAssinei ? 'Aguardando a segunda assinatura' : 'Aguardando você'}
      </RotuloSecao>

      <article className="rounded-card border border-line bg-surface-2 p-[15px]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="t-item text-ink">{emFoco.destino}</h2>
            <div className="num mt-1.5 text-[12.5px] leading-[1.3] font-normal text-ink-3">
              chave {emFoco.chave_pix}
            </div>
          </div>
          <div className="t-valor text-ink">
            {formatComSinal(emFoco.valor_centavos, 'saida', { compacto: true })}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-[7px]">
          <Chip acento={COR_DA_RUBRICA[emFoco.rubrica]}>{emFoco.rubrica}</Chip>
          <span className="t-meta text-ink-3">
            {autor?.nome ?? 'diretoria'} · {formatQuando(emFoco.criado_em)}
          </span>
        </div>

        <div className="my-3.5 h-px bg-line" />

        <IndicadorAssinaturas
          assinaturas={emFoco.assinaturas.map((a) => ({
            nome: diretoria.find((m) => m.id === a.membro_id)?.nome ?? 'signatário',
            hora: formatHora(a.assinado_em),
          }))}
          necessarias={QUORUM.de}
        />

        {feitas < QUORUM.de && (
          <BlocoBloqueio className="mt-3.5">
            {jaAssinei
              ? 'Falta a assinatura de outro signatário. Ao assinar, a saída é executada na hora.'
              : `${QUORUM.de - feitas === 1 ? 'Falta 1 assinatura' : `Faltam ${QUORUM.de - feitas} assinaturas`} para o quórum. Ao assinar, a saída é executada na hora.`}
          </BlocoBloqueio>
        )}

        <Botao className="mt-3" href={`/e/${slug}/aprovacoes?estado=vivo`}>
          {podeAssinar ? 'Assinar e executar' : 'Cobrar a segunda assinatura'}
        </Botao>

        {eu && (
          <p className="t-meta mt-3 text-ink-3">
            Você está como {eu.nome} · {nomeDoPapel[eu.papel]}
          </p>
        )}
      </article>

      {outras.length > 0 && (
        <>
          <RotuloSecao>Sem sua assinatura ainda</RotuloSecao>
          <div className="flex flex-col gap-2.5">
            {outras.map((p) => (
              <div
                key={p.id}
                className="flex min-h-[62px] items-center gap-[11px] rounded-card border border-line bg-surface px-[13px] py-3"
              >
                <TileIcone icone={Lock} acento="red" tamanho="lg" />
                <div className="min-w-0 flex-1">
                  <div className="t-item-sm truncate text-ink">{p.destino}</div>
                  <div className="mt-[5px] flex items-center gap-[7px]">
                    <Chip acento={COR_DA_RUBRICA[p.rubrica]}>{p.rubrica}</Chip>
                    <span className="num t-meta text-ink-3">
                      {p.assinaturas.length} de {QUORUM.de}
                    </span>
                  </div>
                </div>
                <span className="t-valor text-red">
                  {formatCompacto(p.valor_centavos, { simbolo: false })}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="t-meta text-pretty text-ink-3">
        Enquanto o quórum não fecha, o valor permanece no cofre. Nenhuma cobrança
        é feita e nada é enviado ao banco.
      </p>
    </Moldura>
  );
}

/**
 * Casa os três assentos da chave do cofre com quem os ocupa na diretoria.
 *
 * Os assentos vêm do ambiente do servidor (`SIGNER_TESOUREIRA` e companhia) e
 * não mudam; quem senta neles vem do banco. Se a diretoria ainda não cadastrou
 * alguém, o assento aparece pelo nome do cargo — nunca vazio, porque o painel
 * escreve esses nomes em botão e em comprovante.
 */
function nomesDosAssentos(diretoria: Membro[]): Record<Assento, string> {
  const de = (papel: Membro['papel'], padrao: string) =>
    diretoria.find((m) => m.papel === papel)?.nome ?? padrao;

  return {
    tesoureira: de('tesoureiro', 'Tesouraria'),
    presidente: de('presidente', 'Presidência'),
    conselho: de('conselho', 'Conselho fiscal'),
  };
}

function Moldura({
  slug,
  entidade,
  subtitulo,
  pilula,
  variante = 'red',
  pendencias = 0,
  children,
}: {
  slug: string;
  entidade: string;
  subtitulo: React.ReactNode;
  pilula?: string;
  variante?: 'red' | 'blue';
  pendencias?: number;
  children: React.ReactNode;
}) {
  return (
    <Tela>
      <Hero
        variante={variante}
        rotulo={entidade}
        titulo="Aprovações"
        subtitulo={subtitulo}
        pilula={pilula}
      />
      <CorpoTela respiroAbas>{children}</CorpoTela>
      <BarraAbas ativa="aprovar" slug={slug} pendencias={pendencias} />
    </Tela>
  );
}
