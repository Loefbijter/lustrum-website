(function countdown() {
  var TARGET = new Date('2026-09-08T20:00:00+02:00').getTime();

  var els = {
    days: document.getElementById('cd-days'),
    hours: document.getElementById('cd-hours'),
    minutes: document.getElementById('cd-minutes'),
    seconds: document.getElementById('cd-seconds'),
  };
  var container = document.getElementById('countdown');
  var fallback = document.getElementById('countdown-fallback');

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function tick() {
    var remaining = TARGET - Date.now();

    if (remaining <= 0) {
      container.hidden = true;
      fallback.hidden = false;
      return;
    }

    var totalSeconds = Math.floor(remaining / 1000);
    var days = Math.floor(totalSeconds / 86400);
    var hours = Math.floor((totalSeconds % 86400) / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;

    els.days.textContent = pad(days);
    els.hours.textContent = pad(hours);
    els.minutes.textContent = pad(minutes);
    els.seconds.textContent = pad(seconds);
  }

  tick();
  setInterval(tick, 1000);
})();

(function starfield() {
  var canvas = document.getElementById('starfield');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var wrap = canvas.parentElement;

  var reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = reducedMotionQuery.matches;

  var LAYERS = [
    { count: 60, minSize: 0.5, maxSize: 1.1, minOpacity: 0.15, maxOpacity: 0.35, speed: 0.02 },
    { count: 35, minSize: 1, maxSize: 1.8, minOpacity: 0.3, maxOpacity: 0.55, speed: 0.05 },
    { count: 18, minSize: 1.6, maxSize: 2.6, minOpacity: 0.5, maxOpacity: 0.85, speed: 0.1 },
  ];

  var dpr = 1;
  var width = 0;
  var height = 0;
  var stars = [];
  var scrollY = 0;
  var rafId = null;
  var visible = document.visibilityState === 'visible';
  var starColor = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim() || '#F2F2F2';

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function buildStars() {
    stars = [];
    LAYERS.forEach(function (layer, layerIndex) {
      for (var i = 0; i < layer.count; i++) {
        stars.push({
          layer: layerIndex,
          x: Math.random() * width,
          y: Math.random() * height,
          size: rand(layer.minSize, layer.maxSize),
          opacity: rand(layer.minOpacity, layer.maxOpacity),
          speed: layer.speed,
        });
      }
    });
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = wrap.clientWidth;
    height = wrap.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildStars();
  }

  function drawFrame() {
    ctx.clearRect(0, 0, width, height);
    stars.forEach(function (star) {
      var offset = (scrollY * star.speed) % (height + 40);
      var y = (star.y + offset) % (height + 40);
      if (y < 0) y += height + 40;
      ctx.beginPath();
      ctx.globalAlpha = star.opacity;
      ctx.fillStyle = starColor;
      ctx.arc(star.x, y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function loop() {
    drawFrame();
    rafId = requestAnimationFrame(loop);
  }

  function startLoop() {
    if (reduced || !visible || rafId !== null) return;
    rafId = requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function onScroll() {
    scrollY = window.scrollY;
    if (reduced) drawFrame();
  }

  window.addEventListener('resize', function () {
    resize();
    drawFrame();
  });

  window.addEventListener('scroll', onScroll, { passive: true });

  document.addEventListener('visibilitychange', function () {
    visible = document.visibilityState === 'visible';
    if (visible) startLoop();
    else stopLoop();
  });

  reducedMotionQuery.addEventListener('change', function (e) {
    reduced = e.matches;
    if (reduced) {
      stopLoop();
      drawFrame();
    } else {
      startLoop();
    }
  });

  resize();
  drawFrame();
  if (!reduced) startLoop();
})();

(function scrollReveal() {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;

  var targets = document.querySelectorAll('.hook, .countdown-section, .invitation, footer');
  if (!targets.length) return;

  targets.forEach(function (el) {
    el.classList.add('reveal-pending');
  });

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.remove('reveal-pending');
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach(function (el) {
    observer.observe(el);
  });
})();
