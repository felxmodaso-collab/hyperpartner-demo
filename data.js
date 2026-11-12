/* HyperPartner demo module v13 — configuration and the five demo cases.

   One company. "We" are АО «Гермес Трейд», a wholesaler of auto parts and tyres (Moscow, 1С:Управление торговлей 11).
   The digital employee works inside the company's contour and sees ONLY what is listed in `acc` of its case:
   the company's 1С, the public registers, the company's own rules. Every conclusion names the source it was taken from
   (`res.src`) and shows the record of that source next to the line of the document (`res.cmp`).
   The robot never refers to a paper it has no access to.

   Every finding is a discrepancy between the incoming document and a source — never an arithmetic slip inside a sheet:
   sheets of this kind are printed by accounting systems and their own totals always agree.
     invoice  — purchasing: the unit price in the supplier's invoice is above the price in our purchase order in 1С;
     mail     — sales: no finding, the client's letter becomes an order in 1С, the invoice waits for the manager;
     akt      — accounting: the supplier's reconciliation statement lists a sale that is not posted in our 1С;
     contract — legal: in a new supplier's draft the buyer's penalty is above the company's regulation and has no cap;
     cert     — foreign trade: the certificate of conformity is valid on paper but terminated in the public register.

   The sheets are readable ones on purpose (portrait, 14 px type): a УПД and a customs declaration are dense forms that
   cannot be read at the size of the scene, so the same findings are shown on the papers where they actually live.

   Facts behind the sheets (checked 12.11.2026): VAT 22 % from 01.01.2026 (425-ФЗ); a certificate under ТР ТС 018/2011
   is issued for up to 4 years (п. 94) and its status is checked in the public register of Росаккредитация;
   code 8708 30 910 9 — disc brake pads. The minutes of manual work are working assumptions until the client confirms them.
   INN and OGRN numbers are invented but pass the control-digit check. People, phones, accounts are invented.

   Personal data under 152-ФЗ is written as {p:'text', l:'label'}: a local filter covers it BEFORE the document is handed
   to the digital employee — full names, phones, personal e-mails, handwritten signatures. Company requisites stay visible.

   Per case: acc — the sources the robot is connected to; checks[] — k: places on the sheet, l: [what is checked, its short status],
   err — the finding (always last); res — t: a phrase that ends with the number, big: the number (no sign in front of it),
   cap, src: the source of the conclusion, cmp: two rows (the source / the document), acts: what the robot did next
   (it prepares and stops; it never writes to a counterparty by itself).
   Fill HP_CONFIG before publishing; an empty leadEndpoint switches the form to demo mode (nothing is sent). */
window.HP_CONFIG = {
  leadEndpoint: '',
  metrikaId: 0,
  policyUrl: 'https://hyperpartner.ru/docs/privacy-policy.pdf'
};

window.HP_ORG = {
  we: { name: 'АО «Гермес Трейд»', inn: '7726056782', kpp: '772601001', addr: '117105, г. Москва, Варшавское ш., д. 9' },
  koleso: { name: 'ООО «Колесо Опт»', inn: '7725123450', kpp: '772501001', addr: '115280, г. Москва, ул. Ленинская Слобода, д. 19' },
  tsr: { name: 'ООО «Тормозные системы Регион»', inn: '7723089148', kpp: '772301001', addr: '115432, г. Москва, 2-й Южнопортовый пр-д, д. 16' }
};

window.HP_DOCS = [
  /* ---------- 1. Purchasing: a supplier's invoice before payment ---------- */
  {
    id: 'invoice', kind: 'invoice',
    dept: 'Закупки', tab: 'Счёт на оплату',
    time: 3.4,
    acc: ['1С:Управление торговлей', '1С:Бухгалтерия'],
    bank: { name: 'ПАО СБЕРБАНК г. Москва', bik: '044525225', corr: '30101810400000000225', acc: '40702810938000012345' },
    no: '2093', date: '15 сентября 2026\u00A0г.',
    seller: 'koleso', buyer: 'we',
    basis: 'Договор поставки № 118-П от 02.03.2026',
    rows: [
      ['1', 'Шина зимняя 225/55 R17 шип., арт. ШЗ-225517', '48', 'шт', '9 600,00', '460 800,00'],
      ['2', 'Диск литой 7×17 5×114,3, арт. ДЛ-717545', '48', 'шт', '13 150,00', '631 200,00'],
      ['3', 'Датчик давления в шинах, арт. ДД-433', '48', 'шт', '1 125,00', '54 000,00']
    ],
    total: '1 146 000,00', vat: '206 655,74',
    words: 'Один миллион сто сорок шесть тысяч рублей 00 копеек',
    sign: [['Руководитель', 'Гусев А. Н.'], ['Бухгалтер', 'Белова Т. Р.']],
    manager: [{ p: 'Лаптева Ольга Игоревна', l: 'ФИО' }, ', тел. ', { p: '+7 916 730-41-12', l: 'Телефон' }],
    stamp: 'КОЛЕСО ОПТ',
    checks: [
      { k: ['bank', 'seller'], l: ['Расчётный счёт и ИНН', 'как в 1С'] },
      { k: ['basis'], l: ['Договор № 118-П', 'действует'] },
      { k: ['title'], l: ['Оплата счёта', 'ещё не было'] },
      { k: ['price2'], l: ['Цена в строке 2', 'выше заказа'], err: true }
    ],
    role: 'Менеджер по закупкам',
    hum: ['сверяет реквизиты с карточкой в 1С', 'открывает заказ поставщику', 'сверяет цены с заказом', 'проверяет, не оплачен ли счёт'],
    fin: 'счёт дороже заказа на 33 600 ₽',
    res: {
      t: 'Счёт дороже заказа на', big: '33 600 ₽', cap: '48 дисков, каждый на 700 ₽ дороже',
      src: '1С, заказ поставщику ГТ00-000387',
      cmp: [['Цена в заказе', '12 450,00 ₽'], ['Цена в счёте', '13 150,00 ₽']],
      acts: ['Счёт не передан на оплату', 'Менеджеру по закупкам: согласовать цену', 'Подготовлено письмо поставщику о цене']
    },
    min: 7
  },

  /* ---------- 2. Sales: a client's e-mail becomes an order in 1С ---------- */
  {
    id: 'mail', kind: 'mail',
    dept: 'Продажи', tab: 'Письмо → 1С',
    time: 4.1,
    acc: ['Почта отдела продаж', '1С:Управление торговлей'],
    role: 'Менеджер по продажам',
    hum: ['ищет клиента и договор в 1С', 'проверяет остаток на складе', 'вносит товары по артикулам', 'указывает склад и дату', 'проводит заказ'],
    mail: {
      from: [{ p: 'Ирина Лаврова', l: 'ФИО' }, ' ', { p: '<i.lavrova@avtopark-service.ru>', l: 'Email' }],
      subject: 'Заказ шин и дисков, прошу выставить счёт',
      body: [
        ['p', 'Добрый день!'],
        ['p', ['Просим выставить счёт по договору ', { k: 'contract', t: '№ 54-К' }, ', позиции из вашего прайса:']],
        ['li', ['— ', { k: 'g1', t: 'арт. ШЗ-225517, шина зимняя 225/55 R17 — 12 шт.' }, ';']],
        ['li', ['— ', { k: 'g2', t: 'арт. ДЛ-717545, диск литой 7×17 — 12 шт.' }]],
        ['p', ['Заберём сами ', { k: 'date', t: 'до 25.09.2026' }, ' со склада ', { k: 'wh', t: 'в Подольске' }, '.']],
        ['sig', 'С уважением,'],
        ['sig', [{ p: 'Ирина Лаврова', l: 'ФИО' }, ', менеджер по закупкам']],
        ['sig', [{ k: 'client', t: 'ООО «АвтоПарк Сервис»' }, ', ', { p: '+7 916 245-18-33', l: 'Телефон' }]]
      ]
    },
    /* the 1С:Enterprise 8.3 "Taxi" form of 1С:Управление торговлей 11, «Заказ клиента» */
    onec: {
      db: 'Управление торговлей, редакция 11',
      doc: 'Заказ клиента',
      title0: 'Заказ клиента (создание) *',
      title1: 'Заказ клиента ГТ00-001126 от 15.09.2026',
      top: [['client', 'Клиент', 'ref'], ['agr', 'Соглашение', 'ref'], ['contract', 'Договор', 'ref'], ['wh', 'Склад', 'ref'], ['date', 'Желаемая дата отгрузки', 'date']],
      tabs: ['Товары (2)', 'Доставка', 'Дополнительно'],
      cols: ['N', 'Номенклатура', 'Количество', 'Ед.', 'Цена', 'Сумма'],
      rows: {
        g1: ['1', 'Шина зимняя 225/55 R17 шип.', '12,000', 'шт', '9 900,00', '118 800,00'],
        g2: ['2', 'Диск литой 7×17 5×114,3', '12,000', 'шт', '13 400,00', '160 800,00']
      },
      bottom: [['contact', 'Контактное лицо', 'ref'], ['mgr', 'Менеджер', 'ref']]
    },
    /* a fragment of the mail -> a field of the order; f — what flies (as written in the mail), v — what 1С shows */
    parse: [
      { k: 'client', f: 'ООО «АвтоПарк Сервис»', v: 'АвтоПарк Сервис ООО' },
      { k: 'contract', f: '№ 54-К', v: '№ 54-К от 12.01.2026' },
      { k: 'g1', f: 'арт. ШЗ-225517 — 12 шт.', v: 'Шина зимняя 225/55 R17 шип.' },
      { k: 'g2', f: 'арт. ДЛ-717545 — 12 шт.', v: 'Диск литой 7×17 5×114,3' },
      { k: 'date', f: '25.09.2026', v: '25.09.2026' },
      { k: 'wh', f: 'Подольск', v: 'Подольск' }
    ],
    /* comes from the client's card and the contract in 1С, not from the mail; '@' — a person's data, shown under a lock */
    dir: [['agr', 'Оптовые продажи'], ['contact', '@из карточки клиента'], ['mgr', '@закреплён за клиентом']],
    fin: 'заказ создан в 1С',
    res: {
      t: 'Заказ клиента создан в 1С за', big: '',   /* the time from the arrival of the mail, put in by the script */ cap: 'Товары — из письма, цены — из 1С',
      acts: ['Заказ проведён: самовывоз, резерв до 25.09', 'Счёт на оплату готов к отправке клиенту']
    },
    min: 5
  },

  /* ---------- 3. Accounting: a supplier's reconciliation statement for the quarter ---------- */
  {
    id: 'akt', kind: 'akt',
    dept: 'Бухгалтерия', tab: 'Акт сверки',
    time: 3.8,
    acc: ['1С:Бухгалтерия', '1С-ЭДО'],
    period: '01.07.2026 — 30.09.2026', end: '30.09.2026',
    seller: 'koleso', buyer: 'we',
    contract: 'по договору поставки № 118-П от 02.03.2026',
    chief: 'Белова Т. Р.', chiefFull: 'Белова Татьяна Романовна',
    /* the supplier's half: date, document, debit, credit; key — a place the robot checks */
    rows: [
      ['', 'Сальдо начальное', '184 300,00', '', 'open'],
      ['15.07.2026', 'Оплата (1402 от 15.07.2026)', '', '184 300,00', 'ok'],
      ['18.08.2026', 'Продажа (2714 от 18.08.2026)', '512 400,00', '', 'ok'],
      ['25.08.2026', 'Оплата (1688 от 25.08.2026)', '', '512 400,00', 'ok'],
      ['17.09.2026', 'Оплата (1841 от 17.09.2026)', '', '1 112 400,00', 'ok'],
      ['22.09.2026', 'Продажа (3127 от 22.09.2026)', '1 112 400,00', '', 'ok'],
      ['29.09.2026', 'Продажа (3340 от 29.09.2026)', '178 120,00', '', 'r3340']
    ],
    turn: ['1 802 920,00', '1 809 100,00'], close: '178 120,00',
    words: 'Сто семьдесят восемь тысяч сто двадцать рублей 00 копеек',
    checks: [
      { k: ['head'], l: ['Стороны и договор', 'как в 1С'] },
      { k: ['open'], l: ['Сальдо на 01.07.2026', 'совпадает'] },
      { k: ['ok'], l: ['Оплаты и продажи', '5 из 6 совпали'] },
      { k: ['r3340'], l: ['Продажа № 3340', 'нет в 1С и ЭДО'], err: true }
    ],
    role: 'Бухгалтер',
    hum: ['формирует акт сверки в 1С', 'сверяет начальное сальдо', 'сверяет акт построчно', 'ищет причину расхождения'],
    fin: 'в 1С нет поступления на 178 120 ₽',
    res: {
      t: 'В 1С не отражено поступление на', big: '178 120 ₽', cap: 'Нет ни поступления в 1С, ни УПД в ЭДО',
      src: '1С, расчёты с поставщиком',
      cmp: [['Сальдо по нашим данным', '0,00 ₽'], ['Сальдо по данным поставщика', '178 120,00 ₽']],
      acts: ['Акт не подписан', 'Бухгалтеру: проверить поступление товара', 'Подготовлен запрос копии УПД № 3340']
    },
    min: 15
  },

  /* ---------- 4. Legal: a new supplier's draft of a supply contract ---------- */
  {
    id: 'contract', kind: 'contract',
    dept: 'Юридический отдел', tab: 'Договор поставки',
    time: 4.2,
    acc: ['ЕГРЮЛ', 'Регламент договорной работы'],
    place: 'г. Москва',
    preamble: [{ k: 'p1', t: 'ООО «Тормозные системы Регион»' }, ', именуемое в дальнейшем «Поставщик», в лице генерального директора ', { p: 'Петрова Ивана Сергеевича', l: 'ФИО' }, ', действующего на основании Устава, и АО «Гермес Трейд», именуемое в дальнейшем «Покупатель», в лице генерального директора ', { p: 'Тихоновой Анны Викторовны', l: 'ФИО' }, ', действующей на основании Устава, заключили настоящий договор о нижеследующем.'],
    /* a title, clauses [number, text, key]; '…' marks the sections left out of the excerpt */
    sections: [
      '…',
      ['2. Цена и порядок расчётов', [
        ['2.2', 'Покупатель оплачивает каждую партию Товара в течение 30 (тридцати) календарных дней с даты её получения.', 'pay']
      ]],
      '…',
      ['6. Ответственность сторон', [
        ['6.1', 'За просрочку поставки Поставщик уплачивает неустойку в размере 0,1 % от стоимости не поставленного в срок Товара за каждый день просрочки, но не более 5 % этой стоимости.', 'pen61'],
        ['6.2', 'За просрочку оплаты Покупатель уплачивает неустойку в размере 0,5 % от суммы задолженности за каждый день просрочки. Размер неустойки не ограничен.', 'pen']
      ]],
      '…',
      ['8. Разрешение споров', [
        ['8.2', 'Споры передаются на рассмотрение в Арбитражный суд города Москвы.', 'court']
      ]]
    ],
    sign: [['Поставщик', 'tsr', 'Петров И. С.'], ['Покупатель', 'we', '']],
    checks: [
      { k: ['p1', 'inn'], l: ['Поставщик в ЕГРЮЛ', 'действует'] },
      { k: ['pay'], l: ['Оплата, п. 2.2', 'по регламенту'] },
      { k: ['court'], l: ['Подсудность, п. 8.2', 'по регламенту'] },
      { k: ['pen'], l: ['Неустойка, п. 6.2', 'выше регламента'], err: true }
    ],
    role: 'Юрист',
    hum: ['проверяет поставщика по ЕГРЮЛ', 'сверяет оплату и подсудность с регламентом', 'сверяет неустойки с регламентом', 'составляет протокол разногласий'],
    fin: 'неустойка за просрочку оплаты выше регламента',
    res: {
      t: 'Неустойка за просрочку оплаты —', big: '0,5 % в день', cap: 'Для поставщика — 0,1 %, не более 5 %',
      src: 'регламент договорной работы',
      cmp: [['По регламенту', '0,1 % в день, не более 10 %'], ['В проекте', '0,5 % в день, без ограничения']],
      acts: ['Подготовлен протокол разногласий к п. 6.2', 'Протокол передан юристу на проверку']
    },
    min: 20
  },

  /* ---------- 5. Foreign trade: the certificate of conformity from the set of papers for a declaration ---------- */
  {
    id: 'cert', kind: 'cert',
    dept: 'ВЭД', tab: 'Сертификат соответствия',
    time: 3.6,
    acc: ['Реестр Росаккредитации', 'Инвойс и проект ДТ'],
    no: 'ЕАЭС RU С-CN.АЯ46.В.04127/23', series: 'RU № 0412367',
    body: 'Орган по сертификации продукции ООО «Центр оценки соответствия «Автокомпонент». Место нахождения: 125040, г. Москва, ул. Скаковая, д. 17. Уникальный номер записи об аккредитации в реестре аккредитованных лиц RA.RU.11АЯ46.',
    applicant: 'Общество с ограниченной ответственностью «ГАП Рус», ОГРН 1127746018421. Место нахождения: 115230, г. Москва, Каширское ш., д. 3. Уполномоченное изготовителем лицо.',
    maker: 'GUANGZHOU AUTO PARTS CO., LTD. Место нахождения: Китай, Guangzhou, 88 Huangpu\u00A0Rd.',
    product: 'Колодки с накладками в сборе для дисковых тормозов легковых автомобилей (категория M1), торговая марка GAP, модели BP-1432, BP-1433, BP-1450. Серийный выпуск.',
    code: '8708 30 910 9',
    rule: 'Технического регламента Таможенного союза «О безопасности колёсных транспортных средств» (ТР ТС 018/2011)',
    basis: 'Протокола испытаний № 1187/08-23 от 24.08.2023 (испытательная лаборатория ООО «Автотест», RA.RU.21АТ07), акта анализа состояния производства № 77 от 18.08.2023. Схема сертификации 1с.',
    from: '01.09.2023', to: '31.08.2027',
    head: 'Мельников П. А.', expert: 'Захарова Н. О.',
    checks: [
      { k: ['num'], l: ['Номер сертификата', 'есть в реестре'] },
      { k: ['maker', 'product'], l: ['Изготовитель и модели', 'как в инвойсе'] },
      { k: ['code'], l: ['Код ТН ВЭД', 'как в проекте ДТ'] },
      { k: ['term'], l: ['Статус в реестре', 'прекращён'], err: true }
    ],
    role: 'Специалист ВЭД',
    hum: ['ищет сертификат в реестре', 'сверяет изготовителя и модели с инвойсом', 'сверяет код с проектом ДТ', 'проверяет статус и срок действия'],
    fin: 'сертификат прекращён 14.08.2026',
    res: {
      t: 'Действие сертификата прекращено', big: '14.08.2026', cap: 'На бланке срок — по 31.08.2027',
      src: 'реестр Росаккредитации',
      cmp: [['Срок на бланке', 'по 31.08.2027'], ['Статус в реестре', 'прекращён 14.08.2026']],
      acts: ['Проект ДТ не передан на подачу', 'Специалисту ВЭД: получить новый сертификат', 'Подготовлен запрос поставщику']
    },
    min: 10
  }
];
