/* =========================
   LAYOUT | Menú lateral único, planes, idioma y navegación global

   El menú se dibuja desde AQUÍ en todas las páginas. En cada HTML solo
   hace falta:  <aside class="sidebar" id="sidebar"></aside>
   y cargar este archivo (si el aside trae el menú viejo, se reemplaza).

   Planes: el plan sale de localStorage("plan"). Si no existe, se asume
   "hospital" (todo habilitado) para no bloquear nada mientras se conecta
   el login. El bloqueo real (servidor) va aparte, esto es la capa de pantalla.
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
    if (typeof traducirEtiquetas === "function") traducirEtiquetas();
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

/* Marcar el link activo al hacer clic (compatibilidad con código viejo) */
function marcarActivoSidebar(btnClickeado) {
    document.querySelectorAll(".sidebar-link[data-nav]").forEach(b => b.classList.remove("active"));
    btnClickeado.classList.add("active");
}

/* Revelar contenido solo cuando ya se aplicó el idioma
   (evita el parpadeo ES -> EN al cargar) */
function revelarContenido() {
    const el = document.querySelector(".app-shell") || document.querySelector(".lang-select-overlay") || document.body;
    el.classList.add("i18n-ready");
}

/* =========================
   MENÚ + PLANES
========================= */
(function () {
    "use strict";

    /* ---------- Planes ----------
       Cada plan incluye todo lo del anterior. */
    const ORDEN = ["esencial", "profesional", "equipo", "hospital"];
    const NOMBRE_PLAN = { esencial: "Esencial", profesional: "Profesional", equipo: "Equipo", hospital: "Hospital" };
    const MAX_USUARIOS = { esencial: 2, profesional: 4, equipo: 10, hospital: Infinity };
    const FUNCIONES_NUEVAS = {
        esencial:    ["agenda", "pacientes", "historial", "recordatorios", "link_publico"],
        profesional: ["asistencia", "cobros", "recall", "reportes", "lista_espera"],
        equipo:      ["por_medico", "auditoria", "depositos"],
        hospital:    ["multi_sede", "soporte_prioritario"]
    };

    function leer(clave) {
        try { return localStorage.getItem(clave); } catch (e) { return null; }
    }
    function planActual() {
        const p = (leer("plan") || "").toLowerCase();
        return ORDEN.indexOf(p) !== -1 ? p : "hospital";
    }
    function tieneFuncion(funcion) {
        const hasta = ORDEN.indexOf(planActual());
        for (let i = 0; i <= hasta; i++) {
            if (FUNCIONES_NUEVAS[ORDEN[i]].indexOf(funcion) !== -1) return true;
        }
        return false;
    }
    function planDeFuncion(funcion) {
        for (let i = 0; i < ORDEN.length; i++) {
            if (FUNCIONES_NUEVAS[ORDEN[i]].indexOf(funcion) !== -1) return ORDEN[i];
        }
        return "hospital";
    }
    window.Plan = {
        actual: planActual,
        tiene: tieneFuncion,
        desde: planDeFuncion,
        nombre: function (p) { return NOMBRE_PLAN[p || planActual()]; },
        maxUsuarios: function () { return MAX_USUARIOS[planActual()]; }
    };

    /* ---------- Página actual ---------- */
    function paginaActual() {
        return window.location.pathname.split("/").pop().replace(".html", "") || "dashboard";
    }
    const NAV_DE_PAGINA = { "configuracion-correo": "config-correo", "historial": "pacientes" };
    function claveNavActual() {
        const p = paginaActual();
        return NAV_DE_PAGINA[p] || p;
    }

    /* Páginas que exigen una función del plan: si no la tiene, va al dashboard */
    const FUNCION_DE_PAGINA = {
        "lista-espera": "lista_espera",
        "reportes": "reportes",
        "auditoria": "auditoria",
        "config-pagos": "depositos"
    };
    function revisarAcceso() {
        const requerida = FUNCION_DE_PAGINA[paginaActual()];
        if (requerida && !tieneFuncion(requerida)) {
            window.location.replace("dashboard.html");
            return false;
        }
        return true;
    }
    if (!revisarAcceso()) return;

    /* ---------- Textos del menú (es / en / fr) ---------- */
    const ETIQUETAS = {
        es: {
            dashboard: "Dashboard", citas: "Citas", lista_espera: "Lista de espera", pacientes: "Pacientes",
            reportes: "Reportes", config: "Configuración", usuarios: "Usuarios",
            config_correo: "Recordatorios por correo", config_pagos: "Pagos", auditoria: "Auditoría",
            logout: "Cerrar sesión", nueva_cita: "Nueva cita", nuevo_paciente: "Agregar paciente",
            funcion_bloqueada: "No incluido en tu plan", desde_plan: "Disponible desde el plan",
            entendido: "Entendido",
            tab_agenda: "Agenda", tab_calendario: "Calendario", tab_nueva: "Nueva cita", tab_solicitudes: "Solicitudes"
        },
        en: {
            dashboard: "Dashboard", citas: "Appointments", lista_espera: "Waitlist", pacientes: "Patients",
            reportes: "Reports", config: "Settings", usuarios: "Users",
            config_correo: "Email reminders", config_pagos: "Payments", auditoria: "Audit log",
            logout: "Log out", nueva_cita: "New appointment", nuevo_paciente: "Add patient",
            funcion_bloqueada: "Not included in your plan", desde_plan: "Available from the plan",
            entendido: "Got it",
            tab_agenda: "Agenda", tab_calendario: "Calendar", tab_nueva: "New appointment", tab_solicitudes: "Requests"
        },
        fr: {
            dashboard: "Tableau de bord", citas: "Rendez-vous", lista_espera: "Liste d'attente", pacientes: "Patients",
            reportes: "Rapports", config: "Configuration", usuarios: "Utilisateurs",
            config_correo: "Rappels par e-mail", config_pagos: "Paiements", auditoria: "Audit",
            logout: "Se déconnecter", nueva_cita: "Nouveau rendez-vous", nuevo_paciente: "Ajouter un patient",
            funcion_bloqueada: "Non inclus dans votre forfait", desde_plan: "Disponible à partir du forfait",
            entendido: "Compris",
            tab_agenda: "Agenda", tab_calendario: "Calendrier", tab_nueva: "Nouveau rendez-vous", tab_solicitudes: "Demandes"
        }
    };
    function t(clave) {
        const lang = leer("lang") || "es";
        const tabla = ETIQUETAS[lang] || ETIQUETAS.es;
        return tabla[clave] || ETIQUETAS.es[clave] || clave;
    }
    function traducirEtiquetas() {
        document.querySelectorAll("[data-k]").forEach(function (el) { el.textContent = t(el.dataset.k); });
        document.querySelectorAll("[data-ktitle]").forEach(function (el) {
            const s = t(el.dataset.ktitle);
            el.title = s;
            el.setAttribute("aria-label", s);
        });
    }
    window.traducirEtiquetas = traducirEtiquetas;

    /* ---------- Iconos ---------- */
    const I = {
        home: '<path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5Z"/>',
        calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
        clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
        users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        chart: '<path d="M3 3v18h18"/><path d="M18.7 8 12 14.7l-3.5-3.5L3 16.5"/>',
        user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        audit: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
        mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
        card: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
        settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
        lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
        plus: '<path d="M12 5v14M5 12h14"/>',
        chev: '<polyline points="6 9 12 15 18 9"/>',
        logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
        shield: '<path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4Z"/><path d="M9 12l2 2 4-4"/>'
    };
    function svg(interior, clase) {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' +
            (clase ? ' class="' + clase + '"' : "") + ">" + interior + "</svg>";
    }

    /* ---------- Estructura del menú ----------
       k: texto | icon | nav: clave para marcar activo | onclick | quick: botón "+"
       funcion: función del plan que lo habilita | roles: quién lo ve */
    const MENU = [
        { nav: "dashboard", k: "dashboard", icon: "home", onclick: "irDashboard()" },
        { nav: "citas", k: "citas", icon: "calendar", onclick: "navCitas('ver')",
          quick: "navCitas('nuevo')", quickK: "nueva_cita", badge: true },
        { nav: "lista-espera", k: "lista_espera", icon: "clock",
          onclick: "window.location.href='lista-espera.html'", funcion: "lista_espera" },
        { nav: "pacientes", k: "pacientes", icon: "users", onclick: "irPacientes('ver')",
          quick: "irPacientes('nuevo')", quickK: "nuevo_paciente" },
        { nav: "reportes", k: "reportes", icon: "chart", liId: "liReportes",
          onclick: "window.location.href='reportes.html'", funcion: "reportes", roles: ["admin", "doctor"] },
        { grupo: "config", k: "config", icon: "settings", items: [
            { nav: "usuarios", k: "usuarios", icon: "user", liId: "liUsuarios",
              onclick: "irUsuarios()", roles: ["admin"] },
            { nav: "config-correo", k: "config_correo", icon: "mail", liId: "liConfigCorreo",
              onclick: "window.location.href='configuracion-correo.html'", roles: ["admin"] },
            { nav: "config-pagos", k: "config_pagos", icon: "card", liId: "liConfigPagos",
              onclick: "window.location.href='config-pagos.html'", funcion: "depositos", roles: ["admin"] },
            { nav: "auditoria", k: "auditoria", icon: "audit", liId: "liAuditoria",
              onclick: "window.location.href='auditoria.html'", funcion: "auditoria", roles: ["admin"] }
        ] }
    ];

    function lbl(clave) {
        return '<span class="lbl" data-k="' + clave + '">' + t(clave) + "</span>";
    }

    function dibujarItem(it, claveActiva, rol) {
        if (it.roles && it.roles.indexOf(rol) === -1) return "";
        const bloqueado = !!(it.funcion && !tieneFuncion(it.funcion));
        const clases = "sidebar-link" + (it.nav === claveActiva ? " active" : "") + (bloqueado ? " locked" : "");
        const accion = bloqueado ? "mostrarAvisoPlan('" + it.funcion + "')" : it.onclick;
        const idBadge = paginaActual() === "dashboard" ? "badgeSolicitudesDashboard" : "badgeSolicitudes";
        const badge = it.badge && !bloqueado
            ? '<span id="' + idBadge + '" class="sidebar-badge" style="display:none;">0</span>' : "";
        const candado = bloqueado ? svg(I.lock, "lock-ico") : "";
        const boton =
            '<button class="' + clases + '" type="button" onclick="' + accion + '" data-nav="' + it.nav + '">' +
            svg(I[it.icon]) + lbl(it.k) + badge + candado + "</button>";
        const rapido = (it.quick && !bloqueado)
            ? '<button class="sidebar-quick" type="button" onclick="' + it.quick + '" data-ktitle="' + it.quickK + '" ' +
              'title="' + t(it.quickK) + '" aria-label="' + t(it.quickK) + '">' + svg(I.plus) + "</button>"
            : "";
        const contenido = rapido ? '<div class="sidebar-row">' + boton + rapido + "</div>" : boton;
        return "<li" + (it.liId ? ' id="' + it.liId + '"' : "") + ">" + contenido + "</li>";
    }

    function dibujarGrupo(g, claveActiva, rol) {
        const hijos = g.items.map(function (i) { return dibujarItem(i, claveActiva, rol); }).filter(Boolean);
        if (!hijos.length) return "";
        const abierto = g.items.some(function (i) { return i.nav === claveActiva; });
        return '<li class="sidebar-group' + (abierto ? " open" : "") + '">' +
            '<button class="sidebar-link sidebar-group-toggle" type="button" onclick="toggleGrupoMenu(this)" aria-expanded="' + abierto + '">' +
            svg(I[g.icon]) + lbl(g.k) + svg(I.chev, "chev") + "</button>" +
            '<ul class="sidebar-sub">' + hijos.join("") + "</ul></li>";
    }

    function dibujarMenu() {
        const aside = document.getElementById("sidebar");
        if (!aside) return;
        const rol = leer("rol");
        const clave = claveNavActual();
        const lista = MENU.map(function (it) {
            return it.grupo ? dibujarGrupo(it, clave, rol) : dibujarItem(it, clave, rol);
        }).join("");
        aside.innerHTML =
            '<div class="sidebar-brand">' +
              '<div class="sidebar-brand-icon">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + I.shield + "</svg>" +
              "</div>" +
              '<span class="sidebar-brand-name">ClinicOS</span>' +
            "</div>" +
            '<ul class="sidebar-nav">' + lista + "</ul>" +
            '<div class="sidebar-divider"></div>' +
            '<button class="sidebar-link danger-link" type="button" onclick="logout()" id="btnLogout">' +
              svg(I.logout) + lbl("logout") +
            "</button>";
    }
    window.renderSidebar = dibujarMenu;

    /* ---------- Acciones del menú ---------- */
    window.irDashboard = function () {
        if (paginaActual() === "dashboard") { closeSidebar(); return; }
        window.location.href = "dashboard.html";
    };

    /* Citas: dentro de citas.html cambia de pestaña sin recargar */
    window.navCitas = function (modo) {
        if (paginaActual() === "citas" && typeof cambiarVista === "function") {
            cambiarVista(modo);
            history.replaceState(null, "", "citas.html?mode=" + modo);
            marcarActivo();
            if (typeof marcarTabsCitas === "function") marcarTabsCitas(modo);
            closeSidebar();
        } else {
            window.location.href = "citas.html?mode=" + modo;
        }
    };

    window.toggleGrupoMenu = function (btn) {
        const grupo = btn.closest(".sidebar-group");
        if (!grupo) return;
        const abierto = grupo.classList.toggle("open");
        btn.setAttribute("aria-expanded", abierto);
    };

    function marcarActivo() {
        const clave = claveNavActual();
        document.querySelectorAll(".sidebar-link[data-nav]").forEach(function (b) {
            b.classList.toggle("active", b.dataset.nav === clave);
        });
        document.querySelectorAll(".sidebar-group").forEach(function (g) {
            if (g.querySelector(".sidebar-sub .sidebar-link.active")) g.classList.add("open");
        });
    }
    window.marcarLinkActivoPorURL = marcarActivo;

    /* ---------- Aviso de función no incluida ---------- */
    window.mostrarAvisoPlan = function (funcion) {
        window.cerrarAvisoPlan();
        const plan = planDeFuncion(funcion);
        const capa = document.createElement("div");
        capa.id = "planAvisoOverlay";
        capa.className = "plan-aviso-overlay";
        capa.setAttribute("role", "dialog");
        capa.setAttribute("aria-modal", "true");
        capa.addEventListener("click", function (e) { if (e.target === capa) window.cerrarAvisoPlan(); });
        capa.innerHTML =
            '<div class="plan-aviso">' +
              '<div class="plan-aviso-icon">' + svg(I.lock) + "</div>" +
              "<h3>" + t("funcion_bloqueada") + "</h3>" +
              "<p>" + t("desde_plan") + " <strong>" + NOMBRE_PLAN[plan] + "</strong>.</p>" +
              '<button type="button" onclick="cerrarAvisoPlan()">' + t("entendido") + "</button>" +
            "</div>";
        document.body.appendChild(capa);
    };
    window.cerrarAvisoPlan = function () {
        const capa = document.getElementById("planAvisoOverlay");
        if (capa) capa.remove();
    };
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") window.cerrarAvisoPlan();
    });

    /* ---------- Estilos propios del menú, pestañas y aviso ---------- */
    function inyectarEstilos() {
        if (document.getElementById("layout-estilos")) return;
        const todas = [].concat.apply([], ORDEN.map(function (p) { return FUNCIONES_NUEVAS[p]; }));
        const ocultar = todas.map(function (f) {
            return 'body.sin-' + f + ' [data-requiere="' + f + '"]';
        }).join(",\n") + " { display: none !important; }\n";
        const css = `
.sidebar-nav .sidebar-row { display: flex; align-items: center; gap: 6px; }
.sidebar-nav .sidebar-row .sidebar-link { flex: 1; min-width: 0; }
.sidebar-nav .sidebar-quick { flex: none; width: 28px; height: 28px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; background: transparent; border: 1px solid rgba(148,163,184,.25); color: #94a3b8; cursor: pointer; box-shadow: none; transform: none; }
.sidebar-nav .sidebar-quick:hover { background: rgba(148,163,184,.14); color: #fff; transform: none; }
.sidebar-nav .sidebar-quick svg { width: 14px; height: 14px; }
.sidebar-nav .sidebar-badge { margin-left: auto; background: #f59e0b; color: #1e1409; font-size: 11px; font-weight: 700; border-radius: 999px; padding: 1px 7px; }
.sidebar-nav .sidebar-link.locked { opacity: .55; }
.sidebar-nav .sidebar-link .lock-ico { margin-left: auto; width: 14px; height: 14px; flex: none; }
.sidebar-nav .sidebar-group-toggle .chev { margin-left: auto; width: 14px; height: 14px; flex: none; transition: transform .2s ease; }
.sidebar-nav .sidebar-group.open > .sidebar-group-toggle .chev { transform: rotate(180deg); }
.sidebar-nav .sidebar-sub { display: none; list-style: none; margin: 2px 0 4px 18px; padding: 0 0 0 8px; border-left: 1px solid rgba(148,163,184,.2); }
.sidebar-nav .sidebar-group.open > .sidebar-sub { display: block; }

.tabs-bar { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; margin-bottom: 20px; border-bottom: 1px solid rgba(148,163,184,.2); }
.tabs-bar .tab-btn { width: auto; flex: none; background: transparent; color: #94a3b8; border: none; border-bottom: 2px solid transparent; border-radius: 0; padding: 10px 14px; margin-bottom: -1px; font-weight: 600; cursor: pointer; box-shadow: none; transform: none; display: inline-flex; align-items: center; gap: 8px; }
.tabs-bar .tab-btn:hover { color: #e2e8f0; background: transparent; transform: none; }
.tabs-bar .tab-btn.active { color: #93c5fd; border-bottom-color: #3b82f6; }
.tabs-bar .tab-btn svg { width: 15px; height: 15px; }
.tabs-bar .tab-btn.tab-primary { margin-left: auto; margin-bottom: 6px; border: none; border-radius: 8px; background: #16a34a; color: #fff; padding: 8px 14px; }
.tabs-bar .tab-btn.tab-primary:hover { background: #15803d; color: #fff; }
.tabs-bar .tab-btn.tab-primary.active { box-shadow: 0 0 0 2px rgba(34,197,94,.4); }
.tabs-bar .tab-badge { background: #ef4444; color: #fff; font-size: 11px; font-weight: 700; border-radius: 999px; padding: 1px 7px; }

.plan-aviso-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(2,6,23,.7); }
.plan-aviso { width: 100%; max-width: 380px; background: #0f172a; border: 1px solid rgba(148,163,184,.25); border-radius: 14px; padding: 26px 24px; text-align: center; color: #e2e8f0; }
.plan-aviso .plan-aviso-icon { width: 44px; height: 44px; margin: 0 auto 14px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(245,158,11,.15); color: #f59e0b; }
.plan-aviso .plan-aviso-icon svg { width: 20px; height: 20px; }
.plan-aviso h3 { margin: 0 0 8px; font-size: 17px; }
.plan-aviso p { margin: 0 0 20px; font-size: 14px; color: #94a3b8; }

/* Todo elemento con data-requiere="funcion" se oculta si el plan no la incluye */
` + ocultar;
        const st = document.createElement("style");
        st.id = "layout-estilos";
        st.textContent = css;
        document.head.appendChild(st);
    }

    function aplicarPlanAlBody() {
        const todas = [].concat.apply([], ORDEN.map(function (p) { return FUNCIONES_NUEVAS[p]; }));
        todas.forEach(function (f) { document.body.classList.toggle("sin-" + f, !tieneFuncion(f)); });
        document.body.dataset.plan = planActual();
    }

    /* session.js la llama cuando lee el plan real de la clínica en Supabase */
    window.aplicarPlanYMenu = function () {
        const idsBadge = ["badgeSolicitudes", "badgeSolicitudesDashboard"];
        const previos = idsBadge.map(function (id) {
            const el = document.getElementById(id);
            return el ? { id: id, texto: el.textContent, display: el.style.display } : null;
        }).filter(Boolean);
        aplicarPlanAlBody();
        dibujarMenu();
        traducirEtiquetas();
        previos.forEach(function (p) {
            const el = document.getElementById(p.id);
            if (el) { el.textContent = p.texto; el.style.display = p.display; }
        });
        revisarAcceso();
    };

    function iniciar() {
        inyectarEstilos();
        aplicarPlanAlBody();
        dibujarMenu();
        traducirEtiquetas();
    }
    if (document.body) iniciar();
    else document.addEventListener("DOMContentLoaded", iniciar);
})();
