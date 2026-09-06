import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { Carregando } from '@/componentes/Estados';
import { CorpoTela, Tela } from '@/componentes/Tela';
import { Hero } from '@/componentes/Hero';
import { useSessao } from '@/lib/sessao';

/**
 * O portão das telas privadas.
 *
 * Conveniência de navegação, não medida de segurança: quem protege os dados é a
 * política do banco, e ela vale mesmo que alguém burle esta linha. Sem o
 * portão, o visitante veria telas vazias em vez de ser mandado para a entrada.
 *
 * Enquanto a sessão carrega, esqueleto — nunca redirecionar antes de saber, ou
 * quem está logado é expulso a cada recarga de página.
 */
export function Privada() {
  const sessao = useSessao();
  const local = useLocation();

  if (sessao.carregando) {
    return (
      <Tela>
        <Hero titulo="Quórum" />
        <CorpoTela>
          <Carregando linhas={4} />
        </CorpoTela>
      </Tela>
    );
  }

  if (!sessao.user) {
    return (
      <Navigate
        to={`/entrar?proxima=${encodeURIComponent(local.pathname + local.search)}`}
        replace
      />
    );
  }

  return <Outlet />;
}
