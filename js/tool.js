document.addEventListener("DOMContentLoaded", () => {
  const chartDom = document.getElementById("kline-chart");
  const myChart = window.myChart; // inicializado en index.js
  const lineaBtn = document.getElementById("linea");

  if (!myChart) {
    console.error("❌ myChart no está inicializado");
    return;
  }

  let lineaActiva = false;
  let primerPunto = null;
  let lineas = [];
  let selectedLineId = null;

  // Helpers
  const toPixel = (xVal, yVal) => myChart.convertToPixel({ gridIndex: 0 }, [xVal, yVal]);
  const fromPixel = (xPx, yPx) => myChart.convertFromPixel({ gridIndex: 0 }, [xPx, yPx]);
  function getRelativePoint(e) {
    const rect = chartDom.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }

  // Crear menú contextual
  const contextMenu = document.createElement("div");
  contextMenu.style.position = "absolute";
  contextMenu.style.display = "none";
  contextMenu.style.background = "#222";
  contextMenu.style.color = "#fff";
  contextMenu.style.padding = "5px";
  contextMenu.style.border = "1px solid #555";
  contextMenu.innerHTML = `<button id="deleteLineBtn">🗑️ Borrar línea</button>`;
  document.body.appendChild(contextMenu);

  // Botón activar/desactivar modo línea
  lineaBtn.addEventListener("click", () => {
    lineaActiva = !lineaActiva;
    primerPunto = null;
    console.log(lineaActiva ? "📐 Modo línea activado" : "📐 Modo línea desactivado");
  });

  // Clic para marcar puntos
  chartDom.addEventListener("click", (e) => {
    if (!lineaActiva) return;

    const [x, y] = getRelativePoint(e);
    if (!myChart.containPixel({ gridIndex: 0 }, [x, y])) return;

    const dataCoord = fromPixel(x, y);
    if (!dataCoord) return;

    const [fecha, precio] = dataCoord;

    if (!primerPunto) {
      primerPunto = { fecha, precio };
    } else {
      const segundoPunto = { fecha, precio };
      const color = segundoPunto.precio > primerPunto.precio ? "#00b050" : "#d82828";

      const id = "linea-" + (lineas.length + 1);
      lineas.push({ id, p1: primerPunto, p2: segundoPunto, color });

      redraw();
      primerPunto = null;
    }
  });

  // Mousemove para línea temporal
  chartDom.addEventListener("mousemove", (e) => {
    if (!lineaActiva || !primerPunto) return;

    const [x, y] = getRelativePoint(e);
    if (!myChart.containPixel({ gridIndex: 0 }, [x, y])) return;

    const dataCoord = fromPixel(x, y);
    if (!dataCoord) return;

    const [fecha2, precio2] = dataCoord;
    redraw({ x1: primerPunto.fecha, y1: primerPunto.precio, x2: fecha2, y2: precio2 });
  });

  // Detectar clic derecho sobre una línea
  chartDom.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const [x, y] = getRelativePoint(e);

    for (let i = 0; i < lineas.length; i++) {
      const { id, p1, p2 } = lineas[i];
      const p1px = toPixel(p1.fecha, p1.precio);
      const p2px = toPixel(p2.fecha, p2.precio);

      const dist = pointToSegmentDistance(x, y, p1px[0], p1px[1], p2px[0], p2px[1]);
      if (dist < 5) { // tolerancia en píxeles
        selectedLineId = id;
        contextMenu.style.left = e.clientX + "px";
        contextMenu.style.top = e.clientY + "px";
        contextMenu.style.display = "block";
        return;
      }
    }
  });

  // Función auxiliar: distancia de un punto a un segmento
  function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = x1; yy = y1;
    } else if (param > 1) {
      xx = x2; yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Botón borrar línea en menú contextual
  document.getElementById("deleteLineBtn").addEventListener("click", () => {
    if (selectedLineId) {
      lineas = lineas.filter(l => l.id !== selectedLineId);
      redraw(); // redibuja sin esa línea
      contextMenu.style.display = "none";
      console.log("🗑️ Línea borrada:", selectedLineId);
      selectedLineId = null;
    }
  });

  // Ocultar menú contextual al hacer clic fuera
  document.addEventListener("click", () => {
    contextMenu.style.display = "none";
  });

  // Redibujar todas las líneas + temporal
  function redraw(tempLine = null) {
    const graphics = [];

    for (let i = 0; i < lineas.length; i++) {
      const { id, p1, p2, color } = lineas[i];
      const p1px = toPixel(p1.fecha, p1.precio);
      const p2px = toPixel(p2.fecha, p2.precio);
      graphics.push({
        id,
        type: "line",
        shape: { x1: p1px[0], y1: p1px[1], x2: p2px[0], y2: p2px[1] },
        style: { stroke: color, lineWidth: 2 }
      });
    }

    if (tempLine) {
      const p1px = toPixel(tempLine.x1, tempLine.y1);
      const p2px = toPixel(tempLine.x2, tempLine.y2);
      graphics.push({
        id: "linea-temporal",
        type: "line",
        shape: { x1: p1px[0], y1: p1px[1], x2: p2px[0], y2: p2px[1] },
        style: { stroke: "#999", lineWidth: 1, lineDash: [4, 4] }
      });
    }

    myChart.setOption({ graphic: graphics }, false);
  }

  // Redibujar al hacer zoom o resize
  myChart.on("dataZoom", () => redraw());
  window.addEventListener("resize", () => redraw());
});
