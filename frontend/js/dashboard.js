// Asegurar que las funciones sean globales para que el HTML las vea
window.irPacientes = function() {
    window.location.href = "pacientes.html";
};

window.irCitas = function() {
    window.location.href = "citas.html";
};

window.logout = function() {
    localStorage.clear();
    window.location.replace("index.html");
};

// Lógica de carga de datos
document.addEventListener("DOMContentLoaded", () => {
    const clinicaID = localStorage.getItem("clinicaID");
    const clinicaNombre = localStorage.getItem("clinicaNombre");
    const rol = localStorage.getItem("rol");

    if (!clinicaID || !clinicaNombre || !rol) {
        window.location.replace("index.html");
        return;
    }

    document.getElementById("clinica").innerText = `Bienvenido a ${clinicaNombre}`;
    document.getElementById("usuarioInfo").innerText = `Rol: ${rol.toUpperCase()}`;

    const pacientes = JSON.parse(localStorage.getItem(`pacientes_${clinicaID}`)) || [];
    document.getElementById("totalPacientes").innerText = pacientes.length;
    
    // Aquí puedes meter la lógica de las citas de hoy que ya tenías
});
