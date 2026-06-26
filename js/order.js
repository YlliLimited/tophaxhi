/* =====================================================================
   TOPHAXHI SNEAKERS — order.js
   Forma e porosisë në faqe (porosia.html).
   Dorëzimi pa backend:
     (a) WhatsApp hand-off (parazgjedhje) — kompozon porosinë e plotë në
         një link wa.me dhe e hap WhatsApp-in me gjithçka të parambushur.
     (b) Formspree/Getform (opsionale) — POST te endpoint nga settings.json.
   Asnjëherë nuk thotë "u krye/u pagua" — thotë "Porosia u dërgua".
   ===================================================================== */
(function () {
  'use strict';
  var U = TPX.util;
  var state = { store: null, product: null };

  function params() {
    var p = new URLSearchParams(location.search);
    return { id: p.get('id') || '', size: p.get('size') || '' };
  }

  function renderSummary(p, store, size) {
    var box = document.getElementById('order-summary');
    if (!p) {
      box.innerHTML = '<div class="order-summary__empty"><p class="muted">Asnjë produkt i zgjedhur.</p>' +
        '<a href="atletet.html" class="btn btn--ghost btn--block" style="margin-top:.6rem">Zgjedh atlete</a></div>';
      return;
    }
    var onSale = p.oldPrice && p.oldPrice > p.price;
    box.innerHTML =
      '<div class="order-summary__card">' +
        '<div class="order-summary__media"><img src="' + U.escapeAttr(U.resolveAsset(p.images[0])) +
          '" alt="' + U.escapeAttr(U.altFor(p)) + '" width="800" height="1000" ' +
          'onerror="this.onerror=null;this.src=\'assets/products/_placeholder.svg\'"/></div>' +
        '<div class="order-summary__body">' +
          '<span class="product-card__brand">' + U.escapeHtml(TPX.query.brandName(store, p.brand)) + '</span>' +
          '<h2 class="order-summary__name">' + U.escapeHtml(p.name) + '</h2>' +
          '<p class="muted" style="font-size:var(--fs-sm)">' + U.escapeHtml(p.colorway || '') + '</p>' +
          '<div class="order-summary__row"><span>Çmimi</span><strong>' + U.formatPrice(p.price) +
            (onSale ? ' <span class="product-card__oldprice">' + U.formatPrice(p.oldPrice) + '</span>' : '') + '</strong></div>' +
          '<div class="order-summary__row"><span>Madhësia</span><strong id="sum-size">' + (size ? 'EU ' + U.escapeHtml(size) : '—') + '</strong></div>' +
        '</div>' +
      '</div>' +
      '<a href="' + U.escapeAttr(U.productUrl(p)) + '" class="order-summary__change">Ndrysho produktin</a>';
  }

  function validate(form) {
    var ok = true;
    ['name', 'phone', 'city'].forEach(function (key) {
      var input = form.elements[key];
      var err = form.querySelector('[data-err="' + key + '"]');
      var val = (input.value || '').trim();
      var bad = !val || (key === 'phone' && val.replace(/\D/g, '').length < 6);
      input.classList.toggle('is-invalid', bad);
      if (err) err.textContent = bad ? (key === 'phone' ? 'Vendos një numër të vlefshëm' : 'Kjo fushë është e detyrueshme') : '';
      if (bad && ok) input.focus();
      if (bad) ok = false;
    });
    return ok;
  }

  function buildMessage(p, store, data) {
    var lines = ['Porosi e re nga faqja:'];
    if (p) { lines.push(p.name + ' (' + (p.colorway || '') + ')'); lines.push('Çmimi: ' + U.formatPrice(p.price)); }
    lines.push('Madhësia: ' + (data.size || 'pa zgjedhur'));
    lines.push('Emri: ' + data.name);
    lines.push('Telefoni: ' + data.phone);
    lines.push('Qyteti: ' + data.city + (data.address ? ', ' + data.address : ''));
    if (data.note) lines.push('Shënim: ' + data.note);
    if (p) lines.push('Linku: ' + U.absoluteUrl(U.productUrl(p), store.settings));
    return lines.join('\n');
  }

  function showConfirm() {
    document.getElementById('order-form').hidden = true;
    document.getElementById('order-summary').hidden = true;
    var c = document.getElementById('order-confirm');
    c.hidden = false; c.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function submitWhatsApp(message) {
    window.open(TPX.order.whatsappLink(state.store, message), '_blank', 'noopener');
    showConfirm();
  }

  function submitFormspree(endpoint, data, message) {
    var btn = document.getElementById('order-submit');
    btn.disabled = true; btn.textContent = 'Po dërgohet…';
    fetch(endpoint, {
      method: 'POST', headers: { Accept: 'application/json' },
      body: (function () { var fd = new FormData(); Object.keys(data).forEach(function (k) { fd.append(k, data[k]); }); fd.append('message', message); return fd; })()
    }).then(function (r) {
      if (r.ok) showConfirm();
      else throw new Error('HTTP ' + r.status);
    }).catch(function () {
      btn.disabled = false; btn.textContent = 'Dërgo porosinë';
      if (window.Toast) Toast.show('Nuk u dërgua. Provo në WhatsApp ose përsëri.', { icon: false, duration: 3500 });
      // fallback: hap WhatsApp gjithsesi
      window.open(TPX.order.whatsappLink(state.store, message), '_blank', 'noopener');
    });
  }

  function init() {
    var form = document.getElementById('order-form');
    if (!form) return;
    var q = params();

    TPX.load().then(function (store) {
      state.store = store;
      var p = q.id ? TPX.query.getById(store, q.id) : null;
      state.product = p;
      renderSummary(p, store, q.size);
      TPX.applyChrome(store);
      if (q.size) form.elements.size.value = q.size;

      // mbaj sinkron madhësinë në përmbledhje
      form.elements.size.addEventListener('input', function () {
        var ss = document.getElementById('sum-size');
        if (ss) ss.textContent = form.elements.size.value ? 'EU ' + form.elements.size.value : '—';
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validate(form)) return;
        var data = {
          name: form.elements.name.value.trim(),
          phone: form.elements.phone.value.trim(),
          city: form.elements.city.value.trim(),
          address: form.elements.address.value.trim(),
          size: form.elements.size.value.trim(),
          note: form.elements.note.value.trim(),
          product: p ? p.name : '', productId: p ? p.id : ''
        };
        var message = buildMessage(p, store, data);
        var method = (store.settings.order && store.settings.order.method) || 'whatsapp';
        var endpoint = store.settings.order && store.settings.order.formspreeEndpoint;
        if (method === 'formspree' && endpoint) submitFormspree(endpoint, data, message);
        else submitWhatsApp(message);
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
