import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import datetime as dt
from io import StringIO
import os 
from pathlib import Path # Mejor para manejar rutas y carpetas

# --- CONFIGURACIÓN DE RUTAS Y DATOS ---
URL = "https://www.bolsadecaracas.com/resumen-mercado/"
CARPETA_BASE_ACCIONES = "acciones"

# 1. Nombres de las columnas que Pandas debe buscar para identificar la tabla (en minúsculas)
COLUMNAS_BUSCADAS_LISTA = [
    'nombre',                     
    'símbolo',                    
    'último precio (bs)',         
    'monto efectivo (bs)',        
    'variación',
    'títulos negociados'
]
COLUMNAS_BUSCADAS = set(COLUMNAS_BUSCADAS_LISTA)

# 2. Nombres finales que se usarán en el DataFrame antes del pivoteo
NOMBRES_FINALES_DF = {
    'nombre': 'Nombre', 
    'símbolo': 'Símbolo', 
    'último precio (bs)': 'Último Precio (Bs)', 
    'monto efectivo (bs)': 'Monto Efectivo (Bs)', 
    'variación': 'Variación (%)', # Modificado para mayor claridad
    'títulos negociados': 'Títulos Negociados'
}
# Definimos las columnas que queremos como datos diarios (métricas)
COLUMNAS_METRICAS = [
    'Último Precio (Bs)', 
    'Monto Efectivo (Bs)', 
    'Variación (%)', 
    'Títulos Negociados'
]

# --- FUNCIONES AUXILIARES ---

def aplanar_columna(col):
    """Convierte encabezados de tuplas o strings en una sola string en minúsculas."""
    if isinstance(col, tuple):
        # Une los elementos de la tupla con un espacio y lo convierte a minúsculas
        return ' '.join(str(c) for c in col).lower().strip()
    return str(col).lower().strip()

# --- FUNCIÓN PRINCIPAL ---

def actualizar_base_de_datos_por_accion():
    print("Iniciando Selenium (abriendo navegador virtual)...")
    
    # Configuración para ejecutar Chrome en modo sin cabeza (headless)
    options = webdriver.ChromeOptions()
    options.add_argument('--headless') # Ejecutar Chrome sin abrir la ventana visible
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--log-level=3') # Suprime la mayoría de los logs de Chrome

    try:
        # Inicializa Chrome WebDriver
        driver = webdriver.Chrome(options=options)
    except Exception as e:
        print(f"❌ Error al iniciar el WebDriver. Verifica tu instalación y PATH de ChromeDriver: {e}")
        return

    try:
        driver.get(URL)
        print("Página cargada. Esperando que la tabla dinámica aparezca...")

        # 1. ESPERA ROBUSTA: Espera hasta 20 segundos a que cargue el elemento
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'col-12'))
        )
        print("Tabla principal detectada.")

        # 2. OBTENER EL HTML COMPLETO Y CERRAR EL NAVEGADOR
        html_cargado = driver.page_source
        driver.quit()
        print("Navegador cerrado. Iniciando procesamiento de datos con Pandas.")

        # 3. PASAR EL HTML CARGADO A PANDAS (Obtenemos todas las tablas)
        # Se añaden miles='.' y decimal=',' para leer correctamente los números venezolanos
        df_listado = pd.read_html(StringIO(html_cargado), thousands='.', decimal=',')
        
        # 4. APLICAR FILTRO INTELIGENTE PARA ENCONTRAR LA TABLA DE DETALLE
        df_detalle = None
        for i, df in enumerate(df_listado):
            columnas_df_actual = set([aplanar_columna(col) for col in df.columns.tolist()])
            
            if COLUMNAS_BUSCADAS.issubset(columnas_df_actual):
                df_detalle = df
                print(f"🎯 ¡Tabla de detalle encontrada en el índice N° {i}!")
                break
        
        if df_detalle is None:
            print("\n❌ FALLO EN EL FILTRADO. No se encontró la tabla con las columnas esperadas.")
            return

        # 5. LIMPIEZA, NORMALIZACIÓN Y PREPARACIÓN
        
        # Aplicamos el aplanamiento de columnas al DataFrame seleccionado
        df_detalle.columns = [aplanar_columna(col) for col in df_detalle.columns]
        
        # Seleccionamos y renombramos las columnas de interés
        df_resultado = df_detalle[COLUMNAS_BUSCADAS_LISTA].copy()
        df_resultado.dropna(how='all', inplace=True)
        df_resultado.rename(columns=NOMBRES_FINALES_DF, inplace=True)

        # 6. EXTRACCIÓN Y ALMACENAMIENTO POR ACCIÓN (EL NUEVO REQUERIMIENTO)
        
        fecha_hoy = dt.date.today().strftime("%Y-%m-%d")
        print(f"\n--- Procesando {len(df_resultado)} acciones para la fecha {fecha_hoy} ---")
        
        # Aseguramos que la carpeta base exista
        Path(CARPETA_BASE_ACCIONES).mkdir(exist_ok=True)

        # Iteramos sobre cada fila (cada acción) del DataFrame
        for index, row in df_resultado.iterrows():
            simbolo = row['Símbolo']
            
            # 6a. Definir rutas
            ruta_carpeta_accion = Path(CARPETA_BASE_ACCIONES) / simbolo
            ruta_archivo_csv = ruta_carpeta_accion / f"{simbolo}.csv"
            
            # 6b. Crear la carpeta para la acción si no existe
            ruta_carpeta_accion.mkdir(exist_ok=True)
            
            # 6c. Preparar la nueva fila de datos (Serie de Pandas)
            # Solo tomamos las columnas de métricas definidas y las agregamos como una Serie
            nueva_fila = row[COLUMNAS_METRICAS].to_frame().T 
            nueva_fila.index = [fecha_hoy]
            nueva_fila.index.name = 'Fecha'
            
            # 6d. Lógica de Guardado (Appending)
            if ruta_archivo_csv.exists():
                # Si el archivo existe, cargamos el antiguo para hacer el APPEND
                df_antiguo = pd.read_csv(ruta_archivo_csv, index_col='Fecha')
                
                # Combinamos el DataFrame antiguo con la nueva fila (df_series)
                df_combinado = pd.concat([df_antiguo, nueva_fila])
                
                # Eliminamos duplicados por fecha (solo se guarda el último registro del día)
                df_combinado = df_combinado[~df_combinado.index.duplicated(keep='last')]
                
                # Guardamos el archivo
                df_combinado.to_csv(ruta_archivo_csv)
                print(f"✅ [{simbolo}] Datos del día añadidos a su archivo.")
            else:
                # Si el archivo no existe, lo creamos por primera vez
                nueva_fila.to_csv(ruta_archivo_csv)
                print(f"➕ [{simbolo}] Archivo creado por primera vez.")
        
        print("\nOperación finalizada. Todos los datos de las acciones se han actualizado.")

    except Exception as e:
        print(f"Ocurrió un error grave en el proceso: {e}")
        # Aseguramos que el navegador se cierre si hubo un error antes
        if 'driver' in locals():
            driver.quit()

# --- EJECUTAR EL PROGRAMA ---
if __name__ == "__main__":
    actualizar_base_de_datos_por_accion()