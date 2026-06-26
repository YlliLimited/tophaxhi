/* =====================================================================
   TOPHAXHI SNEAKERS — catalogue.js
   Filtrim/kërkim/renditje në anën e klientit mbi data/products-index.json.
   Përditëson URL-në (query params) që pamjet e filtruara të jenë të
   ndashme dhe të indeksueshme. I sigurt: gjendje gabimi pa "white screen".
   ===================================================================== */
(function () {
  'use strict';

  var TIER_LABELS = { everyday: 'Të përditshme', mainstream: 'Mainstream', hype: 'Hype' };

  var el = {};
  function $(id) { return document.getElementById(id); }

  function getParams() {
    var p = new URLSearchParams(location.search);
    return {
      q: (p.get('q') || '').trim(),
      brand: p.get('brand') || '',
      tier: p.get('tier') || '',
      size: p.get('size') || '',
      sort: p.get('sort') || 'new'
    };
  }

  function setUrl(state) {
    var p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.brand) p.set('brand', state.brand);
    if (state.tier) p.set('tier', state.tier);
    if (state.size) p.set('size', state.size);
    if (state.sort && state.sort !== 'new') p.set('sort', state.sort);
    var qs = p.toString();
    history.replaceState(null, '', qs ? ('?' + qs) : location.pathname);
  }

  function matches(p, state) {
    if (state.brand && p.brand !== state.brand) return false;
    if (state.tier && p.tier !== state.tier) return false;
    if (state.size) {
      var has = (p.sizes || []).some(function (s) { return String(s.eu) === String(state.size) && s.available; });
      if (!has) return false;
    }
    if (state.q) {
      var hay = (p.name + ' ' + (p.colorway || '') + ' ' + (p.brand || '')).toLowerCase();
      if (hay.indexOf(state.q.toLowerCase()) === -1) return false;
    }
    return true;
  }

  function sortList(list, sort) {
    var arr = list.slice();
    if (sort === 'price-asc') arr.sort(function (a, b) { return a.price - b.price; });
    else if (sort === 'price-desc') arr.sort(function (a, b) { return b.price - a.price; });
    else arr.sort(function (a, b) { return String(b.dateAdded || '').localeCompare(String(a.dateAdded || '')); });
    return arr;
  }

  function titleFor(state, store) {
    if (state.tier === 'hype') return 'Hype';
    if (state.brand) return TPX.query.brandName(store, state.brand);
    if (state.q) return '“' + state.q + '”';
    return 'Atletet';
  }

  function renderChips(state, store) {
    var chips = [];
    if (state.brand) chips.push({ key: 'brand', label: TPX.query.brandName(store, state.brand) });
    if (state.tier) chips.push({ key: 'tier', label: TIER_LABELS[state.tier] || state.tier });
    if (state.size) chips.push({ key: 'size', label: 'Madhësia ' + state.size });
    if (state.q) chips.push({ key: 'q', label: 'Kërkim: ' + state.q });

    el.chips.innerHTML = chips.map(function (c) {
      return '<button type="button" class="chip" data-clear="' + c.key + '">' +
        TPX.util.escapeHtml(c.label) +
        ' <span aria-hidden="true">✕</span><span class="visually-hidden">hiq filtrin</span></button>';
    }).join('') + (chips.length > 1
      ? '<button type="button" class="chip chip--clear" data-clear="all">Pastro të gjitha</button>' : '');
  }

  function render(store) {
    var state = getParams();
    // sinkronizo kontrollat me URL
    el.q.value = state.q;
    el.brand.value = state.brand;
    el.tier.value = state.tier;
    el.size.value = state.size;
    el.sort.value = state.sort;

    document.getElementById('catalogue-title').textContent = titleFor(state, store);

    var filtered = sortList(store.products.filter(function (p) { return matches(p, state); }), state.sort);

    el.grid.setAttribute('aria-busy', 'false');
    el.empty.hidden = filtered.length !== 0;
    el.grid.hidden = filtered.length === 0;

    el.count.textContent = filtered.length
      ? (filtered.length === 1 ? '1 palë' : filtered.length + ' palë')
      : '';

    el.grid.innerHTML = filtered.map(function (p) { return TPX.render.productCard(p, store); }).join('');
    renderChips(state, store);
    setUrl(state);
  }

  function populateControls(store) {
    // markat
    var bopt = store.brands.map(function (b) {
      return '<option value="' + TPX.util.escapeAttr(b.slug) + '">' + TPX.util.escapeHtml(b.name) + '</option>';
    }).join('');
    el.brand.insertAdjacentHTML('beforeend', bopt);

    // madhësitë (bashkim i të gjitha EU të disponueshme)
    var sizes = {};
    store.products.forEach(function (p) {
      (p.sizes || []).forEach(function (s) { if (s && s.eu != null) sizes[s.eu] = true; });
    });
    var sopt = Object.keys(sizes).map(Number).sort(function (a, b) { return a - b; })
      .map(function (s) { return '<option value="' + s + '">EU ' + s + '</option>'; }).join('');
    el.size.insertAdjacentHTML('beforeend', sopt);
  }

  function debounce(fn, ms) {
    var t; return function () { clearTimeout(t); var a = arguments, c = this; t = setTimeout(function () { fn.apply(c, a); }, ms); };
  }

  function init() {
    el = {
      grid: $('product-grid'), empty: $('empty-state'), error: $('error-state'),
      count: $('result-count'), chips: $('active-chips'),
      q: $('f-q'), brand: $('f-brand'), tier: $('f-tier'), size: $('f-size'), sort: $('f-sort'),
      clear: $('clear-filters')
    };
    if (!el.grid) return;

    TPX.load().then(function (store) {
      // Nëse indeksi i produkteve s'u ngarkua/parse (i prishur), trego gjendjen e gabimit.
      if (!store.meta || !store.meta.productsLoaded) {
        el.grid.hidden = true; el.empty.hidden = true; el.error.hidden = false;
        el.grid.setAttribute('aria-busy', 'false');
        return;
      }
      populateControls(store);
      render(store);
      TPX.applyChrome(store);

      // dëgjuesit
      var rerender = function () { render(store); };
      el.brand.addEventListener('change', rerender);
      el.tier.addEventListener('change', rerender);
      el.size.addEventListener('change', rerender);
      el.sort.addEventListener('change', rerender);
      el.q.addEventListener('input', debounce(function () {
        // përditëso URL nga inputi pa pasur nevojë të rilexojë selektet
        var s = getParams(); s.q = el.q.value.trim(); setUrl(s); render(store);
      }, 220));

      el.chips.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-clear]'); if (!btn) return;
        var k = btn.getAttribute('data-clear');
        if (k === 'all') { el.brand.value = ''; el.tier.value = ''; el.size.value = ''; el.q.value = ''; }
        else if (k === 'q') el.q.value = '';
        else if (el[k]) el[k].value = '';
        render(store);
      });
      if (el.clear) el.clear.addEventListener('click', function () {
        el.brand.value = ''; el.tier.value = ''; el.size.value = ''; el.q.value = ''; render(store);
      });

      // mbështet butonat back/forward
      window.addEventListener('popstate', function () { render(store); });
    }).catch(function () {
      el.grid.hidden = true; el.error.hidden = false; el.grid.setAttribute('aria-busy', 'false');
    });
  }

  // mos lejo që forma të bëjë submit/reload
  document.addEventListener('submit', function (e) { if (e.target.id === 'filters') e.preventDefault(); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
