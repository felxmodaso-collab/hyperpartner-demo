/* The client mail and the 1C:Enterprise order form — carried over from v10 unchanged; exposed as window.HP_PAPER. */
(function () {
  'use strict';
  var el = { onec: null };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var SIG = '<svg class="sig" viewBox="0 0 92 30" aria-hidden="true"><path d="M3 22c7-13 13-16 15-9s-4 11 2 5 10-15 14-11-2 12 4 8 11-11 17-7 7 5 13 1 10-7 14-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var PII_LOCK = '<svg viewBox="0 0 12 14" aria-hidden="true"><rect x="1.5" y="6" width="9" height="7" rx="1.6" fill="currentColor"/><path d="M3.6 6V4.2a2.4 2.4 0 0 1 4.8 0V6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
  function pii(content, label, html) {
    /* v9-add: the closed fragment reads "скрыто" with a lock (light mint), never a grey bar with a field name */
    return '<span class="pii" data-l="' + esc(label) + '"><span class="raw">' + (html ? content : esc(content)) + '</span><span class="rd" aria-hidden="true">' + PII_LOCK + '<em>скрыто</em></span></span>';
  }
  /* rich text: plain strings, personal data {p,l}, or a zone the agent reads {k,t} */
  function rich(v) {
    if (!Array.isArray(v)) return esc(v);
    return v.map(function (x) { return typeof x !== 'object' ? esc(x) : x.k ? '<span class="kz" data-k="' + x.k + '">' + esc(x.t) + '</span>' : pii(x.p, x.l); }).join('');
  }
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
    if (d.basis) h += '<p class="basis"><span data-k="basis">' + esc(d.basis) + '</span></p>';
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
  function renderDoc(d) { return d.kind === 'mail' ? renderMail(d) : d.kind === 'contract' ? renderContract(d) : d.kind === 'customs' ? renderCustoms(d) : renderTable(d); }
  window.HP_PAPER = { esc: esc, renderDoc: renderDoc, renderOnec: function (d, node) { el.onec = node; renderOnec(d); } };
})();
