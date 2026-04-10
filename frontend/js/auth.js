/* =========================
   CLÍNICAS CONFIGURADAS
========================= */
const clinicas = {
  clinica1: {
    nombre: "Clínica San José",
    usuarios: {
      admin: { password: "1234", rol: "admin" },
      doctor: { password: "doc123", rol: "doctor" },
      recepcion: { password: "rec123", rol: "recepcion" }
    }
  },
  clinica2: {
    nombre: "Clínica Dental Sonrisa",
    usuarios: {
      admin: { password: "abcd", rol: "admin" }
    }
  }
};

/* =========================
   ELEMENTOS
========================= */
const mensaje = document.getElementById("mensaje");
const errorDisplay = document.getElementById("error");
const loginBtn = document.getElementById("loginBtn");

/* =========================
   GESTIÓN DE CLÍNICA ID
========================= */
const params = new URLSearchParams(window.location.search);
let clinicaID = params.get("clinica") || localStorage.getItem("clinicaID") || "clinica1";

// Mostrar nombre de la clínica en el login
if (mensaje) {
    if (!clinicas[clinicaID]) {
        mensaje.innerText = "Clínica no válida";
        if (loginBtn) loginBtn.disabled = true;
    } else {
        mensaje.innerText = "Acceso a " + clinicas[clinicaID].nombre;
    }
}

/* =========================
   LÓGICA DE LOGIN (VELOZ)
========================= */
if (loginBtn) {
    loginBtn.onclick = async () => {
        if (errorDisplay) errorDisplay.innerText = "";
        
        const usuarioInput = document.getElementById("usuario");
        const passwordInput = document.getElementById("password");

        if (!usuarioInput || !passwordInput) return;

        const usuario = usuarioInput.value.trim();
        const password = passwordInput.value.trim();

        // 1. Validaciones básicas
        if (!usuario || !password) {
            showError("Completa todos los campos");
            return;
        }

        const clinica = clinicas[clinicaID];
        if (!clinica || !clinica.usuarios[usuario]) {
            showError("Usuario no válido");
            return;
        }

        const data = clinica.usuarios[usuario];

        if (data.password !== password) {
            showError("Contraseña incorrecta");
            return;
        }

        // 2. Guardar sesión
        localStorage.setItem("clinicaID", clinicaID);
        localStorage.setItem("clinicaNombre", clinica.nombre);
        localStorage.setItem("rol", data.rol);
        localStorage.setItem("usuario", usuario);
        localStorage.setItem("loginTime", new Date().toISOString());

        // 3. Sincronización Inteligente (No bloqueante)
        // Si la función existe, la lanzamos pero NO esperamos 5 minutos
        if (typeof syncAllToCloud === "function") {
            console.log("Sincronizando en segundo plano...");
            showError("Sincronizando...", "info"); // Usamos el color azul info del CSS
            
            // Intentamos sincronizar con un timeout de 3 segundos máximo
            try {
                await Promise.race([
                    syncAllToCloud(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
                ]);
            } catch (e) {
                console.warn("La nube está lenta o caída, entrando igual...");
            }
        }

        // ¡Vámonos al dashboard!
        window.location.href = "dashboard.html";
    };
}

// Función auxiliar para mostrar errores con estilo
function showError(msg, type = "error") {
    if (errorDisplay) {
        errorDisplay.innerText = msg;
        errorDisplay.style.color = type === "error" ? "#f87171" : "#93c5fd";
    }
}
