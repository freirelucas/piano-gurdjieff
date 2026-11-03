// main.js — roteador por hash, cabeçalho, erros visíveis e atualização do service worker.
import { h, limpar } from './dom.js';
import { carregar } from './dados.js';
import * as T from './telas.js';
import * as S from './som.js';
import * as store from './store.js';

const ROTAS = [
  [/^#?\/?$/, T.inicio], [/^#\/m\/([\w-]+)$/, T.modulo], [/^#\/lab(?:\/([\w-]+))?$/, T.laboratorio],
  [/^#\/repertorio$/, T.repertorio], [/^#\/evidencia$/, T.evidencia], [/^#\/fontes$/, T.fontes],
  [/^#\/progresso$/, T.progresso], [/^#\/correcoes$/, T.correcoes],
];
const tela = document.getElementById('tela');
const faixa = document.getElementById('faixa');

function erro(e) {
  console.error(e);
  limpar(tela).append(h('div', { class: 'aviso erro', role: 'alert' }, h('h1', {}, 'Algo falhou'), h('p', {}, String(e && e.message || e)), h('p', {}, h('a', { href: '#/' }, 'Voltar ao início'))));
}
function marcarNav() {
  const r = location.hash.split('/')[1] || '';
  document.querySelectorAll('nav.menu a').forEach(a => a.classList.toggle('ativa', (a.getAttribute('href').split('/')[1] || '') === r));
}
function barras() { document.querySelectorAll('.barra i[data-p]').forEach(i => { i.style.width = `${i.dataset.p}%`; }); }

async function iniciar() {
  let d;
  try { d = await carregar(); } catch (e) { erro(new Error(`Não consegui carregar o conteúdo: ${e.message}`)); return; }
  const rodar = () => {
    S.parar();
    const hash = location.hash || '#/';
    try {
      for (const [re, f] of ROTAS) {
        const m = re.exec(hash);
        if (m) { limpar(tela).append(f(d, m.slice(1).filter(x => x !== undefined))); barras(); marcarNav(); window.scrollTo(0, 0); return; }
      }
      limpar(tela).append(T.naoAchei(`a página ${hash}`)); marcarNav();
    } catch (e) { erro(e); }
  };
  window.addEventListener('hashchange', rodar);
  store.ouvir((_, aviso) => { faixa.hidden = !aviso; faixa.textContent = aviso || ''; });
  const av = (store.ler(), store.avisoAtual()); if (av) { faixa.hidden = false; faixa.textContent = av; }
  rodar();
}

function servico() {
  if (!('serviceWorker' in navigator) || !/^https:|^http:\/\/localhost/.test(location.href)) return;
  navigator.serviceWorker.register('./sw.js').then(reg => {
    const oferecer = (w) => {
      const b = h('button', { type: 'button', class: 'btn', onclick: () => w.postMessage('ativar') }, 'atualizar');
      limpar(faixa).append('Há uma versão nova do curso. ', b); faixa.hidden = false;
    };
    if (reg.waiting) oferecer(reg.waiting);
    reg.addEventListener('updatefound', () => { const w = reg.installing; w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) oferecer(w); }); });
  }, e => console.error('service worker:', e));
  // só recarrega numa ATUALIZAÇÃO (já havia controlador); na primeira instalação, clients.claim() não deve recarregar
  const tinhaControlador = !!navigator.serviceWorker.controller;
  let recarregou = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (tinhaControlador && !recarregou) { recarregou = true; location.reload(); } });
}

// erros globais: visíveis na faixa, sem apagar a tela
const avisar = (x) => { console.error(x); faixa.hidden = false; faixa.textContent = `Erro: ${x && x.message || x}`; };
window.addEventListener('error', ev => avisar(ev.error || ev.message));
window.addEventListener('unhandledrejection', ev => avisar(ev.reason));
iniciar(); servico();
