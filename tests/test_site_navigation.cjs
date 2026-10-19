/* Zero-dependency integrity check. Run from repository root: node tests/test_site_navigation.cjs */
"use strict";
const fs = require("node:fs");
const assert = require("node:assert/strict");
const html = fs.readFileSync("site/index.html", "utf8");
const js = fs.readFileSync("site/navigation.js", "utf8");
const css = fs.readFileSync("site/navigation.css", "utf8");
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, "Duplicate HTML IDs");
const nav = html.match(/<nav id="nav-links"[\s\S]*?<\/nav>/);
const guide = html.match(/<section class="reading-guide"[\s\S]*?<\/section>/);
assert.ok(nav && guide, "Navigation and chapter overview must exist");
assert.equal((nav[0].match(/class="nav-group"/g) || []).length, 4);
assert.equal((guide[0].match(/class="chapter-card"/g) || []).length, 4);
for (const block of [nav[0], guide[0]]) {
  for (const [, fragment] of block.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(ids.includes(fragment), `Missing target: #${fragment}`);
  }
}
assert.match(html, /src="\.\/navigation\.js"/);
assert.match(html, /href="\.\/navigation\.css"/);
assert.match(js, /aria-current/);
assert.match(css, /prefers-reduced-motion/);
for(const id of ["ensamble","datos","variables","preparacion","datos-reales","arquitectura","ajuste","resultados","pruebas","limites","predicciones-59","simulador","mapa-interactivo","recorrido","reference26-view","ensemble-dynamic-view","real-rainfall","real-ndvi","real-loocv","pred59-plot","predict-real"]) {
  assert.ok(ids.includes(id), "Protected model/chart/map section missing: #"+id);
}
assert.ok(html.indexOf('id="ensamble"') < html.indexOf('id="recorrido"'), "Ensemble must come before the reading guide");
assert.ok(html.indexOf('id="recorrido"') < html.indexOf('id="datos"'), "Reading guide must precede data");
assert.ok(html.indexOf('id="mapa-interactivo"') > html.indexOf('id="simulador"'), "Collaborator map should be final");
for(const source of ["./ensemble_story.js","./ensemble_contract.js","./field_charts.js","./predictions59.js"]) {
  assert.ok(html.includes('src="'+source+'"'), "Protected runtime missing: "+source);
}
assert.ok(html.includes("andrea-hh.github.io/todoseboso/explorador/mapa.html"),"Collaborator map embed missing");
console.log("Chapter navigation, ensemble, charts, predictions, and map: PASS");
