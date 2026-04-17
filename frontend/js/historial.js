/* =========================
    HISTORIAL CLÍNICO PRO
========================= */
const rol = localStorage.getItem("rol");
const clinicaID = localStorage.getItem("clinicaID");
const pacienteID = localStorage.getItem("pacienteActual");

// Protección de ruta
if (!clinicaID || !pacienteID) {
    window.location.href = "pacientes.html";
}

if (rol === "recepcion") {
    alert("Acceso denegado: Solo médicos.");
    window.location.href = "pacientes.html";
}

// Cargar datos del paciente
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
const seccionAgregar = document.getElementById("seccionAgregarNota");
const seccionVer = document.getElementById("seccionVerHistorial");
const tituloPrincipal = document.getElementById("tituloPrincipal");

let historial = JSON.parse(localStorage.getItem(`historial_${pacienteID}`)) || [];

function render() {
    if (!listaHistorial) return;
    listaHistorial.innerHTML = "";

    if (historial.length === 0) {
        listaHistorial.innerHTML = `<div class="card"><p style="text-align:center; opacity:0.6;">No hay registros médicos en este historial.</p></div>`;
        return;
    }

    historial.forEach((h, index) => {
        const div = document.createElement("div");
        div.className = "card";
        div.style.marginBottom = "15px";
        div.style.borderLeft = h.tipo === "Receta" ? "4px solid #34d399" : "4px solid #3498db";

        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <strong style="color: ${h.tipo === "Receta" ? "#34d399" : "#93c5fd"}; font-size: 1.1rem;">
                        ${h.tipo.toUpperCase()}
                    </strong><br>
                    <small style="color: #64748b;">${h.fecha}</small>
                </div>
                <button onclick="eliminarNota(${index})" 
                        style="background: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.7rem;">
                    Eliminar
                </button>
            </div>
            <p style="white-space: pre-wrap; margin-top:12px; color: #e2e8f0; line-height: 1.4;">${h.texto}</p>
        `;
        listaHistorial.appendChild(div);
    });
}

async function agregarNota() {
    const texto = notaInput.value.trim();
    if (!texto) return alert("Por favor, escribe el detalle de la nota.");

    const nuevaNota = {
        id: Date.now(),
        tipo: tipoNotaInput.value,
        texto: texto,
        fecha: new Date().toLocaleString("es-GT")
    };

    historial.unshift(nuevaNota);
    localStorage.setItem(`historial_${pacienteID}`, JSON.stringify(historial));
    notaInput.value = "";
    
    alert("✅ Nota guardada en el historial.");
    
    // Después de agregar, lo mandamos a ver el historial completo
    window.location.href = "historial.html?mode=modificar";

    // Sync silencioso al backend
    try {
        fetch(`https://software-clinico-v1.onrender.com/api/historial?paciente_id=${pacienteID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevaNota)
        });
    } catch (e) { console.warn("Modo local: Sincronización pendiente."); }
}

function exportarPDF() {
    if (!window.jspdf) return alert("Error cargando librería PDF");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(`HISTORIAL CLÍNICO: ${paciente.nombre}`, 10, 20);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 10, 28);
    
    let y = 40;
    historial.forEach(h => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.text(`${h.fecha} - ${h.tipo}`, 10, y);
        y += 7;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(h.texto, 180);
        doc.text(lines, 15, y);
        y += (lines.length * 6) + 10;
    });
    doc.save(`Historial_${paciente.nombre.replace(/\s+/g, '_')}.pdf`);
}

function eliminarNota(index) {
    if(confirm("¿Estás seguro de eliminar este registro permanente?")) {
        historial.splice(index, 1);
        localStorage.setItem(`historial_${pacienteID}`, JSON.stringify(historial));
        render();
    }
}

function volver() { window.location.href = "pacientes.html"; }

// FUNCIÓN CLAVE: Separa las vistas según el parámetro de la URL
function gestionarVistaActual() {
    const params = new URLSearchParams(window.location.search);
    const modo = params.get("mode");
    const pNombre = document.getElementById("pacienteNombre");

    if (modo === "nuevaNota") {
        // MODO AGREGAR
        tituloPrincipal.textContent = "Nueva Nota Médica";
        pNombre.textContent = `Paciente: ${paciente.nombre}`;
        seccionAgregar.style.display = "block"; // Muestra formulario
        seccionVer.style.display = "none";      // Oculta historial
        setTimeout(() => notaInput.focus(), 300);
    } else {
        // MODO MODIFICAR (DEFAULT)
        tituloPrincipal.textContent = "Gestión de Historial";
        pNombre.textContent = `Paciente: ${paciente.nombre}`;
        seccionAgregar.style.display = "none";  // Oculta formulario
        seccionVer.style.display = "block";     // Muestra historial
        render();
    }
}

// Inicializar
gestionarVistaActual();
