// Service worker GERADO pelo build: versão = hash do conteúdo, lista = todos os arquivos do _site.
// Prefixo próprio (gdh-): a origem freirelucas.github.io é compartilhada por vários sítios,
// então só apagamos caches com o NOSSO prefixo.
const PREFIXO = 'gdh-';
const CACHE = PREFIXO + '__VERSAO__';
const ARQUIVOS = __ARQUIVOS__;

self.addEventListener('install', e => {
  // sem catch: se um arquivo faltar, a instalação FALHA (e o navegador tenta de novo) em vez de fingir que há offline
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)));
});
self.addEventListener('message', e => { if (e.data === 'ativar') self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith(PREFIXO) && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;            // links externos: nunca interceptar
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    if (hit) return hit;                                  // tudo do sítio está pré-cacheado e versionado
    const r = await fetch(e.request);
    return r;                                             // fora da lista: rede, sem gravar
  }));
});
