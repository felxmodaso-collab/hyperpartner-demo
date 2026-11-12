/* HyperPartner demo module v13 — the scene and the analyst form.

   The path of a document is shown as it is: «Входящий документ» → «Деперсонализация данных» → «Цифровой сотрудник».
     stage 1 (1.5 s) — the depersonalisation of data, NOT the robot: a scanner line passes the sheet and the data of people
                       get a hatched mask «обезличено» as it reaches them; nothing else is marked on the sheet meanwhile.
                       The robot waits: its card and its lane say it has not received the document.
     hand-off (1 s)  — the masks are in place, a pause, then the document goes to the robot.
     stage 2          — the robot's run takes its stated time (the clock of its lane counts from the arrival of the document,
                        the filter included, so it can be compared with the person's clock): the sheet steps back, the places it checks come forward
                        one by one with the number of the check, the card of the same number appears on the right
                        (for the mail — a value flies into its 1С field); then the result takes the place kept for it.
   The robot's card names what it is connected to; the result names the source of the conclusion and shows its record.
   The person's lane runs in real time from the moment the document arrived. Nothing zooms, nothing changes its place
   or its size: the cards and the result are laid out from the start and only shown.
   The form below asks for a company INN (10 digits, checked by the control digit while it is typed) and an e-mail. */
(function () {
  'use strict';
  var CFG = window.HP_CONFIG || {}, DOCS = window.HP_DOCS, PAPER = window.HP_PAPER, FORMS = window.HP_FORMS;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var q = new URLSearchParams(location.search);
  var frozen = q.get('static') === '1';                       /* still pictures for checks: no clocks, no autostart */
  var reduce = frozen || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) document.documentElement.classList.add('static');
  var phoneMQ = window.matchMedia('(max-width: 1099px)');
  function phone() { return phoneMQ.matches; }
  var esc = PAPER.esc;

  function svg(d) { return '<svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; }
  var ICON = { ok: svg('<path d="M4.5 10.5l3.6 3.5 7.4-8"/>') };
  var LOCK_1C = '<svg class="lock" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4.5" y="9" width="11" height="8" rx="2"/><path d="M7 9V6.8a3 3 0 0 1 6 0V9"/></svg>';

  var el = {
    tabs: $('#tabs'), scene: $('#scene'),
    hN: $('#hN'), hS: $('#hS'), hT: $('#hT'), hB: $('#hB'), bS: $('#bS'), bT: $('#bT'), bB: $('#bB'), again: $('#again'),
    colDoc: $('#colDoc'), scroll: $('#sheetScroll'), sheetBox: $('#sheetBox'), sheet: $('#sheet'), doc: $('#doc'), beam: $('#beam'),
    flow: $('#flow'),
    engine: $('#engine'), eAcc: $('#eAcc'), eSt: $('#eSt'), log: $('#log'), res: $('#res'), onecBox: $('#onecBox'), onec: $('#onec'), flies: $('#flies')
  };
  var st = { doc: 0, phase: 'idle', run: 0, tm: [], anims: [], hTimer: 0, raf: 0, t0: 0, mail: false, played: false };

  /* ---------- helpers ---------- */
  var NB = ' ';
  /* typography of a rendered string: a number keeps its unit and its digit groups, a short preposition is not left at a line end */
  function nb(s) {
    return String(s).replace(/(\d) (?=\d)/g, '$1' + NB).replace(/(\d) (₽|%|с(?=$|[\s.,)]))/g, '$1' + NB + '$2').replace(/ —/g, NB + '—')
      .replace(/№ /g, '№' + NB).replace(/(^|[\s(«])(в|во|у|к|с|со|и|а|на|по|до|из|от|за|не|о|об|п\.)\s+(?=\S)/gi, '$1$2' + NB);
  }
  function fmt1(n) { return n.toFixed(1).replace('.', ','); }
  function plural(n, a, b, c) { var m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c); }
  function fmtMS(sec) { sec = Math.floor(sec); return Math.floor(sec / 60) + ':' + ('0' + sec % 60).slice(-2); }
  function goal(name, params) { if (CFG.metrikaId && typeof window.ym === 'function') window.ym(CFG.metrikaId, 'reachGoal', name, params); }
  function D() { return DOCS[st.doc]; }
  function minutes(n) { return n + NB + (n % 10 === 1 && n % 100 !== 11 ? 'минуты' : 'минут'); }
  /* a step of the run: dropped when the document is switched or the run is restarted */
  function at(ms, fn) { var run = st.run; st.tm.push(setTimeout(function () { if (run === st.run) fn(); }, ms)); }
  function stop() {
    st.run++;
    st.tm.forEach(clearTimeout); st.tm = [];
    st.anims.forEach(function (a) { a.cancel(); }); st.anims = [];
    cancelAnimationFrame(st.raf); clearInterval(st.hTimer); st.hTimer = 0;
    el.flies.innerHTML = '';
  }
  function keyEls(k) { return $$('[data-k="' + k + '"]', el.doc); }

  /* ---------- layout: the sheet keeps its own width and is scaled to its place; the 1С window is zoomed to the card ---------- */
  function fit() {
    var two = !phone();
    if (st.mail) fitOnec(two);
    /* a phone: the sheet is laid out again for the narrow column (a little wider than it, so a table keeps its columns) */
    var cw = el.colDoc.clientWidth, narrow = !two && cw < 640;
    el.sheet.classList.toggle('narrow', narrow);
    el.sheet.style.width = narrow ? Math.round(cw / 0.9) + 'px' : '';
    el.sheetBox.style.height = '0px';                          /* the robot's card is measured without the old sheet */
    var sw = el.sheet.offsetWidth, sh = el.sheet.offsetHeight;
    /* a desktop: the sheet takes the height of the robot's card, but its type never goes below nine tenths */
    var s = two ? Math.min(1.12, cw / sw, Math.max(0.9, el.engine.offsetHeight / sh)) : Math.min(1.12, cw / sw);
    el.sheet.style.transform = 'scale(' + s.toFixed(4) + ')';
    el.sheetBox.style.width = Math.floor(sw * s) + 'px';
    el.sheetBox.style.height = Math.floor(sh * s) + 'px';
  }
  /* the 1С window keeps the width its form needs and is zoomed to the width of the card — never smaller than that */
  function fitOnec(two) {
    var o = el.onec, bw = el.onecBox.clientWidth, nar = !two && bw < 520, w0 = nar ? 440 : 560;
    o.classList.toggle('nar', nar);                            /* a phone: captions over the fields, a shorter table */
    o.style.zoom = ''; o.style.width = w0 + 'px';
    o.style.zoom = Math.min(1, bw / w0).toFixed(4);
  }

  /* ---------- the path of the document: the incoming document, the depersonalisation of data, the digital employee ---------- */
  function setFlow(step) {
    $$('li', el.flow).forEach(function (li) { var s = +li.dataset.s; li.className = s < step ? 'done' : s === step ? 'on' : ''; });
  }
  function maskAll() { $$('.pii', el.doc).forEach(function (n) { n.classList.add('masked'); }); }
  /* the scanner line of the depersonalisation passes the sheet in M ms; a fragment is covered when the line reaches it.
     Nothing else happens on the sheet meanwhile: the robot's highlights begin only after the hand-off */
  function runMask(M) {
    var r0 = el.sheet.getBoundingClientRect(), H = el.sheet.offsetHeight, k = H / r0.height;
    st.anims.push(el.beam.animate([{ opacity: 1, transform: 'translateY(-96px)' }, { opacity: 1, transform: 'translateY(' + (H - 96) + 'px)' }], { duration: M, easing: 'linear' }));
    $$('.pii', el.doc).forEach(function (node) {
      var r = node.getBoundingClientRect(), y = (r.top + r.height / 2 - r0.top) * k;
      at(Math.min(M - 80, Math.max(0, y / H * M)), function () { node.classList.add('masked'); });
    });
  }

  /* ---------- the document after the hand-off: the sheet steps back, the checked places come forward ---------- */
  /* a place comes forward and stays */
  function light(keys, err) {
    keys.forEach(function (k) { keyEls(k).forEach(function (e) { e.classList.add('lit', err ? 'err' : 'ok'); }); });
  }

  /* ---------- the race ---------- */
  function resetRace(d) {
    el.hN.textContent = d.role;
    el.hS.textContent = ''; el.hS.className = '';
    el.hT.innerHTML = '<small>вручную около ' + d.min + NB + 'мин</small>';
    el.hB.style.transform = 'scaleX(0)';
    el.bS.textContent = ''; el.bS.className = '';
    el.bT.innerHTML = '';
    el.bB.style.transform = 'scaleX(0)';
  }
  /* the person's lane runs in real time from the moment the document arrived and never hurries */
  function humTick() {
    var d = D(), total = d.min * 60, e = Math.min(total, (performance.now() - st.t0) / 1000);
    var n = d.hum.length, i = Math.min(n - 1, Math.floor(e / total * n));
    el.hS.textContent = e >= total ? 'готово' : d.hum[i];
    el.hT.innerHTML = fmtMS(e) + ' <small>из' + NB + fmtMS(total) + '</small>';
    el.hB.style.transform = 'scaleX(' + Math.max(0.004, e / total).toFixed(4) + ')';
    if (e >= total) { clearInterval(st.hTimer); st.hTimer = 0; }
  }
  /* the whole way of the document, seconds: the filter, the hand-off, the robot's own work */
  function total(d) { return (MASK + HAND) / 1000 + d.time; }
  /* the clock of the robot's lane counts from the arrival of the document, as the person's clock does */
  function botTick() {
    if (st.phase !== 'run') return;
    el.bT.textContent = fmt1(Math.min(total(D()), (performance.now() - st.t0) / 1000)) + NB + 'с';
    st.raf = requestAnimationFrame(botTick);
  }

  /* ---------- the robot's card: what it is connected to, the checks, the result with its source ---------- */
  function actsHTML(d) { return '<ul class="r-acts">' + d.res.acts.map(function (a) { return '<li>' + ICON.ok + '<span>' + esc(nb(a)) + '</span></li>'; }).join('') + '</ul>'; }
  function resultHTML(d) {
    var r = d.res, big = r.big || fmt1(total(d)) + ' с';
    return '<div class="r-card' + (d.checks ? '' : ' ok') + '"><p class="r-h">' + esc(nb(r.t)) + ' <b class="r-big">' + esc(nb(big)) + '</b></p><p class="r-cap">' + esc(nb(r.cap)) + '</p>' +
      (r.cmp ? '<div class="r-src"><p>Источник: ' + esc(nb(r.src)) + '</p><dl class="r-cmp">' + r.cmp.map(function (c, i) { return '<div' + (i ? ' class="bad"' : '') + '><dt>' + esc(nb(c[0])) + '</dt><dd>' + esc(nb(c[1])) + '</dd></div>'; }).join('') + '</dl></div>' : '') +
      '</div>' + actsHTML(d);
  }
  function buildEngine(d) {
    el.eAcc.innerHTML = '<span>Источники:</span>' + d.acc.map(function (a) { return '<i>' + esc(a) + '</i>'; }).join('');
    el.log.innerHTML = (d.checks || []).map(function (c) {
      return '<li><b>' + esc(nb(c.l[0])) + '</b><span class="st"><i class="sp"></i><em>' + (c.err ? '' : ICON.ok) + esc(nb(c.l[1])) + '</em></span></li>';
    }).join('');
    el.res.innerHTML = resultHTML(d); el.res.className = 'res';
    el.engine.classList.remove('got');
    el.engine.classList.add('wait');
    status('Цифровой сотрудник ждёт документ');
  }
  function status(html) { el.eSt.innerHTML = html; }
  /* a card: hidden → being checked → answered */
  function card(i, state, err) { var li = el.log.children[i]; if (li) li.className = 'show ' + (state === 'now' ? 'now' : err ? 'err' : 'ok'); }

  /* ---------- the 1С order: values fly from the mail and land in the fields ---------- */
  function fly(from, to, text, done) {
    if (!from || !to || reduce || phone()) { done(); return; }
    var a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    var n = document.createElement('div');
    n.className = 'fly'; n.textContent = text;
    el.flies.appendChild(n);
    var w = Math.round(text.length * 10 + 32), h = 36;      /* estimated, no layout read of the new node */
    var x0 = a.left + Math.min(a.width / 2, 140) - w / 2, y0 = a.top + a.height / 2 - h / 2;
    var x1 = b.left - 4, y1 = b.top + b.height / 2 - h / 2;
    var mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 30;
    var run = st.run;
    var anim = n.animate([
      { transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(.94)', opacity: 0 },
      { transform: 'translate(' + (x0 + (mx - x0) * 0.25) + 'px,' + (y0 + (my - y0) * 0.5) + 'px) scale(1)', opacity: 1, offset: 0.14 },
      { transform: 'translate(' + mx + 'px,' + my + 'px) scale(1)', opacity: 1, offset: 0.55 },
      { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(1)', opacity: 1, offset: 0.92 },
      { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(.97)', opacity: 0 }
    ], { duration: 380, easing: 'cubic-bezier(0.5,0,0.3,1)', fill: 'forwards' });
    anim.onfinish = function () { n.remove(); if (run === st.run) done(); };
  }
  function fillField(d, key, html, flash) {
    var fr = el.onec.querySelector('[data-f="' + key + '"]'); if (!fr) return;
    var row = d.onec.rows[key];
    if (row) {
      $$('td', fr).forEach(function (td, i) { td.textContent = row[i]; });
      $$('tr.new', el.onec).forEach(function (r) { r.classList.remove('new'); });
      fr.classList.add('got'); if (flash) fr.classList.add('new');
      return;
    }
    fr.querySelector('.v').innerHTML = html;
    fr.classList.add('got'); fr.classList.remove('focus');
    if (flash && !reduce) { fr.classList.remove('flash'); requestAnimationFrame(function () { fr.classList.add('flash'); }); }
  }
  function focusField(key, on) { var fr = el.onec.querySelector('[data-f="' + key + '"]'); if (fr && fr.classList.contains('fr')) fr.classList.toggle('focus', on); }
  /* the fields that come from the client's card in 1С, not from the mail; '@' — a person's data, shown under a lock */
  function fillDirectory(d, flash) {
    d.dir.forEach(function (x) { fillField(d, x[0], x[1].charAt(0) === '@' ? LOCK_1C + esc(x[1].slice(1)) : esc(x[1]), flash); });
  }
  function postOrder(d) {
    $$('.focus', el.onec).forEach(function (n) { n.classList.remove('focus'); });
    $$('tr.new', el.onec).forEach(function (r) { r.classList.remove('new'); });
    var t = $('#onecT'); t.textContent = d.onec.title1;
    for (var fs = 20; t.scrollWidth > t.clientWidth + 1 && fs >= 16; fs -= 2) t.style.fontSize = fs + 'px';
    /* a narrow window: the number stays, the date goes — the title is never cut */
    if (t.scrollWidth > t.clientWidth + 1) t.textContent = d.onec.title1.split(' от ')[0];
    $('#onecNtf').classList.add('on');
  }

  /* ---------- the run ---------- */
  var MASK = 1500, HAND = 1000;
  /* stage 1 is the depersonalisation: the scanner line and the masks, nothing else; the robot's card and lane say that it waits */
  function stage1(d) {
    runMask(MASK);
    setFlow(2);
    status('Идёт деперсонализация данных. Цифровой сотрудник документ ещё не получил');
    el.bS.textContent = 'ждёт документ';
    st.anims.push(el.bB.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: total(d) * 1000, easing: 'linear' }));
    botTick();
    /* the masks are in place: the step is done; the next one begins after a pause, so the two never read as one */
    at(MASK + 450, function () { setFlow(2.5); });
  }
  /* the hand-off: the document goes to the robot */
  function handOff(d, text, lane) {
    setFlow(3);
    el.engine.classList.remove('wait');
    el.engine.classList.add('got');
    el.sheet.classList.add('scan');
    status(text);
    el.bS.textContent = lane;
  }
  function runDoc(d) {
    var T = d.time * 1000, S = MASK + HAND;
    stage1(d);
    at(S, function () { handOff(d, 'Цифровой сотрудник получил документ и сверяет его с источниками', 'сверяет документ с источниками'); });
    /* the first highlight comes when the sheet has stepped back, not together with the hand-off */
    var lead = 450, slot = (T - lead - 80) / d.checks.length;
    d.checks.forEach(function (c, i) {
      var t = S + lead + i * slot;
      at(t, function () { light(c.k, c.err); card(i, 'now'); });
      at(t + slot * 0.62, function () { card(i, 'done', c.err); });
    });
    at(S + T, function () { done(d); });
  }
  function runMail(d) {
    var T = d.time * 1000, S = MASK + HAND;
    stage1(d);
    at(S, function () { handOff(d, 'Цифровой сотрудник получил письмо и создаёт заказ в 1С', 'создаёт заказ в 1С'); });
    /* six fragments of the mail, one after another: the fragment and the outline of its 1С field light together, the value flies and lands */
    var t0 = S + 400, slot = (T - 400 - 520) / d.parse.length;
    d.parse.forEach(function (p, i) {
      at(t0 + i * slot, function () {
        var fr = keyEls(p.k)[0], target = el.onec.querySelector('[data-f="' + p.k + '"] .v');
        light([p.k], false); focusField(p.k, true);
        at(130, function () { fly(fr, target, p.f, function () { fillField(d, p.k, esc(p.v), true); }); });
      });
    });
    at(S + T - 480, function () { d.dir.forEach(function (x) { focusField(x[0], true); }); at(160, function () { fillDirectory(d, true); }); });
    at(S + T - 170, function () { postOrder(d); });
    at(S + T, function () { done(d); });
  }
  /* the final picture at once: reduced motion and deep links */
  function finishAll(d) {
    maskAll(); el.sheet.classList.add('scan'); el.engine.classList.remove('wait');
    if (st.mail) {
      d.parse.forEach(function (p) { light([p.k], false); fillField(d, p.k, esc(p.v), false); });
      fillDirectory(d, false);
      postOrder(d);
    } else d.checks.forEach(function (c, i) { light(c.k, c.err); card(i, 'done', c.err); });
    done(d, true);
  }
  function done(d, instant) {
    st.phase = 'done'; el.scene.dataset.phase = 'done';
    cancelAnimationFrame(st.raf);
    setFlow(4);
    el.bT.innerHTML = ICON.ok + fmt1(total(d)) + NB + 'с';
    el.bB.style.transform = 'scaleX(1)';
    el.bS.textContent = nb(d.fin); el.bS.className = st.mail ? 'ok' : 'fin';
    status('Готово за ' + fmt1(total(d)) + NB + 'с. Вручную — около ' + minutes(d.min));
    el.res.classList.add('show');
    if (instant) {
      /* the person is where he would be at the moment the robot finished */
      st.t0 = performance.now() - total(d) * 1000; humTick();
      if (!frozen && !st.hTimer) st.hTimer = setInterval(humTick, 250);
    }
    goal('hp_step2', { doc: d.id });
  }
  function begin() {
    var d = D();
    if (st.phase !== 'idle') return;
    st.phase = 'run'; st.played = true; el.scene.dataset.phase = 'run';
    goal('hp_demo_start', { doc: d.id });
    if (reduce) { finishAll(d); return; }
    st.t0 = performance.now();
    st.hTimer = setInterval(humTick, 250); humTick();
    (st.mail ? runMail : runDoc)(d);
  }

  /* ---------- the control of departments and documents ---------- */
  function renderTabs() {
    el.tabs.innerHTML = '<i class="pill" id="pill"></i>' + DOCS.map(function (d, i) {
      return '<button type="button" class="tab" role="tab" id="tab' + i + '" data-i="' + i + '" aria-selected="false"><small>' + esc(d.dept) + '</small><span>' + esc(d.tab) + '</span></button>';
    }).join('');
  }
  function movePill() { var t = $('#tab' + st.doc), p = $('#pill'); if (!t || !p) return; p.style.width = t.offsetWidth + 'px'; p.style.transform = 'translateX(' + t.offsetLeft + 'px)'; }
  function selectTab() {
    $$('.tab', el.tabs).forEach(function (b, i) { var on = i === st.doc; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
    movePill();
    var t = $('#tab' + st.doc);
    if (t && el.tabs.scrollWidth > el.tabs.clientWidth) el.tabs.scrollTo({ left: Math.max(0, t.offsetLeft - 16), behavior: reduce ? 'auto' : 'smooth' });
  }

  /* ---------- open a document: the picture before the run ---------- */
  function open(i) {
    stop();
    st.doc = i; st.phase = 'idle';
    var d = DOCS[i];
    st.mail = d.kind === 'mail';
    el.scene.dataset.phase = 'idle';
    el.scene.classList.toggle('mail', st.mail);
    selectTab();
    el.sheet.className = 'sheet k-' + d.kind + (st.mail ? ' mailsheet' : '');
    el.doc.className = 'doc' + (st.mail ? ' mail' : '');
    el.doc.innerHTML = st.mail ? PAPER.renderDoc(d) : FORMS[d.kind](d);
    /* one word on every mask, whoever rendered it */
    $$('.pii .rd em', el.doc).forEach(function (e) { e.textContent = 'обезличено'; });
    setFlow(1);
    el.onec.innerHTML = '';
    if (st.mail) PAPER.renderOnec(d, el.onec);
    resetRace(d);
    buildEngine(d);
    fit();
  }

  /* ---------- the analyst form: a company INN is 10 digits (an entrepreneur's — 12), the control digit is checked while typing ---------- */
  function innCheck(v) {
    var s = v.replace(/\D/g, '');
    if (s.length !== 10 && s.length !== 12) return { valid: false, type: '' };
    var n = s.split('').map(Number), cd = function (c) { return c.reduce(function (a, k, i) { return a + k * n[i]; }, 0) % 11 % 10; };
    if (s.length === 10) return { valid: cd([2, 4, 10, 3, 5, 9, 4, 6, 8]) === n[9], type: 'компании' };
    return { valid: cd([7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) === n[10] && cd([3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) === n[11], type: 'ИП' };
  }
  function bindLead() {
    var lead = $('#lead'), form = $('#leadForm'), inn = $('#inn'), badge = $('#innB'), mail = $('#mail'), agree = $('#agree'), mon = $('#mon');
    var BAD = 'Проверьте ИНН: контрольная цифра не сходится';
    $('#pol').href = CFG.policyUrl || '#';
    function err(id, input, text) { $('#' + id).textContent = text; if (input) input.classList.toggle('bad', !!text); }
    /* the field answers while the digits are typed: how many of ten are in, then — whether the control digit agrees */
    function upd() {
      var s = inn.value.replace(/\D/g, '').slice(0, 12);
      if (inn.value !== s) inn.value = s;
      var c = innCheck(s);
      badge.className = 'inn-b' + (c.valid ? ' ok' : s.length === 12 ? ' bad' : '') + (s.length ? '' : ' off');
      if (!s.length) badge.textContent = '';
      else if (c.valid) badge.innerHTML = ICON.ok + 'ИНН ' + c.type;
      else if (s.length === 12) badge.textContent = 'проверьте цифры';
      else if (s.length === 11) badge.textContent = 'у ИП 12 цифр';      /* an entrepreneur on the way to his twelve digits */
      else badge.textContent = s.length + ' из 10';
      /* ten digits with a wrong control digit may still become an entrepreneur's twelve: the remark waits for blur or submit */
      err('innE', inn, s.length === 12 && !c.valid ? BAD : '');
      return c;
    }
    inn.addEventListener('input', upd);
    inn.addEventListener('blur', function () { var s = inn.value, c = innCheck(s); if (s.length === 10 && !c.valid) { badge.className = 'inn-b bad'; badge.textContent = 'проверьте цифры'; err('innE', inn, BAD); } });
    function monitor(num, email) {
      lead.dataset.state = 'sent';
      mon.innerHTML = '<h3>Запрос по ИНН' + NB + esc(num) + ' принят</h3><ul class="mon-l">' +
        '<li class="ok"><i class="ci">' + ICON.ok + '</i><span>' + nb('Запрос в открытые реестры отправлен') + '</span></li>' +
        '<li class="now"><i class="ci"></i><span>' + nb('Идёт сопоставление с процессами отрасли') + '</span></li>' +
        '<li class="wait"><i class="ci"></i><span>' + nb('Сводка придёт на ') + '<b>' + esc(email) + '</b></span></li></ul>' +
        '<p>' + nb('Сводка придёт на почту. Страницу можно закрыть.') + '</p>' +
        '<button type="button" id="monAgain">Отправить другой ИНН</button>';
    }
    mon.addEventListener('click', function (e) { if (e.target.id !== 'monAgain') return; lead.dataset.state = 'ask'; inn.value = ''; upd(); inn.focus(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var c = upd(), s = inn.value, email = mail.value.trim(), okMail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email), okAgree = agree.checked;
      err('innE', inn, c.valid ? '' : s.length === 10 || s.length === 12 ? BAD : 'Введите ИНН компании: 10 цифр');
      err('mailE', mail, okMail ? '' : 'Проверьте адрес почты');
      err('agreeE', null, okAgree ? '' : 'Нужно согласие на обработку персональных данных');
      err('sendE', null, '');
      if (!c.valid || !okMail || !okAgree) return;
      var payload = { inn: s, innType: c.type, email: email, doc: D().id, page: location.href.split('#')[0], utm: utm() };
      var btn = form.querySelector('.btn'); btn.disabled = true;
      var t0 = Date.now();
      function ok() { setTimeout(function () { btn.disabled = false; goal('hp_lead_sent'); monitor(s, email); }, Math.max(0, (reduce ? 0 : 600) - (Date.now() - t0))); }
      if (!CFG.leadEndpoint) { console.info('[HyperPartner demo] lead (demo mode, not sent):', payload); ok(); return; }
      fetch(CFG.leadEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); ok(); })
        .catch(function () { btn.disabled = false; err('sendE', null, 'Не удалось отправить. Попробуйте ещё раз.'); });
    });
    /* deep links for still pictures: ?inn=digits&mail=address&sent=1 */
    if (q.has('inn')) { inn.value = q.get('inn'); upd(); }
    if (q.has('mail')) mail.value = q.get('mail');
    if (q.get('sent') === '1') monitor(inn.value, mail.value);
  }
  function utm() { var o = {}; q.forEach(function (v, k) { if (k.indexOf('utm_') === 0 || k === 'yclid') o[k] = v; }); return o; }

  /* ---------- events ---------- */
  el.tabs.addEventListener('click', function (e) {
    var b = e.target.closest('.tab'); if (!b) return;
    var i = +b.dataset.i;
    if (i !== st.doc) goal('hp_doc_switch', { doc: DOCS[i].id });
    open(i); begin();
  });
  el.tabs.addEventListener('keydown', function (e) {
    var n = DOCS.length, i = st.doc;
    if (e.key === 'ArrowRight') i = (i + 1) % n; else if (e.key === 'ArrowLeft') i = (i - 1 + n) % n; else return;
    e.preventDefault(); open(i); begin(); $('#tab' + i).focus();
  });
  el.again.addEventListener('click', function () { open(st.doc); begin(); });
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-lead]'); if (!g) return;
    e.preventDefault();
    var lead = $('#lead');
    window.scrollTo({ top: Math.max(0, lead.getBoundingClientRect().top + window.scrollY - 24), behavior: reduce ? 'auto' : 'smooth' });
    if (!phone()) $('#inn').focus({ preventScroll: true });
  });
  /* a new width: a picture before the run is laid out again; a running or finished one only refits */
  var rT = 0, lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(function () { if (window.innerWidth !== lastW && st.phase === 'idle') { lastW = window.innerWidth; open(st.doc); } else { fit(); movePill(); } }, 80);
  });

  /* ---------- start. Deep links: ?doc=<id|n>&state=done&static=1&inn=<digits>&mail=<address>&sent=1 ---------- */
  var docQ = q.get('doc') || '', byId = DOCS.map(function (x) { return x.id; }).indexOf(docQ);
  var doc0 = byId > -1 ? byId : Math.min(DOCS.length - 1, Math.max(0, +docQ || 0));
  renderTabs();
  open(doc0);
  bindLead();
  if (q.get('state') === 'done') { st.phase = 'run'; st.played = true; finishAll(D()); }
  /* the comparison starts by itself, once, when the document is on the screen: half of the stage on a desktop, its top part on a phone */
  function autoStart() { if (st.played || frozen) return; st.played = true; setTimeout(function () { if (st.phase === 'idle') begin(); }, 800); }
  if (!frozen && q.get('state') !== 'done') {
    if ('IntersectionObserver' in window) {
      var need = phone() ? 0.15 : 0.5;
      var io = new IntersectionObserver(function (en) { if (en.some(function (x) { return x.intersectionRatio >= need; })) { io.disconnect(); autoStart(); } }, { threshold: [need] });
      io.observe($('#stage'));
    } else autoStart();
  }
  /* the final font metrics: a picture before the run is laid out again */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (st.phase === 'idle') open(st.doc); else { fit(); movePill(); } });
})();
