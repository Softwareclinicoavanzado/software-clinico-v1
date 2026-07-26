/* =========================
   LAYOUT | Control del menú lateral (móvil) y selector de idioma
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

// Cierra el dropdown si haces clic afuera
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
