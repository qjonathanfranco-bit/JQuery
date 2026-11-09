/* Plugin jQuery: carrusel con flechas, puntos, autoplay, swipe y teclado */
$.fn.carousel = function (o) {
  o = $.extend({perView: 1, delay: 4500}, o);
  return this.each(function () {
    var $c = $(this), i = 0, pv = 1, n = 0, timer, x0 = null;
    $c.attr({tabindex: 0}).html('<div class="car-track"></div><button class="car-btn prev" aria-label="Anterior">‹</button><button class="car-btn next" aria-label="Siguiente">›</button><div class="car-dots"></div>');
    var $t = $c.find('.car-track'), $d = $c.find('.car-dots');
    function max() { return Math.max(0, n - pv); }
    function draw() {
      pv = window.innerWidth < 760 ? 1 : o.perView; n = $t.children().length; if (i > max()) i = 0;
      $t.children().css('flex', '0 0 ' + 100 / pv + '%'); $t.css('transform', 'translateX(-' + i * 100 / pv + '%)');
      $d.html(new Array(max() + 2).join('<i></i>')).children().eq(i).addClass('on');
      $c.toggleClass('single', max() === 0);
    }
    function go(k) { i = k > max() ? 0 : k < 0 ? max() : k; draw(); }
    function play() { clearInterval(timer); if (o.delay) timer = setInterval(function () { go(i + 1); }, o.delay); }
    $c.on('click', '.next', function () { go(i + 1); play(); }).on('click', '.prev', function () { go(i - 1); play(); })
      .on('click', '.car-dots i', function () { go($(this).index()); play(); })
      .on('mouseenter focusin', function () { clearInterval(timer); }).on('mouseleave focusout', play)
      .on('keydown', function (e) { if (e.key === 'ArrowRight') go(i + 1); if (e.key === 'ArrowLeft') go(i - 1); })
      .on('touchstart', function (e) { x0 = e.originalEvent.touches[0].clientX; })
      .on('touchend', function (e) { if (x0 === null) return; var d = e.originalEvent.changedTouches[0].clientX - x0; if (Math.abs(d) > 40) go(i + (d < 0 ? 1 : -1)); x0 = null; });
    $(window).on('resize', draw);
    $c.data('set', function (html) { $t.html(html); draw(); });
    if (o.html) $c.data('set')(o.html); play();
  });
};
