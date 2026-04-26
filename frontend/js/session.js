/* =========================
   SESSION MANAGER PRO (STABLE)
========================= */
const SESSION = {
  clinicaID: "clinicaID",
  rol: "rol",
  lastActivity: "ultimaActividad"
};

const TIMEOUT = 20 * 60 * 1000;

function verificarSesion() {
  const clinicaID = localStorage.getItem(SESSION.clinicaID);
  if (!clinicaID) {
    window.location.replace("./index.html");
  }
}

function actualizarActividad() {
  // ✅ CORRECCIÓN: Date.now() en lugar de [Date.now](http://Date.now)()
  localStorage.setItem(SESSION.lastActivity, Date.now());
}

function verificarInactividad() {
  const last = Number(localStorage.getItem(SESSION.lastActivity));
  // ✅ CORRECCIÓN: Date.now() en lugar de [Date.now](http://Date.now)()
  if (last && (Date.now() - last > TIMEOUT)) {
    alert("Sesión cerrada por inactividad");
    cerrarSesion();
  }
}

function cerrarSesion() {
  Object.values(SESSION).forEach(k => localStorage.removeItem(k));
  window.location.replace("./index.html");
}

document.addEventListener("DOMContentLoaded", () => {
  verificarSesion();
  
  ["click", "keydown", "mousemove"].forEach(evt =>
    document.addEventListener(evt, actualizarActividad)
  );
  
  actualizarActividad();
  setInterval(verificarInactividad, 60000);
});
