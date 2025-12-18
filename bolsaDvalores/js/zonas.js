function activarZonaCompra() {
  const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!chart) {
    console.error("Zona de compra: no hay gráfico activo.");
    return;
  }

  chart.off('click');
  mostrarMensaje("Haz clic en una vela para marcar zona de demanda.");

  chart.on('click', function (params) {
    if (params.seriesType !== 'candlestick') return;

    const fecha = params.name;
    const valores = params.data;

    // Según tu CSV: Date, Open, High, Low, Close, Volumen
    const precioHigh = valores[2]; // Alto
    const precioLow  = valores[3]; // Bajo

    const option = chart.getOption();
    const fechas = option.xAxis[0].data;
    const fechaFin = fechas[fechas.length - 1]; // hasta el final de la gráfica

    const series = option.series.slice();
    const idxVela = series.findIndex(s => (s.type === 'candlestick'));
    if (idxVela === -1) return;

    if (!series[idxVela].markArea) {
      series[idxVela].markArea = { data: [] };
    }

    // Rectángulo verde con texto "Zona de demanda"
    series[idxVela].markArea.data.push([
      {
        name: 'Zona de demanda',
        coord: [fecha, precioHigh],
        itemStyle: { color: 'rgba(0, 200, 0, 0.3)' },
        label: { 
          show: true, 
          color: '#fff', 
          fontWeight: 'bold', 
          fontStyle: 'italic', 
          formatter: 'Zona de demanda',
          position: 'inside', 
          align: 'center'
        }
      },
      {
        coord: [fechaFin, precioLow]
      }
    ]);

    chart.setOption({ series }, { replaceMerge: ['series'] });
    mostrarMensaje(`Zona de demanda marcada desde ${fecha} hasta ${fechaFin}`);
  });
}

function activarZonaVenta() {
  const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!chart) {
    console.error("Zona de venta: no hay gráfico activo.");
    return;
  }

  chart.off('click');
  mostrarMensaje("Haz clic en una vela para marcar zona de oferta.");

  chart.on('click', function (params) {
    if (params.seriesType !== 'candlestick') return;

    const fecha = params.name;
    const valores = params.data;

    const precioHigh = valores[2]; // Alto
    const precioLow  = valores[3]; // Bajo

    const option = chart.getOption();
    const fechas = option.xAxis[0].data;
    const fechaFin = fechas[fechas.length - 1];

    const series = option.series.slice();
    const idxVela = series.findIndex(s => (s.type === 'candlestick'));
    if (idxVela === -1) return;

    if (!series[idxVela].markArea) {
      series[idxVela].markArea = { data: [] };
    }

    // Rectángulo rojo con texto "Zona de oferta"
    series[idxVela].markArea.data.push([
      {
        name: 'Zona de oferta',
        coord: [fecha, precioHigh],
        itemStyle: { color: 'rgba(200, 0, 0, 0.3)' },
        label: { 
          show: true, 
          color: '#fff', 
          fontWeight: 'bold', 
          fontStyle: 'italic', 
          formatter: 'Zona de oferta',
          position: 'inside', 
          align: 'center'
        }
      },
      {
        coord: [fechaFin, precioLow]
      }
    ]);

    chart.setOption({ series }, { replaceMerge: ['series'] });
    mostrarMensaje(`Zona de oferta marcada desde ${fecha} hasta ${fechaFin}`);
  });
}

// Botones
document.getElementById("btn-zonadcompra").addEventListener("click", () => {
  activarZonaCompra();
});

document.getElementById("btn-zonadventa").addEventListener("click", () => {
  activarZonaVenta();
});


