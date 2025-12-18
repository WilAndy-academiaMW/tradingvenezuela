let fvgActivo = false;
let fvgClicks = 0;
let fvgPuntos = [];

function activarFVG() {
  const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!chart) {
    console.error("FVG: no hay gráfico activo.");
    return;
  }

  fvgActivo = true;
  fvgClicks = 0;
  fvgPuntos = [];
  chart.off('click');

  mostrarMensaje("FVG activado. Haz clic en dos velas.");

  chart.on('click', function (params) {
    if (!fvgActivo) return;
    if (params.seriesType !== 'candlestick') return;

    const fecha = params.name;
    const valores = params.data;

    // Según tu CSV: Date, Open, High, Low, Close, Volumen
    const precioHigh = valores[4]; // Alto
    const precioLow  = valores[3]; // Bajo

    fvgPuntos.push({ fecha, high: precioHigh, low: precioLow });
    fvgClicks++;

    mostrarMensaje(`Click ${fvgClicks}: ${fecha} → Alto: ${precioHigh}, Bajo: ${precioLow}`);

    if (fvgClicks % 2 === 0) {
      const p1 = fvgPuntos[fvgClicks - 2];
      const p2 = fvgPuntos[fvgClicks - 1];

      const option = chart.getOption();
      const fechas = option.xAxis[0].data;
      const fechaFin = fechas[fechas.length - 1];

      const series = option.series.slice();
      const idxVela = series.findIndex(s => (s.type === 'candlestick'));
      if (idxVela === -1) return;

      if (!series[idxVela].markArea) {
        series[idxVela].markArea = { data: [] };
      }

      let bajo, alto;
      if (p1.high > p2.high) {
        bajo = p1.low;
        alto = p2.high;
      } else {
        bajo = p2.low;
        alto = p1.high;
      }

      // Rectángulo FVG
      series[idxVela].markArea.data.push([
        {
          name: 'FVG',
          coord: [p1.fecha, alto],
          itemStyle: { color: 'rgba(0, 150, 255, 0.3)' }, // azul claro transparente
          label: { 
            show: true, 
            color: '#fff', 
            fontWeight: 'bold', 
            fontStyle: 'italic', 
            formatter: 'FVG',
            position: 'inside',
            align: 'center'
          }
        },
        {
          coord: [fechaFin, bajo]
        }
      ]);

      chart.setOption({ series }, { replaceMerge: ['series'] });
      mostrarMensaje(`FVG marcado entre ${p1.fecha} y ${p2.fecha}, extendido hasta ${fechaFin}`);
    }
  });
}

function desactivarFVG() {
  const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!chart) return;

  fvgActivo = false;
  fvgClicks = 0;
  fvgPuntos = [];
  chart.off('click');
  mostrarMensaje("FVG desactivado.");
}

document.getElementById("btn-fvg").addEventListener("click", () => {
  if (fvgActivo) {
    desactivarFVG();
  } else {
    activarFVG();
  }
});
