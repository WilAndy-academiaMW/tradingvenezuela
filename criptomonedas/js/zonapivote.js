let pivotesActivo = false;

function mostrarZonasPivote() {
  const myChart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!myChart) {
    mostrarMensaje("⚠️ No se encontró el gráfico");
    return;
  }

  // Obtener datos directamente del gráfico
  const option = myChart.getOption();
  const series = option.series.find(s => s.type === 'candlestick');
  if (!series || !series.data || series.data.length < 3) {
    mostrarMensaje("⚠️ No hay suficientes velas para calcular pivotes");
    return;
  }

  // Si ya está activo → limpiar y salir
  if (pivotesActivo) {
    myChart.setOption({ graphic: [] }, { replaceMerge: ['graphic'] });
    pivotesActivo = false;
    mostrarMensaje("❌ Zonas de pivote eliminadas");
    return;
  }

  const tolerancia = parseFloat(document.getElementById("tol").value) || 5;
  mostrarMensaje(`🔎 Calculando zonas de pivote con tolerancia ${tolerancia}`);

  // Conteo de niveles usando Close
  const conteo = {};
  series.data.forEach(d => {
    const nivel = parseFloat(d[1].toFixed(2)); // Close está en índice 1
    conteo[nivel] = (conteo[nivel] || 0) + 1;
  });

  let pivotes = Object.keys(conteo)
    .filter(nivel => conteo[nivel] >= 4) // mínimo 4 repeticiones
    .map(Number);

  if (pivotes.length === 0) {
    mostrarMensaje("⚠️ No se detectaron niveles repetidos suficientes");
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

  // Dibujar rectángulos en el gráfico
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

  myChart.setOption({ graphic: graphics }, { replaceMerge: ['graphic'] });
  pivotesActivo = true;
  mostrarMensaje(`✅ Se añadieron ${zonas.length} zonas de pivote al gráfico`);
}

// Botón
document.getElementById("btn-pivotes")?.addEventListener("click", () => {
  mostrarZonasPivote();
});
