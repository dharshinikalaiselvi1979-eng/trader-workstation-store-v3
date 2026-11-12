(function () {
  var root = document.getElementById('root'), tok = null, tab = 'dashboard', data = {}, editing = null, timer = null;
  try { tok = sessionStorage.getItem('twsAdmin'); } catch (e) {}
  function h(tag, props) { var el = document.createElement(tag);
    for (var k in (props || {})) { var v = props[k]; if (k === 'text') el.textContent = v; else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v); else if (v !== null && v !== undefined && v !== false) el.setAttribute(k, v); }
    for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c === null || c === undefined) continue; if (Array.isArray(c)) c.forEach(function (x) { el.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); }); else el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); }
    return el; }
  var cents = function (n) { return '$' + (n / 100).toFixed(2); }, when = function (d) { return d ? new Date(d).toLocaleString() : ''; };
  function api(url, body) {
    var o = { headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' } }; if (body) { o.method = 'POST'; o.body = JSON.stringify(body); }
    return fetch(url, o).then(function (r) { if (r.status === 401) { var e = new Error('401'); e.auth = true; throw e; } return r; });
  }
  var json = function (url, body) { return api(url, body).then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || 'Error'); return d; }); }); };
  function table(heads, rows) { return h('div', { class: 'tw' }, h('table', {}, h('thead', {}, h('tr', {}, heads.map(function (x) { return h('th', { text: x }); }))), h('tbody', {}, rows))); }
  function td() { var a = [].slice.call(arguments); return h('tr', {}, a.map(function (c) { return h('td', {}, c == null ? '' : c); })); }

  function login(msg) {
    root.textContent = '';
    var inp = h('input', { type: 'password', id: 'tok', name: 'admin-access-token', autocomplete: 'new-password', 'aria-label': 'Admin token' }), m = h('p', { class: 'msg bad', role: 'alert', text: msg || '' });
    root.appendChild(h('div', { class: 'login' }, h('form', { onsubmit: function (e) { e.preventDefault(); tok = inp.value.trim(); try { sessionStorage.setItem('twsAdmin', tok); } catch (x) {} start(); } },
      h('h1', { text: 'Admin sign in' }), h('p', { class: 'sub', text: 'Enter the admin token shown when the server starts.' }), h('label', { for: 'tok', text: 'Admin token' }), inp,
      h('p', {}, h('button', { class: 'btn', type: 'submit', text: 'Sign in' })), m, h('p', { class: 'note' }, h('a', { href: '/', text: '← Back to the store' })))));
  }
  function start() {
    json('/api/admin/orders').then(function (d) { data.orders = d; shell(); }).catch(function (e) { if (e.auth) { try { sessionStorage.removeItem('twsAdmin'); } catch (x) {} login(tok ? 'Wrong token.' : ''); } else login(e.message); });
  }
  var TABS = [['dashboard', 'Dashboard'], ['orders', 'Orders'], ['users', 'Users'], ['messages', 'Messages'], ['live', 'Live sessions'], ['codes', 'Discount codes'], ['blog', 'Blog'], ['strategies', 'Strategies'], ['assistant', 'Assistant'], ['stripe', 'Stripe'], ['emails', 'Emails']];
  function shell() {
    root.textContent = '';
    var main = h('main', { id: 'view' });
    var side = h('aside', {}, h('div', { class: 'logo', text: 'TWS Admin' }), TABS.map(function (t) {
      var pr = t[0] === 'orders' && data.orders.pendingRefunds ? h('span', { class: 'badge', text: String(data.orders.pendingRefunds) }) : null;
      return h('button', { class: 'nav', 'aria-current': String(tab === t[0]), onclick: function () { tab = t[0]; editing = null; shell(); } }, t[1], pr);
    }), h('div', { style: 'flex:1' }), h('a', { class: 'nav', href: '/', style: 'padding:10px 12px;color:#93a0bf;text-decoration:none', text: 'View store ↗' }),
      h('button', { class: 'nav', onclick: function () { try { sessionStorage.removeItem('twsAdmin'); } catch (x) {} location.reload(); } }, 'Sign out'));
    root.appendChild(h('div', { class: 'app' }, side, main)); view(main);
  }
  function view(main) { var f = { dashboard: dash, orders: orders, users: users, messages: messages, live: liveSessions, codes: codes, blog: blog, strategies: strategies, assistant: assistant, stripe: stripeTab, emails: emails }[tab]; f(main); }

  function dash(m) {
    var o = data.orders, t = o.totals;
    m.appendChild(h('h1', { text: 'Dashboard' })); m.appendChild(h('p', { class: 'sub', text: 'A quick look at the store.' }));
    var items = [['Paid orders', t.orders], ['Revenue', cents(t.cents)], ['Today', cents(t.todayCents)], ['Refund requests', o.pendingRefunds], ['Signed-in users', o.users], ['Messages', o.messages], ['Active codes', o.activeCodes]];
    m.appendChild(h('div', { class: 'cards' }, items.map(function (x) { return h('div', { class: 'card' }, h('div', { class: 'k', text: x[0] }), h('div', { class: 'v', text: String(x[1]) })); })));
    m.appendChild(h('div', { class: 'card', style: 'margin-top:14px' }, h('div', { class: 'k', text: 'Next live session' }), h('div', { style: 'margin-top:4px;font-weight:700', text: o.live ? o.live.when + ' · ' + o.live.title + ' · ' + o.live.registrants + ' registered' : 'None scheduled. Open the Live sessions tab to set one.' })));
    m.appendChild(h('p', { class: 'note', style: 'margin-top:14px', text: 'Stripe: ' + (o.stripeMode === 'live' ? 'LIVE mode (real money). ' : 'test mode (no real money). ') + (o.tickerOff ? 'Market ticker: off (TICKER=off in .env).' : 'Market ticker: crypto is live (Binance). US stocks: ' + (o.tickerStocks ? 'live (Finnhub).' : 'off. Add FINNHUB_API_KEY to .env (free key at finnhub.io) and restart.')) }));
    m.appendChild(h('h2', { text: 'Latest orders' }));
    m.appendChild(table(['#', 'Date', 'Email', 'Total', 'Status'], o.orders.slice(0, 6).map(function (x) { return td(String(x.id), when(x.created_at), x.email, cents(x.amount), h('span', { class: 'st ' + x.status, text: x.status.replace('_', ' ') })); })));
    clearTimeout(timer); timer = setTimeout(function () { if (tab === 'dashboard') json('/api/admin/orders').then(function (d) { data.orders = d; shell(); }).catch(function () {}); }, 15000);
  }

  function orders(m) {
    m.appendChild(h('h1', { text: 'Orders' }));
    var msg = h('p', { class: 'msg', role: 'status' }), q = h('input', { type: 'search', placeholder: 'Search by email, order # or status', 'aria-label': 'Search orders', style: 'max-width:340px' });
    var exp = h('button', { class: 'btn g', text: 'Export CSV', onclick: function () {
      api('/api/admin/export.csv').then(function (r) { return r.blob(); }).then(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'orders.csv'; a.click(); }); } });
    m.appendChild(h('div', { class: 'row', style: 'margin:14px 0' }, q, exp)); m.appendChild(msg);
    var holder = h('div'); m.appendChild(holder);
    function act(id, action) {
      var note = action === 'reject' ? (prompt('Optional note to keep with this order:') || '') : '';
      if (action === 'approve' && !confirm('Refund this order in full through Stripe?')) return;
      json('/api/admin/refund', { id: id, action: action, note: note }).then(reload).catch(function (e) { msg.textContent = e.message; msg.className = 'msg bad'; });
    }
    function reload() { json('/api/admin/orders').then(function (d) { data.orders = d; draw(); }); }
    function draw() {
      var term = q.value.toLowerCase();
      var rows = data.orders.orders.filter(function (o) { return !term || (o.email + ' ' + o.id + ' ' + o.status + ' ' + o.code).toLowerCase().indexOf(term) > -1; }).map(function (o) {
        var its = JSON.parse(o.items).map(function (i) { return i.name + ' ×' + i.quantity; }).join(', '), a = h('div', { class: 'row' });
        if (o.status === 'refund_requested') { a.appendChild(h('div', { class: 'note', text: o.refund_reason || 'No reason given' })); a.appendChild(h('button', { class: 'btn s', text: 'Approve', onclick: function () { act(o.id, 'approve'); } })); a.appendChild(h('button', { class: 'btn g s', text: 'Reject', onclick: function () { act(o.id, 'reject'); } })); }
        if ((o.status === 'paid' || o.status === 'refund_requested') && o.email) a.appendChild(h('button', { class: 'btn g s', text: 'Resend receipt', onclick: function () { json('/api/admin/resend', { id: o.id }).then(function () { msg.textContent = 'Receipt sent (see Emails tab).'; msg.className = 'msg ok'; }).catch(function (e) { msg.textContent = e.message; msg.className = 'msg bad'; }); } }));
        var link = o.payment_intent ? h('a', { href: 'https://dashboard.stripe.com/' + (data.orders.stripeMode === 'live' ? '' : 'test/') + 'payments/' + o.payment_intent, target: '_blank', rel: 'noopener', class: 'note', text: ' · Stripe ↗' }) : null;
        return td(String(o.id), when(o.created_at), o.email, its, h('span', {}, cents(o.amount) + (o.code ? ' · ' + o.code : ''), link), h('span', { class: 'st ' + o.status, text: o.status.replace('_', ' ') }), a);
      });
      holder.textContent = ''; holder.appendChild(table(['#', 'Date', 'Email', 'Items', 'Total', 'Status', 'Actions'], rows));
    }
    q.addEventListener('input', draw); draw();
  }

  function users(m) {
    var view2 = function () { var mm = document.getElementById('view'); mm.textContent = ''; users(mm); };
    m.appendChild(h('h1', { text: 'Users' })); m.appendChild(h('p', { class: 'sub', text: 'People who signed in with Google. Each new user gets a welcome email at their Google address.' }));
    var msg = h('p', { class: 'msg', role: 'status' }), holder = h('div'); m.appendChild(msg); m.appendChild(holder);
    json('/api/admin/users').then(function (a) {
      if (!a.length) { holder.appendChild(h('p', { class: 'note', text: 'Nobody has signed in yet. Google sign-in appears on the website once GOOGLE_CLIENT_ID is set in .env (see GOOGLE-LOGIN-SETUP.txt).' })); return; }
      holder.appendChild(table(['Name', 'Email', 'Joined', 'Last sign-in', 'Orders', 'Welcome email', ''], a.map(function (u) {
        return td(h('div', { style: 'display:flex;align-items:center;gap:8px' }, u.picture ? h('img', { src: u.picture, alt: '', width: 26, height: 26, referrerpolicy: 'no-referrer', style: 'border-radius:50%' }) : null, u.name), u.email, when(u.created_at), when(u.last_login), String(u.orders),
          h('span', { class: 'st ' + (u.welcome_ok ? 'paid' : 'refund_requested'), text: u.welcome_ok ? 'Sent' : u.welcomed_at ? 'Not delivered' : 'Not sent' }),
          h('div', { class: 'row' }, h('button', { class: 'btn g s', text: 'Send welcome again', onclick: function () { json('/api/admin/users', { action: 'welcome', id: u.id }).then(function (r) { msg.textContent = r.sent ? 'Welcome email sent.' : 'The email could not be delivered. See the Emails tab for the reason.'; msg.className = 'msg ' + (r.sent ? 'ok' : 'bad'); view2(); }); } }),
            h('button', { class: 'btn d s', text: 'Delete', onclick: function () { if (confirm('Delete ' + u.email + '? Their orders stay in Orders.')) json('/api/admin/users', { action: 'delete', id: u.id }).then(view2); } })));
      })));
    });
  }

  function messages(m) {
    m.appendChild(h('h1', { text: 'Messages' })); m.appendChild(h('p', { class: 'sub', text: 'Contact form messages and live session sign-ups.' }));
    var holder = h('div', {}, h('p', { text: 'Loading…' })); m.appendChild(holder);
    json('/api/admin/inbox').then(function (a) { holder.textContent = ''; holder.appendChild(table(['Date', 'Type', 'Name', 'Email', 'Message'], a.map(function (x) { return td(when(x.created_at), x.kind === 'live' ? 'Live session' : 'Contact', x.name, h('a', { href: 'mailto:' + x.email, text: x.email }), x.message); }))); });
  }

  var sEdit = null;
  function liveSessions(m) {
    var view2 = function () { var mm = document.getElementById('view'); mm.textContent = ''; liveSessions(mm); };
    var tzName = (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone || 'UTC', pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var x = sEdit || null, d0 = x ? new Date(x.start) : null;
    m.appendChild(h('h1', { text: 'Live sessions' }));
    m.appendChild(h('p', { class: 'sub', text: 'Set the date and time of your next live session. Visitors see it on the home page in their own time zone.' }));
    var title = h('input', { maxlength: 100, placeholder: 'Live session', value: x ? x.title : '' });
    var date = h('input', { type: 'date', value: d0 ? d0.getFullYear() + '-' + pad(d0.getMonth() + 1) + '-' + pad(d0.getDate()) : '' });
    var time = h('input', { type: 'time', value: d0 ? pad(d0.getHours()) + ':' + pad(d0.getMinutes()) : '19:00' });
    var dur = h('input', { type: 'number', min: 15, max: 480, value: x ? x.durationMin : 60 });
    var cap = h('input', { type: 'number', min: 0, placeholder: 'No limit', value: x && x.capacity ? x.capacity : '' });
    var desc = h('textarea', { rows: 3, maxlength: 500, placeholder: 'What will be covered (optional)' }); desc.value = x ? x.description || '' : '';
    var join = h('input', { placeholder: 'https://… (private: only emailed to people who registered)', value: x ? x.joinUrl || '' : '' });
    var open = h('input', { type: 'checkbox' }); open.checked = x ? x.open !== false : true; var msg = h('p', { class: 'msg', role: 'alert' });
    m.appendChild(h('h2', { text: x ? 'Edit session' : 'Schedule a session' }));
    m.appendChild(h('div', { class: 'form' },
      h('div', { class: 'grid2' }, h('div', {}, h('label', { text: 'Title' }), title), h('div', {}, h('label', { text: 'Date' }), date), h('div', {}, h('label', { text: 'Start time' }), time), h('div', {}, h('label', { text: 'Length (minutes)' }), dur), h('div', {}, h('label', { text: 'Spots (optional)' }), cap)),
      h('p', { class: 'note', text: 'Times use this computer\'s time zone (' + tzName + '). The website shows each visitor their own local time.' }),
      h('label', { text: 'Description' }), desc, h('label', { text: 'Join link' }), join,
      h('label', { class: 'chk', style: 'margin-top:12px' }, open, 'Registration is open'),
      h('div', { class: 'row', style: 'margin-top:14px' }, h('button', { class: 'btn', text: x ? 'Save changes' : 'Schedule session', onclick: function () {
        if (!date.value || !time.value) { msg.textContent = 'Choose a date and a start time.'; return; }
        json('/api/admin/sessions', { id: x ? x.id : null, title: title.value, start: new Date(date.value + 'T' + time.value).toISOString(), tz: tzName, durationMin: dur.value, capacity: cap.value, description: desc.value, joinUrl: join.value, open: open.checked })
          .then(function () { sEdit = null; view2(); }).catch(function (e) { msg.textContent = e.message; }); } }),
        x ? h('button', { class: 'btn g', text: 'Cancel editing', onclick: function () { sEdit = null; view2(); } }) : null), msg));
    var regsBox = h('div'), holder = h('div'); m.appendChild(h('h2', { text: 'Your sessions' })); m.appendChild(holder); m.appendChild(regsBox);
    function showRegs(s) {
      regsBox.textContent = ''; regsBox.appendChild(h('h2', { text: 'Registered for: ' + s.title + ' (' + s.registrants.length + ')' }));
      if (s.registrants.length) regsBox.appendChild(h('p', {}, h('button', { class: 'btn g s', text: 'Copy all emails', onclick: function (e) { var t = s.registrants.map(function (r) { return r.email; }).join(', '); if (navigator.clipboard) navigator.clipboard.writeText(t); e.target.textContent = 'Copied'; } })));
      regsBox.appendChild(table(['Registered', 'Name', 'Email', 'Why they want to join'], s.registrants.map(function (r) { return td(when(r.created_at), r.name, r.email, r.message); })));
    }
    json('/api/admin/sessions').then(function (d) {
      if (d.interest) holder.appendChild(h('p', { class: 'note', text: d.interest + ' people left their details when no session was scheduled. See them in Messages.' }));
      holder.appendChild(table(['When', 'Session', 'Status', 'Registered', ''], d.items.map(function (s) {
        var label = { upcoming: 'Upcoming', live: 'Live now', ended: 'Ended', cancelled: 'Cancelled' }[s.state], cls = s.state === 'upcoming' || s.state === 'live' ? 'paid' : 'expired';
        return td(s.when, h('div', {}, h('strong', { text: s.title }), s.description ? h('div', { class: 'note', text: s.description }) : null), h('span', { class: 'st ' + cls, text: label }),
          s.registrants.length + (s.capacity ? ' of ' + s.capacity : ''),
          h('div', { class: 'row' }, h('button', { class: 'btn g s', text: 'Registrants', onclick: function () { showRegs(s); } }), h('button', { class: 'btn g s', text: 'Edit', onclick: function () { sEdit = s; view2(); window.scrollTo(0, 0); } }),
            s.state === 'upcoming' || s.state === 'live' ? h('button', { class: 'btn s', text: 'Email reminder', onclick: function () { if (!s.registrants.length) { alert('Nobody has registered yet.'); return; } if (confirm('Email the reminder' + (s.joinUrl ? ' with the join link' : ' (no join link set yet)') + ' to ' + s.registrants.length + ' people?')) json('/api/admin/sessions', { action: 'remind', id: s.id }).then(function (r) { alert('Sent to ' + r.sent + ' people.'); }); } }) : null,
            s.state !== 'ended' ? h('button', { class: 'btn g s', text: s.cancelled ? 'Restore' : 'Cancel', onclick: function () { var n = !s.cancelled && s.registrants.length && confirm('Also email the ' + s.registrants.length + ' registered people that it is cancelled?'); json('/api/admin/sessions', { action: 'cancel', id: s.id, notify: !!n }).then(view2); } }) : null,
            h('button', { class: 'btn d s', text: 'Delete', onclick: function () { if (confirm('Delete this session?')) json('/api/admin/sessions', { action: 'delete', id: s.id }).then(view2); } })));
      })));
    });
  }

  function codes(m) {
    m.appendChild(h('h1', { text: 'Discount codes' })); m.appendChild(h('p', { class: 'sub', text: 'Customers enter a code in the cart. A percent is taken off every item.' }));
    var msg = h('p', { class: 'msg', role: 'status' }), c = h('input', { placeholder: 'LAUNCH10', maxlength: 30 }), p = h('input', { type: 'number', min: 1, max: 90, placeholder: '10' }), u = h('input', { type: 'number', min: 1, placeholder: 'No limit' }), e = h('input', { type: 'date' });
    m.appendChild(h('div', { class: 'form' }, h('div', { class: 'grid2' }, h('div', {}, h('label', { text: 'Code' }), c), h('div', {}, h('label', { text: 'Percent off (1–90)' }), p), h('div', {}, h('label', { text: 'Max uses' }), u), h('div', {}, h('label', { text: 'Expires (optional)' }), e)),
      h('p', {}, h('button', { class: 'btn', text: 'Create code', onclick: function () { json('/api/admin/codes', { code: c.value, percent: p.value, maxUses: u.value, expires: e.value }).then(function () { tab = 'codes'; view2(); }).catch(function (x) { msg.textContent = x.message; msg.className = 'msg bad'; }); } })), msg));
    var holder = h('div', { style: 'margin-top:18px' }); m.appendChild(holder);
    function view2() { var mm = document.getElementById('view'); mm.textContent = ''; codes(mm); }
    json('/api/admin/codes').then(function (a) { holder.appendChild(table(['Code', 'Percent', 'Used', 'Limit', 'Expires', 'Status', ''], a.map(function (x) {
      return td(x.code, x.percent + '%', String(x.used || 0), x.max_uses ? String(x.max_uses) : '—', x.expires_at ? when(x.expires_at) : '—', h('span', { class: 'st ' + (x.active ? 'paid' : 'expired'), text: x.active ? 'Active' : 'Off' }),
        h('div', { class: 'row' }, h('button', { class: 'btn g s', text: x.active ? 'Turn off' : 'Turn on', onclick: function () { json('/api/admin/codes', { action: 'toggle', code: x.code }).then(view2); } }),
          h('button', { class: 'btn d s', text: 'Delete', onclick: function () { if (confirm('Delete code ' + x.code + '?')) json('/api/admin/codes', { action: 'delete', code: x.code }).then(view2); } })));
    }))); });
  }

  function blog(m) {
    var view2 = function () { var mm = document.getElementById('view'); mm.textContent = ''; blog(mm); };
    if (editing !== null) {
      var p = editing || { title: '', category: 'Strategy', excerpt: '', body: '', published: true };
      var t = h('input', { value: p.title, maxlength: 140 }), cat = h('select', {}, ['Strategy', 'Technical', 'Psychology', 'Risk', 'Crypto', 'Forex'].map(function (x) { return h('option', { value: x, selected: x === p.category ? 'selected' : null, text: x }); }));
      var ex = h('input', { value: p.excerpt, maxlength: 220, placeholder: 'Short summary (optional)' }), body = h('textarea', { rows: 16 }); body.value = p.body;
      var pub = h('input', { type: 'checkbox' }); pub.checked = p.published !== false; var msg = h('p', { class: 'msg', role: 'alert' });
      m.appendChild(h('h1', { text: p.id ? 'Edit article' : 'New article' }));
      m.appendChild(h('div', { class: 'form' }, h('label', { text: 'Title' }), t, h('label', { text: 'Category' }), cat, h('label', { text: 'Summary' }), ex, h('label', { text: 'Text' }), body,
        h('p', { class: 'note', text: 'Leave a blank line between paragraphs. Start a line with ## to make a heading. Do not include performance claims or advice.' }),
        h('label', { class: 'chk' }, pub, 'Published (visible on the website)'),
        h('div', { class: 'row', style: 'margin-top:14px' }, h('button', { class: 'btn', text: 'Save article', onclick: function () {
          json('/api/admin/posts', { id: p.id, title: t.value, category: cat.value, excerpt: ex.value, body: body.value, published: pub.checked }).then(function () { editing = null; view2(); }).catch(function (x) { msg.textContent = x.message; }); } }),
          h('button', { class: 'btn g', text: 'Cancel', onclick: function () { editing = null; view2(); } })), msg));
      return;
    }
    m.appendChild(h('div', { class: 'row', style: 'justify-content:space-between' }, h('div', {}, h('h1', { text: 'Blog' }), h('p', { class: 'sub', text: 'Articles shown on the website blog.' })), h('button', { class: 'btn', text: 'New article', onclick: function () { editing = false; view2(); } })));
    var holder = h('div'); m.appendChild(holder);
    json('/api/admin/posts').then(function (a) { holder.appendChild(table(['Title', 'Category', 'Date', 'Status', ''], a.map(function (x) {
      return td(h('a', { href: '/blog/' + x.slug, target: '_blank', text: x.title }), x.category, when(x.date), h('span', { class: 'st ' + (x.published ? 'paid' : 'expired'), text: x.published ? 'Published' : 'Draft' }),
        h('div', { class: 'row' }, h('button', { class: 'btn g s', text: 'Edit', onclick: function () { editing = x; view2(); } }), h('button', { class: 'btn d s', text: 'Delete', onclick: function () { if (confirm('Delete this article?')) json('/api/admin/posts', { action: 'delete', id: x.id }).then(view2); } })));
    }))); });
  }

  var sinfo = { ttsAvailable: false, maxVideoMb: 1000 };
  var mb = function (n) { return (n / 1048576).toFixed(1) + ' MB'; };
  function upload(kind, file, onp) {
    return new Promise(function (res, rej) {
      var x = new XMLHttpRequest(); x.open('PUT', '/api/admin/upload?kind=' + kind + '&name=' + encodeURIComponent(file.name)); x.setRequestHeader('Authorization', 'Bearer ' + tok);
      x.upload.onprogress = function (e) { if (e.lengthComputable) onp(Math.round(e.loaded * 100 / e.total)); };
      x.onload = function () { var d = {}; try { d = JSON.parse(x.responseText); } catch (e) {} x.status === 200 ? res(d) : rej(new Error(d.error || 'Upload failed.')); };
      x.onerror = function () { rej(new Error('Upload failed. Is the server still running?')); }; x.send(file);
    });
  }
  function strategies(m) {
    var view2 = function () { var mm = document.getElementById('view'); mm.textContent = ''; strategies(mm); };
    if (editing !== null) return strategyEditor(m, editing, view2);
    m.appendChild(h('div', { class: 'row', style: 'justify-content:space-between' }, h('div', {}, h('h1', { text: 'Strategies' }), h('p', { class: 'sub', text: 'Publish video lessons with English captions, PDFs and audio. They appear in the Strategies section of the website.' })),
      h('button', { class: 'btn', text: 'New strategy', onclick: function () { editing = false; view2(); } })));
    var holder = h('div'); m.appendChild(holder);
    json('/api/admin/strategies').then(function (d) { sinfo = d; holder.appendChild(table(['Title', 'Category', 'Files', 'Status', ''], d.items.map(function (x) {
      var f = x.files, chips = ['video', 'captions', 'audio', 'pdf'].filter(function (k) { return f[k]; }).map(function (k) { return k === 'captions' ? 'English captions' : k.toUpperCase() === 'PDF' ? 'PDF' : k[0].toUpperCase() + k.slice(1); }).join(', ');
      return td(x.published ? h('a', { href: '/strategies/' + x.slug, target: '_blank', text: x.title }) : x.title, x.category, chips || 'Text only', h('span', { class: 'st ' + (x.published ? 'paid' : 'expired'), text: x.published ? 'Published' : 'Draft' }),
        h('div', { class: 'row' }, h('button', { class: 'btn g s', text: 'Edit', onclick: function () { editing = x; view2(); } }), h('button', { class: 'btn d s', text: 'Delete', onclick: function () { if (confirm('Delete this strategy and its files?')) json('/api/admin/strategies', { action: 'delete', id: x.id }).then(view2); } })));
    }))); });
  }
  function strategyEditor(m, s0, back) {
    var s = s0 ? JSON.parse(JSON.stringify(s0)) : { title: '', category: 'Strategy', summary: '', body: '', published: true, aiAudio: false, files: { pdf: null, video: null, audio: null, captions: null, image: null } };
    var t = h('input', { value: s.title, maxlength: 140 }), cat = h('select', {}, ['Strategy', 'Technical', 'Psychology', 'Risk', 'Crypto', 'Forex'].map(function (x) { return h('option', { value: x, selected: x === s.category ? 'selected' : null, text: x }); }));
    var sum = h('input', { value: s.summary, maxlength: 240, placeholder: 'Short summary (optional)' }), body = h('textarea', { rows: 12 }); body.value = s.body;
    var pub = h('input', { type: 'checkbox' }); pub.checked = s.published !== false; var ai = h('input', { type: 'checkbox' }); ai.checked = !!s.aiAudio; var msg = h('p', { class: 'msg', role: 'alert' });
    var audioNote = h('p', { class: 'note' });
    function fileRow(kind, label, accept, help, extra) {
      var info = h('span', { class: 'note' }), bar = h('div', { class: 'note' }), fi = h('input', { type: 'file', accept: accept });
      var rm = h('button', { class: 'btn d s', type: 'button', text: 'Remove', onclick: function () { s.files[kind] = null; show(); } });
      function show() { var f = s.files[kind]; info.textContent = f ? f.name + ' (' + mb(f.size) + ')' : 'No file yet'; rm.style.display = f ? '' : 'none'; }
      fi.addEventListener('change', function () { var f = fi.files[0]; if (!f) return; bar.style.color = ''; upload(kind, f, function (p) { bar.textContent = 'Uploading… ' + p + '%'; }).then(function (r) { s.files[kind] = r; bar.textContent = 'Uploaded.'; if (kind === 'audio') ai.checked = ai.checked; show(); }).catch(function (e) { bar.textContent = e.message; bar.style.color = 'var(--bad)'; }); });
      show(); var row = h('div', { class: 'filerow' }, h('label', { style: 'margin-top:0', text: label }), fi, h('div', { class: 'row', style: 'margin-top:6px' }, info, rm), bar, h('p', { class: 'note', text: help }), extra || null);
      row.refresh = show; return row;
    }
    var gen = h('button', { class: 'btn g s', type: 'button', text: 'Generate AI audio from the text above', onclick: function () {
      audioNote.textContent = 'Generating voice… this can take a minute.'; audioNote.style.color = '';
      json('/api/admin/strategies', { action: 'tts', text: body.value }).then(function (r) { s.files.audio = r; ai.checked = true; audioRow.refresh(); audioNote.textContent = 'AI audio created.'; }).catch(function (e) { audioNote.textContent = e.message; audioNote.style.color = 'var(--bad)'; }); } });
    var audioExtra = h('div', { style: 'margin-top:8px' }, h('label', { class: 'chk', style: 'margin:0 0 8px' }, ai, 'This audio is an AI voice (the website will say so)'), sinfo.ttsAvailable ? gen : h('p', { class: 'note', text: 'To generate a voice here, add OPENAI_API_KEY to the .env file and restart. Or upload an audio file made with any AI voice tool.' }), audioNote);
    var audioRow = fileRow('audio', 'AI audio narration (MP3, M4A, WAV or OGG)', '.mp3,.m4a,.wav,.ogg,audio/*', 'Optional. If you skip it, visitors can still press Listen to hear the text read by their browser.', audioExtra);
    m.appendChild(h('h1', { text: s.id ? 'Edit strategy' : 'New strategy' }));
    m.appendChild(h('div', { class: 'form' }, h('label', { text: 'Title' }), t, h('label', { text: 'Category' }), cat, h('label', { text: 'Summary' }), sum,
      h('label', { text: 'Text / transcript' }), body, h('p', { class: 'note', text: 'Shown under the video as the transcript. Blank line between paragraphs; start a line with ## for a heading. Educational wording only, no profit promises or advice.' }),
      h('h2', { text: 'Files' }),
      fileRow('video', 'Video (MP4 or WebM, up to ' + sinfo.maxVideoMb + ' MB)', '.mp4,.m4v,.webm,video/mp4,video/webm', 'Large files can take a while to upload. Keep this tab open until it says Uploaded.'),
      fileRow('captions', 'English captions (VTT or SRT)', '.vtt,.srt', 'Shown on the video with an English label. SRT files are converted automatically.'),
      audioRow,
      fileRow('pdf', 'PDF document', '.pdf,application/pdf', 'Visitors can open or download it.'),
      fileRow('image', 'Cover image (optional, JPG, PNG or WebP)', '.jpg,.jpeg,.png,.webp', 'If you skip it, a default image is used.'),
      h('label', { class: 'chk', style: 'margin-top:16px' }, pub, 'Published (visible on the website)'),
      h('div', { class: 'row', style: 'margin-top:14px' }, h('button', { class: 'btn', text: 'Save strategy', onclick: function () {
        var f = {}; ['pdf', 'video', 'audio', 'captions', 'image'].forEach(function (k) { f[k] = s.files[k] ? s.files[k].id : ''; });
        json('/api/admin/strategies', { id: s.id, title: t.value, category: cat.value, summary: sum.value, body: body.value, published: pub.checked, aiAudio: ai.checked && !!f.audio, files: f }).then(function () { editing = null; back(); }).catch(function (x) { msg.textContent = x.message; }); } }),
        h('button', { class: 'btn g', text: 'Cancel', onclick: function () { editing = null; back(); } })), msg));
  }

  function assistant(m) {
    var view2 = function () { var mm = document.getElementById('view'); mm.textContent = ''; assistant(mm); };
    m.appendChild(h('h1', { text: 'Assistant' })); m.appendChild(h('p', { class: 'sub', text: 'The chat helper on your website. It answers only questions about the site, knows what each visitor bought, and learns new blogs and strategies by itself.' }));
    var holder = h('div'); m.appendChild(holder);
    json('/api/admin/assistant').then(function (d) {
      var status = d.off ? 'Off (ASSISTANT=off in .env).' : d.provider ? 'AI answers are on (' + d.provider + ', model ' + d.model + '). Today: ' + d.daily.used + ' of ' + d.daily.max + ' AI answers used.' : 'Search mode: it answers from your site content without AI. Add ANTHROPIC_API_KEY to .env and restart for full AI answers.';
      status += ' Built-in knowledge: ' + d.builtin.answers + ' answers and ' + d.builtin.terms + ' trading terms (file knowledge.json).';
      holder.appendChild(h('div', { class: 'card', style: 'margin-bottom:18px' }, h('div', { class: 'k', text: 'Status' }), h('div', { style: 'margin-top:4px', text: status })));
      var t = h('input', { maxlength: 120, placeholder: 'e.g. How to apply the risk worksheet' }), txt = h('textarea', { rows: 5, maxlength: 4000, placeholder: 'What the assistant should know. Plain facts, no profit promises.' });
      var prod = h('select', {}, [h('option', { value: '', text: 'Whole website (any page)' })].concat(d.products.map(function (p) { return h('option', { value: p.id, text: p.name }); })));
      var bo = h('input', { type: 'checkbox' }), msg = h('p', { class: 'msg', role: 'alert' }), editId = null, title = h('h2', { text: 'Add a note' });
      holder.appendChild(title);
      holder.appendChild(h('div', { class: 'form' }, h('label', { text: 'Title' }), t, h('label', { text: 'Note' }), txt, h('label', { text: 'About' }), prod,
        h('label', { class: 'chk', style: 'margin-top:10px' }, bo, 'Only tell buyers of this guide (needs a guide selected)'),
        h('div', { class: 'row', style: 'margin-top:12px' }, h('button', { class: 'btn', text: 'Save note', onclick: function () {
          json('/api/admin/assistant', { id: editId, title: t.value, text: txt.value, productId: prod.value, buyersOnly: bo.checked }).then(view2).catch(function (e) { msg.textContent = e.message; }); } })), msg));
      holder.appendChild(h('h2', { text: 'Notes the assistant knows' }));
      holder.appendChild(table(['Title', 'About', 'Who sees it', ''], d.kb.map(function (k) {
        var pn = (d.products.filter(function (p) { return p.id === k.productId; })[0] || {}).name;
        return td(h('div', {}, h('strong', { text: k.title }), h('div', { class: 'note', text: k.text.slice(0, 120) })), pn || 'Whole website', k.buyersOnly ? 'Buyers only' : 'Everyone',
          h('div', { class: 'row' }, h('button', { class: 'btn g s', text: 'Edit', onclick: function () { editId = k.id; t.value = k.title; txt.value = k.text; prod.value = k.productId || ''; bo.checked = !!k.buyersOnly; title.textContent = 'Edit note'; window.scrollTo(0, 0); } }),
            h('button', { class: 'btn d s', text: 'Delete', onclick: function () { if (confirm('Delete this note?')) json('/api/admin/assistant', { action: 'delete', id: k.id }).then(view2); } })));
      })));
      // ---- documents: teach the assistant from files and pasted text ----
      var dT = h('input', { maxlength: 120, placeholder: 'Name for this material (optional)' }), dF = h('input', { type: 'file', accept: '.pdf,.txt,.md,.csv,.json' });
      var dP = h('select', {}, [h('option', { value: '', text: 'Whole website (any question)' })].concat(d.products.map(function (p) { return h('option', { value: p.id, text: 'About: ' + p.name }); })));
      var dB = h('input', { type: 'checkbox' }), dX = h('textarea', { rows: 6, placeholder: 'Or paste text here. For question and answer lists, start lines with Q: and A:' }), dM = h('p', { class: 'msg', role: 'alert' });
      function done(r) { dM.textContent = 'Added "' + r.doc.title + '" (' + r.doc.chunks + ' sections). The assistant can use it now.'; dM.className = 'msg ok'; setTimeout(view2, 1200); }
      function fail(e) { dM.textContent = e.message; dM.className = 'msg bad'; }
      holder.appendChild(h('h2', { text: 'Teach it from your documents' }));
      holder.appendChild(h('p', { class: 'note', text: 'Add PDFs, text, Markdown, CSV or JSON files, or paste text. The assistant reads them and uses them to answer. Choose a guide and tick "buyers only" to keep paid content for people who bought it. CSV: columns question,answer. Text: lines starting Q: and A:.' }));
      holder.appendChild(h('div', { class: 'form' }, h('label', { text: 'Name' }), dT, h('label', { text: 'File (PDF, TXT, MD, CSV or JSON, up to 30 MB)' }), dF, h('label', { text: 'Or paste text' }), dX, h('label', { text: 'About' }), dP,
        h('label', { class: 'chk', style: 'margin-top:10px' }, dB, 'Only tell buyers of the chosen guide'),
        h('div', { class: 'row', style: 'margin-top:12px' },
          h('button', { class: 'btn', text: 'Add file', onclick: function () {
            var f = dF.files[0]; if (!f) { fail(new Error('Choose a file first.')); return; } dM.className = 'msg'; dM.textContent = 'Uploading and reading…';
            var x = new XMLHttpRequest(); x.open('PUT', '/api/admin/assistant/upload?name=' + encodeURIComponent(f.name) + '&title=' + encodeURIComponent(dT.value) + '&productId=' + encodeURIComponent(dP.value) + '&buyersOnly=' + (dB.checked ? '1' : '0')); x.setRequestHeader('Authorization', 'Bearer ' + tok);
            x.onload = function () { var r = {}; try { r = JSON.parse(x.responseText); } catch (e) {} x.status === 200 ? done(r) : fail(new Error(r.error || 'Upload failed.')); }; x.onerror = function () { fail(new Error('Upload failed. Is the server still running?')); }; x.send(f); } }),
          h('button', { class: 'btn g', text: 'Add pasted text', onclick: function () { dM.className = 'msg'; dM.textContent = 'Reading…'; json('/api/admin/assistant', { action: 'adddoc', title: dT.value, text: dX.value, productId: dP.value, buyersOnly: dB.checked }).then(done).catch(fail); } })), dM));
      holder.appendChild(h('h2', { text: 'Documents the assistant has read' }));
      holder.appendChild(table(['Name', 'From', 'Who sees it', 'Size', ''], (d.docs || []).map(function (x) {
        var pn = (d.products.filter(function (p) { return p.id === x.productId; })[0] || {}).name;
        return td(x.title, x.name || 'Pasted text', x.buyersOnly ? 'Buyers of ' + pn : pn ? 'Everyone (about ' + pn + ')' : 'Everyone', x.chunks + ' sections · ' + Math.round(x.chars / 1000) + ' KB of text',
          h('button', { class: 'btn d s', text: 'Delete', onclick: function () { if (confirm('Delete "' + x.title + '"? The assistant will forget it.')) json('/api/admin/assistant', { action: 'deldoc', id: x.id }).then(view2); } }));
      })));
      holder.appendChild(h('div', { class: 'row', style: 'justify-content:space-between;margin-top:26px' }, h('h2', { style: 'margin:0', text: 'What visitors asked' }), d.log.length ? h('button', { class: 'btn g s', text: 'Clear list', onclick: function () { json('/api/admin/assistant', { action: 'clearlog' }).then(view2); } }) : null));
      holder.appendChild(h('p', { class: 'note', text: 'Questions marked "Not answered" were outside the site or not found. Add a note above if they are real questions.' }));
      holder.appendChild(table(['When', 'Question', 'Result', 'Buyer'], d.log.map(function (x) { return td(when(x.at), x.q, h('span', { class: 'st ' + (x.mode === 'refused' ? 'refund_requested' : 'paid'), text: x.mode === 'refused' ? 'Not answered' : x.mode === 'advice' ? 'Advice declined' : x.mode === 'ai' ? 'AI answer' : x.mode === 'search' ? 'Search answer' : 'Chat' }), x.owned ? 'Yes' : ''); })));
    });
  }

  function stripeTab(m) {
    m.appendChild(h('h1', { text: 'Stripe' }));
    m.appendChild(h('p', { class: 'sub', text: 'Check that your website is connected to your Stripe account, and see the payment history straight from Stripe.' }));
    var top = h('div', { class: 'card', style: 'margin-bottom:18px' }, h('p', { text: 'Checking the connection…' })), hist = h('div');
    m.appendChild(top); m.appendChild(h('h2', { text: 'Payment history (from Stripe)' })); m.appendChild(hist);
    function row(ok, text, fix) { return h('div', { style: 'padding:8px 0;border-bottom:1px solid var(--line)' }, h('span', { class: 'st ' + (ok === true ? 'paid' : ok === false ? 'refund_requested' : 'expired'), text: ok === true ? '✓ ' : ok === false ? '! ' : '• ' }), text, fix ? h('div', { class: 'note', text: fix }) : null); }
    function check() {
      top.textContent = ''; top.appendChild(h('p', { text: 'Checking the connection…' }));
      json('/api/admin/stripe').then(function (d) {
        top.textContent = '';
        top.appendChild(h('div', { class: 'row', style: 'justify-content:space-between' }, h('strong', { text: 'Connection' }), h('button', { class: 'btn g s', text: 'Check again', onclick: check })));
        if (d.error) top.appendChild(row(false, 'Not connected: ' + d.error, 'Open the .env file, put the secret key from Stripe (Developers → API keys) after STRIPE_SECRET_KEY=, then restart the server.'));
        else if (d.account) top.appendChild(row(true, 'Connected to Stripe' + (d.account.name ? ' account "' + d.account.name + '"' : '') + ' (' + d.account.id + (d.account.country ? ', ' + d.account.country : '') + ')'));
        else top.appendChild(row(true, 'Connected to Stripe.'));
        top.appendChild(row(d.mode === 'live' ? true : null, d.mode === 'live' ? 'LIVE mode: real cards, real money.' : d.mode === 'mock' ? 'Test server (fake Stripe).' : 'Test mode: no real money moves. Use the test card 4242 4242 4242 4242.', d.mode === 'live' ? '' : 'To accept real payments, switch the key in .env to the live secret key (starts with sk_live_). See STRIPE-SETUP.txt.'));
        if (d.account) {
          top.appendChild(row(d.account.charges_enabled, d.account.charges_enabled ? 'Your Stripe account can accept payments.' : 'Your Stripe account cannot accept real payments yet.', d.account.charges_enabled ? '' : 'Finish the account setup in the Stripe Dashboard: business details, identity and bank account.'));
          top.appendChild(row(d.account.payouts_enabled, d.account.payouts_enabled ? 'Payouts to your bank are enabled.' : 'Payouts to your bank are not enabled yet.', d.account.payouts_enabled ? '' : 'Add your bank account in the Stripe Dashboard so Stripe can pay you.'));
        }
        top.appendChild(row(d.webhook.enabled ? true : null, d.webhook.enabled ? 'Webhook is on.' : 'Webhook is not set up (the site still works).', d.webhook.enabled ? '' : 'Recommended for live: it confirms an order even if the buyer closes the tab. Add this URL in Stripe → Developers → Webhooks: ' + d.webhook.url));
        top.appendChild(row(null, 'Site address used for payment links: ' + d.baseUrl, 'Refund window: ' + d.refundDays + ' days.'));
        (d.warnings || []).forEach(function (w) { top.appendChild(row(false, w)); });
      }).catch(function (e) { top.textContent = e.message; });
    }
    function history() {
      hist.textContent = ''; hist.appendChild(h('p', { text: 'Loading…' }));
      json('/api/admin/stripe/payments').then(function (d) {
        hist.textContent = '';
        hist.appendChild(h('p', { class: 'note', text: 'The latest 40 payments in your Stripe account (' + (d.mode === 'live' ? 'live' : 'test') + ' mode). "Not on this site" means Stripe has the payment but the website has no matching order.' }));
        hist.appendChild(table(['Date', 'Email', 'Amount', 'Status', 'Website order', ''], d.items.map(function (p) {
          var st = !p.paid ? 'Failed' : p.refunded >= p.amount ? 'Refunded' : p.refunded ? 'Part refunded' : 'Paid';
          return td(when(p.created), p.email, '$' + (p.amount / 100).toFixed(2) + ' ' + p.currency.toUpperCase(), h('span', { class: 'st ' + (st === 'Paid' ? 'paid' : st === 'Failed' ? 'refund_requested' : 'expired'), text: st }),
            p.orderId ? '#' + p.orderId : h('span', { class: 'st refund_requested', text: p.paid ? 'Not on this site' : '' }),
            h('a', { href: 'https://dashboard.stripe.com/' + (d.mode === 'live' ? '' : 'test/') + 'payments/' + (p.paymentIntent || p.id), target: '_blank', rel: 'noopener', text: 'Open in Stripe ↗' }));
        })));
        hist.appendChild(h('p', {}, h('button', { class: 'btn g s', text: 'Refresh', onclick: history })));
      }).catch(function (e) { hist.textContent = ''; hist.appendChild(h('p', { class: 'msg bad', text: e.message })); });
    }
    check(); history();
  }

  function emails(m) {
    m.appendChild(h('h1', { text: 'Emails' })); m.appendChild(h('p', { class: 'sub', text: 'Every email the store tries to send: receipts, refunds, sign-up confirmations and order links. To send them for real, add RESEND_API_KEY to the .env file.' }));
    var holder = h('div', {}, h('p', { text: 'Loading…' })); m.appendChild(holder);
    json('/api/admin/outbox').then(function (a) { holder.textContent = ''; holder.appendChild(table(['Date', 'To', 'Subject', 'Result'], a.map(function (x) { return td(when(x.created_at), x.to, x.subject, h('span', { class: 'st ' + (x.sent ? 'paid' : 'refund_requested'), text: x.sent ? 'Sent' : (x.error || 'Not sent') })); }))); });
  }
  if (tok) start(); else login();
})();
