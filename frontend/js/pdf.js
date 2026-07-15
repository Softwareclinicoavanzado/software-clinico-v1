/* =========================
   PDF | ClinicOS
========================= */

function generarPDF(nombrePaciente, historial) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const tituloHistorial = t("historial_titulo") || "HISTORIAL CLÍNICO";
  const lang = localStorage.getItem("lang") || "es";
  const etiquetas = {
    es: { paciente: "Paciente:", fecha: "Fecha:", sinRegistros: "Este paciente no tiene registros en su historial." },
    en: { paciente: "Patient:", fecha: "Date:", sinRegistros: "This patient has no records in their history." },
    fr: { paciente: "Patient:", fecha: "Date:", sinRegistros: "Ce patient n'a aucun dossier dans son historique." }
  };
  const et = etiquetas[lang] || etiquetas.es;

  doc.setFontSize(18);
  doc.text(tituloHistorial.toUpperCase(), 105, 15, { align: "center" });
  doc.setFontSize(12);
  doc.text(`${et.paciente} ${nombrePaciente}`, 10, 30);
  doc.text(`${et.fecha} ${new Date().toLocaleString()}`, 10, 38);

  let y = 50;

  if (!historial || historial.length === 0) {
    doc.text(et.sinRegistros, 10, y);
  } else {
    historial.forEach((h, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${i + 1}. ${h.tipo} — ${h.fecha}`, 10, y);
      y += 6;
      const texto = doc.splitTextToSize(h.texto, 180);
      doc.text(texto, 10, y);
      y += texto.length * 6 + 8;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
  }

  doc.save(`Historial_${nombrePaciente}.pdf`);
}

/**
 * Función que el botón "Exportar Reporte" está llamando realmente.
 * Trae el historial del paciente desde Supabase y genera el PDF.
 */
async function descargarPDFHistorial(pacienteId) {
  try {
    const paciente = pacientes.find(p => Number(p.id) === Number(pacienteId));
    if (!paciente) {
      alert("No se encontró el paciente.");
      return;
    }

    const { data: historial, error } = await supabaseClient
      .from('historial')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('id', { ascending: false });

    if (error) throw error;

    generarPDF(paciente.nombre, historial || []);

  } catch (err) {
    console.error("Error al generar el reporte:", err);
    alert("No se pudo generar el reporte: " + err.message);
  }
}
