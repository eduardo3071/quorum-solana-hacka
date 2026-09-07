import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
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
};

const VAZIA: Sessao = {
  carregando: true,
  user: null,
  membro: null,
  entidadeId: null,
  entidadeSlug: null,
};

const Contexto = createContext<Sessao>(VAZIA);

export function ProvedorDeSessao({ children }: { children: React.ReactNode }) {
  const [sessao, setSessao] = useState<Sessao>(VAZIA);

  useEffect(() => {
    let vivo = true;

    async function carregar(s: Session | null) {
      if (!vivo) return;

      if (!s?.user) {
        setSessao({ ...VAZIA, carregando: false });
        return;
      }

      const { data } = await supabase
        .from('membros')
        .select('id, nome, papel, email, ativo, entidade_id, entidades(slug)')
        .eq('user_id', s.user.id)
        .eq('ativo', true)
        .maybeSingle();

      if (!vivo) return;

      if (!data) {
        setSessao({
          carregando: false,
          user: s.user,
          membro: null,
          entidadeId: null,
          entidadeSlug: null,
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
