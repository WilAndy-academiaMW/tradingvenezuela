let fiboGPActivo = false;
let fiboGPClicks = 0;
let puntosFiboGP = [];

function activarFiboGP() {
  const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!chart) {
    console.error("FiboGP: no hay gráfico activo.");
    return;
  }

  fiboGPActivo = true;
  fiboGPClicks = 0;
  puntosFiboGP = [];
  chart.off('click');

  mostrarMensaje("Fibonacci GP activado. Haz clic en dos velas para definir el rango.");

  chart.on('click', function (params) {
    if (!fiboGPActivo) return;
    if (params.seriesType !== 'candlestick') return;

    const fecha = params.name;
    const valores = params.data;

    // Según tu SCG: bajo en [3], alto en [4]
    const precioBajo = valores[3];
    const precioAlto = valores[4];

    puntosFiboGP.push({ fecha, alto: precioAlto, bajo: precioBajo });
    fiboGPClicks++;

    mostrarMensaje(`Click ${fiboGPClicks}: ${fecha} → Alto: ${precioAlto}, Bajo: ${precioBajo}`);

    if (fiboGPClicks % 2 === 0) {
      const p1 = puntosFiboGP[fiboGPClicks - 2];
      const p2 = puntosFiboGP[fiboGPClicks - 1];

      const maximo = Math.max(p1.alto, p2.alto);
      const minimo = Math.min(p1.bajo, p2.bajo);
      const rango = maximo - minimo;

      const option = chart.getOption();
      const fechas = option.xAxis[0].data;
      const fechaInicio = p1.fecha;              // desde el primer clic
      const fechaFin = fechas[fechas.length - 1]; // hasta el final de la gráfica

      const series = option.series.slice();
      const idxVela = series.findIndex(s => (s.type === 'candlestick'));
      if (idxVela === -1) return;

      if (!series[idxVela].markLine) {
        series[idxVela].markLine = { data: [] };
      }
      if (!series[idxVela].markArea) {
        series[idxVela].markArea = { data: [] };
      }

      // Niveles Fibonacci típicos
      const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.65, 0.786, 1];
      fibLevels.forEach(f => {
        const nivel = maximo - rango * f;
        series[idxVela].markLine.data.push([
          { coord: [fechaInicio, nivel], lineStyle: { type: 'solid', color: '#ffaa00', width: 2 }, label: { show: false } },
          { coord: [fechaFin, nivel],    lineStyle: { type: 'solid', color: '#ffaa00', width: 2 }, label: { show: false } }
        ]);
      });

      // Golden Pocket (0.618–0.65) sombreado en amarillo
      const nivel618 = maximo - rango * 0.618;
      const nivel65  = maximo - rango * 0.65;
      series[idxVela].markArea.data.push([
        {
          coord: [fechaInicio, nivel65],
          itemStyle: { color: 'rgba(255, 255, 0, 0.3)' }
        },
        {
          coord: [fechaFin, nivel618]
        }
      ]);

      chart.setOption({ series }, { replaceMerge: ['series'] });
      mostrarMensaje(`Fibonacci GP dibujado desde ${fechaInicio} hasta ${fechaFin}`);
    }
  });
}

function desactivarFiboGP() {
  const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!chart) return;

  const option = chart.getOption();
  const series = option.series.slice();
  const idxVela = series.findIndex(s => (s.type === 'candlestick'));
  if (idxVela !== -1) {
    series[idxVela].markLine = { data: [] };
    series[idxVela].markArea = { data: [] };
    chart.setOption({ series }, { replaceMerge: ['series'] });
  }

  fiboGPActivo = false;
  fiboGPClicks = 0;
  puntosFiboGP = [];
  chart.off('click');
  mostrarMensaje("Fibonacci GP desactivado. Líneas borradas.");
}

document.getElementById("btn-fibogp").addEventListener("click", () => {
  if (fiboGPActivo) {
    desactivarFiboGP();
  } else {
    activarFiboGP();
  }
});
