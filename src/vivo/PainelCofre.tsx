import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, Wallet, WifiOff } from 'lucide-react';

import { BarraProgresso } from '@/componentes/BarraProgresso';
import { BlocoBloqueio } from '@/componentes/BlocoBloqueio';
import { Botao } from '@/componentes/Botao';
import { Chip } from '@/componentes/Chip';
import { COR_DA_RUBRICA, type Rubrica } from '@/componentes/acentos';
import { IndicadorAssinaturas } from '@/componentes/IndicadorAssinaturas';
import { LinhaDetalhe, ListaDetalhes } from '@/componentes/LinhaDetalhe';
import { TileIcone } from '@/componentes/TileIcone';
import { formatBRL, formatComSinal, primeiroNome } from '@/lib/format';
import {
  ErroDaApi,
  assinarNoCofre,
  criarCofre as criarCofreNaRede,
  estadoDoCofre,
  executarSaida,
  levarPropostaAoCofre,
  type AlvoDoCofre,
} from '@/lib/api';

import { PassoTempo } from './PassoTempo';

/* ── O que o servidor entrega a este painel ─────────────────────────────── */

/**
 * Os três signatários do cofre, pelo lugar que ocupam na chave — não pelo papel
 * na diretoria. São as chaves de `SIGNER_*` no ambiente do servidor; o nome de
 * cada uma vem do banco, então quem assina na tela é quem consta na diretoria.
 */
export type Assento = 'tesoureira' | 'presidente' | 'conselho';

/** A proposta em reais. O valor em SOL é da rede; este é o do livro-caixa. */
export type PropostaDoPainel = {
  destino: string;
  chave: string;
  valorCentavos: number;
  rubrica: Rubrica;
};

type Situacao = {
  existe: boolean;
  /** Quando não existe, qual dos vazios é. Ver `Situacao` em `lib/api.ts`. */
  motivo?: string;
  status?: string;
  assinaturasFeitas?: number;
  assinaturasNecessarias?: number;
  assinaram?: Assento[];
  saldoCaixa?: number;
  transactionIndex?: string;
};

type Bloqueio = {
  assinaturasFeitas: number;
  assinaturasNecessarias: number;
  status: string;
  saldoCaixa: number;
  explorador?: string;
};

type Comprovante = {
  assinatura: string;
  explorador: string;
  saldoCaixa: number;
  saldoDestino: number;
};

type Fase = 'lendo' | 'pronto' | 'trabalhando' | 'bloqueado' | 'executado' | 'offline';

/**
 * O cofre de verdade, na tela.
 *
 * Fala com os Route Handlers e renderiza os mesmos componentes das pranchas:
 * o indicador de assinaturas com a contagem que veio da rede, a caixa de
 * bloqueio quando falta quórum, a linha do tempo enquanto executa e o
 * comprovante no fim.
 *
 * Todo o texto em reais — destino, valor, saldo, nomes — chega por props, do
 * Server Component que leu o banco sob RLS. Este componente não conhece dado
 * nenhum de mentira.
 *
 * O bloqueio nunca aparece como erro. `/api/executar` devolve 200 com o
 * estado, e só falha de rede cai no estado offline — são telas diferentes
 * porque são coisas diferentes.
 */
export function PainelCofre({
  proposta,
  nomes,
  saldoCentavos,
  associados,
  entidadeSlug,
  propostaId,
}: {
  proposta: PropostaDoPainel;
  nomes: Record<Assento, string>;
  saldoCentavos: number;
  associados: number;
  /** De qual entidade é o cofre. Ver `AlvoDoCofre` em `lib/api.ts`. */
  entidadeSlug: string;
  /** Qual proposta assinar e executar — a linha do banco, não a da rede. */
  propostaId: string;
}) {
  /*
   * `useMemo` e não um objeto solto: `lerSituacao` depende dele, e objeto novo
   * a cada render faria o efeito disparar sem parar — uma consulta à rede por
   * quadro.
   */
  const alvo: AlvoDoCofre = useMemo(
    () => ({ entidadeSlug, propostaId }),
    [entidadeSlug, propostaId],
  );
  const [fase, setFase] = useState<Fase>('lendo');
  const [situacao, setSituacao] = useState<Situacao>({ existe: false });
  const [bloqueio, setBloqueio] = useState<Bloqueio | null>(null);
  const [comprovante, setComprovante] = useState<Comprovante | null>(null);
  const [rotulo, setRotulo] = useState('');
  const [segundos, setSegundos] = useState(0);
  const [mensagemErro, setMensagemErro] = useState('');

  // Contador de segundos decorridos — real, não spinner. A prancha 6d pede
  // exatamente isso: o estudante precisa ver o tempo passar.
  const inicio = useRef(0);
  useEffect(() => {
    if (fase !== 'trabalhando') return;
    inicio.current = Date.now();
    setSegundos(0);
    const t = setInterval(
      () => setSegundos(Math.floor((Date.now() - inicio.current) / 1000)),
      250,
    );
    return () => clearInterval(t);
  }, [fase]);

  const lerSituacao = useCallback(async () => {
    try {
      setSituacao(await estadoDoCofre(alvo));
      setFase('pronto');
    } catch (e) {
      setFase('offline');
      setMensagemErro(
        e instanceof ErroDaApi && e.status === 0
          ? 'O celular está sem internet'
          : 'Não conseguimos ler o cofre agora.',
      );
    }
  }, [alvo]);

  useEffect(() => {
    void lerSituacao();
  }, [lerSituacao]);

  /**
   * Roda uma chamada da API mostrando a linha do tempo, e cai no estado
   * offline se a rede falhar. Devolve `null` quando falhou, para quem chamou
   * não seguir adiante com dado que não existe.
   */
  async function comEspera<T>(
    textoRotulo: string,
    executa: () => Promise<T>,
  ): Promise<T | null> {
    setRotulo(textoRotulo);
    setFase('trabalhando');
    setMensagemErro('');

    try {
      return await executa();
    } catch (e) {
      setFase('offline');
      setMensagemErro(
        e instanceof ErroDaApi && e.status === 0
          ? 'O celular está sem internet'
          : e instanceof ErroDaApi
            ? e.message
            : 'Não conseguimos falar com o cofre agora.',
      );
      return null;
    }
  }

  /**
   * Cria o cofre e já leva esta proposta para dentro dele.
   *
   * São dois passos no servidor — o cofre é da entidade, a proposta é da
   * linha —, mas um só para quem está na tela: cofre recém-criado sem a
   * proposta dentro deixaria o botão de assinar sem o que assinar, e a pessoa
   * teria de descobrir sozinha que falta um passo invisível.
   */
  async function criarCofre() {
    const d = await comEspera('Criando o cofre 2 de 3', async () => {
      await criarCofreNaRede(entidadeSlug);
      return levarPropostaAoCofre(alvo);
    });
    if (d) await lerSituacao();
  }

  /** O cofre já existe; falta esta proposta entrar nele. */
  async function registrarNoCofre() {
    const d = await comEspera('Registrando a saída no cofre', () =>
      levarPropostaAoCofre(alvo),
    );
    if (d) await lerSituacao();
  }

  async function assinar(assento: Assento) {
    const d = await comEspera(`Assinatura de ${nomes[assento]}`, () =>
      assinarNoCofre(assento, alvo),
    );
    if (!d) return;
    setSituacao({ ...d, existe: true });
    setBloqueio(null);
    setFase('pronto');
  }

  async function executar(assento: Assento) {
    const d = await comEspera('Enviando a saída', () =>
      executarSaida(assento, alvo),
    );
    if (!d) return;

    // Falta de quórum NÃO é erro: é a regra do cofre funcionando, e tem tela
    // própria. Só falha de rede cai no estado offline.
    if ('bloqueado' in d) {
      setBloqueio(d);
      setSituacao((s) => ({
        ...s,
        assinaturasFeitas: d.assinaturasFeitas,
        assinaturasNecessarias: d.assinaturasNecessarias,
        status: d.status,
      }));
      setFase('bloqueado');
      return;
    }

    setComprovante(d);
    setFase('executado');
  }

  /* ── Estados de tela ──────────────────────────────────────────────────── */

  if (fase === 'lendo') {
    return <Aviso>Lendo o cofre…</Aviso>;
  }

  if (fase === 'offline') {
    return (
      <div className="rounded-card bg-red-tint p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-[34px] flex-none items-center justify-center rounded-tile-sm bg-ground/30">
            <WifiOff size={18} strokeWidth={1.8} className="text-red" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="t-item text-ink">{mensagemErro}</h2>
            <p className="t-desc mt-[7px] text-pretty text-red-ink">
              Não conseguimos falar com o cofre agora. Nada foi perdido: nenhum
              valor saiu e sua assinatura pode ser enviada de novo.
            </p>
          </div>
        </div>
        <Botao className="mt-3.5" onClick={() => void lerSituacao()}>
          Tentar de novo
        </Botao>
      </div>
    );
  }

  /*
   * Dois vazios diferentes, dois botões diferentes.
   *
   * "Sem cofre" e "a proposta ainda não está no cofre" pareciam a mesma coisa
   * quando o cofre morava num arquivo — havia um só, e ele existia ou não.
   * Agora o cofre é da entidade e a proposta tem índice próprio na rede: dá
   * para ter cofre e uma proposta recém-criada que ainda não chegou nele.
   * Mostrar "criar cofre" nesse caso criaria um segundo cofre e mudaria de
   * lugar o dinheiro que já estava no primeiro.
   */
  if (!situacao.existe) {
    const foraDaRede = situacao.motivo === 'proposta fora da rede';

    return (
      <div className="rounded-card border border-line bg-surface p-4">
        <div className="t-rotulo text-ink-2">
          {foraDaRede ? 'Proposta fora do cofre' : 'Cofre não criado'}
        </div>
        <p className="t-desc mt-2 text-pretty text-ink-2">
          {foraDaRede
            ? 'Esta saída existe no livro, mas ainda não foi levada ao cofre. Sem isso ninguém consegue assinar.'
            : 'Nenhum cofre existe ainda na rede. Criar leva alguns segundos e já deixa esta saída esperando assinatura.'}
        </p>
        <Botao
          className="mt-3.5"
          onClick={() => void (foraDaRede ? registrarNoCofre() : criarCofre())}
        >
          {foraDaRede ? 'Registrar no cofre' : 'Criar cofre 2 de 3'}
        </Botao>
      </div>
    );
  }

  if (fase === 'trabalhando') {
    return (
      <LinhaDoTempo
        rotulo={rotulo}
        segundos={segundos}
        situacao={situacao}
        proposta={proposta}
        nomes={nomes}
      />
    );
  }

  if (fase === 'executado' && comprovante) {
    return (
      <Comprovante_
        dados={comprovante}
        proposta={proposta}
        nomes={nomes}
        saldoCentavos={saldoCentavos}
        associados={associados}
      />
    );
  }

  const feitas = situacao.assinaturasFeitas ?? 0;
  const necessarias = situacao.assinaturasNecessarias ?? 2;
  const assinaram = situacao.assinaram ?? [];
  const completo = feitas >= necessarias;

  return (
    <article className="rounded-card border border-line bg-surface-2 p-[15px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="t-item text-ink">{proposta.destino}</h2>
          <div className="num mt-1.5 text-[12.5px] leading-[1.3] font-normal text-ink-3">
            chave {proposta.chave}
          </div>
        </div>
        <div className="t-valor text-ink">
          {formatComSinal(proposta.valorCentavos, 'saida', { compacto: true })}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-[7px]">
        <Chip acento={COR_DA_RUBRICA[proposta.rubrica]}>{proposta.rubrica}</Chip>
        <span className="num t-meta text-ink-3">
          proposta #{situacao.transactionIndex} · {situacao.status}
        </span>
      </div>

      <div className="my-3.5 h-px bg-line" />

      <IndicadorAssinaturas
        assinaturas={assinaram.map((a) => ({ nome: nomes[a] }))}
        necessarias={necessarias}
      />

      {bloqueio && (
        <BlocoBloqueio className="mt-3.5">
          Falta a assinatura de {primeiroNome(nomes.presidente)} ou de{' '}
          {primeiroNome(nomes.conselho)}. Ao assinar, a saída é executada na
          hora.
          {bloqueio.explorador && (
            <>
              {' '}
              <a
                href={bloqueio.explorador}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Ver a tentativa recusada
              </a>
              .
            </>
          )}
        </BlocoBloqueio>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {!completo && (
          <>
            <Botao
              variante={bloqueio ? 'desabilitado' : 'primario'}
              onClick={() => void executar('tesoureira')}
            >
              {bloqueio ? 'Executar saída' : 'Assinar e executar'}
            </Botao>
            {feitas === 0 && (
              <Botao variante="secundario" onClick={() => void assinar('tesoureira')}>
                Assinar como {primeiroNome(nomes.tesoureira)}
              </Botao>
            )}
            {feitas > 0 && (
              <Botao variante="secundario" onClick={() => void assinar('presidente')}>
                Assinar como {primeiroNome(nomes.presidente)}
              </Botao>
            )}
          </>
        )}

        {completo && (
          <Botao onClick={() => void executar('presidente')}>
            Executar saída · quórum atingido
          </Botao>
        )}
      </div>

      {bloqueio && (
        <p className="t-meta mt-3 text-pretty text-ink-3">
          Nenhum valor saiu: o caixa segue com {bloqueio.saldoCaixa.toFixed(4)}{' '}
          SOL na devnet.
        </p>
      )}
    </article>
  );
}

/* ── Peças ──────────────────────────────────────────────────────────────── */

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <p className="t-desc text-ink-2">{children}</p>
    </div>
  );
}

function LinhaDoTempo({
  rotulo,
  segundos,
  situacao,
  proposta,
  nomes,
}: {
  rotulo: string;
  segundos: number;
  situacao: Situacao;
  proposta: PropostaDoPainel;
  nomes: Record<Assento, string>;
}) {
  const feitas = situacao.assinaturasFeitas ?? 0;
  const necessarias = situacao.assinaturasNecessarias ?? 2;

  return (
    <div className="flex flex-col gap-3.5">
      <div className="rounded-card border border-line bg-surface p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="t-rotulo text-ink-2">Valor da saída</div>
            <div className="t-ancora mt-[11px] text-ink">
              {formatComSinal(proposta.valorCentavos, 'saida')}
            </div>
          </div>
          <div className="text-right">
            <div className="num text-[20px] leading-none font-extrabold tracking-[-0.035em] text-amber">
              {segundos}s
            </div>
            <div className="mt-1.5 text-[10.5px] leading-none text-ink-3">
              decorridos
            </div>
          </div>
        </div>
        <BarraProgresso
          className="mt-3.5"
          valor={Math.min(90, 20 + segundos * 8)}
          acento="amber"
        />
        <div className="mt-[9px] text-[11.5px] leading-none text-ink-3">
          {rotulo} · normalmente 3 a 12 segundos
        </div>
      </div>

      <ol className="rounded-card border border-line bg-surface p-4">
        <PassoTempo
          estado={feitas >= 1 ? 'feito' : 'agora'}
          titulo="1ª assinatura registrada"
          detalhe={feitas >= 1 ? nomes.tesoureira : 'aguardando'}
        />
        <PassoTempo
          estado={feitas >= 2 ? 'feito' : feitas === 1 ? 'agora' : 'futuro'}
          titulo="2ª assinatura registrada"
          detalhe={
            feitas >= necessarias
              ? `${nomes.presidente} · quórum atingido`
              : 'aguardando o segundo signatário'
          }
          conectorGradiente={feitas >= 1}
        />
        <PassoTempo
          estado="agora"
          titulo="Enviando a saída"
          detalhe="Aguardando a confirmação da rede"
          progresso={Math.min(95, 30 + segundos * 7)}
        />
        <PassoTempo
          estado="futuro"
          titulo="Comprovante no livro-caixa"
          detalhe="Publicado automaticamente aos associados"
          ultimo
        />
      </ol>

      <p className="t-meta text-pretty text-ink-3">
        Pode fechar o app — avisamos ao terminar.
      </p>
    </div>
  );
}

function Comprovante_({
  dados,
  proposta,
  nomes,
  saldoCentavos,
  associados,
}: {
  dados: Comprovante;
  proposta: PropostaDoPainel;
  nomes: Record<Assento, string>;
  saldoCentavos: number;
  associados: number;
}) {
  const saldoDepois = saldoCentavos - proposta.valorCentavos;

  return (
    <div className="flex flex-col gap-[11px]">
      <article className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="border-b border-line p-4">
          <div className="t-rotulo text-ink-2">Comprovante de saída</div>
          <div className="t-ancora mt-[11px] text-ink">
            {formatComSinal(proposta.valorCentavos, 'saida')}
          </div>
          <div className="mt-[11px] flex items-center gap-[7px]">
            <Chip acento={COR_DA_RUBRICA[proposta.rubrica]}>{proposta.rubrica}</Chip>
            <Chip acento="green">Executada</Chip>
          </div>
        </div>

        <div className="border-b border-line px-4 py-3.5">
          <ListaDetalhes>
            <LinhaDetalhe rotulo="Destinatário">{proposta.destino}</LinhaDetalhe>
            <LinhaDetalhe rotulo="Chave" mono>
              {proposta.chave}
            </LinhaDetalhe>
            <LinhaDetalhe rotulo="Saldo após" destaque>
              {formatBRL(saldoDepois)}
            </LinhaDetalhe>
          </ListaDetalhes>
        </div>

        <div className="border-b border-line px-4 py-3.5">
          <div className="t-rotulo mb-3 text-ink-2">Assinaturas</div>
          <IndicadorAssinaturas
            assinaturas={[{ nome: nomes.tesoureira }, { nome: nomes.presidente }]}
            necessarias={2}
          />
        </div>

        <div className="px-4 py-3.5">
          <div className="t-rotulo text-ink-2">Referência da transação</div>
          <div className="mt-2 font-mono text-[12px] leading-[1.55] break-all text-ink">
            {dados.assinatura}
          </div>
          <a
            href={dados.explorador}
            target="_blank"
            rel="noreferrer"
            className="t-chip mt-2.5 inline-block text-blue"
          >
            Ver o comprovante na rede ›
          </a>
        </div>
      </article>

      <div className="flex items-center gap-[11px] rounded-card border border-line bg-surface px-3.5 py-[13px]">
        <TileIcone icone={Wallet} acento="blue" tamanho="md" />
        <div className="min-w-0 flex-1">
          <div className="t-item-sm text-ink">Caixa do cofre na devnet</div>
          <div className="num t-meta mt-[5px] text-ink-2">
            {dados.saldoCaixa.toFixed(4)} SOL · destino recebeu{' '}
            {dados.saldoDestino.toFixed(4)} SOL
          </div>
        </div>
      </div>

      {/* A tese do produto. */}
      <div className="flex items-center gap-[11px] rounded-card border border-green/30 bg-green-tint px-3.5 py-[13px]">
        <TileIcone icone={BookOpen} acento="green" tamanho="md" />
        <div className="min-w-0 flex-1">
          <div className="t-item-sm text-ink">Publicado no livro-caixa</div>
          <div className="t-meta mt-[5px] text-green-ink">
            Visível aos {associados} associados agora
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-green">
        <Check size={16} strokeWidth={2} aria-hidden />
        <span className="t-chip">Quórum de 2 de 3 cumprido</span>
      </div>
    </div>
  );
}
