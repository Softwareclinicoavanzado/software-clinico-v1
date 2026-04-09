/* =========================
   STORAGE MANAGER PRO++ (CLOUD READY)
========================= */

const STORAGE_VERSION = "1.1.0";
// Esta es la dirección de tu servidor en Render que configuramos hace un momento
const API_URL = "https://software-clinico-v1.onrender.com";

/* =========================
   CLÍNICA
========================= */
function getClinicaID() {
  const id = localStorage.getItem("clinicaID");
  if (!id) {
    console.error("❌ Clínica no definida");
    return "default_clinic"; // Fallback para evitar que se rompa el sistema
  }
  return id;
}

/* =========================
   CONEXIÓN CON EL BACKEND (RENDER)
========================= */

// Función para probar si el servidor de Render responde
async function testServerConnection() {
  try {
    const response = await fetch(`${API_URL}/`);
    if (response.ok) {
      console.log("✅ Conectado al backend en Render");
    }
  } catch (error) {
    console.error("❌ No se pudo conectar al backend:", error);
  }
}

/* =========================
   UTILIDADES SEGURAS
========================= */
function safeParse(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    return Array.isArray(data) || typeof data === "object" ? data : fallback;
  } catch (e) {
    console.warn("⚠️ Error leyendo storage:", key);
    return fallback;
  }
}

function saveWithBackup(key, data) {
  try {
    const prev = localStorage.getItem(key);
    if (prev) {
      localStorage.setItem(`${key}_backup`, prev);
    }
    localStorage.setItem(key, JSON.stringify(data));
    
    // OPCIONAL: Aquí podríamos enviar una copia al backend automáticamente
    // syncWithBackend(key, data);
    
  } catch (e) {
    console.error("Error guardando datos localmente:", e);
  }
}

/* =========================
   METADATA
========================= */
function saveMeta() {
  localStorage.setItem(
    "storage_meta",
    JSON.stringify({
      version: STORAGE_VERSION,
      lastUpdate: new Date().toISOString(),
      device: navigator.userAgent,
      server: API_URL
    })
  );
}

function getMeta() {
  return safeParse("storage_meta", {});
}

/* =========================
   PACIENTES
========================= */
function getPacientes() {
  const id = getClinicaID();
  return safeParse(`pacientes_${id}`, []);
}

function savePacientes(data) {
  const id = getClinicaID();
  saveWithBackup(`pacientes_${id}`, data);
  saveMeta();
}

/* =========================
   CITAS
========================= */
function getCitas() {
  const id = getClinicaID();
  return safeParse(`citas_${id}`, []);
}

function saveCitas(data) {
  const id = getClinicaID();
  saveWithBackup(`citas_${id}`, data);
  saveMeta();
}

/* =========================
   HISTORIAL MÉDICO
========================= */
function getHistorial(pacienteID) {
  if (!pacienteID) return [];
  const id = getClinicaID();
  return safeParse(`historial_${id}_${pacienteID}`, []);
}

function saveHistorial(pacienteID, data) {
  if (!pacienteID) return;
  const id = id || getClinicaID();
  saveWithBackup(`historial_${id}_${pacienteID}`, data);
  saveMeta();
}

/* =========================
   EXPORTAR AL BACKEND (SUPABASE)
========================= */
// Esta función enviará todos tus datos locales a la base de datos real
async function syncAllToCloud() {
  const data = exportClinicData();
  try {
    const response = await fetch(`${API_URL}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      alert("✅ ¡Sincronización con la nube exitosa!");
    } else {
      throw new Error("Error en la respuesta del servidor");
    }
  } catch (error) {
    console.error("❌ Error de sincronización:", error);
    alert("No se pudo guardar en la nube. Revisa tu conexión.");
  }
}

function exportClinicData() {
  const id = getClinicaID();
  return {
    clinica_id: id,
    pacientes: getPacientes(),
    citas: getCitas(),
    meta: getMeta()
  };
}

// Ejecutar prueba de conexión al cargar
testServerConnection();
