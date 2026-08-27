async function actualizarEstadisticas(clinicaID) {
    const totalPacientesElem = document.getElementById("totalPacientes");
    const pacientesNuevosElem = document.getElementById("pacientesNuevosMes");
    const citasHoyElem = document.getElementById("citasHoy");
    const citasSemanaElem = document.getElementById("citasSemana");
    try {
        const hoy = new Date();
        const hoyStr = hoy.toISOString().split("T")[0];
        const en7dias = new Date(hoy);
        en7dias.setDate(en7dias.getDate() + 7);
        const en7diasStr = en7dias.toISOString().split("T")[0];
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();
        const { count: totalPacientes } = await supabaseClient
            .from('pacientes')
            .select('id', { count: 'exact', head: true })
            .eq('clinica_id', clinicaID);
        const { count: nuevosMes } = await supabaseClient
            .from('pacientes')
            .select('id', { count: 'exact', head: true })
            .eq('clinica_id', clinicaID)
            .gte('creado', inicioMes);
        const { count: citasHoy } = await supabaseClient
            .from('citas')
            .select('id', { count: 'exact', head: true })
            .eq('clinica_id', clinicaID)
            .eq('estado', 'programada')
            .eq('fecha', hoyStr);
        const { count: citasSemana } = await supabaseClient
            .from('citas')
            .select('id', { count: 'exact', head: true })
            .eq('clinica_id', clinicaID)
            .eq('estado', 'programada')
            .gte('fecha', hoyStr)
            .lte('fecha', en7diasStr);
        if (totalPacientesElem) totalPacientesElem.innerText = totalPacientes ?? 0;
        if (pacientesNuevosElem) pacientesNuevosElem.innerText = nuevosMes ?? 0;
        if (citasHoyElem) citasHoyElem.innerText = citasHoy ?? 0;
        if (citasSemanaElem) citasSemanaElem.innerText = citasSemana ?? 0;
        console.log("📊 Estadísticas del dashboard actualizadas");
    } catch (error) {
        console.error("Error al calcular estadísticas:", error);
        try {
            const pacLocal = JSON.parse(localStorage.getItem(`pacientes_${clinicaID}`)) || [];
            const citLocal = JSON.parse(localStorage.getItem(`citas_${clinicaID}`)) || [];
            if (totalPacientesElem) totalPacientesElem.innerText = pacLocal.length;
            if (citasHoyElem) citasHoyElem.innerText = "-";
            if (citasSemanaElem) citasSemanaElem.innerText = citLocal.length;
            if (pacientesNuevosElem) pacientesNuevosElem.innerText = "-";
        } catch (e2) {
            console.warn("No se pudo aplicar fallback de estadísticas:", e2);
        }
    }
}

/* =========================================================
   AVISO DISCRETO: citas de mañana sin WhatsApp enviado
   Solo se muestra si hay al menos 1 pendiente. No afecta
   ninguna otra parte del dashboard.
========================================================= */
let citasPendientesWhatsappManana = 0;

async function cargarWidgetWhatsappPendiente(clinicaID) {
    const widget = document.getElementById("whatsappPendienteWidget");
    const texto = document.getElementById("whatsappPendienteTexto");
    if (!widget || !texto) return;

    try {
        const manana = new Date();
        manana.setDate(manana.getDate() + 1);
        const y = manana.getFullYear();
        const m = String(manana.getMonth() + 1).padStart(2, "0");
        const d = String(manana.getDate()).padStart(2, "0");
        const mananaStr = `${y}-${m}-${d}`;

        const { count, error } = await supabaseClient
            .from('citas')
            .select('id', { count: 'exact', head: true })
            .eq('clinica_id', clinicaID)
            .eq('fecha', mananaStr)
            .eq('whatsapp_enviado', false)
            .in('estado', ['programada', 'confirmada']);

        if (error) throw error;

        citasPendientesWhatsappManana = count || 0;

        if (citasPendientesWhatsappManana > 0) {
            texto.innerText = t("whatsapp_pendiente_banner").replace("{n}", citasPendientesWhatsappManana);
            widget.style.display = "block";
        } else {
            widget.style.display = "none";
        }
    } catch (e) {
        console.warn("No se pudo cargar el aviso de WhatsApp pendiente:", e);
    }
}

function retraducirContenidoDinamico() {
    const clinicaElem = document.getElementById("clinica");
    const usuarioElem = document.getElementById("usuarioInfo");
    const usuario = localStorage.getItem("usuario");
    const clinicaNombre = localStorage.getItem("clinicaNombre");
    const rol = localStorage.getItem("rol") || "";
    if (clinicaElem) clinicaElem.innerText = clinicaNombre ? `${t("bienvenido_a")} ${clinicaNombre}` : "ClinicOS";
    if (usuarioElem) usuarioElem.innerText = `${usuario || ""} · ${t("rol_prefix")}: ${rol.toUpperCase()}`;

    const textoWhatsapp = document.getElementById("whatsappPendienteTexto");
    if (textoWhatsapp && citasPendientesWhatsappManana > 0) {
        textoWhatsapp.innerText = t("whatsapp_pendiente_banner").replace("{n}", citasPendientesWhatsappManana);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const clinicaID = localStorage.getItem("clinicaID");
    const rol = localStorage.getItem("rol");
    if (!clinicaID || !rol) {
        window.location.replace("index.html");
        return;
    }
    retraducirContenidoDinamico();
    if (rol === "admin") {
        const cardUsuarios = document.getElementById("cardUsuarios");
        const cardAuditoria = document.getElementById("cardAuditoria");
        if (cardUsuarios) cardUsuarios.style.display = "flex";
        if (cardAuditoria) cardAuditoria.style.display = "flex";
    }
    actualizarEstadisticas(clinicaID);
    cargarWidgetWhatsappPendiente(clinicaID);
});
