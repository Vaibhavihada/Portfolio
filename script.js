/* Portfolio: routing, scroll effects, slider, sunflower cursor.
   Everything lives on one page: #home (hero, work, about, blogs) and
   four case-study views opened with links like #/sense-shift. */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var nav = document.querySelector('.nav');
  var arrow = document.querySelector('.scroll-arrow');
  var work = document.getElementById('work');
  var about = document.getElementById('about');
  var blogs = document.getElementById('blogs');
  var navLinks = {
    work: document.querySelector('[data-nav="work"]'),
    about: document.querySelector('[data-nav="about"]'),
    blogs: document.querySelector('[data-nav="blogs"]')
  };

  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
  function pageTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
  function isHome() { return !body.classList.contains('is-case'); }

  /* ================= 1. View routing =================
     #/sense-shift  -> work-1     #/iitd           -> work-2
     #/nma          -> work-3     #/campus-travel  -> work-4
     anything else  -> home view, scrolled to that section */
  var savedY = 0;

  function route() {
    var hash = window.location.hash;
    var m = hash.match(/^#\/([\w-]+)/);
    var target = m && document.getElementById('case-' + m[1]);
    var open = document.querySelector('.case.is-open');

    if (target) {
      if (isHome()) savedY = window.scrollY;
      if (open) open.classList.remove('is-open');
      target.classList.add('is-open');
      body.classList.add('is-case');
      setActive(null);
      window.scrollTo({ top: 0, behavior: 'instant' });
      var imgs = target.querySelectorAll('img[data-reveal]');
      observeReveals(imgs);
      measure(); update();
      return;
    }

    var wasCase = !isHome();
    if (open) open.classList.remove('is-open');
    body.classList.remove('is-case');
    measure();

    if (wasCase) {
      var id = hash.replace('#', '');
      var el = id && document.getElementById(id);
      if (id === 'work' && savedY) {
        window.scrollTo({ top: savedY, behavior: 'instant' });   // back to where you were
      } else if (el) {
        window.scrollTo({ top: Math.max(0, pageTop(el) - nav.offsetHeight), behavior: 'instant' });
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
    update();
  }

  /* ================= 2. Active nav + arrow flight ================= */
  function setActive(key) {
    Object.keys(navLinks).forEach(function (k) {
      if (navLinks[k]) navLinks[k].classList.toggle('is-active', k === key);
    });
  }

  var endScroll = 1, travel = 0;
  function measure() {
    if (!isHome() || !work) return;
    var navH = nav ? nav.offsetHeight : 80;
    var workTop = pageTop(work);
    endScroll = Math.max(1, workTop - navH);
    if (arrow) travel = (workTop + 12) - pageTop(arrow);
  }

  var ticking = false;
  function update() {
    ticking = false;

    // reading progress bar
    var progress = document.querySelector('.progress');
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? clamp(window.scrollY / max, 0, 1) : 0) + ')';
    }
    if (!isHome()) return;

    // arrow travels down with the scroll and lands on Work
    if (arrow && !reduce) {
      var p = clamp(window.scrollY / endScroll, 0, 1);
      var eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      arrow.style.transform = 'translateY(' + (eased * travel).toFixed(1) + 'px)';
      arrow.classList.toggle('is-landed', p >= 0.985);
    }

    // scroll-spy: highlight the section in view
    var line = window.innerHeight * 0.45, key = null;
    [['work', work], ['about', about], ['blogs', blogs]].forEach(function (s) {
      if (s[1] && s[1].getBoundingClientRect().top <= line) key = s[0];
    });
    setActive(key);
  }
  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }

  /* ================= 3. Reveal on scroll ================= */
  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
  }
  function observeReveals(list) {
    Array.prototype.forEach.call(list, function (el) {
      if (el.classList.contains('is-in')) return;
      if (io) io.observe(el); else el.classList.add('is-in');
    });
  }
  observeReveals(document.querySelectorAll('.card, #home [data-reveal]'));

  /* ================= 4. Horizontal slider (Work) ================= */
  var slider = document.querySelector('[data-slider]');
  if (slider) {
    var track = slider.querySelector('.slider__track');
    var prev = slider.querySelector('[data-prev]');
    var next = slider.querySelector('[data-next]');
    var bar = slider.querySelector('.slider__bar span');

    var step = function () {
      var card = track.querySelector('.card');
      var gap = parseFloat(getComputedStyle(track).columnGap) || 40;
      return card.offsetWidth + gap;
    };
    var sync = function () {
      var max = track.scrollWidth - track.clientWidth;
      var pct = max > 0 ? track.scrollLeft / max : 1;
      var w = Math.max(15, (track.clientWidth / track.scrollWidth) * 100);
      bar.style.width = w + '%';
      bar.style.transform = 'translateX(' + (pct * (10000 / w - 100)) + '%)';
      prev.disabled = track.scrollLeft < 4;
      next.disabled = track.scrollLeft > max - 4;
    };
    prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    track.addEventListener('scroll', function () { requestAnimationFrame(sync); }, { passive: true });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') next.click();
      if (e.key === 'ArrowLeft') prev.click();
    });
    window.addEventListener('resize', sync);

    // drag with the mouse
    var down = false, startX = 0, startLeft = 0, moved = 0;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = 0; startX = e.clientX; startLeft = track.scrollLeft;
      track.classList.add('is-drag');
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      track.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false; track.classList.remove('is-drag');
    });
    track.addEventListener('click', function (e) {          // a drag is not a click
      if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; }
    }, true);

    // cards tilt toward the mouse
    if (fine && !reduce) {
      track.querySelectorAll('.card').forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
          var r = card.getBoundingClientRect();
          card.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 8).toFixed(2) + 'deg');
          card.style.setProperty('--rx', (-((e.clientY - r.top) / r.height - 0.5) * 8).toFixed(2) + 'deg');
        });
        card.addEventListener('mouseleave', function () {
          card.style.setProperty('--ry', '0deg');
          card.style.setProperty('--rx', '0deg');
        });
      });
    }
    sync();
    window.addEventListener('load', sync);
  }

  /* ================= 5. Sunflower cursor ================= */
  var cursor = document.querySelector('.cursor');
  if (fine && cursor) {
    root.classList.add('has-cursor');
    var flower = cursor.querySelector('.cursor__flower');

    var petals = '';
    for (var i = 0; i < 12; i++) {
      petals += '<ellipse cx="0" cy="-30" rx="9" ry="19" fill="' + (i % 2 ? '#f4b400' : '#ffc928') +
                '" transform="rotate(' + i * 30 + ')"/>';
    }
    flower.innerHTML =
      '<svg viewBox="-50 -50 100 100"><g class="spin">' + petals +
      '<circle r="17" fill="#5b3a1a"/><circle r="11" fill="#7a4a1e"/>' +
      '<circle r="4" cx="-4" cy="-3" fill="#3d2410"/><circle r="3" cx="5" cy="4" fill="#3d2410"/></g></svg>';
    var spin = flower.querySelector('.spin');

    var x = window.innerWidth / 2, y = window.innerHeight / 2, tx = x, ty = y, rot = 0;
    window.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; cursor.classList.add('is-on'); });
    document.addEventListener('mouseleave', function () { cursor.classList.remove('is-on'); });
    document.addEventListener('mouseenter', function () { cursor.classList.add('is-on'); });

    (function loop() {
      var dx = tx - x, dy = ty - y;
      x += dx * 0.25; y += dy * 0.25;
      if (!reduce) rot += 0.4 + Math.min(8, Math.hypot(dx, dy) * 0.15);   // spins faster when you move faster
      cursor.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      spin.setAttribute('transform', 'rotate(' + rot.toFixed(1) + ')');
      requestAnimationFrame(loop);
    })();

    document.addEventListener('mouseover', function (e) {
      cursor.classList.toggle('is-hover', !!e.target.closest('a, button, .card'));
    });
    window.addEventListener('mousedown', function (e) {
      cursor.classList.add('is-down');
      if (reduce) return;
      for (var i = 0; i < 7; i++) {                                   // petal burst on click
        var p = document.createElement('span');
        var a = (Math.PI * 2 * i) / 7 + Math.random() * 0.5, d = 40 + Math.random() * 30;
        p.className = 'petal-burst';
        p.style.left = e.clientX + 'px'; p.style.top = e.clientY + 'px';
        p.style.setProperty('--dx', Math.cos(a) * d + 'px');
        p.style.setProperty('--dy', Math.sin(a) * d + 'px');
        p.style.setProperty('--r', Math.random() * 360 + 'deg');
        p.addEventListener('animationend', function () { this.remove(); });
        document.body.appendChild(p);
      }
    });
    window.addEventListener('mouseup', function () { cursor.classList.remove('is-down'); });
  }

  /* ================= 6. Magnetic nav links ================= */
  if (fine && !reduce) {
    document.querySelectorAll('.nav__links a').forEach(function (a) {
      a.addEventListener('mousemove', function (e) {
        var r = a.getBoundingClientRect();
        a.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.2) + 'px,' +
                                           ((e.clientY - r.top - r.height / 2) * 0.2) + 'px)';
      });
      a.addEventListener('mouseleave', function () { a.style.transform = ''; });
    });
  }

  /* ================= 7. Sunflower thread stitches itself (About) ================= */
  var thread = document.querySelector('.beyond__thread');
  if (thread) {
    var tPath = thread.querySelector('.tm--all');
    var tImg = thread.querySelector('.thread-img');
    var drawThread = function () {
      if (reduce) return;
      tImg.setAttribute('mask', 'url(#thread-mask)');
      thread.classList.remove('is-drawing');
      void thread.getBoundingClientRect();            // restart the animation
      thread.classList.add('is-drawing');
    };
    tPath.addEventListener('animationend', function () {
      tImg.removeAttribute('mask');                   // finished: show the full artwork
      thread.classList.remove('is-drawing');
    });
    thread.addEventListener('mouseenter', function () {   // hover to watch it stitch again
      if (!thread.classList.contains('is-drawing')) drawThread();
    });
    if (reduce) {
      tImg.removeAttribute('mask');
    } else if ('IntersectionObserver' in window) {
      var tio = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { drawThread(); tio.disconnect(); }
      }, { threshold: 0.5 });
      tio.observe(thread);
    } else {
      tImg.removeAttribute('mask');
    }
  }

  /* ================= start ================= */
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { measure(); update(); });
  window.addEventListener('load', function () { measure(); update(); });
  window.addEventListener('hashchange', route);
  route();
})();
