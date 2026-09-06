/**
 * A marca do Quórum: o anel do Q, a cauda, e três barras no miolo.
 *
 * Desenhada em SVG e não como imagem: o vetor não pesa, não borra em tela de
 * alta densidade e não some se a rede falhar no meio do carregamento — e a
 * capa é a primeira coisa que alguém vê.
 *
 * A cauda é grossa e sai de dentro do anel de propósito. Fina e encostada por
 * fora, o desenho lê como lupa, não como Q.
 *
 * É uma leitura das pranchas, não o render 3D delas. Se um dia entrar o PNG
 * final, troque só este componente: nenhuma tela conhece o desenho por dentro.
 */
export function MarcaQuorum({
  tamanho = 96,
  className = '',
}: {
  tamanho?: number;
  className?: string;
}) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 96 96"
      fill="none"
      role="img"
      aria-label="Quórum"
      className={className}
    >
      <defs>
        {/* Percorre o anel na diagonal, de canto a canto do próprio anel —
            fora dele os extremos da escala não apareceriam. */}
        <linearGradient id="q-anel" gradientUnits="userSpaceOnUse" x1="12" y1="10" x2="84" y2="82">
          <stop offset="0" stopColor="#5AF2C8" />
          <stop offset=".38" stopColor="#2FD9E0" />
          <stop offset=".68" stopColor="#1FA5FF" />
          <stop offset="1" stopColor="#B85CF0" />
        </linearGradient>
        <linearGradient id="q-b1" gradientUnits="userSpaceOnUse" x1="27" y1="0" x2="63" y2="0">
          <stop offset="0" stopColor="#5AF2C8" />
          <stop offset="1" stopColor="#3EE0BE" />
        </linearGradient>
        <linearGradient id="q-b2" gradientUnits="userSpaceOnUse" x1="27" y1="0" x2="63" y2="0">
          <stop offset="0" stopColor="#39C9E6" />
          <stop offset="1" stopColor="#2E9DF2" />
        </linearGradient>
        <linearGradient id="q-b3" gradientUnits="userSpaceOnUse" x1="27" y1="0" x2="63" y2="0">
          <stop offset="0" stopColor="#7E7CF2" />
          <stop offset="1" stopColor="#B85CF0" />
        </linearGradient>
      </defs>

      {/* A cauda primeiro: o anel passa por cima e esconde onde ela nasce. */}
      <path
        d="M58 60 L82 84"
        stroke="url(#q-anel)"
        strokeWidth="13"
        strokeLinecap="round"
      />

      <circle cx="45" cy="43" r="31" stroke="url(#q-anel)" strokeWidth="11" />
      <circle cx="45" cy="43" r="25" fill="#0B1220" />

      {/* Três barras: duas assinaturas de três, dita em forma. */}
      <path d="M34 31 L63 31 L56 39 L27 39 Z" fill="url(#q-b1)" />
      <path d="M27 40 L56 40 L63 48 L34 48 Z" fill="url(#q-b2)" />
      <path d="M34 49 L63 49 L56 57 L27 57 Z" fill="url(#q-b3)" />
    </svg>
  );
}
