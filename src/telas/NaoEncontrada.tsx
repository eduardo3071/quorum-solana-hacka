import { Vazio } from '@/componentes/Estados';
import { Tela } from '@/componentes/Tela';

export function NaoEncontrada() {
  return (
    <Tela>
      <div className="flex flex-1 flex-col justify-center px-4 py-10">
        <Vazio titulo="Página não encontrada" acao={{ texto: 'Voltar ao início', href: '/' }}>
          O endereço que você abriu não existe. Confira o link que você recebeu.
        </Vazio>
      </div>
    </Tela>
  );
}
