import { useRef, useState } from 'react';
import { Building2, Camera, Check, LogOut, Pencil, User } from 'lucide-react';

import { BarraAbas } from '@/componentes/BarraAbas';
import { Botao } from '@/componentes/Botao';
import { Carregando, Erro, Vazio } from '@/componentes/Estados';
import { Hero } from '@/componentes/Hero';
import { CorpoTela, Tela } from '@/componentes/Tela';
import { TileIcone } from '@/componentes/TileIcone';
import {
  QUORUM,
  atualizarMeuPerfil,
  entidadePorSlug,
  lancamentos,
  nomeDoPapel,
  pendentes,
  propostas,
  signatarios,
  totais,
} from '@/lib/dados';
import { formatCompacto } from '@/lib/format';
import { retratoReduzido } from '@/lib/imagem';
import { sair, useSessao } from '@/lib/sessao';
import { useConsulta } from '@/lib/useConsulta';

/** Os campos que a própria pessoa edita. Papel e vínculo não estão aqui. */
type Pessoais = { nome: string; curso: string; periodo: string; foto: string };

/** 5e · Perfil e carteirinha, com os dados de quem está logado. */
export function Perfil() {
  const sessao = useSessao();
  const eu = sessao.membro;
  const slug = sessao.entidadeSlug ?? '';

  /*
   * Os dados pessoais vivem aqui depois de salvos.
   *
   * A sessão só relê a linha da diretoria quando o token muda, e recarregar a
   * página inteira para ver o próprio nome novo é resposta grosseira. Então a
   * tela guarda o que acabou de salvar e mostra isso.
   */
  const [salvos, setSalvos] = useState<Pessoais | null>(null);
  const [editando, setEditando] = useState(false);

  const { dados, carregando, erro } = useConsulta(
    async () => {
      const entidade = await entidadePorSlug(slug);
      if (!entidade) return null;

      const [linhas, lista, diretoria] = await Promise.all([
        lancamentos(entidade.id),
        propostas(entidade.id),
        signatarios(entidade.id),
      ]);
      return {
        entidade,
        soma: totais(linhas),
        emAberto: pendentes(lista),
        diretoria,
      };
    },
    [slug],
    { pular: !slug },
  );

  // Sessão válida sem membro: entrou com um e-mail que a diretoria não
  // cadastrou. Não é erro — é convite pendente.
  if (!eu || !slug) {
    return (
      <Tela>
        <Hero titulo="Perfil" />
        <CorpoTela respiroAbas className="pt-3">
          <Vazio titulo="Você ainda não está em nenhuma entidade">
            Entrou como <strong>{sessao.user?.email}</strong>, mas esse e-mail
            não consta na diretoria de nenhuma atlética. Peça para quem
            administra cadastrar você.
          </Vazio>
          <Botao variante="secundario" onClick={() => void sair()}>
            Sair
          </Botao>
        </CorpoTela>
        <BarraAbas ativa="perfil" slug="" />
      </Tela>
    );
  }

  if (erro) {
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

  if (carregando || !dados) {
    return (
      <Tela>
        <Hero titulo="Perfil" />
        <CorpoTela respiroAbas>
          <Carregando linhas={4} />
        </CorpoTela>
        <BarraAbas ativa="perfil" slug={slug} />
      </Tela>
    );
  }

  const { entidade, soma, emAberto, diretoria } = dados;

  const atual: Pessoais = salvos ?? {
    nome: eu.nome,
    curso: eu.curso ?? '',
    periodo: eu.periodo ?? '',
    foto: eu.foto_url ?? '',
  };

  const linhaCurso = [atual.curso, atual.periodo].filter(Boolean).join(' · ');

  return (
    <Tela>
      <Hero titulo="Perfil" />

      <CorpoTela respiroAbas className="pt-3">
        <section className="flex-none rounded-card border border-line bg-surface">
          <div className="flex items-center gap-[13px] p-3.5">
            <Retrato nome={atual.nome} foto={atual.foto} />
            <div className="min-w-0 flex-1">
              <h2 className="t-secao text-ink">{atual.nome}</h2>
              <div className="mt-[5px] truncate text-[12px] leading-[1.3] text-ink-3">
                {eu.email ?? sessao.user?.email}
              </div>
              {linhaCurso && (
                <div className="mt-[3px] truncate text-[12px] leading-[1.3] text-ink-2">
                  {linhaCurso}
                </div>
              )}
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

        {editando ? (
          <FormularioPessoais
            inicial={atual}
            aoCancelar={() => setEditando(false)}
            aoSalvar={(novo) => {
              setSalvos(novo);
              setEditando(false);
            }}
          />
        ) : (
          <div className="flex-none">
            <Botao variante="secundario" onClick={() => setEditando(true)}>
              <Pencil size={16} strokeWidth={1.8} aria-hidden />
              Editar dados pessoais
            </Botao>
          </div>
        )}

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
              {entidade.nome} · {entidade.universidade}
            </span>
            <span className="t-chip flex-none rounded-chip border border-white/30 bg-ground/32 px-2 py-[5px] text-white">
              Sócia
            </span>
          </div>

          <div className="mt-3.5 flex items-center gap-3">
            {atual.foto && (
              <img
                src={atual.foto}
                alt=""
                className="size-[46px] flex-none rounded-full border border-white/40 object-cover"
              />
            )}
            <div className="min-w-0">
              <div className="text-[22px] leading-[1.15] font-extrabold tracking-[-0.03em] text-white">
                {atual.nome}
              </div>
              <div className="mt-[5px] text-[12.5px] leading-[1.4] font-medium text-white/88">
                {linhaCurso ? `${nomeDoPapel[eu.papel]} · ${linhaCurso}` : nomeDoPapel[eu.papel]}
              </div>
            </div>
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
            detalhe={`${entidade.nome} · ${diretoria.length} signatários`}
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
            detalhe={
              linhaCurso
                ? `${linhaCurso} · ${eu.email ?? sessao.user?.email ?? ''}`
                : (eu.email ?? sessao.user?.email ?? 'Curso e período em branco')
            }
          />
        </div>

        <div className="flex-none">
          <Botao variante="secundario" onClick={() => void sair()}>
            <LogOut size={16} strokeWidth={1.8} aria-hidden />
            Sair
          </Botao>
        </div>

        <p className="my-0.5 text-center text-[11.5px] leading-none text-ink-3">
          Quórum v0.1
        </p>
      </CorpoTela>

      <BarraAbas ativa="perfil" slug={slug} pendencias={emAberto.length} />
    </Tela>
  );
}

/** Retrato circular: a foto quando existe, a inicial quando não. */
function Retrato({ nome, foto }: { nome: string; foto: string }) {
  if (foto) {
    return (
      <img
        src={foto}
        alt={`Retrato de ${nome}`}
        className="size-[52px] flex-none rounded-full border border-line object-cover"
      />
    );
  }

  return (
    <div className="flex size-[52px] flex-none items-center justify-center rounded-full bg-blue text-[20px] leading-none font-extrabold text-ground">
      {nome.charAt(0)}
    </div>
  );
}

function FormularioPessoais({
  inicial,
  aoSalvar,
  aoCancelar,
}: {
  inicial: Pessoais;
  aoSalvar: (dados: Pessoais) => void;
  aoCancelar: () => void;
}) {
  const [nome, setNome] = useState(inicial.nome);
  const [curso, setCurso] = useState(inicial.curso);
  const [periodo, setPeriodo] = useState(inicial.periodo);
  const [foto, setFoto] = useState(inicial.foto);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const campoFoto = useRef<HTMLInputElement>(null);

  async function escolherFoto(arquivo: File | undefined) {
    if (!arquivo) return;
    setAviso(null);
    try {
      setFoto(await retratoReduzido(arquivo));
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não deu para usar essa imagem.');
    }
  }

  async function salvar() {
    const limpo = nome.trim();
    if (!limpo) {
      setAviso('O nome não pode ficar em branco.');
      return;
    }

    setSalvando(true);
    setAviso(null);
    try {
      await atualizarMeuPerfil({
        nome: limpo,
        curso: curso.trim(),
        periodo: periodo.trim(),
        foto_url: foto,
      });
      aoSalvar({ nome: limpo, curso: curso.trim(), periodo: periodo.trim(), foto });
    } catch {
      setAviso('Não conseguimos salvar agora. Tente de novo em instantes.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="flex-none rounded-card border border-line bg-surface p-3.5">
      <h3 className="t-secao text-ink">Dados pessoais</h3>

      <div className="mt-3.5 flex items-center gap-[13px]">
        <Retrato nome={nome || '?'} foto={foto} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <button
            type="button"
            onClick={() => campoFoto.current?.click()}
            className="flex items-center gap-2 self-start rounded-chip border border-line px-[11px] py-2 text-[12px] leading-none font-bold text-blue"
          >
            <Camera size={15} strokeWidth={1.8} aria-hidden />
            {foto ? 'Trocar foto' : 'Escolher foto'}
          </button>
          {foto && (
            <button
              type="button"
              onClick={() => setFoto('')}
              className="self-start text-[11.5px] leading-none text-ink-3"
            >
              Remover foto
            </button>
          )}
        </div>
        <input
          ref={campoFoto}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void escolherFoto(e.target.files?.[0])}
        />
      </div>

      <div className="mt-3.5 flex flex-col gap-[11px]">
        <Campo rotulo="Nome" valor={nome} aoMudar={setNome} exemplo="Marina Alves" />
        <Campo
          rotulo="Curso"
          valor={curso}
          aoMudar={setCurso}
          exemplo="Medicina"
        />
        <Campo
          rotulo="Período"
          valor={periodo}
          aoMudar={setPeriodo}
          exemplo="5º período"
        />
      </div>

      {aviso && (
        <p className="mt-3 text-[12px] leading-[1.4] text-red">{aviso}</p>
      )}

      <div className="mt-3.5 flex flex-col gap-[9px]">
        <Botao
          variante={salvando ? 'desabilitado' : 'primario'}
          onClick={() => void salvar()}
        >
          {salvando ? 'Salvando…' : 'Salvar'}
        </Botao>
        <Botao variante="secundario" onClick={aoCancelar}>
          Cancelar
        </Botao>
      </div>
    </section>
  );
}

function Campo({
  rotulo,
  valor,
  aoMudar,
  exemplo,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  exemplo: string;
}) {
  return (
    <label className="block">
      <span className="t-rotulo text-ink-3">{rotulo}</span>
      <input
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={exemplo}
        className="mt-1.5 block w-full rounded-tile-sm border border-line bg-surface-2 px-[13px] py-[12px] text-[13px] leading-none text-ink placeholder:text-ink-3 focus:border-blue focus:outline-none"
      />
    </label>
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
        prometia uma tela adiante que não existe, e promessa que não se cumpre é
        a primeira coisa em que alguém clica na apresentação.
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
