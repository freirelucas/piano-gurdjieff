// afinacao.js — matemática pura de afinação. Nenhum DOM, nenhum áudio.
// É a ÚNICA fonte de números do site: todo valor em cents ou Hz exibido
// sai daqui (via tokens {c:9/8}, {dev:5/4} etc.), nunca digitado à mão.

/** Razão "a/b" ou número → número real. */
export function razao(r) {
  if (typeof r === 'number') return r;
  const m = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(String(r));
  if (!m) throw new Error(`razão inválida: ${r}`);
  return Number(m[1]) / Number(m[2]);
}

/** Intervalo em cents (1200·log2). */
export const cents = (r) => 1200 * Math.log2(razao(r));

/** Escala de sete tons (Ouspensky, Search, 125; Petsche §7.4) = diatônico sintônico de Ptolomeu. */
export const SETE_TONS = [
  { grau: 1, nome: 'Dó', razao: '1/1', semitons: 0 },
  { grau: 2, nome: 'Ré', razao: '9/8', semitons: 2 },
  { grau: 3, nome: 'Mi', razao: '5/4', semitons: 4 },
  { grau: 4, nome: 'Fá', razao: '4/3', semitons: 5 },
  { grau: 5, nome: 'Sol', razao: '3/2', semitons: 7 },
  { grau: 6, nome: 'Lá', razao: '5/3', semitons: 9 },
  { grau: 7, nome: 'Si', razao: '15/8', semitons: 11 },
  { grau: 8, nome: 'Dó′', razao: '2/1', semitons: 12 },
];

/** Passos entre graus consecutivos: razão e cents. */
export function passos(escala = SETE_TONS) {
  const out = [];
  for (let i = 1; i < escala.length; i++) {
    const r = razao(escala[i].razao) / razao(escala[i - 1].razao);
    out.push({ de: escala[i - 1].nome, para: escala[i].nome, razao: fracao(r), cents: cents(r) });
  }
  return out;
}

/** Aproxima um real por fração de denominador ≤ 64 (para exibir 10/9, 16/15…). */
export function fracao(x, maxDen = 64) {
  let best = [Math.round(x), 1], err = Math.abs(x - Math.round(x));
  for (let d = 2; d <= maxDen; d++) {
    const n = Math.round(x * d), e = Math.abs(x - n / d);
    if (e < err - 1e-12) { best = [n, d]; err = e; }
  }
  return `${best[0]}/${best[1]}`;
}

/** Desvio (cents) de uma razão justa em relação ao temperamento igual mais próximo. */
export function desvioTemperado(r) {
  const c = cents(r);
  return c - 100 * Math.round(c / 100);
}

/** Frequência MIDI em temperamento igual (Lá4 = 440 Hz). */
export const hzMidi = (m, la = 440) => la * Math.pow(2, (m - 69) / 12);

const NOTAS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** "C4", "F#3", "Bb2" → número MIDI. */
export function midi(nota) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(nota);
  if (!m) throw new Error(`nota inválida: ${nota}`);
  return 12 * (Number(m[3]) + 1) + NOTAS[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
export const hz = (nota, la = 440) => hzMidi(midi(nota), la);

/**
 * Batimento (Hz) entre o parcial p da nota a e o parcial q da nota b,
 * em temperamento igual — o que se ouve num piano afinado normalmente.
 * Ex.: terça maior C4–E4: parcial 5 de C4 contra parcial 4 de E4.
 */
export const batimento = (a, b, p, q) => Math.abs(p * hz(a) - q * hz(b));

/** Harmônicos 1..n de uma fundamental: Hz, cents acima da fundamental, nota temperada mais próxima e desvio. */
export function harmonicos(f0, n = 16) {
  const out = [];
  for (let k = 1; k <= n; k++) {
    const c = cents(k);
    const viz = Math.round(c / 100);
    out.push({ k, hz: f0 * k, cents: c, semitons: viz, desvio: c - 100 * viz });
  }
  return out;
}

/** Quais graus da escala de sete tons aparecem entre os harmônicos 8..16 da tônica (reduzidos à oitava). */
export function grausNaSerie(escala = SETE_TONS) {
  const presentes = new Set();
  for (let k = 8; k <= 16; k++) presentes.add(fracao(k / 8));
  return escala.map(g => ({ ...g, naSerie: presentes.has(fracao(razao(g.razao))) }));
}

/** Detecção de altura relativa a uma tônica: grau justo mais próximo e desvios. */
export function analisarAltura(f, tonica) {
  let c = cents(f / tonica);
  const oit = Math.floor(c / 1200); c -= 1200 * oit;
  let melhor = null;
  for (const g of SETE_TONS) {
    const d = c - cents(g.razao);
    if (!melhor || Math.abs(d) < Math.abs(melhor.desvioJusto)) melhor = { grau: g, desvioJusto: d };
  }
  const desvioIgual = c - 100 * melhor.grau.semitons;
  return { ...melhor, desvioIgual, oitava: oit };
}

/* ---------- tokens numéricos usados no texto do conteúdo ---------- */
const fmt = (x, casas = 1) => x.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
const sinal = (x, casas = 1) => (x > 0 ? '+' : x < 0 ? '−' : '±') + fmt(Math.abs(x), casas);

/**
 * Tokens aceitos no texto:
 *   {c:9/8}            → "203,9 cents"
 *   {c0:5/4}           → "386 cents" (inteiro)
 *   {dev:5/4}          → "−13,7 cents" (desvio do temperado)
 *   {et:4}             → "400 cents" (n semitons temperados)
 *   {bat:C4,E4,5,4}    → "10,4 Hz" (batimento em temperamento igual)
 *   {hz:A2}            → "110,0 Hz"
 *   {hzr:5/3@C2}       → frequência justa: razão aplicada sobre nota temperada
 */
export function token(expr) {
  const [k, v] = expr.split(':');
  switch (k) {
    case 'c': return `${fmt(cents(v))} cents`;
    case 'c0': return `${Math.round(cents(v))} cents`;
    case 'dev': return `${sinal(desvioTemperado(v))} cents`;
    case 'bat': { const [a, b, p, q] = v.split(','); return `${fmt(batimento(a, b, +p, +q))} Hz`; }
    case 'et': return `${Math.round(Number(v) * 100)} cents`;
    case 'hz': return `${fmt(hz(v), 2)} Hz`;
    case 'hzr': { const [r, n] = v.split('@'); return `${fmt(razao(r) * hz(n), 2)} Hz`; }
    default: throw new Error(`token desconhecido: {${expr}}`);
  }
}
export const TOKEN_RE = /\{((?:c|c0|dev|bat|et|hz|hzr):[^}\s]+)\}/g;
export const expandir = (s) => s.replace(TOKEN_RE, (_, e) => token(e));
