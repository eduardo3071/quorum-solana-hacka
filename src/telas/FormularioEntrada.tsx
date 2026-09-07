import { useState } from 'react';
import { Mail } from 'lucide-react';

import { CampoEmail } from '@/componentes/CampoEmail';
import { CampoSenha } from '@/componentes/CampoSenha';
import { TileIcone } from '@/componentes/TileIcone';
import { supabase } from '@/lib/supabase';

/**
 * Entrada por e-mail e senha.
 *
 * Sem link de acesso: a pessoa digita o que já sabe e entra. Quem nunca criou
 * senha usa "Criar minha senha" — a conta nasce ali e o e-mail de confirmação
 * fecha o ciclo, então ninguém entra com o endereço de outra pessoa.
 *
 * A tela nunca revela se um e-mail existe. Senha errada e e-mail inexistente
 * recebem a mesma frase — do contrário o formulário viraria um verificador de
 * quem é da diretoria.
 */
type Modo = 'entrar' | 'criar' | 'esqueci';

const VALIDO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function FormularioEntrada({
  aviso,
  rotulo = 'Seu e-mail',
  rotuloOculto = false,
  proxima,
}: {
  aviso?: string;
  /** O texto do rótulo. A prancha de entrar diz "E-mail institucional". */
  rotulo?: string;
  /**
   * Quando o campo mora dentro de um cartão que já se explica, um segundo
   * rótulo acima dele seria repetição. O `<label>` continua no HTML — só sai
   * da vista. Campo sem nome é campo mudo para leitor de tela.
   */
  rotuloOculto?: boolean;
  proxima?: string;
}) {
  const [modo, setModo] = useState<Modo>('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [feito, setFeito] = useState<{ titulo: string; texto: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const endereco = email.trim().toLowerCase();

    if (!VALIDO.test(endereco)) {
      setErro('Confira o e-mail — parece incompleto.');
      return;
    }
    if (modo !== 'esqueci' && senha.length < 8) {
      setErro('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }

    setPendente(true);
    setErro(null);

    try {
      if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({
          email: endereco,
          password: senha,
        });
        if (error) {
          console.error('[auth] falha ao entrar', error);
          setErro('E-mail ou senha não conferem.');
          return;
        }
        window.location.assign(proxima ?? '/');
        return;
      }

      if (modo === 'criar') {
        // O link de confirmação volta para esta origem. O domínio precisa
        // estar nos Redirect URLs do painel do Supabase.
        const destino = new URL('/auth/confirmar', window.location.origin);
        if (proxima) destino.searchParams.set('proxima', proxima);

        const { data, error } = await supabase.auth.signUp({
          email: endereco,
          password: senha,
          options: { emailRedirectTo: destino.toString() },
        });
        if (error) {
          console.error('[auth] falha ao criar a senha', error);
          setErro(
            error.message.toLowerCase().includes('already')
              ? 'Esse e-mail já tem senha. Use "Entrar" ou peça uma nova senha.'
              : 'Não conseguimos criar a senha agora. Tente de novo.',
          );
          return;
        }

        // Com confirmação de e-mail ligada, `signUp` não abre sessão: a pessoa
        // só entra depois de confirmar. Tratar isso como logado deixaria a
        // tela mentindo.
        if (data.session) {
          window.location.assign(proxima ?? '/');
          return;
        }
        setFeito({
          titulo: 'Confirme seu e-mail',
          texto: `Enviamos um e-mail para ${endereco}. Toque no link para confirmar e depois entre com sua senha.`,
        });
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(endereco, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      if (error) console.error('[auth] falha ao pedir nova senha', error);

      setFeito({
        titulo: 'Pedido enviado',
        texto: `Se existe conta com ${endereco}, o e-mail com o link para escolher uma nova senha já saiu.`,
      });
    } finally {
      setPendente(false);
    }
  }

  if (feito) {
    return (
      <div className="flex items-start gap-3 rounded-card border border-green/30 bg-green-tint p-4">
        <TileIcone icone={Mail} acento="green" tamanho="md" />
        <div className="min-w-0">
          <div className="t-item text-ink">{feito.titulo}</div>
          <p className="t-desc mt-1.5 text-pretty text-green-ink">{feito.texto}</p>
        </div>
      </div>
    );
  }

  const acao =
    modo === 'entrar' ? 'Entrar →' : modo === 'criar' ? 'Criar minha senha →' : 'Enviar link →';

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3.5">
      <CampoEmail
        id="email"
        rotulo={rotulo}
        rotuloOculto={rotuloOculto}
        valor={email}
        aoMudar={setEmail}
      />

      {modo !== 'esqueci' && (
        <CampoSenha
          id="senha"
          rotulo="Senha"
          valor={senha}
          aoMudar={setSenha}
          autoComplete={modo === 'criar' ? 'new-password' : 'current-password'}
          dica={modo === 'criar' ? 'Pelo menos 8 caracteres.' : undefined}
        />
      )}

      {(erro || aviso) && <p className="t-desc text-pretty text-red">{erro ?? aviso}</p>}

      <button
        type="submit"
        disabled={pendente}
        className="min-h-[54px] rounded-[14px] bg-blue px-4 text-[14.5px] font-bold text-ground disabled:bg-line disabled:text-ink-3"
      >
        {pendente ? 'Enviando…' : acao}
      </button>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {modo !== 'entrar' && (
          <Alternar ao={() => trocar('entrar')}>Já tenho senha</Alternar>
        )}
        {modo !== 'criar' && (
          <Alternar ao={() => trocar('criar')}>Primeiro acesso</Alternar>
        )}
        {modo !== 'esqueci' && (
          <Alternar ao={() => trocar('esqueci')}>Esqueci a senha</Alternar>
        )}
      </div>
    </form>
  );

  function trocar(novo: Modo) {
    setModo(novo);
    setErro(null);
    setSenha('');
  }
}

function Alternar({ ao, children }: { ao: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={ao}
      className="min-h-[38px] text-[12.5px] font-semibold whitespace-nowrap text-blue"
    >
      {children}
    </button>
  );
}
