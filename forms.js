/* Paper forms of the demo — portrait sheets set in a type that can be read in the scene (14 px on a 640 px sheet):
     invoice  — «Счёт на оплату» as 1С prints it (bank block, title, parties, basis, table, totals, amount in words, signatures);
     akt      — «Акт сверки взаимных расчётов» as 1С prints it: the supplier's half is filled, ours waits to be filled;
     contract — an excerpt of a supply contract: preamble, the clauses that are checked, requisites and signatures;
     cert     — «Сертификат соответствия» of the Eurasian Economic Union, the single form.
   A place the robot checks carries data-k; personal data is wrapped by pii(). Exposed as window.HP_FORMS. */
(function () {
  'use strict';
  var ORG = window.HP_ORG || {};
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var SIG = '<svg class="sig" viewBox="0 0 92 30" aria-hidden="true"><path d="M3 22c7-13 13-16 15-9s-4 11 2 5 10-15 14-11-2 12 4 8 11-11 17-7 7 5 13 1 10-7 14-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  /* personal data: the original text and a mask that wipes in over it */
  function pii(content, label, html) {
    return '<span class="pii" data-l="' + esc(label) + '"><span class="raw">' + (html ? content : esc(content)) + '</span><span class="rd" aria-hidden="true"><em>обезличено</em></span></span>';
  }
  /* plain strings, personal data {p,l}, a checked place {k,t} */
  function rich(v) {
    if (!Array.isArray(v)) return esc(v);
    return v.map(function (x) { return typeof x !== 'object' ? esc(x) : x.k ? '<span class="nd" data-k="' + x.k + '">' + esc(x.t) + '</span>' : pii(x.p, x.l); }).join('');
  }
  function signed(name) { return pii(SIG, 'Подпись', true) + pii(name, 'ФИО'); }
  function stamp(text) { return '<div class="stamp" aria-hidden="true"><span>ООО<br>' + esc(text) + '<br>МОСКВА</span></div>'; }
  /* a number keeps its sign of per cent on the same line */
  function tx(s) { return esc(s).replace(/(\d) %/g, '$1\u00A0%'); }
  function req(o) { return esc(o.name) + ', ИНН ' + o.inn + ', КПП ' + o.kpp + ', ' + esc(o.addr); }

  /* ---------- «Счёт на оплату» ---------- */
  function invoice(d) {
    var s = ORG[d.seller], b = ORG[d.buyer], bk = d.bank;
    var h = '<div class="fi">' +
      '<table class="fi-bank" data-k="bank">' +
        '<tr><td colspan="2" rowspan="2" class="bn"><span>' + esc(bk.name) + '</span><small>Банк получателя</small></td><td class="lb">БИК</td><td class="vl">' + bk.bik + '</td></tr>' +
        '<tr><td class="lb">Сч. №</td><td class="vl">' + bk.corr + '</td></tr>' +
        '<tr><td>ИНН ' + s.inn + '</td><td>КПП ' + s.kpp + '</td><td class="lb" rowspan="2">Сч. №</td><td class="vl" rowspan="2">' + bk.acc + '</td></tr>' +
        '<tr><td colspan="2" class="bn"><span>' + esc(s.name) + '</span><small>Получатель</small></td></tr>' +
      '</table>' +
      '<h2 class="fi-t"><span class="nd" data-k="title">Счёт на оплату № ' + esc(d.no) + ' от ' + esc(d.date) + '</span></h2>' +
      '<div class="fi-kv"><span>Поставщик:</span><b><span class="nd" data-k="seller">' + req(s) + '</span></b></div>' +
      '<div class="fi-kv"><span>Покупатель:</span><b>' + req(b) + '</b></div>' +
      '<div class="fi-kv"><span>Основание:</span><b><span class="nd" data-k="basis">' + esc(d.basis) + '</span></b></div>' +
      '<table class="fi-tb"><tr><th class="c">№</th><th>Товары (работы, услуги)</th><th class="r">Кол-во</th><th class="c">Ед.</th><th class="r">Цена</th><th class="r">Сумма</th></tr>';
    d.rows.forEach(function (r, i) {
      h += '<tr><td class="c">' + r[0] + '</td><td>' + esc(r[1]) + '</td><td class="r">' + r[2] + '</td><td class="c">' + r[3] + '</td>' +
        '<td class="r"' + (i === 1 ? ' data-k="price2"' : '') + '>' + r[4] + '</td><td class="r">' + r[5] + '</td></tr>';
    });
    h += '</table>' +
      '<div class="fi-tot"><span>Итого:</span><b>' + d.total + '</b><span>В том числе НДС (22%):</span><b>' + d.vat + '</b><span>Всего к оплате:</span><b>' + d.total + '</b></div>' +
      '<p class="fi-w">Всего наименований ' + d.rows.length + ', на сумму ' + d.total + ' руб.<b>' + esc(d.words) + '</b></p>' +
      '<div class="fi-sg">' + d.sign.map(function (x) { return '<div><span>' + esc(x[0]) + '</span><span class="ln">' + signed(x[1]) + '</span></div>'; }).join('') + stamp(d.stamp) + '</div>' +
      '<p class="fi-m">Менеджер: ' + rich(d.manager) + '</p></div>';
    return h;
  }

  /* ---------- «Акт сверки взаимных расчётов»: the supplier filled its half and signed, our half is empty ---------- */
  function akt(d) {
    var s = ORG[d.seller], b = ORG[d.buyer];
    var h = '<div class="fa"><h2>Акт сверки</h2>' +
      '<p class="fa-h"><span class="nd" data-k="head">взаимных расчётов за период: ' + esc(d.period) + '<br>между ' + esc(s.name) + ' и ' + esc(b.name) + '<br>' + esc(d.contract) + '</span></p>' +
      '<p class="fa-p">Мы, нижеподписавшиеся, главный бухгалтер ' + esc(s.name) + ' ' + pii(d.chiefFull, 'ФИО') + ', с одной стороны, и ________________ ' + esc(b.name) + ' ________________, с другой стороны, составили настоящий акт сверки в том, что состояние взаимных расчётов по данным учёта следующее:</p>' +
      '<table class="fa-tb"><colgroup><col class="c1"><col><col class="c3"><col class="c3"><col class="our o1"><col class="our o2"><col class="our o3"><col class="our o4"></colgroup><tr><th colspan="4">По данным ' + esc(s.name) + ', руб.</th><th colspan="4" class="our">По данным ' + esc(b.name) + ', руб.</th></tr>' +
      '<tr><th>Дата</th><th>Документ</th><th>Дебет</th><th>Кредит</th><th class="our">Дата</th><th class="our">Документ</th><th class="our">Дебет</th><th class="our">Кредит</th></tr>';
    var blank = '<td class="our"></td><td class="our"></td><td class="our"></td><td class="our"></td>';
    d.rows.forEach(function (r) {
      var k = ' data-k="' + r[4] + '"';
      h += '<tr><td class="c"' + k + '>' + r[0] + '</td><td' + k + '>' + esc(r[1]) + '</td><td class="r"' + k + '>' + r[2] + '</td><td class="r"' + k + '>' + r[3] + '</td>' + blank + '</tr>';
    });
    h += '<tr class="b"><td></td><td>Обороты за период</td><td class="r">' + d.turn[0] + '</td><td class="r">' + d.turn[1] + '</td>' + blank + '</tr>' +
      '<tr class="b"><td></td><td>Сальдо конечное</td><td class="r">' + d.close + '</td><td class="r"></td>' + blank + '</tr></table>' +
      '<p class="fa-p">По данным ' + esc(s.name) + ' на ' + d.end + ' задолженность в пользу ' + esc(s.name) + ' ' + d.close + ' руб. <i>(' + esc(d.words) + ')</i>.</p>' +
      '<div class="fa-sg"><div><b>От ' + esc(s.name) + '</b><span>Главный бухгалтер</span><span class="ln">' + signed(d.chief) + '</span><small>М.П.</small></div>' +
      '<div><b>От ' + esc(b.name) + '</b><span>________________________</span><span class="ln"></span><small>М.П.</small></div></div></div>';
    return h;
  }

  /* ---------- a supply contract: a supplier's draft, the number and the date are not filled in yet ---------- */
  function contract(d) {
    var h = '<div class="fc"><p class="fc-dr">Проект поставщика</p><h2>ДОГОВОР ПОСТАВКИ № ________</h2>' +
      '<div class="fc-pl"><span>' + esc(d.place) + '</span><span>«___» ____________ 2026 г.</span></div>' +
      '<p class="fc-pre">' + rich(d.preamble) + '</p>';
    d.sections.forEach(function (s) {
      /* a string marks the sections that are left out of the excerpt */
      if (typeof s === 'string') { h += '<p class="fc-gap">' + esc(s) + '</p>'; return; }
      h += '<h3>' + esc(s[0]) + '</h3>' + s[1].map(function (c) {
        return '<p class="cl"><i>' + c[0] + '.</i> ' + (c[2] ? '<span class="nd" data-k="' + c[2] + '">' + tx(c[1]) + '</span>' : tx(c[1])) + '</p>';
      }).join('');
    });
    h += '<h3>9. Реквизиты и подписи сторон</h3><div class="fc-sg">' + d.sign.map(function (x) {
      var o = ORG[x[1]];
      return '<div><b>' + esc(x[0]) + ': ' + esc(o.name) + '</b><span' + (x[1] === 'tsr' ? ' class="nd" data-k="inn"' : '') + '>ИНН ' + o.inn + ', КПП ' + o.kpp + '</span><span>Генеральный директор</span><span class="ln">' + (x[2] ? signed(x[2]) : '') + '</span></div>';
    }).join('') + '</div></div>';
    return h;
  }

  /* ---------- «Сертификат соответствия» of the Eurasian Economic Union ---------- */
  function cert(d) {
    function f(label, body, key) { return '<div class="fs-f"><b>' + label + '</b><span' + (key ? ' class="nd" data-k="' + key + '"' : '') + '>' + body + '</span></div>'; }
    return '<div class="fs"><div class="fs-top"><span>ЕВРАЗИЙСКИЙ ЭКОНОМИЧЕСКИЙ СОЮЗ</span><i class="eac" aria-hidden="true">EAC</i></div>' +
      '<h2>СЕРТИФИКАТ СООТВЕТСТВИЯ</h2>' +
      '<div class="fs-no"><span class="nd" data-k="num">№ ' + esc(d.no) + '</span><span>Серия ' + esc(d.series) + '</span></div>' +
      f('ОРГАН ПО СЕРТИФИКАЦИИ', esc(d.body)) +
      f('ЗАЯВИТЕЛЬ', esc(d.applicant)) +
      f('ИЗГОТОВИТЕЛЬ', esc(d.maker), 'maker') +
      f('ПРОДУКЦИЯ', esc(d.product), 'product') +
      f('КОД ТН ВЭД ЕАЭС', d.code, 'code') +
      f('СООТВЕТСТВУЕТ ТРЕБОВАНИЯМ', esc(d.rule)) +
      f('СЕРТИФИКАТ СООТВЕТСТВИЯ ВЫДАН НА ОСНОВАНИИ', esc(d.basis)) +
      '<div class="fs-term"><span class="nd" data-k="term">СРОК ДЕЙСТВИЯ С ' + d.from + ' ПО ' + d.to + ' ВКЛЮЧИТЕЛЬНО</span></div>' +
      '<div class="fs-sg"><div><span>Руководитель (уполномоченное лицо) органа по сертификации</span><span class="ln">' + signed(d.head) + '</span></div>' +
      '<div><span>Эксперт (эксперт-аудитор)</span><span class="ln">' + signed(d.expert) + '</span></div><small>М.П.</small></div></div>';
  }

  window.HP_FORMS = { invoice: invoice, akt: akt, contract: contract, cert: cert };
})();
