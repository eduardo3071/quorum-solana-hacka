'use client';

import { useActionState } from 'react';
import { Mail } from 'lucide-react';

import { Botao } from '@/components/Botao';
import { TileIcone } from '@/components/TileIcone';
import { enviarLink, type EstadoEntrada } from '@/lib/acoes';

export function FormularioEntrada({
  aviso,
  rotuloOculto = false,
}: {
  aviso?: string;
  /**
   * Na capa o campo mora dentro de um cartão que já diz "acesso da diretoria",
   * e um segundo rótulo acima dele seria repetição. O `<label>` continua no
   * HTML — só sai da vista. Campo sem nome é campo mudo para leitor de tela.
   */
  rotuloOculto?: boolean;
}) {
  const [estado, acao, pendente] = useActionState<EstadoEntrada, FormData>(
    enviarLink,
    {},
  );

  if (estado.enviado) {
    return (
      <div className="flex items-start gap-3 rounded-card border border-green/30 bg-green-tint p-4">
        <TileIcone icone={Mail} acento="green" tamanho="md" />
        <div className="min-w-0">
          <div className="t-item text-ink">Link enviado</div>
          <p className="t-desc mt-1.5 text-pretty text-green-ink">
            Abra o e-mail em <strong>{estado.enviado}</strong> e toque no link.
            Ele vale por pouco tempo — se demorar, peça outro.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-3">
      <div>
        <label
          htmlFor="email"
          className={
            rotuloOculto ? 'sr-only' : 't-rotulo mb-2 block text-ink-2'
          }
        >
          Seu e-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="voce@grad.ufsc.br"
          /* Sem `outline-none`: a borda azul sozinha é 1px de diferença, e
             quem navega por teclado precisa enxergar onde está. O anel de
             foco global fica. */
          className="w-full rounded-btn border border-line bg-surface px-3.5 py-[13px] text-[13px] font-medium text-ink placeholder:text-ink-3 focus:border-blue"
        />
      </div>

      {(estado.erro || aviso) && (
        <p className="t-desc text-red">{estado.erro ?? aviso}</p>
      )}

      <Botao type="submit" variante={pendente ? 'desabilitado' : 'primario'}>
        {pendente ? 'Enviando…' : 'Receber link de acesso'}
      </Botao>

      <p className="t-meta text-pretty text-ink-3">
        Sem senha. Você recebe um link no e-mail e entra com um toque.
      </p>
    </form>
  );
}
