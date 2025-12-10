// ../static/js/main.js

const API_BASE = "http://127.0.0.1:5000";
const tablaBody = document.getElementById("tablaBody");
const saldoTotalEl = document.getElementById("saldoTotal");

let lineChart, barChart;

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
  }
  return res.json();
}

function renderTabla(acciones) {
  tablaBody.innerHTML = "";

  // Parsear cantidades y precios a número
  const parsed = acciones.map(a => ({
    fecha: a.fecha,
    ticker: a.ticker,
    cantidad: Number(a.cantidad || 0),
    precio: Number(a.precio || 0)
  }));

  const totalValor = parsed.reduce((acc, a) => acc + a.cantidad * a.precio, 0);
  saldoTotalEl.textContent = `$${totalValor.toFixed(2)}`;

  parsed.forEach(a => {
    const valor = a.cantidad * a.precio;
    const pct = totalValor > 0 ? (valor / totalValor) * 100 : 0;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.ticker}</td>
      <td>${a.cantidad}</td>
      <td>$${a.precio.toFixed(2)}</td>
      <td>$${valor.toFixed(2)}</td>
      <td>${pct.toFixed(1)}%</td>
    `;
    tablaBody.appendChild(tr);
  });
}

function renderLineChart(acciones) {
  const ctx = document.getElementById("lineChart").getContext("2d");

  // Agrupar por fecha para un saldo acumulado simple
  const byDate = {};
  acciones.forEach(a => {
    const k = a.fecha;
    const cantidad = Number(a.cantidad || 0);
    const precio = Number(a.precio || 0);
    byDate[k] = (byDate[k] || 0) + cantidad * precio;
  });

  const labels = Object.keys(byDate).sort();
  const values = labels.map(l => byDate[l]);

  if (lineChart) lineChart.destroy();
  lineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Saldo por fecha",
        data: values,
        borderColor: "#238636",
        backgroundColor: "rgba(35, 134, 54, 0.2)",
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function renderBarChart(acciones) {
  const ctx = document.getElementById("barChart").getContext("2d");

  const byTicker = {};
  acciones.forEach(a => {
    const t = a.ticker;
    const cantidad = Number(a.cantidad || 0);
    const precio = Number(a.precio || 0);
    byTicker[t] = (byTicker[t] || 0) + cantidad * precio;
  });

  const labels = Object.keys(byTicker);
  const values = labels.map(l => byTicker[l]);

  if (barChart) barChart.destroy();
  barChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Valor por ticker",
        data: values,
        backgroundColor: "#1f6feb"
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

export async function cargarTablaAcciones() {
  try {
    const acciones = await fetchJSON(`${API_BASE}/api/data`);
    renderTabla(acciones);
    renderLineChart(acciones);
    renderBarChart(acciones);
  } catch (err) {
    console.error("Error cargando datos:", err);
  }
}

// Cargar al inicio
cargarTablaAcciones();
