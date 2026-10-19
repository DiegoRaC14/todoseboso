/* Preserve a complete, scrollable article and a descriptive editorial index. */
"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict");
const html=fs.readFileSync("site/index.html","utf8");
const css=fs.readFileSync("site/editorial.css","utf8");
const nav=fs.readFileSync("site/navigation.js","utf8");
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(ids.length,new Set(ids).size,"Every HTML ID is unique");
assert.equal((html.match(/class="chapter-card"/g)||[]).length,4,"Exactly four index chapters");
assert.ok(html.indexOf('id="recorrido"') < html.indexOf('id="ensamble"'),"Index must precede scientific story");
assert.ok(html.indexOf('id="ensamble"') < html.indexOf('id="datos"'),"Ensemble still leads detailed research");
assert.ok(html.indexOf('id="mapa-interactivo"') > html.indexOf('id="simulador"'),"Map remains last");
const sections=["ensamble","datos","variables","preparacion","arquitectura","geologia",
 "faltantes","ajuste","resultados","pruebas","limites","preguntas","simulador","mapa-interactivo"];
for(const id of sections)assert.match(html,new RegExp('<section[^>]*id="'+id+'"'),
 "Full-length research section removed: #"+id);
for(const id of ["predicciones-59","reference26-view","ensemble-dynamic-view","real-rainfall",
 "real-ndvi","real-loocv","parcel-coverage","pred59-plot","predict-real","cluster-list"]){
 assert.ok(ids.includes(id),"Interactive content missing: #"+id);
}
for(const src of ["./navigation.js","./ensemble_story.js","./ensemble_contract.js",
 "./field_charts.js","./predictions59.js","./browser_inference.js"]){
 assert.ok(html.includes('src="'+src+'"'),"Required source missing: "+src);
}
assert.ok(html.includes('href="./editorial.css"'));
assert.ok(!html.includes('src="./portal.js"'));
assert.ok(!html.includes('href="./portal.css"'));
assert.ok(!html.includes("✳") && !html.includes("☰"),"Remove decorative logo/menu glyphs");
const contents=html.match(/<section class="reading-guide"[\s\S]*?<\/section>/)?.[0];
assert.ok(contents,"Introductory index missing");
for(const id of ["datos","variables","preparacion","datos-reales","ensamble","arquitectura",
 "geologia","faltantes","ajuste","resultados","pruebas","limites","preguntas",
 "predicciones-59","simulador","mapa-interactivo"]){
 assert.ok(contents.includes('href="#'+id+'"'),"Index does not describe/link: #"+id);
}
assert.equal((contents.match(/class="chapter-readmore"/g)||[]).length,4);
assert.equal((contents.match(/class="chapter-subsections"/g)||[]).length,4);
assert.match(css,/\.chapter-card\{display:grid/);
assert.match(css,/\.chapter-subsections li span/);
assert.match(css,/border-radius:0!important/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(nav,/revealReferenceFromHash/);
assert.match(nav,/modelHeading.insertAdjacentElement\("afterend", figure\)/);
assert.ok(html.includes("andrea-hh.github.io/todoseboso/explorador/mapa.html"));
console.log("PASS: editorial index, full document, deep links, verified plots, ensemble, and map.");
