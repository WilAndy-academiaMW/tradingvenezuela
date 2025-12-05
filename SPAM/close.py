import pandas as pd

# 🔧 Configura aquí directamente:
ruta_csv = "bdvc\Último_precio_Bs.csv"   # Ruta completa o relativa de tu CSV
columna = "CCP.B"                               # Nombre exacto de la columna a borrar

try:
    df = pd.read_csv(ruta_csv)

    if columna not in df.columns:
        print(f"⚠️ La columna '{columna}' no existe en el archivo.")
    else:
        df = df.drop(columns=[columna])
        df.to_csv(ruta_csv, index=False)
        print(f"✅ Columna '{columna}' eliminada correctamente en '{ruta_csv}'.")

except Exception as e:
    print(f"❌ Error: {e}")
