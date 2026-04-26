/* =============================================
    DICCIONARIO DE IDIOMAS GLOBAL | ClinicOS
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

        // Dashboard
        pacientes_registrados: "Pacientes Registrados",
        citas_agendadas: "Citas Agendadas",
        ver_pacientes: "👥 Ver Pacientes",
        agregar_paciente: "➕ Agregar Paciente",
        ver_agenda: "📅 Ver Agenda",
        agendar_cita: "⏰ Agendar Cita",
        cerrar_sesion: "Cerrar sesión",

        // Gestión de Pacientes
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

        // Gestión de Citas
        gestion_citas: "Gestión de Citas",
        nueva_cita: "➕ Nueva Cita",
        agendar_nueva_cita: "📝 Agendar Nueva Cita",
        paciente_label: "Paciente",
        seleccione_paciente: "Seleccione un paciente",
        fecha_label: "Fecha",
        hora_label: "Hora",
        confirmar_agendar: "Confirmar y Agendar",
        citas_programadas: "📋 Citas Programadas",

        // ✅ Historial Clínico
        historial_titulo: "Historial Clínico",
        historial_nueva_nota: "📝 Redactar Nota Médica",
        historial_tipo_nota: "Tipo de nota",
        historial_detalle: "Detalle de la nota",
        historial_placeholder_nota: "Escribir nota médica detallada o descripción de la alergia...",
        historial_guardar_nota: "Guardar Nota Médica",
        historial_registros: "📋 Registros del Historial",
        historial_exportar_pdf: "📄 PDF",
        historial_sin_registros: "No hay registros médicos en este historial.",
        historial_tipo_consulta: "Consulta",
        historial_tipo_diagnostico: "Diagnóstico",
        historial_tipo_seguimiento: "Seguimiento",
        historial_tipo_receta: "Receta",
        historial_tipo_alergia: "⚠️ Alergia",
        historial_eliminar: "Eliminar",
        historial_volver: "Volver",
        historial_nueva_nota_titulo: "Nueva Nota Médica",
        historial_gestion_titulo: "Gestión de Historial",

        // General
        btn_nuevo: "Nuevo Registro",
        buscar: "Buscar...",
        guardar: "Guardar Cambios",
        cancelar: "Cancelar",
        volver: "Volver al Inicio",
        volver_inicio: "Volver al Inicio"
    },
    en: {
        // Login & Carga
        cargando: "Loading clinic...",
        usuario: "Username",
        password: "Password",
        ingresar: "Login",
        error_auth: "Incorrect username or password",
        bienvenida: "Welcome back",

        // Dashboard
        pacientes_registrados: "Registered Patients",
        citas_agendadas: "Scheduled Appointments",
        ver_pacientes: "👥 View Patients",
        agregar_paciente: "➕ Add Patient",
        ver_agenda: "📅 View Agenda",
        agendar_cita: "⏰ Schedule Appointment",
        cerrar_sesion: "Logout",

        // Gestión de Pacientes
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

        // Gestión de Citas
        gestion_citas: "Appointment Management",
        nueva_cita: "➕ New Appointment",
        agendar_nueva_cita: "📝 Schedule New Appointment",
        paciente_label: "Patient",
        seleccione_paciente: "Select a patient",
        fecha_label: "Date",
        hora_label: "Time",
        confirmar_agendar: "Confirm and Schedule",
        citas_programadas: "📋 Scheduled Appointments",

        // ✅ Historial Clínico
        historial_titulo: "Clinical Record",
        historial_nueva_nota: "📝 Write Medical Note",
        historial_tipo_nota: "Note type",
        historial_detalle: "Note detail",
        historial_placeholder_nota: "Write detailed medical note or allergy description...",
        historial_guardar_nota: "Save Medical Note",
        historial_registros: "📋 Medical Records",
        historial_exportar_pdf: "📄 PDF",
        historial_sin_registros: "No medical records in this history.",
        historial_tipo_consulta: "Consultation",
        historial_tipo_diagnostico: "Diagnosis",
        historial_tipo_seguimiento: "Follow-up",
        historial_tipo_receta: "Prescription",
        historial_tipo_alergia: "⚠️ Allergy",
        historial_eliminar: "Delete",
        historial_volver: "Go Back",
        historial_nueva_nota_titulo: "New Medical Note",
        historial_gestion_titulo: "Record Management",

        // General
        btn_nuevo: "Add New",
        buscar: "Search...",
        guardar: "Save Changes",
        cancelar: "Cancel",
        volver: "Back to Home",
        volver_inicio: "Back to Home"
    },
    fr: {
        // Login & Carga
        cargando: "Chargement de la clinique...",
        usuario: "Utilisateur",
        password: "Mot de passe",
        ingresar: "Se connecter",
        error_auth: "Identifiant ou mot de passe incorrect",
        bienvenida: "Bienvenue à nouveau",

        // Dashboard
        pacientes_registrados: "Patients enregistrés",
        citas_agendadas: "Rendez-vous prévus",
        ver_pacientes: "👥 Voir les patients",
        agregar_paciente: "➕ Ajouter un patient",
        ver_agenda: "📅 Voir l'agenda",
        agendar_cita: "⏰ Prendre rendez-vous",
        cerrar_sesion: "Se déconnecter",

        // Gestión de Pacientes
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

        // Gestión de Citas
        gestion_citas: "Gestion des Rendez-vous",
        nueva_cita: "➕ Nouveau Rendez-vous",
        agendar_nueva_cita: "📝 Prendre un nouveau rendez-vous",
        paciente_label: "Patient",
        seleccione_paciente: "Sélectionner un patient",
        fecha_label: "Date",
        hora_label: "Heure",
        confirmar_agendar: "Confirmer et planifier",
        citas_programadas: "📋 Rendez-vous programmés",

        // ✅ Historial Clínico
        historial_titulo: "Dossier Médical",
        historial_nueva_nota: "📝 Rédiger une Note Médicale",
        historial_tipo_nota: "Type de note",
        historial_detalle: "Détail de la note",
        historial_placeholder_nota: "Écrire une note médicale détaillée ou description d'allergie...",
        historial_guardar_nota: "Sauvegarder la Note",
        historial_registros: "📋 Dossiers Médicaux",
        historial_exportar_pdf: "📄 PDF",
        historial_sin_registros: "Aucun dossier médical dans cet historique.",
        historial_tipo_consulta: "Consultation",
        historial_tipo_diagnostico: "Diagnostic",
        historial_tipo_seguimiento: "Suivi",
        historial_tipo_receta: "Ordonnance",
        historial_tipo_alergia: "⚠️ Allergie",
        historial_eliminar: "Supprimer",
        historial_volver: "Retour",
        historial_nueva_nota_titulo: "Nouvelle Note Médicale",
        historial_gestion_titulo: "Gestion du Dossier",

        // General
        btn_nuevo: "Ajouter nouveau",
        buscar: "Chercher...",
        guardar: "Sauvegarder",
        cancelar: "Annuler",
        volver: "Retour à l'accueil",
        volver_inicio: "Retour à l'accueil"
    }
};

/**
 * Función maestra para cambiar el idioma en el DOM
 */
function changeLanguage(lang) {
    const texts = translations[lang];
    if (!texts) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (texts[key]) {
            const icon = el.querySelector('span, i');
            if (icon) {
                el.innerHTML = '';
                el.appendChild(icon);
                const cleanText = texts[key].replace(/^[^\w\sáéíóúÁÉÍÓÚñÑ]+/, '').trim();
                el.innerHTML += ' ' + cleanText;
            } else {
                el.innerText = texts[key];
            }
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (texts[key]) el.placeholder = texts[key];
    });
}
