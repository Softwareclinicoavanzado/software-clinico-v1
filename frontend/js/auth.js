/* =========================
   LOGIN | ClinicOS (Auth Real)
========================= */
const errorDisplay = document.getElementById("error");
const loginBtn = document.getElementById("loginBtn");
const currentLang = localStorage.getItem("lang") || "es";

function showError(msg, type = "error") {
    if (errorDisplay) {
        errorDisplay.innerText = msg;
        errorDisplay.style.color = type === "error" ? "#f87171" : "#93c5fd";
    }
}

if (loginBtn) {
    loginBtn.onclick = async () => {
        if (errorDisplay) errorDisplay.innerText = "";

        const usuarioInput = document.getElementById("usuario");
        const passwordInput = document.getElementById("password");
        if (!usuarioInput || !passwordInput) return;

        const email = usuarioInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            const msgIncompleto = {
                es: "Completa todos los campos",
                en: "Please fill all fields",
                fr: "Veuillez remplir tous les champs"
            };
            showError(msgIncompleto[currentLang]);
            return;
        }

        const msgIngresando = {
            es: "Ingresando...",
            en: "Signing in...",
            fr: "Connexion..."
        };
        showError(msgIngresando[currentLang], "info");

        // 1. Login real contra Supabase Auth
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            const msgError = {
                es: "Correo o contraseña incorrectos",
                en: "Incorrect email or password",
                fr: "E-mail ou mot de passe incorrect"
            };
            showError(msgError[currentLang]);
            return;
        }

        // 2. Buscar el perfil (clínica y rol) de este usuario
        const { data: perfil, error: errorPerfil } = await supabaseClient
            .from("perfiles")
            .select("clinica_id, rol, nombre")
            .eq("id", data.user.id)
            .single();

        if (errorPerfil || !perfil) {
            const msgSinPerfil = {
                es: "Tu cuenta no tiene un perfil asignado. Contacta al administrador.",
                en: "Your account has no assigned profile. Contact the administrator.",
                fr: "Votre compte n'a pas de profil assigné. Contactez l'administrateur."
            };
            showError(msgSinPerfil[currentLang]);
            await supabaseClient.auth.signOut();
            return;
        }

        // 3. Guardar sesión localmente (para que el resto de tu app siga funcionando igual)
        localStorage.setItem("clinicaID", perfil.clinica_id);
        localStorage.setItem("rol", perfil.rol);
        localStorage.setItem("usuario", perfil.nombre || data.user.email);
        localStorage.setItem("loginTime", new Date().toISOString());

        window.location.href = "dashboard.html";
    };
}
