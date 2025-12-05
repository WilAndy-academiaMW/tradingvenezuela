let isOndasVisible = false;
let elliottClicks = [];

function mostrarMensaje(texto) {
  const mensajeDiv = document.getElementById('mensaje');
  if (mensajeDiv) mensajeDiv.textContent = texto;
}

window.mostrarOndas = function () {
  const myChart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!myChart) return;

  if (isOndasVisible) {
    // Restaurar zoom normal y limpiar ondas
    myChart.setOption({
      dataZoom: [
        { type: 'inside', minValueSpan: 5 },
        { type: 'slider', minValueSpan: 5 }
      ]
    });
    const option = myChart.getOption();
    const soloVelas = option.series.filter(s => s.type === 'candlestick');
    myChart.setOption({ series: soloVelas }, { replaceMerge: ['series'] });
    elliottClicks = [];
    isOndasVisible = false;
    mostrarMensaje("Ondas desactivadas.");
    return;
  }

  // Activar modo ondas → quitar zoom inside
  elliottClicks = [];
  isOndasVisible = true;
  myChart.setOption({ dataZoom: [] });
  mostrarMensaje("Ondas activadas. Haz clics para marcar las ondas.");

  myChart.off('click');
  myChart.on('click', function (params) {
    if (!isOndasVisible) return;
    if (!params || !params.data) return;

    const fecha = params.name;
    const open  = params.data[1]; // apertura
    const close = params.data[2]; // cierre
    const low   = params.data[3]; // mecha baja
    const high  = params.data[4]; // mecha alta

   
    
   

    elliottClicks.push({ fecha, high, low });

    const n = elliottClicks.length;
    if (n === 1) {
  mostrarMensaje(`Click 1: ${fecha}, High ${high}, Low ${low}, `);
}

    else if (n === 2) mostrarMensaje(`Click 2: ${fecha}, High ${high}, Low ${low}`);
    else if (n === 3) mostrarMensaje(`Click 3: ${fecha}, High ${high}, Low ${low} → listo para Onda 2`);
    else if (n === 4) mostrarMensaje(`Click 4: ${fecha}, High ${high}, Low ${low} → listo para Onda 3`);
    else if (n === 5) mostrarMensaje(`Click 5: ${fecha}, High ${high}, Low ${low} → listo para Onda 4`);
  });

  // Botón Onda 1
  document.getElementById("ondas1").onclick = () => {
    if (elliottClicks.length < 2) {
      mostrarMensaje("Necesitas 2 clics para Onda 1.");
      return;
    }
    dibujarOnda1(myChart);
  };

  // Botón Onda 2
  document.getElementById("ondas2").onclick = () => {
    if (elliottClicks.length < 3) {
      mostrarMensaje("Necesitas 3 clics para Onda 2.");
      return;
    }
    dibujarOnda2(myChart);
  };

  // Botón Onda 3
  document.getElementById("ondas3").onclick = () => {
    if (elliottClicks.length < 4) {
      mostrarMensaje("Necesitas 4 clics para Onda 3.");
      return;
    }
    dibujarOnda3(myChart);
  };
  document.getElementById("ondas4").onclick = () => {
    if (elliottClicks.length < 4) {
      mostrarMensaje("Necesitas 5 clics para Onda 4.");
      return;
    }
    dibujarOnda4(myChart);
  };
};

// -------------------- ONDA 1 --------------------
function dibujarOnda1(myChart) {
  const p1 = elliottClicks[0]; // primer clic
  const p2 = elliottClicks[1]; // segundo clic

  let puntoA, puntoB, color;
  if (p1.low < p2.high) {
    puntoA = p1.low;
    puntoB = p2.high;
    color = 'green'; // alcista
  } else {
    puntoA = p1.high;
    puntoB = p2.low;
    color = 'red'; // bajista
  }

  const option = myChart.getOption();
  const nuevasSeries = option.series.slice();

  nuevasSeries.push({
    id: 'onda1',
    type: 'line',
    data: [[p1.fecha, puntoA], [p2.fecha, puntoB]],
    lineStyle: { color, width: 2 },
    symbol: 'circle',
    symbolSize: 8,
    itemStyle: { color },
    label: {
      show: true,
      position: 'middle',
      formatter: 'Onda 1',
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 20
    }
  });

  myChart.setOption({ series: nuevasSeries }, { replaceMerge: ['series'] });
  mostrarMensaje(`Onda 1 trazada (${color === 'green' ? 'alcista' : 'bajista'})`);
}


// -------------------- ONDA 2 --------------------
function dibujarOnda2(myChart) {
  const p1 = elliottClicks[0];
  const p2 = elliottClicks[1];
  const p3 = elliottClicks[2];

  const precioInicio = p1.low < p2.high ? p1.low : p1.high;
  const precioFin = p1.low < p2.high ? p2.high : p2.low;

  const retroceso = ((precioFin - p3.low) / (precioFin - precioInicio)) * 100;

  let color = 'yellow';
  if (retroceso >= 50 && retroceso <= 75) {
    color = 'red';
  }

  const option = myChart.getOption();
  const nuevasSeries = option.series.slice();

  // Determinar si la onda es bajista o alcista
const esBajista = p1.low > p2.high; // ejemplo de criterio: si el inicio está más alto que el fin

// Punto final depende de la dirección
const puntoFinal = esBajista ? p3.high : p3.low;

nuevasSeries.push({
  id: 'onda2',
  type: 'line',
  data: [[p2.fecha, precioFin], [p3.fecha, puntoFinal]],
  lineStyle: { color, width: 2 },
  symbol: 'circle',
  symbolSize: 8,
  itemStyle: { color },
  label: {
    show: true,
    position: 'middle',
    formatter: `Onda 2 (${retroceso.toFixed(1)}%)`,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20
  }
});


  myChart.setOption({ series: nuevasSeries }, { replaceMerge: ['series'] });
  mostrarMensaje(`Onda 2 trazada con retroceso ${retroceso.toFixed(1)}% → ${color}`);
}

// Botón Onda 3
document.getElementById("ondas3").onclick = () => {
  const myChart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!myChart) return;
  if (elliottClicks.length < 4) {
    mostrarMensaje("Necesitas 4 clics para Onda 3.");
    return;
  }
  dibujarOnda3(myChart);
};

// -------------------- ONDA 3 --------------------
function dibujarOnda3(myChart) {
  const p1 = elliottClicks[0]; // inicio onda 1
  const p2 = elliottClicks[1]; // fin onda 1
  const p3 = elliottClicks[2]; // retroceso onda 2
  const p4 = elliottClicks[3]; // fin onda 3

  console.log(">>> Datos recibidos para Onda 3:");
  console.log("p1:", p1);
  console.log("p2:", p2);
  console.log("p3:", p3);
  console.log("p4:", p4);

  // Longitud de Onda 1 (mechas)
  const lenOnda1 = Math.abs(p2.high - p1.low);
  // Extensión de Onda 3 (mechas)
  const lenOnda3 = Math.abs(p4.high - p3.low);
  const extension = (lenOnda3 / lenOnda1) * 100;

  console.log("Longitud Onda1:", lenOnda1, "Longitud Onda3:", lenOnda3, "Extensión %:", extension);

  let color = 'yellow';
  if (extension >= 165) color = 'green';

  // 👉 Determinar dirección de la onda (alcista/bajista)
  const esBajista = p1.low > p2.high;
  const puntoInicio = esBajista ? p3.high : p3.low;
  const puntoFinal  = esBajista ? p4.low  : p4.high;

  console.log("Dirección esBajista:", esBajista, "puntoInicio:", puntoInicio, "puntoFinal:", puntoFinal);

  const option = myChart.getOption();
  const nuevasSeries = option.series.slice();

  // Línea de Onda 3
  nuevasSeries.push({
    id: 'onda3',
    type: 'line',
    data: [[p3.fecha, puntoInicio], [p4.fecha, puntoFinal]],
    lineStyle: { color, width: 2 },
    symbol: 'circle',
    symbolSize: 8,
    itemStyle: { color },
    label: {
      show: true,
      position: 'middle',
      formatter: `Onda 3 (${extension.toFixed(1)}%)`,
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 20
    }
  });

  // 👉 Rectángulo usando datos del click 2 (p2)
  nuevasSeries.push({
    id: 'rectOnda3',
    type: 'custom',
    renderItem: function (params, api) {
      const openVal  = p2.open;
      const closeVal = p2.close;
      const lowVal   = p2.low;
      const highVal  = p2.high;

      console.log(">>> Datos vela p2:", p2);
      console.log("open:", openVal, "close:", closeVal, "low:", lowVal, "high:", highVal);

      const techo = Math.max(openVal, closeVal);
      const piso  = Math.min(openVal, closeVal);

      console.log("techo:", techo, "piso:", piso);

      const yTop    = api.coord([p2.fecha, esBajista ? highVal : techo])[1];
      const yBottom = api.coord([p2.fecha, esBajista ? piso : lowVal])[1];

      const x1 = api.coord([p2.fecha, techo])[0];
      const x2 = api.coord([p4.fecha, techo])[0];

      console.log("Coords rectángulo → x1:", x1, "x2:", x2, "yTop:", yTop, "yBottom:", yBottom);

      return {
        type: 'rect',
        shape: {
          x: Math.min(x1, x2),
          y: Math.min(yTop, yBottom),
          width: Math.abs(x2 - x1),
          height: Math.abs(yBottom - yTop)
        },
        style: {
          fill: 'rgba(255, 255, 0, 0.25)',
          stroke: color,
          lineWidth: 2
        }
      };
    }
  });

  myChart.setOption({ series: nuevasSeries }, { replaceMerge: ['series'] });
  mostrarMensaje(`Onda 3 trazada con extensión ${extension.toFixed(1)}% → ${color}`);
}



// Botón Onda 4
function dibujarOnda4(myChart) {
  const p2 = elliottClicks[1]; // fin onda 1
  const p3 = elliottClicks[2]; // retroceso onda 2
  const p4 = elliottClicks[3]; // fin onda 3
  const p5 = elliottClicks[4]; // retroceso onda 4

  console.log(">>> Datos Onda 4:", { p2, p3, p4, p5 });

  // Retroceso de Onda 4 respecto a Onda 3
  const retroceso = ((p4.high - p5.low) / (p4.high - p3.low)) * 100;
  console.log("Retroceso %:", retroceso);

  let color = 'yellow';
  if (retroceso >= 20 && retroceso <= 30) {
    color = 'green';
  }

  // 👉 Determinar dirección de la onda (alcista/bajista)
  const esBajista = p2.low > p3.high;
  const puntoInicio = esBajista ? p4.high : p4.low;
  const puntoFinal  = esBajista ? p5.high : p5.low;

  console.log("Dirección esBajista:", esBajista, "puntoInicio:", puntoInicio, "puntoFinal:", puntoFinal);

  const option = myChart.getOption();
  const nuevasSeries = option.series.slice();

  nuevasSeries.push({
    id: 'onda4',
    type: 'line',
    data: [[p4.fecha, puntoInicio], [p5.fecha, puntoFinal]],
    lineStyle: { color, width: 2 },
    symbol: 'circle',
    symbolSize: 8,
    itemStyle: { color },
    label: {
      show: true,
      position: 'middle',
      formatter: `Onda 4 (${retroceso.toFixed(1)}%)`,
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 20
    }
  });

  myChart.setOption({ series: nuevasSeries }, { replaceMerge: ['series'] });
  mostrarMensaje(`Onda 4 trazada con retroceso ${retroceso.toFixed(1)}% → ${color}`);
}

// Botón Onda 5
document.getElementById("ondas5").onclick = () => {
  const myChart = echarts.getInstanceByDom(document.getElementById("chart-container"));
  if (!myChart) return;
  if (elliottClicks.length < 6) {
    mostrarMensaje("Necesitas 6 clics para Onda 5.");
    return;
  }
  dibujarOnda5(myChart);
};

// -------------------- ONDA 4 --------------------

// -------------------- ONDA 5 --------------------
function dibujarOnda5(myChart) {
  const p4 = elliottClicks[3]; // fin onda 3
  const p5 = elliottClicks[4]; // retroceso onda 4
  const p6 = elliottClicks[5]; // fin onda 5

  // Extensión de Onda 5 respecto a Onda 4
  const extension = ((p6.high - p5.low) / (p4.high - p5.low)) * 100;

  const option = myChart.getOption();
  const nuevasSeries = option.series.slice();

  // Línea de Onda 5
  nuevasSeries.push({
    id: 'onda5',
    type: 'line',
    data: [[p5.fecha, p5.low], [p6.fecha, p6.high]],
    lineStyle: { color: '#00ff00', width: 2 },
    symbol: 'circle',
    symbolSize: 8,
    itemStyle: { color: '#00ff00' },
    label: {
      show: true,
      position: 'middle',
      formatter: `Onda 5 (${extension.toFixed(1)}%)`,
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 20
    }
  });

  // 👉 Rectángulo vertical hasta 120%
  nuevasSeries.push({
    id: 'rectOnda5',
    type: 'custom',
    renderItem: function (params, api) {
      const x1 = api.coord([p5.fecha, p5.low])[0];
      const x2 = api.coord([p6.fecha, p6.high])[0];
      const yBase = api.coord([p5.fecha, p5.low])[1];
      const yTop = api.coord([p6.fecha, p5.low * 1.2])[1]; // 120%

      return {
        type: 'rect',
        shape: {
          x: Math.min(x1, x2),
          y: Math.min(yBase, yTop),
          width: Math.abs(x2 - x1),
          height: Math.abs(yTop - yBase)
        },
        style: {
          fill: 'rgba(0,255,0,0.25)',
          stroke: '#00ff00',
          lineWidth: 2
        }
      };
    }
  });

  myChart.setOption({ series: nuevasSeries }, { replaceMerge: ['series'] });
  mostrarMensaje(`Onda 5 trazada con extensión ${extension.toFixed(1)}% y rectángulo hasta 120%`);
}


document.getElementById("btn-ondas").addEventListener("click", () => window.mostrarOndas());
