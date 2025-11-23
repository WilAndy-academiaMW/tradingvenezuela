// app.js
document.querySelectorAll('.menu-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Ocultar todos los paneles
    document.querySelectorAll('.panel').forEach(panel => {
      panel.classList.remove('active');
    });

    // Mostrar el panel correspondiente
    const panelId = btn.getAttribute('data-panel');
    document.getElementById(panelId).classList.add('active');
  });
});
