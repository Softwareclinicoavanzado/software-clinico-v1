/* =============================================
    PACIENTES | ClinicOS (Cloud Edition)
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

// MODIFICADO: Ahora espera a que los datos lleguen de la nube
async function cargarDatos() {
    pacientes = await getPacientes(); 
    render();
}

async function guardar() {
    savePacientes(pacientes);
    render();
    if (typeof syncAllToCloud === "function") await syncAllToCloud();
}

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
                <small>Seguro: ${p.aseguradora || "Particular"} | No. Seguro: ${p.poliza_seguro || p.poliza || "-"} | Sucursal: ${p.sede || "-"}</small>
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

function editarPaciente(id) {
    const p = pacientes.find(pac => Number(pac.id) === Number(id));
    if (!p) return;

    editandoID = id;

    inputs.nombre.value = p.nombre || "";
    inputs.dpi.value = p.dpi || "";
    inputs.edad.value = p.edad || "";
    inputs.telefono.value = p.telefono || "";
    inputs.fechaNacimiento.value = p.fechaNacimiento || "";
    inputs.sexo.value = p.sexo || "";
    inputs.contactoEmergencia.value = p.contactoEmergencia || "";
    inputs.aseguradora.value = p.aseguradora || "";
    inputs.poliza.value = p.poliza_seguro || p.poliza || ""; // Compatibilidad con ambos nombres
    inputs.medicoAsignado.value = p.medicoAsignado || "";
    inputs.sede.value = p.sede || "";

    document.getElementById("seccionFormulario").style.display = "block";
    document.getElementById("seccionLista").style.display = "none";
    document.getElementById("tituloPagina").innerText = "Actualizar Perfil de Paciente";
    
    const btnSubmit = document.querySelector(".btn-primary");
    if (btnSubmit) btnSubmit.innerText = "💾 Guardar Cambios";
}

async function agregarPaciente() {
    const nombre = inputs.nombre.value.trim();
    if (!nombre) return alert("El nombre es obligatorio");

    if (editandoID) {
        const index = pacientes.findIndex(p => Number(p.id) === Number(editandoID));
        if (index !== -1) {
            pacientes[index] = {
                ...pacientes[index],
                nombre: nombre,
                dpi: inputs.dpi.value.trim(),
                edad: inputs.edad.value,
                telefono: inputs.telefono.value,
                fecha_nacimiento: inputs.fechaNacimiento.value, // Cambiado a snake_case para DB
                sexo: inputs.sexo.value,
                contacto_emergencia: inputs.contactoEmergencia.value, // Cambiado a snake_case para DB
                aseguradora: inputs.aseguradora.value,
                poliza_seguro: inputs.poliza.value.trim(), // Nombre exacto de la DB
                medico_asignado: inputs.medicoAsignado.value, // Cambiado a snake_case para DB
                sede: inputs.sede.value
            };
            alert("¡Perfil actualizado!");
        }
        editandoID = null;
    } else {
        const nuevoPaciente = {
            id: Date.now(),
            nombre: nombre,
            dpi: inputs.dpi.value.trim(),
            edad: inputs.edad.value,
            telefono: inputs.telefono.value,
            fecha_nacimiento: inputs.fechaNacimiento.value,
            sexo: inputs.sexo.value,
            contacto_emergencia: inputs.contactoEmergencia.value,
            aseguradora: inputs.aseguradora.value,
            poliza_seguro: inputs.poliza.value.trim(), // Nombre exacto de la DB
            medico_asignado: inputs.medicoAsignado.value,
            sede: inputs.sede.value,
            creado: new Date().toISOString(), 
            clinica_id: clinicaID
        };
        pacientes.push(nuevoPaciente);
        alert("¡Paciente registrado!");
    }

    Object.values(inputs).forEach(input => { if(input) input.value = ""; });
    
    await guardar();
    
    document.getElementById("tituloPagina").innerText = "Gestión de Pacientes";
    const btnSubmit = document.querySelector(".btn-primary");
    if (btnSubmit) btnSubmit.innerText = "🚀 Añadir al Sistema";
    
    window.location.href = "pacientes.html?mode=ver";
}

async function eliminarPaciente(id) {
    const p = pacientes.find(pac => Number(pac.id) === Number(id));
    if (!p) return;

    const confirmacion = confirm(`⚠️ ¿ELIMINAR PACIENTE?\n\nNombre: ${p.nombre}`);

    if (confirmacion) {
        pacientes = pacientes.filter(pac => Number(pac.id) !== Number(id));
        savePacientes(pacientes);
        render();
        if (typeof syncAllToCloud === "function") await syncAllToCloud();
    }
}

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
    }
}

// Inicialización
cargarDatos();
gestionarVistas();
