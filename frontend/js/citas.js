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
let editandoCitaId = null; // ✅ NUEVO: guarda el ID de la cita que se está editando

async function cargarPacientes() {
    const { data: pacientes, error } = await supabaseClient
        .from('pacientes')
        .select('id, nombre')
        .eq('clinica_id', clinicaID);

    if (error) {
        console.error("Error al cargar pacientes:", error);
        return;
    }

    selectPaciente.innerHTML = `<option value="">${t("seleccione_paciente")}</option>`;
    pacientes.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.nombre;
        selectPaciente.appendChild(option);
    });
}

// ✅ NUEVO: marca como "completada" cualquier cita cuya fecha/hora ya pasó
async function archivarCitasVencidas() {
    try {
        const { data: pendientes, error } = await supabaseClient
            .from('citas')
            .select('id, fecha, hora')
            .eq('clinica_id', clinicaID)
            .eq('estado', 'programada');

        if (error || !pendientes) return;

        const ahora = new Date();
        const idsVencidas = pendientes
            .filter(c => new Date(`${c.fecha}T${c.hora}`) < ahora)
            .map(c => c.id);

        if (idsVencidas.length > 0) {
            await supabaseClient
                .from('citas')
                .update({ estado: 'completada' })
                .in('id', idsVencidas);
        }
    } catch (e) {
        console.warn("No se pudieron archivar citas vencidas:", e);
    }
}

async function render() {
    if (!listaCitas) return;
    listaCitas.innerHTML = "";

    // ✅ Primero archivamos las vencidas, luego mostramos solo las que siguen programadas
    await archivarCitasVencidas();

    const { data: citasCloud, error } = await supabaseClient
        .from('citas')
        .select('id, fecha, hora, paciente_id, estado')
        .eq('clinica_id', clinicaID)
        .eq('estado', 'programada')
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true });

    if (error) {
        console.error("Error cargando citas:", error);
        return;
    }

    if (!citasCloud || citasCloud.length === 0) {
        listaCitas.innerHTML = `<div class='card'><p style='text-align:center; opacity:0.6;'>${t("sin_citas")}</p></div>`;
        return;
    }

    const { data: pacientesData } = await supabaseClient
        .from('pacientes')
        .select('id, nombre')
        .eq('clinica_id', clinicaID);

    citasCloud.forEach((c) => {
        const paciente = pacientesData 
            ? pacientesData.find(p => Number(p.id) === Number(c.paciente_id)) 
            : null;
        const nombrePaciente = paciente ? paciente.nombre : "Paciente no identificado";

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
                <div style="display:flex; gap:6px;">
                    <button onclick="editarCita('${c.id}', '${c.paciente_id}', '${c.fecha}', '${c.hora}')" 
                            style="background: #9b59b6; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                        ✏️
                    </button>
                    <button onclick="eliminarCita('${c.id}')" 
                            style="background: #e74c3c; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                        🗑️
                    </button>
                </div>
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

    const datosCita = {
        paciente_id: Number(paciente_id),
        fecha: fecha,
        hora: hora,
        clinica_id: clinicaID
    };

    try {
        if (editandoCitaId) {
            // ✅ NUEVO: si estamos editando, actualizamos en vez de crear una nueva
            const { error } = await supabaseClient
                .from('citas')
                .update(datosCita)
                .eq('id', editandoCitaId);

            if (error) throw error;

            alert("✅ Cita actualizada con éxito.");
            editandoCitaId = null;
        } else {
            datosCita.estado = 'programada';
            const { error } = await supabaseClient
                .from('citas')
                .insert([datosCita]);

            if (error) throw error;

            alert("✅ Cita agendada con éxito en la nube.");
        }

        inputFecha.value = "";
        inputHora.value = "";
        selectPaciente.value = "";
        cambiarVista('ver');

    } catch (error) {
        console.error("Error al agendar:", error);
        alert("Error al conectar con el servidor.");
    }
}

// ✅ NUEVO: prepara el formulario con los datos de la cita para editarla
function editarCita(id, pacienteId, fecha, hora) {
    editandoCitaId = id;
    selectPaciente.value = pacienteId;
    inputFecha.value = fecha;
    inputHora.value = hora;
    cambiarVista('nuevo');
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
        if(titulo) titulo.innerText = editandoCitaId ? t("editar_cita_titulo") : t("titulo_agendar_cita");

        // ✅ El botón de confirmar cambia de texto según si es nueva cita o edición
        const btnConfirmar = document.querySelector('[onclick="agregarCita()"]');
        if (btnConfirmar) btnConfirmar.innerText = editandoCitaId ? t("actualizar_cita") : t("confirmar_agendar");
    } else {
        editandoCitaId = null; // ✅ salir de modo edición al volver a la lista
        if(seccionForm) seccionForm.style.display = "none";
        if(seccionVer) seccionVer.style.display = "block";
        if(titulo) titulo.innerText = t("titulo_ver_agenda");
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
