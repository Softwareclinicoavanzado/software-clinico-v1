const UI = (() => {
  let container;

  function init() {
    if (container) return;
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  function toast(message, type = "info", time = 3000) {
    init();
    
    // Obtenemos el idioma actual
    const currentLang = localStorage.getItem("lang") || "es";
    
    // Si el mensaje es una "llave" del diccionario, lo traducimos. 
    // Si no, mostramos el mensaje tal cual.
    let finalMessage = message;
    if (typeof translations !== 'undefined' && translations[currentLang] && translations[currentLang][message]) {
        finalMessage = translations[currentLang][message];
    }

    const t = document.createElement("div");
    t.className = `toast ${type}`;
    t.textContent = finalMessage;
    container.appendChild(t);

    setTimeout(() => {
      t.classList.add("hide");
      setTimeout(() => t.remove(), 400);
    }, time);
  }

  return {
    success: msg => toast(msg, "success"),
    error: msg => toast(msg, "error"),
    info: msg => toast(msg, "info")
  };
})();
