/* =============================================
    AGENDAR CITA (PÚBLICO, SIN LOGIN) | ClinicOS
    Página pública para que cualquier paciente solicite una cita.
    La cita queda en estado "solicitud" — NO se agenda directo,
    la clínica debe aprobarla desde su panel.
============================================= */

const params = new URLSearchParams(window.location.search);
const clinicaIdPublico = params.get("clinica");

let horaSeleccionadaPublico = "";
let horasOcupadasPublico = [];

function formatearHoraPublico(horaStr) {
    if (!horaStr) return "";
    let [h, m] = horaStr.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

/* =========================================================
   Selector de idioma (esta página no carga layout.js, así
   que maneja su propio dropdown de idioma)
========================================================= */
function toggleLangDropdown() {
    const dropdown = document.getElementById("langDropdown");
    if (dropdown) dropdown.classList.toggle("open");
}

function seleccionarIdiomaPublico(lang) {
    changeLanguage(lang);
    aplicarTextosPublico();
    const dropdown = document.getElementById("langDropdown");
    if (dropdown) dropdown.classList.remove("open");
    const banderas = { es: "🇲🇽", en: "🇺🇸", fr: "🇫🇷" };
    const flagElem = document.getElementById("langFlagActual");
    const textoElem = document.getElementById("langBtnTexto");
    if (flagElem) flagElem.innerText = banderas[lang] || "🇲🇽";
    if (textoElem) textoElem.innerText = lang.toUpperCase();
    if (horaSeleccionadaPublico || document.getElementById("pubFecha").value) {
        generarChipsHorasPublico();
    }
}

function aplicarTextosPublico() {
    document.getElementById("txtLinkInvalido").innerText = "⚠️ " + t("publico_link_invalido");
    document.getElementById("txtTitulo").innerText = t("publico_titulo");
    document.getElementById("txtSubtitulo").innerText = t("publico_subtitulo");
    document.getElementById("lblNombre").innerText = t("nombre_completo");
    document.getElementById("lblTelefono").innerText = t("telefono_label");
    document.getElementById("lblEmail").innerText = t("publico_email_label");
    document.getElementById("lblFecha").innerText = t("fecha_label");
    document.getElementById("lblMotivo").innerText = t("motivo_label");
    document.getElementById("pubNombre").placeholder = t("publico_nombre_placeholder");
    document.getElementById("pubTelefono").placeholder = t("publico_telefono_placeholder");
    document.getElementById("pubMotivo").placeholder = t("motivo_placeholder");
    document.getElementById("txtBtnEnviar").innerText = t("publico_enviar_btn");
    document.getElementById("txtExitoTitulo").innerText = t("publico_exito_titulo");
    document.getElementById("txtExitoTexto").innerText = t("publico_exito_texto");
}

/* =========================================================
   HORARIOS: consulta pública de horas ocupadas y chips
========================================================= */
async function cargarHorasOcupadasPublico() {
    const fecha = document.getElementById("pubFecha").value;
    const panel = document.getElementById("pubPanelHoras");
    if (!fecha) {
        panel.innerHTML = "";
        return;
    }

    panel.innerHTML = `<p style="font-size:12px; color:var(--text-muted);">⏳ ${t("publico_elige_fecha")}...</p>`;

    try {
        const { data, error } = await supabaseClient.rpc("horas_ocupadas_publico", {
            p_clinica_id: clinicaIdPublico,
            p_fecha: fecha,
        });
        if (error) throw error;
        horasOcupadasPublico = (data || []).map((r) => r.hora);
    } catch (e) {
        console.warn("No se pudieron cargar los horarios:", e);
        horasOcupadasPublico = [];
    }

    horaSeleccionadaPublico = "";
    generarChipsHorasPublico();
}

function generarChipsHorasPublico() {
    const panel = document.getElementById("pubPanelHoras");
    if (!panel) return;
    const fecha = document.getElementById("pubFecha").value;
    if (!fecha) {
        panel.innerHTML = "";
        return;
    }

    const periodos = [
        { etiqueta: t("periodo_manana") || "Mañana", inicio: 6, fin: 12 },
        { etiqueta: t("periodo_tarde") || "Tarde", inicio: 12, fin: 18 },
        { etiqueta: t("periodo_noche") || "Noche", inicio: 18, fin: 22 },
    ];

    let html = `<label style="font-size:13px; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:8px;">${t("hora_label")}</label>`;
    html += `<div style="display:flex; flex-wrap:wrap; gap:8px;">`;

    let hayDisponibles = false;

    periodos.forEach((periodo) => {
        for (let h = periodo.inicio; h < periodo.fin; h++) {
            [0, 30].forEach((min) => {
                const horaStr = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
                const ocupado = horasOcupadasPublico.includes(horaStr);
                const seleccionado = horaStr === horaSeleccionadaPublico;

                if (!ocupado) hayDisponibles = true;

                if (ocupado) {
                    html += `<div class="time-chip" style="background:rgba(239,68,68,0.15); color:#fca5a5; border:1px solid rgba(239,68,68,0.4); cursor:not-allowed; opacity:0.6;">${formatearHoraPublico(horaStr)}</div>`;
                } else {
                    html += `<div class="time-chip${seleccionado ? " selected" : ""}" onclick="seleccionarHoraPublico('${horaStr}')">${formatearHoraPublico(horaStr)}</div>`;
                }
            });
        }
    });

    html += `</div>`;

    if (!hayDisponibles) {
        html += `<p style="font-size:12px; color:#f59e0b; margin-top:10px;">⚠️ ${t("publico_sin_horarios")}</p>`;
    }

    panel.innerHTML = html;
}

function seleccionarHoraPublico(horaStr) {
    horaSeleccionadaPublico = horaStr;
    generarChipsHorasPublico();
}

/* =========================================================
   ENVÍO DE LA SOLICITUD
========================================================= */
async function enviarSolicitudPublico() {
    const nombre = document.getElementById("pubNombre").value.trim();
    const telefono = document.getElementById("pubTelefono").value.trim();
    const email = document.getElementById("pubEmail").value.trim();
    const fecha = document.getElementById("pubFecha").value;
    const motivo = document.getElementById("pubMotivo").value.trim();

    if (!nombre || !telefono || !fecha || !horaSeleccionadaPublico) {
        alert(t("publico_campos_requeridos"));
        return;
    }

    const btn = document.getElementById("btnEnviarSolicitud");
    const txtBtn = document.getElementById("txtBtnEnviar");
    btn.disabled = true;
    txtBtn.innerText = t("publico_enviando");

    try {
        const { error } = await supabaseClient.rpc("crear_solicitud_publico", {
            p_clinica_id: clinicaIdPublico,
            p_nombre: nombre,
            p_telefono: telefono,
            p_email: email,
            p_fecha: fecha,
            p_hora: horaSeleccionadaPublico,
            p_motivo: motivo,
        });

        if (error) throw error;

        document.getElementById("vistaFormulario").style.display = "none";
        document.getElementById("vistaExito").style.display = "block";
    } catch (e) {
        console.error("Error al enviar solicitud pública:", e);
        alert(t("publico_error"));
        btn.disabled = false;
        txtBtn.innerText = t("publico_enviar_btn");
    }
}

/* =========================================================
   INICIALIZACIÓN
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
    const savedLang = localStorage.getItem("lang") || "es";
    if (typeof changeLanguage === "function") changeLanguage(savedLang);

    if (!clinicaIdPublico) {
        document.getElementById("vistaLinkInvalido").style.display = "block";
        aplicarTextosPublico();
        return;
    }

    document.getElementById("vistaFormulario").style.display = "block";
    aplicarTextosPublico();

    const hoyStr = new Date().toISOString().split("T")[0];
    const inputFecha = document.getElementById("pubFecha");
    inputFecha.min = hoyStr;
    inputFecha.addEventListener("change", cargarHorasOcupadasPublico);
});
