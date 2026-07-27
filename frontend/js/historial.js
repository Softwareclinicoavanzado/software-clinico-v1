/* =============================================
    HISTORIAL CLÍNICO PRO (SUPABASE DIRECTO)
============================================= */
const rol = localStorage.getItem("rol");
const clinicaID = localStorage.getItem("clinicaID");
const pacienteID = localStorage.getItem("pacienteActual");

if (!clinicaID || !pacienteID) {
    window.location.href = "pacientes.html";
}
if (rol === "recepcion") {
    alert("Acceso denegado: Solo médicos.");
    window.location.href = "pacientes.html";
}

const notaInput = document.getElementById("nota");
const tipoNotaInput = document.getElementById("tipoNota");
const listaHistorial = document.getElementById("listaHistorial");
const seccionAgregar = document.getElementById("seccionAgregarNota");
const seccionVer = document.getElementById("seccionVerHistorial");
const tituloPrincipal = document.getElementById("tituloPrincipal");
const pNombre = document.getElementById("pacienteNombre");

let paciente = null;
let historial = [];
let editandoNotaId = null;

async function inicializarHistorial() {
    try {
        const { data: pacienteData, error: errorPac } = await supabaseClient
            .from('pacientes')
            .select('*')
            .eq('id', pacienteID)
            .single();

        if (errorPac || !pacienteData) {
            alert("Paciente no encontrado.");
            window.location.href = "pacientes.html";
            return;
        }

        paciente = pacienteData;
        if (pNombre) pNombre.textContent = `${t("paciente_label") || "Paciente"}: ${paciente.nombre}`;

        const { data: historialCloud, error: errorHist } = await supabaseClient
            .from('historial')
            .select('*')
            .eq('paciente_id', pacienteID)
            .order('creado', { ascending: false });

        if (errorHist) throw errorHist;

        historial = historialCloud || [];
        console.log("✅ Historial sincronizado desde Supabase");

    } catch (e) {
        console.warn("📡 Modo local: Cargando historial desde caché", e);
        historial = JSON.parse(localStorage.getItem(`historial_${pacienteID}`)) || [];
    }

    gestionarVistaActual();
}

/* =========================
   Config visual por tipo de nota
========================= */
function estiloTipoNota(tipo) {
    if (tipo === "Alergia") {
        return { clase: "note-chip-danger", icono: "⚠️" };
    } else if (tipo === "Receta") {
        return { clase: "note-chip-success", icono: "" };
    } else if (tipo === "Diagnóstico") {
        return { clase: "note-chip-warning", icono: "" };
    }
    return { clase: "note-chip-info", icono: "" };
}

function render() {
    if (!listaHistorial) return;
    listaHistorial.innerHTML = "";

    if (!historial || historial.length === 0) {
        listaHistorial.innerHTML = `<div class="card"><p style="text-align:center; opacity:0.6;">${t("historial_sin_registros")}</p></div>`;
        return;
    }

    historial.forEach((h, index) => {
        const tipoTraducido = traducirTipoNota(h.tipo);
        const estilo = estiloTipoNota(h.tipo);

        const div = document.createElement("div");
        div.className = "note-card";
        div.innerHTML = `
            <div class="note-card-top">
                <div>
                    <span class="note-chip ${estilo.clase}">
                        ${estilo.icono ? estilo.icono + " " : ""}${tipoTraducido}
                    </span>
                    <div class="note-date">${h.fecha}</div>
                </div>
                <div style="display:flex; gap:6px;">
                    <button type="button" class="btn-ghost-icon" onclick="editarNota('${h.id}')" title="${t("historial_editar") || "Editar"}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                    </button>
                    <button type="button" class="btn-ghost-icon" onclick="eliminarNota('${h.id}', ${index})" title="${t("historial_eliminar")}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    </button>
                </div>
            </div>
            <p class="note-text">${h.texto}</p>
        `;
        listaHistorial.appendChild(div);
    });
}

/* =========================
   Editar una nota existente (sin recargar la página)
========================= */
function editarNota(id) {
    const nota = historial.find(h => String(h.id) === String(id));
    if (!nota) return;

    editandoNotaId = id;
    if (tipoNotaInput) tipoNotaInput.value = nota.tipo;
    if (notaInput) notaInput.value = nota.texto;

    if (seccionAgregar) seccionAgregar.style.display = "block";
    if (seccionVer) seccionVer.style.display = "none";
    if (tituloPrincipal) tituloPrincipal.textContent = t("historial_editar_nota_titulo") || "Editar Nota Médica";

    const btnGuardar = document.querySelector('[onclick="agregarNota()"]');
    if (btnGuardar) btnGuardar.innerText = t("historial_actualizar_nota") || "Actualizar Nota";

    setTimeout(() => { if (notaInput) notaInput.focus(); }, 200);
}

function cancelarEdicionNota() {
    editandoNotaId = null;
    if (notaInput) notaInput.value = "";
    if (seccionAgregar) seccionAgregar.style.display = "none";
    if (seccionVer) seccionVer.style.display = "block";
    if (tituloPrincipal) tituloPrincipal.textContent = t("historial_gestion_titulo");
}

async function agregarNota() {
    const texto = notaInput.value.trim();
    if (!texto) return alert("Por favor, escribe el detalle de la nota.");

    try {
        if (editandoNotaId) {
            const { error } = await supabaseClient
                .from('historial')
                .update({ tipo: tipoNotaInput.value, texto: texto })
                .eq('id', editandoNotaId);

            if (error) throw error;

            alert("✅ Nota actualizada correctamente.");
            editandoNotaId = null;
            window.location.href = "historial.html?mode=modificar";
        } else {
            const nuevaNota = {
                paciente_id: pacienteID,
                clinica_id: clinicaID,
                tipo: tipoNotaInput.value,
                texto: texto,
                fecha: new Date().toLocaleString("es-GT")
            };

            const { error } = await supabaseClient
                .from('historial')
                .insert([nuevaNota]);

            if (error) throw error;

            alert("✅ Nota guardada en la nube correctamente.");
            notaInput.value = "";
            window.location.href = "historial.html?mode=modificar";
        }
    } catch (e) {
        console.error("Error al guardar nota:", e);
        alert("Error al guardar: " + e.message);
    }
}

async function eliminarNota(id, index) {
    if (!confirm("¿Estás seguro de eliminar este registro?")) return;

    try {
        const { error } = await supabaseClient
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

    const lang = localStorage.getItem("lang") || "es";
    const etiquetas = {
        es: { titulo: "HISTORIAL CLÍNICO", generado: "Generado el:" },
        en: { titulo: "CLINICAL RECORD", generado: "Generated on:" },
        fr: { titulo: "DOSSIER MÉDICAL", generado: "Généré le:" }
    };
    const et = etiquetas[lang] || etiquetas.es;

    doc.setFontSize(16);
    doc.text(`${et.titulo}: ${paciente.nombre}`, 10, 20);
    doc.setFontSize(10);
    doc.text(`${et.generado} ${new Date().toLocaleString()}`, 10, 28);

    let y = 40;
    historial.forEach(h => {
        if (y > 270) { doc.addPage(); y = 20; }

        const tipoTraducido = traducirTipoNota(h.tipo);

        if (h.tipo === "Alergia") {
            doc.setTextColor(231, 76, 60);
            doc.setFont("helvetica", "bold");
            doc.text(`${h.fecha} - ${tipoTraducido.toUpperCase()}`, 10, y);
        } else {
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");
            doc.text(`${h.fecha} - ${tipoTraducido}`, 10, y);
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
        if(tituloPrincipal) tituloPrincipal.textContent = t("historial_nueva_nota_titulo");
        if(seccionAgregar) seccionAgregar.style.display = "block";
        if(seccionVer) seccionVer.style.display = "none";
        setTimeout(() => { if(notaInput) notaInput.focus(); }, 300);
    } else {
        if(tituloPrincipal) tituloPrincipal.textContent = t("historial_gestion_titulo");
        if(seccionAgregar) seccionAgregar.style.display = "none";
        if(seccionVer) seccionVer.style.display = "block";
        render();
    }
}

inicializarHistorial();
