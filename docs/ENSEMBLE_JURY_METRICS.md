# Tablero de métricas del ensamble final

Este trabajo agrega una sección separada de evaluación estadística
dentro de la página existente y **no cambia el motor de inferencia**
Reference26 con mediana actualmente publicado.

## Qué incluye

- Comparación de **Reference26 con media**, **Compact14** y **ensamble
  propuesto** con pesos fijos 0.7049462505599942 / 0.29505374944000595.
- Búsqueda libre de métricas y filtros por familia estadística:
  L1/L2/L∞, RMSE, MAE, SSE/MSE, R² predictivo, sesgo, colas de
  error, Huber, pérdida cuantílica, concordancia de Lin,
  calibración, correlación, métricas porcentuales y de normalidad.
- Diagnóstico espacial de residuos: Moran I y Geary C, distintos
  tamaños de vecindario (k=4,8,12,24), errores firmados, absolutos
  y cuadrados y p-valores de permutación con Holm y FDR-BH.
- Contrastes de pérdidas emparejadas: diferencias de pérdida
  absoluta/cuadrática, fracción de parcelas favorecidas,
  Wilcoxon y corrección Holm.
- Una nota explícita de que los pesos del ensamble se seleccionaron
  con los rendimientos observados de estas mismas 138 parcelas.
  El R² ajustado se identifica como no aplicable y el error de las
  59 parcelas ocultas continúa siendo desconocido.

## Estado de publicación

**No hay valores estadísticos inventados** en
`site/data/ensemble_evaluation.json`: el archivo no se crea
hasta que GeoC complete los 138 folds nuevos de ambos modelos.
La página muestra un estado "pendiente" y no presenta cifras
sin respaldo en ese JSON.

El generador de datos se encuentra en el repositorio hermano GeoC:

```powershell
python tools/run_reference26_compact14_final.py --check
python tools/run_reference26_compact14_final.py --smoke --jobs 1
python tools/run_reference26_compact14_final.py --run --jobs 4
python tools/run_reference26_compact14_final.py --train-final
python tools/report_reference26_compact14_final.py --run
python tools/report_reference26_compact14_final.py --summary
python tools/report_reference26_compact14_final.py --publish
```

El último comando deposita un JSON de estadísticas **agregadas**
en `../todoseboso/site/data/ensemble_evaluation.json`;
no incluye identificadores individuales, rendimientos,
coordenadas ni predicciones de las 59 parcelas.

Revisar manualmente este JSON antes de publicarlo.

## Galería verificada de las 59 parcelas

Además del panel de métricas LOOCV, el sitio muestra una sección
de tres predicciones para cada parcela del conjunto reservado,
**únicamente después** de que el equipo ejecute el ajuste final.
La página `site/ensemble_predictions59.js` carga
`site/data/ensemble_predictions59.json`, no accesible
hasta que el exportador lo cree explícitamente.

Después de los dos `joblib` finales:

```powershell
python tools/export_reference26_compact14_predictions59.py --check
python tools/export_reference26_compact14_predictions59.py --stage
# Revisar las 59 filas, los IDs y las condiciones de divulgación del reto.
python tools/export_reference26_compact14_predictions59.py --publish
```

El exportador coteja las dos fuentes ajustadas con sus huellas SHA256,
la tabla de 197 entradas, la matriz de distancias, la tabla privada
de 59 predicciones, y comprueba numéricamente sus dos pronósticos
y la mezcla. El JSON contiene 59 **identificadores y estimaciones
calculadas**, pero **no** cosechas observadas del conjunto reservado.

**`--publish` hace públicos los IDs y las estimaciones**: no debe
ejecutarse sin autorización del equipo y revisión de las bases
de la competencia. Ningún joblib, etiqueta observada,
matriz de distancias o geolocalización se envía a GitHub
mediante este procedimiento.

La galería no pretende recalcular en JavaScript cada predicción
de los dos modelos; muestra los valores calculados y
reproducidos por Python. La inferencia interactiva de parcelas
nuevas sigue siendo una tarea separada que requiere portar
y validar ambos modelos en el motor web, o servirlos por API.

Prueba adicional:

```powershell
node --test tests/test_ensemble_predictions59.cjs
```

## Tres predicciones para las 59 parcelas

La sección implementada **solo compara las estadísticas de validación**.
Para mostrar las tres predicciones reales se necesitan, además,
dos paquetes finales ajustados:

- `reference26_mean_train138.joblib` (media calculada durante el ajuste);
- `compact14_original_train138.joblib` (receta nativa);
- `configs/reference26_compact14_ensemble.json` (pesos fijos);
- `features197.parquet` y `distance197.npy` originales auditados.

El sitio público también contiene un motor JavaScript especializado
en **Reference26 original con mediana**, de modo que NO se
habilitan automáticamente los tres modelos en el navegador ni se
cambian etiquetas de ese motor como sustituto de recalcularlo.
Antes de publicar los tres rendimientos deben superar pruebas de
paridad Python-servidor o Python-navegador sobre las **59 parcelas**
y validar versiones/hashes de los paquetes nuevos.

## Pruebas de sitio

```powershell
node --test tests/test_ensemble_metrics.cjs
```

Comprueban que no haya resultados de ejemplo en la web, que la
página se bloquee correctamente mientras no haya un JSON verificado,
que funcione la búsqueda y que se vean los tres modelos y las tablas
espaciales y emparejadas sobre datos sintéticos solo de prueba.

## Advertencias estadísticas

1. LOOCV sirve para estimar el error de las **bases** entrenadas
   sin y del holdout. Sin embargo los pesos del ensamble fueron
   elegidos con las 138 etiquetas: su estimación de rendimiento
   es exploratoria, no validación independiente de selección.
2. Normalidad de residuos, heterocedasticidad, Wilcoxon y Moran
   muestran diagnósticos; p-valores bajo dependencia espacial
   o entrenamiento solapado necesitan interpretación cuidadosa.
3. El R² ajustado no dispone de un grado de libertad efectivo
   único para esta mezcla con expertos y correcciones anidadas.
4. No se inventan métricas probabilísticas como cobertura
   de intervalos o AIC/BIC sin especificar distribuciones y
   protocolos apropiados.


## Interpretación basada en el informe ya completado de 138 parcelas

**Datos confirmados:** el usuario compartió la salida completa de
tools/report_reference26_compact14_final.py --summary del 2026-10-19.
El análisis numérico **sí existe**, aunque el archivo de agregados
site/data/ensemble_evaluation.json todavía no se haya publicado.

La sección «Qué significan los resultados» incorpora una **síntesis
editorial de los valores realmente obtenidos**. Su panel de seis
apartados es desplegable, minimalista, sin animaciones decorativas.
Cuando se publica el JSON completo y verificado, el texto se vuelve a
calcular desde los datos y responde a los selectores espaciales;
si falta el JSON, siguen visibles solo las conclusiones respaldadas
por los registros previamente compartidos (nunca cifras simuladas).

Resultados centrales:

| Métrica | Reference26 media | Compact14 | Ensamble |
|---|---:|---:|---:|
| RMSE (t/ha) | 0.468138 | 0.469673 | 0.467811 |
| MAE (t/ha) | 0.333786 | 0.333044 | 0.332489 |
| R² predictivo | 0.695292 | 0.693291 | 0.695717 |
| L∞ (t/ha) | 2.139958 | 2.146351 | 2.141844 |
| Shapiro–Wilk p | 1.401988e−7 | 1.644084e−7 | 1.306209e−7 |

Ensamble: sesgo −0.000617 t/ha, asimetría +1.439436,
curtosis excesiva +4.467670, mediana error absoluto 0.247911 t/ha,
P95 0.779594 t/ha. Anderson–Darling también rechaza normalidad.
La evidencia es de colas de error pronunciadas, sin invalidar el RMSE
ni atribuir el comportamiento a una causa específica.

La prueba auxiliar Koenker–Breusch–Pagan del ensamble da p=0.373155;
Brown–Forsythe p=0.855512. No se detectó señal con estos
contrastes; **no se demuestra homocedasticidad**.

Para Moran I global sobre residuos firmados del ensamble:
k=4: −0.051225/p=0.4150; k=8: −0.074302/p=0.0720;
k=12: −0.060552/p=0.0670; k=24: −0.040814/p=0.0735.
Después de Holm para toda la familia espacial, esas filas tienen
p=1.0; **no hay evidencia bilateral al 5%, pero tampoco prueba de
independencia geográfica**.

La mezcla reduce error en 77/138 parcelas (55.7971%) frente a Reference26
media. Wilcoxon exploratorio con Holm: 0.715473 para error absoluto
y 0.759932 para cuadrático. Ninguna comparación permite afirmar
superioridad estadística independiente después de que los pesos
se eligieran con los mismos rendimientos. La búsqueda anterior
mostró además una mejora sensible a una sola parcela.

**Informe académico completo (GeoC):**
results/peer_models/REFERENCE26_COMPACT14_STATISTICAL_INTERPRETATION_138_2026-10-19.md,
rama experiment/nuria-champions-loocv.

### Precisión numérica en el frontend

Los p-valores menores que 0.00001 se expresan en notación científica;
nunca se redondean a «0». Los demás indicadores muestran unidades
y su interpretación, y se pueden buscar por nombre o familia.
No se presenta un p no ajustado como prueba causal ni se convierte
R² en «porcentaje de aciertos».

