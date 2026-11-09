/* Motor de inventario compartido (jQuery) · window.INV = [[sku,nombre,categoría,stock,mínimo,unidad],...] */
$(function () {
  var page = location.pathname.split('/').pop() || 'inv', KEY = 'inv:' + page, base = window.INV || [];
  var items = null, cat = 'all', onlyAlerts = false, sort = {k: null, dir: 1}, log = [], sim = null;
  var fields = ['sku', 'name', 'cat', 'stock', 'min', 'unit'];
  function toObj(a) { var o = {}; $.each(fields, function (i, f) { o[f] = a[i]; }); return o; }
  try { items = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  if (!items) items = $.map(base, toObj);
  function save() { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} }
  function state(p) { return p.stock <= p.min * 0.5 ? 'crit' : p.stock <= p.min ? 'low' : 'ok'; }
  var LBL = {ok: 'Óptimo', low: 'Stock bajo', crit: 'Crítico'};
  function esc(s) { return $('<i>').text(s).html(); }

  // ---- Estructura creada por DOM ----
  var $tools = $('.tools');
  var $bar = $('<div class="actions-bar">' +
    '<button class="btn sm primary" id="bAdd">+ Nuevo producto</button>' +
    '<button class="btn sm" id="bCsv">Exportar CSV</button>' +
    '<button class="btn sm" id="bAlerts">Solo alertas</button>' +
    '<label class="switch"><input type="checkbox" id="bSim"><span></span>Simular consumo</label>' +
    '<button class="btn sm ghost" id="bReset">Restablecer</button></div>').insertAfter($tools);
  var $panels = $('<div class="panels"><div class="glass panel"><h3>Stock por categoría</h3><div id="chart"></div></div>' +
    '<div class="glass panel"><h3>Movimientos recientes</h3><ul id="log"><li class="muted">Sin movimientos todavía.</li></ul></div></div>')
    .insertAfter('.table-wrap');
  $('<div class="toasts" id="toasts"></div>').appendTo('body');
  $('<div class="glass car-wrap"><h3>Productos a reponer</h3><div class="car" id="restock"></div></div>').insertBefore($tools);
  $('#restock').carousel({perView: 2, delay: 4000});
  $('<div class="modal" id="modal"><form class="glass" id="mForm" novalidate><h3>Nuevo producto</h3>' +
    '<input id="mName" placeholder="Nombre del producto"><select id="mCat"></select>' +
    '<div class="two"><input id="mStock" type="number" min="0" placeholder="Stock inicial"><input id="mMin" type="number" min="1" placeholder="Stock mínimo"></div>' +
    '<input id="mUnit" placeholder="Unidad (uds, kg, L…)"><div class="msg" id="mMsg"></div>' +
    '<div class="two"><button type="button" class="btn sm" id="mCancel">Cancelar</button><button class="btn sm primary">Guardar</button></div></form></div>').appendTo('body');

  function toast(t, type) {
    var $t = $('<div class="toast ' + (type || '') + '">' + esc(t) + '</div>').appendTo('#toasts');
    setTimeout(function () { $t.addClass('out'); setTimeout(function () { $t.remove(); }, 300); }, 2800);
  }
  function addLog(t) {
    log.unshift('<li><b>' + new Date().toLocaleTimeString('es-BO') + '</b> ' + esc(t) + '</li>'); log = log.slice(0, 7);
    $('#log').html(log.join(''));
  }
  function count($el, to) {
    $({n: +$el.text()}).animate({n: to}, {duration: 500, step: function (v) { $el.text(Math.round(v)); }});
  }

  function chart() {
    var tot = {}, mx = 1;
    $.each(items, function (i, p) { tot[p.cat] = tot[p.cat] || {s: 0, m: 0}; tot[p.cat].s += p.stock; tot[p.cat].m += p.min; });
    $.each(tot, function (c, v) { mx = Math.max(mx, v.s, v.m); });
    var h = '';
    $.each(tot, function (c, v) {
      h += '<div class="crow"><span>' + esc(c) + '</span><div class="track"><div class="fill" style="width:' + v.s / mx * 100 + '%"></div>' +
        '<div class="mark" style="left:' + v.m / mx * 100 + '%" title="Mínimo total"></div></div><em>' + v.s + '</em></div>';
    });
    $('#chart').html(h || '<p class="muted">Sin datos.</p>');
  }

  function render() {
    var q = $.trim($('#search').val()).toLowerCase(), rows = $.grep(items, function (p) {
      return (cat === 'all' || p.cat === cat) && (!onlyAlerts || state(p) !== 'ok') &&
        (p.sku + ' ' + p.name + ' ' + p.cat).toLowerCase().indexOf(q) > -1;
    });
    if (sort.k) rows.sort(function (a, b) { return (a[sort.k] > b[sort.k] ? 1 : -1) * sort.dir; });
    var $b = $('#inv tbody').empty();
    $.each(rows, function (i, p) {
      var s = state(p), pct = Math.min(100, p.stock / (p.min * 3) * 100);
      $b.append('<tr class="state-' + s + '" data-sku="' + esc(p.sku) + '"><td class="sku">' + esc(p.sku) + '</td><td>' + esc(p.name) + '</td><td>' + esc(p.cat) + '</td>' +
        '<td><span class="qty"><button data-d="-1" aria-label="Restar">−</button><span class="stock">' + p.stock + '</span><button data-d="1" aria-label="Sumar">+</button><span class="unit">' + esc(p.unit) + '</span></span>' +
        '<div class="mini"><i class="' + s + '" style="width:' + pct + '%"></i></div></td><td>' + p.min + ' ' + esc(p.unit) + '</td>' +
        '<td><span class="badge ' + s + '">' + LBL[s] + '</span></td><td><button class="del" aria-label="Eliminar">✕</button></td></tr>');
    });
    $('#empty').toggle(!rows.length);
    var low = $.grep(items, function (p) { return state(p) === 'low'; }).length, crit = $.grep(items, function (p) { return state(p) === 'crit'; }).length;
    count($('#sTotal'), items.length); count($('#sLow'), low); count($('#sCrit'), crit);
    $('#alert').toggle(low + crit > 0).text('⚠ ' + (low + crit) + ' producto(s) requieren reposición (' + crit + ' en estado crítico).');
    $('#updated').text('Actualizado: ' + new Date().toLocaleTimeString('es-BO'));
    $('#inv th').removeClass('asc desc').filter('[data-k="' + sort.k + '"]').addClass(sort.dir > 0 ? 'asc' : 'desc');
    var need = $.grep(items, function (p) { return state(p) !== 'ok'; }).sort(function (x, y) { return x.stock / x.min - y.stock / y.min; });
    $('#restock').data('set')(need.length ? $.map(need, function (p) {
      var s = state(p); return '<div><div class="glass rcard"><div class="big">' + p.stock + '</div><h4>' + esc(p.name) + '</h4>' +
        '<small>' + esc(p.cat) + ' · mínimo ' + p.min + ' ' + esc(p.unit) + '</small><div><span class="badge ' + s + '">' + LBL[s] + '</span> ' +
        '<button class="btn sm rs" data-sku="' + esc(p.sku) + '">Reponer +' + p.min * 2 + '</button></div></div></div>';
    }) : '<div><div class="glass rcard"><div class="big">✓</div><h4>Todo en orden</h4><small>Ningún producto está bajo el mínimo.</small></div></div>');
    chart(); save();
  }
  function find(sku) { return $.grep(items, function (p) { return p.sku === sku; })[0]; }
  function move(p, d) {
    var before = state(p); p.stock = Math.max(0, p.stock + d);
    addLog((d > 0 ? 'Entrada +' : 'Salida −') + Math.abs(d) + ' · ' + p.name);
    if (state(p) === 'crit' && before !== 'crit') toast('Stock crítico: ' + p.name, 'bad');
  }

  // ---- Eventos ----
  $('#filters').empty().append('<button class="on" data-cat="all">Todos</button>');
  function cats() { var out = []; $.each(items, function (i, p) { if ($.inArray(p.cat, out) < 0) out.push(p.cat); }); return out; }
  $.each(cats(), function (i, c) { $('#filters').append('<button data-cat="' + esc(c) + '">' + esc(c) + '</button>'); $('#mCat').append('<option>' + esc(c) + '</option>'); });
  $('#inv thead tr').append('<th></th>').find('th').each(function (i) { if (i < 6) $(this).attr('data-k', fields[i]); });

  $('#search').on('input', render);
  $('#filters').on('click', 'button', function () { $(this).addClass('on').siblings().removeClass('on'); cat = $(this).data('cat'); render(); });
  $('#inv thead').on('click', 'th[data-k]', function () {
    var k = $(this).data('k'); sort.dir = sort.k === k ? -sort.dir : 1; sort.k = k; render();
  });
  $('#inv').on('click', '.qty button', function () { move(find($(this).closest('tr').data('sku')), +$(this).data('d')); render(); });
  $('#inv').on('click', '.del', function () {
    var p = find($(this).closest('tr').data('sku')); if (!confirm('¿Eliminar "' + p.name + '"?')) return;
    items.splice(items.indexOf(p), 1); addLog('Eliminado · ' + p.name); toast('Producto eliminado'); render();
  });
  $('#restock').on('click', '.rs', function () { var p = find($(this).data('sku')); move(p, p.min * 2); toast('Reposición registrada: ' + p.name, 'ok'); render(); });
  $('#bAlerts').on('click', function () { onlyAlerts = !onlyAlerts; $(this).toggleClass('on', onlyAlerts); render(); });
  $('#bReset').on('click', function () { items = $.map(base, toObj); log = []; $('#log').html('<li class="muted">Sin movimientos todavía.</li>'); toast('Inventario restablecido'); render(); });
  $('#bCsv').on('click', function () {
    var csv = 'Código,Producto,Categoría,Stock,Mínimo,Unidad,Estado\n' + $.map(items, function (p) {
      return [p.sku, '"' + p.name + '"', p.cat, p.stock, p.min, p.unit, LBL[state(p)]].join(',');
    }).join('\n');
    var a = $('<a>').attr({href: URL.createObjectURL(new Blob(['\ufeff' + csv], {type: 'text/csv'})), download: 'inventario-' + page.replace('.html', '') + '.csv'}).appendTo('body');
    a[0].click(); a.remove(); toast('CSV exportado', 'ok');
  });
  $('#bSim').on('change', function () {
    clearInterval(sim); if (!this.checked) return toast('Simulación detenida');
    toast('Simulando consumo en tiempo real…');
    sim = setInterval(function () { var p = items[Math.floor(Math.random() * items.length)]; if (p.stock > 0) { move(p, -Math.ceil(Math.random() * 3)); render(); } }, 2500);
  });
  $('#bAdd').on('click', function () { $('#modal').addClass('open'); $('#mName').focus(); });
  $('#mCancel').on('click', function () { $('#modal').removeClass('open'); });
  $('#modal').on('click', function (e) { if (e.target === this) $(this).removeClass('open'); });
  $(document).on('keydown', function (e) { if (e.key === 'Escape') $('#modal').removeClass('open'); });
  $('#mForm').on('submit', function (e) {
    e.preventDefault(); var n = $.trim($('#mName').val()), s = parseInt($('#mStock').val(), 10), m = parseInt($('#mMin').val(), 10), u = $.trim($('#mUnit').val());
    if (!n || isNaN(s) || s < 0 || isNaN(m) || m < 1 || !u) return $('#mMsg').addClass('bad').text('Completa todos los campos con valores válidos.');
    var pre = $('#mCat').val().slice(0, 2).toUpperCase() + '-' + (900 + items.length);
    items.push({sku: pre, name: n, cat: $('#mCat').val(), stock: s, min: m, unit: u});
    addLog('Nuevo producto · ' + n); toast('Producto agregado', 'ok'); this.reset(); $('#mMsg').removeClass('bad').text(''); $('#modal').removeClass('open'); render();
  });
  setInterval(function () { $('#updated').text('Actualizado: ' + new Date().toLocaleTimeString('es-BO')); }, 1000);
  render();
});
