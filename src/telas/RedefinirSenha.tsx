import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import { CampoSenha } from '@/componentes/CampoSenha';
import { TileIcone } from '@/componentes/TileIcone';
import { supabase } from '@/lib/supabase';

/**
 * A tela do link de "esqueci a senha".
 *
 * Precisa existir e precisa ser pública: sem ela, o link do e-mail abriria uma
 * sessão e mandaria a pessoa para dentro sem nunca ter trocado a senha — que é
 * exatamente o que ela veio fazer.
 *
 * Nesta página não se pede a senha atual: quem chega por link de recuperação
 * está aqui porque não a sabe.
 */
export function RedefinirSenha() {
  const [pronta, setPronta] = useState(false);
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);
  const [feito, setFeito] = useState(false);

  useEffect(() => {
    // O cliente troca o código do link por sessão sozinho; aqui só esperamos
    // que ela exista antes de deixar escolher a senha nova.
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) setPronta(true);
    });
    supabase.auth.getSession().then(({ data: d }) => {
      if (d.session) setPronta(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 8) {
      setErro('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }

    setPendente(true);
    setErro(null);

    const { error } = await supabase.auth.updateUser({ password: senha });
    setPendente(false);

    if (error) {
      console.error('[auth] falha ao trocar a senha', error);
      setErro('Não conseguimos salvar a senha. Peça outro link e tente de novo.');
      return;
    }
    setFeito(true);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col justify-center bg-ground px-[25px] py-8">
      <section className="rounded-[20px] border border-white/10 bg-[#0C1B33]/85 p-4">
        <div className="flex items-start gap-3">
          <TileIcone icone={KeyRound} acento="blue" tamanho="md" />
          <div className="min-w-0">
            <h1 className="t-item text-ink">Nova senha</h1>
            <p className="t-desc mt-1.5 text-pretty text-ink-2">
              Escolha a senha que você vai usar para entrar.
            </p>
          </div>
        </div>

        {feito ? (
          <p className="t-desc mt-4 text-pretty text-green-ink">
            Senha trocada. <Link to="/entrar" className="font-semibold text-blue">Entrar agora</Link>
          </p>
        ) : (
          <form onSubmit={enviar} className="mt-4 flex flex-col gap-3.5">
            <CampoSenha
              id="nova-senha"
              rotulo="Senha"
              valor={senha}
              aoMudar={setSenha}
              autoComplete="new-password"
              dica="Pelo menos 8 caracteres."
            />

            {erro && <p className="t-desc text-pretty text-red">{erro}</p>}

            <button
              type="submit"
              disabled={pendente || !pronta}
              className="min-h-[54px] rounded-[14px] bg-blue px-4 text-[14.5px] font-bold text-ground disabled:bg-line disabled:text-ink-3"
            >
              {pendente ? 'Salvando…' : pronta ? 'Salvar senha →' : 'Abrindo o link…'}
            </button>

            <Link to="/entrar" className="t-meta min-h-[38px] text-center text-ink-3">
              Voltar para entrar
            </Link>
          </form>
        )}
      </section>
    </main>
  );
}
