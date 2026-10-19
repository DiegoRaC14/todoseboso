/* Three NEW 138-label Python-refitted model predictions for the 59 unknown parcels.
   No inferred real observed yield, no browser refit. Fail closed unless
   both independently fitted joblibs passed 59-row Python replay parity.
*/
"use strict";
(() => {
  const root=document.getElementById("ensemble-predictions59");
  if (!root) return;
  const $=id=>document.getElementById(id);
  const status=$("ensemble-predictions59-status");
  const table=$("ensemble-predictions59-body");
  const search=$("ensemble-predictions59-search");
  const columns=[
    ["reference26_mean_t_ha","Reference26 media"],
    ["compact14_t_ha","Compact14"],
    ["ensemble_t_ha","Ensamble"]
  ];
  const n=(tag,text)=> {
    const el=document.createElement(tag);
    if (text!==undefined) el.textContent=String(text);
    return el;
  };
  let loaded=null;
  const round=x=>Number(x).toFixed(4);
  function validate(payload) {
    if (!payload || payload.schema_version!==1 ||
        payload.n_predictions!==59 || payload.n_known_training!==138 ||
        payload.no_true_y_available_for_59!==true ||
        payload.exploratory_weight_selection_on_original_138!==true ||
        payload.parity?.python_replayed_both_joblibs!==true ||
        !Array.isArray(payload.rows) || payload.rows.length!==59)
      throw Error("La exportación de los dos modelos nuevos no está verificada.");
    const a=payload.weights?.Reference26_mean;
    const b=payload.weights?.Compact14;
    if (![a,b].every(x=>typeof x==="number"&&Number.isFinite(x)&&x>=0) ||
        Math.abs(a+b-1)>1e-12)
      throw Error("Los pesos de los dos modelos no suman uno.");
    const hashes=Object.values(payload.model_sha256||{});
    if (hashes.length!==2 || !hashes.every(x=>/^[a-f0-9]{64}$/i.test(x)))
      throw Error("No hay huellas verificables de ambos modelos.");
    if (payload.parity.max_absolute_error_to_stored_csv_t_ha>1e-9 ||
        payload.parity.max_absolute_ensemble_replay_error_t_ha>1e-9)
      throw Error("La verificación Python de las 59 estimaciones no coincide.");
    const seen=new Set();
    for (const row of payload.rows) {
      if (typeof row.id!=="string" || !row.id || seen.has(row.id))
        throw Error("IDs faltantes o repetidos en las 59 parcelas.");
      seen.add(row.id);
      for (const [key] of columns)
        if (typeof row[key]!=="number" || !Number.isFinite(row[key]))
          throw Error("Predicción ausente o no numérica: "+key);
      const computed=a*row.reference26_mean_t_ha+b*row.compact14_t_ha;
      if (Math.abs(computed-row.ensemble_t_ha)>1e-9)
        throw Error("La combinación publicada no reproduce los pesos congelados.");
    }
    return payload;
  }
  function render() {
    if (!loaded) return;
    const query=search.value.trim().toLocaleLowerCase("es");
    const rows=loaded.rows.filter(x=>x.id.toLocaleLowerCase("es").includes(query));
    table.replaceChildren();
    for (const row of rows) {
      const tr=n("tr");
      const th=n("th",row.id);
      th.scope="row";
      tr.append(th);
      for (const [key] of columns) tr.append(n("td",round(row[key])));
      table.append(tr);
    }
    $("ensemble-predictions59-count").textContent=
      "Mostrando "+rows.length+" de 59 estimaciones del conjunto sin cosecha conocida.";
  }
  async function initialize() {
    try {
      const response=await fetch("./data/ensemble_predictions59.json",{cache:"no-store"});
      if (!response.ok) throw Error("Aún no se han publicado ambos modelos reajustados sobre 138 parcelas.");
      loaded=validate(await response.json());
      search.addEventListener("input",render);
      render();
      status.textContent=
        "59 estimaciones reproducidas en Python desde los dos modelos entrenados; "+
        "los rendimientos reales siguen siendo desconocidos. "+
        "Las tres columnas muestran predicciones en toneladas por hectárea.";
    } catch(e) {
      loaded=null;
      table.replaceChildren();
      status.textContent="Comparación pendiente: "+e.message;
      $("ensemble-predictions59-count").textContent="No se publicarán predicciones simuladas.";
    }
  }
  initialize();
})();
