import test from 'node:test';
import assert from 'node:assert/strict';
import { analisar, fontesCitadas } from '../src/js/marcacao.js';

test('negrito, itálico, links e tokens', () => {
  const n = analisar('**A** e *b* [c](#/lab) [d](fonte:omt2) {et:4}');
  assert.equal(n[0].t, 'b'); assert.equal(n[0].c[0].v, 'A');
  assert.equal(n[2].t, 'i');
  assert.equal(n[4].t, 'a'); assert.equal(n[4].href, '#/lab');
  assert.equal(n[6].fonte, 'omt2');
  assert.equal(n.at(-1).v, ' 400 cents');
});
test('HTML vira texto, não marcação', () => {
  const n = analisar('<img src=x onerror=alert(1)>');
  assert.deepEqual(n, [{ t: 'txt', v: '<img src=x onerror=alert(1)>' }]);
});
test('alvos javascript: são recusados', () => {
  assert.throws(() => analisar('[x](javascript:alert(1))'));
});
test('asterisco solto não abre itálico', () => {
  assert.equal(analisar('5 * 3')[0].v, '5 * 3');
});
test('fontes citadas', () => {
  assert.deepEqual(fontesCitadas('[a](fonte:x) e [b](fonte:y-z)'), ['x', 'y-z']);
});
