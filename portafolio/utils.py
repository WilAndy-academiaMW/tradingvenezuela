import matplotlib.pyplot as plt
import csv

def generar_svg(csv_file):
    fechas = []
    valores = []
    with open(csv_file, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            fechas.append(row["fecha"])
            valores.append(float(row["valor"]))

    fig, ax = plt.subplots()
    ax.plot(fechas, valores, marker="o")
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig("static/grafico.svg", format="svg")
