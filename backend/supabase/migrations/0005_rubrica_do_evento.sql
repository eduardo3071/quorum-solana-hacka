-- 0005 · A rubrica do evento (B7)
--
-- Aplicada no projeto como 20260905..._rubrica_do_evento.
--
-- A entrada que a compra de ingresso gera no livro-caixa precisa de rubrica, e
-- a rubrica é do evento, não do endpoint. Uma festa é 'Eventos'; um torneio da
-- mesma atlética seria 'Esporte'. Deixar isso no código faria toda entrada
-- nascer como 'Eventos' — errado no primeiro caso que fugisse do exemplo.
--
-- Rubrica é categoria contábil. Nunca sinônimo de assinatura.

alter table public.eventos
  add column if not exists rubrica public.rubrica not null default 'Eventos';
