// Funciones globales de navegación
window.irPacientes = function(modo) {
    window.location.href = `pacientes.html?mode=${modo}`;
};

window.irCitas = function(modo) {
    window.location.href = `citas.html?mode=${modo}`;
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
    const pacientesKey = `pacientes_${clinicaID}`;
    const pacientes = JSON.parse(localStorage.getItem(pacientesKey)) || [];
    const totalPacientesElem = document.getElementById("totalPacientes");
    if(totalPacientesElem) totalPacientesElem.innerText = pacientes.length;

    const citasKey = `citas_${clinicaID}`;
    const citas = JSON.parse(localStorage.getItem(citasKey)) || [];
    const totalCitasElem = document.getElementById("totalCitas");
    if(totalCitasElem) totalCitasElem.innerText = citas.length;
});
