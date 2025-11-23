// Archivo de Indicadores Técnicos (RSI, MACD y Zonas Pivote)

// Variables de estado global
window.isRSIvisible = false;
window.isMACDvisible = false; 
window.isZonasPivoteVisible = false;

// --- Funciones de Ayuda ---

/**
 * Oculta todos los indicadores excepto el que se está mostrando, asegurando la exclusividad.
 */
function asegurarExclusividad(indicatorName) {
    if (indicatorName !== 'RSI' && window.isRSIvisible && typeof window.ocultarRSI === 'function') {
        window.ocultarRSI();
    }
    if (indicatorName !== 'MACD' && window.isMACDvisible && typeof window.ocultarMACD === 'function') {
        window.ocultarMACD();
    }
    if (indicatorName !== 'PIVOTE' && window.isZonasPivoteVisible && typeof window.ocultarZonasPivote === 'function') {
        window.ocultarZonasPivote();
    }
}

// =========================================================================
// ZONAS PIVOTE (LÓGICA IMPLEMENTADA)
// =========================================================================

/**
 * Calcula y dibuja las zonas pivote (soporte/resistencia) en el gráfico.
 * Adapta la lógica de detección de picos y valles + agrupación de tu código Python.
 */
window.mostrarZonasPivote = function () {
    const myChart = echarts.getInstanceByDom(document.getElementById("kline-chart"));
    const currentData = window.currentData;
    
    if (!myChart || currentData.length < 3) {
        console.error("Zonas Pivote: No hay suficientes datos para calcular.");
        return;
    }

    // 1. Asegurar exclusividad y manejar el toggle
    asegurarExclusividad('PIVOTE');

    if (window.isZonasPivoteVisible) {
        window.ocultarZonasPivote();
        return;
    }
    
    // 2. Obtener el rango de datos visible
    const xAxisOption = myChart.getOption().dataZoom[0];
    const startIndex = Math.floor(xAxisOption.start / 100 * currentData.length);
    const endIndex = Math.ceil(xAxisOption.end / 100 * currentData.length);
    
    // Filtrar los datos que están actualmente visibles en el gráfico.
    const visibleData = currentData.slice(startIndex, endIndex);

    if (visibleData.length < 3) {
        console.warn("Zonas Pivote: No hay suficientes puntos visibles para el cálculo.");
        return;
    }

    // 3. Detectar máximos y mínimos locales (Pivotes)
    let niveles = [];
    for (let i = 1; i < visibleData.length - 1; i++) {
        const prevH = visibleData[i - 1].High;
        const currH = visibleData[i].High;
        const nextH = visibleData[i + 1].High;
        
        const prevL = visibleData[i - 1].Low;
        const currL = visibleData[i].Low;
        const nextL = visibleData[i + 1].Low;

        // Máximo local (curr > prev AND curr > next)
        if (currH > prevH && currH > nextH) {
            niveles.push(currH);
        }
        // Mínimo local (curr < prev AND curr < next)
        if (currL < prevL && currL < nextL) {
            niveles.push(currL);
        }
    }
    
    if (niveles.length === 0) {
        console.warn("Zonas Pivote: No se detectaron pivots en el rango visible.");
        return;
    }

    // 4. Agrupar niveles cercanos en zonas
    const tolerancia = 0.010; // 1.0% de tolerancia
    niveles.sort((a, b) => a - b);
    let zonas = [];
    
    for (const nivel of niveles) {
        if (!zonas.length) {
            // [low, high]
            zonas.push([nivel, nivel]); 
        } else {
            let [low, high] = zonas[zonas.length - 1];
            
            // Usamos el extremo superior (high) de la zona actual para la comparación de tolerancia
            if (Math.abs(nivel - high) / high < tolerancia) {
                // Expandir zona
                zonas[zonas.length - 1][1] = Math.max(high, nivel);
                zonas[zonas.length - 1][0] = Math.min(low, nivel);
            } else {
                // Iniciar nueva zona
                zonas.push([nivel, nivel]);
            }
        }
    }

    // 5. Dibujar rectángulos horizontales usando el componente 'graphic' de ECharts
    const graphicElements = zonas.map(([low, high]) => {
        return {
            type: 'rect',
            coordinateSystem: 'cartesian2d', 
            x: startIndex,
            y: low,
            shape: {
                // El ancho es la diferencia de índices de las velas visibles
                width: endIndex - startIndex, 
                height: high - low
            },
            style: {
                fill: 'rgba(255, 165, 0, 0.3)', // Naranja con 30% de opacidad
                stroke: 'rgba(255, 165, 0, 0.5)',
                lineWidth: 1
            },
            silent: true, 
            $name: 'pivotZone', 
            z: 0 
        };
    });

    // Aplicar los gráficos al chart
    myChart.setOption({
        graphic: graphicElements,
        dataZoom: myChart.getOption().dataZoom
    });

    window.isZonasPivoteVisible = true;
};

/**
 * Oculta las zonas pivote removiendo los elementos gráficos 'pivotZone'.
 */
window.ocultarZonasPivote = function() {
    const myChart = echarts.getInstanceByDom(document.getElementById("kline-chart"));
    if (!myChart) return;
    
    let options = myChart.getOption();
    let existingGraphics = options.graphic || [];
    
    // Remover solo los elementos con $name: 'pivotZone'
    let remainingGraphics = existingGraphics.filter(g => g.$name !== 'pivotZone');

    myChart.setOption({
        graphic: remainingGraphics.length > 0 ? remainingGraphics : []
    }, { replaceMerge: ['graphic'] });
    
    window.isZonasPivoteVisible = false;
};

// =========================================================================
// FUNCIONES RSI (ACTUALIZADO: Líneas 70/30 MOVIDAS A LA SERIE)
// =========================================================================

/**
 * Agrega el indicador RSI (Relative Strength Index) con líneas 70/30 visibles.
 */
window.mostrarRSI = function (periodo = 14) { 
  const myChart = echarts.getInstanceByDom(document.getElementById("kline-chart"));
  const currentData = window.currentData; 
  
  if (!myChart || currentData.length === 0) {
    console.error("RSI: No se puede calcular sin datos o gráfico.");
    return;
  }
    
    // 1. Ocultar otros indicadores
    asegurarExclusividad('RSI');

    // 2. Toggle: Ocultar si ya está visible
    if (window.isRSIvisible) {
        window.ocultarRSI();
        return;
    }
    
    // --- Cálculo RSI (sin cambios) ---
    const closes = currentData.map(d => d.Close);
    const deltas = closes.map((c, i) => i === 0 ? 0 : c - closes[i - 1]);
    const gains = deltas.map(d => d > 0 ? d : 0);
    const losses = deltas.map(d => d < 0 ? -d : 0);

    const avgGain = [], avgLoss = [];
    for (let i = 0; i < closes.length; i++) {
        if (i < periodo - 1) { 
            avgGain.push(null); 
            avgLoss.push(null); 
        } else if (i === periodo - 1) {
            const g = gains.slice(0, periodo).reduce((a, b) => a + b, 0) / periodo;
            const l = losses.slice(0, periodo).reduce((a, b) => a + b, 0) / periodo;
            avgGain.push(g); avgLoss.push(l);
        } else {
            const prevAvgGain = avgGain[i - 1];
            const prevAvgLoss = avgLoss[i - 1];
            
            const k = 1 / periodo;
            const g = prevAvgGain + k * (gains[i] - prevAvgGain);
            const l = prevAvgLoss + k * (losses[i] - prevAvgLoss);
            
            avgGain.push(g); avgLoss.push(l);
        }
    }

    const rsi = avgGain.map((g, i) => {
        const l = avgLoss[i];
        if (g === null || l === null) return null;
        
        let rs;
        if (l === 0) {
            rs = g === 0 ? 0 : Infinity;
        } else {
            rs = g / l;
        }
        return 100 - (100 / (1 + rs));
    });
    // --- Fin Cálculo RSI ---

    // Limpiar series de indicadores previas (si es necesario)
    let options = myChart.getOption();
    options.series = options.series.filter(s => s.type === 'candlestick');
    options.yAxis = options.yAxis.filter(y => y.id !== 'rsiAxis' && y.id !== 'macdAxis'); 

    // Configurar y agregar la serie RSI a ECharts
    myChart.setOption({
        yAxis: [
            options.yAxis[0], 
            {
                id: 'rsiAxis',
                name: 'RSI',
                position: 'right', 
                offset: 0, 
                min: 0,
                max: 100,
                interval: 10,
                splitLine: { 
                    show: true, 
                    lineStyle: { 
                        color: ['#444'], 
                        type: 'dotted' 
                    } 
                },
                axisLabel: { formatter: '{value}', color: 'darkred' },
                axisPointer: {
                    show: true,
                    label: { formatter: params => params.value.toFixed(2) }
                }
            }
        ],
        series: [
            ...options.series, 
            {
                name: "RSI",
                type: "line",
                data: rsi,
                smooth: true,
                lineStyle: { 
                    color: "#f59e0b", // Naranja/Amarillo
                    width: 2 // Grosor de la línea del RSI
                },
                showSymbol: false,
                yAxisIndex: 1, 
                tooltip: { valueFormatter: value => value ? value.toFixed(2) : '-' },

                // 🚀 ESTO DIBUJA LAS LÍNEAS 70/30 SOBRE LA SERIE RSI
                markLine: {
                    silent: true,
                    symbol: 'none', 
                    lineStyle: {
                        color: '#60a5fa', // Color azul claro
                        type: 'solid',
                        width: 3, // Grosor grande
                        opacity: 0.9
                    },
                    data: [
                        { yAxis: 70, name: 'Sobrecompra' }, 
                        { yAxis: 30, name: 'Sobreventa' }   
                    ]
                }
            }
        ]
    });
    window.isRSIvisible = true;
};


window.ocultarRSI = function() {
    const myChart = echarts.getInstanceByDom(document.getElementById("kline-chart"));
    if (!myChart) return;

    let options = myChart.getOption();
    
    // Filtra las series y el eje Y para eliminar los del RSI
    options.series = options.series.filter(s => s.name !== 'RSI');
    options.yAxis = options.yAxis.filter(y => y.id !== 'rsiAxis');
    
    myChart.setOption({
        series: options.series,
        yAxis: options.yAxis
    }, { replaceMerge: ['series', 'yAxis'] });
    
    window.isRSIvisible = false;
};


// =========================================================================
// FUNCIONES MACD
// =========================================================================

/**
 * Agrega el indicador MACD (Moving Average Convergence Divergence).
 */
window.mostrarMACD = function () { 
  const myChart = echarts.getInstanceByDom(document.getElementById("kline-chart"));
  const currentData = window.currentData; 

  if (!myChart || currentData.length === 0) {
    console.error("MACD: No se puede calcular sin datos o gráfico.");
    return;
  }
    
    // 1. Ocultar otros indicadores
    asegurarExclusividad('MACD');
    
    // 2. Toggle: Ocultar si ya está visible
    if (window.isMACDvisible) {
        window.ocultarMACD();
        return;
    }

    const closes = currentData.map(d => d.Close);

    function ema(values, span) {
      const k = 2 / (span + 1);
      let emaArr = [];
      
      for(let i = 0; i < span - 1; i++) { emaArr.push(null); }
      
      let prev = values.slice(0, span).reduce((a, b) => a + b, 0) / span;
      emaArr.push(prev);

      for (let i = span; i < values.length; i++) {
        const val = values[i] * k + prev * (1 - k);
        emaArr.push(val); 
        prev = val;
      }
      return emaArr;
    }

    // Fases del cálculo MACD (12, 26, 9)
    const ema12 = ema(closes, 12);
    const ema26 = ema(closes, 26);
    const macdLine = ema12.map((v, i) => v !== null && ema26[i] !== null ? v - ema26[i] : null);
    
    const macdValuesForSignal = macdLine.filter(v => v !== null);
    const signalValues = ema(macdValuesForSignal, 9);
    
    let signalLine = [];
    const initialNulls = macdLine.length - macdValuesForSignal.length;
    for(let i = 0; i < initialNulls; i++) { signalLine.push(null); }
    signalLine.push(...signalValues);

    const histogram = macdLine.map((v, i) => v !== null && signalLine[i] !== null ? v - signalLine[i] : null);

    // Limpiar series de indicadores previas
    let options = myChart.getOption();
    options.series = options.series.filter(s => s.type === 'candlestick');
    options.yAxis = options.yAxis.filter(y => y.id !== 'rsiAxis' && y.id !== 'macdAxis'); 

    // Configurar y agregar la serie MACD a ECharts
    myChart.setOption({
      yAxis: [
        options.yAxis[0], 
        {
          id: 'macdAxis',
          name: 'MACD',
          position: 'right', 
          offset: 0, 
          splitLine: { show: false },
          axisLabel: { formatter: '{value}', color: 'blue' }
        }
      ],
      series: [
        ...options.series, // velas
        {
          name: "MACD",
          type: "line",
          data: macdLine,
          lineStyle: { color: "blue", width: 3 },
          showSymbol: false,
          yAxisIndex: 1
        },
        {
          name: "Signal",
          type: "line",
          data: signalLine,
          lineStyle: { color: "orange", width: 1, type: "dashed" },
          showSymbol: false,
          yAxisIndex: 1
        },
        {
          name: "Histograma",
          type: "bar",
          data: histogram,
          itemStyle: { color: p => p.value >= 0 ? "green" : "red" },
          yAxisIndex: 1
        }
      ]
    });
    window.isMACDvisible = true;
};

window.ocultarMACD = function() {
    const myChart = echarts.getInstanceByDom(document.getElementById("kline-chart"));
    if (!myChart) return;

    let options = myChart.getOption();
    
    // Filtra las series y el eje Y para eliminar los del MACD
    options.series = options.series.filter(s => s.name !== 'MACD' && s.name !== 'Signal' && s.name !== 'Histograma');
    options.yAxis = options.yAxis.filter(y => y.id !== 'macdAxis');
    
    myChart.setOption({
        series: options.series,
        yAxis: options.yAxis
    }, { replaceMerge: ['series', 'yAxis'] });
    
    window.isMACDvisible = false;
};
