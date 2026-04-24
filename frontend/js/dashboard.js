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

// MODIFICADO: Función asíncrona para obtener contadores reales
async function actualizarContadores(clinicaID) {
    const totalPacientesElem = document.getElementById("totalPacientes");
    const totalCitasElem = document.getElementById("totalCitas");

    try {
        // Llamamos a las funciones de storage.js que ahora consultan la nube
        const pacientes = await getPacientes();
        const citas = await getCitas();

        if(totalPacientesElem) totalPacientesElem.innerText = pacientes.length;
        if(totalCitasElem) totalCitasElem.innerText = citas.length;
        
        console.log("📊 Contadores sincronizados con la nube");
    } catch (error) {
        console.error("Error al actualizar contadores:", error);
        // Fallback: mostrar lo que haya en local si la nube falla
        const pacLocal = JSON.parse(localStorage.getItem(`pacientes_${clinicaID}`)) || [];
        const citLocal = JSON.parse(localStorage.getItem(`citas_${clinicaID}`)) || [];
        if(totalPacientesElem) totalPacientesElem.innerText = pacLocal.length;
        if(totalCitasElem) totalCitasElem.innerText = citLocal.length;
    }
}

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

    // Ejecutar la actualización de contadores
    actualizarContadores(clinicaID);
});
