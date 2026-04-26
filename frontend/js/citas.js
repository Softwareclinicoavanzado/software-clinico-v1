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

async function cargarPacientes() {
    const { data: pacientes, error } = await supabaseClient
        .from('pacientes')
        .select('id, nombre')
        .eq('clinica_id', clinicaID);

    if (error) {
        console.error("Error al cargar pacientes:", error);
        return;
    }

    selectPaciente.innerHTML = '<option value="">Seleccione un paciente</option>';
    pacientes.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.nombre;
        selectPaciente.appendChild(option);
    });
}

async function render() {
    if (!listaCitas) return;
    listaCitas.innerHTML = "";

    const { data: citasCloud, error } = await supabaseClient
        .from('citas')
        .select(`id, fecha, hora, paciente_id, pacientes ( nombre )`)
        .eq('clinica_id', clinicaID)
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true });

    if (error) {
        console.error("Error cargando citas:", error);
        return;
    }

    if (!citasCloud || citasCloud.length === 0) {
        listaCitas.innerHTML = "<div class='card'><p style='text-align:center; opacity:0.6;'>No hay citas agendadas.</p></div>";
        return;
    }

    citasCloud.forEach((c) => {
        const nombrePaciente = c.pacientes ? c.pacientes.nombre : "Paciente no identificado";
        const div = document.createElement("div");
        div.className = "card";
        div.style.marginBottom = "12px";
        div.style.borderLeft = "4px solid #3498db";
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong style="font-size: 1.1rem; color: #fff;">${nombrePaciente}</strong><br>
                    <span style="color: #3498db;">📅 ${c.fecha}</span> | <span style="color: #2ecc71;">⏰ ${c.hora}</span>
                </div>
                <button onclick="eliminarCita('${c.id}')" 
                        style="background: #e74c3c; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                    🗑️
                </button>
            </div>
        `;
        listaCitas.appendChild(div);
    });
}

async function agregarCita() {
    const paciente_id = selectPaciente.value;
    const fecha = inputFecha.value;
    const hora = inputHora.value;

    if (!paciente_id || !fecha || !hora) {
        return alert("Completa todos los campos para agendar.");
    }

    const nuevaCita = {
        paciente_id: Number(paciente_id),
        fecha: fecha,
        hora: hora,
        clinica_id: clinicaID,
        estado: 'programada'
    };

    try {
        const { error } = await supabaseClient
            .from('citas')
            .insert([nuevaCita]);

        if (error) throw error;

        alert("✅ Cita agendada con éxito en la nube.");
        inputFecha.value = "";
        inputHora.value = "";
        selectPaciente.value = "";
        cambiarVista('ver');

    } catch (error) {
        console.error("Error al agendar:", error);
        alert("Error al conectar con el servidor.");
    }
}

async function eliminarCita(id) {
    if (!confirm("¿Deseas cancelar esta cita permanentemente?")) return;

    const { error } = await supabaseClient
        .from('citas')
        .delete()
        .eq('id', id);

    if (error) {
        alert("No se pudo eliminar la cita.");
    } else {
        render();
    }
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

async function inicializarVistaCitas() {
    const params = new URLSearchParams(window.location.search);
    const modo = params.get("mode");
    await cargarPacientes();
    if (modo === 'nuevo') {
        cambiarVista('nuevo');
    } else {
        cambiarVista('ver');
    }
}

inicializarVistaCitas();
