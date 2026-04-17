/* =========================
    HISTORIAL CLÍNICO PRO
========================= */
const rol = localStorage.getItem("rol");
const clinicaID = localStorage.getItem("clinicaID");
const pacienteID = localStorage.getItem("pacienteActual");

if (!clinicaID || !pacienteID) {
    window.location.href = "pacientes.html";
}

// Bloqueo de Recepción
if (rol === "recepcion") {
    alert("Acceso denegado: Solo médicos.");
    window.location.href = "pacientes.html";
}

const pacientesLocales = JSON.parse(localStorage.getItem(`pacientes_${clinicaID}`)) || [];
const paciente = pacientesLocales.find(p => String(p.id) === String(pacienteID));

if (!paciente) {
    alert("Paciente no encontrado.");
    window.location.href = "pacientes.html";
}

// Referencias DOM
const notaInput = document.getElementById("nota");
const tipoNotaInput = document.getElementById("tipoNota");
const listaHistorial = document.getElementById("listaHistorial");

// Nuevas referencias para las secciones
const seccionAgregar = document.getElementById("seccionAgregarNota");
const seccionVer = document.getElementById("seccionVerHistorial");
const tituloPrincipal = document.getElementById("tituloPrincipal");

let historial = JSON.parse(localStorage.getItem(`historial_${pacienteID}`)) || [];

function render() {
    if (!listaHistorial) return;
    listaHistorial.innerHTML = historial.length === 0 
        ? `<div class="card"><p>No hay registros médicos previos.</p></div>`
        : "";

    historial.forEach((h, index) => {
        const div = document.createElement("div");
        div.className = "card";
        div.style.marginBottom = "15px";
        const colorTipo = h.tipo === "Receta" ? "#34d399" : "#93c5fd";

        div.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <strong style="color: ${colorTipo};">${h.tipo.toUpperCase()}</strong>
                <small style="color: #64748b;">${h.fecha}</small>
            </div>
            <p style="white-space: pre-wrap; margin-top:10px;">${h.texto}</p>
            <div style="text-align: right;">
                <button onclick="eliminarNota(${index})" style="background:none; border:1px solid #ef4444; color:#ef4444; cursor:pointer; padding:2px 5px; font-size:10px;">Eliminar</button>
            </div>
        `;
        listaHistorial.appendChild(div);
    });
}

async function agregarNota() {
    const texto = notaInput.value.trim();
    if (!texto) return alert("Escribe el detalle.");

    const nuevaNota = {
        id: Date.now(),
        tipo: tipoNotaInput.value,
        texto: texto,
        fecha: new Date().toLocaleString("es-GT")
    };

    historial.unshift(nuevaNota);
    localStorage.setItem(`historial_${pacienteID}`, JSON.stringify(historial));
    notaInput.value = "";
    
    // Al guardar, lo enviamos automáticamente a la vista de modificar para que vea su nota
    alert("Nota agregada correctamente.");
    window.location.href = "historial.html?mode=modificar";

    // Sync silencioso al backend
    try {
        fetch(`https://software-clinico-v1.onrender.com/api/historial?paciente_id=${pacienteID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevaNota)
        });
    } catch (e) { console.log("Guardado en local"); }
}

function exportarPDF() {
    if (!window.jspdf) return alert("Error cargando librería PDF");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.text(`Historial: ${paciente.nombre}`, 10, 10);
    let y = 30;
    historial.forEach(h => {
        doc.text(`${h.fecha} - ${h.tipo}`, 10, y);
        y += 10;
        doc.text(h.texto.substring(0, 50), 15, y);
        y += 15;
    });
    doc.save(`Historial_${paciente.nombre}.pdf`);
}

function eliminarNota(index) {
    if(confirm("¿Borrar registro?")) {
        historial.splice(index, 1);
        localStorage.setItem(`historial_${pacienteID}`, JSON.stringify(historial));
        render();
    }
}

function volver() { window.location.href = "pacientes.html"; }

// Lógica para gestionar qué se muestra según el modo
function gestionarVistaActual() {
    const params = new URLSearchParams(window.location.search);
    const modo = params.get("mode");

    if (modo === "nuevaNota") {
        tituloPrincipal.textContent = "Nueva Nota Médica";
        document.getElementById("pacienteNombre").textContent = `${paciente.nombre} — Creando registro`;
        seccionAgregar.style.display = "block";
        seccionVer.style.display = "none";
        setTimeout(() => notaInput.focus(), 300);
    } else {
        tituloPrincipal.textContent = "Modificar Historial Médico";
        document.getElementById("pacienteNombre").textContent = `${paciente.nombre} — Gestión de registros`;
        seccionAgregar.style.display = "none";
        seccionVer.style.display = "block";
        render();
    }
}

// Ejecutamos la gestión de vista al cargar
gestionarVistaActual();
