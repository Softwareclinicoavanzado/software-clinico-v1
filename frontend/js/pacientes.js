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

// Carga Inicial
function cargarDatos() {
    pacientes = getPacientes();
    render();
}

async function guardar() {
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
                <button class="btn-pdf" onclick="descargarPDFHistorial(${p.id})" style="padding: 5px 10px; font-size: 0.8rem; cursor:pointer;">📄 Exportar</button>
            </div>
            <div class="paciente-info">
                <small>Edad: ${p.edad || "-"} | Sexo: ${p.sexo || "-"} | Tel: ${p.telefono || "-"}</small><br>
                <small>Seguro: ${p.aseguradora || "Particular"} | No. Seguro: ${p.poliza || "-"} | Sucursal: ${p.sede || "-"}</small>
            </div>
            <div class="actions" style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <button type="button" onclick="verHistorial(${p.id})">📋 Ver Historial</button>
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
        creado: new Date().toLocaleDateString(),
        clinica_id: clinicaID
    };

    pacientes.push(nuevoPaciente);
    Object.values(inputs).forEach(input => { if(input) input.value = ""; });
    guardar();
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
    window.location.href = "historial.html";
}

function agregarNotaDirecta(id) {
    localStorage.setItem("pacienteActual", String(id));
    window.location.href = "historial.html?action=addNote";
}

function descargarPDFHistorial(id) {
    const p = pacientes.find(p => p.id === id);
    if (!p) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("FICHA DEL PACIENTE - ClinicOS", 10, 20);
    doc.setFontSize(12);
    doc.text(`Nombre: ${p.nombre}`, 10, 40);
    doc.text(`DPI: ${p.dpi || "N/A"}`, 10, 50);
    doc.text(`Edad: ${p.edad || "N/A"}`, 10, 60);
    doc.text(`Seguro: ${p.aseguradora || "Particular"}`, 10, 70);
    doc.text(`Fecha de Registro: ${p.creado}`, 10, 80);
    
    doc.save(`Paciente_${p.nombre}.pdf`);
}

function volver() { window.location.href = "dashboard.html"; }

// Ejecución
cargarDatos();
