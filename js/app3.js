let fiboActivo2 = false;
let fiboClicks = 0;
let puntosFibo = [];
let fibosGuardados = []; // acumula y persiste

function mostrarMensaje(texto) {
  const mensajeDiv = document.getElementById('mensaje');
  if (mensajeDiv) mensajeDiv.textContent = texto;
  console.log(texto);
}

window.mostrarFibonacci2 = function () {
  const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!chart) {
    console.error("Fibonacci: no hay gráfico activo.");
    return;
  }

  // Limpia eventos anteriores
  chart.off('click');
  chart.off('dataZoom');
  chart.off('restore');

  const btn = document.getElementById('btn-fibonacci2');
  if (!btn) {
    console.error("Fibonacci: falta #btn-fibonacci2 en el DOM.");
    return;
  }

  btn.onclick = () => {
    if (fiboActivo2) {
      fiboActivo2 = false;
      fiboClicks = 0;
      puntosFibo = [];
      fibosGuardados = [];
      mostrarMensaje("Fibonacci desactivado. Todas las líneas borradas.");
      const option = chart.getOption();
      const baseSeries = option.series.filter(s => !(s.__fibo2 === true));
      chart.setOption({ series: baseSeries });
    } else {
      fiboActivo2 = true;
      fiboClicks = 0;
      puntosFibo = [];
      mostrarMensaje("Fibonacci activado. Haz dos clics en velas (solo mechas).");
    }
  };

  // Persistencia en zoom/restaurar
  chart.on('dataZoom', () => reAplicarFibos(chart));
  chart.on('restore', () => reAplicarFibos(chart));

  // Captura de clics
  chart.on('click', function (params) {
    if (!fiboActivo2) return;
    if (params.seriesType !== 'candlestick') return;

    const fecha = params.name;
    const v = params.data; // [open, close, high, low]
    const high = v[3];
    const low  = v[4];

    puntosFibo.push({ fecha, high, low });
    fiboClicks++;
    mostrarMensaje(`Click ${fiboClicks}: ${fecha} → Mecha ALTA ${high} / Mecha BAJA ${low}`);

    if (fiboClicks % 2 === 0) {
      const p1 = puntosFibo[fiboClicks - 2];
      const p2 = puntosFibo[fiboClicks - 1];

      let precioAlto, precioBajo;
      if (p1.high < p2.high) {
        // Tendencia alcista
        precioAlto = p2.low;
        precioBajo = p1.high;
        mostrarMensaje("Tendencia alcista: Golden Pocket en la parte baja del fibo.");
      } else {
        // Tendencia bajista
        precioAlto = p1.low;
        precioBajo = p2.high;
        mostrarMensaje("Tendencia bajista: Golden Pocket en la parte alta del fibo.");
      }

      const option = chart.getOption();
      const categorias = option.xAxis[0].data || [];
      const i1 = categorias.indexOf(p1.fecha);
      const i2 = categorias.indexOf(p2.fecha);
      if (i1 < 0 || i2 < 0) {
        mostrarMensaje("No se ubicaron las velas en el eje X.");
        return;
      }

      const xInicio = categorias[Math.min(i1, i2)];
      const xFin    = categorias[Math.max(i1, i2)];
      const rango   = precioAlto - precioBajo;

      // Niveles: 0%, 50%, 61.8%, 65%, 78.6%, 100%
      const niveles = [
        { n: 0.0,   color: '#ffaa00', dash: true },
        { n: 0.5,   color: '#9999ff', dash: true },   // nivel extra 50%
        { n: 0.618, color: '#00ffcc', dash: false },  // GP lower
        { n: 0.65,  color: '#00ffcc', dash: false },  // GP upper
        { n: 0.786, color: '#ff66cc', dash: true },   // nivel extra 78.6%
        { n: 1.0,   color: '#ffaa00', dash: true }
      ];

      const seriesFibo = niveles.map(({ n, color, dash }) => {
        const y = precioAlto - rango * n;
        return {
          __fibo2: true,
          type: 'line',
          data: [[xInicio, y], [xFin, y]],
          lineStyle: { color, width: 2, type: dash ? 'dashed' : 'solid' },
          symbol: 'none',
          yAxisIndex: 0,
          z: 95,
          animation: false,
          label: {
            show: true,
            position: 'end',
            formatter: `${(n * 100).toFixed(1)}%`,
            color,
            fontSize: 12
          }
        };
      });

      // Relleno del Golden Pocket (61.8–65%)
      let yGPTop, yGPBot;
if (p1.high < p2.high) {
  // Tendencia alcista → retroceso bajista
  yGPTop = precioAlto - rango * 0.618;
  yGPBot = precioAlto - rango * 0.65;
} else {
  // Tendencia bajista → retroceso alcista
  yGPTop = precioAlto + rango * 0.618;
  yGPBot = precioAlto + rango * 0.65;
}

      const gpTop = {
        __fibo2: true,
        type: 'line',
        data: [[xInicio, yGPTop], [xFin, yGPTop]],
        lineStyle: { color: 'transparent' },
        areaStyle: { color: 'rgba(0,255,204,0.15)' },
        z: 90,
        animation: true
      };
      const gpBot = {
        __fibo2: true,
        type: 'line',
        data: [[xInicio, yGPBot], [xFin, yGPBot]],
        lineStyle: { color: 'red' },
        areaStyle: { color: 'rgba(0,255,204,0.15)' },
        z: 90,
        animation: false
      };

      const nuevasSeries = option.series.slice().concat(seriesFibo, [gpTop, gpBot]);
      chart.setOption({ series: nuevasSeries });

      fibosGuardados.push(...seriesFibo, gpTop, gpBot);

      mostrarMensaje(`Fibo dibujado entre ${xInicio} y ${xFin}. Superior: ${precioAlto.toFixed(6)} / Inferior: ${precioBajo.toFixed(6)}.`);
    }
  });
};

// Re-aplica fibos tras zoom/restaurar
function reAplicarFibos(chart) {
  const option = chart.getOption();
  const baseSeries = option.series.filter(s => !(s.__fibo2 === true));
  chart.setOption({ series: baseSeries.concat(fibosGuardados) });
}

// Limpieza al cambiar de activo
function limpiarFibonacci2AlCambiarActivo(chart) {
  const option = chart.getOption();
  const baseSeries = option.series.filter(s => !(s.__fibo2 === true));
  chart.setOption({ series: baseSeries });
  fiboActivo2 = false;
  fiboClicks = 0;
  puntosFibo = [];
  fibosGuardados = [];
  mostrarMensaje("Nuevo activo cargado. Fibonacci 2 limpiado.");
}

// Conectar botón
document.getElementById("btn-fibonacci2")
  ?.addEventListener("click", () => window.mostrarFibonacci2());
