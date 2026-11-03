#!/usr/bin/env python3
"""Contrato do conteúdo. Reprova o build se:
 1. algum JSON fugir do esquema (schema/*.schema.json);
 2. ids se repetirem, ou um módulo citar fonte/ferramenta/módulo inexistente;
 3. houver número em cents ou Hz DIGITADO no texto (tem de ser token {c:..}, {dev:..}, {bat:..}, {et:..}, {hz:..});
 4. algum URL não for https (exceto os marcados como repositório institucional http);
 5. algum link interno apontar para rota que não existe.
Uso: python tools/check_conteudo.py
"""
import json, pathlib, re, sys
from jsonschema import Draft202012Validator

R = pathlib.Path(__file__).resolve().parent.parent
C, S = R / "content", R / "schema"
ERROS = []
err = ERROS.append
ler = lambda n: json.loads((C / f"{n}.json").read_text(encoding="utf-8"))
d = {n: ler(n) for n in ["modulos", "fontes", "evidencia", "repertorio", "correcoes", "plano"]}

# 1. esquema
for n, obj in d.items():
    sch = json.loads((S / f"{n}.schema.json").read_text(encoding="utf-8"))
    for e in Draft202012Validator(sch).iter_errors(obj):
        err(f"{n}.json: {'/'.join(map(str, e.path))}: {e.message}")

# 2. referências
fontes = {f["id"] for f in d["fontes"]}
mods = {m["id"] for m in d["modulos"]}
lab_js = (R / "src/js/lab.js").read_text(encoding="utf-8")
ferramentas = set(re.findall(r"^\s+(\w+): \{ titulo:", lab_js, re.M))
todos = [f["id"] for f in d["fontes"]] + [m["id"] for m in d["modulos"]] + [e["id"] for m in d["modulos"] for e in m["exercicios"]] \
        + [a["id"] for m in d["modulos"] for a in m["autoavaliacao"]] + [x["id"] for x in d["evidencia"] + d["repertorio"] + d["correcoes"]]
dup = {x for x in todos if todos.count(x) > 1}
if dup: err(f"ids repetidos: {sorted(dup)}")
for m in d["modulos"]:
    for t in m["lab"]:
        if t not in ferramentas: err(f"{m['id']}: ferramenta inexistente {t}")
    for e in m["escuta"]:
        if e["fonte"] not in fontes: err(f"{m['id']}: escuta cita fonte inexistente {e['fonte']}")
for r in d["repertorio"]:
    if r["modulo"] not in mods: err(f"{r['id']}: módulo inexistente {r['modulo']}")
    for g in r["gravacoes"] + r["extra"]:
        if g not in fontes: err(f"{r['id']}: fonte inexistente {g}")

# 3/5. varre todo texto
ROTAS = re.compile(r"^#/(?:$|m/(\w+)$|lab(?:/(\w+))?$|repertorio$|evidencia$|fontes$|progresso$|correcoes$)")
NUM_DIGITADO = re.compile(r"(?<![±{:\w/])\d+(?:[.,]\d+)?\s*(?:cents|¢|Hz)\b")
TOKEN = re.compile(r"\{(c|c0|dev|bat|et|hz|hzr):([^}\s]+)\}")
RZ, NT = r"\d+/\d+", r"[A-G][#b]?-?\d"
VALOR = {"c": RZ, "c0": RZ, "dev": RZ, "et": r"\d+", "hz": NT, "hzr": rf"{RZ}@{NT}", "bat": rf"{NT},{NT},\d+,\d+"}
ISENTOS = {"correcoes"}  # descreve os erros do rascunho: precisa citar os números errados


def textos(o, caminho=""):
    if isinstance(o, str): yield caminho, o
    elif isinstance(o, list):
        for i, x in enumerate(o): yield from textos(x, f"{caminho}[{i}]")
    elif isinstance(o, dict):
        for k, v in o.items(): yield from textos(v, f"{caminho}.{k}")


for n, obj in d.items():
    for cam, s in textos(obj):
        if n not in ISENTOS:
            for m in NUM_DIGITADO.finditer(TOKEN.sub("", s)):
                err(f"{n}{cam}: número digitado à mão '{m.group(0)}' — use um token")
        for m in re.finditer(r"\{[^}]*\}", s):
            t = TOKEN.fullmatch(m.group(0))
            if not t or not re.fullmatch(VALOR[t.group(1)], t.group(2)): err(f"{n}{cam}: token malformado {m.group(0)}")
        for m in re.finditer(r"\]\(fonte:([\w-]+)\)", s):
            if m.group(1) not in fontes: err(f"{n}{cam}: fonte inexistente {m.group(1)}")
        for m in re.finditer(r"\]\((#/[^)]*)\)", s):
            r_ = ROTAS.match(m.group(1))
            if not r_: err(f"{n}{cam}: rota inexistente {m.group(1)}")
            elif r_.group(1) and r_.group(1) not in mods: err(f"{n}{cam}: módulo inexistente {m.group(1)}")
            elif r_.group(2) and r_.group(2) not in ferramentas: err(f"{n}{cam}: ferramenta inexistente {m.group(1)}")

# 4. URLs
for f in d["fontes"]:
    if not f["url"].startswith("https://") and "repositório institucional" not in f["licenca"]:
        err(f"fonte {f['id']}: URL não https")

if ERROS:
    print(f"✗ {len(ERROS)} problema(s) no conteúdo:"); [print("  -", e) for e in ERROS]; sys.exit(1)
nex = sum(len(m["exercicios"]) for m in d["modulos"])
print(f"✓ conteúdo íntegro: {len(d['modulos'])} módulos, {nex} exercícios, {len(d['fontes'])} fontes, {len(ferramentas)} ferramentas")
