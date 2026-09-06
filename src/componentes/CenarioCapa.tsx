/**
 * A cena noturna da capa: campus, bandeira, notebook e moeda.
 *
 * Desenhada em SVG, em silhueta com luz de borda. Não é o render das pranchas —
 * é a leitura possível dele em vetor. A vantagem prática é real: não pesa, não
 * borra em tela densa, não fica meio carregada numa rede de campus, e escala do
 * celular ao desktop sem segunda arte. Se um dia entrar o PNG final, troca-se
 * só este componente.
 *
 * A bandeira NÃO tem texto de verdade: o dizer dela é traço, não palavra. Com
 * texto, ela caía atrás do "Mais transparência…" e virava dois textos
 * sobrepostos — a regra de layout que mais custa quando se esquece. Traço lê
 * como escrita à mão no tamanho em que aparece e nunca colide com nada.
 *
 * `preserveAspectRatio="xMidYMid slice"` faz a cena cobrir a tela como uma foto
 * de fundo cobriria: recorta as sobras em vez de esticar. Sem isso o campus
 * entorta em tela mais alta. O preço é que numa tela mais alta a cena amplia e
 * perde as laterais — por isso tudo que precisa ser visto vive entre x=30 e
 * x=360, e só o que deve sangrar (prédio, notebook) encosta na borda.
 *
 * `aria-hidden` porque não carrega informação nenhuma. Quem usa leitor de tela
 * não perde nada — e um cenário narrado no meio da leitura só atrapalharia
 * quem quer chegar ao botão.
 */
export function CenarioCapa({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 390 844"
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none absolute inset-0 size-full ${className}`}
    >
      <defs>
        {/* O clarão atrás da marca, que é o que dá profundidade à cena. */}
        <radialGradient id="c-halo" cx="50%" cy="16%" r="66%">
          <stop offset="0" stopColor="#2F79C4" stopOpacity=".5" />
          <stop offset=".42" stopColor="#164478" stopOpacity=".3" />
          <stop offset="1" stopColor="#0D1A2C" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="c-predio" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#164876" />
          <stop offset="1" stopColor="#0C2242" />
        </linearGradient>

        <linearGradient id="c-vidro" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3E90D8" stopOpacity=".45" />
          <stop offset="1" stopColor="#3E90D8" stopOpacity=".08" />
        </linearGradient>

        <linearGradient id="c-sol" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5AF2C8" />
          <stop offset=".5" stopColor="#2FA8F0" />
          <stop offset="1" stopColor="#B85CF0" />
        </linearGradient>

        <linearGradient id="c-tela" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#14406E" />
          <stop offset="1" stopColor="#0B2140" />
        </linearGradient>

        {/* A base escurece para o rodapé: é ela que segura o botão e o texto. */}
        <linearGradient id="c-chao" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#101823" stopOpacity="0" />
          <stop offset=".5" stopColor="#0D141F" stopOpacity=".7" />
          <stop offset="1" stopColor="#0B1119" stopOpacity=".97" />
        </linearGradient>
      </defs>

      <rect width="390" height="844" fill="url(#c-halo)" />

      {/* ── Palmeiras, nos cantos de cima ──────────────────────────────── */}
      <Palmeira x={46} y={244} escala={0.85} />
      <Palmeira x={348} y={252} escala={0.95} />
      <Palmeira x={306} y={210} escala={0.58} />

      {/* ── O campus, à direita ────────────────────────────────────────── */}
      <g opacity=".95">
        <path
          d="M262 520 L262 396 Q262 356 306 342 Q350 330 390 332 L390 520 Z"
          fill="url(#c-predio)"
        />
        <path
          d="M262 396 Q262 356 306 342 Q350 330 390 332"
          stroke="#4E9EE0"
          strokeOpacity=".5"
          strokeWidth="1.5"
          fill="none"
        />
        {[418, 446, 474, 502].map((y) => (
          <path
            key={y}
            d={`M266 ${y} Q320 ${y - 13} 390 ${y - 16}`}
            stroke="url(#c-vidro)"
            strokeWidth="7"
            fill="none"
          />
        ))}
        {/*
          "UFSC" é o único texto da cena. Fica de propósito parcialmente atrás
          do cartão e cortado pela borda, como na prancha: a 390px não existe
          faixa livre à direita da coluna de texto onde ele coubesse inteiro, e
          letra pela metade em primeiro plano leria como defeito. Atrás do
          desfoque do cartão ela vira brilho de fachada, que é o que deve ser.
        */}
        <text
          x="300"
          y="382"
          fontSize="26"
          fontWeight="800"
          letterSpacing="1"
          fill="#9CCDF2"
          fillOpacity=".34"
          fontFamily="Inter, system-ui, sans-serif"
        >
          UFSC
        </text>
      </g>

      {/* ── A bandeira, à esquerda ─────────────────────────────────────── */}
      <g>
        <rect x="16" y="246" width="3" height="216" rx="1.5" fill="#2F6699" opacity=".75" />
        <path
          d="M22 254 L76 246 L76 384 Q50 378 22 390 Z"
          fill="#0F2E54"
          stroke="#4E9EE0"
          strokeOpacity=".38"
          strokeWidth="1.2"
        />
        {/* O dizer da bandeira, em traço. Três linhas e o floreio embaixo. */}
        <g stroke="#9FD0F5" strokeOpacity=".5" strokeWidth="2.4" strokeLinecap="round" fill="none">
          <path d="M29 284 Q40 278 50 284 T66 282" />
          <path d="M28 306 Q38 300 47 306 T62 304" />
          <path d="M29 328 Q41 322 52 328 T69 326" />
          <path d="M30 356 Q46 348 64 355" strokeOpacity=".35" />
        </g>
      </g>

      {/* ── O notebook, à esquerda do cartão ───────────────────────────── */}
      <g>
        <path d="M-6 486 L74 462 L74 574 L-6 590 Z" fill="url(#c-tela)" />
        <path
          d="M-6 486 L74 462 L74 574 L-6 590 Z"
          stroke="#4E9EE0"
          strokeOpacity=".42"
          strokeWidth="1.4"
          fill="none"
        />
        <g opacity=".92">
          <path d="M10 508 L60 496 L52 508 L2 520 Z" fill="url(#c-sol)" />
          <path d="M2 526 L52 514 L60 526 L10 538 Z" fill="url(#c-sol)" opacity=".82" />
          <path d="M10 544 L60 532 L52 544 L2 556 Z" fill="url(#c-sol)" opacity=".62" />
        </g>
        <path d="M-14 590 L80 574 L92 588 L-14 606 Z" fill="#0B2140" opacity=".92" />
      </g>

      {/* ── A moeda, à direita do cartão ───────────────────────────────── */}
      <g>
        <ellipse cx="350" cy="596" rx="56" ry="18" fill="#0A1A30" opacity=".75" />
        <circle
          cx="350"
          cy="546"
          r="54"
          fill="#0C2444"
          stroke="#4E9EE0"
          strokeOpacity=".48"
          strokeWidth="2"
        />
        <g opacity=".95">
          <path d="M328 530 L378 520 L370 532 L320 542 Z" fill="url(#c-sol)" />
          <path d="M320 548 L370 538 L378 550 L328 560 Z" fill="url(#c-sol)" opacity=".82" />
          <path d="M328 566 L378 556 L370 568 L320 578 Z" fill="url(#c-sol)" opacity=".62" />
        </g>
      </g>

      <rect y="560" width="390" height="284" fill="url(#c-chao)" />
    </svg>
  );
}

/** Uma palmeira em silhueta: tronco curvo e seis folhas abertas. */
function Palmeira({ x, y, escala }: { x: number; y: number; escala: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`} opacity=".55">
      <path
        d="M0 0 Q-6 -60 4 -118"
        stroke="#153F6C"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      {[
        'M4 -118 Q-34 -140 -62 -128',
        'M4 -118 Q-26 -156 -50 -170',
        'M4 -118 Q4 -160 -8 -186',
        'M4 -118 Q30 -158 54 -172',
        'M4 -118 Q40 -142 68 -132',
        'M4 -118 Q34 -114 52 -96',
      ].map((d) => (
        <path
          key={d}
          d={d}
          stroke="#17456F"
          strokeWidth="9"
          fill="none"
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}
