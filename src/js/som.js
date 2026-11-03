// som.js — síntese WebAudio. Timbre com parciais explícitos (necessário para ouvir batimentos).
let ctx = null, mestre = null;
const ativos = new Set(); const timers = new Set();

export function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC(); mestre = ctx.createGain(); mestre.gain.value = 0.8; mestre.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
const ondas = new Map();
function onda(parciais) {
  const k = parciais.join(',');
  if (!ondas.has(k)) {
    const re = new Float32Array(parciais.length + 1), im = new Float32Array(parciais.length + 1);
    parciais.forEach((a, i) => { im[i + 1] = a; });
    ondas.set(k, audio().createPeriodicWave(re, im));
  }
  return ondas.get(k);
}
export const TIMBRE = { puro: [1], piano: [1, 0.55, 0.35, 0.25, 0.18, 0.12, 0.08, 0.05] };

/** Toca uma frequência. Retorna função para parar. */
export function tocar(freq, { dur = 1.2, ganho = 0.25, timbre = TIMBRE.piano, quando = 0, sustentar = false } = {}) {
  const a = audio(), t0 = a.currentTime + quando;
  const o = a.createOscillator(), g = a.createGain();
  o.setPeriodicWave(onda(timbre)); o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(ganho, t0 + 0.02);
  if (!sustentar) g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(mestre); o.start(t0);
  if (!sustentar) o.stop(t0 + dur + 0.05);
  const no = { o, g }; ativos.add(no); o.onended = () => ativos.delete(no);
  return () => { try { const t = a.currentTime; g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0.0001, t, 0.05); o.stop(t + 0.3); } catch (e) { /* já parado */ } ativos.delete(no); };
}
/** Sequência de frequências; cada item pode ser um número ou lista (acorde). */
export function sequencia(itens, { passo = 0.45, dur = 0.6, ...op } = {}) {
  parar();
  itens.forEach((it, i) => [].concat(it).forEach(f => tocar(f, { dur, quando: i * passo, ...op })));
}
export function depois(ms, f) { const id = setTimeout(() => { timers.delete(id); f(); }, ms); timers.add(id); }
export function parar() {
  timers.forEach(clearTimeout); timers.clear();
  if (!ctx) return;
  const t = ctx.currentTime;
  ativos.forEach(({ o, g }) => { try { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0.0001, t, 0.03); o.stop(t + 0.2); } catch (e) { /* já parado */ } });
  ativos.clear();
}
