/* =====================================================================
   TOPHAXHI SNEAKERS — product.js
   Rendon PDP-në në mënyrë dinamike nga product.html?id=...
   Përfshin: galerinë, përzgjedhjen e madhësisë, 3 kanalet e porosisë,
   shiritin sticky + sheet-in, bllokun e autenticitetit, të ngjashmet,
   SEO per-produkt (title/meta/canonical/OG) dhe JSON-LD Product.
   ===================================================================== */
(function () {
  'use strict';

  var U = TPX.util;
  var state = { store: null, product: null, size: null };

  function getId() { return new URLSearchParams(location.search).get('id'); }

  /* ---------- SEO per-produkt ---------- */
  function applySeo(p, store) {
    var title = p.seoTitle || (p.name + ' ' + (p.colorway || '') + ' — Bli në Kosovë | Tophaxhi');
    var desc = p.seoDescription || ('Bli ' + p.name + ' origjinale në Kosovë. Pagesa në dorë, dërgesa në tërë Kosovën.');
    document.title = title;
    setMeta('name', 'description', desc);
    var url = U.absoluteUrl(U.productUrl(p), store.settings);
    var canon = document.getElementById('pdp-canonical'); if (canon) canon.href = url;
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', U.absoluteUrl(U.resolveAsset(p.images[0]), store.settings));
  }
  function setMeta(attr, key, val) {
    var m = document.head.querySelector('meta[' + attr + '="' + key + '"]');
    if (!m) { m = document.createElement('meta'); m.setAttribute(attr, key); document.head.appendChild(m); }
    m.setAttribute('content', val);
  }
  function injectJsonLd(p, store) {
    var onSale = p.oldPrice && p.oldPrice > p.price;
    var data = {
      '@context': 'https://schema.org/', '@type': 'Product',
      name: p.name + ' ' + (p.colorway || ''),
      image: [U.absoluteUrl(U.resolveAsset(p.images[0]), store.settings)],
      description: p.seoDescription || p.description || '',
      brand: { '@type': 'Brand', name: TPX.query.brandName(store, p.brand) },
      offers: {
        '@type': 'Offer',
        price: String(p.price), priceCurrency: p.currency || 'EUR',
        availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: U.absoluteUrl(U.productUrl(p), store.settings),
        seller: { '@type': 'Organization', name: 'Tophaxhi Sneakers' }
      }
    };
    if (onSale) data.offers.priceValidUntil = '2026-12-31';
    var s = document.createElement('script'); s.type = 'application/ld+json';
    s.textContent = JSON.stringify(data); document.head.appendChild(s);

    // BreadcrumbList
    var base = (store.settings.siteUrl || 'https://tophaxhi.com').replace(/\/+$/, '');
    var crumb = {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ballina', item: base + '/' },
        { '@type': 'ListItem', position: 2, name: 'Atletet', item: base + '/atletet.html' },
        { '@type': 'ListItem', position: 3, name: p.name, item: U.absoluteUrl(U.productUrl(p), store.settings) }
      ]
    };
    var s2 = document.createElement('script'); s2.type = 'application/ld+json';
    s2.textContent = JSON.stringify(crumb); document.head.appendChild(s2);
  }

  /* ---------- Markup ---------- */
  function galleryHtml(p) {
    var imgs = p.images.map(U.resolveAsset);
    var main = '<div class="pdp__main-img"><img id="pdp-main-img" src="' + U.escapeAttr(imgs[0]) +
      '" alt="' + U.escapeAttr(U.altFor(p)) + '" width="800" height="1000" ' +
      'onerror="this.onerror=null;this.src=\'assets/products/_placeholder.svg\'" /></div>';
    var thumbs = imgs.length > 1
      ? '<div class="pdp__thumbs" role="tablist">' + imgs.map(function (src, i) {
          return '<button class="pdp__thumb' + (i === 0 ? ' is-active' : '') + '" data-src="' + U.escapeAttr(src) +
            '" aria-label="Foto ' + (i + 1) + '"><img src="' + U.escapeAttr(src) + '" alt="" loading="lazy"/></button>';
        }).join('') + '</div>'
      : '';
    return '<div class="pdp__gallery">' + main + thumbs + '</div>';
  }

  function sizesHtml(p) {
    if (!p.sizes.length) return '';
    var btns = p.sizes.map(function (s) {
      var dis = s.available ? '' : ' disabled aria-disabled="true"';
      return '<button type="button" class="size-btn" data-size="' + U.escapeAttr(s.eu) + '"' + dis + '>EU ' + U.escapeHtml(s.eu) + '</button>';
    }).join('');
    return '<div class="size-select">' +
      '<div class="size-select__head"><span class="field__label">Madhësia (EU)</span>' +
      '<span class="size-hint" id="size-hint">Zgjedh madhësinë</span></div>' +
      '<div class="size-grid" id="size-grid" role="group" aria-label="Madhësia">' + btns + '</div></div>';
  }

  function priceHtml(p) {
    var onSale = p.oldPrice && p.oldPrice > p.price;
    return onSale
      ? '<span class="pdp__price pdp__price--sale">' + U.formatPrice(p.price) + '</span>' +
        '<span class="pdp__oldprice">' + U.formatPrice(p.oldPrice) + '</span>' +
        '<span class="badge badge--sale">Ulje</span>'
      : '<span class="pdp__price">' + U.formatPrice(p.price) + '</span>';
  }

  function ordersHtml() {
    return '<div class="pdp__orders" id="pdp-orders">' +
      '<button type="button" class="btn btn--wa btn--block" data-channel="whatsapp">' +
        iconWa() + ' Porosit në WhatsApp</button>' +
      '<button type="button" class="btn btn--ig btn--block" data-channel="instagram">' +
        iconIg() + ' Porosit në Instagram</button>' +
      '<button type="button" class="btn btn--ghost btn--block" data-channel="form">' +
        'Porosit në faqe (formë)</button>' +
      '</div>';
  }

  function infoHtml(p, store) {
    var deliveryNote = (store.settings.delivery && store.settings.delivery.etaNote) || '';
    return '<div class="pdp__info">' +
      '<p class="eyebrow">' + U.escapeHtml(TPX.query.brandName(store, p.brand)) + '</p>' +
      '<h1 class="display pdp__name">' + U.escapeHtml(p.name) + '</h1>' +
      '<p class="pdp__colorway">' + U.escapeHtml(p.colorway || '') + '</p>' +
      '<div class="pdp__price-row">' + priceHtml(p) +
        ' <span class="badge ' + (p.tier === 'hype' ? 'badge--tier badge--hype' : 'badge--tier') + '">' + U.escapeHtml(U.tierLabel(p.tier)) + '</span></div>' +
      sizesHtml(p) +
      ordersHtml() +
      '<div class="pdp__assurance">' +
        '<div class="pdp__assurance-item">' + iconCheck() + '<span><strong>100% origjinale</strong> — garantojmë autenticitetin.</span></div>' +
        '<div class="pdp__assurance-item">' + iconCash() + '<span><strong>Pagesa në dorë</strong> — paguan kur t\'i marrësh.</span></div>' +
        '<div class="pdp__assurance-item">' + iconTruck() + '<span><strong>Dërgesa në tërë Kosovën</strong>' + (deliveryNote ? ' — ' + U.escapeHtml(deliveryNote) : '') + '</span></div>' +
      '</div>' +
      (p.description ? '<div class="pdp__desc"><h2 class="pdp__desc-title">Përshkrimi</h2><p>' + U.escapeHtml(p.description) + '</p></div>' : '') +
      '</div>';
  }

  /* ---------- Veprimet e porosisë ---------- */
  function requireSize() {
    if (state.size) return true;
    if (window.Toast) Toast.show('Të lutem zgjedh madhësinë', { icon: false });
    var grid = document.getElementById('size-grid');
    if (grid) { grid.classList.add('shake'); setTimeout(function () { grid.classList.remove('shake'); }, 500); grid.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    var hint = document.getElementById('size-hint'); if (hint) hint.classList.add('size-hint--alert');
    return false;
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(fallbackCopy.bind(null, text));
    }
    return Promise.resolve(fallbackCopy(text));
  }
  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea'); ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    } catch (e) {}
  }

  function doChannel(channel) {
    var p = state.product, store = state.store;
    if (!requireSize()) return;
    var msg = TPX.order.message(store, p, state.size);

    if (channel === 'whatsapp') {
      window.open(TPX.order.whatsappLink(store, msg), '_blank', 'noopener');
    } else if (channel === 'instagram') {
      copyToClipboard(msg).then(function () {
        if (window.Toast) Toast.show('Mesazhi u kopjua — ngjite në DM.');
      });
      window.open(TPX.order.instagramDmLink(store), '_blank', 'noopener');
    } else if (channel === 'form') {
      location.href = 'porosia.html?id=' + encodeURIComponent(p.id) + '&size=' + encodeURIComponent(state.size);
    }
    closeSheet();
  }

  /* ---------- Sticky bar + sheet ---------- */
  function openSheet() {
    var p = state.product;
    document.getElementById('sheet-sub').textContent = p.name + (state.size ? ' · EU ' + state.size : '');
    var actions = document.getElementById('sheet-actions');
    actions.innerHTML =
      '<button type="button" class="btn btn--wa btn--block" data-channel="whatsapp">' + iconWa() + ' WhatsApp</button>' +
      '<button type="button" class="btn btn--ig btn--block" data-channel="instagram">' + iconIg() + ' Instagram</button>' +
      '<button type="button" class="btn btn--ghost btn--block" data-channel="form">Formë në faqe</button>';
    actions.querySelectorAll('[data-channel]').forEach(function (b) {
      b.addEventListener('click', function () { doChannel(b.getAttribute('data-channel')); });
    });
    var sheet = document.getElementById('order-sheet');
    sheet.hidden = false; requestAnimationFrame(function () { sheet.classList.add('is-open'); });
    document.body.style.overflow = 'hidden';
  }
  function closeSheet() {
    var sheet = document.getElementById('order-sheet');
    if (!sheet || sheet.hidden) return;
    sheet.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () { sheet.hidden = true; }, 260);
  }

  /* ---------- Init pas rendimit ---------- */
  function wire(p, store) {
    // galeria
    var grid = document.getElementById('pdp');
    grid.addEventListener('click', function (e) {
      var t = e.target.closest('.pdp__thumb');
      if (t) {
        document.getElementById('pdp-main-img').src = t.getAttribute('data-src');
        grid.querySelectorAll('.pdp__thumb').forEach(function (x) { x.classList.remove('is-active'); });
        t.classList.add('is-active');
        return;
      }
      var sz = e.target.closest('.size-btn');
      if (sz && !sz.disabled) {
        grid.querySelectorAll('.size-btn').forEach(function (x) { x.classList.remove('is-active'); });
        sz.classList.add('is-active');
        state.size = sz.getAttribute('data-size');
        var hint = document.getElementById('size-hint');
        if (hint) { hint.textContent = 'Madhësia: EU ' + state.size; hint.classList.remove('size-hint--alert'); }
        return;
      }
      var ord = e.target.closest('[data-channel]');
      if (ord) doChannel(ord.getAttribute('data-channel'));
    });

    // sticky bar
    var bar = document.getElementById('sticky-bar');
    document.getElementById('sticky-price').textContent = U.formatPrice(p.price);
    document.getElementById('sticky-name').textContent = p.name;
    bar.hidden = false;
    document.getElementById('sticky-order').addEventListener('click', openSheet);

    // sheet close
    document.getElementById('sheet-close').addEventListener('click', closeSheet);
    document.getElementById('order-sheet').addEventListener('click', function (e) {
      if (e.target.id === 'order-sheet') closeSheet();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
  }

  function renderRelated(p, store) {
    var rel = TPX.query.getRelated(store, p, 4);
    if (!rel.length) return;
    document.getElementById('related-grid').innerHTML = rel.map(function (x) { return TPX.render.productCard(x, store); }).join('');
    document.getElementById('related-section').hidden = false;
  }

  function run() {
    var id = getId();
    var pdp = document.getElementById('pdp');
    TPX.load().then(function (store) {
      state.store = store;
      var p = id ? TPX.query.getById(store, id) : null;
      if (!p) {
        pdp.hidden = true; pdp.setAttribute('aria-busy', 'false');
        document.getElementById('pdp-notfound').hidden = false;
        document.title = 'Produkti nuk u gjet | Tophaxhi Sneakers';
        return;
      }
      state.product = p;
      // breadcrumb
      document.getElementById('pdp-breadcrumb').insertAdjacentHTML('beforeend',
        ' <span aria-hidden="true">/</span> <span>' + U.escapeHtml(p.name) + '</span>');
      // render
      pdp.innerHTML = galleryHtml(p) + infoHtml(p, store);
      pdp.setAttribute('aria-busy', 'false');
      applySeo(p, store);
      injectJsonLd(p, store);
      wire(p, store);
      renderRelated(p, store);
      TPX.applyChrome(store);
    }).catch(function (err) {
      console.error('[TPX] PDP error', err);
      pdp.hidden = true; document.getElementById('pdp-notfound').hidden = false;
    });
  }

  /* ---------- Ikona inline ---------- */
  function iconWa() { return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18"><path d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-2.8.8.8-2.8-.2-.3A8 8 0 1112 20zm4.6-5.9c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.3-.6.8-.8 1-.1.2-.3.2-.5.1-.8-.4-1.6-.8-2.3-1.8-.2-.3.2-.3.5-.9.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.3-.8.8-.8 2s.8 2.3.9 2.4c.1.2 1.6 2.5 4 3.4 1.4.6 2 .6 2.7.5.4-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.1-.4-.2z"/></svg>'; }
  function iconIg() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" width="18" height="18"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"/></svg>'; }
  function iconCheck() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>'; }
  function iconCash() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>'; }
  function iconTruck() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 7h11v8H3z"/><path d="M14 10h4l3 3v2h-7z"/><circle cx="7" cy="17" r="1.6"/><circle cx="17.5" cy="17" r="1.6"/></svg>'; }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
