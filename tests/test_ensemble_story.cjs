"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"..");
const context={};
vm.runInNewContext(fs.readFileSync(path.join(root,"site/ensemble_contract.js"),"utf8"),context);
const parse=context.GeoCebadaEnsembleContract.parsePayload;
const refHash="54afbcf81d60623a634b64afb498152b11a0f66ea4c3e21cab2d4939250ac147";
function ref(){
 const pathModel=path.join(root,"site/data/reference26_runtime.json");
 if(fs.existsSync(pathModel))return JSON.parse(fs.readFileSync(pathModel,"utf8"));
 return {model:"Reference26",hashes:{"final_train138.joblib":refHash},
  existing_59:Array.from({length:59},(_,i)=>({
    id:"parcel-"+i,state:i%2?"Puebla":"Hidalgo",municipality:"Ejemplo de prueba",
    expected:3+i/100
  }))};
}
function draft(reference){
 const rows=reference.existing_59.map(x=>{
   // Only for UNIT tests: no fabricated values are published in site/data.
   const Reference26=x.expected,Compact14=x.expected+.2;
   return {id:x.id,state:x.state,municipality:x.municipality,
     Reference26,Compact14,Ensemble:.3*Reference26+.7*Compact14};
 });
 return {schema_version:1,cohort:"final_138_to_59",
  source_models:{
    Reference26:{artifact_sha256:refHash},
    Compact14:{artifact_sha256:"b".repeat(64)}
  },
  ensemble:{
    method:"global_convex",weights:{Reference26:.3,Compact14:.7},
    provenance:"TEST ONLY: formula fixture, not model training",
    validation_protocol:"synthetic/unit-test"
  },
  validation_metrics:null,rows};
}
test("the future ensemble contract requires identical 59 parcel IDs and a selected rule",()=>{
 const reference=ref(),sample=draft(reference);
 const result=parse(sample,reference);
 assert.equal(result.rows.length,59);
 assert.equal(result.ensemble.weights.Compact14,.7);
 assert.equal(result.rows[0].Ensemble,sample.rows[0].Ensemble);
});
test("missing weights, provenance, training versions, or a parcel are rejected",()=>{
 const reference=ref();
 for(const transform of [
   p=>{p.ensemble.weights=null;},
   p=>{p.ensemble.weights.Reference26=.5;},
   p=>{p.ensemble.provenance="";},
   p=>{p.source_models.Reference26.artifact_sha256="a".repeat(64);},
   p=>{p.source_models.Compact14.artifact_sha256="";},
   p=>{p.rows.pop();},
   p=>{p.rows[0].id=p.rows[1].id;},
   p=>{p.rows[0].Reference26+=.01;},
   p=>{p.rows[0].Ensemble+=.01;},
   p=>{p.rows[0].state="Otro estado";},
   p=>{p.validation_metrics={rmse:.4,r2:.75,mae:.3};}
 ]){
   const p=draft(reference);transform(p);
   assert.throws(()=>parse(p,reference));
 }
});
test("a documented nonconvex / stacked final ensemble can load precomputed predictions without invented weights",()=>{
 const reference=ref();
 const p=draft(reference);
 p.ensemble.method="precomputed";
 p.ensemble.weights=null;
 p.ensemble.provenance="TEST ONLY: future externally checked prediction array";
 const parsed=parse(p,reference);
 assert.equal(parsed.ensemble.method,"precomputed");
 assert.equal(parsed.rows.length,59);
});
test("no final ensemble files or numeric training weights are shipped before calibration",()=>{
 const m=JSON.parse(fs.readFileSync(path.join(root,"site/data/ensemble_models.json"),"utf8"));
 assert.deepEqual(m.presentation_order,["Ensemble","Reference26","Compact14"]);
 assert.equal(m.status,"awaiting_final_models");
 assert.equal(m.ensemble.method,null);
 assert.equal(m.ensemble.weights,null);
 assert.equal(m.models.Reference26.inputs,26);
 assert.equal(m.models.Compact14.inputs,14);
 assert.equal(fs.existsSync(path.join(root,"site/data/ensemble_predictions_v1.json")),false);
});
