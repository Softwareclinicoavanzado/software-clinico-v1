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
const inputMotivo = document.getElementById("motivo");
const seccionForm = document.getElementById("seccionFormulario");
const seccionVer = document.getElementById("seccionLista");
const seccionCal = document.getElementById("seccionCalendario");
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

function fechaLocalISO(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
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
        .select('id, fecha, hora, paciente_id, estado, motivo')
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

            ${c.motivo ? `<p class="appt-motivo">${c.motivo}</p>` : ""}

            <div class="patient-actions">
                <button type="button" class="btn-action" onclick="editarCita('${c.id}', '${c.paciente_id}', '${c.fecha}', '${c.hora}', ${JSON.stringify(c.motivo || "")})">
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

/* =========================================================
   CALENDARIO VISUAL (vista de mes)
========================================================= */
let calFecha = new Date();
let calCitasDelMes = [];
let calPacientesMap = {};
let calDiaSeleccionado = null;

function nombresMeses() {
    const lang = localStorage.getItem("lang") || "es";
    const mapa = {
        es: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
        en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
        fr: ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]
    };
    return mapa[lang] || mapa.es;
}

function nombresDiasCortos() {
    const lang = localStorage.getItem("lang") || "es";
    const mapa = {
        es: ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"],
        en: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
        fr: ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"]
    };
    return mapa[lang] || mapa.es;
}

async function cargarCitasDelMes() {
    const anio = calFecha.getFullYear();
    const mes = calFecha.getMonth();
    const primerDia = fechaLocalISO(new Date(anio, mes, 1));
    const ultimoDia = fechaLocalISO(new Date(anio, mes + 1, 0));

    const { data: citasCloud, error } = await supabaseClient
        .from('citas')
        .select('id, fecha, hora, paciente_id, estado, motivo')
        .eq('clinica_id', clinicaID)
        .eq('estado', 'programada')
        .gte('fecha', primerDia)
        .lte('fecha', ultimoDia)
        .order('hora', { ascending: true });

    if (error) {
        console.error("Error cargando citas del mes:", error);
        calCitasDelMes = [];
        return;
    }
    calCitasDelMes = citasCloud || [];

    const { data: pacientesData } = await supabaseClient
        .from('pacientes')
        .select('id, nombre')
        .eq('clinica_id', clinicaID);

    calPacientesMap = {};
    (pacientesData || []).forEach(p => { calPacientesMap[p.id] = p.nombre; });
}

function renderCalendario() {
    const grid = document.getElementById("calendarGrid");
    const label = document.getElementById("calendarMesLabel");
    if (!grid || !label) return;

    const anio = calFecha.getFullYear();
    const mes = calFecha.getMonth();
    label.textContent = `${nombresMeses()[mes]} ${anio}`;

    const primerDiaSemana = new Date(anio, mes, 1).getDay();
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    const hoyStr = fechaLocalISO(new Date());

    const citasPorDia = {};
    calCitasDelMes.forEach(c => {
        if (!citasPorDia[c.fecha]) citasPorDia[c.fecha] = [];
        citasPorDia[c.fecha].push(c);
    });

    let html = "";
    nombresDiasCortos().forEach(d => {
        html += `<div class="calendar-day-header">${d}</div>`;
    });

    for (let i = 0; i < primerDiaSemana; i++) {
        html += `<div class="calendar-day calendar-day-empty"></div>`;
    }

    for (let dia = 1; dia <= diasEnMes; dia++) {
        const fechaStr = fechaLocalISO(new Date(anio, mes, dia));
        const esHoy = fechaStr === hoyStr;
        const esSeleccionado = fechaStr === calDiaSeleccionado;
        const citasDia = citasPorDia[fechaStr] || [];
        const maxVisible = 2;

        let chipsHtml = "";
        citasDia.slice(0, maxVisible).forEach(c => {
            const nombre = calPacientesMap[c.paciente_id] || "?";
            chipsHtml += `<div class="calendar-appt-chip">${formatearHora(c.hora)} · ${nombre.split(" ")[0]}</div>`;
        });
        if (citasDia.length > maxVisible) {
            chipsHtml += `<div class="calendar-more-badge">+${citasDia.length - maxVisible} ${t("calendario_mas") || "más"}</div>`;
        }

        html += `
            <div class="calendar-day ${esHoy ? "calendar-day-today" : ""} ${esSeleccionado ? "calendar-day-selected" : ""}" onclick="seleccionarDiaCalendario('${fechaStr}')">
                <div class="calendar-day-number">${dia}</div>
                <div class="calendar-day-chips">${chipsHtml}</div>
            </div>
        `;
    }

    grid.innerHTML = html;
    renderDetalleDiaSeleccionado(citasPorDia);
}

function renderDetalleDiaSeleccionado(citasPorDia) {
    const panel = document.getElementById("calendarDetallePanel");
    if (!panel) return;

    if (!calDiaSeleccionado) {
        panel.innerHTML = `<p style="text-align:center; opacity:0.5; padding:20px;">${t("calendario_selecciona_dia") || "Selecciona un día para ver las citas"}</p>`;
        return;
    }

    const citasDia = (citasPorDia || {})[calDiaSeleccionado] || calCitasDelMes.filter(c => c.fecha === calDiaSeleccionado);

    if (citasDia.length === 0) {
        panel.innerHTML = `
            <div class="calendar-detalle-header">${formatearFecha(calDiaSeleccionado)}</div>
            <p style="text-align:center; opacity:0.5; padding:20px 0;">${t("sin_citas")}</p>
        `;
        return;
    }

    let html = `<div class="calendar-detalle-header">${formatearFecha(calDiaSeleccionado)}</div>`;
    citasDia.forEach(c => {
        const nombre = calPacientesMap[c.paciente_id] || "?";
        html += `
            <div class="appt-card" style="margin-bottom:10px;">
                <div class="appt-card-top">
                    <div class="patient-identity">
                        <div class="patient-avatar" style="background:${colorAvatar(nombre)}20; color:${colorAvatar(nombre)}; border-color:${colorAvatar(nombre)}40;">
                            ${iniciales(nombre)}
                        </div>
                        <div>
                            <div class="patient-name">${nombre}</div>
                        </div>
                    </div>
                </div>
                <div class="appt-tags">
                    <span class="appt-chip appt-chip-time">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                        ${formatearHora(c.hora)}
                    </span>
                </div>
                ${c.motivo ? `<p class="appt-motivo">${c.motivo}</p>` : ""}
                <div class="patient-actions">
                    <button type="button" class="btn-action" onclick="editarCita('${c.id}', '${c.paciente_id}', '${c.fecha}', '${c.hora}', ${JSON.stringify(c.motivo || "")})">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                        ${t("editar_cita_btn") || "Editar"}
                    </button>
                    <button type="button" class="btn-action btn-action-danger" onclick="eliminarCitaDesdeCalendario('${c.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                        ${t("cancelar_cita_btn") || "Cancelar"}
                    </button>
                </div>
            </div>
        `;
    });
    panel.innerHTML = html;
}

async function seleccionarDiaCalendario(fechaStr) {
    calDiaSeleccionado = fechaStr;
    await renderCalendario();
    const panel = document.getElementById("calendarDetallePanel");
    if (panel) {
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

async function eliminarCitaDesdeCalendario(id) {
    if (!confirm("¿Deseas cancelar esta cita permanentemente?")) return;
    const { error } = await supabaseClient.from('citas').delete().eq('id', id);
    if (error) {
        alert("No se pudo eliminar la cita.");
        return;
    }
    if (typeof registrarAuditoria === "function") {
        registrarAuditoria("eliminar", "cita", "Cita cancelada desde el calendario");
    }
    await cargarCitasDelMes();
    renderCalendario();
}

async function mesAnterior() {
    calFecha = new Date(calFecha.getFullYear(), calFecha.getMonth() - 1, 1);
    calDiaSeleccionado = null;
    await cargarCitasDelMes();
    renderCalendario();
}

async function mesSiguiente() {
    calFecha = new Date(calFecha.getFullYear(), calFecha.getMonth() + 1, 1);
    calDiaSeleccionado = null;
    await cargarCitasDelMes();
    renderCalendario();
}

async function irHoyCalendario() {
    calFecha = new Date();
    calDiaSeleccionado = fechaLocalISO(new Date());
    await cargarCitasDelMes();
    renderCalendario();
}

async function abrirCalendario() {
    if (seccionForm) seccionForm.style.display = "none";
    if (seccionVer) seccionVer.style.display = "none";
    if (seccionCal) seccionCal.style.display = "block";
    if (titulo) titulo.innerText = t("calendario_titulo") || "Calendario";
    await cargarCitasDelMes();
    renderCalendario();
}

/* =========================================================
   RETRADUCCIÓN AL CAMBIAR IDIOMA SIN RECARGAR
========================================================= */
function retraducirContenidoDinamico() {
    if (seccionCal && seccionCal.style.display === "block") {
        renderCalendario();
        if (titulo) titulo.innerText = t("calendario_titulo");
    } else if (seccionForm && seccionForm.style.display === "block") {
        if (titulo) titulo.innerText = editandoCitaId ? t("editar_cita_titulo") : t("titulo_agendar_cita");
        const btnConfirmar = document.querySelector('[onclick="agregarCita()"]');
        if (btnConfirmar) btnConfirmar.innerText = editandoCitaId ? t("actualizar_cita") : t("confirmar_agendar");
    } else {
        render();
        if (titulo) titulo.innerText = t("titulo_ver_agenda");
    }
}

/* ========================================================= */

async function agregarCita() {
    const paciente_id = selectPaciente.value;
    const fecha = inputFecha.value;
    const hora = inputHora.value;
    const motivo = inputMotivo ? inputMotivo.value.trim() : "";

    if (!paciente_id || !fecha || !hora) {
        return alert("Completa todos los campos para agendar.");
    }

    const nombrePacienteSel = selectPaciente.options[selectPaciente.selectedIndex]
        ? selectPaciente.options[selectPaciente.selectedIndex].text
        : "";

    const datosCita = {
        paciente_id: Number(paciente_id),
        fecha: fecha,
        hora: hora,
        motivo: motivo || null,
        clinica_id: clinicaID
    };

    try {
        if (editandoCitaId) {
            const { error } = await supabaseClient
                .from('citas')
                .update(datosCita)
                .eq('id', editandoCitaId);

            if (error) throw error;

            if (typeof registrarAuditoria === "function") {
                registrarAuditoria("editar", "cita", `${nombrePacienteSel} — ${fecha} ${hora}`);
            }

            alert("✅ Cita actualizada con éxito.");
            editandoCitaId = null;
        } else {
            datosCita.estado = 'programada';
            const { error } = await supabaseClient
                .from('citas')
                .insert([datosCita]);

            if (error) throw error;

            if (typeof registrarAuditoria === "function") {
                registrarAuditoria("crear", "cita", `${nombrePacienteSel} — ${fecha} ${hora}`);
            }

            alert("✅ Cita agendada con éxito en la nube.");
        }

        inputFecha.value = "";
        inputHora.value = "";
        selectPaciente.value = "";
        if (inputMotivo) inputMotivo.value = "";
        cambiarVista('ver');

    } catch (error) {
        console.error("Error al agendar:", error);
        alert("Error al conectar con el servidor.");
    }
}

function editarCita(id, pacienteId, fecha, hora, motivo) {
    editandoCitaId = id;
    selectPaciente.value = pacienteId;
    inputFecha.value = fecha;
    inputHora.value = hora;
    if (inputMotivo) inputMotivo.value = motivo || "";
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
        if (typeof registrarAuditoria === "function") {
            registrarAuditoria("eliminar", "cita", "Cita cancelada");
        }
        render();
    }
}

function cambiarVista(modo) {
    if (modo === 'calendario') {
        if(seccionForm) seccionForm.style.display = "none";
        if(seccionVer) seccionVer.style.display = "none";
        abrirCalendario();
        return;
    }

    if (seccionCal) seccionCal.style.display = "none";

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
    } else if (modo === 'calendario') {
        cambiarVista('calendario');
    } else {
        cambiarVista('ver');
    }
}

inicializarVistaCitas();
