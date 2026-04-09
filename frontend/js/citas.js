// ========================= CITAS =========================
if (!localStorage.getItem("clinicaID")) {
  alert("Sesión inválida");
  window.location.href = "index.html";
}

const lista = document.getElementById("listaCitas");
const select = document.getElementById("pacienteSelect");
const fecha = document.getElementById("fecha");
const hora = document.getElementById("hora");

let citas = getCitas();

function cargarPacientes() {
  const pacientes = getPacientes();
  select.innerHTML = '<option value="">Seleccione un paciente</option>';

  if (!pacientes.length) {
    select.innerHTML += '<option disabled>No hay pacientes</option>';
    return;
  }

  pacientes.forEach(p => {
    const option = document.createElement("option");
    option.value = p.id;
    option.textContent = p.nombre;
    select.appendChild(option);
  });
}

function guardar() {
  saveCitas(citas);
  render();
}

function render() {
  lista.innerHTML = "";

  if (!citas.length) {
    lista.innerHTML = "<p>No hay citas</p>";
    return;
  }

  const pacientes = getPacientes();

  citas
    .sort((a, b) => new Date(`${a.fecha} ${a.hora}`) - new Date(`${b.fecha} ${b.hora}`))
    .forEach((c, i) => {
      const paciente = pacientes.find(p => p.id === c.pacienteID);
      lista.innerHTML += `
        <li>
          <strong>${paciente ? paciente.nombre : "Paciente eliminado"}</strong><br>
          ${c.fecha} – ${c.hora}
          <button onclick="eliminar(${i})">Eliminar</button>
        </li>`;
    });
}

function agregarCita() {
  if (!select.value || !fecha.value || !hora.value) {
    alert("Completa todos los campos");
    return;
  }

  if (citas.some(c => c.fecha === fecha.value && c.hora === hora.value)) {
    alert("Horario ocupado");
    return;
  }

  citas.push({
    pacienteID: Number(select.value),
    fecha: fecha.value,
    hora: hora.value,
    creado: new Date().toLocaleString()
  });

  fecha.value = "";
  hora.value = "";
  select.value = "";
  guardar();
}

function eliminar(i) {
  if (!confirm("Eliminar cita")) return;
  citas.splice(i, 1);
  guardar();
}

function volver() {
  window.location.href = "dashboard.html";
}

cargarPacientes();
render();