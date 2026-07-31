/* =========================
   LAYOUT | Menú lateral, selector de idioma y navegación global
========================= */
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    if (sidebar) sidebar.classList.toggle("open");
    if (overlay) overlay.classList.toggle("open");
}
function closeSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    if (sidebar) sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
}
function toggleLangDropdown() {
    const dropdown = document.getElementById("langDropdown");
    const btn = document.getElementById("langMainBtn");
    if (dropdown) dropdown.classList.toggle("open");
    if (btn) btn.classList.toggle("open");
}
function seleccionarIdioma(lang) {
    localStorage.setItem("lang", lang);
    if (typeof changeLanguage === "function") changeLanguage(lang);
    actualizarBotonIdioma();
    if (typeof retraducirContenidoDinamico === "function") retraducirContenidoDinamico();
    toggleLangDropdown();
}
function actualizarBotonIdioma() {
    const lang = localStorage.getItem("lang") || "es";
    const nombres = { es: "ES", en: "EN", fr: "FR" };
    const banderas = { es: "🇲🇽", en: "🇺🇸", fr: "🇫🇷" };
    const btnTexto = document.getElementById("langBtnTexto");
    const btnFlag = document.getElementById("langFlagActual");
    if (btnTexto) btnTexto.innerText = nombres[lang] || "ES";
    if (btnFlag) btnFlag.innerText = banderas[lang] || "🇲🇽";
    document.querySelectorAll(".lang-option").forEach(el => {
        el.classList.toggle("active", el.dataset.lang === lang);
    });
}
document.addEventListener("click", (e) => {
    const switcher = document.querySelector(".lang-switcher");
    const dropdown = document.getElementById("langDropdown");
    if (switcher && dropdown && !switcher.contains(e.target)) {
        dropdown.classList.remove("open");
        const btn = document.getElementById("langMainBtn");
        if (btn) btn.classList.remove("open");
    }
});
document.addEventListener("DOMContentLoaded", actualizarBotonIdioma);

/* =========================
   NAVEGACIÓN GLOBAL (disponible en todas las páginas)
========================= */
window.irPacientes = function(modo) {
    window.location.href = `pacientes.html?mode=${modo}`;
};
window.irCitas = function(modo) {
    window.location.href = `citas.html?mode=${modo}`;
};
window.irUsuarios = function() {
    window.location.href = `usuarios.html`;
};
window.logout = function() {
    if (typeof cerrarSesion === "function") {
        cerrarSesion();
    } else {
        localStorage.clear();
        window.location.replace("index.html");
    }
};

/* =========================
   Mostrar/ocultar "Gestionar Usuarios" y "Auditoría" en el sidebar
   según el rol (corre en TODAS las páginas, no solo en el dashboard)
========================= */
document.addEventListener("DOMContentLoaded", () => {
    const rol = localStorage.getItem("rol");
    const liUsuarios = document.getElementById("liUsuarios");
    const liAuditoria = document.getElementById("liAuditoria");
    if (rol === "admin") {
        if (liUsuarios) liUsuarios.style.display = "block";
        if (liAuditoria) liAuditoria.style.display = "block";
    }
});

/* =========================
   Marcar dinámicamente el link activo del sidebar
   según la página y el ?mode= actual en la URL
========================= */
function marcarLinkActivoPorURL() {
    const pagina = window.location.pathname.split("/").pop().replace(".html", "") || "dashboard";
    const params = new URLSearchParams(window.location.search);
    const modo = params.get("mode") || "ver";
    let clave = pagina;
    if (pagina === "pacientes" || pagina === "citas") clave = `${pagina}-${modo}`;

    document.querySelectorAll(".sidebar-link[data-nav]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.nav === clave);
    });
}
document.addEventListener("DOMContentLoaded", marcarLinkActivoPorURL);

/* =========================
   Marcar el link activo al hacer clic (para citas.html,
   que cambia de vista sin recargar la página)
========================= */
function marcarActivoSidebar(btnClickeado) {
    document.querySelectorAll(".sidebar-link[data-nav]").forEach(b => b.classList.remove("active"));
    btnClickeado.classList.add("active");
}

/* =========================
   Revelar contenido solo cuando ya se aplicó el idioma
   (evita el parpadeo ES -> EN al cargar)
========================= */
function revelarContenido() {
    const el = document.querySelector(".app-shell") || document.querySelector(".lang-select-overlay") || document.body;
    el.classList.add("i18n-ready");
}
