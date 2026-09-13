// WEBOIRE STUDIO demo — motion system. Visibility detection always uses
// IntersectionObserver (reflow-proof by design — it re-evaluates dynamically
// as the page loads/resizes, unlike a library that pre-computes pixel scroll
// offsets, which can go stale when web fonts or lazy images reflow the page
// after initial paint). GSAP is used only for the actual tween/animation
// once an element is confirmed visible, when available — falling back to
// plain CSS transitions (already baked into base.css) otherwise. This keeps
// the motion premium without making it fragile.
(function () {
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 780px)').matches;
  var hasGsap = !reducedMotion && typeof window.gsap !== 'undefined';

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

  // ---- Sticky nav: shrink/solidify after a small scroll ----
  var nav = document.querySelector('.site-nav');
  if (nav) {
    var setNavState = function () { nav.classList.toggle('nav-scrolled', window.scrollY > 24); };
    setNavState();
    window.addEventListener('scroll', setNavState, { passive: true });
  }

  // ---- Scroll-triggered reveals (sections, images, masked headings) ----
  document.querySelectorAll('.section, .hero').forEach(function (el) { el.classList.add('reveal'); });
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var maskWrappers = Array.prototype.slice.call(document.querySelectorAll('.reveal-mask'));
  var clipImages = Array.prototype.slice.call(document.querySelectorAll('.img-clip-reveal'));
  var staggerGroups = Array.prototype.slice.call(
    document.querySelectorAll('.bento-grid, .stats-band, .value-grid, .service-grid')
  ).filter(function (el) { return el.querySelector('.stagger-child'); });
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-counter-to]'));

  function animateIn(el) {
    if (!hasGsap) { el.classList.add('in-view'); return; }
    // GSAP takes over from here — the CSS .reveal/.reveal-mask/.img-clip-reveal
    // hidden states still define the STARTING point (opacity/transform), GSAP
    // just animates to the resting state with nicer easing than a CSS transition.
    el.classList.add('in-view', 'gsap-driven');
    if (el.classList.contains('reveal-mask')) {
      window.gsap.to(el.querySelector('span'), { y: 0, duration: 0.8, ease: 'power3.out' });
    } else if (el.classList.contains('img-clip-reveal')) {
      window.gsap.to(el, { opacity: 1, scale: 1, duration: 1, ease: 'power2.out' });
    } else {
      window.gsap.to(el, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' });
    }
  }

  function animateStaggerGroup(group) {
    var children = Array.prototype.slice.call(group.querySelectorAll('.stagger-child'));
    if (!hasGsap) { children.forEach(function (c) { c.classList.add('in-view'); }); return; }
    window.gsap.to(children, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.08 });
  }

  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-counter-to'));
    var suffix = (el.textContent.match(/[^\d]+$/) || [''])[0];
    if (!isFinite(target)) return;
    if (!hasGsap) { el.textContent = target + suffix; return; }
    var obj = { val: 0 };
    window.gsap.to(obj, {
      val: target, duration: 1.4, ease: 'power1.out',
      onUpdate: function () { el.textContent = Math.round(obj.val) + suffix; },
    });
  }

  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealEls.concat(maskWrappers, clipImages).forEach(function (el) { el.classList.add('in-view'); });
    staggerGroups.forEach(function (group) {
      group.querySelectorAll('.stagger-child').forEach(function (c) { c.classList.add('in-view'); });
    });
    counters.forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-counter-to'));
      var suffix = (el.textContent.match(/[^\d]+$/) || [''])[0];
      if (isFinite(target)) el.textContent = target + suffix;
    });
  } else {
    var makeObserver = function (onEnter, threshold) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { onEnter(entry.target); observer.unobserve(entry.target); }
        });
      }, { threshold: threshold || 0.12 });
      return observer;
    };

    var elObserver = makeObserver(animateIn);
    revealEls.concat(maskWrappers, clipImages).forEach(function (el) { elObserver.observe(el); });

    var groupObserver = makeObserver(animateStaggerGroup, 0.15);
    staggerGroups.forEach(function (group) { groupObserver.observe(group); });

    var counterObserver = makeObserver(animateCounter, 0.4);
    counters.forEach(function (el) { counterObserver.observe(el); });
  }

  // ---- Parallax on hero media (desktop only, plain scroll-linked transform —
  // deliberately not scroll-position-cached, so it can't go stale on reflow) ----
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
