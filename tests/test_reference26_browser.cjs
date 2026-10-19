"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),
  fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const context={};
vm.runInNewContext(fs.readFileSync(path.join(root,"site/reference26_engine.js"),"utf8"),context);
const engine=context.Reference26Browser;
test("Reference26 inference is pure local JavaScript with no network or external math",()=>{
  assert.equal(typeof engine.run,"function");
  assert.equal(typeof engine.parity,"function");
  const source=fs.readFileSync(path.join(root,"site/reference26_engine.js"),"utf8");
  assert.ok(source.includes("function ridge"));
  assert.ok(source.includes("function geology"));
  assert.ok(source.includes("function correction"));
  assert.ok(!source.includes("fetch("));
  assert.ok(!source.includes("Math.random"));
});
const file=path.join(root,"site/data/reference26_runtime.json");
if(fs.existsSync(file)) {
  const model=JSON.parse(fs.readFileSync(file,"utf8"));
  test("all 59 archived parcels match Python predictions within 1e-7 t/ha",()=>{
    const result=engine.parity(model,1e-7);
    assert.equal(result.tested,59);
    assert.ok(result.max_abs_difference<=1e-7);
    assert.ok(Math.abs(result.mean-3.956432328667021)<1e-5);
  });
  test("new parcel coordinates use frozen normalized Haversine scale",()=>{
    if(!model.geography.new_parcels_supported)return;
    const sample=model.existing_59[0];
    const distances=engine.haversineDistances(sample.x,model.geography);
    assert.equal(distances.length,138);
    const errors=distances.map((value,i)=>Math.abs(value-sample.distances[i]));
    assert.ok(Math.max(...errors)<=3e-6);
    const predicted=engine.run(model,sample.x).predicted_t_ha;
    assert.ok(Math.abs(predicted-sample.expected)<1e-7);
  });
  test("final R3 correction follows missing indicator mask",()=>{
    const sample=model.existing_59.find(s =>
      model.correction.cols.every(col=>s.x[col]!=null));
    assert.ok(sample);
    const original=engine.run(model,sample.x,sample.distances);
    assert.equal(original.has_r3_support,true);
    const incomplete={...sample.x,[model.correction.cols[0]]:null};
    const without=engine.run(model,incomplete,sample.distances);
    assert.equal(without.has_r3_support,false);
    assert.equal(without.residual_adjustment,0);
  });
} else {
  test("without exported model, the site must not claim authentic fitted inference",()=>{
    const site=fs.readFileSync(path.join(root,"site/browser_inference.js"),"utf8");
    assert.ok(site.includes('ready(null)'));
    assert.ok(site.includes('!response.ok'));
    assert.ok(site.includes('Reference26Browser.parity'));
  });
}
