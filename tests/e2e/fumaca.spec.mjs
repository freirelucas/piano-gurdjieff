// Teste de fumaça em navegador real: cada rota abre sem erro de console, contagens batem com os dados,
// o som inicia, o armazenamento e o cache respeitam o prefixo próprio.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const modulos = JSON.parse(readFileSync(new URL('../../content/modulos.json', import.meta.url), 'utf8'));
const rotas = ['#/', ...modulos.map(m => `#/m/${m.id}`), '#/lab', '#/lab/teclado', '#/lab/batimentos', '#/lab/harmonicos', '#/lab/oitava', '#/lab/afinador', '#/lab/metronomo', '#/lab/contador', '#/lab/escuta', '#/lab/downloads', '#/repertorio', '#/evidencia', '#/fontes', '#/progresso', '#/correcoes'];

test.describe('todas as rotas', () => {
  for (const r of rotas) {
    test(`abre ${r} sem erro`, async ({ page }) => {
      const erros = [];
      page.on('pageerror', e => erros.push(String(e)));
      page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
      await page.goto(`./${r}`);
      await expect(page.locator('#tela h1').first()).toBeVisible();
      await expect(page.locator('.aviso.erro')).toHaveCount(0);
      await expect(page.locator('#faixa')).toBeHidden();
      expect(erros).toEqual([]);
    });
  }
});

test('contagem de módulos na capa vem dos dados', async ({ page }) => {
  await page.goto('./#/');
  await expect(page.locator('.numeros').first()).toContainText(`${modulos.length} módulos`);
  await expect(page.locator('.cards .card')).toHaveCount(modulos.length);
});

test('nenhum token cru nem número esquecido na tela', async ({ page }) => {
  for (const m of modulos) {
    await page.goto(`./#/m/${m.id}`);
    const t = await page.locator('#tela').innerText();
    expect(t).not.toMatch(/\{(c|c0|dev|bat|et|hz|hzr):/);
  }
});

test('teclado toca e teste cego grava com prefixo gdh:', async ({ page }) => {
  await page.goto('./#/lab/teclado');
  await page.getByRole('button', { name: '▶ escala justa' }).click();
  await page.getByRole('button', { name: '▶ nova rodada' }).click();
  await page.getByRole('button', { name: 'A era a justa' }).click();
  await expect(page.locator('.placar')).toContainText(/[01]\/1 nas últimas 1 rodadas/);  // acerto é sorteado
  const chaves = await page.evaluate(() => Object.keys(localStorage));
  expect(chaves.length).toBeGreaterThan(0);
  for (const k of chaves) expect(k.startsWith('gdh:')).toBeTruthy();
});

test('service worker usa só caches com prefixo gdh- e pré-cacheia tudo', async ({ page }) => {
  await page.goto('./#/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(async () => page.evaluate(async () => (await caches.keys()).length)).toBeGreaterThan(0);
  const ks = await page.evaluate(async () => caches.keys());
  for (const k of ks) expect(k.startsWith('gdh-')).toBeTruthy();
  const n = await page.evaluate(async () => { const c = await caches.open((await caches.keys())[0]); return (await c.keys()).length; });
  const v = await (await page.request.get('./versao.json')).json();
  expect(n).toBe(v.arquivos);
});

test('arquivos de afinação estão publicados', async ({ page }) => {
  const scl = await (await page.request.get('./downloads/sete_tons.scl')).text();
  expect(scl).toContain('5/4'); expect(scl).toContain('15/8');
});
