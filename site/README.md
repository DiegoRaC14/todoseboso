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

Los controles del navegador no realizan ajustes ni exponen predicciones
individuales. No hacen nuevas pruebas de significancia. Conservar la
distinción entre efecto causal, asociación, utilidad predictiva y validación
reutilizada cuando se edite texto o se añadan gráficos.
