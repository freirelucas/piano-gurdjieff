// Testes do núcleo numérico (node:test, sem dependências). Rodam no CI antes do deploy.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../src/js/afinacao.js';

const perto = (x, y, tol = 0.05) => assert.ok(Math.abs(x - y) <= tol, `${x} ≉ ${y}`);

test('cents das razões de Ouspensky/Ptolomeu', () => {
  perto(A.cents('9/8'), 203.91);
  perto(A.cents('5/4'), 386.31);
  perto(A.cents('4/3'), 498.04);
  perto(A.cents('3/2'), 701.96);
  perto(A.cents('5/3'), 884.36);
  perto(A.cents('15/8'), 1088.27);
});

test('os dois intervalos menores são 16/15 (~112 cents), não 294', () => {
  const p = A.passos();
  const pequenos = p.filter(x => x.cents < 150).map(x => `${x.de}-${x.para}`);
  assert.deepEqual(pequenos, ['Mi-Fá', 'Si-Dó′']);
  for (const x of p.filter(x => x.cents < 150)) { assert.equal(x.razao, '16/15'); perto(x.cents, 111.73); }
});

test('dois tamanhos de tom inteiro: 9/8 e 10/9', () => {
  const grandes = A.passos().filter(x => x.cents > 150).map(x => x.razao);
  assert.deepEqual(grandes, ['9/8', '10/9', '9/8', '10/9', '9/8']);
});

test('frequências: Lá2 temperado = 110 Hz; Lá justo sobre Dó2 = 109,01 Hz', () => {
  perto(A.hz('A2'), 110.0, 0.01);
  perto(A.razao('5/3') * A.hz('C2'), 109.01, 0.01);
  perto(A.hz('C2'), 65.41, 0.01);
});

test('desvios do temperado: Mi −13,7; Lá −15,6; Si −11,7; 7º harmônico −31,2', () => {
  perto(A.desvioTemperado('5/4'), -13.69);
  perto(A.desvioTemperado('5/3'), -15.64);
  perto(A.desvioTemperado('15/8'), -11.73);
  perto(A.harmonicos(110, 8)[6].desvio, -31.17);
});

test('batimentos no piano temperado: terça C4–E4 rápida, quinta C4–G4 lenta', () => {
  perto(A.batimento('C4', 'E4', 5, 4), 10.38, 0.02);
  perto(A.batimento('C4', 'G4', 3, 2), 0.89, 0.02);
});

test('Fá e Lá não estão entre os harmônicos 8–16 da tônica', () => {
  const g = A.grausNaSerie();
  const fora = g.filter(x => !x.naSerie).map(x => x.nome);
  assert.deepEqual(fora, ['Fá', 'Lá']);
});

test('análise de altura: Mi justo sobre Dó4', () => {
  const r = A.analisarAltura(A.hz('C4') * 5 / 4, A.hz('C4'));
  assert.equal(r.grau.nome, 'Mi'); perto(r.desvioJusto, 0); perto(r.desvioIgual, -13.69);
});

test('tokens expandem e rejeitam lixo', () => {
  assert.equal(A.expandir('{c0:5/4}'), '386 cents');
  assert.equal(A.expandir('{dev:5/4}'), '−13,7 cents');
  assert.equal(A.expandir('{hz:A2}'), '110,00 Hz');
  assert.throws(() => A.token('xx:1'));
});
