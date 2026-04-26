/* =============================================
    STORAGE MANAGER PRO++ (SUPABASE SYNC ENABLED)
============================================= */
const STORAGE_VERSION = "1.3.0";

// --- CONFIGURACIÓN DE SUPABASE ---
// Datos obtenidos de tus variables de entorno
const supabaseUrl = 'https://klaygjvawybfksmahbhd.supabase.co';
const supabaseKey = 'sb_publishable_ZoyBvw_JncKIEsGmjEpEuA_dSIZZV4Z';

// Inicialización del cliente de Supabase
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

/**
 * Obtiene el ID de la clínica actual
 */
function getClinicaID() {
    return localStorage.getItem("clinicaID") || "temp_clinic"; 
}

/**
 * PARSE SEGURO: Evita errores si el localStorage está vacío
 */
function safeParse(key, fallback = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (e) {
        return fallback;
    }
}

/**
 * GUARDADO LOCAL: Respaldo por si falla el internet
 */
function saveLocal(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(`${key}_last_sync`, new Date().toISOString());
    } catch (e) {
        console.error("Error crítico de espacio local");
    }
}

// --- FUNCIONES DE DATOS (MIGRADO A SUPABASE DIRECTO) ---

/**
 * Obtiene pacientes desde Supabase
 */
async function getPacientes() {
    const id = getClinicaID();
    try {
        const { data, error } = await supabase
            .from('pacientes')
            .select('*')
            .eq('clinica_id', id)
            .order('nombre', { ascending: true });

        if (error) throw error;

        saveLocal(`pacientes_${id}`, data);
        console.log("✅ Pacientes sincronizados desde Supabase");
        return data;
    } catch (err) {
        console.warn("📡 Modo Offline: Usando caché local");
        return safeParse(`pacientes_${id}`, []);
    }
}

/**
 * Obtiene citas desde Supabase
 */
async function getCitas() {
    const id = getClinicaID();
    try {
        const { data, error } = await supabase
            .from('citas')
            .select('*')
            .eq('clinica_id', id);

        if (error) throw error;

        saveLocal(`citas_${id}`, data);
        return data;
    } catch (err) {
        console.warn("📡 Modo Offline: Usando caché de citas");
        return safeParse(`citas_${id}`, []);
    }
}

console.log(`🚀 Storage Engine v${STORAGE_VERSION} (Direct Sync) cargado.`);
