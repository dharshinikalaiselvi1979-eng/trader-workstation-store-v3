(function () {
  var root = document.documentElement;
  function getLS(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
  function setLS(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var theme = getLS('tws_theme', 'fancy'); if (['simple', 'pro', 'fancy'].indexOf(theme) < 0) theme = 'fancy';
  root.dataset.theme = theme;

  function h(tag, props) {
    var el = document.createElement(tag);
    for (var k in (props || {})) { var v = props[k];
      if (k === 'text') el.textContent = v; else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (v !== null && v !== undefined && v !== false) el.setAttribute(k, v); }
    for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c === null || c === undefined) continue;
      if (Array.isArray(c)) c.forEach(function (x) { el.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); });
      else el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); }
    return el;
  }
  var money = function (n) { return '$' + Number(n).toFixed(2); }, cents = function (n) { return money(n / 100); };
  // trusted constant SVG strings only (never visitor text)
  function svg(s) { var d = document.createElement('span'); d.innerHTML = s; return d.firstChild; }
  var ICON = {
    logo: function (n) { return '<svg width="' + n + '" height="' + n + '" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 20L12 4L21 20H16L12 12L8 20H3Z" fill="#3b82f6"/></svg>'; },
    cart: function (n) { return '<svg width="' + n + '" height="' + n + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>'; },
    arrow: function (n) { return '<svg width="' + n + '" height="' + n + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'; },
    star: '<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
  };

  // ---- product + article cards (same classes as the Rocket-style home page) ----
  function pcard(p) {
    var onSale = p.isSale && p.originalPrice;
    return h('article', { class: 'product-card' },
      h('div', { class: 'card-media' }, h('a', { href: '/p/' + p.id }, h('img', { src: p.image, alt: p.name, loading: 'lazy' })),
        h('div', { class: 'card-badges' }, p.badge ? h('span', { class: 'badge-bestseller', text: p.badge }) : null, onSale ? h('span', { class: 'badge-sale', text: 'Sale' }) : null),
        h('span', { class: 'badge-format', text: p.format })),
      h('div', { class: 'card-body' },
        h('div', { class: 'card-meta' }, h('span', { class: 'category-pill ' + p.category, text: p.category }),
          h('div', { class: 'price-box' }, h('span', { class: 'price-current', text: money(p.price) }), onSale ? h('span', { class: 'price-original', text: money(p.originalPrice) }) : null)),
        h('h3', { class: 'card-title' }, h('a', { href: '/p/' + p.id, style: 'color:inherit;text-decoration:none', text: p.name })),
        h('p', { class: 'card-desc', text: p.description }),
        h('div', { class: 'card-footer-meta' },
          (p.rating && p.reviews) ? h('div', { class: 'rating-stars' }, svg(ICON.star), h('span', { text: p.rating + ' (' + p.reviews + ')' })) : h('span', { class: 'pages-count', text: 'Instant download' }),
          h('span', { class: 'pages-count', text: p.pages || p.format })),
        h('button', { class: 'btn-add-cart', 'data-id': p.id, 'aria-label': 'Add ' + p.name + ' to cart', onclick: function () { add(p.id); } }, svg(ICON.cart(15)), h('span', { text: 'Add to Cart' }))));
  }
  function postcard(p) {
    var d = new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return h('article', { class: 'blog-card' }, h('div', { class: 'blog-card-img' }, h('a', { href: '/blog/' + p.slug }, h('img', { src: p.image, alt: p.title, loading: 'lazy' }))),
      h('div', { class: 'blog-card-body' }, h('span', { class: 'blog-tag', text: p.category }), h('div', { class: 'blog-read-time', text: p.readMin + ' min read' }),
        h('h3', { class: 'blog-title' }, h('a', { href: '/blog/' + p.slug, style: 'color:inherit', text: p.title })), h('p', { class: 'blog-desc', text: p.excerpt }),
        h('div', { class: 'blog-footer' }, h('span', { text: d }), h('a', { class: 'blog-read-more', href: '/blog/' + p.slug }, 'Read more ', svg(ICON.arrow(13))))));
  }

  function stratcard(s) {
    var chips = []; if (s.has.video) chips.push('Video'); if (s.has.captions) chips.push('English captions'); if (s.has.audio) chips.push('Audio'); if (s.has.pdf) chips.push('PDF');
    return h('article', { class: 'blog-card' }, h('div', { class: 'blog-card-img' }, h('a', { href: '/strategies/' + s.slug }, h('img', { src: s.image, alt: s.title, loading: 'lazy' }))),
      h('div', { class: 'blog-card-body' }, h('span', { class: 'blog-tag', text: s.category }), h('div', { class: 'blog-read-time', text: chips.join(' · ') || 'Article' }),
        h('h3', { class: 'blog-title' }, h('a', { href: '/strategies/' + s.slug, style: 'color:inherit', text: s.title })), h('p', { class: 'blog-desc', text: s.summary }),
        h('div', { class: 'blog-footer' }, h('span', { text: new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) }), h('a', { class: 'blog-read-more', href: '/strategies/' + s.slug }, 'Open ', svg(ICON.arrow(13))))));
  }

  // ---- live market ticker (scrolling strip under the header) ----
  function buildTicker() {
    var bar = h('div', { class: 'ticker', role: 'region', 'aria-label': 'Market prices, for information only', hidden: 'hidden' }, h('div', { class: 'tk-badge', text: 'MARKETS' }));
    var track = h('div', { class: 'ticker-track' }); bar.appendChild(track); var sig = '';
    function fmt(p) { return p >= 1000 ? p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : p >= 1 ? p.toFixed(2) : p.toFixed(4); }
    function group(items, hidden) {
      return h('div', { class: 'tk-group', 'aria-hidden': hidden ? 'true' : null }, items.map(function (i) {
        return h('span', { class: 'tk-item', 'data-sym': i.symbol, title: i.name }, h('b', { text: i.symbol }), h('span', { class: 'tk-price' }), h('span', { class: 'tk-chg' }));
      }));
    }
    function paint(items) {
      var by = {}; items.forEach(function (i) { by[i.symbol] = i; });
      track.querySelectorAll('.tk-item').forEach(function (el) {
        var i = by[el.getAttribute('data-sym')]; if (!i) return;
        var up = i.pct >= 0; el.querySelector('.tk-price').textContent = '$' + fmt(i.price);
        var c = el.querySelector('.tk-chg'); c.textContent = (up ? '▲ ' : '▼ ') + Math.abs(i.pct).toFixed(2) + '%'; c.className = 'tk-chg ' + (up ? 'up' : 'down');
        el.classList.toggle('closed', !!i.closed); el.title = i.name + (i.closed ? ' (market closed, last close)' : '');
      });
    }
    function update() {
      fetch('/api/ticker').then(function (r) { return r.json(); }).then(function (d) {
        var items = d.items || []; bar.hidden = !items.length; if (!items.length) return;
        var s = items.map(function (i) { return i.symbol; }).join(',');
        if (s !== sig) { sig = s; track.textContent = ''; track.appendChild(group(items, false)); track.appendChild(group(items, true)); track.style.setProperty('--dur', Math.max(30, items.length * 7) + 's'); }
        paint(items);
        var f = document.getElementById('marketNote');
        if (f) f.textContent = 'Market prices are for information only, may be delayed, and are not financial advice. Data: ' + (d.sources || []).join(', ') + '.';
      }).catch(function () {});
    }
    update(); setInterval(update, 20000); return bar;
  }

  // ---- website assistant (chat widget) ----
  function buildAssistant() {
    var KEY = 'tws_chat', OPEN = 'tws_chat_open', started = false, busy = false;
    var state = []; try { state = JSON.parse(sessionStorage.getItem(KEY) || '[]') || []; } catch (e) { state = []; }
    var saveState = function () { try { sessionStorage.setItem(KEY, JSON.stringify(state.slice(-30))); } catch (e) {} };
    var orders = function () { try { return JSON.parse(localStorage.getItem('tws_orders') || '[]') || []; } catch (e) { return []; } };
    var msgs = h('div', { class: 'ai-msgs', role: 'log', 'aria-live': 'polite' }), chips = h('div', { class: 'ai-chips' });
    var input = h('input', { type: 'text', maxlength: 500, placeholder: 'Ask about guides, orders, refunds…', 'aria-label': 'Your question', autocomplete: 'off' });
    var send = h('button', { class: 'ai-send', type: 'submit', 'aria-label': 'Send' }, svg(ICON.arrow(16)));
    var panel = h('div', { class: 'ai-panel', role: 'dialog', 'aria-label': 'Website assistant', hidden: 'hidden' },
      h('div', { class: 'ai-head' }, h('div', { class: 'ai-title' }, h('img', { src: '/images/ask-us.png', alt: '', width: 36, height: 36 }), h('div', {}, h('strong', { text: 'TWS Assistant' }), h('div', { class: 'ai-sub', text: 'Automated assistant · can make mistakes' }))), h('button', { class: 'ai-x', 'aria-label': 'Close assistant', text: '✕', onclick: function () { toggle(false); } })),
      msgs, chips, h('form', { class: 'ai-form', onsubmit: function (e) { e.preventDefault(); ask(input.value); } }, input, send),
      h('div', { class: 'ai-foot', text: 'Educational information only. Not financial advice.' }));
    var fab = h('button', { class: 'ai-fab', 'aria-label': 'Open assistant', onclick: function () { toggle(panel.hidden); } }, h('img', { src: '/images/ask-us.png', alt: '', width: 44, height: 44 }), h('span', { text: 'Ask us' }));
    var PATHS = /\(?(\/(?:p|blog|strategies)\/[a-z0-9-]+|\/(?:products|blog|strategies|contact\.html|find-orders\.html|faq\.html|refund-policy\.html|risk-disclosure\.html|terms\.html|privacy\.html|about\.html)|\/#live)\)?/g;
    var LABELS = { '/products': 'Browse guides', '/strategies': 'Strategies', '/blog': 'Blog', '/contact.html': 'Contact us', '/find-orders.html': 'Find my orders', '/faq.html': 'FAQ', '/refund-policy.html': 'Refund policy', '/risk-disclosure.html': 'Risk disclosure', '/terms.html': 'Terms', '/privacy.html': 'Privacy', '/about.html': 'About us', '/#live': 'Live session' };
    function pathLabel(p) {
      if (LABELS[p]) return LABELS[p]; var m = p.match(/^\/p\/(.+)$/);
      if (m) { var pr = store.filter(function (x) { return x.id === m[1] || x.alias === m[1]; })[0]; return pr ? 'View ' + pr.name : 'View guide'; }
      if (/^\/blog\//.test(p)) return 'Read article'; if (/^\/strategies\//.test(p)) return 'Open strategy'; return p;
    }
    function linkify(text) { var out = [], last = 0, m; PATHS.lastIndex = 0; while ((m = PATHS.exec(text))) { if (m.index > last) out.push(text.slice(last, m.index)); out.push(h('a', { class: 'ai-link', href: m[1], text: pathLabel(m[1]) })); last = m.index + m[0].length; } if (last < text.length) out.push(text.slice(last)); return out; }
    function addText(box, text) { text.split('\n').forEach(function (line, i) { if (i) box.appendChild(h('br')); linkify(line).forEach(function (n) { box.appendChild(typeof n === 'string' ? document.createTextNode(n) : n); }); }); }
    function bubble(m) {
      var b = h('div', { class: 'ai-msg ' + (m.role === 'user' ? 'me' : 'bot') });
      addText(b, m.text);
      if (m.more) { var md = h('div', { class: 'ai-moretext', hidden: 'hidden' }), mb = h('button', { type: 'button', class: 'ai-more', text: 'More details ▾' }); addText(md, m.more); mb.addEventListener('click', function () { md.hidden = !md.hidden; mb.textContent = md.hidden ? 'More details ▾' : 'Less ▴'; }); b.appendChild(h('div', {}, mb)); b.appendChild(md); }
      if (m.sug && m.sug.length) { var s = h('div', { class: 'ai-sug' }, h('div', { class: 'ai-sug-t', text: 'Related for you' })); m.sug.forEach(function (x) { s.appendChild(h('a', { href: x.url }, h('b', { text: x.title }), h('span', { text: x.note || x.type }))); }); b.appendChild(s); }
      return b;
    }
    function paint() { msgs.textContent = ''; state.forEach(function (m) { msgs.appendChild(bubble(m)); }); msgs.scrollTop = msgs.scrollHeight; }
    function setChips(list) { chips.textContent = ''; (list || []).forEach(function (c) { chips.appendChild(h('button', { type: 'button', class: 'ai-chip', text: c, onclick: function () { ask(c); } })); }); }
    function api(url, body) { return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || 'Something went wrong.'); return d; }); }); }
    function start() {
      if (started) return; started = true;
      api('/api/assistant/start', { orders: orders(), page: location.pathname }).then(function (d) {
        if (d.enabled === false) { fab.remove(); panel.remove(); return; }
        if (!state.length) { state.push({ role: 'assistant', text: d.greeting, sug: d.suggestions }); saveState(); paint(); }
        setChips(d.chips);
      }).catch(function () { started = false; });
    }
    function ask(text) {
      text = String(text || '').trim(); if (!text || busy) return; busy = true; input.value = ''; chips.textContent = '';
      var history = state.filter(function (m) { return !m.err; }).map(function (m) { return { role: m.role, content: m.text }; });
      state.push({ role: 'user', text: text }); paint();
      var typing = h('div', { class: 'ai-msg bot ai-typing', text: 'Typing…' }); msgs.appendChild(typing); msgs.scrollTop = msgs.scrollHeight;
      api('/api/assistant', { message: text, history: history, orders: orders(), page: location.pathname }).then(function (d) { state.push({ role: 'assistant', text: d.reply, sug: d.suggestions, more: d.more }); })
        .catch(function (e) { state.push({ role: 'assistant', text: e.message || 'Sorry, I could not answer that. Please try again or use the contact page.', err: true }); })
        .then(function () { busy = false; saveState(); paint(); input.focus(); });
    }
    function toggle(open) { panel.hidden = !open; fab.classList.toggle('open', open); try { sessionStorage.setItem(OPEN, open ? '1' : ''); } catch (e) {} if (open) { start(); paint(); setTimeout(function () { input.focus(); }, 50); } }
    document.body.appendChild(panel); document.body.appendChild(fab);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) toggle(false); });
    paint(); var wasOpen = ''; try { wasOpen = sessionStorage.getItem(OPEN); } catch (e) {} if (wasOpen) toggle(true);
  }

  // ---- Google sign-in (optional: only shows when GOOGLE_CLIENT_ID is set on the server) ----
  var auth = { cfg: null, user: null }, authBox = null, loginModal = null, gsiInit = false;
  function toast(text) { var t = h('div', { class: 'toast', role: 'status', text: text }); document.body.appendChild(t); setTimeout(function () { t.remove(); }, 7000); }
  function loadGsi(cb) {
    if (window.google && google.accounts && google.accounts.id) return cb();
    var s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.defer = true; s.onload = cb;
    s.onerror = function () { var m = loginModal && loginModal.querySelector('.msg'); if (m) m.textContent = 'Could not load Google sign-in. Please check your internet connection.'; }; document.head.appendChild(s);
  }
  function closeLogin() { if (loginModal) loginModal.hidden = true; }
  function onCredential(resp) {
    post('/api/auth/google', { credential: resp.credential }).then(function (d) {
      auth.user = d.user; drawAuth(); closeLogin();
      toast(d.isNew ? 'Welcome, ' + String(d.user.name || '').split(' ')[0] + '! We sent a welcome email to ' + d.user.email + '.' : 'Signed in as ' + d.user.email + '.');
      window.dispatchEvent(new Event('tws-auth'));
    }).catch(function (e) { var m = loginModal && loginModal.querySelector('.msg'); if (m) { m.textContent = e.message; m.className = 'msg bad'; } });
  }
  function openLogin() {
    if (!auth.cfg || !auth.cfg.enabled) return;
    if (!loginModal) {
      var gbtn = h('div', { class: 'auth-gbtn' });
      loginModal = h('div', { class: 'auth-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Sign in', hidden: 'hidden', onclick: function (e) { if (e.target === loginModal) { dismiss(); } } },
        h('div', { class: 'auth-card' }, h('button', { class: 'auth-x', 'aria-label': 'Close', text: '✕', onclick: function () { dismiss(); } }),
          h('div', { class: 'brand-logo', style: 'margin:0 auto 14px' }, svg(ICON.logo(36))),
          h('h3', { text: 'Welcome to TraderWorkStation' }),
          h('p', { class: 'lead', style: 'font-size:1rem', text: 'Sign in with Google to save your orders, get personal help from our assistant and receive a welcome email.' }),
          gbtn, h('p', { class: 'msg', role: 'alert' }),
          h('p', { class: 'note', text: 'We only receive your name, email address and profile picture from Google.' }),
          h('button', { class: 'auth-later', type: 'button', text: 'Maybe later', onclick: function () { dismiss(); } })));
      document.body.appendChild(loginModal); loginModal.gbtn = gbtn;
    }
    function dismiss() { try { localStorage.setItem('tws_login_dismiss', String(Date.now())); } catch (e) {} closeLogin(); }
    loginModal.hidden = false;
    loadGsi(function () {
      if (!gsiInit) { gsiInit = true; google.accounts.id.initialize({ client_id: auth.cfg.clientId, callback: onCredential, auto_select: false, cancel_on_tap_outside: true }); }
      loginModal.gbtn.textContent = ''; google.accounts.id.renderButton(loginModal.gbtn, { theme: 'filled_blue', size: 'large', shape: 'pill', text: 'continue_with', width: 280 });
    });
  }
  function signOut() {
    post('/api/auth/logout', {}).then(function () { auth.user = null; try { google.accounts.id.disableAutoSelect(); } catch (e) {} drawAuth(); toast('You are signed out.'); window.dispatchEvent(new Event('tws-auth')); });
  }
  function drawAuth() {
    if (!authBox) return; authBox.textContent = '';
    if (!auth.cfg || !auth.cfg.enabled) return;
    if (!auth.user) { authBox.appendChild(h('button', { class: 'acct-btn', type: 'button', text: 'Sign in', onclick: openLogin })); return; }
    var u = auth.user, face = u.picture ? h('img', { src: u.picture, alt: '', width: 30, height: 30, referrerpolicy: 'no-referrer' }) : h('span', { class: 'acct-initial', text: String(u.name || u.email)[0].toUpperCase() });
    var menu = h('div', { class: 'acct-menu', hidden: 'hidden' }, h('div', { class: 'acct-email', text: u.email }), h('a', { href: '/my-account.html', text: 'My orders' }), h('button', { type: 'button', text: 'Sign out', onclick: signOut }));
    var chip = h('button', { class: 'acct-chip', type: 'button', 'aria-haspopup': 'true', 'aria-label': 'Account menu', onclick: function (e) { e.stopPropagation(); menu.hidden = !menu.hidden; } }, face, h('span', { class: 'acct-name', text: String(u.name || '').split(' ')[0] }));
    document.addEventListener('click', function () { menu.hidden = true; });
    authBox.appendChild(chip); authBox.appendChild(menu);
  }
  function buildAuth(actions, cartBtn) {
    authBox = h('div', { class: 'acct' }); actions.insertBefore(authBox, cartBtn);
    Promise.all([fetch('/api/auth/config').then(function (r) { return r.json(); }), fetch('/api/auth/me').then(function (r) { return r.json(); })]).then(function (x) {
      auth.cfg = x[0]; auth.user = x[1].user; drawAuth();
      window.dispatchEvent(new Event('tws-auth'));
      var skip = ['/success.html', '/cancel.html', '/my-account.html', '/find-orders.html', '/my-orders.html'].indexOf(location.pathname) >= 0, last = 0; try { last = +localStorage.getItem('tws_login_dismiss') || 0; } catch (e) {}
      if (auth.cfg.enabled && !auth.user && !skip && Date.now() - last > 7 * 864e5) setTimeout(function () { if (!auth.user) openLogin(); }, 2500);
    }).catch(function () {});
  }

  // ---- cart ----
  var cart = {}; try { cart = JSON.parse(getLS('tws_cart', '{}')) || {}; } catch (e) { cart = {}; }
  var store = [], applied = null, productsP = null;
  function products() { return productsP || (productsP = fetch('/api/products').then(function (r) { return r.json(); }).then(function (a) { store = a; return a; })); }
  function saveCart() { setLS('tws_cart', JSON.stringify(cart)); applied = null; render(); }
  function add(id) { cart[id] = Math.min(10, (cart[id] || 0) + 1); saveCart(); openCart(); }
  function setQty(id, q) { if (q < 1) delete cart[id]; else cart[id] = Math.min(10, q); saveCart(); }
  function items() { return Object.keys(cart).map(function (id) { return { id: id, quantity: cart[id] }; }); }
  function post(url, body, token) {
    var hd = { 'Content-Type': 'application/json' }; if (token) hd.Authorization = 'Bearer ' + token;
    return fetch(url, { method: 'POST', headers: hd, body: JSON.stringify(body) }).then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || 'Something went wrong.'); return d; }); });
  }
  function checkout(its, btn, msg, code) {
    if (btn) btn.disabled = true; if (msg) msg.textContent = '';
    return post('/api/checkout', { items: its, code: code || '' }).then(function (d) { location.href = d.url; })
      .catch(function (e) { if (btn) btn.disabled = false; if (msg) { msg.textContent = e.message; msg.className = (msg.className || '').replace(/ bad/g, '') + ' bad'; } });
  }
  var overlay, drawer, badge, list, totals, codeIn, codeMsg, payBtn, payMsg;
  function openCart() { drawer.classList.add('open'); overlay.classList.add('open'); }
  function closeCart() { drawer.classList.remove('open'); overlay.classList.remove('open'); }
  function render() {
    if (!badge) return;
    var count = 0, total = 0, ids = Object.keys(cart);
    list.textContent = ''; totals.textContent = '';
    if (!ids.length) list.appendChild(h('li', { class: 'cart-empty-text', text: 'Your cart is currently empty.' }));
    ids.forEach(function (id) {
      var p = store.filter(function (x) { return x.id === id; })[0]; if (!p) return;
      total += p.price * cart[id]; count += cart[id];
      list.appendChild(h('li', { class: 'cart-item-row' }, h('div', { class: 'cart-item-info' }, h('div', { class: 'cart-item-title', text: p.name }), h('div', { class: 'cart-item-price', text: money(p.price) + ' each' })),
        h('div', { class: 'cart-item-controls' }, h('button', { class: 'cart-qty-btn', 'aria-label': 'Remove one', onclick: function () { setQty(id, cart[id] - 1); } }, '−'),
          h('span', { class: 'cart-qty-num', text: String(cart[id]) }), h('button', { class: 'cart-qty-btn', 'aria-label': 'Add one', onclick: function () { setQty(id, cart[id] + 1); } }, '+'))));
    });
    badge.textContent = count; badge.style.display = count ? '' : 'none';
    if (applied) {
      totals.appendChild(h('div', { class: 'tot-line' }, h('span', { text: 'Subtotal' }), h('span', { text: cents(applied.subtotal) })));
      totals.appendChild(h('div', { class: 'tot-line' }, h('span', { text: 'Code ' + applied.code + ' (−' + applied.percent + '%)' }), h('span', { text: '−' + cents(applied.subtotal - applied.total) })));
      totals.appendChild(h('div', { class: 'cart-total-row' }, h('span', { class: 'cart-total-label', text: 'Total:' }), h('span', { class: 'cart-total-value', text: cents(applied.total) })));
    } else totals.appendChild(h('div', { class: 'cart-total-row' }, h('span', { class: 'cart-total-label', text: 'Total:' }), h('span', { class: 'cart-total-value', text: money(total) })));
    payBtn.disabled = !ids.length;
  }
  function applyCode() {
    codeMsg.textContent = ''; codeMsg.style.color = '';
    post('/api/discount', { items: items(), code: codeIn.value }).then(function (d) { applied = d; render(); codeMsg.textContent = 'Code applied.'; codeMsg.style.color = 'var(--success)'; })
      .catch(function (e) { applied = null; render(); codeMsg.textContent = e.message; codeMsg.style.color = 'var(--danger)'; });
  }

  function build() {
    var path = location.pathname;
    var nav = [['/', 'Home'], ['/products', 'Products'], ['/strategies', 'Strategies'], ['/blog', 'Blog'], ['/contact.html', 'Contact']];
    var sw = h('div', { class: 'theme-switcher', role: 'group', 'aria-label': 'Theme switcher' }, ['simple', 'pro', 'fancy'].map(function (t) {
      return h('button', { class: 'theme-btn' + (t === root.dataset.theme ? ' active' : ''), 'data-theme': t, 'aria-label': t + ' theme', text: t[0].toUpperCase() + t.slice(1), onclick: function () {
        root.dataset.theme = t; setLS('tws_theme', t); sw.querySelectorAll('.theme-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.theme === t); }); } });
    }));
    var cartBtn = h('button', { class: 'cart-btn', id: 'openCartBtn', 'aria-label': 'Open cart', onclick: openCart }, svg(ICON.cart(19)));
    badge = h('span', { class: 'cart-badge', id: 'cartCountBadge', text: '0' }); cartBtn.appendChild(badge);
    var logo = function (n) { return h('div', { class: 'brand-logo' }, svg(ICON.logo(n))); };
    var header = h('header', { class: 'navbar' }, h('div', { class: 'container nav-wrap' },
      h('a', { class: 'brand', href: '/' }, logo(28), h('span', { text: 'TraderWorkStation' })),
      h('nav', {}, h('ul', { class: 'nav-links' }, nav.map(function (n) { return h('li', {}, h('a', { href: n[0], text: n[1], 'aria-current': path === n[0] ? 'page' : null })); }))),
      h('div', { class: 'nav-actions' }, sw, cartBtn)));
    var main = document.querySelector('main'); document.body.insertBefore(header, main || document.body.firstChild);
    document.body.insertBefore(buildTicker(), main || header.nextSibling);
    document.body.insertBefore(h('a', { href: '#main', style: 'position:absolute;left:-999px', onfocus: function (e) { e.target.style.left = '10px'; }, text: 'Skip to content' }), header);
    if (main) main.id = main.id || 'main';

    function col(t, l) { return h('div', { class: 'footer-col' }, h('h5', { text: t }), h('ul', {}, l.map(function (x) { return h('li', {}, h('a', { href: x[0], text: x[1] })); }))); }
    document.body.appendChild(h('footer', { class: 'footer' }, h('div', { class: 'container' }, h('div', { class: 'footer-grid' },
      h('div', { class: 'footer-brand' }, h('a', { class: 'brand', href: '/' }, logo(24), h('span', { text: 'TraderWorkStation' })),
        h('p', { class: 'footer-tagline' }, 'Professional trading resources with a ', h('span', { class: 'refund-days', text: '14' }), '-day guarantee. Educational use only.')),
      col('Platform', [['/products', 'Products'], ['/strategies', 'Strategies'], ['/#live', 'Live Sessions'], ['/blog', 'Blog'], ['/find-orders.html', 'Find my orders']]),
      col('Company', [['/about.html', 'About'], ['/contact.html', 'Contact'], ['/faq.html', 'FAQ']]),
      col('Legal', [['/privacy.html', 'Privacy Policy'], ['/terms.html', 'Terms of Service'], ['/refund-policy.html', 'Refund Policy'], ['/risk-disclosure.html', 'Risk Disclosure']])),
      h('div', { class: 'footer-bottom' }, h('div', { text: '© 2026 Trader WorkStation. All rights reserved.' }), h('div', {}, h('div', { text: 'Trading involves substantial risk of loss. Educational use only, not financial advice.' }), h('div', { id: 'marketNote', style: 'margin-top:6px;opacity:.8' }))))));

    overlay = h('div', { class: 'cart-overlay', id: 'cartOverlay', onclick: closeCart });
    list = h('ul', { class: 'cart-items-list', id: 'cartItemsList' }); totals = h('div');
    codeIn = h('input', { type: 'text', placeholder: 'Discount code', 'aria-label': 'Discount code', maxlength: 30 }); codeMsg = h('p', { class: 'cart-code-msg', role: 'status' });
    payMsg = h('p', { class: 'cart-error-msg', role: 'alert' });
    payBtn = h('button', { class: 'btn-checkout', id: 'checkoutBtn', disabled: 'disabled', onclick: function () { checkout(items(), payBtn, payMsg, applied ? applied.code : ''); } }, h('span', { text: 'Pay with Stripe' }), svg(ICON.arrow(17)));
    drawer = h('aside', { class: 'cart-drawer', id: 'cartDrawer', 'aria-label': 'Shopping Cart' },
      h('div', { class: 'cart-header' }, h('h3', { text: 'Your Cart' }), h('button', { class: 'cart-close-btn', 'aria-label': 'Close cart', onclick: closeCart, text: '✕' })), list,
      h('div', { class: 'cart-footer' }, h('div', { class: 'code-row' }, codeIn, h('button', { class: 'btn-sm ghost', text: 'Apply', onclick: applyCode })), codeMsg, totals, payMsg, payBtn,
        h('p', { class: 'note', style: 'margin-top:10px', text: 'Secure checkout by Stripe. Full refund within the refund window.' })));
    document.body.appendChild(overlay); document.body.appendChild(drawer);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCart(); });
    fetch('/api/config').then(function (r) { return r.json(); }).then(function (c) { document.querySelectorAll('.refund-days').forEach(function (el) { el.textContent = c.refundDays; }); }).catch(function () {});
    buildAuth(header.querySelector('.nav-actions'), cartBtn);
    buildAssistant();
    products().then(render); render();
  }
  window.TWS = { h: h, svg: svg, ICON: ICON, money: money, cents: cents, pcard: pcard, postcard: postcard, stratcard: stratcard, openLogin: openLogin, auth: auth, add: add, checkout: checkout, post: post, products: products };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
