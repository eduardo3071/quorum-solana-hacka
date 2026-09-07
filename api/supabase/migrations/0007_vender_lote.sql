-- 0007 · Um a menos no lote, atomicamente
--
-- Aplicada no projeto como 20260905..._vender_lote_incremento_atomico.
--
-- Corrige a conciliação da 0004/B7, que recontava `vendidos` a partir das
-- linhas de `ingressos`. Duas coisas quebravam:
--
-- 1. O cartaz do evento parte de um número que veio da gestão anterior — "2º
--    lote · sócio, restam 48 de 300" são 252 vendidos, e não existem 252 linhas
--    de ingresso no banco novo. A primeira compra de verdade recontava e o
--    cartaz caía para "restam 299". Somar um preserva o que já estava lá;
--    recontar apaga.
-- 2. Duas compras simultâneas liam o mesmo valor e gravavam o mesmo total, e
--    uma das duas sumia.
--
-- `vendidos = vendidos + 1` dentro do próprio UPDATE resolve os dois: o valor
-- lido e o gravado são a mesma operação, sem janela entre eles. O `and vendidos
-- < total` recusa a venda do lote cheio no banco — devolve nenhuma linha, e
-- quem chamou sabe que não vendeu.
--
-- Sem SECURITY DEFINER: quem chama é a service role, que já ignora RLS. Função
-- definer que ninguém precisa é só superfície de ataque a mais.

create or replace function public.vender_lote(p_lote uuid)
returns integer
language sql
volatile
as $$
  update public.lotes
     set vendidos = vendidos + 1
   where id = p_lote
     and vendidos < total
  returning vendidos;
$$;

revoke all on function public.vender_lote(uuid) from public, anon, authenticated;
grant execute on function public.vender_lote(uuid) to service_role;
