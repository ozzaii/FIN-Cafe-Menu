/* fin Cafe — lakeside menu. External file (graceful: .js gates reveal so content
   shows even if this never loads). Auto-detects language, supports TR/EN/AR + RTL. */
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* ---------- language (auto-detect + manual toggle, RTL for Arabic) ---------- */
  var buttons = document.querySelectorAll('.lang button');
  function setLang(l) {
    root.lang = l;
    root.dir = (l === 'ar') ? 'rtl' : 'ltr';
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.lang === l ? 'true' : 'false'); });
    try { localStorage.setItem('fincafe-lang', l); } catch (e) {}
  }
  function detect() {
    var langs = navigator.languages || [navigator.language || 'tr'];
    for (var i = 0; i < langs.length; i++) {
      var l = (langs[i] || '').toLowerCase();
      if (l.indexOf('tr') === 0) return 'tr';
      if (l.indexOf('ar') === 0) return 'ar';
      if (l.indexOf('en') === 0) return 'en';
    }
    return 'en';
  }
  var saved = null;
  try { saved = localStorage.getItem('fincafe-lang'); } catch (e) {}
  setLang((saved === 'tr' || saved === 'en' || saved === 'ar') ? saved : detect());
  buttons.forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang); }); });

  /* ---------- scroll reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { ro.observe(el); });
  }

  /* ---------- sticky category nav ---------- */
  var catnav = document.querySelector('.catnav');
  var hero = document.querySelector('.hero');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.catnav a'));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  navLinks.forEach(function (a) {
    a.addEventListener('click', function (ev) {
      var target = document.querySelector(a.getAttribute('href'));
      if (target) {
        ev.preventDefault();
        var y = target.getBoundingClientRect().top + window.scrollY - 52;
        window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      }
    });
  });
  if ('IntersectionObserver' in window && sections.length) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          var id = e.target.id;
          navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + id); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { if (s) so.observe(s); });
  }

  /* ---------- atmosphere: day cycle, arcing sun, parallax, progress ---------- */
  var bar = document.querySelector('.progress');
  var haze = document.querySelector('.atmos .haze');
  var celest = document.querySelector('.celest');
  var ridges = Array.prototype.slice.call(document.querySelectorAll('.scene path'));
  var BG = [[0, [233,236,233]], [0.45, [244,234,217]], [1, [236,214,189]]];
  var HZ = [[0, [150,170,185,0.30]], [0.4, [205,198,182,0.04]], [1, [214,150,92,0.17]]];
  var SUN = [[0, [246,236,202]], [0.5, [255,242,188]], [1, [236,150,92]]];
  function ramp(stops, t) {
    for (var i = 0; i < stops.length - 1; i++) {
      var a = stops[i], b = stops[i + 1];
      if (t <= b[0]) {
        var lt = (t - a[0]) / (b[0] - a[0]); var out = [];
        for (var k = 0; k < a[1].length; k++) out.push(lerp(a[1][k], b[1][k], lt));
        return out;
      }
    }
    return stops[stops.length - 1][1].slice();
  }
  var rgb = function (c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; };
  var rgba = function (c) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + c[3].toFixed(3) + ')'; };
  var vh = window.innerHeight, vw = window.innerWidth;
  function applyDay(t, sy) {
    document.body.style.setProperty('--bg', rgb(ramp(BG, t)));
    if (haze) haze.style.background = rgba(ramp(HZ, t));
    if (bar) bar.style.transform = 'scaleX(' + t + ')';
    if (celest) {
      var x = lerp(vw * 0.08, vw * 0.9, t);
      var y = vh * 0.17 - Math.sin(t * Math.PI) * vh * 0.12;
      celest.style.transform = 'translate(' + (x - 65) + 'px,' + (y - 65) + 'px)';
      var c = ramp(SUN, t);
      celest.style.background = 'radial-gradient(circle at 50% 50%,rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',.95),rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',.45) 42%, transparent 70%)';
    }
    if (!reduce) for (var i = 0; i < ridges.length; i++) ridges[i].style.transform = 'translateY(' + (sy * (6 + i * 7) * 0.012) + 'px)';
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var sy = window.scrollY || 0, max = document.documentElement.scrollHeight - vh;
      var t = max > 0 ? clamp(sy / max, 0, 1) : 0;
      applyDay(t, sy);
      if (catnav && hero) catnav.classList.toggle('show', sy > hero.offsetHeight * 0.62);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { vh = window.innerHeight; vw = window.innerWidth; onScroll(); });
  onScroll();

  /* ---------- rising lake mist (canvas) ---------- */
  var canvas = document.querySelector('canvas.mist');
  if (canvas && !reduce) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, motes = [], raf = null, running = true;
    var COUNT = window.innerWidth < 640 ? 9 : 16;
    function size() {
      var r = hero.getBoundingClientRect(); W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function rnd(a, b) { return a + (b - a) * Math.random(); }
    function spawn(init) { return { x: rnd(0, W), y: init ? rnd(H * 0.4, H) : rnd(H * 0.86, H * 1.05), r: rnd(46, 120), vx: rnd(-0.12, 0.12), vy: rnd(-0.28, -0.10), a: 0, am: rnd(0.05, 0.16) }; }
    function reset() { motes = []; for (var i = 0; i < COUNT; i++) motes.push(spawn(true)); }
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i]; m.x += m.vx; m.y += m.vy;
        var lifeY = clamp((H - m.y) / H, 0, 1); m.a = m.am * Math.sin(lifeY * Math.PI);
        if (m.y + m.r < 0) { motes[i] = spawn(false); continue; }
        var g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
        g.addColorStop(0, 'rgba(247,243,234,' + m.a.toFixed(3) + ')'); g.addColorStop(1, 'rgba(247,243,234,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    size(); reset(); frame();
    window.addEventListener('resize', function () { size(); reset(); });
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running && !raf) frame(); else if (!running && raf) { cancelAnimationFrame(raf); raf = null; }
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting && !document.hidden) { if (!raf) { running = true; frame(); } }
        else if (raf) { running = false; cancelAnimationFrame(raf); raf = null; }
      }, { threshold: 0 }).observe(hero);
    }
  }
});
