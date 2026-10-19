"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const site=path.resolve(__dirname,"..","site");
const script=fs.readFileSync(path.join(site,"ensemble_predictions59.js"),"utf8");
class Element {
  constructor(tag="div") {
    this.tag=tag;this.children=[];this.value="";this.textContent="";
    this.listeners={};this.scope="";
  }
  replaceChildren(...items) {this.children=[...items];}
  append(...items) {this.children.push(...items);}
  addEventListener(name,fn) {this.listeners[name]=fn;}
  dispatch(name) {this.listeners[name]?.();}
}
function mount(fetchStub) {
  const ids=[
    "ensemble-predictions59","ensemble-predictions59-status",
    "ensemble-predictions59-body","ensemble-predictions59-search",
    "ensemble-predictions59-count"
  ];
  const nodes=Object.fromEntries(ids.map(id=>[id,new Element()]));
  const context={document:{
    getElementById:id=>nodes[id]||null,
    createElement:tag=>new Element(tag)
  },fetch:fetchStub,console};
  vm.runInNewContext(script,context);
  return nodes;
}
const wait=()=>new Promise(resolve=>setImmediate(resolve));
const a=.7049462505599942,b=.29505374944000595;
const fake={
  schema_version:1, scope:"competition_unknown_59_no_observed_y",
  n_known_training:138,n_predictions:59,
  no_true_y_available_for_59:true,
  exploratory_weight_selection_on_original_138:true,
  parity:{
    python_replayed_both_joblibs:true,
    max_absolute_error_to_stored_csv_t_ha:0,
    max_absolute_ensemble_replay_error_t_ha:0
  },
  model_sha256:{
    "reference26_mean_train138.joblib":"a".repeat(64),
    "compact14_original_train138.joblib":"b".repeat(64)
  },
  weights:{Reference26_mean:a,Compact14:b},
  rows:Array.from({length:59},(_,i)=>({
    id:"SYNTHETIC_"+String(i+1).padStart(3,"0"),
    reference26_mean_t_ha:3+i*.01,
    compact14_t_ha:4+i*.01,
    ensemble_t_ha:a*(3+i*.01)+b*(4+i*.01)
  }))
};
test("missing verified predictions renders no fake 59 rows",async()=>{
  const nodes=mount(async()=>({ok:false}));
  await wait();
  assert.equal(nodes["ensemble-predictions59-body"].children.length,0);
  assert.match(nodes["ensemble-predictions59-status"].textContent,/pendiente/i);
});
test("broken weights, duplicate IDs or missing parity block publication",async()=>{
  for(const bad of [
    {...fake,weights:{Reference26_mean:.8,Compact14:.3}},
    {...fake,parity:{...fake.parity,python_replayed_both_joblibs:false}},
    {...fake,rows:fake.rows.map((r,i)=>i===1?{...r,id:fake.rows[0].id}:r)}
  ]){
    const nodes=mount(async()=>({ok:true,json:async()=>bad}));
    await wait();
    assert.equal(nodes["ensemble-predictions59-body"].children.length,0);
    assert.match(nodes["ensemble-predictions59-status"].textContent,/pendiente/i);
  }
});
test("verified 59 forecasts render three columns and permit exact ID lookup",async()=>{
  const nodes=mount(async()=>({ok:true,json:async()=>fake}));
  await wait();
  const rows=nodes["ensemble-predictions59-body"].children;
  assert.equal(rows.length,59);
  assert.equal(rows[0].children.length,4);
  assert.equal(rows[0].children[0].textContent,"SYNTHETIC_001");
  nodes["ensemble-predictions59-search"].value="059";
  nodes["ensemble-predictions59-search"].dispatch("input");
  assert.equal(nodes["ensemble-predictions59-body"].children.length,1);
  assert.match(nodes["ensemble-predictions59-count"].textContent,/1 de 59/);
});
test("site only stages real estimates; sample payload exists inside tests",()=>{
  const html=fs.readFileSync(path.join(site,"index.html"),"utf8");
  assert.match(html,/id="ensemble-predictions59"/);
  assert.match(html,/src="\.\/ensemble_predictions59\.js"/);
  const output=path.join(site,"data","ensemble_predictions59.json");
  if (fs.existsSync(output)) {
    const real=JSON.parse(fs.readFileSync(output,"utf8"));
    assert.equal(real.n_predictions,59);
    assert.equal(real.no_true_y_available_for_59,true);
    assert.equal(real.parity.python_replayed_both_joblibs,true);
    assert.equal(real.rows.length,59);
  }
});
