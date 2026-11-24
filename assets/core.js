/* Storko core JS: progressive enhancement, no dependencies.
   Elements opt in with data-module="name" or data-* hooks. */

const T = window.theme;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const toast = (msg) => {
  const el = $('[data-toast]');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (el.hidden = true), 2600);
};

/* ---------- Cart ---------- */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Cart = {
  drawer: () => $('[data-cart-drawer]'),
  opener: null,
  isOpen() {
    const d = this.drawer();
    return Boolean(d && !d.hidden);
  },
  // Everything outside the drawer becomes inert while it is open, so keyboard focus and screen readers stay inside it.
  setInert(on) {
    const d = this.drawer();
    if (!d) return;
    const keep = d.closest('.shopify-section') || d;
    Array.from(document.body.children).forEach((el) => {
      if (el === keep || el.contains(keep) || el.tagName === 'SCRIPT' || el.matches('[data-toast]')) return;
      if (on) el.setAttribute('inert', '');
      else el.removeAttribute('inert');
    });
  },
  focusables() {
    const d = this.drawer();
    return d ? $$(FOCUSABLE, $('.ui-drawer__panel', d)).filter((el) => el.offsetParent !== null) : [];
  },
  announce(message) {
    const el = $('[data-cart-status]');
    if (el) el.textContent = message;
  },
  // `trigger` is the element to return focus to on close; defaults to whatever is focused now.
  open(trigger) {
    const d = this.drawer();
    if (!d) return false;
    if (!this.isOpen()) {
      this.opener = trigger || (document.activeElement instanceof HTMLElement ? document.activeElement : null);
      d.hidden = false;
      document.body.classList.add('has-drawer');
      this.setInert(true);
    }
    $('.ui-drawer__panel', d)?.focus();
    return true;
  },
  close() {
    const d = this.drawer();
    if (!d || d.hidden) return;
    d.hidden = true;
    document.body.classList.remove('has-drawer');
    this.setInert(false);
    // Hand focus back to whatever opened the drawer (e.g. the Add to cart button).
    if (this.opener && document.contains(this.opener)) this.opener.focus();
    this.opener = null;
  },
  async refresh() {
    const res = await fetch(`${T.routes.cart}?section_id=cart-drawer`);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const d = this.drawer();
    if (!d) return;
    // Remember which quantity/remove control had focus so it can be restored after the markup is swapped.
    const a = document.activeElement;
    const kind = ['[data-qty-plus]', '[data-qty-minus]', '[data-qty-input]', '[data-line-remove]'].find((s) => a?.matches?.(s));
    const line = a?.dataset?.line;
    const inner = $('[data-cart-drawer-inner]', doc);
    const foot = $('[data-cart-drawer-foot]', doc);
    const oldInner = $('[data-cart-drawer-inner]', d);
    if (inner && oldInner) oldInner.replaceWith(inner);
    const oldFoot = $('[data-cart-drawer-foot]', d);
    if (oldFoot) oldFoot.remove();
    if (foot) $('.ui-drawer__panel', d).appendChild(foot);
    const label = $('[data-cart-count-label]', doc);
    if (label && $('[data-cart-count-label]', d)) $('[data-cart-count-label]', d).textContent = label.textContent;
    // A removed line takes keyboard focus with it; put it somewhere sensible instead of losing it to <body>.
    if (this.isOpen() && !d.contains(document.activeElement)) {
      const same = kind && line ? $(`${kind}[data-line="${line}"]`, d) : null;
      (same || this.focusables()[0] || $('.ui-drawer__panel', d))?.focus();
    }
    this.announce(`${T.strings.cartUpdated} ${label ? label.textContent.trim() : ''}`.trim());
  },
  async count() {
    const cart = await (await fetch(`${T.routes.cart}.js`, { headers: { Accept: 'application/json' } })).json();
    $$('[data-cart-count]').forEach((el) => {
      el.textContent = cart.item_count;
      el.hidden = cart.item_count === 0;
    });
    return cart;
  },
  async change(line, quantity) {
    const res = await fetch(`${T.routes.cartChange}.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ line, quantity }),
    });
    if (!res.ok) { toast(T.strings.error); return; }
    await Promise.all([this.refresh(), this.count()]);
  },
  async add(formData) {
    const res = await fetch(T.routes.cartAdd + '.js', {
      method: 'POST',
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || data.status) throw new Error(data.description || data.message || T.strings.error);
    await Promise.all([this.refresh(), this.count()]);
    return data;
  },
};

document.addEventListener('click', (e) => {
  const open = e.target.closest('[data-cart-open]');
  if (open && T.cartType === 'drawer' && Cart.drawer()) { e.preventDefault(); Cart.open(); return; }
  if (e.target.closest('[data-drawer-close]')) { Cart.close(); return; }
  const minus = e.target.closest('[data-qty-minus]');
  const plus = e.target.closest('[data-qty-plus]');
  if (minus || plus) {
    const wrap = (minus || plus).closest('[data-qty]');
    const input = $('[data-qty-input]', wrap);
    const min = Number(input.min || 0);
    const next = Math.max(min, Number(input.value) + (plus ? 1 : -1));
    input.value = next;
    if (input.dataset.line) Cart.change(Number(input.dataset.line), next);
    else if (input.closest('[data-cart-page]')) input.form?.requestSubmit(input.form.querySelector('[name="update"]'));
    return;
  }
  const rm = e.target.closest('[data-line-remove]');
  if (rm) { Cart.change(Number(rm.dataset.line), 0); return; }
  const copy = e.target.closest('[data-copy-link]');
  if (copy) { navigator.clipboard?.writeText(copy.dataset.copyLink).then(() => toast('Link copied')); }
});

document.addEventListener('change', (e) => {
  const input = e.target.closest('[data-qty-input][data-line]');
  if (input) Cart.change(Number(input.dataset.line), Math.max(0, Number(input.value)));
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    Cart.close();
    $$('[data-nav-details][open]').forEach((d) => (d.open = false));
    return;
  }
  // Keep Tab / Shift+Tab inside the drawer while it is open (focus trap).
  if (e.key === 'Tab' && Cart.isOpen()) {
    const items = Cart.focusables();
    if (!items.length) { e.preventDefault(); return; }
    const first = items[0];
    const last = items[items.length - 1];
    const panel = $('.ui-drawer__panel', Cart.drawer());
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!panel.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  }
});

/* ---------- Header ---------- */
const initHeader = (root) => {
  const burger = $('[data-menu-toggle]', root);
  const mobile = $('#mobile-nav', root);
  burger?.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    mobile.hidden = open;
  });

  const nav = $$('[data-nav-details]', root);
  document.addEventListener('click', (e) => nav.forEach((d) => { if (!d.contains(e.target)) d.open = false; }));
  nav.forEach((d) => d.addEventListener('toggle', () => { if (d.open) nav.forEach((o) => { if (o !== d) o.open = false; }); }));

  // Predictive search
  const dialog = $('[data-search-dialog]', root);
  const input = $('[data-search-input]', root);
  const results = $('[data-search-results]', root);
  $('[data-search-open]', root)?.addEventListener('click', () => { dialog.showModal(); input.focus(); });
  $('[data-search-close]', root)?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  let timer, controller;
  input?.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (!q) { results.innerHTML = ''; return; }
    timer = setTimeout(async () => {
      controller?.abort();
      controller = new AbortController();
      try {
        const url = `${T.routes.suggest}?q=${encodeURIComponent(q)}&resources[type]=product,collection,article,page,query&resources[limit]=4&section_id=predictive-search`;
        const res = await fetch(url, { signal: controller.signal });
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        results.innerHTML = $('.ui-predict', doc)?.outerHTML || '';
      } catch (err) { /* aborted */ }
    }, 220);
  });
};

/* ---------- Product ---------- */
const initProduct = (root) => {
  const form = $('form[data-type="add-to-cart-form"]', root);
  const variantsEl = $('[data-variants-json]', root);
  const variants = variantsEl ? JSON.parse(variantsEl.textContent) : [];
  const idInput = $('[data-variant-id]', root);
  const button = $('[data-add-button]', root);
  const label = $('[data-add-label]', root);
  const priceWrap = $('[data-price-wrap]', root);

  const selectedOptions = () => {
    const opts = [];
    $$('[data-option-index]', root).forEach((fs) => {
      const i = Number(fs.dataset.optionIndex);
      const radio = $('input:checked', fs);
      const select = $('select', fs);
      opts[i] = radio ? radio.value : select?.value;
    });
    return opts;
  };

  const findVariant = (opts) => variants.find((v) => v.options.every((o, i) => o === opts[i]));

  const updateAvailability = () => {
    // Mark option values with no available combination
    $$('[data-option-index]', root).forEach((fs) => {
      const idx = Number(fs.dataset.optionIndex);
      const chosen = selectedOptions();
      $$('input[type="radio"]', fs).forEach((r) => {
        const test = chosen.slice();
        test[idx] = r.value;
        const v = findVariant(test);
        r.classList.toggle('is-unavailable', !v || !v.available);
      });
    });
  };

  const apply = (variant) => {
    if (!button) return;
    if (!variant) {
      button.disabled = true;
      label.textContent = T.strings.unavailable;
      return;
    }
    idInput.value = variant.id;
    button.disabled = !variant.available;
    label.textContent = variant.available ? T.strings.addToCart : T.strings.soldOut;
    const url = new URL(location.href);
    url.searchParams.set('variant', variant.id);
    history.replaceState({}, '', url);
    if (variant.featured_media) showMedia(variant.featured_media.id);
    refreshPrice(variant.id);
  };

  const refreshPrice = async (id) => {
    if (!priceWrap) return;
    const sectionId = root.dataset.sectionId;
    try {
      const res = await fetch(`${location.pathname}?variant=${id}&section_id=${sectionId}`);
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const fresh = $('[data-price-wrap]', doc);
      if (fresh) priceWrap.innerHTML = fresh.innerHTML;
    } catch (e) { /* keep existing price */ }
  };

  const showMedia = (id) => {
    $$('.ui-gallery__slide', root).forEach((s) => {
      const on = String(s.dataset.mediaId) === String(id);
      s.classList.toggle('is-active', on);
      if (root.classList.contains('ui-product--thumbnails')) s.hidden = !on;
    });
    $$('[data-thumb]', root).forEach((t) => t.classList.toggle('is-active', String(t.dataset.thumb) === String(id)));
    if (root.classList.contains('ui-product--stacked')) $(`[data-media-id="${id}"]`, root)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  $$('[data-thumb]', root).forEach((t) => t.addEventListener('click', () => showMedia(t.dataset.thumb)));
  $$('[data-option-radio], [data-option-select]', root).forEach((el) => el.addEventListener('change', () => {
    apply(findVariant(selectedOptions()));
    updateAvailability();
  }));
  if (variants.length) updateAvailability();

  form?.addEventListener('submit', async (e) => {
    if (!window.fetch || T.cartType === 'page') return; // native post, redirects to cart page
    e.preventDefault();
    const err = $('[data-form-error]', root);
    err.hidden = true;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    try {
      const fd = new FormData(form);
      const qty = $('[data-qty-input]', root);
      if (qty && !fd.get('quantity')) fd.set('quantity', qty.value);
      await Cart.add(fd);
      toast(T.strings.added);
      Cart.open(button) || (location.href = T.routes.cart);
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  });
};

/* ---------- Collection filters ---------- */
const initFilters = (root) => {
  const form = $('[data-filter-form]', root);
  if (!form) return;
  let timer;
  const submit = () => { clearTimeout(timer); timer = setTimeout(() => form.requestSubmit(), 350); };
  form.addEventListener('change', submit);
};

/* ---------- Recommendations ---------- */
const initRecs = async (root) => {
  try {
    const res = await fetch(root.dataset.url);
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const fresh = $('[data-module="recommendations"]', doc);
    if (fresh && fresh.innerHTML.trim()) root.innerHTML = fresh.innerHTML;
  } catch (e) { /* section stays empty */ }
};

/* ---------- Registry ---------- */
const modules = { header: initHeader, product: initProduct, filters: initFilters, recommendations: initRecs };
const register = (name, fn) => { modules[name] = fn; init(document); };

const init = (scope) => {
  $$('[data-module]', scope).forEach((el) => {
    const fn = modules[el.dataset.module];
    if (!fn || el.dataset.ready) return;
    el.dataset.ready = '1';
    fn(el);
  });
};

init(document);
document.addEventListener('shopify:section:load', (e) => init(e.target));
// Theme scripts (theme.js) use these globals so there is only ever one registry.
window.themeRegister = register;
window.themeCart = Cart;
window.themeToast = toast;
