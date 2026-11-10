/* HyperPartner demo module v7 — the frame is the agent's hand, the camera follows it, one big subtitle, one verdict.
   Act 1: the sheet alone on the stage; the frame encloses personal data (a bar closes it), reads the fields, checks the
          sums and lands on the error; the camera zooms where the frame works; one subtitle says what happens.
   Act 2: the sheet moves to the left zone, a forest panel brings one verdict, one explanation, one done-line, one button.
   Act 3: a white calculation card on the left, the lead form in the forest panel. */
(function () {
  'use strict';
  var CFG = window.HP_CONFIG || {}, DOCS = window.HP_DOCS, COS = window.HP_COMPANIES || [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var q = new URLSearchParams(location.search);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || q.get('static') === '1';
  if (reduce) document.documentElement.classList.add('static');
  var phoneMQ = window.matchMedia('(max-width: 899px)');
  function phone() { return phoneMQ.matches; }

  function svg(d, cls, vb) { return '<svg class="' + (cls || 'ic') + '" viewBox="' + (vb || '0 0 20 20') + '" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; }
  var ICON = {
    check: svg('<path pathLength="1" d="M4.5 10.5l3.6 3.5 7.4-8"/>'),
    big: svg('<circle pathLength="1" cx="36" cy="36" r="33"/><path pathLength="1" d="M22 37l10 10 19-21"/>', 'big2', '0 0 72 72')
  };
  var SIG = '<svg class="sig" viewBox="0 0 92 30" aria-hidden="true"><path d="M3 22c7-13 13-16 15-9s-4 11 2 5 10-15 14-11-2 12 4 8 11-11 17-7 7 5 13 1 10-7 14-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var el = {
    folders: $('#folders'), scene: $('#scene'), cam: $('#cam'), sheet: $('#sheet'), doc: $('#doc'),
    rf: $('#rf'), rr: $('#rr'), rg: $('#rg'), rc: $('#rc'), seg: $('#seg'), thumb: $('#thumb'), steps: $('#steps'),
    sub: $('#sub'), subT: $('#subT'), skip: $('#skip'), panel: $('#panel'), calcard: $('#calcard'),
    onec: $('#onec'), flies: $('#flies'), whole: $('#whole'), veil: $('#veil'), cur: $('#cur')
  };
  var st = { doc: 0, act: 1, run: 0, timers: [], view: 'agent', started: false, vol: null, sent: false,
    fr: null, raf: 0, cam: null, camKey: 'full', cw: 0, ch: 0, H: 520, played: false };

  /* ---------- scheduler on a virtual clock (pauses in a hidden tab or off screen) ---------- */
  var clock = { t: 0, last: 0, raf: 0, paused: false, hidden: false, off: false, inTick: false };
  function later(fn, ms) {
    var run = st.run;
    if (reduce) { setTimeout(function () { if (run === st.run) fn(); }, 0); return; }
    st.timers.push({ at: clock.t + ms, fn: fn, run: run });
    kick();
  }
  function kick() { if (!clock.raf && !clock.inTick && !clock.paused && st.timers.length) { clock.last = performance.now(); clock.raf = requestAnimationFrame(tick); } }
  function tick(now) {
    clock.raf = 0; clock.inTick = true;
    clock.t += Math.min(250, Math.max(0, now - clock.last)); clock.last = now;
    var due = [], rest = [];
    st.timers.forEach(function (x) { (x.at <= clock.t ? due : rest).push(x); });
    st.timers = rest;
    due.sort(function (a, b) { return a.at - b.at; }).forEach(function (x) { if (x.run === st.run) x.fn(); });
    clock.inTick = false;
    if (st.timers.length && !clock.paused) clock.raf = requestAnimationFrame(tick);
  }
  function updPause() { clock.paused = clock.hidden || clock.off; if (clock.paused) { cancelAnimationFrame(clock.raf); clock.raf = 0; } else kick(); }
  function stopAll() { st.timers = []; st.run++; cancelAnimationFrame(st.raf); }
  /* run f after ms, or right away when a step is replayed instantly */
  function wait(ms, f, fast) { if (fast || reduce) f(); else later(f, ms); }

  /* ---------- helpers ---------- */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt1(n) { return n.toFixed(1).replace('.', ','); }
  function grp(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function plural(n, a, b, c) { var m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c); }
  function goal(name, params) { if (CFG.metrikaId && typeof window.ym === 'function') window.ym(CFG.metrikaId, 'reachGoal', name, params); }
  function D() { return DOCS[st.doc]; }
  function digits(s) { var m = String(s).replace(/ /g, ' ').match(/\d[\d ]*(,\d+)?/); return m ? parseFloat(m[0].replace(/ /g, '').replace(',', '.')) : NaN; }
  function ease(t) {
    var x1 = 0.16, y1 = 1, x2 = 0.3, y2 = 1, u = t;
    function bx(u) { return 3 * x1 * u * (1 - u) * (1 - u) + 3 * x2 * u * u * (1 - u) + u * u * u; }
    for (var i = 0; i < 8; i++) {
      var dx = bx(u) - t, d = 3 * x1 * (1 - u) * (1 - u) + 6 * (x2 - x1) * u * (1 - u) + 3 * (1 - x2) * u * u;
      if (Math.abs(dx) < 1e-4 || !d) break; u -= dx / d; u = Math.min(1, Math.max(0, u));
    }
    return 3 * y1 * u * (1 - u) * (1 - u) + 3 * y2 * u * u * (1 - u) + u * u * u;
  }
  /* count a number inside a text template, e.g. 'Складываю строки: {n} ₽' */
  function countText(node, from, to, ms, tpl) {
    if (reduce) { node.textContent = tpl.replace('{n}', grp(to)); return; }
    var t0 = performance.now(), run = st.run, tok = st.subTok;
    (function f(now) {
      if (run !== st.run || (node === el.subT && tok !== st.subTok)) return;   /* a new subtitle stops the count */
      var p = Math.min(1, (now - t0) / ms);
      node.textContent = tpl.replace('{n}', grp(from + (to - from) * ease(p)));
      if (p < 1) requestAnimationFrame(f);
    })(t0);
  }

  /* ---------- document renderers (v6) ---------- */
  function pii(content, label, html) {
    return '<span class="pii" data-l="' + esc(label) + '"><span class="raw">' + (html ? content : esc(content)) + '</span><span class="rd" aria-hidden="true"><em>' + esc(label) + '</em></span></span>';
  }
  function rich(v) { if (!Array.isArray(v)) return esc(v); return v.map(function (x) { return typeof x === 'object' ? pii(x.p, x.l) : esc(x); }).join(''); }
  function stamp(lines) { return '<div class="stamp" aria-hidden="true"><span>' + lines + '</span></div>'; }
  function foot(d) {
    return '<div class="foot">' + d.sign.map(function (s) {
      return '<div><span class="role">' + esc(s[0]) + '</span><span class="who">' + pii(s[1], 'ФИО') + pii(SIG, 'Подпись', true) + '</span></div>';
    }).join('') + stamp('ООО<br>' + esc(d.stamp) + '<br>МОСКВА') + '</div>';
  }
  function colClass(name, i, last) {
    if (i === 0 || name === 'Ед.') return 'c';
    if (i === 1) return '';
    return 'r' + (i === last ? ' sum' : '');
  }
  function renderTable(d) {
    var h = '';
    if (d.bank) h += '<div class="bank">' + d.bank.map(function (b) { return '<div><span>' + esc(b[0]) + '</span><span>' + esc(b[1]) + '</span></div>'; }).join('') + '</div>';
    var title = '<div class="t"><span class="f" data-k="title">' + esc(d.title) + '</span></div>';
    if (d.codes) h += '<div class="top"><div>' + title + '</div><div class="codes">' + d.codes.map(function (c) { return '<span>' + esc(c[0]) + '</span><span>' + esc(c[1]) + '</span>'; }).join('') + '</div></div>';
    else h += title;
    h += d.head.map(function (r, i) { return '<div class="kv" data-k="head' + i + '"><span>' + esc(r[0]) + '</span><span>' + rich(r[1]) + '</span></div>'; }).join('');
    if (d.basis) h += '<p class="basis">' + esc(d.basis) + '</p>';
    var last = d.cols.length - 1;
    h += '<table><tr>' + d.cols.map(function (c, i) { return '<th class="' + colClass(c, i, -1) + '">' + esc(c) + '</th>'; }).join('') + '</tr>';
    h += d.rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td class="' + colClass(d.cols[i], i, last) + '">' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>';
    h += '<div class="tots">' + d.totals.map(function (t, i) { return '<span>' + esc(t[0]) + '</span><span class="f" data-k="tot' + i + '">' + esc(t[1]) + '</span>'; }).join('') + '</div>';
    if (d.summary) h += '<p class="words">' + esc(d.summary) + '<b>' + esc(d.words) + '</b></p>';
    if (d.note) h += '<p class="note">' + rich(d.note) + '</p>';
    return h + foot(d);
  }
  function renderContract(d) {
    var h = '<div class="t c"><span class="f" data-k="title">' + esc(d.title) + '</span></div>';
    h += '<div class="place"><span>' + esc(d.place[0]) + '</span><span class="f" data-k="date">' + esc(d.place[1]) + '</span></div>';
    h += '<p class="pre">' + rich(d.preamble) + '</p>';
    h += d.clauses.map(function (c) { return '<div class="cl" data-k="' + c[2] + '"><b>' + esc(c[0]) + '</b><span class="f">' + esc(c[1]) + '</span></div>'; }).join('');
    h += '<p class="contact">' + rich(d.contact) + '</p>';
    return h + foot(d);
  }
  function renderCustoms(d) {
    var h = '<div class="t"><span class="f">' + esc(d.title) + '</span></div><div class="grid">';
    h += d.boxes.map(function (b) {
      var inner = Array.isArray(b[2]) ? rich(b[2]) : '<span class="f">' + esc(b[2]) + '</span>';
      return '<div class="box' + (b[4] ? ' w' : '') + '" data-k="' + b[3] + '"><b><i>' + b[0] + '</i>' + esc(b[1]) + '</b><div>' + inner + '</div></div>';
    }).join('');
    return h + '</div><div class="foot cu"><span></span>' + stamp('ФТС<br>ВЫПУСК<br>РАЗРЕШЁН') + '</div>';
  }
  /* the client mail: header lines, body; fragments the robot takes are marked with data-k */
  function mailRich(v) {
    if (!Array.isArray(v)) return esc(v);
    return v.map(function (x) {
      if (typeof x !== 'object') return esc(x);
      if (x.p) return pii(x.p, x.l);
      return '<span class="k" data-k="' + x.k + '">' + esc(x.t) + '</span>';
    }).join('');
  }
  function renderMail(d) {
    var m = d.mail;
    var h = '<div class="mh"><span>От:</span><span>' + mailRich(m.from) + '</span><span>Тема:</span><b>' + esc(m.subject) + '</b></div>';
    h += m.body.map(function (b) { return '<p class="' + (b[0] === 'li' ? 'li' : '') + '">' + mailRich(b[1]) + '</p>'; }).join('');
    return h;
  }
  /* ---------- the 1C:Enterprise 8.3 "Taxi" form (UT 11, "Заказ клиента"): a program window, not a landing card ---------- */
  var I1C = {
    menu: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>',
    find: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M12.6 12.6L17 17" stroke="currentColor" stroke-width="1.8"/></svg>',
    bell: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 14V9a5 5 0 0 1 10 0v5l1.5 1.5h-13zM8.3 17.2a1.9 1.9 0 0 0 3.4 0" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/></svg>',
    star: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.6l2.3 4.7 5.1.7-3.7 3.6.9 5.1L10 14.3l-4.6 2.4.9-5.1L2.6 8l5.1-.7z" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linejoin="round"/></svg>',
    back: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M15 10H5m4-4l-4 4 4 4" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>',
    fwd: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 10h10m-4-4l4 4-4 4" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>',
    more: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="4.5" r="1.6"/><circle cx="10" cy="10" r="1.6"/><circle cx="10" cy="15.5" r="1.6"/></svg>',
    close: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.6"/></svg>',
    drop: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5h7L6 8.5z"/></svg>',
    open: '<svg viewBox="0 0 14 14" aria-hidden="true"><rect x="4.5" y="1.5" width="8" height="8" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M2.5 4.5v8h8" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>',
    cal: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="11" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M2 6.5h12M5 1.5v3M11 1.5v3" stroke="currentColor" stroke-width="1.2"/></svg>'
  };
  function onecInput(type) {
    var btn = type === 'date' ? '<i class="bt">' + I1C.cal + '</i>' : '<i class="bt">' + I1C.drop + '</i><i class="bt">' + I1C.open + '</i>';
    return '<span class="in ' + type + '"><span class="v"></span>' + btn + '</span>';
  }
  function onecField(f) { return '<div class="fr" data-f="' + f[0] + '"><span class="k">' + esc(f[1]) + ':</span>' + onecInput(f[2]) + '</div>'; }
  function renderOnec(d) {
    var o = d.onec;
    el.onec.innerHTML =
      '<div class="sys"><img class="lg" src="logo/1c.svg" alt="1С" width="50" height="26"><i class="ic">' + I1C.menu + '</i><span class="db">' + esc(o.db) + '</span>' +
        '<span class="si"><i class="ic">' + I1C.find + '</i><i class="ic">' + I1C.bell + '</i><i class="ic">' + I1C.star + '</i></span></div>' +
      '<div class="ft"><i class="nb">' + I1C.back + '</i><i class="nb">' + I1C.fwd + '</i><i class="fav">' + I1C.star + '</i>' +
        '<span class="tt" id="onecT">' + esc(o.title0) + '</span><i class="ic">' + I1C.more + '</i><i class="ic">' + I1C.close + '</i></div>' +
      '<div class="cb"><b class="bn def">Провести и закрыть</b><b class="bn">Записать</b><b class="bn">Провести</b><span class="mo">Ещё ▾</span></div>' +
      '<div class="fs">' + o.top.map(onecField).join('') +
        '<div class="tabs">' + o.tabs.map(function (t, i) { return '<span' + (i ? '' : ' class="on"') + '>' + esc(t) + '</span>'; }).join('') + '</div>' +
        '<table class="tb"><tr>' + o.cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr>' +
          Object.keys(o.rows).map(function (k) { return '<tr data-f="' + k + '">' + o.cols.map(function (c, i) { return '<td' + (i === 1 ? ' class="v"' : '') + '></td>'; }).join('') + '</tr>'; }).join('') +
        '</table>' + o.bottom.map(onecField).join('') + '</div>' +
      '<div class="ntf" id="onecNtf" role="status"><b>Проведение:</b><span>' + o.title1.split(' от ').map(esc).join(' <span class="nw">от ') + '</span></span></div>';
  }
  /* ★ the posted title (number + date) steps 22 -> 20 -> 18 until it fits; measured in idle, never in rAF */
  function fitOnecTitle() {
    var go = function () {
      var t = $('#onecT'); if (!t) return;
      t.style.fontSize = '';
      var fs = parseFloat(getComputedStyle(t).fontSize);
      while (t.scrollWidth > t.clientWidth + 1 && fs > 18) { fs -= 2; t.style.fontSize = fs + 'px'; }
    };
    if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 300 }); else setTimeout(go, 50);
  }
  /* phone: the full window is laid out at 460 px and zoomed to the scene width (zoom keeps the layout box right, no CLS) */
  function zoomOnec() {
    if (!st.mail) return;
    el.onec.style.zoom = phone() ? String(Math.min(1, el.scene.clientWidth / 468)) : '';
    /* phone, act 1: the camera window is exactly as tall as the mail, the 1C strip follows it 16 px below */
    if (phone() && st.SW) { el.cam.style.height = Math.round(st.H * (st.cw - 16) / st.SW + 8) + 'px'; measure(); }
    else if (el.cam.style.height) { el.cam.style.height = ''; measure(); }
    /* ★ the window never overflows: first the tabs over the table go, then the icons of the system bar (measured in idle) */
    var go = function () {
      el.onec.classList.remove('notabs', 'noicons');
      if (phone()) return;
      /* the fields must fit; the notification below them may hang out of the window */
      var fs = $('.fs', el.onec), over = function () { return fs.offsetTop + fs.offsetHeight > el.onec.clientHeight + 1; };
      if (over()) el.onec.classList.add('notabs');
      if (over()) el.onec.classList.add('noicons');
    };
    if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 300 }); else setTimeout(go, 50);
  }
  /* label of a 1C field for the phone strip */
  function onecLabel(d, key) {
    if (d.onec.rows[key]) return 'Товары';
    var f = d.onec.top.concat(d.onec.bottom).filter(function (x) { return x[0] === key; })[0];
    return f ? f[1] : '';
  }
  function onecType(d, key) {
    var f = d.onec.top.concat(d.onec.bottom).filter(function (x) { return x[0] === key; })[0];
    return f ? f[2] : 'ref';
  }
  function renderDoc(d) { return d.kind === 'mail' ? renderMail(d) : d.kind === 'contract' ? renderContract(d) : d.kind === 'customs' ? renderCustoms(d) : renderTable(d); }
  function fieldEl(key) { return el.doc.querySelector('[data-k="' + key + '"]'); }
  function markTarget(key) { var t = fieldEl(key); return t ? (t.matches('.f') ? t : (t.querySelector('.f') || t)) : null; }
  function errCo(d) { return d.callouts.filter(function (c) { return c.kind === 'err'; })[0]; }

  /* ---------- geometry: zones in sheet units from offsets (transforms do not affect them), cached per document ---------- */
  var zones = null;
  function box(n) {
    if (!n) return null;
    if (!zones) zones = new Map();
    if (zones.has(n)) return zones.get(n);
    var x = 0, y = 0, e = n;
    while (e && e !== el.sheet) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    var b = { x: x - 6, y: y - 2, w: n.offsetWidth + 12, h: n.offsetHeight + 4 };
    zones.set(n, b);
    return b;
  }
  function union(list) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    list.forEach(function (b) { x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h); });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  /* ---------- camera: translate + scale of the sheet inside the camera window ---------- */
  function measure() { st.cw = el.cam.clientWidth; st.ch = el.cam.clientHeight; st.H = el.sheet.offsetHeight; st.SW = el.sheet.offsetWidth; }
  function camOverview(zone) {
    var W = st.cw, H = st.ch, ph = phone(), SW = st.SW || 720;
    if (ph) { var sp = (W - 16) / SW; return { s: sp, x: 8, y: 8 }; }
    if (zone === 'mail') {
      /* the mail sits in the left 54 % at its own size (its text is already large), no zoom */
      var mw = W * 0.54 - 30, sm = Math.min(1, (mw - 20) / SW, (H - 130) / st.H);
      return { s: sm, x: 20 + (mw - SW * sm) / 2, y: 4 };
    }
    if (zone === 'left') {
      var zw = W * 0.56 - 30, s1 = Math.min((H - 40) / st.H, (zw - 32) / SW);
      return { s: s1, x: 20 + (zw - SW * s1) / 2, y: Math.max(16, (H - 20 - st.H * s1) / 2) };
    }
    var s = Math.min((H - 110) / st.H, (W - 80) / SW);
    return { s: s, x: (W - SW * s) / 2, y: 16 };
  }
  /* the verdict close-up: the evidence centred in the left zone, as large as fits (up to the focus scale) */
  function camEvidence(b) {
    var W = st.cw, H = st.ch;
    if (phone()) { var sp = Math.min(1.4, (W - 24) / b.w); return { s: sp, x: W / 2 - (b.x + b.w / 2) * sp, y: H / 2 - (b.y + b.h / 2) * sp }; }
    var zw = W * 0.56 - 30, s = Math.min(1.75, (zw - 36) / b.w, (H - 80) / b.h);
    return { s: s, x: 20 + zw / 2 - (b.x + b.w / 2) * s, y: (H - 20) / 2 - (b.y + b.h / 2) * s };
  }
  /* focus: the sheet text in the zone at about 22-24 px (sheet text is 13 px), the zone a bit above the middle */
  function camFocus(b) {
    var W = st.cw, H = st.ch, ph = phone(), m = ph ? 12 : 30;
    /* ★ phone: the frame zone fits the camera width with 12 px margins, the scale between 1.0 and 1.4 */
    var s = ph ? Math.max(1, Math.min(1.4, (W - 24) / b.w)) : 1.75;
    var x = b.w * s > W - m * 2 ? m - b.x * s : W / 2 - (b.x + b.w / 2) * s;
    x = Math.min(x, m);                                /* never show more stage left of the sheet than the margin */
    x = Math.max(x, W - m - (st.SW || 720) * s);       /* nor right of it */
    var y = (ph ? H * 0.5 : (H - 130) * 0.48) - (b.y + b.h / 2) * s;
    /* the working zone never sinks into the bottom 130 px (fade + subtitle) */
    if (!ph) y = Math.min(y, H - 130 - (b.y + b.h) * s);
    return { s: s, x: x, y: y };
  }
  function camTo(c, instant) {
    st.cam = c;
    var tr = 'translate(' + c.x.toFixed(1) + 'px,' + c.y.toFixed(1) + 'px) scale(' + c.s.toFixed(4) + ')';
    if (instant || reduce) { el.sheet.classList.remove('moving'); el.sheet.style.transform = tr; return; }
    el.sheet.classList.add('moving');
    el.sheet.style.transform = tr;
  }
  function camKey(key, instant) {
    if (st.mail && key !== 'mail') return;           /* the mail is never zoomed */
    st.camKey = key;
    camTo(typeof key === 'string' ? camOverview(key) : key.ev ? camEvidence(key) : camFocus(key), instant);
  }

  /* ---------- the frame: rounded mint rect, corner ticks, glow; moves on rAF in sheet units ---------- */
  function rectAttrs(r, b, g, gy) { r.setAttribute('x', b.x - g); r.setAttribute('y', b.y - gy); r.setAttribute('width', Math.max(0, b.w + g * 2)); r.setAttribute('height', Math.max(0, b.h + gy * 2)); }
  function drawFrame(b) {
    rectAttrs(el.rr, b, 0, 0); rectAttrs(el.rg, b, 4, 1);
    var c = Math.min(10, b.w / 4, b.h / 2), x2 = b.x + b.w, y2 = b.y + b.h, o = 2;
    el.rc.setAttribute('d',
      'M' + (b.x - o) + ' ' + (b.y - o + c) + 'V' + (b.y - o) + 'H' + (b.x - o + c) +
      'M' + (x2 + o - c) + ' ' + (b.y - o) + 'H' + (x2 + o) + 'V' + (b.y - o + c) +
      'M' + (x2 + o) + ' ' + (y2 + o - c) + 'V' + (y2 + o) + 'H' + (x2 + o - c) +
      'M' + (b.x - o + c) + ' ' + (y2 + o) + 'H' + (b.x - o) + 'V' + (y2 + o - c));
    /* spotlight veil: the sheet rectangle minus the rounded frame (even-odd), same frame of the same rAF */
    var W = st.SW || 720, Hh = st.H || 600, r = Math.min(7, b.w / 2, b.h / 2);
    el.veil.setAttribute('d', 'M0 0H' + W + 'V' + Hh + 'H0Z' +
      'M' + (b.x + r) + ' ' + b.y + 'H' + (x2 - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + x2 + ' ' + (b.y + r) +
      'V' + (y2 - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (x2 - r) + ' ' + y2 + 'H' + (b.x + r) +
      'A' + r + ' ' + r + ' 0 0 1 ' + b.x + ' ' + (y2 - r) + 'V' + (b.y + r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (b.x + r) + ' ' + b.y + 'Z');
    st.fr = b;
  }
  function frameTo(to, ms) {
    if (!to) return;
    var from = st.fr;
    cancelAnimationFrame(st.raf);
    el.rf.classList.add('spot');                      /* the spotlight comes with the first enclosure */
    if (!from || !el.rf.classList.contains('on') || reduce || !ms) { drawFrame(to); el.rf.classList.add('on'); return; }
    var t0 = performance.now();
    (function f(now) {
      var p = Math.min(1, (now - t0) / ms), e = ease(p);
      drawFrame({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e });
      if (p < 1) st.raf = requestAnimationFrame(f);
    })(t0);
  }
  function frameOff() { cancelAnimationFrame(st.raf); el.rf.classList.remove('on', 'clay', 'pulse', 'spot'); st.fr = null; }

  /* ---------- flights (from v5/v6): a copy of a value leaves the mail along a light arc and lands in its 1C field ---------- */
  function fly(from, to, text, done) {
    if (!from || !to || reduce || phone()) { if (done) done(); return; }
    var a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    var n = document.createElement('div');
    n.className = 'fly'; n.textContent = text;
    el.flies.appendChild(n);
    var w = Math.round(text.length * 10 + 36), h = 38;   /* estimated, no layout read of the new node */
    var x0 = a.left + Math.min(a.width / 2, 160) - w / 2, y0 = a.top + a.height / 2 - h / 2;
    var x1 = b.right - w, y1 = b.top + b.height / 2 - h / 2;
    var mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 60;
    var anim = n.animate([
      { transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(.9)', opacity: 0 },
      { transform: 'translate(' + (x0 + (mx - x0) * 0.25) + 'px,' + (y0 + (my - y0) * 0.45) + 'px) scale(1)', opacity: 1, offset: 0.16 },
      { transform: 'translate(' + mx + 'px,' + my + 'px) scale(1.04)', opacity: 1, offset: 0.55 },
      { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(1)', opacity: 1, offset: 0.92 },
      { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(.96)', opacity: 0 }
    ], { duration: 550, easing: 'cubic-bezier(0.65,0,0.35,1)', fill: 'forwards' });
    var run = st.run;
    anim.onfinish = function () { n.remove(); if (run === st.run && done) done(); };
  }
  function fillField(key, html, flash) {
    var fr = el.onec.querySelector('[data-f="' + key + '"]'); if (!fr) return;
    var row = D().onec.rows[key];
    if (row) {
      /* a table row: all four cells; the just added row is highlighted as in 1C */
      $$('td', fr).forEach(function (td, i) { td.textContent = row[i]; });
      $$('tr.new', el.onec).forEach(function (r) { r.classList.remove('new'); });
      fr.classList.add('got', 'new');
      setCur(key, esc(row[1] + ' · ' + row[2] + ' ' + row[3]), flash);
      return;
    }
    fr.querySelector('.v').innerHTML = html;
    fr.classList.add('got');
    if (flash && !reduce) { fr.classList.remove('flash'); requestAnimationFrame(function () { fr.classList.add('flash'); }); }
    setCur(key, html, flash);
  }
  /* phone: under the mail a narrow 1C system strip and the one field the value goes into */
  function setCur(key, html, flash) {
    var d = D();
    el.cur.innerHTML = '<div class="sy"><img class="lg" src="logo/1c.svg" alt="1С" width="38" height="20"><span>' + esc(d.onec.doc) + '</span></div>' +
      '<div class="fr' + (html ? ' got' : '') + '"><span class="k">' + esc(onecLabel(d, key)) + ':</span>' + onecInput(d.onec.rows[key] ? 'ref' : onecType(d, key)) + '</div>';
    $('.v', el.cur).innerHTML = html;
    var fr = $('.fr', el.cur);
    if (flash && !reduce) requestAnimationFrame(function () { fr.classList.add('flash'); });
  }
  /* the page heading and the step names belong to the document (the mail folder has its own) */
  var H1_DEF = null, STEPS_DEF = ['Чтение', 'Проверка', 'Расчёт'];
  function setHead(d, instant) {
    var h = $('.head');
    if (H1_DEF === null) H1_DEF = h.innerHTML;
    var html = d.h1 ? '<span class="ln">' + d.h1[0] + '</span> <span class="ln">' + d.h1[1] + '</span>' : H1_DEF;
    var steps = d.steps || STEPS_DEF;
    $$('.w', el.steps).forEach(function (w, i) { w.textContent = steps[i]; });
    if (h.innerHTML === html) return;
    if (instant || reduce || !h.animate) { h.innerHTML = html; return; }
    /* ★ cross-fade: out 150 ms, swap, in 260 ms; the entrance class is dropped so the new lines do not rise again */
    document.documentElement.classList.remove('intro');
    var out = h.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'cubic-bezier(0.16,1,0.3,1)', fill: 'forwards' });
    out.onfinish = function () {
      h.innerHTML = html;
      h.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'cubic-bezier(0.16,1,0.3,1)' });
      out.cancel();
    };
  }
  function focusField(key, on) { var fr = el.onec.querySelector('[data-f="' + key + '"]'); if (fr) fr.classList.toggle('focus', on); }

  /* ---------- subtitle ---------- */
  function setSub(text, mode, keep) {
    el.sub.classList.toggle('live', mode === 'live');
    el.sub.classList.toggle('err', mode === 'err');
    el.sub.classList.toggle('done', mode === 'done');
    if (el.subT.textContent === text) return;
    if (!keep) st.subTok = (st.subTok || 0) + 1;
    if (keep || reduce || !el.subT.textContent || !text) { el.subT.textContent = text; return; }
    /* cross-fade: a ghost copy of the old line fades out over the new one fading in; never an empty capsule */
    var box0 = el.subT.parentNode;
    $$('.ghost', box0).forEach(function (g) { g.remove(); });
    var ghost = document.createElement('span');
    ghost.className = 'ghost'; ghost.setAttribute('aria-hidden', 'true'); ghost.textContent = el.subT.textContent;
    box0.appendChild(ghost);
    ghost.addEventListener('animationend', function () { ghost.remove(); });
    el.subT.textContent = text;
    el.subT.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'cubic-bezier(0.16,1,0.3,1)' });
  }

  /* ---------- act 1: the script of the frame ---------- */
  /* the second robot: the same frame encloses fragments of the mail, copies fly into the 1C order */
  function buildMail(d) {
    var sc = [];
    sc.push({ tag: 'open', dur: 800, fn: function (fast) { camKey('mail', fast); setSub('Открываю ' + d.acc, 'live', fast); } });
    var list = $$('.pii', el.doc).map(function (n) { return { n: n, b: box(n) }; }).sort(function (a, b) { return a.b.y - b.b.y || a.b.x - b.b.x; });
    list.forEach(function (p, i) {
      sc.push({ tag: 'pii', dur: 420, fn: function (fast) {
        frameTo(p.b, fast ? 0 : 380);
        if (!i) setSub('Скрываю персональные данные · 0 из ' + list.length, 'live', fast);
        wait(340, function () { p.n.classList.add('masked'); setSub('Скрываю персональные данные · ' + (i + 1) + ' из ' + list.length, 'live', true); }, fast);
      } });
    });
    d.parse.forEach(function (p) {
      var frs = p.k.map(function (k) { return el.doc.querySelector('[data-k="' + k + '"]'); });
      /* frame 0.4 s -> hold 0.2 s -> the copy flies 0.55 s and lands before the next subtitle */
      sc.push({ tag: 'parse', dur: p.k.length > 1 ? 1650 : 1100, fn: function (fast) {
        setSub(p.say, 'live', fast);
        frs.forEach(function (fr, j) {
          var key = p.k[j], val = p.v[j];
          wait(j * 550, function () {
            frameTo(box(fr), fast ? 0 : 400);
            var target = el.onec.querySelector('[data-f="' + key + '"] .v');   /* inside the input / the "Номенклатура" cell */
            /* ★ the copy carries the mail's words; the 1C value appears only after landing */
            wait(600, function () { fly(fr, target, p.f ? p.f[j] : val, function () { fillField(key, esc(val), !fast); }); }, fast);
          }, fast);
        });
      } });
    });
    var LOCK = '<svg class="lock" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4.5" y="9" width="11" height="8" rx="2"/><path d="M7 9V6.8a3 3 0 0 1 6 0V9"/></svg>';
    sc.push({ tag: 'contact', dur: 1000, fn: function (fast) {
      el.rf.classList.remove('on', 'spot');            /* the frame leaves the mail and goes to the 1C field */
      setSub('Подставляю контакт из справочника', 'live', fast);
      focusField('contact', true);
      wait(350, function () { fillField('contact', LOCK + 'из справочника', !fast); }, fast);
    } });
    sc.push({ tag: 'resp', dur: 1000, fn: function (fast) {
      focusField('contact', false); focusField('resp', true);
      setSub('Назначаю ответственного: отдел продаж', 'live', fast);
      wait(350, function () { fillField('resp', 'Отдел продаж', !fast); }, fast);
    } });
    sc.push({ tag: 'done', dur: 1700, fn: function (fast) {
      focusField('resp', false);
      /* posting: the title becomes the number and date, the 1C notification pops up in the bottom right corner */
      $('#onecT').textContent = d.onec.title1;
      $$('tr.new', el.onec).forEach(function (r) { r.classList.remove('new'); });
      $('#onecNtf').classList.add('on');
      fitOnecTitle();
      setSub('Заказ заведён в 1С', 'done', fast);
    } });
    sc.push({ tag: 'end', dur: 0, fn: function (fast) { act2(!fast); } });
    return sc;
  }
  function buildScript(d) {
    if (d.kind === 'mail') return buildMail(d);
    var sc = [], err = errCo(d), errKey = err && err.at;
    sc.push({ tag: 'open', dur: 900, fn: function (fast) { camKey('full', fast); setSub('Открываю ' + d.acc, 'live', fast); } });

    /* personal data, stops by lines of the sheet */
    var list = $$('.pii', el.doc).map(function (n) { return { n: n, b: box(n) }; })
      .sort(function (a, b) { return a.b.y - b.b.y || a.b.x - b.b.x; });
    var rows = [];
    list.forEach(function (p) { var r = rows[rows.length - 1]; if (r && Math.abs(p.b.y - r[0].b.y) < 10) r.push(p); else rows.push([p]); });
    var total = list.length, k = 0;
    rows.forEach(function (row) {
      var rb = union(row.map(function (p) { return p.b; }));
      row.forEach(function (p, j) {
        var idx = ++k, first = j === 0, step = total > 6 ? 420 : 470;
        sc.push({ tag: 'pii', dur: first ? 760 : step, fn: function (fast) {
          if (first) camKey(rb, fast);
          frameTo(p.b, fast ? 0 : (first ? 650 : step - 30));
          if (idx === 1) setSub('Скрываю персональные данные · 0 из ' + total, 'live', fast);
          wait(first ? 650 : step - 100, function () {
            p.n.classList.add('masked');
            setSub('Скрываю персональные данные · ' + idx + ' из ' + total, 'live', true);
          }, fast);
        } });
      });
    });

    /* reading: one stop per zone, the error zone is read during the check */
    var stops = [], byKey = {};
    d.fields.forEach(function (f) {
      if (f[2] === errKey) return;
      if (!byKey[f[2]]) { byKey[f[2]] = { key: f[2], names: [], vals: [] }; stops.push(byKey[f[2]]); }
      byKey[f[2]].names.push(f[0]); byKey[f[2]].vals.push(f[1]);
    });
    stops.forEach(function (s) { s.z = box(s.key === 'title' ? markTarget(s.key) : fieldEl(s.key)); });
    /* zones on neighbouring lines (title and date of a contract) are read in one stop */
    stops = stops.reduce(function (acc, s) {
      var l = acc[acc.length - 1];
      var apart = l && s.z && l.z && (s.z.x >= l.z.x + l.z.w || s.z.x + s.z.w <= l.z.x);   /* side by side, not one under another */
      if (apart && Math.abs(s.z.y - (l.z.y + l.z.h)) < 12 && s.z.h < 40 && l.z.h < 40) {
        l.z = union([l.z, s.z]); l.names = l.names.concat(s.names); l.vals = l.vals.concat(s.vals); return acc;
      }
      acc.push(s); return acc;
    }, []);
    stops.forEach(function (s) {
      var z = s.z;
      sc.push({ tag: 'read', key: s.key, dur: 1100, fn: function (fast) {
        camKey(z, fast); frameTo(z, fast ? 0 : 550);
        setSub('Читаю: ' + s.names.join(', ') + ' — ' + s.vals.join(', '), 'live', fast);
      } });
    });

    var et = errKey && markTarget(errKey), eb = box(et);
    function hitNow(fast) {
      el.rf.classList.add('clay');
      if (et) et.classList.add('hit', 'on');
      if (!fast) { el.rf.classList.remove('pulse'); requestAnimationFrame(function () { el.rf.classList.add('pulse'); }); }
    }
    if (d.kind === 'table') {
      /* the column frame sits 3 px inside the "Sum" cells, so the next column is never covered */
      var cells = $$('td.sum', el.doc), cb = cells.map(function (c) { var b = box(c); return { x: b.x + 9, y: b.y + 2, w: b.w - 18, h: b.h - 4 }; }), ub = union(cb);
      var first = digits(cells[0].textContent), final = digits(d.verdict.rows[0][1]);
      sc.push({ tag: 'sum', dur: 1200, fn: function (fast) {
        camKey(ub, fast); frameTo(cb[0], fast ? 0 : 500);
        setSub('Складываю строки: ' + grp(first) + ' ₽', 'live', fast);
        wait(520, function () {
          frameTo(ub, fast ? 0 : 650);              /* the frame stretches down the column, like a mouse selection */
          if (fast) el.subT.textContent = 'Складываю строки: ' + grp(final) + ' ₽';
          else countText(el.subT, first, final, 600, 'Складываю строки: {n} ₽');
        }, fast);
      } });
      sc.push({ tag: 'total', dur: 1100, fn: function (fast) {
        camKey(eb, fast); frameTo(eb, fast ? 0 : 550);
        setSub(d.say.total + ' ' + d.verdict.rows[1][1], 'live', fast);
        wait(450, function () { el.rf.classList.add('clay'); }, fast);
      } });
      sc.push({ tag: 'err', dur: 1600, fn: function (fast) { hitNow(fast); setSub(d.say.err, 'err', fast); } });
    } else {
      if (d.say.pre) {
        var pb = box(fieldEl(d.say.pre));
        sc.push({ tag: 'pre', dur: 900, fn: function (fast) { camKey(pb, fast); frameTo(pb, fast ? 0 : 550); } });
      }
      sc.push({ tag: 'err', dur: 1900, fn: function (fast) {
        camKey(eb, fast); frameTo(eb, fast ? 0 : 500);
        wait(420, function () { hitNow(fast); setSub(d.say.err, 'err', fast); }, fast);
      } });
    }
    sc.push({ tag: 'end', dur: 0, fn: function (fast) { act2(!fast); } });
    return sc;
  }
  /* play the script, or replay it instantly up to a tag (deep links, skip) */
  function play(stopTag, stopIdx) {
    var d = D(), sc = (st.script && st.script.doc === st.doc && !stopTag) ? st.script.sc : buildScript(d);
    st.script = null;
    if (stopTag) {
      var seen = 0;
      for (var i = 0; i < sc.length; i++) {
        if (sc[i].tag === 'end') break;
        sc[i].fn(true);
        if (sc[i].tag === stopTag && seen++ === (stopIdx || 0)) break;
      }
      return;
    }
    var t = 0;
    sc.forEach(function (s) { later(function () { s.fn(false); }, t); t += s.dur; });
    st.played = true;
    prebuild2();
  }

  /* ---------- acts ---------- */
  function setSteps(n) {
    st.act = n;
    $$('li', el.steps).forEach(function (li) {
      var s = +li.dataset.s;
      li.classList.toggle('on', s === n); li.classList.toggle('done', s < n);
      li.querySelector('.n').innerHTML = s < n ? ICON.check : String(s);
    });
    el.scene.classList.toggle('act2', n === 2);
    el.scene.classList.toggle('act3', n === 3);
  }
  /* verdict panel: title -> number -> why -> "further without a person" + three lines (+ the notification for the mail) -> button */
  function panel2(d) {
    el.panel.classList.remove('compact', 'tight');
    el.panel.innerHTML = '<div class="pin" style="display:contents">' +
      '<h2>' + esc(d.verdict.title) + '</h2><p class="big' + (d.kind === 'mail' ? ' ok' : '') + '" id="big">' + esc(d.big) + '</p>' +
      '<p class="why">' + esc(d.why) + '</p>' +
      '<p class="cap">Дальше без человека</p>' +
      '<ul class="acts">' + d.acts.map(function (a) { return '<li>' + ICON.check + '<span>' + esc(a) + '</span></li>'; }).join('') + '</ul>' +
      (d.note ? '<p class="note">' + esc(d.note) + '</p>' : '') +
      '<button class="cta" id="cta" type="button" data-go="3"><span>Посчитать для моего потока</span> <span class="arr" aria-hidden="true">→</span></button></div>';
    st.pre2 = st.doc;
  }
  /* the evidence of the verdict: sums + totals, the liability clause, boxes 31-33 */
  function evidence(d) {
    var b;
    /* the invoice evidence: the "Сумма" column only (last cell of each row) and the total values */
    /* ★ the left edge goes just left of the total values: right of the "Цена" cells and of the total labels, so the frame crosses no other text */
    if (d.kind === 'table') {
      var vals = $$('.tots .f', el.doc).map(box);
      var u = union($$('tr', el.doc).slice(1).map(function (tr) { return box(tr.lastElementChild); }).concat(vals));
      var vx = Math.min.apply(null, vals.map(function (v) { return v.x; })) - 4;
      b = { x: vx, y: u.y, w: u.x + u.w - 4 - vx, h: u.h };
    }
    else if (d.kind === 'contract') b = union([head(fieldEl('c2')), box(fieldEl('c2').querySelector('.f'))]);
    else b = union([head(fieldEl('b31')), box(fieldEl('b31').querySelector('.f')), box(fieldEl('b33'))]);
    return { x: b.x, y: b.y, w: b.w, h: b.h, ev: true };
  }
  /* ★ the heading line of a clause/box is a full-width block: take its height, not its width, so the close-up stays close */
  function head(n) { var h = box(n.querySelector('b')); return { x: h.x, y: h.y, w: 10, h: h.h }; }
  function setWhole(whole, instant) {
    st.whole = whole;
    el.whole.textContent = whole ? 'Крупно' : 'Весь документ';
    el.rf.classList.toggle('spot', !whole);
    camKey(whole ? 'left' : st.ev, instant);
  }
  /* the verdict panel is built ahead in idle time; the transition only switches classes and moves the camera */
  function prebuild2() {
    /* ★ the evidence box is measured here, in idle, so entering act 2 reads no layout */
    var doc = st.doc, go = function () {
      if (st.doc !== doc || st.act !== 1) return;
      if (st.pre2 !== doc) panel2(D());
      if (!st.mail && st.evDoc !== doc) { st.ev = evidence(D()); st.evDoc = doc; }
    };
    if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 2000 }); else setTimeout(go, 400);
  }
  /* the panel never overflows: if its items are taller than the panel, first tighter spacing, only then the explanation line goes */
  function fitPanel() {
    if (st.act !== 2) return;
    var items = $$('.pin > *', el.panel);
    if (items.length && !phone()) {
      var over = function () {
        var r = el.panel.getBoundingClientRect(), cs = getComputedStyle(el.panel);
        return items[items.length - 1].getBoundingClientRect().bottom - items[0].getBoundingClientRect().top > r.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) + 2;
      };
      el.panel.classList.remove('compact', 'tight');
      if (over()) { el.panel.classList.add('compact'); if (over()) el.panel.classList.add('tight'); }
    }
    fitBig();
  }
  /* ★ the big number is never cut: measured by its final text (not the counting one), the size drops until it fits the panel width */
  var bigCtx = null;
  function fitBig() {
    var big = $('#big'); if (!big) return;
    big.style.fontSize = '';
    var cs = getComputedStyle(big), fs = parseFloat(cs.fontSize), txt = D().big;
    bigCtx = bigCtx || document.createElement('canvas').getContext('2d');
    bigCtx.font = cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
    var w = bigCtx.measureText(txt).width + (parseFloat(cs.letterSpacing) || 0) * txt.length + 2, avail = big.clientWidth;
    if (avail && w > avail) big.style.fontSize = Math.floor(fs * avail / w) + 'px';
  }
  function act2(anim) {
    var d = D();
    stopAll(); setSteps(2); setSub(el.subT.textContent, 'done', true);
    if (st.pre2 !== st.doc || !$('#big')) panel2(d);
    if (phone()) measure();
    if (!st.mail) {
      /* the verdict is a close-up of the evidence, held by the spotlight, with a clay frame */
      if (st.evDoc !== st.doc) { st.ev = evidence(d); st.evDoc = st.doc; }
      el.rf.classList.add('clay');
      frameTo(st.ev, anim ? 600 : 0);
      setWhole(false, !anim);
    }
    /* ★ measured in idle after the frame is drawn: layout is clean, the read costs nothing */
    if (window.requestIdleCallback) requestIdleCallback(fitPanel, { timeout: 400 }); else setTimeout(fitPanel, 100);
    var big = $('#big'), n = digits(d.big);
    if (anim && !st.mail && !isNaN(n) && /^[+\d]/.test(d.big)) {
      var tpl = d.big.replace(/\d[\d  ]*\d/, '{n}');
      setTimeout(function () { countText(big, 0, n, 700, tpl); }, 300);
    }
    big.classList.add('on');
    goal('hp_step2');
    if (phone()) scrollToY(el.scene.getBoundingClientRect().top + window.scrollY - headerH() - 8);
  }
  function act3() {
    var d = D();
    if (st.act < 2) { stopAll(); play('end'); act2(false); }
    stopAll(); setSteps(3); setSub(el.subT.textContent, 'done', true);
    el.rf.classList.remove('spot');
    renderCalc(d);
    el.panel.innerHTML = st.sent ? sentHTML() : formHTML(); st.pre2 = -1;
    if (!st.sent) bindLead();
    goal('hp_step3');
    if (phone()) scrollToY(el.calcard.getBoundingClientRect().top + window.scrollY - headerH() - 8);
  }
  function headerH() { return $('.hdr').offsetHeight; }
  function scrollToY(y) { window.scrollTo({ top: Math.max(0, y), behavior: reduce ? 'auto' : 'smooth' }); }

  /* ---------- act 3: calculation ---------- */
  function hoursOf(d, n) { return Math.round(n * d.calc.min * 12 / 60 / 10) * 10; }
  function stakes(v) { var r = Math.max(0.1, Math.round(v * 10) / 10); return r % 1 === 0 ? r + ' ' + plural(r, 'ставка', 'ставки', 'ставок') : fmt1(r) + ' ставки'; }
  function renderCalc(d) {
    var c = d.calc, n = st.vol != null ? Math.min(c.hi, Math.max(c.lo, st.vol)) : c.n;
    st.vol = n;
    el.calcard.innerHTML =
      '<p class="c-found">' + esc(d.found) + ' за ' + fmt1(d.time) + ' с</p>' +
      '<div class="c-q"><label for="vol">' + esc(c.q || 'Сколько таких документов у вас в месяц?') + '</label><output id="volO" for="vol"></output></div>' +
      '<div class="rng" id="rng"><i></i><input type="range" id="vol" min="' + c.lo + '" max="' + c.hi + '" step="' + c.step + '" value="' + n + '"></div>' +
      '<div class="c-big"><b id="hrs"></b><span>часов в год вернётся команде</span></div>' +
      '<p class="c-st" id="fte"></p>' +
      '<div class="cmp" id="cmp"><span>' + esc(c.hand || ('Вручную — ' + c.min + ' мин')) + '</span><span class="tr"><i></i></span><span>Агент — ' + fmt1(d.time) + ' с</span><span class="tr me"><i></i></span></div>';
    updCalc(true);
    setTimeout(function () { var m = $('#cmp'); if (m) m.classList.add('grow'); }, reduce ? 0 : 200);
  }
  function updCalc(count) {
    var d = D(), inp = $('#vol'); if (!inp) return;
    var n = +inp.value, h = hoursOf(d, n);
    st.vol = n;
    $('#volO').textContent = grp(n);
    if (count) countText($('#hrs'), 0, h, 900, '{n}'); else $('#hrs').textContent = grp(h);
    $('#fte').textContent = 'это ' + stakes(h / 1970) + ' сотрудника';
    $('#rng').style.setProperty('--p', (n - d.calc.lo) / (d.calc.hi - d.calc.lo));
  }
  function formHTML() {
    return '<div class="pin" style="display:contents"><h2>Расчёт для вашей компании</h2><p class="s">Пришлём срок окупаемости и три первых сценария</p>' +
      '<form id="leadForm" novalidate>' +
        '<div class="fl"><label class="sr" for="inn">ИНН или название компании</label><div class="ac" id="ac">' +
          '<input class="inp" id="inn" name="company" placeholder="ИНН или название компании" autocomplete="organization" enterkeyhint="next" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="acp">' +
          '<div class="acp" id="acp" role="listbox"></div></div><p class="etx" id="innE"></p></div>' +
        '<div class="fl"><label class="sr" for="mail">Рабочий e-mail</label><input class="inp" id="mail" name="email" type="email" placeholder="Рабочий e-mail" inputmode="email" autocomplete="email" enterkeyhint="send"><p class="etx" id="mailE"></p></div>' +
        '<label class="chk" for="agree"><input type="checkbox" id="agree" required><span>Согласен на обработку <a href="' + esc(CFG.policyUrl || '#') + '" target="_blank" rel="noopener">персональных данных</a></span></label><p class="etx" id="agreeE"></p>' +
        '<p class="etx" id="sendE" role="alert"></p>' +
        '<button class="btn" type="submit"><span>Получить расчёт</span><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span></button>' +
      '</form></div>';
  }
  function sentHTML() { return '<div class="sent" role="status">' + ICON.big + '<h2>Готово. Расчёт придёт на почту в течение рабочего дня.</h2></div>'; }

  /* ---------- lead form (v6) ---------- */
  function bindLead() {
    var inp = $('#inn'), ac = $('#ac'), acp = $('#acp'), form = $('#leadForm'), mail = $('#mail'), agree = $('#agree');
    var hi = -1, list = [], picked = null, timer = 0, ctrl = null;
    function draw() {
      acp.innerHTML = list.map(function (c, i) {
        return '<button type="button" role="option" data-i="' + i + '" class="' + (i === hi ? 'hi' : '') + '" aria-selected="' + (i === hi) + '">' + esc(c.name) + '<small>ИНН ' + esc(c.inn) + (c.meta ? ' · ' + esc(c.meta) : '') + '</small></button>';
      }).join('');
      ac.classList.toggle('open', list.length > 0);
      inp.setAttribute('aria-expanded', list.length > 0 ? 'true' : 'false');
    }
    function local(qs) {
      qs = qs.trim().toLowerCase(); if (!qs) return [];
      return COS.filter(function (c) { return c.name.toLowerCase().indexOf(qs) > -1 || c.inn.indexOf(qs) === 0 || 'борисхоф'.indexOf(qs) === 0; }).slice(0, 3);
    }
    function suggest(qs) {
      if (!CFG.dadataToken) { list = local(qs); draw(); return; }
      if (ctrl) ctrl.abort();
      if (!qs.trim()) { list = []; draw(); return; }
      ctrl = new AbortController();
      fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party', {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': 'Token ' + CFG.dadataToken },
        body: JSON.stringify({ query: qs, count: 3 })
      }).then(function (r) { return r.json(); }).then(function (j) {
        list = (j.suggestions || []).slice(0, 3).map(function (s) { return { name: s.value, inn: (s.data && s.data.inn) || '', meta: (s.data && s.data.address && s.data.address.value) || '' }; });
        draw();
      }).catch(function () { /* network or abort: the field stays usable without suggestions */ });
    }
    function pick(i) { var c = list[i]; if (!c) return; picked = c; inp.value = c.name; list = []; draw(); mail.focus(); }
    inp.addEventListener('input', function () { hi = -1; picked = null; clearTimeout(timer); var v = inp.value; timer = setTimeout(function () { suggest(v); }, CFG.dadataToken ? 250 : 0); });
    inp.addEventListener('keydown', function (e) {
      if (!list.length) return;
      if (e.key === 'ArrowDown') { hi = Math.min(list.length - 1, hi + 1); draw(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { hi = Math.max(0, hi - 1); draw(); e.preventDefault(); }
      else if (e.key === 'Enter') { pick(Math.max(0, hi)); e.preventDefault(); }
      else if (e.key === 'Escape') { list = []; draw(); }
    });
    acp.addEventListener('mousedown', function (e) { e.preventDefault(); });
    acp.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) pick(+b.dataset.i); });
    inp.addEventListener('blur', function () { setTimeout(function () { list = []; draw(); }, 120); });
    function err(id, input, text) { $('#' + id).textContent = text; if (input) input.classList.toggle('bad', !!text); }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var okInn = inp.value.trim().length > 1, okMail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail.value.trim()), okAgree = agree.checked;
      err('innE', inp, okInn ? '' : 'Укажите ИНН или название');
      err('mailE', mail, okMail ? '' : 'Проверьте e-mail');
      err('agreeE', null, okAgree ? '' : 'Нужно согласие');
      err('sendE', null, '');
      if (!okInn || !okMail || !okAgree) return;
      var d = D(), name = inp.value.trim();
      var payload = { company: picked ? picked.name : name, inn: picked ? picked.inn : (/^\d{10}(\d{2})?$/.test(name) ? name : ''),
        email: mail.value.trim(), doc: d.id, volume: st.vol, hoursPerYear: hoursOf(d, st.vol), page: location.href.split('#')[0], utm: utm() };
      var btn = form.querySelector('.btn'); btn.disabled = true; btn.classList.add('busy');
      var t0 = Date.now();
      function done() { setTimeout(function () { st.sent = true; goal('hp_lead_sent'); el.panel.innerHTML = sentHTML(); }, Math.max(0, (reduce ? 0 : 900) - (Date.now() - t0))); }
      if (!CFG.leadEndpoint) { console.info('[HyperPartner demo] lead (demo mode, not sent):', payload); done(); return; }
      fetch(CFG.leadEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); done(); })
        .catch(function () { btn.disabled = false; btn.classList.remove('busy'); err('sendE', null, 'Не удалось отправить. Попробуйте ещё раз.'); });
    });
    window.HP_LEAD_DEMO = function (text) { inp.value = text; inp.focus(); suggest(text); };
  }
  function utm() { var o = {}; q.forEach(function (v, k) { if (k.indexOf('utm_') === 0 || k === 'yclid') o[k] = v; }); return o; }

  /* ---------- folders, view switch ---------- */
  function renderFolders() {
    el.folders.innerHTML = DOCS.map(function (d, i) {
      var on = i === st.doc;
      var env = d.kind === 'mail' ? '<svg viewBox="0 0 30 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="1" y="1" width="28" height="14" rx="2"/><path d="M1.5 1.8L15 9.5l13.5-7.7"/></svg>' : '';
      return '<button type="button" role="tab" class="fold' + (env ? ' env' : '') + '" id="tab' + i + '" data-i="' + i + '" aria-controls="scene" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '">' +
        '<span class="paper">' + env + '</span><span class="front"><b>' + esc(d.tab) + '</b></span></button>';
    }).join('');
  }
  function selectFolder() {
    $$('.fold', el.folders).forEach(function (b, i) { var on = i === st.doc; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    if (phone()) { var t = $('#tab' + st.doc); if (t) el.folders.scrollTo({ left: Math.max(0, t.offsetLeft - 16), behavior: reduce ? 'auto' : 'smooth' }); }
  }
  function setView(v) {
    st.view = v; el.scene.classList.toggle('orig', v === 'orig');
    $$('button', el.seg).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'); });
    placeThumb();
  }
  function placeThumb() {
    var b = $('button[aria-pressed="true"]', el.seg), first = $('button', el.seg); if (!b || !first.offsetWidth) return;
    el.thumb.style.width = first.offsetWidth + 'px';
    el.thumb.style.transform = 'translateX(' + b.offsetLeft + 'px) scaleX(' + (b.offsetWidth / first.offsetWidth) + ')';
  }

  /* ---------- open a document ---------- */
  function sizeScene() {
    if (phone()) { el.scene.style.height = ''; return; }
    var plate = el.scene.offsetParent || document.body;
    var top = plate.getBoundingClientRect().top + window.scrollY + el.scene.offsetTop;
    el.scene.style.height = Math.max(460, Math.min(800, window.innerHeight - top - 12)) + 'px';
  }
  function openDoc(i, mode) {
    stopAll();
    st.doc = i; st.vol = null; st.sent = false; zones = null; st.evDoc = -1;
    var d = DOCS[i];
    st.mail = d.kind === 'mail';
    selectFolder(); setSteps(1); frameOff(); setView('agent');
    el.scene.classList.toggle('mailmode', st.mail);
    el.scene.classList.toggle('first', i === 0);       /* the first tab merges with the square corner of the stage */
    el.sheet.classList.toggle('mailsheet', st.mail);
    el.doc.classList.toggle('mail', st.mail);
    el.doc.innerHTML = renderDoc(d);
    if (st.mail) { renderOnec(d); setCur(d.onec.top[0][0], '', false); } else { el.onec.innerHTML = ''; el.onec.style.zoom = ''; }
    setHead(d, mode !== 'play');
    el.panel.innerHTML = ''; el.calcard.innerHTML = ''; st.pre2 = -1;
    el.cam.style.height = '';
    measure();
    if (st.mail) zoomOnec();
    camKey(st.mail ? 'mail' : 'full', true);
    setSub('Открываю ' + DOCS[i].acc, mode === 'play' ? 'live' : '', true);
    if (mode === 'play') {
      if (!reduce) { el.sheet.style.opacity = '0'; requestAnimationFrame(function () { el.sheet.style.opacity = ''; }); }
      play();
    }
  }
  function skipToVerdict() { stopAll(); play('end'); act2(false); }

  /* ---------- events ---------- */
  el.folders.addEventListener('click', function (e) { var b = e.target.closest('.fold'); if (!b) return; var i = +b.dataset.i; if (i !== st.doc) goal('hp_doc_switch', { doc: DOCS[i].id }); st.started = true; openDoc(i, 'play'); });
  el.folders.addEventListener('keydown', function (e) {
    var n = DOCS.length, i = st.doc;
    if (e.key === 'ArrowRight') i = (i + 1) % n; else if (e.key === 'ArrowLeft') i = (i - 1 + n) % n; else return;
    e.preventDefault(); st.started = true; openDoc(i, 'play'); $('#tab' + i).focus();
  });
  el.steps.addEventListener('click', function (e) {
    var li = e.target.closest('li'); if (!li) return;
    var s = +li.dataset.s;
    if (s === 1) openDoc(st.doc, 'play'); else if (s === 2) { if (st.act === 1) skipToVerdict(); else { openDoc(st.doc); play('end'); act2(false); } } else act3();
  });
  el.skip.addEventListener('click', skipToVerdict);
  el.whole.addEventListener('click', function () { if (st.act === 2 && !st.mail) setWhole(!st.whole); });
  el.seg.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) setView(b.dataset.v); });
  el.calcard.addEventListener('input', function (e) { if (e.target.id === 'vol') updCalc(false); });
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-go]'); if (!g) return;
    e.preventDefault();
    act3();
    if (g.classList.contains('btn-hdr')) { var inn = $('#inn'); if (inn) { if (phone()) scrollToY(el.panel.getBoundingClientRect().top + window.scrollY - headerH() - 20); inn.focus({ preventScroll: true }); } }
  });
  el.sheet.addEventListener('transitionend', function (e) { if (e.target === el.sheet && e.propertyName === 'transform') el.sheet.classList.remove('moving'); });
  var rT = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(function () { sizeScene(); measure(); camKey(st.camKey, true); placeThumb(); fitPanel(); zoomOnec(); if (st.mail) fitOnecTitle(); }, 80);
  });
  document.addEventListener('visibilitychange', function () { clock.hidden = document.hidden; updPause(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { clock.off = !en[0].isIntersecting || en[0].intersectionRatio < 0.1; updPause(); }, { threshold: [0, 0.1, 0.2] }).observe(el.scene);
  }

  /* ---------- start. Deep links: ?doc=0..3&stage=1..3&static=1&view=orig&lead=text&n=number&sent=1&hold=pii|read|sum|total|err ---------- */
  var doc0 = Math.min(DOCS.length - 1, Math.max(0, +q.get('doc') || 0));
  var stage0 = +q.get('stage') || 0, hold = q.get('hold');
  if (q.has('n')) st.vol = +q.get('n');
  st.doc = doc0; renderFolders(); sizeScene();
  openDoc(doc0);
  if (hold) {
    var idx = hold === 'pii' ? 1 : 0, tag = hold;
    if (hold === 'read') { var keys = buildScript(D()).filter(function (s) { return s.tag === 'read'; }).map(function (s) { return s.key; }); idx = Math.max(0, keys.indexOf('head0')); }
    play(tag, idx);
    setSub(el.subT.textContent, hold === 'err' ? 'err' : 'live', true);
  } else if (stage0 >= 2 || (reduce && !stage0)) {
    play('end'); act2(false);
    if (q.get('whole') === '1' && !st.mail) setWhole(true, true);
    if (stage0 === 3) { if (q.get('sent') === '1') st.sent = true; act3(); if (q.has('lead') && window.HP_LEAD_DEMO) window.HP_LEAD_DEMO(q.get('lead')); }
  } else if (stage0 === 1) { play('end'); setSub('Прочитано за ' + fmt1(D().time) + ' с', 'done'); }
  else {
    /* the script (zone geometry) is prepared in idle time before the run starts */
    var prep = function () { if (!st.played) st.script = { doc: st.doc, sc: buildScript(D()) }; };
    if (window.requestIdleCallback) requestIdleCallback(prep, { timeout: 300 }); else setTimeout(prep, 0);
    var startPlay = function () { if (st.started) return; st.started = true; goal('hp_demo_start'); setTimeout(function () { if (!st.played) play(); }, 120); };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        if (en.some(function (x) { return x.intersectionRatio >= 0.5 || x.intersectionRect.height >= window.innerHeight * 0.5; })) { io.disconnect(); startPlay(); }
      }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
      io.observe(el.scene);
    } else startPlay();
  }
  if (q.get('view') === 'orig') setView('orig');
  placeThumb();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); if (st.act === 1 && typeof st.camKey === 'string') camKey(st.camKey, true); placeThumb(); });
})();
