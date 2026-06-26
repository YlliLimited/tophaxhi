/* =====================================================================
   TOPHAXHI SNEAKERS — data.js
   "Baza e të dhënave pa bazë": ngarkon skedarët statikë JSON me fetch().

   ZGJEDHJA E PERFORMANCËS:
   - Faqja publike lexon NJË skedar të kombinuar (data/products-index.json)
     në vend që të marrë qindra skedarë veç e veç → një kërkesë e shpejtë.
   - Skedarët individualë (/data/products/*.json) janë burimi i editueshëm
     që ndryshon Sveltia CMS; një GitHub Action rigjeneron index-in.
   - PDP-ja gjithashtu e gjen produktin nga i njëjti index (find by id),
     kështu nuk ka kërkesë shtesë.

   ROBUSTESË: çdo gjë e mbështjellë me try/catch. Një produkt i prishur
   anashkalohet, faqja nuk rrëzohet kurrë (asnjë "white screen").
   ===================================================================== */
window.TPX = (function () {
  'use strict';

  var TIER_LABELS = { everyday: 'Të përditshme', mainstream: 'Mainstream', hype: 'Hype' };

  /* ---------------- Util ---------------- */
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // Përkthe shtigjet "/assets/..." në relative ("assets/...") që funksionojnë
  // si në domen personal ashtu edhe në nën-shteg GitHub Pages. URL-të e plota lihen.
  function resolveAsset(path) {
    if (!path) return 'assets/products/_placeholder.svg';
    if (/^(https?:)?\/\//.test(path) || /^data:/.test(path)) return path;
    return String(path).replace(/^\/+/, '');
  }

  function formatPrice(n) {
    if (n == null || isNaN(n)) return '';
    return Math.round(Number(n)) + '€';
  }
  function tierLabel(t) { return TIER_LABELS[t] || t || ''; }

  function altFor(p) {
    return (p.name || 'Atlete') + ' ' + (p.colorway || '') + ' — bli online në Kosovë | Tophaxhi';
  }
  function productUrl(p) { return 'product.html?id=' + encodeURIComponent(p.id); }
  function absoluteUrl(path, settings) {
    var base = (settings && settings.siteUrl) ? settings.siteUrl.replace(/\/+$/, '') : '';
    return base + '/' + String(path).replace(/^\/+/, '');
  }

  /* ---------------- Ngarkimi (memoized) ---------------- */
  var _cache = {};
  function fetchJson(url) {
    if (_cache[url]) return _cache[url];
    _cache[url] = fetch(url, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' për ' + url);
        return r.json();
      })
      .catch(function (err) {
        console.warn('[TPX] Nuk u ngarkua ' + url + ':', err && err.message);
        return null; // mos e prish faqen
      });
    return _cache[url];
  }

  // Pastro/validizo një produkt; kthen null nëse i papërdorshëm.
  function sanitizeProduct(p) {
    if (!p || typeof p !== 'object') return null;
    if (!p.id || !p.name) return null;
    p.brand = p.brand || '';
    p.tier = p.tier || 'mainstream';
    p.price = (typeof p.price === 'number') ? p.price : parseFloat(p.price) || 0;
    p.oldPrice = (typeof p.oldPrice === 'number') ? p.oldPrice : (parseFloat(p.oldPrice) || null);
    p.sizes = Array.isArray(p.sizes) ? p.sizes : [];
    p.images = (Array.isArray(p.images) && p.images.length) ? p.images : ['/assets/products/_placeholder.svg'];
    p.inStock = p.inStock !== false;
    p.featured = !!p.featured;
    return p;
  }

  var _store = null;
  function load() {
    if (_store) return _store;
    _store = Promise.all([
      fetchJson('data/settings.json'),
      fetchJson('data/brands.json'),
      fetchJson('data/products-index.json'),
      fetchJson('data/reviews-index.json')
    ]).then(function (res) {
      var settings = res[0] || {};
      // brands.json mund të jetë { "brands": [...] } (CMS-friendly) ose array i drejtpërdrejtë
      var brands = (res[1] && Array.isArray(res[1].brands)) ? res[1].brands
                 : (Array.isArray(res[1]) ? res[1] : []);
      var productsLoaded = !!(res[2] && Array.isArray(res[2].products));
      var prodRaw = productsLoaded ? res[2].products : [];
      var reviews = (res[3] && Array.isArray(res[3].reviews)) ? res[3].reviews : [];

      var products = [];
      for (var i = 0; i < prodRaw.length; i++) {
        var clean = null;
        try { clean = sanitizeProduct(prodRaw[i]); } catch (e) { clean = null; }
        if (clean) products.push(clean);
      }
      brands.sort(function (a, b) { return (a.order || 99) - (b.order || 99); });
      reviews.sort(function (a, b) { return (a.order || 99) - (b.order || 99); });

      return { settings: settings, brands: brands, products: products, reviews: reviews,
               meta: { productsLoaded: productsLoaded } };
    }).catch(function (err) {
      console.error('[TPX] Dështoi ngarkimi i të dhënave:', err);
      return { settings: {}, brands: [], products: [], reviews: [], meta: { productsLoaded: false } };
    });
    return _store;
  }

  /* ---------------- Pyetje mbi të dhënat ---------------- */
  function getById(store, id) {
    return store.products.filter(function (p) { return p.id === id; })[0] || null;
  }
  function getFeatured(store) {
    var ids = (store.settings && store.settings.featuredIds) || [];
    var byId = ids.map(function (id) { return getById(store, id); }).filter(Boolean);
    if (byId.length) return byId;
    return store.products.filter(function (p) { return p.featured; });
  }
  function getRelated(store, product, limit) {
    limit = limit || 4;
    return store.products
      .filter(function (p) { return p.id !== product.id && p.brand === product.brand; })
      .concat(store.products.filter(function (p) { return p.id !== product.id && p.brand !== product.brand; }))
      .slice(0, limit);
  }
  function brandName(store, slug) {
    var b = store.brands.filter(function (x) { return x.slug === slug; })[0];
    return b ? b.name : (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : '');
  }

  /* ---------------- Renderim i kartës (i ripërdorshëm) ---------------- */
  function productCardHtml(p, store) {
    var img = resolveAsset(p.images[0]);
    var brand = brandName(store, p.brand);
    var onSale = p.oldPrice && p.oldPrice > p.price;
    var isFeatured = p.featured || ((store.settings.featuredIds || []).indexOf(p.id) > -1);

    var flags = '';
    if (isFeatured) flags += '<span class="badge badge--drop">⚡ Bomba e javës</span>';
    if (onSale) flags += '<span class="badge badge--sale">Ulje</span>';
    if (!p.inStock) flags += '<span class="badge badge--sale">S\'ka stok</span>';

    var priceHtml = onSale
      ? '<span class="product-card__price product-card__price--sale">' + formatPrice(p.price) + '</span>' +
        '<span class="product-card__oldprice">' + formatPrice(p.oldPrice) + '</span>'
      : '<span class="product-card__price">' + formatPrice(p.price) + '</span>';

    var tierClass = p.tier === 'hype' ? 'badge--tier badge--hype' : 'badge--tier';

    return '' +
      '<article class="product-card' + (p.inStock ? '' : ' is-out') + '">' +
        (flags ? '<div class="product-card__flags">' + flags + '</div>' : '') +
        '<div class="product-card__media">' +
          '<img class="product-card__img" src="' + escapeAttr(img) + '" alt="' + escapeAttr(altFor(p)) + '" ' +
               'loading="lazy" width="800" height="1000" ' +
               'onerror="this.onerror=null;this.src=\'assets/products/_placeholder.svg\'" />' +
        '</div>' +
        '<div class="product-card__body">' +
          '<span class="product-card__brand">' + escapeHtml(brand) + '</span>' +
          '<h3 class="product-card__name">' + escapeHtml(p.name) + '</h3>' +
          '<div class="product-card__price-row">' + priceHtml + '</div>' +
          '<span class="badge ' + tierClass + '">' + escapeHtml(tierLabel(p.tier)) + '</span>' +
        '</div>' +
        '<a class="product-card__link" href="' + escapeAttr(productUrl(p)) + '" ' +
           'aria-label="Shiko ' + escapeAttr(p.name) + '"></a>' +
      '</article>';
  }

  /* ---------------- Mesazhi i porosisë ---------------- */
  function orderMessage(store, p, size) {
    var tpl = (store.settings.order && store.settings.order.messageTemplate) ||
      'Përshëndetje! Dua të porosis:\n{name} ({colorway})\nMadhësia: {size}\nÇmimi: {price}€\nLinku: {url}';
    var url = absoluteUrl(productUrl(p), store.settings);
    return tpl
      .replace(/\{name\}/g, p.name || '')
      .replace(/\{colorway\}/g, p.colorway || '')
      .replace(/\{size\}/g, size || 'pa zgjedhur')
      .replace(/\{price\}/g, String(p.price != null ? p.price : ''))
      .replace(/\{url\}/g, url);
  }
  function whatsappLink(store, message) {
    var num = (store.settings.contact && store.settings.contact.whatsappNumber) || '';
    return 'https://wa.me/' + encodeURIComponent(num) + '?text=' + encodeURIComponent(message);
  }
  function instagramDmLink(store) {
    var handle = (store.settings.contact && store.settings.contact.instagramHandle) || 'tophaxhi';
    return 'https://ig.me/m/' + encodeURIComponent(handle);
  }

  /* ---------------- Sinkronizo "chrome"-in (footer/links) nga settings ---------------- */
  function applyChrome(store) {
    try {
      var c = store.settings.contact || {};
      var igUrl = c.instagramUrl || ('https://instagram.com/' + (c.instagramHandle || 'tophaxhi'));
      var igHandle = '@' + (c.instagramHandle || 'tophaxhi');
      var waNum = c.whatsappNumber || '';
      var waDisplay = c.whatsappDisplay || '';
      document.querySelectorAll('a[href*="instagram.com"]').forEach(function (a) {
        a.href = igUrl;
        if (/Instagram\s*·/.test(a.textContent)) a.textContent = 'Instagram · ' + igHandle;
      });
      document.querySelectorAll('a[href*="wa.me"]').forEach(function (a) {
        a.href = 'https://wa.me/' + waNum;
        if (/WhatsApp\s*·/.test(a.textContent) && waDisplay) a.textContent = 'WhatsApp · ' + waDisplay;
      });
    } catch (e) { /* mos e prish faqen */ }
  }

  /* ---------------- API publike ---------------- */
  return {
    load: load,
    applyChrome: applyChrome,
    util: {
      escapeHtml: escapeHtml, escapeAttr: escapeAttr, resolveAsset: resolveAsset,
      formatPrice: formatPrice, tierLabel: tierLabel, altFor: altFor,
      productUrl: productUrl, absoluteUrl: absoluteUrl
    },
    query: { getById: getById, getFeatured: getFeatured, getRelated: getRelated, brandName: brandName },
    render: { productCard: productCardHtml },
    order: { message: orderMessage, whatsappLink: whatsappLink, instagramDmLink: instagramDmLink }
  };
})();
