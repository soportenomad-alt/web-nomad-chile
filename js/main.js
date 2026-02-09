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

  // --- Tienda / Carrito (Snipcart) ---
  const snipcartEl = document.getElementById('snipcart');
  const apiKey = snipcartEl?.getAttribute('data-api-key') || '';
  const shopEnabled = Boolean(apiKey) && !apiKey.includes('YOUR_SNIPCART_PUBLIC_API_KEY');
  window.NOMAD_SHOP_ENABLED = shopEnabled;

  const notice = document.getElementById('catalogNotice');
  if (notice) notice.hidden = shopEnabled;

  function toast(msg) {
    let el = document.getElementById('nomadToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'nomadToast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    window.clearTimeout(window.__nomadToastT);
    window.__nomadToastT = window.setTimeout(() => el.classList.remove('show'), 3200);
  }

  // Si la llave no está configurada, evita que el usuario vea "cargando infinito"
  if (!shopEnabled) {
    document.addEventListener('click', (e) => {
      const t = e.target;
      const checkout = t?.closest?.('.snipcart-checkout');
      const add = t?.closest?.('.snipcart-add-item');
      if (!checkout && !add) return;
      e.preventDefault();
      toast('Para activar compras: configura tu PUBLIC API KEY de Snipcart en index.html');
    }, true);
  }

})();
