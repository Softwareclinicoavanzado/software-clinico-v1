/* =============================================
    PACIENTES | ClinicOS (Cloud Edition - Direct Sync)
============================================= */
const clinicaID = typeof getClinicaID === "function" ? getClinicaID() : localStorage.getItem("clinicaID");
if (!clinicaID) {
    window.location.href = "index.html";
}
const rol = localStorage.getItem("rol") || "admin";
let pacientes = [];
let editandoID = null;
const inputs = {
    nombre: document.getElementById("nombre"),
    dpi: document.getElementById("dpi"),
    edad: document.getElementById("edad"),
    telefono: document.getElementById("telefono"),
    fechaNacimiento: document.getElementById("fechaNacimiento"),
    sexo: document.getElementById("sexo"),
    contactoEmergencia: document.getElementById("contactoEmergencia"),
    aseguradora: document.getElementById("aseguradora"),
    poliza: document.getElementById("poliza"),
    medicoAsignado: document.getElementById("medicoAsignado"),
    sede: document.getElementById("sede")
};

async function cargarDatos() {
    try {
        const { data, error } = await supabaseClient
            .from('pacientes')
            .select('*')
            .eq('clinica_id', clinicaID)
            .order('nombre', { ascending: true });
        if (error) throw error;
        pacientes = data;
        render();
    } catch (err) {
        console.error("Error cargando pacientes:", err.message);
    }
}

/* =========================
   Helpers visuales para las tarjetas
========================= */
function iniciales(nombre) {
    if (!nombre) return "?";
    const partes = nombre.trim().split(" ").filter(Boolean);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
}

function colorAvatar(nombre) {
    const paleta = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4"];
    let hash = 0;
    for (let i = 0; i < (nombre || "").length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    return paleta[Math.abs(hash) % paleta.length];
}

function limpiarTexto(str) {
    return (str || "").replace(/^[^\w\sáéíóúÁÉÍÓÚñÑ]+/, '').trim();
}

/* =========================
   Traduce el valor de "sexo" guardado en español (Hombre/Mujer/Otro)
   al idioma activo, reutilizando las claves ya existentes del formulario.
========================= */
function traducirSexo(valor) {
    if (!valor) return null;
    const normalizado = valor.toString().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const mapa = { hombre: "sexo_hombre", mujer: "sexo_mujer", otro: "sexo_otro" };
    const clave = mapa[normalizado];
    return clave ? t(clave) : valor;
}

/* =========================
   Render de tarjetas de paciente (rediseño premium)
========================= */
function render(data = pacientes) {
    const lista = document.getElementById("listaPacientes");
    if (!lista) return;
    lista.innerHTML = "";
    if (!data || !data.length) {
        lista.innerHTML = `<li style='color:var(--text-secondary); text-align:center; background:none; border:none; box-shadow:none;'>${t("no_hay_pacientes")}</li>`;
        return;
    }
    data.forEach(p => {
        const li = document.createElement("li");
        li.className = "patient-card";

        const edadTexto = p.edad ? `${p.edad} ${t("tag_anios")}` : `${t("tag_edad")} —`;
        const sexoTexto = traducirSexo(p.sexo) || `${t("tag_sexo")} —`;
        const telTexto = p.telefono || `${t("tag_tel")} —`;
        const aseguradoraTexto = p.aseguradora || t("tag_particular");

        li.innerHTML = `
            <div class="patient-card-top">
                <div class="patient-identity">
                    <div class="patient-avatar" style="background:${colorAvatar(p.nombre)}20; color:${colorAvatar(p.nombre)}; border-color:${colorAvatar(p.nombre)}40;">
                        ${iniciales(p.nombre)}
                    </div>
                    <div>
                        <div class="patient-name">${p.nombre}</div>
                        <div class="patient-dpi">DPI ${p.dpi || "S/D"}</div>
                    </div>
                </div>
                <button type="button" class="btn-pdf-pill" onclick="descargarPDFHistorial(${p.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6M9 15l3 3 3-3"/></svg>
                    <span>${limpiarTexto(t("exportar_reporte"))}</span>
                </button>
            </div>

            <div class="patient-tags">
                <span class="patient-tag">${edadTexto}</span>
                <span class="patient-tag">${sexoTexto}</span>
                <span class="patient-tag">${telTexto}</span>
                <span class="patient-tag patient-tag-accent">${aseguradoraTexto}</span>
            </div>

            <div class="patient-actions">
                <button type="button" class="btn-action btn-action-primary" onclick="verHistorial(${p.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18.7 8 12 14.7l-3.5-3.5L3 16.5"/></svg>
                    ${t("modificar_historial")}
                </button>
                <button type="button" class="btn-action" onclick="agregarNotaDirecta(${p.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    ${t("nueva_nota_medica")}
                </button>
                <button type="button" class="btn-action" onclick="editarPaciente(${p.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                    ${t("editar_perfil")}
                </button>
                ${rol !== "recepcion" ? `
                <button type="button" class="btn-action btn-action-danger" onclick="eliminarPaciente(${p.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    ${t("eliminar_paciente")}
                </button>` : ""}
            </div>
        `;
        lista.appendChild(li);
    });
}

function editarPaciente(id) {
    const p = pacientes.find(pac => Number(pac.id) === Number(id));
    if (!p) return;
    editandoID = id;
    if (inputs.nombre) inputs.nombre.value = p.nombre || "";
    if (inputs.dpi) inputs.dpi.value = p.dpi || "";
    if (inputs.edad) inputs.edad.value = p.edad || "";
    if (inputs.telefono) inputs.telefono.value = p.telefono || "";
    if (inputs.fechaNacimiento) inputs.fechaNacimiento.value = p.fecha_nacimiento || "";
    if (inputs.sexo) inputs.sexo.value = p.sexo || "";
    if (inputs.contactoEmergencia) inputs.contactoEmergencia.value = p.contacto_emergencia || "";
    if (inputs.aseguradora) inputs.aseguradora.value = p.aseguradora || "";
    if (inputs.poliza) inputs.poliza.value = p.poliza_seguro || "";
    if (inputs.medicoAsignado) inputs.medicoAsignado.value = p.medico_asignado || "";
    if (inputs.sede) inputs.sede.value = p.sede || "";
    document.getElementById("seccionFormulario").style.display = "block";
    document.getElementById("seccionLista").style.display = "none";
    document.getElementById("tituloPagina").innerText = t("actualizar_perfil_titulo");
    const btnSubmit = document.querySelector(".btn-primary");
    if (btnSubmit) btnSubmit.innerText = t("guardar_cambios_btn");
}

async function agregarPaciente() {
    const nombre = inputs.nombre.value.trim();
    if (!nombre) return alert("El nombre es obligatorio");
    const datosPaciente = {
        nombre: nombre,
        dpi: inputs.dpi.value.trim(),
        edad: inputs.edad.value ? parseInt(inputs.edad.value) : null,
        telefono: inputs.telefono.value.trim(),
        fecha_nacimiento: inputs.fechaNacimiento.value || null,
        sexo: inputs.sexo.value,
        contacto_emergencia: inputs.contactoEmergencia.value.trim(),
        aseguradora: inputs.aseguradora.value.trim(),
        poliza_seguro: inputs.poliza.value.trim(),
        medico_asignado: inputs.medicoAsignado.value.trim(),
        sede: inputs.sede.value.trim(),
        clinica_id: clinicaID
    };
    try {
        if (editandoID) {
            const { error } = await supabaseClient
                .from('pacientes')
                .update(datosPaciente)
                .eq('id', editandoID);
            if (error) throw error;
            alert("¡Perfil actualizado con éxito!");
            editandoID = null;
        } else {
            const { error } = await supabaseClient
                .from('pacientes')
                .insert([datosPaciente]);
            if (error) throw error;
            alert("¡Paciente registrado con éxito!");
        }
        Object.values(inputs).forEach(input => { if(input) input.value = ""; });
        window.location.href = "pacientes.html?mode=ver";
    } catch (err) {
        console.error("Error detallado de Supabase:", err);
        alert("Error al sincronizar: " + (err.message || "Verifica la consola"));
    }
}

async function eliminarPaciente(id) {
    const p = pacientes.find(pac => Number(pac.id) === Number(id));
    if (!p) return;
    if (confirm(`⚠️ ¿ELIMINAR PACIENTE DEFINITIVAMENTE?\n\nNombre: ${p.nombre}`)) {
        try {
            const { error } = await supabaseClient
                .from('pacientes')
                .delete()
                .eq('id', id);
            if (error) throw error;
            cargarDatos();
        } catch (err) {
            alert("Error al eliminar: " + err.message);
        }
    }
}

function filtrarPacientes() {
    const texto = document.getElementById("busqueda").value.toLowerCase();
    const filtrados = pacientes.filter(p => 
        (p.nombre && p.nombre.toLowerCase().includes(texto)) || 
        (p.dpi && p.dpi.includes(texto)) ||
        (p.telefono && p.telefono.includes(texto))
    );
    render(filtrados);
}

function verHistorial(id) {
    localStorage.setItem("pacienteActual", String(id));
    window.location.href = "historial.html?mode=modificar";
}

function agregarNotaDirecta(id) {
    localStorage.setItem("pacienteActual", String(id));
    window.location.href = "historial.html?mode=nuevaNota";
}

function volver() { window.location.href = "dashboard.html"; }

function gestionarVistas() {
    const params = new URLSearchParams(window.location.search);
    const modo = params.get("mode");
    const form = document.getElementById("seccionFormulario");
    const lista = document.getElementById("seccionLista");
    const titulo = document.getElementById("tituloPagina");
    if (modo === "nuevo") {
        if(form) form.style.display = "block";
        if(lista) lista.style.display = "none";
        if(titulo) titulo.innerText = t("gestion_pacientes");
    } else {
        if(form) form.style.display = "none";
        if(lista) lista.style.display = "block";
        if(titulo) titulo.innerText = t("listado_pacientes");
        cargarDatos();
    }
}

gestionarVistas();
