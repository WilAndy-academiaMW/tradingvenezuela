from flask import Flask, request, jsonify
from flask_cors import CORS
import csv
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)   # habilita CORS para llamadas desde tu frontend

CSV_FILE = "data.csv"
HEADER = ["fecha", "ticker", "cantidad", "precio"]

# Crear CSV con encabezado si no existe o está vacío
if not os.path.exists(CSV_FILE) or os.path.getsize(CSV_FILE) == 0:
    with open(CSV_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(HEADER)

@app.route("/api/comprar", methods=["POST"])
def comprar():
    """Registrar una compra en el CSV"""
    data = request.get_json()
    fecha = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(CSV_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([fecha, data["ticker"], data["cantidad"], data["precio"]])
    return jsonify({"message": "Compra registrada en CSV"})

@app.route("/api/vender", methods=["POST"])
def vender():
    """Registrar una venta parcial o total"""
    data = request.get_json()
    ticker = data["ticker"]
    cantidad_vender = int(data["cantidad"])

    # Leer todas las filas
    with open(CSV_FILE, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        rows = list(reader)

    header, registros = rows[0], rows[1:]
    nuevos_registros = []
    vendido = False

    for r in registros:
        if r[1] == ticker:
            cantidad_actual = int(r[2])
            precio = r[3]

            if cantidad_vender >= cantidad_actual:
                # 🔹 Si vende todas → no se agrega la fila
                vendido = True
                continue
            else:
                # 🔹 Si vende una parte → restar cantidad
                nueva_cantidad = cantidad_actual - cantidad_vender
                nuevos_registros.append([r[0], ticker, nueva_cantidad, precio])
                vendido = True
        else:
            nuevos_registros.append(r)

    # Reescribir CSV
    with open(CSV_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(nuevos_registros)

    if vendido:
        return jsonify({"message": f"Venta de {cantidad_vender} {ticker} registrada en CSV"})
    else:
        return jsonify({"error": f"No se encontraron acciones de {ticker}"}), 404

@app.route("/api/data")
def data():
    """Devolver todas las acciones registradas en JSON"""
    acciones = []
    with open(CSV_FILE, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            acciones.append(row)
    return jsonify(acciones)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
