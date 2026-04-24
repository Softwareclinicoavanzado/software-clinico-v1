// ========================= CITAS PRO (CLOUD EDITION) =========================
const clinicaID = typeof getClinicaID === "function" ? getClinicaID() : localStorage.getItem("clinicaID");

if (!clinicaID) {
    alert("Sesión inválida");
    window.location.href = "index.html";
}

const listaCitas = document.getElementById("listaCitas");
const selectPaciente = document.getElementById("pacienteSelect");
const inputFecha = document.getElementById("fecha");
const inputHora = document.getElementById("hora");
const seccionForm = document.getElementById("seccionFormulario");
const seccionVer = document.getElementById("seccionLista");
const titulo = document.getElementById("tituloPagina");

let citas = [];

// MODIFICADO: Ahora carga pacientes de forma asíncrona para el select
async function cargarPacientes() {
    const pacientes = await getPacientes(); 
    selectPaciente.innerHTML = '<option value="">Seleccione un paciente</option>';

    if (!pacientes || !pacientes.length) {
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

async function guardar() {
    saveCitas(citas);
    render();
    if (typeof syncAllToCloud === "function") await syncAllToCloud();
}

// MODIFICADO: Renderizado asíncrono para asegurar datos frescos
async function render() {
    if (!listaCitas) return;
    listaCitas.innerHTML = "";

    // Obtenemos pacientes para cruzar nombres en la vista de lista
    const pacientes = await getPacientes();
    
    if (!citas || !citas.length) {
        listaCitas.innerHTML = "<div class='card'><p style='text-align:center; opacity:0.6;'>No hay citas agendadas.</p></div>";
        return;
    }

    const citasOrdenadas = [...citas].sort((a, b) => new Date(`${a.fecha} ${a.hora}`) - new Date(`${b.fecha} ${b.hora}`));

    citasOrdenadas.forEach((c) => {
        const paciente = pacientes.find(p => Number(p.id) === Number(c.paciente_id || c.pacienteID));
        const div = document.createElement("div");
        div.className = "card";
        div.style.marginBottom = "12px";
        div.style.borderLeft = "4px solid #3498db";
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong style="font-size: 1.1rem; color: #fff;">${paciente ? paciente.nombre : "Paciente no identificado"}</strong><br>
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

async function agregarCita() {
    if (!selectPaciente.value || !inputFecha.value || !inputHora.value) {
        return alert("Completa todos los campos para agendar.");
    }

    if (citas.some(c => c.fecha === inputFecha.value && c.hora === inputHora.value)) {
        return alert("⚠️ Este horario ya está ocupado por otra cita.");
    }

    const nuevaCita = {
        id: Date.now(),
        paciente_id: Number(selectPaciente.value), // Nombre de columna estándar para DB
        fecha: inputFecha.value,
        hora: inputHora.value,
        clinica_id: clinicaID,
        creado: new Date().toISOString()
    };

    citas.push(nuevaCita);
    await guardar();

    alert("✅ Cita agendada con éxito.");
    inputFecha.value = "";
    inputHora.value = "";
    selectPaciente.value = "";
    cambiarVista('ver');
}

async function eliminarCita(id) {
    if (!confirm("¿Deseas cancelar esta cita permanentemente?")) return;
    citas = citas.filter(c => Number(c.id) !== Number(id));
    await guardar();
}

function cambiarVista(modo) {
    if (modo === 'nuevo') {
        if(seccionForm) seccionForm.style.display = "block";
        if(seccionVer) seccionVer.style.display = "none";
        if(titulo) titulo.innerText = "Agendar Cita";
    } else {
        if(seccionForm) seccionForm.style.display = "none";
        if(seccionVer) seccionVer.style.display = "block";
        if(titulo) titulo.innerText = "Agenda Médica";
        render();
    }
}

function volver() {
    window.location.href = "dashboard.html";
}

// MODIFICADO: Detección y carga inicial asíncrona
async function inicializarVistaCitas() {
    const params = new URLSearchParams(window.location.search);
    const modo = params.get("mode");

    await cargarPacientes();
    citas = await getCitas(); // Traemos las citas de la nube/local
    
    if (modo === 'nuevo') {
        cambiarVista('nuevo');
    } else {
        cambiarVista('ver');
    }
}

inicializarVistaCitas();
