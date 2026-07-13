// Funciones globales de navegación
window.irPacientes = function(modo) {
    window.location.href = `pacientes.html?mode=${modo}`;
};
window.irCitas = function(modo) {
    window.location.href = `citas.html?mode=${modo}`;
};
window.irUsuarios = function() {
    window.location.href = `usuarios.html`;
};
window.logout = function() {
    // ✅ Ahora usa cerrarSesion() de session.js, que también cierra sesión en Supabase Auth
    if (typeof cerrarSesion === "function") {
        cerrarSesion();
    } else {
        localStorage.clear();
        window.location.replace("index.html");
    }
};

async function actualizarContadores(clinicaID) {
    const totalPacientesElem = document.getElementById("totalPacientes");
    const totalCitasElem = document.getElementById("totalCitas");
    try {
        const pacientes = await getPacientes();
        const citas = await getCitas();
        if(totalPacientesElem) totalPacientesElem.innerText = pacientes.length;
        if(totalCitasElem) totalCitasElem.innerText = citas.length;
        console.log("📊 Contadores sincronizados con la nube");
    } catch (error) {
        console.error("Error al actualizar contadores:", error);
        const pacLocal = JSON.parse(localStorage.getItem(`pacientes_${clinicaID}`)) || [];
        const citLocal = JSON.parse(localStorage.getItem(`citas_${clinicaID}`)) || [];
        if(totalPacientesElem) totalPacientesElem.innerText = pacLocal.length;
        if(totalCitasElem) totalCitasElem.innerText = citLocal.length;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const clinicaID = localStorage.getItem("clinicaID");
    const rol = localStorage.getItem("rol");

    if (!clinicaID || !rol) {
        window.location.replace("index.html");
        return;
    }

    const clinicaElem = document.getElementById("clinica");
    const usuarioElem = document.getElementById("usuarioInfo");
    const usuario = localStorage.getItem("usuario");
    // ✅ Nuevo: recuperamos el nombre bonito de la clínica
    const clinicaNombre = localStorage.getItem("clinicaNombre");

    if(clinicaElem) clinicaElem.innerText = clinicaNombre ? `Bienvenido a ${clinicaNombre}` : "ClinicOS";
    if(usuarioElem) usuarioElem.innerText = `${usuario || ""} · Rol: ${rol.toUpperCase()}`;

    // Mostrar botón de "Gestionar Usuarios" solo si el rol es admin
    if (rol === "admin") {
        const btnUsuarios = document.getElementById("btnUsuarios");
        if (btnUsuarios) btnUsuarios.style.display = "block";
    }

    actualizarContadores(clinicaID);
});
