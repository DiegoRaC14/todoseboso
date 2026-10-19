# Ensamble Reference26 + Compact14 — contrato de integración

Este trabajo **sólo prepara la visualización** y no modifica pesos entrenados
ni atribuye métricas a un ensamble todavía inexistente.

## Orden de lectura de la página

1. **Ensamble**: es la vista principal por defecto. Hasta contar con ambos
   ajustes finales, muestra explícitamente que faltan la regla, los pesos
   y las predicciones verificadas. No hay un promedio 50/50 provisional.
2. **Reference26**: componente de 26 indicadores, regresión local con
   mezcla geológica. Se conservan las 59 estimaciones originales y el
   comprobador Python → JavaScript, sin confundirse con el ensamble.
3. **Compact14**: componente de 14 indicadores, cinco señales de experto
   local y un peso de mezcla global. No usa la compuerta geológica K-means.
   No aparecen resultados nuevos hasta recibir su ajuste final.

Esta vista no pretende mostrar tres modelos independientes en un ranking;
es la historia de **un ensamble y sus dos componentes**. Los datos numéricos
que ya estaban documentados en las secciones posteriores siguen siendo de
Reference26, no del futuro ensamble.

## Los dos archivos de modelo que entregará el otro agente

No se fijan nombres ni hashes de archivos que no existen aún. Al recibir los
dos `.joblib` finales:

1. Registrar el archivo y SHA-256 **de cada modelo por separado**.
2. Reexportar el paquete JavaScript de Reference26 desde su nueva versión.
   Debe dejar `artifact_sha256` (o `hashes[model_artifact_filename]`)
   asociado a ese ajuste final, además de las 59 predicciones de referencia
   reproducidas, y superar el test de paridad de Python.
3. Exportar la nueva versión de Compact14 con las predicciones de sus **mismas
   59 parcelas**, y verificarla de manera independiente frente a Python.
4. Entrenar/seleccionar la regla de combinación con predicciones
   apropiadamente fuera de entrenamiento, preservando la separación de
   los folds. No ajustar pesos sobre los 59 rendimientos desconocidos.
5. Exportar un archivo `site/data/ensemble_predictions_v1.json` con el
   contenido descrito a continuación, **sólo después de la validación**.
6. Establecer `upcoming_artifact_sha256` para los dos componentes en
   `site/data/ensemble_models.json` y actualizar `status` a `ready`.
   No confundir los pesos internos del modelo Reference26 con los pesos
   externos del ensamble.

Actualmente **ninguno** de estos pasos sobre los dos nuevos artefactos se ha
ejecutado. `site/data/ensemble_models.json` contiene valores `null`
intencionales y no existe el archivo futuro de predicciones.

## Esquema del futuro conjunto de predicciones

La siguiente estructura describe **tipos y relaciones**: las marcas entre
ángulos son campos por llenar con datos verificados, no resultados numéricos.

~~~json
{
  "schema_version": 1,
  "cohort": "final_138_to_59",
  "source_models": {
    "Reference26": {
      "artifact_sha256": "<HASH_REAL_DEL_JOBLIB_REFERENCE26>"
    },
    "Compact14": {
      "artifact_sha256": "<HASH_REAL_DEL_JOBLIB_COMPACT14>"
    }
  },
  "ensemble": {
    "method": "global_convex",
    "weights": {
      "Reference26": "<PESO_NUMERICO_APRENDIDO>",
      "Compact14": "<PESO_NUMERICO_APRENDIDO>"
    },
    "provenance": "<RUTA_DEL_EXPERIMENTO_O_MANIFIESTO>",
    "validation_protocol": "<PROTOCOLO_REAL_DE_SELECCION>"
  },
  "validation_metrics": null,
  "rows": [
    {
      "id": "<ID_POLIGONO_REAL>",
      "state": "<ESTADO_REAL>",
      "municipality": "<MUNICIPIO_REAL>",
      "Reference26": "<PREDICCION_NUMERICA_PYTHON>",
      "Compact14": "<PREDICCION_NUMERICA_PYTHON>",
      "Ensemble": "<PREDICCION_NUMERICA_PYTHON>"
    }
  ]
}
~~~

Las marcas de texto se reemplazan por números en el JSON final. Deben existir
**59 objetos de fila**, no uno. Nunca copiar esta plantilla literalmente como
datos de producción.

Para una **mezcla convexa global**, los dos pesos deben estar entre cero y uno,
sumar uno y reproducir numéricamente las 59 predicciones del ensamble. Una
alternativa de stacking, calibración condicional u otro método más sofisticado
puede emplear `"method": "precomputed"` y `"weights": null`, siempre que
se exporte la predicción final real de Python y se documente el método y su
procedencia. No se representa como una media ponderada sin evidencias.

Si se aportan métricas nuevas, `validation_metrics` debe incluir:
`protocol`, `status` (verified o preliminary), y las métricas numéricas
`rmse`, `mae` y `r2` que efectivamente estén disponibles. Ninguna se
deduce de un promedio de los RMSE individuales; los errores están
correlacionados y el ensamble requiere validación propia.

## Garantías del visualizador

El archivo `site/ensemble_contract.js` comprueba:

- exactamente 59 IDs únicos, idénticos a los de la versión Reference26
  cargada y previamente verificada;
- hashes SHA-256 de ambos artefactos, distintos entre sí, con coincidencia
  contra el Reference26 realmente ejecutado en el navegador;
- predicción Reference26 por ID con tolerancia absoluta 1e-7 t/ha;
- región/municipio correspondientes al mismo ID;
- valores finitos de las dos predicciones y del ensamble;
- pesos numéricos en [0, 1], suma uno, y reproducción de la combinación
  si se declara una mezcla convexa;
- método, procedencia y protocolo de selección explícitos;
- estado de métricas y protocolo cuando estén presentes.

Un paquete inválido se rechaza y no se muestran resultados nuevos. El
contrato no sustituye la auditoría independiente de Compact14 y del
ensamble en Python: **esa verificación todavía debe implementarse en el
script exportador de los dos nuevos archivos**.

## Pruebas y rutas

```bash
node --test tests/test_ensemble_story.cjs
node --check site/ensemble_contract.js
node --check site/ensemble_story.js
python scripts/check_model_story.py
```

Archivos del PR:

- `site/data/ensemble_models.json`: configuración pendiente, sin pesos.
- `site/ensemble_contract.js`: validador reutilizable.
- `site/ensemble_story.js`: selector de tres vistas y futuras figuras.
- `site/ensemble_story.css`: estilos responsivos.
- `tests/test_ensemble_story.cjs`: pruebas de compatibilidad y fallos.

**Integración:** el marco visual está en `main`; los artefactos entrenados,
pesos finales, versiones y predicciones deben conectarse después de una
validación numérica independiente.
