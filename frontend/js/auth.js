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
   ELEMENTOS (Protegidos para que no den error)
========================= */
const mensaje = document.getElementById("mensaje");
const errorDisplay = document.getElementById("error"); // Cambiado el nombre interno para no chocar
const loginBtn = document.getElementById("loginBtn");

/* =========================
   CLÍNICA (CON FALLBACK)
========================= */
const params = new URLSearchParams(window.location.search);
let clinicaID = params.get("clinica");

if (!clinicaID) {
  clinicaID = localStorage.getItem("clinicaID") || "clinica1";
}

/* =========================
   MENSAJE DE BIENVENIDA
========================= */
if (mensaje) {
    if (!clinicas[clinicaID]) {
      mensaje.innerText = "Clínica no válida";
      if (loginBtn) loginBtn.disabled = true;
    } else {
      mensaje.innerText = "Acceso a " + clinicas[clinicaID].nombre;
    }
}

/* =========================
   LOGIN
========================= */
if (loginBtn) {
    loginBtn.onclick = () => {
      if (errorDisplay) errorDisplay.innerText = "";

      const usuarioInput = document.getElementById("usuario");
      const passwordInput = document.getElementById("password");

      if (!usuarioInput || !passwordInput) return;

      const usuario = usuarioInput.value.trim();
      const password = passwordInput.value.trim();

      if (!usuario || !password) {
        if (errorDisplay) errorDisplay.innerText = "Completa todos los campos";
        return;
      }

      const clinica = clinicas[clinicaID];
      if (!clinica || !clinica.usuarios[usuario]) {
        if (errorDisplay) errorDisplay.innerText = "Usuario no válido";
        return;
      }

      const data = clinica.usuarios[usuario];

      if (data.password !== password) {
        if (errorDisplay) errorDisplay.innerText = "Contraseña incorrecta";
        return;
      }

      // Guardar sesión
      localStorage.setItem("clinicaID", clinicaID);
      localStorage.setItem("clinicaNombre", clinica.nombre);
      localStorage.setItem("rol", data.rol);
      localStorage.setItem("usuario", usuario);
      localStorage.setItem("loginTime", new Date().toISOString());

      // Sincronización con Render
      if (typeof syncAllToCloud === "function") {
          if (errorDisplay) errorDisplay.innerText = "Sincronizando con la nube...";
          syncAllToCloud().finally(() => {
              window.location.href = "dashboard.html";
          });
      } else {
          window.location.href = "dashboard.html";
      }
    };
}
