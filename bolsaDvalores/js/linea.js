let lineaActiva = false;
let puntoInicio = null;

function mostrarMensaje(texto) {
    const mensajeDiv = document.getElementById('mensaje');
    if (mensajeDiv) mensajeDiv.textContent = texto;
}

// ----------------------------------------------------
// Nueva Función: Desactivar y Limpiar
// ----------------------------------------------------
function desactivarLinea() {
    const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
    if (!chart) return;

    lineaActiva = false;
    puntoInicio = null;

    // Limpiar eventos (crucial)
    chart.off('click');
    chart.getZr().off('mousemove');

    // Quitar la línea temporal (limpieza visual)
    const option = chart.getOption();
    let series = option.series.filter(s => s.id !== 'linea-temporal');
    chart.setOption({ series }, { replaceMerge: ['series'] });

    mostrarMensaje("Modo línea cancelado y desactivado.");
}


// ----------------------------------------------------
// Función: Activar (casi idéntica, pero sin lógica de botón)
// ----------------------------------------------------
function activarLinea() {
    const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
    if (!chart) return;

    lineaActiva = true;
    puntoInicio = null;

    // limpiar eventos previos
    chart.off('click');
    chart.getZr().off('mousemove');

    // Primer y segundo clic
    chart.on('click', function (params) {
        if (!lineaActiva) return;
        if (params.seriesType !== 'candlestick') return;

        // Aquí deberías usar convertFromPixel como discutimos antes para agarrar la mecha!
        const fecha = params.name;
        const close = params.data[1]; // Aún toma el cierre, como en tu código original

        if (!puntoInicio) {
            // Primer clic
            puntoInicio = { fecha, precio: close };
            mostrarMensaje(`Inicio en ${fecha} → Cierre USD ${close.toFixed(2)}. Haz clic para el punto final o presiona el botón para cancelar.`);
        } else {
            // Segundo clic → fijar línea definitiva
            const puntoFinal = { fecha, precio: close };

            const option = chart.getOption();
            let series = option.series.slice();

            // quitar línea temporal
            series = series.filter(s => s.id !== 'linea-temporal');

            series.push({
                id: 'linea-definitiva-' + Date.now(),
                type: 'line',
                data: [[puntoInicio.fecha, puntoInicio.precio], [puntoFinal.fecha, puntoFinal.precio]],
                lineStyle: { color: '#00ffff', width: 2 },
                symbol: 'circle',
                symbolSize: 8,
                itemStyle: { color: '#00ffff' }
            });

            chart.setOption({ series }, { replaceMerge: ['series'] });
            mostrarMensaje(`Línea fijada entre ${puntoInicio.fecha} y ${puntoFinal.fecha}`);

            // 🔴 Desactivar modo línea automáticamente después de dibujar
            desactivarLinea(); // Llamamos a la función de desactivación
        }
    });

    // Mouse libre → mover línea temporal
    chart.getZr().on('mousemove', function (event) {
        if (!lineaActiva || !puntoInicio) return;

        const pos = chart.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [event.offsetX, event.offsetY]);
        const fechaIndex = Math.round(pos[0]);
        const precioY = pos[1];

        // Se asume que la variable 'fechas' está definida globalmente
        if (fechaIndex < 0 || fechaIndex >= fechas.length) return;
        const fecha = fechas[fechaIndex];

        const option = chart.getOption();
        let series = option.series.slice();

        series = series.filter(s => s.id !== 'linea-temporal');

        series.push({
            id: 'linea-temporal',
            type: 'line',
            data: [[puntoInicio.fecha, puntoInicio.precio], [fecha, precioY]],
            lineStyle: { color: '#ffaa00', width: 1, type: 'dashed' },
            symbol: 'none'
        });

        chart.setOption({ series }, { replaceMerge: ['series'] });
    });

    mostrarMensaje("Modo línea ACTIVADO. Haz clic en una vela para empezar.");
}

// ----------------------------------------------------
// Lógica del Botón como Toggle (Interruptor)
// ----------------------------------------------------
const btnLinea = document.getElementById("btn-linea");
if (btnLinea) {
    btnLinea.addEventListener("click", () => {
        if (lineaActiva) {
            // Si está activo, desactiva y limpia
            desactivarLinea();
        } else {
            // Si está inactivo, activa el modo de dibujo
            activarLinea();
        }
    });
}