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
   GESTIÓN DE CLÍNICA ID Y LENGUAJE
========================= */
const params = new URLSearchParams(window.location.search);
let clinicaID = params.get("clinica") || localStorage.getItem("clinicaID") || "clinica1";
// Obtenemos el idioma actual (por defecto español)
const currentLang = localStorage.getItem("lang") || "es";

// Mostrar nombre de la clínica en el login
if (mensaje) {
    if (!clinicas[clinicaID]) {
        // Traducción dinámica para clínica no válida
        const msgErrorClinica = {
            es: "Clínica no válida",
            en: "Invalid Clinic",
            fr: "Clinique non valide"
        };
        mensaje.innerText = msgErrorClinica[currentLang];
        if (loginBtn) loginBtn.disabled = true;
    } else {
        const accesoTxt = {
            es: "Acceso a ",
            en: "Access to ",
            fr: "Accès à "
        };
        mensaje.innerText = accesoTxt[currentLang] + clinicas[clinicaID].nombre;
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

        // 1. Validaciones básicas con traducción
        if (!usuario || !password) {
            const msgIncompleto = {
                es: "Completa todos los campos",
                en: "Please fill all fields",
                fr: "Veuillez remplir tous los champs"
            };
            showError(msgIncompleto[currentLang]);
            return;
        }

        const clinica = clinicas[clinicaID];
        if (!clinica || !clinica.usuarios[usuario]) {
            const msgUserInvalid = {
                es: "Usuario no válido",
                en: "Invalid user",
                fr: "Utilisateur non valide"
            };
            showError(msgUserInvalid[currentLang]);
            return;
        }

        const data = clinica.usuarios[usuario];

        if (data.password !== password) {
            const msgPassInvalid = {
                es: "Contraseña incorrecta",
                en: "Incorrect password",
                fr: "Mot de passe incorrect"
            };
            showError(msgPassInvalid[currentLang]);
            return;
        }

        // 2. Guardar sesión
        localStorage.setItem("clinicaID", clinicaID);
        localStorage.setItem("clinicaNombre", clinica.nombre);
        localStorage.setItem("rol", data.rol);
        localStorage.setItem("usuario", usuario);
        localStorage.setItem("loginTime", new Date().toISOString());

        // 3. Sincronización Inteligente
        if (typeof syncAllToCloud === "function") {
            const msgSync = {
                es: "Sincronizando...",
                en: "Syncing...",
                fr: "Synchronisation..."
            };
            showError(msgSync[currentLang], "info"); 
            
            try {
                await Promise.race([
                    syncAllToCloud(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
                ]);
            } catch (e) {
                console.warn("La nube está lenta o caída, entrando igual...");
            }
        }

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
