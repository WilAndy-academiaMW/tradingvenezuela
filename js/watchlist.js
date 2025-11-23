window.onload = function () {
    console.log("✅ watchlist.js cargado correctamente");

    const chartDom = document.getElementById("kline-chart");
    const myChart = echarts.init(chartDom, "dark");

    // Leer CSV
    async function loadCSV(path) {
        console.log("📂 Intentando cargar CSV:", path);
        const response = await fetch(path);
        const text = await response.text();
        const rows = text.trim().split("\n").map(r => r.split(","));
        rows.shift(); // quitar encabezados
        console.log("📊 CSV leído con", rows.length, "filas");
        return rows.map(r => ({
            Date: r[0],
            Open: parseFloat(r[1]),
            High: parseFloat(r[2]),
            Low: parseFloat(r[3]),
            Close: parseFloat(r[4])
        }));
    }

    // Calcular variación porcentual
    function calculateChange(data) {
        if (data.length < 2) return 0;
        const last = data[data.length - 1].Close;
        const prev = data[data.length - 2].Close;
        const change = ((last - prev) / prev * 100).toFixed(2);
        console.log("📈 Cambio calculado:", change, "%");
        return change;
    }

    // Renderizar activo
    async function renderAsset(assetName, filePath, liElement) {
        console.log("🔔 Click en activo:", assetName);
        try {
            const data = await loadCSV(filePath);
            const dates = data.map(d => d.Date);
            const ohlc = data.map(d => [d.Open, d.Close, d.Low, d.High]);

            // Actualizar porcentaje en la lista
            const change = calculateChange(data);
            const span = liElement.querySelector("span:last-child");
            span.textContent = (change > 0 ? "+" : "") + change + "%";
            span.className = change >= 0 ? "text-green-400" : "text-red-400";

            // Dibujar gráfico
            console.log("📉 Dibujando gráfico para:", assetName);
            myChart.setOption({
                title: { text: assetName, left: "center", textStyle: { color: "#3b82f6" } },
                tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
                xAxis: { type: "category", data: dates },
                yAxis: { scale: true },
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
        } catch (err) {
            console.error("❌ Error cargando activo:", err);
        }
    }

    // Enganchar eventos a cada <li>
    document.querySelectorAll("#right-panel li").forEach(li => {
        const assetName = li.querySelector("span.font-medium").textContent;
        const filePath = li.getAttribute("data-csv");
        console.log("⚙️ Preparando activo:", assetName, "->", filePath);
        li.addEventListener("click", () => renderAsset(assetName, filePath, li));
    });

    // Botón reset zoom
    const resetBtn = document.getElementById("resetZoom");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            console.log("🔄 Reset zoom");
            myChart.dispatchAction({ type: "dataZoom", start: 0, end: 100 });
        });
    }
};
