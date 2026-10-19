/* Pure validation for a future two-joblib ensemble export.
   Does not create a weight, predicted yield or performance metric.
*/
(function(global){
"use strict";
  const validNumber=x=>typeof x==="number" && Number.isFinite(x);
  const error=message=>{throw new Error(message);};
  const IDS=["Ensemble","Reference26","Compact14"];
  const SHA=/^[0-9a-f]{64}$/;
  function parsePayload(payload,reference){
    if(!reference || reference.model!=="Reference26" ||
       !Array.isArray(reference.existing_59) || reference.existing_59.length!==59)
      error("Falta verificar la receta Reference26 anterior.");
    if(!payload || payload.schema_version!==1 ||
       payload.cohort!=="final_138_to_59" ||
       !Array.isArray(payload.rows)||payload.rows.length!==59)
      error("Se requieren exactamente las 59 parcelas del ajuste final.");
    const sources=payload.source_models;
    if(!sources || !SHA.test(sources.Reference26?.artifact_sha256||"") ||
       !SHA.test(sources.Compact14?.artifact_sha256||"") ||
       sources.Reference26.artifact_sha256===sources.Compact14.artifact_sha256)
      error("Se requieren los hashes SHA-256 de los dos modelos entrenados.");
    const archived=reference.artifact_sha256 ||
      reference.hashes?.[reference.model_artifact_filename || "final_train138.joblib"];
    if(!archived || sources.Reference26.artifact_sha256!==archived)
      error("La versión de Reference26 no coincide con la exportación activa del navegador.");
    const blend=payload.ensemble;
    if(!blend || !["global_convex","precomputed"].includes(blend.method) ||
       typeof blend.provenance!=="string" || !blend.provenance.trim() ||
       typeof blend.validation_protocol!=="string" || !blend.validation_protocol.trim())
      error("Faltan método, protocolo de selección o procedencia del ensamble.");
    if(blend.method==="global_convex"){
      const a=blend.weights?.Reference26,b=blend.weights?.Compact14;
      if(!validNumber(a)||!validNumber(b)||a<0||b<0||a>1||b>1||Math.abs(a+b-1)>1e-12)
        error("Los pesos globales deben estar entre cero y uno y sumar uno.");
    }else if(blend.weights!==null)error("El método precomputado no acepta pesos globales inventados.");
    const metrics=payload.validation_metrics;
    if(metrics!==null&&metrics!==undefined){
      if(!metrics.protocol||typeof metrics.protocol!=="string" ||
         !metrics.status || !["verified","preliminary"].includes(metrics.status))
        error("La métrica requiere protocolo explícito y estado verificable.");
      for(const key of ["rmse","mae","r2"]){
        if(metrics[key]!==null&&!validNumber(metrics[key]))error("Métrica no numérica: "+key);
      }
    }
    const refMap=new Map(reference.existing_59.map(x=>[x.id,x]));
    if(refMap.size!==59)error("ID Reference26 repetidos.");
    const seen=new Set();
    const cleaned=payload.rows.map(row=>{
      const id=row.id;
      if(typeof id!=="string"||!refMap.has(id)||seen.has(id))
        error("Las 59 parcelas deben tener los mismos IDs, sin duplicados.");
      seen.add(id);
      for(const key of ["Reference26","Compact14","Ensemble"]){
        if(!validNumber(row[key]))error("Estimación no numérica o ausente de "+key+" para "+id);
      }
      const expected=refMap.get(id);
      if(Math.abs(row.Reference26-expected.expected)>1e-7)
        error("Reference26 no coincide con la predicción original de Python: "+id);
      if(blend.method==="global_convex"){
        const calculated=blend.weights.Reference26*row.Reference26+
                         blend.weights.Compact14*row.Compact14;
        if(Math.abs(calculated-row.Ensemble)>1e-7)
          error("El ensamble no coincide con los pesos publicados: "+id);
      }
      const label=typeof row.state==="string"&&row.state.trim()?row.state:
                  expected.state||"Sin estado";
      const municipality=typeof row.municipality==="string"&&row.municipality.trim()?
                         row.municipality:expected.municipality||"Sin municipio";
      if(label!==expected.state||municipality!==expected.municipality)
        error("El identificador y la ubicación no coinciden para "+id);
      return {id,state:label,municipality,
        Reference26:row.Reference26,Compact14:row.Compact14,Ensemble:row.Ensemble};
    });
    return {rows:cleaned,ensemble:blend,metrics:metrics||null,source_models:sources};
  }


global.GeoCebadaEnsembleContract=Object.freeze({parsePayload});
})(typeof window==="undefined"?globalThis:window);
