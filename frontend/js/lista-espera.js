/* =============================================
    LISTA DE ESPERA | ClinicOS
    La secretaria agrega aquí a pacientes que quieren una fecha
    ocupada. Si esa fecha se libera (una cita se cancela), el
    trigger de la base de datos + la Edge Function
    notificar-lista-espera los avisa solos por correo.
============================================= */
const clinicaID = typeof getClinicaID === "function" ? getClinicaID() : localStorage.getItem("clinicaID");

if (!clinicaID) {
    window.location.href = "index.html";
}

let listaEsperaActual = [];

async function cargarListaEspera() {
    const lista = document.getElementById("listaEspera");
    if (!lista) return;

    try {
        const { data, error } = await supabaseClient
            .from("lista_espera")
            .select("*")
            .eq("clinica_id", clinicaID)
            .order("fecha_deseada", { ascending: true });

        if (error) throw error;
        listaEsperaActual = data || [];
        renderListaEspera();
    } catch (e) {
        console.error("Error cargando lista de espera:", e);
    }
}

function formatearFechaEspera(fechaISO) {
    if (!fechaISO) return "";
    const [y, m, d] = fechaISO.split("-");
    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    return `${d} ${meses[parseInt(m, 10) - 1]} ${y}`;
}

function renderListaEspera() {
    const lista = document.getElementById("listaEspera");
    if (!lista) return;
    lista.innerHTML = "";

    if (!listaEsperaActual.length) {
        lista.innerHTML = `<p style="text-align:center; opacity:0.6; padding:20px;">${t("lista_espera_sin_registros")}</p>`;
        return;
    }

    listaEsperaActual.forEach((item) => {
        const div = document.createElement("div");
        div.className = "card";
        div.style.marginBottom = "10px";
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                <div>
                    <div style="font-weight:bold;">${item.nombre}</div>
                    <div style="font-size:13px; opacity:0.7; margin-top:2px;">📅 ${formatearFechaEspera(item.fecha_deseada)}</div>
                    ${item.telefono ? `<div style="font-size:13px; opacity:0.7;">📞 ${item.telefono}</div>` : ""}
                    <div style="font-size:13px; opacity:0.7;">✉️ ${item.email}</div>
                    ${item.motivo ? `<div style="font-size:13px; opacity:0.7; margin-top:4px;">${item.motivo}</div>` : ""}
                    <div style="margin-top:8px;">
                        <span class="appt-today-badge" style="${item.notificado
                            ? "background:rgba(34,197,94,0.15); color:#22c55e; border-color:rgba(34,197,94,0.3);"
                            : "background:rgba(148,163,184,0.15); color:#94a3b8; border-color:rgba(148,163,184,0.3);"}">
                            ${item.notificado ? t("lista_espera_notificado_badge") : t("lista_espera_pendiente_badge")}
                        </span>
                    </div>
                </div>
                <button type="button" class="btn-action btn-action-danger" onclick="eliminarDeListaEspera(${item.id})">
                    ${t("lista_espera_eliminar_btn")}
                </button>
            </div>
        `;
        lista.appendChild(div);
    });
}

async function agregarAListaEspera() {
    const nombre = document.getElementById("esperaNombre").value.trim();
    const telefono = document.getElementById("esperaTelefono").value.trim();
    const email = document.getElementById("esperaEmail").value.trim();
    const fecha = document.getElementById("esperaFecha").value;
    const motivo = document.getElementById("esperaMotivo").value.trim();

    if (!nombre || !email || !fecha) {
        alert(t("lista_espera_campos_requeridos"));
        return;
    }

    try {
        const { error } = await supabaseClient.from("lista_espera").insert([{
            clinica_id: clinicaID,
            nombre,
            telefono: telefono || null,
            email,
            fecha_deseada: fecha,
            motivo: motivo || null,
            notificado: false,
        }]);
        if (error) throw error;

        if (typeof registrarAuditoria === "function") {
            registrarAuditoria("crear", "lista_espera", `${nombre} — esperando ${fecha}`);
        }

        alert(t("lista_espera_agregado_exito"));
        document.getElementById("esperaNombre").value = "";
        document.getElementById("esperaTelefono").value = "";
        document.getElementById("esperaEmail").value = "";
        document.getElementById("esperaFecha").value = "";
        document.getElementById("esperaMotivo").value = "";

        cargarListaEspera();
    } catch (e) {
        console.error("Error agregando a lista de espera:", e);
        alert("Error al guardar.");
    }
}

async function eliminarDeListaEspera(id) {
    if (!confirm("¿Quitar a esta persona de la lista de espera?")) return;
    try {
        const { error } = await supabaseClient.from("lista_espera").delete().eq("id", id);
        if (error) throw error;
        cargarListaEspera();
    } catch (e) {
        console.error("Error eliminando de lista de espera:", e);
        alert("No se pudo quitar.");
    }
}

function volver() {
    window.location.href = "dashboard.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const hoyStr = new Date().toISOString().split("T")[0];
    const inputFecha = document.getElementById("esperaFecha");
    if (inputFecha) inputFecha.min = hoyStr;
    cargarListaEspera();
});
