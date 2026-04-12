/* =========================
   PACIENTES | ClinicOS
========================= */

const clinicaID = localStorage.getItem("clinicaID");
if (!clinicaID) {
  alert("Sesión inválida.");
  window.location.href = "index.html";
}

const rol = localStorage.getItem("rol") || "admin";
const API_URL = "https://software-clinico-v1.onrender.com";

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

let pacientes = [];

try {
  const data = getPacientes();
  pacientes = Array.isArray(data) ? data : [];
} catch {
  pacientes = [];
}

async function guardar() {
  savePacientes(pacientes);
  render();
  // No quitamos el syncAllToCloud original
  if (typeof syncAllToCloud === "function") {
    await syncAllToCloud();
  }
}

function render(data = pacientes) {
  const lista = document.getElementById("listaPacientes");
  if (!lista) return;
  lista.innerHTML = "";
  
  if (!data.length) {
    lista.innerHTML = "<li>No hay pacientes registrados</li>";
    return;
  }

  data.forEach(p => {
    const li = document.createElement("li");
    li.className = "paciente-item";
    li.innerHTML = `
      <div class="paciente-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
         <span style="font-size: 1.1rem;"><strong>${p.nombre}</strong> <small style="opacity: 0.8;">(DPI: ${p.dpi || "S/D"})</small></span>
         <button class="btn-pdf" onclick="descargarPDFHistorial(${p.id})" style="padding: 5px 10px; font-size: 0.8rem;">📄 PDF</button>
      </div>
      
      <div class="paciente-info">
        <small>Edad: ${p.edad || "-"} | Sexo: ${p.sexo || "-"} | Tel: ${p.telefono || "-"}</small><br>
        <small>Seguro: ${p.aseguradora || "Particular"} | Póliza: ${p.poliza || "-"} | Sucursal: ${p.sede || "-"}</small>
      </div>

      <div class="actions" style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <button type="button" onclick="verHistorial(${p.id})">📋 Ver Historial</button>
        <button type="button" onclick="editarPaciente(${p.id})">✏️ Editar Perfil</button>
        <button type="button" class="btn-nota" onclick="agregarNotaDirecta(${p.id})" style="grid-column: span 2; background-color: #2ecc71;">📝 Agregar Nota (Alergias/Diagnóstico)</button>
        
        ${rol !== "recepcion" ? `<button type="button" class="btn-danger" onclick="eliminarPaciente(${p.id})" style="grid-column: span 2; background-color: #e74c3c;">🗑️ Eliminar Paciente</button>` : ""}
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
  Object.values(inputs).forEach(input => input.value = ""); 
  guardar();
}

function editarPaciente(id) {
  const p = pacientes.find(p => p.id === id);
  if (!p) return;

  const nNombre = prompt("Nombre completo:", p.nombre);
  if (nNombre === null) return;

  const nDpi = prompt("DPI:", p.dpi || "");
  const nEdad = prompt("Edad:", p.edad || "");
  const nTel = prompt("Teléfono:", p.telefono || "");
  const nSeguro = prompt("Aseguradora:", p.aseguradora || "");
  const nPoliza = prompt("Número de Póliza:", p.poliza || "");

  p.nombre = nNombre.trim() || p.nombre;
  p.dpi = nDpi || p.dpi;
  p.edad = nEdad || p.edad;
  p.telefono = nTel || p.telefono;
  p.aseguradora = nSeguro || p.aseguradora;
  p.poliza = nPoliza || p.poliza;

  guardar();
}

function eliminarPaciente(id) {
    if(confirm("¿Estás seguro de eliminar este paciente?")) {
        pacientes = pacientes.filter(p => p.id !== id);
        guardar();
    }
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
  doc.setFontSize(20);
  doc.setTextColor(41, 128, 185);
  doc.text("ClinicOS - REPORTE DE PACIENTE", 105, 20, { align: "center" });
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Nombre: ${p.nombre}`, 20, 40);
  doc.text(`DPI: ${p.dpi || "N/A"}`, 20, 50);
  doc.text(`Edad: ${p.edad} | Tel: ${p.telefono}`, 20, 60);
  doc.text(`Aseguradora: ${p.aseguradora || "Particular"}`, 20, 70);
  doc.text(`Póliza: ${p.poliza || "-"}`, 20, 80);
  doc.save(`Paciente_${p.nombre.replace(/ /g, "_")}.pdf`);
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

function volver() {
  window.location.href = "dashboard.html";
}

render();
