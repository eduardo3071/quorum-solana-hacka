'use client';

import { useActionState, useState } from 'react';

import { Botao } from '@/components/Botao';
import { Chip } from '@/components/Chip';
import { COR_DA_RUBRICA, type Rubrica } from '@/components/acentos';
import { proporSaida, type EstadoProposta } from '@/lib/acoes';

const RUBRICAS: Rubrica[] = ['Eventos', 'Marketing', 'Esporte', 'Associados'];

/**
 * Propor uma saída.
 *
 * O valor é digitado em reais e convertido para centavos **no servidor**, uma
 * vez só. Aqui ele é texto do começo ao fim: número de ponto flutuante no
 * caminho do dinheiro é como o centavo some.
 */
export function FormularioProposta({ slug }: { slug: string }) {
  const [estado, acao, pendente] = useActionState<EstadoProposta, FormData>(
    proporSaida,
    {},
  );
  const [rubrica, setRubrica] = useState<Rubrica>('Eventos');

  return (
    <form action={acao} className="flex flex-col gap-3">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="rubrica" value={rubrica} />

      <Campo
        id="destino"
        rotulo="Para quem"
        placeholder="Som Beira-Mar ME"
        autoComplete="off"
      />
      <Campo
        id="chave"
        rotulo="Chave do destinatário"
        placeholder="24.881.402/0001-77"
        autoComplete="off"
      />
      <Campo
        id="valor"
        rotulo="Valor"
        placeholder="840,00"
        inputMode="decimal"
        autoComplete="off"
      />

      <div>
        <div className="t-rotulo mb-2 text-ink-2">Rubrica</div>
        <div className="flex flex-wrap gap-[7px]">
          {RUBRICAS.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={r === rubrica}
              onClick={() => setRubrica(r)}
              className={`rounded-[9px] ${r === rubrica ? 'ring-2 ring-blue' : ''}`}
            >
              <Chip acento={COR_DA_RUBRICA[r]}>{r}</Chip>
            </button>
          ))}
        </div>
        <p className="t-meta mt-2 text-ink-3">
          Rubrica é a categoria contábil do lançamento, não a assinatura.
        </p>
      </div>

      {estado.erro && <p className="t-desc text-red">{estado.erro}</p>}

      <Botao type="submit" variante={pendente ? 'desabilitado' : 'primario'}>
        {pendente ? 'Registrando…' : 'Propor saída'}
      </Botao>

      <p className="t-meta text-pretty text-ink-3">
        A proposta nasce retida: nenhum valor sai do cofre enquanto não juntar
        duas assinaturas de três.
      </p>
    </form>
  );
}

function Campo({
  id,
  rotulo,
  ...resto
}: {
  id: string;
  rotulo: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="t-rotulo mb-2 block text-ink-2">
        {rotulo}
      </label>
      <input
        id={id}
        name={id}
        required
        className="w-full rounded-btn border border-line bg-surface px-3.5 py-[13px] text-[13px] font-medium text-ink placeholder:text-ink-3 focus:border-blue"
        {...resto}
      />
    </div>
  );
}
