// altura.js — detecção de altura por autocorrelação normalizada (estilo YIN simplificado). Puro, testável.
/** Retorna frequência em Hz ou null (silêncio / sem periodicidade clara). */
export function detectar(buf, sr, { min = 60, max = 1100, limiar = 0.12 } = {}) {
  const n = buf.length;
  let rms = 0; for (let i = 0; i < n; i++) rms += buf[i] * buf[i];
  if (Math.sqrt(rms / n) < 0.01) return null;
  const tauMin = Math.floor(sr / max), tauMax = Math.min(Math.floor(sr / min), Math.floor(n / 2));
  const d = new Float32Array(tauMax + 1);
  for (let tau = 1; tau <= tauMax; tau++) {
    let s = 0; for (let i = 0; i < n - tauMax; i++) { const x = buf[i] - buf[i + tau]; s += x * x; } d[tau] = s;
  }
  // diferença média cumulativa normalizada
  let acum = 0; const cm = new Float32Array(tauMax + 1); cm[0] = 1;
  for (let tau = 1; tau <= tauMax; tau++) { acum += d[tau]; cm[tau] = d[tau] * tau / (acum || 1); }
  let tau = -1;
  for (let t = tauMin; t <= tauMax; t++) { if (cm[t] < limiar) { while (t + 1 <= tauMax && cm[t + 1] < cm[t]) t++; tau = t; break; } }
  if (tau < 0) return null;
  // interpolação parabólica
  const a = cm[tau - 1] ?? cm[tau], b = cm[tau], c = cm[tau + 1] ?? cm[tau];
  const den = a - 2 * b + c; const desl = den ? 0.5 * (a - c) / den : 0;
  return sr / (tau + desl);
}
