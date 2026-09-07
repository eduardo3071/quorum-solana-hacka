import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';

/**
 * Atualiza a tela sozinha quando o banco muda.
 *
 * Duas pessoas assinando a mesma saída em dois aparelhos precisam ver a
 * contagem mudar sem recarregar nada; promover alguém à diretoria também tem de
 * refletir na hora em quem pode assinar. Assinatura dentro de `useEffect`, com
 * limpeza — canal solto no corpo do componente reconecta a cada render.
 */
export function useTempoReal(
  tabelas: string[],
  recarregar: () => void,
  ativo = true,
) {
  const chave = tabelas.join(',');

  useEffect(() => {
    if (!ativo) return;

    const canal = supabase.channel(`tempo-real:${chave}`);

    for (const tabela of chave.split(',')) {
      canal.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tabela },
        () => recarregar(),
      );
    }

    canal.subscribe();

    return () => {
      void supabase.removeChannel(canal);
    };
  }, [chave, recarregar, ativo]);
}
