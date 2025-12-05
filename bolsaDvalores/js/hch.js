// -------------------- VARIABLES --------------------
let modoHCH = false;
let clicks = []; // almacena todos los clics en orden
let lineasHCH = []; // líneas dibujadas

// -------------------- BOTÓN ACTIVAR HCH --------------------
// -------------------- BOTÓN ACTIVAR/DESACTIVAR HCH --------------------
document.getElementById("btn-hch").onclick = () => {
  if (!modoHCH) {
    // Activar
    modoHCH = true;
    clicks = [];
    lineasHCH = [];
    mostrarMensaje("📌 HCH activado, haz click en las velas.");
  } else {
    // Desactivar
    modoHCH = false;
    clicks = [];
    lineasHCH = [];
    actualizarLineas(); // limpia las líneas del gráfico
    mostrarMensaje("❌ HCH desactivado.");
  }
};

// -------------------- CAPTURA DE CLIC EN VELAS --------------------
myChart.on('click', function (params) {
  if (!modoHCH) return;
  if (params.componentType !== 'series' || params.seriesType !== 'candlestick') return;

  const vela = params.data; // [open, close, low, high]
  const fecha = params.name;
  const open  = vela[0];
  const high  = vela[1];
  const low   = vela[2];
  const close = vela[3];
 
  clicks.push({ xAxis: fecha, open, close, low, high });

  // Mensaje general de valores
  mostrarMensaje(`📍 Click ${clicks.length} en ${fecha} → O:${open} C:${close} L:${low} H:${high}`);

  // Mensajes especiales SOLO en los clics 2, 4 y 6
  switch (clicks.length) {
    case 2:
      mostrarMensaje("🟢 Punto del Hombro Izquierdo (HI) registrado.");
      break;
    case 4:
      mostrarMensaje("🔵 Punto de la Cabeza registrado.");
      break;
    case 6:
      mostrarMensaje("🟣 Punto del Hombro Derecho (HD) registrado.");
      break;
  }
});

// -------------------- BOTÓN HOMBRO IZQUIERDO --------------------
document.getElementById("hi").onclick = () => {
  if (clicks.length < 3) {
    mostrarMensaje("⚠️ Necesitas 3 clics para el Hombro Izquierdo.");
    return;
  }

  lineasHCH.push([
    { name: 'HI-1', xAxis: clicks[0].xAxis, yAxis: clicks[0].low },
    { xAxis: clicks[1].xAxis, yAxis: clicks[1].high }
  ]);
  lineasHCH.push([
    { name: 'HI-2', xAxis: clicks[1].xAxis, yAxis: clicks[1].high },
    { xAxis: clicks[2].xAxis, yAxis: clicks[2].low }
  ]);

  actualizarLineas();
  mostrarMensaje(`✅ Hombro Izquierdo trazado con puntos ${clicks[0].xAxis}, ${clicks[1].xAxis}, ${clicks[2].xAxis}`);
};

// -------------------- BOTÓN CABEZA --------------------
document.getElementById("cabeza").onclick = () => {
  if (clicks.length < 5) {
    mostrarMensaje("⚠️ Necesitas 5 clics para la Cabeza.");
    return;
  }

  lineasHCH.push([
    { name: 'Cabeza-1', xAxis: clicks[2].xAxis, yAxis: clicks[2].low },
    { xAxis: clicks[3].xAxis, yAxis: clicks[3].high }
  ]);
  lineasHCH.push([
    { name: 'Cabeza-2', xAxis: clicks[3].xAxis, yAxis: clicks[3].high },
    { xAxis: clicks[4].xAxis, yAxis: clicks[4].low }
  ]);

  actualizarLineas();
  mostrarMensaje(`✅ Cabeza trazada entre ${clicks[3].xAxis} y ${clicks[4].xAxis}`);
};

// -------------------- BOTÓN HOMBRO DERECHO --------------------
document.getElementById("hd").onclick = () => {
  if (clicks.length < 7) {
    mostrarMensaje("⚠️ Necesitas 7 clics para el Hombro Derecho.");
    return;
  }

  lineasHCH.push([
    { name: 'HD-1', xAxis: clicks[4].xAxis, yAxis: clicks[4].low },
    { xAxis: clicks[5].xAxis, yAxis: clicks[5].high }
  ]);
  lineasHCH.push([
    { name: 'HD-2', xAxis: clicks[5].xAxis, yAxis: clicks[5].high },
    { xAxis: clicks[6].xAxis, yAxis: clicks[6].low }
  ]);
  // -------------------- CÁLCULO DEL HOMBRO DERECHO --------------------
const hombroIzq = clicks[2].high;   // altura hombro izquierdo
const hombroDer = clicks[4].high;   // altura hombro derecho
const diferencia = hombroDer - hombroIzq;
const porcentajeHD = ((diferencia / hombroIzq) * 100).toFixed(2);

mostrarMensaje(`📈 Especulación: el hombro derecho podría subir ≈ ${porcentajeHD}% respecto al hombro izquierdo.`);


  actualizarLineas();
  mostrarMensaje(`✅ Hombro Derecho trazado con puntos ${clicks[5].xAxis}, ${clicks[6].xAxis}`);
  
  // -------------------- LÍNEA DE CUELLO --------------------
  const necklineY = (clicks[0].low + clicks[6].low) / 2; // promedio lows hombros
  const cabezaY = clicks[3].high; // punto alto de la cabeza
  const altura = cabezaY - necklineY;
  const porcentaje = ((altura / necklineY) * 100).toFixed(2);

  // Agregar neckline
  lineasHCH.push([
    { name: 'Neckline', xAxis: clicks[0].xAxis, yAxis: clicks[0].low },
    { xAxis: clicks[6].xAxis, yAxis: clicks[6].low }
  ]);

  // Texto en el medio de la neckline
  const midIndex = Math.floor((0 + 6) / 2);
  const midX = clicks[midIndex].xAxis;

  myChart.setOption({
    series: [{
      markPoint: {
        data: [
          {
            name: 'Objetivo',
            xAxis: midX,
            yAxis: necklineY,
            value: porcentaje + '%',
            label: {
              show: true,
              fontSize: 16,
              color: '#00ff00'
            }
          }
        ]
      }
    }]
  });

  mostrarMensaje(`📉 Neckline trazada. Altura: ${altura.toFixed(2)} → Objetivo ≈ ${porcentaje}%`);
};

// -------------------- FUNCIÓN PARA ACTUALIZAR LÍNEAS --------------------
function actualizarLineas() {
  myChart.setOption({
    series: [{
      markLine: {
        symbol: ['circle','circle'],
        lineStyle: { 
          color: '#ff0000',
          type: 'solid',
          width: 3
        },
        label: {
          show: true,
          fontSize: 14,
          color: '#ffffff'
        },
        data: lineasHCH
      }
    }]
  });
}

// -------------------- FUNCIÓN PARA MENSAJES --------------------
// -------------------- FUNCIÓN PARA MENSAJES --------------------
function mostrarMensaje(msg) {
  // Mostrar en consola (para debug)
  console.log(msg);

  // Mostrar en el div con id="mensaje"
  const contenedor = document.getElementById("mensaje");
  if (contenedor) {
    contenedor.innerText = msg; // reemplaza el texto
    // Si quieres acumular mensajes en vez de reemplazar:
    // contenedor.innerHTML += msg + "<br>";
  }
}

