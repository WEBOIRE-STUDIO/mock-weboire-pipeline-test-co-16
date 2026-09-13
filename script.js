// WEBOIRE STUDIO demo — minimal vanilla JS, no external libraries, no network calls.
(function () {
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 780px)').matches;

  // ---- Mobile-safe nav ----
  var toggle = document.getElementById('navToggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  }

  // ---- Scroll-triggered reveals (sections, images, masked headings) ----
  // Whole sections/hero get the .reveal treatment even though the markup
  // doesn't bake it in; many inner elements (subheads, cards, images) ship
  // with .reveal already in the server-rendered HTML. Both groups must be
  // observed — querying `.reveal` again AFTER adding the class to
  // sections/hero catches everything in one set, since it's the same class.
  document.querySelectorAll('.section, .hero').forEach(function (el) { el.classList.add('reveal'); });
  var revealEls = document.querySelectorAll('.reveal');

  // Observe the outer wrapper, not the inner clipped/transformed element —
  // see the CSS comment above .reveal-mask: a self-clipped target can never
  // register as "intersecting" with IntersectionObserver.
  var maskWrappers = document.querySelectorAll('.reveal-mask');
  var clipImages = document.querySelectorAll('.img-clip-reveal');

  var allObserved = [].concat(
    Array.prototype.slice.call(revealEls),
    Array.prototype.slice.call(maskWrappers),
    Array.prototype.slice.call(clipImages)
  );

  if (!reducedMotion && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    allObserved.forEach(function (el) { observer.observe(el); });
  } else {
    allObserved.forEach(function (el) { el.classList.add('in-view'); });
  }

  // ---- Subtle parallax on hero media (desktop only, skipped for reduced motion) ----
  if (!reducedMotion && !isMobile) {
    var parallaxEl = document.querySelector('.hero-bg-img, .hero-visual-img');
    if (parallaxEl) {
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          var offset = Math.min(window.scrollY * 0.15, 80);
          parallaxEl.style.transform = 'translateY(' + offset + 'px) scale(1.08)';
          ticking = false;
        });
      }, { passive: true });
    }
  }
})();
