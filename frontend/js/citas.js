// ========================= CITAS PRO =========================
const clinicaID = localStorage.getItem("clinicaID");

if (!clinicaID) {
    alert("Sesión inválida");
    window.location.href = "index.html";
}

// Elementos del DOM
const listaCitas = document.getElementById("listaCitas");
const selectPaciente = document.getElementById("pacienteSelect");
const inputFecha = document.getElementById("fecha");
const inputHora = document.getElementById("hora");
const seccionForm = document.getElementById("seccionFormulario");
const seccionVer = document.getElementById("seccionLista");
const titulo = document.getElementById("tituloPagina");

let citas = getCitas();

function cargarPacientes() {
    const pacientes = getPacientes();
    selectPaciente.innerHTML = '<option value="">Seleccione un paciente</option>';

    if (!pacientes.length) {
        selectPaciente.innerHTML += '<option disabled>No hay pacientes registrados</option>';
        return;
    }

    pacientes.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.nombre;
        selectPaciente.appendChild(option);
    });
}

function guardar() {
    saveCitas(citas);
    render();
}

function render() {
    if (!listaCitas) return;
    listaCitas.innerHTML = "";

    if (!citas.length) {
        listaCitas.innerHTML = "<div class='card'><p style='text-align:center; opacity:0.6;'>No hay citas agendadas.</p></div>";
        return;
    }

    const pacientes = getPacientes();

    // Ordenar por fecha y hora
    const citasOrdenadas = [...citas].sort((a, b) => new Date(`${a.fecha} ${a.hora}`) - new Date(`${b.fecha} ${b.hora}`));

    citasOrdenadas.forEach((c) => {
        const paciente = pacientes.find(p => p.id === c.pacienteID);
        const div = document.createElement("div");
        div.className = "card";
        div.style.marginBottom = "12px";
        div.style.borderLeft = "4px solid #3498db";
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong style="font-size: 1.1rem; color: #fff;">${paciente ? paciente.nombre : "Paciente eliminado"}</strong><br>
                    <span style="color: #3498db;">📅 ${c.fecha}</span> | <span style="color: #2ecc71;">⏰ ${c.hora}</span>
                </div>
                <button onclick="eliminarCita(${c.id})" 
                        style="background: #e74c3c; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                    🗑️
                </button>
            </div>
        `;
        listaCitas.appendChild(div);
    });
}

function agregarCita() {
    if (!selectPaciente.value || !inputFecha.value || !inputHora.value) {
        return alert("Completa todos los campos para agendar.");
    }

    // Evitar duplicados en el mismo horario
    if (citas.some(c => c.fecha === inputFecha.value && c.hora === inputHora.value)) {
        return alert("⚠️ Este horario ya está ocupado por otra cita.");
    }

    const nuevaCita = {
        id: Date.now(), // ID único para cada cita
        pacienteID: Number(selectPaciente.value),
        fecha: inputFecha.value,
        hora: inputHora.value,
        creado: new Date().toLocaleString()
    };

    citas.push(nuevaCita);
    guardar();

    alert("✅ Cita agendada con éxito.");
    
    // Limpiar campos
    inputFecha.value = "";
    inputHora.value = "";
    selectPaciente.value = "";

    // Volver a la vista de lista
    cambiarVista('ver');
}

function eliminarCita(id) {
    if (!confirm("¿Deseas cancelar esta cita permanentemente?")) return;
    citas = citas.filter(c => c.id !== id);
    guardar();
}

function cambiarVista(modo) {
    if (modo === 'nuevo') {
        seccionForm.style.display = "block";
        seccionVer.style.display = "none";
        titulo.innerText = "Agendar Cita";
    } else {
        seccionForm.style.display = "none";
        seccionVer.style.display = "block";
        titulo.innerText = "Agenda Médica";
        render();
    }
}

function volver() {
    window.location.href = "dashboard.html";
}

// Inicializar
cargarPacientes();
cambiarVista('ver'); // Por defecto ver la lista
