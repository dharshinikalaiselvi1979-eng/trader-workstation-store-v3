// End-to-end test against a fake Stripe. Run: npm test
const http = require('http'), fs = require('fs'), os = require('os'), path = require('path');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tws-'));
let n = 0; const sessions = {}, refunds = [];
const mock = http.createServer((req, res) => {
  let b = ''; req.on('data', c => b += c); req.on('end', () => {
    const send = o => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
    const u = req.url.split('?')[0];
    if (req.method === 'POST' && u === '/v1/checkout/sessions') { const id = 'cs_test_' + (++n); sessions[id] = { id, object: 'checkout.session', url: 'https://checkout.stripe.test/' + id, payment_status: 'unpaid', status: 'open' }; return send(sessions[id]); }
    if (req.method === 'GET' && u.startsWith('/v1/checkout/sessions/')) return send(sessions[u.split('/').pop()] || {});
    if (req.method === 'POST' && u === '/v1/refunds') { refunds.push(b); return send({ id: 're_1', object: 'refund' }); }
    if (u.startsWith('/__pay/')) { const s = sessions[u.split('/').pop()]; s.payment_status = 'paid'; s.status = 'complete'; s.payment_intent = 'pi_' + s.id; s.customer_details = { email: 'buyer@example.com' }; return send(s); }
    res.statusCode = 404; send({ error: { message: 'no' } });
  });
});
const mockTts = http.createServer((req, res) => { let b = ''; req.on('data', c => b += c); req.on('end', () => { mockTts.hits++; res.setHeader('Content-Type', 'audio/mpeg'); res.end(Buffer.concat([Buffer.from('ID3'), Buffer.alloc(64, 7)])); }); });
mockTts.hits = 0; mockTts.listen(0);
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
mock.listen(0, async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_x'; process.env.STRIPE_MOCK_PORT = mock.address().port;
  process.env.DATA_DIR = path.join(tmp, 'data'); process.env.DL_DIR = path.join(tmp, 'dl'); process.env.ADMIN_TOKEN = 'secret'; process.env.OPENAI_API_KEY = 'test-key'; process.env.TTS_URL = 'http://localhost:' + mockTts.address().port + '/v1/audio/speech';
  const app = require('../server.js'); const srv = app.listen(0);
  const B = 'http://localhost:' + srv.address().port, mockB = 'http://localhost:' + mock.address().port;
  const J = (u, o = {}, tok) => fetch(B + u, { ...o, headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) } }).then(async r => ({ s: r.status, d: await r.json().catch(() => null), r }));
  const P = (u, body, tok) => J(u, { method: 'POST', body: JSON.stringify(body) }, tok);
  try {
    ok((await J('/api/products')).d.length === 8, '8 products listed');
    ok(!JSON.stringify((await J('/api/products')).d).match(/rating|reviews|originalPrice/), 'no invented ratings or reviews');
    ok((await P('/api/checkout', { items: [] })).s === 400, 'empty cart rejected');
    ok((await P('/api/checkout', { items: [{ id: 'nope', quantity: 1 }] })).s === 400, 'unknown product rejected');
    const demo = await P('/api/checkout', { demo: true, items: [{ id: 'order-flow-mastery', quantity: 0 }] });
    ok(demo.s === 400, 'demo/free checkout does not exist');
    const c = await P('/api/checkout', { items: [{ id: 'order-flow-mastery', quantity: 2 }, { id: 'risk-management-playbook', quantity: 1 }] });
    ok(c.s === 200 && c.d.url.includes('cs_test_1'), 'checkout returns Stripe url');
    const OID1 = JSON.parse(fs.readFileSync(path.join(tmp, 'data', 'store.json'), 'utf8')).orders[0].id;
    let o = (await J('/api/order?session_id=cs_test_1')).d;
    ok(o.status === 'pending' && o.licenses.length === 0 && !o.token, 'unpaid order has no keys or download');
    ok((await fetch(B + '/download/bad/order-flow-mastery')).status === 403, 'bad token gets 403');
    await fetch(mockB + '/__pay/cs_test_1');
    o = (await J('/api/order?session_id=cs_test_1')).d;
    ok(o.status === 'paid' && o.licenses.length === 3 && /^[0-9A-F]{4}(-[0-9A-F]{4}){3}$/.test(o.licenses[0].key), 'paid: 3 licence keys, correct format');
    ok(o.refundable === true, 'refundable inside window');
    const d1 = await fetch(B + '/download/' + o.token + '/order-flow-mastery');
    ok(d1.status === 200 && /not been uploaded/.test(await d1.text()), 'placeholder download works');
    fs.mkdirSync(path.join(tmp, 'dl'), { recursive: true }); fs.writeFileSync(path.join(tmp, 'dl', 'order-flow-mastery.pdf'), '%PDF-1.4 test');
    const d2 = await fetch(B + '/download/' + o.token + '/vwap-pro');
    ok(d2.status === 200 && (await d2.text()).startsWith('%PDF'), 'real PDF served (also via alias)');
    ok((await fetch(B + '/download/' + o.token + '/forex-fundamentals-macro')).status === 404, 'product not in order gets 404');
    ok((await P('/api/admin/refund', { id: OID1, action: 'approve' })).s === 401, 'admin refund needs token');
    ok((await P('/api/refund', { session_id: 'cs_test_1', reason: 'changed my mind' })).d.ok, 'refund requested');
    ok((await J('/api/order?session_id=cs_test_1')).d.status === 'refund_requested', 'status refund_requested');
    ok((await P('/api/admin/refund', { id: OID1, action: 'reject', note: 'no' }, 'secret')).d.ok && (await J('/api/order?session_id=cs_test_1')).d.status === 'paid', 'reject returns to paid');
    await P('/api/refund', { session_id: 'cs_test_1' });
    const ap = await P('/api/admin/refund', { id: OID1, action: 'approve' }, 'secret');
    ok(ap.d.ok && refunds.length === 1, 'approve refunds through Stripe');
    o = (await J('/api/order?session_id=cs_test_1')).d;
    ok(o.status === 'refunded' && o.licenses.length === 0 && !o.token, 'refunded: keys hidden');
    ok((await fetch(B + '/download/' + (JSON.parse(fs.readFileSync(path.join(tmp, 'data', 'store.json'), 'utf8')).orders[0].token) + '/order-flow-mastery')).status === 403, 'refunded download gets 403');
    const a = (await J('/api/admin/orders', {}, 'secret')).d;
    ok(a.totals.orders === 0 && a.totals.cents === 0, 'refunded order excluded from revenue');
    // closed-tab recovery
    await P('/api/checkout', { items: [{ id: 'swing-trading-masterclass', quantity: 1 }] });
    await fetch(mockB + '/__pay/cs_test_2');
    const a2 = (await J('/api/admin/orders', {}, 'secret')).d;
    ok(a2.totals.orders === 1 && a2.totals.cents === 5200, 'admin load recovers a paid order (tab closed)');
    // inbox
    const f = { kind: 'contact', name: 'A', email: 'a@b.co', message: 'hi', website: '' };
    ok((await P('/api/inbox', { ...f, email: 'bad' })).s === 400, 'bad email 400');
    ok((await P('/api/inbox', { ...f, website: 'spam' })).d.ok && (await J('/api/admin/inbox', {}, 'secret')).d.length === 0, 'honeypot silently dropped');
    let last; for (let i = 0; i < 6; i++) last = await P('/api/inbox', f);
    ok(last.s === 429, 'sixth message gets 429');
    ok((await J('/api/admin/inbox', {}, 'secret')).d.length === 4, 'valid messages saved (failed attempts also count toward the limit)');

    // ---- new features ----
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const store = () => JSON.parse(fs.readFileSync(path.join(tmp, 'data', 'store.json'), 'utf8'));
    ok(store().outbox.some(m => m.to === 'buyer@example.com' && /order/i.test(m.subject) && /Licence keys/.test(m.text)), 'receipt email created after payment');
    ok((await P('/api/admin/codes', { code: 'x', percent: 10 })).s === 401, 'codes need admin token');
    ok((await P('/api/admin/codes', { code: 'test10', percent: 10, maxUses: 1 }, 'secret')).d.ok, 'admin creates a discount code');
    ok((await P('/api/admin/codes', { code: 'TEST10', percent: 10 }, 'secret')).s === 400, 'duplicate code rejected');
    const dc = await P('/api/discount', { code: 'test10', items: [{ id: 'order-flow-mastery', quantity: 1 }] });
    ok(dc.d.total === 4410 && dc.d.subtotal === 4900, 'discount preview 10% off $49.00 = $44.10');
    ok((await P('/api/discount', { code: 'nope', items: [{ id: 'order-flow-mastery', quantity: 1 }] })).s === 400, 'unknown code rejected');
    const cd = await P('/api/checkout', { code: 'test10', items: [{ id: 'order-flow-mastery', quantity: 1 }] });
    ok(cd.s === 200 && store().orders.slice(-1)[0].amount === 4410 && store().orders.slice(-1)[0].code === 'TEST10', 'checkout charges the discounted amount');
    const cdSid = store().orders.slice(-1)[0].session_id;
    await fetch(mockB + '/__pay/' + cdSid); await J('/api/order?session_id=' + cdSid);
    ok(store().codes[0].used === 1, 'code use counted after payment');
    ok((await P('/api/discount', { code: 'test10', items: [{ id: 'order-flow-mastery', quantity: 1 }] })).s === 400, 'code with max uses is used up');
    // find my orders
    ok((await P('/api/lookup', { email: 'bad' })).s === 400, 'lookup bad email 400');
    const before = store().lookups.length;
    ok((await P('/api/lookup', { email: 'nobody@example.com' })).d.ok && store().lookups.length === before, 'lookup for unknown email gives the same answer, no link made');
    ok((await P('/api/lookup', { email: 'BUYER@example.com' })).d.ok && store().lookups.length === before + 1, 'lookup for known email creates a link');
    const tk = store().lookups.slice(-1)[0].token;
    const mo = await J('/api/my-orders?t=' + tk);
    ok(mo.s === 200 && mo.d.length >= 2, 'emailed link lists past orders');
    ok((await J('/api/my-orders?t=wrong')).s === 404, 'wrong link token rejected');
    // blog
    const pl = (await J('/api/posts')).d;
    ok(pl.length === 4 && !('body' in pl[0]), 'blog lists 4 seeded articles');
    ok((await J('/api/posts/why-new-traders-lose-money')).d.body.length > 200, 'article has body text');
    ok((await P('/api/admin/posts', { title: 'T', body: 'B' })).s === 401, 'blog admin needs token');
    ok((await P('/api/admin/posts', { title: 'My new article', body: 'Hello world.\n\n## Part\nMore text.' , category: 'Risk' }, 'secret')).d.ok && (await J('/api/posts/my-new-article')).s === 200, 'admin publishes an article');
    const pid = (await J('/api/admin/posts', {}, 'secret')).d.find(x => x.slug === 'my-new-article').id;
    await P('/api/admin/posts', { id: pid, title: 'My new article', body: 'Hello', published: false }, 'secret');
    ok((await J('/api/posts/my-new-article')).s === 404, 'unpublished article is hidden');
    await P('/api/admin/posts', { action: 'delete', id: pid }, 'secret');
    // seo + admin extras
    const pp = await (await fetch(B + '/p/order-flow-mastery')).text();
    ok(/<title>Institutional Order Flow Mastery/.test(pp) && /application\/ld\+json/.test(pp) && !/aggregateRating/.test(pp), 'product page has title, schema and no invented rating');
    ok(/<title>Why New Traders Lose Money/.test(await (await fetch(B + '/blog/why-new-traders-lose-money')).text()), 'article page has its own title');
    ok((await J('/api/admin/outbox', {}, 'secret')).d.length >= 5, 'admin can read the email log');
    const csv = await (await fetch(B + '/api/admin/export.csv', { headers: { Authorization: 'Bearer secret' } })).text();
    ok(/^"id","created"/.test(csv) && csv.includes('TEST10'), 'CSV export works');
    ok((await P('/api/admin/resend', { id: store().orders[1].id }, 'secret')).d.ok, 'admin can resend a receipt');
    ok(/sitemap/i.test(await (await fetch(B + '/robots.txt')).text()) && (await (await fetch(B + '/sitemap.xml')).text()).includes('/blog/why-new-traders-lose-money'), 'sitemap lists articles');


    // ---- strategies: uploads, captions, AI voice, public pages ----
    const put = (u, buf, tok) => fetch(B + u, { method: 'PUT', headers: { ...(tok ? { Authorization: 'Bearer ' + tok } : {}), 'Content-Type': 'application/octet-stream' }, body: buf }).then(async r => ({ s: r.status, d: await r.json().catch(() => null) }));
    ok((await put('/api/admin/upload?kind=pdf&name=a.pdf', Buffer.from('%PDF-1.4 x'))).s === 401, 'upload needs the admin token');
    ok((await put('/api/admin/upload?kind=pdf&name=a.pdf', Buffer.from('not a pdf'), 'secret')).s === 400, 'fake PDF is rejected');
    ok((await put('/api/admin/upload?kind=pdf&name=a.exe', Buffer.from('%PDF-1.4 x'), 'secret')).s === 400, 'wrong file extension is rejected');
    ok((await put('/api/admin/upload?kind=video&name=a.mp4', Buffer.from('plain text file'), 'secret')).s === 400, 'fake video is rejected');
    const pdf = (await put('/api/admin/upload?kind=pdf&name=Guide.pdf', Buffer.from('%PDF-1.4 hello'), 'secret')).d;
    const vid = (await put('/api/admin/upload?kind=video&name=Lesson.mp4', Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypisom'), Buffer.alloc(200, 1)]), 'secret')).d;
    const cap = (await put('/api/admin/upload?kind=captions&name=Lesson.srt', Buffer.from('1\n00:00:01,000 --> 00:00:03,000\nHello traders\n'), 'secret')).d;
    const orphan = (await put('/api/admin/upload?kind=image&name=c.png', Buffer.concat([Buffer.from('\x89PNG', 'latin1'), Buffer.alloc(20)]), 'secret')).d;
    ok(pdf && pdf.id && vid && vid.id && cap && cap.id && orphan && orphan.id, 'PDF, video, SRT captions and image upload');
    mockTts.hits = 0;
    ok((await J('/api/admin/strategies', {}, 'secret')).d.ttsAvailable === true, 'admin sees AI voice is available');
    const aud = (await P('/api/admin/strategies', { action: 'tts', text: 'Hello world. This is the second sentence.' }, 'secret')).d;
    ok(aud.id && aud.name === 'ai-narration.mp3' && mockTts.hits === 1, 'AI audio is generated from text');
    ok((await P('/api/admin/strategies', { action: 'tts', text: '' }, 'secret')).s === 400, 'AI audio needs text');
    ok((await P('/api/admin/strategies', { title: 'X', body: 'b', files: { pdf: 'bogus' } }, 'secret')).s === 400, 'missing upload id rejected');
    ok((await P('/api/admin/strategies', { title: 'Nope', body: 'b' })).s === 401, 'strategies need the admin token');
    const sv = await P('/api/admin/strategies', { title: 'Test Strategy', category: 'Risk', body: 'Hello there.\n\n## Part\nMore text.', published: true, aiAudio: true, files: { pdf: pdf.id, video: vid.id, captions: cap.id, audio: aud.id } }, 'secret');
    ok(sv.d.ok, 'strategy saved with four files');
    const sl = (await J('/api/strategies')).d;
    ok(sl.length === 1 && sl[0].has.video && sl[0].has.pdf && sl[0].has.audio && sl[0].has.captions, 'public list shows the strategy with its files');
    const sd = (await J('/api/strategies/test-strategy')).d;
    ok(sd.aiAudio === true && sd.files.video.url.startsWith('/media/') && sd.files.pdf.name === 'Guide.pdf', 'detail has file links and AI voice flag');
    const mv = await fetch(B + sd.files.video.url); ok(mv.status === 200 && mv.headers.get('content-type') === 'video/mp4', 'video is served');
    const mr = await fetch(B + sd.files.video.url, { headers: { Range: 'bytes=0-9' } }); ok(mr.status === 206, 'video supports seeking (range requests)');
    const mc = await fetch(B + sd.files.captions.url); const ct = await mc.text(); ok(/text\/vtt/.test(mc.headers.get('content-type')) && ct.startsWith('WEBVTT') && ct.includes('00:00:01.000 --> 00:00:03.000'), 'SRT captions are converted to WebVTT');
    ok(/attachment/.test((await fetch(B + sd.files.pdf.url + '?download=1')).headers.get('content-disposition')), 'PDF can be downloaded');
    ok((await fetch(B + '/media/' + orphan.id)).status === 404, 'files not attached to a published strategy are not served');
    const sid = (await J('/api/admin/strategies', {}, 'secret')).d.items[0].id;
    await P('/api/admin/strategies', { id: sid, title: 'Test Strategy', body: 'Hello', published: false, files: { pdf: pdf.id, video: vid.id, captions: cap.id } }, 'secret');
    ok((await J('/api/strategies')).d.length === 0 && (await fetch(B + sd.files.video.url)).status === 404, 'unpublished strategy and its files are hidden');
    ok(!fs.readdirSync(path.join(tmp, 'data', 'uploads')).some(f => f.startsWith(aud.id)), 'replaced audio file is removed from disk');
    await P('/api/admin/strategies', { id: sid, title: 'Test Strategy', body: 'Hello', published: true, files: { pdf: pdf.id, video: vid.id, captions: cap.id } }, 'secret');
    ok((await fetch(B + '/strategies/test-strategy')).status === 200 && /<title>Test Strategy/.test(await (await fetch(B + '/strategies/test-strategy')).text()), 'strategy page has its own title');
    ok((await fetch(B + '/strategies/unknown')).status === 404, 'unknown strategy 404');
    ok((await (await fetch(B + '/sitemap.xml')).text()).includes('/strategies/test-strategy'), 'sitemap lists strategies');
    await P('/api/admin/strategies', { action: 'delete', id: sid }, 'secret');
    ok(fs.readdirSync(path.join(tmp, 'data', 'uploads')).filter(f => !f.includes(orphan.id)).length === 0, 'deleting a strategy removes its files');

    for (const u of ['/', '/products', '/shop.html', '/blog', '/strategies', '/blog/why-new-traders-lose-money', '/about.html', '/find-orders.html', '/my-orders.html', '/p/order-flow-mastery', '/p/vwap-pro', '/success.html', '/cancel.html', '/contact.html', '/faq.html', '/refund-policy.html', '/terms.html', '/privacy.html', '/risk-disclosure.html', '/admin.html', '/sitemap.xml', '/robots.txt']) {
      const r = await fetch(B + u); ok(r.status === 200, 'GET ' + u + ' 200');
    }
    ok((await fetch(B + '/p/unknown')).status === 404 && (await fetch(B + '/nothing')).status === 404, 'unknown pages 404');
    // auth & welcome email tests
    const cfg = (await J('/api/config')).d;
    ok(cfg && typeof cfg.refundDays === 'number', 'config returns refundDays');
    ok((await P('/api/auth/google', {})).s === 400, 'google auth requires credential');

    const mockPayload = Buffer.from(JSON.stringify({ sub: 'google_123', email: 'alice@example.com', name: 'Alice Trader', picture: 'https://example.com/pic.jpg', email_verified: true })).toString('base64');
    const mockCred = 'eyJhbGciOiJSUzI1NiJ9.' + mockPayload + '.fake_signature';
    const auth1 = (await P('/api/auth/google', { credential: mockCred })).d;
    ok(auth1.isNewUser === true && auth1.user.email === 'alice@example.com' && auth1.token, 'new google user created with jwt token');
    const outboxMsg = store().outbox.find(m => m.to === 'alice@example.com');
    ok(outboxMsg && outboxMsg.subject === 'Welcome to TraderWorkStation!' && outboxMsg.text.includes('Welcome to TraderWorkStation, Alice Trader!'), 'welcome email sent to first-time user');

    const auth2 = (await P('/api/auth/google', { credential: mockCred })).d;
    ok(auth2.isNewUser === false && auth2.user.email === 'alice@example.com', 'existing user signs in without isNewUser');

    const meRes = (await J('/api/auth/me?token=' + auth1.token)).d;
    ok(meRes.user.email === 'alice@example.com', 'auth/me verifies token');

    const logoutRes = (await P('/api/auth/logout', {})).d;
    ok(logoutRes.ok === true, 'logout clears session');

    const loginPage = await (await fetch(B + '/login')).text();
    ok(loginPage.includes('id="root"') && loginPage.includes('TraderWorkStation'), 'login route serves React application');

    const dashPage = await (await fetch(B + '/dashboard')).text();
    ok(dashPage.includes('id="root"'), 'dashboard route serves React application');

    ok((await J('/api/admin/users')).s === 401, 'admin/users requires token');
    const adminUsers = (await J('/api/admin/users', {}, 'secret')).d;
    ok(adminUsers.some(u => u.email === 'alice@example.com'), 'admin lists registered users');

    const html = await (await fetch(B + '/')).text();
    ok(/substantial risk of loss/.test(fs.readFileSync(path.join(__dirname, '..', 'public', 'rocket.js'), 'utf8')), 'risk line is in the shared footer');
  } catch (e) { fail++; console.error('ERROR', e); }
  console.log(`\n${pass} passed, ${fail} failed`);
  srv.close(); mock.close(); mockTts.close(); process.exit(fail ? 1 : 0);
});
