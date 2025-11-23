let chart;

// Inicializar gráfico ECharts
function initChart() {
  const container = document.getElementById('chart-container');
  if (chart) {
    chart.dispose(); // destruir gráfico anterior COMPLETAMENTE
  }
  chart = echarts.init(container);
}

// Parsear CSV a formato ECharts
async function cargarCSV(ruta) {
  const resp = await fetch(ruta);
  const texto = await resp.text();
  const filas = texto.trim().split('\n').slice(1);

  const fechas = [];
  const valores = [];

  filas.forEach(linea => {
    const [date, open, high, low, close] = linea.split(',');
    fechas.push(date);
    valores.push([parseFloat(open), parseFloat(close), parseFloat(low), parseFloat(high)]);
    // ECharts espera [open, close, low, high]
  });

  // Guardar datos globales para otras funciones
  window.currentData = filas.map(linea => {
    const [date, open, high, low, close] = linea.split(',');
    return {
      Date: date,
      Open: parseFloat(open),
      High: parseFloat(high),
      Low: parseFloat(low),
      Close: parseFloat(close)
    };
  });

  return { fechas, valores };
}

// Renderizar velas japonesas
async function renderCandles(ruta, label) {
  initChart(); // siempre limpia antes de crear
  const { fechas, valores } = await cargarCSV(ruta);

  const option = {
    title: { text: label, left: 'center', textStyle: { color: '#fff' } },
    backgroundColor: '#000',
    tooltip: { trigger: 'axis' },
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
        color: '#00ff00',       // subida
        color0: '#ff0000',      // bajada
        borderColor: '#00ff00',
        borderColor0: '#ff0000'
      }
    }]
  };

  chart.setOption(option);
}

// Función: Líneas de tendencia automáticas
window.trazarLineasTendencia = function () {
  if (!chart || !window.currentData || window.currentData.length < 20) {
    console.error("No existe el gráfico o no hay suficientes datos cargados");
    return;
  }

  console.log("Datos cargados:", window.currentData.length);

  const closes = window.currentData.map(d => d.Close);

  let minimos = [], maximos = [];
  for (let i = 1; i < closes.length - 1; i++) {
    if (closes[i] < closes[i - 1] && closes[i] < closes[i + 1]) {
      minimos.push({ index: i, value: closes[i] });
      console.log("Mínimo detectado:", window.currentData[i].Date, closes[i]);
    }
    if (closes[i] > closes[i - 1] && closes[i] > closes[i + 1]) {
      maximos.push({ index: i, value: closes[i] });
      console.log("Máximo detectado:", window.currentData[i].Date, closes[i]);
    }
  }

  // Línea alcista (mínimos)
  if (minimos.length >= 2) {
    const p1 = minimos[minimos.length - 2];
    const p2 = minimos[minimos.length - 1];
    console.log("Trazando línea alcista entre:", window.currentData[p1.index].Date, p1.value, "y", window.currentData[p2.index].Date, p2.value);

    chart.setOption({
      series: [
        ...chart.getOption().series,
        {
          name: "Tendencia Alcista",
          type: "line",
          data: [
            [window.currentData[p1.index].Date, p1.value],
            [window.currentData[p2.index].Date, p2.value]
          ],
          lineStyle: { color: "green", width: 2, type: "dashed" },
          showSymbol: false,
          yAxisIndex: 0
        }
      ]
    });
  } else {
    console.warn("No se encontraron suficientes mínimos para trazar línea alcista");
  }

  // Línea bajista (máximos)
  if (maximos.length >= 2) {
    const p1 = maximos[maximos.length - 2];
    const p2 = maximos[maximos.length - 1];
    console.log("Trazando línea bajista entre:", window.currentData[p1.index].Date, p1.value, "y", window.currentData[p2.index].Date, p2.value);

    chart.setOption({
      series: [
        ...chart.getOption().series,
        {
          name: "Tendencia Bajista",
          type: "line",
          data: [
            [window.currentData[p1.index].Date, p1.value],
            [window.currentData[p2.index].Date, p2.value]
          ],
          lineStyle: { color: "red", width: 2, type: "dashed" },
          showSymbol: false,
          yAxisIndex: 0
        }
      ]
    });
  } else {
    console.warn("No se encontraron suficientes máximos para trazar línea bajista");
  }
};

// Eventos
document.addEventListener('DOMContentLoaded', () => {
  // Render por defecto
  renderCandles('archivos/bdv.csv', 'Banco de Venezuela');

  // Botones de panel derecho
  document.querySelectorAll('.right-panel button').forEach(btn => {
    btn.addEventListener('click', () => {
      const ruta = btn.getAttribute('data-path');
      const label = btn.getAttribute('data-label');
      renderCandles(ruta, label);
    });
  });

  // Botón de tendencia automática en tu suite
  const btnTendencia = document.getElementById("btn-tendencia");
  if (btnTendencia) {
    btnTendencia.addEventListener("click", () => window.trazarLineasTendencia());
  }
});

window.dibujosActivos = [];


window.mostrarZonasPivote = function () {
  console.log(">>> mostrarZonasPivote llamada");

  const myChart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  const currentData = window.currentData || [];

  if (!myChart || currentData.length < 3) {
    console.error("No hay suficientes datos para calcular pivotes");
    return;
  }

  // --- 1. Configuración de tolerancia manual ---
  const tolerancia = 0.5; // ajusta este valor según quieras agrupar niveles

  // --- 2. Contar repeticiones de precios de cierre (redondeados) ---
  const conteo = {};
  currentData.forEach(d => {
    const nivel = parseFloat(d.Close.toFixed(2));
    conteo[nivel] = (conteo[nivel] || 0) + 1;
  });
  console.log("Conteo de niveles:", conteo);

  // --- 3. Filtrar niveles con al menos 4 repeticiones ---
  let pivotes = Object.keys(conteo)
    .filter(nivel => conteo[nivel] >= 3)
    .map(Number);

  console.log("Niveles detectados como pivotes (sin agrupar):", pivotes);

  if (pivotes.length === 0) {
    console.warn("No se detectaron niveles repetidos suficientes");
    return;
  }

  // --- 4. Agrupar niveles por tolerancia ---
  pivotes.sort((a, b) => a - b);
  let zonas = [];
  let grupo = [pivotes[0]];

  for (let i = 1; i < pivotes.length; i++) {
    if (Math.abs(pivotes[i] - grupo[grupo.length - 1]) <= tolerancia) {
      grupo.push(pivotes[i]);
    } else {
      zonas.push({ min: Math.min(...grupo), max: Math.max(...grupo) });
      grupo = [pivotes[i]];
    }
  }
  zonas.push({ min: Math.min(...grupo), max: Math.max(...grupo) });

  console.log("Zonas agrupadas:", zonas);

  // --- 5. Dibujar rectángulos horizontales ---
  const graphics = zonas.map(z => {
    const topPixel = myChart.convertToPixel({ yAxisIndex: 0 }, z.max);
    const bottomPixel = myChart.convertToPixel({ yAxisIndex: 0 }, z.min);
    const width = myChart.getWidth();

    return {
      type: 'rect',
      shape: {
        x: 0,
        y: topPixel,
        width: width,
        height: bottomPixel - topPixel
      },
      style: {
        fill: 'rgba(255,170,0,0.2)',
        stroke: '#ffaa00'
      }
    };
  });

  myChart.setOption({ graphic: graphics });
  console.log("Se añadieron zonas de pivote al gráfico");
};

// Botón
document.getElementById("btn-pivotes").addEventListener("click", () => {
  window.mostrarZonasPivote();
});
