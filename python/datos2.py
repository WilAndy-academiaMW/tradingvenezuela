import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

# --- Configuración ---
TICKER = "BNV.CR" 

# Usd/Ves:VES=X.. bdvc:BVCC.CR.. ceramica:CCR.CR..provincial:BPV.CR..
#proagro:PGR.CR..Banco Nacional de Credito:BNC.CR.. "Montesco:MTC-B.CR".. ..
#..Bitcoin:BTC-USD..Ethereum:ETH-USD..Petroleo:MCL=F..Oro:GC=F..plata:SI=F..
#..#Corporacion Grupo Quimico:  #..#Telares de Palo Grande:TPG.CR..
#..#..#.


NOMBRE_ARCHIVO = "archivos/bnc.csv" 


# Calcular la fecha de inicio: 3 años antes de hoy (ajuste para días bisiestos)
# Se usa 3 * 365 + 1 = 1096 días para cubrir cualquier día bisiesto potencial.
TRES_ANOS_ATRAS = datetime.today() - timedelta(days=2 * 365 + 1)
FECHA_INICIO = TRES_ANOS_ATRAS.strftime('%Y-%m-%d')
FECHA_FIN = datetime.today().strftime('%Y-%m-%d') # Fecha de hoy

def descargar_y_filtrar_datos(ticker, inicio, fin, nombre_archivo):
    """
    Descarga, filtra y guarda datos históricos (Open, High, Low, Close, Volume)
    para el período exacto de los últimos 3 años.
    """
    print(f"📈 Iniciando descarga de datos para: **{ticker}**")
    print(f"📅 Período estricto: {inicio} hasta {fin} (últimos 3 años)")

    try:
        # 1. Descargar los datos (yfinance puede descargar un poco más)
        datos_completos = yf.download(ticker, start=inicio, end=fin, progress=False)

        if datos_completos.empty:
            print(f"⚠️ Error: No se encontraron datos históricos para {ticker}.")
            return

        # 2. 🎯 FILTRADO ESTRICTO DE 3 AÑOS CON PANDAS 🎯
        # Forzamos que el DataFrame solo contenga registros desde la fecha de inicio calculada.
        fecha_corte = pd.to_datetime(inicio)
        datos_completos = datos_completos[datos_completos.index >= fecha_corte]
        
        # 3. Seleccionar las columnas requeridas y renombrar
        columnas_requeridas = ['Open', 'High', 'Low', 'Close', 'Volume']
        datos_filtrados = datos_completos[columnas_requeridas]
        datos_filtrados.columns = ['Precio_Inicio', 'Alto', 'Bajo', 'Precio_Cierre', 'Volumen']

        # 4. Guardar el DataFrame filtrado a un archivo CSV
        # La columna 'Date' se guarda automáticamente como la primera columna (índice)
        datos_filtrados.to_csv(nombre_archivo)
        
        # --- Resumen ---
        print("-" * 50)
        print(f"✅ ¡Descarga y filtrado completado con éxito!")
        print(f"Archivo guardado en: **{nombre_archivo}**")
        print(f"Registros finales: **{len(datos_filtrados)}**")
        print(f"Columnas: [Date, {', '.join(datos_filtrados.columns)}]")
        print("-" * 50)

    except Exception as e:
        print(f"❌ Ocurrió un error: {e}")
        print("Verifique su conexión a Internet y que el ticker sea correcto.")


# 🚀 Ejecutar la función
descargar_y_filtrar_datos(TICKER, FECHA_INICIO, FECHA_FIN, NOMBRE_ARCHIVO)