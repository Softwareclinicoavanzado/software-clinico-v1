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
let editandoCitaId = null;

/* =========================
   Helpers visuales (mismos que pacientes.js, para consistencia)
========================= */
function iniciales(nombre) {
    if (!nombre) return "?";
    const partes = nombre.trim().split(" ").filter(Boolean);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
}

function colorAvatar(nombre) {
    const paleta = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4"];
    let hash = 0;
    for (let i = 0; i < (nombre || "").length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    return paleta[Math.abs(hash) % paleta.length];
}

function formatearFecha(fechaISO) {
    if (!fechaISO) return "";
    const [y, m, d] = fechaISO.split("-");
    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    return `${d} ${meses[parseInt(m, 10) - 1]}`;
}

function formatearHora(horaStr) {
    if (!horaStr) return "";
    let [h, m] = horaStr.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

function esCitaHoy(fechaISO) {
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split("T")[0];
    return fechaISO === hoyStr;
}

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
        const hoy = esCitaHoy(c.fecha);

        const div = document.createElement("div");
        div.className = "appt-card";
        div.innerHTML = `
            <div class="appt-card-top">
                <div class="patient-identity">
                    <div class="patient-avatar" style="background:${colorAvatar(nombrePaciente)}20; color:${colorAvatar(nombrePaciente)}; border-color:${colorAvatar(nombrePaciente)}40;">
                        ${iniciales(nombrePaciente)}
                    </div>
                    <div>
                        <div class="patient-name">${nombrePaciente}</div>
                        ${hoy ? `<div class="appt-today-badge">${t("hoy") || "Hoy"}</div>` : ""}
                    </div>
                </div>
            </div>

            <div class="appt-tags">
                <span class="appt-chip appt-chip-date">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    ${formatearFecha(c.fecha)}
                </span>
                <span class="appt-chip appt-chip-time">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    ${formatearHora(c.hora)}
                </span>
            </div>

            <div class="patient-actions">
                <button type="button" class="btn-action" onclick="editarCita('${c.id}', '${c.paciente_id}', '${c.fecha}', '${c.hora}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                    ${t("editar_cita_btn") || "Editar"}
                </button>
                <button type="button" class="btn-action btn-action-danger" onclick="eliminarCita('${c.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    ${t("cancelar_cita_btn") || "Cancelar"}
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

    const datosCita = {
        paciente_id: Number(paciente_id),
        fecha: fecha,
        hora: hora,
        clinica_id: clinicaID
    };

    try {
        if (editandoCitaId) {
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

        const btnConfirmar = document.querySelector('[onclick="agregarCita()"]');
        if (btnConfirmar) btnConfirmar.innerText = editandoCitaId ? t("actualizar_cita") : t("confirmar_agendar");
    } else {
        editandoCitaId = null;
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
