-- O slug virou o primeiro segmento da URL (/atletica-engenharia/aprovacoes),
-- então a entidade e o evento da demo ganham nomes que se leem na barra de
-- endereço. Os ids não mudam, só o texto do endereço.
update entidades set slug = 'atletica-engenharia' where slug = 'aaaeng';
update eventos set slug = 'atletica-engenharia-baile32' where slug = 'aaaeng-baile32';
