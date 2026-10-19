# Archivos que se publican en Git

El repositorio conserva scripts, implementación, pruebas y documentación propia.
Los datos originales/externos/procesados (`data/`), los resultados generados
(`outputs/`), los documentos descargados de referencia (`docs/resources/`), los
modelos serializados, registros y cachés se mantienen fuera de Git mediante
`.gitignore`. Ignorarlos no borra los archivos locales.

Los scripts conservan sus rutas de entrada y salida. Para ejecutar el proyecto
en otra computadora se necesitan los datos por separado; clonar este repositorio
no descarga esos insumos, modelos ni resultados. Los informes propios dentro de
`documentation/` sí se pueden versionar. Sus enlaces a resultados locales
requieren disponer también de la carpeta `outputs/`.

Las especificaciones y la procedencia recuperadas se versionan por separado en
[`configs/`](../configs/README.md): diseñosJSON, hashes, registro de modelos y
particiones expresadas como posiciones, sin rendimientos ni matrices. Esto no
cambia el `.gitignore`, no copia los datos a Git y no convierte el clon en una
distribución autosuficiente de los experimentos. Las copias no sobrescriben sus
fuentes locales congeladas.

`results/current_champions/` publica exclusivamente métricas y auditorías agregadas
deC-T3,26,14 yB1. No contiene registros individuales, rendimientos,OOF ni modelos.
El bundle reproducible de26 entradas permanece en `data/processed/current_champions/`
y sus predicciones por parcela en `outputs/research/current_champions/`, ambos
excluidos. L40 queda fuera de esa entrega actual, conservando su historial.

La documentación propia incluye un [inventario de IA generativa](ai_usage.md) y
prompts textuales recuperados, con procedencia y límites. Revisar su contenido
antes de publicar, igual que cualquier documento propio. Los archivos compilados
`__pycache__/` y `*.pyc` no pertenecen al repositorio; retirar su seguimiento no
requiere borrarlos del disco.

No usar `git add -f` para incluir datos o artefactos ignorados. Antes de publicar,
revisar `git status` y `git diff --cached --stat`.

## Excepción aprobada para el despliegue de inferencia Reference26

Se autorizó explícitamente preparar la publicación de tres artefactos concretos,
no de la carpeta completa `outputs/` ni de datos históricos sin auditar.
La carpeta `deployment/model_artifacts/` puede contener el `joblib` final,
`features197.parquet` y `distance197.npy`; la excepción de `.gitignore`
se limita al nombre exacto del modelo final en esa ruta. **No utilizar
`git add -f` para copiar archivos ajenos a este inventario.**

El Parquet **contiene los 138 rendimientos reportados y los IDs** de las
parcelas. La publicación los hace descargables por cualquier persona; no son
«anónimos» por el mero hecho de tener un nombre técnico. Si se necesita
restringir el acceso, se puede instalar el modelo y los datos como artefactos
privados del servidor y fijar `GEOCEBADA_ARTIFACT_DIR`.
El navegador sólo recibe la predicción solicitada, nunca un vector de 138 etiquetas.
