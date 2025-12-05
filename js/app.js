// -------------------- INICIALIZAR GRÁFICO --------------------
const chartDom = document.getElementById('chart-container');
const myChart = echarts.init(chartDom);

let fechas = [];
let valores = [];

// Estado de líneas de tendencia


// Configuración base inicial
const option = {
  title: { text: 'bdv/ves', left: 'center' },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: [], scale: true, boundaryGap: false },
  yAxis: { scale: true },
  series: [{ id: 'candlestick', type: 'candlestick', name: 'BDV', data: [] }],
  dataZoom: [
    { type: 'inside', minValueSpan: 5 },
    { type: 'slider', minValueSpan: 5 }
  ]
};
myChart.setOption(option);

// -------------------- FUNCIONES --------------------

// Cargar CSV y actualizar gráfico
function cargarCSV(ruta, label) {
  fetch(ruta)
    .then(res => res.text())
    .then(texto => {
      const filas = texto.trim().split("\n");
      filas.shift(); // quitar cabecera
      fechas = [];
      valores = [];
      filas.forEach(linea => {
        const [Date,Open,High,Low,Close] = linea.split(",");
        fechas.push(Date);
        valores.push([+Open, +Close, +Low, +High]);
      });

      // Usamos cargarGrafica para limpiar y actualizar
      cargarGrafica(label, { fechas, velas: valores });

      console.log(`✅ Gráfico actualizado: ${label} desde ${ruta}`);
    })
    .catch(err => console.error("Error cargando CSV:", err));
}

// Cargar gráfica limpia (borra líneas de tendencia viejas)
function cargarGrafica(activo, data) {
  const option = {
    title: { text: `${activo}/USD`, left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.fechas, scale: true, boundaryGap: false },
    yAxis: { scale: true },
    series: [
      {
        id: 'candlestick',
        type: 'candlestick',
        name: activo,
        data: data.velas
      }
    ],
    dataZoom: [
      { type: 'inside', minValueSpan: 5 },
      { type: 'slider', minValueSpan: 5 }
    ]
  };

  // true = reemplaza todo, borra líneas viejas
  myChart.setOption(option, true);

  // Resetear estado de tendencia
  tendenciaClicks = [];
  modoTendencia = false;

  mostrarMensaje(`Gráfica cargada: ${activo}. Líneas de tendencia borradas.`);
}

// Actualizar gráfico con rango filtrado
function actualizarGrafico(fechasFiltradas, valoresFiltrados) {
  myChart.setOption({
    xAxis: { data: fechasFiltradas },
    series: [{ id: 'candlestick', data: valoresFiltrados }]
  });
}

// Filtrar por rango temporal
function filtrarRango(meses) {
  const ahora = new Date(fechas[fechas.length - 1]); // última fecha
  const limite = new Date(ahora);
  limite.setMonth(limite.getMonth() - meses);

  const fechasFiltradas = [];
  const valoresFiltrados = [];

  fechas.forEach((f, i) => {
    const fecha = new Date(f);
    if (fecha >= limite) {
      fechasFiltradas.push(f);
      valoresFiltrados.push(valores[i]);
    }
  });

  actualizarGrafico(fechasFiltradas, valoresFiltrados);

  mostrarMensaje(`Mostrando últimos ${meses} meses (${fechasFiltradas.length} velas)`);
}



// -------------------- EVENTOS --------------------

// Botones de rango temporal
document.getElementById("1m").onclick = () => filtrarRango(1);
document.getElementById("3m").onclick = () => filtrarRango(3);
document.getElementById("6m").onclick = () => filtrarRango(6);
document.getElementById("1a").onclick = () => filtrarRango(12);
document.getElementById("2a").onclick = () => filtrarRango(24);

// Botones de criptomonedas
document.querySelectorAll("ul li button").forEach(btn => {
  btn.addEventListener("click", () => {
    const ruta = "archivos/" + btn.dataset.path;
    const label = btn.dataset.label;
    cargarCSV(ruta, label);
  });
});

// -------------------- CARGA INICIAL --------------------
cargarCSV("archivos/bdv.csv", "bdv");


// -------------------- MENSAJES --------------------
function mostrarMensaje(texto) {
  document.getElementById("mensaje").innerText = texto;
}
