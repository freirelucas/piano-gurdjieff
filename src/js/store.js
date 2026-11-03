// store.js — armazenamento local com prefixo e versão de esquema.
// Uma única chave na origem (freirelucas.github.io é compartilhada por vários sítios):
//   gdh:v1 → { v:1, feitos:{id:data}, diario:[], cego:[], contagens:[], escutas:[] }
const CHAVE = 'gdh:v1';
const VAZIO = () => ({ v: 1, feitos: {}, diario: [], cego: [], contagens: [], escutas: [] });
let estado = null, ouvintes = new Set(), aviso = null;

export function ler() {
  if (estado) return estado;
  try {
    const bruto = localStorage.getItem(CHAVE);
    estado = bruto ? migrar(JSON.parse(bruto)) : VAZIO();
  } catch (e) {
    aviso = 'Não consegui ler o progresso salvo neste navegador; começando vazio. Se você exportou um backup, importe-o em Progresso.';
    estado = VAZIO();
  }
  return estado;
}
function migrar(o) {
  if (!o || typeof o !== 'object' || o.v !== 1) throw new Error('esquema desconhecido');
  return { ...VAZIO(), ...o };
}
export function gravar(muda) {
  const s = ler(); muda(s);
  try { localStorage.setItem(CHAVE, JSON.stringify(s)); aviso = null; }
  catch (e) { aviso = `O navegador recusou salvar (${e.name}). Exporte o progresso em Progresso para não perder dados.`; }
  ouvintes.forEach(f => f(s, aviso));
}
export const ouvir = (f) => { ouvintes.add(f); return () => ouvintes.delete(f); };
export const avisoAtual = () => aviso;
export const hoje = () => new Date().toISOString().slice(0, 10);
export const alternar = (id) => gravar(s => { if (s.feitos[id]) delete s.feitos[id]; else s.feitos[id] = hoje(); });
export const exportar = () => JSON.stringify(ler(), null, 1);
export function importar(texto) {
  const o = migrar(JSON.parse(texto));
  gravar(s => { Object.keys(s).forEach(k => delete s[k]); Object.assign(s, o); });
}
