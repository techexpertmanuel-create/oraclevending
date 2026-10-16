/* shop.js — customer page */
(function () {
  var D = window.DBS;
  var cfg = D.getConfig();
  var $ = function (id) { return document.getElementById(id); };

  var currentNet = null;
  var selected = null;

  function activeBundles() {
    return cfg.bundles.filter(function (b) { return b.active && Number(b.price) > 0; });
  }

  function networks() {
    var seen = [];
    activeBundles().forEach(function (b) { if (seen.indexOf(b.network) < 0) seen.push(b.network); });
    return seen;
  }

  /* ---------- header / notice ---------- */
  $('shopName').textContent = cfg.shopName || 'Data Shop';
  document.title = (cfg.shopName || 'Data Shop') + ' — Buy Data Bundles';
  if (cfg.notice) {
    $('notice').textContent = cfg.notice;
    $('notice').classList.remove('hidden');
  }

  /* ---------- network tabs ---------- */
  function renderNets() {
    var nets = networks();
    if (!currentNet || nets.indexOf(currentNet) < 0) currentNet = nets[0] || null;
    $('nets').innerHTML = nets.map(function (n) {
      return '<button type="button" class="net-btn" data-net="' + D.esc(D.netKey(n)) + '" data-name="' + D.esc(n) +
        '" aria-pressed="' + (n === currentNet) + '">' + D.esc(n) + '</button>';
    }).join('');
  }

  /* ---------- bundle grid ---------- */
  function renderGrid() {
    var list = activeBundles()
      .filter(function (b) { return b.network === currentNet; })
      .sort(function (a, b) { return a.price - b.price; });

    if (!list.length) {
      $('grid').innerHTML = '<div class="empty">No bundles are available right now. Please check back soon.</div>';
      return;
    }
    $('grid').innerHTML = list.map(function (b) {
      var on = selected && selected.id === b.id;
      return '<button type="button" class="bundle" data-net="' + D.esc(D.netKey(b.network)) + '" data-id="' + D.esc(b.id) +
        '" aria-pressed="' + (!!on) + '">' +
        '<div class="size">' + D.esc(b.label) + '</div>' +
        '<div class="valid">' + D.esc(b.validity || '') + '</div>' +
        '<div class="price">' + D.money(b.price) + '</div></button>';
    }).join('');
  }

  function renderSummary() {
    if (!selected) {
      $('summary').innerHTML = '<div class="what"><span class="muted">No bundle selected</span><small>Tap a bundle to start</small></div>';
      return;
    }
    $('summary').innerHTML =
      '<div class="what">' + D.esc(selected.network) + ' ' + D.esc(selected.label) +
      '<small>' + D.esc(selected.validity || '') + '</small></div>' +
      '<div class="amt">' + D.money(selected.price) + '</div>';
  }

  $('nets').addEventListener('click', function (e) {
    var btn = e.target.closest('.net-btn');
    if (!btn) return;
    currentNet = btn.getAttribute('data-name');
    renderNets();
    renderGrid();
  });

  $('grid').addEventListener('click', function (e) {
    var card = e.target.closest('.bundle');
    if (!card) return;
    var id = card.getAttribute('data-id');
    selected = cfg.bundles.filter(function (b) { return b.id === id; })[0] || null;
    renderGrid();
    renderSummary();
    $('formErr').textContent = '';
    if (window.matchMedia('(max-width: 920px)').matches) {
      $('orderPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  /* ---------- submit order ---------- */
  function buildMessage(order) {
    var clean = function (s) { return String(s).replace(/[|\n\r]/g, ' ').trim(); };
    var lines = [
      '*NEW DATA ORDER*',
      'Order ID: ' + order.id,
      'Name: ' + clean(order.name),
      'Send data to: ' + order.phone,
      'Network: ' + order.network,
      'Bundle: ' + order.label,
      'Amount: ' + D.money(order.price),
      'Payment: Mobile money (I will send my screenshot)'
    ];
    if (order.note) lines.push('Note: ' + clean(order.note));
    lines.push('');
    // Machine-readable line: lets the manager import this order into the dashboard.
    lines.push('#ORD|' + [order.id, order.network, order.label, order.price, order.phone, clean(order.name), order.ts].join('|'));
    return lines.join('\n');
  }

  $('orderForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('formErr');
    err.textContent = '';

    if (!selected) { err.textContent = 'Choose a bundle first.'; return; }
    var name = $('name').value.trim();
    var phone = $('phone').value.replace(/[\s-]/g, '');
    if (name.length < 2) { err.textContent = 'Enter your name.'; return; }
    if (!/^0\d{9}$/.test(phone)) { err.textContent = 'Enter a 10-digit number starting with 0, like 0241234567.'; return; }

    var order = {
      id: D.newId(), name: name, phone: phone, note: $('note').value.trim(),
      network: selected.network, label: selected.label, price: Number(selected.price), ts: Date.now()
    };

    var url = 'https://wa.me/' + D.toIntl(cfg.whatsapp) + '?text=' + encodeURIComponent(buildMessage(order));

    $('doneId').textContent = order.id;
    $('doneAmt').textContent = D.money(order.price);
    $('payNumber').textContent = (cfg.momo && cfg.momo.number) || '';
    $('payName').textContent = [(cfg.momo && cfg.momo.name), (cfg.momo && cfg.momo.network)].filter(Boolean).join(' · ');
    $('payRef').textContent = order.id;
    $('waAgain').setAttribute('href', url);
    $('formView').classList.add('hidden');
    $('doneView').classList.remove('hidden');

    window.open(url, '_blank', 'noopener');
  });

  $('newOrder').addEventListener('click', function () {
    selected = null;
    $('orderForm').reset();
    $('doneView').classList.add('hidden');
    $('formView').classList.remove('hidden');
    renderGrid();
    renderSummary();
  });

  renderNets();
  renderGrid();
  renderSummary();
})();