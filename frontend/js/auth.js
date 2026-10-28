/* =========================
   LOGIN | ClinicOS (Auth real)

   Controla la pantalla de login (index.html):
   - idioma (se recuerda y se detecta del navegador la primera vez)
   - validación y mensajes claros
   - inicio de sesión contra Supabase Auth
   - bloqueo de cuentas desactivadas o de clínicas suspendidas
   - guarda en localStorage clínica, rol y PLAN antes de entrar al dashboard
========================= */
(function () {
    "use strict";

    const IDIOMAS = ["es", "en", "fr"];
    const BANDERAS = { es: "🇲🇽", en: "🇺🇸", fr: "🇫🇷" };

    const T = {
        es: {
            titulo: "Bienvenido de nuevo",
            subtitulo: "Ingresa a tu clínica para continuar",
            correo: "Correo electrónico",
            password: "Contraseña",
            ph_correo: "nombre@clinica.com",
            ph_password: "Tu contraseña",
            ingresar: "Ingresar",
            ingresando: "Ingresando...",
            mostrar: "Mostrar contraseña",
            ocultar: "Ocultar contraseña",
            ayuda: "¿Olvidaste tu contraseña? Pídele a tu administrador que la restablezca.",
            brand_tag: "Tu clínica, organizada.",
            brand_sub: "Agenda, recordatorios y expediente clínico en un solo lugar.",
            b1: "Recordatorios automáticos que reducen las inasistencias",
            b2: "Expediente clínico seguro, con acceso según el rol",
            b3: "Reportes de asistencia y cobros",
            incompleto: "Completa todos los campos",
            credenciales: "Correo o contraseña incorrectos",
            sin_perfil: "Tu cuenta no tiene un perfil asignado. Contacta al administrador.",
            desactivada: "Tu cuenta ha sido desactivada. Contacta al administrador.",
            suspendida: "Tu período de prueba terminó o la cuenta de tu clínica está suspendida. Contacta al equipo de ClinicOS para activarla.",
            sin_clinica: "No se encontró la clínica de tu cuenta. Contacta al administrador.",
            conexion: "No se pudo conectar. Revisa tu internet e inténtalo de nuevo."
        },
        en: {
            titulo: "Welcome back",
            subtitulo: "Sign in to your clinic to continue",
            correo: "Email",
            password: "Password",
            ph_correo: "name@clinic.com",
            ph_password: "Your password",
            ingresar: "Sign in",
            ingresando: "Signing in...",
            mostrar: "Show password",
            ocultar: "Hide password",
            ayuda: "Forgot your password? Ask your administrator to reset it.",
            brand_tag: "Your clinic, organized.",
            brand_sub: "Scheduling, reminders and clinical records in one place.",
            b1: "Automatic reminders that reduce no-shows",
            b2: "Secure clinical records with role-based access",
            b3: "Attendance and payment reports",
            incompleto: "Please fill all fields",
            credenciales: "Incorrect email or password",
            sin_perfil: "Your account has no assigned profile. Contact the administrator.",
            desactivada: "Your account has been deactivated. Contact the administrator.",
            suspendida: "Your trial has ended or your clinic's account is suspended. Contact the ClinicOS team to activate it.",
            sin_clinica: "Your account's clinic could not be found. Contact the administrator.",
            conexion: "Could not connect. Check your internet and try again."
        },
        fr: {
            titulo: "Content de vous revoir",
            subtitulo: "Connectez-vous à votre clinique pour continuer",
            correo: "E-mail",
            password: "Mot de passe",
            ph_correo: "nom@clinique.com",
            ph_password: "Votre mot de passe",
            ingresar: "Se connecter",
            ingresando: "Connexion...",
            mostrar: "Afficher le mot de passe",
            ocultar: "Masquer le mot de passe",
            ayuda: "Mot de passe oublié ? Demandez à votre administrateur de le réinitialiser.",
            brand_tag: "Votre clinique, organisée.",
            brand_sub: "Agenda, rappels et dossier clinique au même endroit.",
            b1: "Des rappels automatiques qui réduisent les absences",
            b2: "Dossier clinique sécurisé, accès selon le rôle",
            b3: "Rapports de présence et de paiements",
            incompleto: "Veuillez remplir tous les champs",
            credenciales: "E-mail ou mot de passe incorrect",
            sin_perfil: "Votre compte n'a pas de profil assigné. Contactez l'administrateur.",
            desactivada: "Votre compte a été désactivé. Contactez l'administrateur.",
            suspendida: "Votre période d'essai est terminée ou le compte de votre clinique est suspendu. Contactez l'équipe ClinicOS pour l'activer.",
            sin_clinica: "La clinique de votre compte est introuvable. Contactez l'administrateur.",
            conexion: "Connexion impossible. Vérifiez votre internet et réessayez."
        }
    };

    function leerLS(clave) {
        try { return localStorage.getItem(clave); } catch (e) { return null; }
    }
    function guardarLS(clave, valor) {
        try {
            if (valor === undefined || valor === null || valor === "") localStorage.removeItem(clave);
            else localStorage.setItem(clave, String(valor));
        } catch (e) { /* modo privado: se ignora */ }
    }

    function idiomaInicial() {
        const guardado = leerLS("lang");
        if (IDIOMAS.indexOf(guardado) !== -1) return guardado;
        const nav = (navigator.language || "es").slice(0, 2).toLowerCase();
        return IDIOMAS.indexOf(nav) !== -1 ? nav : "es";
    }

    let lang = idiomaInicial();
    function t(clave) {
        return (T[lang] && T[lang][clave]) || T.es[clave] || clave;
    }

    const $ = function (id) { return document.getElementById(id); };
    const form = $("loginForm");
    const inputUsuario = $("usuario");
    const inputClave = $("password");
    const btnLogin = $("loginBtn");
    const errorBox = $("error");
    const btnToggle = $("togglePass");
    const langBtn = $("langBtn");
    const langMenu = $("langMenu");

    /* ---------- Idioma ---------- */
    function aplicarIdioma() {
        document.documentElement.lang = lang;
        document.querySelectorAll("[data-k]").forEach(function (el) { el.textContent = t(el.dataset.k); });
        document.querySelectorAll("[data-kph]").forEach(function (el) { el.placeholder = t(el.dataset.kph); });
        if ($("langFlag")) $("langFlag").textContent = BANDERAS[lang];
        if ($("langCode")) $("langCode").textContent = lang.toUpperCase();
        document.querySelectorAll(".lg-lang-opt").forEach(function (op) {
            op.setAttribute("aria-checked", op.dataset.lang === lang ? "true" : "false");
        });
        if (btnToggle) {
            const visible = btnToggle.getAttribute("aria-pressed") === "true";
            btnToggle.setAttribute("aria-label", t(visible ? "ocultar" : "mostrar"));
        }
        if (btnLogin && btnLogin.disabled) $("loginBtnText").textContent = t("ingresando");
    }

    function cambiarIdioma(nuevo) {
        if (IDIOMAS.indexOf(nuevo) === -1) return;
        lang = nuevo;
        guardarLS("lang", lang);
        aplicarIdioma();
        cerrarMenuIdioma();
    }

    function cerrarMenuIdioma() {
        langMenu.classList.remove("open");
        langBtn.setAttribute("aria-expanded", "false");
    }

    langBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        const abrir = !langMenu.classList.contains("open");
        langMenu.classList.toggle("open", abrir);
        langBtn.setAttribute("aria-expanded", abrir ? "true" : "false");
    });
    langMenu.querySelectorAll(".lg-lang-opt").forEach(function (op) {
        op.addEventListener("click", function () { cambiarIdioma(op.dataset.lang); });
    });
    document.addEventListener("click", function (e) {
        if (!langMenu.contains(e.target) && e.target !== langBtn) cerrarMenuIdioma();
    });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") cerrarMenuIdioma();
    });

    /* ---------- Mostrar / ocultar contraseña ---------- */
    btnToggle.addEventListener("click", function () {
        const mostrar = inputClave.type === "password";
        inputClave.type = mostrar ? "text" : "password";
        btnToggle.setAttribute("aria-pressed", mostrar ? "true" : "false");
        btnToggle.setAttribute("aria-label", t(mostrar ? "ocultar" : "mostrar"));
    });

    /* ---------- Estado del formulario ---------- */
    function showError(msg) { errorBox.textContent = msg || ""; }

    function setLoading(cargando) {
        btnLogin.disabled = cargando;
        btnLogin.classList.toggle("is-loading", cargando);
        $("loginBtnText").textContent = t(cargando ? "ingresando" : "ingresar");
    }

    async function cerrarYMostrar(claveMensaje) {
        try { await supabaseClient.auth.signOut(); } catch (e) { /* ignorar */ }
        showError(t(claveMensaje));
    }

    /* Datos de la clínica: primero por la función segura mi_clinica_info()
       (funciona aunque la clínica esté suspendida); si todavía no existe en
       la base, se usa la lectura directa de la tabla como respaldo. */
    async function leerInfoClinica(clinicaId) {
        try {
            const r = await supabaseClient.rpc("mi_clinica_info");
            if (!r.error && r.data) {
                const fila = Array.isArray(r.data) ? r.data[0] : r.data;
                if (fila) return fila;
            }
        } catch (e) { /* se prueba el respaldo */ }
        const d = await supabaseClient
            .from("clinicas")
            .select("nombre, plan, region, estado_cuenta, fecha_vencimiento_prueba")
            .eq("id", clinicaId)
            .maybeSingle();
        return d && d.data ? d.data : null;
    }

    async function iniciarSesion(ev) {
        ev.preventDefault();
        showError("");

        const email = inputUsuario.value.trim();
        const password = inputClave.value.trim();

        if (!email || !password) { showError(t("incompleto")); return; }
        if (typeof supabaseClient === "undefined") { showError(t("conexion")); return; }

        setLoading(true);
        let redirigiendo = false;

        try {
            // 1. Login real contra Supabase Auth
            const login = await supabaseClient.auth.signInWithPassword({ email: email, password: password });
            if (login.error || !login.data || !login.data.user) {
                const err = login.error || {};
                const sinRed = err.name === "AuthRetryableFetchError" || /failed to fetch|network/i.test(err.message || "");
                showError(t(sinRed ? "conexion" : "credenciales"));
                return;
            }
            const user = login.data.user;

            // 2. Perfil: clínica, rol y estado de la cuenta
            const p = await supabaseClient
                .from("perfiles")
                .select("clinica_id, rol, nombre, activo")
                .eq("id", user.id)
                .maybeSingle();
            const perfil = p && p.data;

            if (!perfil) { await cerrarYMostrar("sin_perfil"); return; }
            if (perfil.activo === false) { await cerrarYMostrar("desactivada"); return; }

            // 3. Clínica: nombre, plan y estado de la cuenta
            const clinica = await leerInfoClinica(perfil.clinica_id);
            if (!clinica) { await cerrarYMostrar("sin_clinica"); return; }
            if (clinica.estado_cuenta === "suspendida") { await cerrarYMostrar("suspendida"); return; }

            // 4. Guardar la sesión localmente
            guardarLS("clinicaID", perfil.clinica_id);
            guardarLS("clinicaNombre", clinica.nombre || "ClinicOS");
            guardarLS("rol", perfil.rol);
            guardarLS("usuario", perfil.nombre || user.email);
            guardarLS("loginTime", new Date().toISOString());
            guardarLS("plan", clinica.plan);
            guardarLS("region", clinica.region);
            guardarLS("estadoCuenta", clinica.estado_cuenta);
            guardarLS("fechaVencimientoPrueba", clinica.fecha_vencimiento_prueba);
            guardarLS("lang", lang);

            redirigiendo = true;
            window.location.href = "dashboard.html";
        } catch (e) {
            console.error("Error al iniciar sesión:", e);
            showError(t("conexion"));
        } finally {
            if (!redirigiendo) setLoading(false);
        }
    }

    form.addEventListener("submit", iniciarSesion);

    /* Si ya hay una sesión válida, se entra directo al dashboard */
    async function entrarSiYaHaySesion() {
        try {
            if (typeof supabaseClient === "undefined" || !leerLS("clinicaID")) return;
            const s = await supabaseClient.auth.getSession();
            if (s && s.data && s.data.session) window.location.replace("dashboard.html");
        } catch (e) { /* se queda en el login */ }
    }

    aplicarIdioma();
    inputUsuario.focus();
    entrarSiYaHaySesion();
})();
