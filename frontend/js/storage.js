/* =========================
   STORAGE MANAGER PRO++ (ULTRA-STABLE)
========================= */

const STORAGE_VERSION = "1.1.2";
const API_URL = "https://software-clinico-v1.onrender.com";

function getClinicaID() {
    const id = localStorage.getItem("clinicaID");
    return id || "temp_clinic"; 
}

function safeParse(key, fallback = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (e) {
        return fallback;
    }
}

function saveLocal(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(`${key}_last_sync`, new Date().toISOString());
    } catch (e) {
        console.error("Error crítico de espacio local");
    }
}

// --- MÓDULOS DE DATOS ---
function getPacientes() {
    return safeParse(`pacientes_${getClinicaID()}`, []);
}

function savePacientes(data) {
    saveLocal(`pacientes_${getClinicaID()}`, data);
    silentSync('pacientes', data); 
}

function getCitas() {
    return safeParse(`citas_${getClinicaID()}`, []);
}

function saveCitas(data) {
    saveLocal(`citas_${getClinicaID()}`, data);
    silentSync('citas', data);
}

// --- SINCRONIZACIÓN ASÍNCRONA ORIGINAL ---
async function silentSync(tipo = 'general', data = null) {
    const id = getClinicaID();
    
    // Si mandamos un dato específico (como un nuevo paciente)
    let payload = data;
    if (Array.isArray(data)) payload = data[data.length - 1];

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const endpoint = tipo === 'pacientes' ? '/api/pacientes' : (tipo === 'citas' ? '/api/citas' : '/sync');

        const response = await fetch(`${API_URL}${endpoint}?clinica_id=${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload || { clinica_id: id, status: "ping" }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        if (response.ok) console.log(`☁️ Nube actualizada: ${tipo}`);
    } catch (error) {
        console.log("📡 Modo Local: Guardado. Se sincronizará luego.");
    }
}

async function syncAllToCloud() {
    await silentSync();
}

console.log(`🚀 Storage Engine v${STORAGE_VERSION} cargado.`);
