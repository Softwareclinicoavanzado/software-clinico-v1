/* =============================================
    GESTIÓN DE USUARIOS | ClinicOS (Solo Admin)
============================================= */
const clinicaID = localStorage.getItem("clinicaID");
const rolActual = localStorage.getItem("rol");

if (!clinicaID) {
    window.location.href = "index.html";
}

// ✅ Solo un admin puede entrar a esta pantalla
if (rolActual !== "admin") {
    alert("Acceso denegado: solo el administrador puede gestionar usuarios.");
    window.location.href = "dashboard.html";
}

async function cargarUsuarios() {
    const lista = document.getElementById("listaUsuarios");
    if (!lista) return;

    const { data, error } = await supabaseClient
        .from("perfiles")
        .select("id, nombre, email, rol")
        .eq("clinica_id", clinicaID)
        .order("nombre", { ascending: true });

    if (error) {
        lista.innerHTML = "<li style='color:#f87171;'>Error al cargar usuarios</li>";
        console.error(error);
        return;
    }

    if (!data || data.length === 0) {
        lista.innerHTML = "<li style='color:white;'>No hay usuarios registrados aún</li>";
        return;
    }

    lista.innerHTML = "";
    data.forEach(u => {
        const li = document.createElement("li");
        li.className = "paciente-item";
        li.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${u.nombre || "Sin nombre"}</strong><br>
                    <small style="opacity: 0.8;">${u.email || "-"}</small>
                </div>
                <span style="background:#2ecc71; color:#0d1117; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: bold;">
                    ${u.rol.toUpperCase()}
                </span>
            </div>
        `;
        lista.appendChild(li);
    });
}

async function crearUsuario() {
    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const rol = document.getElementById("rol").value;

    if (!nombre || !email || !password) {
        return alert("Completa todos los campos.");
    }
    if (password.length < 6) {
        return alert("La contraseña debe tener al menos 6 caracteres.");
    }

    try {
        const { data, error } = await supabaseClient.functions.invoke("crear-usuario", {
            body: { email, password, nombre, rol, clinica_id: clinicaID }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        alert("✅ Usuario creado con éxito.");
        document.getElementById("nombre").value = "";
        document.getElementById("email").value = "";
        document.getElementById("password").value = "";
        cargarUsuarios();

    } catch (err) {
        console.error("Error al crear usuario:", err);
        alert("Error: " + (err.message || "No se pudo crear el usuario."));
    }
}

function volver() {
    window.location.href = "dashboard.html";
}

cargarUsuarios();
