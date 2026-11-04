// Converte o relatório JSON do Playwright em anotações ::error (legíveis pela API de check-runs).
import { readFileSync, existsSync } from 'node:fs';
const f = process.argv[2];
if (!existsSync(f)) { console.log(`::error title=fumaça::sem relatório JSON (${f}) — o processo foi morto antes de terminar`); process.exit(0); }
let rel; try { rel = JSON.parse(readFileSync(f, 'utf8')); } catch (e) { console.log(`::error title=fumaça::relatório ilegível: ${e.message}`); process.exit(0); }
const esc = (s) => String(s).replace(/%/g, '%25').replace(/\r/g, '').replace(/\n/g, '%0A').slice(0, 1800);
let n = 0;
const anda = (suite, pref = '') => {
  for (const s of suite.suites || []) anda(s, pref + (s.title ? s.title + ' › ' : ''));
  for (const sp of suite.specs || []) for (const t of sp.tests || []) for (const r of t.results || []) {
    if (r.status !== 'passed' && r.status !== 'skipped') {
      n++;
      const msg = (r.errors || []).map(e => e.message || e.value || '').join(' | ') || r.status;
      console.log(`::error title=${esc(pref + sp.title)}::${esc(msg.replace(/\u001b\[[0-9;]*m/g, ''))}`);
    }
  }
};
(rel.suites || []).forEach(s => anda(s));
for (const e of rel.errors || []) console.log(`::error title=fumaça (global)::${esc((e.message || '').replace(/\u001b\[[0-9;]*m/g, ''))}`);
console.log(`::notice title=fumaça::${n} teste(s) com falha; estatística ${JSON.stringify(rel.stats || {})}`);
