-- 0008 · Fixa o search_path de vender_lote
--
-- O linter do Supabase aponta `function_search_path_mutable`. Aqui o risco é
-- pequeno, e vale dizer por quê em vez de só silenciar o aviso: a função NÃO é
-- SECURITY DEFINER (ver 0007), então roda com os privilégios de quem chama, e
-- quem chama é só a service role. Não há escalada a ganhar.
--
-- Ainda assim o search_path mutável é uma porta aberta sem motivo: um schema
-- na frente de `public` no caminho de busca faria `public.lotes` resolver para
-- outra tabela. Fixar custa uma linha e fecha a porta.
--
-- `pg_temp` vai por último de propósito: se viesse antes, uma tabela temporária
-- criada pelo chamador poderia se passar por `lotes`.

alter function public.vender_lote(uuid) set search_path = public, pg_temp;
