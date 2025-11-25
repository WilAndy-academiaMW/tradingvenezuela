let chart;

// Cargar CSV genérico
async function cargarCSV(ruta) {
  const resp = await fetch(ruta);
  const texto = await resp.text();
  return texto.trim().split('\n').slice(1).map(linea => linea.split(','));
}

// Renderizar velas japonesas en USD
async function renderCandles(ruta, label) {
  // 1) Cargar precios del activo en Bs
  const precios = await cargarCSV(ruta);

  // 2) Cargar tasas de cambio desde bolivar.csv
  const tasas = await cargarCSV('archivos/bolivar.csv');
  const mapaTasas = {};
  tasas.forEach(([date, open, high, low, close]) => {
    mapaTasas[date] = parseFloat(close); // usamos Precio_Cierre como tasa
  });

  // 3) Convertir cada precio usando la tasa de ese día
  const valores = [];
  window.currentData = []; // guardar datos para indicadores

  precios.forEach(([date, open, high, low, close]) => {
    const tasa = mapaTasas[date];
    if (!tasa) return;

    const fecha = new Date(date).getTime(); // Highcharts usa timestamp en ms
    const o = parseFloat(open) / tasa;
    const h = parseFloat(high) / tasa;
    const l = parseFloat(low) / tasa;
    const c = parseFloat(close) / tasa;

    valores.push([fecha, o, h, l, c]);

    window.currentData.push({ Date: date, Open: o, High: h, Low: l, Close: c });
  });

  // 4) Crear gráfico con Highcharts
  chart = Highcharts.stockChart('chart-container', {
    chart: { backgroundColor: '#000' },
    title: { text: label + ' (USD)', style: { color: '#fff' } },
    rangeSelector: { selected: 1 },
    xAxis: { labels: { style: { color: '#fff' } } },
    yAxis: { labels: { style: { color: '#fff' } }, gridLineColor: '#333' },
    tooltip: {
      split: false,
      formatter: function () {
        const point = this.point; // ✅ usar this.point en vez de this.points[0]
        return Highcharts.dateFormat('%Y-%m-%d', point.x) +
          '<br/>Open: ' + point.open.toFixed(2) +
          '<br/>High: ' + point.high.toFixed(2) +
          '<br/>Low: ' + point.low.toFixed(2) +
          '<br/>Close: ' + point.close.toFixed(2);
      }
    },
    series: [{
      type: 'candlestick',
      name: label,
      data: valores,
      color: '#ff0000',      // velas bajistas
      upColor: '#00ff00',    // velas alcistas
      lineColor: '#ff0000',
      upLineColor: '#00ff00'
    }]
  });
}

// Función para dibujar un cuadrado
function activarDibujo() {
  if (!chart) return;

  chart.addAnnotation({
    draggable: 'xy', // permite mover/redimensionar con el mouse
    shapes: [{
      type: 'rect',
      point: { xAxis: 0, yAxis: 0, x: Date.UTC(2023,10,21), y: 100 },
      width: 24 * 3600 * 1000 * 2, // ancho en milisegundos (2 días)
      height: 5,                   // altura en unidades del eje Y
      fill: 'rgba(0,255,0,0.3)',
      stroke: 'green'
    }]
  });
}

// Inicializar con un activo por defecto y botones
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
});

// 👉 Función para dibujar una línea
function activarLinea() {
  if (!chart) return;

  chart.addAnnotation({
    draggable: 'xy', // permite mover y redimensionar con el mouse
    shapes: [{
      type: 'path',   // usamos "path" para una línea
      points: [
        { xAxis: 0, yAxis: 0, x: Date.UTC(2023,10,21), y: 100 },
        { xAxis: 0, yAxis: 0, x: Date.UTC(2023,10,23), y: 110 }
      ],
      stroke: 'yellow',
      strokeWidth: 2
    }]
  });
}
