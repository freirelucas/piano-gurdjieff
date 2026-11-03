#!/usr/bin/env python3
"""Confere os URLs de content/fontes.json. Sai com 1 se algum responder 404/410 ou não resolver.
403/429 e tempo esgotado viram AVISO (muitos sítios recusam robôs). Uso: python tools/check_links.py relatorio.md"""
import json, pathlib, sys, urllib.request, urllib.error

R = pathlib.Path(__file__).resolve().parent.parent
fontes = json.loads((R / "content/fontes.json").read_text(encoding="utf-8"))
quebrados, avisos, ok = [], [], 0
for f in fontes:
    try:
        req = urllib.request.Request(f["url"], method="GET")
        with urllib.request.urlopen(req, timeout=25) as r:
            ok += 1
    except urllib.error.HTTPError as e:
        (quebrados if e.code in (404, 410) else avisos).append((f, f"HTTP {e.code}"))
    except Exception as e:  # DNS, TLS, tempo esgotado
        (avisos if "timed out" in str(e) else quebrados).append((f, type(e).__name__ + ": " + str(e)[:80]))
linhas = [f"# Conferência de links — {len(fontes)} fontes", "", f"- ok: {ok}", f"- quebrados: {len(quebrados)}", f"- avisos: {len(avisos)}", ""]
for titulo, xs in (("Quebrados", quebrados), ("Avisos", avisos)):
    if xs:
        linhas += [f"## {titulo}", ""] + [f"- `{f['id']}` {m} — {f['url']}" for f, m in xs] + [""]
out = "\n".join(linhas)
print(out)
if len(sys.argv) > 1:
    pathlib.Path(sys.argv[1]).write_text(out, encoding="utf-8")
sys.exit(1 if quebrados else 0)
