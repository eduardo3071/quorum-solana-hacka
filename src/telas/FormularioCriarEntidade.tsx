import { useEffect, useState } from 'react';

import {
  criarEntidade,
  ErroDaApi,
  verificarEndereco,
  vincularSessao,
  type TipoEntidade,
} from '@/lib/api';
import { paraSlug } from '@/lib/slug';
import { useSessao } from '@/lib/sessao';


/** A ordem é a da prancha, não a do banco. */
const TIPOS: { valor: TipoEntidade; rotulo: string }[] = [
  { valor: 'atletica', rotulo: 'Atlética' },
  { valor: 'ca', rotulo: 'Centro acadêmico' },
  { valor: 'ej', rotulo: 'Empresa júnior' },
  { valor: 'formatura', rotulo: 'Comissão de formatura' },
];

/**
 * Nasce uma entidade — e só isso.
 *
 * Este formulário já criou conta também: pedia e-mail e senha, e fundava a
 * entidade no mesmo envio. Duas coisas diferentes num botão só, e o preço
 * apareceu rápido: o e-mail digitado aqui vira o do primeiro signatário, então
 * uma letra trocada deixa a pessoa de fora da própria entidade. Aconteceu com
 * `…cardoso520@` contra `…cardosi520@`, e o fundador teve de PEDIR ENTRADA na
 * entidade que ele mesmo tinha criado.
 *
 * Agora exige sessão e usa o e-mail dela. Não há campo de e-mail porque não há
 * escolha a fazer: quem funda é quem está logado. Conta se faz em `/entrar`.
 */
export function FormularioCriarEntidade() {
  const sessao = useSessao();
  /** Quem funda é quem está logado. Não se digita, então não se erra. */
  const emailDaSessao = sessao.user?.email?.trim().toLowerCase() ?? null;

  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoEntidade>('atletica');
  const [universidade, setUniversidade] = useState('');

  /*
   * O endereço nasce do nome e acompanha o que se digita, até a pessoa mexer
   * nele — a partir daí é dela, e mudar o nome não o sobrescreve.
   */
  const [endereco, setEndereco] = useState('');
  const [enderecoEditado, setEnderecoEditado] = useState(false);
  const [situacao, setSituacao] = useState<
    | { estado: 'vazio' }
    | { estado: 'verificando' }
    | { estado: 'livre' }
    | { estado: 'recusado'; motivo: string }
  >({ estado: 'vazio' });

  useEffect(() => {
    if (!endereco) {
      setSituacao({ estado: 'vazio' });
      return;
    }
    setSituacao({ estado: 'verificando' });

    // Espera a pessoa parar de digitar; sem isso cada letra seria uma consulta.
    let atual = true;
    const espera = setTimeout(async () => {
      try {
        const r = await verificarEndereco(endereco);
        if (!atual) return;
        setSituacao(
          r.disponivel
            ? { estado: 'livre' }
            : { estado: 'recusado', motivo: r.motivo ?? 'Este endereço não está disponível.' },
        );
      } catch {
        // Sem resposta, não bloqueia: o servidor confere de novo ao criar.
        if (atual) setSituacao({ estado: 'vazio' });
      }
    }, 400);

    return () => {
      atual = false;
      clearTimeout(espera);
    };
  }, [endereco]);

  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();

    if (!emailDaSessao) {
      setErro('Entre na sua conta antes de criar uma entidade.');
      return;
    }
    if (nome.trim().length < 2) {
      setErro('Diga o nome da entidade.');
      return;
    }

    if (situacao.estado === 'recusado') {
      setErro(situacao.motivo);
      return;
    }

    setPendente(true);
    setErro(null);

    try {
      const criada = await criarEntidade({
        slug: endereco || undefined,
        nome: nome.trim(),
        tipo,
        universidade: universidade.trim(),
        email: emailDaSessao,
      });

      /*
       * A linha do primeiro signatário nasce com `user_id` nulo — o servidor
       * não conhece a sessão de quem chamou. `vincularSessao` casa as duas pelo
       * e-mail do token, e sem isso a pessoa acabava de fundar uma entidade e
       * caía em "você ainda não tem entidade".
       *
       * A ida é por `location.assign`, não pelo roteador, e de propósito: o
       * papel vem do contexto de sessão, já carregado e sem saber do vínculo
       * feito no instante anterior. Navegar por dentro entregaria a pessoa numa
       * rota privada com o contexto de antes. Fundar acontece uma vez; um
       * recarregamento é preço justo por acertar sempre.
       */
      try {
        await vincularSessao();
      } catch (falha) {
        console.error('[entidade] criada, vínculo adiado', falha);
      }
      window.location.assign(`/${criada.slug}`);
    } catch (e) {
      console.error('[entidade] falha ao criar', e);
      setErro(
        e instanceof ErroDaApi
          ? e.message
          : 'Não conseguimos criar a entidade agora. Tente de novo.',
      );
      setPendente(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <Campo rotulo="Nome da entidade" id="nome">
        <input
          id="nome"
          name="nome"
          required
          maxLength={80}
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            if (!enderecoEditado) setEndereco(paraSlug(e.target.value));
          }}
          placeholder="A.A.A. Engenharia"
          className={ESTILO_CAMPO}
        />
      </Campo>

      <div className="min-w-0">
        <label htmlFor="endereco" className="t-item-sm mb-2 block text-ink">
          Endereço da entidade
        </label>
        <div className="flex min-h-[52px] items-center gap-1 rounded-[14px] border border-white/12 bg-[#0A1526] px-3.5 focus-within:border-blue">
          <span aria-hidden className="num text-[13.5px] text-ink-3">
            /
          </span>
          <input
            id="endereco"
            name="endereco"
            maxLength={40}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={endereco}
            onChange={(e) => {
              setEnderecoEditado(true);
              setEndereco(paraSlug(e.target.value));
            }}
            placeholder="atletica-engenharia"
            aria-describedby="endereco-ajuda"
            className="num min-h-[50px] min-w-0 flex-1 bg-transparent py-3 text-[13.5px] font-medium text-ink placeholder:text-ink-3 focus:outline-none"
          />
        </div>
        <p
          id="endereco-ajuda"
          aria-live="polite"
          className={`t-meta mt-2 text-pretty ${
            situacao.estado === 'recusado'
              ? 'text-red'
              : situacao.estado === 'livre'
                ? 'text-green'
                : 'text-ink-3'
          }`}
        >
          {situacao.estado === 'recusado'
            ? situacao.motivo
            : situacao.estado === 'livre'
              ? 'Endereço disponível.'
              : situacao.estado === 'verificando'
                ? 'Conferindo o endereço…'
                : 'É o endereço do seu livro-caixa público.'}
        </p>
        {endereco && (
          <p className="t-meta mt-1 text-pretty break-words text-ink-3">
            Seu livro-caixa:{' '}
            <span className="num whitespace-nowrap">
              /{endereco}/livro-caixa
            </span>
          </p>
        )}
      </div>

      {/*
        `radiogroup` e não quatro botões soltos: para quem usa leitor de tela é
        uma escolha entre quatro, com a atual anunciada. Quatro <button> seriam
        quatro ações sem relação nenhuma entre si.
      */}
      <fieldset className="min-w-0">
        <legend className="t-item-sm mb-2 text-ink">Tipo</legend>
        <div className="flex flex-wrap gap-2">
          {TIPOS.map((t) => {
            const ativo = t.valor === tipo;
            return (
              <button
                key={t.valor}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => setTipo(t.valor)}
                className={`min-h-[44px] rounded-[13px] border px-2.5 py-2.5 text-[11.5px] font-semibold whitespace-nowrap ${
                  ativo
                    ? 'border-blue bg-[#0E2A48] text-ink'
                    : 'border-white/12 bg-[#0A1526] text-ink-2'
                }`}
              >
                {t.rotulo}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Campo rotulo="Universidade" id="universidade">
        <input
          id="universidade"
          name="universidade"
          maxLength={80}
          value={universidade}
          onChange={(e) => setUniversidade(e.target.value)}
          placeholder="UFSC"
          className={ESTILO_CAMPO}
        />
      </Campo>

      <div className="min-w-0">
        <div className="t-item-sm mb-2 text-ink">Seu e-mail</div>
        {/*
          Texto, não campo — nem sequer desabilitado. Campo cinza convida a
          tentar digitar e a descobrir que não dá. Aqui não há escolha a
          oferecer: a entidade nasce de quem está logado, e é justamente por
          não haver campo que a letra trocada deixa de ser possível.
        */}
        <p className="num rounded-[14px] border border-white/12 bg-[#0A1526] px-3.5 py-3 text-[13px] leading-[1.4] break-all text-ink-2">
          {emailDaSessao ?? 'entre na sua conta primeiro'}
        </p>
      </div>

      {erro && <p className="t-desc text-pretty text-red">{erro}</p>}

      {/*
        Degradê só aqui. É a única ação da tela que cria alguma coisa, e a
        prancha a distingue assim do "receber link", que é azul liso.
      */}
      <button
        type="submit"
        disabled={pendente}
        style={pendente ? undefined : { backgroundImage: 'linear-gradient(94deg,#22C7F5,#2E86F0)' }}
        className="min-h-[54px] rounded-[14px] px-4 text-[14.5px] font-bold text-ground disabled:bg-line disabled:text-ink-3"
      >
        {pendente ? 'Criando…' : 'Criar entidade →'}
      </button>

      <p className="t-meta text-center text-pretty text-ink-3">
        Você será o primeiro dos três signatários. Os outros dois entram por
        convite.
      </p>
    </form>
  );
}

const ESTILO_CAMPO =
  'min-h-[52px] w-full rounded-[14px] border border-white/12 bg-[#0A1526] px-3.5 py-3 text-[13.5px] font-medium text-ink placeholder:text-ink-3 focus:border-blue';

function Campo({
  rotulo,
  id,
  children,
}: {
  rotulo: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="t-item-sm mb-2 block text-ink">
        {rotulo}
      </label>
      {children}
    </div>
  );
}
