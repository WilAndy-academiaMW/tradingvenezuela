function renderLineChart(data) {
    const labels = data.map(d => d.fecha);
    const values = data.map(d => d.saldo);

    // Actualizar saldo total
    const saldoTotal = values[values.length - 1];
    document.getElementById("saldoTotal").innerText = "$" + saldoTotal.toLocaleString();

    // Gráfica de línea
    new Chart(document.getElementById("lineChart"), {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Saldo total",
                data: values,
                borderColor: "#58a6ff",
                backgroundColor: "rgba(88,166,255,0.2)",
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            plugins: { legend: { labels: { color: "#e6edf3" } } },
            scales: {
                x: { ticks: { color: "#e6edf3" } },
                y: { ticks: { color: "#e6edf3" } }
            }
        }
    });
}


function renderBarChart(data) {
    const labels = data.map(d => d.ticker);
    const rendimientos = data.map(d => d.rendimiento);

    // Colores dinámicos: verde si >0, rojo si <0
    const colors = rendimientos.map(r => r >= 0 ? "#3fb950" : "#da3633");

    new Chart(document.getElementById("barChart"), {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Rendimiento %",
                data: rendimientos,
                backgroundColor: colors
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: "#e6edf3" } },
                y: {
                    ticks: { color: "#e6edf3" },
                    beginAtZero: true
                }
            }
        }
    });
}
