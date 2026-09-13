(() => {
  const grid = document.querySelector('#merch-grid');
  const status = document.querySelector('#merch-live-status');
  const data = window.blapposMerchProducts || {products: []};
  const products = Array.isArray(data.products) ? data.products : [];

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  const productCard = product => {
    const image = product.image || '../assets/blappos-logo.png';
    return `<a class="merch-card" href="${escapeHtml(product.product_url)}" target="_blank" rel="noopener">
      <span class="merch-card-image"><img src="${escapeHtml(image)}" alt="${escapeHtml(product.title)} Printify mockup" width="700" height="700" loading="lazy"></span>
      <span class="merch-card-copy">
        <span>${escapeHtml(product.category || 'Blappos merch')}</span>
        <h3>${escapeHtml(product.title)}</h3>
        <p>${escapeHtml(product.blurb || 'Official Blappos logo gear, printed to order.')}</p>
        <p class="merch-price">${escapeHtml(product.price || '')}</p>
        <b class="merch-buy">BUY ON BLAPPOS PRINTIFY ↗</b>
      </span>
    </a>`;
  };

  const magnetCard = `<a class="merch-card magnets" href="https://blappos.printify.me" target="_blank" rel="noopener">
    <span class="merch-card-image"><img src="../assets/blappos-logo.png" alt="Blappos magnet collection" width="900" height="600" loading="lazy"></span>
    <span class="merch-card-copy">
      <span>Magnets</span>
      <h3>Blappos Story Magnets</h3>
      <p>The full rotating archive of bad-news souvenir magnets. Every story deserves refrigerator space.</p>
      <p class="merch-price">From $9.99</p>
      <b class="merch-buy">SHOP ALL MAGNETS ↗</b>
    </span>
  </a>`;

  if (grid) {
    if (products.length) {
      grid.innerHTML = products.map(productCard).join('') + magnetCard;
    } else {
      grid.innerHTML = `<div class="merch-loading">The first Blappos logo drop is being stocked right now. The magnet shop is already live.</div>${magnetCard}`;
    }
  }

  if (status) {
    status.textContent = products.length
      ? `${products.length} logo products live + the full magnet archive.`
      : 'Logo gear is being created in Printify now.';
  }

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }
})();
