// lab.js — as ferramentas do Laboratório. Cada uma: montar(el, d) → monta no elemento.
import { h, limpar, par } from './dom.js';
import * as A from './afinacao.js';
import * as S from './som.js';
import { detectar } from './altura.js';
import * as store from './store.js';

const fmt = (x, c = 1) => x.toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
const sinal = (x, c = 1) => (x > 0 ? '+' : x < 0 ? '−' : '±') + fmt(Math.abs(x), c);
const NOMES12 = ['Dó', 'Dó♯', 'Ré', 'Mi♭', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Sol♯', 'Lá', 'Si♭', 'Si'];
const BASES = [['C3', 'Dó3'], ['C4', 'Dó4'], ['C2', 'Dó2']];
function seletor(rotulo, opcoes, valor, aoMudar) {
  const s = h('select', { onchange: () => aoMudar(s.value) }, opcoes.map(([v, t]) => h('option', { value: v, selected: v === valor }, t)));
  return h('label', { class: 'campo' }, rotulo, ' ', s);
}
const botao = (txt, f, cls = '') => h('button', { type: 'button', class: `btn ${cls}`, onclick: f }, txt);
const tabela = (cab, linhas) => h('table', { class: 'tab' }, h('thead', {}, h('tr', {}, cab.map(c => h('th', {}, c)))), h('tbody', {}, linhas.map(l => h('tr', {}, l.map(c => h('td', {}, c))))));

/* ---------------- Teclado de sete tons + teste cego ---------------- */
function teclado(el) {
  let base = 'C4';
  const corpo = h('div');
  const desenhar = () => {
    limpar(corpo);
    const f0 = A.hz(base);
    const teclas = h('div', { class: 'teclas', role: 'group', 'aria-label': 'escala de sete tons' },
      A.SETE_TONS.map(g => h('button', { type: 'button', class: 'tecla', onclick: () => S.tocar(f0 * A.razao(g.razao)) },
        h('b', {}, g.nome), h('span', {}, g.razao), h('small', {}, `${fmt(A.cents(g.razao), 0)}¢`))));
    const justa = A.SETE_TONS.map(g => f0 * A.razao(g.razao));
    const igual = A.SETE_TONS.map(g => f0 * Math.pow(2, g.semitons / 12));
    corpo.append(teclas,
      h('div', { class: 'linha' },
        botao('▶ escala justa', () => S.sequencia(justa)),
        botao('▶ escala temperada', () => S.sequencia(igual), 'sec'),
        botao('■ parar', () => S.parar(), 'sec')),
      tabela(['grau', 'razão', 'justo', 'temperado', 'desvio', 'A/B'],
        A.SETE_TONS.slice(1, 7).map(g => [g.nome, g.razao, `${fmt(A.cents(g.razao))}¢`, `${g.semitons * 100}¢`, `${sinal(A.desvioTemperado(g.razao))}¢`,
          botao('justo → temperado → juntos', () => {
            const j = f0 * A.razao(g.razao), e = f0 * Math.pow(2, g.semitons / 12);
            S.parar(); S.tocar(j, { dur: 1.1 }); S.tocar(e, { dur: 1.1, quando: 1.3 }); S.tocar(j, { dur: 1.6, quando: 2.6 }); S.tocar(e, { dur: 1.6, quando: 2.6 });
          }, 'mini')])),
      cego(f0));
  };
  el.append(seletor('Tônica', BASES, base, v => { base = v; desenhar(); }), corpo);
  desenhar();
}
function cego(f0) {
  let grau = 'Mi', rodada = null;
  const st = h('p', { class: 'estado', 'aria-live': 'polite' }, 'Escolha o grau e comece uma rodada.');
  const placar = h('p', { class: 'placar' });
  const atualizar = () => {
    const xs = store.ler().cego.filter(x => x.grau === grau);
    const ult = xs.slice(-10), ok = ult.filter(x => x.ok).length;
    placar.textContent = xs.length ? `${grau}: ${ok}/${ult.length} nas últimas ${ult.length} rodadas (${xs.length} no total).` : `${grau}: nenhuma rodada ainda.`;
  };
  const g = () => A.SETE_TONS.find(x => x.nome === grau);
  const nova = () => {
    const justaPrimeiro = Math.random() < 0.5; rodada = { justaPrimeiro };
    const j = f0 * A.razao(g().razao), e = f0 * Math.pow(2, g().semitons / 12);
    const [a, b] = justaPrimeiro ? [j, e] : [e, j];
    S.parar(); S.tocar(f0, { dur: 3, ganho: 0.12 }); S.tocar(a, { dur: 1.2, quando: 0.2 }); S.tocar(f0, { dur: 3, ganho: 0.12, quando: 1.6 }); S.tocar(b, { dur: 1.2, quando: 1.8 });
    st.textContent = 'Ouça A e depois B (sobre a tônica). Qual era a justa?';
  };
  const responder = (escolheuA) => {
    if (!rodada) { st.textContent = 'Comece uma rodada primeiro.'; return; }
    const ok = escolheuA === rodada.justaPrimeiro;
    store.gravar(s => s.cego.push({ d: store.hoje(), grau, ok }));
    st.textContent = ok ? '✓ Certo.' : `✗ Era ${rodada.justaPrimeiro ? 'A' : 'B'}.`; rodada = null; atualizar();
  };
  const box = h('div', { class: 'cego' }, h('h4', {}, 'Teste cego'),
    seletor('Grau', ['Ré', 'Mi', 'Lá', 'Si'].map(x => [x, x]), grau, v => { grau = v; atualizar(); }),
    h('div', { class: 'linha' }, botao('▶ nova rodada', nova), botao('A era a justa', () => responder(true), 'sec'), botao('B era a justa', () => responder(false), 'sec')),
    st, placar);
  atualizar();
  return box;
}

/* ---------------- Batimentos ---------------- */
const DIADES = [
  { id: 'C4E4', nome: 'terça maior Dó4–Mi4', a: 'C4', b: 'E4', p: 5, q: 4, r: '5/4', semi: 4 },
  { id: 'C3E3', nome: 'terça maior Dó3–Mi3', a: 'C3', b: 'E3', p: 5, q: 4, r: '5/4', semi: 4 },
  { id: 'C4G4', nome: 'quinta Dó4–Sol4', a: 'C4', b: 'G4', p: 3, q: 2, r: '3/2', semi: 7 },
  { id: 'C4A4', nome: 'sexta maior Dó4–Lá4', a: 'C4', b: 'A4', p: 5, q: 3, r: '5/3', semi: 9 },
];
function batimentos(el) {
  let id = 'C4E4';
  const info = h('p', { class: 'estado' });
  const d = () => DIADES.find(x => x.id === id);
  const mostrar = () => { const x = d(); info.textContent = `Temperada: o parcial ${x.p} de ${x.a} bate contra o parcial ${x.q} de ${x.b} a ${fmt(A.batimento(x.a, x.b, x.p, x.q))} Hz. Justa (${x.r}): os parciais coincidem e não batem.`; };
  const soar = (justa) => { const x = d(), f = A.hz(x.a); S.parar(); S.tocar(f, { dur: 5, ganho: 0.2 }); S.tocar(justa ? f * A.razao(x.r) : f * Math.pow(2, x.semi / 12), { dur: 5, ganho: 0.2 }); };
  el.append(seletor('Intervalo', DIADES.map(x => [x.id, x.nome]), id, v => { id = v; mostrar(); }),
    h('div', { class: 'linha' }, botao('▶ temperada (piano)', () => soar(false)), botao('▶ justa', () => soar(true), 'sec'), botao('■ parar', () => S.parar(), 'sec')), info);
  mostrar();
}

/* ---------------- Série harmônica ---------------- */
function harmonicos(el) {
  let base = 'A2';
  const corpo = h('div');
  const desenhar = () => {
    limpar(corpo);
    const f0 = A.hz(base), m0 = A.midi(base), hs = A.harmonicos(f0, 8);
    corpo.append(
      h('div', { class: 'linha' }, hs.map(x => botao(String(x.k), () => { S.parar(); S.tocar(x.hz, { dur: 2, timbre: S.TIMBRE.puro, ganho: 0.3 }); }, 'mini')),
        botao('▶ série 1–8 somada', () => { S.parar(); hs.forEach(x => S.tocar(x.hz, { dur: 3, timbre: S.TIMBRE.puro, ganho: 0.25 / x.k })); }),
        botao('■ parar', () => S.parar(), 'sec')),
      tabela(['harmônico', 'Hz', 'nota temperada mais próxima', 'desvio'],
        hs.map(x => { const m = m0 + x.semitons; return [x.k, fmt(x.hz), `${NOMES12[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`, `${sinal(x.desvio)}¢`]; })),
      h('p', { class: 'nota' }, 'Graus da escala de sete tons entre os harmônicos 8–16 da tônica: ',
        A.grausNaSerie().slice(0, 7).map(g => `${g.nome} ${g.naSerie ? '✓' : '✗'}`).join(' · ')));
  };
  el.append(seletor('Fundamental', [['A2', 'Lá2'], ['C2', 'Dó2'], ['C3', 'Dó3']], base, v => { base = v; desenhar(); }), corpo);
  desenhar();
}

/* ---------------- Oitava interna ---------------- */
function oitava(el) {
  let passo = 0;
  const f0 = A.hz('C4');
  const PASSOS = A.passos();
  const info = h('p', { class: 'estado' });
  const micro = () => {
    const g = A.SETE_TONS, a = f0 * A.razao(g[passo].razao), b = f0 * A.razao(g[passo + 1].razao);
    const largura = A.cents(b / a);
    return { a, b, largura, fs: g.map(x => a * Math.pow(b / a, A.cents(x.razao) / 1200)) };
  };
  const mostrar = () => { const m = micro(); const p = PASSOS[passo]; info.textContent = `${p.de}–${p.para} (${p.razao}) mede ${fmt(m.largura)}¢; a oitava interna o divide em sete passos de ${fmt(m.largura * A.cents('9/8') / 1200)}¢ a ${fmt(m.largura * A.cents('16/15') / 1200)}¢.`; };
  el.append(seletor('Passo', PASSOS.map((p, i) => [String(i), `${p.de}–${p.para}`]), '0', v => { passo = Number(v); mostrar(); }),
    h('div', { class: 'linha' },
      botao('▶ escala “de fora”', () => S.sequencia(A.SETE_TONS.map(x => f0 * A.razao(x.razao)))),
      botao('▶ oitava “de dentro”', () => S.sequencia(micro().fs), 'sec'),
      botao('■ parar', () => S.parar(), 'sec')), info);
  mostrar();
}

/* ---------------- Afinador por microfone ---------------- */
function afinador(el) {
  let base = 'C3', mic = null, raf = 0, bordao = null, analisador = null, buf = null;
  const leitura = h('div', { class: 'afinador', 'aria-live': 'polite' }, '—');
  const agulha = h('div', { class: 'agulha' });
  const escala = h('div', { class: 'escala-ag' }, agulha, h('span', {}, '−50¢'), h('span', {}, 'justo'), h('span', {}, '+50¢'));
  const bMic = botao('🎤 ligar microfone', async () => {
    if (mic) { desligar(); return; }
    try {
      const a = S.audio();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      mic = { stream, src: a.createMediaStreamSource(stream) };
      analisador = a.createAnalyser(); analisador.fftSize = 2048; buf = new Float32Array(analisador.fftSize);
      mic.src.connect(analisador); bMic.textContent = '🎤 ouvindo — desligar'; laco();
    } catch (e) { leitura.textContent = `Sem acesso ao microfone (${e.name}). Permita o acesso e tente de novo.`; }
  });
  const desligar = () => { cancelAnimationFrame(raf); mic?.stream.getTracks().forEach(t => t.stop()); mic = null; bMic.textContent = '🎤 ligar microfone'; leitura.textContent = '—'; };
  const laco = () => {
    analisador.getFloatTimeDomainData(buf);
    const f = detectar(buf, S.audio().sampleRate);
    if (f) {
      const r = A.analisarAltura(f, A.hz(base));
      leitura.textContent = `${fmt(f)} Hz · ${r.grau.nome} · ${sinal(r.desvioJusto)}¢ do justo · ${sinal(r.desvioIgual)}¢ do piano`;
      agulha.style.left = `${Math.max(0, Math.min(100, 50 + r.desvioJusto))}%`;
      agulha.classList.toggle('ok', Math.abs(r.desvioJusto) <= 10);
    }
    raf = requestAnimationFrame(laco);
  };
  const bBordao = botao('▶ bordão na tônica', () => {
    if (bordao) { bordao(); bordao = null; bBordao.textContent = '▶ bordão na tônica'; return; }
    bordao = S.tocar(A.hz(base), { sustentar: true, ganho: 0.15 }); bBordao.textContent = '■ parar bordão';
  }, 'sec');
  el.append(seletor('Tônica', [['C3', 'Dó3'], ['C4', 'Dó4'], ['A2', 'Lá2'], ['G3', 'Sol3']], base, v => { base = v; }),
    h('div', { class: 'linha' }, bMic, bBordao), escala, leitura,
    h('p', { class: 'nota' }, 'Use fones se o bordão estiver ligado, para o microfone não ouvir o alto-falante. Verde: a ±10¢ do grau justo.'));
}

/* ---------------- Metrônomo com agrupamentos ---------------- */
const GRUPOS = [['2+2+2', '3/4 (2+2+2 colcheias)'], ['2+2+3', '7/8 (2+2+3)'], ['2+3+2', '7/8 (2+3+2)'], ['3+2+2', '7/8 (3+2+2)']];
function metronomo(el) {
  let grupo = '2+2+3', bpm = 240, on = false, prox = 0, i = 0, timer = 0;
  const pontos = h('div', { class: 'pontos' });
  const padrao = () => { const g = grupo.split('+').map(Number); const p = []; g.forEach((n, k) => { for (let j = 0; j < n; j++) p.push(j === 0 ? (k === 0 ? 2 : 1) : 0); }); return p; };
  const desenhar = () => { limpar(pontos); padrao().forEach(a => pontos.append(h('span', { class: `pt a${a}` }))); };
  const agendar = () => {
    const a = S.audio(), p = padrao();
    while (prox < a.currentTime + 0.12) {
      const ac = p[i % p.length];
      S.tocar(ac === 2 ? 1760 : ac === 1 ? 1320 : 880, { dur: 0.05, ganho: ac ? 0.3 : 0.15, timbre: S.TIMBRE.puro, quando: prox - a.currentTime });
      const idx = i % p.length; const atraso = Math.max(0, (prox - a.currentTime) * 1000);
      setTimeout(() => { [...pontos.children].forEach((c, k) => c.classList.toggle('vivo', k === idx)); }, atraso);
      prox += 60 / bpm; i++;
    }
    timer = setTimeout(agendar, 25);
  };
  const b = botao('▶ iniciar', () => {
    on = !on;
    if (on) { prox = S.audio().currentTime + 0.05; i = 0; agendar(); b.textContent = '■ parar'; }
    else { clearTimeout(timer); b.textContent = '▶ iniciar'; }
  });
  const vel = h('input', { type: 'number', min: 60, max: 480, value: bpm, oninput: () => { bpm = Math.max(60, Math.min(480, Number(vel.value) || 240)); } });
  el.append(seletor('Agrupamento', GRUPOS, grupo, v => { grupo = v; desenhar(); }), h('label', { class: 'campo' }, 'Colcheias por minuto ', vel), h('div', { class: 'linha' }, b), pontos);
  desenhar();
}

/* ---------------- Contador com controle ---------------- */
const CATS = ['fórmula de compasso', 'número de partes', 'repetições indicadas', 'notas por motivo', 'acidentes na armadura'];
const NUMS = [2, 3, 4, 5, 7];
function contador(el) {
  const peca = h('input', { type: 'text', placeholder: 'peça (ex.: 10º Hino, Vol. IV, 44–46)' });
  const regra = h('textarea', { rows: 2, placeholder: 'regra fixada ANTES de abrir a partitura' });
  const cel = {};
  const grade = h('table', { class: 'tab' }, h('thead', {}, h('tr', {}, h('th', {}, 'categoria'), NUMS.map(n => h('th', {}, String(n))))),
    h('tbody', {}, CATS.map(c => h('tr', {}, h('td', {}, c), NUMS.map(n => { const i = h('input', { type: 'number', min: 0, value: 0, class: 'num' }); cel[`${c}|${n}`] = i; return h('td', {}, i); })))));
  const lista = h('div');
  const resumo = (x) => {
    const tot = Object.fromEntries(NUMS.map(n => [n, CATS.reduce((s, c) => s + (x.cont[`${c}|${n}`] || 0), 0)]));
    const ctrl = (tot[2] + tot[4] + tot[5]) / 3;
    const raz = (n) => ctrl ? fmt(tot[n] / ctrl, 2) : '—';
    return `${x.peca}: três = ${tot[3]}, sete = ${tot[7]}, média dos controles (2, 4, 5) = ${fmt(ctrl)} → razão três/controle ${raz(3)}, sete/controle ${raz(7)}.`;
  };
  const desenhar = () => { limpar(lista); store.ler().contagens.slice().reverse().forEach(x => lista.append(h('p', { class: 'reg' }, `${x.d} · `, resumo(x), x.regra ? h('br') : null, x.regra ? h('small', {}, `regra: ${x.regra}`) : null))); };
  el.append(h('label', { class: 'campo' }, 'Peça ', peca), h('label', { class: 'campo largo' }, 'Regra ', regra), grade,
    h('div', { class: 'linha' }, botao('salvar contagem', () => {
      if (!peca.value.trim() || !regra.value.trim()) { alert('Preencha a peça e a regra: a regra vem antes da contagem.'); return; }
      const cont = {}; Object.entries(cel).forEach(([k, i]) => { cont[k] = Math.max(0, Number(i.value) || 0); });
      store.gravar(s => s.contagens.push({ d: store.hoje(), peca: peca.value.trim(), regra: regra.value.trim(), cont }));
      Object.values(cel).forEach(i => { i.value = 0; }); desenhar();
    })), lista);
  desenhar();
}

/* ---------------- Registro de escuta (uniformidade) ---------------- */
const CATEG = ['alegria', 'tristeza', 'solenidade/religiosidade', 'tédio', 'inquietação', 'outra'];
function escuta(el) {
  const peca = h('input', { type: 'text', placeholder: 'peça e gravação' });
  const grupo = h('select', {}, [['A', 'A — sem informação prévia'], ['B', 'B — com informação prévia'], ['eu', 'autoteste']].map(([v, t]) => h('option', { value: v }, t)));
  const cat = h('select', {}, CATEG.map(c => h('option', { value: c }, c)));
  const frase = h('input', { type: 'text', placeholder: 'frase do ouvinte (opcional)' });
  const lim = h('input', { type: 'number', min: 50, max: 100, value: 80, class: 'num' });
  const res = h('div');
  const desenhar = () => {
    limpar(res);
    const xs = store.ler().escutas, grupos = new Map();
    xs.forEach(x => { const k = `${x.peca}|${x.grupo}`; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(x); });
    if (!grupos.size) { res.append(h('p', { class: 'nota' }, 'Nenhuma resposta registrada.')); return; }
    res.append(tabela(['peça', 'grupo', 'n', 'categoria mais escolhida', 'proporção', `uniforme (≥${lim.value}%)?`],
      [...grupos.entries()].map(([k, v]) => {
        const c = new Map(); v.forEach(x => c.set(x.cat, (c.get(x.cat) || 0) + 1));
        const [moda, nm] = [...c.entries()].sort((a, b) => b[1] - a[1])[0];
        const pr = 100 * nm / v.length;
        return [k.split('|')[0], k.split('|')[1], v.length, moda, `${fmt(pr, 0)}%`, v.length < 5 ? 'n < 5' : pr >= Number(lim.value) ? 'sim' : 'não'];
      })));
  };
  el.append(h('label', { class: 'campo' }, 'Peça ', peca), h('label', { class: 'campo' }, 'Grupo ', grupo), h('label', { class: 'campo' }, 'Categoria ', cat),
    h('label', { class: 'campo largo' }, 'Frase ', frase), h('label', { class: 'campo' }, 'Limiar % ', lim),
    h('div', { class: 'linha' }, botao('registrar resposta', () => {
      if (!peca.value.trim()) { alert('Indique a peça.'); return; }
      store.gravar(s => s.escutas.push({ d: store.hoje(), peca: peca.value.trim(), grupo: grupo.value, cat: cat.value, frase: frase.value.trim() }));
      frase.value = ''; desenhar();
    }), botao('recalcular', desenhar, 'sec')), res);
  desenhar();
}

/* ---------------- Arquivos de afinação ---------------- */
function downloads(el) {
  el.append(par('Dois arquivos no formato Scala, gerados a partir das mesmas razões que o resto do site usa. O **.scl** define a escala de sete tons; o **.kbm** mapeia os sete graus nas teclas brancas, com Dó no Dó central (MIDI 60, {hz:C4}). As teclas pretas ficam sem som.', new Map()),
    h('div', { class: 'linha' }, h('a', { class: 'btn', href: './downloads/sete_tons.scl', download: '' }, '⬇ sete_tons.scl'), h('a', { class: 'btn sec', href: './downloads/sete_tons_teclas_brancas.kbm', download: '' }, '⬇ sete_tons_teclas_brancas.kbm')),
    par('No Surge XT: menu de afinação › Load .scl, depois Load .kbm. Funciona igual no Pianoteq e em outros instrumentos compatíveis com Scala.', new Map()));
}

export const FERRAMENTAS = {
  teclado: { titulo: 'Teclado de sete tons', desc: 'Escala justa e temperada, comparação por grau e teste cego.', montar: teclado },
  batimentos: { titulo: 'Batimentos', desc: 'Por que a terça do piano treme e a justa não.', montar: batimentos },
  harmonicos: { titulo: 'Série harmônica', desc: 'Harmônicos 1–8 isolados e somados, com desvio do piano.', montar: harmonicos },
  oitava: { titulo: 'Oitava interna', desc: 'Um passo da escala dividido em sete, nas mesmas proporções.', montar: oitava },
  afinador: { titulo: 'Afinador justo', desc: 'Microfone + bordão: desvio em relação ao grau justo e ao piano.', montar: afinador },
  metronomo: { titulo: 'Metrônomo de agrupamentos', desc: '3/4 e os três agrupamentos de 7/8.', montar: metronomo },
  contador: { titulo: 'Contador com controle', desc: 'Conte 3 e 7 contra os números de controle 2, 4 e 5.', montar: contador },
  escuta: { titulo: 'Registro de escuta', desc: 'Teste de uniformidade da ‘música objetiva’.', montar: escuta },
  downloads: { titulo: 'Arquivos de afinação', desc: '.scl e .kbm da escala de sete tons para o Surge XT.', montar: downloads },
};
