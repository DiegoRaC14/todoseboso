/* Offline integrity of the compact, progressive research portal. */
"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict");
const html=fs.readFileSync("site/index.html","utf8");
const portal=fs.readFileSync("site/portal.js","utf8");
const css=fs.readFileSync("site/portal.css","utf8");
const nav=fs.readFileSync("site/navigation.js","utf8");
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(new Set(ids).size,ids.length,"HTML IDs must remain unique");
assert.match(html,/src="\.\/portal\.js"/);
assert.match(html,/href="\.\/portal\.css"/);
assert.match(html,/<section class="reading-guide" id="recorrido"/);
assert.match(html,/id="ensamble"/);
assert.match(html,/id="mapa-interactivo"/);
assert.ok(html.indexOf('id="mapa-interactivo"')>html.indexOf('id="simulador"'));
const groups={
 study:["datos","variables","preparacion"],
 models:["ensamble","arquitectura","geologia","faltantes","ajuste"],
 evidence:["resultados","pruebas","limites","preguntas"],
 explore:["simulador","mapa-interactivo"]
};
for(const [group,list] of Object.entries(groups)){
 assert.ok(portal.includes('key:"'+group+'"'),"Portal chapter "+group+" absent");
 for(const id of list){
   assert.ok(ids.includes(id),"Source section lost: "+id);
   assert.ok(portal.includes('["'+id+'",'),"Portal routing missing "+id);
 }
}
for(const id of ["predicciones-59","reference26-view","ensemble-dynamic-view","real-rainfall",
 "real-ndvi","real-loocv","parcel-coverage","pred59-plot","predict-real","cluster-list"]){
 assert.ok(ids.includes(id),"Protected research content lost: #"+id);
}
for(const source of ["./ensemble_story.js","./ensemble_contract.js","./field_charts.js",
 "./predictions59.js","./browser_inference.js","./navigation.js"]){
 assert.ok(html.includes('src="'+source+'"'),"Protected script missing: "+source);
}
assert.match(portal,/guide\.insertAdjacentElement\("afterend",decks\)/);
assert.match(portal,/body\.appendChild\(section\)/);
assert.match(portal,/document\.documentElement\.classList\.add\("portal-ready"\)/);
assert.match(portal,/window\.addEventListener\("popstate"/);
assert.match(portal,/window\.addEventListener\("hashchange"/);
assert.match(portal,/closest\("#reference26-view"\)/);
assert.match(portal,/button\.click\(\)/);
assert.match(portal,/scrollIntoView/);
assert.match(portal,/prefers-reduced-motion/);
assert.match(css,/portal-chapter\[hidden\]/);
assert.match(css,/portal-topic\[hidden\]/);
assert.match(css,/@keyframes portal-fade-up/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(nav,/portal:change/);
assert.ok(html.includes("andrea-hh.github.io/todoseboso/explorador/mapa.html"));
console.log("Progressive research portal: all sections, hashes, plots, tools and map preserved.");
