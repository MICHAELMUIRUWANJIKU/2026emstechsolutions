/* ══════════════════════════════════════════════════════════════════
   EM'S Soft-Tech Solutions Kenya — Cookie Consent
   ──────────────────────────────────────────────────────────────────
   Self-contained module. Injects its own CSS and HTML.
   Usage on any page:
       <script src="cookie-consent.js" defer></script>
   
   Public API:
     CookieConsent.getConsent()          → { essential, analytics, marketing }
     CookieConsent.hasConsent('analytics') → true / false
     CookieConsent.openPreferences()     → reopen settings modal
     CookieConsent.onChange(fn)          → called whenever user changes choice
     CookieConsent.reset()               → wipe stored choice and reload
   
   Footer integration:
     Any element with [data-cookie-settings] opens the preferences modal.
     Example: <a href="#" data-cookie-settings>Cookie Preferences</a>
   
   Storage: localStorage key "ems-cookie-consent"
   Compliance: Kenya Data Protection Act 2019 · GDPR-aligned
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var STORAGE_KEY = 'ems-cookie-consent';
  var VERSION = 1;

  /* ─────────────── STORAGE ─────────────── */
  function getConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || data.version !== VERSION) return null;
      return data.consent;
    } catch (e) {
      return null;
    }
  }

  function saveConsent(consent) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: VERSION,
        consent: consent,
        timestamp: new Date().toISOString()
      }));
    } catch (e) {
      /* localStorage disabled — fail silently, banner will re-appear */
    }
  }

  /* ─────────────── CHANGE LISTENERS ─────────────── */
  var listeners = [];
  function fireChange(consent) {
    listeners.forEach(function (cb) {
      try { cb(consent); } catch (e) { console.error('[CookieConsent]', e); }
    });
  }

  /* ─────────────── CSS ─────────────── */
  function injectCSS() {
    if (document.getElementById('cc-styles')) return;
    var css = ''
    + '.cc-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:9000;'
    + 'max-width:1080px;margin:0 auto;background:var(--surface,#fff);'
    + 'border:1px solid var(--border,#e2e8f0);border-radius:var(--radius,12px);'
    + 'box-shadow:0 24px 60px rgba(15,23,42,.15),0 4px 12px rgba(15,23,42,.08);'
    + 'transform:translateY(calc(100% + 40px));opacity:0;visibility:hidden;'
    + 'transition:transform .55s cubic-bezier(.34,1.56,.64,1),opacity .35s,visibility .35s;'
    + 'font-family:var(--font-body,system-ui,sans-serif);}'
    + '.cc-banner.cc-show{transform:translateY(0);opacity:1;visibility:visible;}'
    + '.cc-banner-inner{display:flex;gap:1.2rem;align-items:center;padding:1.1rem 1.3rem;}'
    + '.cc-icon{width:42px;height:42px;border-radius:11px;flex-shrink:0;'
    + 'background:var(--brand-soft,rgba(30,64,175,.08));color:var(--brand,#1e40af);'
    + 'display:grid;place-items:center;}'
    + '.cc-icon svg{width:20px;height:20px;}'
    + '.cc-text{flex:1;min-width:0;}'
    + '.cc-text h3{font-family:var(--font-head,sans-serif);font-size:.95rem;'
    + 'font-weight:700;margin:0 0 .2rem;color:var(--text,#0f172a);line-height:1.3;}'
    + '.cc-text p{font-size:.83rem;color:var(--muted,#5b6b82);margin:0;line-height:1.5;}'
    + '.cc-text a{color:var(--brand,#1e40af);font-weight:600;text-decoration:underline;'
    + 'text-underline-offset:2px;}'
    + '.cc-actions{display:flex;gap:.5rem;flex-shrink:0;flex-wrap:wrap;}'
    + '.cc-btn{display:inline-flex;align-items:center;justify-content:center;gap:.35rem;'
    + 'padding:.62rem 1.05rem;border-radius:var(--btn-radius,8px);font-weight:700;'
    + 'font-size:.82rem;cursor:pointer;border:1.5px solid transparent;'
    + 'transition:transform .2s,box-shadow .2s,background .2s,color .2s,border-color .2s;'
    + 'font-family:inherit;white-space:nowrap;}'
    + '.cc-btn:active{transform:scale(.97);}'
    + '.cc-btn-primary{background:var(--brand-grad,linear-gradient(135deg,#1e40af 0%,#0ea5e9 100%));'
    + 'color:var(--on-brand,#fff);box-shadow:0 6px 14px var(--brand-ring,rgba(30,64,175,.16));}'
    + '.cc-btn-primary:hover{transform:translateY(-2px);'
    + 'box-shadow:0 10px 22px var(--brand-ring,rgba(30,64,175,.28));}'
    + '.cc-btn-ghost{background:transparent;color:var(--text,#0f172a);'
    + 'border-color:var(--border,#e2e8f0);}'
    + '.cc-btn-ghost:hover{border-color:var(--brand,#1e40af);color:var(--brand,#1e40af);}'
    + '@media(max-width:820px){'
    + '.cc-banner{left:12px;right:12px;bottom:12px;}'
    + '.cc-banner-inner{flex-direction:column;align-items:stretch;padding:1.1rem;}'
    + '.cc-icon{width:38px;height:38px;align-self:flex-start;}'
    + '.cc-actions{flex-direction:column-reverse;}'
    + '.cc-btn{width:100%;padding:.7rem 1rem;}'
    + '}'
    /* Modal */
    + '.cc-modal-bd{position:fixed;inset:0;z-index:9100;background:rgba(3,7,18,.6);'
    + 'backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);'
    + 'display:grid;place-items:center;padding:1.2rem;'
    + 'opacity:0;visibility:hidden;transition:opacity .3s,visibility .3s;'
    + 'font-family:var(--font-body,system-ui,sans-serif);}'
    + '.cc-modal-bd.cc-show{opacity:1;visibility:visible;}'
    + '.cc-modal{background:var(--surface,#fff);border:1px solid var(--border,#e2e8f0);'
    + 'border-radius:calc(var(--radius,12px) + 4px);width:100%;max-width:560px;'
    + 'max-height:92vh;overflow-y:auto;padding:1.8rem 1.8rem 1.5rem;'
    + 'box-shadow:0 30px 70px rgba(15,23,42,.35);'
    + 'transform:translateY(14px) scale(.97);transition:transform .35s cubic-bezier(.34,1.56,.64,1);}'
    + '.cc-modal-bd.cc-show .cc-modal{transform:translateY(0) scale(1);}'
    + '.cc-modal-close{position:absolute;top:14px;right:14px;width:36px;height:36px;'
    + 'border-radius:50%;background:var(--surface-2,#f8fafc);color:var(--muted,#5b6b82);'
    + 'display:grid;place-items:center;cursor:pointer;border:1px solid var(--border,#e2e8f0);'
    + 'transition:.22s;}'
    + '.cc-modal-close:hover{background:var(--brand,#1e40af);color:var(--on-brand,#fff);'
    + 'border-color:transparent;transform:rotate(90deg);}'
    + '.cc-modal-close svg{width:16px;height:16px;}'
    + '.cc-modal h2{font-family:var(--font-head,sans-serif);font-size:1.25rem;'
    + 'font-weight:700;margin:0 0 .4rem;color:var(--text,#0f172a);letter-spacing:-.02em;}'
    + '.cc-modal > p{font-size:.87rem;color:var(--muted,#5b6b82);margin:0 0 1.4rem;line-height:1.55;}'
    + '.cc-pref{display:flex;gap:1rem;align-items:flex-start;padding:1.1rem 0;'
    + 'border-top:1px solid var(--border,#e2e8f0);}'
    + '.cc-pref:last-of-type{border-bottom:1px solid var(--border,#e2e8f0);}'
    + '.cc-pref-info{flex:1;min-width:0;}'
    + '.cc-pref-info h4{font-size:.92rem;font-weight:700;margin:0 0 .25rem;'
    + 'color:var(--text,#0f172a);display:flex;align-items:center;gap:.5rem;}'
    + '.cc-pref-info h4 .cc-badge{font-size:.62rem;font-weight:800;letter-spacing:.08em;'
    + 'text-transform:uppercase;background:var(--brand-soft,rgba(30,64,175,.08));'
    + 'color:var(--brand,#1e40af);padding:.18rem .5rem;border-radius:999px;}'
    + '.cc-pref-info p{font-size:.81rem;color:var(--muted,#5b6b82);margin:0;line-height:1.5;}'
    + '.cc-switch{position:relative;display:inline-block;flex-shrink:0;cursor:pointer;}'
    + '.cc-switch input{position:absolute;opacity:0;width:0;height:0;pointer-events:none;}'
    + '.cc-switch-track{display:block;width:46px;height:26px;'
    + 'background:var(--border,#e2e8f0);border-radius:999px;position:relative;'
    + 'transition:background .25s;}'
    + '.cc-switch-thumb{position:absolute;top:3px;left:3px;width:20px;height:20px;'
    + 'background:#fff;border-radius:50%;transition:transform .25s;'
    + 'box-shadow:0 2px 5px rgba(0,0,0,.2);}'
    + '.cc-switch input:checked + .cc-switch-track{'
    + 'background:var(--brand-grad,linear-gradient(135deg,#1e40af,#0ea5e9));}'
    + '.cc-switch input:checked + .cc-switch-track .cc-switch-thumb{'
    + 'transform:translateX(20px);}'
    + '.cc-switch input:disabled + .cc-switch-track{opacity:.55;cursor:not-allowed;}'
    + '.cc-switch input:focus-visible + .cc-switch-track{'
    + 'outline:2px solid var(--brand,#1e40af);outline-offset:3px;}'
    + '.cc-modal-actions{display:flex;gap:.6rem;margin-top:1.6rem;flex-wrap:wrap;}'
    + '.cc-modal-actions .cc-btn{flex:1;min-width:130px;}'
    + '@media(max-width:520px){'
    + '.cc-modal{padding:1.5rem 1.2rem 1.2rem;}'
    + '.cc-modal-actions{flex-direction:column-reverse;}'
    + '.cc-modal-actions .cc-btn{width:100%;}'
    + '}'
    + '@media(prefers-reduced-motion:reduce){'
    + '.cc-banner,.cc-modal,.cc-modal-bd,.cc-switch-thumb,.cc-btn,.cc-modal-close'
    + '{transition-duration:.001ms !important;}'
    + '}';
    var style = document.createElement('style');
    style.id = 'cc-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ─────────────── BANNER HTML ─────────────── */
  function injectBanner() {
    if (document.getElementById('cc-banner')) return;
    var banner = document.createElement('div');
    banner.id = 'cc-banner';
    banner.className = 'cc-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML = ''
      + '<div class="cc-banner-inner">'
      +   '<div class="cc-icon" aria-hidden="true">'
      +     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
      +       '<path d="M12 2a10 10 0 100 20 4 4 0 000-8 4 4 0 010-8 4 4 0 004-4h-4z"/>'
      +       '<circle cx="8.5" cy="8.5" r=".6" fill="currentColor"/>'
      +       '<circle cx="14" cy="14" r=".6" fill="currentColor"/>'
      +       '<circle cx="9" cy="15" r=".6" fill="currentColor"/>'
      +     '</svg>'
      +   '</div>'
      +   '<div class="cc-text">'
      +     '<h3>We use cookies</h3>'
      +     '<p>Essential cookies keep this site working. Optional cookies help us understand how it\'s used. '
      +       '<a href="privacy.html">Learn more</a>.</p>'
      +   '</div>'
      +   '<div class="cc-actions">'
      +     '<button type="button" class="cc-btn cc-btn-ghost" data-cc-manage>Manage</button>'
      +     '<button type="button" class="cc-btn cc-btn-ghost" data-cc-reject>Reject non-essential</button>'
      +     '<button type="button" class="cc-btn cc-btn-primary" data-cc-accept>Accept all</button>'
      +   '</div>'
      + '</div>';
    document.body.appendChild(banner);
  }

  /* ─────────────── MODAL HTML ─────────────── */
  function injectModal() {
    if (document.getElementById('cc-modal-bd')) return;
    var modal = document.createElement('div');
    modal.id = 'cc-modal-bd';
    modal.className = 'cc-modal-bd';
    modal.setAttribute('role', 'presentation');
    modal.innerHTML = ''
      + '<div class="cc-modal" role="dialog" aria-modal="true" aria-labelledby="cc-modal-title">'
      +   '<button type="button" class="cc-modal-close" data-cc-close aria-label="Close">'
      +     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">'
      +       '<path d="M18 6L6 18M6 6l12 12"/>'
      +     '</svg>'
      +   '</button>'
      +   '<h2 id="cc-modal-title">Cookie preferences</h2>'
      +   '<p>Choose which cookies we can use. You can change this any time via the "Cookie Preferences" link in the footer.</p>'
      +   '<div class="cc-pref">'
      +     '<div class="cc-pref-info">'
      +       '<h4>Strictly necessary <span class="cc-badge">Always on</span></h4>'
      +       '<p>Required for the site to work — remembering your theme, keeping forms secure. Cannot be disabled.</p>'
      +     '</div>'
      +     '<label class="cc-switch">'
      +       '<input type="checkbox" checked disabled aria-label="Essential cookies (always on)">'
      +       '<span class="cc-switch-track"><span class="cc-switch-thumb"></span></span>'
      +     '</label>'
      +   '</div>'
      +   '<div class="cc-pref">'
      +     '<div class="cc-pref-info">'
      +       '<h4>Analytics</h4>'
      +       '<p>Anonymous statistics about which pages are visited, so we can improve the site. No personal data is sold or shared.</p>'
      +     '</div>'
      +     '<label class="cc-switch">'
      +       '<input type="checkbox" data-cc-cat="analytics" aria-label="Analytics cookies">'
      +       '<span class="cc-switch-track"><span class="cc-switch-thumb"></span></span>'
      +     '</label>'
      +   '</div>'
      +   '<div class="cc-pref">'
      +     '<div class="cc-pref-info">'
      +       '<h4>Marketing</h4>'
      +       '<p>Used to show relevant offers on other platforms. We don\'t currently use these, but you can opt out in advance.</p>'
      +     '</div>'
      +     '<label class="cc-switch">'
      +       '<input type="checkbox" data-cc-cat="marketing" aria-label="Marketing cookies">'
      +       '<span class="cc-switch-track"><span class="cc-switch-thumb"></span></span>'
      +     '</label>'
      +   '</div>'
      +   '<div class="cc-modal-actions">'
      +     '<button type="button" class="cc-btn cc-btn-ghost" data-cc-reject>Reject all</button>'
      +     '<button type="button" class="cc-btn cc-btn-ghost" data-cc-accept>Accept all</button>'
      +     '<button type="button" class="cc-btn cc-btn-primary" data-cc-save>Save preferences</button>'
      +   '</div>'
      + '</div>';
    document.body.appendChild(modal);
  }

  /* ─────────────── SHOW / HIDE ─────────────── */
  var bannerEl, modalEl;

  function showBanner() {
    if (!bannerEl) return;
    bannerEl.classList.add('cc-show');
  }
  function hideBanner() {
    if (!bannerEl) return;
    bannerEl.classList.remove('cc-show');
  }
  function showModal() {
    if (!modalEl) return;
    modalEl.classList.add('cc-show');
    document.body.style.overflow = 'hidden';
    var first = modalEl.querySelector('[data-cc-cat]');
    if (first) setTimeout(function () { first.focus(); }, 350);
  }
  function hideModal() {
    if (!modalEl) return;
    modalEl.classList.remove('cc-show');
    document.body.style.overflow = '';
  }

  /* ─────────────── USER ACTIONS ─────────────── */
  function applyConsent(consent) {
    saveConsent(consent);
    hideBanner();
    hideModal();
    fireChange(consent);
  }

  function acceptAll() {
    applyConsent({ essential: true, analytics: true, marketing: true });
  }
  function rejectAll() {
    applyConsent({ essential: true, analytics: false, marketing: false });
  }
  function savePreferences() {
    var analytics = modalEl.querySelector('[data-cc-cat="analytics"]').checked;
    var marketing = modalEl.querySelector('[data-cc-cat="marketing"]').checked;
    applyConsent({ essential: true, analytics: analytics, marketing: marketing });
  }

  /* Pre-fill modal toggles from stored consent */
  function prefillModal() {
    var c = getConsent();
    if (!c) return;
    var a = modalEl.querySelector('[data-cc-cat="analytics"]');
    var m = modalEl.querySelector('[data-cc-cat="marketing"]');
    if (a) a.checked = !!c.analytics;
    if (m) m.checked = !!c.marketing;
  }

  /* ─────────────── EVENT BINDING ─────────────── */
  function bindEvents() {
    /* Banner buttons */
    bannerEl.addEventListener('click', function (e) {
      var t = e.target.closest('button');
      if (!t) return;
      if (t.hasAttribute('data-cc-accept')) acceptAll();
      else if (t.hasAttribute('data-cc-reject')) rejectAll();
      else if (t.hasAttribute('data-cc-manage')) { prefillModal(); hideBanner(); showModal(); }
    });

    /* Modal buttons */
    modalEl.addEventListener('click', function (e) {
      var t = e.target.closest('button');
      if (!t) return;
      if (t.hasAttribute('data-cc-accept')) acceptAll();
      else if (t.hasAttribute('data-cc-reject')) rejectAll();
      else if (t.hasAttribute('data-cc-save')) savePreferences();
      else if (t.hasAttribute('data-cc-close')) hideModal();
    });

    /* Click outside modal card closes it */
    modalEl.addEventListener('click', function (e) {
      if (e.target === modalEl) hideModal();
    });

    /* ESC closes modal */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modalEl.classList.contains('cc-show')) hideModal();
    });

    /* Footer link — [data-cookie-settings] anywhere on the page */
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-cookie-settings]');
      if (!t) return;
      e.preventDefault();
      prefillModal();
      hideBanner();
      showModal();
    });
  }

  /* ─────────────── PUBLIC API ─────────────── */
  window.CookieConsent = {
    getConsent: function () {
      return getConsent() || { essential: true, analytics: false, marketing: false };
    },
    hasConsent: function (category) {
      var c = getConsent();
      return !!(c && c[category]);
    },
    openPreferences: function () {
      prefillModal();
      hideBanner();
      showModal();
    },
    onChange: function (cb) {
      if (typeof cb === 'function') listeners.push(cb);
    },
    reset: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      window.location.reload();
    }
  };

  /* ─────────────── INIT ─────────────── */
  function init() {
    injectCSS();
    injectBanner();
    injectModal();
    bannerEl = document.getElementById('cc-banner');
    modalEl = document.getElementById('cc-modal-bd');
    bindEvents();

    /* Fire listeners once on load so existing consent is honoured */
    var existing = getConsent();
    if (existing) fireChange(existing);

    /* Show banner only if no valid stored choice */
    if (!existing) {
      setTimeout(showBanner, 700);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();