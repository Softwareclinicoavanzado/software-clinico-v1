/* =============================================
    AGENDAR CITA (PÚBLICO, SIN LOGIN) | ClinicOS
    Página pública para que cualquier paciente solicite una cita.
    La cita queda en estado "solicitud" — NO se agenda directo,
    la clínica debe aprobarla desde su panel.

    Todos los campos son obligatorios (nombre, teléfono, correo,
    fecha, hora y razón de la cita).
============================================= */

const params = new URLSearchParams(window.location.search);
const clinicaIdPublico = params.get("clinica");

let horaSeleccionadaPublico = "";
let horasOcupadasPublico = [];
let codigoTelPaisPublico = "502"; // valor por defecto mientras carga desde la base de datos
let idiomaPublicoActual = "es";

const PAISES_TEL_PUBLICO = [
    { nombre: "Guatemala", bandera: "🇬🇹", codigo: "502" },
    { nombre: "México", bandera: "🇲🇽", codigo: "52" },
    { nombre: "El Salvador", bandera: "🇸🇻", codigo: "503" },
    { nombre: "Honduras", bandera: "🇭🇳", codigo: "504" },
    { nombre: "Nicaragua", bandera: "🇳🇮", codigo: "505" },
    { nombre: "Costa Rica", bandera: "🇨🇷", codigo: "506" },
    { nombre: "Panamá", bandera: "🇵🇦", codigo: "507" },
    { nombre: "Colombia", bandera: "🇨🇴", codigo: "57" },
    { nombre: "Ecuador", bandera: "🇪🇨", codigo: "593" },
    { nombre: "Perú", bandera: "🇵🇪", codigo: "51" },
    { nombre: "Bolivia", bandera: "🇧🇴", codigo: "591" },
    { nombre: "Chile", bandera: "🇨🇱", codigo: "56" },
    { nombre: "Argentina", bandera: "🇦🇷", codigo: "54" },
    { nombre: "Paraguay", bandera: "🇵🇾", codigo: "595" },
    { nombre: "Uruguay", bandera: "🇺🇾", codigo: "598" },
    { nombre: "Venezuela", bandera: "🇻🇪", codigo: "58" },
    { nombre: "República Dominicana", bandera: "🇩🇴", codigo: "1" },
    { nombre: "Puerto Rico", bandera: "🇵🇷", codigo: "1" },
    { nombre: "España", bandera: "🇪🇸", codigo: "34" },
    { nombre: "Estados Unidos", bandera: "🇺🇸", codigo: "1" },
    { nombre: "Francia", bandera: "🇫🇷", codigo: "33" },
    { nombre: "Canadá", bandera: "🇨🇦", codigo: "1" },
];

/* =========================================================
   Textos propios de esta página (es / en / fr): etiquetas sin
   "(opcional)", leyenda y avisos de cada campo.
========================================================= */
const TXT_PUBLICO = {
    es: {
        email_label: "Correo electrónico",
        motivo_label: "Razón de la cita",
        obligatorios: "Los campos marcados con * son obligatorios.",
        err_nombre: "Escribe tu nombre completo.",
        err_telefono: "Escribe un teléfono válido (solo números).",
        err_email: "Escribe tu correo electrónico.",
        err_email_invalido: "Escribe un correo válido, por ejemplo nombre@correo.com.",
        err_fecha: "Elige una fecha para tu cita.",
        err_hora: "Elige una hora disponible.",
        err_motivo: "Cuéntanos el motivo de tu cita (mínimo 3 letras).",
        hora_pasada: "Esta hora ya pasó",
        clinica_no_disponible: "Esta clínica no está recibiendo solicitudes por ahora. Contáctala directamente."
    },
    en: {
        email_label: "Email",
        motivo_label: "Reason for the appointment",
        obligatorios: "Fields marked with * are required.",
        err_nombre: "Enter your full name.",
        err_telefono: "Enter a valid phone number (digits only).",
        err_email: "Enter your email address.",
        err_email_invalido: "Enter a valid email, for example name@email.com.",
        err_fecha: "Choose a date for your appointment.",
        err_hora: "Choose an available time.",
        err_motivo: "Tell us the reason for your appointment (at least 3 letters).",
        hora_pasada: "This time has already passed",
        clinica_no_disponible: "This clinic is not accepting requests right now. Please contact them directly."
    },
    fr: {
        email_label: "E-mail",
        motivo_label: "Motif du rendez-vous",
        obligatorios: "Les champs marqués d'un * sont obligatoires.",
        err_nombre: "Saisissez votre nom complet.",
        err_telefono: "Saisissez un numéro de téléphone valide (chiffres uniquement).",
        err_email: "Saisissez votre adresse e-mail.",
        err_email_invalido: "Saisissez un e-mail valide, par exemple nom@email.com.",
        err_fecha: "Choisissez une date pour votre rendez-vous.",
        err_hora: "Choisissez un horaire disponible.",
        err_motivo: "Indiquez le motif de votre rendez-vous (au moins 3 lettres).",
        hora_pasada: "Cet horaire est déjà passé",
        clinica_no_disponible: "Cette clinique n'accepte pas de demandes pour le moment. Veuillez la contacter directement."
    }
};

function tp(clave) {
    const tabla = TXT_PUBLICO[idiomaPublicoActual] || TXT_PUBLICO.es;
    return tabla[clave] || TXT_PUBLICO.es[clave] || clave;
}

function fechaLocalPublico(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dia}`;
}

function poblarSelectCodigoPaisPublico() {
    const select = document.getElementById("pubCodigoPais");
    if (!select) return;
    select.innerHTML = "";
    PAISES_TEL_PUBLICO.forEach((p) => {
        const op = document.createElement("option");
        op.value = p.codigo;
        op.textContent = `${p.bandera} +${p.codigo}`;
        select.appendChild(op);
    });
}

async function cargarCodigoTelPublico() {
    try {
        const { data, error } = await supabaseClient.rpc("clinica_codigo_pais_publico", {
            p_clinica_id: clinicaIdPublico,
        });
        if (!error && data) {
            codigoTelPaisPublico = data;
        }
    } catch (e) {
        console.warn("No se pudo cargar el código de país de la clínica:", e);
    }

    const select = document.getElementById("pubCodigoPais");
    if (select) select.value = codigoTelPaisPublico;
}

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
const BANDERAS_PUBLICO = { es: "🇲🇽", en: "🇺🇸", fr: "🇫🇷" };

function toggleLangDropdown() {
    const dropdown = document.getElementById("langDropdown");
    if (dropdown) dropdown.classList.toggle("open");
}

function actualizarBotonIdiomaPublico(lang) {
    const flagElem = document.getElementById("langFlagActual");
    const textoElem = document.getElementById("langBtnTexto");
    if (flagElem) flagElem.innerText = BANDERAS_PUBLICO[lang] || "🇲🇽";
    if (textoElem) textoElem.innerText = lang.toUpperCase();
}

function seleccionarIdiomaPublico(lang) {
    idiomaPublicoActual = lang;
    try { localStorage.setItem("lang", lang); } catch (e) { /* modo privado */ }
    changeLanguage(lang);
    aplicarTextosPublico();
    limpiarErroresPublico(); // los avisos viejos estaban en el otro idioma
    const dropdown = document.getElementById("langDropdown");
    if (dropdown) dropdown.classList.remove("open");
    actualizarBotonIdiomaPublico(lang);
    if (horaSeleccionadaPublico || document.getElementById("pubFecha").value) {
        generarChipsHorasPublico();
    }
}

/* Etiqueta con asterisco rojo si el campo es obligatorio */
function ponerEtiquetaPublico(id, texto, obligatorio) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = texto;
    if (obligatorio) {
        const estrella = document.createElement("span");
        estrella.className = "req";
        estrella.setAttribute("aria-hidden", "true");
        estrella.textContent = " *";
        el.appendChild(estrella);
    }
}

function ponerTextoPublico(id, texto) {
    const el = document.getElementById(id);
    if (el) el.innerText = texto;
}

function aplicarTextosPublico() {
    ponerTextoPublico("txtLinkInvalido", "⚠️ " + t("publico_link_invalido"));
    ponerTextoPublico("txtTitulo", t("publico_titulo"));
    ponerTextoPublico("txtSubtitulo", t("publico_subtitulo"));
    ponerTextoPublico("txtObligatorios", tp("obligatorios"));
    ponerEtiquetaPublico("lblNombre", t("nombre_completo"), true);
    ponerEtiquetaPublico("lblTelefono", t("telefono_label"), true);
    ponerEtiquetaPublico("lblEmail", tp("email_label"), true);
    ponerEtiquetaPublico("lblFecha", t("fecha_label"), true);
    ponerEtiquetaPublico("lblMotivo", tp("motivo_label"), true);
    const ph = function (id, texto) { const el = document.getElementById(id); if (el) el.placeholder = texto; };
    ph("pubNombre", t("publico_nombre_placeholder"));
    ph("pubTelefono", t("publico_telefono_placeholder"));
    ph("pubMotivo", t("motivo_placeholder"));
    ponerTextoPublico("txtBtnEnviar", t("publico_enviar_btn"));
    ponerTextoPublico("txtExitoTitulo", t("publico_exito_titulo"));
    ponerTextoPublico("txtExitoTexto", t("publico_exito_texto"));
}

/* =========================================================
   AVISOS DE ERROR POR CAMPO
========================================================= */
function limpiarErroresPublico() {
    document.querySelectorAll(".pub-error").forEach(function (e) { e.remove(); });
    document.querySelectorAll(".invalid").forEach(function (e) { e.classList.remove("invalid"); });
}

function limpiarErrorCampoPublico(idCampo) {
    const aviso = document.getElementById("err-" + idCampo);
    if (aviso) aviso.remove();
    const campo = document.getElementById(idCampo);
    if (campo) campo.classList.remove("invalid");
}

function ponerErrorPublico(idCampo, mensaje) {
    const campo = document.getElementById(idCampo);
    if (!campo) return null;
    limpiarErrorCampoPublico(idCampo);
    const aviso = document.createElement("div");
    aviso.className = "pub-error";
    aviso.id = "err-" + idCampo;
    aviso.setAttribute("role", "alert");
    aviso.textContent = mensaje;
    const ancla = idCampo === "pubTelefono" ? campo.parentElement : campo;
    ancla.insertAdjacentElement("afterend", aviso);
    campo.classList.add("invalid");
    return campo;
}

function validarFormularioPublico() {
    limpiarErroresPublico();

    const nombre = document.getElementById("pubNombre").value.trim();
    const telefono = document.getElementById("pubTelefono").value.trim();
    const email = document.getElementById("pubEmail").value.trim();
    const fecha = document.getElementById("pubFecha").value;
    const motivo = document.getElementById("pubMotivo").value.trim();

    const errores = [];
    if (nombre.length < 2) errores.push(["pubNombre", tp("err_nombre")]);
    if (telefono.replace(/\D/g, "").length < 6) errores.push(["pubTelefono", tp("err_telefono")]);
    if (!email) errores.push(["pubEmail", tp("err_email")]);
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errores.push(["pubEmail", tp("err_email_invalido")]);
    if (!fecha || fecha < fechaLocalPublico(new Date())) errores.push(["pubFecha", tp("err_fecha")]);
    else if (!horaSeleccionadaPublico) errores.push(["pubPanelHoras", tp("err_hora")]);
    if (motivo.length < 3) errores.push(["pubMotivo", tp("err_motivo")]);

    let primero = null;
    errores.forEach(function (par) {
        const campo = ponerErrorPublico(par[0], par[1]);
        if (!primero) primero = campo;
    });

    if (primero) {
        if (primero.scrollIntoView) primero.scrollIntoView({ behavior: "smooth", block: "center" });
        if (primero.focus && primero.tagName !== "DIV") primero.focus();
    }
    return errores.length === 0;
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

    panel.innerHTML = `<p style="font-size:12px; color:var(--text-muted);">⏳ ${t("publico_cargando_horarios")}...</p>`;

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

    // Si la fecha es hoy, las horas que ya pasaron (o están por pasar) no se pueden elegir
    const ahora = new Date();
    const esHoy = fecha === fechaLocalPublico(ahora);
    const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

    let html = `<label style="font-size:13px; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:8px;">${t("hora_label")} <span class="req" aria-hidden="true">*</span></label>`;
    html += `<div style="display:flex; flex-wrap:wrap; gap:8px;">`;

    let hayDisponibles = false;

    periodos.forEach((periodo) => {
        for (let h = periodo.inicio; h < periodo.fin; h++) {
            [0, 30].forEach((min) => {
                const horaStr = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
                const ocupado = horasOcupadasPublico.includes(horaStr);
                const pasada = esHoy && (h * 60 + min) <= minutosAhora + 15;
                const seleccionado = horaStr === horaSeleccionadaPublico;

                if (ocupado) {
                    html += `<div class="time-chip" style="background:rgba(239,68,68,0.15); color:#fca5a5; border:1px solid rgba(239,68,68,0.4); cursor:not-allowed; opacity:0.6;">${formatearHoraPublico(horaStr)}</div>`;
                } else if (pasada) {
                    html += `<div class="time-chip" title="${tp("hora_pasada")}" style="background:rgba(148,163,184,0.1); color:#64748b; border:1px solid rgba(148,163,184,0.2); cursor:not-allowed; opacity:0.5;">${formatearHoraPublico(horaStr)}</div>`;
                } else {
                    hayDisponibles = true;
                    html += `<div class="time-chip${seleccionado ? " selected" : ""}" role="button" tabindex="0" onclick="seleccionarHoraPublico('${horaStr}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();seleccionarHoraPublico('${horaStr}');}">${formatearHoraPublico(horaStr)}</div>`;
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
    limpiarErrorCampoPublico("pubPanelHoras");
    generarChipsHorasPublico();
}

/* =========================================================
   ENVÍO DE LA SOLICITUD
========================================================= */
function mostrarClinicaNoDisponiblePublico() {
    document.getElementById("vistaFormulario").style.display = "none";
    document.getElementById("txtLinkInvalido").innerText = "⚠️ " + tp("clinica_no_disponible");
    document.getElementById("vistaLinkInvalido").style.display = "block";
}

async function enviarSolicitudPublico() {
    if (!validarFormularioPublico()) return;

    const nombre = document.getElementById("pubNombre").value.trim();
    const telefono = document.getElementById("pubTelefono").value.trim();
    const email = document.getElementById("pubEmail").value.trim();
    const fecha = document.getElementById("pubFecha").value;
    const motivo = document.getElementById("pubMotivo").value.trim();

    // Usamos el código de país que el paciente eligió en el selector
    // (por defecto viene precargado con el país de la clínica, pero
    // el paciente puede cambiarlo si es de otro país).
    const codigoPaisElegido = document.getElementById("pubCodigoPais").value || codigoTelPaisPublico;
    let telefonoCompleto = telefono.replace(/[^\d]/g, "");
    if (!telefonoCompleto.startsWith(codigoPaisElegido)) {
        telefonoCompleto = codigoPaisElegido + telefonoCompleto;
    }

    const btn = document.getElementById("btnEnviarSolicitud");
    const txtBtn = document.getElementById("txtBtnEnviar");
    btn.disabled = true;
    txtBtn.innerText = t("publico_enviando");

    try {
        const { error } = await supabaseClient.rpc("crear_solicitud_publico", {
            p_clinica_id: clinicaIdPublico,
            p_nombre: nombre,
            p_telefono: telefonoCompleto,
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
        const mensaje = String((e && e.message) || "");

        btn.disabled = false;
        txtBtn.innerText = t("publico_enviar_btn");

        if (/no est[aá] disponible/i.test(mensaje)) {
            mostrarClinicaNoDisponiblePublico();
        } else if (/motivo/i.test(mensaje)) {
            ponerErrorPublico("pubMotivo", tp("err_motivo"));
        } else if (/fecha u hora/i.test(mensaje)) {
            ponerErrorPublico("pubPanelHoras", tp("err_hora"));
        } else {
            alert(t("publico_error"));
        }
    }
}

/* =========================================================
   INICIALIZACIÓN
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
    // El link de "Elegir nuevo horario" en confirmar.html llega con ?lang=
    // para respetar el idioma que el paciente ya había elegido ahí. Si no
    // viene (o no es válido), se usa el idioma guardado, y si tampoco hay
    // ninguno, español por defecto.
    const idiomasValidos = ["es", "en", "fr"];
    const langParam = params.get("lang");
    const savedLang = (langParam && idiomasValidos.includes(langParam))
        ? langParam
        : (localStorage.getItem("lang") || "es");
    idiomaPublicoActual = idiomasValidos.includes(savedLang) ? savedLang : "es";
    if (typeof changeLanguage === "function") changeLanguage(idiomaPublicoActual);
    actualizarBotonIdiomaPublico(idiomaPublicoActual);

    // Cierra el menú de idioma al tocar fuera
    document.addEventListener("click", (e) => {
        const selector = document.querySelector(".lang-switcher");
        const dropdown = document.getElementById("langDropdown");
        if (selector && dropdown && !selector.contains(e.target)) dropdown.classList.remove("open");
    });

    if (!clinicaIdPublico) {
        document.getElementById("vistaLinkInvalido").style.display = "block";
        aplicarTextosPublico();
        return;
    }

    document.getElementById("vistaFormulario").style.display = "block";
    aplicarTextosPublico();
    poblarSelectCodigoPaisPublico();
    cargarCodigoTelPublico();

    // Fechas permitidas: desde hoy (hora local, no UTC) hasta 6 meses
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(limite.getDate() + 180);
    const inputFecha = document.getElementById("pubFecha");
    inputFecha.min = fechaLocalPublico(hoy);
    inputFecha.max = fechaLocalPublico(limite);
    inputFecha.addEventListener("change", () => {
        limpiarErrorCampoPublico("pubFecha");
        limpiarErrorCampoPublico("pubPanelHoras");
        cargarHorasOcupadasPublico();
    });

    // El aviso de cada campo desaparece cuando la persona lo corrige
    ["pubNombre", "pubTelefono", "pubEmail", "pubMotivo"].forEach((id) => {
        const campo = document.getElementById(id);
        if (campo) campo.addEventListener("input", () => limpiarErrorCampoPublico(id));
    });
});
