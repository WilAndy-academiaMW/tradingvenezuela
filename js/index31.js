async function leerCSV(ruta) {
  const resp = await fetch(ruta);
  const texto = await resp.text();
  const filas = texto.trim().split("\n").map(f => f.split(",").map(s => s.trim()));
  return filas;
}

let montoBs, tasaDolar, titulos, empresas;

// Diccionario de nombres (símbolo → nombre completo)
const nombresEmpresas = {
  "ABC.A": 'BCO. CARIBE "A"',
  "BNC": "BCO. NAC. CRÉDITO",
  "BPV": "BCO. PROVINCIAL",
  "BVCC": "BOLSA V. CCAS.",
  "BVL": "B.DE VENEZUELA",
  "CCP.B": 'C.CAPITAL "B"',
  "CCR": "CR.CARABOBO",
  "CGQ": "CORP.GPO.QUIM.",
  "CRM.A": "CORIMON C.A.",
  "DOM": "DOMINGUEZ & CIA",
  "EFE": "PRODUCTOS EFE",
  "ENV": "ENVASES VZLOS.",
  "FNC": "FAB.N.CEMENTOS",
  "GMC.B": "G.MANTRA CLASE B",
  "GZL": "GRUPO ZULIANO",
  "ICP.B": "I.CRECEPYMES -B-",
  "IVC.A": 'INVACA I.C. "A"',
  "IVC.B": 'INVACA I.C. "B"',
  "MPA": "MANPA, C.A. SACA",
  "MTC.B": 'MONTESCO "B"',
  "MVZ.A": "MERCANTIL S. (A)",
  "MVZ.B": "MERCANTIL S. (B)",
  "PCP.B": 'F.PETROLIA "B"',
  "PGR": "PROAGRO",
  "PIV.B": 'PIVCA CLASE "B"',
  "PTN": "PROTINAL",
  "RST": "RON STA. TERESA",
  "RST.B": 'R.S.TERESA "B"',
  "SVS": "SIVENSA, S.A.",
  "TDV.D": "CANTV CLASE (D)",
  "TPG": "T. PALO GRANDE"
};

// Conversión segura de números con formato es-VE (puntos miles, coma decimal)
function toNumber(val) {
  if (!val) return 0;
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}


// Formato visual
function formatoNumero(valor, decimales = 0) {
  return Number(valor).toLocaleString("es-VE", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  });
}

async function cargarDatos() {
  montoBs = await leerCSV("bdvc/Monto_efectivo_Bs.csv");
  tasaDolar = await leerCSV("bdvc/tasa_dolar_bcv.csv");
  titulos = await leerCSV("bdvc/Títulos_negociados.csv");

  // Encabezado de empresas está en la primera fila (índice 0), desde columna 1 en adelante
  empresas = montoBs[0].slice(1);

  mostrarTabla(1); // por defecto 24h
}

function mostrarTabla(dias) {
  const tbody = document.querySelector("table tbody");
  tbody.innerHTML = "";

  // Índices de datos: 1..último (fila 0 es encabezado)
  const lastIndex = montoBs.length - 1; // última fila de datos
  let filasMostrar = Math.min(dias, lastIndex); // no más de las disponibles
  if (filasMostrar <= 0) filasMostrar = 1;

  // Iniciar en la fila que permite tomar exactamente las últimas 'filasMostrar'
  const startIndex = Math.max(1, lastIndex - (filasMostrar - 1));

  console.log("=== mostrarTabla ===");
  console.log({ dias, lastIndex, filasMostrar, startIndex });

  let sumaBs = 0, sumaUsd = 0, sumaTitulos = 0;

  // Recorremos empresas (una fila por empresa en la tabla final)
  for (let j = 1; j < montoBs[0].length; j++) {
    let totalBs = 0, totalUsd = 0, totalTitulos = 0;

    // Sumamos día tras día dentro del rango
    for (let i = startIndex; i <= lastIndex; i++) {
      const filaMonto = montoBs[i];
      const filaTitulos = titulos[i];
      const fecha = filaMonto[0];

      // Buscar la tasa por fecha (intenta en col 2 o col 0)
      let filaTasa = tasaDolar.find(f => f[2] === fecha) || tasaDolar.find(f => f[0] === fecha);
      const tasa = filaTasa ? toNumber(filaTasa[1]) : 0;

      const valorBs = toNumber(filaMonto[j]);
      const valorUsd = tasa ? (valorBs / tasa) : 0;
      const titulosNeg = toNumber(filaTitulos?.[j]);

      totalBs += valorBs;
      totalUsd += valorUsd;
      totalTitulos += titulosNeg;

      // Logs para verificar por símbolo
      if (j === 1 || j === 2) { // quita esta condición si quieres ver todos
        console.log(`Empresa col ${j}, fecha ${fecha}: Bs=${valorBs}, tasa=${tasa}, USD=${valorUsd}`);
      }
    }

    sumaBs += totalBs;
    sumaUsd += totalUsd;
    sumaTitulos += totalTitulos;

    const simbolo = empresas[j - 1];
    const nombre = nombresEmpresas[simbolo] || simbolo;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${nombre}</td>
      <td>${simbolo}</td>
      <td>${formatoNumero(totalBs)}</td>
      <td>${formatoNumero(totalUsd, 2)}</td>
      <td>${formatoNumero(totalTitulos)}</td>
    `;
    tbody.appendChild(tr);
  }

  // Fila de suma total
  const trSuma = document.createElement("tr");
  trSuma.style.fontWeight = "bold";
  trSuma.innerHTML = `
    <td>Total</td>
    <td>-</td>
    <td>${formatoNumero(sumaBs)}</td>
    <td>${formatoNumero(sumaUsd, 2)}</td>
    <td>${formatoNumero(sumaTitulos)}</td>
  `;
  tbody.appendChild(trSuma);
}

// Botones
document.querySelector(".botones button:nth-child(1)").onclick = () => mostrarTabla(1);   // 24h
document.querySelector(".botones button:nth-child(2)").onclick = () => mostrarTabla(2);   // 48h
document.querySelector(".botones button:nth-child(3)").onclick = () => mostrarTabla(15);  // 7 días (ajusta si tu CSV es por día)
document.querySelector(".botones button:nth-child(4)").onclick = () => mostrarTabla(30);  // 1 mes
document.querySelector(".botones button:nth-child(5)").onclick = () => mostrarTabla(60);  // 2 meses

// Orden dinámico
let ordenAsc = true;
document.querySelectorAll("table thead th").forEach((th, idx) => {
  th.style.cursor = "pointer";
  th.addEventListener("click", () => {
    ordenarTabla(idx, ordenAsc);
    ordenAsc = !ordenAsc;
  });
});

function ordenarTabla(colIdx, asc) {
  const tbody = document.querySelector("table tbody");
  const filas = Array.from(tbody.querySelectorAll("tr"));
  const totalRow = filas.pop(); // quitar fila de suma

  filas.sort((a, b) => {
    const valA = a.children[colIdx].innerText.replace(/\./g, "").replace(",", ".");
    const valB = b.children[colIdx].innerText.replace(/\./g, "").replace(",", ".");

    if (colIdx === 0 || colIdx === 1) {
      return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      return asc ? (parseFloat(valA) - parseFloat(valB)) : (parseFloat(valB) - parseFloat(valA));
    }
  });

  tbody.innerHTML = "";
  filas.forEach(f => tbody.appendChild(f));
  tbody.appendChild(totalRow);
}

cargarDatos();
