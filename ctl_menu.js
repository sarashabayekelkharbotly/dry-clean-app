/* ============================================================
 * ctl_menu.js — THE TOP OF EVERY الكنترول SCREEN, drawn the same way everywhere (Sarah 2026-10-05: "some are up,
 * some are down, one page has up and down, some have emojis and some don't and some have duplicated buttons").
 *
 * One rule, every screen, every person:
 *   1. ONE header — logo + «الكنترول» + who is signed in; on the other side only that screen's own tools,
 *      then 🔄 (full sync — new bookings in, this screen refreshed) and 👤 (switch user / sign out). No duplicates.
 *   2. The MAIN MENU right under it, icons + words:
 *        Sarah / Khaled:  الرئيسية · التواصل · دراي كلين · المخزون · الجدولة
 *        Emad:            الرئيسية · دراي كلين · كهرباء · إصلاحات · سجل · المخزون
 *        Dani:            (none — his account opens the comms screen only)
 *   3. The screen's SECTIONS as small pill tabs under the menu — words only, no emojis
 *      (dry clean · الجدولة · inventory · comms).
 *   4. Nothing at the bottom of any screen.
 * Each page keeps its own native header/tabs in the DOM (hidden) — the pills click them, so every page's own logic
 * (active tab, data loading) is untouched. A page describes itself in window.CTL_PAGE before calling init().
 * ============================================================ */
(function () {
  var ENGINE = 'https://geszrsrdqxwtihrqzxiu.supabase.co/functions/v1/elcontrol';
  var OWNERS = ['sarah', 'khaled'];
  var MENU = {
    owner: [
      { k: 'home', ic: '🏠', t: 'الرئيسية', href: 'index.html', page: 'home' },
      { k: 'comms', ic: '📨', t: 'التواصل', href: 'comms_index.html' },
      { k: 'dc', ic: '🧺', t: 'دراي كلين', href: 'index.html#new', page: 'new' },
      { k: 'inv', ic: '🗂️', t: 'المخزون', href: 'inventory.html' },
      { k: 'sched', ic: '🗓️', t: 'الجدولة', href: 'week.html' }
    ],
    emad: [
      { k: 'home', ic: '🏠', t: 'الرئيسية', href: 'index.html', page: 'home' },
      { k: 'dc', ic: '🧺', t: 'دراي كلين', href: 'index.html#new', page: 'new' },
      { k: 'elec', ic: '⚡', t: 'كهرباء', href: 'index.html#elec', page: 'elec' },
      { k: 'repairs', ic: '🔧', t: 'إصلاحات', href: 'index.html#repairs', page: 'repairs' },
      { k: 'log', ic: '📋', t: 'سجل', href: 'index.html#log', page: 'log' },
      { k: 'inv', ic: '🗂️', t: 'المخزون', href: 'inventory.html' }
    ]
  };
  // sections that live inside index.html (pills switch the page in place there)
  var GROUPS = {
    dc: [{ k: 'new', t: 'إرسال جديد', page: 'new' }, { k: 'review', t: 'مراجعة', page: 'review' }, { k: 'stats', t: 'إحصائيات', page: 'stats' }, { k: 'manage', t: 'إدارة', page: 'manage' }],
    sched: [{ k: 'week', t: 'الأسبوع', href: 'week.html' }, { k: 'repairs', t: 'الصيانة', page: 'repairs' }, { k: 'net', t: 'النت', href: 'internet.html' },
            { k: 'elec', t: 'الكهرباء', page: 'elec' }, { k: 'log', t: 'السجل', page: 'log' }]
  };
  var DC_PAGES = { 'new': 1, review: 1, stats: 1, manage: 1, dc: 1 };
  function sess() { try { var s = JSON.parse(localStorage.getItem('owh_session_engine') || 'null'); return s && s.sid ? s : null; } catch (e) { return null; } }
  function who() { var s = sess(); return s ? String(s.username || '').toLowerCase() : ''; }
  function role() { var u = who(); return OWNERS.indexOf(u) > -1 ? 'owner' : u === 'emad' ? 'emad' : u ? 'other' : ''; }
  function onIndex() { return typeof window.showPage === 'function' && !!document.getElementById('page-home'); }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }

  function css() {
    if (document.getElementById('ctlChromeCss')) return;
    var st = document.createElement('style'); st.id = 'ctlChromeCss';
    st.textContent =
      '#ctlChrome{direction:rtl;position:sticky;top:0;z-index:150;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.06);font-family:Cairo,sans-serif}' +
      '#ctlChrome .hd{display:flex;align-items:center;gap:8px;max-width:980px;margin:0 auto;padding:8px 12px;border-bottom:1px solid #f0e4e4}' +
      '#ctlChrome .hd img{width:34px;height:34px;border-radius:8px;object-fit:contain}' +
      '#ctlChrome .hd .nm{font-weight:800;font-size:15px;color:#1a1a1a;line-height:1.1}' +
      '#ctlChrome .hd .who{font-size:10.5px;color:#999;font-weight:600}' +
      '#ctlChrome .hd .sp{flex:1}' +
      '#ctlChrome .hd button{border:1px solid #e8d8d8;background:#fff;border-radius:9px;min-width:34px;height:34px;padding:0 7px;font-size:15px;cursor:pointer;font-family:Cairo,sans-serif;font-weight:700;color:#555}' +
      '#ctlChrome .hd button:disabled{opacity:.6}' +
      '#ctlChrome .mn{display:flex;max-width:980px;margin:0 auto;border-bottom:1px solid #e8d8d8}' +
      '#ctlChrome .mn a{flex:1 1 0;min-width:0;text-align:center;padding:7px 1px 6px;font-size:10.5px;font-weight:700;color:#999;text-decoration:none;border-bottom:3px solid transparent;white-space:nowrap;cursor:pointer}' +
      '#ctlChrome .mn a .ic{display:block;font-size:16px;line-height:1.2}' +
      '#ctlChrome .mn a.on{color:#cc5f5f;border-bottom-color:#cc5f5f}' +
      '#ctlChrome .sb{display:flex;gap:4px;max-width:980px;margin:0 auto;padding:6px 8px;background:#fdf6f6;overflow-x:auto;scrollbar-width:none}' +
      '#ctlChrome .sb::-webkit-scrollbar{display:none}' +
      '#ctlChrome .sb a{flex:1 1 auto;text-align:center;padding:5px 3px;border-radius:16px;font-size:11px;font-weight:700;color:#6b6b6b;background:#fff;border:1px solid #e8d8d8;text-decoration:none;white-space:nowrap;cursor:pointer}' +
      '#ctlChrome .sb a.on{background:#cc5f5f;color:#fff;border-color:#cc5f5f}';
    document.head.appendChild(st);
  }
  var state = { top: '', sub: '' };
  var cfg = {};
  var hideCss = null;

  /* ---- 🔄 full sync: new bookings from Smoobu → the Hub → every screen, then THIS screen reloads ---- */
  function post(body, ms) {
    var c = new AbortController(), t = setTimeout(function () { c.abort(); }, ms);
    var s = sess(); if (s) body.sid = s.sid;
    return fetch(ENGINE, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body), signal: c.signal })
      .then(function (r) { clearTimeout(t); return r.text(); }).then(function (x) { try { return JSON.parse(x); } catch (e) { throw new Error('not json'); } });
  }
  function note(msg) {
    if (typeof window.showToast === 'function') return window.showToast(msg);
    if (typeof window.toast === 'function') return window.toast(msg);
    var el = document.getElementById('ctlNote'); if (!el) { el = document.createElement('div'); el.id = 'ctlNote';
      el.style.cssText = 'position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#333;color:#fff;border-radius:12px;padding:9px 16px;font:700 13px Cairo,sans-serif;z-index:9999;direction:rtl';
      document.body.appendChild(el); }
    el.textContent = msg; el.style.display = 'block'; clearTimeout(el._t); el._t = setTimeout(function () { el.style.display = 'none'; }, 3500);
  }
  function fullSync(btn) {
    if (cfg.sync) return cfg.sync();                                  // the page's own sync (it shows its own progress)
    var since = Date.now(); btn.disabled = true;
    var tick = setInterval(function () { btn.textContent = '⏳' + Math.round((Date.now() - since) / 1000); }, 1000);
    function done(r) {
      clearInterval(tick); btn.disabled = false; btn.textContent = '🔄';
      if (r && r.code === 'BUSY') return note('⏳ المزامنة شغالة دلوقتي — استنى شوية');
      if (!r || r.ok !== true) return note('❌ فشلت المزامنة — حاول مرة أخرى');
      note('✅ تمت المزامنة');
      if (cfg.after) cfg.after(); else location.reload();
    }
    function watch(n) {
      if (n > 24) return done(null);
      setTimeout(function () { post({ action: 'hub_sync_status' }, 20000).then(function (s) { if (s && !s.running) done(s.result || { ok: true }); else watch(n + 1); })
        .catch(function () { watch(n + 1); }); }, 15000);
    }
    post({ action: 'hub_sync_all' }, 290000).then(done).catch(function () { watch(0); });
  }

  /* ---- drawing ---- */
  function nativeTools() {        // the screen's own tools, mirrored from its (hidden) native header — only the ones that page shows
    return (cfg.tools || []).map(function (sel) { return document.querySelector(sel); })
      .filter(function (b) { return b && b.style.display !== 'none'; });
  }
  function nativeSections() {     // the screen's own section tabs, mirrored from its (hidden) native tab bar
    if (!cfg.subFrom) return null;
    var box = document.querySelector(cfg.subFrom.sel); if (!box) return null;
    return Array.prototype.filter.call(box.querySelectorAll(cfg.subFrom.item), function (b) { return b.style.display !== 'none'; })
      .map(function (b) {
        var cl = b.cloneNode(true); Array.prototype.forEach.call(cl.querySelectorAll('.tab-icon,.ti,.ni'), function (x) { x.remove(); });
        return { el: b, t: cl.textContent.replace(/\s+/g, ' ').trim(), on: b.classList.contains(cfg.subFrom.on) };
      });
  }
  function draw() {
    var el = document.getElementById('ctlChrome'); if (!el) return;
    var r = role(), s = sess() || {}, menu = MENU[r] || null;
    var h = '<div class="hd"><img src="control-logo.png" alt=""><div><div class="nm">الكنترول</div><div class="who">' + esc(s.displayName || s.username || '') +
      (cfg.status ? ' · <span id="ctlStatus"></span>' : '') + '</div></div><div class="sp"></div>';
    nativeTools().forEach(function (b, i) { h += '<button data-t="' + i + '" title="' + esc(b.title || '') + '">' + esc(b.textContent.trim()) + '</button>'; });
    h += '<button data-a="sync" title="مزامنة شاملة — الحجوزات الجديدة وتحديث الشاشة">🔄</button><button data-a="user" title="تغيير المستخدم / خروج">👤</button></div>';
    if (menu) h += '<div class="mn">' + menu.map(function (x, i) {
      return '<a data-m="' + i + '" class="' + (state.top === x.k ? 'on' : '') + '" href="' + x.href + '"><span class="ic">' + x.ic + '</span>' + x.t + '</a>'; }).join('') + '</div>';
    var subs = null;
    if (cfg.subFrom) subs = (nativeSections() || []).map(function (x, i) { return '<a data-n="' + i + '" class="' + (x.on ? 'on' : '') + '">' + esc(x.t) + '</a>'; });
    else if (state.top === 'dc' || (state.top === 'sched' && r === 'owner'))
      subs = GROUPS[state.top].map(function (x, i) { return '<a data-g="' + i + '" class="' + (state.sub === x.k ? 'on' : '') + '" href="' + (x.href || ('index.html#' + x.page)) + '">' + x.t + '</a>'; });
    if (subs && subs.length > 1) h += '<div class="sb">' + subs.join('') + '</div>';
    el.innerHTML = h;
    var st = document.getElementById('ctlStatus'); if (st && cfg.status) { var src = document.querySelector(cfg.status); st.textContent = src ? src.textContent.trim() : ''; }
    // wiring
    var tools = nativeTools();
    Array.prototype.forEach.call(el.querySelectorAll('button[data-t]'), function (b) { b.onclick = function () { tools[+b.getAttribute('data-t')].click(); }; });
    el.querySelector('button[data-a="sync"]').onclick = function () { fullSync(this); };
    el.querySelector('button[data-a="user"]').onclick = function () { if (cfg.user) cfg.user(); };
    Array.prototype.forEach.call(el.querySelectorAll('a[data-m]'), function (a) { a.onclick = function (ev) {
      var it = menu[+a.getAttribute('data-m')];
      if (it.page && onIndex()) { ev.preventDefault(); window.showPage(it.page); }
    }; });
    Array.prototype.forEach.call(el.querySelectorAll('a[data-g]'), function (a) { a.onclick = function (ev) {
      var it = GROUPS[state.top][+a.getAttribute('data-g')];
      if (it.page && onIndex()) { ev.preventDefault(); window.showPage(it.page); }
    }; });
    var secs = nativeSections();
    Array.prototype.forEach.call(el.querySelectorAll('a[data-n]'), function (a) { a.onclick = function () { secs[+a.getAttribute('data-n')].el.click(); setTimeout(draw, 0); }; });
  }

  /* init(screen) — the page has set window.CTL_PAGE = { screen, hide:[…], tools:[…], subFrom:{sel,item,on}, status, sync, after, user } */
  function init(screen) {
    cfg = window.CTL_PAGE || {};
    if (screen) cfg.screen = screen;
    var old = document.getElementById('ctlChrome');
    if (!role()) { if (old) old.remove(); if (hideCss) { hideCss.remove(); hideCss = null; } return false; }   // signed out: the page's own sign-in shows
    css();
    if (!hideCss && (cfg.hide || []).length) { hideCss = document.createElement('style'); hideCss.textContent = cfg.hide.join(',') + '{display:none!important}'; document.head.appendChild(hideCss); }
    if (!old) { old = document.createElement('div'); old.id = 'ctlChrome'; document.body.insertBefore(old, document.body.firstChild); }
    var sc = cfg.screen;
    if (sc === 'week') { state.top = 'sched'; state.sub = 'week'; }
    else if (sc === 'net') { state.top = 'sched'; state.sub = 'net'; }
    else if (sc === 'inv') { state.top = 'inv'; state.sub = ''; }
    else if (sc === 'comms') { state.top = 'comms'; state.sub = ''; }
    // the native tab bar / tools change on their own (a tab switch, the language toggle) — follow them
    var targets = [cfg.subFrom && cfg.subFrom.sel].concat(cfg.tools || []).concat(cfg.status ? [cfg.status] : []).filter(Boolean);
    targets.forEach(function (sel) { var t = document.querySelector(sel); if (t && !t._ctlObs) { t._ctlObs = true;
      new MutationObserver(function () { clearTimeout(window._ctlRedraw); window._ctlRedraw = setTimeout(draw, 30); })
        .observe(t, { attributes: true, childList: true, subtree: true, characterData: true }); } });
    draw();
    return true;
  }
  // index.html calls this from showPage(name)
  function sync(page) {
    if (!document.getElementById('ctlChrome')) return;
    var r = role();
    if (DC_PAGES[page]) { state.top = 'dc'; state.sub = page === 'dc' ? 'new' : page; }
    else if (page === 'repairs' || page === 'elec' || page === 'log') { if (r === 'owner') { state.top = 'sched'; state.sub = page; } else { state.top = page; state.sub = ''; } }
    else { state.top = 'home'; state.sub = ''; }
    draw();
  }
  window.CTL_MENU = { init: init, sync: sync, isOwner: function () { return role() === 'owner'; }, redraw: function () { draw(); } };
  document.addEventListener('DOMContentLoaded', function () { if (window.CTL_PAGE && window.CTL_PAGE.auto) init(); });
})();
