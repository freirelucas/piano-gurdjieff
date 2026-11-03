// dados.js — carrega o conteúdo. Falha ALTO: nada de .catch() vazio.
const ARQUIVOS = ['modulos', 'fontes', 'evidencia', 'repertorio', 'correcoes', 'plano'];
export async function carregar() {
  const pares = await Promise.all(ARQUIVOS.map(async n => {
    const r = await fetch(`./data/${n}.json`);
    if (!r.ok) throw new Error(`data/${n}.json respondeu ${r.status}`);
    return [n, await r.json()];
  }));
  const d = Object.fromEntries(pares);
  d.fontesMap = new Map(d.fontes.map(f => [f.id, f]));
  return d;
}
