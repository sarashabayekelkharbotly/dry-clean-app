/* ============================================================
 * ctl_auth.js — sign-in for the screens that moved from the Hub into الكنترول (Switch C, 2026-10-03):
 * the Week, the Internet and (through الكنترول's own repairs tab) the Repairs log.
 *
 * SAME INTERFACE AS THE HUB'S auth.js, so the screens moved with their code unchanged:
 *   api(fn, extra) · authGuard() · AUTH_ON_LOGIN · ME · authWho() · logout() · authShowForm(msg)
 * The Hub's function names (props_*) are translated to the engine's (ops_*) in FN_MAP below.
 *
 * WHO: Sarah and Khaled only (Sarah: "only me and Khaled should have access to those"). The engine
 * refuses everyone else too — this page check is presentation, the engine is the boundary.
 * ONE SIGN-IN with Emad's app, Dani's page and inventory: the engine session lives under the same
 * localStorage key (owh_session_engine) on the same site.
 * FIX 6 (2026-10-03): signing out removes ONLY the session — never a screen's unsaved local work.
 * Writes are never auto-resent (the 8A double lesson); reads retry once on a network blip.
 * ============================================================ */
var ENDPOINT = 'https://geszrsrdqxwtihrqzxiu.supabase.co/functions/v1/elcontrol';
var SESS_KEY = 'owh_session_engine';
var FN_MAP = {
  props_get_all: 'ops_get_all', props_confirm_multi: 'ops_confirm_multi', props_save_draft: 'ops_save_draft',
  props_get_draft: 'ops_get_draft', props_clean_pref: 'ops_clean_pref', props_phone_bills: 'ops_phone_bills',
  props_set_phone_bill: 'ops_set_phone_bill', props_add_reading: 'ops_add_reading', props_set_bundle: 'ops_set_bundle',
  props_del_bundle: 'ops_del_bundle', props_net_precharge: 'ops_net_precharge', props_open_repair: 'ops_open_repair',
  props_edit_repair: 'ops_edit_repair', props_delete_repair: 'ops_delete_repair'
};
var READS = { ops_get_all: 1, ops_get_draft: 1, ops_phone_bills: 1, repairs_all: 1, owners_card: 1 };
var OWNERS = ['sarah', 'khaled'];

var SID = null, ME = null;
function ctlLoadSess() {
  try {
    var s = JSON.parse(localStorage.getItem(SESS_KEY) || 'null');
    if (s && s.sid && s.username) { SID = s.sid; ME = { user: s.displayName || s.username, username: s.username, role: s.role || '' }; return; }
  } catch (e) {}
  SID = null; ME = null;
}
ctlLoadSess();
var AUTH_ON_LOGIN = null;

function api(fn, extra) {
  var action = FN_MAP[fn] || fn, body = { action: action };
  if (extra) for (var k in extra) body[k] = extra[k];
  if (SID) body.sid = SID;
  var isRead = !!READS[action];
  function post_() {
    return fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { return r.text(); })
      .then(function (t) { try { return JSON.parse(t); } catch (e) { return { ok: false, code: 'BAD_REPLY', error: 'The server answered something unexpected — refresh and try again.' }; } });
  }
  var first = post_();
  if (isRead) first = first.catch(function () { return post_(); });   // one silent retry — reads only
  return first.catch(function () {
    return { ok: false, code: 'NET', error: isRead ? "Couldn't reach الكنترول — check the connection." : "Couldn't reach الكنترول — refresh before retrying, the entry may already have saved." };
  }).then(function (j) {
    if (j && j.ok === false && j.code === 'AUTH') { ctlDropSess(); authShowForm('Your session expired — please sign in again.'); throw new Error('AUTH'); }
    if (j && j.ok === false && j.code === 'FORBIDDEN') { authNotYours(); throw new Error('AUTH'); }
    return j;
  });
}
function ctlDropSess() { SID = null; ME = null; try { localStorage.removeItem(SESS_KEY); } catch (e) {} }
function authIsOwner() { return !!(ME && OWNERS.indexOf(String(ME.username || '').toLowerCase()) > -1); }
function authGuard() {
  if (!SID) { authShowForm(''); return false; }
  if (!authIsOwner()) { authNotYours(); return false; }
  return true;
}
function authNotYours() {
  document.body.innerHTML =
    '<div style="font-family:Cairo,sans-serif;max-width:340px;margin:60px auto;background:#fff;border:1px solid #ecdede;border-radius:16px;padding:22px;text-align:center;color:#1a1a1a">' +
    '<img src="control-logo.png" alt="" style="width:64px;height:64px;border-radius:13px;margin-bottom:10px">' +
    '<h2 style="margin:0 0 6px;font-size:17px">الشاشة دي لسارة وخالد بس</h2>' +
    '<p style="margin:0 0 14px;font-size:12px;color:#6b6b6b">' + (ME ? 'داخل باسم ' + (ME.user || '') : '') + '</p>' +
    '<a href="index.html" style="display:inline-block;margin:0 6px 8px;color:#cc5f5f;font-weight:700;text-decoration:none">← الكنترول</a>' +
    '<button onclick="logout()" style="border:0;background:#cc5f5f;color:#fff;font-family:inherit;font-weight:700;font-size:13px;border-radius:9px;padding:8px 18px;cursor:pointer">خروج</button></div>';
}
function logout() {
  var old = SID;
  if (old) fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'auth_logout', sid: old }) }).catch(function () {});
  ctlDropSess();                                   // the session only — a screen's unsaved work stays where it is
  authShowForm('');
}
function authWho() {
  if (!ME) return '';
  return '<b>' + (ME.user || '') + '</b> · <a href="index.html" style="color:#cc5f5f;text-decoration:none;font-weight:700">الكنترول</a>' +
         ' · <a href="#" onclick="logout();return false" style="color:#cc5f5f;text-decoration:none;font-weight:700">log out</a>';
}
function authShowForm(msg) {
  var w = document.getElementById('owhLoginWrap');
  if (!w) {
    var st = document.createElement('style');
    st.textContent =
      '#owhLoginWrap{position:fixed;inset:0;background:#dcd0d0;display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;font-family:Cairo,sans-serif}' +
      '#owhLoginWrap .lb{background:#fff;border:1px solid #ecdede;border-radius:18px;box-shadow:0 6px 28px rgba(0,0,0,.14);padding:22px 20px;width:100%;max-width:320px;text-align:center}' +
      '#owhLoginWrap img{width:72px;height:72px;border-radius:14px;margin:0 auto 9px;display:block}' +
      '#owhLoginWrap h2{margin:0 0 3px;font-size:18px;color:#1a1a1a;font-weight:700}' +
      '#owhLoginWrap p{margin:0 0 16px;font-size:11.5px;color:#6b6b6b}' +
      '#owhLoginWrap label{display:block;text-align:left;font-size:10px;color:#6b6b6b;margin:0 0 3px}' +
      '#owhLoginWrap input{width:100%;box-sizing:border-box;font-family:inherit;font-size:15px;padding:9px 10px;border:1px solid #ecdede;border-radius:9px;margin-bottom:11px;background:#f6f2f2;color:#1a1a1a}' +
      '#owhLoginWrap button{width:100%;border:0;background:#cc5f5f;color:#fff;font-family:inherit;font-weight:700;font-size:14.5px;border-radius:10px;padding:10px;cursor:pointer}' +
      '#owhLoginWrap button:disabled{opacity:.55;cursor:default}' +
      '#owhLoginMsg{font-size:11.5px;color:#cc5f5f;min-height:15px;margin-top:9px;line-height:1.4}';
    document.head.appendChild(st);
    w = document.createElement('div');
    w.id = 'owhLoginWrap';
    w.innerHTML =
      '<form class="lb" onsubmit="authLogin();return false">' +
        '<img src="control-logo.png" alt="الكنترول">' +
        '<h2>الكنترول</h2><p>Sarah &amp; Khaled · sign in to continue</p>' +
        '<label for="owhU">Username</label><input id="owhU" autocomplete="username" autocapitalize="none" spellcheck="false">' +
        '<label for="owhP">Password</label><input id="owhP" type="password" autocomplete="current-password">' +
        '<button id="owhB" type="submit">Sign in</button><div id="owhLoginMsg"></div>' +
      '</form>';
    document.body.appendChild(w);
  }
  w.style.display = 'flex';
  document.getElementById('owhLoginMsg').textContent = msg || '';
  setTimeout(function () { document.getElementById('owhU').focus(); }, 60);
}
function authHideForm() { var w = document.getElementById('owhLoginWrap'); if (w) w.style.display = 'none'; }
function authLogin() {
  var u = (document.getElementById('owhU').value || '').trim(), pw = document.getElementById('owhP').value || '',
      b = document.getElementById('owhB'), m = document.getElementById('owhLoginMsg');
  if (!u || !pw) { m.textContent = 'Enter your username and password.'; return; }
  b.disabled = true; b.textContent = 'Signing in…'; m.textContent = '';
  fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'auth_login', username: u, password: pw }) })
    .then(function (r) { return r.json(); })
    .then(function (j) {
      b.disabled = false; b.textContent = 'Sign in';
      if (!j || !j.ok) { m.textContent = (j && j.error) || 'Sign-in failed.'; return; }
      try { localStorage.setItem(SESS_KEY, JSON.stringify(j)); } catch (e) {}
      ctlLoadSess();
      document.getElementById('owhP').value = '';
      if (!authIsOwner()) { authNotYours(); return; }
      authHideForm();
      if (window.CTL_MENU && window.CTL_SCREEN) CTL_MENU.init(window.CTL_SCREEN);
      if (AUTH_ON_LOGIN) AUTH_ON_LOGIN();
    })
    .catch(function () { b.disabled = false; b.textContent = 'Sign in'; m.textContent = "Couldn't reach the server — check your connection."; });
}
