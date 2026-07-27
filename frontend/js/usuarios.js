/* =============================================
    GESTIÓN DE USUARIOS | ClinicOS (Solo Admin)
============================================= */
const clinicaID = localStorage.getItem("clinicaID");
const rolActual = localStorage.getItem("rol");

if (!clinicaID) {
    window.location.href = "index.html";
}
if (rolActual !== "admin") {
    alert("Acceso denegado: solo el administrador puede gestionar usuarios.");
    window.location.href = "dashboard.html";
}

let miUserId = null;
let usuariosCache = [];

async function extraerError(error, fallback = "Ocurrió un error inesperado") {
    let mensaje = error?.message || fallback;
    try {
        if (error?.context && typeof error.context.json === "function") {
            const cuerpo = await error.context.json();
            if (cuerpo?.error) mensaje = cuerpo.error;
        }
    } catch (e2) {
        console.warn("No se pudo leer el detalle del error:", e2);
    }
    return mensaje;
}

async function obtenerMiID() {
    const { data } = await supabaseClient.auth.getUser();
    miUserId = data?.user?.id || null;
}

function etiquetaRol(rol) {
    if (rol === "doctor") return t("rol_doctor");
    if (rol === "recepcion") return t("rol_recepcion");
    if (rol === "admin") return t("rol_admin");
    return rol;
}

/* =========================
   Helpers visuales (mismo lenguaje que pacientes/citas)
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

function claseBadgeRol(rol) {
    if (rol === "admin") return "role-badge-admin";
    if (rol === "doctor") return "role-badge-doctor";
    return "role-badge-recepcion";
}

async function cargarUsuarios() {
    const lista = document.getElementById("listaUsuarios");
    if (!lista) return;

    const { data, error } = await supabaseClient
        .from("perfiles")
        .select("id, nombre, email, rol, activo, creado")
        .eq("clinica_id", clinicaID)
        .order("nombre", { ascending: true });

    if (error) {
        lista.innerHTML = "<li style='color:#f87171;'>Error al cargar usuarios</li>";
        console.error("Error al cargar usuarios:", error);
        return;
    }

    usuariosCache = data || [];

    if (usuariosCache.length === 0) {
        lista.innerHTML = `<li style='color:var(--text-secondary); text-align:center; background:none; border:none; box-shadow:none;'>${t("no_hay_usuarios")}</li>`;
        return;
    }

    lista.innerHTML = "";
    usuariosCache.forEach(u => {
        const esUnoMismo = u.id === miUserId;
        const inactivo = u.activo === false;

        const li = document.createElement("li");
        li.className = "staff-card" + (inactivo ? " staff-card-inactive" : "");
        li.innerHTML = `
            <div class="staff-card-top">
                <div class="patient-identity">
                    <div class="patient-avatar" style="background:${colorAvatar(u.nombre)}20; color:${colorAvatar(u.nombre)}; border-color:${colorAvatar(u.nombre)}40;">
                        ${iniciales(u.nombre)}
                    </div>
                    <div>
                        <div class="patient-name">
                            ${u.nombre || "Sin nombre"}
                            ${inactivo ? `<span class="status-dot status-dot-inactive" title="${t("inactivo_tag")}"></span>` : `<span class="status-dot status-dot-active" title="${t("activo_tag")}"></span>`}
                        </div>
                        <div class="patient-dpi">${u.email || "-"}</div>
                    </div>
                </div>
                <span class="role-badge ${claseBadgeRol(u.rol)}">${etiquetaRol(u.rol)}</span>
            </div>

            ${inactivo ? `<div class="patient-tags"><span class="patient-tag" style="color:#fca5a5; border-color:rgba(248,113,113,0.3); background:rgba(248,113,113,0.08);">${t("desactivado_tag")}</span></div>` : ""}

            <div class="patient-actions">
                <button type="button" class="btn-action" onclick="verInfo('${u.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                    ${t("ver_info")}
                </button>
                ${!esUnoMismo ? `
                    ${inactivo
                        ? `<button type="button" class="btn-action" onclick="cambiarEstado('${u.id}','reactivar')">
                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3.5-7.1"/><path d="M21 3v6h-6"/></svg>
                             ${t("reactivar")}
                           </button>`
                        : `<button type="button" class="btn-action" onclick="cambiarEstado('${u.id}','desactivar')">
                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 9l6 6M15 9l-6 6"/></svg>
                             ${t("desactivar")}
                           </button>`
                    }
                    <button type="button" class="btn-action" onclick="resetearPassword('${u.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        ${t("resetear_clave")}
                    </button>
                    <button type="button" class="btn-action btn-action-danger" onclick="eliminarUsuarioPermanente('${u.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                        ${t("eliminar_usuario")}
                    </button>
                ` : `<span class="patient-tag" style="align-self:center;">${t("esta_es_tu_cuenta")}</span>`}
            </div>
        `;
        lista.appendChild(li);
    });
}

function verInfo(id) {
    const u = usuariosCache.find(x => x.id === id);
    if (!u) return;
    const fecha = u.creado ? new Date(u.creado).toLocaleString("es-GT") : "No disponible";
    alert(
        `👤 ${t("ver_info").replace("ℹ️ ", "")}\n\n` +
        `${t("info_nombre")}: ${u.nombre || "-"}\n` +
        `${t("info_correo")}: ${u.email || "-"}\n` +
        `${t("info_rol")}: ${etiquetaRol(u.rol).toUpperCase()}\n` +
        `${t("info_estado")}: ${u.activo === false ? t("inactivo_tag") : t("activo_tag")}\n` +
        `${t("info_creada")}: ${fecha}`
    );
}

async function crearUsuario() {
    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const rol = document.getElementById("rol").value;

    if (!nombre || !email || !password) return alert("Completa todos los campos.");
    if (password.length < 6) return alert("La contraseña debe tener al menos 6 caracteres.");

    try {
        const { data, error } = await supabaseClient.functions.invoke("crear-usuario", {
            body: { email, password, nombre, rol, clinica_id: clinicaID }
        });

        if (error) throw new Error(await extraerError(error));
        if (data?.error) throw new Error(data.error);

        alert("✅ Usuario creado con éxito.");
        document.getElementById("nombre").value = "";
        document.getElementById("email").value = "";
        document.getElementById("password").value = "";
        await cargarUsuarios();
    } catch (err) {
        console.error("Error al crear usuario:", err);
        alert("Error: " + (err.message || "No se pudo crear el usuario."));
    }
}

async function cambiarEstado(usuario_id, accion) {
    const confirmMsg = accion === "desactivar"
        ? "¿Desactivar esta cuenta? El usuario no podrá iniciar sesión hasta que la reactives."
        : "¿Reactivar esta cuenta?";
    if (!confirm(confirmMsg)) return;

    try {
        const { data, error } = await supabaseClient.functions.invoke("gestionar-usuario", {
            body: { accion, usuario_id, clinica_id: clinicaID }
        });
        if (error) throw new Error(await extraerError(error));
        if (data?.error) throw new Error(data.error);
        await cargarUsuarios();
    } catch (err) {
        console.error("Error al cambiar estado:", err);
        alert("Error: " + (err.message || "No se pudo actualizar."));
    }
}

async function resetearPassword(usuario_id) {
    const nueva = prompt("Escribe la nueva contraseña temporal para este usuario (mínimo 6 caracteres):");
    if (!nueva) return;
    if (nueva.length < 6) return alert("Debe tener al menos 6 caracteres.");

    try {
        const { data, error } = await supabaseClient.functions.invoke("gestionar-usuario", {
            body: { accion: "restablecer_password", usuario_id, clinica_id: clinicaID, nueva_password: nueva }
        });
        if (error) throw new Error(await extraerError(error));
        if (data?.error) throw new Error(data.error);
        alert("✅ Contraseña actualizada. Comunícasela al usuario de forma segura.");
    } catch (err) {
        console.error("Error al resetear contraseña:", err);
        alert("Error: " + (err.message || "No se pudo restablecer la contraseña."));
    }
}

async function eliminarUsuarioPermanente(usuario_id) {
    if (!confirm("⚠️ ¿ELIMINAR esta cuenta DEFINITIVAMENTE? Esta acción no se puede deshacer.")) return;
    try {
        const { data, error } = await supabaseClient.functions.invoke("gestionar-usuario", {
            body: { accion: "eliminar", usuario_id, clinica_id: clinicaID }
        });
        if (error) throw new Error(await extraerError(error));
        if (data?.error) throw new Error(data.error);
        await cargarUsuarios();
    } catch (err) {
        console.error("Error al eliminar usuario:", err);
        alert("Error: " + (err.message || "No se pudo eliminar."));
    }
}

function volver() { window.location.href = "dashboard.html"; }

(async () => {
    await obtenerMiID();
    await cargarUsuarios();
})();
