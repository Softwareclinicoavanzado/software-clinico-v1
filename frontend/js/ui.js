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
    const t = document.createElement("div");
    t.className = `toast ${type}`;
    t.textContent = message;
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
