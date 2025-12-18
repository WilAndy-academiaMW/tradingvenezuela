let lineaActiva = false;
let lineaClicks = 0;
let puntosLinea = [];

function activarLinea() {
  const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!chart) {
    console.error("Linea: no hay gráfico activo.");
    return;
  }

  lineaActiva = true;
  lineaClicks = 0;
  puntosLinea = [];
  chart.off('click');

  mostrarMensaje("Línea de tendencia activada. Haz clic en dos velas.");

  chart.on('click', function (params) {
    if (!lineaActiva) return;
    if (params.seriesType !== 'candlestick') return;

    const fecha = params.name;
    const valores = params.data;

    // Según tu SCG: bajo en [3], alto en [4]
    const precioAlto = valores[4];

    puntosLinea.push({ fecha, alto: precioAlto });
    lineaClicks++;

    mostrarMensaje(`Click ${lineaClicks}: ${fecha} → Alto: ${precioAlto}`);

    if (lineaClicks % 2 === 0) {
      const p1 = puntosLinea[lineaClicks - 2];
      const p2 = puntosLinea[lineaClicks - 1];

      const option = chart.getOption();
      const fechas = option.xAxis[0].data;
      const fechaInicio = p1.fecha;
      const fechaFin = fechas[fechas.length - 1]; // hasta el final de la gráfica

      const series = option.series.slice();
      const idxVela = series.findIndex(s => (s.type === 'candlestick'));
      if (idxVela === -1) return;

      if (!series[idxVela].markLine) {
        series[idxVela].markLine = { data: [] };
      }

      // Determinar qué alto usar como inicio y fin
      let altoInicio, altoFin;
      if (p1.alto > p2.alto) {
        altoInicio = p1.alto;
        altoFin = p2.alto;
      } else {
        altoInicio = p2.alto;
        altoFin = p1.alto;
      }

      // Línea de tendencia entre los dos altos extendida hasta el final
      series[idxVela].markLine.data.push([
        { coord: [fechaInicio, altoInicio], lineStyle: { color: '#00ff00', width: 2 }, label: { show: false } },
        { coord: [fechaFin, altoFin],       lineStyle: { color: '#00ff00', width: 2 }, label: { show: false } }
      ]);

      chart.setOption({ series }, { replaceMerge: ['series'] });
      mostrarMensaje(`Línea de tendencia dibujada desde ${fechaInicio} hasta ${fechaFin} usando los altos.`);
    }
  });
}

function desactivarLinea() {
  const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!chart) return;

  const option = chart.getOption();
  const series = option.series.slice();
  const idxVela = series.findIndex(s => (s.type === 'candlestick'));
  if (idxVela !== -1) {
    series[idxVela].markLine = { data: [] };
    chart.setOption({ series }, { replaceMerge: ['series'] });
  }

  lineaActiva = false;
  lineaClicks = 0;
  puntosLinea = [];
  chart.off('click');
  mostrarMensaje("Línea de tendencia desactivada. Línea borrada.");
}

document.getElementById("btn-linea").addEventListener("click", () => {
  if (lineaActiva) {
    desactivarLinea();
  } else {
    activarLinea();
  }
});
