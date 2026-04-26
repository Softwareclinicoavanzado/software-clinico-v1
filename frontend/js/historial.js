/* =============================================
    HISTORIAL CLÍNICO PRO (SUPABASE DIRECTO)
============================================= */
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

// ✅ CORREGIDO: Carga desde Supabase directamente
async function inicializarHistorial() {
    try {
        // 1. Obtener datos del paciente desde Supabase
        const { data: pacientes, error: errorPac } = await supabase
            .from('pacientes')
            .select('*')
            .eq('id', pacienteID)
            .single();

        if (errorPac || !pacientes) {
            alert("Paciente no encontrado.");
            window.location.href = "pacientes.html";
            return;
        }

        paciente = pacientes;
        if (pNombre) pNombre.textContent = `Paciente: ${paciente.nombre}`;

        // 2. Cargar historial desde Supabase
        const { data: historialCloud, error: errorHist } = await supabase
            .from('historial')
            .select('*')
            .eq('paciente_id', pacienteID)
            .order('created_at', { ascending: false });

        if (errorHist) throw errorHist;

        historial = historialCloud || [];
        console.log("✅ Historial sincronizado desde Supabase");

    } catch (e) {
        console.warn("📡 Modo local: Cargando historial desde caché", e);
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
                <button onclick="eliminarNota('${h.id}', ${index})" 
                        style="background: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.7rem;">
                    Eliminar
                </button>
            </div>
            <p style="white-space: pre-wrap; margin-top:12px; color: #e2e8f0; line-height: 1.4;">${h.texto}</p>
        `;
        listaHistorial.appendChild(div);
    });
}

// ✅ CORREGIDO: Guarda directo en Supabase
async function agregarNota() {
    const texto = notaInput.value.trim();
    if (!texto) return alert("Por favor, escribe el detalle de la nota.");

    const nuevaNota = {
        paciente_id: pacienteID,
        clinica_id: clinicaID,
        tipo: tipoNotaInput.value,
        texto: texto,
        fecha: new Date().toLocaleString("es-GT")
    };

    try {
        const { error } = await supabase
            .from('historial')
            .insert([nuevaNota]);

        if (error) throw error;

        alert("✅ Nota guardada en la nube correctamente.");
        notaInput.value = "";
        window.location.href = "historial.html?mode=modificar";

    } catch (e) {
        console.error("Error al guardar nota:", e);
        alert("Error al guardar: " + e.message);
    }
}

// ✅ CORREGIDO: Elimina de Supabase también
async function eliminarNota(id, index) {
    if (!confirm("¿Estás seguro de eliminar este registro?")) return;

    try {
        const { error } = await supabase
            .from('historial')
            .delete()
            .eq('id', id);

        if (error) throw error;

        historial.splice(index, 1);
        render();

    } catch (e) {
        alert("Error al eliminar: " + e.message);
    }
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

function volver() { window.location.href = "pacientes.html"; }

function gestionarVistaActual() {
    const params = new URLSearchParams(window.location.search);
    const modo = params.get("mode");

    if (modo === "nuevaNota") {
        if(tituloPrincipal) tituloPrincipal.textContent = "Nueva Nota Médica";
        if(seccionAgregar) seccionAgregar.style.display = "block";
        if(seccionVer) seccionVer.style.display = "none";
        setTimeout(() => { if(notaInput) notaInput.focus(); }, 300);
    } else {
        if(tituloPrincipal) tituloPrincipal.textContent = "Gestión de Historial";
        if(seccionAgregar) seccionAgregar.style.display = "none";
        if(seccionVer) seccionVer.style.display = "block";
        render();
    }
}

inicializarHistorial();
