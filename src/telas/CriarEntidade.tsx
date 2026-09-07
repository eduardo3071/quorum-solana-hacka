import { Navigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Carregando } from '@/componentes/Estados';
import { Hero } from '@/componentes/Hero';
import { CorpoTela, Tela } from '@/componentes/Tela';
import { useSessao } from '@/lib/sessao';

import { FormularioCriarEntidade } from './FormularioCriarEntidade';

/**
 * Fundar uma entidade — depois de já ter conta.
 *
 * Ficou muito tempo como uma aba de `/entrar`, e ali misturava dois atos que
 * não são o mesmo: **fazer uma conta** e **fundar uma entidade**. Duas pessoas
 * diferentes fazem cada um deles, em momentos diferentes, e por muito tempo o
 * produto tratou os dois como um formulário só.
 *
 * O preço foi concreto. Como fundar pedia o e-mail digitado, e esse e-mail vira
 * o do primeiro signatário, uma letra trocada bastava para o fundador ficar de
 * fora da própria entidade. Aconteceu, e a pessoa teve de pedir entrada onde
 * ela era a dona.
 *
 * Aqui não há e-mail a digitar: exige sessão e usa a dela. Quem chega sem
 * sessão vai fazer conta primeiro e volta.
 */
export function CriarEntidade() {
  const sessao = useSessao();

  if (sessao.carregando) {
    return (
      <Tela>
        <Hero variante="blue" rotulo="Quórum" titulo="Criar uma entidade" />
        <CorpoTela className="pt-3.5">
          <Carregando linhas={4} />
        </CorpoTela>
      </Tela>
    );
  }

  // Conta primeiro. `proxima` traz a pessoa de volta para cá assim que entrar,
  // em vez de largá-la na capa tendo de reencontrar o caminho.
  if (!sessao.user) {
    return <Navigate to="/entrar?proxima=/criar-entidade" replace />;
  }

  // Quem já tem entidade não funda outra por engano — vai para a que tem.
  if (sessao.entidadeSlug) {
    return <Navigate to={`/e/${sessao.entidadeSlug}`} replace />;
  }

  return (
    <Tela>
      <Hero
        variante="blue"
        rotulo="Quórum"
        titulo="Criar uma entidade"
        subtitulo="Você entra como o primeiro dos três signatários"
      />

      <CorpoTela className="pt-3.5 pb-4">
        <FormularioCriarEntidade />

        <Link
          to="/"
          className="mt-auto flex min-h-[44px] items-center justify-center gap-1 text-[13.5px] font-semibold text-ink-2"
        >
          <ChevronLeft size={15} strokeWidth={2} aria-hidden />
          Voltar
        </Link>
      </CorpoTela>
    </Tela>
  );
}
