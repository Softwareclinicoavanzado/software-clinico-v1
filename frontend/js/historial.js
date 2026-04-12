/* =========================
    HISTORIAL CLÍNICO PRO
========================= */

// ... (Mantenemos tus puntos 1, 2 y 3 exactamente igual)

const pacienteID = localStorage.getItem("pacienteActual");
const todasLasClinicasPacientes = JSON.parse(localStorage.getItem(`pacientes_${clinicaID}`)) || [];
const paciente = todasLasClinicasPacientes.find(p => String(p.id) === String(pacienteID));

// Mostrar nombre en la interfaz
document.getElementById("pacienteNombre").textContent = `${paciente.nombre} — Historial Médico`;

/* =========================
    ELEMENTOS DOM
========================= */
const notaInput = document.getElementById("nota");
const tipoNotaInput = document.getElementById("tipoNota");
const listaHistorial = document.getElementById("listaHistorial");

/* =========================
    MEJORA: AUTO-FOCUS ALERGIAS/NOTAS
========================= */
// Si el usuario viene de "Agregar Nota", enfocamos el textarea
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('action') === 'addNote' && notaInput) {
    setTimeout(() => {
        notaInput.focus();
        // Opcional: Podrías pre-escribir "Alergias: " si quisieras
        notaInput.placeholder = "Escriba aquí alergias, diagnósticos o recetas...";
    }, 500); 
}

/* =========================
    GESTIÓN DEL HISTORIAL
========================= */
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
        div.className = "card";
        div.style.textAlign = "left";
        div.style.marginBottom = "15px";
        
        // Mejora visual: Si la nota es una receta, ponerle un color diferente
        const colorTipo = h.tipo === "Receta" ? "#34d399" : "#93c5fd";

        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="color: ${colorTipo};">${h.tipo.toUpperCase()}</strong>
                <small style="color: #64748b;">${h.fecha}</small>
            </div>
            <hr style="border: 0.5px solid #1e293b; margin: 10px 0;">
            <p style="white-space: pre-wrap; color: #cbd5e1;">${h.texto}</p>
            <div style="text-align: right; margin-top: 10px;">
                <button class="logout" style="padding: 5px 10px; font-size: 12px; background: transparent; border: 1px solid #ef4444; color: #ef4444;" onclick="eliminarNota(${index})">Eliminar</button>
            </div>
        `;
        listaHistorial.appendChild(div);
    });
}

function agregarNota() {
    const texto = notaInput.value.trim();
    if (!texto) return alert("Por favor, escribe el detalle.");

    const nuevaNota = {
        id: Date.now(),
        tipo: tipoNotaInput ? tipoNotaInput.value : "Consulta General",
        texto: texto,
        fecha: fechaBonita(),
        paciente_id: pacienteID // Importante para la base de datos
    };

    historial.unshift(nuevaNota);
    localStorage.setItem(`historial_${pacienteID}`, JSON.stringify(historial));
    notaInput.value = "";
    
    if (typeof syncAllToCloud === "function") {
        syncAllToCloud().catch(e => console.warn("Error sync:", e));
    }
    render();
}

function eliminarNota(index) {
    if (confirm("¿Borrar este registro?")) {
        historial.splice(index, 1);
        localStorage.setItem(`historial_${pacienteID}`, JSON.stringify(historial));
        render();
    }
}

function volver() {
    window.location.href = "pacientes.html";
}

render();
