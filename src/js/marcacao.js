// marcacao.js — marcação mínima e SEGURA do conteúdo → árvore de nós (sem innerHTML).
// Suporta: **negrito**, *itálico*, [texto](alvo) e tokens numéricos {c:9/8} (expandidos antes).
// alvo: "#/rota" (interna), "fonte:id" (catálogo de fontes) ou "https://…".
import { expandir } from './afinacao.js';

/** Converte texto em lista de nós: {t:'txt',v} | {t:'b'|'i',c:[...]} | {t:'a',href,fonte?,c:[...]} */
export function analisar(texto) {
  return inline(expandir(String(texto)));
}

function inline(s) {
  const out = [];
  let i = 0, buf = '';
  const flush = () => { if (buf) { out.push({ t: 'txt', v: buf }); buf = ''; } };
  while (i < s.length) {
    if (s.startsWith('**', i)) {
      const j = s.indexOf('**', i + 2);
      if (j > i + 2) { flush(); out.push({ t: 'b', c: inline(s.slice(i + 2, j)) }); i = j + 2; continue; }
    }
    if (s[i] === '*' && s[i + 1] !== '*' && s[i + 1] !== ' ') {
      const j = s.indexOf('*', i + 1);
      if (j > i + 1 && s[j - 1] !== ' ') { flush(); out.push({ t: 'i', c: inline(s.slice(i + 1, j)) }); i = j + 1; continue; }
    }
    if (s[i] === '[') {
      const m = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(s.slice(i));
      if (m) {
        flush();
        const alvo = m[2];
        if (alvo.startsWith('fonte:')) out.push({ t: 'a', fonte: alvo.slice(6), c: inline(m[1]) });
        else if (alvo.startsWith('#/') || alvo.startsWith('https://')) out.push({ t: 'a', href: alvo, c: inline(m[1]) });
        else throw new Error(`link com alvo não permitido: ${alvo}`);
        i += m[0].length; continue;
      }
    }
    buf += s[i]; i++;
  }
  flush();
  return out;
}

/** Ids de fontes citadas num texto (usado pelos testes de contrato). */
export function fontesCitadas(texto) {
  return [...String(texto).matchAll(/\]\(fonte:([\w-]+)\)/g)].map(m => m[1]);
}
