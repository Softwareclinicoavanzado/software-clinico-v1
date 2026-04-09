/* =========================
   HISTORIAL CLÍNICO PRO
========================= */

/* =========================
   SEGURIDAD
========================= */
const rol = localStorage.getItem("rol");
if (rol === "recepcion") {
  alert("No autorizado");
  window.location.href = "dashboard.html";
}

/* =========================
   PACIENTE ACTUAL
========================= */
const pacienteID = Number(localStorage.getItem("pacienteActual"));
if (!pacienteID) {
  alert("Paciente no seleccionado");
  window.location.href = "pacientes.html";
}

/* =========================
   CARGAR PACIENTE
========================= */
let pacientes = [];
try {
  pacientes = getPacientes();
} catch {
  alert("Error cargando pacientes");
  window.location.href = "pacientes.html";
}

const paciente = pacientes.find(p => p.id === pacienteID);
if (!paciente) {
  alert("Paciente no encontrado");
  window.location.href = "pacientes.html";
}

document.getElementById("pacienteNombre").textContent =
  `${paciente.nombre} — Historial clínico`;

/* =========================
   ELEMENTOS
========================= */
const notaInput = document.getElementById("nota");
const tipoNotaInput = document.getElementById("tipoNota");
const listaHistorial = document.getElementById("listaHistorial");

/* =========================
   HISTORIAL
========================= */
let historial = [];
try {
  historial = getHistorial(pacienteID);
} catch {
  historial = [];
}

/* =========================
   FORMATO FECHA
========================= */
function fechaBonita() {
  return new Date().toLocaleString("es-GT", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

/* =========================
   RENDER
========================= */
function render() {
  listaHistorial.innerHTML = "";

  if (!historial.length) {
    listaHistorial.innerHTML = "<p>No hay registros clínicos</p>";
    return;
  }

  historial.forEach((h, i) => {
    const li = document.createElement("li");
    li.className = "card";
    li.innerHTML = `
      <strong>${h.tipo}</strong><br>
      <small>${h.fecha}</small>
      <hr>
      <p></p>
      <button type="button">Eliminar</button>
    `;

    li.querySelector("p").textContent = h.texto;
    li.querySelector("button").onclick = () => eliminarNota(i);

    listaHistorial.appendChild(li);
  });
}

/* =========================
   GUARDAR
========================= */
function guardar() {
  saveHistorial(pacienteID, historial);
  render();
}

/* =========================
   AGREGAR NOTA
========================= */
function agregarNota() {
  const texto = notaInput.value.trim();
  if (!texto) {
    alert("La nota no puede estar vacía");
    return;
  }

  historial.unshift({
    id: Date.now(),
    tipo: tipoNotaInput.value,
    texto,
    fecha: fechaBonita()
  });

  notaInput.value = "";
  guardar();
}

/* =========================
   ELIMINAR
========================= */
function eliminarNota(index) {
  if (!confirm("¿Eliminar esta nota médica?")) return;
  historial.splice(index, 1);
  guardar();
}

/* =========================
   PDF
========================= */
function exportarPDF() {
  if (!historial.length) {
    alert("No hay historial para exportar");
    return;
  }
  generarPDF(paciente.nombre, historial);
}

/* =========================
   VOLVER
========================= */
function volver() {
  window.location.href = "pacientes.html";
}

render();
