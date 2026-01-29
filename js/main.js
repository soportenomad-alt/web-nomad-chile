(() => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  function setMenu(open) {
    if (!navMenu || !navToggle) return;
    navMenu.dataset.open = open ? "true" : "false";
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const open = navMenu.dataset.open !== "true";
      setMenu(open);
    });

    navMenu.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (a) setMenu(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setMenu(false);
    });

    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) setMenu(false);
    });
  }

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, "", id);
    });
  });

  // Demo mailto
  window.NOMAD_send = (event) => {
    event.preventDefault();
    const form = event.target;
    const name = form.name?.value?.trim() || "";
    const email = form.email?.value?.trim() || "";
    const message = form.message?.value?.trim() || "";
    const subject = encodeURIComponent("Solicitud de información | Nomad Genetics");
    const body = encodeURIComponent(`Nombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${message}\n`);
    const to = "logistica.cl@nomadgenetics.com";
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    return false;
  };
})();
