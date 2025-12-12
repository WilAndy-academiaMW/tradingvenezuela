import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import os

# --- 1. CONFIGURACIÓN GLOBAL ---
CARPETA_ARCHIVOS = "archivos"

TRES_ANOS_ATRAS = datetime.today() - timedelta(days=3 * 365 + 1)
FECHA_INICIO = TRES_ANOS_ATRAS.strftime('%Y-%m-%d')
FECHA_FIN = datetime.today().strftime('%Y-%m-%d')

# --- 2. DICCIONARIO DE ACTIVOS ---
ACTIVOS_A_DESCARGAR = {
    "VES=X": "bolivar.csv",
    "BVCC.CR": "bolsa.csv",
    "CCR.CR": "ceramica.csv",
    "BPV.CR": "provincial.csv",
    "PGR.CR": "proagro.csv",
    "MTC-B.CR":"Montesco.csv",
    "EFE.CR":"Efe.csv",
    "ABC-A.CR":"Banco del Caribe.csv",
    "IVC-B.CR":"INVACA.csv",
    "SVS.CR": "Siderurgica Venezolana.csv",
    "TPG.CR":"Telares de Palo Grande.csv",
    "RST.CR":"ron.csv",
    "RST-B.CR":"ron2.csv",
    "MPA.CR":"Manufacturas de Papel CA.csv",
    "BVL.CR":"bdv.csv",
    "MVZ-A.CR": "mercantil.csv",
    "ENV.CR":"envases.csv",
    "PTN.CR":"protinal.csv",
    "FNC.CR":"cemento.csv",
    "CRM-A.CR":"corimon.csv",
}

# --- 3. FUNCIÓN DE DESCARGA Y ACTUALIZACIÓN ---
def descargar_y_actualizar_datos(ticker, inicio, fin, ruta_completa_archivo):
    print(f"\n--- 📈 Procesando: {ticker} ---")

    try:
        # Descargar datos nuevos
        datos_nuevos = yf.download(ticker, start=inicio, end=fin, progress=False)

        if datos_nuevos.empty:
            print(f"⚠️ No se encontraron datos para {ticker}")
            return

        # Filtrar columnas y renombrar
        columnas_requeridas = ['Open', 'High', 'Low', 'Close', 'Volume']
        datos_nuevos = datos_nuevos[columnas_requeridas]
        datos_nuevos.columns = ['Precio_Inicio', 'Alto', 'Bajo', 'Precio_Cierre', 'Volumen']

        # Si ya existe el archivo, cargarlo y combinar
        if os.path.exists(ruta_completa_archivo):
            datos_existentes = pd.read_csv(ruta_completa_archivo, index_col=0, parse_dates=True)
            # Concatenar y eliminar duplicados por índice (fecha)
            datos_combinados = pd.concat([datos_existentes, datos_nuevos])
            datos_combinados = datos_combinados[~datos_combinados.index.duplicated(keep='last')]
        else:
            datos_combinados = datos_nuevos

        # Guardar actualizado
        datos_combinados.to_csv(ruta_completa_archivo)
        print(f"✅ Actualizado {ticker}. Registros totales: {len(datos_combinados)}")

    except Exception as e:
        print(f"❌ Error con {ticker}: {e}")

# --- 4. BUCLE PRINCIPAL ---
if not os.path.exists(CARPETA_ARCHIVOS):
    os.makedirs(CARPETA_ARCHIVOS)

print("-" * 50)
print("INICIO DE DESCARGA/ACTUALIZACIÓN")
print("-" * 50)

for ticker, nombre_archivo in ACTIVOS_A_DESCARGAR.items():
    ruta_completa = os.path.join(CARPETA_ARCHIVOS, nombre_archivo)
    descargar_y_actualizar_datos(ticker, FECHA_INICIO, FECHA_FIN, ruta_completa)

print("-" * 50)
print("FIN DEL PROCESO")
