/* =========================
    HISTORIAL CLÍNICO PRO
========================= */

// 1. SEGURIDAD DE ACCESO
const rol = localStorage.getItem("rol");
const clinicaID = localStorage.getItem("clinicaID");

if (!clinicaID) {
    window.location.replace("index.html");
}

if (rol === "recepcion") {
    alert("Acceso denegado: Solo personal médico puede ver historiales.");
    window.location.href = "dashboard.html";
}

// 2. IDENTIFICAR PACIENTE
const pacienteID = localStorage.getItem("pacienteActual");
if (!pacienteID) {
    alert("Debes seleccionar un paciente primero.");
    window.location.href = "pacientes.html";
}

// 3. CARGAR DATOS DEL PACIENTE
const todasLasClinicasPacientes = JSON.parse(localStorage.getItem(`pacientes_${clinicaID}`)) || [];
const paciente = todasLasClinicasPacientes.find(p => String(p.id) === String(pacienteID));

if (!paciente) {
    alert("Error: Paciente no encontrado.");
    window.location.href = "pacientes.html";
}

// Mostrar nombre en la interfaz
document.getElementById("pacienteNombre").textContent = `${paciente.nombre} — Historial Médico`;

/* =========================
    ELEMENTOS DOM
========================= */
const notaInput = document.getElementById("nota");
const tipoNotaInput = document.getElementById("tipoNota");
const listaHistorial = document.getElementById("listaHistorial");

/* =========================
    GESTIÓN DEL HISTORIAL
========================= */
// Cargamos el historial específico de este paciente
let historial = JSON.parse(localStorage.getItem(`historial_${pacienteID}`)) || [];

function fechaBonita() {
    return new Date().toLocaleString("es-GT", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

function render() {
    if (!listaHistorial) return;
    listaHistorial.innerHTML = "";

    if (historial.length === 0) {
        listaHistorial.innerHTML = `<div class="card"><p>No hay registros médicos previos para este paciente.</p></div>`;
        return;
    }

    historial.forEach((h, index) => {
        const div = document.createElement("div");
        div.className = "card"; // Usando tu clase del CSS
        div.style.textAlign = "left";
        div.style.marginBottom = "15px";
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="color: #93c5fd;">${h.tipo.toUpperCase()}</strong>
                <small style="color: #64748b;">${h.fecha}</small>
            </div>
            <hr style="border: 0.5px solid #1e293b; margin: 10px 0;">
            <p style="white-space: pre-wrap; color: #cbd5e1;">${h.texto}</p>
            <div style="text-align: right; margin-top: 10px;">
                <button class="logout" style="padding: 5px 10px; font-size: 12px;" onclick="eliminarNota(${index})">Eliminar Registro</button>
            </div>
        `;
        listaHistorial.appendChild(div);
    });
}

/* =========================
    ACCIONES
========================= */
function agregarNota() {
    const texto = notaInput.value.trim();
    if (!texto) {
        alert("Por favor, escribe el detalle de la consulta.");
        return;
    }

    // Nueva nota al inicio de la lista
    const nuevaNota = {
        id: Date.now(),
        tipo: tipoNotaInput ? tipoNotaInput.value : "Consulta General",
        texto: texto,
        fecha: fechaBonita()
    };

    historial.unshift(nuevaNota);
    
    // Guardar y limpiar
    localStorage.setItem(`historial_${pacienteID}`, JSON.stringify(historial));
    notaInput.value = "";
    
    // Sincronización en segundo plano (Opcional)
    if (typeof syncAllToCloud === "function") {
        syncAllToCloud().catch(e => console.warn("Error sync:", e));
    }

    render();
}

function eliminarNota(index) {
    if (confirm("¿Estás seguro de borrar este registro médico? Esta acción es permanente.")) {
        historial.splice(index, 1);
        localStorage.setItem(`historial_${pacienteID}`, JSON.stringify(historial));
        render();
    }
}

function volver() {
    window.location.href = "pacientes.html";
}

// Inicializar
render();
