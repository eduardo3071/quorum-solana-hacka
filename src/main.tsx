import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { faltaConfigurar } from '@/lib/supabase';
import { ProvedorDeSessao } from '@/lib/sessao';
import { FaltaConfigurar } from '@/telas/FaltaConfigurar';
import { Privada } from '@/telas/Privada';
import { Aprovacoes } from '@/telas/Aprovacoes';
import { Capa } from '@/telas/Capa';
import { Cofre } from '@/telas/Cofre';
import { Entrar } from '@/telas/Entrar';
import { Festa } from '@/telas/Festa';
import { Festas } from '@/telas/Festas';
import { Livro } from '@/telas/Livro';
import { NaoEncontrada } from '@/telas/NaoEncontrada';
import { Perfil } from '@/telas/Perfil';
import { Propor } from '@/telas/Propor';
import { Socios } from '@/telas/Socios';

import './globals.css';

/**
 * As rotas, iguais às do produto em Next.
 *
 * O livro-caixa e a página da festa ficam FORA de `Privada`: são a tese do
 * produto e abrem sem conta nenhuma. Trocar isso quebra o que o Quórum promete.
 */
const raiz = createRoot(document.getElementById('raiz')!);

// Sem credenciais, nenhuma tela tem o que mostrar — e uma página vazia não
// diz o que fazer. Esta diz.
if (faltaConfigurar) {
  raiz.render(
    <StrictMode>
      <FaltaConfigurar
        faltando={[
          // `supabase.ts` aceita dois nomes para cada uma. Nomear só um aqui
          // mandaria quem usa o outro procurar variável que já está preenchida.
          import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.VITE_PUBLIC_SUPABASE_URL
            ? ''
            : 'VITE_SUPABASE_URL',
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
          import.meta.env.VITE_SUPABASE_ANON_KEY
            ? ''
            : 'VITE_SUPABASE_PUBLISHABLE_KEY',
        ].filter(Boolean)}
      />
    </StrictMode>,
  );
} else {
  raiz.render(
  <StrictMode>
    <BrowserRouter>
      <ProvedorDeSessao>
        <Routes>
          <Route path="/" element={<Capa />} />
          <Route path="/entrar" element={<Entrar />} />

          {/* O link do e-mail volta aqui; o cliente troca o código por sessão
              sozinho e a tela só espera. */}
          <Route path="/auth/confirmar" element={<Navigate to="/" replace />} />

          <Route path="/e/:slug/livro" element={<Livro />} />
          <Route path="/f/:slug" element={<Festa />} />

          <Route element={<Privada />}>
            <Route path="/e/:slug" element={<Cofre />} />
            <Route path="/e/:slug/aprovacoes" element={<Aprovacoes />} />
            <Route path="/e/:slug/propor" element={<Propor />} />
            <Route path="/e/:slug/festas" element={<Festas />} />
            <Route path="/e/:slug/socios" element={<Socios />} />
            <Route path="/perfil" element={<Perfil />} />
          </Route>

          <Route path="*" element={<NaoEncontrada />} />
        </Routes>
      </ProvedorDeSessao>
    </BrowserRouter>
  </StrictMode>,
  );
}
