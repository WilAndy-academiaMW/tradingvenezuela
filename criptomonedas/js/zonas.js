// -------------------- VARIABLES --------------------
let zonasMarkArea = [];

// -------------------- BOTÓN ACTIVAR ZONAS --------------------
document.getElementById("btn-zonas").onclick = () => {
  // Ya no borramos las zonas aquí, solo mostramos mensaje
  mostrarMensaje("📌 Haz clic en una vela para marcar su zona.");
};

// -------------------- CAPTURA DE CLIC --------------------
myChart.on('click', function (params) {
  if (params.componentType !== 'series' || params.seriesType !== 'candlestick') return;

  const vela = params.data; 
  const fechaClic = params.name; 

  const open  = vela[0];
  const close = vela[1];
  const low   = vela[2];
  const high  = vela[3];

  // Invertimos la lógica de colores
  const esAlcista = close > open;
  const color = esAlcista ? 'rgba(255,0,0,0.2)' : 'rgba(0,255,0,0.2)'; // alcista → rojo, bajista → verde
  const borde = esAlcista ? '#ff0000' : '#00ff00';
  const tipoZona = esAlcista ? 'OFERTA' : 'DEMANDA';

  // Obtenemos todas las fechas actuales del eje X
  const opcionesActuales = myChart.getOption();
  const datosEjeX = opcionesActuales.xAxis[0].data; 
  const fechaFin = datosEjeX[datosEjeX.length - 1];

  const nuevaZona = [
    {
      name: tipoZona,
      xAxis: fechaClic, 
      yAxis: high,
      itemStyle: {
        color: color,
        borderWidth: 1,
        borderColor: borde
      }
    },
    {
      xAxis: fechaFin,
      yAxis: low
    }
  ];

  zonasMarkArea.push(nuevaZona);

  myChart.setOption({
    series: [{
      markArea: {
        silent: true,
        data: zonasMarkArea
      }
    }]
  });

  mostrarMensaje(`✅ Zona de ${tipoZona} fijada en ${fechaClic}: ${low} - ${high}`);
});

// -------------------- LIMPIAR SOLO AL CAMBIAR DE GRÁFICO --------------------
function limpiarZonas() {
  zonasMarkArea = [];
  myChart.setOption({
    series: [{
      markArea: { data: [] }
    }]
  });
  mostrarMensaje("♻️ Zonas borradas al cambiar de gráfico.");
}
