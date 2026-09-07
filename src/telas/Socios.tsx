import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, ChevronDown, User, X } from 'lucide-react';

import { BarraAbas } from '@/componentes/BarraAbas';
import { Chip } from '@/componentes/Chip';
import { Carregando, Erro, Vazio } from '@/componentes/Estados';
import { Hero } from '@/componentes/Hero';
import { CorpoTela, Tela } from '@/componentes/Tela';
import { decidirSolicitacao, ErroDaApi, mudarPapel } from '@/lib/api';
import {
  entidadePorSlug,
  eventosDaEntidade,
  membros,
  nomeDoPapel,
  pendentes,
  propostas,
  solicitacoes,
  type Membro,
  type Papel,
} from '@/lib/dados';
import { iniciais } from '@/lib/format';
import { useSessao } from '@/lib/sessao';
import { useConsulta } from '@/lib/useConsulta';

import { NaoEncontrada } from './NaoEncontrada';


/**
 * Quem é da entidade.
 *
 * A política de `membros` só deixa ver os colegas da própria entidade — quem
 * não é de dentro recebe lista vazia, e é o banco que decide isso.
 */
export function Socios() {
  const { slug = '' } = useParams();
  const { membro: eu } = useSessao();


  const { dados, carregando, erro, recarregar } = useConsulta(async () => {
    const entidade = await entidadePorSlug(slug);
    if (!entidade) return null;

    const [lista, todas, festas, esperando] = await Promise.all([
      membros(entidade.id),
      propostas(entidade.id),
      eventosDaEntidade(entidade.id),
      solicitacoes(entidade.id),
    ]);
    return { entidade, lista, emAberto: pendentes(todas), festas, esperando };
  }, [slug]);

  if (erro) {
    return (
      <Tela>
        <Hero variante="purple" titulo="Sócios" />
        <CorpoTela respiroAbas>
          <Erro titulo="A lista não carregou">
            Nada mudou no cofre. Tente recarregar em instantes.
          </Erro>
        </CorpoTela>
        <BarraAbas ativa="cofre" slug={slug} />
      </Tela>
    );
  }

  if (carregando) {
    return (
      <Tela>
        <Hero variante="purple" titulo="Sócios" />
        <CorpoTela respiroAbas>
          <Carregando linhas={5} />
        </CorpoTela>
        <BarraAbas ativa="cofre" slug={slug} />
      </Tela>
    );
  }

  if (!dados) return <NaoEncontrada />;

  const { entidade, lista, emAberto, festas, esperando } = dados;
  const assinantes = lista.filter((m) => m.papel !== 'socio');
  const socios = lista.filter((m) => m.papel === 'socio');

  return (
    <Tela>
      <Hero
        variante="purple"
        rotulo={entidade.nome}
        titulo="Sócios"
        subtitulo={`${lista.length} ${lista.length === 1 ? 'associado' : 'associados'} · ${assinantes.length} assinam`}
      />

      <CorpoTela respiroAbas className="pt-3">
        {esperando.length > 0 && (
          <Solicitacoes slug={slug} pedidos={esperando} aoDecidir={recarregar} />
        )}

        {lista.length === 0 ? (
          <Vazio titulo="Nenhum associado ainda">
            Quando a diretoria cadastrar as pessoas, elas aparecem aqui.
          </Vazio>
        ) : (
          <>
            <Secao titulo="Diretoria" pessoas={assinantes} />
            <Secao titulo="Associados" pessoas={socios} />
          </>
        )}
      </CorpoTela>

      <BarraAbas
        ativa="cofre"
        slug={slug}
        pendencias={emAberto.length}
        festaHref={festas[0] ? `/f/${festas[0].slug}` : `/e/${slug}/festas`}
      />
    </Tela>
  );
}

function Secao({ titulo, pessoas }: { titulo: string; pessoas: Membro[] }) {
  if (pessoas.length === 0) return null;

  return (
    <>
      <div className="t-rotulo text-ink-3">{titulo}</div>
      <div className="flex flex-col gap-2">
        {pessoas.map((m) => (
          <div
            key={m.id}
            className="flex min-h-[58px] items-center gap-[11px] rounded-card border border-line bg-surface px-3.5 py-2.5"
          >
            {/*
              Avatar roxo: roxo é a cor de pessoas em todo o produto. Nunca
              vermelho — vermelho é bloqueio, e ninguém é um bloqueio.
            */}
            <div className="flex size-9 flex-none items-center justify-center rounded-avatar bg-purple-tint text-[12.5px] leading-none font-bold text-purple">
              {iniciais(m.nome)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="t-item-sm truncate text-ink">{m.nome}</div>
              <div className="mt-[5px] flex items-center gap-[7px]">
                <Chip acento={m.papel === 'socio' ? 'purple' : 'blue'}>
                  {nomeDoPapel[m.papel]}
                </Chip>
              </div>
            </div>
            {m.papel !== 'socio' && (
              <User size={16} strokeWidth={1.7} className="flex-none text-ink-3" aria-hidden />
            )}
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * Os pedidos de entrada, para a diretoria decidir.
 *
 * Vem antes da lista de gente porque é a única parte da tela que pede uma ação.
 * O resto é consulta, e consulta pode esperar.
 *
 * Aprovar liga a linha; recusar apaga. Apagar, e não marcar como recusado, por
 * duas razões: a chave única `(entidade_id, user_id)` ficaria ocupada por uma
 * recusa e a pessoa nunca mais poderia pedir; e guardar uma lista de recusados
 * é manter registro sobre gente que não faz parte, feito por quem não deveria
 * mantê-lo.
 */
function Solicitacoes({
  slug,
  pedidos,
  aoDecidir,
}: {
  slug: string;
  pedidos: Membro[];
  aoDecidir: () => void;
}) {
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function decidir(membroId: string, aprovar: boolean) {
    setOcupado(membroId);
    setErro(null);
    try {
      await decidirSolicitacao({ entidadeSlug: slug, membroId, aprovar });
      aoDecidir();
    } catch (e) {
      setErro(
        e instanceof ErroDaApi ? e.message : 'Não conseguimos registrar agora.',
      );
    } finally {
      setOcupado(null);
    }
  }

  return (
    <>
      <div className="t-rotulo text-amber">
        {pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'} para entrar
      </div>

      {erro && <p className="t-desc text-pretty text-red">{erro}</p>}

      <div className="flex flex-col gap-2">
        {pedidos.map((m) => (
          <div
            key={m.id}
            className="flex min-h-[58px] items-center gap-[11px] rounded-card border border-amber/30 bg-amber-tint px-3.5 py-2.5"
          >
            <div className="flex size-9 flex-none items-center justify-center rounded-avatar bg-purple-tint text-[12.5px] leading-none font-bold text-purple">
              {iniciais(m.nome)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="t-item-sm truncate text-ink">{m.nome}</div>
              <div className="mt-[5px] truncate text-[11.5px] leading-none text-ink-2">
                {m.email ?? 'sem e-mail'}
              </div>
            </div>
            {/*
              Recusar é contorno, aprovar é sólido: a ação provável fica mais
              pesada que a rara, e nenhuma das duas usa vermelho — recusar um
              pedido não é bloqueio nem erro, e vermelho aqui assustaria quem
              está só organizando a lista.
            */}
            <button
              type="button"
              aria-label={`Recusar ${m.nome}`}
              disabled={ocupado !== null}
              onClick={() => void decidir(m.id, false)}
              className="flex size-9 flex-none items-center justify-center rounded-btn border border-line bg-surface disabled:opacity-50"
            >
              <X size={15} strokeWidth={2.2} className="text-ink-2" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={`Aprovar ${m.nome}`}
              disabled={ocupado !== null}
              onClick={() => void decidir(m.id, true)}
              className="flex size-9 flex-none items-center justify-center rounded-btn bg-green disabled:opacity-50"
            >
              <Check size={16} strokeWidth={2.4} className="text-ground" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
