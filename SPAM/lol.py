import pandas as pd

def seleccionar_y_exportar_columna_unica(
    ruta_entrada_csv: str, 
    ruta_salida_csv: str, 
    indice_columna: int # Posición de la columna a extraer (0, 1, 2, ...)
):
    """
    Lee una única columna de un CSV por su índice numérico y la guarda en un nuevo CSV.
    
    El índice 0 corresponde a la primera columna, 1 a la segunda, y así sucesivamente.
    """
    
    try:
        # 1. Cargar el archivo CSV de origen, SELECCIONANDO SOLO la columna por índice.
        
        print(f"Leyendo el archivo de entrada: {ruta_entrada_csv}")
        print(f"Seleccionando columna con índice: {indice_columna}...")
        
        # Usamos el parámetro 'usecols' con una lista que contiene el índice único.
        df_seleccionado = pd.read_csv(
            ruta_entrada_csv, 
            usecols=[indice_columna]
        )

        # 2. Guardar el nuevo DataFrame en un archivo CSV
        # Pandas mantendrá el nombre de la columna original del archivo de entrada.
        print(f"Exportando los datos a: {ruta_salida_csv}...")
        df_seleccionado.to_csv(ruta_salida_csv, index=False)
        
        print("✅ ¡Proceso completado con éxito! Se ha creado el archivo de salida.")

    except FileNotFoundError:
        print(f"❌ ERROR: El archivo de entrada no se encontró en la ruta: {ruta_entrada_csv}")
    except IndexError:
        print(f"🚨 ERROR: El índice de columna ({indice_columna}) está fuera de los límites del archivo. Asegúrate de que exista esa columna.")
    except ValueError as e:
        # Esto captura errores si el índice es inválido o si el CSV no tiene formato correcto.
        if "Usecols do not match columns" in str(e):
             print(f"🚨 ERROR: Problema con el índice {indice_columna}. Asegúrate de que el índice sea válido (empezando por 0).")
        else:
             print(f"❌ Ocurrió un error inesperado al leer el CSV: {e}")
    except Exception as e:
        print(f"❌ Ocurrió un error inesperado: {e}")

# --- EJEMPLO DE USO CON ÍNDICES ---

# La columna de la tabla de la bolsa es la 1 (Símbolo), 2 (Último Precio), etc.
# Pero el índice empieza en 0.
# Si tu archivo Último_precio_Bs.csv tiene la Fecha en la columna 1 (Índice 0),
# y el precio de ABC.A en la columna 2 (Índice 1), usarías estos valores:

RUTA_ORIGEN = r'bdvc\Monto_efectivo_Bs.csv' 
RUTA_DESTINO = r'bdvc\ABC.A.csv' 

# 0 = Columna 1 del CSV (Probablemente la Fecha)
# 1 = Columna 2 del CSV (Probablemente el precio de la primera acción)
INDICE_COLUMNA_A_EXTRAER = 2

# Ejecutar la función
seleccionar_y_exportar_columna_unica(
    ruta_entrada_csv=RUTA_ORIGEN,
    ruta_salida_csv=RUTA_DESTINO,
    indice_columna=INDICE_COLUMNA_A_EXTRAER
)