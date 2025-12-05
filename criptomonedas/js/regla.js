let reglaActiva = false;
let reglaClicks = 0;
let puntosRegla = [];

function mostrarMensaje(texto) {
  const mensajeDiv = document.getElementById('mensaje');
  if (mensajeDiv) mensajeDiv.textContent = texto;
  console.log(texto); // 👈 también lo mostramos en consola
}

window.mostrarRegla = function () {
  const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!chart) {
    console.error("Regla: no hay gráfico activo.");
    return;
  }

  // Resetear estados
  reglaActiva = false;
  reglaClicks = 0;
  puntosRegla = [];

  // Quitar eventos previos
  chart.off('click');

  // Conectar botón
  document.getElementById('btn-regla').onclick = () => {
    if (reglaActiva) {
      // Si estaba activa → limpiar todas las reglas
      const option = chart.getOption();
      const series = option.series.slice();
      const idxVela = series.findIndex(s => (s.type === 'candlestick'));
      if (idxVela !== -1) {
        series[idxVela].markArea = { data: [] };
        chart.setOption({ series }, { replaceMerge: ['series'] });
      }
      reglaActiva = false;
      reglaClicks = 0;
      puntosRegla = [];
      mostrarMensaje("Regla desactivada. Todas las reglas borradas.");
    } else {
      // Activar regla
      reglaActiva = true;
      reglaClicks = 0;
      puntosRegla = [];
      mostrarMensaje("Regla activada. Haz clic en dos velas para dibujar una regla.");
    }
  };

  // Registrar evento de clic
  chart.on('click', function (params) {
    if (!reglaActiva) return;
    if (params.seriesType !== 'candlestick') return;

    const fecha = params.name;
    const valores = params.data;
    const precioCierre = valores[1];

    puntosRegla.push({ fecha, precio: precioCierre });
    reglaClicks++;

    mostrarMensaje(`Click ${reglaClicks}: ${fecha} → USD ${precioCierre.toFixed(2)}`);

    // Cada dos clics → dibujar una regla
    if (reglaClicks % 2 === 0) {
      const p1 = puntosRegla[reglaClicks - 2];
      const p2 = puntosRegla[reglaClicks - 1];

      const esSubida = p2.precio > p1.precio;
      const porcentaje = esSubida
        ? (((p2.precio - p1.precio) / p1.precio) * 100).toFixed(2) + "%"
        : (((p1.precio - p2.precio) / p1.precio) * 100).toFixed(2) + "%";

      const colorFondo = esSubida ? 'rgba(0,255,0,0.25)' : 'rgba(255,0,0,0.25)';
      const colorBorde = esSubida ? '#00ff00' : '#ff0000';

      const yMin = Math.min(p1.precio, p2.precio);
      const yMax = Math.max(p1.precio, p2.precio);

      const option = chart.getOption();
      const series = option.series.slice();
      const idxVela = series.findIndex(s => (s.type === 'candlestick'));
      if (idxVela === -1) return;

      if (!series[idxVela].markArea) {
        series[idxVela].markArea = { data: [] };
      }

      series[idxVela].markArea.data.push([
        {
          name: porcentaje,
          coord: [p1.fecha, yMin],
          itemStyle: {
            color: colorFondo,
            borderColor: colorBorde,
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'inside',
            color: '#fff',
            fontWeight: 'bold',
            formatter: porcentaje,
            fontSize:25
          }
        },
        {
          coord: [p2.fecha, yMax]
        }
      ]);

      chart.setOption({ series }, { replaceMerge: ['series'] });
      mostrarMensaje(`Se dibujó regla entre ${p1.fecha} y ${p2.fecha} → ${porcentaje}`);
      console.log("Rectángulo dibujado:", p1, p2, porcentaje); // 👈 log extra en consola
    }
  });
  document.getElementById('btn-regla').onclick = () => {
  const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!chart) return;

  if (reglaActiva) {
    // 🔴 Si estaba activa → limpiar todas las reglas
    const option = chart.getOption();
    const series = option.series.slice();
    const idxVela = series.findIndex(s => (s.type === 'candlestick'));
    if (idxVela !== -1) {
      series[idxVela].markArea = { data: [] }; // vaciar todas las áreas
      chart.setOption({ series }, { replaceMerge: ['series'] });
    }
    reglaActiva = false;
    reglaClicks = 0;
    puntosRegla = [];
    mostrarMensaje("Regla desactivada. Todas las reglas borradas.");
    console.log("Todas las reglas eliminadas.");
  } else {
    // 🟢 Si estaba apagada → activar
    reglaActiva = true;
    reglaClicks = 0;
    puntosRegla = [];
    mostrarMensaje("Regla activada. Haz clic en dos velas para dibujar una regla.");
    console.log("Regla activada, esperando clics...");
  }
};

};




document.getElementById("btn-regla").addEventListener("click", () => window.mostrarRegla());
