/* =============================================
    AUDITORÍA | ClinicOS
    Registro central de acciones (usado por todas las páginas)
============================================= */

/**
 * Registra una acción en la tabla de auditoría.
 * Se llama desde pacientes.js, citas.js, historial.js, usuarios.js
 * accion: "crear" | "editar" | "eliminar" | "desactivar" | "reactivar" | "resetear_clave"
 * entidad: "paciente" | "cita" | "nota_medica" | "usuario"
 * detalle: texto corto describiendo qué pasó (ej. "Diego Girón")
 */
async function registrarAuditoria(accion, entidad, detalle) {
    try {
        const clinicaID = localStorage.getItem("clinicaID");
        if (!clinicaID) return;

        const { data: userData } = await supabaseClient.auth.getUser();
        const usuarioNombre = localStorage.getItem("usuario") || "Usuario";
        const usuarioEmail = userData?.user?.email || "";
        const usuarioId = userData?.user?.id || null;

        await supabaseClient.from('auditoria').insert([{
            clinica_id: clinicaID,
            usuario_id: usuarioId,
            usuario_nombre: usuarioNombre,
            usuario_email: usuarioEmail,
            accion: accion,
            entidad: entidad,
            detalle: detalle || ""
        }]);
    } catch (e) {
        console.warn("No se pudo registrar en auditoría:", e);
    }
}
