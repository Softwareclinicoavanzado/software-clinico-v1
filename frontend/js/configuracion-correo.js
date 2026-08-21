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
   PAÍS DE LA CLÍNICA → zona horaria + idioma automáticos
========================================================= */
const PAISES = [
    { nombre: "Guatemala",              zona: "America/Guatemala",              idioma: "es" },
    { nombre: "México",                 zona: "America/Mexico_City",            idioma: "es" },
    { nombre: "El Salvador",            zona: "America/El_Salvador",            idioma: "es" },
    { nombre: "Honduras",               zona: "America/Tegucigalpa",            idioma: "es" },
    { nombre: "Nicaragua",              zona: "America/Managua",                idioma: "es" },
    { nombre: "Costa Rica",             zona: "America/Costa_Rica",             idioma: "es" },
    { nombre: "Panamá",                 zona: "America/Panama",                 idioma: "es" },
    { nombre: "Colombia",               zona: "America/Bogota",                 idioma: "es" },
    { nombre: "Ecuador",                zona: "America/Guayaquil",              idioma: "es" },
    { nombre: "Perú",                   zona: "America/Lima",                   idioma: "es" },
    { nombre: "Bolivia",                zona: "America/La_Paz",                 idioma: "es" },
    { nombre: "Chile",                  zona: "America/Santiago",               idioma: "es" },
    { nombre: "Argentina",              zona: "America/Argentina/Buenos_Aires", idioma: "es" },
    { nombre: "Paraguay",               zona: "America/Asuncion",               idioma: "es" },
    { nombre: "Uruguay",                zona: "America/Montevideo",             idioma: "es" },
    { nombre: "Venezuela",              zona: "America/Caracas",                idioma: "es" },
    { nombre: "República Dominicana",   zona: "America/Santo_Domingo",          idioma: "es" },
    { nombre: "Puerto Rico",            zona: "America/Puerto_Rico",            idioma: "es" },
    { nombre: "España",                 zona: "Europe/Madrid",                  idioma: "es" },
    { nombre: "Estados Unidos (Este)",  zona: "America/New_York",               idioma: "en" },
    { nombre: "Estados Unidos (Centro)",zona: "America/Chicago",                idioma: "en" },
    { nombre: "Estados Unidos (Oeste)", zona: "America/Los_Angeles",            idioma: "en" },
    { nombre: "Francia",                zona: "Europe/Paris",                   idioma: "fr" },
    { nombre: "Canadá (Quebec)",        zona: "America/Toronto",                idioma: "fr" },
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
            .select('zona_horaria, idioma')
            .eq('id', clinicaID)
            .maybeSingle();

        if (error) throw error;

        if (data) {
            const idx = PAISES.findIndex(p => p.zona === data.zona_horaria && p.idioma === data.idioma);
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
            .update({ zona_horaria: pais.zona, idioma: pais.idioma })
            .eq('id', clinicaID);

        if (error) throw error;

        if (typeof registrarAuditoria === "function") {
            registrarAuditoria("editar", "clinica_pais", pais.nombre);
        }

        alert(`✅ País actualizado a ${pais.nombre}. Los recordatorios ahora usarán su horario e idioma.`);
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

function retraducirContenidoDinamico() {
    if (configuracionExistente) {
        mostrarBanner("success", `${t("config_correo_activo_desde") || "Recordatorios activos desde"}: ${configuracionExistente.gmail_email}`);
    }
}

function volver() { window.location.href = "dashboard.html"; }

poblarSelectPaises();
cargarPaisClinica();
cargarConfiguracion();
