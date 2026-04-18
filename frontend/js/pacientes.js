/* =========================
    PACIENTES | ClinicOS
========================= */
const clinicaID = localStorage.getItem("clinicaID");
if (!clinicaID) {
    window.location.href = "index.html";
}

const rol = localStorage.getItem("rol") || "admin";
let pacientes = [];

// Elementos del DOM
const inputs = {
    nombre: document.getElementById("nombre"),
    dpi: document.getElementById("dpi"),
    edad: document.getElementById("edad"),
    telefono: document.getElementById("telefono"),
    fechaNacimiento: document.getElementById("fechaNacimiento"),
    sexo: document.getElementById("sexo"),
    contactoEmergencia: document.getElementById("contactoEmergencia"),
    aseguradora: document.getElementById("aseguradora"),
    poliza: document.getElementById("poliza"),
    medicoAsignado: document.getElementById("medicoAsignado"),
    sede: document.getElementById("sede")
};

function cargarDatos() {
    // getPacientes() viene de storage.js
    pacientes = getPacientes();
    render();
}

async function guardar() {
    // savePacientes() viene de storage.js
    savePacientes(pacientes);
    render();
    if (typeof syncAllToCloud === "function") await syncAllToCloud();
}

function render(data = pacientes) {
    const lista = document.getElementById("listaPacientes");
    if (!lista) return;
    lista.innerHTML = "";
    
    if (!data.length) {
        lista.innerHTML = "<li style='color:white; text-align:center;'>No hay pacientes registrados</li>";
        return;
    }

    data.forEach(p => {
        const li = document.createElement("li");
        li.className = "paciente-item";
        li.innerHTML = `
            <div class="paciente-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 1.1rem;"><strong>${p.nombre}</strong> <small style="opacity: 0.8;">(DPI: ${p.dpi || "S/D"})</small></span>
                <button class="btn-pdf" onclick="descargarPDFHistorial(${p.id})" style="padding: 5px 10px; font-size: 0.8rem; cursor:pointer; background-color: #3498db; color: white; border: none; border-radius: 4px;">📄 Exportar Reporte</button>
            </div>
            <div class="paciente-info">
                <small>Edad: ${p.edad || "-"} | Sexo: ${p.sexo || "-"} | Tel: ${p.telefono || "-"}</small><br>
                <small>Seguro: ${p.aseguradora || "Particular"} | No. Seguro: ${p.poliza || "-"} | Sucursal: ${p.sede || "-"}</small>
            </div>
            <div class="actions" style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <button type="button" onclick="verHistorial(${p.id})">⚙️ Modificar Historial</button>
                <button type="button" onclick="editarPaciente(${p.id})">✏️ Editar Perfil</button>
                <button type="button" class="btn-nota" onclick="agregarNotaDirecta(${p.id})" style="grid-column: span 2; background-color: #2ecc71;">📝 Nueva Nota Médica</button>
                ${rol !== "recepcion" ? `<button type="button" class="btn-danger" onclick="eliminarPaciente(${p.id})" style="grid-column: span 2; background-color: #e74c3c; color:white;">🗑️ Eliminar Paciente</button>` : ""}
            </div>
        `;
        lista.appendChild(li);
    });
}

function agregarPaciente() {
    const nombre = inputs.nombre.value.trim();
    if (!nombre) return alert("El nombre es obligatorio");

    const nuevoPaciente = {
        id: Date.now(),
        nombre: nombre,
        dpi: inputs.dpi.value.trim(),
        edad: inputs.edad.value,
        telefono: inputs.telefono.value,
        fechaNacimiento: inputs.fechaNacimiento.value,
        sexo: inputs.sexo.value,
        contactoEmergencia: inputs.contactoEmergencia.value,
        aseguradora: inputs.aseguradora.value,
        poliza: inputs.poliza.value,
        medicoAsignado: inputs.medicoAsignado.value,
        sede: inputs.sede.value,
        creado: new Date().toLocaleDateString("es-GT"),
        clinica_id: clinicaID
    };

    pacientes.push(nuevoPaciente);
    Object.values(inputs).forEach(input => { if(input) input.value = ""; });
    savePacientes(pacientes);
    alert("¡Paciente registrado!");
    window.location.href = "pacientes.html?mode=ver";
}

/* ==========================================
    FUNCIÓN ELIMINAR (LA QUE FALTABA)
========================================== */
function eliminarPaciente(id) {
    const p = pacientes.find(pac => pac.id === id);
    if (!p) return;

    const confirmacion = confirm(`⚠️ ¿ELIMINAR PACIENTE?\n\nNombre: ${p.nombre}\n\nSe borrará su perfil e historial de forma permanente.`);

    if (confirmacion) {
        // Filtrar la lista local
        pacientes = pacientes.filter(pac => pac.id !== id);
        
        // Guardar en LocalStorage (Actualiza la clínica actual)
        savePacientes(pacientes);
        
        // Limpiar el historial asociado a ese ID para no dejar basura
        localStorage.removeItem(`historial_${id}`);
        
        // Refrescar la lista en pantalla
        render();
        
        console.log(`Paciente ${id} eliminado.`);
        
        // Sync al backend
        if (typeof syncAllToCloud === "function") syncAllToCloud();
    }
}

function descargarPDFHistorial(id) {
    const p = pacientes.find(p => p.id === id);
    if (!p) return;
    const historial = JSON.parse(localStorage.getItem(`historial_${id}`)) || [];
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("REPORTE MÉDICO INTEGRAL", 105, y, { align: "center" });
    y += 10;
    doc.setDrawColor(52, 152, 219);
    doc.setLineWidth(1);
    doc.line(20, y, 190, y);
    y += 15;

    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text("DATOS DEL PACIENTE", 20, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    
    const datos = [
        `Nombre: ${p.nombre}`,
        `DPI: ${p.dpi || "N/A"}`,
        `Edad: ${p.edad || "N/A"}`,
        `Teléfono: ${p.telefono || "N/A"}`,
        `Seguro: ${p.aseguradora || "Particular"} (Póliza: ${p.poliza || "N/A"})`,
        `Médico Asignado: ${p.medicoAsignado || "N/A"}`
    ];

    datos.forEach(linea => {
        doc.text(linea, 25, y);
        y += 7;
    });

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("HISTORIAL DE NOTAS Y EVOLUCIÓN", 20, y);
    y += 10;

    if (historial.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.text("No se registran notas médicas en el historial.", 25, y);
    } else {
        historial.forEach((nota) => {
            if (y > 250) { doc.addPage(); y = 20; }
            doc.setFillColor(245, 245, 245);
            doc.rect(20, y - 5, 170, 8, 'F');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(52, 73, 94);
            doc.text(`${nota.tipo.toUpperCase()} - ${nota.fecha}`, 25, y);
            y += 8;
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0);
            const splitText = doc.splitTextToSize(nota.texto, 160);
            doc.text(splitText, 25, y);
            y += (splitText.length * 6) + 10;
        });
    }
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Generado por ClinicOS - ${new Date().toLocaleString()}`, 105, 285, { align: "center" });
    doc.save(`Reporte_${p.nombre.replace(/\s+/g, '_')}.pdf`);
}

function filtrarPacientes() {
    const texto = document.getElementById("busqueda").value.toLowerCase();
    const filtrados = pacientes.filter(p => 
        p.nombre.toLowerCase().includes(texto) || 
        (p.dpi && p.dpi.includes(texto)) ||
        (p.telefono && p.telefono.includes(texto))
    );
    render(filtrados);
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
        if(titulo) titulo.innerText = "Registrar Paciente";
    } else {
        if(form) form.style.display = "none";
        if(lista) lista.style.display = "block";
        if(titulo) titulo.innerText = "Listado de Pacientes";
    }
}

// Iniciar aplicación
cargarDatos();
gestionarVistas();
