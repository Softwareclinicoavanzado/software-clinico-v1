// Asegurar que las funciones sean globales para que los botones onclick las vean
window.irPacientes = function(modo) {
    window.location.href = `pacientes.html?mode=${modo}`;
};

window.irCitas = function() {
    window.location.href = "citas.html";
};

window.logout = function() {
    localStorage.clear();
    window.location.replace("index.html");
};

document.addEventListener("DOMContentLoaded", () => {
    const clinicaID = localStorage.getItem("clinicaID");
    const clinicaNombre = localStorage.getItem("clinicaNombre");
    const rol = localStorage.getItem("rol");

    if (!clinicaID || !clinicaNombre || !rol) {
        window.location.replace("index.html");
        return;
    }

    const clinicaElem = document.getElementById("clinica");
    const usuarioElem = document.getElementById("usuarioInfo");
    
    if(clinicaElem) clinicaElem.innerText = `Bienvenido a ${clinicaNombre}`;
    if(usuarioElem) usuarioElem.innerText = `Rol: ${rol.toUpperCase()}`;

    // --- LÓGICA DE CONTADORES ---

    // 1. Contador de Pacientes
    const pacientesKey = `pacientes_${clinicaID}`;
    const pacientes = JSON.parse(localStorage.getItem(pacientesKey)) || [];
    const totalPacientesElem = document.getElementById("totalPacientes");
    if(totalPacientesElem) totalPacientesElem.innerText = pacientes.length;

    // 2. Contador de Citas
    const citasKey = `citas_${clinicaID}`; // Usamos la misma estructura de llave por clínica
    const citas = JSON.parse(localStorage.getItem(citasKey)) || [];
    const totalCitasElem = document.getElementById("totalCitas");
    if(totalCitasElem) totalCitasElem.innerText = citas.length;
});
