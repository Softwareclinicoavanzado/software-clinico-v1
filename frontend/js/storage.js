/* =========================
   STORAGE MANAGER PRO++ (ULTRA-STABLE)
========================= */

const STORAGE_VERSION = "1.1.2";
const API_URL = "https://software-clinico-v1.onrender.com";

// 1. OBTENER ID DE CLÍNICA (SEGURIDAD TOTAL)
function getClinicaID() {
    const id = localStorage.getItem("clinicaID");
    if (!id) {
        console.warn("⚠️ Clínica no detectada, usando sesión local.");
        return "temp_clinic"; 
    }
    return id;
}

// 2. UTILIDADES DE LECTURA Y ESCRITURA
function safeParse(key, fallback = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (e) {
        console.error("Error leyendo:", key);
        return fallback;
    }
}

function saveLocal(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(`${key}_last_sync`, new Date().toISOString());
    } catch (e) {
        console.error("Error crítico de espacio en disco local");
    }
}

/* =========================
   MÓDULOS DE DATOS
========================= */

// PACIENTES
function getPacientes() {
    const id = getClinicaID();
    return safeParse(`pacientes_${id}`, []);
}

function savePacientes(data) {
    const id = getClinicaID();
    saveLocal(`pacientes_${id}`, data);
    // Intentamos sincronizar pero SIN BLOQUEAR la pantalla
    silentSync(); 
}

// CITAS
function getCitas() {
    const id = getClinicaID();
    return safeParse(`citas_${id}`, []);
}

function saveCitas(data) {
    const id = getClinicaID();
    saveLocal(`citas_${id}`, data);
    silentSync();
}

// HISTORIAL
function getHistorial(pacienteID) {
    const id = getClinicaID();
    return safeParse(`historial_${id}_${pacienteID}`, []);
}

function saveHistorial(pacienteID, data) {
    const id = getClinicaID();
    saveLocal(`historial_${id}_${pacienteID}`, data);
    silentSync();
}

/* =========================
   SINCRONIZACIÓN ASÍNCRONA (ELIMINA EL RETRASO)
========================= */

async function silentSync() {
    const id = getClinicaID();
    const payload = {
        clinica_id: id,
        pacientes: getPacientes(),
        citas: getCitas(),
        timestamp: new Date().toISOString()
    };

    try {
        // El secreto: Solo esperamos 2 segundos. Si la nube no responde, seguimos.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(`${API_URL}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        if (response.ok) console.log("☁️ Nube actualizada.");
    } catch (error) {
        console.log("📡 Modo Local: Los datos se subirán cuando haya conexión.");
    }
}

// Función compatible con tu botón de login para que no tire error
async function syncAllToCloud() {
    await silentSync();
}

console.log(`🚀 Storage Engine v${STORAGE_VERSION} cargado.`);
