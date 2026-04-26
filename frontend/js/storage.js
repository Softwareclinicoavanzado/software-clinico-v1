/* =============================================
    STORAGE MANAGER PRO++ (SUPABASE SYNC ENABLED)
============================================= */
const STORAGE_VERSION = "1.3.1";

const supabaseUrl = 'https://klaygjvawybfksmahbhd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsYXlnanZhd3liZmtzbWFoYmhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTcyNDUsImV4cCI6MjA5MTMzMzI0NX0.YKwGPFw29rsxe-mfyga5jTGIQYM7SNFDXvogE2WAx1Y';

// ✅ CORRECCIÓN CRÍTICA
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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
