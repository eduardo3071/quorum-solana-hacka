import { useState } from 'react';
import { Mail } from 'lucide-react';

import { Botao } from '@/componentes/Botao';
import { TileIcone } from '@/componentes/TileIcone';
import { supabase } from '@/lib/supabase';

/**
 * Entrada por link no e-mail.
 *
 * Sem senha: ninguém vai criar senha para entrar no app da atlética. E sem
 * revelar se o e-mail existe — responder "não encontrado" transformaria o
 * formulário num verificador de quem é da diretoria.
 */
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
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const endereco = email.trim().toLowerCase();

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(endereco)) {
      setErro('Confira o e-mail — parece incompleto.');
      return;
    }

    setPendente(true);
    setErro(null);

    // O link volta para a origem desta página. O domínio precisa estar nos
    // Redirect URLs do painel do Supabase, senão o Supabase recusa e manda a
    // pessoa para o Site URL — que costuma ser outro lugar.
    const destino = new URL('/auth/confirmar', window.location.origin);
    if (proxima) destino.searchParams.set('proxima', proxima);

    const { error } = await supabase.auth.signInWithOtp({
      email: endereco,
      options: { emailRedirectTo: destino.toString() },
    });

    setPendente(false);

    if (error) {
      console.error('[auth] falha ao enviar o link', error);
      setErro('Não conseguimos enviar o link agora. Tente de novo.');
      return;
    }
    setEnviado(endereco);
  }

  if (enviado) {
    return (
      <div className="flex items-start gap-3 rounded-card border border-green/30 bg-green-tint p-4">
        <TileIcone icone={Mail} acento="green" tamanho="md" />
        <div className="min-w-0">
          <div className="t-item text-ink">Link enviado</div>
          <p className="t-desc mt-1.5 text-pretty text-green-ink">
            Abra o e-mail em <strong>{enviado}</strong> e toque no link. Ele vale
            por pouco tempo — se demorar, peça outro.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3">
      <div>
        <label
          htmlFor="email"
          className={rotuloOculto ? 'sr-only' : 't-item-sm mb-2 block text-ink'}
        >
          {rotulo}
        </label>
        {/*
          Sem `outline-none`: a borda azul sozinha é 1px de diferença, e quem
          navega por teclado precisa enxergar onde está. O anel de foco global
          fica.
        */}
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@grad.ufsc.br"
          className="w-full rounded-btn border border-line bg-surface px-3.5 py-[13px] text-[13px] font-medium text-ink placeholder:text-ink-3 focus:border-blue"
        />
      </div>

      {(erro || aviso) && <p className="t-desc text-red">{erro ?? aviso}</p>}

      <Botao type="submit" variante={pendente ? 'desabilitado' : 'primario'}>
        {pendente ? 'Enviando…' : 'Receber link de acesso →'}
      </Botao>

      <p className="t-meta text-pretty text-ink-3">
        Sem senha. Você recebe um link no e-mail e entra com um toque.
      </p>
    </form>
  );
}
