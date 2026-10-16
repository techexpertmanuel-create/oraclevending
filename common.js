/* common.js — helpers shared by the shop (shop.js) and the manager dashboard (admin.js) */
(function () {
  var LS_CFG = 'dbs_config';

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // Uses the newer of: published config.js, or changes saved in this browser (manager only).
  function getConfig() {
    var base = window.SHOP_CONFIG;
    try {
      var local = JSON.parse(localStorage.getItem(LS_CFG) || 'null');
      if (local && local.updatedAt > base.updatedAt) return local;
    } catch (e) {}
    return clone(base);
  }

  function saveConfig(cfg) {
    cfg.updatedAt = Date.now();
    try { localStorage.setItem(LS_CFG, JSON.stringify(cfg)); } catch (e) {}
    return cfg;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function money(n) { return 'GHS ' + Number(n || 0).toFixed(2); }

  // 0241234567 -> 233241234567
  function toIntl(n) {
    var d = String(n || '').replace(/\D/g, '');
    if (d.charAt(0) === '0') d = '233' + d.slice(1);
    return d;
  }

  function newId() {
    var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
    for (var i = 0; i < 6; i++) s += a.charAt(Math.floor(Math.random() * a.length));
    return 'DB-' + s;
  }

  function netKey(n) { return String(n || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

  var toastTimer;
  function toast(msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  window.DBS = {
    getConfig: getConfig, saveConfig: saveConfig, esc: esc, money: money,
    toIntl: toIntl, newId: newId, netKey: netKey, toast: toast, clone: clone
  };
})();