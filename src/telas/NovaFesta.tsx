import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { BarraAbas } from '@/componentes/BarraAbas';
import { Botao } from '@/componentes/Botao';
import { Carregando, Vazio } from '@/componentes/Estados';
import { Hero } from '@/componentes/Hero';
import { CorpoTela, Tela } from '@/componentes/Tela';
import { criarFesta } from '@/lib/api';
import { entidadePorSlug, pendentes, propostas } from '@/lib/dados';
import { paraCentavos } from '@/lib/format';
import { useSessao } from '@/lib/sessao';
import { useConsulta } from '@/lib/useConsulta';

import { NaoEncontrada } from './NaoEncontrada';

/**
 * A diretoria põe uma festa na agenda.
 *
 * Nome, dia, hora, local, preço do ingresso e quantos existem. O cartaz nasce
 * público no mesmo instante — é por ele que o dinheiro entra no cofre.
 */
export function NovaFesta() {
  const { slug = '' } = useParams();
  const eu = useSessao().membro;

  const { dados, carregando } = useConsulta(async () => {
    const entidade = await entidadePorSlug(slug);
    if (!entidade) return null;
    const lista = await propostas(entidade.id);
    return { entidade, emAberto: pendentes(lista) };
  }, [slug]);

  if (carregando) {
    return (
      <Moldura slug={slug} entidade="" pendencias={0}>
        <Carregando linhas={4} />
      </Moldura>
    );
  }

  if (!dados) return <NaoEncontrada />;

  if (!eu || eu.papel === 'socio') {
    return (
      <Moldura
        slug={slug}
        entidade={dados.entidade.nome}
        pendencias={dados.emAberto.length}
      >
        <Vazio
          titulo="Só a diretoria cria festa"
          acao={{ texto: 'Ver as festas', href: `/${slug}/festas` }}
        >
          Criar evento é da presidência, da tesouraria e do conselho fiscal. Os
          cartazes continuam abertos a você, como a qualquer associado.
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
      <Formulario slug={slug} />
    </Moldura>
  );
}

function Formulario({ slug }: { slug: string }) {
  const navegar = useNavigate();
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const nome = String(form.get('nome') ?? '').trim();
    const dia = String(form.get('dia') ?? '');
    const hora = String(form.get('hora') ?? '');
    const local = String(form.get('local') ?? '').trim();
    const centavos = paraCentavos(String(form.get('preco') ?? ''));
    const total = Number(String(form.get('total') ?? ''));

    if (nome.length < 2) return setErro('Dê um nome à festa.');
    if (!dia || !hora) return setErro('Escolha o dia e a hora.');
    if (centavos === null || centavos <= 0) {
      return setErro('Preço inválido. Use algo como 45,00.');
    }
    if (!Number.isSafeInteger(total) || total < 1) {
      return setErro('Diga quantos ingressos existem, no mínimo 1.');
    }

    setPendente(true);
    setErro(null);

    try {
      // `dia` e `hora` vêm do aparelho de quem preenche; juntos formam o horário
      // local, que é como a festa é anunciada.
      const criada = await criarFesta({
        entidadeSlug: slug,
        nome,
        data: new Date(`${dia}T${hora}`).toISOString(),
        local,
        precoCentavos: centavos,
        total,
      });
      navegar(`/festa/${criada.slug}`);
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : 'Não conseguimos criar a festa agora.',
      );
    } finally {
      setPendente(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3">
      <Campo id="nome" rotulo="Nome da festa" placeholder="Baile de 32 anos" />

      <div className="grid grid-cols-2 gap-3">
        <Campo id="dia" rotulo="Dia" type="date" />
        <Campo id="hora" rotulo="Hora" type="time" />
      </div>

      <Campo id="local" rotulo="Local" placeholder="Ginásio da Engenharia" required={false} />

      <div className="grid grid-cols-2 gap-3">
        <Campo id="preco" rotulo="Preço do ingresso" placeholder="45,00" inputMode="decimal" />
        <Campo
          id="total"
          rotulo="Ingressos à venda"
          placeholder="300"
          inputMode="numeric"
        />
      </div>

      {erro && <p className="t-desc text-pretty text-red">{erro}</p>}

      <Botao type="submit" variante={pendente ? 'desabilitado' : 'primario'}>
        {pendente ? 'Criando…' : 'Criar festa'}
      </Botao>

      <p className="t-meta text-pretty text-ink-3">
        O cartaz abre sem login, e cada ingresso vendido entra no livro-caixa
        como entrada, sem ninguém digitar nada.
      </p>
    </form>
  );
}

function Campo({
  id,
  rotulo,
  required = true,
  ...resto
}: { id: string; rotulo: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="t-rotulo mb-2 block text-ink-2">
        {rotulo}
      </label>
      <input
        id={id}
        name={id}
        required={required}
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
        titulo="Nova festa"
        subtitulo="O cartaz abre sem login e vende ingresso no link"
      />
      <CorpoTela respiroAbas className="pt-3.5">
        {children}
      </CorpoTela>
      <BarraAbas ativa="festas" slug={slug} pendencias={pendencias} />
    </Tela>
  );
}
