import type { Acento } from './acentos';

/**
 * Gradiente de 160° por variante. O hero carrega o estado da tela:
 *   azul     estado normal e navegação
 *   âmbar    em curso, aguardando
 *   verde    concluído, confirmado
 *   vermelho retido, recusado, erro
 *   roxo     pessoas e governança
 */
const GRADIENTE: Record<Acento, string> = {
  blue: 'linear-gradient(160deg,#1E88E5,#29A3F5 52%,#1B7FD4)',
  green: 'linear-gradient(160deg,#1E9E57,#32C869 52%,#1B8C4B)',
  amber: 'linear-gradient(160deg,#C99A17,#F5C73D 52%,#B98E12)',
  purple: 'linear-gradient(160deg,#7B3FB0,#AF57DB 52%,#6E36A0)',
  red: 'linear-gradient(160deg,#E03B4B,#FF5F6D 52%,#C92F42)',
};

/**
 * Textura de formas orgânicas claras a 16%.
 *
 * Vai no `background-image` do próprio hero, empilhada sobre o gradiente, em
 * vez de num `<div>` posicionado por cima. Assim ela é estruturalmente fundo:
 * não existe caminho em que cubra a pílula de estado, que era o bug de quatro
 * telas na auditoria.
 */
const TEXTURA =
  'radial-gradient(70px 48px at 86% 22%,rgba(255,255,255,.16) 0 60%,transparent 61%),' +
  'radial-gradient(96px 62px at 14% 104%,rgba(255,255,255,.16) 0 60%,transparent 61%),' +
  'radial-gradient(40px 30px at 58% 82%,rgba(255,255,255,.16) 0 60%,transparent 61%)';

/** O âmbar é claro demais para texto branco — sobre ele a tinta é escura. */
const TINTA_ESCURA: Partial<Record<Acento, boolean>> = { amber: true };

export function Hero({
  variante = 'blue',
  rotulo,
  titulo,
  subtitulo,
  pilula,
  statusBar,
  children,
  className = '',
}: {
  variante?: Acento;
  rotulo?: string;
  titulo?: React.ReactNode;
  subtitulo?: React.ReactNode;
  pilula?: string;
  /** Chrome do celular na maquete: hora à esquerda, rede e bateria à direita. */
  statusBar?: { hora: string; direita: string };
  children?: React.ReactNode;
  className?: string;
}) {
  const escura = TINTA_ESCURA[variante] ?? false;

  const tinta = escura ? 'text-[#101823]' : 'text-white';
  const tintaRotulo = escura ? 'text-[rgba(16,24,35,.7)]' : 'text-white/75';
  const tintaSub = escura ? 'text-[rgba(16,24,35,.78)]' : 'text-white/85';
  // Translúcida clara, como nas pranchas. Ela é legível sobre a textura porque
  // a textura agora é fundo do próprio hero e não tem como passar por cima.
  const pilulaCor = escura
    ? 'bg-[rgba(16,24,35,.18)] border-[rgba(16,24,35,.28)] text-[#101823]'
    : 'bg-white/20 border-white/30 text-white';

  return (
    <header
      className={`flex-none px-4 pt-3 pb-[18px] ${className}`}
      style={{ backgroundImage: `${TEXTURA},${GRADIENTE[variante]}` }}
    >
      {/*
        `num` e `t-chip` vão nos spans, nunca no contêiner: num flex com
        justify-between o contêiner não é um trecho de texto, e o nowrap
        aplicado nele confunde qualquer medição de quebra de linha.
      */}
      {statusBar && (
        <div
          className={`flex justify-between ${escura ? 'text-[rgba(16,24,35,.72)]' : 'text-white/90'}`}
          aria-hidden
        >
          <span className="num t-chip">{statusBar.hora}</span>
          <span className="num t-chip">{statusBar.direita}</span>
        </div>
      )}

      {(rotulo || titulo || subtitulo || pilula) && (
        <div
          className={`flex items-start justify-between gap-3 ${statusBar ? 'mt-4' : ''}`}
        >
          <div className="min-w-0">
            {rotulo && <div className={`t-rotulo ${tintaRotulo}`}>{rotulo}</div>}
            {titulo && (
              <h1 className={`t-hero ${tinta} ${rotulo ? 'mt-2' : ''}`}>
                {titulo}
              </h1>
            )}
            {subtitulo && (
              <div
                className={`mt-[5px] text-[12.5px] leading-[1.4] font-medium ${tintaSub}`}
              >
                {subtitulo}
              </div>
            )}
          </div>

          {pilula && (
            <span
              className={`t-chip flex-none rounded-chip border px-2 py-[5px] ${pilulaCor}`}
            >
              {pilula}
            </span>
          )}
        </div>
      )}

      {children}
    </header>
  );
}
