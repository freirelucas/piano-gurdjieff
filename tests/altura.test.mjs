import test from 'node:test';
import assert from 'node:assert/strict';
import { detectar } from '../src/js/altura.js';
const sr = 44100;
function sinal(f, parciais = [1, 0.5, 0.3], n = 2048) {
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) parciais.forEach((a, k) => { b[i] += 0.3 * a * Math.sin(2 * Math.PI * f * (k + 1) * i / sr); });
  return b;
}
for (const f of [110, 196, 261.63, 327.03, 440, 880]) {
  test(`detecta ${f} Hz com erro < 3 cents`, () => {
    const g = detectar(sinal(f), sr);
    assert.ok(g, 'nada detectado');
    assert.ok(Math.abs(1200 * Math.log2(g / f)) < 3, `${g} vs ${f}`);
  });
}
test('silêncio → null', () => assert.equal(detectar(new Float32Array(2048), sr), null));
