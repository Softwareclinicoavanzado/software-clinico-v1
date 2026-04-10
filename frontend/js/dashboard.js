// 1. Obtención de datos con validación
const clinicaID = localStorage.getItem("clinicaID");
const clinicaNombre = localStorage.getItem("clinicaNombre");
const rol = localStorage.getItem("rol");

// Si no hay sesión, rebota al login de inmediato
if (!clinicaID || !clinicaNombre || !rol) {
    window.location.replace("index.html");
}

// 2. Mostrar Info de la Clínica
document.getElementById("clinica").innerText = `Bienvenido a ${clinicaNombre}`;
document.getElementById("usuarioInfo").innerText = `Rol: ${rol.toUpperCase()}`;

// 3. Cargar Pacientes
const pacientes = JSON.parse(localStorage.getItem(`pacientes_${clinicaID}`)) || [];
document.getElementById("totalPacientes").innerText = pacientes.length;

// 4. Cargar Citas de Hoy
const statsContainer = document.getElementById("statsContainer");
if (statsContainer) {
    const citas = JSON.parse(localStorage.getItem(`citas_${clinicaID}`)) || [];
    const hoy = new Date().toISOString().split("T")[0];
    const citasHoy = citas.filter(c => c.fecha === hoy).length;

    // Crear la tarjeta de citas dinámicamente
    const stat = document.createElement("div");
    stat.className = "stat-card";
    stat.innerHTML = `<h2>${citasHoy}</h2><p>Citas para hoy</p>`;
    statsContainer.appendChild(stat);
}

// 5. Funciones de Navegación (Asegúrate de que los HTML existan)
function irPacientes() {
    window.location.href = "pacientes.html";
}

function irCitas() {
    window.location.href = "citas.html";
}

function logout() {
    console.log("Cerrando sesión...");
    localStorage.clear();
    window.location.replace("index.html");
}
