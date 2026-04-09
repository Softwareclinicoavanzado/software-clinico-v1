/* =========================
   STORAGE MANAGER PRO++
========================= */

const STORAGE_VERSION = "1.1.0";

/* =========================
   CLÍNICA
========================= */
function getClinicaID() {
  const id = localStorage.getItem("clinicaID");
  if (!id) {
    console.error("❌ Clínica no definida");
    throw new Error("Clínica no definida");
  }
  return id;
}

/* =========================
   UTILIDADES SEGURAS
========================= */
function safeParse(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;

    const data = JSON.parse(raw);
    return Array.isArray(data) || typeof data === "object"
      ? data
      : fallback;
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
  } catch (e) {
    alert("Error guardando datos. Espacio insuficiente.");
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
      device: navigator.userAgent
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
  const id = getClinicaID();
  saveWithBackup(`historial_${id}_${pacienteID}`, data);
  saveMeta();
}

/* =========================
   EXPORT FUTURO (BACKEND)
========================= */
function exportClinicData() {
  const id = getClinicaID();
  return {
    pacientes: getPacientes(),
    citas: getCitas(),
    meta: getMeta()
  };
}
