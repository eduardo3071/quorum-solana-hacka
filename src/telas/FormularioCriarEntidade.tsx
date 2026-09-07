import { useState } from 'react';
import { Mail } from 'lucide-react';

import { CampoEmail } from '@/componentes/CampoEmail';
import { TileIcone } from '@/componentes/TileIcone';
import {
  criarEntidade,
  ErroDaApi,
  vincularSessao,
  type TipoEntidade,
} from '@/lib/api';
import { useSessao } from '@/lib/sessao';
import { supabase } from '@/lib/supabase';

/** A ordem é a da prancha, não a do banco. */
const TIPOS: { valor: TipoEntidade; rotulo: string }[] = [
  { valor: 'atletica', rotulo: 'Atlética' },
  { valor: 'ca', rotulo: 'Centro acadêmico' },
  { valor: 'ej', rotulo: 'Empresa júnior' },
  { valor: 'formatura', rotulo: 'Comissão de formatura' },
];

/**
 * Nasce uma entidade.
 *
 * Dois passos numa tela só: o servidor cria a entidade com quem preencheu como
 * primeiro signatário, e em seguida sai o link de acesso para o mesmo e-mail.
 * Se o segundo falhar, o primeiro já aconteceu — por isso a tela de sucesso
 * diz o que fazer nesse caso em vez de fingir que nada foi criado.
 */
export function FormularioCriarEntidade() {
  const sessao = useSessao();
  /*
   * Quem já entrou funda com o próprio e-mail, e não com um digitado.
   *
   * Não é conveniência: é a diferença entre criar a SUA entidade e criar uma
   * entidade para outra pessoa. O servidor cadastra como primeiro signatário
   * exatamente o endereço que chega aqui, e só o e-mail da sessão é comprovado.
   */
  const emailDaSessao = sessao.user?.email?.trim().toLowerCase() ?? null;

  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoEntidade>('atletica');
  const [universidade, setUniversidade] = useState('');
  const [email, setEmail] = useState('');

  const [pronto, setPronto] = useState<{ nome: string; email: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();

    const endereco = emailDaSessao ?? email.trim().toLowerCase();
    if (nome.trim().length < 2) {
      setErro('Diga o nome da entidade.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(endereco)) {
      setErro('Confira o e-mail — parece incompleto.');
      return;
    }

    setPendente(true);
    setErro(null);

    try {
      const criada = await criarEntidade({
        nome: nome.trim(),
        tipo,
        universidade: universidade.trim(),
        email: endereco,
      });

      /*
       * Com sessão aberta, não há link de e-mail a pedir: a pessoa já está
       * dentro. O que falta é casar a linha recém-criada — que nasce com
       * `user_id` nulo — com a sessão, e mostrar a entidade.
       *
       * A ida é por `location.assign`, não pelo roteador, e de propósito: o
       * papel vem do contexto de sessão, que já foi carregado e não sabe do
       * vínculo feito agora. Navegar por dentro entregaria a pessoa numa rota
       * privada com o contexto de antes — ou seja, de volta para "sem
       * entidade", que é o beco de onde ela veio. Fundar uma entidade acontece
       * uma vez na vida; um recarregamento é preço justo por acertar sempre.
       */
      if (emailDaSessao) {
        try {
          await vincularSessao();
        } catch (falha) {
          // O vínculo tenta de novo sozinho no próximo carregamento da sessão.
          console.error('[entidade] criada, vínculo adiado', falha);
        }
        window.location.assign(`/e/${criada.slug}`);
        return;
      }

      // O link volta para esta origem; o domínio precisa estar nos Redirect
      // URLs do painel do Supabase.
      const destino = new URL('/auth/confirmar', window.location.origin);
      destino.searchParams.set('proxima', `/e/${criada.slug}`);

      const { error } = await supabase.auth.signInWithOtp({
        email: endereco,
        options: { emailRedirectTo: destino.toString() },
      });

      if (error) console.error('[auth] entidade criada, link não saiu', error);

      setPronto({ nome: criada.nome, email: endereco });
    } catch (e) {
      console.error('[entidade] falha ao criar', e);
      setErro(
        e instanceof ErroDaApi
          ? e.message
          : 'Não conseguimos criar a entidade agora. Tente de novo.',
      );
    } finally {
      setPendente(false);
    }
  }

  if (pronto) {
    return (
      <div className="flex items-start gap-3 rounded-card border border-green/30 bg-green-tint p-4">
        <TileIcone icone={Mail} acento="green" tamanho="md" />
        <div className="min-w-0">
          <div className="t-item text-ink">{pronto.nome} está criada</div>
          <p className="t-desc mt-1.5 text-pretty text-green-ink">
            Abra o e-mail em <strong>{pronto.email}</strong> e toque no link para
            entrar como primeiro signatário. Se o link não chegar, peça outro na
            aba <strong>Entrar</strong> — a entidade já existe e espera por você.
          </p>
        </div>
      </div>
    );
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
          onChange={(e) => setNome(e.target.value)}
          placeholder="A.A.A. Engenharia"
          className={ESTILO_CAMPO}
        />
      </Campo>

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

      {emailDaSessao ? (
        <div className="min-w-0">
          <div className="t-item-sm mb-2 text-ink">Seu e-mail</div>
          {/*
            Texto, não campo desabilitado: campo cinza convida a tentar digitar
            e a descobrir que não dá. Aqui não há escolha a oferecer — a
            entidade nasce de quem está logado — então a tela informa em vez de
            simular uma decisão.
          */}
          <p className="num rounded-[14px] border border-white/12 bg-[#0A1526] px-3.5 py-3 text-[13px] leading-[1.4] break-all text-ink-2">
            {emailDaSessao}
          </p>
        </div>
      ) : (
        <CampoEmail id="email-criar" rotulo="Seu e-mail" valor={email} aoMudar={setEmail} />
      )}

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
