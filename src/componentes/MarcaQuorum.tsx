/**
 * A marca do Quórum: o anel do Q, a cauda, e três barras no miolo.
 *
 * Desenhada em SVG e não como imagem: o vetor não pesa, não borra em tela de
 * alta densidade e não some se a rede falhar no meio do carregamento — e a capa
 * é a primeira coisa que alguém vê.
 *
 * O volume vem de três camadas sobre o mesmo traço: o anel cheio, um vinco
 * escuro por dentro e um brilho fino por fora. É o truque barato que faz um
 * vetor chapado ler como peça com espessura, sem virar imagem.
 *
 * A cauda é grossa e nasce dentro do anel de propósito. Fina e encostada por
 * fora, o desenho lê como lupa, não como Q.
 *
 * É a leitura das pranchas em vetor, não o render 3D delas. Se um dia entrar o
 * PNG final, troque só este componente: nenhuma tela conhece o desenho por
 * dentro.
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
        <linearGradient id="q-anel" gradientUnits="userSpaceOnUse" x1="12" y1="8" x2="86" y2="84">
          <stop offset="0" stopColor="#7DF7D6" />
          <stop offset=".3" stopColor="#3ADCD8" />
          <stop offset=".62" stopColor="#2A9CF7" />
          <stop offset="1" stopColor="#C061F0" />
        </linearGradient>

        {/* O halo: o mesmo gradiente, aberto e translúcido, atrás de tudo. */}
        <radialGradient id="q-halo" cx="50%" cy="46%" r="50%">
          <stop offset=".55" stopColor="#2A9CF7" stopOpacity=".38" />
          <stop offset="1" stopColor="#2A9CF7" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="q-b1" gradientUnits="userSpaceOnUse" x1="27" y1="0" x2="63" y2="0">
          <stop offset="0" stopColor="#7DF7D6" />
          <stop offset="1" stopColor="#3EE0BE" />
        </linearGradient>
        <linearGradient id="q-b2" gradientUnits="userSpaceOnUse" x1="27" y1="0" x2="63" y2="0">
          <stop offset="0" stopColor="#39C9E6" />
          <stop offset="1" stopColor="#2E9DF2" />
        </linearGradient>
        <linearGradient id="q-b3" gradientUnits="userSpaceOnUse" x1="27" y1="0" x2="63" y2="0">
          <stop offset="0" stopColor="#8A7BF4" />
          <stop offset="1" stopColor="#C061F0" />
        </linearGradient>
      </defs>

      <circle cx="45" cy="43" r="46" fill="url(#q-halo)" />

      {/* A cauda primeiro: o anel passa por cima e esconde onde ela nasce. */}
      <path
        d="M57 59 L82 85"
        stroke="url(#q-anel)"
        strokeWidth="14"
        strokeLinecap="round"
      />

      <circle cx="45" cy="43" r="31" stroke="url(#q-anel)" strokeWidth="12" />

      {/* Vinco interno e brilho externo: a espessura do anel, em duas linhas. */}
      <circle cx="45" cy="43" r="25.8" stroke="#08111E" strokeOpacity=".55" strokeWidth="1.6" />
      <circle cx="45" cy="43" r="36.4" stroke="#FFFFFF" strokeOpacity=".22" strokeWidth="1.2" />

      <circle cx="45" cy="43" r="25" fill="#0A1422" />

      {/* Três barras: duas assinaturas de três, dita em forma. */}
      <path d="M34 31 L63 31 L56 39 L27 39 Z" fill="url(#q-b1)" />
      <path d="M27 40 L56 40 L63 48 L34 48 Z" fill="url(#q-b2)" />
      <path d="M34 49 L63 49 L56 57 L27 57 Z" fill="url(#q-b3)" />
    </svg>
  );
}
