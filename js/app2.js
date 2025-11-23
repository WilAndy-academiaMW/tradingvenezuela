let chart;

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

  // 1) Cargar precios del activo en Bs
  const precios = await cargarCSV(ruta);

  // 2) Cargar tasas de cambio desde bolivar.csv
  const tasas = await cargarCSV('archivos/bolivar.csv');
  const mapaTasas = {};
  tasas.forEach(([date, open, high, low, close]) => {
    mapaTasas[date] = parseFloat(close); // usamos Precio_Cierre como tasa
  });

  // 3) Convertir cada precio usando la tasa de ese día
  const fechas = [];
  const valores = [];
  window.currentData = []; // guardar datos para indicadores

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
      const cierre = data[1]; // posición del Close
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
}

// Eventos de los botones de activos
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

// ==========================================================
// Exclusividad de indicadores
// ==========================================================


// ==========================================================
// Funciones RSI
// ==========================================================


let isRSIvisible = false;

window.mostrarRSI = function (periodo = 14) {
  const myChart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  const currentData = window.currentData || [];

  if (!myChart || currentData.length === 0) {
    console.error("RSI: No se puede calcular sin datos o gráfico.");
    return;
  }

  // Toggle: si ya está activo → limpiar
  if (isRSIvisible) {
    let options = myChart.getOption();
    const soloVelas = options.series.filter(s => s.type === 'candlestick');
    const sinRSIaxis = options.yAxis.filter(y => y.id !== 'rsiAxis');

    myChart.setOption({
      yAxis: sinRSIaxis,
      series: soloVelas
    }, { replaceMerge: ['series','yAxis'] });

    isRSIvisible = false;
    console.log("RSI eliminado");
    return;
  }

  // Calcular RSI
  const closes = currentData.map(d => d.Close);
  const deltas = closes.map((c, i) => i === 0 ? 0 : c - closes[i - 1]);
  const gains = deltas.map(d => d > 0 ? d : 0);
  const losses = deltas.map(d => d < 0 ? -d : 0);

  const avgGain = [], avgLoss = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < periodo - 1) { avgGain.push(null); avgLoss.push(null); }
    else if (i === periodo - 1) {
      const g = gains.slice(0, periodo).reduce((a, b) => a + b, 0) / periodo;
      const l = losses.slice(0, periodo).reduce((a, b) => a + b, 0) / periodo;
      avgGain.push(g); avgLoss.push(l);
    } else {
      const prevAvgGain = avgGain[i - 1];
      const prevAvgLoss = avgLoss[i - 1];
      const k = 1 / periodo;
      avgGain.push(prevAvgGain + k * (gains[i] - prevAvgGain));
      avgLoss.push(prevAvgLoss + k * (losses[i] - prevAvgLoss));
    }
  }

  const rsi = avgGain.map((g, i) => {
    const l = avgLoss[i];
    if (g === null || l === null) return null;
    const rs = l === 0 ? (g === 0 ? 0 : Infinity) : g / l;
    return 100 - (100 / (1 + rs));
  });

  let options = myChart.getOption();
  const soloVelas = options.series.filter(s => s.type === 'candlestick');
  const sinRSIaxis = options.yAxis.filter(y => y.id !== 'rsiAxis');

  myChart.setOption({
    yAxis: [
      ...sinRSIaxis,
      { id: 'rsiAxis', name: 'RSI', position: 'right', min: 0, max: 100, interval: 10 }
    ],
    series: [
      ...soloVelas,
      {
        name: "RSI",
        type: "line",
        data: rsi,
        smooth: true,
        yAxisIndex: 1,
        lineStyle: { color: "red",lineWidth:10 },
        markLine: {
          symbol: "none",
          lineStyle: { color: "blue", type: "line",lineWidth: 35, },
          data: [
            { yAxis: 70, name: "Sobrecompra" },
            { yAxis: 30, name: "Sobreventa" }
          ]
        }
      }
    ]
  }, { replaceMerge: ['series','yAxis'] });

  isRSIvisible = true;
  console.log("RSI dibujado con líneas en 70 y 30");
};
document.getElementById("btn-rsi").addEventListener("click", () => window.mostrarRSI());

// ==========================================================
// Funciones MACD
// ==========================================================
let isMACDvisible = false;

window.mostrarMACD = function () {
  const myChart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  const currentData = window.currentData || [];

  if (!myChart || currentData.length === 0) {
    console.error("MACD: No se puede calcular sin datos o gráfico.");
    return;
  }

  // Si ya está activo → limpiar y salir
  if (isMACDvisible) {
    let options = myChart.getOption();
    // dejar solo las velas y quitar el eje MACD
    const soloVelas = options.series.filter(s => s.type === 'candlestick');
    const sinMACDaxis = options.yAxis.filter(y => y.id !== 'macdAxis');

    myChart.setOption({
      yAxis: sinMACDaxis,
      series: soloVelas
    }, { replaceMerge: ['series','yAxis'] });

    isMACDvisible = false;
    console.log("MACD eliminado");
    return;
  }

  // Extraer precios de cierre
  const closes = currentData.map(d => d.Close);

  // Función EMA
  function ema(values, span) {
    const k = 2 / (span + 1);
    let emaArr = [];
    for (let i = 0; i < span - 1; i++) emaArr.push(null);
    let prev = values.slice(0, span).reduce((a, b) => a + b, 0) / span;
    emaArr.push(prev);
    for (let i = span; i < values.length; i++) {
      const val = values[i] * k + prev * (1 - k);
      emaArr.push(val); prev = val;
    }
    return emaArr;
  }

  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v, i) => v !== null && ema26[i] !== null ? v - ema26[i] : null);
  const macdValuesForSignal = macdLine.filter(v => v !== null);
  const signalValues = ema(macdValuesForSignal, 9);
  let signalLine = [];
  const initialNulls = macdLine.length - macdValuesForSignal.length;
  for (let i = 0; i < initialNulls; i++) { signalLine.push(null); }
  signalLine.push(...signalValues);

  const histogram = macdLine.map((v, i) => 
    v !== null && signalLine[i] !== null ? v - signalLine[i] : null
  );

  // Limpiar series previas
  let options = myChart.getOption();
  const soloVelas = options.series.filter(s => s.type === 'candlestick');
  const sinMACDaxis = options.yAxis.filter(y => y.id !== 'macdAxis');

  // Configurar y agregar MACD
  myChart.setOption({
    yAxis: [
      ...sinMACDaxis,
      {
        id: 'macdAxis',
        name: 'MACD',
        position: 'right',
        splitLine: { show: false },
        axisLabel: { formatter: '{value}', color: 'blue' }
      }
    ],
    series: [
      ...soloVelas,
      {
        name: "MACD",
        type: "line",
        data: macdLine,
        lineStyle: { color: "blue", width: 2 },
        showSymbol: false,
        yAxisIndex: 1
      },
      {
        name: "Signal",
        type: "line",
        data: signalLine,
        lineStyle: { color: "orange", width: 1, type: "dashed" },
        showSymbol: false,
        yAxisIndex: 1
      },
      {
        name: "Histograma",
        type: "bar",
        data: histogram,
        itemStyle: { color: p => p.value >= 0 ? "green" : "red" },
        yAxisIndex: 1
      }
    ]
  }, { replaceMerge: ['series','yAxis'] });

  isMACDvisible = true;
  console.log("MACD dibujado");
};
document.getElementById("btn-macd").addEventListener("click", () => window.mostrarMACD());

// ==========================================================
// Funciones ichimoku
// ==========================================================
let ichimokuActivo = false;

window.mostrarIchimoku = function () {
  const myChart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  const currentData = window.currentData || [];
  if (!myChart || currentData.length === 0) return;

  // Si ya está activo → limpiar y salir
  if (ichimokuActivo) {
    let options = myChart.getOption();
    const soloVelas = options.series.filter(s => s.type === 'candlestick');
    myChart.setOption({ series: soloVelas }, { replaceMerge: ['series'] });
    ichimokuActivo = false;
    console.log("Ichimoku eliminado");
    return;
  }

  // Extraer precios de cierre
  const closes = currentData.map(d => d.Close);

  // Función SMA
  function sma(values, period) {
    return values.map((v, i) => {
      if (i < period - 1) return null;
      const slice = values.slice(i - period + 1, i + 1);
      return slice.reduce((a, b) => a + b, 0) / period;
    });
  }

  const tenkan = sma(closes, 9);
  const kijun = sma(closes, 26);
  const senkouA = tenkan.map((v, i) => (v !== null && kijun[i] !== null) ? (v + kijun[i]) / 2 : null);
  const senkouB = sma(closes, 52);
  const chikou = closes.map((v, i) => i >= 26 ? closes[i - 26] : null);

  let options = myChart.getOption();
  const soloVelas = options.series.filter(s => s.type === 'candlestick');

  myChart.setOption({
    series: [
      ...soloVelas,
      { name: "Tenkan", type: "line", data: tenkan, lineStyle: { color: "red" }, showSymbol: false },
      { name: "Kijun", type: "line", data: kijun, lineStyle: { color: "blue" }, showSymbol: false },
      { name: "Chikou", type: "line", data: chikou, lineStyle: { color: "green" }, showSymbol: false },
      {
        name: "Senkou A",
        type: "line",
        data: senkouA,
        lineStyle: { color: "orange" },
        areaStyle: { color: "rgba(255,165,0,0.3)" }, // nube
        showSymbol: false
      },
      {
        name: "Senkou B",
        type: "line",
        data: senkouB,
        lineStyle: { color: "purple" },
        areaStyle: { color: "rgba(128,0,128,0.3)" }, // nube
        showSymbol: false
      }
    ]
  }, { replaceMerge: ['series'] });

  ichimokuActivo = true;
  console.log("Ichimoku dibujado");
};
document.getElementById("btn-ichimoku").addEventListener("click", () => window.mostrarIchimoku());
// ==========================================================
// Funciones Bollinger
// ==========================================================

let bbActivo = false;

window.mostrarBollinger = function (periodo = 20, factor = 2) {
  const myChart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  const currentData = window.currentData || [];
  if (!myChart || currentData.length === 0) return;

  // Si ya está activo → limpiar y salir
  if (bbActivo) {
    // Solo dejar las velas (candlestick)
    let options = myChart.getOption();
    const soloVelas = options.series.filter(s => s.type === 'candlestick');
    myChart.setOption({ series: soloVelas }, { replaceMerge: ['series'] });
    bbActivo = false;
    console.log("Bollinger Bands eliminadas");
    return;
  }

  // Extraer precios de cierre
  const closes = currentData.map(d => d.Close);

  // Función SMA
  function sma(values, period) {
    return values.map((v, i) => {
      if (i < period - 1) return null;
      const slice = values.slice(i - period + 1, i + 1);
      return slice.reduce((a, b) => a + b, 0) / period;
    });
  }

  // Calcular SMA base
  const smaBase = sma(closes, periodo);

  // Función desviación estándar
  function std(values, period) {
    return values.map((v, i) => {
      if (i < period - 1) return null;
      const slice = values.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;
      const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
      return Math.sqrt(variance);
    });
  }

  const desviacion = std(closes, periodo);

  // Bandas superior e inferior
  const bandaSuperior = smaBase.map((v, i) => v !== null ? v + factor * desviacion[i] : null);
  const bandaInferior = smaBase.map((v, i) => v !== null ? v - factor * desviacion[i] : null);

  // Mantener solo velas y añadir BB
  let options = myChart.getOption();
  const soloVelas = options.series.filter(s => s.type === 'candlestick');

  myChart.setOption({
    series: [
      ...soloVelas,
      { name: "SMA", type: "line", data: smaBase, lineStyle: { color: "yellow" }, showSymbol: false },
      { name: "Banda Superior", type: "line", data: bandaSuperior, lineStyle: { color: "blue" }, showSymbol: false },
      { name: "Banda Inferior", type: "line", data: bandaInferior, lineStyle: { color: "blue" }, showSymbol: false }
    ]
  }, { replaceMerge: ['series'] });

  bbActivo = true;
  console.log("Bollinger Bands dibujadas");
};
document.getElementById("btn-bb").addEventListener("click", () => window.mostrarBollinger());

// fibonacci
let fiboActivo = false;

window.mostrarFibonacci = function () {
  const myChart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  const currentData = window.currentData || [];

  if (!myChart || currentData.length < 2) {
    console.error("No hay suficientes datos para calcular Fibonacci");
    return;
  }

  // Si ya está activo → limpiar y salir
  if (fiboActivo) {
    myChart.setOption({ graphic: [] }, { replaceMerge: ['graphic'] }); 
    fiboActivo = false;
    console.log("Fibonacci eliminado del gráfico");
    return;
  }

  // Detectar máximo y mínimo
  const closes = currentData.map(d => d.Close);
  const max = Math.max(...closes);
  const min = Math.min(...closes);

  const niveles = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
  const fibLevels = niveles.map(n => ({
    valor: max - (max - min) * n,
    porcentaje: (n * 100).toFixed(1) + "%"
  }));

  const graphics = fibLevels.map(f => {
    const yPixel = myChart.convertToPixel({ yAxisIndex: 0 }, f.valor);
    const width = myChart.getWidth();

    return {
      type: 'line',
      shape: { x1: 0, y1: yPixel, x2: width, y2: yPixel },
      style: { stroke: '#ffd500ff', lineWidth: 5 } // azul marino y grueso
    };
  });

  fibLevels.forEach(f => {
    const yPixel = myChart.convertToPixel({ yAxisIndex: 0 }, f.valor);
    graphics.push({
      type: 'text',
      style: {
        x: 10,
        y: yPixel - 5,
        text: f.porcentaje + " (" + f.valor.toFixed(2) + ")",
        fill: '#000080',
        fontSize: 12,
        fontWeight: 'bold'
      }
    });
  });

  myChart.setOption({ graphic: graphics }, { replaceMerge: ['graphic'] });
  fiboActivo = true;
  console.log("Fibonacci dibujado en el gráfico");
};
document.getElementById("btn-fibonacci")?.addEventListener("click", () => {
  window.mostrarFibonacci();
});


//zonas pivotes

let pivotesActivo = false;

window.mostrarZonasPivote = function () {
  const myChart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  const currentData = window.currentData || [];

  if (!myChart || currentData.length < 3) {
    console.error("No hay suficientes datos para calcular pivotes");
    return;
  }

  // Si ya está activo → limpiar y salir
  if (pivotesActivo) {
    myChart.setOption({ graphic: [] }, { replaceMerge: ['graphic'] });
    pivotesActivo = false;
    console.log("Zonas de pivote eliminadas");
    return;
  }

  const tolerancia = parseFloat(document.getElementById("tol").value);
  console.log(">>> mostrarZonasPivote llamada con tolerancia:", tolerancia);

  // Conteo de niveles
  const conteo = {};
  currentData.forEach(d => {
    const nivel = parseFloat(d.Close.toFixed(2));
    conteo[nivel] = (conteo[nivel] || 0) + 1;
  });

  let pivotes = Object.keys(conteo)
    .filter(nivel => conteo[nivel] >= 4)
    .map(Number);

  if (pivotes.length === 0) {
    console.warn("No se detectaron niveles repetidos suficientes");
    return;
  }

  // Agrupar por tolerancia
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

  // 🔹 Aquí sí definimos graphics
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

  // Solo llamar si hay algo
  if (graphics.length > 0) {
    myChart.setOption({ graphic: graphics }, { replaceMerge: ['graphic'] });
    pivotesActivo = true;
    console.log("Se añadieron zonas de pivote al gráfico");
  }
};
document.getElementById("btn-pivotes")?.addEventListener("click", () => {
  window.mostrarZonasPivote();
});

// Estado de la regla
let reglaLineaActiva = false;
let primerPunto = null;
const lineaId = 'regla-linea';

// Activar/Desactivar regla
window.activarReglaLinea = function () {
  if (!chart) {
    console.warn('No hay instancia de gráfico inicializada');
    return;
  }

  reglaLineaActiva = !reglaLineaActiva;
  primerPunto = null;

  if (reglaLineaActiva) {
    console.log('Modo regla activado: haz dos clics en el gráfico');
    chart.getZr().on('click', onClickReglaLinea);
  } else {
    console.log('Modo regla desactivado');
    chart.getZr().off('click', onClickReglaLinea);
    chart.setOption({ graphic: [] }, { replaceMerge: ['graphic'] });
  }
};

// Handler de clic
function onClickReglaLinea(event) {
  const dataCoord = chart.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [event.offsetX, event.offsetY]);
  if (!dataCoord || !Array.isArray(dataCoord)) {
    console.warn('Clic fuera del área del gráfico');
    return;
  }

  const [xData, yData] = dataCoord;

  if (!primerPunto) {
    // Primer clic → guardar punto inicial
    primerPunto = { xData, yData };
    console.log("Primer punto:", yData);
  } else {
    // Segundo clic → calcular y dibujar línea
    const segundoPunto = { xData, yData };
    const cambioPct = ((segundoPunto.yData - primerPunto.yData) / primerPunto.yData) * 100;

    // Convertir a píxeles
    const p1 = chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [primerPunto.xData, primerPunto.yData]);
    const p2 = chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [segundoPunto.xData, segundoPunto.yData]);

    const linea = {
      id: lineaId,
      type: 'line',
      shape: { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1] },
      style: { stroke: 'yellow', lineWidth: 2 },
      textContent: {
        style: {
          text: cambioPct.toFixed(2) + '%',
          fill: '#fff',
          font: '12px Arial'
        }
      },
      textConfig: { position: 'middle' },
      silent: true
    };

    chart.setOption({ graphic: [linea] }, { replaceMerge: ['graphic'] });

    console.log(`Cambio: ${cambioPct.toFixed(2)}%`);
    primerPunto = null; // reset para nueva medición
  }
}

// Botón que activa/desactiva la regla
document.getElementById('btn-regla')?.addEventListener('click', () => {
  window.activarReglaLinea();
});


