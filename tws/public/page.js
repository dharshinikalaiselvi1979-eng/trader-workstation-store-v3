(function () {
  var T = window.TWS, h = T.h, $ = function (s) { return document.querySelector(s); };
  var path = location.pathname, qs = new URLSearchParams(location.search);
  function fill(sel, list, fn) { var g = $(sel); if (!g) return; g.textContent = ''; list.forEach(function (p) { g.appendChild(fn(p)); }); }
  function setDays() { fetch('/api/config').then(function (r) { return r.json(); }).then(function (c) { document.querySelectorAll('.refund-days').forEach(function (e) { e.textContent = c.refundDays; }); }).catch(function () {}); }
  function status(el, text, ok) { el.textContent = text; el.className = (el.className.replace(/ (ok|bad)/g, '')) + (ok === undefined ? '' : ok ? ' ok' : ' bad'); }

  function bindForm(f, kind, ids, okText) {
    if (!f) return;
    var msg = f.querySelector('.msg') || $('#formStatusNotice');
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var b = f.querySelector('button[type=submit]'); b.disabled = true;
      var d = { kind: kind, name: $(ids.name).value, email: $(ids.email).value, message: $(ids.message).value, website: (f.querySelector('.hp') || {}).value || '' };
      T.post('/api/inbox', d).then(function () { f.reset(); status(msg, okText, true); }).catch(function (er) { status(msg, er.message, false); }).then(function () { b.disabled = false; });
    });
  }
  bindForm($('#liveForm'), 'live', { name: '#userName', email: '#userEmail', message: '#userReason' }, 'Thank you. You are on the list, and we sent you a confirmation email.');
  bindForm($('#contactForm'), 'contact', { name: '#cName', email: '#cEmail', message: '#cMessage' }, 'Thank you. We received your message and sent you a confirmation.');
  var lf = $('#lookupForm');
  if (lf) lf.addEventListener('submit', function (e) {
    e.preventDefault(); var m = lf.querySelector('.msg');
    T.post('/api/lookup', { email: $('#lEmail').value }).then(function () { status(m, 'If we found orders for that email, we sent you a link. It works for 30 minutes.', true); }).catch(function (er) { status(m, er.message, false); });
  });


  // live session block on the home page: date and time come from the admin
  function liveSection() {
    var sec = $('#live'); if (!sec) return;
    var pill = sec.querySelector('.offline-pill'), title = sec.querySelector('.live-title'), desc = sec.querySelector('.live-desc'), btn = sec.querySelector('.btn-submit-live'), note = $('#formStatusNotice');
    var defDesc = desc ? desc.textContent : '', meta = h('p', { class: 'note', style: 'margin-top:14px;font-weight:600' }); if (desc) desc.parentNode.insertBefore(meta, desc.nextSibling);
    function left(ms) { var m = Math.floor(ms / 60000), dd = Math.floor(m / 1440), hh = Math.floor((m % 1440) / 60), mm = m % 60; return dd ? dd + 'd ' + hh + 'h' : hh ? hh + 'h ' + mm + 'm' : Math.max(1, mm) + 'm'; }
    function paint(d) {
      var s = d.session, st = d.state, pt = pill && pill.querySelector('span:last-child'), dot = pill && pill.querySelector('.offline-dot');
      if (pt) pt.textContent = st === 'live' ? 'Live now' : st === 'scheduled' ? 'Scheduled' : 'Currently offline';
      if (dot) dot.style.background = st === 'none' ? '' : '#22c55e';
      var accent = 'date to be announced';
      if (st === 'live') accent = 'happening now';
      if (st === 'scheduled') accent = new Date(s.start).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
      if (title) { title.textContent = ''; title.appendChild(document.createTextNode(s && s.title ? s.title + ':' : 'Next live session:')); title.appendChild(h('br')); title.appendChild(h('span', { class: 'blue-accent', text: accent })); }
      if (desc) desc.textContent = s && s.description ? s.description : (st === 'none' ? 'No session is scheduled right now. Leave your details and we will email you as soon as the next one is set.' : defDesc);
      var bits = []; if (st === 'scheduled') bits.push('Starts in ' + left(new Date(s.start) - new Date())); if (s && s.capacity) bits.push(s.spotsLeft > 0 ? s.spotsLeft + ' of ' + s.capacity + ' spots left' : 'Fully booked');
      meta.textContent = bits.join(' · '); meta.hidden = !bits.length;
      var closed = s && !s.open; if (btn) { btn.disabled = !!closed; var sp = btn.querySelector('span'); if (sp) sp.textContent = st === 'none' ? '🔔 Notify me' : '📅 Reserve my spot'; }
      if (note && !/ (ok|bad)/.test(note.className)) note.textContent = closed ? (s.spotsLeft === 0 ? 'This session is fully booked.' : 'Registration for this session is closed.') : 'No spam. We only email you the session details.';
    }
    function load() { fetch('/api/live').then(function (r) { return r.json(); }).then(paint).catch(function () {}); }
    load(); setInterval(load, 60000);
  }
  liveSection();

  // product grids with category filters
  function shopGrid(gridSel, filterSel, withSearch) {
    T.products().then(function (all) {
      var cat = qs.get('cat') || 'all', q = '', box = $(filterSel);
      var cats = ['all'].concat(all.map(function (p) { return p.category; }).filter(function (c, i, a) { return a.indexOf(c) === i; }));
      function show() {
        var l = all.filter(function (p) { return (cat === 'all' || p.category.toLowerCase() === cat.toLowerCase()) && (p.name + ' ' + p.tagline + ' ' + p.category).toLowerCase().indexOf(q) > -1; });
        fill(gridSel, l, T.pcard); var e = $('#empty'); if (e) e.hidden = l.length > 0;
      }
      if (box) { cats.forEach(function (c) { box.appendChild(h('button', { class: 'filter-btn' + (c.toLowerCase() === cat.toLowerCase() ? ' active' : ''), text: c === 'all' ? 'All Products' : c, onclick: function (e) {
        cat = c; box.querySelectorAll('.filter-btn').forEach(function (x) { x.classList.toggle('active', x === e.currentTarget); }); show(); } })); }); }
      if (withSearch) { var s = $('#q'); if (s) s.addEventListener('input', function (e) { q = e.target.value.toLowerCase().trim(); show(); }); }
      show();
      document.querySelectorAll('.count').forEach(function (e) { e.textContent = all.length; });
      var topics = $('#topics');
      if (topics) { var cc = {}; all.forEach(function (p) { cc[p.category] = (cc[p.category] || 0) + 1; }); Object.keys(cc).forEach(function (c) { topics.appendChild(h('div', { class: 'tp-item' }, h('span', { class: 'tp-name', text: c }), h('span', { class: 'tp-sales', text: cc[c] + (cc[c] > 1 ? ' guides' : ' guide') }))); }); }
    });
  }
  if (path === '/' || path === '/index.html') { shopGrid('#productGrid', '#filters', false); fetch('/api/posts').then(function (r) { return r.json(); }).then(function (a) { fill('#posts', a.slice(0, 3), T.postcard); }); }
  if (path === '/products' || path === '/shop' || path === '/shop.html') shopGrid('#grid', '#filters', true);

  // product page
  if (path.indexOf('/p/') === 0) T.products().then(function (all) {
    var id = decodeURIComponent(path.slice(3)), w = $('#pwrap');
    var p = all.filter(function (x) { return x.id === id || x.alias === id; })[0]; w.textContent = '';
    if (!p) return w.appendChild(h('p', { text: 'Guide not found.' }));
    var msg = h('p', { class: 'msg', role: 'alert' }), buy = h('button', { class: 'btn-primary btn-wide', style: 'border:0;cursor:pointer;width:100%;justify-content:center', text: 'Buy now', onclick: function () { T.checkout([{ id: p.id, quantity: 1 }], buy, msg); } });
    w.appendChild(h('div', {}, h('div', { class: 'img' }, h('img', { src: p.image, alt: p.name })),
      h('p', { style: 'margin-top:22px' }, h('span', { class: 'category-pill ' + p.category, text: p.category })),
      h('h1', { style: 'font-size:clamp(2rem,4.6vw,3.1rem);line-height:1.1;letter-spacing:-.03em;margin:12px 0', text: p.name }), h('p', { class: 'lead', text: p.description }),
      h('h3', { style: 'margin-top:26px', text: 'Inside the guide' }), h('ul', { class: 'checks' }, p.features.map(function (f) { return h('li', { text: f }); })),
      h('p', { class: 'note', text: 'Educational use only. Trading involves substantial risk of loss. This is not financial advice.' })));
    w.appendChild(h('aside', { class: 'panel order-box', 'aria-label': 'Order' }, h('p', { class: 'big', text: T.money(p.price) }),
      h('p', { class: 'note', style: 'margin:4px 0 16px', text: p.format + ' · instant download and licence key after payment' }), buy,
      h('p', { style: 'margin-top:10px' }, h('button', { class: 'btn-glass', style: 'width:100%;justify-content:center;cursor:pointer', onclick: function () { T.add(p.id); } }, T.svg(T.ICON.cart(15)), h('span', { text: 'Add to Cart' }))), msg,
      h('p', { class: 'note' }, 'Full refund within ', h('span', { class: 'refund-days', text: '14' }), ' days. Secure checkout by Stripe.')));
    document.title = p.name + ' | Trader WorkStation'; setDays();
    fill('#grid', all.filter(function (x) { return x.id !== p.id; }).slice(0, 4), T.pcard);
  });

  // blog list + article
  if (path === '/blog') fetch('/api/posts').then(function (r) { return r.json(); }).then(function (a) { fill('#posts', a, T.postcard); });
  if (path.indexOf('/blog/') === 0) fetch('/api/posts/' + encodeURIComponent(path.slice(6))).then(function (r) { return r.json(); }).then(function (p) {
    var box = $('#article'); box.textContent = '';
    if (p.error) return box.appendChild(h('p', { text: 'Article not found.' }));
    document.title = p.title + ' | Trader WorkStation';
    box.appendChild(h('p', {}, h('a', { class: 'link', href: '/blog', text: '← All articles' })));
    box.appendChild(h('div', {}, h('span', { class: 'blog-tag', text: p.category }), ' ', h('span', { class: 'note', text: p.readMin + ' min read · ' + new Date(p.date).toLocaleDateString() })));
    box.appendChild(h('h1', { text: p.title })); box.appendChild(h('div', { class: 'hero-img' }, h('img', { src: p.image, alt: '' })));
    p.body.split(/\n\s*\n/).forEach(function (blk) { blk = blk.trim(); if (!blk) return; box.appendChild(/^## /.test(blk) ? h('h2', { text: blk.slice(3) }) : h('p', { text: blk })); });
    box.appendChild(h('p', { class: 'note', text: 'Educational use only. Not financial advice. Trading involves substantial risk of loss.' }));
  });

  // strategies: list, home teaser and detail
  function article(box, body) { body.split(/\n\s*\n/).forEach(function (blk) { blk = blk.trim(); if (!blk) return; box.appendChild(/^## /.test(blk) ? h('h2', { text: blk.slice(3) }) : h('p', { text: blk })); }); }
  if (path === '/strategies') fetch('/api/strategies').then(function (r) { return r.json(); }).then(function (a) { fill('#strats', a, T.stratcard); $('#empty').hidden = a.length > 0; });
  if (path === '/' || path === '/index.html') fetch('/api/strategies').then(function (r) { return r.json(); }).then(function (a) { if (a.length) { var s = $('#strategies'); if (s) { s.hidden = false; fill('#strats', a.slice(0, 3), T.stratcard); } } });
  if (path.indexOf('/strategies/') === 0) fetch('/api/strategies/' + encodeURIComponent(path.slice(12))).then(function (r) { return r.json(); }).then(function (s) {
    var box = $('#strategy'); box.textContent = '';
    if (s.error) return box.appendChild(h('p', { text: 'Strategy not found.' }));
    document.title = s.title + ' | Trader WorkStation';
    box.appendChild(h('p', {}, h('a', { class: 'link', href: '/strategies', text: '← All strategies' })));
    box.appendChild(h('div', {}, h('span', { class: 'blog-tag', text: s.category }), ' ', h('span', { class: 'note', text: new Date(s.date).toLocaleDateString() })));
    box.appendChild(h('h1', { text: s.title }));
    if (s.summary) box.appendChild(h('p', { class: 'lead', text: s.summary }));
    var f = s.files;
    if (f.video) {
      var v = h('video', { controls: 'controls', preload: 'metadata', playsinline: 'playsinline', style: 'width:100%;border-radius:18px;background:#000;margin:18px 0 6px' }, h('source', { src: f.video.url, type: f.video.mime }),
        f.captions ? h('track', { kind: 'captions', srclang: 'en', label: 'English', src: f.captions.url, default: 'default' }) : null, 'Your browser cannot play this video.');
      box.appendChild(v); box.appendChild(h('p', { class: 'note', text: f.captions ? 'English captions are on. Use the video player controls to turn them off.' : 'This video has no captions yet. The full text is below.' }));
    }
    if (f.audio) {
      box.appendChild(h('div', { class: 'panel', style: 'margin:16px 0' }, h('strong', { text: s.aiAudio ? 'Audio narration (AI-generated voice)' : 'Audio narration' }),
        h('audio', { controls: 'controls', preload: 'none', src: f.audio.url, style: 'width:100%;margin-top:10px' })));
    } else if ('speechSynthesis' in window && s.body) {
      var speaking = false, lb = h('button', { class: 'btn-sm', style: 'cursor:pointer', text: 'Listen' }), sb = h('button', { class: 'btn-sm ghost', style: 'cursor:pointer', text: 'Stop' });
      lb.addEventListener('click', function () {
        if (!speaking) { var u = new SpeechSynthesisUtterance(s.title + '. ' + s.body.replace(/^## /gm, '')); u.lang = 'en-US'; u.onend = function () { speaking = false; lb.textContent = 'Listen'; }; speechSynthesis.cancel(); speechSynthesis.speak(u); speaking = true; lb.textContent = 'Pause'; }
        else if (speechSynthesis.paused) { speechSynthesis.resume(); lb.textContent = 'Pause'; } else { speechSynthesis.pause(); lb.textContent = 'Resume'; }
      });
      sb.addEventListener('click', function () { speechSynthesis.cancel(); speaking = false; lb.textContent = 'Listen'; });
      window.addEventListener('beforeunload', function () { speechSynthesis.cancel(); });
      box.appendChild(h('div', { class: 'panel', style: 'margin:16px 0' }, h('strong', { text: 'Listen to this strategy' }), h('p', { class: 'note', style: 'margin:4px 0 12px', text: 'Read aloud by your browser’s built-in voice.' }), h('div', { style: 'display:flex;gap:10px' }, lb, sb)));
    }
    if (f.pdf) box.appendChild(h('div', { class: 'panel', style: 'margin:16px 0;display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap' },
      h('div', {}, h('strong', { text: 'PDF: ' + f.pdf.name }), h('div', { class: 'note', text: (f.pdf.size / 1048576).toFixed(1) + ' MB' })),
      h('div', { style: 'display:flex;gap:10px' }, h('a', { class: 'btn-sm ghost', href: f.pdf.url, target: '_blank', rel: 'noopener', text: 'Open PDF' }), h('a', { class: 'btn-sm', href: f.pdf.url + '?download=1', text: 'Download PDF' }))));
    if (s.body) { box.appendChild(h('h2', { text: f.video ? 'Transcript and notes' : 'Full text' })); article(box, s.body); }
    box.appendChild(h('p', { class: 'note', text: 'Educational use only. Not financial advice. Trading involves substantial risk of loss.' }));
  });

  // order page
  var box = $('#order');
  if (box && path === '/success.html') {
    var sid = qs.get('session_id'), tries = 0; try { localStorage.removeItem('tws_cart'); } catch (e) {}
    var say = function (t) { box.textContent = ''; box.appendChild(h('p', { text: t })); };
    var poll = function () {
      if (!sid) return say('No order found in this link.');
      fetch('/api/order?session_id=' + encodeURIComponent(sid)).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); }).then(function (x) {
        if (!x.ok) return say(x.d.error || 'Order not found.');
        if (x.d.status === 'pending' && ++tries < 60) { say('Confirming your payment…'); return setTimeout(poll, 2000); }
        draw(x.d);
      }).catch(function () { if (++tries < 60) setTimeout(poll, 2000); else say('We could not reach the server. Reload this page.'); });
    };
    var draw = function (o) {
      box.textContent = '';
      box.appendChild(h('p', {}, 'Status: ', h('span', { class: 'status ' + o.status, text: o.status.replace('_', ' ') })));
      if (o.status === 'pending') return box.appendChild(h('p', { text: 'Payment is still being confirmed. Reload this page in a minute.' }));
      if (o.status === 'expired') return box.appendChild(h('p', { text: 'This checkout expired and no payment was taken.' }));
      if (o.status === 'refunded') return box.appendChild(h('p', { text: 'This order was refunded. Downloads and keys are no longer available.' }));
      try { var os = JSON.parse(localStorage.getItem('tws_orders') || '[]'); if (os.indexOf(sid) < 0) { os.unshift(sid); localStorage.setItem('tws_orders', JSON.stringify(os.slice(0, 5))); } } catch (e) {}
      if (o.email) box.appendChild(h('p', { class: 'note', text: 'Paid with ' + o.email + ' · total ' + T.cents(o.amount) + (o.code ? ' (code ' + o.code + ')' : '') + '. A receipt was emailed to you.' }));
      o.items.forEach(function (it) {
        box.appendChild(h('div', { class: 'citem' }, h('div', {}, h('strong', { text: it.name + ' × ' + it.quantity }),
          o.licenses.filter(function (l) { return l.id === it.id; }).map(function (l) { return h('div', { style: 'margin-top:6px' }, 'Licence key: ', h('span', { class: 'key', text: l.key })); })),
          h('a', { class: 'btn-sm', href: '/download/' + o.token + '/' + it.id, text: 'Download' })));
      });
      if (o.status === 'refund_requested') box.appendChild(h('p', { style: 'margin-top:16px', text: 'Your refund request was received. We will review it soon.' }));
      else if (o.refundable) {
        var r = h('textarea', { class: 'form-input', rows: 2, maxlength: 500, 'aria-label': 'Reason for refund (optional)' }), m = h('p', { class: 'msg', role: 'status' });
        box.appendChild(h('h3', { style: 'margin-top:22px', text: 'Request a refund' }));
        box.appendChild(h('p', { class: 'note', style: 'margin-bottom:8px', text: 'Full refund until ' + new Date(o.refundUntil).toLocaleDateString() + '. Optional reason:' })); box.appendChild(r);
        box.appendChild(h('p', { style: 'margin-top:10px' }, h('button', { class: 'btn-sm ghost', style: 'cursor:pointer', text: 'Request refund', onclick: function () { T.post('/api/refund', { session_id: sid, reason: r.value }).then(poll).catch(function (e) { status(m, e.message, false); }); } }))); box.appendChild(m);
      } else box.appendChild(h('p', { class: 'note', style: 'margin-top:16px', text: 'The refund window for this order has ended.' }));
      T.products().then(function (all) {
        var owned = o.items.map(function (i) { return i.id; }), rec = all.filter(function (p) { return owned.indexOf(p.id) < 0; }).slice(0, 3);
        if (!rec.length) return; $('#next').hidden = false; fill('#nextgrid', rec, T.pcard);
      });
    };
    poll();
  }

  // my account (signed in with Google)
  var accBox = $('#account');
  if (accBox) {
    var renderAccount = function () {
      fetch('/api/auth/me').then(function (r) { return r.json(); }).then(function (d) {
        accBox.textContent = '';
        if (!d.user) {
          accBox.appendChild(h('p', { text: 'Sign in with Google to see your orders and get personal help from the assistant.' }));
          if (T.auth.cfg && T.auth.cfg.enabled) accBox.appendChild(h('p', {}, h('button', { class: 'btn-sm', style: 'cursor:pointer', text: 'Sign in with Google', onclick: T.openLogin })));
          else accBox.appendChild(h('p', { class: 'note', text: 'Google sign-in is not turned on for this site yet.' }));
          return;
        }
        accBox.appendChild(h('div', { style: 'display:flex;align-items:center;gap:14px;margin-bottom:18px' }, d.user.picture ? h('img', { src: d.user.picture, alt: '', width: 52, height: 52, referrerpolicy: 'no-referrer', style: 'border-radius:50%' }) : null, h('div', {}, h('strong', { text: d.user.name }), h('div', { class: 'note', text: d.user.email }))));
        accBox.appendChild(h('h3', { text: 'Your orders' }));
        var list = h('div', {}, h('p', { class: 'note', text: 'Loading…' })); accBox.appendChild(list);
        fetch('/api/auth/orders').then(function (r) { return r.json(); }).then(function (os) {
          list.textContent = ''; if (!os.length) list.appendChild(h('p', { class: 'note', text: 'No orders yet. Orders you pay for with this Google email appear here.' }));
          os.forEach(function (o) { list.appendChild(h('div', { class: 'citem' }, h('div', {}, h('strong', { text: o.items.map(function (i) { return i.name + ' ×' + i.quantity; }).join(', ') }), h('div', { class: 'note', text: new Date(o.created_at).toLocaleDateString() + ' · ' + T.cents(o.amount) + ' · ' + o.status.replace('_', ' ') })), h('a', { class: 'btn-sm', href: '/success.html?session_id=' + encodeURIComponent(o.session_id), text: 'Open order' }))); });
        });
        accBox.appendChild(h('p', { style: 'margin-top:26px' }, h('button', { class: 'btn-sm ghost', style: 'cursor:pointer', text: 'Delete my account', onclick: function () { if (confirm('Delete your account? Your orders and downloads stay available from their order links.')) T.post('/api/auth/delete', {}).then(function () { T.auth.user = null; window.location.href = '/'; }); } })));
      });
    };
    window.addEventListener('tws-auth', renderAccount); renderAccount();
  }

  // my orders (emailed link)
  var mo = $('#myorders');
  if (mo) fetch('/api/my-orders?t=' + encodeURIComponent(qs.get('t') || '')).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); }).then(function (x) {
    mo.textContent = '';
    if (!x.ok) return mo.appendChild(h('p', {}, x.d.error + ' ', h('a', { class: 'link', href: '/find-orders.html', text: 'Request a new link' })));
    try { localStorage.setItem('tws_orders', JSON.stringify(x.d.filter(function (o) { return o.status !== 'refunded'; }).map(function (o) { return o.session_id; }).slice(0, 5))); } catch (e) {}
    x.d.forEach(function (o) { mo.appendChild(h('div', { class: 'citem' }, h('div', {}, h('strong', { text: o.items.map(function (i) { return i.name + ' ×' + i.quantity; }).join(', ') }),
      h('div', { class: 'note', text: new Date(o.created_at).toLocaleDateString() + ' · ' + T.cents(o.amount) + ' · ' + o.status.replace('_', ' ') })), h('a', { class: 'btn-sm', href: '/success.html?session_id=' + encodeURIComponent(o.session_id), text: 'Open order' }))); });
  });
  setDays();
})();
