/* ============================================================
 * ctl_menu.js — Sarah and Khaled's menu, the same on every الكنترول screen (Sarah 2026-10-04):
 *   🏠 الرئيسية · 📨 التواصل · 🧺 دراي كلين · 🗂️ المخزون · 🗓️ الجدولة
 * and inside الجدولة its own tabs, like the inventory screen's:
 *   الأسبوع · الصيانة · النت · الكهرباء · السجل
 * Emad and Dani keep their own menus — this draws nothing for them.
 * Loaded by index.html, week.html, internet.html, inventory.html and comms_index.html. On index.html the
 * tabs that live inside it (dry clean, repairs, electricity, log) switch the page in place (showPage);
 * everywhere else they open index.html#<tab>, which index.html honours on load.
 * ============================================================ */
(function () {
  var OWNERS = ['sarah', 'khaled'];
  var TOP = [
    { k: 'home', ic: '🏠', t: 'الرئيسية', href: 'index.html', page: 'home' },
    { k: 'comms', ic: '📨', t: 'التواصل', href: 'comms_index.html' },
    { k: 'dc', ic: '🧺', t: 'دراي كلين', href: 'index.html#dc', page: 'dc' },
    { k: 'inv', ic: '🗂️', t: 'المخزون', href: 'inventory.html' },
    { k: 'sched', ic: '🗓️', t: 'الجدولة', href: 'week.html' }
  ];
  var SUB = [
    { k: 'week', t: '🗓️ الأسبوع', href: 'week.html' },
    { k: 'repairs', t: '🔧 الصيانة', href: 'index.html#repairs', page: 'repairs' },
    { k: 'net', t: '📶 النت', href: 'internet.html' },
    { k: 'elec', t: '⚡ الكهرباء', href: 'index.html#elec', page: 'elec' },
    { k: 'log', t: '📋 السجل', href: 'index.html#log', page: 'log' }
  ];
  // which top tab / sub tab a screen belongs to
  var PAGE_TOP = { home: 'home', dc: 'dc', 'new': 'dc', review: 'dc', stats: 'dc', manage: 'dc', repairs: 'sched', elec: 'sched', log: 'sched' };
  function me() {
    try { var s = JSON.parse(localStorage.getItem('owh_session_engine') || 'null'); return s && s.sid ? String(s.username || '').toLowerCase() : ''; } catch (e) { return ''; }
  }
  function isOwner() { return OWNERS.indexOf(me()) > -1; }
  function onIndex() { return typeof window.showPage === 'function' && !!document.getElementById('page-home'); }
  function css() {
    if (document.getElementById('ctlMenuCss')) return;
    var st = document.createElement('style'); st.id = 'ctlMenuCss';
    st.textContent =
      '#ctlMenu{direction:rtl;background:#fff;border-bottom:1px solid #e8d8d8;font-family:Cairo,sans-serif;z-index:99}' +
      '#ctlMenu.sticky{position:sticky}' +
      '#ctlMenu .top{display:flex;max-width:980px;margin:0 auto}' +
      '#ctlMenu .top a{flex:1;text-align:center;padding:8px 2px;font-size:11px;font-weight:700;color:#999;text-decoration:none;border-bottom:3px solid transparent;white-space:nowrap;cursor:pointer}' +
      '#ctlMenu .top a .ic{display:block;font-size:17px;margin-bottom:1px}' +
      '#ctlMenu .top a.on{color:#cc5f5f;border-bottom-color:#cc5f5f}' +
      '#ctlMenu .sub{display:flex;gap:4px;max-width:980px;margin:0 auto;padding:6px 6px;background:#fdf6f6;border-top:1px solid #f0e4e4;overflow-x:auto;scrollbar-width:none}' +
      '#ctlMenu .sub::-webkit-scrollbar{display:none}' +
      '#ctlMenu .sub a{flex:1 1 auto;text-align:center;padding:5px 4px;border-radius:16px;font-size:11px;font-weight:700;color:#6b6b6b;background:#fff;border:1px solid #e8d8d8;text-decoration:none;white-space:nowrap;cursor:pointer}' +
      '#ctlMenu .sub a.on{background:#cc5f5f;color:#fff;border-color:#cc5f5f}';
    document.head.appendChild(st);
  }
  var state = { top: '', sub: '' };
  function go(item, ev) {
    if (item.page && onIndex()) { if (ev) ev.preventDefault(); window.showPage(item.page); return; }
  }
  function draw() {
    var el = document.getElementById('ctlMenu'); if (!el) return;
    var h = '<div class="top">' + TOP.map(function (x, i) {
      return '<a data-i="' + i + '" class="' + (state.top === x.k ? 'on' : '') + '" href="' + x.href + '"><span class="ic">' + x.ic + '</span>' + x.t + '</a>'; }).join('') + '</div>';
    if (state.top === 'sched') h += '<div class="sub">' + SUB.map(function (x, i) {
      return '<a data-s="' + i + '" class="' + (state.sub === x.k ? 'on' : '') + '" href="' + x.href + '">' + x.t + '</a>'; }).join('') + '</div>';
    el.innerHTML = h;
    Array.prototype.forEach.call(el.querySelectorAll('a[data-i]'), function (a) { a.onclick = function (ev) { var it = TOP[+a.getAttribute('data-i')]; if (it.k === 'sched' && onIndex()) return; go(it, ev); }; });
    Array.prototype.forEach.call(el.querySelectorAll('a[data-s]'), function (a) { a.onclick = function (ev) { go(SUB[+a.getAttribute('data-s')], ev); }; });
  }
  /* init(screen): screen = 'week' | 'net' | 'inv' | 'comms' on those pages; on index.html it follows showPage */
  function init(screen) {
    if (!isOwner()) {
      var old = document.getElementById('ctlMenu'); if (old) old.remove();
      var n0 = onIndex() ? document.querySelector('.nav') : null; if (n0) n0.style.display = '';
      return false;
    }
    css();
    var el = document.getElementById('ctlMenu');
    if (!el) {
      el = document.createElement('div'); el.id = 'ctlMenu';
      var idxNav = onIndex() ? document.querySelector('.nav') : null;
      if (idxNav) { idxNav.style.display = 'none'; idxNav.parentNode.insertBefore(el, idxNav); el.className = 'sticky'; el.style.top = (document.querySelector('.header') || { offsetHeight: 0 }).offsetHeight + 'px'; }
      else { document.body.insertBefore(el, document.body.firstChild); if (screen === 'week' || screen === 'net') { el.className = 'sticky'; el.style.top = '0'; } }
    }
    if (screen === 'week') { state.top = 'sched'; state.sub = 'week'; }
    else if (screen === 'net') { state.top = 'sched'; state.sub = 'net'; }
    else if (screen === 'inv') { state.top = 'inv'; state.sub = ''; }
    else if (screen === 'comms') { state.top = 'comms'; state.sub = ''; }
    draw();
    return true;
  }
  // index.html calls this from showPage(name)
  function sync(page) {
    if (!document.getElementById('ctlMenu')) return;
    state.top = PAGE_TOP[page] || 'home'; state.sub = state.top === 'sched' ? page : '';
    draw();
  }
  window.CTL_MENU = { init: init, sync: sync, isOwner: isOwner };
  // week / internet / inventory / comms set window.CTL_SCREEN and get the menu as soon as the page is there
  document.addEventListener('DOMContentLoaded', function () { if (window.CTL_SCREEN) init(window.CTL_SCREEN); });
})();
