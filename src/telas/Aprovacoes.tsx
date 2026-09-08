import { useParams, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';

import { BarraAbas } from '@/componentes/BarraAbas';
import { BlocoBloqueio } from '@/componentes/BlocoBloqueio';
import { Botao } from '@/componentes/Botao';
import { Chip } from '@/componentes/Chip';
import { COR_DA_RUBRICA } from '@/componentes/acentos';
import { Carregando, Erro, Vazio } from '@/componentes/Estados';
import { Hero } from '@/componentes/Hero';
import { IndicadorAssinaturas } from '@/componentes/IndicadorAssinaturas';
import { CorpoTela, RotuloSecao, Tela } from '@/componentes/Tela';
import { TileIcone } from '@/componentes/TileIcone';
import {
  ASSENTO_DO_PAPEL,
  PainelCofre,
  avisoPorEmail,
  type Assento,
} from '@/vivo/PainelCofre';

import {
  QUORUM,
  associados,
  entidadePorSlug,
  lancamentos,
  nomeDoPapel,
  pendentes,
  propostaRetida,
  propostas,
  retido,
  signatarios,
  totais,
  type Membro,
} from '@/lib/dados';
import {
  formatBRL,
  formatCompacto,
  formatComSinal,
  formatHora,
  formatQuando,
} from '@/lib/format';
import { useSessao } from '@/lib/sessao';
import { useConsulta } from '@/lib/useConsulta';
import { useTempoReal } from '@/lib/useTempoReal';


import { NaoEncontrada } from './NaoEncontrada';

/**
 * 5b · Aprovações — a tela do vídeo.
 *
 * Lê as propostas do banco sob RLS, então dois navegadores logados como pessoas
 * diferentes veem a MESMA proposta com a MESMA contagem: o estado é do cofre,
 * não do cliente. O que muda entre eles é só o que cada um pode fazer.
 *
 * `?estado=vivo` troca o painel pelo que fala com a rede.
 */
export function Aprovacoes() {
  const { slug = '' } = useParams();
  const [busca] = useSearchParams();
  const aoVivo = busca.get('estado') === 'vivo';
  const propostaPedida = busca.get('proposta');

  const sessao = useSessao();
  const eu = sessao.membro;

  const { dados, carregando, erro, recarregar } = useConsulta(async () => {
    const entidade = await entidadePorSlug(slug);
    if (!entidade) return null;

    const [lista, diretoria, linhas, quantos] = await Promise.all([
      propostas(entidade.id),
      signatarios(entidade.id),
      lancamentos(entidade.id),
      associados(entidade.id),
    ]);

    return {
      entidade,
      abertas: pendentes(lista),
      valorRetido: retido(lista),
      diretoria,
      alvo:
        lista.find((p) => p.id === propostaPedida && p.status === 'pendente') ??
        propostaRetida(lista, eu?.id ?? null),
      soma: totais(linhas),
      quantos,
    };
  }, [slug, eu?.id, propostaPedida]);


  // Em tempo real: assinatura feita no aparelho de outra pessoa, proposta nova
  // ou promoção na diretoria aparecem aqui sem ninguém recarregar a página.
  useTempoReal(['propostas', 'assinaturas', 'membros'], recarregar);


  if (erro) {
    return (
      <Moldura slug={slug} entidade="" subtitulo="">
        <Erro>
          As propostas não carregaram. Nenhum valor saiu do cofre — recarregue a
          página em instantes.
        </Erro>
      </Moldura>
    );
  }

  if (carregando) {
    return (
      <Moldura slug={slug} entidade="" subtitulo="">
        <Carregando linhas={4} />
      </Moldura>
    );
  }

  if (!dados) return <NaoEncontrada />;

  const { entidade, abertas, valorRetido, diretoria, alvo, soma, quantos } = dados;
  const ocupados = assentosOcupados(diretoria);

  // Duas pessoas da diretoria, no mínimo: uma saída só é retida de verdade se
  // existir uma segunda pessoa capaz de assinar.
  if (ocupados.length < QUORUM.de) {
    return (
      <Moldura
        slug={slug}
        entidade={entidade.nome}
        subtitulo="Falta um segundo assinante"
        variante="blue"
      >
        <Vazio
          titulo="A diretoria precisa de duas pessoas"
          acao={{ texto: 'Abrir sócios ativos', href: `/e/${slug}/socios` }}
        >
          Hoje só {diretoria[0]?.nome ?? 'uma pessoa'} pode assinar. Promova
          outra pessoa a presidência, tesouraria ou conselho fiscal em Sócios
          ativos — assim que isso acontecer, esta tela se atualiza sozinha.
        </Vazio>
      </Moldura>
    );
  }

  if (aoVivo) {
    return (
      <Moldura
        slug={slug}
        entidade={entidade.nome}
        subtitulo={`Cofre ${QUORUM.de} de ${QUORUM.entre} na rede`}
        pilula="ao vivo"
        pendencias={abertas.length}
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
            contatos={contatosDosAssentos(diretoria)}
            assentosOcupados={ocupados}
            meuAssento={eu ? (ASSENTO_DO_PAPEL[eu.papel] ?? null) : null}


            saldoCentavos={soma.saldo}
            associados={quantos}
            entidadeSlug={slug}
            propostaId={alvo.id}
          />
        ) : (
          <Vazio
            titulo="Nenhuma proposta para levar ao cofre"
            acao={{ texto: 'Propor uma saída', href: `/e/${slug}/propor` }}
          >
            Cadastre uma saída em propostas para acompanhar a execução com as
            duas assinaturas.
          </Vazio>
        )}
      </Moldura>
    );
  }

  if (abertas.length === 0) {
    return (
      <Moldura
        slug={slug}
        entidade={entidade.nome}
        subtitulo="Nenhuma saída retida"
        variante="blue"
      >
        <Vazio
          titulo="Nada aguardando assinatura"
          acao={{ texto: 'Propor uma saída', href: `/e/${slug}/propor` }}
        >
          Quando alguém da diretoria propuser uma saída, ela aparece aqui e fica
          retida até juntar {QUORUM.de} assinaturas.
        </Vazio>
      </Moldura>
    );
  }

  // A que precisa da MINHA ação vem expandida; as outras, colapsadas.
  const emFoco = alvo ?? abertas[0];
  const outras = abertas.filter((p) => p.id !== emFoco.id);
  const autor = diretoria.find((m) => m.id === emFoco.criado_por);
  const feitas = emFoco.assinaturas.length;
  const jaAssinei = eu ? emFoco.assinaturas.some((a) => a.membro_id === eu.id) : false;
  const podeAssinar = eu ? eu.papel !== 'socio' && !jaAssinei : false;
  const faltam = QUORUM.de - feitas;


  return (
    <Moldura
      slug={slug}
      entidade={entidade.nome}
      subtitulo={<span className="num">{formatBRL(valorRetido)} retidos</span>}
      pilula={`${abertas.length} ${abertas.length === 1 ? 'pendente' : 'pendentes'}`}
      pendencias={abertas.length}
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
              : `${faltam === 1 ? 'Falta 1 assinatura' : `Faltam ${faltam} assinaturas`} para o quórum. Ao assinar, a saída é executada na hora.`}
          </BlocoBloqueio>
        )}

        {podeAssinar ? (
          <Botao
            className="mt-3"
            href={`/e/${slug}/aprovacoes?estado=vivo&proposta=${emFoco.id}`}
          >

            Assinar e executar
          </Botao>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {faltantesDaProposta(diretoria, emFoco, eu?.id ?? null).map((m) => (
              <Botao
                key={m.id}
                variante="secundario"
                href={
                  m.email
                    ? avisoPorEmail(
                        m.email,
                        {
                          destino: emFoco.destino,
                          chave: emFoco.chave_pix,
                          valorCentavos: emFoco.valor_centavos,
                          rubrica: emFoco.rubrica,
                        },
                        `${window.location.origin}/e/${slug}/aprovacoes?estado=vivo&proposta=${emFoco.id}`,
                      )
                    : undefined
                }
              >
                Avisar {m.nome}
              </Botao>
            ))}
          </div>
        )}


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
 * Os assentos vêm do ambiente do servidor e não mudam; quem senta neles vem do
 * banco. Se a diretoria ainda não cadastrou alguém, o assento aparece pelo nome
 * do cargo — nunca vazio, porque o painel escreve esses nomes em botão e em
 * comprovante.
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

/** O e-mail de cada assento, para o aviso de "falta a sua assinatura". */
function contatosDosAssentos(
  diretoria: Membro[],
): Partial<Record<Assento, string | null>> {
  const de = (papel: Membro['papel']) =>
    diretoria.find((m) => m.papel === papel)?.email ?? null;

  return {
    tesoureira: de('tesoureiro'),
    presidente: de('presidente'),
    conselho: de('conselho'),
  };
}

/** Quem da diretoria ainda não assinou esta proposta, tirando você. */
function faltantesDaProposta(
  diretoria: Membro[],
  proposta: { assinaturas: { membro_id: string }[] },
  meuId: string | null,
): Membro[] {
  return diretoria.filter(
    (m) =>
      m.id !== meuId &&
      m.papel !== 'socio' &&
      !proposta.assinaturas.some((a) => a.membro_id === m.id),
  );
}

/** Os lugares do cofre que têm alguém de verdade na diretoria. */
function assentosOcupados(diretoria: Membro[]): Assento[] {
  const ordem: Assento[] = ['tesoureira', 'presidente', 'conselho'];
  const tem = new Set(
    diretoria
      .map((m) => ASSENTO_DO_PAPEL[m.papel])
      .filter((a): a is Assento => !!a),
  );
  return ordem.filter((a) => tem.has(a));
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
