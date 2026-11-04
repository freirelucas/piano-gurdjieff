// telas.js — cada tela é uma função (d, params) → Node. Contagens sempre derivadas dos dados.
import { h, rico, par, limpar } from './dom.js';
import { FERRAMENTAS } from './lab.js';
import * as store from './store.js';

const VEREDITO = { 'nao-sustentado': 'não sustentado', 'quase-sem-evidencia': 'quase sem evidência', 'pontual': 'evidência pontual', 'plausivel': 'plausível', 'sustentado': 'sustentado' };
const ACESSO = { 'aberto': 'aberto', 'aberto-com-login': 'aberto (com login)', 'amostra': 'amostra oficial', 'comercial': 'comercial', 'terceiro-sem-licenca': 'upload de terceiro — só escuta', 'consulta-presencial': 'consulta presencial', 'nao-usar': 'não usar' };
const TIPO = { partitura: 'Partituras', gravacao: 'Gravações', texto: 'Textos abertos (de dentro da tradição)', academico: 'Estudos acadêmicos', oer: 'Recursos educacionais abertos', software: 'Software livre', catalogo: 'Catálogos e arquivos', legal: 'Situação jurídica', alerta: 'Alertas' };
const itensModulo = (m) => [...m.exercicios.map(e => e.id), ...m.autoavaliacao.map(a => a.id)];
const feitos = () => store.ler().feitos;
const pct = (m) => { const ids = itensModulo(m); return Math.round(100 * ids.filter(i => feitos()[i]).length / ids.length); };
const marca = (id, rot) => {
  const c = h('input', { type: 'checkbox', checked: !!feitos()[id], onchange: () => store.alternar(id) });
  return h('label', { class: 'check' }, c, ' ', rot);
};
const fonteLink = (d, id, txt) => { const f = d.fontesMap.get(id); return h('a', { href: f.url, target: '_blank', rel: 'noopener' }, txt || f.titulo); };
const selo = (acesso) => h('span', { class: `selo s-${acesso}` }, ACESSO[acesso] || acesso);

export function inicio(d) {
  const nEx = d.modulos.reduce((s, m) => s + m.exercicios.length, 0);
  const abertas = d.fontes.filter(f => f.acesso === 'aberto').length;
  const prox = d.modulos.find(m => pct(m) < 100) || d.modulos.at(-1);
  const semanas = [...d.modulos.flatMap(m => m.semana.map(s => ({ s, t: `Módulo ${m.n} — ${m.titulo}`, href: `#/m/${m.id}` }))), ...d.plano.semanas.map(x => ({ s: x.semana, t: x.foco, href: '#/progresso' }))].sort((a, b) => a.s - b.s);
  return h('div', {},
    h('section', { class: 'capa' },
      h('p', { class: 'sobre' }, 'Tutor de estudo · música para piano de Gurdjieff/de Hartmann'),
      h('h1', {}, 'Ouvir o que a música faz, não o que dizem que ela codifica'),
      par('Este curso segue um único fio, o dos capítulos 7 e 8 de Johanna Petsche (*Gurdjieff and Music*, Brill, 2015). Escritores de dentro da tradição afirmam três coisas sobre esta música: que as Leis do Três e do Sete estão escritas nela, que ela faz ouvir harmônicos que refletem as ‘oitavas internas’ e que ela é ‘arte objetiva’. Petsche testa as três e encontra pouca sustentação. A pergunta muda então de lugar: se a música não carrega uma cosmologia cifrada, para que serviu? A resposta dela é a escuta exigente como trabalho de atenção, ao lado do livro e dos Movimentos.', d.fontesMap),
      par('O curso ensina cada conceito com precisão, mede-o no seu piano e no Laboratório, e separa sempre **evidência** de **aposta**. Os números que aparecem no texto são calculados a partir das razões; nenhum foi digitado à mão.', d.fontesMap),
      h('p', { class: 'numeros' }, `${d.modulos.length} módulos · ${nEx} exercícios · ${Object.keys(FERRAMENTAS).length} ferramentas · ${d.repertorio.length} peças de repertório · ${d.fontes.length} fontes, ${abertas} de acesso aberto`),
      h('div', { class: 'linha' }, h('a', { class: 'btn', href: `#/m/${prox.id}` }, `Continuar: Módulo ${prox.n} ›`), h('a', { class: 'btn sec', href: '#/evidencia' }, 'Evidência e aposta'))),
    h('section', {}, h('h2', {}, 'Plano de estudo'), par(d.plano.nota, d.fontesMap),
      h('ol', { class: 'semanas' }, semanas.map(x => h('li', {}, h('b', {}, `Semana ${x.s}: `), h('a', { href: x.href }, x.t)))),
      h('h3', {}, 'Rotina diária'),
      h('table', { class: 'tab' }, h('tbody', {}, d.plano.rotina.map(r => h('tr', {}, h('td', {}, h('b', {}, r.bloco)), h('td', { class: 'n' }, `${r.min} min`), h('td', {}, r.o_que))))),
      h('p', { class: 'nota' }, `Total: ${d.plano.rotina.reduce((s, r) => s + r.min, 0)} minutos por dia.`)),
    h('section', {}, h('h2', {}, 'Módulos'), h('div', { class: 'cards' }, d.modulos.map(m => h('a', { class: 'card', href: `#/m/${m.id}` },
      h('span', { class: 'n' }, `Módulo ${m.n}`), h('b', {}, m.titulo), h('span', { class: 'barra' }, h('i', { style: null, dataset: { p: pct(m) } })), h('small', {}, `${pct(m)}% · ${m.exercicios.length} exercícios`))))),
    h('section', { class: 'aviso' }, h('h3', {}, 'Escopo e limites'),
      par('Na tradução de trabalho usada aqui, a seção intitulada §7.7 trata do número sete, dos modos e de MacLaren, e, fora do título, **não discute oitavas internas, harmônicos nem Barrett**; do capítulo 8, ela traz **só a introdução (§8.1)**. O que depende dessas partes está marcado como não verificado. As partituras são da edição Schott, sob direitos autorais: este sítio não reproduz nenhuma. Veja [Fontes](#/fontes) e [Correções](#/correcoes) ao material anterior.', d.fontesMap)));
}

export function modulo(d, [id]) {
  const i = d.modulos.findIndex(m => m.id === id);
  if (i < 0) return naoAchei(`módulo ${id}`);
  const m = d.modulos[i], ant = d.modulos[i - 1], prox = d.modulos[i + 1];
  return h('article', { class: 'modulo' },
    h('p', { class: 'sobre' }, `Módulo ${m.n} · semana ${m.semana.join('–')}`),
    h('h1', {}, m.titulo),
    h('p', { class: 'tese' }, rico(m.tese, d.fontesMap)),
    h('p', { class: 'leitura' }, h('b', {}, 'Leia em Petsche: '), m.leitura.map((l, k) => [k ? ' · ' : '', h('span', {}, `${l.secao} (${l.nota})`)])),
    m.secoes.map(s => h('section', {}, h('h2', {}, s.titulo), s.paragrafos.map(p => par(p, d.fontesMap)))),
    h('section', { class: 'escuta' }, h('h2', {}, 'Escuta'), h('ul', {}, m.escuta.map(e => h('li', {}, fonteLink(d, e.fonte), ' ', selo(d.fontesMap.get(e.fonte).acesso), h('br'), rico(e.foco, d.fontesMap))))),
    h('section', {}, h('h2', {}, 'Laboratório deste módulo'), m.lab.map(t => ferramenta(d, t))),
    h('section', {}, h('h2', {}, 'Exercícios'), m.exercicios.map((e, k) => h('div', { class: 'exercicio', id: e.id },
      h('h3', {}, `${m.n}.${k + 1} ${e.titulo}`), h('p', { class: 'dur' }, `≈ ${e.dur} min · ${e.meio}`),
      h('ol', {}, e.passos.map(p => h('li', {}, rico(p, d.fontesMap)))),
      h('p', { class: 'criterio' }, h('b', {}, 'Critério: '), rico(e.criterio, d.fontesMap)),
      marca(e.id, 'feito')))),
    h('section', { class: 'critica' }, h('h2', {}, 'Evidência e aposta'), par(m.critica, d.fontesMap)),
    h('section', {}, h('h2', {}, 'Autoavaliação'), h('div', { class: 'checks' }, m.autoavaliacao.map(a => marca(a.id, a.texto)))),
    h('nav', { class: 'pag' }, ant ? h('a', { href: `#/m/${ant.id}` }, `‹ Módulo ${ant.n}`) : h('span'), prox ? h('a', { href: `#/m/${prox.id}` }, `Módulo ${prox.n} ›`) : h('a', { href: '#/progresso' }, 'Progresso ›')));
}

function ferramenta(d, id) {
  const f = FERRAMENTAS[id];
  if (!f) throw new Error(`ferramenta inexistente: ${id}`);
  const corpo = h('div', { class: 'ferr-corpo' });
  const box = h('div', { class: 'ferramenta', id: `lab-${id}` }, h('h3', {}, f.titulo), h('p', { class: 'nota' }, f.desc), corpo);
  f.montar(corpo, d);
  return box;
}

export function laboratorio(d, [id]) {
  if (id) {
    if (!FERRAMENTAS[id]) return naoAchei(`a ferramenta ${id}`);
    return h('div', {}, h('p', { class: 'sobre' }, h('a', { href: '#/lab' }, '‹ Laboratório')), h('h1', {}, FERRAMENTAS[id].titulo), ferramenta(d, id));
  }
  return h('div', {}, h('h1', {}, 'Laboratório'),
    par('Todas as ferramentas calculam a partir das mesmas razões e funções testadas automaticamente a cada publicação. O som é sintetizado no navegador; nenhum arquivo de áudio é baixado.', d.fontesMap),
    h('div', { class: 'cards' }, Object.entries(FERRAMENTAS).map(([k, f]) => h('a', { class: 'card', href: `#/lab/${k}` }, h('b', {}, f.titulo), h('small', {}, f.desc)))));
}

export function repertorio(d) {
  const porVol = new Map(); d.repertorio.forEach(r => { if (!porVol.has(r.vol)) porVol.set(r.vol, []); porVol.get(r.vol).push(r); });
  return h('div', {}, h('h1', {}, 'Repertório citado por Petsche'),
    par('Só entram peças que Petsche cita com volume e página da edição Schott (salvo indicação). Nenhuma partitura é reproduzida aqui: use a [edição Schott](fonte:schott). As gravações marcadas como upload de terceiro são para escuta.', d.fontesMap),
    [...porVol.entries()].map(([v, rs]) => h('section', {}, h('h2', {}, v === '—' || v.startsWith('não') ? 'Volume não indicado' : `Volume ${v}`),
      h('table', { class: 'tab' }, h('thead', {}, h('tr', {}, ['peça', 'pp.', 'o que observar', 'módulo', 'ouvir'].map(c => h('th', {}, c)))),
        h('tbody', {}, rs.map(r => { const m = d.modulos.find(x => x.id === r.modulo); return h('tr', {}, h('td', {}, h('b', {}, r.titulo)), h('td', { class: 'n' }, r.pp), h('td', {}, r.observar, ' ', h('small', {}, `(${r.secao})`)), h('td', {}, h('a', { href: `#/m/${m.id}` }, `M${m.n}`)), h('td', {}, [...r.gravacoes, ...r.extra].map((g, k) => [k ? ' · ' : '', fonteLink(d, g, d.fontesMap.get(g).titulo.split('(')[0].slice(0, 38))]))); }))))));
}

export function evidencia(d) {
  return h('div', {}, h('h1', {}, 'Evidência e aposta'),
    par('Cada alegação sobre a música, com quem a faz, o que a apoia, o que a contraria e o veredito que se tira de Petsche. É o mapa do curso inteiro.', d.fontesMap),
    d.evidencia.map(e => h('section', { class: `ev v-${e.veredito}` }, h('h2', {}, e.afirmacao), h('p', { class: 'sobre' }, `${e.quem} · ${e.secao} · `, h('b', {}, VEREDITO[e.veredito])),
      h('div', { class: 'duas' }, h('div', {}, h('h4', {}, 'A favor'), h('ul', {}, e.a_favor.map(x => h('li', {}, rico(x, d.fontesMap))))), h('div', {}, h('h4', {}, 'Contra'), h('ul', {}, e.contra.map(x => h('li', {}, rico(x, d.fontesMap)))))))));
}

export function fontes(d) {
  const grupos = new Map(); d.fontes.forEach(f => { if (!grupos.has(f.tipo)) grupos.set(f.tipo, []); grupos.get(f.tipo).push(f); });
  const ord = ['partitura', 'gravacao', 'texto', 'academico', 'oer', 'software', 'catalogo', 'legal', 'alerta'];
  const DP = new Date('2027-01-01T00:00:00');
  const dias = Math.ceil((DP - new Date()) / 86400000);
  return h('div', {}, h('h1', {}, 'Fontes abertas e situação das partituras'),
    h('section', { class: 'aviso' }, h('h3', {}, 'Onde estão as partituras'),
      par('Não há partitura da colaboração Gurdjieff/de Hartmann no IMSLP. A única edição pública completa é a da [Schott](fonte:schott), em quatro volumes (1996–2005); antes dela houve apenas edições privadas (Janus, 1950–55; Olga de Hartmann). Os manuscritos ligados a Gurdjieff não estão no fundo de Yale: Olga de Hartmann os enviou a Thomas C. Daly, em Montreal ([Mangan](fonte:mangan)).', d.fontesMap),
      par('**No Brasil**, a obra feita em coautoria indivisível só entra em domínio público 70 anos depois de 1º de janeiro do ano seguinte à morte do último coautor ([Lei 9.610, arts. 41–42](fonte:lei9610)). Thomas de Hartmann morreu em 1956. Isso aponta para 1º de janeiro de 2027 para as composições, e o mesmo vale nos países com prazo de vida mais 70 anos. As anotações editoriais e a gravação da edição Schott são outra questão. O resumo não é parecer jurídico: consulte quem possa dá-lo antes de publicar uma edição própria.', d.fontesMap),
      h('p', { class: 'numeros' }, dias > 0 ? `Faltam ${dias} dias para 1º/1/2027.` : 'A data de 1º/1/2027 já passou.')),
    ord.filter(t => grupos.has(t)).map(t => h('section', {}, h('h2', {}, TIPO[t]), h('ul', { class: 'fontes' }, grupos.get(t).map(f => h('li', {},
      h('a', { href: f.url, target: '_blank', rel: 'noopener' }, f.titulo), ' ', selo(f.acesso), h('br'),
      h('small', {}, [f.autor, f.ano].filter(Boolean).join(', '), ' · ', f.licenca, f.conferido ? ` · conferido em ${f.conferido}` : ''), h('br'), rico(f.nota, d.fontesMap)))))));
}

export function progresso(d) {
  const s = store.ler();
  const cego = ['Ré', 'Mi', 'Lá', 'Si'].map(g => { const xs = s.cego.filter(x => x.grau === g); return [g, xs.length, xs.length ? `${Math.round(100 * xs.filter(x => x.ok).length / xs.length)}%` : '—']; });
  const txt = h('textarea', { rows: 3, placeholder: 'o que travou, o que mediu, o que ouviu' });
  const min = h('input', { type: 'number', min: 0, value: 30, class: 'num' });
  const lista = h('div');
  const desenharDiario = () => { limpar(lista); store.ler().diario.slice().reverse().forEach(x => lista.append(h('p', { class: 'reg' }, h('b', {}, `${x.d} · ${x.min} min`), ' — ', x.txt))); };
  const arquivo = h('input', { type: 'file', accept: 'application/json', onchange: async () => {
    const f = arquivo.files[0]; if (!f) return;
    try { store.importar(await f.text()); location.reload(); } catch (e) { alert(`Arquivo inválido: ${e.message}`); }
  } });
  desenharDiario();
  return h('div', {}, h('h1', {}, 'Progresso'),
    h('table', { class: 'tab' }, h('thead', {}, h('tr', {}, ['módulo', 'concluído', 'itens'].map(c => h('th', {}, c)))),
      h('tbody', {}, d.modulos.map(m => h('tr', {}, h('td', {}, h('a', { href: `#/m/${m.id}` }, `${m.n}. ${m.titulo}`)), h('td', { class: 'n' }, `${pct(m)}%`), h('td', { class: 'n' }, String(itensModulo(m).length)))))),
    h('h2', {}, 'Teste cego (Módulo 1)'), h('table', { class: 'tab' }, h('thead', {}, h('tr', {}, ['grau', 'rodadas', 'acertos'].map(c => h('th', {}, c)))), h('tbody', {}, cego.map(l => h('tr', {}, l.map(c => h('td', {}, String(c))))))),
    h('h2', {}, 'Diário'), h('label', { class: 'campo' }, 'Minutos ', min), h('label', { class: 'campo largo' }, 'Registro ', txt),
    h('div', { class: 'linha' }, h('button', { type: 'button', class: 'btn', onclick: () => { if (!txt.value.trim()) return; store.gravar(st => st.diario.push({ d: store.hoje(), min: Number(min.value) || 0, txt: txt.value.trim() })); txt.value = ''; desenharDiario(); } }, 'registrar')), lista,
    h('h2', {}, 'Backup'), par('O progresso fica só neste navegador, numa única chave (`gdh:v1`). Exporte de vez em quando.', d.fontesMap),
    h('div', { class: 'linha' },
      h('button', { type: 'button', class: 'btn', onclick: () => { const b = new Blob([store.exportar()], { type: 'application/json' }); const a = h('a', { href: URL.createObjectURL(b), download: `progresso-gurdjieff-${store.hoje()}.json` }); document.body.append(a); a.click(); a.remove(); } }, '⬇ exportar JSON'),
      h('label', { class: 'btn sec' }, '⬆ importar JSON ', arquivo)));
}

export function correcoes(d) {
  return h('div', {}, h('h1', {}, 'Correções ao material anterior'),
    par('Erros encontrados no rascunho ‘Enriquecimento Pedagógico de Piano’ e o valor correto, calculado pelo mesmo código do Laboratório.', d.fontesMap),
    h('table', { class: 'tab' }, h('thead', {}, h('tr', {}, ['onde', 'no rascunho', 'correto', 'como se verificou'].map(c => h('th', {}, c)))),
      h('tbody', {}, d.correcoes.map(c => h('tr', {}, h('td', {}, c.onde), h('td', { class: 'errado' }, c.rascunho), h('td', {}, rico(c.correto, d.fontesMap)), h('td', {}, c.como))))));
}

export function naoAchei(o) { return h('div', { class: 'aviso' }, h('h1', {}, 'Não encontrado'), h('p', {}, `Não existe ${o}. `, h('a', { href: '#/' }, 'Voltar ao início'))); }
