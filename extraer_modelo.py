import zipfile
from pathlib import Path

zip_path = Path(
    r"C:\Users\diego\Fundacion Universidad de las Americas Puebla"
    r"\Nuria Arroyo Bustamante - fira\data.zip"
)

archivo_modelo = (
    "outputs/modeling/current_champions_final/"
    "v1/final_train138.joblib"
)

destino = Path(
    r"C:\Users\diego\Documents\modelo_cebada"
)

destino.mkdir(parents=True, exist_ok=True)

with zipfile.ZipFile(zip_path, "r") as z:
    info = z.getinfo(archivo_modelo)
    print(f"Tamaño del modelo: {info.file_size / 1024**2:.2f} MB")

    z.extract(archivo_modelo, destino)

print("Modelo extraído en:", destino / archivo_modelo)