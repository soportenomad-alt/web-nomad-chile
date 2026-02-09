(async () => {
  const grid = document.getElementById('catalogGrid');
  if (!grid) return;

  const shopEnabled = window.NOMAD_SHOP_ENABLED !== false;

  function slug(s){
    return String(s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/(^-|-$)/g,'');
  }

  const urlBase = window.location.href.split('#')[0];

  try{
    const res = await fetch('data/catalogo.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP '+res.status);
    const items = await res.json();

    grid.innerHTML = items.map((p) => {
      const id = slug(p.title);
      const price = Number(p.price_val || 0);
      const canBuy = shopEnabled && price > 0;

      const safeDesc = String(p.description || '').replace(/"/g,'&quot;');

      return `
        <article class="productCard">
          <img class="productImg" src="${p.image}" alt="${p.title}">
          <div class="productBody">
            <h3 class="productTitle">${p.title}</h3>
            <div class="productPrice">${p.price_nomad || ''}</div>
            <div class="productDesc">${p.description || ''}</div>

            <div class="productActions">
              <a class="btnSmall" href="${p.link || '#'}" target="_blank" rel="noopener">Ver ficha</a>

              <button
                class="btnAdd snipcart-add-item"
                ${canBuy ? '' : 'disabled'}
                data-item-id="${id}"
                data-item-name="${p.title}"
                data-item-price="${price}"
                data-item-url="${urlBase}"
                data-item-image="${p.image}"
                data-item-description="${safeDesc}"
              >
                Agregar
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  } catch (e){
    grid.innerHTML = `<div class="card">No se pudo cargar el catálogo. Revisa <code>data/catalogo.json</code>.</div>`;
  }
})();