import { useState } from 'react';
import { Mail } from 'lucide-react';

import { Botao } from '@/componentes/Botao';
import { TileIcone } from '@/componentes/TileIcone';
import { criarEntidade, ErroDaApi, type TipoEntidade } from '@/lib/api';
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
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoEntidade>('atletica');
  const [universidade, setUniversidade] = useState('');
  const [email, setEmail] = useState('');

  const [pronto, setPronto] = useState<{ nome: string; email: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();

    const endereco = email.trim().toLowerCase();
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
                className={`min-h-[42px] rounded-btn border px-3 py-2.5 text-[12.5px] font-semibold whitespace-nowrap ${
                  ativo
                    ? 'border-blue bg-blue-tint text-ink'
                    : 'border-line bg-surface text-ink-2'
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

      <Campo rotulo="Seu e-mail" id="email-criar">
        <input
          id="email-criar"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@grad.ufsc.br"
          className={ESTILO_CAMPO}
        />
      </Campo>

      {erro && <p className="t-desc text-pretty text-red">{erro}</p>}

      <Botao type="submit" variante={pendente ? 'desabilitado' : 'primario'}>
        {pendente ? 'Criando…' : 'Criar entidade →'}
      </Botao>

      <p className="t-meta text-pretty text-ink-3">
        Você será o primeiro dos três signatários. Os outros dois entram por
        convite.
      </p>
    </form>
  );
}

const ESTILO_CAMPO =
  'w-full rounded-btn border border-line bg-surface px-3.5 py-[13px] text-[13px] font-medium text-ink placeholder:text-ink-3 focus:border-blue';

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
