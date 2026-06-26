/* =====================================================================
   TOPHAXHI SNEAKERS — home.js
   Bën dinamike seksionet e ballinës nga të dhënat:
   - "Të zgjedhurat / Bomba e javës" (featured + më të rejat)
   - Vlerësimet (social proof)
   - Sinkronizon linket e kontaktit në footer nga settings.json
   Kartat statike në HTML shërbejnë si fallback pa-JS.
   ===================================================================== */
(function () {
  'use strict';

  function renderFeatured(store) {
    var grid = document.getElementById('featured-grid');
    if (!grid || !store.products.length) return;
    var featured = TPX.query.getFeatured(store);
    var ids = {};
    featured.forEach(function (p) { ids[p.id] = true; });
    // mbush deri në 4 me më të rejat
    var rest = store.products.filter(function (p) { return !ids[p.id]; });
    var list = featured.concat(rest).slice(0, 4);
    grid.innerHTML = list.map(function (p) { return TPX.render.productCard(p, store); }).join('');
  }

  function renderReviews(store) {
    var grid = document.getElementById('reviews-grid');
    if (!grid || !store.reviews.length) return; // ruaj placeholder-at nëse s'ka të dhëna
    grid.innerHTML = store.reviews.map(function (r) {
      var stars = '★★★★★'.slice(0, Math.max(0, Math.min(5, r.rating || 5)));
      var who = [r.name, r.city].filter(Boolean).join(' · ');
      return '<figure class="review-card">' +
        '<img class="review-card__img" src="' + TPX.util.escapeAttr(TPX.util.resolveAsset(r.image)) +
          '" alt="Foto e klientit me atletet Tophaxhi" loading="lazy" ' +
          'onerror="this.onerror=null;this.src=\'assets/products/_placeholder.svg\'" />' +
        '<figcaption class="review-card__body">' +
          '<div class="review-card__stars" aria-label="' + (r.rating || 5) + ' nga 5 yje">' + stars + '</div>' +
          '<p class="review-card__text">' + TPX.util.escapeHtml(r.text || '') + '</p>' +
          (who ? '<p class="review-card__name">' + TPX.util.escapeHtml(who) + '</p>' : '') +
        '</figcaption></figure>';
    }).join('');
  }

  function init() {
    if (!window.TPX) return;
    TPX.load().then(function (store) {
      renderFeatured(store);
      renderReviews(store);
      TPX.applyChrome(store);
    }).catch(function (e) { /* fallback statik mbetet */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
