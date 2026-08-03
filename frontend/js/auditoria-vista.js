/* =============================================
    AUDITORÍA | Vista y filtros de la pantalla auditoria.html
============================================= */
const clinicaID = localStorage.getItem("clinicaID");
const rolActual = localStorage.getItem("rol");

if (!clinicaID) {
    window.location.href = "index.html";
}
if (rolActual !== "admin") {
    alert("Acceso denegado: solo el administrador puede ver la auditoría.");
    window.location.href = "dashboard.html";
}

let registrosAuditoria = [];

/* =========================
   Helpers visuales (mismo lenguaje que el resto del sistema)
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

function claseBadgeAccion(accion) {
    if (accion === "crear") return "note-chip-success";
    if (accion === "eliminar") return "note-chip-danger";
    if (accion === "editar") return "note-chip-info";
    if (accion === "desactivar") return "note-chip-warning";
    if (accion === "reactivar") return "note-chip-success";
    if (accion === "resetear_clave") return "note-chip-warning";
    return "note-chip-info";
}

function etiquetaAccion(accion) {
    const mapa = {
        crear: "auditoria_accion_crear",
        editar: "auditoria_accion_editar",
        eliminar: "auditoria_accion_eliminar",
        desactivar: "desactivar",
        reactivar: "reactivar",
        resetear_clave: "resetear_clave"
    };
    const clave = mapa[accion];
    return clave ? t(clave).replace(/^[^\w\sáéíóúÁÉÍÓÚñÑ]+/, '').trim() : accion;
}

function etiquetaEntidad(entidad) {
    const mapa = {
        paciente: "auditoria_entidad_paciente",
        cita: "auditoria_entidad_cita",
        nota_medica: "auditoria_entidad_nota",
        usuario: "auditoria_entidad_usuario",
        auditoria: "auditoria_entidad_auditoria"
    };
    const clave = mapa[entidad];
    return clave ? t(clave) : entidad;
}

function formatearFechaHora(iso) {
    if (!iso) return "";
    const fecha = new Date(iso);
    const lang = localStorage.getItem("lang") || "es";
    const localeMap = { es: "es-GT", en: "en-US", fr: "fr-FR" };
    return fecha.toLocaleString(localeMap[lang] || "es-GT", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}

async function cargarAuditoria() {
    const lista = document.getElementById("listaAuditoria");
    if (!lista) return;

    const { data, error } = await supabaseClient
        .from("auditoria")
        .select("*")
        .eq("clinica_id", clinicaID)
        .order("creado", { ascending: false })
        .limit(500);

    if (error) {
        lista.innerHTML = "<li style='color:#f87171;'>Error al cargar la auditoría</li>";
        console.error("Error al cargar auditoría:", error);
        return;
    }

    registrosAuditoria = data || [];
    poblarFiltroUsuarios();
    aplicarFiltrosAuditoria();
}

function poblarFiltroUsuarios() {
    const sel = document.getElementById("filtroUsuarioAuditoria");
    if (!sel) return;
    const valorActual = sel.value;

    const usuarios = [...new Set(registrosAuditoria.map(r => r.usuario_nombre).filter(Boolean))].sort();

    sel.innerHTML = `<option value="">${t("auditoria_todos_usuarios") || "Todos los usuarios"}</option>`;
    usuarios.forEach(u => {
        const op = document.createElement("option");
        op.value = u;
        op.textContent = u;
        sel.appendChild(op);
    });
    sel.value = usuarios.includes(valorActual) ? valorActual : "";
}

function toggleFiltrosAuditoriaPanel() {
    const panel = document.getElementById("panelFiltrosAuditoria");
    const btn = document.getElementById("btnToggleFiltrosAuditoria");
    if (!panel) return;
    const abierto = panel.style.display === "block";
    panel.style.display = abierto ? "none" : "block";
    if (btn) btn.classList.toggle("open", !abierto);
}

function filtrosAuditoriaActivosCount() {
    let count = 0;
    const accion = document.getElementById("filtroAccion");
    const entidad = document.getElementById("filtroEntidad");
    const usuario = document.getElementById("filtroUsuarioAuditoria");
    if (accion && accion.value) count++;
    if (entidad && entidad.value) count++;
    if (usuario && usuario.value) count++;
    return count;
}

function actualizarBadgeFiltrosAuditoria() {
    const badge = document.getElementById("filtrosBadgeAuditoria");
    if (!badge) return;
    const n = filtrosAuditoriaActivosCount();
    if (n > 0) {
        badge.style.display = "inline-flex";
        badge.innerText = n;
    } else {
        badge.style.display = "none";
    }
}

function aplicarFiltrosAuditoria() {
    const texto = (document.getElementById("busquedaAuditoria").value || "").toLowerCase();
    const accion = document.getElementById("filtroAccion") ? document.getElementById("filtroAccion").value : "";
    const entidad = document.getElementById("filtroEntidad") ? document.getElementById("filtroEntidad").value : "";
    const usuario = document.getElementById("filtroUsuarioAuditoria") ? document.getElementById("filtroUsuarioAuditoria").value : "";

    const filtrados = registrosAuditoria.filter(r => {
        const coincideTexto = !texto ||
            (r.usuario_nombre && r.usuario_nombre.toLowerCase().includes(texto)) ||
            (r.detalle && r.detalle.toLowerCase().includes(texto));
        if (!coincideTexto) return false;

        if (accion && r.accion !== accion) return false;
        if (entidad && r.entidad !== entidad) return false;
        if (usuario && r.usuario_nombre !== usuario) return false;

        return true;
    });

    actualizarBadgeFiltrosAuditoria();
    renderAuditoria(filtrados);
}

function limpiarFiltrosAuditoria() {
    const busqueda = document.getElementById("busquedaAuditoria");
    const accion = document.getElementById("filtroAccion");
    const entidad = document.getElementById("filtroEntidad");
    const usuario = document.getElementById("filtroUsuarioAuditoria");
    if (busqueda) busqueda.value = "";
    if (accion) accion.value = "";
    if (entidad) entidad.value = "";
    if (usuario) usuario.value = "";
    actualizarBadgeFiltrosAuditoria();
    renderAuditoria(registrosAuditoria);
}

function renderAuditoria(data) {
    const lista = document.getElementById("listaAuditoria");
    if (!lista) return;
    lista.innerHTML = "";

    if (!data || !data.length) {
        lista.innerHTML = `<li style='color:var(--text-secondary); text-align:center; background:none; border:none; box-shadow:none;'>${t("auditoria_sin_registros") || "No hay registros de auditoría"}</li>`;
        return;
    }

    data.forEach(r => {
        const li = document.createElement("li");
        li.className = "note-card";
        li.innerHTML = `
            <div class="note-card-top">
                <div class="patient-identity">
                    <div class="patient-avatar" style="background:${colorAvatar(r.usuario_nombre)}20; color:${colorAvatar(r.usuario_nombre)}; border-color:${colorAvatar(r.usuario_nombre)}40;">
                        ${iniciales(r.usuario_nombre)}
                    </div>
                    <div>
                        <div class="patient-name">${r.usuario_nombre || "Usuario"}</div>
                        <div class="patient-dpi">${formatearFechaHora(r.creado)}</div>
                    </div>
                </div>
                <span class="note-chip ${claseBadgeAccion(r.accion)}">${etiquetaAccion(r.accion)}</span>
            </div>
            <p class="note-text">
                <strong style="color:#93c5fd;">${etiquetaEntidad(r.entidad)}</strong>
                ${r.detalle ? " — " + r.detalle : ""}
            </p>
        `;
        lista.appendChild(li);
    });
}

/* =========================================================
   EXPORTAR AUDITORÍA A EXCEL
========================================================= */
function exportarAuditoriaExcel() {
    const datos = registrosAuditoria.filter(r => {
        const texto = (document.getElementById("busquedaAuditoria").value || "").toLowerCase();
        const accion = document.getElementById("filtroAccion") ? document.getElementById("filtroAccion").value : "";
        const entidad = document.getElementById("filtroEntidad") ? document.getElementById("filtroEntidad").value : "";
        const usuario = document.getElementById("filtroUsuarioAuditoria") ? document.getElementById("filtroUsuarioAuditoria").value : "";
        const coincideTexto = !texto || (r.usuario_nombre && r.usuario_nombre.toLowerCase().includes(texto)) || (r.detalle && r.detalle.toLowerCase().includes(texto));
        if (!coincideTexto) return false;
        if (accion && r.accion !== accion) return false;
        if (entidad && r.entidad !== entidad) return false;
        if (usuario && r.usuario_nombre !== usuario) return false;
        return true;
    });

    if (!datos.length) {
        alert(t("auditoria_sin_registros") || "No hay registros de auditoría");
        return;
    }

    const filas = datos.map(r => ({
        [t("auditoria_filtro_usuario") || "Usuario"]: r.usuario_nombre || "",
        [t("info_correo") || "Correo"]: r.usuario_email || "",
        [t("auditoria_filtro_accion") || "Acción"]: etiquetaAccion(r.accion),
        [t("auditoria_filtro_entidad") || "Sección"]: etiquetaEntidad(r.entidad),
        "Detalle": r.detalle || "",
        "Fecha": formatearFechaHora(r.creado)
    }));

    const ws = XLSX.utils.json_to_sheet(filas);
    ws['!cols'] = [{ wch: 22 }, { wch: 26 }, { wch: 14 }, { wch: 16 }, { wch: 40 }, { wch: 20 }];
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, (t("auditoria_titulo") || "Auditoria").substring(0, 31));

    const clinicaNombre = (localStorage.getItem("clinicaNombre") || "ClinicOS")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "_");
    const hoy = new Date();
    const fechaArchivo = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

    XLSX.writeFile(wb, `${clinicaNombre}_Auditoria_${fechaArchivo}.xlsx`);
}

/* =========================================================
   DEPURAR REGISTROS ANTIGUOS (más de 12 meses)
   La propia depuración queda registrada — nunca borra todo sin rastro
========================================================= */
async function depurarAuditoriaAntigua() {
    const fechaLimite = new Date();
    fechaLimite.setMonth(fechaLimite.getMonth() - 12);
    const fechaLimiteISO = fechaLimite.toISOString();
    const fechaLimiteLegible = formatearFechaHora(fechaLimiteISO);

    const antiguos = registrosAuditoria.filter(r => new Date(r.creado) < fechaLimite);

    if (antiguos.length === 0) {
        alert(t("auditoria_sin_antiguos") || "No hay registros de más de 12 meses para depurar.");
        return;
    }

    const confirmado = confirm(
        `⚠️ ${t("auditoria_confirmar_depurar") || "Esto eliminará permanentemente"} ${antiguos.length} ${t("auditoria_registros_anteriores") || "registros anteriores a"} ${fechaLimiteLegible}.\n\n${t("auditoria_recomendacion_exportar") || "Recomendamos exportar antes de continuar."}\n\n${t("auditoria_continuar") || "¿Deseas continuar?"}`
    );
    if (!confirmado) return;

    try {
        const { error } = await supabaseClient
            .from('auditoria')
            .delete()
            .eq('clinica_id', clinicaID)
            .lt('creado', fechaLimiteISO);

        if (error) throw error;

        if (typeof registrarAuditoria === "function") {
            await registrarAuditoria("eliminar", "auditoria", `Depuración: ${antiguos.length} registros anteriores a ${fechaLimiteLegible}`);
        }

        alert(`✅ ${antiguos.length} ${t("auditoria_registros_eliminados") || "registros eliminados."}`);
        cargarAuditoria();
    } catch (e) {
        console.error("Error al depurar auditoría:", e);
        alert("Error al depurar: " + e.message);
    }
}

/* =========================================================
   RETRADUCCIÓN AL CAMBIAR IDIOMA SIN RECARGAR
========================================================= */
function retraducirContenidoDinamico() {
    poblarFiltroUsuarios();
    aplicarFiltrosAuditoria();
}

function volver() { window.location.href = "dashboard.html"; }

cargarAuditoria();
