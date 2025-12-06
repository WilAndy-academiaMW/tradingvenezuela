// --- Funciones utilitarias ---
const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES', minimumFractionDigits: 2 }).format(amount);
const formatPercentage = (amount) => `${amount.toFixed(2)}%`;

// --- Leer CSV con fetch ---
async function leerCSV(ruta) {
  const texto = await fetch(ruta).then(r => {
    if (!r.ok) throw new Error("Not Found");
    return r.text();
  });
  const filas = texto.trim().split("\n");
  const header = filas.shift().split(",");
  return filas.map(linea => {
    const valores = linea.split(",");
    const obj = {};
    header.forEach((h, i) => obj[h] = valores[i]);
    return obj;
  });
}

// --- Crear JSON del portafolio ---
async function crearPortafolioJSON() {
  // 1. Leer precios actuales
  const preciosRows = await leerCSV("Ultimo_precio_Bs.csv");
  const precios = {};
  preciosRows.forEach(r => {
    const simbolo = r.Symbol || r.simbolo;
    precios[simbolo] = parseFloat(r.Price);
  });

  // 2. Leer portafolio
  const portafolioRows = await leerCSV("portafolio.csv");
  const posiciones = [];
  let totalInvertido = 0;
  let valorTotal = 0;

  portafolioRows.forEach(r => {
    if (!r.simbolo) return; // evitar filas vacías

    const simbolo = r.simbolo;
    const cantidad = parseInt(r.Accion);
    const costoPromedio = parseFloat(r.Price);
    const costoTotal = cantidad * costoPromedio;

    const precioActual = precios[simbolo] || costoPromedio;
    const valorActual = cantidad * precioActual;
    const ganancia = valorActual - costoTotal;
    const rendimiento = costoTotal ? (ganancia / costoTotal * 100) : 0;

    posiciones.push({
      Symbol: simbolo,
      Cantidad_Total: cantidad,
      Costo_Promedio: costoPromedio,
      Costo_Total_Acumulado: costoTotal,
      Precio_Actual_Bs: precioActual,
      Valor_Actual: valorActual,
      Ganancia_Perdida_Bs: ganancia,
      Rendimiento_Porcentual: rendimiento
    });

    totalInvertido += costoTotal;
    valorTotal += valorActual;
  });

  // 3. Resumen
  const resumen = {
    Valor_Total_Portafolio: valorTotal,
    Total_Invertido: totalInvertido,
    Ganancia_Neta: valorTotal - totalInvertido
  };

  return { resumen, posiciones };
}

// --- Renderizado ---
function renderSummary(resumen) {
  document.getElementById('valor-total').textContent = formatCurrency(resumen.Valor_Total_Portafolio);
  document.getElementById('total-invertido').textContent = formatCurrency(resumen.Total_Invertido);
  const gananciaNetaElement = document.getElementById('ganancia-neta');
  gananciaNetaElement.textContent = formatCurrency(resumen.Ganancia_Neta);
  if (resumen.Ganancia_Neta >= 0) {
    gananciaNetaElement.classList.add('text-gain');
    document.getElementById('net-gain-card').classList.add('border-gain');
  } else {
    gananciaNetaElement.classList.add('text-loss');
    document.getElementById('net-gain-card').classList.add('border-loss');
  }
}

function renderPositions(posiciones) {
  const tbody = document.getElementById('posiciones-body');
  tbody.innerHTML = '';
  posiciones.forEach(pos => {
    const isGain = pos.Ganancia_Perdida_Bs >= 0;
    const gainClass = isGain ? 'text-gain font-semibold' : 'text-loss font-semibold';
    const row = `
      <tr class="bg-white border-b hover:bg-gray-50">
        <td class="py-3 px-2 font-bold text-gray-900">${pos.Symbol}</td>
        <td class="py-3 px-2">${pos.Cantidad_Total}</td>
        <td class="py-3 px-2">${formatCurrency(pos.Costo_Promedio)}</td>
        <td class="py-3 px-2">${formatCurrency(pos.Precio_Actual_Bs)}</td>
        <td class="py-3 px-2">${formatCurrency(pos.Valor_Actual)}</td>
        <td class="py-3 px-2 ${gainClass}">
          ${formatCurrency(pos.Ganancia_Perdida_Bs)} 
          <span class="text-xs">(${formatPercentage(pos.Rendimiento_Porcentual)})</span>
        </td>
      </tr>`;
    tbody.insertAdjacentHTML('beforeend', row);
  });
}

function renderCharts(posiciones) {
  const pieLabels = posiciones.map(p => p.Symbol);
  const pieData = posiciones.map(p => p.Valor_Actual);
  const pieColors = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899'];

  new Chart(document.getElementById('grafica-pastel'), {
    type: 'doughnut',
    data: { labels: pieLabels, datasets: [{ data: pieData, backgroundColor: pieColors }] },
    options: { responsive: true, plugins: { legend: { position: 'right' } } }
  });

  const barLabels = posiciones.map(p => p.Symbol);
  const barData = posiciones.map(p => p.Ganancia_Perdida_Bs);
  const barColors = barData.map(g => g >= 0 ? '#10B981' : '#EF4444');

  new Chart(document.getElementById('grafica-barras'), {
    type: 'bar',
    data: { labels: barLabels, datasets: [{ data: barData, backgroundColor: barColors }] },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

// --- Inicialización ---
window.onload = async function() {
  try {
    const data = await crearPortafolioJSON();
    renderSummary(data.resumen);
    renderPositions(data.posiciones);
    renderCharts(data.posiciones);
  } catch (err) {
    console.error("Error cargando portafolio:", err);
  }
};
