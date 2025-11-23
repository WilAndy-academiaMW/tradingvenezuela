import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import datetime as dt
from io import StringIO
import os # Para verificar si el archivo CSV ya existe

# --- CONFIGURACIÓN DE COLUMNAS Y URL ---
URL = "https://www.bolsadecaracas.com/resumen-mercado/"

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
    'último precio (bs)': 'Último precio (Bs)', 
    'monto efectivo (bs)': 'Monto efectivo (Bs)', 
    'variación': 'Variación', 
    'títulos negociados': 'Títulos negociados'
}

# --- FUNCIONES AUXILIARES ---

def aplanar_columna(col):
    """Convierte encabezados de tuplas o strings en una sola string en minúsculas."""
    if isinstance(col, tuple):
        # Une los elementos de la tupla con un espacio y lo convierte a minúsculas
        return ' '.join(str(c) for c in col).lower().strip()
    return str(col).lower().strip()

# --- FUNCIÓN PRINCIPAL ---

def actualizar_datos_bvcs_diariamente():
    print("Iniciando Selenium (abriendo navegador virtual)...")
    
    try:
        # Inicializa Chrome WebDriver. Asegúrate de que tu driver esté en el PATH.
        driver = webdriver.Chrome()
    except Exception as e:
        print(f"❌ Error al iniciar el WebDriver. Verifica tu instalación y PATH de ChromeDriver: {e}")
        return

    try:
        driver.get(URL)
        print("Página cargada. Esperando que la tabla dinámica aparezca...")

        # 1. ESPERA ROBUSTA: Espera hasta 20 segundos a que cargue el elemento principal de la tabla.
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'col-12'))
        )
        print("Tabla principal detectada.")

        # 2. OBTENER EL HTML COMPLETO Y CERRAR EL NAVEGADOR
        html_cargado = driver.page_source
        driver.quit()
        print("Navegador cerrado. Iniciando procesamiento de datos con Pandas.")

        # 3. PASAR EL HTML CARGADO A PANDAS (Obtenemos todas las tablas)
        df_listado = pd.read_html(StringIO(html_cargado), thousands='.', decimal=',')
        print(f"✅ Se encontraron {len(df_listado)} tablas en el HTML cargado.")

        # 4. APLICAR FILTRO INTELIGENTE PARA ENCONTRAR LA TABLA DE DETALLE
        df_detalle = None
        
        for i, df in enumerate(df_listado):
            columnas_df_actual = set([aplanar_columna(col) for col in df.columns.tolist()])
            
            # Buscamos la tabla que contenga TODAS las columnas que definimos
            if COLUMNAS_BUSCADAS.issubset(columnas_df_actual):
                df_detalle = df
                print(f"🎯 ¡Tabla de detalle encontrada en el índice N° {i}!")
                break
        
        if df_detalle is None:
            print("\n❌ FALLO EN EL FILTRADO. No se encontró la tabla con las columnas esperadas.")
            return

        # 5. LIMPIEZA, NORMALIZACIÓN Y SELECCIÓN FINAL
        
        # Aplicamos el aplanamiento de columnas al DataFrame seleccionado
        df_detalle.columns = [aplanar_columna(col) for col in df_detalle.columns]
        
        # Seleccionamos las columnas de interés en el orden definido
        df_resultado = df_detalle[COLUMNAS_BUSCADAS_LISTA].copy()
        df_resultado.dropna(how='all', inplace=True)
        
        # Renombrar a los nombres finales (ej: 'símbolo' -> 'Símbolo')
        df_resultado.rename(columns=NOMBRES_FINALES_DF, inplace=True)

        # 6. REESTRUCTURACIÓN Y ALMACENAMIENTO DIARIO (El bloque de transposición corregido)
        
        fecha_hoy = dt.date.today().strftime("%Y-%m-%d")
        print("\n--- Guardando archivos CSV separados por métrica ---")

        # Iteramos sobre las métricas que serán los VALORES en la matriz final
        for columna_valor in ['Último precio (Bs)', 'Monto efectivo (Bs)', 'Variación', 'Títulos negociados']:
            
            # a. Creamos un índice temporal único para agrupar todas las acciones en una sola fila
            df_resultado['indice_temporal'] = 0
            
            # b. Crear el DataFrame pivote: Símbolo como Columnas, Métrica como Valor, y todo en la fila 0
            df_series = df_resultado.pivot(
                index='indice_temporal', 
                columns='Símbolo',  
                values=columna_valor
            )
            
            # c. Formato de Series de Tiempo: Reemplazamos el índice temporal '0' por la Fecha de hoy
            df_series.index = [fecha_hoy]
            df_series.index.name = 'Fecha' 
            
            # d. Crear el nombre del archivo (ej: Ultimo_precio_Bs.csv)
            nombre_archivo_base = columna_valor.replace(' ', '_').replace('(', '').replace(')', '').replace('.', '')
            nombre_archivo = f"{nombre_archivo_base}.csv"
            
            # --- Lógica de Guardado (Appending) ---
            
            if os.path.exists(nombre_archivo):
                # Si el archivo existe, cargamos el antiguo para hacer el APPEND
                df_antiguo = pd.read_csv(nombre_archivo, index_col='Fecha')
                
                # Combinamos el DataFrame antiguo con la nueva fila (df_series)
                df_combinado = pd.concat([df_antiguo, df_series])
                
                # Eliminamos duplicados por fecha (solo se guarda el último registro del día)
                df_combinado = df_combinado[~df_combinado.index.duplicated(keep='last')]
                
                # Guardamos el archivo
                df_combinado.to_csv(nombre_archivo)
                print(f"✅ Datos de '{columna_valor}' añadidos a {nombre_archivo}")
                
            else:
                # Si el archivo no existe, lo creamos por primera vez
                df_series.to_csv(nombre_archivo)
                print(f"✅ Archivo '{columna_valor}' creado por primera vez como {nombre_archivo}")
        
        print(f"\nOperación finalizada. Archivos creados/actualizados en el formato de series de tiempo.")

    except Exception as e:
        print(f"Ocurrió un error grave en el proceso: {e}")
        if 'driver' in locals():
            driver.quit()

# --- EJECUTAR EL PROGRAMA ---
if __name__ == "__main__":
    actualizar_datos_bvcs_diariamente()