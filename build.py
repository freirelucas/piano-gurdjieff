#!/usr/bin/env python3
"""Monta _site/: copia src/, publica content/ em data/, gera os arquivos de afinação
e o service worker (versão = hash de conteúdo; lista de pré-cache = todos os arquivos).
Uso: python build.py
"""
import hashlib, json, re, shutil, pathlib

RAIZ = pathlib.Path(__file__).resolve().parent
SRC, CONT, SITE = RAIZ / "src", RAIZ / "content", RAIZ / "_site"


def razoes_do_js():
    """Lê as razões da escala direto de afinacao.js (fonte única), sem duplicar números aqui."""
    js = (SRC / "js" / "afinacao.js").read_text(encoding="utf-8")
    bloco = js.split("export const SETE_TONS")[1].split("];")[0]
    rs = re.findall(r"nome: '([^']+)', razao: '(\d+/\d+)'", bloco)
    assert len(rs) == 8 and rs[0][1] == "1/1" and rs[-1][1] == "2/1", rs
    return rs


def arquivos_afinacao(destino):
    rs = razoes_do_js()
    scl = ["! sete_tons.scl", "!", "Escala de sete tons de Gurdjieff (Ouspensky, Search, 125) = diatonico sintonico de Ptolomeu", " 7", "!"]
    scl += [f" {r}" for _, r in rs[1:]]
    kbm = ["! sete_tons_teclas_brancas.kbm — 7 graus nas teclas brancas; teclas pretas sem som",
           "! tamanho do mapa", "12", "! primeira e ultima nota MIDI", "0", "127",
           "! nota central (grau 0 da escala)", "60", "! nota de referencia e frequencia", "60", "261.625565",
           "! grau da oitava formal", "7", "! mapa: C C# D D# E F F# G G# A A# B",
           "0", "x", "1", "x", "2", "3", "x", "4", "x", "5", "x", "6"]
    destino.mkdir(parents=True, exist_ok=True)
    (destino / "sete_tons.scl").write_text("\n".join(scl) + "\n", encoding="ascii")
    (destino / "sete_tons_teclas_brancas.kbm").write_text("\n".join(kbm) + "\n", encoding="utf-8")


def main():
    if SITE.exists():
        shutil.rmtree(SITE)
    shutil.copytree(SRC, SITE, ignore=shutil.ignore_patterns("sw.template.js"))
    (SITE / "data").mkdir()
    for f in sorted(CONT.glob("*.json")):
        json.loads(f.read_text(encoding="utf-8"))          # falha se o JSON for inválido
        shutil.copy(f, SITE / "data" / f.name)
    arquivos_afinacao(SITE / "downloads")
    (SITE / ".nojekyll").write_text("")

    arquivos = sorted(p.relative_to(SITE).as_posix() for p in SITE.rglob("*") if p.is_file() and p.name != ".nojekyll")
    h = hashlib.sha256()
    for a in arquivos:
        h.update(a.encode()); h.update((SITE / a).read_bytes())
    versao = h.hexdigest()[:12]
    lista = ["./"] + [f"./{a}" for a in arquivos]
    sw = (SRC / "sw.template.js").read_text(encoding="utf-8")
    sw = sw.replace("__VERSAO__", versao).replace("__ARQUIVOS__", json.dumps(lista, ensure_ascii=False))
    (SITE / "sw.js").write_text(sw, encoding="utf-8")
    (SITE / "versao.json").write_text(json.dumps({"versao": versao, "arquivos": len(lista)}), encoding="utf-8")
    kb = sum(p.stat().st_size for p in SITE.rglob("*") if p.is_file()) // 1024
    print(f"_site pronto: {len(lista)} entradas no pré-cache, {kb} KB, versão {versao}")


if __name__ == "__main__":
    main()
