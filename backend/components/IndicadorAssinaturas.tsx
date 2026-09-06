import { Plus } from 'lucide-react';

import { iniciais, primeiroNome } from '@/lib/format';

import { TEXTO_ACENTO, type Acento } from './acentos';
import { BarraProgresso } from './BarraProgresso';

export type Assinatura = {
  nome: string;
  /** "18:12" — quando assinou. */
  hora?: string;
};

/**
 * O componente mais importante do produto.
 *
 * Avatares quadrados de 36px com iniciais. Assinado: fundo verde tingido,
 * texto verde. Faltando: contorno tracejado e um "+". Ao lado, a contagem em
 * 700 na cor do estado, e a linha de quem assinou abaixo. Barra de progresso.
 *
 * Três variantes, derivadas da contagem — não há prop de estado a errar:
 *   0 de 2    neutro, cinza
 *   1 de 2    âmbar, 50%
 *   completo  verde, 100%, "Quórum completo · 2 de 2"
 *
 * O avatar de quem assinou é verde porque verde é confirmação. Nunca vermelho:
 * vermelho não é pessoa.
 */
export function IndicadorAssinaturas({
  assinaturas,
  necessarias,
  legenda,
  total,
  titulo: tituloDado,
  barra = true,
}: {
  assinaturas: Assinatura[];
  necessarias: number;
  /** Sobrescreve a linha de baixo. Sem isso, é derivada de quem assinou. */
  legenda?: React.ReactNode;
  /**
   * Quantos avatares desenhar. Por padrão, um por assinatura necessária — que é
   * como as pranchas 5b e 6c mostram.
   *
   * A capa usa `total = 3` para desenhar os três signatários do cofre com duas
   * assinaturas dadas: lá o que se explica é a regra ("duas de três"), e não o
   * andamento de uma proposta.
   */
  total?: number;
  /** Sobrescreve a contagem em negrito. */
  titulo?: string;
  /**
   * A barra de progresso. Some na capa: lá o indicador ilustra a regra, e não
   * o andamento de uma proposta — uma barra cheia sugeriria que algo terminou.
   */
  barra?: boolean;
}) {
  const feitas = Math.min(assinaturas.length, necessarias);
  const completo = feitas >= necessarias;
  const nenhuma = feitas === 0;
  const casas = total ?? necessarias;

  const acento: Acento = completo ? 'green' : 'amber';
  const corDoTitulo = nenhuma ? 'text-ink-2' : TEXTO_ACENTO[acento];

  const titulo =
    tituloDado ??
    (completo
      ? `Quórum completo · ${feitas} de ${necessarias}`
      : `${feitas} de ${necessarias} assinaturas`);

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex flex-none gap-[7px]">
          {Array.from({ length: casas }, (_, i) => {
            const assinatura = assinaturas[i];
            return assinatura ? (
              <div
                key={i}
                className="flex size-9 items-center justify-center rounded-avatar bg-green-tint text-[12.5px] leading-none font-bold text-green"
                title={assinatura.nome}
              >
                {iniciais(assinatura.nome)}
              </div>
            ) : (
              <div
                key={i}
                className="flex size-9 items-center justify-center rounded-avatar border-[1.5px] border-dashed border-dash"
                aria-label="assinatura pendente"
              >
                <Plus
                  size={16}
                  strokeWidth={1.7}
                  className="text-ink-3"
                  aria-hidden
                />
              </div>
            );
          })}
        </div>

        <div className="min-w-0 flex-1">
          <div className={`num text-[13px] leading-[1.2] font-bold ${corDoTitulo}`}>
            {titulo}
          </div>
          <div className="mt-[5px] text-[12.5px] leading-[1.3] font-normal text-ink-2">
            {legenda ?? legendaPadrao(assinaturas, nenhuma)}
          </div>
        </div>
      </div>

      {barra && (
        <BarraProgresso
          className="mt-[13px]"
          valor={(feitas / necessarias) * 100}
          acento={acento}
          neutro={nenhuma}
        />
      )}
    </div>
  );
}

function legendaPadrao(assinaturas: Assinatura[], nenhuma: boolean): string {
  if (nenhuma) return 'Ninguém assinou ainda';

  if (assinaturas.length === 1) {
    const [a] = assinaturas;
    return a.hora ? `${a.nome} assinou às ${a.hora}` : `${a.nome} assinou`;
  }

  // Com dois ou mais, o nome cheio estoura a largura — só o primeiro nome.
  return assinaturas.map((a) => primeiroNome(a.nome)).join(' e ');
}
