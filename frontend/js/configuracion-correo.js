/* =============================================
    CONFIGURACIÓN DE CORREO | ClinicOS
    Cada clínica guarda su propio Gmail + contraseña de aplicación
    para enviar recordatorios de citas a sus pacientes.
============================================= */
const clinicaID = localStorage.getItem("clinicaID");
const rolActual = localStorage.getItem("rol");

if (!clinicaID) {
    window.location.href = "index.html";
}
if (rolActual !== "admin") {
    alert("Acceso denegado: solo el administrador puede configurar los recordatorios.");
    window.location.href = "dashboard.html";
}

let configuracionExistente = null;

/* =========================================================
   PAÍS DE LA CLÍNICA → zona horaria + idioma + código telefónico
   El código telefónico (sin el "+") se usa para armar los links
   de WhatsApp automáticamente sin que el usuario tenga que escribirlo.
========================================================= */
const PAISES = [
    { nombre: "Guatemala",              zona: "America/Guatemala",              idioma: "es", codigoTel: "502" },
    { nombre: "México",                 zona: "America/Mexico_City",            idioma: "es", codigoTel: "52" },
    { nombre: "El Salvador",            zona: "America/El_Salvador",            idioma: "es", codigoTel: "503" },
    { nombre: "Honduras",               zona: "America/Tegucigalpa",            idioma: "es", codigoTel: "504" },
    { nombre: "Nicaragua",              zona: "America/Managua",                idioma: "es", codigoTel: "505" },
    { nombre: "Costa Rica",             zona: "America/Costa_Rica",             idioma: "es", codigoTel: "506" },
    { nombre: "Panamá",                 zona: "America/Panama",                 idioma: "es", codigoTel: "507" },
    { nombre: "Colombia",               zona: "America/Bogota",                 idioma: "es", codigoTel: "57" },
    { nombre: "Ecuador",                zona: "America/Guayaquil",              idioma: "es", codigoTel: "593" },
    { nombre: "Perú",                   zona: "America/Lima",                   idioma: "es", codigoTel: "51" },
    { nombre: "Bolivia",                zona: "America/La_Paz",                 idioma: "es", codigoTel: "591" },
    { nombre: "Chile",                  zona: "America/Santiago",               idioma: "es", codigoTel: "56" },
    { nombre: "Argentina",              zona: "America/Argentina/Buenos_Aires", idioma: "es", codigoTel: "54" },
    { nombre: "Paraguay",               zona: "America/Asuncion",               idioma: "es", codigoTel: "595" },
    { nombre: "Uruguay",                zona: "America/Montevideo",             idioma: "es", codigoTel: "598" },
    { nombre: "Venezuela",              zona: "America/Caracas",                idioma: "es", codigoTel: "58" },
    { nombre: "República Dominicana",   zona: "America/Santo_Domingo",          idioma: "es", codigoTel: "1" },
    { nombre: "Puerto Rico",            zona: "America/Puerto_Rico",            idioma: "es", codigoTel: "1" },
    { nombre: "España",                 zona: "Europe/Madrid",                  idioma: "es", codigoTel: "34" },
    { nombre: "Estados Unidos (Este)",  zona: "America/New_York",               idioma: "en", codigoTel: "1" },
    { nombre: "Estados Unidos (Centro)",zona: "America/Chicago",                idioma: "en", codigoTel: "1" },
    { nombre: "Estados Unidos (Oeste)", zona: "America/Los_Angeles",            idioma: "en", codigoTel: "1" },
    { nombre: "Francia",                zona: "Europe/Paris",                   idioma: "fr", codigoTel: "33" },
    { nombre: "Canadá (Quebec)",        zona: "America/Toronto",                idioma: "fr", codigoTel: "1" },
];

function poblarSelectPaises() {
    const select = document.getElementById("paisClinica");
    if (!select) return;
    select.innerHTML = "";
    PAISES.forEach((p, i) => {
        const op = document.createElement("option");
        op.value = String(i);
        op.textContent = p.nombre;
        select.appendChild(op);
    });
}

async function cargarPaisClinica() {
    const select = document.getElementById("paisClinica");
    if (!select) return;

    try {
        const { data, error } = await supabaseClient
            .from('clinicas')
            .select('zona_horaria, idioma, codigo_pais')
            .eq('id', clinicaID)
            .maybeSingle();

        if (error) throw error;

        if (data) {
            // Preferimos hacer match exacto con el código telefónico guardado
            // (así distinguimos entre países que comparten idioma/zona parecida).
            let idx = PAISES.findIndex(p => p.zona === data.zona_horaria && p.idioma === data.idioma && p.codigoTel === data.codigo_pais);
            if (idx === -1) {
                idx = PAISES.findIndex(p => p.zona === data.zona_horaria && p.idioma === data.idioma);
            }
            if (idx !== -1) select.value = String(idx);
        }
    } catch (e) {
        console.warn("No se pudo cargar el país de la clínica:", e);
    }
}

async function guardarPaisClinica() {
    const select = document.getElementById("paisClinica");
    if (!select) return;

    const pais = PAISES[parseInt(select.value, 10)];
    if (!pais) return;

    try {
        const { error } = await supabaseClient
            .from('clinicas')
            .update({ zona_horaria: pais.zona, idioma: pais.idioma, codigo_pais: pais.codigoTel })
            .eq('id', clinicaID);

        if (error) throw error;

        if (typeof registrarAuditoria === "function") {
            registrarAuditoria("editar", "clinica_pais", pais.nombre);
        }

        alert(`✅ País actualizado a ${pais.nombre}. Los recordatorios y los mensajes de WhatsApp ahora usarán su horario, idioma y código telefónico correctos.`);
    } catch (e) {
        console.error("Error al guardar país:", e);
        alert("Error: " + e.message);
    }
}

/* ========================================================= */

function toggleMostrarPassword() {
    const input = document.getElementById("gmailAppPassword");
    const btn = document.getElementById("btnTogglePw");
    if (!input) return;
    const mostrar = input.type === "password";
    input.type = mostrar ? "text" : "password";
    if (btn) btn.classList.toggle("active", mostrar);
}

function mostrarBanner(tipo, mensaje) {
    const banner = document.getElementById("emailStatusBanner");
    if (!banner) return;
    banner.className = `email-status-banner email-status-${tipo}`;
    banner.style.display = "flex";
    banner.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${tipo === "success"
                ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
                : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
        </svg>
        <span>${mensaje}</span>
    `;
}

async function cargarConfiguracion() {
    try {
        const { data, error } = await supabaseClient
            .from('configuracion_correo')
            .select('*')
            .eq('clinica_id', clinicaID)
            .maybeSingle();

        if (error) throw error;

        if (data) {
            configuracionExistente = data;
            document.getElementById("gmailEmail").value = data.gmail_email || "";
            document.getElementById("nombreRemitente").value = data.nombre_remitente || "";
            const inputNotif = document.getElementById("correoNotificaciones");
            if (inputNotif) inputNotif.value = data.correo_notificaciones || "";
            document.getElementById("gmailAppPassword").placeholder = t("config_correo_password_guardada") || "•••• •••• •••• •••• (guardada — deja en blanco para no cambiarla)";
            const btnPrueba = document.getElementById("btnPrueba");
            if (btnPrueba) btnPrueba.disabled = false;
            mostrarBanner("success", `${t("config_correo_activo_desde") || "Recordatorios activos desde"}: ${data.gmail_email}`);
        }
    } catch (e) {
        console.warn("No se pudo cargar la configuración de correo:", e);
    }
}

async function guardarConfiguracionCorreo() {
    const gmailEmail = document.getElementById("gmailEmail").value.trim();
    const gmailAppPassword = document.getElementById("gmailAppPassword").value.trim();
    const nombreRemitente = document.getElementById("nombreRemitente").value.trim();

    if (!gmailEmail) {
        alert(t("config_correo_error_email") || "Ingresa el correo de Gmail.");
        return;
    }
    if (!configuracionExistente && !gmailAppPassword) {
        alert(t("config_correo_error_password") || "Ingresa la contraseña de aplicación.");
        return;
    }

    const datos = {
        clinica_id: clinicaID,
        gmail_email: gmailEmail,
        nombre_remitente: nombreRemitente || null,
        actualizado: new Date().toISOString()
    };

    if (gmailAppPassword) {
        datos.gmail_app_password = gmailAppPassword;
    }

    try {
        let error;
        if (configuracionExistente) {
            ({ error } = await supabaseClient
                .from('configuracion_correo')
                .update(datos)
                .eq('clinica_id', clinicaID));
        } else {
            if (!gmailAppPassword) {
                alert(t("config_correo_error_password") || "Ingresa la contraseña de aplicación.");
                return;
            }
            ({ error } = await supabaseClient
                .from('configuracion_correo')
                .insert([datos]));
        }

        if (error) throw error;

        if (typeof registrarAuditoria === "function") {
            registrarAuditoria(configuracionExistente ? "editar" : "crear", "configuracion_correo", gmailEmail);
        }

        alert(t("config_correo_guardado_exito") || "✅ Configuración guardada con éxito.");
        document.getElementById("gmailAppPassword").value = "";
        await cargarConfiguracion();
    } catch (e) {
        console.error("Error al guardar configuración de correo:", e);
        alert("Error: " + e.message);
    }
}

async function enviarCorreoPrueba() {
    const btnPrueba = document.getElementById("btnPrueba");
    if (btnPrueba) {
        btnPrueba.disabled = true;
        btnPrueba.innerHTML = `<span>${t("config_correo_enviando") || "Enviando..."}</span>`;
    }

    try {
        const { data: userData } = await supabaseClient.auth.getUser();
        const miEmail = userData?.user?.email;

        const { data, error } = await supabaseClient.functions.invoke("enviar-correo-prueba", {
            body: { clinica_id: clinicaID, destinatario: miEmail }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        alert(t("config_correo_prueba_exito") || `✅ Correo de prueba enviado a ${miEmail}. Revisa tu bandeja.`);
    } catch (e) {
        console.error("Error al enviar correo de prueba:", e);
        alert("Error: " + (e.message || "No se pudo enviar el correo de prueba."));
    } finally {
        if (btnPrueba) {
            btnPrueba.disabled = false;
            btnPrueba.innerHTML = `<span data-i18n="config_correo_prueba_btn">📨 Enviar Correo de Prueba</span>`;
        }
    }
}

/* =========================================================
   CORREO DE AVISOS INTERNOS (secretaria) — para el aviso
   diario de citas de mañana sin WhatsApp enviado.
========================================================= */
async function guardarCorreoNotificaciones() {
    const correoNotif = document.getElementById("correoNotificaciones").value.trim();

    if (!configuracionExistente) {
        alert("Primero guarda tu configuración de correo de Gmail (arriba). Después podrás guardar el correo de avisos internos.");
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('configuracion_correo')
            .update({ correo_notificaciones: correoNotif || null })
            .eq('clinica_id', clinicaID);

        if (error) throw error;

        if (typeof registrarAuditoria === "function") {
            registrarAuditoria("editar", "correo_notificaciones", correoNotif || "(vacío)");
        }

        alert("✅ Correo de avisos internos guardado.");
        await cargarConfiguracion();
    } catch (e) {
        console.error("Error al guardar correo de notificaciones:", e);
        alert("Error: " + e.message);
    }
}

function retraducirContenidoDinamico() {
    if (configuracionExistente) {
        mostrarBanner("success", `${t("config_correo_activo_desde") || "Recordatorios activos desde"}: ${configuracionExistente.gmail_email}`);
    }
}

function volver() { window.location.href = "dashboard.html"; }

poblarSelectPaises();
cargarPaisClinica();
cargarConfiguracion();
