
(() => {
  const drawer = document.getElementById('nomadDrawer');
  const catalogEl = document.getElementById('drawerCatalog');
  const cartEl = document.getElementById('drawerCart');
  const noticeEl = document.getElementById('drawerNotice');
  const totalEl = document.getElementById('drawerTotal');
  const countEl = document.getElementById('drawerCount');
  const countBadges = Array.from(document.querySelectorAll('.js-cart-count'));
  const checkoutBtn = drawer?.querySelector('.js-checkout');
  const tabButtons = Array.from(drawer?.querySelectorAll('.drawer__tab') || []);

  const snipcartEl = document.getElementById('snipcart');
  const apiKey = snipcartEl?.getAttribute('data-api-key') || '';
  const shopEnabled = Boolean(apiKey) && !apiKey.includes('YOUR_SNIPCART_PUBLIC_API_KEY');
  if (noticeEl) noticeEl.hidden = shopEnabled;

  const STORAGE_KEY = 'nomad_cart_v1';

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

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  function saveCart(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function cartCount(items) {
    return items.reduce((a, x) => a + (Number(x.qty) || 0), 0);
  }
  function cartTotal(items) {
    return items.reduce((a, x) => a + ((Number(x.price_val) || 0) * (Number(x.qty) || 0)), 0);
  }

  function detectCurrency(items) {
    const first = items.find(x => x.price_nomad);
    const m = first?.price_nomad?.match(/\b([A-Z]{3})\b/);
    return m ? m[1] : 'MXN';
  }

  function formatMoney(value, currency = 'MXN') {
    try {
      return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(value);
    } catch {
      return '$' + String(value);
    }
  }

  function updateBadges() {
    const items = loadCart();
    const c = cartCount(items);
    countBadges.forEach(el => (el.textContent = String(c)));
    if (countEl) countEl.textContent = String(c);

    const cur = detectCurrency(items);
    if (totalEl) totalEl.textContent = formatMoney(cartTotal(items), cur);
  }

  function setTab(name) {
    tabButtons.forEach(btn => {
      const active = btn.getAttribute('data-tab') === name;
      btn.classList.toggle('is-active', active);
    });
    if (catalogEl) catalogEl.hidden = name !== 'catalogo';
    if (cartEl) cartEl.hidden = name !== 'carrito';
  }

  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTab('catalogo');
    updateBadges();
    renderCart();
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.addEventListener('click', (e) => {
    const t = e.target;
    const openBtn = t?.closest?.('.js-cart-open');
    const closeBtn = t?.closest?.('.js-cart-close');
    if (openBtn) {
      e.preventDefault();
      openDrawer();
    }
    if (closeBtn) {
      e.preventDefault();
      closeDrawer();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer?.classList.contains('is-open')) closeDrawer();
  });

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => setTab(btn.getAttribute('data-tab') || 'catalogo'));
  });

  async function loadCatalog() {
    const res = await fetch('data/catalogo.json', { cache: 'no-store' });
    const items = await res.json();
    return Array.isArray(items) ? items : [];
  }

  function slug(s){
    return String(s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/(^-|-$)/g,'');
  }

  function addToLocalCart(p, qty = 1) {
    const items = loadCart();
    const id = slug(p.title);
    const found = items.find(x => x.id === id);
    if (found) found.qty = (Number(found.qty) || 0) + qty;
    else items.push({
      id,
      title: p.title,
      price_val: Number(p.price_val || 0),
      price_nomad: p.price_nomad || '',
      image: p.image || '',
      qty
    });
    saveCart(items);
    updateBadges();
    renderCart();
  }

  function changeQty(id, delta) {
    const items = loadCart();
    const i = items.findIndex(x => x.id === id);
    if (i === -1) return;
    items[i].qty = (Number(items[i].qty) || 0) + delta;
    if (items[i].qty <= 0) items.splice(i, 1);
    saveCart(items);
    updateBadges();
    renderCart();
  }

  function renderCatalog(products) {
    if (!catalogEl) return;
    const canPay = shopEnabled;

    catalogEl.innerHTML = `
      <div class="drawerCatalogGrid">
        ${products.map((p) => {
          const id = slug(p.title);
          const price = Number(p.price_val || 0);
          const buyDisabled = price <= 0;
          const safeDesc = (p.description || '').replace(/</g,'&lt;').replace(/>/g,'&gt;');
          return `
            <article class="drawerProduct">
              <img src="${p.image || ''}" alt="${p.title || ''}">
              <div class="drawerProduct__body">
                <h4 class="drawerProduct__title">${p.title || ''}</h4>
                <div class="drawerProduct__price">${p.price_nomad || ''}</div>
                <div class="drawerProduct__desc">${safeDesc}</div>
                <div class="drawerProduct__actions">
                  <a class="drawerBtn" href="${p.link || '#'}" target="_blank" rel="noopener">Ver ficha</a>
                  <button class="drawerBtn drawerBtnPrimary js-add-to-cart"
                    type="button"
                    data-id="${id}"
                    ${buyDisabled ? 'disabled' : ''}
                    >
                    Agregar
                  </button>
                </div>
                ${(!canPay) ? '<div style="font-size:12px;color:#777;">Puedes armar tu carrito. Para cobrar, activa Snipcart.</div>' : ''}
                ${(price <= 0) ? '<div style="font-size:12px;color:#777;">Falta precio numérico para habilitar compra.</div>' : ''}
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;

    catalogEl.querySelectorAll('.js-add-to-cart').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const p = products.find(x => slug(x.title) === id);
        if (!p) return;
        if (Number(p.price_val || 0) <= 0) {
          toast('Este producto no tiene precio configurado.');
          return;
        }
        addToLocalCart(p, 1);
        toast('Agregado al carrito.');
      });
    });
  }

  function renderCart() {
    if (!cartEl) return;
    const items = loadCart();
    if (items.length === 0) {
      cartEl.innerHTML = `
        <div style="padding:10px 2px;color:#666;">
          Tu carrito está vacío. Ve a <strong>Pruebas</strong> y agrega una prueba.
        </div>`;
      return;
    }
    cartEl.innerHTML = `
      <div class="drawerCartList">
        ${items.map((x) => `
          <div class="cartLine">
            <div class="cartLine__info">
              <div class="cartLine__name">${x.title}</div>
              <div class="cartLine__meta">${x.price_nomad || ''}</div>
            </div>
            <div class="cartLine__qty">
              <button class="qtyBtn js-qty" data-id="${x.id}" data-delta="-1" type="button">−</button>
              <strong>${x.qty}</strong>
              <button class="qtyBtn js-qty" data-id="${x.id}" data-delta="1" type="button">+</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    cartEl.querySelectorAll('.js-qty').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id') || '';
        const delta = Number(btn.getAttribute('data-delta') || '0');
        changeQty(id, delta);
      });
    });
  }

  async function ensureSnipcartReady() {
    if (!shopEnabled) return false;
    const start = Date.now();
    while (Date.now() - start < 3500) {
      if (window.Snipcart && window.Snipcart.api && window.Snipcart.api.cart) return true;
      await new Promise(r => setTimeout(r, 120));
    }
    return Boolean(window.Snipcart && window.Snipcart.api);
  }

  async function checkout() {
    const items = loadCart();
    if (items.length === 0) {
      toast('Tu carrito está vacío.');
      setTab('catalogo');
      return;
    }
    if (!shopEnabled) {
      toast('Para cobrar: configura tu PUBLIC API KEY de Snipcart en index.html');
      return;
    }

    const ready = await ensureSnipcartReady();
    if (ready && window.Snipcart?.api?.cart?.items?.add) {
      const urlBase = window.location.href.split('#')[0];
      for (const it of items) {
        for (let q = 0; q < (Number(it.qty) || 0); q++) {
          try{
            await window.Snipcart.api.cart.items.add({
              id: it.id,
              name: it.title,
              price: Number(it.price_val) || 0,
              url: urlBase,
              image: it.image || ''
            });
          } catch(e) {}
        }
      }
    }
    document.getElementById('snipcartOpen')?.click();
  }

  checkoutBtn?.addEventListener('click', checkout);

  (async () => {
    if (!drawer || !catalogEl) return;
    try {
      const products = await loadCatalog();
      renderCatalog(products);
      updateBadges();
      renderCart();
    } catch (e) {
      catalogEl.innerHTML = `<div style="padding:10px 2px;color:#666;">No se pudo cargar el catálogo. Revisa <code>data/catalogo.json</code>.</div>`;
    }
  })();
})();
