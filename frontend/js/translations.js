/* =============================================
    DICCIONARIO DE IDIOMAS | ClinicOS
============================================= */

const translations = {
    es: {
        cargando: "Cargando clínica...",
        usuario: "Usuario",
        password: "Contraseña",
        ingresar: "Ingresar",
        error_auth: "Usuario o contraseña incorrectos",
        bienvenida: "Bienvenido de nuevo"
    },
    en: {
        cargando: "Loading clinic...",
        usuario: "Username",
        password: "Password",
        ingresar: "Login",
        error_auth: "Incorrect username or password",
        bienvenida: "Welcome back"
    },
    fr: {
        cargando: "Chargement de la clinique...",
        usuario: "Utilisateur",
        password: "Mot de passe",
        ingresar: "Se connecter",
        error_auth: "Identifiant ou mot de passe incorrect",
        bienvenida: "Bienvenue à nouveau"
    }
};

function changeLanguage(lang) {
    const texts = translations[lang];

    // Traducir textos normales (data-i18n)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (texts[key]) el.innerText = texts[key];
    });

    // Traducir Placeholders de los inputs (data-i18n-placeholder)
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (texts[key]) el.placeholder = texts[key];
    });
}
