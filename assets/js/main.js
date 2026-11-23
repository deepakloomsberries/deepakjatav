/* Deepak Jatav — portfolio. Plain JavaScript, no dependencies. */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 4);

  /* small DOM builders: text always goes in through textContent */
  function h(tag, props, ...kids) {
    const node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach((k) => {
        if (k === 'class') node.className = props[k];
        else if (k === 'text') node.textContent = props[k];
        else if (k === 'style') Object.assign(node.style, props[k]);
        else node.setAttribute(k, props[k]);
      });
    }
    kids.flat().forEach((kid) => {
      if (kid == null) return;
      node.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    });
    return node;
  }
  const SVG_NS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, text) {
    const node = document.createElementNS(SVG_NS, tag);
    if (attrs) Object.keys(attrs).forEach((k) => node.setAttribute(k, attrs[k]));
    if (text != null) node.textContent = text;
    return node;
  }

  /* runs once the web fonts are in (or after a short wait), so the intro
     animates in the real typeface instead of swapping halfway through */
  function whenFontsReady(cb) {
    let done = false;
    const go = () => { if (done) return; done = true; requestAnimationFrame(() => requestAnimationFrame(cb)); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go, go);
    setTimeout(go, 900);
  }

  /* ---------------------------------------------------------------------
     Page chrome: load state, top bar, menu, active link, reveal, clock
     ------------------------------------------------------------------- */
  function chrome() {
    const top = $('#top');
    const bar = $('#progress');
    let ticking = false;
    const paint = () => {
      ticking = false;
      const max = root.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = `scaleX(${max > 0 ? clamp(window.scrollY / max, 0, 1).toFixed(4) : 0})`;
      top.classList.toggle('is-stuck', window.scrollY > 8);
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
    window.addEventListener('resize', paint);
    paint();

    const menuBtn = $('#menuBtn');
    const setMenu = (open) => {
      top.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.textContent = open ? 'Close' : 'Menu';
    };
    menuBtn.addEventListener('click', () => setMenu(!top.classList.contains('is-open')));
    $$('.top-nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

    const links = $$('.top-nav a');
    const nav = $('#topNav');
    const ind = h('span', { class: 'top-ind', 'aria-hidden': 'true' });
    nav.appendChild(ind);
    nav.classList.add('has-ind');
    let activeLink = null;
    const placeInd = () => {
      if (!activeLink) { ind.classList.remove('on'); return; }
      const appearing = !ind.classList.contains('on');
      if (appearing) ind.style.transition = 'none'; // appear in place rather than slide in from the edge
      ind.style.width = `${activeLink.offsetWidth}px`;
      ind.style.transform = `translateX(${activeLink.offsetLeft}px)`;
      if (appearing) { void ind.offsetWidth; ind.style.transition = ''; }
      ind.classList.add('on');
    };
    window.addEventListener('resize', placeInd);
    whenFontsReady(() => {
      root.classList.add('ready');
      counters();
      placeInd();
    });

    if ('IntersectionObserver' in window) {
      const spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          activeLink = links.find((a) => a.getAttribute('href') === `#${entry.target.id}`) || null;
          links.forEach((a) => a.classList.toggle('is-on', a === activeLink));
          placeInd();
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      $$('[data-section]').forEach((sec) => spy.observe(sec));

      const reveal = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in');
          reveal.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
      $$('[data-reveal]').forEach((el) => reveal.observe(el));
    } else {
      $$('[data-reveal]').forEach((el) => el.classList.add('in'));
    }

    const clock = $('#clock');
    if (clock) {
      const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
      const tick = () => { clock.textContent = `${fmt.format(new Date())} IST`; };
      tick();
      setInterval(tick, 20000);
    }

    if (reduce) $$('svg').forEach((svg) => { if (svg.pauseAnimations) svg.pauseAnimations(); });

    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ---------------------------------------------------------------------
     Motion layer: section titles, staggered blocks, drawn rules, closing line.
     Only switched on when the visitor allows motion and the browser can
     report what is on screen, so the page is never left hidden.
     ------------------------------------------------------------------- */
  function motion() {
    if (reduce || !('IntersectionObserver' in window)) return;
    root.classList.add('motion');

    $$('.side-title').forEach((t) => {
      const span = h('span', { text: t.textContent });
      t.textContent = '';
      t.appendChild(span);
    });

    const end = $('.end-title');
    if (end) {
      const text = end.textContent.trim();
      end.setAttribute('aria-label', text);
      end.textContent = '';
      text.split(/\s+/).forEach((word, i) => {
        if (i) end.appendChild(document.createTextNode(' '));
        const w = h('span', { class: 'w', 'aria-hidden': 'true' }, h('span', { text: word }));
        w.style.setProperty('--i', i);
        end.appendChild(w);
      });
    }

    const tag = (sel, cls) => $$(sel).forEach((el) => el.classList.add(cls));
    tag('.ch-names li, .ch-markets li, .tl, .case-nums dl > div, .more-list li, .xp > li, .kit > div, .calc, .end .mail, .end-links, .end-foot', 'rise');
    tag('.pso > div, .flow-panels, .xp, .kit, .verdict', 'draw-rule');

    const io = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((entry, i) => {
        const el = entry.target;
        if (el.classList.contains('rise')) el.style.setProperty('--delay', `${Math.min(i, 6) * 70}ms`);
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
    $$('.side, .rise, .draw-rule, .case-fig, .end-title').forEach((el) => io.observe(el));
  }

  /* a figure that runs up to its value: [data-count], optional data-from, data-sep */
  function runCount(el, delay) {
    const to = Number(el.dataset.count);
    const from = Number(el.dataset.from || 0);
    const fmt = (v) => ('sep' in el.dataset ? v.toLocaleString('en-US') : String(v));
    if (reduce) { el.textContent = fmt(to); return; }
    const start = performance.now() + delay;
    const duration = 1300;
    el.textContent = fmt(from);
    (function tick(now) {
      const t = clamp((now - start) / duration, 0, 1);
      el.textContent = fmt(Math.round(lerp(from, to, easeOut(t))));
      if (t < 1) requestAnimationFrame(tick);
    })(performance.now());
  }

  /* hero facts count with the intro; figures further down count when they come into view */
  function counters() {
    $$('.facts [data-count]').forEach((el) => runCount(el, 700));
    if (reduce || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        $$('[data-count]', entry.target).forEach((el) => runCount(el, 150));
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    $$('.case-nums').forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------------------
     Sample dashboards
     All figures below are generated sample data. Nothing here is company data.
     ------------------------------------------------------------------- */
  function dashboard() {
    const dash = $('#dash');
    if (!dash) return;
    const view = $('#dashView');
    const tip = $('#tip');
    const state = { view: 'sales', market: 'all', period: 6, table: false };

    const MARKETS = {
      ksa: { name: 'Saudi Arabia', color: 'var(--s1)' },
      uae: { name: 'UAE', color: 'var(--s2)' },
    };
    const CHANNELS = ['Amazon', 'Noon', 'Namshi', 'Trendyol', 'Shopify', 'Home Centre', 'Centrepoint'];
    const BASE = { ksa: [420, 365, 118, 142, 88, 104, 76], uae: [255, 240, 150, 48, 62, 152, 111] };
    const AOV = [212, 198, 246, 164, 228, 259, 241];
    const RETURNS = [0.062, 0.071, 0.128, 0.094, 0.048, 0.039, 0.044];
    const SEASON = [0.96, 1.0, 1.08, 1.04, 0.98, 0.96, 0.95, 0.97, 1.0, 1.04, 1.12, 1.03];
    const MONTHS = 24;
    const END = { year: 2026, month: 9 }; // October 2026
    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const noise = (a, b, c) => { const x = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453; return x - Math.floor(x); };
    const monthDate = (i) => new Date(END.year, END.month - (MONTHS - 1 - i), 1);
    const sales = (mk, ci, mi) => {
      const cal = monthDate(mi).getMonth();
      const mkIdx = mk === 'ksa' ? 1 : 2;
      return BASE[mk][ci] * 1000 * (0.8 + mi * 0.02) * SEASON[cal] * (1 + (noise(mkIdx, ci + 1, mi + 1) - 0.5) * 0.1);
    };

    const activeMarkets = () => (state.market === 'all' ? ['ksa', 'uae'] : [state.market]);
    const range = (from, to) => Array.from({ length: to - from }, (_, i) => from + i);
    const periods = () => ({ cur: range(MONTHS - state.period, MONTHS), prev: range(MONTHS - 2 * state.period, MONTHS - state.period) });
    const sum = (arr) => arr.reduce((a, b) => a + b, 0);

    const compact = (n) => {
      const abs = Math.abs(n);
      if (abs >= 1e6) return `${(n / 1e6).toFixed(abs >= 1e7 ? 1 : 2)}M`;
      if (abs >= 1e4) return `${Math.round(n / 1e3)}K`;
      if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
      return String(Math.round(n));
    };
    const aed = (n) => `AED ${compact(n)}`;
    const axis = (n) => (n >= 1e6 ? `${parseFloat((n / 1e6).toFixed(2))}M` : `${Math.round(n / 1e3)}K`);
    const pct = (v, d = 1) => `${(v * 100).toFixed(d)}%`;
    const whole = (n) => Math.round(n).toLocaleString('en-US');
    const periodLabel = () => `previous ${state.period} months`;

    /* tooltip */
    function showTip(clientX, clientY, title, rows, total) {
      tip.textContent = '';
      tip.appendChild(h('div', { class: 'tip-title', text: title }));
      rows.forEach((r) => tip.appendChild(h('div', { class: 'tip-row' }, h('i', { style: { background: r.color || 'transparent' } }), h('b', { text: r.value }), h('span', { text: r.label }))));
      if (total) tip.appendChild(h('div', { class: 'tip-row tip-total' }, h('i'), h('b', { text: total.value }), h('span', { text: total.label })));
      tip.hidden = false;
      const box = dash.getBoundingClientRect();
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      let x = clientX - box.left + 14;
      let y = clientY - box.top - th - 12;
      if (x + tw > box.width - 8) x = clientX - box.left - tw - 14;
      if (x < 8) x = 8;
      if (y < 8) y = clientY - box.top + 18;
      tip.style.left = `${x}px`;
      tip.style.top = `${y}px`;
    }
    const hideTip = () => { tip.hidden = true; };
    function bindTip(node, build) {
      node.tabIndex = 0;
      node.addEventListener('pointermove', (e) => { const t = build(); showTip(e.clientX, e.clientY, t.title, t.rows, t.total); });
      node.addEventListener('pointerleave', hideTip);
      node.addEventListener('focus', () => { const r = node.getBoundingClientRect(); const t = build(); showTip(r.left + r.width * 0.5, r.top, t.title, t.rows, t.total); });
      node.addEventListener('blur', hideTip);
    }

    /* shared pieces */
    function tile(label, value, delta, hero) {
      const node = h('div', { class: `tile${hero ? ' is-hero' : ''}` }, h('div', { class: 'tile-label', text: label }), h('div', { class: 'tile-value', text: value }));
      if (delta) {
        const up = delta.change >= 0;
        const good = up === delta.goodWhenUp;
        node.appendChild(h('div', { class: 'tile-delta' }, h('b', { class: good ? 'is-good' : 'is-bad', text: `${up ? '▲' : '▼'} ${delta.text}` }), ` vs ${periodLabel()}`));
      }
      return node;
    }
    function legend(items, asLine) {
      return h('div', { class: 'legend' }, items.map((it) => h('span', null, h('i', { class: asLine ? 'line' : '', style: { background: it.color } }), it.name)));
    }
    function table(caption, heads, rows, sub) {
      const thead = h('thead', null, h('tr', null, heads.map((hd) => h('th', { class: hd.num ? 'num' : '', scope: 'col', text: hd.label }))));
      const tbody = h('tbody', null, rows.map((r) => h('tr', null, r.map((cell, i) => {
        const td = h('td', { class: heads[i].num ? 'num' : '' });
        if (cell instanceof Node) td.appendChild(cell); else td.textContent = cell;
        return td;
      }))));
      return h('div', null, h('h4', { text: caption }), sub ? h('p', { class: 'chart-sub', text: sub }) : null,
        h('div', { class: 'dtable-wrap' }, h('table', { class: 'dtable', 'aria-label': caption }, thead, tbody)));
    }
    function chartHead(title, sub) {
      return [h('h4', { text: title }), h('p', { class: 'chart-sub', text: sub })];
    }

    /* ---- view: marketplace sales ---- */
    function renderSales(animate) {
      const mks = activeMarkets();
      const { cur, prev } = periods();
      const totalFor = (months) => sum(mks.map((mk) => sum(CHANNELS.map((_, ci) => sum(months.map((mi) => sales(mk, ci, mi)))))));
      const ordersFor = (months) => sum(mks.map((mk) => sum(CHANNELS.map((_, ci) => sum(months.map((mi) => sales(mk, ci, mi) / (AOV[ci] * (0.97 + mi * 0.0022))))))));
      const returnsFor = (months) => sum(mks.map((mk) => sum(CHANNELS.map((_, ci) => sum(months.map((mi) => sales(mk, ci, mi))) * RETURNS[ci])))) / totalFor(months);

      const net = totalFor(cur), netPrev = totalFor(prev);
      const orders = ordersFor(cur), ordersPrev = ordersFor(prev);
      const aov = net / orders, aovPrev = netPrev / ordersPrev;
      const ret = returnsFor(cur), retPrev = returnsFor(prev);
      const rel = (a, b) => (a - b) / b;

      const tiles = h('div', { class: 'tiles' },
        tile('Net sales', aed(net), { change: rel(net, netPrev), goodWhenUp: true, text: pct(Math.abs(rel(net, netPrev))) }, true),
        tile('Orders', compact(orders), { change: rel(orders, ordersPrev), goodWhenUp: true, text: pct(Math.abs(rel(orders, ordersPrev))) }),
        tile('Average order value', `AED ${Math.round(aov)}`, { change: rel(aov, aovPrev), goodWhenUp: true, text: pct(Math.abs(rel(aov, aovPrev))) }),
        tile('Return rate', pct(ret), { change: ret - retPrev, goodWhenUp: false, text: `${Math.abs((ret - retPrev) * 100).toFixed(2)} pts` })
      );

      const byChannel = CHANNELS.map((name, ci) => {
        const parts = {};
        mks.forEach((mk) => { parts[mk] = sum(cur.map((mi) => sales(mk, ci, mi))); });
        return { name, parts, total: sum(Object.values(parts)) };
      }).sort((a, b) => b.total - a.total);

      const monthly = mks.map((mk) => ({ key: mk, name: MARKETS[mk].name, color: MARKETS[mk].color, values: cur.map((mi) => sum(CHANNELS.map((_, ci) => sales(mk, ci, mi)))) }));
      const labels = cur.map((mi) => monthDate(mi));
      const scope = state.market === 'all' ? 'both markets' : MARKETS[state.market].name;

      const left = h('div', { class: 'chart' });
      const right = h('div', { class: 'chart' });

      if (state.table) {
        left.appendChild(table(`Net sales by marketplace, ${scope}`,
          [{ label: 'Marketplace' }].concat(mks.map((mk) => ({ label: MARKETS[mk].name, num: true })), mks.length > 1 ? [{ label: 'Total', num: true }] : []),
          byChannel.map((row) => [row.name].concat(mks.map((mk) => aed(row.parts[mk])), mks.length > 1 ? [aed(row.total)] : []))));
        right.appendChild(table(`Monthly net sales, ${scope}`,
          [{ label: 'Month' }].concat(monthly.map((sr) => ({ label: sr.name, num: true }))),
          labels.map((d, i) => [`${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`].concat(monthly.map((sr) => aed(sr.values[i]))))));
      } else {
        chartHead('Net sales by marketplace', `Last ${state.period} months, ${scope}, ranked`).forEach((n) => left.appendChild(n));
        if (mks.length > 1) left.appendChild(legend(mks.map((mk) => MARKETS[mk])));
        const max = byChannel[0].total;
        const bars = h('div', { class: 'bars' });
        byChannel.forEach((row, ri) => {
          const track = h('div', { class: 'bar-track', style: { width: `calc((100% - 60px) * ${(row.total / max).toFixed(4)})` } });
          mks.forEach((mk) => {
            const seg = h('div', { class: 'bar-seg', style: { flex: `${row.parts[mk]} 1 0`, background: MARKETS[mk].color, animationDelay: `${ri * 40}ms` } });
            if (!animate) seg.style.animation = 'none';
            track.appendChild(seg);
          });
          const node = h('div', { class: 'bar-row', role: 'img', 'aria-label': `${row.name}: ${aed(row.total)}` },
            h('span', { class: 'bar-name', text: row.name }), h('div', { class: 'bar-line' }, track, h('span', { class: 'bar-val', text: compact(row.total) })));
          bindTip(node, () => ({
            title: row.name,
            rows: mks.map((mk) => ({ color: MARKETS[mk].color, value: aed(row.parts[mk]), label: MARKETS[mk].name })),
            total: mks.length > 1 ? { value: aed(row.total), label: 'Total' } : null,
          }));
          bars.appendChild(node);
        });
        left.appendChild(bars);

        chartHead('Monthly net sales', `AED, ${scope}`).forEach((n) => right.appendChild(n));
        if (monthly.length > 1) right.appendChild(legend(monthly, true));
        const host = h('div', { class: 'line-host' });
        right.appendChild(host);
        requestAnimationFrame(() => drawLine(host, monthly, labels, animate));
      }

      view.appendChild(tiles);
      view.appendChild(h('div', { class: 'charts' }, left, right));
    }

    function niceMax(v) {
      const pow = Math.pow(10, Math.floor(Math.log10(v)));
      const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
      const top = steps.find((st) => st * pow >= v) * pow;
      return top;
    }

    function drawLine(host, series, labels, animate) {
      const W = Math.max(280, host.clientWidth || 520);
      const H = 250;
      const multi = series.length > 1;
      const m = { l: 46, r: multi ? 92 : 16, t: 14, b: 26 };
      const n = labels.length;
      const yMax = niceMax(Math.max(...series.map((sr) => Math.max(...sr.values))) * 1.04);
      const x = (i) => m.l + (i * (W - m.l - m.r)) / (n - 1);
      const y = (v) => m.t + (1 - v / yMax) * (H - m.t - m.b);
      const svg = s('svg', { class: 'line-svg', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Line chart of monthly net sales for ${series.map((sr) => sr.name).join(' and ')}` });

      const ticks = 4;
      for (let t = 0; t <= ticks; t++) {
        const v = (yMax / ticks) * t;
        svg.appendChild(s('line', { class: t === 0 ? 'base' : 'grid', x1: m.l, x2: W - m.r, y1: y(v), y2: y(v) }));
        svg.appendChild(s('text', { x: m.l - 8, y: y(v) + 4, 'text-anchor': 'end' }, t === 0 ? '0' : axis(v)));
      }
      const every = n > 8 && W < 460 ? 2 : 1;
      labels.forEach((d, i) => {
        if ((n - 1 - i) % every) return;
        svg.appendChild(s('text', { x: x(i), y: H - 6, 'text-anchor': 'middle' }, MONTH_NAMES[d.getMonth()]));
      });

      series.forEach((sr) => {
        const d = sr.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
        if (!multi) svg.appendChild(s('path', { class: 'wash', d: `${d} L${x(n - 1)} ${y(0)} L${x(0)} ${y(0)} Z`, fill: sr.color }));
        svg.appendChild(s('path', { class: `series${animate ? ' draw' : ''}`, d, stroke: sr.color, pathLength: 1 }));
        svg.appendChild(s('circle', { class: 'dot', cx: x(n - 1), cy: y(sr.values[n - 1]), r: 4, fill: sr.color }));
      });
      if (multi) {
        const ends = series.map((sr) => y(sr.values[n - 1]));
        if (Math.abs(ends[0] - ends[1]) >= 15) {
          series.forEach((sr, i) => svg.appendChild(s('text', { class: 'end-label', x: x(n - 1) + 10, y: ends[i] + 4 }, sr.name)));
        }
      }

      const cross = s('line', { class: 'cross', y1: m.t, y2: H - m.b });
      svg.appendChild(cross);
      const dots = series.map((sr) => { const c = s('circle', { class: 'hover-dot', r: 4.5, fill: sr.color }); svg.appendChild(c); return c; });
      const hit = s('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: 'transparent' });
      const move = (e) => {
        const box = svg.getBoundingClientRect();
        const px = ((e.clientX - box.left) / box.width) * W;
        const i = clamp(Math.round(((px - m.l) / (W - m.l - m.r)) * (n - 1)), 0, n - 1);
        cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.style.visibility = 'visible';
        dots.forEach((c, k) => { c.setAttribute('cx', x(i)); c.setAttribute('cy', y(series[k].values[i])); c.style.visibility = 'visible'; });
        const d = labels[i];
        showTip(e.clientX, e.clientY, `${MONTH_FULL[d.getMonth()]} ${d.getFullYear()}`,
          series.map((sr) => ({ color: sr.color, value: aed(sr.values[i]), label: sr.name })),
          multi ? { value: aed(sum(series.map((sr) => sr.values[i]))), label: 'Total' } : null);
      };
      hit.addEventListener('pointermove', move);
      hit.addEventListener('pointerleave', () => { cross.style.visibility = 'hidden'; dots.forEach((c) => { c.style.visibility = 'hidden'; }); hideTip(); });
      svg.appendChild(hit);

      host.textContent = '';
      host.appendChild(svg);
    }

    /* ---- view: inventory ---- */
    const LINES = [
      ['Bedsheet sets', { ksa: [4200, 62], uae: [2600, 41] }],
      ['Comforters', { ksa: [640, 38], uae: [1500, 21] }],
      ['Duvet covers', { ksa: [2100, 26], uae: [900, 19] }],
      ['Pillows', { ksa: [5200, 31], uae: [2300, 24] }],
      ['Bath towels', { ksa: [1250, 54], uae: [1900, 33] }],
      ['Blankets', { ksa: [3100, 17], uae: [450, 14] }],
      ['Curtains', { ksa: [780, 12], uae: [1400, 9] }],
      ['Cushion covers', { ksa: [1650, 22], uae: [820, 18] }],
    ];
    const STATUS = {
      now: { label: 'Reorder now', color: 'var(--crit)', icon: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="#d03b3b"/><path d="M8 4.2v4.6M8 11.4v.4" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>' },
      soon: { label: 'Reorder soon', color: 'var(--warn)', icon: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.6l6.8 12.2H1.2z" fill="#fab219"/><path d="M8 6.2v3.6M8 11.6v.3" stroke="#0b0b0b" stroke-width="1.6" stroke-linecap="round"/></svg>' },
      ok: { label: 'Healthy', color: 'var(--good)', icon: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="#0ca30c"/><path d="M4.8 8.3l2.2 2.2 4.2-4.7" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
      over: { label: 'Overstock', color: 'var(--serious)', icon: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="#ec835a"/><path d="M8 11.6V4.8M5.2 7.4L8 4.6l2.8 2.8" stroke="#0b0b0b" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
    };
    function renderInventory(animate) {
      const mks = activeMarkets();
      const rate = state.period === 6 ? 1 : 0.92; // a longer window averages in slower months
      const rows = LINES.map(([name, data]) => {
        const onHand = sum(mks.map((mk) => data[mk][0]));
        const daily = sum(mks.map((mk) => data[mk][1])) * rate;
        const cover = onHand / daily;
        const status = cover < 21 ? 'now' : cover < 45 ? 'soon' : cover <= 120 ? 'ok' : 'over';
        return { name, onHand, daily, cover, status };
      }).sort((a, b) => a.cover - b.cover);

      const units = sum(rows.map((r) => r.onHand));
      const avgCover = units / sum(rows.map((r) => r.daily));
      const toReorder = rows.filter((r) => r.status === 'now' || r.status === 'soon').length;
      const scope = state.market === 'all' ? 'both markets' : MARKETS[state.market].name;

      view.appendChild(h('div', { class: 'tiles' },
        tile('Average days of cover', `${Math.round(avgCover)} days`, null, true),
        tile('Units on hand', whole(units)),
        tile('Product lines to reorder', `${toReorder} of ${rows.length}`),
        tile('Overstocked lines', String(rows.filter((r) => r.status === 'over').length))
      ));

      const cap = 150;
      const body = rows.map((r, ri) => {
        const st = STATUS[r.status];
        const fill = h('i', { style: { width: `${clamp(r.cover / cap, 0.03, 1) * 100}%`, background: st.color, animationDelay: `${ri * 40}ms` } });
        if (!animate) fill.style.animation = 'none';
        const meter = h('div', { class: 'cover' }, h('div', { class: 'cover-track', style: { background: `color-mix(in srgb, ${st.color} 20%, #fcfcfb)` } }, fill), h('span', { class: 'num', text: `${Math.round(r.cover)} d` }));
        const status = h('span', { class: 'status' });
        status.innerHTML = st.icon; // fixed, trusted markup defined above
        status.appendChild(document.createTextNode(st.label));
        return [r.name, whole(r.onHand), r.daily.toFixed(0), meter, status];
      });
      const wrap = h('div', { class: 'charts', style: { gridTemplateColumns: 'minmax(0, 1fr)' } },
        h('div', { class: 'chart' }, table('Stock cover by product line',
          [{ label: 'Product line' }, { label: 'On hand', num: true }, { label: 'Daily sales', num: true }, { label: 'Days of cover' }, { label: 'Status' }], body,
          `Most urgent first. Units, ${scope}; daily sales averaged over the last ${state.period} months.`)));
      view.appendChild(wrap);
    }

    /* ---- view: collections ---- */
    const SALESMEN = [
      ['Salesman A', 'ksa', 96, 0.86], ['Salesman B', 'ksa', 74, 0.78], ['Salesman C', 'ksa', 58, 0.91],
      ['Salesman D', 'uae', 82, 0.72], ['Salesman E', 'uae', 61, 0.88], ['Salesman F', 'uae', 45, 0.66],
    ];
    const AGE = [
      { name: '0 to 30 days', share: 0.46, color: '#86b6ef', ink: '#0b0b0b' },
      { name: '31 to 60 days', share: 0.27, color: '#5598e7', ink: '#0b0b0b' },
      { name: '61 to 90 days', share: 0.16, color: '#256abf', ink: '#ffffff' },
      { name: 'Over 90 days', share: 0.11, color: '#104281', ink: '#ffffff' },
    ];
    function renderCollections(animate) {
      const mks = activeMarkets();
      const lift = state.period === 6 ? 1.06 : 1;
      const rows = SALESMEN.filter((r) => mks.includes(r[1])).map(([name, mk, base, rate]) => {
        const invoiced = base * 1000 * state.period * lift;
        return { name, mk, invoiced, collected: invoiced * rate, rate };
      }).sort((a, b) => b.invoiced - a.invoiced);

      const invoiced = sum(rows.map((r) => r.invoiced));
      const collected = sum(rows.map((r) => r.collected));
      const outstanding = invoiced - collected;
      const scope = state.market === 'all' ? 'both markets' : MARKETS[state.market].name;

      view.appendChild(h('div', { class: 'tiles' },
        tile('Collected', aed(collected), null, true),
        tile('Invoiced', aed(invoiced)),
        tile('Outstanding', aed(outstanding)),
        tile('Collection rate', pct(collected / invoiced))
      ));

      const left = h('div', { class: 'chart' });
      const right = h('div', { class: 'chart' });
      const ages = AGE.map((a) => ({ ...a, amount: outstanding * a.share }));

      if (state.table) {
        left.appendChild(table(`Collected against invoiced by salesman, ${scope}`,
          [{ label: 'Salesman' }, { label: 'Market' }, { label: 'Invoiced', num: true }, { label: 'Collected', num: true }, { label: 'Rate', num: true }],
          rows.map((r) => [r.name, MARKETS[r.mk].name, aed(r.invoiced), aed(r.collected), pct(r.rate, 0)])));
        right.appendChild(table('Outstanding by age',
          [{ label: 'Age' }, { label: 'Amount', num: true }, { label: 'Share', num: true }],
          ages.map((a) => [a.name, aed(a.amount), pct(a.share, 0)])));
      } else {
        chartHead('Collected against invoiced, by salesman', `Last ${state.period} months, ${scope}`).forEach((n) => left.appendChild(n));
        left.appendChild(legend([{ name: 'Collected', color: 'var(--s1)' }, { name: 'Invoiced, not yet collected', color: 'var(--s1-wash)' }]));
        const max = rows[0].invoiced;
        const list = h('div', { class: 'coll' });
        rows.forEach((r, ri) => {
          const track = h('div', { class: 'coll-track', style: { width: `${(r.invoiced / max) * 100}%`, animationDelay: `${ri * 40}ms` } }, h('div', { class: 'coll-fill', style: { width: `${r.rate * 100}%` } }));
          if (!animate) track.style.animation = 'none';
          const node = h('div', { class: 'coll-row', role: 'img', 'aria-label': `${r.name}: collected ${aed(r.collected)} of ${aed(r.invoiced)}` },
            h('span', { class: 'coll-name', text: r.name }), h('div', null, track),
            h('span', { class: 'coll-val' }, h('b', { text: compact(r.collected) }), ` of ${compact(r.invoiced)} · ${pct(r.rate, 0)}`));
          bindTip(node, () => ({
            title: `${r.name}, ${MARKETS[r.mk].name}`,
            rows: [{ color: 'var(--s1)', value: aed(r.collected), label: 'Collected' }, { color: 'var(--s1-wash)', value: aed(r.invoiced - r.collected), label: 'Outstanding' }],
            total: { value: aed(r.invoiced), label: 'Invoiced' },
          }));
          list.appendChild(node);
        });
        left.appendChild(list);

        chartHead('Outstanding by age', `${aed(outstanding)} not yet collected, ${scope}`).forEach((n) => right.appendChild(n));
        right.appendChild(legend(ages));
        const bar = h('div', { class: 'ageing', role: 'img', 'aria-label': `Outstanding by age: ${ages.map((a) => `${a.name} ${pct(a.share, 0)}`).join(', ')}` });
        ages.forEach((a) => {
          const part = h('div', { style: { flex: `${a.share} 1 0`, background: a.color, color: a.ink }, text: pct(a.share, 0) });
          bindTip(part, () => ({ title: a.name, rows: [{ color: a.color, value: aed(a.amount), label: `${pct(a.share, 0)} of outstanding` }] }));
          bar.appendChild(part);
        });
        right.appendChild(bar);
        right.appendChild(h('p', { class: 'note', text: 'Older debt is harder to collect, so the darker the block, the more it needs chasing.' }));
        requestAnimationFrame(() => $$('div', bar).forEach((part) => { if (part.scrollWidth > part.clientWidth + 1 || part.clientWidth < 40) part.classList.add('no-label'); }));
      }
      view.appendChild(h('div', { class: 'charts' }, left, right));
    }

    /* KPI tiles run from the figure they showed last to the new one, so a
       filter change reads as a change rather than a swap. A tile whose unit
       changed (K to M, say) is set directly instead. */
    const lastTile = new Map();
    const NUM = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/;
    function countTiles(animate) {
      $$('.tile', view).forEach((t) => {
        const el = $('.tile-value', t);
        const key = `${state.view}|${$('.tile-label', t).textContent}`;
        const text = el.textContent;
        const prev = lastTile.get(key);
        lastTile.set(key, text);
        const m = text.match(NUM);
        if (!animate || reduce || !m || prev === text) return;
        const [, pre, raw, post] = m;
        const to = parseFloat(raw.replace(/,/g, ''));
        let from = 0;
        if (prev) {
          const pm = prev.match(NUM);
          if (!pm || pm[1] !== pre || pm[3] !== post) return;
          from = parseFloat(pm[2].replace(/,/g, ''));
        }
        const decimals = (raw.split('.')[1] || '').length;
        const fmt = raw.includes(',') ? (v) => Math.round(v).toLocaleString('en-US') : (v) => v.toFixed(decimals);
        const start = performance.now();
        const duration = prev ? 450 : 900;
        el.textContent = pre + fmt(from) + post;
        (function tick(now) {
          if (!el.isConnected) return;
          const p = clamp((now - start) / duration, 0, 1);
          el.textContent = pre + fmt(lerp(from, to, easeOut(p))) + post;
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = text;
        })(start);
      });
    }

    function render(animate) {
      hideTip();
      view.textContent = '';
      if (state.view === 'sales') renderSales(animate);
      else if (state.view === 'inventory') renderInventory(animate);
      else renderCollections(animate);
      countTiles(animate);
    }

    $$('[data-view]', dash).forEach((btn) => btn.addEventListener('click', () => {
      state.view = btn.dataset.view;
      $$('[data-view]', dash).forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
      render(!reduce);
    }));
    $$('[data-market]', dash).forEach((btn) => btn.addEventListener('click', () => {
      state.market = btn.dataset.market;
      $$('[data-market]', dash).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      render(!reduce);
    }));
    $$('[data-period]', dash).forEach((btn) => btn.addEventListener('click', () => {
      state.period = Number(btn.dataset.period);
      $$('[data-period]', dash).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      render(!reduce);
    }));
    $('#asTable').addEventListener('change', (e) => { state.table = e.target.checked; render(false); });

    let lastWidth = view.clientWidth;
    let resizeTimer = 0;
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => {
        if (Math.abs(view.clientWidth - lastWidth) < 4) return;
        lastWidth = view.clientWidth;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => render(false), 150);
      }).observe(view);
    }

    // first paint animates when the dashboard scrolls into view
    render(false);
    if ('IntersectionObserver' in window && !reduce) {
      const once = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        once.disconnect();
        lastTile.clear(); // count up from zero the first time the dashboard is seen
        render(true);
      }, { threshold: 0.25 });
      once.observe(dash);
    }
  }

  /* ---------------------------------------------------------------------
     Order-to-cash stepper
     ------------------------------------------------------------------- */
  function flow() {
    const host = $('#flow');
    if (!host) return;
    const list = $('.flow-steps', host);
    const steps = $$('button[data-step]', host);
    const panels = $$('.flow-panel', host);
    let current = 0;
    let auto = 0;

    function go(i) {
      current = (i + steps.length) % steps.length;
      steps.forEach((btn, n) => {
        btn.setAttribute('aria-selected', String(n === current));
        btn.classList.toggle('is-done', n < current);
      });
      panels.forEach((p, n) => p.classList.toggle('is-on', n === current));
      list.style.setProperty('--p', current / (steps.length - 1));
    }
    const stopAuto = () => { clearInterval(auto); auto = 0; host.classList.remove('is-auto'); };

    steps.forEach((btn, n) => {
      btn.addEventListener('click', () => { stopAuto(); go(n); });
      btn.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        stopAuto();
        go(current + (e.key === 'ArrowRight' ? 1 : -1));
        steps[current].focus();
      });
    });

    // walks through the stages once while on screen, until the reader takes over
    if (!reduce && 'IntersectionObserver' in window) {
      let done = false;
      new IntersectionObserver((entries) => {
        if (done) return;
        if (entries[0].isIntersecting && !auto) {
          host.classList.add('is-auto');
          auto = setInterval(() => {
            if (current === steps.length - 1) { done = true; stopAuto(); return; }
            go(current + 1);
          }, 4200);
        } else if (!entries[0].isIntersecting) stopAuto();
      }, { threshold: 0.5 }).observe(host);
    }
    go(0);
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
      const t = clamp((now - start) / 260, 0, 1);
      el.textContent = lerp(from, to, easeOut(t)).toFixed(decimals);
      if (t < 1) el._raf = requestAnimationFrame(tick);
    })(start);
  }
  function paintRange(input) {
    const min = Number(input.min), max = Number(input.max), val = Number(input.value);
    input.style.setProperty('--p', `${((val - min) / (max - min)) * 100}%`);
  }
  function pressGroup(buttons, active) {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === active)));
  }

  function volumetric() {
    const host = $('#volCalc');
    if (!host) return;
    const inL = $('#volL'), inW = $('#volW'), inH = $('#volH'), inKg = $('#volKg');
    const svg = $('#isoBox');
    const verdict = $('#volVerdict');
    let divisor = 5000;
    const shown = { l: 60, w: 40, h: 40 };
    const target = { l: 60, w: 40, h: 40 };
    let raf = 0;

    // isometric projection: length runs down-right, width down-left, height up
    function drawBox(d) {
      const c = Math.cos(Math.PI / 6), sn = Math.sin(Math.PI / 6);
      // true scale for ordinary parcels; very large ones shrink to stay in frame
      const k = Math.min(1.25, 245 / ((d.l + d.w) * c), 165 / ((d.l + d.w) * sn + d.h));
      const P = (x, y, z) => [(x - z) * c * k, ((x + z) * sn - y) * k];
      const minX = -d.w * c * k, maxX = d.l * c * k, minY = -d.h * k, maxY = (d.l + d.w) * sn * k;
      const ox = 150 - (minX + maxX) / 2, oy = 96 - (minY + maxY) / 2;
      const pt = (x, y, z) => { const p = P(x, y, z); return [p[0] + ox, p[1] + oy]; };
      const poly = (pts) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
      const T1 = pt(0, d.h, 0), T2 = pt(d.l, d.h, 0), T3 = pt(d.l, d.h, d.w), T4 = pt(0, d.h, d.w);
      const B2 = pt(d.l, 0, 0), B3 = pt(d.l, 0, d.w), B4 = pt(0, 0, d.w);
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const tapeA = pt(0, d.h, d.w / 2), tapeB = pt(d.l, d.h, d.w / 2), tapeC = pt(d.l, d.h - Math.min(d.h * 0.4, 16), d.w / 2);
      const mL = mid(B4, B3), mW = mid(B3, B2), mH = mid(T4, B4);

      svg.textContent = '';
      svg.appendChild(s('polygon', { class: 'f-left', points: poly([T4, T3, B3, B4]) }));
      svg.appendChild(s('polygon', { class: 'f-right', points: poly([T3, T2, B2, B3]) }));
      svg.appendChild(s('polygon', { class: 'f-top', points: poly([T1, T2, T3, T4]) }));
      svg.appendChild(s('polyline', { class: 'tape', points: poly([tapeA, tapeB, tapeC]) }));
      svg.appendChild(s('text', { x: mL[0] - 16, y: mL[1] + 16 }, `L ${Math.round(d.l)}`));
      svg.appendChild(s('text', { x: mW[0] + 16, y: mW[1] + 16 }, `W ${Math.round(d.w)}`));
      svg.appendChild(s('text', { x: mH[0] - 22, y: mH[1] + 4 }, `H ${Math.round(d.h)}`));
    }
    function animateBox() {
      let moving = false;
      ['l', 'w', 'h'].forEach((key) => {
        if (Math.abs(target[key] - shown[key]) > 0.4) { shown[key] = lerp(shown[key], target[key], 0.28); moving = true; } else shown[key] = target[key];
      });
      drawBox(shown);
      raf = moving ? requestAnimationFrame(animateBox) : 0;
    }

    function update() {
      const l = Number(inL.value), w = Number(inW.value), hgt = Number(inH.value), kg = Number(inKg.value);
      const vol = (l * w * hgt) / divisor;
      const charge = Math.max(vol, kg);

      $('#volLOut').textContent = l;
      $('#volWOut').textContent = w;
      $('#volHOut').textContent = hgt;
      $('#volKgOut').textContent = kg.toFixed(1);
      [inL, inW, inH, inKg].forEach(paintRange);

      target.l = l; target.w = w; target.h = hgt;
      if (reduce) { Object.assign(shown, target); drawBox(shown); } else if (!raf) raf = requestAnimationFrame(animateBox);

      const top = Math.max(vol, kg, 1);
      $('#volBarActual').style.transform = `scaleX(${kg / top})`;
      $('#volBarVol').style.transform = `scaleX(${vol / top})`;
      tween($('#volActualOut'), kg, 1);
      tween($('#volVolOut'), vol, 1);
      tween($('#volChargeOut'), charge, 1);
      $('#volFormula').textContent = `(${l} × ${w} × ${hgt}) ÷ ${divisor} = ${vol.toFixed(1)} kg`;
      $('#volVerdictText').textContent = vol > kg
        ? `Billed on volume. You are paying for ${(vol - kg).toFixed(1)} kg of air.`
        : 'Billed on actual weight. The box is packed tight enough.';
      verdict.classList.toggle('is-air', vol > kg);
    }

    [inL, inW, inH, inKg].forEach((input) => input.addEventListener('input', update));
    const divs = $$('[data-div]', host);
    divs.forEach((btn) => btn.addEventListener('click', () => { divisor = Number(btn.dataset.div); pressGroup(divs, btn); update(); }));
    drawBox(shown);
    update();

    // once, on arrival, the box stretches and settles back, so it is plain
    // that it responds. Any touch or key from the reader cancels it.
    if (!reduce && 'IntersectionObserver' in window) {
      let cancelled = false;
      const cancel = () => { cancelled = true; };
      host.addEventListener('pointerdown', cancel, { once: true });
      host.addEventListener('keydown', cancel, { once: true });
      const demo = () => {
        if (cancelled) return;
        const base = Number(inL.value);
        const peak = Math.min(Number(inL.max), base + 45);
        const start = performance.now();
        const duration = 2200;
        verdict.setAttribute('aria-live', 'off');
        (function step(now) {
          if (cancelled) { verdict.setAttribute('aria-live', 'polite'); return; }
          const t = clamp((now - start) / duration, 0, 1);
          inL.value = Math.round(lerp(base, peak, Math.sin(Math.PI * t)));
          update();
          if (t < 1) requestAnimationFrame(step);
          else { inL.value = base; update(); verdict.setAttribute('aria-live', 'polite'); }
        })(start);
      };
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        setTimeout(demo, 500);
      }, { threshold: 0.9 });
      io.observe($('.calc-stage', host));
    }
  }

  function profit() {
    const host = $('#profitCalc');
    if (!host) return;
    const inPrice = $('#pPrice'), inPct = $('#pCommPct'), inShip = $('#pShipIn'), inCost = $('#pCostIn');
    const verdict = $('#profitVerdict');
    const bar = $('#splitBar');
    const segs = {};
    $$('i', bar).forEach((i) => { segs[i.dataset.k] = i; });
    const markets = { ksa: { vat: 0.15, cur: 'SAR' }, uae: { vat: 0.05, cur: 'AED' } };
    let market = markets.ksa;

    function update() {
      const price = Number(inPrice.value), rate = Number(inPct.value), ship = Number(inShip.value), cost = Number(inCost.value);
      const net = price / (1 + market.vat);
      const vat = price - net;
      const comm = price * (rate / 100);
      const gain = price - vat - comm - ship - cost;
      const margin = net > 0 ? (gain / net) * 100 : 0;

      $('#pPriceOut').textContent = price;
      $('#pCommPctOut').textContent = rate;
      $('#pShipOut').textContent = ship;
      $('#pCostOut').textContent = cost;
      [inPrice, inPct, inShip, inCost].forEach(paintRange);
      $$('.cur', host).forEach((c) => { c.textContent = market.cur; });

      const parts = { vat, comm, ship, cost, profit: Math.max(gain, 0) };
      const total = sumObj(parts);
      Object.keys(parts).forEach((k) => {
        segs[k].style.flexBasis = `${(parts[k] / total) * 100}%`;
        segs[k].style.display = parts[k] <= 0 ? 'none' : '';
      });
      bar.setAttribute('aria-label', `Of ${price} ${market.cur}: VAT ${vat.toFixed(2)}, commission ${comm.toFixed(2)}, shipping ${ship.toFixed(2)}, product cost ${cost.toFixed(2)}, profit ${gain.toFixed(2)}`);

      tween($('#pVat'), vat, 2);
      tween($('#pComm'), comm, 2);
      tween($('#pShip'), ship, 2);
      tween($('#pCost'), cost, 2);
      tween($('#pProfit'), gain, 2);
      tween($('#pProfitBig'), gain, 2);
      tween($('#pMargin'), margin, 1);
      verdict.classList.toggle('is-bad', gain < 0);
    }
    function sumObj(o) { return Object.values(o).reduce((a, b) => a + b, 0); }

    [inPrice, inPct, inShip, inCost].forEach((input) => input.addEventListener('input', update));
    const btns = $$('[data-vat]', host);
    btns.forEach((btn) => btn.addEventListener('click', () => { market = markets[btn.dataset.vat]; pressGroup(btns, btn); update(); }));
    update();
  }

  /* ---------------------------------------------------------------------
     Career step chart (Fig. 4). Dates match the experience list below it;
     time in the current role is counted up to this month.
     ------------------------------------------------------------------- */
  function career() {
    const fig = $('#career');
    if (!fig) return;
    const host = $('.career-host', fig);
    const START = 2021; // the axis begins January 2021
    const ROLES = [
      { name: 'Intern, Data & Operations', y: 2021, m: 3 },
      { name: 'Data Assistant', y: 2021, m: 6 },
      { name: 'Data Analyst', y: 2021, m: 11 },
      { name: 'Senior Data Analyst & Operations Lead', short: 'Senior Data Analyst & Ops Lead', y: 2023, m: 8 },
    ];
    const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const nowIdx = (today.getFullYear() - START) * 12 + today.getMonth();
    const idx = (r) => (r.y - START) * 12 + r.m;
    const tenure = (months) => {
      const yr = Math.floor(months / 12), mo = months % 12;
      return [yr ? `${yr} yr` : '', mo ? `${mo} mo` : ''].filter(Boolean).join(' ');
    };
    const DRAW = 1.8; // seconds, matches .career .is-drawing .step
    let state = reduce || !('IntersectionObserver' in window) ? 'done' : 'waiting'; // waiting -> playing -> done

    function draw() {
      const W = Math.max(300, host.clientWidth || 600);
      const rowGap = 44, top = 46;
      const H = top + rowGap * 3 + 42;
      const ml = 2, mr = 14;
      const end = nowIdx + 1;
      const x = (i) => ml + (i / end) * (W - ml - mr);
      const yRow = (k) => top + rowGap * (3 - k);
      const cls = state === 'done' ? '' : `is-drawing${state === 'waiting' ? ' is-paused' : ''}`;
      const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: cls, 'aria-hidden': 'true' });

      for (let yr = START; (yr - START) * 12 <= end; yr++) {
        const gx = x((yr - START) * 12);
        svg.appendChild(s('line', { class: 'grid', x1: gx, x2: gx, y1: 20, y2: H }));
        svg.appendChild(s('text', { class: 'tick', x: gx + 4, y: 14 }, String(yr)));
      }

      const pts = ROLES.map((r, k) => [x(idx(r)), yRow(k)]);
      const xEnd = x(end);
      let d = `M${pts[0][0].toFixed(1)} ${pts[0][1]}`;
      const at = [0];
      let run = 0;
      for (let k = 1; k < pts.length; k++) {
        d += ` H${pts[k][0].toFixed(1)} V${pts[k][1]}`;
        run += (pts[k][0] - pts[k - 1][0]) + (pts[k - 1][1] - pts[k][1]);
        at.push(run);
      }
      d += ` H${xEnd.toFixed(1)}`;
      const total = run + (xEnd - pts[pts.length - 1][0]);
      svg.appendChild(s('path', { class: 'wash', d: `${d} V${H} H${pts[0][0].toFixed(1)} Z` }));
      svg.appendChild(s('path', { class: 'step', d, pathLength: 1 }));

      host.textContent = '';
      host.appendChild(svg); // labels are measured below, so the svg must be in the page

      ROLES.forEach((r, k) => {
        const g = s('g', { class: 'lab' });
        g.style.setProperty('--at', `${((DRAW * at[k]) / total).toFixed(2)}s`);
        svg.appendChild(g);
        const tx = pts[k][0] + 6, ty = pts[k][1] + 18;
        const role = s('text', { class: 'role', x: tx, y: ty }, r.name);
        g.appendChild(role);
        let lines = 1;
        const fits = () => tx + role.getComputedTextLength() <= W - 2;
        if (!fits() && r.short) role.textContent = r.short;
        if (!fits()) {
          const words = (r.short || r.name).split(' ');
          const half = Math.ceil(words.length / 2);
          role.textContent = words.slice(0, half).join(' ');
          g.appendChild(s('text', { class: 'role', x: tx, y: ty + 15 }, words.slice(half).join(' ')));
          lines = 2;
        }
        const next = k + 1 < ROLES.length ? idx(ROLES[k + 1]) : nowIdx + 1;
        g.appendChild(s('text', { class: 'when', x: tx, y: ty + 15 * lines }, `${MON[r.m]} ${r.y} · ${tenure(next - idx(r))}`));
      });

      const ny = yRow(3);
      const now = s('g', { class: 'lab' });
      now.style.setProperty('--at', `${DRAW}s`);
      now.appendChild(s('circle', { class: 'now-ring', cx: xEnd, cy: ny, r: 4 }));
      now.appendChild(s('circle', { class: 'now-dot', cx: xEnd, cy: ny, r: 4 }));
      now.appendChild(s('text', { class: 'now-label', x: xEnd, y: ny - 12, 'text-anchor': 'end' }, 'Now'));
      svg.appendChild(now);
    }

    draw();
    whenFontsReady(() => { if (state !== 'playing') draw(); }); // re-measure labels in the real font

    if (state === 'waiting') {
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        state = 'playing';
        const svg = $('svg', host);
        if (svg) svg.classList.remove('is-paused');
        setTimeout(() => { state = 'done'; }, (DRAW + 0.8) * 1000);
      }, { threshold: 0.5 });
      io.observe(host);
    }

    let lastW = host.clientWidth;
    let timer = 0;
    window.addEventListener('resize', () => {
      if (Math.abs(host.clientWidth - lastW) < 4) return;
      lastW = host.clientWidth;
      clearTimeout(timer);
      timer = setTimeout(() => { if (state !== 'playing') draw(); }, 150);
    });
  }

  /* ---------------------------------------------------------------------
     Contact
     ------------------------------------------------------------------- */
  let toastTimer = 0;
  function toast(message) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }
  function contact() {
    const btn = $('#copyMail');
    const hint = $('#copyMailHint');
    if (btn) {
      btn.addEventListener('click', async () => {
        const mail = btn.dataset.mail;
        let ok = false;
        try { await navigator.clipboard.writeText(mail); ok = true; } catch (err) {
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
          if (hint) { hint.textContent = 'Copied'; setTimeout(() => { hint.textContent = 'Copy'; }, 2000); }
        } else window.location.href = `mailto:${mail}`;
      });
    }
    $$('[data-resume]').forEach((a) => a.addEventListener('click', () => toast('Résumé download started')));
  }

  function init() {
    motion();
    chrome();
    dashboard();
    flow();
    volumetric();
    profit();
    career();
    contact();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
