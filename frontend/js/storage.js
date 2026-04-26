/* =============================================
    STORAGE MANAGER PRO++ (SUPABASE SYNC ENABLED)
============================================= */
const STORAGE_VERSION = "1.3.1";

// --- CONFIGURACIÓN DE SUPABASE ---
// URL y Key proporcionadas por el usuario
const supabaseUrl = 'https://klaygjvawybfksmahbhd.supabase.co';
const supabaseKey = 'sb_publishable_ZoyBvw_JncKIesGmjEpEuA_dSIZZV4Z';

// Inicialización del cliente de Supabase usando el SDK cargado en el HTML
// Nota: Usamos 'supabase.createClient' porque la librería v2 se registra globalmente así
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

/**
 * Obtiene el ID de la clínica actual desde el localStorage
 */
function getClinicaID() {
    return localStorage.getItem("clinicaID") || "temp_clinic"; 
}

/**
 * PARSE SEGURO: Evita errores si el localStorage está vacío o corrupto
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
 * GUARDADO LOCAL: Respaldo para funcionamiento offline
 */
function saveLocal(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(`${key}_last_sync`, new Date().toISOString());
    } catch (e) {
        console.error("Error crítico de espacio local");
    }
}

// --- FUNCIONES DE DATOS (ACCESO DIRECTO A SUPABASE) ---

/**
 * Obtiene la lista de pacientes desde la tabla 'pacientes'
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
        console.log("✅ Pacientes sincronizados con éxito desde la nube");
        return data;
    } catch (err) {
        console.warn("📡 Modo Offline: Cargando datos desde caché local");
        return safeParse(`pacientes_${id}`, []);
    }
}

/**
 * Obtiene la lista de citas desde la tabla 'citas'
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

console.log(`🚀 ClinicOS Storage Engine v${STORAGE_VERSION} conectado a Supabase.`);
