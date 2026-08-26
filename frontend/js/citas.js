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
let codigoTelPaisClinica = "502"; // valor por defecto mientras carga desde la base de datos

// Citas activas del día seleccionado en el formulario (para detectar choques de horario)
let citasDelDiaSeleccionado = [];
let mapaPacientesDia = {};

async function cargarCodigoTelClinica() {
    try {
        const { data, error } = await supabaseClient
            .from('clinicas')
            .select('codigo_pais')
            .eq('id', clinicaID)
            .maybeSingle();

        if (!error && data && data.codigo_pais) {
            codigoTelPaisClinica = data.codigo_pais;
        }
    } catch (e) {
        console.warn("No se pudo cargar el código telefónico de la clínica, usando valor por defecto:", e);
    }
}

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

function esCitaManana(fechaISO) {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    return fechaISO === fechaLocalISO(manana);
}

function fechaLocalISO(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/* =========================================================
   Helper: convierte un texto a un literal JS seguro para
   insertar dentro de un atributo onclick="..." (que usa
   comillas dobles). Evita que comillas dentro del texto
   (ej. el motivo de la cita) rompan el HTML del botón.
========================================================= */
function jsStringParaOnclick(str) {
    return JSON.stringify(str || "").replace(/"/g, "&quot;");
}

/* =========================================================
   RECORDATORIO POR WHATSAPP (1 clic, sin API, gratis)
   Abre WhatsApp con el mensaje ya escrito, listo para enviar,
   y marca la cita como "whatsapp_enviado" para seguimiento.
========================================================= */
async function enviarWhatsAppRecordatorio(citaId, telefono, nombrePaciente, fechaISO, horaStr) {
    if (!telefono) {
        alert(t("whatsapp_sin_telefono"));
        return;
    }

    // Dejamos solo los dígitos del número
    let numeroLimpio = telefono.replace(/[^\d]/g, "");

    // Si el número no trae ya el código de país al inicio, se lo agregamos
    // usando el código telefónico configurado para esta clínica.
    if (!numeroLimpio.startsWith(codigoTelPaisClinica)) {
        numeroLimpio = codigoTelPaisClinica + numeroLimpio;
    }

    const mensaje = t("whatsapp_mensaje")
        .replace("{nombre}", nombrePaciente || "")
        .replace("{fecha}", formatearFecha(fechaISO))
        .replace("{hora}", formatearHora(horaStr));

    const url = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");

    // Marcamos la cita como "WhatsApp enviado" para llevar seguimiento
    try {
        await supabaseClient
            .from('citas')
            .update({ whatsapp_enviado: true })
            .eq('id', citaId);
    } catch (e) {
        console.warn("No se pudo marcar el WhatsApp como enviado:", e);
    }

    // Refrescamos la vista actual para reflejar el cambio
    if (seccionCal && seccionCal.style.display === "block") {
        await cargarCitasDelMes();
        renderCalendario();
    } else {
        render();
    }
}

/* =========================================================
   RESUMEN DEL DÍA + DETECCIÓN DE HORARIOS OCUPADOS
   Se carga cada vez que se elige/cambia la fecha en el
   formulario de agendar/editar cita.
========================================================= */
async function cargarResumenDia() {
    const panel = document.getElementById("panelResumenDia");
    const fecha = inputFecha.value;

    if (!fecha) {
        citasDelDiaSeleccionado = [];
        mapaPacientesDia = {};
        if (panel) panel.innerHTML = "";
        generarChipsHora();
        return;
    }

    try {
        const { data: citasDia, error } = await supabaseClient
            .from('citas')
            .select('id, hora, motivo, paciente_id')
            .eq('clinica_id', clinicaID)
            .eq('fecha', fecha)
            .in('estado', ['programada', 'confirmada']);

        if (error) throw error;

        // Si estamos editando una cita, la excluimos de la lista de "ocupados"
        citasDelDiaSeleccionado = (citasDia || [])
            .filter(c => String(c.id) !== String(editandoCitaId))
            .sort((a, b) => a.hora.localeCompare(b.hora));

        const { data: pacientesData } = await supabaseClient
            .from('pacientes')
            .select('id, nombre')
            .eq('clinica_id', clinicaID);

        mapaPacientesDia = {};
        (pacientesData || []).forEach(p => { mapaPacientesDia[p.id] = p.nombre; });

    } catch (e) {
        console.warn("No se pudo cargar el resumen del día:", e);
        citasDelDiaSeleccionado = [];
        mapaPacientesDia = {};
    }

    renderPanelResumenDia();
    generarChipsHora();
}

function renderPanelResumenDia() {
    const panel = document.getElementById("panelResumenDia");
    if (!panel) return;

    if (!inputFecha.value) {
        panel.innerHTML = "";
        return;
    }

    if (citasDelDiaSeleccionado.length === 0) {
        panel.innerHTML = `
            <div style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.25); border-radius:10px; padding:10px 14px; font-size:13px; color:#86efac;">
                ✅ No hay citas agendadas todavía este día.
            </div>
        `;
        return;
    }

    let filas = "";
    citasDelDiaSeleccionado.forEach(c => {
        const nombre = mapaPacientesDia[c.paciente_id] || "Paciente";
        filas += `
            <div style="display:flex; justify-content:space-between; gap:10px; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.06);">
                <span style="color:#93c5fd; font-weight:bold; min-width:70px;">${formatearHora(c.hora)}</span>
                <span style="flex:1; color:#e2e8f0;">${nombre}${c.motivo ? ` — <span style="opacity:0.7;">${c.motivo}</span>` : ""}</span>
            </div>
        `;
    });

    panel.innerHTML = `
        <div style="background:rgba(59,130,246,0.06); border:1px solid rgba(59,130,246,0.2); border-radius:10px; padding:12px 14px;">
            <div style="font-size:12px; font-weight:bold; color:#93c5fd; margin-bottom:6px;">
                🗓️ Citas ya agendadas ese día (${citasDelDiaSeleccionado.length})
            </div>
            ${filas}
        </div>
    `;
}

function chipOcupadoClick(horaStr) {
    const cita = citasDelDiaSeleccionado.find(c => c.hora === horaStr);
    const nombre = cita ? (mapaPacientesDia[cita.paciente_id] || "un paciente") : "un paciente";
    const motivo = cita && cita.motivo ? ` (${cita.motivo})` : "";
    alert(`⚠️ Ya hay una cita a las ${formatearHora(horaStr)} con ${nombre}${motivo}.\n\nSi de verdad necesitas agendar a esta misma hora, usa el campo "¿Otra hora?" y confirma cuando el sistema te lo pregunte.`);
}

/* =========================================================
   SELECTOR DE HORA PREMIUM (chips)
========================================================= */
function generarChipsHora() {
    const grid = document.getElementById("timePickerGrid");
    if (!grid) return;

    const periodos = [
        { etiqueta: t("periodo_manana") || "Mañana", inicio: 6, fin: 12 },
        { etiqueta: t("periodo_tarde") || "Tarde", inicio: 12, fin: 18 },
        { etiqueta: t("periodo_noche") || "Noche", inicio: 18, fin: 22 }
    ];

    const horaSeleccionadaActual = inputHora ? inputHora.value : "";

    let html = "";
    periodos.forEach(periodo => {
        html += `<div class="time-chip periodo-label">${periodo.etiqueta}</div>`;
        for (let h = periodo.inicio; h < periodo.fin; h++) {
            [0, 30].forEach(min => {
                const horaStr = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
                const ocupado = citasDelDiaSeleccionado.some(c => c.hora === horaStr);
                const seleccionado = horaStr === horaSeleccionadaActual;

                if (ocupado) {
                    html += `<div class="time-chip time-chip-ocupado" data-hora="${horaStr}" style="background:rgba(239,68,68,0.18); color:#fca5a5; border:1px solid rgba(239,68,68,0.5); cursor:not-allowed;" onclick="chipOcupadoClick('${horaStr}')" title="Ya ocupado">🔴 ${formatearHora(horaStr)}</div>`;
                } else {
                    html += `<div class="time-chip${seleccionado ? " selected" : ""}" data-hora="${horaStr}" onclick="seleccionarHoraChip('${horaStr}')">${formatearHora(horaStr)}</div>`;
                }
            });
        }
    });

    grid.innerHTML = html;
}

function seleccionarHoraChip(horaStr) {
    document.getElementById("hora").value = horaStr;
    const customInput = document.getElementById("horaCustom");
    if (customInput) customInput.value = "";
    document.querySelectorAll(".time-chip[data-hora]").forEach(chip => {
        chip.classList.toggle("selected", chip.dataset.hora === horaStr);
    });
}

function seleccionarHoraCustom() {
    const customInput = document.getElementById("horaCustom");
    if (!customInput || !customInput.value) return;

    const horaElegida = customInput.value;
    const ocupado = citasDelDiaSeleccionado.find(c => c.hora === horaElegida);

    if (ocupado) {
        const nombre = mapaPacientesDia[ocupado.paciente_id] || "un paciente";
        const motivo = ocupado.motivo ? ` (${ocupado.motivo})` : "";
        const continuar = confirm(`⚠️ Ya hay una cita a las ${formatearHora(horaElegida)} con ${nombre}${motivo}.\n\n¿Deseas agendar de todas formas a esta misma hora?`);
        if (!continuar) {
            customInput.value = "";
            document.getElementById("hora").value = "";
            return;
        }
    }

    document.getElementById("hora").value = horaElegida;
    document.querySelectorAll(".time-chip[data-hora]").forEach(chip => {
        chip.classList.toggle("selected", chip.dataset.hora === horaElegida);
    });
}

function marcarHoraSeleccionada(horaStr) {
    if (!horaStr) return;
    document.getElementById("hora").value = horaStr;
    const chip = document.querySelector(`.time-chip[data-hora="${horaStr}"]`);
    if (chip) {
        document.querySelectorAll(".time-chip[data-hora]").forEach(c => c.classList.remove("selected"));
        chip.classList.add("selected");
    } else {
        const customInput = document.getElementById("horaCustom");
        if (customInput) customInput.value = horaStr;
    }
}

/* ========================================================= */

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
            .in('estado', ['programada', 'confirmada']);

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
        .select('id, fecha, hora, paciente_id, estado, motivo, whatsapp_enviado')
        .eq('clinica_id', clinicaID)
        .in('estado', ['programada', 'confirmada', 'cancelada'])
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

    // Aviso de citas de mañana que aún no tienen WhatsApp enviado
    const pendientesManana = citasCloud.filter(c => esCitaManana(c.fecha) && !c.whatsapp_enviado && c.estado !== 'cancelada');
    if (pendientesManana.length > 0) {
        const banner = document.createElement("div");
        banner.style.cssText = "background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.35); border-radius:10px; padding:12px 14px; margin-bottom:14px; font-size:13px; color:#fbbf24; font-weight:600;";
        banner.innerHTML = `⚠️ ${t("whatsapp_pendiente_banner").replace("{n}", pendientesManana.length)}`;
        listaCitas.appendChild(banner);
    }

    const { data: pacientesData } = await supabaseClient
        .from('pacientes')
        .select('id, nombre, telefono')
        .eq('clinica_id', clinicaID);

    citasCloud.forEach((c) => {
        const paciente = pacientesData
            ? pacientesData.find(p => Number(p.id) === Number(c.paciente_id))
            : null;
        const nombrePaciente = paciente ? paciente.nombre : "Paciente no identificado";
        const hoy = esCitaHoy(c.fecha);
        const confirmada = c.estado === "confirmada";
        const cancelada = c.estado === "cancelada";

        const div = document.createElement("div");
        div.className = "appt-card";
        if (cancelada) {
            div.style.border = "2px solid #ef4444";
            div.style.background = "rgba(239,68,68,0.06)";
        }
        div.innerHTML = `
            <div class="appt-card-top">
                <div class="patient-identity">
                    <div class="patient-avatar" style="background:${colorAvatar(nombrePaciente)}20; color:${colorAvatar(nombrePaciente)}; border-color:${colorAvatar(nombrePaciente)}40;">
                        ${iniciales(nombrePaciente)}
                    </div>
                    <div>
                        <div class="patient-name">${nombrePaciente}</div>
                        <div style="display:flex; gap:6px; margin-top:2px; flex-wrap:wrap;">
                            ${hoy ? `<div class="appt-today-badge">${t("hoy") || "Hoy"}</div>` : ""}
                            ${confirmada ? `<div class="appt-today-badge" style="background:rgba(34,197,94,0.15); color:#22c55e; border-color:rgba(34,197,94,0.3);">${t("cita_confirmada_badge")}</div>` : ""}
                            ${cancelada ? `<div class="appt-today-badge" style="background:rgba(239,68,68,0.18); color:#ef4444; border-color:rgba(239,68,68,0.4); font-weight:bold;">${t("cita_cancelada_badge")}</div>` : ""}
                            ${!cancelada && c.whatsapp_enviado ? `<div class="appt-today-badge" style="background:rgba(37,211,102,0.15); color:#25d366; border-color:rgba(37,211,102,0.35);">${t("whatsapp_ya_enviado_badge")}</div>` : ""}
                            ${!cancelada && esCitaManana(c.fecha) && !c.whatsapp_enviado ? `<div class="appt-today-badge" style="background:rgba(245,158,11,0.15); color:#f59e0b; border-color:rgba(245,158,11,0.35);">${t("whatsapp_badge_pendiente")}</div>` : ""}
                        </div>
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
                ${!cancelada ? `
                <button type="button" class="btn-action" style="background:rgba(37,211,102,0.15); color:#25d366; border-color:rgba(37,211,102,0.35);" onclick="enviarWhatsAppRecordatorio('${c.id}', '${(paciente && paciente.telefono) || ''}', ${jsStringParaOnclick(nombrePaciente)}, '${c.fecha}', '${c.hora}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                    ${c.whatsapp_enviado ? t("whatsapp_reenviar_btn") : t("whatsapp_btn")}
                </button>` : ""}
                ${!cancelada ? `
                <button type="button" class="btn-action" onclick="editarCita('${c.id}', '${c.paciente_id}', '${c.fecha}', '${c.hora}', ${jsStringParaOnclick(c.motivo)})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                    ${t("editar_cita_btn") || "Editar"}
                </button>` : ""}
                <button type="button" class="btn-action btn-action-danger" onclick="eliminarCita('${c.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    ${cancelada ? t("eliminar_de_lista_btn") : (t("cancelar_cita_btn") || "Cancelar")}
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
        .select('id, fecha, hora, paciente_id, estado, motivo, whatsapp_enviado')
        .eq('clinica_id', clinicaID)
        .in('estado', ['programada', 'confirmada', 'cancelada'])
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
        .select('id, nombre, telefono')
        .eq('clinica_id', clinicaID);

    calPacientesMap = {};
    (pacientesData || []).forEach(p => { calPacientesMap[p.id] = { nombre: p.nombre, telefono: p.telefono }; });
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
            const nombre = (calPacientesMap[c.paciente_id] && calPacientesMap[c.paciente_id].nombre) || "?";
            const esCancelada = c.estado === "cancelada";
            const esConfirmada = c.estado === "confirmada";
            const estiloChip = esCancelada
                ? ' style="background:rgba(239,68,68,0.25); color:#fca5a5; border:1px solid rgba(239,68,68,0.5);"'
                : esConfirmada
                    ? ' style="background:rgba(34,197,94,0.2); color:#86efac; border:1px solid rgba(34,197,94,0.4);"'
                    : '';
            const icono = esCancelada ? "❌ " : esConfirmada ? "✅ " : "";
            chipsHtml += `<div class="calendar-appt-chip"${estiloChip}>${icono}${formatearHora(c.hora)} · ${nombre.split(" ")[0]}</div>`;
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
        const entradaPaciente = calPacientesMap[c.paciente_id];
        const nombre = (entradaPaciente && entradaPaciente.nombre) || "?";
        const telefonoPaciente = (entradaPaciente && entradaPaciente.telefono) || "";
        const confirmada = c.estado === "confirmada";
        const cancelada = c.estado === "cancelada";
        html += `
            <div class="appt-card" style="margin-bottom:10px; ${cancelada ? 'border:2px solid #ef4444; background:rgba(239,68,68,0.06);' : ''}">
                <div class="appt-card-top">
                    <div class="patient-identity">
                        <div class="patient-avatar" style="background:${colorAvatar(nombre)}20; color:${colorAvatar(nombre)}; border-color:${colorAvatar(nombre)}40;">
                            ${iniciales(nombre)}
                        </div>
                        <div>
                            <div class="patient-name">${nombre}</div>
                            <div style="display:flex; gap:6px; margin-top:2px; flex-wrap:wrap;">
                                ${confirmada ? `<div class="appt-today-badge" style="background:rgba(34,197,94,0.15); color:#22c55e; border-color:rgba(34,197,94,0.3);">${t("cita_confirmada_badge")}</div>` : ""}
                                ${cancelada ? `<div class="appt-today-badge" style="background:rgba(239,68,68,0.18); color:#ef4444; border-color:rgba(239,68,68,0.4); font-weight:bold;">${t("cita_cancelada_badge")}</div>` : ""}
                                ${!cancelada && c.whatsapp_enviado ? `<div class="appt-today-badge" style="background:rgba(37,211,102,0.15); color:#25d366; border-color:rgba(37,211,102,0.35);">${t("whatsapp_ya_enviado_badge")}</div>` : ""}
                                ${!cancelada && esCitaManana(c.fecha) && !c.whatsapp_enviado ? `<div class="appt-today-badge" style="background:rgba(245,158,11,0.15); color:#f59e0b; border-color:rgba(245,158,11,0.35);">${t("whatsapp_badge_pendiente")}</div>` : ""}
                            </div>
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
                    ${!cancelada ? `
                    <button type="button" class="btn-action" style="background:rgba(37,211,102,0.15); color:#25d366; border-color:rgba(37,211,102,0.35);" onclick="enviarWhatsAppRecordatorio('${c.id}', '${telefonoPaciente}', ${jsStringParaOnclick(nombre)}, '${c.fecha}', '${c.hora}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                        ${c.whatsapp_enviado ? t("whatsapp_reenviar_btn") : t("whatsapp_btn")}
                    </button>` : ""}
                    ${!cancelada ? `
                    <button type="button" class="btn-action" onclick="editarCita('${c.id}', '${c.paciente_id}', '${c.fecha}', '${c.hora}', ${jsStringParaOnclick(c.motivo)})">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                        ${t("editar_cita_btn") || "Editar"}
                    </button>` : ""}
                    <button type="button" class="btn-action btn-action-danger" onclick="eliminarCitaDesdeCalendario('${c.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                        ${cancelada ? t("eliminar_de_lista_btn") : (t("cancelar_cita_btn") || "Cancelar")}
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
        generarChipsHora();
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

    // Verificación final de seguridad (por si algo cambió mientras la secretaria llenaba el formulario)
    try {
        const { data: choque, error: errorChoque } = await supabaseClient
            .from('citas')
            .select('id, motivo, paciente_id')
            .eq('clinica_id', clinicaID)
            .eq('fecha', fecha)
            .eq('hora', hora)
            .in('estado', ['programada', 'confirmada']);

        if (!errorChoque && choque && choque.length > 0) {
            const otraCita = choque.find(c => String(c.id) !== String(editandoCitaId));
            if (otraCita) {
                const { data: pacData } = await supabaseClient
                    .from('pacientes')
                    .select('nombre')
                    .eq('id', otraCita.paciente_id)
                    .maybeSingle();
                const nombreOcupante = pacData ? pacData.nombre : "otro paciente";
                const continuar = confirm(
                    `⚠️ Ya existe una cita a las ${formatearHora(hora)} el ${fecha} con ${nombreOcupante}${otraCita.motivo ? ` (${otraCita.motivo})` : ""}.\n\n¿Deseas agendar de todas formas a esta misma hora?`
                );
                if (!continuar) return;
            }
        }
    } catch (e) {
        console.warn("No se pudo verificar choques de horario:", e);
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
        const customInput = document.getElementById("horaCustom");
        if (customInput) customInput.value = "";
        citasDelDiaSeleccionado = [];
        mapaPacientesDia = {};
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
    if (inputMotivo) inputMotivo.value = motivo || "";
    cambiarVista('nuevo');
    cargarResumenDia().then(() => {
        setTimeout(() => marcarHoraSeleccionada(hora), 50);
    });
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

        generarChipsHora();
        if (!editandoCitaId) {
            document.getElementById("hora").value = "";
            const customInput = document.getElementById("horaCustom");
            if (customInput) customInput.value = "";
            citasDelDiaSeleccionado = [];
            mapaPacientesDia = {};
            const panel = document.getElementById("panelResumenDia");
            if (panel) panel.innerHTML = "";
        }
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
    await cargarCodigoTelClinica();

    // Cada vez que cambie la fecha en el formulario, recargamos
    // el resumen del día y los colores de los horarios ocupados.
    if (inputFecha) {
        inputFecha.addEventListener("change", cargarResumenDia);
    }

    if (modo === 'nuevo') {
        cambiarVista('nuevo');
    } else if (modo === 'calendario') {
        cambiarVista('calendario');
    } else {
        cambiarVista('ver');
    }
}

inicializarVistaCitas();
