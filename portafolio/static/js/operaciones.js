const modal = document.getElementById("modalOperacion");
const cerrarModal = document.getElementById("cerrarModal");
const tituloOperacion = document.getElementById("tituloOperacion");
const btnCompra = document.querySelector(".btn-compra");
const btnVenta = document.querySelector(".btn-venta");
const formOperacion = document.getElementById("formOperacion");

btnCompra.addEventListener("click", () => {
  tituloOperacion.textContent = "Comprar Acción";
  document.getElementById("btnConfirmar").style.backgroundColor = "#238636"; // verde
  modal.style.display = "flex";
});

btnVenta.addEventListener("click", () => {
  tituloOperacion.textContent = "Vender Acción";
  document.getElementById("btnConfirmar").style.backgroundColor = "#da3633"; // rojo
  modal.style.display = "flex";
});

cerrarModal.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

formOperacion.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    ticker: document.getElementById("ticker").value,
    cantidad: document.getElementById("cantidad").value,
    precio: document.getElementById("precio").value
  };

  let url = tituloOperacion.textContent.includes("Comprar") 
    ? "http://127.0.0.1:5000/api/comprar" 
    : "http://127.0.0.1:5000/api/vender";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error("Error en la petición: " + res.status);

    const result = await res.json();
    alert(result.message);

    // Recargar tabla después de operación
    cargarTablaAcciones();
  } catch (err) {
    alert("Hubo un problema: " + err.message);
  }

  modal.style.display = "none";
  formOperacion.reset();
});
