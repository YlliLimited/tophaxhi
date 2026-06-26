/* =====================================================================
   TOPHAXHI SNEAKERS — main.js
   Sjellje bazë e përbashkët: menyja mobile, scroll-reveal, viti, toast.
   Pa varësi të jashtme. I sigurt (try/catch ku nevojitet).
   ===================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Menyja mobile ---------- */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var drawer = document.getElementById('mobile-nav');
    if (!toggle || !drawer) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Mbyll menynë' : 'Hap menynë');
      drawer.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    // Mbyll kur klikohet një link ose shtypet Escape
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  /* ---------- Scroll reveal (një herë, i shpejtë) ---------- */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Viti aktual në footer ---------- */
  function initYear() {
    var y = String(new Date().getFullYear());
    document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = y; });
  }

  /* ---------- Toast (i ripërdorshëm: window.Toast.show) ---------- */
  var Toast = (function () {
    var wrap;
    function ensureWrap() {
      wrap = document.getElementById('toast-wrap');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'toast-wrap';
        wrap.className = 'toast-wrap';
        wrap.setAttribute('aria-live', 'polite');
        document.body.appendChild(wrap);
      }
      return wrap;
    }
    var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';
    function show(message, opts) {
      opts = opts || {};
      var w = ensureWrap();
      var t = document.createElement('div');
      t.className = 'toast';
      t.setAttribute('role', 'status');
      t.innerHTML = (opts.icon === false ? '' : CHECK) + '<span></span>';
      t.querySelector('span').textContent = message;
      w.appendChild(t);
      // forco reflow pastaj anifmo
      void t.offsetWidth;
      t.classList.add('is-visible');
      var ms = opts.duration || 2600;
      setTimeout(function () {
        t.classList.remove('is-visible');
        setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 320);
      }, ms);
    }
    return { show: show };
  })();
  window.Toast = Toast;

  /* ---------- Init ---------- */
  function init() {
    try { initNav(); } catch (e) { /* mos lejo që dështimi të bllokojë faqen */ }
    try { initReveal(); } catch (e) {}
    try { initYear(); } catch (e) {}
    // Sinkronizo linket e kontaktit në footer nga settings.json (nëse data.js është i pranishëm)
    try { if (window.TPX && TPX.applyChrome) TPX.load().then(TPX.applyChrome); } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
