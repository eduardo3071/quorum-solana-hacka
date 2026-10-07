import { useEffect, useState } from 'react';

import { FRASES, PADROES } from './traducao-en';

/**
 * PT/EN para o app inteiro.
 *
 * As telas são escritas em pt-BR. Em EN, um observador troca cada texto
 * visível (e os atributos que leitores de tela leem) pelo equivalente em
 * `traducao-en.ts`, e guarda o original para voltar ao PT sem recarregar.
 */
export type Idioma = 'pt' | 'en';
const CHAVE = 'quorum:idioma';
const ATRIBUTOS = ['placeholder', 'aria-label', 'title', 'alt'] as const;

let atual: Idioma = (localStorage.getItem(CHAVE) as Idioma) === 'en' ? 'en' : 'pt';
const ouvintes = new Set<(i: Idioma) => void>();

const originalTexto = new WeakMap<Text, string>();
const traduzidoTexto = new WeakMap<Text, string>();
const originalAttr = new WeakMap<Element, Record<string, string>>();

function traduzir(s: string): string | null {
  const t = s.replace(/\s+/g, ' ').trim();
  if (!t) return null;
  const direto = FRASES[t];
  if (direto !== undefined) return direto;
  for (const [re, f] of PADROES) {
    const m = t.match(re);
    if (m) return f(...(m as unknown as string[]));
  }
  return null;
}

function comEspacos(orig: string, novo: string) {
  const ini = orig.match(/^\s*/)?.[0] ?? '';
  const fim = orig.match(/\s*$/)?.[0] ?? '';
  return ini + novo + fim;
}

function aplicarTexto(n: Text) {
  const p = n.parentElement;
  if (!p || p.closest('script,style,[data-sem-traducao]')) return;
  // Texto mudou por conta do React desde a nossa troca? Esse é o novo original.
  if (n.data !== traduzidoTexto.get(n)) originalTexto.set(n, n.data);
  const orig = originalTexto.get(n) ?? n.data;
  if (atual === 'pt') {
    if (traduzidoTexto.has(n) && n.data !== orig) n.data = orig;
    traduzidoTexto.delete(n);
    return;
  }
  const t = traduzir(orig);
  const novo = t === null ? orig : comEspacos(orig, t);
  traduzidoTexto.set(n, novo);
  if (n.data !== novo) n.data = novo;
}

function aplicarAttr(el: Element) {
  for (const a of ATRIBUTOS) {
    const v = el.getAttribute(a);
    if (v === null) continue;
    const salvo = originalAttr.get(el) ?? {};
    const conhecido = salvo[a];
    const jaTraduzido = conhecido !== undefined && traduzir(conhecido) === v;
    if (conhecido === undefined || (v !== conhecido && !jaTraduzido)) salvo[a] = v;
    originalAttr.set(el, salvo);
    const orig = salvo[a];
    const alvo = atual === 'en' ? (traduzir(orig) ?? orig) : orig;
    if (v !== alvo) el.setAttribute(a, alvo);
  }
}

function percorrer(raiz: Node) {
  if (raiz.nodeType === Node.TEXT_NODE) return aplicarTexto(raiz as Text);
  if (raiz.nodeType !== Node.ELEMENT_NODE) return;
  aplicarAttr(raiz as Element);
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n: Node | null = w.nextNode();
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) aplicarTexto(n as Text);
    else aplicarAttr(n as Element);
    n = w.nextNode();
  }
}

let iniciado = false;
function iniciar() {
  if (iniciado) return;
  iniciado = true;
  const obs = new MutationObserver((lista) => {
    for (const m of lista) {
      if (m.type === 'characterData') aplicarTexto(m.target as Text);
      else if (m.type === 'attributes') aplicarAttr(m.target as Element);
      else m.addedNodes.forEach(percorrer);
    }
  });
  obs.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...ATRIBUTOS],
  });
  percorrer(document.body);
}

export function mudarIdioma(i: Idioma) {
  atual = i;
  localStorage.setItem(CHAVE, i);
  document.documentElement.lang = i === 'en' ? 'en' : 'pt-BR';
  percorrer(document.body);
  ouvintes.forEach((f) => f(i));
}

export function useIdioma() {
  const [i, setI] = useState(atual);
  useEffect(() => {
    ouvintes.add(setI);
    return () => void ouvintes.delete(setI);
  }, []);
  return i;
}

/** Alternador PT/EN, fixo no canto da tela, em todas as páginas. */
export function AlternadorIdioma() {
  const idioma = useIdioma();
  useEffect(() => {
    iniciar();
    document.documentElement.lang = atual === 'en' ? 'en' : 'pt-BR';
  }, []);

  return (
    <div
      data-sem-traducao
      role="group"
      aria-label="Idioma / Language"
      className="fixed top-3 right-3 z-50 flex overflow-hidden rounded-chip border border-line bg-surface-2 shadow-lg"
    >
      {(['pt', 'en'] as const).map((op) => (
        <button
          key={op}
          type="button"
          onClick={() => mudarIdioma(op)}
          aria-pressed={idioma === op}
          className={`t-chip px-2.5 py-1.5 ${
            idioma === op ? 'bg-blue text-ground' : 'text-ink-2'
          }`}
        >
          {op.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
