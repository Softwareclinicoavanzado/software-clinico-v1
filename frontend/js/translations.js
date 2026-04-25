/* =============================================
    DICCIONARIO DE IDIOMAS | ClinicOS
============================================= */

const translations = {
    es: {
        // Login & Carga
        cargando: "Cargando clínica...",
        usuario: "Usuario",
        password: "Contraseña",
        ingresar: "Ingresar",
        error_auth: "Usuario o contraseña incorrectos",
        bienvenida: "Bienvenido de nuevo",

        // Dashboard (Estadísticas y Menú)
        pacientes_registrados: "Pacientes Registrados",
        citas_agendadas: "Citas Agendadas",
        ver_pacientes: "👥 Ver Pacientes",
        agregar_paciente: "➕ Agregar Paciente",
        ver_agenda: "📅 Ver Agenda",
        agendar_cita: "⏰ Agendar Cita",
        cerrar_sesion: "Cerrar sesión",

        // Gestión General (Botones comunes)
        btn_nuevo: "Nuevo Registro",
        buscar: "Buscar...",
        guardar: "Guardar Cambios",
        cancelar: "Cancelar",
        volver: "Volver al Inicio"
    },
    en: {
        // Login & Carga
        cargando: "Loading clinic...",
        usuario: "Username",
        password: "Password",
        ingresar: "Login",
        error_auth: "Incorrect username or password",
        bienvenida: "Welcome back",

        // Dashboard (Estadísticas y Menú)
        pacientes_registrados: "Registered Patients",
        citas_agendadas: "Scheduled Appointments",
        ver_pacientes: "👥 View Patients",
        agregar_paciente: "➕ Add Patient",
        ver_agenda: "📅 View Agenda",
        agendar_cita: "⏰ Schedule Appointment",
        cerrar_sesion: "Logout",

        // Gestión General
        btn_nuevo: "Add New",
        buscar: "Search...",
        guardar: "Save Changes",
        cancelar: "Cancel",
        volver: "Back to Home"
    },
    fr: {
        // Login & Carga
        cargando: "Chargement de la clinique...",
        usuario: "Utilisateur",
        password: "Mot de passe",
        ingresar: "Se connecter",
        error_auth: "Identifiant ou mot de passe incorrect",
        bienvenida: "Bienvenue à nouveau",

        // Dashboard (Estadísticas y Menú)
        pacientes_registrados: "Patients enregistrés",
        citas_agendadas: "Rendez-vous prévus",
        ver_pacientes: "👥 Voir les patients",
        agregar_paciente: "➕ Ajouter un patient",
        ver_agenda: "📅 Voir l'agenda",
        agendar_cita: "⏰ Prendre rendez-vous",
        cerrar_sesion: "Se déconnecter",

        // Gestión General
        btn_nuevo: "Ajouter nouveau",
        buscar: "Chercher...",
        guardar: "Sauvegarder",
        cancelar: "Annuler",
        volver: "Retour à l'accueil"
    }
};

/**
 * Función maestra para cambiar el idioma en el DOM
 */
function changeLanguage(lang) {
    const texts = translations[lang];
    if (!texts) return;

    // Traducir elementos con atributo data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (texts[key]) {
            // Si el elemento tiene un icono (span/i), intentamos mantenerlo
            const icon = el.querySelector('span, i');
            if (icon) {
                el.innerHTML = ''; 
                el.appendChild(icon);
                el.innerHTML += ' ' + texts[key].replace(/^[^\w\s]+/, '').trim();
            } else {
                el.innerText = texts[key];
            }
        }
    });

    // Traducir Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (texts[key]) el.placeholder = texts[key];
    });
}
