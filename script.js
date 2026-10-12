/* Scroll micro-interaction:
   - the arrow travels down the page with your scroll,
   - touches down at the top of the Work section (squash + fade),
   - the project cards rise in one by one,
   - "Work" lights up in the nav while you are in that section. */
(function () {
  var arrow = document.querySelector('.scroll-arrow');
  var work = document.getElementById('work');
  var nav = document.querySelector('.nav');
  var workLink = document.querySelector('[data-nav="work"]');
  var cards = document.querySelectorAll('.card');
  if (!work) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Position of an element from the top of the page (ignores CSS transforms)
  function pageTop(el) {
    var y = 0;
    while (el) { y += el.offsetTop; el = el.offsetParent; }
    return y;
  }

  var endScroll = 0;   // scroll position where Work reaches the bottom of the nav
  var travel = 0;      // how far the arrow has to move to land on Work

  function measure() {
    var navH = nav ? nav.offsetHeight : 80;
    var workTop = pageTop(work);
    endScroll = Math.max(1, workTop - navH);
    if (arrow) {
      // Land just above the first row of cards
      travel = (workTop + 12) - pageTop(arrow);
    }
  }

  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }

  var ticking = false;
  function update() {
    ticking = false;
    var y = window.scrollY;
    if (typeof y !== 'number') y = window.pageYOffset || 0;

    // 1. Arrow flight + landing
    if (arrow && !reduceMotion) {
      var p = clamp(y / endScroll, 0, 1);
      // ease-in-out so it speeds up in the middle and settles at the end
      var eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      arrow.style.transform = 'translateY(' + (eased * travel).toFixed(1) + 'px)';
      arrow.classList.toggle('is-landed', p >= 0.985);
    }

    // 2. Active nav item
    if (workLink) {
      var top = work.getBoundingClientRect().top;
      workLink.classList.toggle('is-active', top <= window.innerHeight * 0.45);
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  // 3. Cards rise in as the Work section comes into view
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    cards.forEach(function (c) { io.observe(c); });
  } else {
    cards.forEach(function (c) { c.classList.add('is-in'); });
  }

  measure();
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { measure(); update(); });
  window.addEventListener('load', function () { measure(); update(); });
})();
