const clinicas = {
  clinica1: {
    nombre: "Clínica San José",
    usuarios: {
      admin:     { password: "1234",   rol: "admin" },
      doctor:    { password: "doc123", rol: "doctor" },
      recepcion: { password: "rec123", rol: "recepcion" }
    }
  },
  clinica2: {
    nombre: "Clínica Dental Sonrisa",
    usuarios: {
      admin: { password: "abcd", rol: "admin" }
    }
  }
  // ← aquí agregas clínicas nuevas en el futuro
};
