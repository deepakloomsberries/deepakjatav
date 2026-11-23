/* Deepak Jatav — portfolio interactions. No dependencies. */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 4);

  /* ---------------------------------------------------------------------
     Text splitting (hero letters, heading words)
     ------------------------------------------------------------------- */
  function splitChars() {
    let offset = 0;
    $$('[data-chars]').forEach((el) => {
      const text = el.textContent;
      el.textContent = '';
      el.setAttribute('aria-hidden', 'true');
      Array.from(text).forEach((ch, i) => {
        const span = document.createElement('span');
        span.className = 'ch';
        span.style.setProperty('--ci', i + offset);
        span.textContent = ch;
        el.appendChild(span);
      });
      offset += text.length;
    });
  }

  function splitWords() {
    $$('[data-split]').forEach((el) => {
      const nodes = Array.from(el.childNodes);
      el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
      el.textContent = '';
      let index = 0;
      nodes.forEach((node) => {
        const isEm = node.nodeType === 1 && node.nodeName === 'EM';
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(' ')); return; }
          const outer = document.createElement('span');
          outer.className = 'w';
          outer.setAttribute('aria-hidden', 'true');
          const inner = document.createElement(isEm ? 'em' : 'span');
          inner.className = 'wi';
          inner.style.setProperty('--wi', index++);
          inner.textContent = part;
          outer.appendChild(inner);
          el.appendChild(outer);
        });
      });
    });
  }

  /* ---------------------------------------------------------------------
     Preloader: barcode fills while a counter runs to 100
     ------------------------------------------------------------------- */
  function preloader(done) {
    const bars = $('#preloaderBars');
    const num = $('#preloaderNum');
    const finish = () => { root.classList.add('loaded'); done(); };
    if (!bars || reduce) { finish(); return; }

    const pattern = [1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1];
    pattern.forEach((wide) => {
      const bar = document.createElement('i');
      if (!wide) bar.className = 'thin';
      bars.appendChild(bar);
    });
    const items = $$('i', bars);
    const duration = 1150;
    const start = performance.now();

    (function tick(now) {
      const t = clamp((now - start) / duration, 0, 1);
      const p = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      num.textContent = String(Math.round(p * 100)).padStart(3, '0');
      const lit = Math.floor(p * items.length);
      items.forEach((bar, i) => bar.classList.toggle('on', i < lit));
      if (t < 1) requestAnimationFrame(tick);
      else setTimeout(finish, 220);
    })(start);
  }

  /* ---------------------------------------------------------------------
     Scroll reveal, scramble, counters
     ------------------------------------------------------------------- */
  function scramble(el) {
    const final = el.dataset.final || (el.dataset.final = el.textContent);
    const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/-';
    const total = 20;
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      const shown = Math.floor((frame / total) * final.length);
      el.textContent = final.split('').map((c, i) => (c === ' ' || i < shown ? c : pool[(Math.random() * pool.length) | 0])).join('');
      if (frame >= total) { clearInterval(id); el.textContent = final; }
    }, 40);
  }

  function countTo(el) {
    const to = Number(el.dataset.count);
    const from = Number(el.dataset.from || 0);
    const sep = 'sep' in el.dataset;
    const fmt = (v) => (sep ? v.toLocaleString('en-US') : String(v));
    if (reduce) { el.textContent = fmt(to); return; }
    const duration = 1700;
    const start = performance.now();
    (function tick(now) {
      const t = clamp((now - start) / duration, 0, 1);
      el.textContent = fmt(Math.round(lerp(from, to, easeOut(t))));
      if (t < 1) requestAnimationFrame(tick);
    })(start);
  }

  function reveals() {
    $$('.chips-pop').forEach((list) => $$('li', list).forEach((li, i) => li.style.setProperty('--ci', i)));

    const targets = $$('.reveal, [data-split]');
    const show = (el) => {
      el.classList.add('in');
      setTimeout(() => el.classList.add('done'), 1700);
      $$('[data-scramble]', el).forEach((s) => { if (!reduce) scramble(s); });
      $$('[data-count]', el).forEach(countTo);
    };
    if (!('IntersectionObserver' in window)) { targets.forEach(show); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        show(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    targets.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------------------
     Typed line in the hero
     ------------------------------------------------------------------- */
  function typed() {
    const el = $('#typed');
    if (!el || reduce) return;
    const phrases = JSON.parse(el.dataset.phrases);
    let p = 0;
    let i = phrases[0].length;
    let deleting = true;
    function step() {
      if (deleting) {
        i--;
        el.textContent = phrases[p].slice(0, i);
        if (i <= 0) { deleting = false; p = (p + 1) % phrases.length; setTimeout(step, 320); return; }
        setTimeout(step, 24);
      } else {
        i++;
        el.textContent = phrases[p].slice(0, i);
        if (i >= phrases[p].length) { deleting = true; setTimeout(step, 2100); return; }
        setTimeout(step, 50);
      }
    }
    setTimeout(step, 3400);
  }

  /* ---------------------------------------------------------------------
     Scroll-driven UI: progress bar, nav state, tracking rail, timeline
     ------------------------------------------------------------------- */
  function scrollUI() {
    const bar = $('#progressBar');
    const nav = $('#nav');
    const railFill = $('#railFill');
    const railBox = $('#railBox');
    const railTrack = $('.rail-track');
    const tl = $('#timeline');
    const tlFill = $('#tlFill');
    const sections = $$('[data-section]');
    const stops = $$('.rail-stops a');
    const links = $$('.nav-links a');
    let lastY = window.scrollY;
    let ticking = false;

    function update() {
      ticking = false;
      const y = window.scrollY;
      const vh = window.innerHeight;
      const max = Math.max(1, document.documentElement.scrollHeight - vh);
      const atEnd = y >= max - 4;

      if (bar) bar.style.transform = `scaleX(${clamp(y / max, 0, 1)})`;

      if (nav) {
        nav.classList.toggle('is-stuck', y > 30);
        const open = nav.classList.contains('nav-open');
        if (!open && y > 600 && y > lastY + 4) nav.classList.add('is-hidden');
        else if (y < lastY - 4 || y <= 600) nav.classList.remove('is-hidden');
      }
      lastY = y;

      // which section is the "shipment" in, and how far through it
      const probe = y + vh * 0.42;
      const tops = sections.map((s) => s.getBoundingClientRect().top + y);
      let idx = 0;
      for (let i = 0; i < tops.length; i++) if (probe >= tops[i]) idx = i;
      let within = 0;
      if (idx < tops.length - 1) within = clamp((probe - tops[idx]) / (tops[idx + 1] - tops[idx]), 0, 1);
      let p = (idx + within) / (tops.length - 1);
      if (atEnd) { p = 1; idx = tops.length - 1; }

      if (railFill) railFill.style.transform = `scaleY(${p})`;
      if (railBox && railTrack) railBox.style.transform = `translateY(${p * railTrack.offsetHeight}px)`;
      stops.forEach((stop, i) => {
        stop.classList.toggle('is-past', i <= idx);
        stop.classList.toggle('is-now', i === idx);
      });
      const currentId = sections[idx] ? sections[idx].id : '';
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${currentId}`));

      if (tl && tlFill) {
        const r = tl.getBoundingClientRect();
        tlFill.style.transform = `scaleY(${clamp((vh * 0.62 - r.top) / r.height, 0, 1)})`;
      }
    }

    const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    update();
  }

  /* ---------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------- */
  function menu() {
    const nav = $('#nav');
    const burger = $('#burger');
    if (!nav || !burger) return;
    const set = (open) => {
      nav.classList.toggle('nav-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    burger.addEventListener('click', () => set(!nav.classList.contains('nav-open')));
    $$('.nav-links a').forEach((a) => a.addEventListener('click', () => set(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
    document.addEventListener('click', (e) => { if (!nav.contains(e.target)) set(false); });
  }

  /* ---------------------------------------------------------------------
     Pointer effects: cursor ring, magnetic buttons, tilt, spotlight
     ------------------------------------------------------------------- */
  function pointerFx() {
    $$('.spot').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      }, { passive: true });
    });

    if (!finePointer || reduce) return;

    const ring = $('.cursor-ring');
    if (ring) {
      let x = window.innerWidth / 2, y = window.innerHeight / 2, tx = x, ty = y, active = false;
      window.addEventListener('mousemove', (e) => {
        tx = e.clientX; ty = e.clientY;
        if (!active) { active = true; x = tx; y = ty; ring.classList.add('on'); loop(); }
      }, { passive: true });
      document.addEventListener('mouseleave', () => ring.classList.remove('on'));
      document.addEventListener('mouseenter', () => ring.classList.add('on'));
      document.addEventListener('mouseover', (e) => {
        ring.classList.toggle('big', !!e.target.closest('a, button, input, label.slider, [data-tilt]'));
      });
      function loop() {
        x = lerp(x, tx, 0.2); y = lerp(y, ty, 0.2);
        ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        requestAnimationFrame(loop);
      }
    }

    $$('.magnetic').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * 0.22}px, ${dy * 0.32}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });

    $$('[data-tilt]').forEach((el) => {
      const max = Number(el.dataset.tiltMax) || 10;
      let reset;
      el.addEventListener('mouseenter', () => { clearTimeout(reset); el.style.transition = 'transform 0.12s ease-out'; });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(1000px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transition = 'transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)';
        el.style.transform = '';
        reset = setTimeout(() => { el.style.transition = ''; }, 720);
      });
    });
  }

  /* ---------------------------------------------------------------------
     Marquee + barcode
     ------------------------------------------------------------------- */
  function marquee() {
    $$('.marquee').forEach((m) => {
      const track = $('.marquee-track', m);
      if (!track) return;
      m.style.setProperty('--speed', m.dataset.speed || 40);
      for (let i = 0; i < 2; i++) m.appendChild(track.cloneNode(true));
    });
  }

  function barcode() {
    const host = $('#labelBarcode');
    if (!host) return;
    let seed = 4211;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 64; i++) {
      const bar = document.createElement('i');
      bar.style.width = `${1 + Math.floor(rand() * 3)}px`;
      bar.style.marginRight = `${1 + Math.floor(rand() * 3)}px`;
      frag.appendChild(bar);
    }
    host.insertBefore(frag, host.firstChild);
  }

  /* ---------------------------------------------------------------------
     Hero canvas: trade lanes from Bengaluru to the Gulf
     ------------------------------------------------------------------- */
  function routes() {
    const canvas = $('#routes');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const AMBER = '255, 178, 36';
    const MINT = '61, 220, 180';

    // positions follow rough geography (west on the left, north on top)
    const nodes = {
      BLR: { x: 0.87, y: 0.76, name: 'BENGALURU', origin: true, lx: -1, ly: 1 },
      DXB: { x: 0.62, y: 0.25, name: 'DUBAI', lx: 1, ly: 0 },
      DMM: { x: 0.46, y: 0.13, name: 'DAMMAM', lx: 1, ly: 0 },
      RUH: { x: 0.31, y: 0.24, name: 'RIYADH', lx: -1, ly: -1 },
      JED: { x: 0.13, y: 0.36, name: 'JEDDAH', lx: 1, ly: -1 },
    };
    const lanes = [
      { a: 'BLR', b: 'DXB', bend: -0.20, sea: true },
      { a: 'BLR', b: 'DMM', bend: -0.30, sea: true },
      { a: 'BLR', b: 'JED', bend: 0.20, sea: true },
      { a: 'DXB', b: 'RUH', bend: 0.22 },
      { a: 'DMM', b: 'RUH', bend: -0.25 },
      { a: 'JED', b: 'RUH', bend: -0.25 },
    ];
    const seaLanes = lanes.filter((l) => l.sea);

    let W = 0, H = 0, dpr = 1;
    let packets = [];
    let ripples = [];
    let running = false;
    let raf = 0;
    let lastSpawn = 0;
    let last = 0;
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 };

    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width; H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!running) draw(performance.now(), true);
    }

    const pos = (key) => ({ x: nodes[key].x * W + tilt.x * (nodes[key].origin ? 0.5 : 1), y: nodes[key].y * H + tilt.y * (nodes[key].origin ? 0.5 : 1) });

    function control(lane) {
      const a = pos(lane.a), b = pos(lane.b);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const dx = b.x - a.x, dy = b.y - a.y;
      return { a, b, c: { x: mx - dy * lane.bend, y: my + dx * lane.bend } };
    }
    function point(g, t) {
      const u = 1 - t;
      return { x: u * u * g.a.x + 2 * u * t * g.c.x + t * t * g.b.x, y: u * u * g.a.y + 2 * u * t * g.c.y + t * t * g.b.y };
    }

    function spawn(lane) {
      packets.push({ lane, t: 0, speed: 0.16 + Math.random() * 0.07 });
    }

    function draw(now, still) {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      tilt.x = lerp(tilt.x, tilt.tx, 0.06);
      tilt.y = lerp(tilt.y, tilt.ty, 0.06);

      ctx.clearRect(0, 0, W, H);

      // graticule
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)';
      ctx.beginPath();
      for (let i = 1; i < 6; i++) { ctx.moveTo((W / 6) * i, 0); ctx.lineTo((W / 6) * i, H); }
      for (let i = 1; i < 6; i++) { ctx.moveTo(0, (H / 6) * i); ctx.lineTo(W, (H / 6) * i); }
      ctx.stroke();

      ctx.font = '500 9px "JetBrains Mono", ui-monospace, monospace';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.textAlign = 'center';
      ctx.fillText('A R A B I A N   S E A', W * 0.70, H * 0.50);

      // lanes
      const geo = lanes.map(control);
      ctx.setLineDash([3, 5]);
      ctx.lineDashOffset = still ? 0 : -now / 60;
      geo.forEach((g, i) => {
        ctx.strokeStyle = lanes[i].sea ? 'rgba(255, 255, 255, 0.20)' : 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        ctx.moveTo(g.a.x, g.a.y);
        ctx.quadraticCurveTo(g.c.x, g.c.y, g.b.x, g.b.y);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // packets with trails
      if (!still) {
        if (now - lastSpawn > 620) { lastSpawn = now; spawn(seaLanes[(Math.random() * seaLanes.length) | 0]); }
        packets.forEach((p) => { p.t += p.speed * dt; });
        packets = packets.filter((p) => {
          if (p.t < 1) return true;
          ripples.push({ key: p.lane.b, age: 0 });
          if (p.lane.sea && Math.random() < 0.6) {
            const next = lanes.find((l) => !l.sea && l.a === p.lane.b);
            if (next) packets.push({ lane: next, t: 0, speed: 0.34 });
          }
          return false;
        });
      }
      packets.forEach((p) => {
        const g = geo[lanes.indexOf(p.lane)];
        const steps = 14;
        for (let s = steps; s >= 0; s--) {
          const t = p.t - s * 0.012;
          if (t < 0) continue;
          const pt = point(g, t);
          const alpha = (1 - s / steps) * 0.9;
          ctx.fillStyle = `rgba(${AMBER}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, s === 0 ? 2.6 : 1.5 * (1 - s / steps) + 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
        const head = point(g, p.t);
        ctx.fillStyle = `rgba(${AMBER}, 0.22)`;
        ctx.beginPath();
        ctx.arc(head.x, head.y, 7, 0, Math.PI * 2);
        ctx.fill();
      });

      // arrival ripples
      ripples.forEach((r) => { r.age += dt; });
      ripples = ripples.filter((r) => r.age < 1);
      ripples.forEach((r) => {
        const c = pos(r.key);
        ctx.strokeStyle = `rgba(${MINT}, ${0.6 * (1 - r.age)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 5 + r.age * 22, 0, Math.PI * 2);
        ctx.stroke();
      });

      // nodes + labels
      Object.keys(nodes).forEach((key) => {
        const n = nodes[key];
        const c = pos(key);
        const color = n.origin ? AMBER : MINT;
        const breathe = still ? 0 : Math.sin(now / 600 + c.x) * 1.5;
        ctx.fillStyle = `rgba(${color}, 0.14)`;
        ctx.beginPath(); ctx.arc(c.x, c.y, (n.origin ? 15 : 10) + breathe, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgb(${color})`;
        ctx.beginPath(); ctx.arc(c.x, c.y, n.origin ? 5 : 3.5, 0, Math.PI * 2); ctx.fill();

        const ox = n.lx * 14, oy = n.ly * 13;
        ctx.textAlign = n.lx < 0 ? 'right' : 'left';
        ctx.font = '700 11px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = 'rgba(236, 233, 226, 0.95)';
        ctx.fillText(key, c.x + ox, c.y + oy);
        ctx.font = '500 8px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillStyle = 'rgba(151, 157, 166, 0.9)';
        ctx.fillText(n.name, c.x + ox, c.y + oy + 12);
      });
    }

    function loop(now) {
      if (!running) return;
      draw(now, false);
      raf = requestAnimationFrame(loop);
    }
    function start() {
      if (running || reduce) return;
      running = true; last = performance.now();
      raf = requestAnimationFrame(loop);
    }
    function stop() { running = false; cancelAnimationFrame(raf); }

    resize();
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize', resize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!running) draw(performance.now(), true); });

    if (reduce) { draw(performance.now(), true); return; }

    // seed a few packets so the lanes are alive on first paint
    seaLanes.forEach((lane, i) => packets.push({ lane, t: 0.2 + i * 0.25, speed: 0.18 }));

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? start() : stop())), { threshold: 0.05 }).observe(canvas);
    } else start();
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (canvas.getBoundingClientRect().bottom > 0) start(); });

    if (finePointer) {
      const hero = $('.hero');
      hero.addEventListener('mousemove', (e) => {
        const r = hero.getBoundingClientRect();
        tilt.tx = ((e.clientX - r.left) / r.width - 0.5) * -14;
        tilt.ty = ((e.clientY - r.top) / r.height - 0.5) * -10;
      }, { passive: true });
      hero.addEventListener('mouseleave', () => { tilt.tx = 0; tilt.ty = 0; });
    }
  }

  /* ---------------------------------------------------------------------
     Order-to-cash stepper
     ------------------------------------------------------------------- */
  function flow() {
    const widget = $('#flowWidget');
    if (!widget) return;
    const steps = $$('.flow-step', widget);
    const panels = $$('.flow-panel', widget);
    const fill = $('#flowFill');
    const parcel = $('#flowParcel');
    const timer = $('#flowTimer');
    const AUTO = 5200;
    let current = 0;
    let autoId = 0;
    let visible = false;
    let holdUntil = 0;

    function go(i, fromUser) {
      current = (i + steps.length) % steps.length;
      steps.forEach((s, n) => {
        s.classList.toggle('is-active', n === current);
        s.classList.toggle('is-done', n < current);
        s.setAttribute('aria-selected', String(n === current));
      });
      panels.forEach((p, n) => p.classList.toggle('is-active', n === current));
      if (fill) fill.style.transform = `scaleX(${current / (steps.length - 1)})`;
      if (parcel) {
        parcel.style.left = `${((current * 2 + 1) / (steps.length * 2)) * 100}%`;
        parcel.classList.remove('hop');
        void parcel.offsetWidth;
        parcel.classList.add('hop');
      }
      if (fromUser) holdUntil = Date.now() + 12000;
      restartTimer();
    }

    function restartTimer() {
      if (!timer) return;
      timer.classList.remove('run');
      if (reduce || !visible || Date.now() < holdUntil) return;
      void timer.offsetWidth;
      timer.style.setProperty('--dur', `${AUTO}ms`);
      timer.classList.add('run');
    }

    function schedule() {
      clearInterval(autoId);
      if (reduce) return;
      autoId = setInterval(() => {
        if (!visible || document.hidden) return;
        if (Date.now() < holdUntil) return;
        go(current + 1, false);
      }, AUTO);
    }

    steps.forEach((s, n) => {
      s.addEventListener('click', () => { go(n, true); schedule(); });
      s.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1, true); steps[current].focus(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1, true); steps[current].focus(); }
      });
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => entries.forEach((e) => {
        visible = e.isIntersecting;
        if (visible) { restartTimer(); schedule(); } else { clearInterval(autoId); if (timer) timer.classList.remove('run'); }
      }), { threshold: 0.35 }).observe(widget);
    } else { visible = true; schedule(); }

    go(0, false);
  }

  /* ---------------------------------------------------------------------
     Calculators
     ------------------------------------------------------------------- */
  function tween(el, to, decimals) {
    if (!el) return;
    const from = parseFloat(el.textContent.replace(/,/g, '')) || 0;
    cancelAnimationFrame(el._raf);
    if (reduce || from === to) { el.textContent = to.toFixed(decimals); return; }
    const start = performance.now();
    (function tick(now) {
      const t = clamp((now - start) / 320, 0, 1);
      el.textContent = lerp(from, to, easeOut(t)).toFixed(decimals);
      if (t < 1) el._raf = requestAnimationFrame(tick);
    })(start);
  }

  function paintRange(input) {
    const min = Number(input.min), max = Number(input.max), val = Number(input.value);
    input.style.setProperty('--p', `${((val - min) / (max - min)) * 100}%`);
  }

  function volumetric() {
    const host = $('#volCalc');
    if (!host) return;
    const inL = $('#volL'), inW = $('#volW'), inH = $('#volH'), inKg = $('#volKg');
    const box = $('#box3d');
    const verdict = $('#volVerdict');
    let divisor = 5000;

    function update() {
      const l = Number(inL.value), w = Number(inW.value), h = Number(inH.value), kg = Number(inKg.value);
      const vol = (l * w * h) / divisor;
      const charge = Math.max(vol, kg);
      const scale = 1.05;

      $('#volLOut').textContent = l;
      $('#volWOut').textContent = w;
      $('#volHOut').textContent = h;
      $('#volKgOut').textContent = kg.toFixed(1);
      [inL, inW, inH, inKg].forEach(paintRange);

      box.style.setProperty('--l', `${l * scale}px`);
      box.style.setProperty('--w', `${w * scale}px`);
      box.style.setProperty('--h', `${h * scale}px`);

      const top = Math.max(vol, kg, 1);
      $('#volBarActual').style.width = `${(kg / top) * 100}%`;
      $('#volBarVol').style.width = `${(vol / top) * 100}%`;
      tween($('#volActualOut'), kg, 1);
      tween($('#volVolOut'), vol, 1);
      tween($('#volChargeOut'), charge, 1);
      $('#volFormula').textContent = `(${l} × ${w} × ${h}) ÷ ${divisor} = ${vol.toFixed(1)} kg`;

      const byVolume = vol > kg;
      verdict.classList.toggle('is-ok', !byVolume);
      $('#volVerdictText').textContent = byVolume
        ? `Billed on volume. You are paying for ${(vol - kg).toFixed(1)} kg of air.`
        : 'Billed on actual weight. The box is packed tight enough.';
    }

    [inL, inW, inH, inKg].forEach((input) => input.addEventListener('input', update));
    $$('[data-div]', host).forEach((btn) => btn.addEventListener('click', () => {
      divisor = Number(btn.dataset.div);
      $$('[data-div]', host).forEach((b) => b.classList.toggle('is-on', b === btn));
      update();
    }));
    update();
  }

  function profit() {
    const host = $('#profitCalc');
    if (!host) return;
    const inPrice = $('#pPrice'), inPct = $('#pCommPct'), inShip = $('#pShipIn'), inCost = $('#pCostIn');
    const verdict = $('#profitVerdict');
    const segs = {};
    $$('#splitBar i').forEach((i) => { segs[i.dataset.k] = i; });
    const markets = { ksa: { vat: 0.15, cur: 'SAR' }, uae: { vat: 0.05, cur: 'AED' } };
    let market = markets.ksa;

    function update() {
      const price = Number(inPrice.value), pct = Number(inPct.value), ship = Number(inShip.value), cost = Number(inCost.value);
      const net = price / (1 + market.vat);
      const vat = price - net;
      const comm = price * (pct / 100);
      const gain = price - vat - comm - ship - cost;
      const margin = net > 0 ? (gain / net) * 100 : 0;

      $('#pPriceOut').textContent = price;
      $('#pCommPctOut').textContent = pct;
      $('#pShipOut').textContent = ship;
      $('#pCostOut').textContent = cost;
      [inPrice, inPct, inShip, inCost].forEach(paintRange);
      $$('.cur', host).forEach((c) => { c.textContent = market.cur; });

      const total = Math.max(price, vat + comm + ship + cost);
      const widths = { vat, comm, ship, cost, profit: Math.max(gain, 0) };
      Object.keys(widths).forEach((k) => { if (segs[k]) segs[k].style.width = `${(widths[k] / total) * 100}%`; });

      tween($('#pVat'), vat, 2);
      tween($('#pComm'), comm, 2);
      tween($('#pShip'), ship, 2);
      tween($('#pCost'), cost, 2);
      tween($('#pProfit'), gain, 2);
      tween($('#pProfitBig'), gain, 2);
      tween($('#pMargin'), margin, 1);

      verdict.classList.toggle('is-bad', gain < 0);
      verdict.classList.toggle('is-ok', gain >= 0);
    }

    [inPrice, inPct, inShip, inCost].forEach((input) => input.addEventListener('input', update));
    $$('[data-market]', host).forEach((btn) => btn.addEventListener('click', () => {
      market = markets[btn.dataset.market];
      $$('[data-market]', host).forEach((b) => b.classList.toggle('is-on', b === btn));
      update();
    }));
    update();
  }

  /* ---------------------------------------------------------------------
     Contact: copy email, résumé toast
     ------------------------------------------------------------------- */
  let toastTimer = 0;
  function toast(message) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  function contact() {
    const btn = $('#copyMail');
    const hint = $('#copyMailHint');
    if (btn) {
      btn.addEventListener('click', async () => {
        const mail = btn.dataset.mail;
        let ok = false;
        try {
          await navigator.clipboard.writeText(mail);
          ok = true;
        } catch (err) {
          const ta = document.createElement('textarea');
          ta.value = mail;
          ta.style.cssText = 'position:fixed;opacity:0';
          document.body.appendChild(ta);
          ta.select();
          try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
          ta.remove();
        }
        if (ok) {
          toast('Email address copied');
          if (hint) { hint.textContent = 'Copied'; setTimeout(() => { hint.textContent = 'Click to copy'; }, 2200); }
        } else {
          window.location.href = `mailto:${mail}`;
        }
      });
    }
    $$('[data-resume]').forEach((a) => a.addEventListener('click', () => toast('Résumé download started')));
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ---------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------- */
  function init() {
    splitChars();
    splitWords();
    barcode();
    marquee();
    menu();
    scrollUI();
    pointerFx();
    routes();
    flow();
    volumetric();
    profit();
    contact();
    preloader(() => {
      reveals();
      typed();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
