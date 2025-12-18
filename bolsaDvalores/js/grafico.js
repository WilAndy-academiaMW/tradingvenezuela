// -------------------- INICIALIZAR GRÁFICO --------------------
const chartDom = document.getElementById('chart-container');
const myChart = echarts.init(chartDom);

let fechas = [];
let valores = [];
let tasasCambio = []; // precio del bolívar en USD

// -------------------- FUNCIONES --------------------

// Cargar CSV de tasas de cambio (bolívar/USD)
function cargarTasasCambio(ruta = "bolsaDvalores/archivos/bolivar.csv") {
  return fetch(ruta)
    .then(res => res.text())
    .then(texto => {
      const filas = texto.trim().split("\n");
      filas.shift(); // quitar cabecera
      tasasCambio = filas.map(linea => {
        const [Date,Rate] = linea.split(",");
        return { fecha: Date, rate: parseFloat(Rate) };
      });
    })
    .catch(err => console.error("Error cargando tasas:", err));
}

// Cargar CSV de activo y actualizar gráfico en USD
// Cargar CSV de activo y actualizar gráfico en USD
async function cargarCSV(ruta, label) {
  // primero cargamos tasas de cambio si aún no están
  if (tasasCambio.length === 0) {
    await cargarTasasCambio();
  }

  fetch(ruta)
    .then(res => res.text())
    .then(texto => {
      const filas = texto.trim().split("\n");
      filas.shift(); // quitar cabecera
      fechas = [];
      valores = [];

      filas.forEach(linea => {
        const [Date,Open,High,Low,Close] = linea.split(",");

        // buscar tasa de cambio para esa fecha
        const tasaObj = tasasCambio.find(t => t.fecha === Date);

        // si no hay tasa, ignoramos esa fila
        if (!tasaObj) return;

        const tasa = tasaObj.rate;

        // convertir a USD
        const openUSD  = (+Open) / tasa;
        const highUSD  = (+High) / tasa;
        const lowUSD   = (+Low)  / tasa;
        const closeUSD = (+Close)/ tasa;

        fechas.push(Date);
        valores.push([openUSD, closeUSD, lowUSD, highUSD]);
      });

      // actualizar gráfica
      cargarGrafica(label, { fechas, velas: valores });

      console.log(`✅ Gráfico actualizado en USD: ${label} desde ${ruta}`);
    })
    .catch(err => console.error("Error cargando CSV:", err));
}

// Cargar gráfica limpia
// Cargar gráfica limpia
function cargarGrafica(activo, data) {
  const option = {
    title: { text: `${activo}/USD`, left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { 
      type: 'category', 
      data: data.fechas, 
      scale: true, 
      boundaryGap: false 
    },
    yAxis: { scale: true },
    series: [
      {
        id: 'candlestick',
        type: 'candlestick',
        name: activo,
        data: data.velas,
        itemStyle: {
          // 🟢 verde para subida (close > open)
          color: '#00ff00',
          borderColor: '#00ff00',
          // 🔴 rojo para bajada (close < open)
          color0: '#ff0000',
          borderColor0: '#ff0000'
        }
      }
    ],
    dataZoom: [
      { type: 'inside', minValueSpan: 5 },
      { type: 'slider', minValueSpan: 5 }
    ]
  };

  myChart.setOption(option, true);

  tendenciaClicks = [];
  modoTendencia = false;

  mostrarMensaje(`Gráfica cargada en USD: ${activo}. Líneas de tendencia borradas.`);
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
  const ahora = new Date(fechas[fechas.length - 1]); // última fecha cargada
  const limite = new Date(ahora);
  limite.setMonth(limite.getMonth() - meses);

  const fechasFiltradas = [];
  const valoresFiltrados = [];

  fechas.forEach((f, i) => {
    const fecha = new Date(f);
    if (fecha >= limite) {
      fechasFiltradas.push(f);
      valoresFiltrados.push(valores[i]); // ya están en USD
    }
  });

  actualizarGrafico(fechasFiltradas, valoresFiltrados);

  mostrarMensaje(`Mostrando últimos ${meses} meses (${fechasFiltradas.length} velas) en USD`);
}

// -------------------- EVENTOS --------------------

// Botones de rango temporal
document.getElementById("1m").onclick = () => filtrarRango(1);
document.getElementById("3m").onclick = () => filtrarRango(3);
document.getElementById("6m").onclick = () => filtrarRango(6);
document.getElementById("1a").onclick = () => filtrarRango(12);
document.getElementById("2a").onclick = () => filtrarRango(24);
document.getElementById("3a").onclick = () => filtrarRango(36);

// Botones de criptomonedas
document.querySelectorAll("ul li button").forEach(btn => {
  btn.addEventListener("click", () => {
    const ruta = "bolsaDvalores/" + btn.dataset.path;
    const label = btn.dataset.label;
    cargarCSV(ruta, label);
  });
});

// -------------------- CARGA INICIAL --------------------
cargarCSV("bolsaDvalores/archivos/bdv.csv", "bdv");

// -------------------- MENSAJES --------------------
function mostrarMensaje(texto) {
  document.getElementById("mensaje").innerText = texto;
}
