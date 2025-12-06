const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const app = express();
app.use(express.static('public')); // sirve tu index.html y portafolio.js

// Función para leer CSV
function leerCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

async function crearPortafolioJSON() {
  // --- 1. Leer precios actuales ---
  const preciosRows = await leerCSV(path.join(__dirname, 'Último_precio_Bs.csv'));
  const precios = {};
  preciosRows.forEach(r => {
    const simbolo = r.Symbol || r.simbolo;
    precios[simbolo] = parseFloat(r.Price);
  });

  // --- 2. Leer portafolio ---
  const portafolioRows = await leerCSV(path.join(__dirname, 'portafolio/csv/portafolio.csv'));
  const posiciones = [];
  let totalInvertido = 0;
  let valorTotal = 0;

  portafolioRows.forEach(r => {
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

  const resumen = {
    Valor_Total_Portafolio: valorTotal,
    Total_Invertido: totalInvertido,
    Ganancia_Neta: valorTotal - totalInvertido
  };

  return { resumen, posiciones };
}

// Endpoint API
app.get('/api/portafolio', async (req, res) => {
  try {
    const data = await crearPortafolioJSON();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar portafolio' });
  }
});

app.listen(3000, () => console.log('Servidor en http://localhost:3000'));
