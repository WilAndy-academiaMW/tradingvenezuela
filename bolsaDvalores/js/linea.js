let lineaActiva = false;
let puntoInicio = null;

function mostrarMensaje(texto) {
  const mensajeDiv = document.getElementById('mensaje');
  if (mensajeDiv) mensajeDiv.textContent = texto;
}

function activarLinea() {
  const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!chart) return;

  lineaActiva = true;
  puntoInicio = null;

  // limpiar eventos previos
  chart.off('click');
  chart.getZr().off('mousemove');

  // Primer y segundo clic
  chart.on('click', function (params) {
    if (!lineaActiva) return;
    if (params.seriesType !== 'candlestick') return;

    const fecha = params.name;
    const close = params.data[1]; // cierre

    if (!puntoInicio) {
      // Primer clic
      puntoInicio = { fecha, precio: close };
      mostrarMensaje(`Inicio en ${fecha} → Cierre USD ${close.toFixed(2)}`);
    } else {
      // Segundo clic → fijar línea definitiva
      const puntoFinal = { fecha, precio: close };

      const option = chart.getOption();
      let series = option.series.slice();

      // quitar línea temporal
      series = series.filter(s => s.id !== 'linea-temporal');

      series.push({
        id: 'linea-definitiva-' + Date.now(),
        type: 'line',
        data: [[puntoInicio.fecha, puntoInicio.precio], [puntoFinal.fecha, puntoFinal.precio]],
        lineStyle: { color: '#00ffff', width: 2 },
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: '#00ffff' }
      });

      chart.setOption({ series }, { replaceMerge: ['series'] });
      mostrarMensaje(`Línea fijada entre ${puntoInicio.fecha} y ${puntoFinal.fecha}`);

      // 🔴 Desactivar modo línea automáticamente
      lineaActiva = false;
      puntoInicio = null;
      chart.off('click');
      chart.getZr().off('mousemove');
    }
  });

  // Mouse libre → mover línea temporal
  chart.getZr().on('mousemove', function (event) {
    if (!lineaActiva || !puntoInicio) return;

    const pos = chart.convertFromPixel({xAxisIndex: 0, yAxisIndex: 0}, [event.offsetX, event.offsetY]);
    const fechaIndex = Math.round(pos[0]);
    const precioY = pos[1];

    if (fechaIndex < 0 || fechaIndex >= fechas.length) return;
    const fecha = fechas[fechaIndex];

    const option = chart.getOption();
    let series = option.series.slice();

    series = series.filter(s => s.id !== 'linea-temporal');

    series.push({
      id: 'linea-temporal',
      type: 'line',
      data: [[puntoInicio.fecha, puntoInicio.precio], [fecha, precioY]],
      lineStyle: { color: '#ffaa00', width: 1, type: 'dashed' },
      symbol: 'none'
    });

    chart.setOption({ series }, { replaceMerge: ['series'] });
  });

  mostrarMensaje("Modo línea activado. Haz clic en una vela para empezar.");
}

// 👉 Evento del botón
const btnLinea = document.getElementById("btn-linea");
if (btnLinea) {
  btnLinea.addEventListener("click", () => {
    mostrarMensaje("Línea de tendencia activada");
    activarLinea();
  });
}
