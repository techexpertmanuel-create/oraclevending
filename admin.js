/* admin.js — manager dashboard */
(function () {
  var D = window.DBS;
  var $ = function (id) { return document.getElementById(id); };
  var LS_PIN = 'dbs_pin';
  var LS_ORD = 'dbs_orders';
  var STATUSES = ['Pending', 'Paid', 'Delivered', 'Cancelled'];

  var cfg = D.getConfig();
  var orders = loadOrders();

  /* ================= storage ================= */
  function loadOrders() {
    try { return JSON.parse(localStorage.getItem(LS_ORD) || '[]'); } catch (e) { return []; }
  }
  function saveOrders() {
    try { localStorage.setItem(LS_ORD, JSON.stringify(orders)); } catch (e) { D.toast('Could not save. Browser storage is full or blocked.'); }
  }
  function saveCfg() { cfg = D.saveConfig(cfg); updateBanner(); }

  /* ================= PIN ================= */
  function hashPin(s) {
    var text = 'dbs:' + s;
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
      });
    }
    return Promise.resolve(btoa(text));
  }

  var hasPin = !!localStorage.getItem(LS_PIN);

  function initAuth() {
    if (sessionStorage.getItem('dbs_ok') === '1' && hasPin) { openApp(); return; }
    if (!hasPin) {
      $('authTitle').textContent = 'Create your manager PIN';
      $('authText').textContent = 'Choose a PIN of 4 to 12 digits. You will use it each time you open this page.';
      $('pinLabel').textContent = 'New PIN';
      $('pin2Field').classList.remove('hidden');
      $('authBtn').textContent = 'Save PIN and continue';
    }
  }

  $('authForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var pin = $('pin').value.trim();
    var err = $('authErr');
    err.textContent = '';

    if (!hasPin) {
      if (!/^\d{4,12}$/.test(pin)) { err.textContent = 'Use 4 to 12 digits.'; return; }
      if (pin !== $('pin2').value.trim()) { err.textContent = 'The two PINs do not match.'; return; }
      hashPin(pin).then(function (h) {
        localStorage.setItem(LS_PIN, h);
        hasPin = true;
        sessionStorage.setItem('dbs_ok', '1');
        openApp();
      });
      return;
    }
    hashPin(pin).then(function (h) {
      if (h === localStorage.getItem(LS_PIN)) {
        sessionStorage.setItem('dbs_ok', '1');
        openApp();
      } else {
        err.textContent = 'Wrong PIN. Try again.';
      }
    });
  });

  $('logout').addEventListener('click', function () {
    sessionStorage.removeItem('dbs_ok');
    location.reload();
  });

  function openApp() {
    $('auth').classList.add('hidden');
    $('app').classList.remove('hidden');
    $('adminShop').textContent = (cfg.shopName || 'Shop') + ' · Manager';
    sortBundles();
    renderOrders();
    renderPrices();
    fillSettings();
    updateBanner();
  }

  /* ================= tabs ================= */
  document.querySelector('.tabs').addEventListener('click', function (e) {
    var t = e.target.closest('.tab');
    if (!t) return;
    var name = t.getAttribute('data-tab');
    document.querySelectorAll('.tab').forEach(function (b) {
      b.setAttribute('aria-selected', String(b === t));
    });
    ['orders', 'prices', 'settings'].forEach(function (n) {
      $('tab-' + n).classList.toggle('hidden', n !== name);
    });
    if (name === 'prices') { sortBundles(); renderPrices(); }
  });

  /* ================= ORDERS ================= */
  function sameDay(ts) {
    var a = new Date(ts), b = new Date();
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function counts(o) { return o.status === 'Paid' || o.status === 'Delivered'; }

  function renderStats() {
    var today = orders.filter(function (o) { return sameDay(o.createdAt); });
    $('stToday').textContent = today.length;
    $('stPending').textContent = orders.filter(function (o) { return o.status === 'Pending'; }).length;
    var sum = function (list) { return list.filter(counts).reduce(function (t, o) { return t + Number(o.price || 0); }, 0); };
    $('stRevToday').textContent = D.money(sum(today));
    $('stRevAll').textContent = D.money(sum(orders));
  }

  function renderOrders() {
    renderStats();
    var q = $('search').value.trim().toLowerCase();
    var f = $('filter').value;
    var list = orders.filter(function (o) {
      if (f && o.status !== f) return false;
      if (!q) return true;
      return (o.id + ' ' + o.name + ' ' + o.phone).toLowerCase().indexOf(q) >= 0;
    }).sort(function (a, b) { return b.createdAt - a.createdAt; });

    $('ordersEmpty').classList.toggle('hidden', orders.length > 0);
    $('ordersBody').innerHTML = list.map(function (o) {
      var msg = 'Hello ' + o.name + ', your ' + o.network + ' ' + o.label + ' order (' + o.id + ') ';
      msg += o.status === 'Delivered' ? 'has been delivered. Thank you!' : 'is being processed.';
      var wa = 'https://wa.me/' + D.toIntl(o.phone) + '?text=' + encodeURIComponent(msg);
      return '<tr>' +
        '<td>' + D.esc(new Date(o.createdAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) + '</td>' +
        '<td>' + D.esc(o.id) + '</td>' +
        '<td>' + D.esc(o.name) + '</td>' +
        '<td>' + D.esc(o.phone) + '</td>' +
        '<td>' + D.esc(o.network) + ' ' + D.esc(o.label) + '</td>' +
        '<td>' + D.money(o.price) + '</td>' +
        '<td><select class="status" data-s="' + D.esc(o.status) + '" data-id="' + D.esc(o.id) + '">' +
          STATUSES.map(function (s) { return '<option' + (s === o.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') +
        '</select></td>' +
        '<td><div class="row-actions">' +
          '<a class="btn ghost sm" href="' + wa + '" target="_blank" rel="noopener">Message</a>' +
          '<button class="btn danger sm" data-del="' + D.esc(o.id) + '">Delete</button>' +
        '</div></td></tr>';
    }).join('');
  }

  $('search').addEventListener('input', renderOrders);
  $('filter').addEventListener('change', renderOrders);

  $('ordersBody').addEventListener('change', function (e) {
    var sel = e.target.closest('select.status');
    if (!sel) return;
    var id = sel.getAttribute('data-id');
    orders.forEach(function (o) { if (o.id === id) o.status = sel.value; });
    saveOrders();
    renderOrders();
    D.toast('Order ' + id + ' marked ' + sel.value);
  });

  $('ordersBody').addEventListener('click', function (e) {
    var del = e.target.closest('[data-del]');
    if (!del) return;
    var id = del.getAttribute('data-del');
    if (!confirm('Delete order ' + id + '? This cannot be undone.')) return;
    orders = orders.filter(function (o) { return o.id !== id; });
    saveOrders();
    renderOrders();
    D.toast('Order deleted');
  });

  /* ---------- import from WhatsApp ---------- */
  $('importBtn').addEventListener('click', function () {
    $('importText').value = '';
    $('importErr').textContent = '';
    $('importModal').classList.remove('hidden');
    $('importText').focus();
  });
  $('importCancel').addEventListener('click', function () { $('importModal').classList.add('hidden'); });

  $('importGo').addEventListener('click', function () {
    var text = $('importText').value;
    var re = /#ORD\|([^|\n\r]*)\|([^|\n\r]*)\|([^|\n\r]*)\|([^|\n\r]*)\|([^|\n\r]*)\|([^|\n\r]*)(?:\|(\d+))?/g;
    var m, added = 0, skipped = 0, found = 0;
    while ((m = re.exec(text)) !== null) {
      found++;
      var id = m[1].trim();
      if (orders.some(function (o) { return o.id === id; })) { skipped++; continue; }
      orders.push({
        id: id, network: m[2].trim(), label: m[3].trim(), price: Number(m[4]) || 0,
        phone: m[5].trim(), name: m[6].trim(), createdAt: Number(m[7]) || Date.now(), status: 'Pending'
      });
      added++;
    }
    if (!found) {
      $('importErr').textContent = 'No order found. Copy the full WhatsApp message, including the last line that starts with #ORD.';
      return;
    }
    saveOrders();
    renderOrders();
    $('importModal').classList.add('hidden');
    D.toast(added + ' order' + (added === 1 ? '' : 's') + ' imported' + (skipped ? ', ' + skipped + ' already in the list' : ''));
  });

  /* ---------- CSV ---------- */
  $('csvBtn').addEventListener('click', function () {
    if (!orders.length) { D.toast('No orders to download yet'); return; }
    var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; };
    var rows = [['Order ID', 'Date', 'Name', 'Phone', 'Network', 'Bundle', 'Amount (GHS)', 'Status']];
    orders.slice().sort(function (a, b) { return a.createdAt - b.createdAt; }).forEach(function (o) {
      rows.push([o.id, new Date(o.createdAt).toISOString(), o.name, o.phone, o.network, o.label, o.price, o.status]);
    });
    download('orders-' + new Date().toISOString().slice(0, 10) + '.csv',
      rows.map(function (r) { return r.map(q).join(','); }).join('\n'), 'text/csv');
  });

  function download(name, content, type) {
    var blob = new Blob([content], { type: type + ';charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ================= PRICES ================= */
  function sortBundles() {
    cfg.bundles.sort(function (a, b) {
      return a.network === b.network ? a.price - b.price : String(a.network).localeCompare(String(b.network));
    });
  }

  function renderPrices() {
    $('pricesBody').innerHTML = cfg.bundles.map(function (b) {
      return '<tr data-id="' + D.esc(b.id) + '">' +
        '<td><input data-f="network" list="netList" value="' + D.esc(b.network) + '"></td>' +
        '<td><input data-f="label" value="' + D.esc(b.label) + '" placeholder="e.g. 5GB"></td>' +
        '<td class="num"><input data-f="price" type="number" min="0" step="0.01" value="' + D.esc(b.price) + '"></td>' +
        '<td><input data-f="validity" value="' + D.esc(b.validity || '') + '" placeholder="e.g. 30 days"></td>' +
        '<td><input data-f="active" type="checkbox" style="width:22px;height:22px"' + (b.active ? ' checked' : '') + '></td>' +
        '<td><button class="btn danger sm" data-remove="' + D.esc(b.id) + '">Remove</button></td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted">No bundles yet. Choose Add bundle.</td></tr>';
  }

  $('pricesBody').addEventListener('change', function (e) {
    var input = e.target.closest('input[data-f]');
    if (!input) return;
    var id = input.closest('tr').getAttribute('data-id');
    var f = input.getAttribute('data-f');
    var b = cfg.bundles.filter(function (x) { return x.id === id; })[0];
    if (!b) return;
    if (f === 'active') b.active = input.checked;
    else if (f === 'price') b.price = Math.max(0, Number(input.value) || 0);
    else b[f] = input.value.trim();
    saveCfg();
    D.toast('Saved on this device');
  });

  $('pricesBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-remove]');
    if (!btn) return;
    if (!confirm('Remove this bundle from the shop?')) return;
    var id = btn.getAttribute('data-remove');
    cfg.bundles = cfg.bundles.filter(function (b) { return b.id !== id; });
    saveCfg();
    renderPrices();
  });

  $('addBundle').addEventListener('click', function () {
    cfg.bundles.push({ id: 'b' + Date.now(), network: 'MTN', label: '', price: 0, validity: 'No expiry', active: false });
    saveCfg();
    renderPrices();
    var rows = $('pricesBody').querySelectorAll('tr');
    var last = rows[rows.length - 1];
    if (last) last.querySelector('input[data-f="label"]').focus();
    D.toast('Fill in the bundle, set a price, then tick On sale');
  });

  /* ================= PUBLISH ================= */
  function updateBanner() {
    var pending = cfg.updatedAt > (window.SHOP_CONFIG.updatedAt || 0);
    $('pubBanner').classList.toggle('hidden', !pending);
  }

  function publish() {
    sortBundles();
    cfg = D.saveConfig(cfg);
    var stamp = new Date().toLocaleString();
    var out = '// config.js — published from the manager dashboard on ' + stamp + '\n' +
      '// Upload this file to your hosting to replace the old config.js.\n' +
      'window.SHOP_CONFIG = ' + JSON.stringify(cfg, null, 2) + ';\n';
    download('config.js', out, 'text/javascript');
    D.toast('config.js downloaded. Upload it to your hosting to go live.');
    updateBanner();
  }
  $('publishBtn').addEventListener('click', publish);
  $('pubNow').addEventListener('click', publish);

  /* ================= SETTINGS ================= */
  function fillSettings() {
    $('sShop').value = cfg.shopName || '';
    $('sWa').value = cfg.whatsapp || '';
    $('sMomo').value = (cfg.momo && cfg.momo.number) || '';
    $('sMomoName').value = (cfg.momo && cfg.momo.name) || '';
    $('sMomoNet').value = (cfg.momo && cfg.momo.network) || '';
    $('sNotice').value = cfg.notice || '';
  }

  $('saveSettings').addEventListener('click', function () {
    var wa = D.toIntl($('sWa').value);
    if (wa.length < 11) { D.toast('Enter a valid WhatsApp number'); return; }
    cfg.shopName = $('sShop').value.trim() || 'Data Shop';
    cfg.whatsapp = wa;
    cfg.momo = { number: $('sMomo').value.trim(), name: $('sMomoName').value.trim(), network: $('sMomoNet').value.trim() };
    cfg.notice = $('sNotice').value.trim();
    saveCfg();
    $('sWa').value = wa;
    $('adminShop').textContent = cfg.shopName + ' · Manager';
    D.toast('Settings saved. Publish changes to update the customer page.');
  });

  $('savePin').addEventListener('click', function () {
    var p = $('newPin').value.trim();
    if (!/^\d{4,12}$/.test(p)) { $('pinErr').textContent = 'Use 4 to 12 digits.'; return; }
    $('pinErr').textContent = '';
    hashPin(p).then(function (h) {
      localStorage.setItem(LS_PIN, h);
      $('newPin').value = '';
      D.toast('PIN changed');
    });
  });

  initAuth();
})();