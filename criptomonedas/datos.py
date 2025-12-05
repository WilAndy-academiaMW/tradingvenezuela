import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import os # Necesario para manejar directorios

# --- 1. CONFIGURACIÓN GLOBAL ---

# Definir la carpeta donde se guardarán todos los archivos CSV
CARPETA_ARCHIVOS = "criptomonedas/archivos" 

# Calcular las fechas: 3 años exactos hasta hoy
# Usamos un número ligeramente mayor de días (1096 = 3 años + 1 día por si acaso)
TRES_ANOS_ATRAS = datetime.today() - timedelta(days=5 * 365 + 1) 
FECHA_INICIO = TRES_ANOS_ATRAS.strftime('%Y-%m-%d')
FECHA_FIN = datetime.today().strftime('%Y-%m-%d') # Fecha de hoy

# --- 2. DICCIONARIO DE ACTIVOS A DESCARGAR ---
# Clave = Ticker de yfinance
# Valor = Nombre del archivo CSV
# ⚠️ ADVERTENCIA: Algunos tickers (como los de la BVCC) tienen poca liquidez,
# y yfinance puede no devolver datos para el período completo.
ACTIVOS_A_DESCARGAR = {
    # Monedas/Commodities/Cripto
  "BTC-USD":"btc.csv",
   "SOL-USD":"solana.csv",
    "XRP-USD":"xrp.csv"
}


# --- 3. FUNCIÓN DE DESCARGA (Ligeramente modificada) ---
def descargar_y_filtrar_datos(ticker, inicio, fin, ruta_completa_archivo):
    """
    Descarga, filtra y guarda datos históricos para un único ticker.
    """
    print(f"\n--- 📈 Procesando: **{ticker}** ---")
    print(f"📅 Período estricto: {inicio} hasta {fin}")

    try:
        # 1. Descargar los datos
        datos_completos = yf.download(ticker, start=inicio, end=fin, progress=False)

        if datos_completos.empty:
            print(f"⚠️ Error: No se encontraron datos históricos para {ticker}.")
            return

        # 2. 🎯 FILTRADO ESTRICTO DE 3 AÑOS 🎯
        fecha_corte = pd.to_datetime(inicio)
        datos_filtrados = datos_completos[datos_completos.index >= fecha_corte]
        
        # 3. Seleccionar columnas y renombrar
        columnas_requeridas = ['Open', 'High', 'Low', 'Close', 'Volume']
        datos_filtrados = datos_filtrados[columnas_requeridas]
        datos_filtrados.columns = ['Precio_Inicio', 'Alto', 'Bajo', 'Precio_Cierre', 'Volumen']

        # 4. Guardar el DataFrame
        datos_filtrados.to_csv(ruta_completa_archivo)
        
        # --- Resumen ---
        print(f"✅ ¡Completado! Registros: **{len(datos_filtrados)}**")
        print(f"Archivo guardado en: **{ruta_completa_archivo}**")

    except Exception as e:
        print(f"❌ Ocurrió un error para {ticker}: {e}")
        print("Verifique el ticker y la conexión a Internet.")


# --- 4. 🚀 BUCLE PRINCIPAL DE EJECUCIÓN ---

# Asegurar que la carpeta de destino exista
if not os.path.exists(CARPETA_ARCHIVOS):
    os.makedirs(CARPETA_ARCHIVOS)
    print(f"\nSe ha creado la carpeta: **{CARPETA_ARCHIVOS}/**")

# Iterar sobre el diccionario de activos
print("-" * 50)
print("INICIO DE DESCARGA MASIVA")
print("-" * 50)

for ticker, nombre_archivo in ACTIVOS_A_DESCARGAR.items():
    # Construir la ruta completa del archivo
    ruta_completa = os.path.join(CARPETA_ARCHIVOS, nombre_archivo)
    
    # Llamar a la función para cada activo
    descargar_y_filtrar_datos(ticker, FECHA_INICIO, FECHA_FIN, ruta_completa)

print("-" * 50)
print("FIN DEL PROCESO. Todos los archivos han sido actualizados.")