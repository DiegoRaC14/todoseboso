/* Aggregate-only, auditable interactive jury diagnostics.
 * No client-side model fitting, no fabricated scores, no parcel-level data.
 * The study only renders after the verified JSON is explicitly published.
 */
"use strict";
(() => {
  const root = document.getElementById("ensemble-jury-metrics");
  if (!root) return;
  const $ = id => document.getElementById(id);
  const loading = $("ensemble-metrics-status");
  const tbody = $("ensemble-metrics-body");
  const filter = $("ensemble-metrics-family");
  const search = $("ensemble-metrics-search");
  const spatialBody = $("ensemble-spatial-body");
  const knn = $("ensemble-spatial-k");
  const target = $("ensemble-spatial-target");
  const modelNames = ["Reference26_mean", "Compact14", "Ensemble_final"];
  const friendly = {
    Reference26_mean: "Reference26 (media)",
    Compact14: "Compact14",
    Ensemble_final: "Ensamble sugerido"
  };
  const named = {
    rmse_t_ha: ["RMSE", "t/ha", "Raíz del error cuadrático medio, sensible a errores grandes."],
    mae_t_ha: ["MAE", "t/ha", "Promedio de los errores absolutos."],
    mse_t_ha2: ["MSE", "(t/ha)²", "Promedio de errores al cuadrado."],
    l1_t_ha: ["Norma L¹", "t/ha", "Suma de los 138 errores absolutos; NO es MAE."],
    l2_t_ha: ["Norma L²", "t/ha", "Raíz de la suma de errores cuadrados; NO es RMSE."],
    linf_t_ha: ["Norma L∞", "t/ha", "Máximo error absoluto observado."],
    sse_t_ha2: ["SSE", "(t/ha)²", "Suma de errores cuadrados."],
    r2_cv: ["R² predictivo LOOCV", "adimensional", "1 − SSE/TSS; no es porcentaje de aciertos."],
    adjusted_r2: ["R² ajustado", "N/A", "No se define un número único de parámetros efectivos para esta arquitectura."],
    bias_t_ha: ["Sesgo medio", "t/ha", "Media de predicción menos observado; positivo significa sobreestimación."],
    median_ae_t_ha: ["Mediana error absoluto", "t/ha", "La mitad de los errores absolutos queda por debajo."],
    p90_ae_t_ha: ["P90 error absoluto", "t/ha", "90% de los errores absolutos no supera este umbral."],
    p95_ae_t_ha: ["P95 error absoluto", "t/ha", "Percentil 95 del error absoluto."],
    max_ae_t_ha: ["Máximo error absoluto", "t/ha", "Igual a la norma L∞."],
    error_sd_t_ha: ["Desviación de errores", "t/ha", "Dispersión de los residuos alrededor de su sesgo."],
    explained_variance: ["Varianza explicada", "adimensional", "Reducción de dispersión residual, no idéntica a R² con sesgo."],
    pearson_r: ["Correlación Pearson", "r", "Asociación lineal entre rendimientos observados y estimados."],
    spearman_rho: ["Correlación Spearman", "rho", "Asociación monótona entre los rangos."],
    concordance_ccc: ["Concordancia de Lin", "CCC", "Evalúa cercanía a la línea de identidad."],
    wape_pct: ["WAPE", "%", "Error absoluto total respecto a la suma de cosechas."],
    nrmse_mean_pct: ["NRMSE/media", "%", "RMSE expresado en porcentaje de la cosecha promedio."],
    nrmse_sd_pct: ["NRMSE/DE", "%", "RMSE dividido entre la desviación de rendimientos."],
    smape_pct: ["sMAPE", "%", "Error porcentual simétrico; susceptible a valores cercanos a cero."],
    mape_pct: ["MAPE", "%", "No aplicable si se observan rendimientos cero."],
    rmsle: ["RMSLE", "adimensional", "Error logarítmico; exige rendimientos y estimaciones no negativos."],
    huber_delta_0p5_t2_ha2: ["Pérdida Huber (δ=0.5)", "(t/ha)²", "Combina pérdida cuadrática y lineal con umbral fijo."],
    log_cosh_error: ["Log-cosh", "adimensional", "Pérdida suave y menos sensible a extremos que MSE."],
    calibration_slope: ["Pendiente de calibración", "adimensional", "Pendiente descriptiva de observado frente a predicho."],
    calibration_intercept_t_ha: ["Intercepto de calibración", "t/ha", "Intercepto descriptivo de observado frente a predicho."],
    fraction_ae_le_0p25: ["Error ≤ 0.25 t/ha", "fracción", "Proporción bajo ese umbral absoluto."],
    fraction_ae_le_0p50: ["Error ≤ 0.50 t/ha", "fracción", "Proporción bajo ese umbral absoluto."],
    fraction_ae_le_1p0: ["Error ≤ 1.00 t/ha", "fracción", "Proporción bajo ese umbral absoluto."],
    shapiro_w: ["Shapiro–Wilk W", "estadístico", "Diagnóstico de normalidad marginal de residuos LOOCV."],
    shapiro_p_exploratory: ["Shapiro p", "p", "Diagnóstico exploratorio, no confirmatorio."],
    dagostino_pearson_p_exploratory: ["D’Agostino K² p", "p", "Prueba omnibus de asimetría y curtosis."],
    anderson_darling_statistic: ["Anderson–Darling A²", "estadístico", "Sensibilidad a diferencias de distribución, incluidas colas."],
    skewness_bias_corrected: ["Asimetría de residuos", "adimensional", "Desviación respecto a simetría."],
    excess_kurtosis_bias_corrected: ["Exceso de curtosis", "adimensional", "Describe colas respecto a la normal."],
    residual_mad_normalized: ["MAD robusto de residuos", "t/ha", "Mediana absoluta de desviaciones, escalada a normal."],
    koenker_breusch_pagan_lm_diagnostic: ["Koenker–Breusch–Pagan LM", "estadístico", "Variación de error cuadrático con la predicción."],
    koenker_breusch_pagan_asymptotic_p_exploratory: ["Koenker–BP p", "p", "Referencia asintótica con supuestos de independencia."],
    brown_forsythe_3_predicted_terciles_p_exploratory: ["Brown–Forsythe p", "p", "Compara dispersión en terciles de rendimiento estimado."]
  };
  const sections = [
    ["prediction_error", "Error predictivo"],
    ["association_and_skill", "R², asociación y habilidad"],
    ["relative_and_specialized", "Errores especializados"],
    ["other_specialized", "Otros diagnósticos y métricas"],
    ["normality", "Normalidad y distribución de residuos"],
    ["conditional_error", "Heterocedasticidad y calibración"]
  ];
  const head = ["Campo", ...modelNames.map(x => friendly[x]), "Interpretación"];
  function node(tag, text, cls) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = String(text);
    if (cls) el.className = cls;
    return el;
  }
  function format(x) {
    if (x === null || x === undefined || (typeof x === "number" && !Number.isFinite(x))) return "No aplicable";
    if (typeof x === "boolean") return x ? "Sí" : "No";
    if (typeof x === "number") {
      if (x !== 0 && Math.abs(x) < 0.00001) return x.toExponential(3);
      return Number.isInteger(x) ? x.toLocaleString("es-MX") :
        Number(x.toPrecision(6)).toLocaleString("es-MX", {maximumFractionDigits:8});
    }
    return String(x);
  }
  function requirePayload(data) {
    if (!data || data.schema_version !== 1 || data.n_labeled !== 138 ||
        data.n_unknown !== 59 || data.not_independent_weight_validation !== true ||
        !Array.isArray(data.models) || data.models.length !== 3)
      throw Error("Los datos no satisfacen el contrato de validación del ensamble.");
    if (data.models.some(m => !modelNames.includes(m.model) || typeof m.metrics !== "object") ||
        new Set(data.models.map(m => m.model)).size !== 3)
      throw Error("No se identifican exactamente los tres modelos verificados.");
    const a = Number(data.weights?.Reference26_mean);
    const b = Number(data.weights?.Compact14);
    if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a+b-1) > 1e-10)
      throw Error("Los pesos de la mezcla son incompatibles.");
    return data;
  }
  function modelById(data) {
    return Object.fromEntries(data.models.map(m => [m.model, m.metrics]));
  }
  function availableFields(data) {
    const m = modelById(data);
    const map = new Map();
    const families = data.interpretation || {};
    for (const [group, title] of sections.slice(0, 3)) {
      for (const field of families[group] || []) {
        if (modelNames.some(model => Object.hasOwn(m[model], field)))
          map.set(field, {group, title});
      }
    }
    for (const model of modelNames) {
      for (const [key, value] of Object.entries(m[model])) {
        if (key === "source_kind" || key === "adjusted_r2_status" ||
            key === "model") continue;
        if (!map.has(key) && (typeof value === "number" ||
            value === null || typeof value === "boolean"))
          map.set(key, {group:"other_specialized",
                        title:"Otros indicadores de evaluación"});
      }
    }
    if (!map.has("adjusted_r2")) map.set("adjusted_r2", {
      group:"association_and_skill", title:"R² y ajuste estadístico"
    });
    for (const group of ["normality", "conditional_error"]) {
      for (const row of data.diagnostics?.[group] || []) {
        for (const key of Object.keys(row)) {
          if (["model", "n", "normality_warning", "conditional_warning"].includes(key)) continue;
          if (typeof row[key] === "number" || typeof row[key] === "boolean")
            if (!map.has(key)) map.set(key, {group, title:sections.find(x=>x[0]===group)?.[1] || group});
        }
      }
    }
    return map;
  }
  function detailsFor(data, family, model) {
    if (["normality", "conditional_error"].includes(family))
      return (data.diagnostics?.[family] || []).find(row => row.model === model) || {};
    return modelById(data)[model] || {};
  }
  function render(data) {
    const fields = availableFields(data);
    const family = filter.value, term = search.value.trim().toLocaleLowerCase("es");
    tbody.replaceChildren();
    let count = 0;
    for (const [key, info] of fields) {
      if (family !== "all" && family !== info.group) continue;
      const title = named[key]?.[0] || key.replaceAll("_", " ");
      const note = named[key]?.[2] || info.title + ". Resultado descriptivo o exploratorio según el protocolo.";
      if (term && !(key + " " + title + " " + note).toLocaleLowerCase("es").includes(term)) continue;
      const tr = node("tr");
      const th = node("th", title);
      th.scope = "row";
      tr.append(th);
      for (const model of modelNames) {
        const values = detailsFor(data, info.group, model);
        const td = node("td", format(values[key]));
        tr.append(td);
      }
      tr.append(node("td", note, "ensemble-metric-meaning"));
      tbody.append(tr);
      count++;
    }
    $("ensemble-metrics-count").textContent =
      count + " indicadores disponibles en la categoría seleccionada.";
    if (!count) {
      const tr = node("tr"), td = node("td", "No hay métricas que coincidan con esos filtros.");
      td.colSpan = head.length;
      tr.append(td);
      tbody.append(tr);
    }
  }
  function renderSpatial(data) {
    spatialBody.replaceChildren();
    const n = Number(knn.value);
    const variable = target.value;
    const rows = (data.spatial || []).filter(x =>
      x.knn === n && x.spatial_variable === variable);
    for (const name of modelNames) {
      for (const metric of ["Moran_I", "Geary_C"]) {
        const row = rows.find(x=>x.model === name && x.statistic === metric);
        if (!row) continue;
        const tr = node("tr");
        for (const item of [
          friendly[name], metric.replace("_", " "),
          format(row.estimate), format(row.p_two_sided),
          format(row.p_two_sided_holm_all),
          format(row.p_two_sided_fdr_bh_all)
        ]) tr.append(node("td", item));
        spatialBody.append(tr);
      }
    }
    $("ensemble-spatial-status").textContent =
      spatialBody.children.length + " pruebas de autocorrelación espacial. P-valores de permutación exploratorios, corregidos por multiplicidad.";
  }
  function number(x) {
    return typeof x === "number" && Number.isFinite(x);
  }
  function humanModel(model) {
    return friendly[model] || model;
  }
  function statement(id, value) {
    const target = $(id);
    if (target) target.textContent = value;
  }
  function pDescription(p, label) {
    if (!number(p)) return label + ": p no disponible.";
    return label + ": p = " + format(p) +
      (p < .05 ? " (señal exploratoria al 5%)" :
                " (no se detecta evidencia al 5%)") + ".";
  }
  function renderInterpretation(data) {
    const model = modelById(data);
    const base = model.Reference26_mean;
    const alt = model.Compact14;
    const ens = model.Ensemble_final;
    const rmse = [base.rmse_t_ha, alt.rmse_t_ha, ens.rmse_t_ha];
    const existsRmse = rmse.every(number);
    if (existsRmse) {
      const best = modelNames.reduce((a,b) =>
        model[a].rmse_t_ha <= model[b].rmse_t_ha ? a : b);
      statement("ensemble-interpretation-overview",
        "En 138 parcelas evaluadas por exclusión individual, " +
        humanModel(best) + " presenta el menor RMSE descriptivo (" +
        format(model[best].rmse_t_ha) + " t/ha). " +
        "Esto compara errores sobre las mismas parcelas; los pesos de la mezcla " +
        "se eligieron examinando esas 138 cosechas. No es una validación " +
        "independiente de la selección del ensamble.");
      const reduction = 100*(base.rmse_t_ha-ens.rmse_t_ha)/base.rmse_t_ha;
      statement("ensemble-reading-accuracy",
        "Reference26 con media: RMSE " + format(base.rmse_t_ha) +
        " t/ha; Compact14: " + format(alt.rmse_t_ha) +
        " t/ha; ensamble: " + format(ens.rmse_t_ha) +
        " t/ha. Frente a Reference26, la reducción relativa del RMSE " +
        "es " + format(reduction) + "%. " +
        (number(ens.mae_t_ha) ? "El MAE del ensamble es " +
        format(ens.mae_t_ha) + " t/ha. " : "") +
        (number(ens.r2_cv) ? "Su R² predictivo es " + format(ens.r2_cv) +
        ", calculado como 1 − SSE/TSS sobre las 138 cosechas, " +
        "no como porcentaje de predicciones correctas. " : "") +
        "Una diferencia pequeña de RMSE no demuestra superioridad práctica " +
        "ni estadística.");
    } else {
      statement("ensemble-interpretation-overview",
        "Faltan valores de RMSE de alguno de los tres modelos: no se puede concluir cuál rinde mejor.");
      statement("ensemble-reading-accuracy",
        "No se dispone de una comparación completa de RMSE sobre los tres modelos.");
    }
    if ([ens.median_ae_t_ha, ens.p95_ae_t_ha, ens.linf_t_ha].every(number)) {
      statement("ensemble-reading-tails",
        "Para el ensamble, la mediana del error absoluto es " +
        format(ens.median_ae_t_ha) + " t/ha; el percentil 95 es " +
        format(ens.p95_ae_t_ha) + " t/ha y el máximo (norma L∞) es " +
        format(ens.linf_t_ha) + " t/ha. El percentil 95 describe un " +
        "umbral que alcanza al menos el 95% de esta muestra. " +
        "El máximo caracteriza la peor predicción observada, no el error " +
        "máximo futuro. L¹ y L² son normas totales y deben distinguirse de MAE y RMSE.");
    } else {
      statement("ensemble-reading-tails",
        "La tabla contiene medidas de errores extremos cuando se exportan; faltan uno o más cuantiles para interpretarlos conjuntamente.");
    }
    if (number(ens.bias_t_ha)) {
      const bias = ens.bias_t_ha;
      let explanation = "El sesgo medio del ensamble es " +
        format(bias) + " t/ha (predicción menos observado): " +
        (Math.abs(bias) < 1e-12 ? "cercano a cero en la muestra. " :
        bias > 0 ? "predomina la sobreestimación en promedio. " :
                   "predomina la subestimación en promedio. ");
      if (number(ens.calibration_slope) &&
          number(ens.calibration_intercept_t_ha)) {
        explanation += "La regresión descriptiva de observado frente a predicho " +
          "tiene pendiente " + format(ens.calibration_slope) +
          " e intercepto " + format(ens.calibration_intercept_t_ha) +
          " t/ha. Valores de pendiente cercanos a 1 e intercepto cercano a 0 " +
          "son compatibles con una mejor calibración lineal, pero no demuestran " +
          "calibración probabilística. ";
      }
      statement("ensemble-reading-calibration",
        explanation + "Un sesgo medio pequeño puede coexistir con errores individuales grandes.");
    } else {
      statement("ensemble-reading-calibration",
        "Faltan los valores de sesgo y calibración del ensamble.");
    }
    const normality = data.diagnostics?.normality || [];
    const condition = data.diagnostics?.conditional_error || [];
    const parts = [];
    for (const name of modelNames) {
      const row = normality.find(x => x.model === name);
      if (!row) continue;
      const p = row.shapiro_p_exploratory;
      if (!number(p)) continue;
      parts.push(humanModel(name) + ": Shapiro–Wilk p = " + format(p) +
        (p < .05 ? ", señal de desviación respecto de normalidad" :
                   ", sin evidencia suficiente para rechazar normalidad") +
        (row.anderson_reject_at_5pct === true ?
          "; Anderson–Darling rechaza al 5%" :
          row.anderson_reject_at_5pct === false ?
          "; Anderson–Darling no rechaza al 5%" : "") + ".");
    }
    const hetero = condition.find(x => x.model === "Ensemble_final");
    if (hetero) {
      parts.push(pDescription(
        hetero.koenker_breusch_pagan_asymptotic_p_exploratory,
        "Koenker–Breusch–Pagan del ensamble"));
      parts.push(pDescription(
        hetero.brown_forsythe_3_predicted_terciles_p_exploratory,
        "Brown–Forsythe por terciles"));
    }
    statement("ensemble-reading-normality",
      (parts.length ? parts.join(" ") :
       "Los tests de normalidad y dispersión condicional aún no cuentan con resultados completos. ") +
      "Estos p-valores son diagnósticos: los errores LOOCV comparten " +
      "entrenamientos y pueden depender espacialmente. Rechazar normalidad " +
      "no invalida RMSE/MAE; no rechazarla no demuestra una distribución normal. " +
      "Las pruebas de dispersión no establecen por sí solas homocedasticidad.");
    renderSpatialInterpretation(data);
    const pair = (data.diagnostics?.paired_losses || []).filter(
      x => x.model === "Ensemble_final");
    const sq = pair.find(x => x.loss === "squared_error");
    const ab = pair.find(x => x.loss === "absolute_error");
    const messages = [];
    for (const [row, text, unit] of [
      [sq, "Pérdida cuadrática", "(t/ha)²"],
      [ab, "Error absoluto", "t/ha"]
    ]) {
      if (!row || !number(row.mean_loss_difference)) continue;
      messages.push(text + ": diferencia media frente a Reference26 = " +
        format(row.mean_loss_difference) + " " + unit +
        " (negativa favorece al ensamble); " +
        (number(row.fraction_improved) ?
          format(100*row.fraction_improved) + "% de parcelas mejoran. " : "") +
        pDescription(row.wilcoxon_p_exploratory_holm_all, "Wilcoxon p Holm"));
    }
    statement("ensemble-reading-paired",
      (messages.length ? messages.join(" ") :
        "Faltan los resultados de pérdidas emparejadas. ") +
      "La corrección por comparaciones múltiples no corrige la selección " +
      "previa de pesos basada en estas mismas 138 observaciones. " +
      "Una mejora media puede depender de muy pocas parcelas; no implica " +
      "una ventaja independiente o robusta.");
  }
  function renderSpatialInterpretation(data) {
    const k = Number(knn.value), variable = target.value;
    const group = (data.spatial || []).filter(
      x => x.model === "Ensemble_final" && x.knn === k &&
        x.spatial_variable === variable);
    const mor = group.find(x => x.statistic === "Moran_I");
    const gea = group.find(x => x.statistic === "Geary_C");
    const labels = {
      signed_residual:"residuos firmados",
      absolute_error:"errores absolutos",
      squared_error:"errores al cuadrado"
    };
    if (!mor || !number(mor.estimate)) {
      statement("ensemble-reading-spatial",
        "No se dispone de Moran I para el vecindario y la variable seleccionados; " +
        "no corresponde afirmar independencia espacial.");
      return;
    }
    const corrected = mor.p_two_sided_holm_all;
    let phrase = "Para " + labels[variable] + " y k = " + k +
      " vecinos, Moran I del ensamble = " + format(mor.estimate) +
      ". " + pDescription(corrected, "p bilateral Holm");
    if (number(corrected)) {
      phrase += corrected < .05 ?
        (mor.estimate > 0 ?
          " Hay una señal exploratoria de agrupamiento espacial de valores semejantes." :
          " Hay una señal exploratoria de contraste entre valores vecinos.") :
        " No se detectó una señal significativa con esta familia de pruebas; " +
        "ello no prueba independencia espacial.";
    }
    if (gea && number(gea.estimate)) {
      phrase += " Geary C = " + format(gea.estimate) +
        (gea.estimate < 1 ? " (< 1 sugiere semejanza local)." :
          gea.estimate > 1 ? " (> 1 sugiere contraste local)." :
          " (≈1 es referencia de aleatoriedad).");
    }
    statement("ensemble-reading-spatial",
      phrase + " Son pruebas de permutación sobre centroides y pesos KNN; " +
      "no demuestran causalidad geográfica ni garantizan extrapolación " +
      "a zonas distintas. Cambiar k o la definición de residuo es " +
      "un análisis de sensibilidad, no replicaciones independientes.");
  }
  function renderPaired(data) {
    const root = $("ensemble-paired-body");
    root.replaceChildren();
    for (const row of data.diagnostics?.paired_losses || []) {
      const tr = node("tr");
      for (const field of [
        friendly[row.model] || row.model,
        row.loss === "squared_error" ? "Error cuadrático" : "Error absoluto",
        format(row.mean_loss_difference),
        format(row.fraction_improved),
        format(row.wilcoxon_p_exploratory),
        format(row.wilcoxon_p_exploratory_holm_all)
      ]) tr.append(node("td", field));
      root.append(tr);
    }
    if (!root.children.length) {
      const tr = node("tr");
      const td = node("td", "Aún no hay contrastes emparejados calculados.");
      td.colSpan = 6;
      tr.append(td);
      root.append(tr);
    }
  }
  async function initialize() {
    try {
      const response = await fetch("./data/ensemble_evaluation.json", {cache:"no-store"});
      if (!response.ok) throw Error("Aún no se han exportado los resultados completos del experimento.");
      const data = requirePayload(await response.json());
      const m = modelById(data);
      const box = $("ensemble-top-line");
      box.replaceChildren();
      for (const name of modelNames) {
        const item = node("div");
        item.append(node("span", friendly[name]));
        item.append(node("strong", format(m[name].rmse_t_ha)+" t/ha"));
        box.append(item);
      }
      for (const [name, label] of sections) {
        const option = node("option", label);
        option.value = name;
        filter.append(option);
      }
      filter.addEventListener("change",()=>render(data));
      search.addEventListener("input",()=>render(data));
      knn.addEventListener("change",()=>{
        renderSpatial(data);
        renderSpatialInterpretation(data);
      });
      target.addEventListener("change",()=>{
        renderSpatial(data);
        renderSpatialInterpretation(data);
      });
      render(data);
      renderSpatial(data);
      renderPaired(data);
      renderInterpretation(data);
      loading.textContent = "Resultados agregados de 138 parcelas LOOCV cargados. Los pesos del ensamble se seleccionaron usando estas mismas 138 etiquetas.";
    } catch (err) {
      loading.textContent = "Análisis final pendiente de publicar: " + err.message;
      $("ensemble-metrics-count").textContent = "No se muestran cifras simuladas.";
      $("ensemble-spatial-status").textContent = "Los tests espaciales aparecerán al terminar el análisis real.";
    }
  }
  initialize();
})();
