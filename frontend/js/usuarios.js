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

// ✅ Helper para sacar el mensaje real de un error de Edge Function
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
    console.log("👥 Usuarios encontrados en esta clínica:", usuariosCache);

    if (usuariosCache.length === 0) {
        lista.innerHTML = "<li style='color:white;'>No hay usuarios registrados aún</li>";
        return;
    }

    lista.innerHTML = "";
    usuariosCache.forEach(u => {
        const esUnoMismo = u.id === miUserId;
        const inactivo = u.activo === false;

        const li = document.createElement("li");
        li.className = "paciente-item";
        li.style.opacity = inactivo ? "0.5" : "1";
        li.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${u.nombre || "Sin nombre"}</strong> ${inactivo ? '<span style="color:#f87171; font-size:0.75rem;">(Desactivado)</span>' : ''}<br>
                    <small style="opacity: 0.8;">${u.email || "-"}</small>
                </div>
                <span style="background:#2ecc71; color:#0d1117; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: bold;">
                    ${u.rol.toUpperCase()}
                </span>
            </div>
            <div style="display:flex; gap:8px; margin-top:10px; flex-wrap: wrap;">
                <button type="button" onclick="verInfo('${u.id}')" style="background:#3498db; flex:1; padding:6px; min-width: 100px;">ℹ️ Ver Info</button>
                ${!esUnoMismo ? `
                    ${inactivo
                        ? `<button type="button" onclick="cambiarEstado('${u.id}','reactivar')" style="background:#2ecc71; flex:1; padding:6px; min-width: 100px;">✅ Reactivar</button>`
                        : `<button type="button" onclick="cambiarEstado('${u.id}','desactivar')" style="background:#f39c12; flex:1; padding:6px; min-width: 100px;">⏸️ Desactivar</button>`
                    }
                    <button type="button" onclick="resetearPassword('${u.id}')" style="background:#9b59b6; flex:1; padding:6px; min-width: 100px;">🔑 Resetear Clave</button>
                    <button type="button" onclick="eliminarUsuarioPermanente('${u.id}')" style="background:#e74c3c; flex:1; padding:6px; min-width: 100px;">🗑️ Eliminar</button>
                ` : `<small style="opacity:0.5; align-self:center;">Esta es tu cuenta</small>`}
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
        `👤 Información del usuario\n\n` +
        `Nombre: ${u.nombre || "-"}\n` +
        `Correo: ${u.email || "-"}\n` +
        `Rol: ${u.rol.toUpperCase()}\n` +
        `Estado: ${u.activo === false ? "Desactivado" : "Activo"}\n` +
        `Cuenta creada: ${fecha}`
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
        alert("Error real: " + (err.message || "No se pudo crear el usuario."));
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
        alert("Error real: " + (err.message || "No se pudo actualizar."));
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
        alert("Error real: " + (err.message || "No se pudo restablecer la contraseña."));
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
        alert("Error real: " + (err.message || "No se pudo eliminar."));
    }
}

function volver() { window.location.href = "dashboard.html"; }

(async () => {
    await obtenerMiID();
    await cargarUsuarios();
})();
