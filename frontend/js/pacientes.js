/* =========================
   PACIENTES | ClinicOS
========================= */

const clinicaID = localStorage.getItem("clinicaID");
if (!clinicaID) {
  alert("Sesión inválida.");
  window.location.href = "index.html";
}

const rol = localStorage.getItem("rol") || "admin";

const inputs = {
  nombre: document.getElementById("nombre"),
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
  if (typeof syncAllToCloud === "function") {
    await syncAllToCloud();
  }
}

function render(data = pacientes) {
  const lista = document.getElementById("listaPacientes");
  lista.innerHTML = "";
  
  if (!data.length) {
    lista.innerHTML = "<li>No hay pacientes registrados</li>";
    return;
  }

  data.forEach(p => {
    const li = document.createElement("li");
    li.className = "paciente-item";
    li.innerHTML = `
      <div class="paciente-info">
        <button class="btn-pdf" onclick="descargarPDFHistorial(${p.id})">📄 Descargar PDF Historial</button>
        <br>
        <strong>${p.nombre}</strong><br>
        <small>Edad: ${p.edad || "-"} | Sexo: ${p.sexo || "-"} | Tel: ${p.telefono || "-"}</small><br>
        <small>Seguro: ${p.aseguradora || "N/A"} (${p.poliza || "-"})</small>
      </div>

      <div class="actions">
        <button type="button" onclick="verHistorial(${p.id})">📋 Ver Historial</button>
        <button type="button" onclick="editarPaciente(${p.id})">✏️ Editar Perfil</button>
        <button type="button" class="btn-nota" onclick="agregarNotaDirecta(${p.id})">📝 Agregar Nota/Diagnóstico</button>
        
        ${rol !== "recepcion" ? `<button type="button" class="btn-danger" onclick="eliminarPaciente(${p.id})">🗑️ Eliminar</button>` : ""}
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
    edad: inputs.edad.value,
    telefono: inputs.telefono.value,
    fechaNacimiento: inputs.fechaNacimiento.value,
    sexo: inputs.sexo.value,
    contactoEmergencia: inputs.contactoEmergencia.value,
    aseguradora: inputs.aseguradora.value,
    poliza: inputs.poliza.value,
    medicoAsignado: inputs.medicoAsignado.value,
    sede: inputs.sede.value,
    creado: new Date().toLocaleDateString(), // Fecha de agregado
    clinica_id: clinicaID
  };

  pacientes.push(nuevoPaciente);
  Object.values(inputs).forEach(input => input.value = ""); // Limpiar campos
  guardar();
}

function editarPaciente(id) {
  const p = pacientes.find(p => p.id === id);
  if (!p) return;

  // Usamos prompt para simplicidad o podrías abrir un modal. 
  // Aquí editamos los 3 principales que pediste:
  const nNombre = prompt("Nuevo nombre:", p.nombre);
  if (nNombre === null) return;
  
  const nEdad = prompt("Nueva edad:", p.edad);
  const nTel = prompt("Nuevo teléfono:", p.telefono);
  const nSeguro = prompt("Nueva Aseguradora:", p.aseguradora || "");

  p.nombre = nNombre.trim() || p.nombre;
  p.edad = nEdad || p.edad;
  p.telefono = nTel || p.telefono;
  p.aseguradora = nSeguro || p.aseguradora;

  guardar();
}

function agregarNotaDirecta(id) {
  localStorage.setItem("pacienteActual", String(id));
  window.location.href = "historial.html?action=addNote";
}

// ARREGLO DEL PDF
function descargarPDFHistorial(id) {
  const p = pacientes.find(p => p.id === id);
  if (!p) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Diseño Pro del PDF
  doc.setFontSize(20);
  doc.text("HISTORIAL MÉDICO", 105, 20, { align: "center" });
  
  doc.setFontSize(12);
  doc.text(`Paciente: ${p.nombre}`, 20, 40);
  doc.text(`Edad: ${p.edad}`, 20, 50);
  doc.text(`Teléfono: ${p.telefono}`, 20, 60);
  doc.text(`Aseguradora: ${p.aseguradora || "N/A"}`, 20, 70);
  doc.text(`Fecha de Registro: ${p.creado}`, 20, 80);

  // Aquí podrías jalar las notas del localStorage también
  doc.text("--------------------------------------------------", 20, 90);
  doc.text("Notas Médicas Recientes:", 20, 100);
  
  // Guardar
  doc.save(`Historial_${p.nombre.replace(/ /g, "_")}.pdf`);
}

// ... (resto de funciones filtrar, eliminar, volver se mantienen igual)
render();
