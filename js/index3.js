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

// --- Inicialización ---
async function inicializarApp() {
    // Cargar CSVs
    datos_precios_bs = await cargarCSV(ultimoprecio_filename);
    const datos_usd = await cargarCSV(usd_ves_filename);
    contratosN = await cargarCSV(contratos);
    datosVariacion = await cargarCSV(variacion);
    datosEfectivo = await cargarCSV(efectivo);

    // Extraer tasa USD BCV
    const ultima_tasa_usd_fila = datos_usd[datos_usd.length - 1]; 
    tasa_usd_bcv = parseFloat(ultima_tasa_usd_fila[1]);

    // --- Mostrar por defecto BDV ---
    mostrarPrecios(6);                 // Precio BDV
    graficarVolumen(6, "Volumen BDV"); // Volumen BDV
    graficarEfectivoBs(6);             // Efectivo BDV en Bs
    graficarEfectivoUsd(6);            // Efectivo BDV en USD

    // --- Botones de acciones ---
    document.getElementById("btn-bdv").addEventListener('click', () => {
        mostrarPrecios(6);
        graficarVolumen(6, "Volumen BDV");
        graficarEfectivoBs(6);
        graficarEfectivoUsd(6);
    });

    document.getElementById("btn-bdvc").addEventListener('click', () => {
        mostrarPrecios(5);
        graficarVolumen(5, "Volumen BNC");
        graficarEfectivoBs(5);
        graficarEfectivoUsd(5);
    });

    document.getElementById("btn-bnc").addEventListener('click', () => {
        mostrarPrecios(3);
        graficarVolumen(3, "Volumen Provincial");
        graficarEfectivoBs(3);
        graficarEfectivoUsd(3);
    });

      document.getElementById("btn-provincial").addEventListener('click', () => {
        mostrarPrecios(4);
        graficarVolumen(4, "Volumen Provincial");
        graficarEfectivoBs(4);
        graficarEfectivoUsd(4);
    });
      document.getElementById("btn-envase").addEventListener('click', () => {
        mostrarPrecios(13);
        graficarVolumen(13, "Envases Venezolano");
        graficarEfectivoBs(13);
        graficarEfectivoUsd(13);
    });
      document.getElementById("btn-efe").addEventListener('click', () => {
        mostrarPrecios(12);
        graficarVolumen(12, "Volumen efe");
        graficarEfectivoBs(12);
        graficarEfectivoUsd(12);
    });
       document.getElementById("btn-ron").addEventListener('click', () => {
        mostrarPrecios(28);
        graficarVolumen(28, "Volumen ron");
        graficarEfectivoBs(28);
        graficarEfectivoUsd(28);
    });
     document.getElementById("btn-caribe").addEventListener('click', () => {
        mostrarPrecios(1);
        graficarVolumen(1, "Volumen caribe");
        graficarEfectivoBs(1);
        graficarEfectivoUsd(1);
    });
     document.getElementById("btn-invanca").addEventListener('click', () => {
        mostrarPrecios(18);
        graficarVolumen(1, "Volumen invanca");
        graficarEfectivoBs(1);
        graficarEfectivoUsd(1);
    });
      document.getElementById("btn-mercantil").addEventListener('click', () => {
        mostrarPrecios(23);
        graficarVolumen(23, "Volumen invanca");
        graficarEfectivoBs(23);
        graficarEfectivoUsd(23);
    });
     document.getElementById("btn-manpa").addEventListener('click', () => {
        mostrarPrecios(20);
        graficarVolumen(20, "Volumen Manpa");
        graficarEfectivoBs(20);
        graficarEfectivoUsd(20);
    });
      document.getElementById("btn-ceramica").addEventListener('click', () => {
        mostrarPrecios(8);
        graficarVolumen(8, "Volumen ceramica carabobo");
        graficarEfectivoBs(8);
        graficarEfectivoUsd(8);
    });
      document.getElementById("btn-protinal").addEventListener('click', () => {
        mostrarPrecios(27);
        graficarVolumen(27, "Volumen ceramica carabobo");
        graficarEfectivoBs(27);
        graficarEfectivoUsd(27);
    });
     document.getElementById("btn-proagro").addEventListener('click', () => {
        mostrarPrecios(25);
        graficarVolumen(25, "Volumen proagro");
        graficarEfectivoBs(25);
        graficarEfectivoUsd(25);
    });
     document.getElementById("btn-telares").addEventListener('click', () => {
        mostrarPrecios(32);
        graficarVolumen(25, "Volumen telares palos grandes");
        graficarEfectivoBs(25);
        graficarEfectivoUsd(25);
    });
}


inicializarApp();
