import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from datetime import date
import time
import os # Importar módulo para manejo de rutas

# --- Configuración Inicial ---
url_bcv = "https://www.bcv.org.ve/"

# 1. Configurar las opciones del navegador
chrome_options = Options()
# Descomentar la siguiente línea si quieres que el navegador se ejecute de forma invisible (sin ventana)
# chrome_options.add_argument("--headless") 
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")


# 2. Especificar la ruta a tu ChromeDriver (AJUSTA ESTA RUTA SI ES NECESARIO)
# Si el driver está en tu PATH del sistema, Selenium lo encontrará automáticamente.
# Si no, descarga el ChromeDriver compatible con tu versión de Chrome y especifica la ruta aquí:
# driver_path = '/ruta/a/tu/chromedriver' 
# service = Service(executable_path=driver_path) # Descomentar si es necesario

# Inicializar el driver
driver = None # Inicializar driver a None para el bloque finally
try:
    # driver = webdriver.Chrome(service=service, options=chrome_options) # Descomentar si usas service
    driver = webdriver.Chrome(options=chrome_options) # Si el driver está en el PATH

    print("Iniciando navegador...")
    driver.get(url_bcv)

    # 3. Esperar a que la página cargue el elemento
    driver.implicitly_wait(10) 
    
    # 4. Localizar el elemento por su ID o clase
    dolar_box = driver.find_element(By.ID, 'dolar')
    valor_usd_tag = dolar_box.find_element(By.TAG_NAME, 'strong')
    
    # 5. Extraer y limpiar el texto
    precio_usd_str = valor_usd_tag.text.strip().replace('.', '').replace(',', '.') 
    precio_usd = float(precio_usd_str)

    # 6. Usar Pandas para estructurar el dato
    fecha_actual = date.today().strftime("%Y-%m-%d")
    
    data = {
        'Moneda': ['USD'],
        'Tasa (Bs/USD)': [precio_usd],
        'Fecha Extracción': [fecha_actual]
    }
    df_bcv = pd.DataFrame(data)

    print("\n--- ¡Dato Extraído y Formato en DataFrame de Pandas! ---")
    print(df_bcv)
    print("-" * 45)
    print(f"✅ Extracción Exitosa: El precio del dólar BCV es: {precio_usd} Bs por USD.")

    # 7. GUARDAR EL DATAFRAME EN UN ARCHIVO CSV
    nombre_archivo_csv = "tasa_dolar_bcv.csv"
    
    # Comprobar si el archivo ya existe
    if os.path.exists(nombre_archivo_csv):
        # Si existe, cargar el CSV existente y añadir la nueva fila
        df_existente = pd.read_csv(nombre_archivo_csv)
        df_final = pd.concat([df_existente, df_bcv], ignore_index=True)
        print(f"\nArchivo '{nombre_archivo_csv}' actualizado con la nueva tasa.")
    else:
        # Si no existe, crear un nuevo CSV
        df_final = df_bcv
        print(f"\nArchivo '{nombre_archivo_csv}' creado con la tasa actual.")

    # Guardar el DataFrame final en el CSV
    # index=False evita que Pandas escriba el índice del DataFrame como una columna en el CSV
    df_final.to_csv(nombre_archivo_csv, index=False)
    print(f"Datos guardados correctamente en '{nombre_archivo_csv}'.")

except Exception as e:
    print(f"\n❌ Ha ocurrido un error durante la ejecución de Selenium: {e}")
finally:
    # 8. Asegurarse de cerrar el navegador al finalizar, incluso si hay errores
    if driver:
        driver.quit()
        print("Navegador cerrado.")