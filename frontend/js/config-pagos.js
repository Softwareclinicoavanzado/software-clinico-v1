/* =============================================
    CONFIGURACIÓN DE PAGOS | ClinicOS
    El admin elige su país y el sistema preselecciona la mejor
    pasarela de pago disponible para ese país (Recurrente para
    Centroamérica, Stripe para EE.UU./Europa/México/Brasil,
    MercadoPago para el resto de Sudamérica). El admin puede
    cambiarlo manualmente si quiere.
============================================= */
const clinicaID = typeof getClinicaID === "function" ? getClinicaID() : localStorage.getItem("clinicaID");
const rolActualPagos = localStorage.getItem("rol");

if (!clinicaID) {
    window.location.href = "index.html";
}
if (rolActualPagos !== "admin") {
    window.location.href = "dashboard.html";
}

// País -> { proveedor, moneda }. El admin puede cambiar el
// proveedor manualmente después si lo prefiere.
const PAISES_PROVEEDOR = {
    // Centroamérica -> Recurrente
    "Guatemala": { proveedor: "recurrente", moneda: "GTQ" },
    "El Salvador": { proveedor: "recurrente", moneda: "USD" },
    "Honduras": { proveedor: "recurrente", moneda: "HNL" },
    "Nicaragua": { proveedor: "recurrente", moneda: "NIO" },
    "Costa Rica": { proveedor: "recurrente", moneda: "CRC" },
    "Panamá": { proveedor: "recurrente", moneda: "USD" },
    // Norteamérica, México, Brasil y Europa -> Stripe
    "Estados Unidos": { proveedor: "stripe", moneda: "USD" },
    "Canadá": { proveedor: "stripe", moneda: "CAD" },
    "México": { proveedor: "stripe", moneda: "MXN" },
    "Brasil": { proveedor: "stripe", moneda: "BRL" },
    "España": { proveedor: "stripe", moneda: "EUR" },
    "Francia": { proveedor: "stripe", moneda: "EUR" },
    "Alemania": { proveedor: "stripe", moneda: "EUR" },
    "Italia": { proveedor: "stripe", moneda: "EUR" },
    "Portugal": { proveedor: "stripe", moneda: "EUR" },
    "Países Bajos": { proveedor: "stripe", moneda: "EUR" },
    "Irlanda": { proveedor: "stripe", moneda: "EUR" },
    "Reino Unido": { proveedor: "stripe", moneda: "GBP" },
    // Resto de Sudamérica -> MercadoPago
    "Argentina": { proveedor: "mercadopago", moneda: "ARS" },
    "Colombia": { proveedor: "mercadopago", moneda: "COP" },
    "Chile": { proveedor: "mercadopago", moneda: "CLP" },
    "Perú": { proveedor: "mercadopago", moneda: "PEN" },
    "Uruguay": { proveedor: "mercadopago", moneda: "UYU" },
};

const AYUDA_PROVEEDOR = {
    recurrente: {
        nombre: "Recurrente",
        pasos: "Crea una cuenta gratis en recurrente.com → Configuración → Llaves API (secret key) y Webhooks (para el webhook secret).",
        urlWebhook: "https://klaygjvawybfksmahbhd.supabase.co/functions/v1/webhook-recurrente-deposito",
    },
    stripe: {
        nombre: "Stripe",
        pasos: "Crea una cuenta en stripe.com → Developers → API keys (secret key) → Developers → Webhooks → Add endpoint (para el webhook secret).",
        urlWebhook: "https://klaygjvawybfksmahbhd.supabase.co/functions/v1/webhook-stripe-deposito",
    },
    mercadopago: {
        nombre: "MercadoPago",
        pasos: "Crea una cuenta en mercadopago.com → Tus integraciones → Credenciales de producción (Access Token) y Webhooks (para el webhook secret / clave secreta).",
        urlWebhook: "https://klaygjvawybfksmahbhd.supabase.co/functions/v1/webhook-mercadopago-deposito",
    },
};

async function obtenerTokenSesion() {
    const { data } = await supabaseClient.auth.getSession();
    return data && data.session ? data.session.access_token : null;
}

function poblarSelectPais() {
    const sel = document.getElementById("pagoPais");
    if (!sel) return;
    sel.innerHTML = `<option value="">-- Selecciona tu país --</option>`;
    Object.keys(PAISES_PROVEEDOR).forEach((pais) => {
        const op = document.createElement("option");
        op.value = pais;
        op.textContent = pais;
        sel.appendChild(op);
    });
}

function actualizarAyudaProveedor() {
    const proveedor = document.getElementById("pagoProveedor").value;
    const ayuda = AYUDA_PROVEEDOR[proveedor];
    const panel = document.getElementById("pagoAyudaProveedor");
    const linkWebhook = document.getElementById("pagoUrlWebhook");
    if (!ayuda || !panel) return;
    panel.innerText = `${ayuda.nombre}: ${ayuda.pasos}`;
    if (linkWebhook) linkWebhook.innerText = ayuda.urlWebhook;
}

function alCambiarPais() {
    const pais = document.getElementById("pagoPais").value;
    const config = PAISES_PROVEEDOR[pais];
    if (!config) return;
    document.getElementById("pagoProveedor").value = config.proveedor;
    document.getElementById("pagoMoneda").value = config.moneda;
    actualizarAyudaProveedor();
}

async function cargarConfigActual() {
    const token = await obtenerTokenSesion();
    if (!token) return;

    try {
        const res = await fetch("https://klaygjvawybfksmahbhd.supabase.co/functions/v1/obtener-config-pagos", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ clinica_id: clinicaID }),
        });
        const data = await res.json();
        if (!res.ok || !data.existe) return;

        if (data.pais) document.getElementById("pagoPais").value = data.pais;
        document.getElementById("pagoProveedor").value = data.proveedor;
        document.getElementById("pagoMoneda").value = data.moneda;
        document.getElementById("pagoMonto").value = data.monto_deposito || "";
        document.getElementById("pagoActivo").checked = !!data.activo;

        if (data.tiene_secret_key) {
            document.getElementById("pagoSecretKey").placeholder = "•••• •••• (ya guardada — deja en blanco para no cambiarla)";
        }
        if (data.tiene_webhook_secret) {
            document.getElementById("pagoWebhookSecret").placeholder = "•••• •••• (ya guardado — deja en blanco para no cambiarlo)";
        }
        actualizarAyudaProveedor();
    } catch (e) {
        console.warn("No se pudo cargar la configuración de pagos:", e);
    }
}

async function guardarConfigPagos() {
    const token = await obtenerTokenSesion();
    if (!token) {
        alert("Tu sesión expiró, vuelve a iniciar sesión.");
        return;
    }

    const proveedor = document.getElementById("pagoProveedor").value;
    const pais = document.getElementById("pagoPais").value;
    const moneda = document.getElementById("pagoMoneda").value.trim().toUpperCase();
    const monto = document.getElementById("pagoMonto").value;
    const activo = document.getElementById("pagoActivo").checked;
    const secretKey = document.getElementById("pagoSecretKey").value;
    const webhookSecret = document.getElementById("pagoWebhookSecret").value;

    if (!proveedor || !moneda || !monto) {
        alert("Completa proveedor, moneda y monto del depósito.");
        return;
    }

    const btn = document.getElementById("btnGuardarPagos");
    if (btn) { btn.disabled = true; btn.innerText = "Guardando..."; }

    try {
        const res = await fetch("https://klaygjvawybfksmahbhd.supabase.co/functions/v1/guardar-config-pagos", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                clinica_id: clinicaID,
                proveedor,
                pais: pais || null,
                moneda,
                monto_deposito: monto,
                activo,
                secret_key: secretKey,
                webhook_secret: webhookSecret,
            }),
        });
        const data = await res.json();
        if (!res.ok || !data.exito) throw new Error(data.error || "Error desconocido");

        alert("✅ Configuración de pagos guardada.");
        document.getElementById("pagoSecretKey").value = "";
        document.getElementById("pagoWebhookSecret").value = "";
        cargarConfigActual();
    } catch (e) {
        console.error("Error guardando configuración de pagos:", e);
        alert("Error al guardar: " + e.message);
    } finally {
        if (btn) { btn.disabled = false; btn.innerText = "💾 Guardar Configuración"; }
    }
}

function volver() {
    window.location.href = "dashboard.html";
}

document.addEventListener("DOMContentLoaded", () => {
    poblarSelectPais();
    actualizarAyudaProveedor();
    cargarConfigActual();

    const selPais = document.getElementById("pagoPais");
    const selProveedor = document.getElementById("pagoProveedor");
    if (selPais) selPais.addEventListener("change", alCambiarPais);
    if (selProveedor) selProveedor.addEventListener("change", actualizarAyudaProveedor);
});
