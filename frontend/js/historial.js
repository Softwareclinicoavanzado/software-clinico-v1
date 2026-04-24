/* =============================================
    HISTORIAL CLÍNICO PRO (CLOUD-SYNC)
============================================= */
const rol = localStorage.getItem("rol");
const clinicaID = localStorage.getItem("clinicaID");
const pacienteID = localStorage.getItem("pacienteActual");
const API_URL = "https://software-clinico-v1.onrender.com";

// Protección de ruta
if (!clinicaID || !pacienteID) {
    window.location.href = "pacientes.html";
}

if (rol === "recepcion") {
    alert("Acceso denegado: Solo médicos.");
    window.location.href = "pacientes.html";
}

// Referencias DOM
const notaInput = document.getElementById("nota");
const tipoNotaInput = document.getElementById("tipoNota");
const listaHistorial = document.getElementById("listaHistorial");
const seccionAgregar = document.getElementById("seccionAgregarNota");
const seccionVer = document.getElementById("seccionVerHistorial");
const tituloPrincipal = document.getElementById("tituloPrincipal");
const pNombre = document.getElementById("pacienteNombre");

let paciente = null;
let historial = [];

// MODIFICADO: Carga inicial desde la nube
async function inicializarHistorial() {
    // 1. Obtener datos del paciente para el título
    const pacientesLocales = JSON.parse(localStorage.getItem(`pacientes_${clinicaID}`)) || [];
    paciente = pacientesLocales.find(p => String(p.id) === String(pacienteID));

    if (!paciente) {
        alert("Paciente no encontrado.");
        window.location.href = "pacientes.html";
        return;
    }

    if (pNombre) pNombre.textContent = `Paciente: ${paciente.nombre}`;

    // 2. Cargar historial desde la nube
    try {
        const response = await fetch(`${API_URL}/api/historial?paciente_id=${pacienteID}`);
        if (response.ok) {
            historial = await response.json();
            localStorage.setItem(`historial_${pacienteID}`, JSON.stringify(historial));
            console.log("✅ Historial sincronizado desde la nube");
        }
    } catch (e) {
        console.warn("📡 Modo local: Cargando historial desde caché");
        historial = JSON.parse(localStorage.getItem(`historial_${pacienteID}`)) || [];
    }

    gestionarVistaActual();
}

function render() {
    if (!listaHistorial) return;
    listaHistorial.innerHTML = "";

    if (!historial || historial.length === 0) {
        listaHistorial.innerHTML = `<div class="card"><p style="text-align:center; opacity:0.6;">No hay registros médicos en este historial.</p></div>`;
        return;
    }

    historial.forEach((h, index) => {
        const div = document.createElement("div");
        div.className = "card";
        div.style.marginBottom = "15px";
        
        // Colores según tipo
        let colorBorde = "#3498db"; 
        let colorTitulo = "#93c5fd";
        
        if (h.tipo === "Alergia") {
            colorBorde = "#e74c3c";
            colorTitulo = "#e74c3c";
        } else if (h.tipo === "Receta") {
            colorBorde = "#34d399";
            colorTitulo = "#34d399";
        }

        div.style.borderLeft = `4px solid ${colorBorde}`;

        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <strong style="color: ${colorTitulo}; font-size: 1.1rem;">
                        ${h.tipo === "Alergia" ? "⚠️ " + h.tipo.toUpperCase() : h.tipo.toUpperCase()}
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
        paciente_id: pacienteID, // Importante para la base de datos
        tipo: tipoNotaInput.value,
        texto: texto,
        fecha: new Date().toLocaleString("es-GT")
    };

    // Actualización visual inmediata
    historial.unshift(nuevaNota);
    localStorage.setItem(`historial_${pacienteID}`, JSON.stringify(historial));
    render();
    
    // Sincronización con el Backend
    try {
        const response = await fetch(`${API_URL}/api/historial`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevaNota)
        });
        
        if (response.ok) {
            alert("✅ Guardado en la nube correctamente.");
        }
    } catch (e) { 
        console.error("Error de red, el dato quedó guardado solo localmente."); 
    }

    notaInput.value = "";
    window.location.href = "historial.html?mode=modificar";
}

function exportarPDF() {
    if (!window.jspdf || !paciente) return alert("Error con los datos o la librería PDF");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(`HISTORIAL CLÍNICO: ${paciente.nombre}`, 10, 20);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 10, 28);
    
    let y = 40;
    historial.forEach(h => {
        if (y > 270) { doc.addPage(); y = 20; }
        
        if (h.tipo === "Alergia") {
            doc.setTextColor(231, 76, 60);
            doc.setFont("helvetica", "bold");
            doc.text(`⚠️ ${h.fecha} - ${h.tipo.toUpperCase()}`, 10, y);
        } else {
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");
            doc.text(`${h.fecha} - ${h.tipo}`, 10, y);
        }
        
        y += 7;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        const lines = doc.splitTextToSize(h.texto, 180);
        doc.text(lines, 15, y);
        y += (lines.length * 6) + 10;
    });
    doc.save(`Historial_${paciente.nombre.replace(/\s+/g, '_')}.pdf`);
}

function eliminarNota(index) {
    if(confirm("¿Estás seguro de eliminar este registro?")) {
        historial.splice(index, 1);
        localStorage.setItem(`historial_${pacienteID}`, JSON.stringify(historial));
        render();
        // Nota: Faltaría implementar el DELETE en el servidor para borrar de Supabase
    }
}

function volver() { window.location.href = "pacientes.html"; }

function gestionarVistaActual() {
    const params = new URLSearchParams(window.location.search);
    const modo = params.get("mode");

    if (modo === "nuevaNota") {
        tituloPrincipal.textContent = "Nueva Nota Médica";
        seccionAgregar.style.display = "block";
        seccionVer.style.display = "none";
        setTimeout(() => notaInput.focus(), 300);
    } else {
        tituloPrincipal.textContent = "Gestión de Historial";
        seccionAgregar.style.display = "none";
        seccionVer.style.display = "block";
        render();
    }
}

// Arrancar el sistema
inicializarHistorial();
