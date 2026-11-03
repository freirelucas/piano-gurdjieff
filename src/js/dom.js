// dom.js — construção de DOM sem innerHTML. Todo texto entra por textContent.
import { analisar } from './marcacao.js';

export function h(tag, props = {}, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const f of filhos.flat(Infinity)) {
    if (f == null || f === false) continue;
    el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  }
  return el;
}

/** Texto do conteúdo (com marcação e tokens) → fragmento. `fontes` é o mapa id→fonte. */
export function rico(texto, fontes) {
  const frag = document.createDocumentFragment();
  for (const n of analisar(texto)) frag.append(no(n, fontes));
  return frag;
}
function no(n, fontes) {
  if (n.t === 'txt') return document.createTextNode(n.v);
  if (n.t === 'b') return h('strong', {}, ...n.c.map(x => no(x, fontes)));
  if (n.t === 'i') return h('em', {}, ...n.c.map(x => no(x, fontes)));
  if (n.t === 'a' && n.fonte) {
    const f = fontes.get(n.fonte);
    if (!f) throw new Error(`fonte inexistente: ${n.fonte}`);
    return h('a', { href: f.url, target: '_blank', rel: 'noopener', title: f.titulo }, ...n.c.map(x => no(x, fontes)));
  }
  const externo = n.href.startsWith('https://');
  return h('a', { href: n.href, target: externo ? '_blank' : null, rel: externo ? 'noopener' : null }, ...n.c.map(x => no(x, fontes)));
}

export const par = (texto, fontes) => h('p', {}, rico(texto, fontes));
export function limpar(el) { while (el.firstChild) el.firstChild.remove(); return el; }
