import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { BarraAbas } from '@/componentes/BarraAbas';
import { Botao } from '@/componentes/Botao';
import { Chip } from '@/componentes/Chip';
import { COR_DA_RUBRICA, type Rubrica } from '@/componentes/acentos';
import { Carregando, Vazio } from '@/componentes/Estados';
import { Hero } from '@/componentes/Hero';
import { CorpoTela, Tela } from '@/componentes/Tela';
import {
  QUORUM,
  entidadePorSlug,
  pendentes,
  propostas,
  signatarios,
} from '@/lib/dados';
import { paraCentavos } from '@/lib/format';
import { useSessao } from '@/lib/sessao';
import { supabase } from '@/lib/supabase';
import { useConsulta } from '@/lib/useConsulta';
import { useTempoReal } from '@/lib/useTempoReal';


import { NaoEncontrada } from './NaoEncontrada';

const RUBRICAS: Rubrica[] = ['Eventos', 'Marketing', 'Esporte', 'Associados'];

/**
 * A chave de recebimento de uma entidade, como ela aparece na tela Receber.
 *
 * Quando o campo traz uma dessas, a saída vai para ela de verdade: a saída de
 * uma entidade passa a ser a entrada de outra. Qualquer outro texto — CNPJ,
 * e-mail, telefone — continua valendo como identificação de quem recebe, e o
 * destino na rede fica com o servidor.
 */
const CHAVE_DE_RECEBIMENTO = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/**
 * O destino do botão flutuante da barra de abas.
 *
 * A proposta que ele cria é a mesma que aparece na tela de aprovações
 * esperando a segunda assinatura.
 */
export function Propor() {
  const { slug = '' } = useParams();
  const sessao = useSessao();
  const eu = sessao.membro;

  const { dados, carregando, recarregar } = useConsulta(async () => {
    const entidade = await entidadePorSlug(slug);
    if (!entidade) return null;
    const [lista, diretoria] = await Promise.all([
      propostas(entidade.id),
      signatarios(entidade.id),
    ]);
    return { entidade, emAberto: pendentes(lista), diretoria };
  }, [slug]);

  // Promover alguém na aba Sócios libera esta tela na hora, sem recarregar.
  useTempoReal(['membros', 'propostas'], recarregar);


  if (carregando) {
    return (
      <Moldura slug={slug} entidade="" pendencias={0}>
        <Carregando linhas={4} />
      </Moldura>
    );
  }

  if (!dados) return <NaoEncontrada />;

  // Sócio não assina, e quem não assina não propõe. A política do banco já
  // recusaria; a tela diz antes, em vez de deixar a pessoa preencher tudo para
  // levar um erro no fim.
  if (!eu || eu.papel === 'socio') {
    return (
      <Moldura
        slug={slug}
        entidade={dados.entidade.nome}
        pendencias={dados.emAberto.length}
      >
        <Vazio
          titulo="Só a diretoria propõe saída"
          acao={{ texto: 'Ver o livro-caixa', href: `/e/${slug}/livro` }}
        >
          Propor uma saída é da presidência, da tesouraria e do conselho fiscal.
          O livro-caixa continua aberto a você, como a qualquer associado.
        </Vazio>
      </Moldura>
    );
  }

  return (
    <Moldura
      slug={slug}
      entidade={dados.entidade.nome}
      pendencias={dados.emAberto.length}
    >
      <Formulario slug={slug} entidadeId={dados.entidade.id} membroId={eu.id} />
    </Moldura>
  );
}

function Formulario({
  slug,
  entidadeId,
  membroId,
}: {
  slug: string;
  entidadeId: string;
  membroId: string;
}) {
  const navegar = useNavigate();
  const [rubrica, setRubrica] = useState<Rubrica>('Eventos');
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const destino = String(form.get('destino') ?? '').trim();
    const chave = String(form.get('chave') ?? '').trim();
    const centavos = paraCentavos(String(form.get('valor') ?? ''));

    if (destino.length < 2) return setErro('Diga para quem é a saída.');
    if (chave.length < 2) return setErro('Informe a chave do destinatário.');
    if (centavos === null || centavos <= 0) {
      return setErro('Valor inválido. Use algo como 840,00.');
    }

    setPendente(true);
    setErro(null);

    // A política exige papel de signatário e `criado_por` próprio. Se um sócio
    // tentar, é o banco que recusa — a regra é do cofre, não desta tela.
    const { error } = await supabase.from('propostas').insert({
      entidade_id: entidadeId,
      criado_por: membroId,
      destino,
      chave_pix: chave,
      valor_centavos: centavos,
      rubrica,
      status: 'pendente',
      destino_devnet: CHAVE_DE_RECEBIMENTO.test(chave) ? chave : null,
    });

    setPendente(false);

    if (error) {
      console.error('[propostas] falha ao gravar', error);
      setErro('Não conseguimos registrar a proposta agora.');
      return;
    }
    navegar(`/e/${slug}/aprovacoes`);
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3">
      <Campo id="destino" rotulo="Para quem" placeholder="Som Beira-Mar ME" />
      <Campo id="chave" rotulo="Chave do destinatário" placeholder="24.881.402/0001-77" />
      <p className="t-meta -mt-1 text-pretty text-ink-3">
        CNPJ, e-mail ou telefone identificam quem recebe. Se você colar a chave
        de recebimento de outra entidade, o valor vai direto para o cofre dela.
      </p>
      <Campo id="valor" rotulo="Valor" placeholder="840,00" inputMode="decimal" />

      <div>
        <div className="t-rotulo mb-2 text-ink-2">Rubrica</div>
        <div className="flex flex-wrap gap-[7px]">
          {RUBRICAS.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={r === rubrica}
              onClick={() => setRubrica(r)}
              className={`rounded-[9px] ${r === rubrica ? 'ring-2 ring-blue' : ''}`}
            >
              <Chip acento={COR_DA_RUBRICA[r]}>{r}</Chip>
            </button>
          ))}
        </div>
        <p className="t-meta mt-2 text-ink-3">
          Rubrica é a categoria contábil do lançamento, não a assinatura.
        </p>
      </div>

      {erro && <p className="t-desc text-red">{erro}</p>}

      <Botao type="submit" variante={pendente ? 'desabilitado' : 'primario'}>
        {pendente ? 'Registrando…' : 'Propor saída'}
      </Botao>

      <p className="t-meta text-pretty text-ink-3">
        A proposta nasce retida: nenhum valor sai do cofre enquanto não juntar
        duas assinaturas de três.
      </p>
    </form>
  );
}

function Campo({
  id,
  rotulo,
  ...resto
}: { id: string; rotulo: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="t-rotulo mb-2 block text-ink-2">
        {rotulo}
      </label>
      <input
        id={id}
        name={id}
        required
        autoComplete="off"
        className="w-full rounded-btn border border-line bg-surface px-3.5 py-[13px] text-[13px] font-medium text-ink placeholder:text-ink-3 focus:border-blue"
        {...resto}
      />
    </div>
  );
}

function Moldura({
  slug,
  entidade,
  pendencias,
  children,
}: {
  slug: string;
  entidade: string;
  pendencias: number;
  children: React.ReactNode;
}) {
  return (
    <Tela>
      <Hero
        rotulo={entidade}
        titulo="Propor saída"
        subtitulo={`Retida até juntar ${QUORUM.de} de ${QUORUM.entre} assinaturas`}
      />
      <CorpoTela respiroAbas className="pt-3.5">
        {children}
      </CorpoTela>
      <BarraAbas ativa="aprovar" slug={slug} pendencias={pendencias} />
    </Tela>
  );
}
