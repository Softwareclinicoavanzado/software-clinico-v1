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
   NAVEGACIÓN GLOBAL (antes vivía solo en dashboard.js, por eso
   no funcionaba en las demás páginas — ahora está disponible en todo el sistema)
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
