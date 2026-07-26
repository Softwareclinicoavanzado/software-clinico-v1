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
document.addEventListener("DOMContentLoaded", () => {
    const clinicaID = localStorage.getItem("clinicaID");
    const rol = localStorage.getItem("rol");
    if (!clinicaID || !rol) {
        window.location.replace("index.html");
        return;
    }
    const clinicaElem = document.getElementById("clinica");
    const usuarioElem = document.getElementById("usuarioInfo");
    const usuario = localStorage.getItem("usuario");
    const clinicaNombre = localStorage.getItem("clinicaNombre");
    if(clinicaElem) clinicaElem.innerText = clinicaNombre ? `${t("bienvenido_a")} ${clinicaNombre}` : "ClinicOS";
    if(usuarioElem) usuarioElem.innerText = `${usuario || ""} · ${t("rol_prefix")}: ${rol.toUpperCase()}`;
    if (rol === "admin") {
        const liUsuarios = document.getElementById("liUsuarios");
        const cardUsuarios = document.getElementById("cardUsuarios");
        if (liUsuarios) liUsuarios.style.display = "block";
        if (cardUsuarios) cardUsuarios.style.display = "flex";
    }
    actualizarEstadisticas(clinicaID);
});
