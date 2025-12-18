// --- Elementos HTML ---
var precioves = document.getElementById("precio-bs");
var preciousd = document.getElementById("precio-usd");
var graficaVolumen = document.getElementById("grafica-volumen");
var graficaEfectivoBs = document.getElementById("grafica-efectivo-bs");
var graficaEfectivoUsd = document.getElementById("grafica-efectivo-usd");

// --- Archivos CSV ---
const ultimoprecio_filename = "bdvc/Último_precio_Bs.csv"; 
const usd_ves_filename = "bdvc/tasa_dolar_bcv.csv"; 
const contratos = "bdvc/Títulos_negociados.csv";
const variacion = "bdvc/Variación.csv";
const efectivo = "bdvc/Monto_efectivo_Bs.csv";
const capitalizacion = "bdvc/titulosTotal.csv";



// --- Variables globales ---
let datos_precios_bs = null; 
let tasa_usd_bcv = null; 
let contratosN = null; 
let datosVariacion = null;
let datosEfectivo = null;

let chartVolumen = null;
let chartEfectivoBs = null;
let chartEfectivoUsd = null;

// --- Función genérica para cargar CSV ---
async function cargarCSV(filename) {
    const response = await fetch(filename);
    const csvText = await response.text();
    return csvText.trim().split('\n').map(row => row.split(','));
}

// --- Función para mostrar precios ---
function mostrarPrecios(colIndex) {
    const ultimaFila = datos_precios_bs[datos_precios_bs.length - 1];
    const valorBs = parseFloat(ultimaFila[colIndex]);
    const valorUsd = valorBs / tasa_usd_bcv;

    precioves.innerHTML = valorBs.toLocaleString('es-VE', { minimumFractionDigits: 2 }) + " Bs";
    preciousd.innerHTML = valorUsd.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

// --- Función para graficar volumen ---
function graficarVolumen(volumenColIndex, titulo) {
    const fechas = contratosN.slice(1).map(row => row[0]);
    const volumenes = contratosN.slice(1).map(row => parseFloat(row[volumenColIndex]));
    const variaciones = datosVariacion.slice(1).map(row => parseFloat(row[1]));

    const colores = variaciones.map(v => v >= 0 ? 'rgba(0,200,0,0.7)' : 'rgba(200,0,0,0.7)');
    const ctx = graficaVolumen.getContext('2d');
    if (chartVolumen) chartVolumen.destroy();

    chartVolumen = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: fechas,
            datasets: [{
                label: titulo,
                data: volumenes,
                backgroundColor: colores
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: `${titulo} vs Variación` }
            }
        }
    });
}

// --- Función para graficar efectivo en Bs ---
function graficarEfectivoBs(colIndex) {
    const fechas = datosEfectivo.slice(1).map(row => row[0]);
    const valoresBs = datosEfectivo.slice(1).map(row => parseFloat(row[colIndex]));
    const variaciones = datosVariacion.slice(1).map(row => parseFloat(row[1]));

    const colores = variaciones.map(v => v >= 0 ? 'rgba(0,200,0,0.7)' : 'rgba(200,0,0,0.7)');
    const ctx = graficaEfectivoBs.getContext('2d');
    if (chartEfectivoBs) chartEfectivoBs.destroy();

    chartEfectivoBs = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: fechas,
            datasets: [{
                label: 'Monto efectivo (Bs)',
                data: valoresBs,
                backgroundColor: colores
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Efectivo en Bs vs Variación' }
            }
        }
    });
}

// --- Función para graficar efectivo en USD ---
function graficarEfectivoUsd(colIndex) {
    const fechas = datosEfectivo.slice(1).map(row => row[0]);
    const valoresBs = datosEfectivo.slice(1).map(row => parseFloat(row[colIndex]));
    const variaciones = datosVariacion.slice(1).map(row => parseFloat(row[1]));

    const valoresUsd = valoresBs.map(v => v / tasa_usd_bcv);
    const colores = variaciones.map(v => v >= 0 ? 'rgba(0,200,0,0.7)' : 'rgba(200,0,0,0.7)');
    const ctx = graficaEfectivoUsd.getContext('2d');
    if (chartEfectivoUsd) chartEfectivoUsd.destroy();

    chartEfectivoUsd = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: fechas,
            datasets: [{
                label: 'Monto efectivo (USD)',
                data: valoresUsd,
                backgroundColor: colores
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Efectivo en USD vs Variación' }
            }
        }
    });
}
function mostrarCapitalizacion(colIndex) {
    // Última fila de precios
    const ultimaFilaPrecios = datos_precios_bs[datos_precios_bs.length - 1];
    const precioBs = parseFloat(ultimaFilaPrecios[colIndex]);

    // Acciones circulantes (una sola fila en titulosTotal.csv)
    const filaAcciones = datos_acciones[1] || datos_acciones[0];
    const acciones = parseFloat(filaAcciones[colIndex - 1]); // -1 porque precios tiene columna Fecha

    // Calcular capitalización
    const totalBs = precioBs * acciones;
    const totalUsd = totalBs / tasa_usd_bcv;

    // Mostrar en HTML
    document.getElementById("Capitalización-bs").innerHTML =
        totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 }) + " Bs";
    document.getElementById("Capitalización-usd").innerHTML =
        totalUsd.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}



// --- Inicialización ---
async function inicializarApp() {
    // Cargar CSVs
    datos_precios_bs = await cargarCSV(ultimoprecio_filename);
    const datos_usd = await cargarCSV(usd_ves_filename);
    contratosN = await cargarCSV(contratos);
    datosVariacion = await cargarCSV(variacion);
    datosEfectivo = await cargarCSV(efectivo);
    datos_acciones = await cargarCSV(capitalizacion);


    // Extraer tasa USD BCV
    const ultima_tasa_usd_fila = datos_usd[datos_usd.length - 1]; 
    tasa_usd_bcv = parseFloat(ultima_tasa_usd_fila[1]);

    // --- Mostrar por defecto BDV ---
    mostrarPrecios(1);                 // Precio BDV
    graficarVolumen(1, "Volumen BDV"); // Volumen BDV
    graficarEfectivoBs(1);             // Efectivo BDV en Bs
    graficarEfectivoUsd(1);    
     mostrarCapitalizacion(1);        // Efectivo BDV en USD

    // --- Botones de acciones ---

    document.getElementById("btn-caribe").addEventListener('click', () => {
        mostrarPrecios(1);
        graficarVolumen(1, "Volumen caribe");
        graficarEfectivoBs(1);
        graficarEfectivoUsd(1);
        mostrarCapitalizacion(1);  
    });
    document.getElementById("btn-arca").addEventListener('click', () => {
        mostrarPrecios(2);
        graficarVolumen(2, "Volumen arca");
        graficarEfectivoBs(2);
        graficarEfectivoUsd(2);
        mostrarCapitalizacion(2);  
    });
    document.getElementById("btn-bnc").addEventListener('click', () => {
        mostrarPrecios(3);
        graficarVolumen(3, "Volumen BNC");
        graficarEfectivoBs(3);
        graficarEfectivoUsd(3);
        mostrarCapitalizacion(3);  
    });
     
    document.getElementById("btn-provincial").addEventListener('click', () => {
        mostrarPrecios(4);
        graficarVolumen(4, "Volumen Provincial");
        graficarEfectivoBs(4);
        graficarEfectivoUsd(4);
        mostrarCapitalizacion(4);
    });
    document.getElementById("btn-bdvc").addEventListener('click', () => {
        mostrarPrecios(5);
        graficarVolumen(5, "Volumen BNC");
        graficarEfectivoBs(5);
        graficarEfectivoUsd(5);
         mostrarCapitalizacion(5);
    });
    document.getElementById("btn-bdv").addEventListener('click', () => {
        mostrarPrecios(6);
        graficarVolumen(6, "Volumen BDV");
        graficarEfectivoBs(6);
        graficarEfectivoUsd(6);
        mostrarCapitalizacion(6);
    });
    document.getElementById("btn-C.CAPITAL B").addEventListener('click', () => {
        mostrarPrecios(7);
        graficarVolumen(7, "Volumen C.CAPITAL B");
        graficarEfectivoBs(7);
        graficarEfectivoUsd(7);
        mostrarCapitalizacion(7);
    });
    document.getElementById("btn-ceramica").addEventListener('click', () => {
        mostrarPrecios(8);
        graficarVolumen(8, "Volumen ceramica carabobo");
        graficarEfectivoBs(8);
        graficarEfectivoUsd(8);
         mostrarCapitalizacion(8);
    });
      document.getElementById("btn-grupoQuimico").addEventListener('click', () => {
        mostrarPrecios(9);
        graficarVolumen(9, "Volumen grupo zuleano");
        graficarEfectivoBs(9);
        graficarEfectivoUsd(9);
        mostrarCapitalizacion(9);
    });
    document.getElementById("btn-corimon").addEventListener('click', () => {
        mostrarPrecios(10);
        graficarVolumen(10, "Volumen corimon");
        graficarEfectivoBs(10);
        graficarEfectivoUsd(10);
        mostrarCapitalizacion(10);
    });
   
    document.getElementById("btn-DOMINGUEZ & CIA").addEventListener('click', () => {
        mostrarPrecios(11);
        graficarVolumen(11, " DOMINGUEZ & CIA");
        graficarEfectivoBs(11);
        graficarEfectivoUsd(11);
        mostrarCapitalizacion(11);
    });
     document.getElementById("btn-efe").addEventListener('click', () => {
        mostrarPrecios(12);
        graficarVolumen(12, "Volumen efe");
        graficarEfectivoBs(12);
        graficarEfectivoUsd(12);
        mostrarCapitalizacion(12);
    });

      document.getElementById("btn-envase").addEventListener('click', () => {
        mostrarPrecios(13);
        graficarVolumen(13, "Envases Venezolano");
        graficarEfectivoBs(13);
        graficarEfectivoUsd(13);
        mostrarCapitalizacion(13);
    });
     document.getElementById("btn-cemento").addEventListener('click', () => {
        mostrarPrecios(14);
        graficarVolumen(14, "Volumen mercantil");
        graficarEfectivoBs(14);
        graficarEfectivoUsd(14);
        mostrarCapitalizacion(14);
    });
     document.getElementById("btn-GRUPO MANTRA").addEventListener('click', () => {
        mostrarPrecios(15);
        graficarVolumen(15, "Volumen GRUPO MANTRA");
        graficarEfectivoBs(15);
        graficarEfectivoUsd(15);
        mostrarCapitalizacion(15);
    });
   document.getElementById("btn-grupoZ").addEventListener('click', () => {
        mostrarPrecios(16);
        graficarVolumen(16, "Volumen grupo zuleano");
        graficarEfectivoBs(16);
        graficarEfectivoUsd(16);
        mostrarCapitalizacion(16);
        
    });
     document.getElementById("btn-CRECEPYMES").addEventListener('click', () => {
        mostrarPrecios(17);
        graficarVolumen(17, "Volumen CRECEPYMES");
        graficarEfectivoBs(17);
        graficarEfectivoUsd(17);
        mostrarCapitalizacion(17);
    });
     document.getElementById("btn-impulsa").addEventListener('click', () => {
        mostrarPrecios(18);
        graficarVolumen(18, "Volumen CRECEPYMES");
        graficarEfectivoBs(18);
        graficarEfectivoUsd(18);
        mostrarCapitalizacion(18);
    });
      document.getElementById("btn-invanca").addEventListener('click', () => {
        mostrarPrecios(19);
        graficarVolumen(19, "Volumen invanca");
        graficarEfectivoBs(19);
        graficarEfectivoUsd(19);
        mostrarCapitalizacion(18);
        
    });
    document.getElementById("btn-invancab").addEventListener('click', () => {
        mostrarPrecios(20);
        graficarVolumen(20, "Volumen invanca");
        graficarEfectivoBs(20);
        graficarEfectivoUsd(20);
        mostrarCapitalizacion(20);
        
    });
     document.getElementById("btn-manpa").addEventListener('click', () => {
        mostrarPrecios(21);
        graficarVolumen(21, "Volumen Manpa");
        graficarEfectivoBs(21);
        graficarEfectivoUsd(21);
        mostrarCapitalizacion(21);
    });
     document.getElementById("btn-montesco").addEventListener('click', () => {
        mostrarPrecios(22);
        graficarVolumen(22, "Volumen montesco");
        graficarEfectivoBs(22);
        graficarEfectivoUsd(22);
        mostrarCapitalizacion(22);
    });
     document.getElementById("btn-mercantil").addEventListener('click', () => {
        mostrarPrecios(24);
        graficarVolumen(24, "Volumen mercantil");
        graficarEfectivoBs(24);
        graficarEfectivoUsd(24);
        mostrarCapitalizacion(24);
    });
     document.getElementById("btn-petrolea").addEventListener('click', () => {
        mostrarPrecios(25);
        graficarVolumen(25, "Volumen petrolea");
        graficarEfectivoBs(25);
        graficarEfectivoUsd(25);
        mostrarCapitalizacion(25);
    });
      document.getElementById("btn-proagro").addEventListener('click', () => {
        mostrarPrecios(26);
        graficarVolumen(26, "Volumen proagro");
        graficarEfectivoBs(26);
        graficarEfectivoUsd(26);
        mostrarCapitalizacion(26);
    });
    document.getElementById("btn-protinal").addEventListener('click', () => {
        mostrarPrecios(28);
        graficarVolumen(28, "Volumen protinal");
        graficarEfectivoBs(28);
        graficarEfectivoUsd(28);
        mostrarCapitalizacion(28);
    });
    
       document.getElementById("btn-ron").addEventListener('click', () => {
        mostrarPrecios(30);
        graficarVolumen(30, "Volumen ron");
        graficarEfectivoBs(30);
        graficarEfectivoUsd(30);
        mostrarCapitalizacion(30);
    });
     document.getElementById("btn-ron2").addEventListener('click', () => {
        mostrarPrecios(31);
        graficarVolumen(31, "Volumen ron");
        graficarEfectivoBs(31);
        graficarEfectivoUsd(31);
        mostrarCapitalizacion(31);
    });
     document.getElementById("btn-sinvesa").addEventListener('click', () => {
        mostrarPrecios(32);
        graficarVolumen(32, "Volumen ron");
        graficarEfectivoBs(32);
        graficarEfectivoUsd(32);
        mostrarCapitalizacion(32);
    });
     document.getElementById("btn-cantv").addEventListener('click', () => {
        mostrarPrecios(33);
        graficarVolumen(33, "Volumen ron");
        graficarEfectivoBs(33);
        graficarEfectivoUsd(33);
        mostrarCapitalizacion(33);
    });
     document.getElementById("btn-telares").addEventListener('click', () => {
        mostrarPrecios(34);
        graficarVolumen(34, "Volumen telares palos grandes");
        graficarEfectivoBs(34);
        graficarEfectivoUsd(34);
        mostrarCapitalizacion(34);
    });
}


inicializarApp();
