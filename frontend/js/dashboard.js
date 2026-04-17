// Asegurar que las funciones sean globales para que los botones onclick las vean
window.irPacientes = function(modo) {
    // Redirige pasando el modo (ver o nuevo) en la URL
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

    const pacientesKey = `pacientes_${clinicaID}`;
    const pacientes = JSON.parse(localStorage.getItem(pacientesKey)) || [];
    const totalElem = document.getElementById("totalPacientes");
    if(totalElem) totalElem.innerText = pacientes.length;
});
