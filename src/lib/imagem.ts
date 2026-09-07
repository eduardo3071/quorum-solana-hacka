/**
 * Reduz um retrato escolhido no aparelho para algo que caiba num campo de
 * texto: quadrado, 256px, JPEG.
 *
 * O corte é central — retrato de rosto quase sempre está no meio — e a
 * conversão acontece no navegador, antes de qualquer envio: o que sai daqui
 * pesa dezenas de KB, não os megabytes da foto original.
 */
const LADO = 256;

export async function retratoReduzido(arquivo: File): Promise<string> {
  const fonte = await carregar(arquivo);

  const lado = Math.min(fonte.width, fonte.height);
  const x = (fonte.width - lado) / 2;
  const y = (fonte.height - lado) / 2;

  const tela = document.createElement('canvas');
  tela.width = LADO;
  tela.height = LADO;

  const ctx = tela.getContext('2d');
  if (!ctx) throw new Error('Não foi possível preparar a foto neste aparelho.');

  ctx.drawImage(fonte, x, y, lado, lado, 0, 0, LADO, LADO);
  return tela.toDataURL('image/jpeg', 0.82);
}

function carregar(arquivo: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Esse arquivo não parece ser uma imagem.'));
    };
    img.src = url;
  });
}
