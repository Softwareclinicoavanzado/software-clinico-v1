/* =========================
    HISTORIAL CLÍNICO PRO
========================= */

const rol = localStorage.getItem("rol");
const clinicaID = localStorage.getItem("clinicaID");
const API_URL = "https://software-clinico-v1.onrender.com";

if (!clinicaID) {
    window.location.replace("index.html");
}

if (rol === "recepcion") {
    alert("Acceso denegado: Solo personal médico puede ver historiales.");
    window.location.href = "dashboard.html";
}

const pacienteID = localStorage.getItem("pacienteActual");
if (!pacienteID) {
    alert("Debes seleccionar un paciente primero.");
    window.location.href = "pacientes.html";
}

const todasLasClinicasPacientes = JSON.parse(localStorage.getItem(`pacientes_${clinicaID}`)) || [];
const paciente = todasLasClinicasPacientes.find(p => String(p.id) === String(pacienteID));

if (!paciente) {
    alert("Error: Paciente no encontrado.");
    window.location.href = "pacientes.html";
}

document.getElementById("pacienteNombre").textContent = `${paciente.nombre} — Historial Médico`;

const notaInput = document.getElementById("nota");
const tipoNotaInput = document.getElementById("tipoNota");
const listaHistorial = document.getElementById("listaHistorial");

// AUTO-FOCUS PARA ALERGIAS
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('action') === 'addNote' && notaInput) {
    setTimeout(() => {
        notaInput.focus();
        notaInput.placeholder = "Escriba aquí alergias, diagnósticos o recetas...";
    }, 500); 
}

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
        listaHistorial.innerHTML = `<div class="card"><p>No hay registros médicos previos.</p></div>`;
        return;
    }

    historial.forEach((h, index) => {
        const div = document.createElement("div");
        div.className = "card";
        div.style.textAlign = "left";
        div.style.marginBottom = "15px";
        
        const colorTipo = h.tipo === "Receta" ? "#34d399" : "#93c5fd";

        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="color: ${colorTipo};">${h.tipo.toUpperCase()}</strong>
                <small style="color: #64748b;">${h.fecha}</small>
            </div>
            <hr style="border: 0.5px solid #1e293b; margin: 10px 0;">
            <p style="white-space: pre-wrap; color: #cbd5e1;">${h.texto}</p>
            <div style="text-align: right; margin-top: 10px;">
                <button class="logout" style="padding: 5px 10px; font-size: 12px; background: transparent; border: 1px solid #ef4444; color: #ef4444;" onclick="eliminarNota(${index})">Eliminar Registro</button>
            </div>
        `;
        listaHistorial.appendChild(div);
    });
}

async function agregarNota() {
    const texto = notaInput.value.trim();
    if (!texto) {
        alert("Por favor, escribe el detalle de la consulta.");
        return;
    }

    const nuevaNota = {
        id: Date.now(),
        paciente_id: pacienteID,
        tipo: tipoNotaInput ? tipoNotaInput.value : "Consulta General",
        texto: texto,
        fecha: fechaBonita()
    };

    historial.unshift(nuevaNota);
    localStorage.setItem(`historial_${pacienteID}`, JSON.stringify(historial));
    notaInput.value = "";
    
    // Sincronización con el backend
    try {
        await fetch(`${API_URL}/api/historial?paciente_id=${pacienteID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevaNota)
        });
    } catch (e) {
        console.warn("Sync fallido, guardado local.");
    }

    render();
}

function eliminarNota(index) {
    if (confirm("¿Estás seguro de borrar este registro médico?")) {
        historial.splice(index, 1);
        localStorage.setItem(`historial_${pacienteID}`, JSON.stringify(historial));
        render();
    }
}

function volver() {
    window.location.href = "pacientes.html";
}

render();
