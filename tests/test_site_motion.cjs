/* Minimal motion must preserve data, navigation, accessibility and the map. */
"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict");
const html=fs.readFileSync("site/index.html","utf8");
const js=fs.readFileSync("site/scroll_motion.js","utf8");
const css=fs.readFileSync("site/scroll_motion.css","utf8");
const editorial=fs.readFileSync("site/editorial.css","utf8");
const mapcss=fs.readFileSync("site/interactive-map.css","utf8");
assert.match(html,/src="\.\/scroll_motion\.js"/);
assert.match(html,/href="\.\/scroll_motion\.css"/);
assert.match(js,/IntersectionObserver/);
assert.match(js,/getBoundingClientRect/);
assert.match(js,/movingDown/);
assert.match(js,/markVisible/);
assert.match(js,/prefers-reduced-motion/);
assert.doesNotMatch(js,/innerHTML|removeChild|replaceChildren|insertAdjacentElement/);
assert.match(css,/scroll-reveal-pending/);
assert.match(css,/scroll-reveal-visible/);
assert.match(css,/translate3d\(0,22px,0\)/);
assert.match(css,/scale\(1\.025\)/);
assert.match(css,/figure-host:hover/);
assert.match(css,/prefers-reduced-motion: reduce/);
assert.match(editorial,/#arquitectura \.model-visual\{/);
assert.match(editorial,/#arquitectura \.math-proof\.model-formula\{/);
assert.match(editorial,/math-scroll math/);
assert.match(mapcss,/collaborator-map-toolbar/);
assert.match(mapcss,/border-radius:0/);
assert.match(html,/id="collaborator-map-title"/);
assert.match(html,/class="collaborator-map-toolbar"/);
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(ids.length,new Set(ids).size);
for(const id of ["recorrido","ensamble","datos","variables","preparacion",
 "arquitectura","geologia","faltantes","ajuste","resultados","pruebas",
 "limites","simulador","mapa-interactivo","predicciones-59","real-rainfall",
 "real-ndvi","reference26-view","predict-real"]){
 assert.ok(ids.includes(id),"Original research area lost: #"+id);
}
assert.ok(html.indexOf('id="mapa-interactivo"')>html.indexOf('id="simulador"'));
assert.ok(html.includes("andrea-hh.github.io/todoseboso/explorador/mapa.html"));
assert.ok(!html.includes('src="./portal.js"'));
console.log("Subtle scroll reveal, responsive interactions and matching map/math/diagram: PASS");
