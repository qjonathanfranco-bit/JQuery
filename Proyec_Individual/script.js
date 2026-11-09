/* INVENTORYLAB · lógica global jQuery */
$(function () {
  var $nav = $('#nav');
  $(window).on('scroll', function () { $nav.toggleClass('scrolled', $(this).scrollTop() > 20); }).trigger('scroll');

  // Menú hamburguesa
  $('#burger').on('click', function () { $('#menu').toggleClass('open'); $(this).find('i').toggleClass('fa-bars fa-xmark'); });

  // Scroll suave
  $('a[href^="#"]').on('click', function (e) {
    var h = $(this).attr('href'); if (h.length < 2 || !$(h).length) return;
    e.preventDefault(); $('#menu').removeClass('open');
    $('html,body').animate({scrollTop: $(h).offset().top - 70}, 600);
  });

  // Efecto 3D con el mouse
  $('.tilt').on('mousemove', function (e) {
    var o = this.getBoundingClientRect(), x = (e.clientX - o.left) / o.width - .5, y = (e.clientY - o.top) / o.height - .5;
    $(this).css('transform', 'perspective(900px) rotateY(' + x * 14 + 'deg) rotateX(' + -y * 14 + 'deg)');
  }).on('mouseleave', function () { $(this).css('transform', ''); });

  // Carrusel
  $('.car').each(function () {
    var $c = $(this), $t = $c.find('.car-t'), i = 0, pv = 1, n = $t.children().length, timer;
    $c.append('<button class="car-b p" aria-label="Anterior"><i class="fa-solid fa-chevron-left"></i></button><button class="car-b n" aria-label="Siguiente"><i class="fa-solid fa-chevron-right"></i></button><div class="car-d"></div>');
    function max() { return Math.max(0, n - pv); }
    function draw() {
      pv = window.innerWidth < 760 ? 1 : 2; if (i > max()) i = 0;
      $t.children().css('flex', '0 0 ' + 100 / pv + '%'); $t.css('transform', 'translateX(-' + i * 100 / pv + '%)');
      $c.find('.car-d').html(new Array(max() + 2).join('<i></i>')).children().eq(i).addClass('on');
    }
    function go(k) { i = k > max() ? 0 : k < 0 ? max() : k; draw(); }
    function play() { clearInterval(timer); timer = setInterval(function () { go(i + 1); }, 4500); }
    $c.on('click', '.n', function () { go(i + 1); play(); }).on('click', '.p', function () { go(i - 1); play(); })
      .on('click', '.car-d i', function () { go($(this).index()); play(); }).on('mouseenter', function () { clearInterval(timer); }).on('mouseleave', play);
    $(window).on('resize', draw); draw(); play();
  });

  // Formulario de contacto (sin alert)
  $('#contactForm').on('submit', function (e) {
    e.preventDefault();
    var ok = true, re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, $f = this;
    $('#cName,#cMail,#cMsg').each(function () {
      var v = $.trim(this.value), bad = !v || (this.id === 'cMail' && !re.test(v)); $(this).toggleClass('bad', bad); if (bad) ok = false;
    });
    var $fb = $('#fb').removeClass('ok er');
    if (!ok) return $fb.addClass('er').html('<i class="fa-solid fa-circle-exclamation"></i> Completa tu nombre, un correo válido y el mensaje.');
    var $b = $('#cBtn').prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> Enviando…');
    setTimeout(function () {
      $b.prop('disabled', false).html('Enviar mensaje <i class="fa-solid fa-paper-plane"></i>'); $f.reset();
      $fb.addClass('ok').html('<i class="fa-solid fa-circle-check"></i> Mensaje enviado. Te responderé en menos de 24 horas.');
    }, 900);
  });

  // ---- Sistemas de inventario ----
  var $rows = $('#inv tbody tr');
  if ($rows.length) {
    var value = 0;
    $rows.each(function () {
      var $r = $(this), low = +$r.data('qty') <= +$r.data('min');
      $r.toggleClass('is-low', low).find('.badge').addClass(low ? 'low' : 'ok')
        .html('<i class="fa-solid ' + (low ? 'fa-triangle-exclamation' : 'fa-circle-check') + '"></i> ' + (low ? 'Stock Bajo' : 'Normal'));
      value += +$r.data('qty') * parseFloat(String($r.data('price')).replace(/,/g, ''));
    });
    $('#total').text('Bs ' + value.toLocaleString('es-BO', {minimumFractionDigits: 2, maximumFractionDigits: 2}));
    // Métricas: all | low | unit:kg | count:Cat | Categoría
    $('.metric').each(function () {
      var $m = $(this), k = String($m.data('metric')), v = 0;
      $rows.each(function () {
        var $r = $(this), q = +$r.data('qty');
        if (k === 'low') v += $r.hasClass('is-low') ? 1 : 0;
        else if (k === 'count:all') v += 1;
        else if (k.indexOf('count:') === 0) v += $r.data('cat') === k.slice(6) ? 1 : 0;
        else if (k.indexOf('unit:') === 0) v += $r.data('unit') === k.slice(5) ? q : 0;
        else v += $r.data('cat') === k ? q : 0;
      });
      $({n: 0}).animate({n: v}, {duration: 900, step: function (x) { $m.find('b').text(Math.round(x)); }, complete: function () { $m.find('b').text(v); }});
    });
    // Buscador en tiempo real
    $('#q').on('input', function () {
      var t = $.trim(this.value).toLowerCase(), n = 0;
      $rows.each(function () { var ok = $(this).text().toLowerCase().indexOf(t) > -1; $(this).toggle(ok); if (ok) n++; });
      $('#empty').toggle(n === 0); $('#count').text(n);
    });
  }
});
