let hchActivo = false;
let hchClicks = 0;
let hchPuntos = [];

function activarHCH() {
  const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!chart) {
    console.error("HCH: no hay gráfico activo.");
    return;
  }

  hchActivo = true;
  hchClicks = 0;
  hchPuntos = [];
  chart.off('click');

  mostrarMensaje("HCH activado. Haz 6 clics en velas para capturar Alto y Bajo.");

  chart.on('click', function (params) {
    if (!hchActivo) return;
    if (params.seriesType !== 'candlestick') return;

    const fecha = params.name;
    const valores = params.data;

    // Según tu CSV: Date, Open, High, Low, Close, Volumen
    const precioHigh = valores[4]; // Alto
    const precioLow  = valores[3]; // Bajo

    hchClicks++;
    hchPuntos.push({ fecha, high: precioHigh, low: precioLow });

    mostrarMensaje(`Click ${hchClicks}: ${fecha} → Alto: ${precioHigh}, Bajo: ${precioLow}`);

    // Cuando llegamos a 6 clics, mostramos todos los datos
    if (hchClicks === 6) {
      let resumen = "Datos capturados para HCH:\n";
      hchPuntos.forEach((p, i) => {
        resumen += `Vela ${i+1} (${p.fecha}): Alto=${p.high}, Bajo=${p.low}\n`;
      });
      mostrarMensaje(resumen);
    }
  });
}
function trazarLineaHI() {
  const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!chart) {
    console.error("HI: no hay gráfico activo.");
    return;
  }

  if (hchPuntos.length < 3) {
    mostrarMensaje("No hay suficientes puntos (mínimo 3 clics).");
    return;
  }

  const option = chart.getOption();
  const series = option.series.slice();

  // Añadimos una nueva serie de tipo line para conectar los clics 1,2,3
  series.push({
    name: 'HI',
    type: 'line',
    data: [
      [hchPuntos[0].fecha, hchPuntos[0].low],
      [hchPuntos[1].fecha, hchPuntos[1].high],
      [hchPuntos[2].fecha, hchPuntos[2].low]
    ],
    lineStyle: {
      color: 'blue',
      width: 2,
      type: 'solid'
    },
    symbol: 'circle',
    symbolSize: 8,
    itemStyle: {
      color: 'blue'
    },
    label: {
      show: true,
      formatter: 'HI',
      color: '#000',
      fontWeight: 'bold'
    }
  });

  chart.setOption({ series }, { replaceMerge: ['series'] });
  mostrarMensaje("Línea HI trazada entre clics 1, 2 y 3.");
}

// Botón "hi"
document.getElementById("hi").addEventListener("click", () => {
  trazarLineaHI();
});


function trazarCabeza() {
  const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!chart) {
    console.error("Cabeza: no hay gráfico activo.");
    return;
  }

  if (hchPuntos.length < 5) {
    mostrarMensaje("No hay suficientes puntos (mínimo 5 clics).");
    return;
  }

  const option = chart.getOption();
  const fechas = option.xAxis[0].data;
  const fechaFin = fechas[fechas.length - 1];
  const series = option.series.slice();

  // --- Línea de la cabeza (clics 3,4,5) ---
  series.push({
    name: 'Cabeza',
    type: 'line',
    data: [
      [hchPuntos[2].fecha, hchPuntos[2].low],   // click 3 → bajo
      [hchPuntos[3].fecha, hchPuntos[3].high],  // click 4 → alto
      [hchPuntos[4].fecha, hchPuntos[4].low]    // click 5 → bajo
    ],
    lineStyle: { color: 'red', width: 2 },
    symbol: 'circle',
    symbolSize: 8,
    itemStyle: { color: 'red' },
    label: { show: true, formatter: 'Cabeza', color: '#000', fontWeight: 'bold' }
  });

  // --- Triángulo de la cabeza (relleno azul entre 3-4-5) ---
  series.push({
    name: 'Triángulo Cabeza',
    type: 'line',
    data: [
      [hchPuntos[2].fecha, hchPuntos[2].low],   // click 3 → bajo
      [hchPuntos[3].fecha, hchPuntos[3].high],  // click 4 → alto
      [hchPuntos[4].fecha, hchPuntos[4].low],   // click 5 → bajo
      [hchPuntos[2].fecha, hchPuntos[2].low]    // cerrar el triángulo
    ],
    lineStyle: { color: 'blue', width: 2 },
    areaStyle: { color: 'rgba(0,0,255,0.5)' }, // relleno azul semitransparente
    symbol: 'none'
  });

  // --- Línea de cuello (mínimos de click 3 y click 5) ---
  series.push({
    name: 'Neckline',
    type: 'line',
    data: [
      [hchPuntos[2].fecha, hchPuntos[2].low],   // click 3 → bajo
      [hchPuntos[4].fecha, hchPuntos[4].low]    // click 5 → bajo
    ],
    lineStyle: { color: 'blue', width: 2, type: 'dashed' },
    symbol: 'circle',
    symbolSize: 6,
    itemStyle: { color: 'blue' },
    label: { show: true, formatter: 'Neckline', color: '#000', fontWeight: 'bold' }
  });

  // --- Rectángulo desde click 5 hasta final con valor del click 2 ---
  const altoClick2 = hchPuntos[1].high;   // click 2 → alto
  const bajoClick5 = hchPuntos[4].low;    // click 5 → bajo
  const fechaClick5 = hchPuntos[4].fecha;

  // Calcular % subida
  const porcentaje = ((altoClick2 - bajoClick5) / bajoClick5 * 100).toFixed(2);

  const idxVela = series.findIndex(s => s.type === 'candlestick');
  if (idxVela !== -1) {
    if (!series[idxVela].markArea) {
      series[idxVela].markArea = { data: [] };
    }

    series[idxVela].markArea.data.push([
      {
        coord: [fechaClick5, altoClick2],
        itemStyle: { color: 'rgba(255, 5, 5, 0.8)' }, // fondo opaco negro
        label: {
          show: true,
          color: '#fff',
          fontWeight: 'bold',
          fontStyle: 'italic',
          formatter: `${porcentaje}%`,
          position: 'inside',
          align: 'center'
        }
      },
      {
        coord: [fechaFin, bajoClick5]
      }
    ]);
  }

  chart.setOption({ series }, { replaceMerge: ['series'] });
  mostrarMensaje("Cabeza trazada: línea, triángulo, cuello y rectángulo con %.");
}

document.getElementById("cabeza").addEventListener("click", () => {
  trazarCabeza();
});




function desactivarHCH() {
  const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!chart) return;

  hchActivo = false;
  hchClicks = 0;
  hchPuntos = [];
  chart.off('click');
  mostrarMensaje("HCH desactivado.");
}

document.getElementById("btn-hch").addEventListener("click", () => {
  if (hchActivo) {
    desactivarHCH();
  } else {
    activarHCH();
  }
});

