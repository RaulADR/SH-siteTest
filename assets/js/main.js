/* ═══════════════════════════════════════════════════════════
   Soft Hoarders #12560 — Editorial Motion
   1. language   2. text split   3. reveal      4. scroll
   5. spy        6. smooth      7. drawer      8. glass
   9. tilt      10. magnetic   11. cursor     12. parallax
   13. velocity 14. ledger     15. counters   16. bios
   17. results   18. motes     19. rail
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var DICT = window.I18N || { en: {}, ro: {} };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
  }

  /* ─── 1. LANGUAGE ────────────────────────────────────── */
  var current = 'en';
  try { current = localStorage.getItem('sh-lang') || 'en'; } catch (e) {}
  if (!DICT[current]) current = 'en';

  function applyLang(lang) {
    current = DICT[lang] ? lang : 'en';
    var t = DICT[current];
    $$('[data-i18n]').forEach(function (el) {
      var v = t[el.getAttribute('data-i18n')];
      if (typeof v === 'string') el.innerHTML = v;
    });
    document.documentElement.setAttribute('lang', current);
    document.documentElement.setAttribute('data-lang', current);
    $$('.lang__btn').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-lang') === current);
    });
    try { localStorage.setItem('sh-lang', current); } catch (e) {}
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: current } }));
  }

  $$('.lang__btn').forEach(function (btn) {
    btn.addEventListener('click', function () { applyLang(btn.getAttribute('data-lang')); });
  });
  applyLang(current);

  /* ─── 2. TEXT SPLIT (words / lines) ──────────────────── */
  var splitTargets = $$('[data-split]');

  function wordsHTML(text, counter, wrap) {
    var words = String(text).split(/\s+/).filter(Boolean);
    var out = '';
    words.forEach(function (w, i) {
      var d = counter.n; counter.n += 1;
      out += '<span class="' + wrap + '" style="--d:' + d + 'ms"><span class="' + wrap + 'i">' + esc(w) + '</span></span>';
      if (i < words.length - 1) out += ' ';
    });
    return out;
  }

  function splitElement(el) {
    var mode = el.getAttribute('data-split');
    var counter = { n: 0 };
    var childEls = Array.prototype.filter.call(el.children, function (c) { return c.nodeType === 1; });
    var hosts = childEls.length
      ? childEls.map(function (c) { return { host: c, text: c.textContent }; })
      : [{ host: el, text: el.textContent }];

    /* pass 1 — word masks, so the measured layout is the final layout */
    hosts.forEach(function (h) {
      h.host.innerHTML = wordsHTML(h.text, counter, 'sl__w');
    });

    if (mode === 'lines') {
      hosts.forEach(function (h) {
        var ws = Array.prototype.slice.call(h.host.querySelectorAll('.sl__w'));
        var groups = [], lastTop = null;
        ws.forEach(function (w) {
          var top = Math.round(w.offsetTop);
          if (lastTop === null || Math.abs(top - lastTop) > 2) { groups.push([]); lastTop = top; }
          groups[groups.length - 1].push(w.textContent);
        });
        h.host.innerHTML = groups.map(function (g) {
          var d = counter.n; counter.n += 1;
          return '<span class="sl__l" style="--d:' + d + 'ms"><span class="sl__li">' + esc(g.join(' ')) + '</span></span>';
        }).join('');
      });
    }
    el.classList.add('spl');
  }

  function splitAll() {
    splitTargets.forEach(splitElement);
  }
  splitAll();

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(splitAll, 260);
  });

  /* ─── 3. REVEAL ON SCROLL ───────────────────────────── */
  var revealables = $$('.reveal').concat($$('.sechead')).concat($$('.spl'));
  var pendingReveals = [];
  var sweeping = false;
  var sampling = false;
  var maxY = window.scrollY || 0;

  /* Safety net: IntersectionObserver can miss an element when the page is
     flung past it between frames (End key, fast mobile flick, anchor jump),
     which would leave it stuck at opacity:0. We track the deepest scroll
     position reached and reveal everything that has ever been reachable. */
  function sweepReveals() {
    sweeping = false;
    var limit = maxY + window.innerHeight;
    for (var i = pendingReveals.length - 1; i >= 0; i--) {
      var el = pendingReveals[i];
      var r = el.getBoundingClientRect();
      if (r.top + (window.pageYOffset || 0) < limit) {
        el.classList.add('is-in');
        pendingReveals.splice(i, 1);
      }
    }
    if (!pendingReveals.length) {
      window.removeEventListener('scroll', onRevealScroll);
      window.removeEventListener('resize', requestSweep);
    }
  }
  function requestSweep() {
    if (sweeping) return;
    sweeping = true;
    window.requestAnimationFrame(sweepReveals);
  }
  function onRevealScroll() {
    requestSweep();
  }

  /* Sample the scroll position every frame while reveals are outstanding.
     A scroll event only reports the position at the time it is dispatched,
     so a jump down and back inside one frame would otherwise be invisible. */
  function sampleScroll() {
    var y = window.scrollY || 0;
    if (y > maxY) { maxY = y; requestSweep(); }
    if (!pendingReveals.length) { sampling = false; return; }
    if (maxY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
      maxY = document.documentElement.scrollHeight;
      requestSweep();
    }
    window.requestAnimationFrame(sampleScroll);
  }
  function startSampling() {
    if (sampling) return;
    sampling = true;
    window.requestAnimationFrame(sampleScroll);
  }

  if ('IntersectionObserver' in window && !reduce) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          ro.unobserve(e.target);
          var idx = pendingReveals.indexOf(e.target);
          if (idx > -1) pendingReveals.splice(idx, 1);
        }
      });
      requestSweep();
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    revealables.forEach(function (el) { ro.observe(el); pendingReveals.push(el); });
    window.addEventListener('scroll', onRevealScroll, { passive: true });
    window.addEventListener('resize', requestSweep, { passive: true });
    startSampling();
    requestSweep();
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ─── 4. SCROLL PROGRESS + STICKY BAR ──────────────── */
  var bar = $('#scrollBar');
  var topbar = $('#topbar');
  var totop = $('#totop');
  var ticking = false;
  var lastY = window.scrollY || 0;
  var vel = 0;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    if (topbar) topbar.classList.toggle('is-stuck', y > 24);
    if (totop) {
      var show = y > 700;
      totop.hidden = false;
      totop.classList.toggle('is-on', show);
    }
    /* scroll velocity → a little kinetic skew on the masthead */
    if (!reduce) {
      vel = vel * 0.82 + (y - lastY) * 0.18;
      lastY = y;
      document.documentElement.style.setProperty('--vel', vel.toFixed(2));
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (totop) {
    totop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ─── 5. SECTION INDEX RAIL + SPY ───────────────────── */
  var rail = $('#rail');
  var sections = $$('.section').filter(function (s) { return !$('.sechead--minor', s); });
  var sectionIds = sections.map(function (s) { return s.id; });

  if (rail) {
    rail.innerHTML = sections.map(function (s) {
      var num = $('.sechead__num', s);
      var label = $('.sechead__label', s);
      var n = num ? num.textContent.trim() : '';
      var l = label ? label.textContent.trim() : s.id;
      return '<a class="rail__item" href="#' + s.id + '" aria-label="' + esc(l) + '"><i></i><span>' + esc(n) + '</span></a>';
    }).join('');
  }

  var navLinks = $$('.nav a, .rail__item');
  if ('IntersectionObserver' in window && sectionIds.length) {
    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      var activeId = null;
      for (var i = 0; i < sectionIds.length; i++) {
        if (visible[sectionIds[i]]) { activeId = sectionIds[i]; break; }
      }
      if (!activeId) return;
      navLinks.forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + activeId);
      });
    }, { rootMargin: '-38% 0px -58% 0px', threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ─── 6. SMOOTH SCROLL (offset for sticky header) ───── */
  function scrollToTarget(hash) {
    var node = document.querySelector(hash);
    if (!node) return;
    var offset = window.innerWidth < 900 ? 78 : 100;
    var top = node.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href === '#') return;
    var target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    closeDrawer();
    scrollToTarget(href);
    history.replaceState(null, '', href);
  });

  /* ─── 7. MOBILE DRAWER ──────────────────────────────── */
  var burger = $('#burger');
  var drawer = $('#drawer');
  var scrim = $('#scrim');
  var drawerClose = $('#drawerClose');
  var lastFocus = null;

  function openDrawer() {
    lastFocus = document.activeElement;
    drawer.inert = false;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    burger.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    scrim.hidden = false;
    requestAnimationFrame(function () { scrim.classList.add('is-on'); });
    document.body.classList.add('is-locked');
    if (drawerClose) drawerClose.focus();
  }
  function closeDrawer() {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    scrim.classList.remove('is-on');
    document.body.classList.remove('is-locked');
    setTimeout(function () { scrim.hidden = true; }, 400);
    drawer.inert = true;
    if (lastFocus) lastFocus.focus();
  }
  if (burger) burger.addEventListener('click', function () {
    drawer.classList.contains('is-open') ? closeDrawer() : openDrawer();
  });
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (scrim) scrim.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawer();
    if (e.key === 'Tab' && drawer.classList.contains('is-open')) {
      var f = $$('a[href],button:not([disabled])', drawer);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ─── 8. POINTER-TRACKED GLASS SPECULAR ────────────── */
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (canHover && !reduce) {
    $$('.glass').forEach(function (el) {
      var raf = null, mx = 0, my = 0;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        mx = e.clientX - r.left;
        my = e.clientY - r.top;
        if (raf) return;
        raf = requestAnimationFrame(function () {
          el.style.setProperty('--mx', mx + 'px');
          el.style.setProperty('--my', my + 'px');
          raf = null;
        });
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--mx', '50%');
        el.style.setProperty('--my', '0%');
      });
    });
  }

  /* ─── 9. 3D TILT ────────────────────────────────────── */
  if (canHover && !reduce) {
    $$('[data-tilt]').forEach(function (tiltEl) {
      var wrap = tiltEl.parentElement;
      if (!wrap) return;
      wrap.addEventListener('pointermove', function (e) {
        var r = wrap.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        tiltEl.style.transform = 'perspective(1100px) rotateY(' + (px * 7).toFixed(2) +
          'deg) rotateX(' + (-py * 6).toFixed(2) + 'deg) translateZ(0)';
      });
      wrap.addEventListener('pointerleave', function () { tiltEl.style.transform = ''; });
    });
  }

  /* ─── 10. MAGNETIC BUTTONS ───────────────────────────── */
  if (canHover && !reduce) {
    $$('.btn').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.26;
        b.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* ─── 11. LIQUID CURSOR ─────────────────────────────── */
  var cursorEl = $('#cursor');
  if (cursorEl && canHover && !reduce) {
    var cx = -200, cy = -200, tx = -200, ty = -200;
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      cursorEl.classList.add('is-on');
    }, { passive: true });
    window.addEventListener('pointerleave', function () { cursorEl.classList.remove('is-on'); });
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest ? e.target.closest('a,button,[data-cursor="grow"]') : null;
      cursorEl.classList.toggle('is-grow', !!t);
    });
    (function loop() {
      cx += (tx - cx) * 0.15;
      cy += (ty - cy) * 0.15;
      cursorEl.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      requestAnimationFrame(loop);
    })();
  }

  /* ─── 12. SCROLL-LINKED PARALLAX ────────────────────── */
  var parallaxEls = $$('[data-parallax]');
  function updateParallax() {
    var vh = window.innerHeight;
    for (var i = 0; i < parallaxEls.length; i++) {
      var el = parallaxEls[i];
      var r = el.getBoundingClientRect();
      if (r.bottom < -300 || r.top > vh + 300) continue;
      var k = parseFloat(el.getAttribute('data-parallax')) || 0;
      var y = -(r.top + r.height / 2 - vh / 2) * k;
      el.style.setProperty('--py', y.toFixed(1) + 'px');
    }
  }
  if (!reduce && parallaxEls.length) {
    var pxTicking = false;
    window.addEventListener('scroll', function () {
      if (pxTicking) return;
      pxTicking = true;
      requestAnimationFrame(function () { updateParallax(); pxTicking = false; });
    }, { passive: true });
    window.addEventListener('resize', updateParallax, { passive: true });
    updateParallax();
  }

  /* ─── 13. LEDGER ROW POINTER SWEEP ──────────────────── */
  if (canHover) {
    $$('[data-row]').forEach(function (row) {
      row.addEventListener('pointermove', function (e) {
        var r = row.getBoundingClientRect();
        row.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
      });
    });
  }

  /* ─── 14. COUNTERS ──────────────────────────────────── */
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = target + suffix; return; }
    var dur = 1500, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCounter(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(runCounter);
  }

  /* ─── 15. TEAM BIO TOOLTIP + DIALOG ─────────────────── */
  var tip = document.createElement('div');
  tip.className = 'biotip glass';
  tip.setAttribute('aria-hidden', 'true');
  tip.innerHTML = '<div class="biotip__head"><img alt=""><div><h4></h4><p></p></div></div><p class="biotip__text"></p>';
  document.body.appendChild(tip);
  var tipImg = tip.querySelector('img');
  var tipName = tip.querySelector('h4');
  var tipRole = tip.querySelector('p');
  var tipText = tip.querySelector('.biotip__text');
  var tipTimer = null;

  var bio = $('#bio');
  var bioImg = $('#bioImg');
  var bioName = $('#bioName');
  var bioRole = $('#bioRole');
  var bioText = $('#bioText');
  var bioClose = $('#bioClose');

  function bioFor(el) {
    var key = el.getAttribute('data-bio');
    var name = $('.member__name', el);
    var role = $('.member__role', el);
    var img = $('.member__shot img', el);
    return {
      key: key,
      name: name ? name.textContent : '',
      role: role ? role.textContent : '',
      img: img ? img.getAttribute('src') : '',
      alt: img ? img.getAttribute('alt') : ''
    };
  }

  function setImg(el, src, alt) {
    if (!el) return;
    if (src) { el.setAttribute('src', src); el.setAttribute('alt', alt || ''); }
    else { el.removeAttribute('src'); }
  }

  function showTip(el) {
    var d = bioFor(el);
    var text = (DICT[current] || {})[d.key];
    if (!text) return;
    setImg(tipImg, d.img, d.alt);
    tipName.textContent = d.name;
    tipRole.textContent = d.role;
    tipText.textContent = text;
    tip.classList.add('is-on');

    /* place the card in the viewport: prefer above the member, fall back below */
    var r = el.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) { hideTip(); return; }

    var w = tip.offsetWidth;
    var h = tip.offsetHeight;
    var margin = 12;

    var left = Math.min(Math.max(r.left + r.width / 2 - w / 2, margin), window.innerWidth - w - margin);
    var top = r.top - h - 14;
    if (top < margin) top = Math.min(r.bottom + 14, window.innerHeight - h - margin);
    if (top < margin) top = margin;

    tip.style.left = Math.round(left) + 'px';
    tip.style.top = Math.round(top) + 'px';
  }
  function hideTip() {
    tip.classList.remove('is-on');
    tip.setAttribute('aria-hidden', 'true');
  }

  function openDialog(el) {
    var d = bioFor(el);
    var text = (DICT[current] || {})[d.key];
    if (!text) return;
    hideTip();
    setImg(bioImg, d.img, d.alt);
    bioName.textContent = d.name;
    bioRole.textContent = d.role;
    bioText.textContent = text;
    bio.hidden = false;
    requestAnimationFrame(function () { bio.classList.add('is-on'); });
    document.body.classList.add('is-locked');
    if (bioClose) bioClose.focus();
  }
  function closeDialog() {
    bio.classList.remove('is-on');
    document.body.classList.remove('is-locked');
    setTimeout(function () { bio.hidden = true; }, 300);
  }
  if (bioClose) bioClose.addEventListener('click', closeDialog);
  if (bio) bio.addEventListener('click', function (e) { if (e.target === bio) closeDialog(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && bio && !bio.hidden) closeDialog();
  });

  $$('.member').forEach(function (m) {
    if (canHover) {
      m.addEventListener('mouseenter', function () {
        clearTimeout(tipTimer);
        tipTimer = setTimeout(function () { showTip(m); }, 220);
      });
      m.addEventListener('mouseleave', function () {
        clearTimeout(tipTimer);
        hideTip();
      });
    }
    m.addEventListener('click', function () { openDialog(m); });
    m.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDialog(m); }
    });
    m.addEventListener('focus', function () { showTip(m); });
    m.addEventListener('blur', hideTip);
  });
  window.addEventListener('scroll', hideTip, { passive: true });

  /* ─── 16. LIVE RESULTS (FTC Scout) ──────────────────── */
  var grid = $('#resultsGrid');
  var fallback = $('#resultsFallback');

  function t(key, fb) {
    var v = (DICT[current] || {})[key];
    return typeof v === 'string' ? v : (fb || key);
  }

  var QUERY =
    '{ a: teamByNumber(number: 12560) { events(season: 2025) { eventCode event { name start end location { city state country } } stats { ... on TeamEventStats2025 { opr { totalPointsNp } rank wins losses ties qualMatchesPlayed } } } } ' +
    'b: teamByNumber(number: 12560) { events(season: 2026) { eventCode event { name start end location { city state country } } stats { ... on TeamEventStats2026 { opr { totalPointsNp } rank wins losses ties qualMatchesPlayed } } } } }';

  /* Six shimmering placeholders hold the grid's height while the request is
     in flight, so the sections below do not jump when the cards arrive. */
  function renderSkeletons() {
    if (!grid) return;
    var card = '<article class="result result--skeleton" aria-hidden="true">' +
      '<div class="result__head"><div class="result__sk-head"><span class="sk sk--title"></span>' +
        '<span class="sk sk--meta"></span><span class="sk sk--meta sk--meta2"></span></div><span class="sk sk--rank"></span></div>' +
      '<div class="result__grid">' +
        '<div class="result__cell"><span class="sk sk--num"></span><span class="sk sk--lbl"></span></div>' +
        '<div class="result__cell"><span class="sk sk--num"></span><span class="sk sk--lbl"></span></div>' +
        '<div class="result__cell"><span class="sk sk--num"></span><span class="sk sk--lbl"></span></div>' +
      '</div>' +
      '<div class="result__wlt"><span class="sk sk--wlt"></span><span class="sk sk--wlt"></span><span class="sk sk--wlt"></span></div>' +
      '<div class="result__opr"><span class="sk sk--lbl"></span><i class="sk sk--bar"></i></div>' +
      '<span class="sk sk--link"></span>' +
      '</article>';
    var out = '';
    for (var i = 0; i < 6; i++) out += card;
    grid.innerHTML = out;
  }


  function renderResults(events) {
    if (!events.length) throw new Error('empty');
    window.__shResults = events;

    var maxOpr = events.reduce(function (m, e) {
      var o = e.stats && e.stats.opr ? e.stats.opr.totalPointsNp : 0;
      return o > m ? o : m;
    }, 1);

    grid.innerHTML = events.map(function (ev) {
      var e = ev.event || {};
      var s = ev.stats || {};
      var has = !!(s && s.rank != null);
      var opr = s.opr ? Math.round(s.opr.totalPointsNp * 10) / 10 : null;
      var loc = [];
      if (e.location) {
        if (e.location.city) loc.push(e.location.city);
        if (e.location.country) loc.push(e.location.country);
      }
      var date = e.start ? new Date(e.start) : null;
      var dateStr = date && !isNaN(date) ? date.toLocaleDateString(current === 'ro' ? 'ro-RO' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
      var pct = opr ? Math.max(6, Math.min(100, (opr / maxOpr) * 100)) : 0;
      var dash = '—';

      var body = has
        ? '<div class="result__grid">' +
            '<div class="result__cell"><b>' + (opr != null ? opr : dash) + '</b><span>' + esc(t('results.opr', 'OPR')) + '</span></div>' +
            '<div class="result__cell"><b>' + (s.qualMatchesPlayed != null ? s.qualMatchesPlayed : dash) + '</b><span>' + esc(t('results.matches', 'Matches')) + '</span></div>' +
            '<div class="result__cell"><b>' + (s.rank != null ? s.rank : dash) + '</b><span>' + esc(t('results.rank', 'Rank')) + '</span></div>' +
          '</div>' +
          '<div class="result__wlt result__w">' +
            '<div class="w">' + (s.wins || 0) + ' ' + esc(t('results.w', 'W')) + '</div>' +
            '<div class="l">' + (s.losses || 0) + ' ' + esc(t('results.l', 'L')) + '</div>' +
            '<div class="t">' + (s.ties || 0) + ' ' + esc(t('results.t', 'T')) + '</div>' +
          '</div>' +
          '<div class="result__opr"><span>' + esc(t('results.opr', 'OPR')) + '</span><i style="--w:' + pct.toFixed(1) + '%"></i></div>'
        : '<div class="result__pending"><span class="result__pending-dot"></span>' +
            '<span>' + esc(t('results.pending', 'Results not published yet')) + '</span></div>';

      return '<article class="result' + (has ? '' : ' result--pending') + '">' +
        '<div class="result__head">' +
          '<div><h3 class="result__name">' + esc(e.name || ev.eventCode) + '</h3>' +
          '<p class="result__meta">' +
            (dateStr ? '<span class="result__date">' + esc(dateStr) + '</span>' : '') +
            (loc.length ? '<span class="result__loc">' + esc(loc.join(', ')) + '</span>' : '') +
          '</p></div>' +
          '<div class="result__rank">' + (has ? '#' + esc(s.rank) : '··') + '</div>' +
        '</div>' +
        body +
        '<a class="result__link" href="https://ftcscout.org/events/' + encodeURIComponent(ev.eventCode || '') + '/matches" target="_blank" rel="noopener noreferrer">' + esc(t('results.view', 'View on FTC Scout →')) + '</a>' +
      '</article>';
    }).join('');

    /* stagger the cards in */
    var cards = $$('.result', grid);
    cards.forEach(function (c, i) {
      if (reduce) { c.classList.add('is-in'); return; }
      setTimeout(function () { c.classList.add('is-in'); }, 60 * i + 40);
    });
  }

  function loadResults() {
    if (!grid) return;
    fetch('https://api.ftcscout.org/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data || !data.data) throw new Error('bad payload');
        var a = (data.data.a && data.data.a.events) || [];
        var b = (data.data.b && data.data.b.events) || [];
        var all = a.concat(b);
        var seen = {};
        var uniq = all.filter(function (ev) {
          var k = ev.eventCode;
          if (seen[k]) return false;
          seen[k] = 1;
          return true;
        });
        var byDate = function (x, y) {
          return new Date(y.event.start || 0) - new Date(x.event.start || 0);
        };
        /* published results first, then the ones FTC Scout has not scored yet */
        var scored = uniq.filter(function (ev) { return ev.stats && ev.stats.rank != null; }).sort(byDate);
        var pending = uniq.filter(function (ev) { return !(ev.stats && ev.stats.rank != null); }).sort(byDate);
        var events = scored.concat(pending).slice(0, 6);
        renderResults(events);
      })
      .catch(function () {
        grid.innerHTML = '';
        if (fallback) fallback.hidden = false;
      });
  }

  renderSkeletons();
  if (grid && 'IntersectionObserver' in window) {
    var resObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { loadResults(); resObs.disconnect(); }
      });
    }, { rootMargin: '200px' });
    resObs.observe(grid);
  } else if (grid) {
    loadResults();
  }

  /* ─── 17. CANVAS MOTES ──────────────────────────────── */
  var canvas = $('#motes');
  if (canvas && !reduce) {
    var ctx = canvas.getContext('2d');
    var motes = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var pointer = { x: -999, y: -999 };

    function size() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.min(46, Math.round(W * H / 26000));
      motes = [];
      for (var i = 0; i < count; i++) {
        motes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.5 + 0.4,
          vx: (Math.random() - 0.5) * 0.18,
          vy: -(Math.random() * 0.22 + 0.04),
          a: Math.random() * 0.4 + 0.12,
          hue: Math.random() > 0.75 ? 190 : 145
        });
      }
    }
    size();
    window.addEventListener('resize', size);

    window.addEventListener('pointermove', function (e) {
      pointer.x = e.clientX; pointer.y = e.clientY;
    }, { passive: true });

    var running = true;
    function frame() {
      if (!running) { requestAnimationFrame(frame); return; }
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.x += m.vx; m.y += m.vy;
        if (m.y < -10) { m.y = H + 10; m.x = Math.random() * W; }
        if (m.x < -10) m.x = W + 10;
        if (m.x > W + 10) m.x = -10;

        var dx = m.x - pointer.x, dy = m.y - pointer.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 16000 && d2 > 1) {
          var f = (16000 - d2) / 16000 * 0.9;
          var dist = Math.sqrt(d2);
          m.x += (dx / dist) * f;
          m.y += (dy / dist) * f;
        }

        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + m.hue + ', 80%, 65%, ' + m.a + ')';
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
    });
  }

  /* ─── 18. MISC ──────────────────────────────────────── */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* re-translate the dynamic result cards when the language changes,
     and rebuild the word/line masks so the new copy animates in too */
  document.addEventListener('langchange', function () {
    hideTip();
    splitAll();
    if (window.__shResults) renderResults(window.__shResults);
  });
})();
