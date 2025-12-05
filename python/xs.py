import pandas as pd

archivo_entrada = r"bdvc\Último_precio_Bs.csv"
columna_origen = "IVC.A"
archivo_salida = r"acciones\IVC.A\IVC.A.csv"
columna_destino = "Último Precio (Bs)"

# Leer solo la columna origen
df_origen = pd.read_csv(archivo_entrada, usecols=[columna_origen])

valores = df_origen[columna_origen]

# Leer CSV de salida
df_salida = pd.read_csv(archivo_salida)

if len(valores) != len(df_salida):
    raise ValueError("La cantidad de filas en origen y destino no coincide")

df_salida[columna_destino] = valores.values
df_salida.to_csv(archivo_salida, index=False)

print(f"✅ Columna '{columna_destino}' actualizada con datos de '{columna_origen}' en {archivo_salida}")
