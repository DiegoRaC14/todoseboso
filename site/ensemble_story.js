/* Ensemble-first model explorer. Data contract is strict and fail-closed:
   - Reference26 currently comes from the verified native-browser runtime.
   - Compact14 and ensemble outputs are only displayed after a matching
     separately exported, signed-off pair of final model artifacts exists.
   - No assumed 50/50 weights, no fabricated validation scores or parcel yields.
*/
"use strict";
(function(global){
  const byId=q=>document.getElementById(q);
  const create=(tag,className,content)=>{
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(content!==undefined)node.textContent=String(content);
    return node;
  };
  const validNumber=x=>typeof x==="number"&&Number.isFinite(x);
  const error=message=>{throw new Error(message);};
  const IDS=["Ensemble","Reference26","Compact14"];
  const parsePayload=global.GeoCebadaEnsembleContract.parsePayload;
  // Renderer reads only validated model data and DOM nodes already on the page.
  let manifest=null,reference=null,validated=null,futurePayload=null,active="Ensemble";
  const $=byId;
  const modelLabels={Ensemble:"Ensamble de dos modelos",Reference26:"Regresión local con mezcla geológica",Compact14:"Regresión local compacta"};
  const explain={
    Ensemble:"El ensamble combinará las predicciones de Reference26 y Compact14 según un procedimiento todavía por confirmar. No se publica un resultado final hasta conocer y validar los dos modelos y la regla de combinación.",
    Reference26:"Modelo de 26 indicadores: clima, satélites, vecinos, geología y corrección residual. Las 59 predicciones actuales están verificadas frente a Python.",
    Compact14:"Modelo de 14 indicadores: misma base climática, cinco señales en Ridge local, peso de mezcla global y corrección residual. No utiliza el agrupamiento K-means geológico."
  };
  const buttonStatus=(id)=>{
    if(id==="Reference26")return reference?"59 resultados verificados":"Esperando datos";
    return validated?"59 resultados verificados":"En espera del modelo final";
  };
  const pendingText=id=>id==="Ensemble" ?
      "Aún no existe una regla de combinación y unos pesos finales confirmados. Cuando se entreguen los dos modelos entrenados y las 59 predicciones compatibles, esta vista mostrará primero el ensamble." :
      "Compact14 está documentado, pero las predicciones de su nueva versión entrenada todavía no se han exportado ni validado. No se muestran valores aproximados.";
  function select(id){
    if(!IDS.includes(id))return;
    active=id;
    document.querySelectorAll("[data-ensemble-tab]").forEach(b=>{
      const selected=b.dataset.ensembleTab===id;
      b.classList.toggle("active",selected);
      b.setAttribute("aria-selected",String(selected));
      b.tabIndex=selected?0:-1;
    });
    const existing=$("reference26-view");
    const pane=$("ensemble-dynamic-view");
    existing.hidden=id!=="Reference26";
    pane.hidden=id==="Reference26";
    pane.setAttribute("aria-labelledby",id==="Compact14"?"tab-compact":"tab-ensemble");
    $("ensemble-current-title").textContent=modelLabels[id];
    $("ensemble-current-description").textContent=explain[id];
    $("ensemble-current-status").textContent=buttonStatus(id);
    if(id!=="Reference26")renderDynamic(id);
    else $("pred59-status").textContent=reference?
      "59 estimaciones originales de Reference26 comprobadas frente a Python; las cosechas reales continúan desconocidas.":
      "Esperando la verificación de las 59 predicciones Reference26.";
  }
  function fillDiagram(){
    for(const id of IDS){
      const box=$(id==="Ensemble"?"ensemble-card-output":id==="Reference26"?"ensemble-card-reference":"ensemble-card-compact");
      box.replaceChildren();
      box.append(create("span","ensemble-card-eyebrow",id==="Ensemble"?"SALIDA CONJUNTA":"COMPONENTE"),
                 create("strong","",modelLabels[id]),
                 create("small","",buttonStatus(id)));
    }
  }
  function paintTable(id,rows){
    const table=$("ensemble-result-rows");table.replaceChildren();
    for(const row of rows){
      const tr=create("tr");
      tr.append(create("td","",row.id),create("td","",row.state+" · "+row.municipality),
                create("td","",row[id].toFixed(3)+" t/ha"));
      const cell=create("td");
      const button=create("button","ensemble-inspect","Examinar");
      button.type="button";
      button.addEventListener("click",()=>detail(id,row));
      cell.append(button);
      tr.append(cell);table.append(tr);
    }
  }
  function detail(id,row){
    const target=$("ensemble-inspection");target.replaceChildren();
    const top=create("div","ensemble-inspection-header");
    const left=create("div");
    left.append(create("span","ensemble-card-eyebrow","ESTIMACIÓN · COSECHA NO OBSERVADA"),
      create("h4","",row.id),create("small","",row.state+" · "+row.municipality));
    const num=create("strong","ensemble-inspection-yield",row[id].toFixed(4)+" t/ha");
    top.append(left,num);
    const grid=create("div","ensemble-component-grid");
    for(const key of IDS){
      const e=create("div","");e.append(create("span","",modelLabels[key]),
           create("strong","",row[key].toFixed(4)+" t/ha"));grid.append(e);
    }
    const note=create("p","",
      id==="Ensemble"?
      "Esta estimación se obtiene con la regla final documentada para combinar ambos componentes; todavía no conocemos la cosecha real.":
      "Las tres cifras se muestran juntas para examinar su acuerdo o desacuerdo, no como tres rendimientos observados.");
    target.append(top,grid,note);
  }
  function chart(id,rows){
    const container=$("ensemble-dot-chart");container.replaceChildren();
    const groups=[...new Set(rows.map(x=>x.state))].sort((a,b)=>a.localeCompare(b,"es"));
    const nums=rows.map(x=>x[id]);
    const min=Math.floor(Math.min(...nums)*2)/2,max=Math.ceil(Math.max(...nums)*2)/2;
    const end=max>min?max:min+1;
    for(const state of groups){
      const group=create("div","ensemble-chart-group");
      group.append(create("span","",state));
      const track=create("div","ensemble-chart-track");
      rows.filter(x=>x.state===state).sort((a,b)=>a[id]-b[id]).forEach((row,index)=>{
        const dot=create("button","ensemble-chart-dot");
        dot.type="button";dot.title=row.id+": "+row[id].toFixed(3)+" t/ha";
        dot.setAttribute("aria-label",dot.title);
        dot.style.left=(2+96*(row[id]-min)/(end-min)).toFixed(3)+"%";
        dot.style.top=(14+(index%3)*19)+"px";
        dot.addEventListener("click",()=>detail(id,row));
        track.append(dot);
      });
      group.append(track);container.append(group);
    }
    container.append(create("p","ensemble-chart-axis",
      "Escala: "+min.toFixed(2)+" a "+end.toFixed(2)+" toneladas por hectárea. Cada punto representa una parcela."));
  }
  function renderDynamic(id){
    const target=$("ensemble-dynamic-view");
    const empty=$("ensemble-awaiting");
    const view=$("ensemble-ready");
    if(!validated){
      empty.hidden=false;view.hidden=true;
      $("ensemble-awaiting-message").textContent=pendingText(id);
      $("ensemble-method-description").textContent=id==="Ensemble"?
        "La regla de ensamble, sus pesos y sus métricas de validación permanecen pendientes. No se presupone un promedio del 50 %.":
        "Compact14 utiliza 14 entradas, cinco señales locales y un peso global, pero la nueva versión de sus predicciones aún no está lista.";
      return;
    }
    empty.hidden=true;view.hidden=false;
    const {rows,ensemble,metrics}=validated;
    const ordered=[...rows].sort((a,b)=>b[id]-a[id]||a.id.localeCompare(b.id));
    const vals=rows.map(x=>x[id]);
    const mean=vals.reduce((a,b)=>a+b,0)/59;
    $("ensemble-average").textContent=mean.toFixed(4)+" t/ha";
    $("ensemble-range").textContent=Math.min(...vals).toFixed(3)+"–"+Math.max(...vals).toFixed(3)+" t/ha";
    $("ensemble-method-description").textContent=id==="Ensemble"?
      (ensemble.method==="global_convex"?
        "Mezcla convexa validada; peso Reference26 "+(100*ensemble.weights.Reference26).toFixed(1)+
        " %, peso Compact14 "+(100*ensemble.weights.Compact14).toFixed(1)+" %. Procedencia: "+ensemble.provenance :
        "Predicciones finales de ensamble precomputadas y verificadas. Procedencia: "+ensemble.provenance) :
      explain[id];
    $("ensemble-validation").textContent=id==="Ensemble" && metrics && metrics.rmse!=null?
      "RMSE "+metrics.rmse.toFixed(4)+" t/ha · "+metrics.protocol+" · "+metrics.status :
      "No se presenta un RMSE del nuevo ajuste sin una evaluación documentada.";
    chart(id,rows);paintTable(id,ordered);
    detail(id,ordered[0]);
  }
  function activate(){
    fillDiagram();select(active);
  }
  function applyPending(){
    if(!futurePayload||!reference)return;
    try{
      const parsed=parsePayload(futurePayload,reference);
      const wanted=manifest?.models?.Compact14?.upcoming_artifact_sha256;
      if(wanted!==null&&wanted!==undefined&&wanted!==parsed.source_models.Compact14.artifact_sha256)
        error("Compact14 no corresponde al hash declarado para el modelo final.");
      validated=parsed;
      $("ensemble-source-status").textContent=
        "Dos modelos y ensamble disponibles para las mismas 59 parcelas; las cosechas reales siguen siendo desconocidas.";
    }catch(e){
      validated=null;
      $("ensemble-source-status").textContent="La comparación final está bloqueada: "+e.message;
    }
    activate();
  }
  function registerReference(runtime){
    if(!runtime||!Array.isArray(runtime.existing_59)||runtime.existing_59.length!==59)
      error("La versión original Reference26 debe contener 59 predicciones verificadas.");
    reference=runtime;
    applyPending();
    activate();
  }
  function rejectReference(message){
    reference=null;validated=null;
    $("ensemble-source-status").textContent="La inferencia Reference26 no está disponible: "+message;
    activate();
  }
  async function load(){
    try{
      const response=await fetch("./data/ensemble_models.json",{cache:"no-store"});
      if(!response.ok)error("No se encuentra el manifiesto de visualización.");
      manifest=await response.json();
      if(manifest.schema_version!==1||
         JSON.stringify(manifest.presentation_order)!==JSON.stringify(IDS)||
         manifest.study.unlabeled_parcels!==59||
         !["awaiting_final_models","ready"].includes(manifest.status))
        error("La preparación inicial del ensamble no coincide con el contrato.");
      // The future file is optional. Absence is explicitly not a model failure.
      const later=await fetch(manifest.future_prediction_file,{cache:"no-store"});
      if(later.ok){
        futurePayload=await later.json();
        if(reference)applyPending();
        else $("ensemble-source-status").textContent=
          "Exportaciones cargadas; comprobando Reference26 antes de habilitar cualquier comparación.";
      }else if(later.status===404){
        $("ensemble-source-status").textContent=
          "Esperando los dos modelos finales y sus pesos; Reference26 se comprobará por separado en este navegador.";
      }else error("El archivo futuro de predicciones no pudo leerse ("+later.status+").");
      activate();
    }catch(e){
      validated=null;
      $("ensemble-source-status").textContent="El ensamble todavía no está verificado: "+e.message;
      activate();
    }
  }
  document.querySelectorAll("[data-ensemble-tab]").forEach(button=>{
    button.addEventListener("click",()=>select(button.dataset.ensembleTab));
    button.addEventListener("keydown",event=>{
      if(!["ArrowRight","ArrowLeft","Home","End"].includes(event.key))return;
      const index=IDS.indexOf(button.dataset.ensembleTab);
      const next=event.key==="Home"?0:event.key==="End"?2:
                 (index+(event.key==="ArrowRight"?1:2))%3;
      event.preventDefault();
      const chosen=document.querySelector('[data-ensemble-tab="'+IDS[next]+'"]');
      chosen.focus();select(IDS[next]);
    });
  });
  $("ensemble-jump-components").addEventListener("click",()=>select("Reference26"));
  $("ensemble-source-status").textContent="Cargando el manifiesto del ensamble…";
  activate();load();
  global.GeoCebadaEnsemble=Object.freeze({parsePayload,registerReference,rejectReference});
})(window);
