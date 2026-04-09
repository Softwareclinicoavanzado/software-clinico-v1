/* =========================
   SESSION MANAGER PRO (STABLE)
   GITHUB PAGES SAFE
========================= */

const SESSION = {
  clinicaID: "clinicaID",
  clinicaNombre: "clinicaNombre",
  rol: "rol",
  lastActivity: "ultimaActividad"
};

const TIMEOUT = 20 * 60 * 1000; // 20 minutos

// 🔒 Verificación de sesión (DOM SAFE)
function verificarSesion() {
  const clinicaID = localStorage.getItem(SESSION.clinicaID);
  const rol = localStorage.getItem(SESSION.rol);

  if (!clinicaID || !rol) {
    // usar replace para no volver atrás
    window.location.replace("./index.html");
  }
}

// ⏱️ Actividad
function actualizarActividad() {
  localStorage.setItem(SESSION.lastActivity, Date.now());
}

// ⌛ Inactividad
function verificarInactividad() {
  const last = Number(localStorage.getItem(SESSION.lastActivity));
  if (!last) return;

  if (Date.now() - last > TIMEOUT) {
    alert("Sesión cerrada por inactividad");
    cerrarSesion();
  }
}

// 🚪 Logout limpio
function cerrarSesion() {
  Object.values(SESSION).forEach(k =>
    localStorage.removeItem(k)
  );
  window.location.replace("./index.html");
}

/* =========================
   EVENTOS GLOBALES
========================= */

// ⚠️ Esperar a que cargue el DOM
document.addEventListener("DOMContentLoaded", () => {

  // eventos de actividad
  ["click", "keydown", "mousemove"].forEach(evt =>
    document.addEventListener(evt, actualizarActividad)
  );

  actualizarActividad();

  // verificar sesión DESPUÉS de cargar
  setTimeout(verificarSesion, 50);

  // chequeo de inactividad
  setInterval(verificarInactividad, 60 * 1000);
});