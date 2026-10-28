/* =========================
   SESSION MANAGER PRO (STABLE)
========================= */
const SESSION = {
  clinicaID: "clinicaID",
  rol: "rol",
  lastActivity: "ultimaActividad",
  // Datos que auth.js guarda al iniciar sesión (se borran al cerrarla)
  clinicaNombre: "clinicaNombre",
  usuario: "usuario",
  loginTime: "loginTime",
  // Plan y estado de la cuenta de la clínica (se refrescan en cada página)
  plan: "plan",
  region: "region",
  estado: "estadoCuenta",
  vencimiento: "fechaVencimientoPrueba"
};
const TIMEOUT = 20 * 60 * 1000;

const MSG_SUSPENDIDA = {
  es: "La cuenta de tu clínica está suspendida. Contacta al equipo de ClinicOS para activarla.",
  en: "Your clinic's account is suspended. Contact the ClinicOS team to activate it.",
  fr: "Le compte de votre clinique est suspendu. Contactez l'équipe ClinicOS pour l'activer."
};

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
   PLAN Y ESTADO DE LA CLÍNICA
   Lee plan / región / estado de la cuenta con la función segura
   mi_clinica_info() (si aún no existe en la base, lee la tabla clinicas)
   y lo guarda en localStorage para que layout.js dibuje el menú y bloquee
   funciones. Si el plan cambió, redibuja el menú al instante. Si la clínica
   quedó suspendida, cierra la sesión.
========================= */
async function leerInfoClinica(clinicaID) {
  try {
    const r = await supabaseClient.rpc("mi_clinica_info");
    if (!r.error && r.data) {
      const fila = Array.isArray(r.data) ? r.data[0] : r.data;
      if (fila) return fila;
    }
  } catch (e) { /* se prueba el respaldo */ }
  const d = await supabaseClient
    .from("clinicas")
    .select("nombre, plan, region, estado_cuenta, fecha_vencimiento_prueba")
    .eq("id", clinicaID)
    .maybeSingle();
  return d && d.data ? d.data : null;
}

function guardarSiHayValor(clave, valor) {
  if (valor === undefined || valor === null || valor === "") localStorage.removeItem(clave);
  else localStorage.setItem(clave, String(valor));
}

async function cargarPlanClinica() {
  const clinicaID = localStorage.getItem(SESSION.clinicaID);
  if (!clinicaID || typeof supabaseClient === "undefined") return;
  try {
    const info = await leerInfoClinica(clinicaID);
    if (!info) {
      console.warn("No se pudo leer el plan de la clínica");
      return;
    }

    if (info.estado_cuenta === "suspendida") {
      const lang = localStorage.getItem("lang") || "es";
      alert(MSG_SUSPENDIDA[lang] || MSG_SUSPENDIDA.es);
      await cerrarSesion();
      return;
    }

    const planAntes = localStorage.getItem(SESSION.plan);
    guardarSiHayValor(SESSION.plan, info.plan);
    guardarSiHayValor(SESSION.region, info.region);
    guardarSiHayValor(SESSION.estado, info.estado_cuenta);
    guardarSiHayValor(SESSION.vencimiento, info.fecha_vencimiento_prueba);
    if (info.nombre) localStorage.setItem(SESSION.clinicaNombre, info.nombre);

    if (planAntes !== info.plan && typeof aplicarPlanYMenu === "function") aplicarPlanYMenu();
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
