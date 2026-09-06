/* =============================================
    PACIENTES | ClinicOS (Cloud Edition - Direct Sync)
============================================= */
const clinicaID = typeof getClinicaID === "function" ? getClinicaID() : localStorage.getItem("clinicaID");
if (!clinicaID) {
    window.location.href = "index.html";
}
const rol = localStorage.getItem("rol") || "admin";
let pacientes = [];
let pacientesFiltradosActual = [];
let editandoID = null;
const inputs = {
    nombre: document.getElementById("nombre"),
    dpi: document.getElementById("dpi"),
    edad: document.getElementById("edad"),
    telefono: document.getElementById("telefono"),
    email: document.getElementById("email"),
    fechaNacimiento: document.getElementById("fechaNacimiento"),
    sexo: document.getElementById("sexo"),
    contactoEmergencia: document.getElementById("contactoEmergencia"),
    aseguradora: document.getElementById("aseguradora"),
    poliza: document.getElementById("poliza"),
    medicoAsignado: document.getElementById("medicoAsignado"),
    sede: document.getElementById("sede")
};

async function cargarDatos() {
    try {
        const { data, error } = await supabaseClient
            .from('pacientes')
            .select('*')
            .eq('clinica_id', clinicaID)
            .order('nombre', { ascending: true });
        if (error) throw error;
        pacientes = data;
        pacientesFiltradosActual = data;
        poblarFiltros();
        render();
    } catch (err) {
        console.error("Error cargando pacientes:", err.message);
    }
}

/* =========================
   Helpers visuales para las tarjetas
========================= */
function iniciales(nombre) {
    if (!nombre) return "?";
    const partes = nombre.trim().split(" ").filter(Boolean);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
}

function colorAvatar(nombre) {
    const paleta = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4"];
    let hash = 0;
    for (let i = 0; i < (nombre || "").length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    return paleta[Math.abs(hash) % paleta.length];
}

function limpiarTexto(str) {
    return (str || "").replace(/^[^\w\sáéíóúÁÉÍÓÚñÑ]+/, '').trim();
}

function traducirSexo(valor) {
    if (!valor) return null;
    const normalizado = valor.toString().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const mapa = { hombre: "sexo_hombre", mujer: "sexo_mujer", otro: "sexo_otro" };
    const clave = mapa[normalizado];
    return clave ? t(clave) : valor;
}

/* =========================
   Validación de formato de email
   (el email es opcional: si está vacío no se marca error;
   si tiene contenido, debe tener forma de correo válido)
========================= */
function emailTieneFormatoValido(email) {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* =========================================================
   FILTROS AVANZADOS
========================================================= */
function toggleFiltrosPanel() {
    const panel = document.getElementById("panelFiltros");
    const btn = document.getElementById("btnToggleFiltros");
    if (!panel) return;
    const abierto = panel.style.display === "block";
    panel.style.display = abierto ? "none" : "block";
    if (btn) btn.classList.toggle("open", !abierto);
}

function poblarFiltros() {
    const selMedico = document.getElementById("filtroMedico");
    const selSeguro = document.getElementById("filtroSeguro");
    if (!selMedico || !selSeguro) return;

    const medicos = [...new Set(pacientes.map(p => (p.medico_asignado || "").trim()).filter(Boolean))].sort();
    const seguros = [...new Set(pacientes.map(p => (p.aseguradora || "").trim()).filter(Boolean))].sort();

    const valorMedicoActual = selMedico.value;
    const valorSeguroActual = selSeguro.value;

    selMedico.innerHTML = `<option value="">${t("filtro_todos_medicos") || "Todos los médicos"}</option>`;
    medicos.forEach(m => {
        const op = document.createElement("option");
        op.value = m;
        op.textContent = m;
        selMedico.appendChild(op);
    });
    selMedico.value = medicos.includes(valorMedicoActual) ? valorMedicoActual : "";

    selSeguro.innerHTML = `<option value="">${t("filtro_todos_seguros") || "Todos los seguros"}</option><option value="__particular__">${t("tag_particular") || "Particular"}</option>`;
    seguros.forEach(s => {
        const op = document.createElement("option");
        op.value = s;
        op.textContent = s;
        selSeguro.appendChild(op);
    });
    selSeguro.value = (seguros.includes(valorSeguroActual) || valorSeguroActual === "__particular__") ? valorSeguroActual : "";
}

function filtrosActivosCount() {
    let count = 0;
    const medico = document.getElementById("filtroMedico");
    const seguro = document.getElementById("filtroSeguro");
    const sexo = document.getElementById("filtroSexo");
    const edadMin = document.getElementById("filtroEdadMin");
    const edadMax = document.getElementById("filtroEdadMax");
    if (medico && medico.value) count++;
    if (seguro && seguro.value) count++;
    if (sexo && sexo.value) count++;
    if (edadMin && edadMin.value) count++;
    if (edadMax && edadMax.value) count++;
    return count;
}

function actualizarBadgeFiltros() {
    const badge = document.getElementById("filtrosBadge");
    if (!badge) return;
    const n = filtrosActivosCount();
    if (n > 0) {
        badge.style.display = "inline-flex";
        badge.innerText = n;
    } else {
        badge.style.display = "none";
    }
}

function aplicarFiltros() {
    const texto = (document.getElementById("busqueda").value || "").toLowerCase();
    const medico = document.getElementById("filtroMedico") ? document.getElementById("filtroMedico").value : "";
    const seguro = document.getElementById("filtroSeguro") ? document.getElementById("filtroSeguro").value : "";
    const sexo = document.getElementById("filtroSexo") ? document.getElementById("filtroSexo").value : "";
    const edadMin = document.getElementById("filtroEdadMin") ? parseInt(document.getElementById("filtroEdadMin").value) : NaN;
    const edadMax = document.getElementById("filtroEdadMax") ? parseInt(document.getElementById("filtroEdadMax").value) : NaN;

    const filtrados = pacientes.filter(p => {
        const coincideTexto = !texto ||
            (p.nombre && p.nombre.toLowerCase().includes(texto)) ||
            (p.dpi && p.dpi.includes(texto)) ||
            (p.telefono && p.telefono.includes(texto));
        if (!coincideTexto) return false;

        if (medico && (p.medico_asignado || "").trim() !== medico) return false;

        if (seguro === "__particular__" && (p.aseguradora || "").trim() !== "") return false;
        if (seguro && seguro !== "__particular__" && (p.aseguradora || "").trim() !== seguro) return false;

        if (sexo && (p.sexo || "").trim() !== sexo) return false;

        if (!isNaN(edadMin) && (p.edad === null || p.edad === undefined || p.edad < edadMin)) return false;
        if (!isNaN(edadMax) && (p.edad === null || p.edad === undefined || p.edad > edadMax)) return false;

        return true;
    });

    actualizarBadgeFiltros();
    render(filtrados);
}

function limpiarFiltros() {
    const busqueda = document.getElementById("busqueda");
    const medico = document.getElementById("filtroMedico");
    const seguro = document.getElementById("filtroSeguro");
    const sexo = document.getElementById("filtroSexo");
    const edadMin = document.getElementById("filtroEdadMin");
    const edadMax = document.getElementById("filtroEdadMax");
    if (busqueda) busqueda.value = "";
    if (medico) medico.value = "";
    if (seguro) seguro.value = "";
    if (sexo) sexo.value = "";
    if (edadMin) edadMin.value = "";
    if (edadMax) edadMax.value = "";
    actualizarBadgeFiltros();
    render(pacientes);
}

/* Mantiene compatibilidad: el input de búsqueda sigue llamando a esta función */
function filtrarPacientes() {
    aplicarFiltros();
}

/* =========================================================
   RETRADUCCIÓN AL CAMBIAR IDIOMA SIN RECARGAR
========================================================= */
function retraducirContenidoDinamico() {
    poblarFiltros();
    aplicarFiltros();
    const params = new URLSearchParams(window.location.search);
    const modo = params.get("mode");
    const titulo = document.getElementById("tituloPagina");

    // Si hay una edición activa (se entró vía editarPaciente(), que no cambia
    // la URL), hay que respetar ese estado en vez del modo de la URL —
    // si no, el título y el botón "Guardar Cambios" se revertían a los
    // textos de "nuevo paciente" al cambiar de idioma a mitad de una edición.
    if (editandoID) {
        if (titulo) titulo.innerText = t("actualizar_perfil_titulo");
        const btnSubmit = document.querySelector(".btn-primary");
        if (btnSubmit) btnSubmit.innerText = t("guardar_cambios_btn");
    } else if (titulo) {
        titulo.innerText = modo === "nuevo" ? t("gestion_pacientes") : t("listado_pacientes");
    }
}

/* ========================================================= */

/* =========================================================
   EXPORTAR A EXCEL (SheetJS)
========================================================= */
function nombreArchivoSeguro(str) {
    return (str || "archivo").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function fechaHoyArchivo() {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, "0");
    const d = String(hoy.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function encabezadosExcel() {
    return {
        nombre: t("nombre_completo") || "Nombre",
        dpi: t("dpi_label") || "DPI",
        edad: t("edad_label") || "Edad",
        sexo: t("excel_col_sexo") || "Sexo",
        telefono: t("telefono_label") || "Teléfono",
        email: t("email_label") || "Correo electrónico",
        fechaNacimiento: (t("fecha_nacimiento") || "Fecha de Nacimiento").replace(":", ""),
        contacto: t("contacto_emergencia_label") || "Contacto de Emergencia",
        seguro: t("seguro_nombre") || "Seguro",
        poliza: t("seguro_numero") || "Número de Póliza",
        medico: t("medico_asignado_label") || "Médico Asignado",
        sede: t("sede_label") || "Sede"
    };
}

function construirFilaPaciente(p) {
    const h = encabezadosExcel();
    return {
        [h.nombre]: p.nombre || "",
        [h.dpi]: p.dpi || "",
        [h.edad]: p.edad || "",
        [h.sexo]: traducirSexo(p.sexo) || "",
        [h.telefono]: p.telefono || "",
        [h.email]: p.email || "",
        [h.fechaNacimiento]: p.fecha_nacimiento || "",
        [h.contacto]: p.contacto_emergencia || "",
        [h.seguro]: p.aseguradora || (t("tag_particular") || "Particular"),
        [h.poliza]: p.poliza_seguro || "",
        [h.medico]: p.medico_asignado || "",
        [h.sede]: p.sede || ""
    };
}

function generarLibroExcel(lista, tituloHoja) {
    const filas = lista.map(construirFilaPaciente);
    const ws = XLSX.utils.json_to_sheet(filas);

    ws['!cols'] = [
        { wch: 26 }, { wch: 16 }, { wch: 8 }, { wch: 10 },
        { wch: 15 }, { wch: 24 }, { wch: 16 }, { wch: 24 }, { wch: 18 },
        { wch: 16 }, { wch: 20 }, { wch: 16 }
    ];
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tituloHoja.substring(0, 31));
    return wb;
}

function exportarTodosExcel() {
    if (!pacientes || pacientes.length === 0) {
        alert(t("excel_sin_datos") || "No hay pacientes para exportar.");
        return;
    }
    const clinicaNombre = localStorage.getItem("clinicaNombre") || "ClinicOS";
    const wb = generarLibroExcel(pacientes, t("excel_hoja_pacientes") || "Pacientes");
    const nombreArchivo = `${nombreArchivoSeguro(clinicaNombre)}_Pacientes_${fechaHoyArchivo()}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
}

function exportarFiltradosExcel() {
    if (!pacientesFiltradosActual || pacientesFiltradosActual.length === 0) {
        alert(t("excel_sin_datos") || "No hay pacientes para exportar.");
        return;
    }
    const clinicaNombre = localStorage.getItem("clinicaNombre") || "ClinicOS";
    const wb = generarLibroExcel(pacientesFiltradosActual, t("excel_hoja_pacientes") || "Pacientes");
    const nombreArchivo = `${nombreArchivoSeguro(clinicaNombre)}_Pacientes_Filtrados_${fechaHoyArchivo()}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
}

function exportarPacienteIndividualExcel(id) {
    const p = pacientes.find(pac => Number(pac.id) === Number(id));
    if (!p) return;

    const h = encabezadosExcel();
    const filasVerticales = [
        [h.nombre, p.nombre || ""],
        [h.dpi, p.dpi || ""],
        [h.edad, p.edad || ""],
        [h.sexo, traducirSexo(p.sexo) || ""],
        [h.telefono, p.telefono || ""],
        [h.email, p.email || ""],
        [h.fechaNacimiento, p.fecha_nacimiento || ""],
        [h.contacto, p.contacto_emergencia || ""],
        [h.seguro, p.aseguradora || (t("tag_particular") || "Particular")],
        [h.poliza, p.poliza_seguro || ""],
        [h.medico, p.medico_asignado || ""],
        [h.sede, p.sede || ""]
    ];

    const ws = XLSX.utils.aoa_to_sheet(filasVerticales);
    ws['!cols'] = [{ wch: 24 }, { wch: 34 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, (t("excel_hoja_ficha") || "Ficha").substring(0, 31));
    const nombreArchivo = `${nombreArchivoSeguro(p.nombre)}_${fechaHoyArchivo()}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
}

/* =========================================================
   EXPORTAR LISTA COMPLETA A PDF (tabla, no historial médico)
========================================================= */
function generarPDFListaPacientes(lista, titulo) {
    if (!window.jspdf) {
        alert(t("error_libreria_pdf"));
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape" });
    const clinicaNombre = localStorage.getItem("clinicaNombre") || "ClinicOS";

    doc.setFontSize(16);
    doc.text(titulo, 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`${clinicaNombre} — ${new Date().toLocaleString()}`, 14, 21);

    const h = encabezadosExcel();
    const columnas = [h.nombre, h.dpi, h.edad, h.sexo, h.telefono, h.seguro, h.medico, h.sede];
    const filas = lista.map(p => [
        p.nombre || "",
        p.dpi || "",
        p.edad || "",
        traducirSexo(p.sexo) || "",
        p.telefono || "",
        p.aseguradora || (t("tag_particular") || "Particular"),
        p.medico_asignado || "",
        p.sede || ""
    ]);

    doc.autoTable({
        head: [columnas],
        body: filas,
        startY: 28,
        styles: { fontSize: 8.5, cellPadding: 3.5 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [244, 247, 251] }
    });

    const nombreArchivo = `${nombreArchivoSeguro(clinicaNombre)}_Pacientes_${fechaHoyArchivo()}.pdf`;
    doc.save(nombreArchivo);
}

function exportarTodosPDF() {
    if (!pacientes || pacientes.length === 0) {
        alert(t("excel_sin_datos") || "No hay pacientes para exportar.");
        return;
    }
    generarPDFListaPacientes(pacientes, t("pdf_titulo_todos") || "Listado de Pacientes");
}

function exportarFiltradosPDF() {
    if (!pacientesFiltradosActual || pacientesFiltradosActual.length === 0) {
        alert(t("excel_sin_datos") || "No hay pacientes para exportar.");
        return;
    }
    generarPDFListaPacientes(pacientesFiltradosActual, t("pdf_titulo_filtrados") || "Listado de Pacientes (Filtrado)");
}

/* ========================================================= */

/* =========================
   Render de tarjetas de paciente (rediseño premium)
========================= */
function render(data = pacientes) {
    pacientesFiltradosActual = data;

    const hayFiltro = data.length > 0 && data.length !== pacientes.length;

    const btnExcelFiltrados = document.getElementById("btnExportarFiltrados");
    const txtExcelFiltrados = document.getElementById("txtExportarFiltrados");
    if (btnExcelFiltrados) {
        btnExcelFiltrados.style.display = hayFiltro ? "flex" : "none";
        if (hayFiltro && txtExcelFiltrados) txtExcelFiltrados.innerText = `${limpiarTexto(t("excel_export_filtrados"))} (${data.length})`;
    }

    const btnPdfFiltrados = document.getElementById("btnExportarFiltradosPDF");
    const txtPdfFiltrados = document.getElementById("txtExportarFiltradosPDF");
    if (btnPdfFiltrados) {
        btnPdfFiltrados.style.display = hayFiltro ? "flex" : "none";
        if (hayFiltro && txtPdfFiltrados) txtPdfFiltrados.innerText = `${limpiarTexto(t("pdf_export_filtrados"))} (${data.length})`;
    }

    const lista = document.getElementById("listaPacientes");
    if (!lista) return;
    lista.innerHTML = "";
    if (!data || !data.length) {
        lista.innerHTML = `<li style='color:var(--text-secondary); text-align:center; background:none; border:none; box-shadow:none;'>${t("no_hay_pacientes")}</li>`;
        return;
    }
    data.forEach(p => {
        const li = document.createElement("li");
        li.className = "patient-card";

        const edadTexto = p.edad ? `${p.edad} ${t("tag_anios")}` : `${t("tag_edad")} —`;
        const sexoTexto = traducirSexo(p.sexo) || `${t("tag_sexo")} —`;
        const telTexto = p.telefono || `${t("tag_tel")} —`;
        const aseguradoraTexto = p.aseguradora || t("tag_particular");

        li.innerHTML = `
            <div class="patient-card-top">
                <div class="patient-identity">
                    <div class="patient-avatar" style="background:${colorAvatar(p.nombre)}20; color:${colorAvatar(p.nombre)}; border-color:${colorAvatar(p.nombre)}40;">
                        ${iniciales(p.nombre)}
                    </div>
                    <div>
                        <div class="patient-name">${p.nombre}</div>
                        <div class="patient-dpi">DPI ${p.dpi || "S/D"}</div>
                    </div>
                </div>
                <div class="card-export-group">
                    <button type="button" class="btn-excel-pill" onclick="exportarPacienteIndividualExcel(${p.id})">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8"/></svg>
                        <span>${limpiarTexto(t("excel_export_individual"))}</span>
                    </button>
                    ${rol !== "recepcion" ? `
                    <button type="button" class="btn-pdf-pill" onclick="descargarPDFHistorial(${p.id})">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6M9 15l3 3 3-3"/></svg>
                        <span>${limpiarTexto(t("exportar_reporte"))}</span>
                    </button>` : ""}
                </div>
            </div>

            <div class="patient-tags">
                <span class="patient-tag">${edadTexto}</span>
                <span class="patient-tag">${sexoTexto}</span>
                <span class="patient-tag">${telTexto}</span>
                <span class="patient-tag patient-tag-accent">${aseguradoraTexto}</span>
            </div>

            <div class="patient-actions">
                ${rol !== "recepcion" ? `
                <button type="button" class="btn-action btn-action-primary" onclick="verHistorial(${p.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18.7 8 12 14.7l-3.5-3.5L3 16.5"/></svg>
                    ${t("modificar_historial")}
                </button>
                <button type="button" class="btn-action" onclick="agregarNotaDirecta(${p.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    ${t("nueva_nota_medica")}
                </button>` : ""}
                <button type="button" class="btn-action" onclick="editarPaciente(${p.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                    ${t("editar_perfil")}
                </button>
                ${rol !== "recepcion" ? `
                <button type="button" class="btn-action btn-action-danger" onclick="eliminarPaciente(${p.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    ${t("eliminar_paciente")}
                </button>` : ""}
            </div>
        `;
        lista.appendChild(li);
    });
}

function editarPaciente(id) {
    const p = pacientes.find(pac => Number(pac.id) === Number(id));
    if (!p) return;
    editandoID = id;
    if (inputs.nombre) inputs.nombre.value = p.nombre || "";
    if (inputs.dpi) inputs.dpi.value = p.dpi || "";
    if (inputs.edad) inputs.edad.value = p.edad || "";
    if (inputs.telefono) inputs.telefono.value = p.telefono || "";
    if (inputs.email) inputs.email.value = p.email || "";
    if (inputs.fechaNacimiento) inputs.fechaNacimiento.value = p.fecha_nacimiento || "";
    if (inputs.sexo) inputs.sexo.value = p.sexo || "";
    if (inputs.contactoEmergencia) inputs.contactoEmergencia.value = p.contacto_emergencia || "";
    if (inputs.aseguradora) inputs.aseguradora.value = p.aseguradora || "";
    if (inputs.poliza) inputs.poliza.value = p.poliza_seguro || "";
    if (inputs.medicoAsignado) inputs.medicoAsignado.value = p.medico_asignado || "";
    if (inputs.sede) inputs.sede.value = p.sede || "";
    document.getElementById("seccionFormulario").style.display = "block";
    document.getElementById("seccionLista").style.display = "none";
    document.getElementById("tituloPagina").innerText = t("actualizar_perfil_titulo");
    const btnSubmit = document.querySelector(".btn-primary");
    if (btnSubmit) btnSubmit.innerText = t("guardar_cambios_btn");
}

async function agregarPaciente() {
    const nombre = inputs.nombre.value.trim();
    if (!nombre) return alert(t("nombre_obligatorio"));

    const emailValor = inputs.email.value.trim();
    if (!emailTieneFormatoValido(emailValor)) {
        alert(t("email_formato_invalido"));
        inputs.email.focus();
        return;
    }

    const datosPaciente = {
        nombre: nombre,
        dpi: inputs.dpi.value.trim(),
        edad: inputs.edad.value ? parseInt(inputs.edad.value) : null,
        telefono: inputs.telefono.value.trim(),
        email: emailValor,
        fecha_nacimiento: inputs.fechaNacimiento.value || null,
        sexo: inputs.sexo.value,
        contacto_emergencia: inputs.contactoEmergencia.value.trim(),
        aseguradora: inputs.aseguradora.value.trim(),
        poliza_seguro: inputs.poliza.value.trim(),
        medico_asignado: inputs.medicoAsignado.value.trim(),
        sede: inputs.sede.value.trim(),
        clinica_id: clinicaID
    };
    try {
        if (editandoID) {
            const { error } = await supabaseClient
                .from('pacientes')
                .update(datosPaciente)
                .eq('id', editandoID);
            if (error) throw error;
            if (typeof registrarAuditoria === "function") {
                registrarAuditoria("editar", "paciente", nombre);
            }
            alert(t("perfil_actualizado_exito"));
            editandoID = null;
        } else {
            const { error } = await supabaseClient
                .from('pacientes')
                .insert([datosPaciente]);
            if (error) throw error;
            if (typeof registrarAuditoria === "function") {
                registrarAuditoria("crear", "paciente", nombre);
            }
            alert(t("paciente_registrado_exito"));
        }
        Object.values(inputs).forEach(input => { if(input) input.value = ""; });
        window.location.href = "pacientes.html?mode=ver";
    } catch (err) {
        console.error("Error detallado de Supabase:", err);
        alert(t("error_sincronizar") + (err.message || t("verifica_consola")));
    }
}

async function eliminarPaciente(id) {
    const p = pacientes.find(pac => Number(pac.id) === Number(id));
    if (!p) return;
    if (confirm(`${t("confirmar_eliminar_paciente")} ${p.nombre}`)) {
        try {
            const { error } = await supabaseClient
                .from('pacientes')
                .delete()
                .eq('id', id);
            if (error) throw error;
            if (typeof registrarAuditoria === "function") {
                registrarAuditoria("eliminar", "paciente", p.nombre);
            }
            cargarDatos();
        } catch (err) {
            alert(t("error_eliminar") + err.message);
        }
    }
}

function verHistorial(id) {
    localStorage.setItem("pacienteActual", String(id));
    window.location.href = "historial.html?mode=modificar";
}

function agregarNotaDirecta(id) {
    localStorage.setItem("pacienteActual", String(id));
    window.location.href = "historial.html?mode=nuevaNota";
}

function volver() { window.location.href = "dashboard.html"; }

function gestionarVistas() {
    const params = new URLSearchParams(window.location.search);
    const modo = params.get("mode");
    const form = document.getElementById("seccionFormulario");
    const lista = document.getElementById("seccionLista");
    const titulo = document.getElementById("tituloPagina");
    if (modo === "nuevo") {
        if(form) form.style.display = "block";
        if(lista) lista.style.display = "none";
        if(titulo) titulo.innerText = t("gestion_pacientes");
    } else {
        if(form) form.style.display = "none";
        if(lista) lista.style.display = "block";
        if(titulo) titulo.innerText = t("listado_pacientes");
        cargarDatos();
    }
}

gestionarVistas();
