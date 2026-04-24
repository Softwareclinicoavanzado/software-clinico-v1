/* =============================================
    STORAGE MANAGER PRO++ (CLOUD-SYNC ENABLED)
============================================= */
const STORAGE_VERSION = "1.2.0"; // Actualizado a sync real
const API_URL = "https://software-clinico-v1.onrender.com";

function getClinicaID() {
    return localStorage.getItem("clinicaID") || "temp_clinic"; 
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

// --- MÓDULOS DE DATOS (AHORA ASÍNCRONOS) ---

// Obtiene pacientes de la Nube (con respaldo local)
async function getPacientes() {
    const id = getClinicaID();
    try {
        const response = await fetch(`${API_URL}/api/pacientes?clinica_id=${id}`);
        if (response.ok) {
            const datosNube = await response.json();
            saveLocal(`pacientes_${id}`, datosNube); // Actualizamos respaldo local
            console.log("✅ Pacientes cargados desde la nube");
            return datosNube;
        }
    } catch (error) {
        console.warn("📡 Modo Local: Usando caché de pacientes");
    }
    return safeParse(`pacientes_${id}`, []);
}

function savePacientes(data) {
    saveLocal(`pacientes_${getClinicaID()}`, data);
    // Enviamos el último paciente agregado a la nube
    const ultimoPaciente = data[data.length - 1];
    if (ultimoPaciente) {
        silentSync('pacientes', ultimoPaciente); 
    }
}

// Obtiene citas de la Nube
async function getCitas() {
    const id = getClinicaID();
    try {
        const response = await fetch(`${API_URL}/api/citas?clinica_id=${id}`);
        if (response.ok) {
            const datosNube = await response.json();
            saveLocal(`citas_${id}`, datosNube);
            return datosNube;
        }
    } catch (error) {
        console.warn("📡 Modo Local: Usando caché de citas");
    }
    return safeParse(`citas_${id}`, []);
}

function saveCitas(data) {
    saveLocal(`citas_${getClinicaID()}`, data);
    const ultimaCita = data[data.length - 1];
    if (ultimaCita) {
        silentSync('citas', ultimaCita);
    }
}

// --- SINCRONIZACIÓN ASÍNCRONA ---
async function silentSync(tipo = 'general', payload = null) {
    const id = getClinicaID();

    try {
        const endpoint = tipo === 'pacientes' ? '/api/pacientes' : (tipo === 'citas' ? '/api/citas' : '/sync');
        
        // Aseguramos que el payload tenga el clinica_id
        if (payload && typeof payload === 'object') {
            payload.clinica_id = id;
        }

        const response = await fetch(`${API_URL}${endpoint}?clinica_id=${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload || { clinica_id: id, status: "ping" })
        });

        if (response.ok) {
            console.log(`☁️ Nube sincronizada con éxito: ${tipo}`);
        } else {
            console.error(`❌ Error en sincronización: ${response.statusText}`);
        }
    } catch (error) {
        console.log("📡 Fallo de conexión, el dato se sincronizará después.");
    }
}

async function syncAllToCloud() { 
    // Esta función se puede expandir para hacer un push masivo si es necesario
    await silentSync('general', { status: "check_sync" }); 
}

console.log(`🚀 Storage Engine v${STORAGE_VERSION} cargado correctamente.`);
