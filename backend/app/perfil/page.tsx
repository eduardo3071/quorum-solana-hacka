import { redirect } from 'next/navigation';
import { Building2, Check, LogOut, User } from 'lucide-react';

import { BarraAbas } from '@/components/BarraAbas';
import { Botao } from '@/components/Botao';
import { Erro, Vazio } from '@/components/Estados';
import { Hero } from '@/components/Hero';
import { CorpoTela, Tela } from '@/components/Tela';
import { TileIcone } from '@/components/TileIcone';
import { sair } from '@/lib/acoes';
import {
  QUORUM,
  entidadePorSlug,
  nomeDoPapel,
  pendentes,
  signatarios,
  totais,
  usuarioAtual,
} from '@/lib/dados';
import { formatCompacto } from '@/lib/format';
import { criarClienteServidor } from '@/lib/supabase/server';

export const metadata = { title: 'Perfil · Quórum' };

/** 5e · Perfil e carteirinha, com os dados de quem está logado. */
export default async function Perfil() {
  const sessao = await usuarioAtual();
  if (!sessao?.user) redirect('/entrar?proxima=/perfil');

  const eu = sessao.membro;

  // Sessão válida sem membro: entrou com um e-mail que a diretoria não
  // cadastrou. Não é erro — é convite pendente.
  if (!eu || !sessao.entidadeId) {
    return (
      <Tela>
        <Hero titulo="Perfil" />
        <CorpoTela respiroAbas className="pt-3">
          <Vazio titulo="Você ainda não está em nenhuma entidade">
            Entrou como <strong>{sessao.user.email}</strong>, mas esse e-mail não
            consta na diretoria de nenhuma atlética. Peça para quem administra
            cadastrar você.
          </Vazio>
          <form action={sair}>
            <Botao type="submit" variante="secundario">
              Sair
            </Botao>
          </form>
        </CorpoTela>
        <BarraAbas ativa="perfil" slug="" />
      </Tela>
    );
  }

  const supabase = await criarClienteServidor();
  const { data: ent } = await supabase
    .from('entidades')
    .select('slug')
    .eq('id', sessao.entidadeId)
    .maybeSingle();
  const slug = ent?.slug ?? '';

  let entidade, soma, emAberto, diretoria;
  try {
    [entidade, soma, emAberto, diretoria] = await Promise.all([
      entidadePorSlug(slug),
      totais(sessao.entidadeId),
      pendentes(sessao.entidadeId),
      signatarios(sessao.entidadeId),
    ]);
  } catch (e) {
    console.error('[perfil] falha ao ler', e);
    return (
      <Tela>
        <Hero titulo="Perfil" />
        <CorpoTela respiroAbas>
          <Erro>Seus dados não carregaram. Tente recarregar em instantes.</Erro>
        </CorpoTela>
        <BarraAbas ativa="perfil" slug={slug} />
      </Tela>
    );
  }

  return (
    <Tela>
      <Hero titulo="Perfil" />

      <CorpoTela respiroAbas className="pt-3">
        <section className="flex-none rounded-card border border-line bg-surface">
          <div className="flex items-center gap-[13px] p-3.5">
            <div className="flex size-[52px] flex-none items-center justify-center rounded-full bg-blue text-[20px] leading-none font-extrabold text-ground">
              {eu.nome.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="t-secao text-ink">{eu.nome}</h2>
              <div className="mt-[5px] truncate text-[12px] leading-[1.3] text-ink-3">
                {eu.email ?? sessao.user.email}
              </div>
              <div className="mt-2 flex gap-[7px]">
                <span className="t-chip rounded-chip bg-blue-tint px-[7px] py-[5px] text-blue">
                  {nomeDoPapel[eu.papel]}
                </span>
                {eu.papel !== 'socio' && (
                  <span className="t-chip rounded-chip bg-green-tint px-[7px] py-[5px] text-green">
                    Assinante
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 border-t border-line">
            <Numero valor={formatCompacto(soma.saldo)} rotulo="Sob sua guarda" borda />
            <Numero valor={String(emAberto.length)} rotulo="Aguardando" borda />
            <Numero valor={`${QUORUM.de} de ${QUORUM.entre}`} rotulo="Quórum do cofre" />
          </div>
        </section>

        {/* Carteirinha — para mostrar na portaria da festa. */}
        <section
          className="flex-none overflow-hidden rounded-card p-4"
          style={{
            backgroundImage:
              'radial-gradient(64px 44px at 88% 16%,rgba(255,255,255,.16) 0 60%,transparent 61%),' +
              'radial-gradient(84px 54px at 8% 96%,rgba(255,255,255,.16) 0 60%,transparent 61%),' +
              'linear-gradient(160deg,#1E88E5,#29A3F5 52%,#1B7FD4)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="t-rotulo whitespace-nowrap text-white/80">
              {entidade?.nome} · {entidade?.universidade}
            </span>
            <span className="t-chip flex-none rounded-chip border border-white/30 bg-ground/32 px-2 py-[5px] text-white">
              Sócia
            </span>
          </div>

          <div className="mt-3.5 text-[22px] leading-[1.15] font-extrabold tracking-[-0.03em] text-white">
            {eu.nome}
          </div>
          <div className="mt-[5px] text-[12.5px] leading-[1.4] font-medium text-white/88">
            {nomeDoPapel[eu.papel]}
          </div>

          <div className="mt-3.5 rounded-tile-sm bg-ground/34 px-[11px] py-[9px] font-mono text-[11px] leading-none tracking-[0.02em] text-white/92">
            ref {eu.id.slice(0, 18)}
          </div>
        </section>

        <div className="flex flex-none flex-col gap-[9px]">
          <LinhaPerfil
            icone={Building2}
            acento="purple"
            titulo="Entidade"
            detalhe={`${entidade?.nome} · ${diretoria.length} signatários`}
          />
          <LinhaPerfil
            icone={Check}
            acento="green"
            titulo="Assinatura digital"
            detalhe={eu.papel === 'socio' ? 'Sócio não assina' : 'Ativa neste dispositivo'}
          />
          <LinhaPerfil
            icone={User}
            acento="blue"
            titulo="Dados pessoais"
            detalhe={eu.email ?? sessao.user.email ?? ''}
          />
        </div>

        <form action={sair} className="flex-none">
          <Botao type="submit" variante="secundario">
            <LogOut size={16} strokeWidth={1.8} aria-hidden />
            Sair
          </Botao>
        </form>

        <p className="my-0.5 text-center text-[11.5px] leading-none text-ink-3">
          Quórum v0.1
        </p>
      </CorpoTela>

      <BarraAbas ativa="perfil" slug={slug} pendencias={emAberto.length} />
    </Tela>
  );
}

function Numero({
  valor,
  rotulo,
  borda = false,
}: {
  valor: string;
  rotulo: string;
  borda?: boolean;
}) {
  return (
    <div className={`p-3 ${borda ? 'border-r border-line' : ''}`}>
      <div className="num text-[15px] leading-none font-extrabold tracking-[-0.03em] text-ink">
        {valor}
      </div>
      <div className="mt-1.5 text-[10.5px] leading-[1.3] text-ink-3">{rotulo}</div>
    </div>
  );
}

function LinhaPerfil({
  icone,
  acento,
  titulo,
  detalhe,
}: {
  icone: typeof User;
  acento: 'blue' | 'green' | 'purple';
  titulo: string;
  detalhe: string;
}) {
  return (
    <div className="flex min-h-[58px] items-center gap-[11px] rounded-[14px] border border-line bg-surface px-[13px] py-[11px]">
      <TileIcone icone={icone} acento={acento} tamanho="md" />
      {/*
        Sem seta. Estas linhas são informação, não navegação — o chevron
        prometia uma tela adiante que não existe, e promessa que não se cumpre
        é a primeira coisa em que alguém clica na apresentação.
      */}
      <div className="min-w-0 flex-1">
        <div className="t-item-sm text-ink">{titulo}</div>
        <div className="mt-[5px] truncate text-[11.5px] leading-[1.3] text-ink-3">
          {detalhe}
        </div>
      </div>
    </div>
  );
}
