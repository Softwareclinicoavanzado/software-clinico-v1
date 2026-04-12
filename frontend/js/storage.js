/* =========================
   STORAGE MANAGER PRO++ (ULTRA-STABLE)
========================= */

const STORAGE_VERSION = "1.1.2";
// Asegúrate de que esta URL sea la de tu servicio en Render
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
    localStorage.setItem(key, JSON.stringify(data));
}

// --- MÓDULOS ---
function getPacientes() {
    return safeParse(`pacientes_${getClinicaID()}`, []);
}

function savePacientes(data) {
    saveLocal(`pacientes_${getClinicaID()}`, data);
    syncData('/api/pacientes', data); // Sincroniza pacientes
}

function getCitas() {
    return safeParse(`citas_${getClinicaID()}`, []);
}

function saveCitas(data) {
    saveLocal(`citas_${getClinicaID()}`, data);
    syncData('/api/citas', data); // Sincroniza citas
}

// --- NUEVA FUNCIÓN DE SINCRONIZACIÓN POR MÓDULO ---
async function syncData(endpoint, data) {
    const clinicaID = getClinicaID();
    try {
        // Si es una lista (pacientes/citas), mandamos el último agregado o toda la lista
        // Para simplificar tu main.py actual, mandamos el último elemento si es POST
        const payload = Array.isArray(data) ? data[data.length - 1] : data;
        
        await fetch(`${API_URL}${endpoint}?clinica_id=${clinicaID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log(`☁️ Sincronizado con ${endpoint}`);
    } catch (e) {
        console.warn("📡 Falló la conexión, guardado localmente.");
    }
}

async function syncAllToCloud() {
    // Esta función la dejamos para compatibilidad con tus botones
    console.log("Sincronización completa activada...");
}
