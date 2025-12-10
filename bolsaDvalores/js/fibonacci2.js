let lineaActiva8 = false;
let puntoInicio8 = null; // Para modo Línea

let fibonacciActivo = false;
let puntoFibonacciA = null; // Para modo Fibonacci

// Niveles de Retroceso de Fibonacci para el cálculo
const NIVELES = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const COLORES_NIVELES = ['#33ff33', '#99ff99', '#ccccff', '#ffc0cb', '#ff9999', '#ff6666', '#ff0000'];

// Asumiendo que esta variable existe globalmente con los datos del eje X
// const fechas = ['2024-01-01', '2024-01-02', ...]; 


// ----------------------------------------------------
// Funciones de Utilidad y Limpieza
// ----------------------------------------------------

function mostrarMensaje(texto) {
    const mensajeDiv = document.getElementById('mensaje');
    if (mensajeDiv) mensajeDiv.textContent = texto;
}

function limpiarListeners(chart) {
    chart.off('click');
    chart.getZr().off('mousemove');
    chart.getZr().off('mousemove', dibujarGuiaTemporalFibonacci); // Limpiar guía específica
}

// Limpia el estado de los dos modos
function desactivarTodo() {
    const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
    if (!chart) return;

    // Desactivar variables
    lineaActiva8 = false;
    fibonacciActivo8 = false;
    puntoInicio = null;
    puntoFibonacciA = null;

    // Limpiar listeners
    limpiarListeners(chart);

    // Limpiar gráficos y series temporales
    const option = chart.getOption();
    
    // Quitar línea temporal de series
    let series = (option.series || []).filter(s => s.id !== 'linea-temporal');
    
    // Quitar gráficos temporales y definitivos de Fibonacci
    let graphics = (option.graphic || []).filter(g => !g.id.startsWith('fibonacci-'));

    chart.setOption({ series, graphic: graphics }, { replaceMerge: ['series', 'graphic'] });
}


// ----------------------------------------------------
// 1. Lógica de Línea de Tendencia
// ----------------------------------------------------

function activarLinea() {
    // Asegura que solo un modo esté activo
    desactivarTodo(); 
    
    const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
    if (!chart) return;

    lineaActiva = true;
    mostrarMensaje("Modo línea ACTIVADO. Haz clic para el punto A.");

    // Primer y segundo clic
    chart.on('click', function (params) {
        if (!lineaActiva) return;
        
        // **CORRECCIÓN: Usar convertFromPixel para la mecha (High/Low)**
        const pointInPixel = [params.event.offsetX, params.event.offsetY];
        const [fechaIndex, precioClic] = chart.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, pointInPixel);
        
        // Obtener la fecha
        const fecha = fechas[Math.round(fechaIndex)]; 
        if (!fecha) return;

        if (!puntoInicio) {
            // Primer clic
            puntoInicio = { fecha, precio: precioClic };
            mostrarMensaje(`Inicio en ${fecha} @ ${precioClic.toFixed(2)}. Haz clic para el punto final.`);
        } else {
            // Segundo clic → fijar línea definitiva
            const puntoFinal = { fecha, precio: precioClic };

            const option = chart.getOption();
            let series = option.series.slice();

            // quitar línea temporal
            series = series.filter(s => s.id !== 'linea-temporal');

            series.push({
                id: 'linea-definitiva-' + Date.now(),
                type: 'line',
                animation: false,
                data: [[puntoInicio.fecha, puntoInicio.precio], [puntoFinal.fecha, puntoFinal.precio]],
                lineStyle: { color: '#00ffff', width: 2 },
                symbol: 'circle',
                symbolSize: 6,
                itemStyle: { color: '#00ffff' }
            });

            chart.setOption({ series }, { replaceMerge: ['series'] });
            mostrarMensaje(`Línea fijada.`);

            // Desactivar modo línea automáticamente
            desactivarTodo();
        }
    });

    // Mouse libre → mover línea temporal
    chart.getZr().on('mousemove', function (event) {
        if (!lineaActiva || !puntoInicio) return;

        const pos = chart.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [event.offsetX, event.offsetY]);
        if (!pos) return;
        
        const fechaIndex = Math.round(pos[0]);
        const precioY = pos[1];

        const fecha = fechas[fechaIndex];
        if (!fecha) return;

        const option = chart.getOption();
        let series = option.series.slice();

        series = series.filter(s => s.id !== 'linea-temporal');

        series.push({
            id: 'linea-temporal',
            type: 'line',
            animation: false,
            data: [[puntoInicio.fecha, puntoInicio.precio], [fecha, precioY]],
            lineStyle: { color: '#ffaa00', width: 1, type: 'dashed' },
            symbol: 'none',
            silent: true
        });

        chart.setOption({ series }, { replaceMerge: ['series'] });
    });
}


// ----------------------------------------------------
// 2. Lógica de Fibonacci
// ----------------------------------------------------

function dibujarFibonacciFinal(chart, puntoA, puntoB) {
    const precioAlto = Math.max(puntoA.precio, puntoB.precio);
    const precioBajo = Math.min(puntoA.precio, puntoB.precio);
    const rango = precioAlto - precioBajo;

    const fechaInicio = puntoA.fecha;
    const fechaFin = puntoB.fecha;
    
    const nuevosGraficos = [];
    const graficaActual = chart.getOption().graphic || [];
    const graficosLimpios = graficaActual.filter(g => !g.id || !g.id.startsWith('fibonacci-'));

    NIVELES.forEach((nivel, index) => {
        let precioNivel;
        
        // Si puntoA es menor que puntoB, es alcista (dibujar desde abajo hacia arriba)
        if (puntoA.precio < puntoB.precio) { 
            precioNivel = precioBajo + rango * nivel;
        } else {
            // Si puntoA es mayor que puntoB, es bajista (dibujar desde arriba hacia abajo)
            precioNivel = precioAlto - rango * nivel;
        }
        
        const idBase = `fibonacci-${Date.now()}-${index}`;

        // 🟢 Dibujar la línea horizontal (Line)
        nuevosGraficos.push({
            id: `${idBase}-line`,
            type: 'line',
            z: 100, 
            shape: {
                x1: fechaInicio,
                y1: precioNivel,
                x2: fechaFin,
                y2: precioNivel
            },
            style: {
                stroke: COLORES_NIVELES[index],
                lineWidth: 1,
                lineDash: [4, 4]
            },
            // Las siguientes propiedades aseguran que use las coordenadas de los ejes
            coordinateSystem: 'cartesian2d' 
        });
        
        // 💬 Dibujar el texto del nivel (Text)
        nuevosGraficos.push({
            id: `${idBase}-text`,
            type: 'text',
            z: 100,
            style: {
                text: `${(nivel * 100).toFixed(1)}%`,
                fill: COLORES_NIVELES[index],
                fontSize: 10
            },
            // Posicionar el texto usando coordenadas del eje
            position: [fechaInicio, precioNivel], 
            // Ajuste para que el texto no tape la línea
            style: {
                x: fechaInicio,
                y: precioNivel,
                textAlign: 'left',
                textVerticalAlign: 'bottom',
                offset: [5, -5],
                fill: COLORES_NIVELES[index],
                fontSize: 10
            }
        });
    });

    chart.setOption({ graphic: [...graficosLimpios, ...nuevosGraficos] });
}


function dibujarGuiaTemporalFibonacci(event) {
    // Implementación idéntica a la línea temporal (puede reusar el código si simplificas)
    if (!fibonacciActivo || !puntoFibonacciA) return;

    const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
    const pos = chart.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [event.offsetX, event.offsetY]);
    
    if (!pos) return;
    
    const fechaIndex = Math.round(pos[0]);
    const precioY = pos[1];
    
    const fecha = fechas[fechaIndex];
    if (!fecha) return;

    const option = chart.getOption();
    let series = option.series.slice();

    series = series.filter(s => s.id !== 'fibonacci-guia-temporal');

    series.push({
        id: 'fibonacci-guia-temporal',
        type: 'line',
        animation: false,
        data: [[puntoFibonacciA.fecha, puntoFibonacciA.precio], [fecha, precioY]],
        lineStyle: { color: '#ffffff', width: 1, type: 'dotted' },
        symbol: 'none',
        silent: true 
    });

    chart.setOption({ series }, { replaceMerge: ['series'] });
}


// ... (Variables globales y funciones de utilidad como mostrarMensaje, desactivarTodo)

// ----------------------------------------------------
// 1. Lógica de Línea de Tendencia (Mensajes Actualizados)
// ----------------------------------------------------

function activarLinea() {
    // 1. Limpieza y activación
    desactivarTodo(); 
    
    const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
    if (!chart) return;

    lineaActiva = true;
    // 📢 MENSAJE 1: Al activar el modo línea
    mostrarMensaje("Modo Línea de Tendencia ACTIVADO. Haz clic en una vela para definir el **Punto de Inicio (A)**.");

    // Primer y segundo clic
    chart.on('click', function (params) {
        if (!lineaActiva) return;
        
        const pointInPixel = [params.event.offsetX, params.event.offsetY];
        const [fechaIndex, precioClic] = chart.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, pointInPixel);
        
        const fecha = fechas[Math.round(fechaIndex)]; 
        if (!fecha) return;

        if (!puntoInicio) {
            // Primer clic
            puntoInicio = { fecha, precio: precioClic };
            // 📢 MENSAJE 2: Después del primer clic
            mostrarMensaje(`Punto A fijado en ${fecha} @ ${precioClic.toFixed(2)}. Mueve el ratón y haz clic para definir el **Punto Final (B)**.`);
        } else {
            // Segundo clic → fijar línea definitiva
            const puntoFinal = { fecha, precio: precioClic };
            
            // ... (Lógica para dibujar la línea definitiva)
            
            const option = chart.getOption();
            let series = option.series.slice();
            series = series.filter(s => s.id !== 'linea-temporal');
            series.push({
                id: 'linea-definitiva-' + Date.now(),
                type: 'line',
                animation: false,
                data: [[puntoInicio.fecha, puntoInicio.precio], [puntoFinal.fecha, puntoFinal.precio]],
                lineStyle: { color: '#00ffff', width: 2 },
                symbol: 'circle',
                symbolSize: 6,
                itemStyle: { color: '#00ffff' }
            });

            chart.setOption({ series }, { replaceMerge: ['series'] });
            
            // 📢 MENSAJE 3: Línea fijada
            mostrarMensaje(`✅ Línea de Tendencia fijada. Presiona el botón nuevamente para activar otro dibujo.`);

            desactivarTodo();
        }
    });

    // ... (Lógica de mousemove para línea temporal, sin cambios)
    chart.getZr().on('mousemove', function (event) {
        if (!lineaActiva || !puntoInicio) return;
        // ... (resto del código mousemove)
    });
}


// ----------------------------------------------------
// 2. Lógica de Fibonacci (Mensajes Actualizados)
// ----------------------------------------------------

function activarFibonacci() {
    // 1. Limpieza y activación
    desactivarTodo();

    const chart = echarts.getInstanceByDom(document.getElementById("chart-container"));
    if (!chart) return;

    fibonacciActivo = true;
    // 📢 MENSAJE 1: Al activar el modo Fibonacci
    mostrarMensaje("Modo Retroceso de Fibonacci ACTIVADO. Haz clic en el High o Low para definir el **Punto A**.");

    chart.on('click', function (params) {
        if (!fibonacciActivo) return;
        
        const pointInPixel = [params.event.offsetX, params.event.offsetY];
        const [fechaIndex, precioClic] = chart.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, pointInPixel);
        
        const fecha = fechas[Math.round(fechaIndex)]; 
        if (!fecha) return;

        if (!puntoFibonacciA) {
            // Primer clic (Punto A)
            puntoFibonacciA = { fecha, precio: precioClic };
            // 📢 MENSAJE 2: Después del primer clic
            mostrarMensaje(`Punto A (Nivel 100%) fijado @ ${precioClic.toFixed(2)}. Haz clic en el High/Low opuesto para definir el **Punto B**.`);
            
            // Añadir guía temporal
            chart.getZr().on('mousemove', dibujarGuiaTemporalFibonacci);

        } else {
            // Segundo clic (Punto B) -> Dibujar Fibonacci final
            const puntoFibonacciB = { fecha, precio: precioClic };
            
            // 🔴 Dibujar y luego limpiar
            dibujarFibonacciFinal(chart, puntoFibonacciA, puntoFibonacciB);
            
            // 📢 MENSAJE 3: Fibonacci fijado
            mostrarMensaje(`✅ Niveles de Fibonacci fijados. Presiona el botón nuevamente para activar otro dibujo.`);
            
            desactivarTodo();
        }
    });
}

// ... (El resto de las funciones, incluyendo dibujarGuiaTemporalFibonacci, dibujarFibonacciFinal, y los event listeners de los botones, permanecen iguales)

// ----------------------------------------------------
// Eventos de Botones (Toggle)
// ----------------------------------------------------

// 👉 Evento del botón Línea


// 👉 Evento del botón Fibonacci
const btnFibonacci = document.getElementById("ftn-fibonnaci2");
if (btnFibonacci) {
    btnFibonacci.addEventListener("click", () => {
        if (fibonacciActivo) {
            desactivarTodo();
        } else {
            activarFibonacci();
        }
    });
}