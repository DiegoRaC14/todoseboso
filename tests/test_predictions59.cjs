"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"), path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"..");
const modelPath=path.join(root,"site/data/reference26_runtime.json");
function loadGallery(){
  const context={
    window:{},
    document:{querySelector:()=>({addEventListener(){}})}
  };
  vm.runInNewContext(fs.readFileSync(path.join(root,"site/reference26_engine.js"),"utf8"),context);
  vm.runInNewContext(fs.readFileSync(path.join(root,"site/predictions59.js"),"utf8"),context);
  return context.window.GeoCebadaPredictions;
}
test("59-panel source contains live search, state filter, sort and CSV",()=>{
  const s=fs.readFileSync(path.join(root,"site/predictions59.js"),"utf8");
  for(const fragment of ['"pred59-search"','"pred59-state"','"pred59-sort"',
                          '"pred59-export"','"pred59-examples"','"pred59-plot"',
                          '"pred59-detail"','"reference26_59_estimaciones_no_observadas.csv"',
                          "window.Reference26Browser.run", "Math.abs(prediction.predicted_t_ha-entry.expected) > 1e-7"]){
    assert.ok(s.includes(fragment),fragment);
  }
  const html=fs.readFileSync(path.join(root,"site/index.html"),"utf8");
  assert.ok(html.includes('id="predicciones-59"'));
  assert.ok(html.includes('./predictions59.js'));
  assert.ok(html.includes('./predictions59.css'));
  assert.ok(!html.includes("No se ofrecen pronósticos individuales en esta página"));
});
if(fs.existsSync(modelPath)){
  const model=JSON.parse(fs.readFileSync(modelPath,"utf8"));
  test("all 59 published examples are sourced from the exact original Python output",()=>{
    const items=loadGallery().prepare(model);
    assert.equal(items.length,59);
    assert.equal(new Set(items.map(x=>x.id)).size,59);
    assert.ok(items.every(x=>x.state && x.municipality && Number.isFinite(x.estimate)));
    assert.ok(items.every(x=>x.x && model.feature_names.every(name=>Object.hasOwn(x.x,name))));
    const source=new Map(model.existing_59.map(x=>[x.id,x]));
    assert.ok(items.every(x=>Math.abs(x.estimate-source.get(x.id).expected)<=1e-7));
    const r3Count=items.filter(x=>x.r3).length;
    assert.equal(r3Count,51);
    assert.equal(items.length-r3Count,8);
    const mean=items.reduce((sum,x)=>sum+x.estimate,0)/59;
    assert.ok(Math.abs(mean-model.aggregate_parity.mean)<=1e-7);
  });
  test("gallery refuses extra parcels or made-up prediction values",()=>{
    const good=model.existing_59;
    const gallery=loadGallery();
    const rogue={...model,existing_59:[...good.slice(0,58),{...good[58],expected:good[58].expected+.01}]};
    assert.throws(()=>gallery.prepare(rogue),/difiere del resultado original/);
    assert.throws(()=>gallery.prepare({...model,existing_59:good.slice(0,58)}),/59 parcelas/);
    assert.throws(()=>gallery.prepare({...model,existing_59:[good[0],...good.slice(0,58)]}),/repetido/);
  });
}else{
  test("gallery is unavailable without authentic frozen runtime",()=>{
    assert.equal(typeof loadGallery().prepare,"function");
    assert.equal(typeof loadGallery().unavailable,"function");
  });
}
