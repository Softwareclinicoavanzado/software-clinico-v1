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

// Elementos del DOM
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

/**
 * CARGAR DATOS: Trae la lista directo de la nube
 */
async function cargarDatos() {
    const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('clinica_id', clinicaID)
        .order('nombre', { ascending: true });

    if (error) {
        console.error("Error cargando pacientes:", error);
        return;
    }

    pacientes = data;
    render();
}

/**
 * RENDER: Dibuja los pacientes en el HTML
 */
function render(data = pacientes) {
    const lista = document.getElementById("listaPacientes");
    if (!lista) return;
    lista.innerHTML = "";
    
    if (!data || !data.length) {
        lista.innerHTML = "<li style='color:white; text-align:center;'>No hay pacientes registrados</li>";
        return;
    }

    data.forEach(p => {
        const li = document.createElement("li");
        li.className = "paciente-item";
        li.innerHTML = `
            <div class="paciente-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 1.1rem;"><strong>${p.nombre}</strong> <small style="opacity: 0.8;">(DPI: ${p.dpi || "S/D"})</small></span>
                <button class="btn-pdf" onclick="descargarPDFHistorial(${p.id})" style="padding: 5px 10px; font-size: 0.8rem; cursor:pointer; background-color: #3498db; color: white; border: none; border-radius: 4px;">📄 Exportar Reporte</button>
            </div>
            <div class="paciente-info">
                <small>Edad: ${p.edad || "-"} | Sexo: ${p.sexo || "-"} | Tel: ${p.telefono || "-"}</small><br>
                <small>Seguro: ${p.aseguradora || "Particular"} | No. Seguro: ${p.poliza_seguro || "-"} | Sucursal: ${p.sede || "-"}</small>
            </div>
            <div class="actions" style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <button type="button" onclick="verHistorial(${p.id})">⚙️ Modificar Historial</button>
                <button type="button" onclick="editarPaciente(${p.id})">✏️ Editar Perfil</button>
                <button type="button" class="btn-nota" onclick="agregarNotaDirecta(${p.id})" style="grid-column: span 2; background-color: #2ecc71;">📝 Nueva Nota Médica</button>
                ${rol !== "recepcion" ? `<button type="button" class="btn-danger" onclick="eliminarPaciente(${p.id})" style="grid-column: span 2; background-color: #e74c3c; color:white;">🗑️ Eliminar Paciente</button>` : ""}
            </div>
        `;
        lista.appendChild(li);
    });
}

/**
 * EDITAR: Prepara el formulario con los datos del paciente
 */
function editarPaciente(id) {
    const p = pacientes.find(pac => Number(pac.id) === Number(id));
    if (!p) return;

    editandoID = id;

    inputs.nombre.value = p.nombre || "";
    inputs.dpi.value = p.dpi || "";
    inputs.edad.value = p.edad || "";
    inputs.telefono.value = p.telefono || "";
    inputs.fechaNacimiento.value = p.fecha_nacimiento || ""; // Usar nombre de DB
    inputs.sexo.value = p.sexo || "";
    inputs.contactoEmergencia.value = p.contacto_emergencia || ""; // Usar nombre de DB
    inputs.aseguradora.value = p.aseguradora || "";
    inputs.poliza.value = p.poliza_seguro || ""; 
    inputs.medicoAsignado.value = p.medico_asignado || ""; // Usar nombre de DB
    inputs.sede.value = p.sede || "";

    document.getElementById("seccionFormulario").style.display = "block";
    document.getElementById("seccionLista").style.display = "none";
    document.getElementById("tituloPagina").innerText = "Actualizar Perfil de Paciente";
    
    const btnSubmit = document.querySelector(".btn-primary");
    if (btnSubmit) btnSubmit.innerText = "💾 Guardar Cambios";
}

/**
 * GUARDAR / ACTUALIZAR: Directo a Supabase
 */
async function agregarPaciente() {
    const nombre = inputs.nombre.value.trim();
    if (!nombre) return alert("El nombre es obligatorio");

    const datosPaciente = {
        nombre: nombre,
        dpi: inputs.dpi.value.trim(),
        edad: inputs.edad.value,
        telefono: inputs.telefono.value,
        fecha_nacimiento: inputs.fechaNacimiento.value,
        sexo: inputs.sexo.value,
        contacto_emergencia: inputs.contactoEmergencia.value,
        aseguradora: inputs.aseguradora.value,
        poliza_seguro: inputs.poliza.value.trim(),
        medico_asignado: inputs.medicoAsignado.value,
        sede: inputs.sede.value,
        clinica_id: clinicaID
    };

    try {
        if (editandoID) {
            // ACTUALIZAR EN LA NUBE
            const { error } = await supabase
                .from('pacientes')
                .update(datosPaciente)
                .eq('id', editandoID);

            if (error) throw error;
            alert("¡Perfil actualizado globalmente!");
            editandoID = null;
        } else {
            // INSERTAR EN LA NUBE
            const { error } = await supabase
                .from('pacientes')
                .insert([datosPaciente]);

            if (error) throw error;
            alert("¡Paciente registrado con éxito!");
        }

        // Limpiar y volver
        Object.values(inputs).forEach(input => { if(input) input.value = ""; });
        window.location.href = "pacientes.html?mode=ver";

    } catch (err) {
        console.error("Error en operación:", err);
        alert("Error al sincronizar con la nube.");
    }
}

/**
 * ELIMINAR: Borra de la nube
 */
async function eliminarPaciente(id) {
    const p = pacientes.find(pac => Number(pac.id) === Number(id));
    if (!p) return;

    if (confirm(`⚠️ ¿ELIMINAR PACIENTE DEFINITIVAMENTE?\n\nNombre: ${p.nombre}`)) {
        const { error } = await supabase
            .from('pacientes')
            .delete()
            .eq('id', id);

        if (error) {
            alert("Error al eliminar.");
        } else {
            cargarDatos(); // Recargar lista
        }
    }
}

/**
 * BUSQUEDA Y OTROS
 */
function filtrarPacientes() {
    const texto = document.getElementById("busqueda").value.toLowerCase();
    const filtrados = pacientes.filter(p => 
        p.nombre.toLowerCase().includes(texto) || 
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
        if(titulo) titulo.innerText = "Registrar Paciente";
    } else {
        if(form) form.style.display = "none";
        if(lista) lista.style.display = "block";
        if(titulo) titulo.innerText = "Listado de Pacientes";
        cargarDatos(); // Cargamos datos solo al ver la lista
    }
}

// Inicialización
gestionarVistas();
