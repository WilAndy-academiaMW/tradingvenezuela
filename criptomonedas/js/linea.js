// -------------------- VARIABLES --------------------
let tendenciaClicks = [];
let modoTendencia = false;

// -------------------- BOTÓN ACTIVAR TENDENCIA --------------------
document.getElementById("btn-tendencia").onclick = () => {
  tendenciaClicks = [];
  modoTendencia = true;
  mostrarMensaje("Selecciona el primer punto de la línea de tendencia (clic sobre la vela).");
};

// -------------------- CAPTURA DE CLICS --------------------
myChart.on('click', function (params) {
  if (!modoTendencia) return;

  // Solo aceptar clics sobre la serie de velas
  if (params.componentType !== 'series' || params.seriesType !== 'candlestick') {
    mostrarMensaje("Clic fuera de velas. Toca la vela para marcar wick.");
    return;
  }

  const idx   = params.dataIndex;
  const data  = params.data; // [open, close, low, high]
  const fecha = params.name;
  const open  = data[0];
  const close = data[1];
  const low   = data[2];
  const high  = data[3];

  // Snap al wick más cercano según coordenada Y del clic
  const yClick = myChart.convertFromPixel({ yAxisIndex: 0 }, params.event.offsetY);
  const useHigh = Math.abs(yClick - high) <= Math.abs(yClick - low);
  const yWick = useHigh ? high : low;

  tendenciaClicks.push({
    fecha, idx, open, close, low, high,
    yWick,
    wickType: useHigh ? 'high' : 'low'
  });

  if (tendenciaClicks.length === 1) {
    mostrarMensaje(`Click 1: ${fecha} (${useHigh ? 'HIGH' : 'LOW'}). Selecciona el segundo punto.`);
  } else if (tendenciaClicks.length === 2) {
    mostrarMensaje(`Click 2: ${fecha} (${useHigh ? 'HIGH' : 'LOW'}). Ajusta el rango y dibuja.`);
    modoTendencia = false;
  }
});

// -------------------- RANGO --------------------
document.getElementById("range-linea").addEventListener("input", e => {
  const valor = e.target.value;
  document.getElementById("range-label").innerText = valor + "%";
  if (tendenciaClicks.length === 2) {
    mostrarMensaje(`Moverás la línea con un rango de ${valor}%`);
  }
});

// -------------------- BOTÓN DIBUJAR --------------------
document.getElementById("dibujar").onclick = () => {
  const myChart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!myChart) return;

  if (tendenciaClicks.length < 2) {
    mostrarMensaje("Necesitas 2 clics (sobre velas) para la línea de tendencia.");
    return;
  }

  dibujarTendencia(myChart);
  tendenciaClicks = [];
};

// -------------------- FUNCIÓN DIBUJAR TENDENCIA --------------------
function dibujarTendencia(myChart) {
  const p0 = tendenciaClicks[0];
  const p1 = tendenciaClicks[1];

  const yInicio = p0.yWick;
  const yFinal  = p1.yWick;
  const esBajista = yInicio > yFinal;

  const rangeValue = parseInt(document.getElementById("range-linea").value, 10);
  const fechas = myChart.getOption().xAxis[0].data;
  const totalVelas = fechas.length;
  const extraVelas = Math.floor((rangeValue / 100) * totalVelas);

  const idxExtendido = Math.min(p1.idx + extraVelas, totalVelas - 1);
  const fechaExtendida = fechas[idxExtendido];

  const option = myChart.getOption();
  const nuevasSeries = option.series.slice();

  const uniqueId = "lineaTendencia_" + Date.now();

  nuevasSeries.push({
    id: uniqueId,
    type: 'line',
    data: [[p0.fecha, yInicio], [fechaExtendida, yFinal]],
    lineStyle: { color: esBajista ? 'red' : 'green', width: 2 },
    symbol: 'none'
  });

  myChart.setOption({ series: nuevasSeries }, { replaceMerge: ['series'] });

  mostrarMensaje(
    `✅ Línea de tendencia sobre mechas (${esBajista ? 'bajista' : 'alcista'}) ` +
    `desde ${p0.wickType.toUpperCase()} a ${p1.wickType.toUpperCase()} con extensión ${rangeValue}%`
  );
}
