# Página pública: regresión local con mezcla geológica

La página principal `site/index.html` describe **un solo modelo**: el modelo
de 26 entradas registrado como `Reference26` en el código. Su nombre público
es **Regresión local con mezcla geológica**. No debe presentarse simplemente
como `KMeans26`: K-means agrupa composiciones geológicas y selecciona pesos
de mezcla; los rendimientos proceden de regresiones Elastic Net y Ridge.

## Recorrido del lector

1. Datos de 197 parcelas (138 con rendimiento, 59 por estimar).
2. Inventario interactivo completo de las 26 variables, por función
   (4 clima, 7 local, 2 ubicación, 10 geología, 3 residuales).
3. Construcción, agregaciones temporales, imputación, escalado, raíz
   cuadrada de proporciones geológicas y reglas de datos faltantes.
4. Diagrama y fórmula de la predicción: C + g(E−C) + s·m·δ.
5. K-means y pesos reales del ajuste final para cuatro grupos geológicos,
   con un ejemplo numérico **inventado** que modifica la mezcla.
6. Selección interna y valores finales de los hiperparámetros de
   Elastic Net, Ridge, K-means y corrección de residuos.
7. RMSE/MAE/R² del único modelo en cinco evaluaciones documentadas.
8. Evidencia estadística: asociaciones de C-T3 (no p-valores del modelo
   completo), corrección por múltiples pruebas y sensibilidad HHI.
9. Soporte de las 59, corrección R3 desactivada en ocho parcelas,
   percentiles por estado, cobertura y limitaciones.

La pestaña de datos obtiene su inventario de `site/data/model.json`. El
verificador `scripts/check_model_story.py` exige coincidencia **exacta,
en orden**, de las 26 columnas con el manifiesto original
`configs/current_champions_inputs.json`, y valida los valores finales
contra `documentation/models/Reference26/README.md`.

Las gráficas se dibujan con `site/charts.js` (SVG, teclado, hover);
`site/model.js` reúne los agregados congelados de `results.json`,
`evidence.json`, `new_research.json` y `distribution.json`. Los datos
de otros experimentos pueden permanecer versionados como fuentes, pero
**no** se presentan un ranking o tarjetas de otros modelos.

La versión antigua de comparación se conserva en el repositorio
(`website/`) como material histórico, pero el workflow
`.github/workflows/publish_story.yml` **no la publica** ni deja un segundo
sitio alternativo. En Pages sólo se publica `site/`.

## Gráficas vinculadas a datos reales

El gráfico «¿En qué estados están las 197 parcelas?» se alimenta de
`site/data/distribution.json`, derivado exclusivamente de
`results/reference26_distribution/v1/descriptive_global_state.csv`.
Los seis segmentos visualizados son recuentos verdaderos de registros
(Hidalgo: 36 observados/15 sin rendimiento; Puebla: 71/29;
Tlaxcala: 31/15). Las sumas deben ser 138 y 59, respectivamente.
Los rendimientos de las 59 parcelas aún se desconocen.

La comparación gráfica de errores ahora incorpora el resumen comunicado
de 138 turnos dejando una parcela fuera (`site/data/model.json.loocv`).
Su RMSE de 0.468186 t/ha se incluye como agregado comunicado, **no
reconstruido** a partir de OOF individuales; por ello no se calcula un
MAE inexistente, y se mantiene separado el protocolo original 97/41.
Los demás puntos proceden de las tablas publicadas de validación.

El ejemplo mensual de 210 mm y la calculadora manual de mezclas siguen
siendo explícitamente ficticios: no existen datos públicos mensuales
individuales suficientes para sustituirlos fielmente en este clon.
En ningún caso se construyen series mensuales, dispersogramas observado
contra predicho ni mapas de centroides a partir de resúmenes agregados.

## Dataset pequeño para nuevas gráficas reales

## Observaciones reales publicadas · 2025

`site/data/real_charts.json` contiene ahora las cifras empíricas de lluvia
mensual y NDVI para abril–octubre de 2025, obtenidas del archivo original
`monthly_inputs_apr_oct.parquet` aportado el 19 de octubre de 2026
(SHA-256 `971bdac1808036e7ca9be3260faa7608e82e2530ef0285a0c0f432a6fae2d635`).
La fuente incluye **5,516 registros** de **197 parcelas** en **2022–2025**.
Para 2025 hay **197 observaciones válidas en cada mes** tanto de lluvia
como de NDVI. En los años previos existen 39 faltantes de NDVI, que no se
imputan. Los gráficos publicados describen sólo 2025.

Los gráficos usan valores calculados del archivo original: la mediana de
precipitación de junio de 2025 fue `237.6761 mm`; la mediana NDVI de
septiembre fue `0.545`. Incluyen percentiles 10/90 y número real de
parcelas. Las mediciones climáticas y satelitales no son rendimientos
observados y **no** estiman el error de las 59 parcelas desconocidas.

La tabla de errores LOOCV individuales continúa vacía hasta disponer de
138 predicciones fuera de muestra por modelo. La demostración didáctica
separada de 210 mm sigue identificada como inventada.


La herramienta [`scripts/export_real_chart_data.py`](../scripts/export_real_chart_data.py)
extrae sólo las cinco columnas mensuales necesarias de los Parquet
locales, resume lluvia y NDVI por mes sin inventar mediciones y, si se
proporcionan OOF LOOCV genuinas, calcula métricas de error y su distribución.
Escribe un JSON pequeño en `outputs/site_extract/real_charts.json`
(excluido de Git) para revisión antes de publicar como
`site/data/real_charts.json`. El navegador sólo muestra los gráficos
empíricos si existe un archivo con esquema válido. Mientras no exista,
informa que faltan los datos, sin trazar valores simulados.

[Comandos, archivos exactos y garantías de procedencia](../documentation/real_chart_data_export.md).

## Validación

```bash
python scripts/sync_story_data.py --check
python scripts/check_story_evidence.py
python scripts/check_new_research.py
python scripts/check_site_charts.py
python scripts/check_model_story.py
python -m unittest discover -s tests -p 'test_story_site.py'
node --test tests/test_svg_charts.cjs
node --check site/charts.js
node --check site/model.js
```

Los controles del navegador no realizan nuevos ajustes de coeficientes ni pruebas de significancia. La galería publica las **59 predicciones individuales originalmente archivadas**, reproducidas desde el modelo final de Reference26 y nunca presentadas como cosechas observadas. Conservar la
distinción entre efecto causal, asociación, utilidad predictiva y validación
reutilizada cuando se edite texto o se añadan gráficos.


## Redacción matemática, LOOCV y laboratorio de parcelas

La página presenta primero una explicación completa **en español** de cada
operación y, cuando la formalización añade valor, muestra un apartado
«Notación matemática» en MathML nativo de HTML. No se dejan fórmulas
pseudo-LaTeX impresas como texto plano ni se requiere una librería externa
de renderizado. `site/predictor.css` incorpora estilos de tipografía,
desplazamiento horizontal y visualización accesible.

### LOOCV confirmado por el equipo

Se incorporaron las cifras comunicadas el 19 de octubre de 2026:

- Receta: Reference26, públicamente «Regresión local con mezcla geológica».
- 138 predicciones reservadas, 137 etiquetas de entrenamiento por ajuste.
- RMSE = 0.468186 t/ha; R² aproximadamente 0.6952.

Se guardan en `site/data/model.json` con **provenance explícita**. Las
predicciones individuales de esas 138 pruebas todavía no están archivadas
en este repositorio público, por lo que estos datos no constituyen una
auditoría de su cálculo; no se debe presentar como reproducido aquí.

0.468186 t/ha equivale a 468.186 kg/ha. Respecto a la media observada
3.9554 t/ha es el 11.84 % de la media: **no es MAPE** ni un porcentaje
esperado de error individual. El control de escala modifica el denominador
de comparación, sin alterar el RMSE. R² = 0.6952 tampoco equivale a
69.52 % de predicciones correctas.

### Laboratorio de parcelas

El menú al final tiene dos modos claramente independientes:

1. **Parcelas inventadas:** tres presets de clima y experto local, cuatro
   pesos geológicos **reales del ajuste final**, y una corrección
   numérica ficticia sujeta a ±0.25 t/ha. La regla de disponibilidad R3
   desactiva el último término cuando falta soporte. Son escenarios que
   explican la aritmética de la mezcla, nunca inferencias reales.
2. **Mi parcela:** campos numéricos para las **26 entradas derivadas**
   exactas, con un conteo de valores presentes, validaciones de proporción
   geológica y estado de los tres indicadores R3. El archivo JSON se
   descarga **en el navegador, sin transmitir los valores**. El paquete
   no contiene predicción.

Para predecir una parcela **de verdad** es necesario un predictor
entrenado y todos sus artefactos (coeficientes de Elastic Net,
preprocesamiento, vecindarios de entrenamiento, agrupamiento geológico y
corrector residual). GitHub Pages es un sitio estático; el bundle final
`outputs/modeling/current_champions_final/v1/final_train138.joblib`
no está publicado allí ni debe subirlo la página sin decisión expresa
sobre privacidad y condiciones de uso. No se creó una estimación
falsa usando los pesos de mezcla.

La función aritmética se ha aislado en `site/parcel_core.js` y se comprueba
en CI:

```bash
python scripts/check_model_story.py
node --test tests/test_parcel_core.cjs
node --check site/predictor.js
```

## Inferencia del modelo entrenado dentro del navegador

El motor `site/reference26_engine.js` reproduce el ajuste **real** de
Reference26 con operaciones JavaScript nativas: Elastic Net climática,
normalización guardada, siete señales locales, Ridge de 24 vecinos,
centroides K-means y pesos geológicos, corrección interna y corrector R3.

`scripts/export_reference26_browser.py` genera el JSON ligero del modelo
(`site/data/reference26_runtime.json`) **sólo** con los tres artefactos
originales, después de verificar sus SHA-256. El exportador reproduce
las 59 predicciones de Python y guarda sus resultados como pruebas.
`tests/test_reference26_browser.cjs` reproduce esos 59 casos de nuevo con
JavaScript y exige diferencia absoluta máxima de 0.0000001 t/ha, además
de comparar la escala de distancia para parcelas nuevas.

La compilación se realiza en GitHub Actions cuando estén versionados
los binarios, pero el visitante no necesita Python, Render, API, servidor
propio ni GPU: **todos los cálculos de inferencia ocurren en su navegador**.

El JSON contiene los **138 rendimientos históricos** de entrenamiento,
pues el método Ridge local los necesita en cada predicción. Es un dato
públicamente descargable cuando se publique la exportación; no se debe
confundir con un formato que conserve privacidad de los rendimientos.
La página deshabilita automáticamente las predicciones reales hasta que
el JSON pase las 59 pruebas de coincidencia.

## Las 59 parcelas sin rendimiento conocido: galería pública

La sección `#predicciones-59` muestra **las 59 estimaciones del modelo final**,
no valores inventados ni mediciones reales del rendimiento. La galería se
activa sólo después de que el motor JavaScript reproduce los 59 valores
originales del ajuste Python con una diferencia absoluta menor o igual
a 1e-7 t/ha.

Las ubicaciones por estado y municipio proceden de las filas originales de
`features197.parquet`; se exportan con cada fila de predicción en
`scripts/export_reference26_browser.py`. La galería se genera en
`site/predictions59.js`: ejemplos de menor, mediana y mayor estimación;
grupo visual por estado; búsqueda por ID o municipio; filtro por estado;
ordenación; desglose de las etapas del modelo; descarga CSV con los 59
valores reproducidos; y transferencia de las 26 entradas al laboratorio.

El navegador calcula todas las estimaciones utilizando los parámetros
serializados en el JSON del despliegue. **No existe columna de rendimiento
real para estas 59 parcelas.** No se les asignan errores individuales ni
certeza causal. La disponibilidad de la corrección residual es distinta
del soporte total de la estimación.

La comprobación automática `tests/test_predictions59.cjs` asegura 59 IDs
únicos, 59 predicciones con paridad frente a Python, 51 con R3 y ocho sin
soporte para R3, y que se rechazan cifras o entradas manipuladas.


## Explorador geográfico de Andrea-HH

La última sección de `site/index.html` (`#mapa-interactivo`) integra el
[explorador interactivo de Andrea-HH](https://github.com/Andrea-HH/todoseboso/tree/paginAndrea/site/explorador)
por medio de un único `iframe` independiente con la
[versión publicada](https://andrea-hh.github.io/todoseboso/explorador/mapa.html).
Se mantienen sus propios filtros por estado y conjunto, selección de parcelas,
controles Leaflet, base satelital y atribuciones. El código de modelado de
este repositorio no se modifica.

**Dependencia externa:** la capa de geometrías, los datos del explorador y
los tiles satelitales son gestionados por el sitio original; no están incluidos
en el `main` de este repositorio. Si el despliegue externo está caído o cambia
su ruta, la vista embebida dejará de funcionar. Debajo del marco se incluye
un enlace directo al sitio original como alternativa de acceso. Se recomienda
coordinar con la autora una exportación versionada y autorizada de los datos
antes de convertir la integración en una dependencia autocontenida.

Prueba local sin acceso de red:
`python -m unittest discover -s tests -p 'test_interactive_map_section.py'`.
La disponibilidad del iframe y de sus capas remotas se debe verificar
manualmente en el despliegue después de fusionar la PR.
