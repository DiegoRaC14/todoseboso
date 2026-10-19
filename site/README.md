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

## API opcional para ejecutar Reference26 de verdad

`site/inference_client.js` conecta el formulario de 26 indicadores con una
API Python externa (`deployment/inference_api.py`). GitHub Pages no puede
cargar un `joblib` directamente, por lo que el botón **«Calcular rendimiento»**
permanece desactivado hasta que `site/data/inference_config.json` contenga
la URL real del servicio y su endpoint de salud confirme la reproducción de
las 59 predicciones originales.

El modo ficticio continúa separado; nunca muestra resultados como si fueran
predicciones del modelo entrenado. La inferencia remota utiliza exactamente
`src/current_champions.py:predict_saved`, el `joblib` verificado por hash,
las 197 características y la matriz geográfica. La predicción de parcelas
nuevas sólo se habilita cuando el servicio confirma el algoritmo de
normalización de distancias; en caso contrario siguen disponibles las 59
parcelas originales por ID.

[Pasos y advertencias para desplegar la API](../deployment/README.md).
