document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ index.js cargado correctamente");

  const mainContent = document.getElementById("main-content");
  const btnBs = document.getElementById("btn-bs");
  const btnUsd = document.getElementById("btn-usd");
  const btnZoom = document.getElementById("btn-zoom");
  const btnPortafolio = document.getElementById("btn-portafolio");

  // 🔑 Variables globales
  window.myChart = null;
  window.currentData = [];

  // --- Función para obtener el último valor del dólar desde bolivar.csv ---
  async function getExchangeRate() {
    const response = await fetch("archivos/bolivar.csv");
    const text = await response.text();
    const rows = text.trim().split("\n").map(r => r.split(","));
    rows.shift(); // quitar encabezado

    const lastRow = rows[rows.length - 1];
    const dolarBs = parseFloat(lastRow[4]); // columna Close
    return dolarBs;
  }

  // --- Función para renderizar un activo ---
  async function renderAsset(assetName, filePath, convertToUsd = false) {
    try {
      const response = await fetch(filePath);
      const text = await response.text();
      const rows = text.trim().split("\n").map(r => r.split(","));
      rows.shift();

      let data = rows.map(r => ({
        Date: r[0],
        Open: parseFloat(r[1]),
        High: parseFloat(r[2]),
        Low: parseFloat(r[3]),
        Close: parseFloat(r[4])
      }));

      // 🔄 Conversión a USD si corresponde
      if (convertToUsd) {
        const exchangeRate = await getExchangeRate();
        data = data.map(d => ({
          Date: d.Date,
          Open: d.Open / exchangeRate,
          High: d.High / exchangeRate,
          Low: d.Low / exchangeRate,
          Close: d.Close / exchangeRate
        }));
      }

      window.currentData = data;

      const dates = data.map(d => d.Date);
      const ohlc = data.map(d => [d.Open,d.High, d.Low, d.Close ]);



      const chartDom = document.getElementById("kline-chart");
      if (window.myChart) window.myChart.dispose();
      window.myChart = echarts.init(chartDom, "dark");

      window.myChart.setOption({
        title: {
          text: assetName,
          left: "center",
          textStyle: { color: "#3b82f6" }
        },
        tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
        xAxis: { type: "category", data: dates, boundaryGap: false },
        yAxis: { scale: true },
        grid: { left: '3%', right: '10%', bottom: '15%', containLabel: true },
        dataZoom: [
          { type: "inside", xAxisIndex: [0], start: 80, end: 100 },
          { type: "slider", xAxisIndex: [0], start: 80, end: 100, bottom: '5%' },
          { type: "inside", yAxisIndex: [0], start: 0, end: 100 },
          { type: "slider", yAxisIndex: [0], left: "93%", start: 0, end: 100 }
        ],
        series: [{
          type: "candlestick",
          data: ohlc,
          itemStyle: {
            color: "#00b050",
            color0: "#d82828",
            borderColor: "#00b050",
            borderColor0: "#d82828"
          }
        }]
      });

      chartDom.style.height = '600px';
      window.myChart.resize();

    } catch (err) {
      console.error("❌ Error renderizando activo:", err);
      mainContent.innerHTML = `<p class="text-red-400 text-center mt-10">Error cargando datos de ${assetName}</p>`;
    }
  }

    // --- Layout ---
  function renderLayout(assetName, filePath, convertToUsd = false) {
    mainContent.innerHTML = `
      <div class="flex flex-1 overflow-hidden h-[calc(100vh-100px)]"> 
        <aside id="left-panel">
          <h1 class="text-xs text-blue-300 mb-2">Herramientas</h1>
          <div class="flex flex-col space-y-4">
            <div><img src="img/lineasTendencia.png" alt="Tendencia"><p class="text-blue-400 text-xs text-center">Tendencia</p></div>
            <div><img src="img/geometria.png" alt="Geometría"><p class="text-blue-400 text-xs text-center">Geometría</p></div>
            <div><img src="img/regla.png" alt="Regla"><p class="text-blue-400 text-xs text-center">Regla</p></div>
            <div><img src="img/fibonacci.png" alt="Fibonacci"><p class="text-blue-400 text-xs text-center">Fibonacci</p></div>
            <div><img src="img/patrones.png" alt="Patrones"><p class="text-blue-400 text-xs text-center">Patrones</p></div>
          </div>
        </aside>

        <div id="chart-area" class="flex-1 min-w-0 bg-gray-900 border-r border-gray-700">
          <div id="kline-chart" class="w-full h-full"></div> 
        </div>

        <aside id="right-panel" class="flex flex-col bg-gray-800 p-3 shadow-md w-48"> 
          <h3 class="text-md font-semibold text-blue-300 mb-3 border-b border-gray-700 pb-1">Lista de Activos</h3>
          <ul id="list-bs" class="space-y-2 text-sm">
            <li id="btn-bdv" class="asset-item cursor-pointer p-1.5 rounded bg-gray-700/50 hover:bg-gray-700 flex justify-between items-center">
              <div class="flex items-center space-x-2">
                <img src="img/imgA/bdv.png" alt="BDV" class="w-5 h-5">
                <span class="font-medium">BDV</span>
              </div>
            </li>
            <li id="btn-mercantil" class="asset-item cursor-pointer p-1.5 rounded hover:bg-gray-700 flex justify-between items-center">
              <div class="flex items-center space-x-2">
                <img src="img/imgA/mercantil.png" alt="Mercantil" class="w-5 h-5">
                <span class="font-medium">Mercantil</span>
              </div>
            </li>
            <li id="btn-bnc" class="asset-item cursor-pointer p-1.5 rounded hover:bg-gray-700 flex justify-between items-center">
              <div class="flex items-center space-x-2">
                <img src="img/imgA/bnc.png" alt="BNC" class="w-5 h-5">
                <span class="font-medium">BNC</span>
              </div>
            </li>
              <li id="btn-EFE" class="asset-item cursor-pointer p-1.5 rounded hover:bg-gray-700 flex justify-between items-center">
              <div class="flex items-center space-x-2">
                <img src="img/imgA/efe.png" alt="EFE" class="w-5 h-5">
                <span class="font-medium">EFE</span>
              </div>
            </li>
            <li id="btn-grupoz" class="asset-item cursor-pointer p-1.5 rounded hover:bg-gray-700 flex justify-between items-center">
              <div class="flex items-center space-x-2">
                <img src="img/imgA/grupo zuleano.png" alt="EFE" class="w-5 h-5">
                <span class="font-medium">GRUPO Z</span>
              </div>
            </li>
          </ul>
        </aside>
      </div>
    `;

    // Renderizar gráfico inicial
    renderAsset(assetName, filePath, convertToUsd);

    // Eventos de lista
    document.getElementById("btn-bdv").addEventListener("click", () => {
      renderLayout("BDV", "archivos/bdv.csv", convertToUsd);
    });
    document.getElementById("btn-mercantil").addEventListener("click", () => {
      renderLayout("Mercantil", "archivos/mercantil.csv", convertToUsd);
    });
    document.getElementById("btn-bnc").addEventListener("click", () => {
      renderLayout("BNC", "archivos/bnc.csv", convertToUsd);
    });
     document.getElementById("btn-EFE").addEventListener("click", () => {
      renderLayout("EFE", "archivos/Efe.csv", convertToUsd);
    });
    document.getElementById("btn-grupoz").addEventListener("click", () => {
      renderLayout("Grupo Zuleano", "archivos/grupoZ.csv", convertToUsd);
    });
  }

  // --- Barra inferior ---
    // --- Barra inferior ---
  function renderBottomBar() {
    let footerBar = document.querySelector(".bottom-bar");
    if (!footerBar) {
      footerBar = document.createElement("footer");
      footerBar.className = "bottom-bar fixed bottom-0 left-0 right-0 p-2 bg-gray-800 border-t border-blue-600/50 text-center";

      footerBar.innerHTML = `
        <div class="flex justify-center space-x-4">
          <button class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium" id="btn-rsi">RSI</button>
          <button class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium" id="btn-macd">MACD</button>
          <button class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium" id="btn-pivot">Zonas Pivote</button>
        </div>
      `;
      document.body.appendChild(footerBar);
    }

    // Eventos indicadores
    document.getElementById("btn-rsi").addEventListener("click", () => {
      if (window.myChart && window.currentData.length > 0) {
        mostrarRSI(); // Función en indicadores.js
      } else {
        console.warn("No hay datos o gráfico inicializado para calcular el RSI.");
      }
    });

    document.getElementById("btn-macd").addEventListener("click", () => {
      if (window.myChart && window.currentData.length > 0) {
        mostrarMACD(); // Función en indicadores.js
      } else {
        console.warn("No hay datos o gráfico inicializado para calcular el MACD.");
      }
    });

    document.getElementById("btn-pivot").addEventListener("click", () => {
      if (window.myChart && window.currentData.length > 0) {
        if (typeof window.mostrarZonasPivote === 'function') {
          window.mostrarZonasPivote();
        }
      } else {
        console.warn("Zonas Pivote: Inicializa el gráfico primero.");
      }
    });
  }

  // --- Conexiones Iniciales ---
  // 1. Inicializar con el layout y el gráfico por defecto (BDV en Bs)
  renderLayout("BDV", "archivos/bdv.csv");

  // 2. Renderizar y conectar los botones inferiores
  renderBottomBar();

  // 3. Botón Bolívares → carga datos en Bs
  btnBs.addEventListener("click", () => {
    renderLayout("BDV", "archivos/bdv.csv", false);
  });

  // 4. Botón Dólares → carga datos convertidos a USD
  btnUsd.addEventListener("click", () => {
    renderLayout("Acciones en USD", "archivos/bolivar.csv", true);
  });

  // 5. Botón Zoom → aplica zoom máximo al gráfico
  btnZoom.addEventListener("click", () => {
    if (window.myChart) {
      window.myChart.setOption({
        dataZoom: [
          { type: "inside", xAxisIndex: [0], start: 0, end: 100 },
          { type: "slider", xAxisIndex: [0], start: 0, end: 100 },
          { type: "inside", yAxisIndex: [0], start: 0, end: 100 },
          { type: "slider", yAxisIndex: [0], start: 0, end: 100 }
        ]
      });
    }
  });

  // 6. Botón Portafolio → muestra vista de portafolio
  btnPortafolio.addEventListener("click", () => {
    mainContent.innerHTML = `
      <div class="p-6 text-blue-400">
        <h2 class="text-2xl font-bold mb-4">📊 Tu Portafolio</h2>
        <p class="text-gray-300">Aquí podrás ver tus activos, ganancias y pérdidas.</p>
        <div class="mt-4 bg-gray-800 p-4 rounded">
          <p class="text-sm text-gray-400">⚠️ Funcionalidad en desarrollo...</p>
        </div>
      </div>
    `;
  });
});
