let chart;
let tendenciaActiva = false;
let clickCount = 0;

// Inicializar gráfico
function initChart() {
  const container = document.getElementById('chart-container');
  if (chart) chart.dispose();
  chart = echarts.init(container);
}

// Cargar CSV genérico
async function cargarCSV(ruta) {
  const resp = await fetch(ruta);
  const texto = await resp.text();
  return texto.trim().split('\n').slice(1).map(linea => linea.split(','));
}

// Renderizar velas japonesas en USD
async function renderCandles(ruta, label) {
  initChart();

  const precios = await cargarCSV(ruta);
  const tasas = await cargarCSV('archivos/bolivar.csv');
  const mapaTasas = {};
  tasas.forEach(([date, open, high, low, close]) => {
    mapaTasas[date] = parseFloat(close);
  });

  const fechas = [];
  const valores = [];
  window.currentData = [];

  precios.forEach(([date, open, high, low, close]) => {
    const tasa = mapaTasas[date];
    if (!tasa) return;

    fechas.push(date);
    valores.push([
      parseFloat(open) / tasa,
      parseFloat(close) / tasa,
      parseFloat(low) / tasa,
      parseFloat(high) / tasa
    ]);

    window.currentData.push({
      Date: date,
      Open: parseFloat(open) / tasa,
      High: parseFloat(high) / tasa,
      Low: parseFloat(low) / tasa,
      Close: parseFloat(close) / tasa
    });
  });

  const option = {
    title: { text: label + " (USD)", left: 'center', textStyle: { color: '#fff' } },
    backgroundColor: '#000',
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        const data = params[0].data;
        const fecha = params[0].axisValue;
        const cierre = data[1];
        return fecha + '<br/>USD: ' + cierre.toFixed(2);
      }
    },
    xAxis: {
      type: 'category',
      data: fechas,
      axisLine: { lineStyle: { color: '#fff' } },
    },
    yAxis: {
      scale: true,
      axisLine: { lineStyle: { color: '#fff' } },
    },
    series: [{
      type: 'candlestick',
      data: valores,
      itemStyle: {
        color: '#00ff00',
        color0: '#ff0000',
        borderColor: '#00ff00',
        borderColor0: '#ff0000'
      }
    }],
    dataZoom: [
      { type: 'inside', xAxisIndex: [0], start: 0, end: 100 },
      { type: 'slider', xAxisIndex: [0], start: 0, end: 100 }
    ]
  };

  chart.setOption(option);

  // Escuchar clics en velas SOLO si está activo el modo tendencia
  chart.on('click', function (params) {
    if (!tendenciaActiva) return;
    if (params.seriesType !== 'candlestick') return;

    const fecha = params.name;
    const valores = params.data;
    const precioCierre = valores[1]; // Close

    const spans = document.querySelectorAll('.pivote-control span');

    if (clickCount < 2) {
      spans[clickCount].textContent = `${fecha} → USD ${precioCierre.toFixed(2)}`;
      clickCount++;
    }

    if (clickCount === 2) {
      tendenciaActiva = false;
      alert("Dos puntos guardados, listos para dibujar la línea");
    }
  });
}

// Eventos de los botones
document.addEventListener('DOMContentLoaded', () => {
  renderCandles('archivos/bdv.csv', 'Banco de Venezuela');

  document.querySelectorAll('.right-panel button').forEach(btn => {
    btn.addEventListener('click', () => {
      const ruta = btn.getAttribute('data-path');
      const label = btn.getAttribute('data-label');
      if (!ruta) return;
      renderCandles(ruta, label);
    });
  });

  // Activar modo tendencia
  document.getElementById('btn-tendencia').addEventListener('click', () => {
    tendenciaActiva = true;
    clickCount = 0;
    const spans = document.querySelectorAll('.pivote-control span');
    spans.forEach(s => s.textContent = "");
    alert("Haz clic en dos velas para guardar los precios");
  });

  // Agregar línea de tendencia
  // Agregar línea de tendencia
document.getElementById('agregar linea').addEventListener('click', () => {
  const spans = document.querySelectorAll('.pivote-control span');
  if (!spans[0].textContent || !spans[1].textContent) {
    alert("Primero selecciona dos velas con el botón 'Líneas de Tendencia'");
    return;
  }

  const punto1 = spans[0].textContent.split("→ USD ");
  const punto2 = spans[1].textContent.split("→ USD ");

  const fecha1 = punto1[0].trim();
  const precio1 = parseFloat(punto1[1]);
  const fecha2 = punto2[0].trim();
  const precio2 = parseFloat(punto2[1]);

  // Determinar color según dirección
  let colorLinea = (precio1 > precio2) ?  '#ff0000':'#00ff00';

  // Obtener las series actuales y agregar la nueva línea
  const option = chart.getOption();
  const nuevasSeries = option.series.slice();

  nuevasSeries.push({
    type: 'line',
    data: [
      [fecha1, precio1],
      [fecha2, precio2]
    ],
    lineStyle: { color: colorLinea, width: 2 },
    symbol: 'circle',
    symbolSize: 8,
    itemStyle: { color: colorLinea },
    xAxisIndex: 0,
    yAxisIndex: 0
  });

  chart.setOption({ series: nuevasSeries });
});

let reglaActiva = false;
let reglaClicks = 0;



document.getElementById('btn-regla').addEventListener('click', () => {
  reglaActiva = true;
  reglaClicks = 0;
  const spans = document.querySelectorAll('.pivote-control4 span');
  spans.forEach(s => s.textContent = "");
  alert("Haz clic en dos velas para dibujar el rectángulo con porcentaje animado");
});


let tendenciaActiva = false;
let tendenciaClicks = 0;
let puntosTendencia = [];

window.mostrarTendencia = function () {
  const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!chart) {
    console.error("❌ Tendencia: no hay gráfico activo.");
    return;
  }

  // Resetear estados
  tendenciaActiva = false;
  tendenciaClicks = 0;
  puntosTendencia = [];

  chart.off('click'); // limpiar eventos previos

  document.getElementById('btn-lineas').onclick = () => {
    if (tendenciaActiva) {
      // 🔴 Si estaba activa → limpiar todas las líneas
      const option = chart.getOption();
      const series = option.series.filter(s => s.type === 'candlestick');
      chart.setOption({ series }, { replaceMerge: ['series'] });
      tendenciaActiva = false;
      tendenciaClicks = 0;
      puntosTendencia = [];
      console.log("🧹 Tendencia desactivada. Todas las líneas borradas.");
    } else {
      // 🟢 Activar tendencia
      tendenciaActiva = true;
      tendenciaClicks = 0;
      puntosTendencia = [];
      console.log("✅ Tendencia activada. Haz dos clics en velas.");
    }
  };

  chart.on('click', function (params) {
    if (!tendenciaActiva) return;
    if (params.seriesType !== 'candlestick') return;

    const fecha = params.name;
    const precioCierre = params.data[1];

    puntosTendencia.push({ fecha, precio: precioCierre });
    tendenciaClicks++;
    console.log(`📌 Click ${tendenciaClicks}: ${fecha} → USD ${precioCierre}`);

    // Cada dos clics → dibujar línea
    if (tendenciaClicks % 2 === 0) {
      const p1 = puntosTendencia[tendenciaClicks - 2];
      const p2 = puntosTendencia[tendenciaClicks - 1];

      const colorLinea = p1.precio < p2.precio ? '#00ff00' : '#ff0000';
      const grosor = 3; // 👈 puedes modificar el grosor aquí

      const option = chart.getOption();
      const nuevasSeries = option.series.slice();

      nuevasSeries.push({
        type: 'line',
        data: [[p1.fecha, p1.precio], [p2.fecha, p2.precio]],
        lineStyle: { color: colorLinea, width: grosor },
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: colorLinea },
        yAxisIndex: 0,
        label: {
          show: true,
          position: 'middle',
          formatter: "Tendencia",
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 20
        }
      });

      chart.setOption({ series: nuevasSeries }, { replaceMerge: ['series'] });
      console.log(`📈 Se dibujó línea de tendencia entre ${p1.fecha} (${p1.precio}) y ${p2.fecha} (${p2.precio})`);
    }
  });
};







});

