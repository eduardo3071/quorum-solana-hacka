import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { vincularSessao, type EntidadePendente } from '@/lib/api';
import type { Membro } from '@/lib/dados';

/**
 * Quem está logado, e qual o papel dele.
 *
 * A sessão vem do Supabase; o papel vem da tabela `membros`, casado pelo
 * `user_id`. Quem entra com um e-mail que a diretoria não cadastrou fica **sem
 * entidade** — não é erro, é convite pendente, e tem tela própria.
 *
 * O vínculo entre a sessão e a linha da diretoria é feito no servidor, pela
 * API, porque a política de `membros` não deixa o próprio usuário escrever — e
 * não deve mesmo. Aqui só lemos o resultado.
 */
export type Sessao = {
  carregando: boolean;
  user: User | null;
  membro: Membro | null;
  entidadeId: string | null;
  entidadeSlug: string | null;
  /**
   * O pedido de entrada em aberto, quando há um.
   *
   * Vem do servidor e não do banco porque não dá para vir do banco: a política
   * de `membros` mostra os colegas das entidades de que você faz parte, e um
   * pedido pendente ainda não faz parte de nenhuma. Quem pediu não enxerga nem
   * a própria linha — o que é a regra certa, e deixa a tela cega sem esta
   * resposta.
   */
  pendente: EntidadePendente | null;
};

const VAZIA: Sessao = {
  carregando: true,
  user: null,
  membro: null,
  entidadeId: null,
  entidadeSlug: null,
  pendente: null,
};

const Contexto = createContext<Sessao>(VAZIA);

export function ProvedorDeSessao({ children }: { children: React.ReactNode }) {
  const [sessao, setSessao] = useState<Sessao>(VAZIA);

  useEffect(() => {
    let vivo = true;

    /** A linha da diretoria desta sessão, ou nada. */
    async function lerMembro(userId: string) {
      const { data } = await supabase
        .from('membros')
        .select('id, nome, papel, email, ativo, entidade_id, entidades(slug)')
        .eq('user_id', userId)
        .eq('ativo', true)
        .maybeSingle();
      return data;
    }

    async function carregar(s: Session | null) {
      if (!vivo) return;

      if (!s?.user) {
        setSessao({ ...VAZIA, carregando: false });
        return;
      }

      let data = await lerMembro(s.user.id);
      if (!vivo) return;

      /*
       * Nada casado ainda? Pergunte ao servidor antes de desistir.
       *
       * A linha de `membros` nasce antes da sessão — cadastrada pela diretoria,
       * ou criada por quem fundou a entidade — e nasce com `user_id` nulo. É
       * este pedido que as une, e ele só pode acontecer no servidor: a política
       * de `membros` proíbe o próprio usuário de escrever, e proíbe com razão.
       *
       * Uma tentativa por carregamento, e falha silenciosa de propósito. Se a
       * API estiver fora do ar, o certo é cair na tela de "sem entidade" — que
       * é verdadeira, e tem saída — e não numa tela de erro que a pessoa não
       * pode resolver.
       */
      let pendente: EntidadePendente | null = null;

      if (!data) {
        try {
          const resposta = await vincularSessao();
          if (!vivo) return;
          pendente = resposta.pendente;
          if (resposta.vinculadas > 0) data = await lerMembro(s.user.id);
        } catch {
          // Segue para o estado sem entidade.
        }
        if (!vivo) return;
      }

      if (!data) {
        setSessao({
          carregando: false,
          user: s.user,
          membro: null,
          entidadeId: null,
          entidadeSlug: null,
          pendente,
        });
        return;
      }

      const { entidade_id, entidades, ...membro } = data as unknown as {
        entidade_id: string;
        entidades: { slug: string } | null;
      } & Membro;

      setSessao({
        carregando: false,
        user: s.user,
        membro: membro as Membro,
        entidadeId: entidade_id,
        entidadeSlug: entidades?.slug ?? null,
        pendente: null,
      });
    }

    supabase.auth.getSession().then(({ data }) => void carregar(data.session));

    // Recarrega quando entra, sai, ou quando o token é renovado — sem isso a
    // tela fica com o papel de antes depois de trocar de conta.
    const { data: inscricao } = supabase.auth.onAuthStateChange((_evento, s) => {
      void carregar(s);
    });

    return () => {
      vivo = false;
      inscricao.subscription.unsubscribe();
    };
  }, []);

  return <Contexto.Provider value={sessao}>{children}</Contexto.Provider>;
}

export const useSessao = () => useContext(Contexto);

export async function sair() {
  // Navega para /entrar aconteça o que acontecer: se a chamada de saída
  // falhar ou travar na rede, o botão não pode virar peso de papel — quem
  // quer sair precisa sair.
  try {
    await supabase.auth.signOut();
  } catch {
    // Sessão local já era; a saída visual acontece mesmo assim.
  } finally {
    window.location.assign('/entrar');
  }
}
