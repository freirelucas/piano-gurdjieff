# Piano Gurdjieff/de Hartmann — tutor crítico

Curso aberto, em português, sobre a música para piano de Gurdjieff/de Hartmann. Segue o argumento dos capítulos 7 e 8 de Johanna Petsche (*Gurdjieff and Music*, Brill, 2015) e traz um laboratório de afinação justa no navegador.

**Sítio:** https://freirelucas.github.io/piano-gurdjieff/

## O fio

Escritores de dentro da tradição afirmam três coisas sobre esta música: que as Leis do Três e do Sete estão escritas nela, que ela faz ouvir harmônicos que refletem as "oitavas internas" e que ela é "arte objetiva". Petsche testa as três e encontra pouca sustentação. O curso ensina cada conceito com precisão, mede-o no piano e no laboratório e separa sempre **evidência** de **aposta**. A tese de chegada é a dela: a música como trabalho de atenção, ao lado do livro e dos Movimentos.

| | |
|---|---|
| Módulos | 6, de 8 semanas (escala de sete tons · Lei das Sete · oitavas internas e série harmônica · Lei dos Três e números · música objetiva · os três propósitos) |
| Laboratório | teclado justo/temperado com teste cego · batimentos · série harmônica · oitava interna · afinador por microfone · metrônomo de 7/8 · contador com controle · registro de escuta · arquivos .scl/.kbm |
| Fontes | catálogo com o tipo de acesso e a licença de cada uma, conferidas em 2026-11-03 |

As contagens exibidas no sítio são calculadas a partir de `content/`, não escritas no código.

## Limites declarados

- Na tradução de trabalho, a seção intitulada §7.7 trata do número sete, dos modos e de MacLaren, sem mencionar oitavas internas, harmônicos ou Barrett. Do cap. 8, ela traz **só a §8.1**. O que depende dessas partes está marcado como não verificado.
- Nenhuma partitura nem gravação é hospedada. A edição Schott (1996–2005) está sob direitos autorais. No Brasil, as composições em coautoria entram em domínio público 70 anos depois de 1º de janeiro do ano seguinte à morte do último coautor (Lei 9.610, arts. 41–42); de Hartmann morreu em 1956. Isso não é parecer jurídico.

## Arquitetura

Sítio estático, sem framework e sem bundler. São ES modules nativos e Python só no build.

```
content/*.json      conteúdo (texto CC BY-SA) — validado por schema/*.schema.json
src/js/afinacao.js  matemática pura: a ÚNICA fonte de números (cents, Hz, batimentos, harmônicos)
src/js/marcacao.js  marcação segura → árvore (sem innerHTML); tokens {c:9/8} {dev:5/4} {bat:C4,E4,5,4}
src/js/altura.js    detector de altura (YIN simplificado), puro e testado
src/js/lab.js       as 9 ferramentas · telas.js as telas · main.js roteador e service worker
build.py            src → _site; publica content em data/; gera .scl/.kbm a partir de afinacao.js;
                    gera sw.js com versão = hash do conteúdo e pré-cache = todos os arquivos
tools/check_conteudo.py  contrato: esquema, ids, referências, rotas, tokens, nenhum número digitado
tests/*.test.mjs    núcleo (node:test, sem dependências) · tests/e2e  fumaça no Chromium (Playwright)
```

### Decisões tomadas a partir da crítica ao `sambrass-tutor`

| Problema observado lá | Decisão aqui |
|---|---|
| O service worker apaga **todos** os caches da origem `freirelucas.github.io`, inclusive os dos sítios irmãos | Só apaga caches com o prefixo `gdh-` |
| Chaves de localStorage sem prefixo (`favs`, `practicelog`) e sem versão | Uma única chave `gdh:v1`, com esquema versionado e exportar/importar |
| `addAll(...).catch(()=>{})` e versão de cache digitada à mão | Instalação falha se faltar arquivo; versão = hash; lista gerada no build |
| Catches vazios e 404 engolido | Erros de dados aparecem na tela; contrato de dados no CI |
| Scripts clássicos com globais, `onclick` em atributo, `innerHTML` sem escape | ES modules, `textContent`/`createElement`, CSP em `<meta>` |
| Testes existem, mas não bloqueiam o deploy | `publicar` depende (`needs:`) de contrato, núcleo e fumaça |
| 53 MB de PDF e mp4 no Git | Nenhuma mídia: som sintetizado, gravações por link |

Ressalva: enquanto o `sambrass-tutor` não filtrar o próprio cache por prefixo, abrir aquele sítio apaga o cache offline deste.

## Rodar localmente

```bash
pip install jsonschema
python tools/check_conteudo.py
for f in tests/*.test.mjs; do node "$f"; done
python build.py && python -m http.server 8099 --directory _site
npm install && npx playwright install chromium && npx playwright test
```

## Escrever conteúdo

Edite `content/*.json`. Valores em cents ou Hz **não podem ser digitados**: use os tokens `{c:5/4}` (cents), `{c0:5/4}` (inteiro), `{dev:5/4}` (desvio do temperado), `{et:4}` (semitons temperados), `{hz:A2}`, `{hzr:5/3@C2}` e `{bat:C4,E4,5,4}` (batimento entre parciais). Links: `[texto](fonte:id)`, `[texto](#/rota)` ou `https://`. O CI reprova tudo o que fugir disso.

## Nota de CI

O Playwright fixado em 1.49.1 não termina de iniciar no Node 24: a etapa ficava parada até o tempo-limite, sem escrever log. O CI usa Node 22 LTS e Playwright 1.x atual. A etapa de fumaça tem tempo-limite rígido, e as falhas viram anotações (`tools/anotar_playwright.mjs`), legíveis pela API sem baixar logs.

## Licenças

Código: MIT. Texto do curso: CC BY-SA 4.0. Petsche é parafraseada, com citações curtas e a seção indicada.
