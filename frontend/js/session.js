/* =========================
   SESSION MANAGER PRO (STABLE)
========================= */
const SESSION = {
  clinicaID: "clinicaID",
  rol: "rol",
  lastActivity: "ultimaActividad",
  // Plan de la clínica (se carga desde Supabase en cada página y se borra al cerrar sesión)
  plan: "plan",
  region: "region",
  estado: "estadoSuscripcion",
  pruebaHasta: "pruebaHasta"
};
const TIMEOUT = 20 * 60 * 1000;

function verificarSesion() {
  const clinicaID = localStorage.getItem(SESSION.clinicaID);
  if (!clinicaID) {
    window.location.replace("./index.html");
  }
}
function actualizarActividad() {
  localStorage.setItem(SESSION.lastActivity, Date.now());
}
function verificarInactividad() {
  const last = Number(localStorage.getItem(SESSION.lastActivity));
  if (last && (Date.now() - last > TIMEOUT)) {
    alert("Sesión cerrada por inactividad");
    cerrarSesion();
  }
}
async function cerrarSesion() {
  // ✅ Cerramos también la sesión real en Supabase Auth
  if (typeof supabaseClient !== "undefined") {
    await supabaseClient.auth.signOut();
  }
  Object.values(SESSION).forEach(k => localStorage.removeItem(k));
  window.location.replace("./index.html");
}

/* =========================
   PLAN DE LA CLÍNICA
   Lee plan / región / estado de la suscripción de la tabla clinicas y lo
   guarda en localStorage para que layout.js dibuje el menú y bloquee
   funciones. Si el plan cambió, redibuja el menú al instante.
========================= */
async function cargarPlanClinica() {
  const clinicaID = localStorage.getItem(SESSION.clinicaID);
  if (!clinicaID || typeof supabaseClient === "undefined") return;
  try {
    const { data, error } = await supabaseClient
      .from("clinicas")
      .select("plan, region, estado_suscripcion, prueba_hasta")
      .eq("id", clinicaID)
      .maybeSingle();
    if (error || !data) {
      console.warn("No se pudo leer el plan de la clínica:", error ? error.message : "sin datos");
      return;
    }
    const antes = localStorage.getItem(SESSION.plan);
    localStorage.setItem(SESSION.plan, data.plan);
    localStorage.setItem(SESSION.region, data.region);
    localStorage.setItem(SESSION.estado, data.estado_suscripcion);
    if (data.prueba_hasta) localStorage.setItem(SESSION.pruebaHasta, data.prueba_hasta);
    else localStorage.removeItem(SESSION.pruebaHasta);
    if (antes !== data.plan && typeof aplicarPlanYMenu === "function") aplicarPlanYMenu();
  } catch (e) {
    console.warn("Error cargando el plan de la clínica:", e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  verificarSesion();
  ["click", "keydown", "mousemove"].forEach(evt =>
    document.addEventListener(evt, actualizarActividad)
  );
  actualizarActividad();
  setInterval(verificarInactividad, 60000);
  cargarPlanClinica();
});
