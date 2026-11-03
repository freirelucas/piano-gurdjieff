// Expande TODO texto do conteúdo com o mesmo código do navegador: token inválido ou link proibido reprova.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analisar } from '../src/js/marcacao.js';
const ler = (n) => JSON.parse(readFileSync(new URL(`../content/${n}.json`, import.meta.url), 'utf8'));
function* textos(o) { if (typeof o === 'string') yield o; else if (Array.isArray(o)) for (const x of o) yield* textos(x); else if (o && typeof o === 'object') for (const v of Object.values(o)) yield* textos(v); }
for (const n of ['modulos', 'evidencia', 'repertorio', 'correcoes', 'plano', 'fontes']) {
  test(`${n}: todo texto expande sem erro`, () => {
    let k = 0; for (const s of textos(ler(n))) { analisar(s); k++; }
    assert.ok(k > 0);
  });
}
test('nenhum token sobra sem expandir', () => {
  for (const s of textos(ler('modulos'))) { const t = analisar(s); const plano = JSON.stringify(t); assert.ok(!/\{(c|c0|dev|bat|et|hz|hzr):/.test(plano), s.slice(0, 60)); }
});
