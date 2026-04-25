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

        // Gestión de Pacientes (Campos del Formulario)
        gestion_pacientes: "Gestión de Pacientes",
        nombre_completo: "Nombre completo",
        dpi_label: "DPI (Identificación)",
        edad_label: "Edad",
        telefono_label: "Teléfono",
        fecha_nacimiento: "Fecha de Nacimiento:",
        seleccionar_sexo: "Seleccionar Sexo",
        sexo_hombre: "Hombre",
        sexo_mujer: "Mujer",
        sexo_otro: "Otro",
        contacto_emergencia_label: "Contacto de emergencia",
        seguro_nombre: "Nombre del Seguro",
        seguro_numero: "Número del Seguro",
        medico_asignado_label: "Médico Asignado",
        sede_label: "Sede o Sucursal",
        btn_añadir: "Añadir al Sistema",
        buscar_placeholder: "🔍 Buscar por nombre, DPI...",
        volver_dashboard: "Volver al Dashboard",

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

        // Gestión de Pacientes (Campos del Formulario)
        gestion_pacientes: "Patient Management",
        nombre_completo: "Full Name",
        dpi_label: "ID Number",
        edad_label: "Age",
        telefono_label: "Phone",
        fecha_nacimiento: "Date of Birth:",
        seleccionar_sexo: "Select Gender",
        sexo_hombre: "Male",
        sexo_mujer: "Female",
        sexo_otro: "Other",
        contacto_emergencia_label: "Emergency Contact",
        seguro_nombre: "Insurance Provider",
        seguro_numero: "Policy Number",
        medico_asignado_label: "Assigned Doctor",
        sede_label: "Branch/Office",
        btn_añadir: "Add to System",
        buscar_placeholder: "🔍 Search by name, ID...",
        volver_dashboard: "Back to Dashboard",

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

        // Gestión de Pacientes (Campos del Formulario)
        gestion_pacientes: "Gestion des Patients",
        nombre_completo: "Nom complet",
        dpi_label: "Numéro d'identité",
        edad_label: "Âge",
        telefono_label: "Téléphone",
        fecha_nacimiento: "Date de naissance:",
        seleccionar_sexo: "Sélectionner le sexe",
        sexo_hombre: "Homme",
        sexo_mujer: "Femme",
        sexo_otro: "Autre",
        contacto_emergencia_label: "Contact d'urgence",
        seguro_nombre: "Compagnie d'assurance",
        seguro_numero: "Numéro de police",
        medico_asignado_label: "Médecin assigné",
        sede_label: "Succursale",
        btn_añadir: "Ajouter au système",
        buscar_placeholder: "🔍 Rechercher par nom, ID...",
        volver_dashboard: "Retour au tableau de bord",

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
            const icon = el.querySelector('span, i');
            if (icon) {
                // Preservar icono si existe
                el.innerHTML = ''; 
                el.appendChild(icon);
                // Limpiar el texto traducido de emojis iniciales para evitar duplicados
                const cleanText = texts[key].replace(/^[^\w\sáéíóúÁÉÍÓÚñÑ]+/, '').trim();
                el.innerHTML += ' ' + cleanText;
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
