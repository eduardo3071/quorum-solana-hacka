-- 0006 · E-mail sempre em minúsculas, e o vínculo sai do PostgREST
--
-- Aplicada no projeto como 20260905..._email_em_minusculas_e_vinculo_no_servidor.
--
-- Duas correções da 0003, que estava errada de um jeito silencioso.
--
-- 1. `privado.vincular_membro()` nunca era executada. O schema `privado` existe
--    justamente para não ser publicado pelo PostgREST (foi o que a 0002 fez
--    para tirar as funções SECURITY DEFINER de /rest/v1/rpc/), então a chamada
--    do cliente não chegava a lugar nenhum — e falhava calada, deixando quem
--    entrava pelo magic link sem papel nenhum. O vínculo passa a ser feito no
--    servidor, com a service role, em `lib/dados.ts`. Uma função SECURITY
--    DEFINER que ninguém consegue chamar é só superfície de ataque parada:
--    sai.
--
-- 2. O e-mail passa a ser guardado sempre em minúsculas. O vínculo compara por
--    igualdade, e não por `ilike`, porque `_` é curinga em `ilike` e e-mail com
--    underscore casaria com o e-mail de outra pessoa. Com a coluna normalizada,
--    igualdade simples resolve — sem curinga no meio de uma comparação que
--    decide quem entra na diretoria.

update public.membros
   set email = lower(email)
 where email is not null and email <> lower(email);

alter table public.membros
  add constraint membros_email_minusculo
  check (email is null or email = lower(email));

drop function if exists privado.vincular_membro();
