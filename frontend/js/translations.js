const translations = {
    es: {
        cargando: "Cargando clínica...",
        usuario: "Usuario",
        password: "Contraseña",
        ingresar: "Ingresar",
        error_auth: "Usuario o contraseña incorrectos",
        bienvenida: "Bienvenido de nuevo",
        menu_dashboard: "Panel Principal",
        menu_pacientes: "Gestión de Pacientes",
        menu_citas: "Agenda de Citas",
        btn_nuevo: "Nuevo Registro",
        buscar: "Buscar...",
        guardar: "Guardar Cambios",
        cancelar: "Cancelar"
    },
    en: {
        cargando: "Loading clinic...",
        usuario: "Username",
        password: "Password",
        ingresar: "Login",
        error_auth: "Incorrect username or password",
        bienvenida: "Welcome back",
        menu_dashboard: "Dashboard",
        menu_pacientes: "Patient Management",
        menu_citas: "Appointments",
        btn_nuevo: "Add New",
        buscar: "Search...",
        guardar: "Save Changes",
        cancelar: "Cancel"
    },
    fr: {
        cargando: "Chargement de la clinique...",
        usuario: "Utilisateur",
        password: "Mot de passe",
        ingresar: "Se connecter",
        error_auth: "Identifiant ou mot de passe incorrect",
        bienvenida: "Bienvenue à nouveau",
        menu_dashboard: "Tableau de bord",
        menu_pacientes: "Gestion des patients",
        menu_citas: "Rendez-vous",
        btn_nuevo: "Ajouter nouveau",
        buscar: "Chercher...",
        guardar: "Sauvegarder",
        cancelar: "Annuler"
    }
};

function changeLanguage(lang) {
    const texts = translations[lang];
    if(!texts) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (texts[key]) el.innerText = texts[key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (texts[key]) el.placeholder = texts[key];
    });
}
