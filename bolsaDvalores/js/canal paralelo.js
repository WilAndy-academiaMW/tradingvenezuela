// =========================
// Estado global
// =========================
let canalActivo = false;
let canalClicks = 0;
let puntosCanal = [];

// =========================
function mostrarMensaje(texto) {
  const mensajeDiv = document.getElementById('mensaje');
  if (mensajeDiv) mensajeDiv.textContent = texto;
  console.log(texto);
}

// =========================
// Canal + Fibonacci (extiende hasta el inicio y fin del gráfico)
// =========================
function activarCanal() {
  const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!chart) {
    console.error("Canal: no hay gráfico activo.");
    return;
  }

  canalActivo = true;
  canalClicks = 0;
  puntosCanal = [];
  chart.off('click');

  mostrarMensaje("Canal activado. Haz clic en dos velas para definir canal + Fibonacci.");

  chart.on('click', function (params) {
    if (!canalActivo) return;
    if (params.seriesType !== 'candlestick') return;

    const fecha = params.name;
    const valores = params.data;

    // Tu SCG actual: bajo en [3], alto en [4]
    const precioBajo = valores[3];
    const precioAlto = valores[4];

    puntosCanal.push({ fecha, alto: precioAlto, bajo: precioBajo });
    canalClicks++;

    mostrarMensaje(`Click ${canalClicks}: ${fecha} → Alto: ${precioAlto}, Bajo: ${precioBajo}`);

    if (canalClicks % 2 === 0) {
      const p1 = puntosCanal[canalClicks - 2];
      const p2 = puntosCanal[canalClicks - 1];

      const altoMayor = Math.max(p1.alto, p2.alto);
      const bajoMenor = Math.min(p1.bajo, p2.bajo);
      const rango = altoMayor - bajoMenor;

      const option = chart.getOption();
      const fechas = option.xAxis[0].data;
      const fechaInicio = fechas[0];
      const fechaFin = fechas[fechas.length - 1];

      const series = option.series.slice();
      const idxVela = series.findIndex(s => (s.type === 'candlestick'));
      if (idxVela === -1) return;

      if (!series[idxVela].markLine) {
        series[idxVela].markLine = { data: [] };
      }

      // Canal superior e inferior (sin flechas ni etiquetas)
      series[idxVela].markLine.data.push([
        { coord: [fechaInicio, altoMayor], lineStyle: { color: '#00ff00', width: 2 }, label: { show: false } },
        { coord: [fechaFin, altoMayor],   lineStyle: { color: '#00ff00', width: 2 }, label: { show: false } }
      ]);
      series[idxVela].markLine.data.push([
        { coord: [fechaInicio, bajoMenor], lineStyle: { color: '#ff0000', width: 2 }, label: { show: false } },
        { coord: [fechaFin, bajoMenor],    lineStyle: { color: '#ff0000', width: 2 }, label: { show: false } }
      ]);

      // Líneas Fibonacci (5 niveles, sin etiquetas)
      const fibLevels = [0.236, 0.382, 0.5, 0.618, 0.786];
      fibLevels.forEach(f => {
        const nivel = bajoMenor + rango * f;
        series[idxVela].markLine.data.push([
          { coord: [fechaInicio, nivel], lineStyle: { type: 'linea', color: '#2b00ffff', width: 3 }, label: { show: false } },
          { coord: [fechaFin, nivel],    lineStyle: { type: 'dashed', color: '#ffaa00', width: 3 }, label: { show: false } }
        ]);
      });

      chart.setOption({ series }, { replaceMerge: ['series'] });
      mostrarMensaje(`Canal + Fibonacci dibujados de ${fechaInicio} a ${fechaFin}`);
    }
  });
}

function desactivarCanal() {
  const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!chart) return;

  const option = chart.getOption();
  const series = option.series.slice();
  const idxVela = series.findIndex(s => (s.type === 'candlestick'));
  if (idxVela !== -1) {
    series[idxVela].markLine = { data: [] };
    chart.setOption({ series }, { replaceMerge: ['series'] });
  }

  canalActivo = false;
  canalClicks = 0;
  puntosCanal = [];
  chart.off('click');
  mostrarMensaje("Canal desactivado. Líneas borradas.");
}

// =========================
// Listener correcto para el botón con id "btn-Canal"
// =========================
window.addEventListener('DOMContentLoaded', () => {
  const btnCanal = document.getElementById("btn-Canal");
  if (!btnCanal) {
    console.error('No se encontró el botón con id "btn-Canal".');
    return;
  }
  btnCanal.addEventListener("click", () => {
    if (canalActivo) {
      desactivarCanal();
    } else {
      activarCanal();
    }
  });
});
