/* =============================================
    REPORTES | ClinicOS
    Vista dentro del software del reporte mensual (citas,
    asistencia, cobros, médico más activo). Solo admin/doctor,
    igual que el resto de vistas con cifras financieras.
============================================= */
const clinicaID = typeof getClinicaID === "function" ? getClinicaID() : localStorage.getItem("clinicaID");
const rolActualReportes = localStorage.getItem("rol");

if (!clinicaID) {
    window.location.href = "index.html";
}

// Mismo criterio que citas.js para ocultar cifras financieras
if (rolActualReportes === "recepcion") {
    window.location.href = "dashboard.html";
}

function nombresMesesReportes() {
    const lang = localStorage.getItem("lang") || "es";
    const mapa = {
        es: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
        en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
        fr: ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]
    };
    return mapa[lang] || mapa.es;
}

function poblarSelectoresReporte() {
    const selMes = document.getElementById("reporteMes");
    const selAnio = document.getElementById("reporteAnio");
    if (!selMes || !selAnio) return;

    selMes.innerHTML = "";
    nombresMesesReportes().forEach((nombre, i) => {
        const op = document.createElement("option");
        op.value = String(i + 1).padStart(2, "0");
        op.textContent = nombre;
        selMes.appendChild(op);
    });

    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    selAnio.innerHTML = "";
    for (let a = anioActual; a >= anioActual - 3; a--) {
        const op = document.createElement("option");
        op.value = String(a);
        op.textContent = String(a);
        selAnio.appendChild(op);
    }

    // Por defecto, el mes anterior al actual (el último mes ya cerrado)
    let mesPorDefecto = hoy.getMonth(); // 0-indexado = mes anterior en núm. 1-indexado
    let anioPorDefecto = anioActual;
    if (mesPorDefecto === 0) {
        mesPorDefecto = 12;
        anioPorDefecto = anioActual - 1;
    }
    selMes.value = String(mesPorDefecto).padStart(2, "0");
    selAnio.value = String(anioPorDefecto);
}

function rangoDelMes(anio, mes) {
    const inicio = `${anio}-${String(mes).padStart(2, "0")}-01`;
    const ultimoDia = new Date(anio, mes, 0).getDate();
    const fin = `${anio}-${String(mes).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;
    return { inicio, fin };
}

async function verReporte() {
    const selMes = document.getElementById("reporteMes");
    const selAnio = document.getElementById("reporteAnio");
    const panel = document.getElementById("panelReporte");
    if (!selMes || !selAnio || !panel) return;

    const mes = parseInt(selMes.value, 10);
    const anio = parseInt(selAnio.value, 10);
    const { inicio, fin } = rangoDelMes(anio, mes);

    panel.innerHTML = `<p style="text-align:center; opacity:0.6; padding:20px;">${t("reportes_cargando")}</p>`;

    try {
        const { data, error } = await supabaseClient.rpc("reporte_mensual_clinica", {
            p_clinica_id: clinicaID,
            p_fecha_inicio: inicio,
            p_fecha_fin: fin,
        });
        if (error) throw error;

        const r = Array.isArray(data) ? data[0] : data;

        if (!r || !r.total_citas || Number(r.total_citas) === 0) {
            panel.innerHTML = `<p style="text-align:center; opacity:0.6; padding:20px;">${t("reportes_sin_citas_mes")}</p>`;
            return;
        }

        const medicoTexto = r.medico_top
            ? `${r.medico_top} (${r.medico_top_citas})`
            : t("reportes_sin_datos_medico");

        const filas = [
            [t("reportes_total_citas"), r.total_citas ?? 0],
            [t("reportes_completadas"), r.completadas ?? 0],
            [t("reportes_asistieron"), r.asistieron ?? 0],
            [t("reportes_no_shows"), r.no_shows ?? 0],
            [t("reportes_canceladas"), r.canceladas ?? 0],
            [t("reportes_cobrado"), `Q${Number(r.total_cobrado ?? 0).toFixed(2)}`],
            [t("reportes_pendiente"), `Q${Number(r.total_pendiente ?? 0).toFixed(2)}`],
            [t("reportes_medico_top"), medicoTexto],
        ];

        panel.innerHTML = `
            <div class="card" style="padding:0; overflow:hidden;">
                ${filas.map(([label, valor]) => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 18px; border-bottom:1px solid rgba(255,255,255,0.06);">
                        <span style="color:var(--text-secondary, #94a3b8); font-size:14px;">${label}</span>
                        <span style="color:var(--text-primary, #e2e8f0); font-weight:bold; font-size:14px;">${valor}</span>
                    </div>
                `).join("")}
            </div>
        `;
    } catch (e) {
        console.error("Error cargando reporte mensual:", e);
        panel.innerHTML = `<p style="text-align:center; color:#ef4444; padding:20px;">Error al cargar el reporte.</p>`;
    }
}

function volver() {
    window.location.href = "dashboard.html";
}

document.addEventListener("DOMContentLoaded", () => {
    poblarSelectoresReporte();
    verReporte();

    const selMes = document.getElementById("reporteMes");
    const selAnio = document.getElementById("reporteAnio");
    if (selMes) selMes.addEventListener("change", verReporte);
    if (selAnio) selAnio.addEventListener("change", verReporte);
});
