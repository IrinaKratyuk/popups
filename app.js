(() => {
  'use strict';

  // ---------- DOM ----------
  const openModeFill = PageEditor.openModeFill;
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  const stage = $('#stage');

  // Рамка демо — demo-frame из ui-kit: шапка, сцена 1600×900 и вспомогательная панель справа масштабируются как одно целое.
  let scale = 1;
  let scenSyncing = false; // панель догоняет открытую страницу, сцену не трогаем
  let tplOpening = false; // открывается просмотр шаблона: смена сценария его не снимает (см. tplOpen)
  // disabled — сценарий пока не сделан
  const frame = DemoFrame.mount({
    stage,
    head: { title: '' }, // шапка без названия
    devices: [
      { id: 'laptop', icon: 'laptop', label: 'Ноутбук', disabled: true },
      { id: 'monitor', icon: 'monitor', label: 'Монитор', size: '1600х900', name: 'монитор' },
    ],
    device: 'monitor',
    scenarios: [
      { group: 'Компоненты', items: [
        { id: 'catalog-add', title: 'Добавление виджета', hidden: true }, // пока скрыт
        { id: 'sites', title: 'Реестр сайтов' }, // старт; отдельный прототип во фрейме, см. regShow
        { id: 'catalog-setup', title: 'В конструкторе' },
      ] },
    ],
    // Окна и внешние виджеты пока внизу панели
    bottomScenarios: [
      { group: 'Работа с окнами/страницами', items: [
        { id: 'window-create', title: 'Создание окна с товаром' },
        { id: 'window-setup', title: 'Настройки окна', disabled: true, hidden: true },
        { id: 'window-switch', title: 'Переключение страница-окно', disabled: true, hidden: true },
        // Состояния новой страницы: вариант — режим открытия
        { id: 'new', title: 'Новая страница', variants: [
          { id: 'page', title: 'На странице' },
          { id: 'window', title: 'В окне' },
          { id: 'both', title: 'Страница и окно' },
        ] },
        { id: 'window-link', title: 'Связь кнопки с окном' },
      ] },
      { group: 'Внешние виджеты', items: [
        { id: 'ext-add', title: 'Добавление внешнего виджета' },
        // Состояния после добавления: вариант — где стоит виджет
        { id: 'ext-added', title: 'Виджет добавлен', variants: [
          { id: 'float', title: 'Плавающая кнопка' },
          { id: 'section', title: 'В секции' },
        ] },
        // Открытая страница «Обратная связь»: вариант — режим открытия, как у новой страницы
        { id: 'ext-page', title: 'Обратная связь', variants: [
          { id: 'page', title: 'На странице' },
          { id: 'window', title: 'В окне' },
          { id: 'both', title: 'Страница и окно' },
        ] },
        { id: 'ext-link', title: 'Связь кнопки с окном' },
      ] },
    ],
    links: [
      { title: 'Сайты - Васильева Елена', href: 'https://axure.tensor.ru/sabycrm-inter/%D1%81%D0%B0%D0%B9%D1%82%D1%8B.html' },
    ],
    team: [
      { label: 'Design', name: 'Смирнова Мария', links: [
        { title: 'Описание', href: 'https://online.sbis.ru/shared/disk/8a1d0f8c-06f5-47f1-924b-23c7f2efd143' },
      ] },
      { label: 'Develop', name: 'Сухоручкин Андрей', links: [
        { title: 'Разработка макета', href: 'https://online.sbis.ru/opendoc.html?guid=01a2074d-afd2-7c2b-a0bb-3d52051c939a&client=3' },
      ] },
    ],
    value: { scenario: 'sites' }, // старт — «Реестр сайтов»; конструктор под ним собирается по data-scenario (catalog-setup), см. scenApply внизу
    onScale: (s) => { scale = s; },
    onChange: ({ scenario, variant }) => {
      if (!tplOpening) tplClose(); // любой другой сценарий снимает шаблон
      stage.dataset.scenario = scenario;
      stage.dataset.variant = variant ?? '';
      regShow(scenario === 'sites');
      if (scenSyncing || scenario === 'sites') return;
      rsCloseParams();
      scenApply(scenario, variant);
    },
  });

  // Панель сценариев: demo-frame даёт один уровень групп, разделы «Работа с окнами» и «Внешние виджеты» со сворачиванием,
  // заголовок первой группы убираем.
  const scenGroups = [...frame.panel.querySelectorAll('.df-card--scen .df-group')];

  // Раздел по умолчанию свёрнут
  function scenSection(title, nodes) {
    const head = el('button', 'pop-sec__head', `<span>${title}</span><span class="ico pop-sec__arrow">&#xE9C2;</span>`);
    head.type = 'button';
    const body = el('div', 'pop-sec__body');
    body.hidden = true;
    body.append(...nodes);
    head.addEventListener('click', () => {
      body.hidden = !body.hidden;
      head.querySelector('.pop-sec__arrow').innerHTML = body.hidden ? '&#xE9C2;' : '&#xE9AA;';
    });
    const section = el('div', 'pop-sec');
    section.append(head, body);
    return section;
  }

  for (const g of scenGroups) g.classList.add('pop-sub');
  // «Работа с окнами» и «Внешние виджеты» — сворачиваемые разделы на своих местах; заголовок группы становится заголовком раздела
  for (const g of scenGroups.filter((g) => g.closest('.df-card--bottom'))) {
    const options = g.nextElementSibling;
    const section = scenSection(g.textContent.trim(), [options]);
    g.replaceWith(section);
  }
  scenGroups[0].remove(); // у первой группы («Компоненты») заголовка нет: сценарии идут сразу

  // «Реестр сайтов» — прототип mariesmi.github.io/sites во фрейме поверх конструктора: стили и переходы у него свои.
  // Грузится при первом открытии. После загрузки страницы сценарий начинается со стартового экрана реестра;
  // выход из конструктора (галочка, крестик) — на ту же карточку, вкладка «Страницы» (regToCard);
  // повторное открытие из панели сценариев — со стартового экрана.
  let regToCard = false;
  let regState = null; // «Параметры сайта» конструктора при выходе на карточку (regParams): реестр показывает то же
  let regPublish = null; // «Опубликовать» в окне шаблона: { link, title, tpl, kind } — карточка нового сайта на «Параметрах»
  let tplSite = null; // адрес сайта из шаблона, открытого «Оформлением» его карточки: выход — на эту карточку
  function regShow(on) {
    const reg = $('#reg');
    const card = regToCard;
    regToCard = false;
    const site = regPublish;
    regPublish = null;
    if (on && site) {
      const send = () => reg.contentWindow.postMessage({ type: 'reg:publish-site', ...site }, '*');
      if (reg.src) send();
      else { reg.src = reg.dataset.src + '#/screen-1'; reg.addEventListener('load', send, { once: true }); }
      reg.hidden = false;
      return;
    }
    const site2 = typeof card === 'string' ? card : null; // карточка сайта из шаблона, иначе — «Мили»
    const params = regState;
    regState = null;
    const openSite = (screen) => reg.contentWindow.postMessage({ type: 'reg:open-site', screen, site: site2, params }, '*');
    if (on && !reg.src) {
      // сразу на нужном экране, без мелькания стартового; панель «Шаблоны» закрыта
      reg.src = reg.dataset.src + (card ? '#/screen-2' : '#/screen-1');
      if (card) reg.addEventListener('load', () => openSite('screen-2'), { once: true });
    } else if (on && card) openSite('screen-2');
    // стартовый экран без панели «Шаблоны» — сообщением: у файла (file://) фрейм чужой, его location.hash отсюда не задать
    else if (on) reg.contentWindow.postMessage({ type: 'reg:home' }, '*');
    reg.hidden = !on;
  }
  // «Оформление» в карточке «Мили» внутри реестра → сценарий «В конструкторе»
  // Шаблон на панели «Шаблоны» реестра → конструктор на весь экран в просмотре шаблона (tplOpen)
  window.addEventListener('message', (e) => {
    if (e.source !== $('#reg').contentWindow) return;
    if (e.data?.type === 'reg:open-constructor' && e.data.site) {
      // сайт, опубликованный из шаблона: шаблон в работе («Использовать» уже нажато), точки — как при публикации
      tplOpen(e.data.tpl, e.data.title, e.data.kind);
      stage.classList.remove('is-tpl-view');
      tplSite = e.data.site;
      restoreComponents(e.data.components);
    } else if (e.data?.type === 'reg:open-constructor') {
      frame.select('catalog-setup');
      restoreComponents(e.data.components);
    }
    else if (e.data?.type === 'reg:open-template') tplOpen(e.data.tpl, e.data.name, e.data.kind);
  });
  // Галочка и крестик в шапке конструктора — обратно в «Реестр сайтов».
  // Зашли из шаблона (просмотр или взят в работу, сайта ещё нет): крестик — в реестр (стартовый экран, панель «Шаблоны»
  // закрыта), галочка — создаёт сайт (карточка нового сайта). Зашли из карточки сайта — назад на неё;
  // параметры сайта переносит только галочка, крестик выходит без сохранения
  for (const btn of document.querySelectorAll('.ch-save > .btn:not(.ch-use):not(.ch-publish)')) btn.addEventListener('click', () => {
    const save = btn.classList.contains('ch-done');
    if (stage.classList.contains('is-tpl') && !tplSite) {
      if (save && !stage.classList.contains('is-tpl-view')) { tplToRegistry(false); return; }
    } else {
      regToCard = tplSite || true;
      if (save) regState = regParams(false);
    }
    tplSite = null;
    frame.select('sites');
  });
  /* «Параметры сайта» конструктора для карточки в реестре: домен (не подключён — сайт не опубликован), точки продаж
     с прайсами и страницы каталога и товара. publish — «Опубликовать»: домен подключается */
  function regParams(publish) {
    const dom = $('.rs-site [data-domain]');
    const domain = dom && window.domainState ? window.domainState(dom) : null;
    if (domain && publish) domain.state = 'Connected';
    const exportPoints = (id) => salesFor(id).map((row) => ({ name: SALES.find((p) => p.id === row.id).name, price: row.price }));
    const points = exportPoints('restaurant');
    const pages = {};
    for (const kind of Object.keys(pagePicks)) pages[kind] = lsPage(pagePicks[kind])?.name ?? null;
    // список страниц — набор и порядок как в левой панели: свои страницы сайта, потом группы компонентов
    const list = lsOrdered().map((p) => ({ id: p.id, name: p.name, group: lsGroupOf(p) ?? null, addr: p.addr, access: p.access, noindex: p.noindex, mode: p.mode, seo: p.seo, seoDescription: p.seoDescription }));
    const components = Object.keys(COMP).filter((id) => compOn.has(id)).map((id) => ({
      id,
      points: exportPoints(id),
      pages: Object.fromEntries(Object.entries(picksFor(id)).map(([kind, page]) => [kind, lsPage(page)?.name ?? null])),
    }));
    return { domain, points, pages, list, components };
  }


  function stageRect(node) {
    const s = stage.getBoundingClientRect();
    const r = node.getBoundingClientRect();
    return { left: (r.left - s.left) / scale, top: (r.top - s.top) / scale, width: r.width / scale, height: r.height / scale };
  }

  // Окна настроек (.pe) перетаскиваются за шапку и не выходят за края сцены. Следующее открытие ставит окно на обычное место.
  // Слушаем само окно: шапку настроек окна пересоздаёт wsMount.
  function peMoveTo(root, left, top) {
    root.style.left = Math.round(Math.max(0, Math.min(left, stage.offsetWidth - root.offsetWidth))) + 'px';
    root.style.top = Math.round(Math.max(0, Math.min(top, stage.offsetHeight - root.offsetHeight))) + 'px';
  }
  function peDraggable(root, onMove) {
    root.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || !e.target.closest('.pe__head') || e.target.closest('button, input')) return;
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const left = root.offsetLeft;
      const top = root.offsetTop;
      const move = (ev) => {
        onMove?.();
        peMoveTo(root, left + (ev.clientX - startX) / scale, top + (ev.clientY - startY) / scale);
      };
      const up = () => {
        root.removeEventListener('pointermove', move);
        root.removeEventListener('pointerup', up);
        root.removeEventListener('pointercancel', up);
      };
      root.setPointerCapture(e.pointerId);
      root.addEventListener('pointermove', move);
      root.addEventListener('pointerup', up);
      root.addEventListener('pointercancel', up);
    });
  }

  // Одновременно открыто одно окно или меню: новое закрывает прежнее, несохранённые правки в нём отменяются, как крестиком.
  // Без родителя не работают и остаются с ним только меню режима открытия, меню и палитры PropertyEditor.
  function popupsClose() {
    salesClose();
    catSetClose();
    rsCloseParams();
    lsCloseMenu();
    lsNewClose();
    wsClose();
    secClose();
    btnSetClose();
    fbClose();
  }

  // ---------- Правый сайдбар (Figma WHZ4ZSm4wRMrxQPWqEk5Wk 148:15451) ----------
  // Вписан в страницу, по умолчанию открыт «Магазин». Клик по иконке переключает панель, повторный — сворачивает до тулбара.
  // «Настройки» открывают окно поверх контента: вписанная панель скрыта, но её место остаётся за ней, поэтому контент не прыгает. Закрытие окна возвращает панель.
  // «Структура», «Стиль», «Шрифт» пока только с ховером: их панелей в макете нет.
  const rsParams = $('#rsParams');
  const rsParamsFrame = $('#rsParamsFrame');
  const pub = $('#pub'), pubBody = $('#pubBody');
  function moveParamsFrame(parent, before = null) {
    // Обычная вставка перезагружает документ iframe при переносе между панелями.
    if (parent.moveBefore) parent.moveBefore(rsParamsFrame, before);
    else parent.insertBefore(rsParamsFrame, before);
  }
  function paramsHost() {
    if (!pub.hidden) return pub;
    return rsParamsOpen ? rsParams : null;
  }
  function sendConstructorParams() {
    const host = paramsHost();
    const panelBounds = stageRect(rsParamsFrame);
    const bounds = stageRect(host);
    host.style.setProperty('--params-frame-left', `${-bounds.left}px`);
    host.style.setProperty('--params-frame-top', `${-bounds.top}px`);
    rsParamsFrame.contentWindow.postMessage({
      type: 'reg:embed-params',
      site: extraComponentSite(),
      params: regParams(false),
      panelBounds,
      inPublishDialog: host === pub,
    }, '*');
  }
  function showConstructorParams() {
    document.body.dataset.personalDocumentSite = extraComponentSite();
    document.dispatchEvent(new Event('personal-document-site-change'));
    if (rsParamsFrame.hasAttribute('src')) sendConstructorParams();
    else rsParamsFrame.src = rsParamsFrame.dataset.src;
  }
  rsParamsFrame.addEventListener('load', () => {
    if (paramsHost() && rsParamsFrame.hasAttribute('src')) sendConstructorParams();
  });
  window.addEventListener('message', (e) => {
    if (e.source !== rsParamsFrame.contentWindow || e.data?.site !== extraComponentSite()) return;
    if (e.data.type === 'reg:embed-overlay') {
      paramsHost()?.classList.toggle('is-overlay-open', e.data.open === true);
      return;
    }
    if (e.data.type === 'reg:embed-close') {
      if (pub.hidden) rsCloseParams();
      else pubClose();
    }
    if (e.data.type !== 'reg:embed-change') return;
    const { domain, components, pages } = e.data;
    if (domain) window.domainSetState($('.rs-site [data-domain]'), domain);
    if (components) restoreComponents(components);
    for (const { id, name, group, edits } of pages ?? []) {
      const page = lsPage(id) ?? lsPages.find((item) => item.name === name && (lsGroupOf(item) ?? null) === (group ?? null));
      if (page) Object.assign(page, edits);
    }
    if (pages?.length) lsRender();
  });
  let rsPanel = 'shop';    // открытая панель или null
  let rsParamsOpen = false;

  function rsRender() {
    stage.classList.toggle('is-rs-closed', !rsPanel);
    for (const name of ['shop', 'data']) $('#rs-' + name).hidden = name !== rsPanel || rsParamsOpen;
    const wasOpen = !rsParams.hidden;
    rsParams.hidden = !rsParamsOpen;
    if (rsParamsOpen && !wasOpen) showConstructorParams();
    if (!rsParamsOpen) { // меню выбора страницы закрывается вместе с окном; через DOM — rsRender зовётся и до объявления pagePick*
      $('#pagePickMenu').hidden = true;
      for (const b of document.querySelectorAll('[data-page-pick]')) b.setAttribute('aria-expanded', 'false');
    }
    for (const b of document.querySelectorAll('.rp-btn[data-rp]')) {
      const on = rsParamsOpen ? b.dataset.rp === 'settings' : b.dataset.rp === rsPanel;
      b.classList.toggle('is-active', on);
    }
  }

  function rsCloseParams() {
    if (!rsParamsOpen) return;
    salesPickerCancel();
    rsParamsOpen = false;
    rsParams.classList.remove('is-overlay-open');
    rsRender();
  }

  for (const b of document.querySelectorAll('.rp-btn[data-rp]')) {
    b.addEventListener('click', () => {
      const name = b.dataset.rp;
      if (name === 'settings') {
        const open = !rsParamsOpen;
        popupsClose();
        rsParamsOpen = open;
      }
      else if (rsParamsOpen) { popupsClose(); rsPanel = name; }
      else { salesClose(); rsPanel = rsPanel === name ? null : name; }
      rsRender();
    });
  }
  $('#rsParamsClose').addEventListener('click', rsCloseParams);
  stage.addEventListener('mousedown', (e) => {
    if (rsParamsOpen && !e.target.closest('#rsParams, #salesPicker, #salesPopup, #confirm, #qrDlg, #qrPrint, #qrAlert, .rp-btn, .personal-offers')) rsCloseParams();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && salesPicker.hidden) rsCloseParams(); });

  // Точки и прайсы — демоданные из сценария Figma. Изменения в окне хранятся в черновике до ✓.
  const ROOT_SALES = [
    { id: 'mili', name: 'Ресторан “Мили”', price: 'Меню A la carte' },
    { id: 'uglich', name: 'Ресторан “Мили” на Угличской', price: 'Меню Престо' },
    { id: 'teremok', name: 'Теремок', price: 'Меню A la carte' },
    { id: 'dvina', name: 'Хостел ДВИНА', price: 'Меню Престо' },
  ];
  const SALES_GROUPS = [
    { id: 'tensor', name: 'Тензор', names: ['Кафе «Московский проспект»', 'Столовая «На Угличской»'] },
    { id: 'kvesta', name: 'Квеста Бухобслуживание', names: ['Кафе «На Свободе»', 'Столовая «Центральная»'] },
    { id: 'hotel', name: 'SabyHotel', names: ['Ресторан «Волжская ривьера»', 'Лобби-бар «Панорама»'] },
    { id: 'tbank', name: 'Тинькофф', names: ['Кафе «Перерыв»', 'Кофейня «Пятый этаж»'] },
    { id: 'adygea', name: '01- Республика Адыгея', names: ['Ресторан «Майкоп»', 'Кафе «Адыгея»'] },
    { id: 'plyushkin', name: 'ИП Плюшкин', names: ['Пекарня «У Плюшкина»', 'Кофейня «Булка и кофе»'] },
  ].map((group) => ({ ...group, points: group.names.map((name, i) => ({ id: group.id + '-' + i, name, price: i ? 'Меню Престо' : 'Меню A la carte' })) }));
  const SALES = [...ROOT_SALES, ...SALES_GROUPS.flatMap((group) => group.points)];
  // Данные основной точки для «Текущей точки» в панели «Данные»; у остальных точек — только название
  const SALES_INFO = {
    mili: { description: 'Авторская кухня и сезонное меню', phone: '+7 (4852) 12-13-14', address: 'г. Ярославль, ул. Свободы, 46', hours: 'Ежедневно 10:00–23:00', email: 'mili@mili-rest.ru' },
    uglich: { description: 'Семейный ресторан с детской комнатой', phone: '+7 (4852) 20-30-40', address: 'г. Ярославль, ул. Угличская, 12', hours: 'Ежедневно 11:00–22:00', email: 'uglich@mili-rest.ru' },
  };
  const SALES_FIELDS = [
    ['name', 'Название', 'Строка'],
    ['description', 'Описание', 'Текст'],
    ['phone', 'Телефон', 'Телефон'],
    ['address', 'Адрес', 'Адрес'],
    ['hours', 'Режим работы', 'Строка'],
    ['email', 'Email', 'Email'],
  ];
  const salesExpanded = new Set();
  // Прайсы (Figma 2829:85088): [группа, подгруппы, прайсы]. «Мили» раскрыта, в ней столовые и два прайса. То же дерево — в реестре
  const PRICE_TREE = [
    ['Мили', [
      ['Столовая Кострома', [], ['Обеды Кострома', 'Банкетное меню Кострома']],
      ['Столовая Питер', [], ['Обеды Питер']],
      ['Столовые Ярославль', [], ['Обеды Ярославль', 'Прайс в ресторане на Московском']],
      ['Столовая Новосибирск', [], ['Обеды Новосибирск']],
      ['Гастромаркет ЕКБ', [], ['Гастромаркет ЕКБ']],
    ], ['Меню A la carte', 'Меню Престо']],
    ['Квеста Бухобслуживание', [], ['Прайс для кофейни', 'Демо прайс']],
    ['SabyHotel', [], ['Меню ресторана отеля', 'Room service']],
    ['Тинькофф', [], ['Обеды в офисе']],
    ['01- Республика Адыгея', [], ['Меню «Майкоп»']],
  ];
  const PRICES = [];
  (function walk(nodes) { for (const [, subs, names] of nodes) { walk(subs); PRICES.push(...names); } })(PRICE_TREE);
  const priceExpanded = new Set();
  const salesPopup = $('#salesPopup');
  const salesPicker = $('#salesPicker');
  let catalogAdded = false;
  let salesSaved = [];
  let salesDraft = null;
  let salesSelection = new Set();
  let salesPickerMode = null;
  let salesOnlySelected = false;
  // Связей между компонентами нет: компонент приносит только свои страницы (и настройки — пока только точки продаж у «Электронного меню»).
  // Полная версия с зависимостями и группами страниц — тег components-2.0.
  // widget — виджет компонента в магазине, widgetPage — страница, которую виджет открывает. Страницы создаются под виджет: у каждой страницы компонента свой виджет
  // (widgetPage — карточка блюда, остальные — по widgets). widgetHome — страница для самого виджета: приходит, только если компонент подключили в «Параметрах сайта», а его виджета на сайте нет.
  // Виджет, поставленный из магазина, стоит там, куда его поставили (в сценариях компонентов — на главной), страницы для него не создаётся.
  // Порядок — порядок чипсов в «Параметрах сайта».
  // Настройки у всех компонентов одинаковые (блок #salesSettings): «Страницы» — каталог и товар (catalog/product — страницы компонента
  // по умолчанию; у «Электронного меню» — «Меню» или «Главная» с каталогом и карточка) и точки: points — как они называются у компонента,
  // point — одна точка (для подсказок). Список точек в демо общий
  const COMP = {
    restaurant: { name: 'Электронное меню', desc: 'Меню и карточки блюд на сайте, цены и наличие из точек продаж', pages: ['Карточка блюда'], widget: 'Меню ресторана', widgetPage: 'Карточка блюда', widgetHome: 'Меню', points: 'Точки продаж', point: 'точку продаж' },
    delivery: { name: 'Доставка', desc: 'Корзина, оформление и оплата заказа с доставкой, история заказов покупателя', pages: ['Каталог', 'Корзина', 'Заказы', 'Карточка заказа'], widgets: { 'Каталог': 'Каталог товаров', 'Корзина': 'Корзина', 'Заказы': 'История заказов', 'Карточка заказа': 'Карточка заказа' }, catalog: 'Каталог', product: 'Карточка заказа', points: 'Точки продаж', point: 'точку продаж' },
    services: { name: 'Услуги', desc: 'Каталог услуг и онлайн-запись к специалисту на свободное время', pages: ['Каталог услуг', 'Карточка услуги', 'Специалисты', 'Карточка специалиста', 'Выбор времени записи'], widgets: { 'Каталог услуг': 'Каталог услуг', 'Карточка услуги': 'Карточка услуги', 'Специалисты': 'Мастера', 'Карточка специалиста': 'Карточка специалиста', 'Выбор времени записи': 'Выбор специалиста и времени' }, catalog: 'Каталог услуг', product: 'Карточка услуги', points: 'Филиалы', point: 'филиал' },
    hotel: { name: 'Отель', desc: 'Номера и цены, бронирование на даты с оплатой онлайн', pages: ['Номера', 'Карточка номера'], widgets: { 'Номера': 'Каталог номеров', 'Карточка номера': 'Сведения о номере' }, catalog: 'Номера', product: 'Карточка номера', points: 'Объекты размещения', point: 'объект размещения' },
  };
  const compOn = new Set();
  const componentBlocks = new Map();
  const componentSales = new Map();
  let salesComponent = 'restaurant';
  const compCfg = () => COMP[salesComponent];
  const salesFor = (id) => id === 'restaurant' ? salesSaved : componentSales.get(id) ?? [];
  function setSalesFor(id, rows) {
    if (id === 'restaurant') salesSaved = rows;
    else componentSales.set(id, rows);
  }
  let catalogHome = false;     // каталог стоит на главной (сценарии компонентов), а не на странице «Меню» прочих сценариев
  let catalogMenu = false;     // каталог стоит на странице «Меню», которую принесло «Электронное меню» (подключён в «Параметрах сайта» без виджета)
  const compConfigured = () => salesSaved.length > 0;
  // Чипсы «Параметров сайта»: неподключённые компоненты, иконка компонента + название. Подключённый уходит из чипсов
  function compChipsRender() {
    const chips = Object.entries(COMP).filter(([id]) => !compOn.has(id)).map(([id, c]) => {
      const chip = el('button', 'chips chips--optional'); // опциональное свойство ui-kit (PropertyGrid 37372:32955)
      chip.type = 'button';
      chip.dataset.compAdd = id;
      chip.title = c.desc;
      chip.setAttribute('aria-label', 'Подключить компонент: ' + c.name);
      chip.innerHTML = `<span class="chips__icon"><img src="assets/img/comp/${id}.svg" alt=""></span><span class="chips__caption"></span>`;
      chip.lastChild.textContent = c.name;
      return chip;
    });
    $('#compChips').replaceChildren(...chips);
    renderExtraComponentChips();
  }
  const extraComponentSite = () => tplSite || (stage.classList.contains('is-tpl') ? 'draft:' + stage.dataset.tpl : 'mili-yar.saby.ws');
  function removeExtraComponent(id, name) {
    const site = extraComponentSite();
    confirmAsk({ message: `Отключить компонент «${name}»?`, answers: [['yes', 'Да', true], ['cancel', 'Отмена']] },
      (answer) => { if (answer === 'yes') ExtraComponents.set(site, id, false); });
  }
  function renderExtraComponentChips() {
    const site = extraComponentSite();
    ExtraComponents.renderChips($('#compChips'), site);
    $('#compChipsBlock').hidden = !$('#compChips').childElementCount;
  }
  function renderExtraComponentGroups() {
    const groups = $('#compGroups');
    const extraGroups = ExtraComponents.active(extraComponentSite()).map(({ id, name, icon }) => {
      const group = el('section', 'sales-settings comp-group extra-component-group',
        '<div class="sales-settings__head"><div>' +
        '<img class="sales-settings__icon" width="24" height="24" alt="">' +
        '<span class="sales-settings__comp"></span>' +
        '<button class="sales-settings__remove" type="button"><span class="ico" aria-hidden="true">&#xE66C;</span></button>' +
        '</div></div>');
      group.setAttribute('aria-label', name);
      group.querySelector('img').src = icon;
      group.querySelector('.sales-settings__comp').textContent = name;
      const remove = group.querySelector('button');
      remove.setAttribute('aria-label', `Отключить компонент «${name}»`);
      remove.addEventListener('click', () => removeExtraComponent(id, name));
      return group;
    });
    for (const [id, block] of componentBlocks) {
      if (id !== 'restaurant' && !compOn.has(id)) { block.remove(); componentBlocks.delete(id); }
    }
    for (const id of Object.keys(COMP)) {
      const block = componentBlocks.get(id);
      if (block) groups.append(block);
    }
    groups.querySelectorAll(':scope > .extra-component-group').forEach((group) => group.remove());
    groups.append(...extraGroups);
  }
  function renderExtraComponents() {
    renderExtraComponentChips();
    renderExtraComponentGroups();
  }
  window.addEventListener('extra-components-change', renderExtraComponents);
  const salesCopy = (rows) => rows.map((row) => ({ ...row, prices: row.prices?.slice() }));
  const salesCurrent = (id = salesComponent) => (id === 'restaurant' && salesDraft) || salesFor(id);

  // Экспандеры в «Параметрах сайта»: «Сайт» и компонент сворачивают всю плашку (так же — в «Параметрах» реестра)
  document.addEventListener('click', e => {
    const t = e.target.closest('.sales-settings__toggle');
    if (!t) return;
    const open = t.getAttribute('aria-expanded') === 'false';
    t.setAttribute('aria-expanded', String(open));
  });
  function salesRenderRows(root, rows, id = salesComponent) {
    root.replaceChildren();
    if (!rows.length) {
      const empty = el('p', 'sales-empty');
      // «точки продаж» (у компонента — его точки) — кнопка-ссылка, работает как «+»
      empty.innerHTML = 'Добавьте ваши <button class="sales-empty__link" type="button" data-sales-add></button>, чтобы получать актуальную информацию о них';
      $('[data-sales-add]', empty).textContent = COMP[id].points.toLocaleLowerCase('ru');
      root.append(empty);
      return;
    }
    for (const [index, row] of rows.entries()) {
      // Строка не кликается: её можно только перетащить, первая — основная точка
      const item = el('div', 'sales-row');
      item.dataset.salesRow = row.id;
      const name = el('div', 'sales-row__name');
      const label = el('span');
      label.textContent = SALES.find((point) => point.id === row.id).name;
      name.append(label);
      if (!index) name.append(el('span', 'ico', '&#xEABA;'));
      const actions = el('div', 'sales-row__actions');
      if (index) {
        const primary = el('button', '', '<span class="ico">&#xEABA;</span>');
        primary.type = 'button';
        primary.dataset.salesPrimary = row.id;
        primary.title = 'Сделать текущей точкой';
        primary.setAttribute('aria-label', 'Сделать текущей точкой: ' + label.textContent);
        actions.append(primary);
      }
      const remove = el('button', '', '<span class="ico">&#xE65C;</span>');
      remove.type = 'button';
      remove.dataset.salesDelete = row.id;
      remove.setAttribute('aria-label', 'Удалить точку: ' + label.textContent);
      actions.append(remove);
      item.append(name, actions);
      root.append(item);
    }
  }
  function salesRender() {
    compChipsRender();
    const base = $('#salesSettings');
    componentBlocks.set('restaurant', base);
    for (const [id, cfg] of Object.entries(COMP)) {
      const connected = compOn.has(id);
      if (!connected && id !== 'restaurant') continue;
      let block = componentBlocks.get(id);
      if (!block) {
        block = base.cloneNode(true);
        block.removeAttribute('id');
        block.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
        $('.params-group-toggle', block).setAttribute('aria-expanded', 'true');
        componentBlocks.set(id, block);
      }
      block.dataset.comp = id;
      block.hidden = !connected && !catalogAdded;
      block.setAttribute('aria-label', cfg.name);
      $('.sales-settings__icon', block).src = `assets/img/comp/${id}.svg`;
      $('.sales-settings__comp', block).textContent = cfg.name;
      $('.sales-settings__sub--points span', block).textContent = cfg.points;
      QrCode.sync($('.comp-qr', block), id);
      CompCatalog.sync($('.comp-cat', block), id);
      const add = $('.sales-settings__sub--points [data-sales-add]', block);
      add.title = 'Добавить ' + cfg.point;
      add.setAttribute('aria-label', add.title);
      const remove = $('.sales-settings__remove', block);
      remove.hidden = !connected;
      remove.dataset.compToggle = id;
      remove.setAttribute('aria-label', `Отключить компонент «${cfg.name}»`);
      salesRenderRows($('.sales-rows', block), salesFor(id), id);
    }
    renderExtraComponentGroups();
    pagePickRender();
    catalogPriceRender();
    $('#salesData').hidden = !catalogAdded && !compOn.has('restaurant');
    $('#siteCatalog').classList.toggle('is-demo', (catalogHome || catalogMenu) && !salesSaved.length); // без точек продаж — демоданные
    salesRenderRows($('#salesPopupRows'), salesCurrent('restaurant'), 'restaurant');
    $('#salesReset').disabled = !salesDraft?.length; // сброс убирает точки: без них сбрасывать нечего
    salesDataCurrentRender();
  }
  // «Текущая точка» в панели «Данные» — поля основной (первой) точки продаж: название поля, тип справа, значение строкой ниже. Figma 3042:49624
  function salesDataCurrentRender() {
    const row = salesSaved[0];
    const point = row && { name: SALES.find((p) => p.id === row.id).name, ...SALES_INFO[row.id] };
    $('#salesDataCurrent').replaceChildren(...SALES_FIELDS.map(([key, name, type]) => {
      const item = el('div', 'rs-sub');
      const head = el('div', 'rs-sub__head');
      const title = el('span', 'rs-sub__name');
      title.textContent = name;
      const kind = el('span', 'rs-sub__type');
      kind.textContent = type;
      head.append(title, kind);
      item.append(head);
      const value = point?.[key];
      if (value) {
        const text = el('div', 'rs-sub__value');
        text.textContent = value;
        text.title = value;
        item.append(text);
      }
      return item;
    }));
  }
  function salesPickerCancel() {
    if (salesPicker.hidden) return;
    salesPicker.hidden = true;
    salesPickerMode = null;
  }
  function salesClose() {
    salesPickerCancel();
    salesPopup.hidden = true;
    salesDraft = null;
  }
  // Из «Параметров сайта» окно компонента открывается поверх них, параметры остаются открыты
  function salesOpen(overParams = false) {
    salesComponent = 'restaurant';
    overParams = overParams === true && rsParamsOpen;
    if (overParams) { salesPickerCancel(); lsCloseMenu(); lsNewClose(); wsClose(); secClose(); btnSetClose(); fbClose(); }
    else popupsClose();
    salesPopup.classList.toggle('sales-popup--over-params', overParams);
    salesDraft = salesCopy(salesSaved);
    salesRender();
    salesPopup.hidden = false;
  }
  function catalogPriceRender() {
    for (const link of document.querySelectorAll('[data-catalog-price]')) {
      link.textContent = CompCatalog.getPrice(extraComponentSite(), link.dataset.catalogPrice) || 'Выбрать прайс';
    }
  }
  window.addEventListener('catalog-price-change', catalogPriceRender);
  function salesPickerOpen(component = null) {
    salesPickerMode = component || 'points';
    salesOnlySelected = false;
    const rows = salesCurrent();
    const picked = rows.length ? rows.map((row) => row.id) : ROOT_SALES.slice(0, 2).map((point) => point.id);
    const price = component && CompCatalog.getPrice(extraComponentSite(), component);
    salesSelection = new Set(component ? (price ? [price] : []) : picked);
    if (component) { priceExpanded.clear(); priceExpanded.add('Мили'); }
    $('.sales-list-settings', salesPicker).hidden = !!component;
    $('#salesPickerPlus').hidden = !component;
    $('#salesPickerTitle').textContent = component ? 'Прайсы' : compCfg().points;
    $('#salesSearch').value = '';
    $('#salesSearch').setAttribute('aria-label', component ? 'Поиск прайсов' : 'Поиск: ' + compCfg().points.toLocaleLowerCase('ru'));
    salesPicker.hidden = false;
    salesPickerRender();
    $('#salesSearch').focus();
  }
  function salesPickerRender() {
    const root = $('#salesPickerList');
    root.replaceChildren();
    const query = $('#salesSearch').value.trim().toLocaleLowerCase('ru');
    const isPrice = salesPickerMode !== 'points';
    salesPickerHeader();
    const matches = (option) => option.name.toLocaleLowerCase('ru').includes(query) && (!salesOnlySelected || salesSelection.has(option.id));
    function optionRow(option) {
      const label = el('label', isPrice ? 'sales-option sales-option--price' : 'sales-option');
      const input = el('input');
      input.type = 'checkbox';
      input.name = 'sales-selection';
      input.value = option.id;
      input.checked = salesSelection.has(option.id);
      input.addEventListener('change', () => {
        if (isPrice && input.checked) {
          salesSelection.clear();
          root.querySelectorAll('input:checked').forEach((other) => { other.checked = other === input; });
        }
        if (input.checked) salesSelection.add(option.id);
        else salesSelection.delete(option.id);
        salesPickerHeader();
        if (salesOnlySelected) salesPickerRender();
      });
      label.append(input, document.createTextNode(option.name));
      return label;
    }
    let count = 0;
    if (isPrice) {
      // Дерево прайсов: группа видна, если подходит она сама или что-то внутри; при поиске и «только отмеченных» всё раскрыто
      const build = ([name, subs, names], parent, groupFits) => {
        const fitsName = groupFits || name.toLocaleLowerCase('ru').includes(query);
        const details = el('details', 'sales-picker__node');
        const summary = el('summary', 'sales-picker__group', '<span class="ico">&#xE96E;</span>');
        summary.append(document.createTextNode(name));
        const children = el('div', 'sales-picker__children');
        details.append(summary, children);
        let inner = 0;
        for (const sub of subs) inner += build(sub, children, fitsName);
        for (const price of names) {
          if ((fitsName || price.toLocaleLowerCase('ru').includes(query)) && (!salesOnlySelected || salesSelection.has(price))) { children.append(optionRow({ id: price, name: price })); inner++; }
        }
        if ((query || salesOnlySelected) && !inner) return 0;
        details.open = !!query || salesOnlySelected || priceExpanded.has(name);
        details.addEventListener('toggle', () => {
          if (details.open) priceExpanded.add(name);
          else priceExpanded.delete(name);
        });
        parent.append(details);
        return Math.max(inner, 1);
      };
      for (const group of PRICE_TREE) count += build(group, root, false);
    } else {
      if (!query && !salesOnlySelected) root.append(el('div', 'sales-picker__company', 'Вся компания'));
      for (const group of SALES_GROUPS) {
        const groupMatches = group.name.toLocaleLowerCase('ru').includes(query);
        const points = group.points.filter((point) => (groupMatches || point.name.toLocaleLowerCase('ru').includes(query)) && (!salesOnlySelected || salesSelection.has(point.id)));
        if (!points.length) continue;
        const details = el('details', 'sales-picker__node');
        details.open = !!query || salesOnlySelected || salesExpanded.has(group.id);
        const summary = el('summary', 'sales-picker__group', '<span class="ico">&#xE96E;</span>');
        summary.append(document.createTextNode(group.name));
        const children = el('div', 'sales-picker__children');
        for (const point of points) { children.append(optionRow(point)); count++; }
        details.append(summary, children);
        details.addEventListener('toggle', () => {
          if (details.open) salesExpanded.add(group.id);
          else salesExpanded.delete(group.id);
        });
        root.append(details);
      }
      for (const point of ROOT_SALES) if (matches(point)) { root.append(optionRow(point)); count++; }
    }
    if (!count) root.append(el('p', 'sales-empty', 'Ничего не найдено'));
  }
  function salesPickerHeader() {
    const empty = !salesSelection.size;
    if (empty) salesOnlySelected = false; // показывать «только отмеченные» нечего
    $('#salesCount').textContent = 'Отмечено ' + salesSelection.size;
    $('#salesCount').setAttribute('aria-pressed', salesOnlySelected);
    $('#salesFilter').setAttribute('aria-pressed', salesOnlySelected);
    const all = $('#salesSelectAll');
    const options = salesPickerMode === 'points' ? SALES.map((point) => point.id) : PRICES;
    all.setAttribute('aria-label', salesPickerMode === 'points' ? 'Выбрать все точки продаж' : 'Выбрать все прайсы');
    $('#salesCount').setAttribute('aria-label', salesPickerMode === 'points' ? 'Показать только отмеченные точки' : 'Показать только отмеченные прайсы');
    all.hidden = salesPickerMode !== 'points';
    // Пока ничего не отмечено — ни «Отмечено», ни чекбокса «Выбрать все»
    all.classList.toggle('is-empty', empty);
    $('#salesCount').hidden = empty;
    all.checked = options.every((id) => salesSelection.has(id));
    all.indeterminate = salesSelection.size > 0 && !all.checked;
  }
  for (const button of [$('#salesCount'), $('#salesFilter')]) button.addEventListener('click', () => {
    salesOnlySelected = !salesOnlySelected;
    salesPickerRender();
  });
  $('#salesSelectAll').addEventListener('change', (e) => {
    salesSelection = new Set(e.target.checked ? SALES.map((point) => point.id) : []);
    salesPickerRender();
  });
  $('#salesPickerDone').addEventListener('click', () => {
    if (salesPickerMode !== 'points') {
      CompCatalog.setPrice(extraComponentSite(), salesPickerMode, [...salesSelection][0] || '');
      salesPickerCancel();
      return;
    }
    const rows = salesCopy(salesCurrent()).filter((row) => salesSelection.has(row.id));
    for (const point of SALES) if (salesSelection.has(point.id) && !rows.some((row) => row.id === point.id)) rows.push({ id: point.id, price: point.price });
    // Выбор из окна компонента идёт в черновик окна: на сайт точки попадают только по «Сохранить» (галке) в окне
    if (salesComponent === 'restaurant' && salesDraft) salesDraft = salesCopy(rows);
    else salesSave(rows);
    salesPickerCancel();
    salesRender();
  });
  $('#salesSearch').addEventListener('input', salesPickerRender);
  $('#salesPickerClose').addEventListener('click', salesPickerCancel);
  $('#salesClose').addEventListener('click', salesClose);
  // Сохранённые точки продаж = «Электронное меню» настроено: оно подключается со своими страницами
  function salesSave(rows) {
    setSalesFor(salesComponent, salesCopy(rows));
    if (salesComponent === 'restaurant' && salesSaved.length && !compOn.has('restaurant')) { compConnect('restaurant'); pagePickDefaults('restaurant'); lsRender(); pagePickRender(); }
  }
  $('#salesDone').addEventListener('click', () => { salesSave(salesDraft); salesClose(); salesRender(); });
  $('#salesReset').addEventListener('click', () => { salesDraft = []; salesRender(); });
  // ---------- Настройки каталога (Figma WHZ4ZSm4wRMrxQPWqEk5Wk 2547:84587) ----------
  // Шестерёнка тулбара каталога открывает окно по левому верхнему углу виджета, повторный клик закрывает. Внутри пока только ховер.
  // Плитки — схемы из макета: [x, y, w, h, вид], вид f — заливка, b — рамка, d — пунктир; выбранная плитка — из макета.
  const CAT_TILES = {
    size: { w: 86, h: 86, items: [
      { name: 'Большой', rects: [[6, 6, 35, 35, 'f'], [45, 6, 35, 35, 'f'], [6, 45, 35, 35, 'b'], [45, 45, 35, 35, 'b']] },
      { name: 'Средний', on: true, rects: [0, 26, 52].flatMap((x) => [[x + 6, 6, 22, 22, 'f'], [x + 6, 32, 22, 22, 'f'], [x + 6, 58, 22, 22, 'b']]) },
      { name: 'Маленький', rects: [5, 25, 45, 65].flatMap((x) => [[x, 5, 16, 16, 'f'], [x, 25, 16, 16, 'f'], [x, 45, 16, 16, 'b'], [x, 65, 16, 16, 'b']]) },
    ] },
    toc: { w: 110, h: 92, items: [
      { name: 'Слева', rects: [...catTocLines(4), ...catTocGrid(56)] },
      { name: 'Справа', rects: [...catTocLines(60), ...catTocGrid(6)] },
      { name: 'Скрыто', on: true, w: 64, rects: catTocGrid(8) },
    ] },
    nav: { w: 74, h: 92, rows: [3, 2], items: [
      { name: 'Только разделы', rects: [0, 26, 52].flatMap((x) => [[x, 6, 22, 22, 'f'], [x, 32, 22, 22, 'f'], [x, 58, 22, 28, 'd']]) },
      { name: 'Карусель разделов', on: true, fit: true, rects: [0, 26, 52].flatMap((x) => [[x, 6, 22, 22, 'f'], [x, 32, 22, 25, 'b'], [x, 61, 22, 25, 'b']]) },
      { name: 'Только товары', rects: [0, 26, 52].flatMap((x) => [[x, 6, 22, 28, 'b'], [x, 38, 22, 28, 'b']]) },
      { name: 'Разделы в виде меню', rects: [[0, 18, 22, 3, 'f'], ...[0, 26, 52].flatMap((x) => [[x, 6, 22, 8, 'f'], [x, 26, 22, 28, 'b'], [x, 58, 22, 28, 'b']])] },
      { name: 'Динамическая плитка', rects: [[0, 6, 22, 22, 'f'], [0, 32, 22, 22, 'f'], [26, 6, 22, 48, 'f'], [52, 6, 22, 36, 'f'], [0, 58, 22, 28, 'b'], [26, 58, 22, 28, 'b'], [52, 58, 22, 28, 'b']] },
    ] },
  };
  // Оглавление: строки текста слева от сетки товаров (x — левый край строк) и сетка 2×3
  function catTocLines(x) {
    return [[0, 0, 40, 8], [6, 11, 40, 4], [6, 18, 40, 4], [6, 25, 34, 4], [0, 34, 40, 8], [6, 45, 40, 4], [6, 52, 40, 4], [6, 59, 34, 4]]
      .map(([dx, dy, w, h]) => [x + dx, 10 + dy, w, h, 'f', 2]);
  }
  function catTocGrid(x) {
    return [0, 26].flatMap((dx) => [[x + dx, 6, 22, 22, 'f'], [x + dx, 32, 22, 22, 'f'], [x + dx, 58, 22, 28, 'b']]);
  }
  for (const box of document.querySelectorAll('[data-cat-tiles]')) {
    const set = CAT_TILES[box.dataset.catTiles];
    const tiles = set.items.map((item) => {
      const tile = el('button', 'catset__tile' + (item.on ? ' is-selected' : '') + (item.fit ? ' catset__tile--fit' : ''), `<span class="catset__tile-name">${item.name}</span>`);
      tile.type = 'button';
      tile.setAttribute('aria-pressed', !!item.on);
      const pic = el('span', 'catset__pic');
      pic.style.width = (item.w ?? set.w) + 'px';
      pic.style.height = set.h + 'px';
      for (const [x, y, w, h, kind, r = 4] of item.rects) {
        const rect = el('i', 'catset__rect catset__rect--' + kind);
        Object.assign(rect.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', borderRadius: r + 'px' });
        pic.append(rect);
      }
      tile.append(pic);
      return tile;
    });
    if (!set.rows) { box.append(...tiles); continue; }
    let at = 0;
    for (const n of set.rows) {
      const row = el('div', 'catset__row');
      row.append(...tiles.slice(at, at += n));
      box.append(row);
    }
  }
  peDraggable($('#catSet'));
  // «Открывать товар» — тот же компонент, что «Способ отображения» в настройках страницы: своя подпись и два варианта
  const catSetOpenMode = openModeFill($('#catSet'), [], { title: 'Открывать товар', options: [['page', 'На странице'], ['window', 'В новом окне']] });
  catSetOpenMode.set('window');
  const catSetGear = $('#siteCatalogSettings');
  function catSetClose() {
    const root = $('#catSet');
    if (root.hidden) return;
    catSetOpenMode.close();
    root.hidden = true;
    catSetGear.classList.remove('is-selected');
    catSetGear.setAttribute('aria-pressed', 'false');
  }
  PropertyEditor.mount($('#catSet'), { onDone: catSetClose, onClose: catSetClose });
  // Окно настроек каталога открывается по шестерёнке в тулбаре (она же закрывает) и по клику на уже выделенный виджет:
  // первый клик выделяет, второй открывает — так же срабатывает и двойной клик.
  catSetGear.addEventListener('click', () => {
    if (!$('#catSet').hidden) { catSetClose(); return; }
    catSetOpen();
  });
  // Выделение ставит общий mousedown на сцене — раньше click. Поэтому «уже выделен» запоминается на mousedown самого виджета: он срабатывает до общего
  let catWasActive = false;
  $('#siteCatalog').addEventListener('mousedown', () => { catWasActive = $('#siteCatalog').classList.contains('is-active'); });
  $('#siteCatalog').addEventListener('click', (e) => {
    if (e.target.closest('.tb')) return; // клики по кнопкам тулбара — их собственные
    if (catWasActive && $('#catSet').hidden) catSetOpen();
  });
  function catSetOpen() {
    const root = $('#catSet');
    popupsClose();
    const r = stageRect($('#siteCatalog'));
    root.hidden = false;
    peMoveTo(root, r.left, r.top);
    catSetGear.classList.add('is-selected');
    catSetGear.setAttribute('aria-pressed', 'true');
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') catSetClose(); });
  stage.addEventListener('click', (e) => {
    if (e.target.closest('[data-sales-add]')) {
      salesComponent = e.target.closest('.sales-settings[data-comp]')?.dataset.comp ?? 'restaurant';
      salesPickerOpen();
    }
    const price = e.target.closest('[data-catalog-price], #catSet .btnset__list');
    if (price) salesPickerOpen(price.dataset.catalogPrice || 'restaurant');
    if (e.target.closest('#catSet .catset__clear')) CompCatalog.setPrice(extraComponentSite(), 'restaurant', '');
    const remove = e.target.closest('[data-sales-delete]');
    const primary = e.target.closest('[data-sales-primary]');
    if (!remove && !primary) return;
    const id = e.target.closest('.sales-settings[data-comp]')?.dataset.comp ?? 'restaurant';
    let rows = salesCopy(salesCurrent(id));
    if (remove) rows = rows.filter((row) => row.id !== remove.dataset.salesDelete);
    else { const at = rows.findIndex((row) => row.id === primary.dataset.salesPrimary); rows.unshift(...rows.splice(at, 1)); }
    if (id === 'restaurant' && salesDraft) salesDraft = rows;
    else setSalesFor(id, rows);
    salesRender();
  });
  // Перетаскивание строк точек продаж: порядок меняется, первая строка становится основной точкой
  // На pointer-событиях, а не HTML5 drag: нативный призрак рисуется без масштаба сцены и выходит крупнее строки.
  // Строка остаётся в списке своего размера и переезжает между соседями вслед за курсором (как в списках Saby). Так же — в реестре.
  let salesDragStart = null; // { row, y } — нажали, но ещё не сдвинули
  let salesDragged = null;
  stage.addEventListener('pointerdown', (e) => {
    const row = e.button === 0 && e.target.closest('[data-sales-row]');
    if (row && !e.target.closest('button')) salesDragStart = { row, y: e.clientY };
  });
  document.addEventListener('pointermove', (e) => {
    if (salesDragStart && !salesDragged && Math.abs(e.clientY - salesDragStart.y) > 3) {
      salesDragged = salesDragStart.row;
      salesDragged.classList.add('is-drag');
      document.documentElement.classList.add('is-row-dragging');
      window.getSelection()?.removeAllRanges();
    }
    if (!salesDragged) return;
    e.preventDefault();
    const list = salesDragged.parentNode;
    const next = [...list.querySelectorAll('[data-sales-row]')].find((x) => {
      if (x === salesDragged) return false;
      const r = x.getBoundingClientRect();
      return e.clientY < r.top + r.height / 2;
    });
    if (next !== salesDragged.nextElementSibling && (next || list.lastElementChild !== salesDragged)) list.insertBefore(salesDragged, next ?? null);
  });
  const salesDragEnd = () => {
    salesDragStart = null;
    const dragged = salesDragged;
    if (!dragged) return;
    salesDragged = null;
    dragged.classList.remove('is-drag');
    document.documentElement.classList.remove('is-row-dragging');
    const order = [...dragged.parentNode.querySelectorAll('[data-sales-row]')].map((row) => row.dataset.salesRow);
    const id = dragged.closest('.sales-settings[data-comp]')?.dataset.comp ?? 'restaurant';
    const rows = salesCopy(salesCurrent(id)).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    if (id === 'restaurant' && salesDraft) salesDraft = rows;
    else setSalesFor(id, rows);
    salesRender();
  };
  document.addEventListener('pointerup', salesDragEnd);
  document.addEventListener('pointercancel', salesDragEnd);
  // Esc отменяет только верхнее окно; родитель остаётся открыт.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || (salesPicker.hidden && salesPopup.hidden)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (!salesPicker.hidden) salesPickerCancel();
    else salesClose();
  }, true);

  // «Магазин»: статика с ховером
  $('#rsSmall').innerHTML = ['E6D3', 'EAC3', 'EAEE', 'EA80'].map((g) => `<div class="rs-cell"><span class="ico24">&#x${g};</span></div>`).join('');
  const SHOP_ITEMS = [
    ['EAC9', 'Текст'], ['EBD3', 'Заголовок'], ['E9A3', 'Изображение'], ['E929', 'Видео'], ['E739', 'Файл'],
    ['EB7E', 'Отправить ответ'], ['E6CC', 'Таблица'], ['E63D', 'Наименование'], ['EA5F', 'Заказать'],
  ];
  // пустая ячейка держит «Заказать» в ширину половины ряда
  $('#rsMedium').innerHTML = SHOP_ITEMS.map(([g, t]) => `<div class="rs-item"><span class="ico">&#x${g};</span>${t}</div>`).join('') + '<div class="rs-item rs-item--empty"></div>';
  // [название, описание, высота, картинка, белая подложка, положение картинки из макета, файл картинки, если не <картинка>.png]
  const COVER = 'inset:0;width:100%;height:100%;object-fit:cover';
  const CONTAIN = 'inset:0;width:100%;height:100%;object-fit:contain';
  // Каталоги — по компонентам из документа: работаем только с «Меню ресторана» (компонент «Электронное меню»), у остальных нет ни клика, ни ховера
  // Каталоги в магазине есть только в сценариях компонентов (catalog-*), в остальных сценариях их нет совсем
  const SHOP_WIDGETS = [
    ['Меню ресторана', 'Блюда и напитки по разделам меню с ценами', 290, 'catalog', false, CONTAIN, 'catalog-menu.svg'],
    ['Каталог товаров', 'Витрина магазина: разделы, товары и цены', 290, 'catalog-goods', false, CONTAIN, 'catalog-goods.svg'],
    ['Каталог услуг', 'Услуги с длительностью, ценой и записью к специалисту', 290, 'catalog-services', false, CONTAIN, 'catalog-services.svg'],
    ['Каталог номеров', 'Номера отеля с вместимостью, ценой и бронированием', 290, 'catalog-rooms', false, CONTAIN, 'catalog-rooms.svg'],
    ['Карточка товара', 'Для отображения товара со всеми его свойствами', 357, 'product', true, CONTAIN],
    ['Корзина', 'Для хранения выбранных товаров, расчета итоговой стоимости и быстрого перехода к оформлению заказа', 231, 'cart', true, CONTAIN],
    ['Мои контакты', 'Закрепите контакты для быстрого доступа, звоните и пишите коллегам в один клик', 267, 'contacts', false, 'left:-8.18%;top:-16.06%;width:110.98%;height:126.28%'],
    ['Список страниц', 'Позволяет редактировать и настраивать страницы', 190, 'pages', false, 'left:-13.21%;top:-23.68%;width:121.23%;height:137.37%'],
    ['Текстовый виджет', 'Позволяет редактировать и просматривать текст', 159, 'text', false, 'left:-1.18%;top:-5.37%;width:104.72%;height:110.07%'],
    ['Уведомления', 'Виджет для отображения уведомлений по категориям', 267, 'notifications', false, 'left:-2.12%;top:-3.35%;width:105.66%;height:107.43%'],
  ];
  const shopWidgetsHtml = (list) => list.map(([name, desc, h, img, white, pos, file = img + '.png']) =>
    `<div class="rs-w${img.startsWith('catalog') ? ' rs-w--catalog' : ''}" data-widget="${img}" style="height:${h}px"><div><div class="rs-w__name">${name}</div><div class="rs-w__desc">${desc}</div></div>` +
    `<div class="rs-w__pv${white ? ' rs-w__pv--white' : ''}"><div class="rs-w__img"><img src="assets/img/shop/${file}" alt="" style="${pos}"></div><span class="ico24 rs-w__plus">&#xEAE9;</span></div></div>`).join('');
  $('#rsWidgets').innerHTML = shopWidgetsHtml(SHOP_WIDGETS);
  // Внешние виджеты — вместо расширенных в сценарии «С плавающей кнопкой»
  $('#rsOuter').innerHTML = shopWidgetsHtml([
    ['Обратная связь', 'Позволяет получить данные для связи с клиентом', 350, 'feedback', true, CONTAIN],
    ['Онлайн-запись', 'Дает возможность быстро записаться на услугу к нужному мастеру', 412, 'booking', true, CONTAIN],
  ]);
  // Расширенный магазин (ui-kit shop): кнопка у «Виджеты» раздвигает панель влево, слева мастер групп — разделы магазина.
  // Клик по группе выделяет её и прокручивает список к разделу, «Все» и «Контейнеры» — к началу. Счётчики — видимые сейчас виджеты раздела
  const rsShopPanel = $('#rs-shop'), rsShopList = $('.rs-shop', rsShopPanel), rsShopExpand = $('#rsShopExpand');
  const rsVisible = (sel) => [...rsShopPanel.querySelectorAll(sel)].filter((e) => e.offsetParent !== null).length;
  function rsGroupsCount() {
    const n = { containers: rsVisible('.rs-cell'), basic: rsVisible('.rs-item:not(.rs-item--empty)'), ext: rsVisible('#rsWidgets .rs-w'), outer: rsVisible('#rsOuter .rs-w') };
    n.all = n.containers + n.basic + (stage.dataset.scenario.startsWith('ext-') ? n.outer : n.ext);
    for (const li of $('#rsGroups').children) li.querySelector('.ml__count').textContent = n[li.dataset.shopGroup];
  }
  rsShopExpand.addEventListener('click', () => {
    const on = !rsShopPanel.classList.contains('is-expanded');
    rsShopPanel.classList.toggle('is-expanded', on);
    rsShopExpand.setAttribute('aria-expanded', String(on));
    if (on) rsGroupsCount();
  });
  $('#rsGroups').addEventListener('click', (e) => {
    const item = e.target.closest('.ml__item');
    if (!item) return;
    for (const li of $('#rsGroups').children) {
      li.classList.toggle('is-selected', li === item);
      if (li === item) li.setAttribute('aria-current', 'true'); else li.removeAttribute('aria-current');
    }
    const section = { basic: '.rs-medium', ext: '.rs-ext:not(.rs-ext--outer)', outer: '.rs-ext--outer' }[item.dataset.shopGroup];
    const top = section ? $(section, rsShopList).offsetTop - rsShopList.offsetTop : 0;
    rsShopList.scrollTo({ top, behavior: 'smooth' });
    rsGroupsCount();
  });
  const shopFeedback = $('#rsOuter [data-widget="feedback"]').closest('.rs-w');
  const shopFeedbackPin = el('span', 'pin', '<img src="assets/img/pin-cursor.svg" width="15" height="15" alt="">');
  shopFeedbackPin.setAttribute('aria-hidden', 'true');
  $('.rs-w__pv', shopFeedback).append(shopFeedbackPin);

  // Окно внешних виджетов: клик по «Обратной связи» открывает её варианты по центру. Добавить можно только её: у «Онлайн-записи» нет ни клика, ни ховера.
  // Закрывается крестиком, Esc и кликом мимо. Пин виджета виден, только пока окно закрыто и кнопка ещё не поставлена.
  const EXT_SALES = 'Мили, ООО, подразделение, г. Ярославль';
  const EXT_VARIANTS = {
    feedback: [['Обратная связь', 'Без точек продаж'], ['Данные для связи', EXT_SALES], ['Обратная связь', 'Без точек продаж']],
  };
  const extPicker = $('#extPicker');
  const extPlace = $('#extPlace');
  const extPlaceCard = $('#extPlaceCard');
  // Расположение на сайте — тот же компонент, что «Способ отображения»: своя подпись и свой список
  const extPlaceMode = openModeFill(extPlace, [], { title: 'Расположение на сайте', options: [['float', 'Плавающее'], ['section', 'В теле страницы']] });
  function extPickerOpen(preview) {
    const img = preview.dataset.widget;
    $('#extPickerTitle').textContent = $('.rs-w__name', preview.closest('.rs-w')).textContent;
    $('#extPickerList').innerHTML = EXT_VARIANTS[img].map(([name, desc], i) =>
      `<div class="ext-card"><div class="ext-card__name">${name}</div><div class="ext-card__desc">${desc}</div>` +
      `<div class="ext-card__pv"><img src="assets/img/shop/${img}.png" alt="" draggable="false"></div><span class="ico24 ext-card__mark">&#xE75E;</span>` +
      `${i ? '' : '<span class="pin" aria-hidden="true"><img src="assets/img/pin-cursor.svg" width="15" height="15" alt=""></span>'}</div>`).join('');
    extPlaceMode.set('float');
    extPlace.hidden = true;
    extPicker.hidden = false;
    extPinSync();
  }
  function extPickerClose() {
    extPicker.hidden = true;
    extPlace.hidden = true;
    extPlaceMode.close();
    extPinSync();
  }
  // Выбор плашки закрывает окно: вместо него — настройка вставки с выбранным вариантом. Клик по превью возвращает к выбору
  function extPlaceOpen(card) {
    $('#extPlaceTitle').textContent = $('.ext-card__name', card).textContent;
    extPlaceCard.innerHTML = card.innerHTML;
    extPlaceCard.querySelectorAll('.ext-card__name, .ext-card__desc, .ext-card__mark, .pin').forEach((node) => node.remove()); // название уже в шапке окна, здесь только превью
    extPicker.hidden = true;
    extPlace.hidden = false;
  }
  // Обратная связь ставится только с «Меню»: на других страницах у виджета нет ни клика, ни точки клика
  function extOnMenu() {
    const page = lsPage(lsActive);
    return !!page && !page.blank && !page.home;
  }
  function extPinSync() {
    shopFeedbackPin.hidden = !extPicker.hidden || !extPlace.hidden || stage.dataset.scenario !== 'ext-add' || !extOnMenu();
  }
  $('#rsOuter').addEventListener('click', (e) => {
    const preview = e.target.closest('[data-widget="feedback"]');
    if (!preview || !extOnMenu()) return;
    extPickerOpen(preview);
  });
  $('#extPickerList').addEventListener('click', (e) => {
    const card = e.target.closest('.ext-card');
    if (card) extPlaceOpen(card);
  });
  extPlaceCard.addEventListener('click', () => {
    extPlace.hidden = true;
    extPicker.hidden = false;
  });
  // Галочка вставляет виджет: плавающий — сценарий плавающей кнопки, в тело страницы — сценарий секции
  $('#extPlaceDone').addEventListener('click', () => {
    const place = extPlaceMode.mode;
    btnSetClose();
    siteClearSelection();
    extPickerClose();
    if (place === 'section') frame.select('ext-added', 'section');
    else {
      siteFloatAdd();
      scenSet('ext-added', 'float');
    }
  });
  $('#extPlaceClose').addEventListener('click', extPickerClose);
  $('#extPickerClose').addEventListener('click', extPickerClose);
  document.addEventListener('mousedown', (e) => { if (!e.target.closest('#extPicker, #extPlace, #rsOuter [data-widget="feedback"]')) extPickerClose(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (extPlaceMode.isOpen) extPlaceMode.close();
    else extPickerClose();
  });

  // Виджет на фрейме: клик по «Каталогу» в магазине ставит его в зону контента секции вместо пустой ячейки и выделяет,
  // каталог пропадает из магазина, появляется страница «Карточка товара». Удаление виджета возвращает всё обратно.
  // Выделение — .is-active у .wg: снимается кликом мимо, клик по виджету ставит снова. «Удалить» в тулбаре возвращает пустую ячейку.
  for (const cell of document.querySelectorAll('.site-empty')) cell.prepend($('#siteEmptyContent').content.cloneNode(true));
  for (const tb of document.querySelectorAll('[data-section-cmds]')) tb.append($('#sectionCmds').content.cloneNode(true));
  for (const tb of document.querySelectorAll('[data-button-cmds]')) tb.append($('#buttonCmds').content.cloneNode(true));
  for (const form of document.querySelectorAll('[data-site-feedback]')) {
    form.append($('#siteFeedbackForm').content.cloneNode(true));
    // Содержимое виджета статично и настраивается в панели: клик проходит на сам виджет и выделяет его. В панели живой только заголовок
    // В плавающем окне живой только крестик: он сворачивает окно в плашку
    if (form.id === 'fbForm') for (const part of form.querySelectorAll('.site-feedback__close, .site-feedback__head ~ *')) part.inert = true;
    else if (form.closest('#siteFloat')) for (const part of form.querySelectorAll('.site-feedback__title, .site-feedback__head ~ *')) part.inert = true;
    else form.inert = true;
  }
  for (const footer of document.querySelectorAll('[data-site-footer]')) footer.append($('#siteFooter').content.cloneNode(true));
  const siteSection = $('#siteSection');
  const siteCatalog = $('#siteCatalog');
  const siteLink = $('#siteLink');
  const siteLinkWidget = $('#siteLinkWidget');
  // Демоданные: пока у компонента нет точек продаж, вместо фото блюд — демо-фото, те же, что в превью «Меню ресторана» (.is-demo ставит salesRender)
  siteCatalog.querySelectorAll('.site-card__img, .site-cat').forEach((box, i) => {
    const demo = el('img', 'site-demo');
    demo.src = `assets/img/site/demo/dish-${i % 6 + 1}.jpg`;
    demo.alt = '';
    box.prepend(demo);
  });
  const siteContent = $('#content');
  const siteMain = $('#site');
  const siteBlank = $('#siteBlank');
  const siteBlankBody = $('#siteBlankBody');
  const siteBlankSection = $('#siteBlankSection');
  const siteBlankCell = $('#siteBlankCell');
  const siteProduct = $('#siteProduct');
  const siteExt = $('#siteExt');
  const siteExtWidget = $('#siteExtWidget');

  // Fixed привязан к масштабируемой сцене и выходит из overflow прокручиваемого контента.
  // Оставляем настоящий тулбар внутри виджета: выделение, ховер и обработчики кнопок сохраняются.
  const widgetToolbars = [...siteContent.querySelectorAll('.wg__toolbar')];
  let toolbarFrame = 0;
  function positionWidgetToolbars() {
    toolbarFrame = 0;
    for (const toolbar of widgetToolbars) {
      const widget = toolbar.parentElement;
      if (!widget.getClientRects().length) continue;
      const r = stageRect(widget);
      const h = toolbar.getBoundingClientRect().height / scale;
      // Целые пиксели: дробные координаты при каждом пересчёте дают субпиксельный сдвиг — текст «прыгает».
      const left = Math.round(r.left) + 'px';
      const top = Math.round(Math.max(6, r.top - h - 8)) + 'px';
      if (toolbar.style.getPropertyValue('--widget-toolbar-left') !== left) toolbar.style.setProperty('--widget-toolbar-left', left);
      if (toolbar.style.getPropertyValue('--widget-toolbar-top') !== top) toolbar.style.setProperty('--widget-toolbar-top', top);
    }
  }
  function scheduleWidgetToolbars() {
    if (!toolbarFrame) toolbarFrame = requestAnimationFrame(positionWidgetToolbars);
  }
  siteContent.addEventListener('scroll', scheduleWidgetToolbars, { passive: true });
  window.addEventListener('resize', scheduleWidgetToolbars);
  new ResizeObserver(scheduleWidgetToolbars).observe(siteContent);
  new MutationObserver(scheduleWidgetToolbars).observe(stage, { subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
  scheduleWidgetToolbars();

  const shopProduct = $('#rsWidgets [data-widget="product"]').closest('.rs-w');
  // Подсказка клика: видна там, где карточку можно поставить — на новой странице или в окне без карточки
  const shopProductPin = el('span', 'pin', '<img src="assets/img/pin-cursor.svg" width="15" height="15" alt="">');
  shopProductPin.setAttribute('aria-hidden', 'true');
  $('.rs-w__pv', shopProduct).append(shopProductPin);

  function siteCatalogShow(on) {
    if (!on && siteCatalog.parentElement === siteBlankSection) { // каталог убрали из окна — в окне снова пустая ячейка
      siteSection.append(siteCatalog);
      siteBlankCell.hidden = false;
      siteBlankSection.classList.remove('has-widget');
    }
    siteCatalog.hidden = !on;
    $('.site-empty', siteSection).hidden = on;
    siteSection.classList.toggle('has-widget', on);
  }
  function catalogHomeSet(on) {
    catalogHome = on;
    siteMain.classList.toggle('is-catalog-home', on);
  }
  // «Меню ресторана» встаёт на главную и подключает «Электронное меню» с его страницами.
  // Окно настроек открывается, только если компонент ещё не настроен (нет точек продаж), иначе виджет берёт настройки компонента.
  function siteAddCatalog() {
    if (catalogAdded) return;
    const home = lsPages.find((p) => p.home);
    if (!home) return; // главную удалили — ставить некуда
    if (lsActive !== home.id) lsSelect(home.id);
    catalogHomeSet(true);
    catalogAdded = true;
    compConnect('restaurant');
    pagePickDefaults('restaurant');
    pagePickRender();
    siteCatalogShow(true);
    siteCatalog.classList.add('is-active');
    lsRender();
    salesRender();
    if (!compConfigured()) salesOpen();
  }
  // Удаление виджета не трогает компонент и его страницы: они уходят только вместе с компонентом
  function siteRemoveCatalog() {
    salesClose();
    catSetClose();
    catalogAdded = false;
    if (!compOn.has('restaurant')) { // каталог других сценариев: без компонента, точки и «Карточка товара» уходят вместе с ним
      salesSaved = [];
      lsRemoveCardPage();
    }
    if (catalogMenu) { // каталог «Меню» уходит только с компонентом, а с ним и страница: дальше каталог снова ставится на главную
      catalogMenu = false;
      catalogHomeSet(true);
    }
    salesRender();
    siteCatalogShow(false);
    siteCatalog.classList.remove('is-active');
  }
  // Подключение: компонент и его страницы. Уже подключённый компонент возвращает свои страницы, если их удалили вместе с виджетом
  function compConnect(id) {
    compOn.add(id);
    COMP[id].pages.forEach((name, i) => {
      if (lsPages.some((p) => p.comp === id && p.name === name)) return;
      const widgetPage = name === COMP[id].widgetPage;
      const page = { id: lsNextId++, name, off: false, blank: true, mode: 'page', fixed: true, comp: id, widgetPage, product: widgetPage, compWidget: COMP[id].widgets?.[name] };
      // вернувшаяся страница встаёт на своё место среди страниц компонента
      const order = (p) => p.comp === id ? COMP[id].pages.indexOf(p.name) : -1;
      const after = lsPages.findLastIndex((p) => p.comp === id && order(p) < i);
      const before = lsPages.findIndex((p) => order(p) > i);
      lsPages.splice(after >= 0 ? after + 1 : before >= 0 ? before : lsPages.length, 0, page);
    });
  }
  // Компонент подключён, а его виджета на сайте нет: приходит страница для виджета («Меню») — первой в группе компонента, с виджетом на ней
  function compAddWidgetHome(id) {
    const c = COMP[id];
    if (!c.widgetHome || catalogAdded) return;
    const page = { id: lsNextId++, name: c.widgetHome, off: false, mode: 'page', fixed: true, comp: id, menu: true };
    const at = lsPages.findIndex((p) => p.comp === id);
    lsPages.splice(at >= 0 ? at : lsPages.length, 0, page);
    catalogHomeSet(false);
    catalogMenu = true;
    catalogAdded = true;
    siteCatalogShow(true);
    siteCatalog.classList.remove('is-active');
  }
  function compDropPages(match) {
    lsPages = lsPages.filter((p) => !match(p));
    if (!lsPage(lsActive)) lsActive = (lsPages.find((p) => p.home) ?? lsPages[0]).id;
    lsRender();
  }
  // Отключение компонента: уходят только его страницы (и его виджет, его настройки). Другие компоненты — ни зависящие от него, ни его зависимости — остаются
  function compRemoveAsk(id) {
    const match = (page) => lsGroupOf(page) === id ||
      (id === 'restaurant' && catalogAdded && page.id === lsCardPageId);
    const pages = lsPages.filter((page) => !page.home && match(page)).map((page) => `«${page.name}»`);
    const list = pages.length > 1 ? pages.slice(0, -1).join(', ') + ' и ' + pages.at(-1) : pages[0];
    salesClose();
    confirmAsk({
      message: `Отключить компонент «${COMP[id].name}»?`,
      details: pages.length ? (pages.length > 1 ? 'Удалятся страницы ' : 'Удалится страница ') + list + '.' : '',
      answers: [['yes', 'Да', true], ['cancel', 'Отмена']],
    }, (answer) => {
      if (answer !== 'yes') return;
      compOn.delete(id);
      compDropPages((page) => !page.home && match(page));
      if (id === 'restaurant') {
        if (catalogAdded) siteRemoveCatalog();
        salesSaved = [];
        pagePicks.catalog = pagePicks.product = null;
      } else {
        componentSales.delete(id);
        componentPicks.delete(id);
      }
      pagePickClose();
      salesRender();
    });
  }
  function restoreComponents(settings) {
    if (!settings) { salesRender(); return; }
    const ids = new Set(settings.map(({ id }) => id));
    for (const id of compOn) {
      if (ids.has(id)) continue;
      compOn.delete(id);
      compDropPages((page) => !page.home && lsGroupOf(page) === id);
      if (id === 'restaurant' && catalogAdded) siteRemoveCatalog();
    }
    for (const { id, points, pages } of settings) {
      if (!compOn.has(id)) {
        compConnect(id);
        compAddWidgetHome(id);
      }
      if (points) {
        setSalesFor(id, points.flatMap(({ name, price }) => {
          const point = SALES.find((item) => item.name === name);
          return point ? [{ id: point.id, price }] : [];
        }));
      }
      const picks = picksFor(id);
      pagePickDefaults(id);
      for (const kind of Object.keys(picks)) {
        if (!pages || !(kind in pages)) continue;
        const matches = (page) => page.name === pages[kind];
        picks[kind] = (lsPages.find((page) => matches(page) && lsGroupOf(page) === id) ?? lsPages.find(matches))?.id ?? null;
      }
    }
    lsRender();
    salesRender();
  }
  // Чипса подключает компонент, крестик группы отключает (с подтверждением):
  // приходят только его страницы
  stage.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-comp-toggle], [data-comp-add]');
    if (toggle) {
      const id = toggle.dataset.compToggle || toggle.dataset.compAdd;
      if (toggle.dataset.compToggle) {
        if (compOn.has(id)) compRemoveAsk(id);
        return;
      }
      if (compOn.has(id)) return;
      compConnect(id);
      compAddWidgetHome(id);
      pagePickDefaults(id);
      lsRender();
      pagePickRender();
      salesRender();
      return;
    }
  });

  // Подтверждение (Figma nuC4KFMiS36uDWDUp9wKGl 4064:21938, как в interface-prototype): по центру сцены, поверх всего. Esc — последний ответ («Отмена»)
  const confirmLayer = $('#confirm');
  let confirmDone = null;
  function confirmAsk({ message, details, answers }, onAnswer) {
    $('#confirmMsg').textContent = message;
    $('#confirmDetails').textContent = details ?? '';
    $('#confirmDetails').hidden = !details;
    $('#confirmFooter').replaceChildren(...answers.map(([id, caption, primary]) => {
      const b = el('button', 'confirm__btn' + (primary ? ' confirm__btn--primary' : ''));
      b.type = 'button';
      b.dataset.answer = id;
      b.textContent = caption;
      return b;
    }));
    confirmLayer.hidden = false;
    confirmDone = (answer) => onAnswer(answer ?? answers.at(-1)[0]);
  }
  function confirmClose(answer) {
    confirmLayer.hidden = true;
    const done = confirmDone;
    confirmDone = null;
    done?.(answer);
  }
  confirmLayer.addEventListener('mousedown', (e) => e.stopPropagation()); // клик в окне не закрывает остальные окна и не снимает выделение
  confirmLayer.addEventListener('click', (e) => {
    e.stopPropagation();
    const b = e.target.closest('[data-answer]');
    if (b) confirmClose(b.dataset.answer);
  });
  window.addEventListener('keydown', (e) => {
    if (confirmLayer.hidden || e.key !== 'Escape') return;
    e.preventDefault();
    e.stopImmediatePropagation();
    confirmClose();
  }, true);

  $('#rsWidgets').addEventListener('click', (e) => {
    if (e.target.closest('[data-widget="catalog"]')) siteAddCatalog();
    if (e.target.closest('[data-widget="product"]')) siteAddProduct();
  });
  // каталог на «Меню» компонента — основной виджет страницы и не удаляется
  const siteDeleteCatalog = () => { if (!catalogMenu) siteRemoveCatalog(); };
  $('#siteCatalogDelete').addEventListener('click', siteDeleteCatalog);

  // Новая страница (blank) — вместо сайта пустая секция, на ней ничего не выделено. «В окне» — внутри окна и с неактивным адаптивом, иначе — под шапкой сайта.
  // «Страница и окно» — переключатель в шапке показывает страницу (по умолчанию) или окно, выбор запоминается в странице.
  const siteTumbler = $('#chDevice');
  const siteView = $('#chView');
  let siteShown = null;
  // На открытой странице ничего не выделено: выделение появляется только кликом
  function siteClearSelection() {
    for (const widget of [siteCatalog, siteFloat, siteLinkWidget, siteProduct, siteSection, siteLink, siteBlankSection, siteExt, siteExtWidget]) widget.classList.remove('is-active');
  }
  function siteShowPage(page) {
    const isBoth = page.mode === 'both';
    const view = page.view ?? 'page';
    const shown = `${page.id}:${page.mode}:${isBoth ? view : ''}`;
    if (shown === siteShown) return;
    siteShown = shown;
    const isWindow = page.mode === 'window' || (isBoth && view === 'window');
    const isBlank = page.blank || isWindow;
    siteView.hidden = !isBoth;
    for (const seg of siteView.children) seg.classList.toggle('is-on', seg.dataset.view === view);
    siteMain.hidden = isBlank;
    // Главная — баннер и «О нас», на «Меню» — только секция с каталогом. В сценариях компонентов каталог стоит на главной между ними
    siteMain.classList.toggle('is-home', !!page.home);
    siteMain.classList.toggle('is-about', !!page.about); // «О нас»: свой контент (.site-story), без каталога
    tplNavSync(page);
    if (catalogHome) siteCatalogShow(catalogAdded);
    const hasCatalog = !page.blank && !page.about && !siteCatalog.hidden && (catalogHome ? !!page.home : !page.home);
    if (!hasCatalog) salesClose(); // каталога на открытой странице нет
    // Страница с каталогом «В окне» — каталог переезжает в секцию окна вместо пустой ячейки, на странице — обратно в свою секцию
    const catalogInWindow = isWindow && hasCatalog;
    if (catalogInWindow) siteBlankSection.insertBefore(siteCatalog, siteBlankCell);
    else if (siteCatalog.parentElement !== siteSection) siteSection.append(siteCatalog);
    siteBlank.hidden = !isBlank;
    siteTumbler.classList.toggle('is-off', isWindow);
    siteTumbler.querySelectorAll('.ch-seg').forEach((seg) => { seg.disabled = isWindow; });
    siteBlank.classList.toggle('is-window', isWindow);
    siteContent.classList.toggle('is-window', isWindow);
    siteContent.scrollTop = 0;
    siteBlankBody.classList.toggle('wg', isWindow);
    wsClose();
    secClose();
    btnSetClose();
    siteClearSelection();
    wsPage = page;
    secApply(page.section, siteBlankSection);
    wsPaintFill(siteBlankSection, page.sectionFill, '', BG_DEFAULT);
    if (isWindow) wsApply(page.win ?? WS_DEFAULTS);
    else {
      siteBlankBody.removeAttribute('style');
      wsPaintFill(siteBlankBody, null);
    }
    // каталог на «Меню» компонента — основной виджет страницы: нет «Удалить» ни у виджета, ни у секции
    $('#siteCatalogDelete').hidden = !!page.menu;
    $('[data-sec-cmd="delete"]', siteSection).hidden = !!page.menu;
    siteProductRender(!!(page.product || page.feedback || page.compWidget));
    if (catalogInWindow) {
      siteBlankCell.hidden = true;
      shopProductPin.hidden = true;
      siteBlankSection.classList.add('has-widget');
      $('[data-sec-cmd="delete"]', siteBlankSection).hidden = !!page.menu;
    }
    siteSelectWindow(false);
    extPinSync();
  }

  // Карточка товара: клик в магазине ставит её в зону контента секции новой страницы вместо пустой ячейки и выделяет, из магазина она пропадает.
  // На странице с контентом клик ничего не делает. «Удалить» в тулбаре возвращает пустую ячейку и виджет в магазин, удаление страницы с карточкой — тоже.
  function siteProductSyncShop() {
    shopProduct.hidden = false; // из магазина не убираем: на странице с карточкой клик просто ничего не делает
  }
  // Обратная связь добавлена — в магазине её больше нет, на всех страницах; удаление возвращает к сценарию добавления и в магазин
  function shopFeedbackSync() {
    shopFeedback.hidden = stage.dataset.scenario !== 'ext-add';
  }
  // Демоданные виджетов страниц компонентов: макетов пока нет, вид — в стиле сайта «Мили». Покупатель, адреса и заказы вымышленные
  const CW_IMG = 'assets/img/site/catalog/';
  const cwThumbs = (...imgs) => `<span class="pgw-thumbs">${imgs.map((img) => `<img src="${CW_IMG}${img}.png" alt="">`).join('')}</span>`;
  const cwItem = (img, name, qty, price) =>
    `<div class="pgw-item"><img src="${CW_IMG}${img}.png" alt=""><div class="pgw-item__name">${name}<span>${qty} шт.</span></div><div class="pgw-price">${price} ₽</div></div>`;
  // Данные демо «Отеля» и «Услуг» — как на картинках их каталогов в магазине: [название, вместимость/вид, площадь/длительность, цена]
  const ROOMS = [['Стандарт', '2 гостя', '18 м²', '4 900'], ['Комфорт', '2 гостя', '24 м²', '6 200'], ['Делюкс', '3 гостя', '32 м²', '8 400'], ['Люкс', '4 гостя', '56 м²', '14 900'], ['Полулюкс', '2 гостя', '38 м²', '9 800'], ['Апартаменты', '4 гостя', '64 м²', '16 500']];
  const SERVICES = [['Массаж', 'Классический', '60 мин', '3 500'], ['Стрижка и укладка', 'Любая длина', '45 мин', '2 200'], ['Маникюр', 'С покрытием', '90 мин', '2 000'], ['Стоун-терапия', 'Горячие камни', '75 мин', '4 200'], ['Уход за лицом', 'Маска и массаж', '60 мин', '3 800'], ['СПА-программа', 'Для двоих', '120 мин', '6 500']];
  // [имя, инициалы, специализация, рейтинг, стаж]
  const MASTERS = [['Елена Корнеева', 'ЕК', 'Массажист', '4,9', '8 лет'], ['Ольга Миронова', 'ОМ', 'Массажист, СПА', '4,8', '5 лет'], ['Дарья Лебедева', 'ДЛ', 'Парикмахер-стилист', '5,0', '11 лет'], ['Мария Гусева', 'МГ', 'Мастер маникюра', '4,9', '6 лет'], ['Ирина Белова', 'ИБ', 'Косметолог', '4,7', '9 лет'], ['Анна Титова', 'АТ', 'Парикмахер', '4,8', '4 года']];
  const pgwTile = (img, name, meta, price, btn) => `<div class="pgw-tile"><img src="assets/img/site/${img}.jpg" alt=""><b>${name}</b><span class="pgw-muted">${meta}</span><div class="pgw-tile__foot"><span class="pgw-price">${price}</span><span class="pgw-btn pgw-btn--s">${btn}</span></div></div>`;
  const pgwMaster = (m) => `<div class="pgw-person pgw-person--s"><span class="pgw-avatar">${m[1]}</span><div><b>${m[0]}</b><div class="pgw-muted">${m[2]} · ★ ${m[3]} · стаж ${m[4]}</div></div></div>`;
  // плитка товара «Доставки» — фото блюд, те же, что в корзине и заказах (assets/img/site/catalog, png)
  const cwTile = (img, name, meta, price) => `<div class="pgw-tile"><img src="${CW_IMG}${img}.png" alt=""><b>${name}</b><span class="pgw-muted">${meta}</span><div class="pgw-tile__foot"><span class="pgw-price">${price} ₽</span><span class="pgw-btn pgw-btn--s">В корзину</span></div></div>`;
  const COMP_DEMO = {
    // «Доставка»: каталог товаров, из него — в корзину
    'Каталог товаров':
      '<div class="pgw-chips"><span class="is-on">Все</span><span>Пицца</span><span>Закуски</span><span>Горячее</span></div>' +
      '<div class="pgw-grid">' + cwTile('pepperoni', 'Пепперони', '30 см · 520 г', '650') + cwTile('tuna', 'Севиче из тунца', '180 г', '1 350') +
        cwTile('langoustine', 'Севиче из лангустинов', '200 г', '1 650') + cwTile('pepperoni-bg', 'Пицца дня', '30 см · 480 г', '590') + '</div>',
    'Вход и регистрация':
      '<div class="pgw-auth">' +
        '<div class="pgw-tabs"><span class="is-on">Вход</span><span>Регистрация</span></div>' +
        '<label class="pgw-field"><span>Телефон</span><b>+7 (910) 555-12-34</b></label>' +
        '<label class="pgw-field"><span>Код из СМС</span><b class="pgw-field__empty">— — — —</b></label>' +
        '<span class="pgw-btn">Получить код</span>' +
        '<div class="pgw-note">Повторно отправить код можно через 0:59</div>' +
        '<div class="pgw-note">Нажимая кнопку, вы соглашаетесь с условиями обработки персональных данных</div>' +
      '</div>',
    'Профиль покупателя':
      '<div class="pgw-profile">' +
        '<div class="pgw-person"><span class="pgw-avatar">АС</span><div><div class="pgw-person__name">Анна Смирнова</div><div class="pgw-muted">+7 (910) 555-12-34 · anna.smirnova@example.ru</div></div></div>' +
        '<div class="pgw-stats">' +
          '<div class="pgw-stat"><b>1 240</b><span>бонусных баллов</span></div>' +
          '<div class="pgw-stat"><b>14</b><span>заказов</span></div>' +
          '<div class="pgw-stat"><b>Мили</b><span>на Московском — любимый ресторан</span></div>' +
        '</div>' +
        '<div class="pgw-h">Адреса доставки</div>' +
        '<div class="pgw-row"><b>Дом</b><span>Ярославль, ул. Свободы, 12, кв. 45</span><span class="pgw-tag">основной</span></div>' +
        '<div class="pgw-row"><b>Работа</b><span>Ярославль, пр-т Октября, 56, офис 310</span></div>' +
      '</div>',
    'Корзина':
      '<div class="pgw-card">' +
        cwItem('pepperoni', 'Пепперони', 2, '1 300') +
        cwItem('tuna', 'Севиче из тунца', 1, '1 350') +
        '<div class="pgw-sum"><span>Доставка</span><span>0 ₽</span></div>' +
        '<div class="pgw-sum pgw-sum--total"><span>Итого</span><span>2 650 ₽</span></div>' +
        '<span class="pgw-btn">Оформить заказ</span>' +
      '</div>',
    'История заказов':
      '<div class="pgw-orders">' +
        `<div class="pgw-order"><div><b>№ 10482</b><span class="pgw-muted">6 ноября, 19:40 · Доставка</span></div>${cwThumbs('pepperoni', 'tuna')}<span class="pgw-status pgw-status--ok">Доставлен</span><div class="pgw-price">2 000 ₽</div></div>` +
        `<div class="pgw-order"><div><b>№ 10431</b><span class="pgw-muted">31 октября, 13:15 · Самовывоз</span></div>${cwThumbs('langoustine', 'tuna', 'pepperoni')}<span class="pgw-status pgw-status--ok">Выдан</span><div class="pgw-price">2 540 ₽</div></div>` +
        `<div class="pgw-order"><div><b>№ 10397</b><span class="pgw-muted">24 октября, 20:05 · Доставка</span></div>${cwThumbs('pepperoni')}<span class="pgw-status pgw-status--off">Отменён</span><div class="pgw-price">650 ₽</div></div>` +
      '</div>',
    'Карточка заказа':
      '<div class="pgw-card">' +
        '<div class="pgw-muted">Заказ № 10482 от 6 ноября 2026, 19:40</div>' +
        '<div class="pgw-steps"><span class="is-done">Принят</span><span class="is-done">Готовится</span><span class="is-done">В пути</span><span class="is-on">Доставлен</span></div>' +
        cwItem('pepperoni', 'Пепперони', 1, '650') +
        cwItem('tuna', 'Севиче из тунца', 1, '1 350') +
        '<div class="pgw-sum"><span>Доставка</span><span>0 ₽</span></div>' +
        '<div class="pgw-sum"><span>Начислено баллов</span><span>+100</span></div>' +
        '<div class="pgw-sum pgw-sum--total"><span>Итого</span><span>2 000 ₽</span></div>' +
        '<div class="pgw-row"><b>Адрес</b><span>Ярославль, ул. Свободы, 12, кв. 45</span></div>' +
        '<div class="pgw-row"><b>Оплата</b><span>Картой онлайн · оплачен</span></div>' +
        '<span class="pgw-btn">Повторить заказ</span>' +
      '</div>',
    // «Отель»: фото номеров — из картинки каталога в магазине (catalog-rooms.svg), в том же порядке
    'Каталог номеров':
      '<div class="pgw-chips"><span class="is-on">Все номера</span><span>На двоих</span><span>Для семьи</span><span>С видом на Волгу</span></div>' +
      '<div class="pgw-grid">' + ROOMS.map((r, i) => pgwTile(`rooms/${i + 1}`, r[0], `${r[1]} · ${r[2]}`, r[3] + ' ₽/ночь', 'Забронировать')).join('') + '</div>',
    'Сведения о номере':
      '<div class="pgw-detail">' +
        '<img class="pgw-detail__img" src="assets/img/site/rooms/3.jpg" alt="">' +
        '<div class="pgw-card">' +
          '<div class="pgw-person__name">Делюкс</div>' +
          '<div class="pgw-muted">До 3 гостей · 32 м² · кровать king size · 4 этаж, вид на Волгу</div>' +
          '<div class="pgw-chips pgw-chips--static"><span>Завтрак включён</span><span>Wi-Fi</span><span>Кондиционер</span><span>Мини-бар</span><span>Сейф</span></div>' +
          '<div class="pgw-dates"><label class="pgw-field"><span>Заезд</span><b>20 ноября, с 14:00</b></label><label class="pgw-field"><span>Выезд</span><b>22 ноября, до 12:00</b></label><label class="pgw-field"><span>Гости</span><b>2 взрослых</b></label></div>' +
          '<div class="pgw-sum"><span>8 400 ₽ × 2 ночи</span><span>16 800 ₽</span></div>' +
          '<div class="pgw-sum pgw-sum--total"><span>Итого</span><span>16 800 ₽</span></div>' +
          '<span class="pgw-btn">Забронировать</span>' +
          '<div class="pgw-note">Бесплатная отмена до 18 ноября</div>' +
        '</div>' +
      '</div>',
    // «Услуги»: фото — из картинки каталога услуг в магазине (catalog-services.svg)
    'Каталог услуг':
      '<div class="pgw-chips"><span class="is-on">Все услуги</span><span>Массаж</span><span>Волосы</span><span>Ногти</span><span>Лицо</span></div>' +
      '<div class="pgw-grid">' + SERVICES.map((s, i) => pgwTile(`services/${i + 1}`, s[0], `${s[1]} · ${s[2]}`, s[3] + ' ₽', 'Записаться')).join('') + '</div>',
    'Карточка услуги':
      '<div class="pgw-detail">' +
        '<img class="pgw-detail__img" src="assets/img/site/services/1.jpg" alt="">' +
        '<div class="pgw-card">' +
          '<div class="pgw-person__name">Классический массаж</div>' +
          '<div class="pgw-muted">60 минут · спина, шея, плечи, руки и ноги</div>' +
          '<div>Снимает мышечное напряжение и усталость после рабочего дня. Мастер подбирает силу нажатия и масло под вас.</div>' +
          '<div class="pgw-chips pgw-chips--static"><span>60 мин — 3 500 ₽</span><span>90 мин — 4 900 ₽</span><span>Абонемент 5 сеансов — 15 000 ₽</span></div>' +
          '<div class="pgw-h">Делают</div>' +
          MASTERS.slice(0, 2).map(pgwMaster).join('') +
          '<span class="pgw-btn">Записаться</span>' +
        '</div>' +
      '</div>',
    'Мастера':
      '<div class="pgw-chips"><span class="is-on">Все</span><span>Массаж</span><span>Парикмахеры</span><span>Маникюр</span><span>Косметологи</span></div>' +
      '<div class="pgw-masters">' + MASTERS.map((m) => `<div class="pgw-stat pgw-master-card"><span class="pgw-avatar">${m[1]}</span><b>${m[0]}</b><span>${m[2]}</span><span>★ ${m[3]} · стаж ${m[4]}</span></div>`).join('') + '</div>',
    'Карточка специалиста':
      '<div class="pgw-profile">' +
        '<div class="pgw-person"><span class="pgw-avatar">ЕК</span><div><div class="pgw-person__name">Елена Корнеева</div><div class="pgw-muted">Массажист · стаж 8 лет · ★ 4,9 (126 отзывов)</div></div></div>' +
        '<div>Медицинское образование, сертификаты по классическому, спортивному и стоун-массажу. Работает в студии на Свободы, 46.</div>' +
        '<div class="pgw-h">Услуги</div>' +
        SERVICES.filter((s) => /Массаж|Стоун|СПА/.test(s[0])).map((s) => `<div class="pgw-row"><b>${s[0]}</b><span>${s[2]}</span><span class="pgw-price pgw-row__end">${s[3]} ₽</span></div>`).join('') +
        '<div class="pgw-h">Отзывы</div>' +
        '<div class="pgw-row pgw-row--top"><b>Анна С.</b><span>Лучший массаж в городе: через час как новая. Запишусь ещё.</span><span class="pgw-muted pgw-row__end">2 ноября</span></div>' +
        '<div class="pgw-row pgw-row--top"><b>Игорь П.</b><span>Хорошо проработала спину, всё объяснила, дала советы по упражнениям.</span><span class="pgw-muted pgw-row__end">27 октября</span></div>' +
        '<span class="pgw-btn">Записаться к Елене</span>' +
      '</div>',
    'Выбор специалиста и времени':
      '<div class="pgw-card">' +
        '<div class="pgw-muted">Классический массаж · 60 мин · 3 500 ₽</div>' +
        '<div class="pgw-h">Специалист</div>' +
        '<div class="pgw-chips"><span>Любой</span><span class="is-on">Елена Корнеева</span><span>Ольга Миронова</span></div>' +
        '<div class="pgw-h">Дата</div>' +
        '<div class="pgw-days">' + [['Пн', 17], ['Вт', 18], ['Ср', 19], ['Чт', 20], ['Пт', 21], ['Сб', 22], ['Вс', 23]].map(([d, n], i) => `<span class="${i === 2 ? 'is-on' : ''}${i === 6 ? ' is-off' : ''}"><small>${d}</small>${n}</span>`).join('') + '</div>' +
        '<div class="pgw-h">Время</div>' +
        '<div class="pgw-chips pgw-slots">' + ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00'].map((t, i) => `<span class="${i === 3 ? 'is-on' : ''}${i === 1 || i === 5 ? ' is-off' : ''}">${t}</span>`).join('') + '</div>' +
        '<div class="pgw-sum pgw-sum--total"><span>Среда, 19 ноября, 14:30</span><span>3 500 ₽</span></div>' +
        '<span class="pgw-btn">Записаться</span>' +
      '</div>',
  };
  function siteProductRender(on) {
    siteProduct.hidden = !on;
    siteProduct.classList.toggle('site-product--feedback', !!wsPage.feedback);
    siteProduct.classList.toggle('site-product--comp', !!wsPage.compWidget); // виджет страницы компонента (вход, профиль, заказы)
    if (wsPage.compWidget) {
      $('.site-compw__name', siteProduct).textContent = wsPage.compWidget;
      $('.site-compw__body', siteProduct).innerHTML = COMP_DEMO[wsPage.compWidget] ?? '';
    }
    $('.tb', siteProduct).setAttribute('aria-label', wsPage.compWidget || (wsPage.feedback ? 'Обратная связь' : 'Карточка товара'));
    siteBlankBody.classList.toggle('has-feedback', !!wsPage.feedback); // у формы свой крестик, крестик окна не нужен
    shopProductPin.hidden = on || siteBlank.hidden;
    siteBlankCell.hidden = on;
    siteBlankSection.classList.toggle('has-widget', on);
    // Страница пришла с компонентом — её основной виджет (карточка товара/блюда) удалить нельзя: нет «Удалить» ни у виджета, ни у его секции
    const locked = on && !!(wsPage.comp || wsPage.key); // key — ключевой виджет собранного сайта («В конструкторе»)
    $('#siteProductDelete').hidden = locked;
    $('[data-sec-cmd="delete"]', siteBlankSection).hidden = locked;
    siteProduct.classList.remove('is-active');
    siteBlankSection.classList.remove('is-active');
  }
  function siteAddProduct() {
    if (siteBlank.hidden || wsPage.product || wsPage.feedback || wsPage.compWidget || siteCatalog.parentElement === siteBlankSection) return;
    wsPage.product = true;
    siteProductSyncShop();
    siteProductRender(true);
    if (!secRoot.hidden) siteBlankSection.classList.add('is-active'); // пока открыты настройки секции, выделена секция
    else if (wsRoot.hidden) siteProduct.classList.add('is-active'); // пока открыты настройки окна, выделено окно
    else wsRender();
    if (wsRoot.hidden) siteSelectWindow(false);
  }
  function siteRemoveProduct() {
    if (wsPage.comp) return; // основной виджет страницы компонента не удаляется
    wsPage.product = false;
    siteProductSyncShop();
    siteProductRender(false);
    siteBlankSection.classList.add('is-active');
  }
  $('#siteProductDelete').addEventListener('click', siteRemoveProduct);
  // «Назад» поднимает на уровень секции
  $('#siteProductBack').addEventListener('click', () => {
    siteProduct.classList.remove('is-active');
    siteBlankSection.classList.add('is-active');
  });

  siteView.addEventListener('click', (e) => {
    const seg = e.target.closest('[data-view]');
    if (!seg) return;
    const page = lsPage(lsActive);
    page.view = seg.dataset.view;
    siteShowPage(page);
  });

  // Рамка окна: пунктир родителя, пока выделена секция или виджет в ней; выделенное окно — обычный активный .wg со своим тулбаром.
  function siteSelectWindow(on) {
    const inner = siteBlankSection.classList.contains('is-active') || siteProduct.classList.contains('is-active');
    siteBlankBody.classList.toggle('wg--level-2', siteBlank.classList.contains('is-window') && !on && inner);
    siteBlankBody.classList.toggle('is-active', on);
    if (on) siteBlankSection.classList.remove('is-active');
  }
  $('.site-blank__back').addEventListener('click', () => siteSelectWindow(true));

  stage.addEventListener('mousedown', (e) => {
    if (!fbScrim.hidden) return; // пока открыта панель обратной связи, выделение остаётся
    if (!e.target.closest('#siteFloat')) siteFloatFold(false);
    if (btnSet.hidden) siteFloat.classList.toggle('is-active', !!e.target.closest('#siteFloat')); // пока открыты настройки кнопки, выделение остаётся
    if (wsRoot.hidden && secRoot.hidden && !e.target.closest('#bgWin')) { // пока открыты настройки или окно «Фон», выделение остаётся
      const inSection = !!e.target.closest('#siteBlankSection');
      const inProduct = !!e.target.closest('#siteProduct');
      siteBlankSection.classList.toggle('is-active', inSection && !inProduct && !e.target.closest('#siteCatalog')); // каталог в окне выделяется сам
      siteProduct.classList.toggle('is-active', inProduct);
      const inExt = !!e.target.closest('#siteExt');
      const inExtWidget = !!e.target.closest('#siteExtWidget');
      siteExt.classList.toggle('is-active', inExt && !inExtWidget);
      siteExtWidget.classList.toggle('is-active', inExtWidget);
      // Секция каталога и секция с кнопкой выделяются кликом мимо своего виджета, как остальные секции
      siteSection.classList.toggle('is-active', !!e.target.closest('#siteSection') && !e.target.closest('#siteCatalog'));
      const inLink = !!e.target.closest('#siteLink');
      const inLinkWidget = !!e.target.closest('#siteLinkWidget');
      siteLink.classList.toggle('is-active', inLink && !inLinkWidget);
      if (btnSet.hidden && inLink) siteLinkSelect(inLinkWidget); // пока открыты настройки кнопки, выделение остаётся
      const windowHit = !inSection && siteBlank.classList.contains('is-window') && !!e.target.closest('#siteBlankBody');
      siteSelectWindow(windowHit);
      const sectionHit = secNode.classList.contains('is-active');
      if (!(bgKey === 'section' ? sectionHit : windowHit)) bgClose(); // тулбар с командой скрылся
    }
    if (siteCatalog.hidden || ['window-link', 'ext-added', 'ext-link'].includes(stage.dataset.scenario)) return; // в этих сценариях выделена кнопка, клик мимо выделение не снимает
    if (!e.target.closest('#salesPopup, #salesPicker, #catSet, #rsParams, #pub, .rp-btn')) siteCatalog.classList.toggle('is-active', !!e.target.closest('#siteCatalog'));
  });

  // Секция с кнопкой: пока кнопка выделена, у секции пунктирная рамка родителя
  function siteLinkSelect(on) {
    siteLinkWidget.classList.toggle('is-active', on);
  }
  // «Назад» поднимает на уровень секции — у каталога и у кнопки, как у карточки товара и формы
  $('#siteCatalogBack').addEventListener('click', () => {
    siteCatalog.classList.remove('is-active');
    siteCatalog.parentElement.classList.add('is-active'); // своя секция или секция окна
  });
  $('[data-btn-cmd="back"]', siteLinkWidget).addEventListener('click', () => {
    btnSetClose();
    siteLinkSelect(false);
    siteLink.classList.add('is-active');
  });
  // Родитель выделенного виджета — .wg--level-2 из кита: только пунктир, кнопки «+ секция» есть лишь у активной секции. Общее правило для всех секций, как бы ни поставилось выделение
  const SITE_PARENTS = [siteSection, siteLink, siteBlankSection, siteExt];
  function siteParentsSync() {
    for (const parent of SITE_PARENTS) {
      const on = !!parent.querySelector('.wg.is-active');
      if (parent.classList.contains('wg--level-2') !== on) parent.classList.toggle('wg--level-2', on);
    }
  }
  new MutationObserver(siteParentsSync).observe(siteContent, { subtree: true, attributes: true, attributeFilter: ['class'] });
  // Плавающая кнопка: первая плашка окна внешних виджетов ставит её на открытую страницу и выделяет, вместе с ней в списке появляется страница-окно «Обратная связь». «Удалить» убирает обе.
  // Глобальный виджет, как шапка и подвал: кнопка видна на всех страницах (в виде «в окне» её нет), удаляется только сама.
  // Тулбар и настройки — те же, что у секции с кнопкой, но без «Назад»: у плавающей кнопки нет родителя.
  const siteFloat = $('#siteFloat');
  $('[data-btn-cmd="back"]', siteFloat).remove();
  // «Показывать: Окно» — в редакторе окно свёрнуто в плашку, чтобы не мешать править страницу. Разворачивает только «Открыть» в тулбаре; сворачивают «Закрыть», крестик формы и клик мимо
  function siteFloatFold(open) {
    siteFloat.classList.toggle('is-open', open);
    const fold = $('#siteFloatFold');
    fold.setAttribute('aria-expanded', open);
    $('.tb__icon', fold).textContent = open ? '\ue9e7' : '\ue9e6';
    $('.tb__caption', fold).textContent = open ? 'Закрыть' : 'Открыть';
  }
  $('#siteFloatFold').addEventListener('click', () => siteFloatFold(!siteFloat.classList.contains('is-open')));
  $('.site-feedback__close', siteFloat).addEventListener('click', () => siteFloatFold(false));
  // Родителя у плавающего виджета нет: «Назад» снимает выделение
  $('#siteFloatBack').addEventListener('click', () => {
    siteFloat.classList.remove('is-active');
    siteFloatFold(false);
  });
  function siteFloatAdd() {
    if (!lsPage(lsFloatPageId)) lsAddFloatPage();
    siteFloat.hidden = false;
    siteFloat.classList.add('is-active');
    extPickerClose();
  }
  function siteFloatRemove() {
    siteFloat.hidden = true;
    siteFloat.classList.remove('is-active');
    lsRemoveFloatPage();
    extPinSync();
  }
  // Удаление добавленного виджета возвращает к сценарию добавления
  for (const remove of [$('[data-btn-cmd="delete"]', siteFloat), $('#siteFloatDelete')]) remove.addEventListener('click', () => {
    siteFloatRemove();
    scenSet('ext-add');
    fbScenarioReset();
  });
  $('[data-btn-cmd="delete"]', siteLinkWidget).addEventListener('click', () => {
    if (stage.dataset.scenario.startsWith('ext-')) frame.select('ext-add');
  });
  function siteRemoveExt() {
    siteExt.classList.remove('is-active');
    frame.select('ext-add');
  }
  $('#siteExtDelete').addEventListener('click', siteRemoveExt);
  // «Удалить» в тулбаре секции удаляет и виджет внутри неё; секция с формой существует только вместе с формой
  $('[data-sec-cmd="delete"]', siteSection).addEventListener('click', () => { if (!siteCatalog.hidden) siteDeleteCatalog(); });
  $('[data-sec-cmd="delete"]', siteBlankSection).addEventListener('click', () => { if (wsPage.product) siteRemoveProduct(); });
  $('[data-sec-cmd="delete"]', siteExt).addEventListener('click', siteRemoveExt);
  // «Назад» поднимает на уровень секции
  $('#siteExtBack').addEventListener('click', () => {
    siteExtWidget.classList.remove('is-active');
    siteExt.classList.add('is-active');
  });
  // Сценарии внешних виджетов открываются на конце каталога
  function siteScrollEnd() {
    const end = stageRect(siteSection);
    const box = stageRect(siteContent);
    siteContent.scrollTop += end.top + end.height - box.top - box.height;
  }
  // в макете секция на этой высоте области сайта
  function siteLinkScroll() {
    siteContent.scrollTop += stageRect(siteLink).top - stageRect(siteContent).top - 565;
  }

  // Редактор положения — один на все окна: настройки окна и настройки кнопки. Разметка в <template id="posEditor">, внешний вид в стилях .pos*,
  // поведение в posEditorFill и posEditorRender. Любая правка редактора меняет его во всех окнах, отдельных копий заводить нельзя.
  // Сетка положения «На экране»: значки из макета, по строкам. edge — столбики прижаты к краю, middle — по центру; у средней ячейки значок свой
  const POS_ICONS = {
    edge: '<rect y="5" width="3" height="9" rx="1.5"/><rect x="5" width="3" height="14" rx="1.5"/><rect x="10" y="7" width="3" height="7" rx="1.5"/>',
    middle: '<rect y="2" width="3" height="10" rx="1.5"/><rect x="5" width="3" height="14" rx="1.5"/><rect x="10" y="2" width="3" height="10" rx="1.5"/>',
  };
  const POS_CELLS = [
    ['edge', 'scaleY(-1)'], ['edge', 'scaleY(-1)'], ['edge', 'rotate(180deg)'],
    ['middle', 'scaleY(-1)'], null, ['middle', 'rotate(180deg)'],
    ['edge', 'scale(1)'], ['edge', 'scale(1)'], ['edge', 'scaleX(-1)'],
  ];
  const POS_GRID = POS_CELLS.map((pos, i) => {
    const col = i % 3 - 1;
    const row = Math.floor(i / 3) - 1;
    const vars = `--x:${col * 57.5}px;--y:${row * 17.5}px;--dot-x:${col * 57}px;--dot-y:${row * 19.5}px;--t:${pos?.[1] ?? 'scale(1)'}`;
    const ico = pos
      ? `<svg class="pos__ico" width="13" height="14" viewBox="0 0 13 14" aria-hidden="true">${POS_ICONS[pos[0]]}</svg>`
      : '<img class="pos__ico" src="assets/img/pos/22.svg" width="13" height="14" alt="">';
    return `<div class="pos__cell" style="${vars}"><img class="pos__dot" src="assets/img/pos/dot.svg" width="3" height="3" alt="">${ico}</div>`;
  }).join('');
  function posEditorFill(root) {
    $('[data-pos-editor]', root).replaceWith($('#posEditor').content.cloneNode(true));
    $('.pos__grid', root).innerHTML = POS_GRID;
  }
  const POS_CENTER = 4;
  // Номер ячейки под кликом или -1. Значение хранит окно и передаёт в posEditorRender
  function posCellAt(target) {
    const cell = target.closest('.pos__cell');
    return cell ? [...cell.parentElement.children].indexOf(cell) : -1;
  }
  function posEditorRender(root, mode, shown = true, selected = POS_CENTER) {
    root.querySelectorAll('.pos__cell').forEach((cell, i) => cell.classList.toggle('is-selected', i === selected));
    root.querySelectorAll('[data-pos-mode]').forEach((seg) => {
      const on = seg.dataset.posMode === mode;
      seg.classList.toggle('is-on', on);
      seg.setAttribute('aria-checked', on);
    });
    // Положение пока не настраиваем: строки скрыты во всех окнах
    root.querySelectorAll('[data-pos-row]').forEach((row) => { row.hidden = true; });
  }

  // Настройки кнопки: в сценарии открыты сразу, закрываются и снова открываются шестерёнкой тулбара. Стоят слева от кнопки, чтобы она и тулбар оставались видны.
  // Правки сразу видны, галочка сохраняет, крестик и Esc возвращают прежние, сброс — исходные. «Действие» в тулбаре — только с ховером.
  const BTN_DEFAULTS = () => ({ text: stage.dataset.scenario.startsWith('ext-') ? 'Обратная связь' : 'Товар', pageId: null, mode: 'window', pos: 'screen', cell: POS_CENTER });
  const btnSet = $('#btnSet');
  posEditorFill(btnSet);
  // От виджета свойство называется «Открыть»: варианты те же, что у «Способа отображения» в настройках страницы
  const btnSetOpenMode = openModeFill(btnSet, ['page', 'window'], {
    title: 'Открыть',
    onChange: (mode) => { btnSetDraft.mode = mode; btnSetRender(); },
  });
  const btnSetText = $('#btnSetText');
  const btnSetEmpty = $('#btnSetEmpty');
  const btnSetPicked = $('#btnSetPicked');
  const btnSetMenu = $('#btnSetMenu');
  const btnSetSub = $('#btnSetSub');
  const btnSetSubList = $('#btnSetSubList');
  const siteLinkCaption = $('.site-link__button .btn__caption');
  const btnSetGear = () => $('[data-btn-cmd="settings"]', siteLinkWidget);
  let btnSetSaved = BTN_DEFAULTS();
  let btnSetDraft = BTN_DEFAULTS();
  let btnSetHost = null; // кто открыл окно поверх себя и хранит его данные: сейчас только панель обратной связи

  function btnSetPaintCaption(data) {
    const text = data.text.trim() || BTN_DEFAULTS().text;
    if (btnSetHost) btnSetHost.paint(text);
    else siteLinkCaption.textContent = text;
  }
  // Перетащенное окно остаётся на месте, пока его не закроют; выросло — не уходит за край сцены
  let btnSetMoved = false;
  peDraggable(btnSet, () => { btnSetMoved = true; });
  function btnSetPlace() {
    if (btnSetMoved) {
      peMoveTo(btnSet, btnSet.offsetLeft, btnSet.offsetTop);
      return;
    }
    const r = stageRect(btnSetHost?.anchor ?? siteLinkWidget);
    btnSet.style.left = Math.round(r.left - btnSet.offsetWidth - 12) + 'px';
    btnSet.style.top = Math.round(Math.min(r.top, stage.offsetHeight - btnSet.offsetHeight - 8)) + 'px';
  }
  // Выбранная страница (Figma 2355:71525): «Открыть | страница», под ней режим, а у окна ещё редактор положения
  function btnSetRender() {
    const page = lsPage(btnSetDraft.pageId);
    btnSetText.value = btnSetDraft.text;
    btnSetPaintCaption(btnSetDraft);
    const glyph = !!btnSetHost?.hasIcon();
    $('#btnSetGlyph').hidden = !glyph;
    $('#btnSetIconPick').hidden = glyph;
    btnSetEmpty.hidden = !!page;
    btnSetPicked.hidden = !page;
    $('#btnSetPage').textContent = page?.name ?? '';
    btnSetOpenMode.row.hidden = !page;
    posEditorRender(btnSet, btnSetDraft.pos, !!page && btnSetDraft.mode === 'window', btnSetDraft.cell);
    btnSetOpenMode.set(btnSetDraft.mode);
    // Верх окна стоит на месте: при смене значения оно растёт и уменьшается снизу, а за край сцены не выходит
    if (!btnSet.hidden) peMoveTo(btnSet, btnSet.offsetLeft, btnSet.offsetTop);
  }

  // Меню действий (Figma 2349:60397) по шагам: сначала список действий, наведение на «Открыть страницу сайта» раскрывает слева список страниц, выбор закрывает меню.
  function btnSetSubClose() {
    btnSetSub.hidden = true;
    $('#btnSetOpenPage').classList.remove('is-open');
  }
  function btnSetMenuClose() {
    btnSetMenu.hidden = true;
    btnSetSubClose();
  }
  function btnSetMenuOpen(anchor) {
    const r = stageRect(anchor);
    const box = stageRect(btnSet);
    btnSetMenu.style.left = Math.round(r.left - box.left) + 'px';
    btnSetMenu.style.top = Math.round(r.top - box.top - 8) + 'px';
    btnSetMenu.hidden = false;
  }
  function btnSetSubOpen() {
    btnSetSubList.replaceChildren(...lsPages.filter((p) => !p.off).map((p) => {
      const selected = p.id === btnSetDraft.pageId;
      const item = el('button', 'mw-menu__item ls-mode__item' + (selected ? ' is-selected' : ''), '<span class="ls-mode__toggle"></span><span class="mw-menu__text"></span>');
      item.type = 'button';
      item.setAttribute('role', 'menuitemradio');
      item.setAttribute('aria-checked', selected);
      item.dataset.page = p.id;
      item.querySelector('.mw-menu__text').textContent = p.name;
      if (p.product && btnSetDraft.pageId == null) item.insertAdjacentHTML('beforeend', '<span class="pin" aria-hidden="true"><img src="assets/img/pin-cursor.svg" width="15" height="15" alt=""></span>');
      return item;
    }));
    btnSetSub.hidden = false;
    $('#btnSetOpenPage').classList.add('is-open');
  }

  function btnSetClose() {
    if (btnSet.hidden) return;
    btnSetMenuClose();
    btnSetOpenMode.close();
    btnSet.hidden = true;
    btnSetGear().classList.remove('is-selected');
    btnSetGear().setAttribute('aria-pressed', 'false');
    if (btnSetHost) btnSetHost.restore();
    else btnSetPaintCaption(btnSetSaved);
    btnSetHost = null;
  }
  function btnSetOpen(host = null) {
    if (!host) popupsClose();
    btnSetHost = host;
    btnSetMoved = false;
    btnSetDraft = host ? host.data() : { ...btnSetSaved };
    btnSet.hidden = false;
    btnSetRender();
    btnSetPlace();
    if (host) return;
    btnSetGear().classList.add('is-selected');
    btnSetGear().setAttribute('aria-pressed', 'true');
  }
  function btnSetReset() {
    btnSetClose();
    btnSetSaved = BTN_DEFAULTS();
    btnSetPaintCaption(btnSetSaved);
  }

  PropertyEditor.mount(btnSet, {
    onDone: () => {
      if (btnSetHost) btnSetHost.save(btnSetDraft);
      else btnSetSaved = { ...btnSetDraft, text: btnSetDraft.text.trim() || BTN_DEFAULTS().text };
      btnSetClose();
    },
    onClose: btnSetClose,
  });
  btnSetText.addEventListener('input', () => {
    btnSetDraft.text = btnSetText.value;
    btnSetPaintCaption(btnSetDraft);
  });
  btnSet.addEventListener('click', (e) => {
    if (e.target.closest('.pe__reset')) {
      btnSetDraft = btnSetHost ? btnSetHost.defaults() : BTN_DEFAULTS();
      btnSetMenuClose();
      btnSetRender();
      return;
    }
    const opener = e.target.closest('.btnset__action, .btnset__list');
    if (opener) {
      if (btnSetMenu.hidden) btnSetMenuOpen(opener.closest('.btnset__lookup'));
      else btnSetMenuClose();
      return;
    }
    if (e.target.closest('.btnset__clear')) {
      btnSetDraft.pageId = null;
      btnSetRender();
      return;
    }
    const pos = e.target.closest('[data-pos-mode]');
    if (pos) {
      btnSetDraft.pos = pos.dataset.posMode;
      btnSetRender();
    }
    const cell = posCellAt(e.target);
    if (cell >= 0) {
      btnSetDraft.cell = cell;
      btnSetRender();
    }
  });
  // Другой пункт первого уровня сворачивает список страниц, уход на сам список его оставляет
  btnSetMenu.addEventListener('mouseover', (e) => {
    const item = e.target.closest('.btnset-menu__item');
    if (!item) return;
    if (item.id !== 'btnSetOpenPage') btnSetSubClose();
    else if (btnSetSub.hidden) btnSetSubOpen();
  });
  btnSetMenu.addEventListener('click', (e) => {
    if (e.target.closest('#btnSetMenuClose')) { btnSetMenuClose(); return; }
    const item = e.target.closest('[data-page]');
    if (!item) return;
    const page = lsPage(Number(item.dataset.page));
    btnSetDraft.pageId = page.id;
    btnSetDraft.mode = !page.mode || page.mode === 'page' ? 'page' : 'window';
    btnSetMenuClose();
    btnSetRender();
  });
  document.addEventListener('mousedown', (e) => { if (!e.target.closest('#btnSetMenu, .btnset__action, .btnset__list')) btnSetMenuClose(); });
  // В сценарии «Виджет добавлен» кнопка — это обратная связь: шестерёнка открывает её панель
  btnSetGear().addEventListener('click', () => {
    if (stage.dataset.scenario === 'ext-added') fbOpen();
    else if (btnSet.hidden) btnSetOpen();
    else btnSetClose();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (btnSetHost) e.stopImmediatePropagation(); // Esc закрывает только окно кнопки, панель под ним остаётся
    if (!btnSetMenu.hidden) btnSetMenuClose();
    else if (btnSetOpenMode.isOpen) { btnSetOpenMode.close(); btnSetOpenMode.button.focus(); }
    else btnSetClose();
  });

  // Панель настроек обратной связи (Figma 2648:45307): открывается шестерёнкой виджета, где бы он ни стоял. Правки видны только в панели,
  // галочка применяет их к сайту и ставит виджет на выбранное место, крестик и Esc отменяют. «Основной стиль», «+» у полей и «всегда» пока только с ховером.
  // Клик по кнопке в панели открывает поверх неё общее окно настроек кнопки: его данные живут в черновике панели и сохраняются вместе с ней.
  const FB_DEFAULTS = () => ({
    title: 'Обратная связь', kind: 'button', floatText: '', cell: 8, // положение кнопки: ячейка общего редактора, 8 — справа снизу
    colors: { accent: '#f6733c', bg: '#f3f3f3', head: '#000000', text: '#000000' },
    fields: { name: true, phone: true, email: true, company: true, desc: false },
  });
  const FB_VARS = { accent: '--fb-accent', bg: '--fb-bg', head: '--fb-head', text: '--fb-text' };
  const fbScrim = $('#fbScrim');
  const fbPanel = $('#fbPanel');
  const fbForm = $('#fbForm');
  const fbTitle = $('#fbTitle');
  let fbSaved = FB_DEFAULTS();
  let fbDraft = null;
  let fbEditor = null;

  const fbClone = (data) => ({ ...data, colors: { ...data.colors }, fields: { ...data.fields } });
  // Цвета — переменными на сцене и на панели: исходный цвет переменную убирает, форма остаётся такой, как в общих стилях
  function fbPaintVars(node, colors) {
    const base = FB_DEFAULTS().colors;
    for (const key in FB_VARS) {
      if (colors[key] === base[key]) node.style.removeProperty(FB_VARS[key]);
      else node.style.setProperty(FB_VARS[key], colors[key]);
    }
  }
  function fbPaintForm(form, data) {
    $('.site-feedback__title .input__control', form).value = data.title;
    form.querySelectorAll('[data-fb-field]').forEach((field) => { field.hidden = !data.fields[field.dataset.fbField]; });
  }
  function fbPaintSite() {
    fbPaintVars(stage, fbSaved.colors);
    for (const form of document.querySelectorAll('.site-feedback')) if (form !== fbForm) fbPaintForm(form, fbSaved);
    siteFloat.dataset.col = fbSaved.cell % 3;
    siteFloat.dataset.row = Math.floor(fbSaved.cell / 3);
    siteFloat.classList.toggle('site-float--window', fbSaved.kind === 'window');
    $('.site-float__title', siteFloat).textContent = fbSaved.title;
    if (fbSaved.kind !== 'window') siteFloatFold(false);
  }
  function fbRender() {
    fbPaintVars(fbPanel, fbDraft.colors);
    fbPaintForm(fbForm, fbDraft);
    if (fbTitle.value !== fbDraft.title) fbTitle.value = fbDraft.title;
    fbPanel.querySelectorAll('[data-fb-chip]').forEach((chip) => {
      chip.classList.toggle('is-on', fbDraft.fields[chip.dataset.fbChip]);
      chip.setAttribute('aria-pressed', fbDraft.fields[chip.dataset.fbChip]);
    });
    fbPanel.querySelectorAll('[data-fb-cell]').forEach((cell) => {
      const on = Number(cell.dataset.fbCell) === fbDraft.cell;
      cell.classList.toggle('is-on', on);
      cell.setAttribute('aria-checked', on);
    });
    fbPanel.querySelectorAll('[data-fb-kind-for]').forEach((node) => { node.hidden = node.dataset.fbKindFor !== fbDraft.kind; });
    fbPanel.querySelectorAll('[data-fb-kind]').forEach((seg) => {
      const on = seg.dataset.fbKind === fbDraft.kind;
      seg.classList.toggle('is-on', on);
      seg.setAttribute('aria-checked', on);
    });
    fbPanel.querySelectorAll('[data-fb-for]').forEach((node) => { node.hidden = !node.dataset.fbFor.split(' ').includes(fbDraft.show); });
  }
  function fbClose() {
    if (btnSetHost) btnSetClose();
    fbEditor?.destroy();
    fbEditor = null;
    fbDraft = null;
    fbScrim.hidden = true;
  }
  function fbOpen() {
    popupsClose();
    const { scenario, variant } = stage.dataset;
    fbDraft = { ...fbClone(fbSaved), show: scenario === 'ext-added' ? variant || 'float' : 'float' };
    fbPanel.querySelectorAll('[data-pe-row]').forEach((row) => { $('[data-pe-color]', row).dataset.peColor = fbDraft.colors[row.dataset.peRow]; });
    fbScrim.hidden = false;
    fbEditor = PropertyEditor.mount(fbPanel, {
      onChange: ({ colors }) => { fbDraft.colors = colors; fbRender(); },
      onDone: fbSave,
      onClose: fbClose,
    });
    fbRender();
  }
  function fbSave() {
    const { show, ...data } = fbDraft;
    fbSaved = { ...data, title: data.title.trim() || FB_DEFAULTS().title };
    fbClose();
    fbPaintSite();
  }
  function fbScenarioReset() {
    fbClose();
    fbSaved = FB_DEFAULTS();
    fbPaintSite();
  }
  fbTitle.addEventListener('input', () => { fbDraft.title = fbTitle.value; fbRender(); });
  $('.site-feedback__title .input__control', fbForm).addEventListener('input', (e) => { fbDraft.title = e.target.value; fbRender(); });
  fbPanel.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-fb-chip]');
    const cell = e.target.closest('[data-fb-cell]');
    const kind = e.target.closest('[data-fb-kind]');
    if (chip) fbDraft.fields[chip.dataset.fbChip] = !fbDraft.fields[chip.dataset.fbChip];
    else if (cell) fbDraft.cell = Number(cell.dataset.fbCell);
    else if (kind) fbDraft.kind = kind.dataset.fbKind;
    else return;
    fbRender();
  });
  // Кнопка открывает страницу «Обратная связь». У плавающей кнопки только иконка: её текст свой и по умолчанию пуст
  const fbBtnDefaults = () => ({ ...BTN_DEFAULTS(), pageId: lsFloatPageId, text: '' });
  const fbBtnHost = {
    hasIcon: () => true,
    data: () => ({ ...fbBtnDefaults(), ...fbDraft.action, text: fbDraft.floatText }),
    defaults: fbBtnDefaults,
    paint: () => {},
    save: ({ text, ...action }) => {
      fbDraft.floatText = text.trim();
      fbDraft.action = action;
    },
    restore: () => fbRender(),
  };
  $('.fbp__button', fbPanel).addEventListener('click', (e) => {
    const button = e.target.closest('.btn');
    if (!button) return;
    if (btnSetHost) btnSetClose();
    else btnSetOpen({ ...fbBtnHost, anchor: button });
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fbClose(); });
  // Палитра кита открывается от образца и не знает о границах панели: если не умещается, смещается влево
  new MutationObserver((records) => {
    for (const { addedNodes } of records) for (const node of addedNodes) {
      if (!node.classList?.contains('pe__pop')) continue;
      node.style.left = Math.min(node.offsetLeft, $('.fbp__body', fbPanel).offsetWidth - node.offsetWidth - 8) + 'px';
    }
  }).observe(fbPanel, { childList: true });
  $('[data-btn-cmd="settings"]', siteFloat).addEventListener('click', fbOpen);
  $('#siteFloatSettings').addEventListener('click', fbOpen);
  $('#siteExtSettings').addEventListener('click', fbOpen);
  $('#siteProductSettings').addEventListener('click', () => { if (wsPage.feedback) fbOpen(); });

  // Настройки окна: открываются по левому верхнему углу окна, шестерёнка в это время активна. Правки сразу видны на холсте, галочка сохраняет их в страницу,
  // крестик и Esc возвращают прежнее, сброс — исходные значения. Клик мимо не закрывает. Размер и оформление — PropertyEditor из ui-kit, отступы — свои поля.
  const WS_DEFAULTS = {
    posMode: 'screen', // позиционирование: 'element' или 'screen'. Пока выбор режима меняет только сам редактор, на холсте окно остаётся по центру
    pad: { split: false, top: 12, right: 12, bottom: 12, left: 12 },
    // Фон и затемнение — из окна «Фон»: {kind: 'color', hex, a} · {kind: 'grad', c} · {kind: 'img', i, fx}. На холсте конструктора затемнения нет, под окном его фон
    fills: { dim: { kind: 'color', hex: '#000000', a: 5 }, background: { kind: 'color', hex: '#ffffff', a: 100 } },
    pe: {
      dims: { w: { mode: 'px', px: 800, pct: 100 }, h: { mode: 'auto', px: 100, pct: 100 } },
      edges: {},
      rows: { dim: true, radius: true, background: true, shadow: true, border: false },
      colors: { dim: '#000000', background: '#ffffff', border: '#000000' },
      shadow: { color: '#a39c97', opacity: 10, x: 0, y: 0, blur: 46, spread: 0 },
      line: 'solid',
      split: {
        radius: { on: false, values: { tl: 10, tr: 10, bl: 10, br: 10 } },
        border: { on: false, values: { top: 1, right: 1, bottom: 1, left: 1 } },
      },
    },
  };
  const wsRoot = $('#ws');
  peDraggable(wsRoot);
  const wsOpenBtn = $('#wsOpen');
  posEditorFill(wsRoot);
  const wsTemplate = wsRoot.innerHTML; // PropertyEditor читает значения из разметки при монтировании
  let wsPage = null; // открытая страница, её окно на холсте
  let wsDraft = null; // значения, пока открыты настройки
  let wsEditor = null;

  function wsApply(win) {
    const { dims, edges, rows, colors, shadow: sh, line, split } = win.pe;
    const s = siteBlankBody.style;
    const r = rows.radius ? split.radius.values : { tl: 0, tr: 0, bl: 0, br: 0 };
    const b = split.border.values;
    const side = (a, cell) => ({ px: Math.min(a.px, cell), pct: Math.round(cell * a.pct / 100), fill: cell }[a.mode]);
    const edge = (key) => (edges[key] == null ? '' : edges[key] + 'px');
    s.width = (side(dims.w, siteContent.clientWidth) ?? WS_DEFAULTS.pe.dims.w.px) + 'px'; // у пустого окна своей ширины контента нет
    const height = side(dims.h, siteContent.clientHeight - 12); // 12 — отступ окна сверху
    s.height = height == null ? '' : height + 'px'; // по контенту — по секции внутри окна
    s.minWidth = edge('minW');
    s.maxWidth = edge('maxW');
    s.minHeight = edge('minH');
    s.maxHeight = edge('maxH');
    s.padding = `${win.pad.top}px ${win.pad.right}px ${win.pad.bottom}px ${win.pad.left}px`;
    s.borderRadius = `${r.tl}px ${r.tr}px ${r.br}px ${r.bl}px`;
    wsPaintFill(siteBlankBody, rows.background ? win.fills.background : null, 'transparent', BG_DEFAULT);
    s.boxShadow = rows.shadow ? `${sh.x}px ${sh.y}px ${sh.blur}px ${sh.spread}px color-mix(in srgb, ${sh.color} ${sh.opacity}%, transparent)` : 'none';
    s.border = rows.border ? `${line} ${colors.border}` : '0';
    if (rows.border) s.borderWidth = `${b.top}px ${b.right}px ${b.bottom}px ${b.left}px`;
  }

  // Заливка на холсте. Картинка — отдельным слоем (.ws-fill-img::before), остальное — фоном элемента. base — подложка под градиентом
  function wsPaintFill(node, fill, empty = '', base = '') {
    const img = fill?.kind === 'img';
    node.classList.toggle('ws-fill-img', img);
    if (!img) {
      for (const p of ['--fill-img', '--fill-op', '--fill-filter', '--fill-tint']) node.style.removeProperty(p);
      node.style.background = !fill ? empty : fill.kind === 'grad' ? bgGradCss(fill, base) : bgColorCss(fill);
      return;
    }
    const f = fill.fx;
    // температура: тёплый или холодный оттенок поверх картинки (soft-light)
    const tint = f.temp > 0 ? `255, 140, 0, ${(f.temp / 100 * .6).toFixed(2)}` : `0, 110, 255, ${(-f.temp / 100 * .6).toFixed(2)}`;
    node.style.background = 'none';
    node.style.setProperty('--fill-img', `url(${BG_IMGS[fill.i]})`);
    node.style.setProperty('--fill-op', f.op / 100);
    node.style.setProperty('--fill-filter', `blur(${f.blur / 5}px) contrast(${f.con}%) saturate(${f.sat}%)`);
    node.style.setProperty('--fill-tint', `linear-gradient(rgba(${tint}), rgba(${tint}))`);
  }

  const wsActualSize = (axis) => (axis === 'w' ? siteBlankBody.offsetWidth : siteBlankBody.offsetHeight);

  // Поля отступов из черновика и фактический размер в «по контенту» и «заполнить»: окно меняется уже после отрисовки PropertyEditor.
  // Значения цветов с прозрачностью он не пишет: дописываем сами, как в макете
  function wsRender() {
    const { pad, pe, posMode, posCell } = wsDraft;
    posEditorRender(wsRoot, posMode, true, posCell);
    wsRoot.querySelectorAll('[data-pe-dim]').forEach((dim) => {
      if (dim.classList.contains('pe__dim--auto')) dim.querySelector('input').placeholder = wsActualSize(dim.dataset.peDim);
    });
    wsRoot.querySelectorAll('[data-ws-axis]').forEach((n) => { n.hidden = pad.split; });
    wsRoot.querySelector('[data-ws-sides]').hidden = !pad.split;
    wsRoot.querySelector('[data-ws-pad-split]').classList.toggle('is-active', pad.split);
    wsRoot.querySelectorAll('[data-ws-pad]').forEach((input) => {
      const key = input.dataset.wsPad;
      input.value = key === 'h' ? pad.left : key === 'v' ? pad.top : pad[key];
    });
    for (const key of ['dim', 'background']) bgPaintBubble(wsRoot.querySelector(`[data-pe-row="${key}"] [data-pe-color]`), wsDraft.fills[key]);
    wsRoot.querySelector('[data-pe-shadow] .pe__bubble-text').textContent = `${pe.shadow.color.toUpperCase()}, ${pe.shadow.opacity / 100}`;
  }

  // Монтирует редактор со значениями win: сначала разметка, затем раскрытые блоки — их PropertyEditor из разметки не читает
  function wsMount(win) {
    wsEditor?.destroy();
    wsRoot.innerHTML = wsTemplate;
    wsDraft = structuredClone(win);
    const { dims, edges, rows, colors, shadow: sh, line, split } = win.pe;
    wsRoot.querySelectorAll('[data-pe-dim]').forEach((dim) => {
      const a = dims[dim.dataset.peDim];
      dim.dataset.peMode = a.mode;
      dim.querySelector('input').value = a.mode === 'px' ? a.px : a.mode === 'pct' ? a.pct : '';
    });
    wsRoot.querySelectorAll('[data-pe-row]').forEach((row) => {
      const key = row.dataset.peRow;
      row.hidden = !rows[key];
      const color = row.querySelector('[data-pe-color]');
      if (color) color.dataset.peColor = colors[key];
      const num = split[key] && row.querySelector('.pe__num-value');
      if (num) num.value = Object.values(split[key].values)[0];
    });
    Object.assign(wsRoot.querySelector('[data-pe-shadow]').dataset, { peShadow: sh.color, peOpacity: sh.opacity, peX: sh.x, peY: sh.y, peBlur: sh.blur, peSpread: sh.spread });
    wsRoot.querySelector('.pe__line').classList.toggle('pe__line--dashed', line === 'dashed');
    wsEditor = PropertyEditor.mount(wsRoot, {
      actualSize: wsActualSize,
      onChange: (state) => {
        wsDraft.pe = state;
        wsApply(wsDraft);
        wsRender();
      },
      onDone: () => { wsPage.win = wsDraft; wsClose(); },
      onClose: wsClose,
    });
    Object.keys(split).forEach((key) => {
      if (!split[key].on) return;
      const row = wsRoot.querySelector(`[data-pe-row="${key}"]`);
      row.querySelector('[data-pe-split]').click();
      Object.entries(split[key].values).forEach(([side, value]) => {
        const input = row.querySelector(`[data-pe-side="${side}"]`);
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
    Object.entries(edges).forEach(([key, value]) => {
      wsRoot.querySelector(`[data-pe-dim="${key.slice(-1).toLowerCase()}"] .pe__dim-unit`).click();
      wsRoot.querySelector(`.pe__menu [data-edge="${key}"]`).click();
      const input = wsRoot.querySelector(`[data-pe-edge="${key}"]`);
      input.value = value;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    wsDraft.pe = wsEditor.getState();
    wsRender();
  }

  function wsClose() {
    bgClose();
    if (wsRoot.hidden) return;
    wsEditor.destroy();
    wsEditor = null;
    wsRoot.hidden = true;
    wsOpenBtn.classList.remove('is-selected');
    wsOpenBtn.setAttribute('aria-pressed', 'false');
    wsApply(wsPage.win ?? WS_DEFAULTS);
  }

  wsOpenBtn.addEventListener('click', () => {
    if (!wsRoot.hidden) { wsClose(); return; }
    popupsClose();
    wsMount(wsPage.win ?? WS_DEFAULTS);
    const r = stageRect(siteBlankBody);
    wsRoot.hidden = false;
    wsRoot.style.left = Math.round(r.left) + 'px';
    wsRoot.style.top = Math.round(r.top) + 'px';
    wsOpenBtn.classList.add('is-selected');
    wsOpenBtn.setAttribute('aria-pressed', 'true');
  });

  wsRoot.addEventListener('input', (e) => {
    const t = e.target;
    const n = parseInt(t.value, 10);
    const valid = Number.isFinite(n);
    // поля PropertyEditor применяются по change, а на холсте правка видна сразу.
    // Размер меньше 40 px он поднял бы до 40 прямо во время набора, поэтому такой ввод ждёт ухода с поля; Min и Max он перерисовывает, они тоже применяются при уходе
    const dim = t.closest('[data-pe-dim]');
    if (dim) {
      if (n >= (wsDraft.pe.dims[dim.dataset.peDim].mode === 'pct' ? 1 : 40)) t.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    if (t.closest('[data-pe-row]')) {
      if (valid) t.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    const { pad } = wsDraft;
    const side = t.dataset.wsPad;
    if (side && valid) {
      const value = Math.min(Math.max(n, 0), 100);
      if (side === 'h') pad.left = pad.right = value;
      else if (side === 'v') pad.top = pad.bottom = value;
      else pad[side] = value;
    }
    wsApply(wsDraft);
  });
  // Enter и уход с поля показывают значение, которое применилось: неверный ввод возвращает прежнее
  wsRoot.addEventListener('change', (e) => { if (e.target.dataset.wsPad) wsRender(); });
  wsRoot.addEventListener('click', (e) => {
    // «Фон» и «Затемнение» открывают окно «Фон» вместо палитры PropertyEditor
    const fillBtn = e.target.closest('[data-pe-row="dim"] [data-pe-color], [data-pe-row="background"] [data-pe-color]');
    if (fillBtn) {
      e.stopPropagation();
      bgFromSettings(fillBtn, fillBtn.closest('[data-pe-row]').dataset.peRow);
      return;
    }
    const posMode = e.target.closest('[data-pos-mode]');
    if (posMode) {
      wsDraft.posMode = posMode.dataset.posMode;
      wsRender();
    } else if (posCellAt(e.target) >= 0) {
      wsDraft.posCell = posCellAt(e.target);
      wsRender();
    } else if (e.target.closest('.pe__reset')) { // свой сброс: PropertyEditor вернул бы значения на момент открытия
      e.stopPropagation();
      wsMount(WS_DEFAULTS);
      wsApply(wsDraft);
      wsRender();
    } else if (e.target.closest('[data-ws-pad-split]')) {
      const { pad } = wsDraft;
      pad.split = !pad.split;
      if (!pad.split) { // при сворачивании значения выравниваются по осям
        pad.right = pad.left;
        pad.bottom = pad.top;
      }
      wsApply(wsDraft);
      wsRender();
    }
  }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') wsClose(); });

  // Настройки секции: открываются по левому верхнему углу секции, шестерёнка в это время активна. Правки сразу видны на холсте, галочка сохраняет их в страницу,
  // крестик и Esc возвращают прежнее, сброс — исходные значения. Клик мимо не закрывает. Пока настроек нет, отступы секции — из стилей, поэтому в полях их фактические значения.
  // В макете есть только ширина «Узкая», «Широкая» и «Во всю ширину» — допущение. «Действие» и «Закрепить снизу» пока без действий.
  const SEC_NAME = 'Секция';
  const SEC_WIDTHS = { narrow: { name: 'Узкая', px: 1024 }, wide: { name: 'Широкая', px: 1280 }, full: { name: 'Во всю ширину', px: null } };
  const secRoot = $('#sec');
  peDraggable(secRoot);
  // Команды тулбара секции работают одинаково у всех секций: «Настройки» открывает это окно, «Фон» — окно «Фон».
  // Данные секции новой страницы лежат в странице, у остальных секций (каталог, кнопка, форма) — в своих объектах.
  const SEC_NODES = [siteBlankSection, siteExt, siteSection, siteLink];
  let secNode = siteBlankSection;
  const secStore = new Map([[siteExt, {}], [siteSection, {}], [siteLink, {}]]);
  const secData = () => secStore.get(secNode) ?? wsPage;
  const secNameInput = $('#secName');
  const secWidth = $('#secWidth');
  const secWidthMenu = $('#secWidthMenu');
  const secPx = $('#secPx');
  const secGap = $('#secGap');
  const secFillBtn = $('#secFill');
  let secDraft = null; // значения, пока открыты настройки

  $('.pe__menu-list', secWidthMenu).innerHTML = Object.entries(SEC_WIDTHS).map(([id, w]) =>
    `<button type="button" class="pe__menu-item" role="menuitemradio" data-width="${id}"><span class="pe__menu-bullet"></span>${w.name}</button>`).join('');

  const secContentWidth = (sec) => sec.px ?? SEC_WIDTHS[sec.width].px;

  // Отступы, зазор и ширина контента на холсте; без значений — исходный вид секции
  function secApply(sec, node = secNode) {
    const s = node.style;
    s.padding = sec ? `${sec.pad.top}px ${sec.pad.right}px ${sec.pad.bottom}px ${sec.pad.left}px` : '';
    s.gap = sec ? sec.gap + 'px' : '';
    const w = sec && secContentWidth(sec);
    if (w) s.setProperty('--sec-content-w', w + 'px');
    else s.removeProperty('--sec-content-w');
  }

  function secDefaults() {
    secApply(null);
    const c = getComputedStyle(secNode);
    const pad = { split: false, top: parseInt(c.paddingTop, 10), right: parseInt(c.paddingRight, 10), bottom: parseInt(c.paddingBottom, 10), left: parseInt(c.paddingLeft, 10) };
    return { name: SEC_NAME, width: 'narrow', px: null, pad, gap: 0, fill: null };
  }

  function secRender() {
    const { pad, gap, width, px, fill } = secDraft;
    secRoot.querySelectorAll('[data-sec-axis]').forEach((n) => { n.hidden = pad.split; });
    secRoot.querySelector('[data-sec-sides]').hidden = !pad.split;
    secRoot.querySelector('[data-sec-pad-split]').classList.toggle('is-active', pad.split);
    secRoot.querySelectorAll('[data-sec-pad]').forEach((input) => {
      const key = input.dataset.secPad;
      input.value = key === 'h' ? pad.left : key === 'v' ? pad.top : pad[key];
    });
    secGap.value = gap;
    $('#secWidthName').textContent = SEC_WIDTHS[width].name;
    secWidthMenu.querySelectorAll('[data-width]').forEach((item) => {
      const on = item.dataset.width === width;
      item.classList.toggle('is-selected', on);
      item.setAttribute('aria-checked', on);
    });
    const preset = SEC_WIDTHS[width].px;
    secPx.value = px ?? '';
    secPx.placeholder = preset ? preset.toLocaleString('ru-RU') : '';
    secPx.disabled = !preset;
    secFillBtn.classList.toggle('is-none', !fill);
    if (fill) bgPaintBubble(secFillBtn, fill);
    else {
      secFillBtn.style.removeProperty('--pe-color');
      $('.pe__bubble-text', secFillBtn).textContent = '';
    }
  }

  function secCommit() {
    secDraft.name = secNameInput.value.trim() || SEC_NAME;
    const data = secData();
    data.section = secDraft;
    data.sectionFill = secDraft.fill;
  }

  function secMenuClose() {
    secWidthMenu.hidden = true;
    secWidth.setAttribute('aria-expanded', 'false');
  }

  function secClose() {
    if (secRoot.hidden) return;
    secMenuClose();
    secRoot.hidden = true;
    const btn = $('[data-sec-cmd="settings"]', secNode);
    btn.classList.remove('is-selected');
    btn.setAttribute('aria-pressed', 'false');
    secApply(secData().section);
    wsPaintFill(secNode, secData().sectionFill, '', BG_DEFAULT);
  }

  const secEditor = PropertyEditor.mount(secRoot, {
    onDone: () => { secCommit(); secClose(); },
    onClose: secClose,
  });

  for (const node of SEC_NODES) $('[data-sec-cmd="settings"]', node).addEventListener('click', (e) => {
    if (!secRoot.hidden) { secClose(); return; }
    popupsClose();
    secNode = node;
    const saved = secData().section;
    secDraft = { ...(saved ? structuredClone(saved) : secDefaults()), fill: secData().sectionFill ?? null };
    secEditor.reset();
    if (secDraft.fill) secRoot.querySelector('[data-pe-chip="background"]').click(); // заданный фон — строкой, иначе чипса
    secNameInput.value = secDraft.name;
    secNameInput.dispatchEvent(new Event('input', { bubbles: true }));
    secRender();
    const r = stageRect(secNode);
    secRoot.hidden = false;
    peMoveTo(secRoot, r.left, r.top);
    e.currentTarget.classList.add('is-selected');
    e.currentTarget.setAttribute('aria-pressed', 'true');
  });

  // Новый ввод сразу виден на холсте; Enter и уход с поля показывают значение, которое применилось
  secRoot.addEventListener('input', (e) => {
    const t = e.target;
    const n = parseInt(t.value, 10);
    const valid = Number.isFinite(n);
    const { pad } = secDraft;
    const value = Math.min(Math.max(n, 0), 300);
    const side = t.dataset.secPad;
    if (side && valid) {
      if (side === 'h') pad.left = pad.right = value;
      else if (side === 'v') pad.top = pad.bottom = value;
      else pad[side] = value;
    } else if (t === secGap && valid) secDraft.gap = value;
    else if (t === secPx) secDraft.px = valid && n > 0 ? n : null;
    else return;
    secApply(secDraft);
  });
  secRoot.addEventListener('change', (e) => { if (e.target.closest('[data-sec-pad], #secGap, #secPx')) secRender(); });
  secRoot.addEventListener('click', (e) => {
    if (e.target.closest('.pe__reset')) { // свой сброс: PropertyEditor вернул бы значения на момент открытия
      e.stopPropagation();
      secDraft = secDefaults();
      secEditor.reset();
      secApply(secDraft);
      wsPaintFill(secNode, null, '', BG_DEFAULT);
      secRender();
    } else if (e.target.closest('[data-sec-pad-split]')) {
      const { pad } = secDraft;
      pad.split = !pad.split;
      if (!pad.split) { // при сворачивании значения выравниваются по осям
        pad.right = pad.left;
        pad.bottom = pad.top;
      }
      secApply(secDraft);
      secRender();
    } else if (e.target.closest('#secFill')) bgFromSettings(secFillBtn, 'section');
    else if (e.target.closest('[data-pe-clear]')) { // строку убирает PropertyEditor, фон на холсте снимаем сами
      secDraft.fill = null;
      wsPaintFill(secNode, null, '', BG_DEFAULT);
      secRender();
    }
  }, true);

  secWidth.addEventListener('click', () => {
    if (!secWidthMenu.hidden) { secMenuClose(); return; }
    const r = stageRect(secWidth);
    const box = stageRect(secWidth.closest('.pe__card'));
    secWidthMenu.hidden = false;
    secWidthMenu.style.left = Math.round(r.left - box.left - 16) + 'px';
    secWidthMenu.style.top = Math.round(r.top - box.top - 12) + 'px';
    secWidth.setAttribute('aria-expanded', 'true');
  });
  secWidthMenu.addEventListener('click', (e) => {
    const item = e.target.closest('[data-width]');
    if (!item) return;
    secDraft.width = item.dataset.width;
    secDraft.px = null; // ширина из варианта заменяет введённую
    secMenuClose();
    secApply(secDraft);
    secRender();
  });
  document.addEventListener('mousedown', (e) => { if (!e.target.closest('#secWidthMenu, #secWidth')) secMenuClose(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (secWidthMenu.hidden) secClose();
    else secMenuClose();
  });

  // ---------- Окно «Фон» (Figma 16385:63244, верхняя строка 16385:63266) — как в interface-prototype ----------
  // Общее для «Фона» и «Затемнения сайта», открывается и из тулбаров окна и секции. Из строки настроек встаёт вместо них, правки настроек при этом сохраняются. Правки фона сразу применяются к странице.
  // ✓ и ✕ этого окна только закрывают его, заготовленный цвет или градиент применяется и закрывает, картинка оставляет открытым.
  const BG_DEFAULT = '#f8f8f8';
  const BG_GRADS = ['#943253', '#f16767', '#e59545', '#e5cb45', '#009918', '#0c94ff', '#326194', '#4c3294', '#943288'];
  const BG_COLORS = ['#ffe3ec', '#ffe5e3', '#fff1e3', '#fffbe3', '#e3ffe8', '#e3faff', '#e3f1ff', '#eae3ff', '#ffe3fa', '#ededed'];
  const BG_IMGS = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `assets/img/bg/0${n}.jpg`);
  const FX_DEFAULT = { op: 100, blur: 0, con: 100, sat: 100, temp: 0 };
  // Ползунки «Картинки»: диапазон и единица; 0 у контраста и насыщенности — серое / плоское, 100 — как в оригинале.
  const FX = [
    { key: 'op', name: 'Прозрачность', min: 0, max: 100, unit: '%' },
    { key: 'blur', name: 'Размытие', min: 0, max: 100, unit: '' },
    { key: 'con', name: 'Контраст', min: 0, max: 200, unit: '%' },
    { key: 'sat', name: 'Насыщенность', min: 0, max: 200, unit: '%' },
    { key: 'temp', name: 'Температура', min: -100, max: 100, unit: '' },
  ];
  const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const rgba = (hex, a) => `rgba(${hexRgb(hex).join(', ')}, ${a})`;
  const mixHex = (base, c, k) => {
    const b = hexRgb(base);
    return '#' + hexRgb(c).map((v, i) => Math.round(b[i] + (v - b[i]) * k).toString(16).padStart(2, '0')).join('');
  };
  const bgColorCss = (f) => (f.a >= 100 ? f.hex : rgba(f.hex, f.a / 100));
  const bgGradCss = (f, base = '') => `linear-gradient(${rgba(f.c, .1)}, rgba(248, 248, 248, 0) 27.546%)${base ? ', ' + base : ''}`;
  // Кружок в строке редактора и плашка в окне
  function bgPreview(f) {
    if (f.kind === 'img') return `url(${BG_IMGS[f.i]}) center / cover`;
    if (f.kind === 'grad') return `linear-gradient(${rgba(f.c, .1)}, rgba(248, 248, 248, 0)), ${BG_DEFAULT}`;
    return bgColorCss(f);
  }
  function bgPaintBubble(btn, f) {
    const alpha = f.kind === 'color' && f.a < 100;
    btn.style.setProperty('--pe-color', alpha ? f.hex : bgPreview(f));
    btn.style.setProperty('--pe-alpha', Math.max(alpha ? f.a : 0, 14) + '%');
    btn.querySelector('.pe__swatch').classList.toggle('pe__swatch--alpha', alpha);
    btn.querySelector('.pe__bubble-text').textContent = f.kind === 'img' ? 'Картинка'
      : f.kind === 'grad' ? `${mixHex(BG_DEFAULT, f.c, .1).toUpperCase()} → ${BG_DEFAULT.slice(1).toUpperCase()}`
      : f.hex.toUpperCase() + (alpha ? `, ${f.a / 100}` : '');
  }

  const bgWin = $('#bgWin');
  const bgHex = $('#bgHex');
  const bgAlpha = $('#bgAlpha');
  let bgKey = null; // что настраиваем: 'background' и 'dim' окна или 'section'
  let bgAnchor = null; // команда тулбара, из которой открыто окно
  let bgSpot = null; // место окна, открытого из строки настроек: самой строки уже нет
  const bgBtn = $('#wsFill');
  const BG_TOOLS = new Map([[bgBtn, 'background'], ...SEC_NODES.map((node) => [$('[data-sec-cmd="fill"]', node), 'section'])]); // команды тулбаров и что они настраивают
  const bgDoc = () => (wsPage.win ??= structuredClone(WS_DEFAULTS));
  // У секции фон по умолчанию не задан
  const bgCur = () => (bgKey === 'section' ? secData().sectionFill ?? { kind: 'none' } : bgDoc().fills[bgKey]);

  $('#bgPresets').innerHTML =
    BG_GRADS.map((c) => `<button class="cw-sw is-grad" type="button" data-grad="${c}" style="--c:${rgba(c, .1)}" aria-label="Градиент"></button>`).join('') +
    [BG_DEFAULT, ...BG_COLORS].map((h) => `<button class="cw-sw" type="button" data-hex="${h}" style="--c:${h}" aria-label="${h}"></button>`).join('');
  $('#bgCat').innerHTML = BG_IMGS.map((src, i) =>
    `<button class="bg-tile" type="button" data-img="${i}" style="--img:url(${src})" aria-label="Картинка ${i + 1}"><span class="bg-tool"><span class="ico">&#xE660;</span></span></button>`).join('');
  $('#bgFx').innerHTML = FX.map((x) =>
    `<div class="bg-row" data-fx="${x.key}"><span class="bg-row__label">${x.name}</span>` +
    '<span class="bg-slider"><i class="bg-slider__fill"></i><i class="bg-slider__thumb"></i></span>' +
    `<span class="bg-num${x.unit ? '' : ' no-unit'}"><input type="text" inputmode="numeric" autocomplete="off" maxlength="4" aria-label="${x.name}"><span>${x.unit}</span></span></div>`).join('');

  function bgStore(f) {
    if (bgKey === 'section') {
      secData().sectionFill = f;
      wsPaintFill(secNode, f, '', BG_DEFAULT);
      return;
    }
    const doc = bgDoc();
    doc.fills[bgKey] = f;
    doc.pe.rows[bgKey] = true; // строка, убранная в настройках, возвращается
    wsApply(doc);
  }
  function bgSet(f) {
    bgStore(f);
    bgRender(true);
  }
  function setFx(key, v, typed) {
    const f = bgCur();
    bgSet({ ...f, fx: { ...f.fx, [key]: v } });
    fxRender(typed ? key : null);
  }

  // fields — обновить и поля ввода (не нужно, пока пользователь печатает в одном из них)
  function bgRender(fields) {
    const f = bgCur();
    bgWin.dataset.kind = f.kind;
    const pill = $('#bgPill');
    pill.className = 'cw-pill' + (f.kind === 'img' ? ' is-img' : f.kind === 'none' ? ' is-none' : '');
    pill.style.setProperty('--c', f.kind === 'img' ? `url(${BG_IMGS[f.i]})` : f.kind === 'none' ? '#fff' : bgPreview(f));
    if (f.kind === 'grad') $('#bgGradFrom').textContent = mixHex(BG_DEFAULT, f.c, .1).slice(1).toUpperCase();
    if (fields && f.kind === 'color') { bgHex.value = f.hex.slice(1).toUpperCase(); bgAlpha.value = f.a; }
    if (fields && f.kind === 'none') { bgHex.value = ''; bgAlpha.value = 0; }
  }

  function fxRender(skipInput) {
    const f = bgCur().fx;
    for (const x of FX) {
      const row = $(`[data-fx="${x.key}"]`, bgWin);
      row.style.setProperty('--k', (f[x.key] - x.min) / (x.max - x.min));
      if (skipInput !== x.key) $('input', row).value = f[x.key];
    }
  }
  function openPic() {
    const f = bgCur();
    if (f.kind !== 'img') return;
    bgWin.classList.add('is-pic');
    $('#bgTitle').textContent = 'Картинка';
    $('#bgPicPv').style.setProperty('--img', `url(${BG_IMGS[f.i]})`);
    fxRender();
    bgPlace();
  }
  function closePic() {
    bgWin.classList.remove('is-pic');
    $('#bgTitle').textContent = bgKey === 'dim' ? 'Затемнение' : 'Фон';
  }

  // Из тулбара окно встаёт под командой с зазором 4px, из строки настроек — поверх кружка, как палитра PropertyEditor. За сцену не выходит
  function bgPlace() {
    const r = bgAnchor && stageRect(bgAnchor);
    const { left, top } = bgAnchor ? { left: r.left, top: r.top + r.height + 4 } : bgSpot;
    bgWin.style.left = Math.max(8, Math.min(Math.round(left), stage.offsetWidth - bgWin.offsetWidth - 8)) + 'px';
    bgWin.style.top = Math.max(8, Math.min(Math.round(top), stage.offsetHeight - bgWin.offsetHeight - 8)) + 'px';
  }
  function bgToggle(anchor) {
    if (bgAnchor === anchor) { bgClose(); return; }
    popupsClose();
    bgAnchor = anchor;
    bgShow(BG_TOOLS.get(anchor));
  }
  function bgFromSettings(btn, key) {
    const r = stageRect(btn);
    if (wsRoot.hidden) secCommit();
    else wsPage.win = wsDraft;
    popupsClose();
    bgSpot = { left: r.left - 13, top: r.top - 13 };
    bgShow(key);
  }
  function bgShow(key) {
    bgKey = key;
    for (const btn of BG_TOOLS.keys()) {
      btn.classList.toggle('is-selected', btn === bgAnchor);
      btn.setAttribute('aria-pressed', btn === bgAnchor);
    }
    closePic();
    bgRender(true);
    bgWin.hidden = false;
    bgPlace();
  }
  function bgClose() {
    bgWin.hidden = true;
    bgKey = null;
    bgAnchor = null;
    for (const btn of BG_TOOLS.keys()) {
      btn.classList.remove('is-selected');
      btn.setAttribute('aria-pressed', 'false');
    }
  }

  bgBtn.addEventListener('click', () => bgToggle(bgBtn));
  for (const node of SEC_NODES) {
    const btn = $('[data-sec-cmd="fill"]', node);
    btn.addEventListener('click', () => { secNode = node; bgToggle(btn); });
  }

  $('#bgDone').addEventListener('click', bgClose);
  $('#bgClose').addEventListener('click', bgClose);
  $('#bgBack').addEventListener('click', () => { closePic(); bgPlace(); });
  $('#bgPresets').addEventListener('click', (e) => {
    const sw = e.target.closest('.cw-sw');
    if (!sw) return;
    const f = bgCur();
    // затемнение сохраняет свою прозрачность, иначе непрозрачный цвет перекрыл бы сайт
    const a = bgKey === 'dim' && f.kind === 'color' ? f.a : 100;
    bgSet(sw.dataset.grad ? { kind: 'grad', c: sw.dataset.grad } : { kind: 'color', hex: sw.dataset.hex, a });
    bgClose();
  });
  // клик по картинке — поставить её (настройки сбрасываются для новой картинки); карандаш на картинке — ещё и открыть «Картинку»
  $('#bgCat').addEventListener('click', (e) => {
    const tile = e.target.closest('.bg-tile');
    if (!tile) return;
    const i = +tile.dataset.img;
    const f = bgCur();
    if (!(f.kind === 'img' && f.i === i)) bgSet({ kind: 'img', i, fx: { ...FX_DEFAULT } });
    if (e.target.closest('.bg-tool')) openPic();
  });
  bgHex.addEventListener('input', () => {
    const v = '#' + bgHex.value.trim().replace(/^#/, '');
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return;
    const hex = (v.length === 4 ? '#' + [...v.slice(1)].map((x) => x + x).join('') : v).toLowerCase();
    bgStore({ kind: 'color', hex, a: bgCur().a ?? 100 });
    bgRender(false);
  });
  bgAlpha.addEventListener('input', () => {
    bgAlpha.value = bgAlpha.value.replace(/\D/g, '');
    if (bgAlpha.value === '') return;
    const a = Math.min(100, +bgAlpha.value);
    const f = bgCur();
    if (f.kind === 'none') { // у незаданного фона цвет появляется вместе с прозрачностью
      if (a === 0) return;
      bgHex.value = 'FFFFFF';
    }
    bgStore({ kind: 'color', hex: f.hex ?? '#ffffff', a });
    bgRender(false);
  });
  for (const input of [bgHex, bgAlpha]) input.addEventListener('blur', () => { if (bgKey) bgRender(true); });

  // Ползунки: нажатие и перетаскивание; поле справа — ввод числа
  $('#bgFx').addEventListener('pointerdown', (e) => {
    const slider = e.target.closest('.bg-slider');
    if (!slider) return;
    const x = FX.find((f) => f.key === slider.parentNode.dataset.fx);
    const move = (ev) => {
      const r = slider.getBoundingClientRect();
      const k = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
      const v = Math.round(x.min + k * (x.max - x.min));
      if (v !== bgCur().fx[x.key]) setFx(x.key, v);
    };
    slider.setPointerCapture(e.pointerId);
    move(e);
    slider.onpointermove = move;
    slider.onpointerup = slider.onpointercancel = () => { slider.onpointermove = slider.onpointerup = slider.onpointercancel = null; };
  });
  $('#bgFx').addEventListener('input', (e) => {
    const row = e.target.closest('[data-fx]');
    const x = FX.find((f) => f.key === row.dataset.fx);
    const input = e.target;
    input.value = input.value.replace(x.min < 0 ? /[^\d-]/g : /\D/g, '');
    if (!/^-?\d+$/.test(input.value)) return;
    setFx(x.key, Math.min(x.max, Math.max(x.min, +input.value)), true);
  });
  $('#bgFx').addEventListener('focusout', () => { if (bgKey && bgCur().kind === 'img') fxRender(); });

  // Сценарий «Создание окна с товаром»: каталог уже на странице и не выделен, страницы «Карточка товара» нет.
  function sitePlaceCatalog() {
    catalogHomeSet(false);
    catalogMenu = false;
    catalogAdded = true;
    siteCatalogShow(true);
    siteCatalog.classList.remove('is-active');
  }
  rsRender();

  // ---------- Левый сайдбар (Figma rHabzni5OI5D4fxBLQdj2m 5:28393) ----------
  // Вписан в страницу или свёрнут в линии: по наведению на линии панель открывается поверх контента.
  // Режим запоминается между открытиями, страницы при обновлении возвращаются к исходным.
  const LS_KEY = 'popups.sidebar';
  const lsRoot = $('#ls');
  const lsList = $('#lsList');
  const lsLines = $('#lsLines');
  const lsMenu = $('#lsMenu');
  const lsToggle = $('#lsToggle');
  // открыта страница «Меню»; в сценариях компонентов её нет
  const lsInitialPages = () => [{ id: 1, name: 'Главная', off: false, home: true }, { id: 2, name: 'Меню', off: false }];
  let lsPages = lsInitialPages();
  let lsActive = 2;
  let lsNextId = 3;
  let lsMenuPage = null; // страница, у которой открыто меню «⋮»
  let lsEditing = null;  // { page, row, input } — идёт переименование
  let lsCloseTimer = 0;

  const lsPage = (id) => lsPages.find((p) => p.id === id);
  const lsVisibleCount = () => lsPages.filter((p) => !p.off).length;

  function lsReadCollapsed() {
    try { return localStorage.getItem(LS_KEY) === 'collapsed'; } catch { return false; }
  }

  function lsSetCollapsed(collapsed) {
    // Состояние — классы ui-kit left-sidebar: .lsb--hover, .is-open, .is-switching (смена режима без выезда).
    // .is-ls-collapsed у сцены сдвигает контент и плавающие виджеты к колонке линий.
    lsRoot.classList.add('is-switching');
    lsRoot.classList.toggle('lsb--hover', collapsed);
    stage.classList.toggle('is-ls-collapsed', collapsed);
    lsRoot.classList.remove('is-open');
    void lsRoot.offsetWidth;
    lsRoot.classList.remove('is-switching');
    $('#lsToggleIco').innerHTML = collapsed ? '&#xEBFB;' : '&#xEBFA;';
    lsToggle.setAttribute('aria-label', collapsed ? 'Закрепить панель' : 'Свернуть панель');
    try { localStorage.setItem(LS_KEY, collapsed ? 'collapsed' : 'pinned'); } catch {}
  }

  // Сначала собственные страницы, затем страницы компонентов в порядке настроек сайта.
  const lsGroupOf = (p) => p.group ?? p.comp;
  function lsGroups() {
    return [lsPages.filter((p) => !lsGroupOf(p)), ...Object.keys(COMP).map((id) => lsPages.filter((p) => lsGroupOf(p) === id))];
  }
  const lsOrdered = () => lsGroups().flat();
  function lsRenderLines() {
    lsLines.replaceChildren(...lsOrdered().map((p) => el('span', 'lsb__line' + (p.id === lsActive ? ' is-active' : ''))));
  }

  function lsRow(p) {
    const row = el('div', 'lsb__page' + (p.id === lsActive ? ' is-active' : '') + (p.off ? ' is-off' : ''),
      '<span class="lsb__marker"></span><span class="lsb__page-name"></span>' +
      '<span class="lsb__cmds">' +
      '<button class="btn btn--link btn--style-label btn--size-m btn--icon" type="button" data-cmd="more" aria-label="Ещё"><span class="btn__icon">&#xE9D9;</span></button>' +
      '</span>');
    row.dataset.id = p.id;
    row.querySelector('.lsb__page-name').textContent = p.name;
    return row;
  }
  function lsRender() {
    PageGroups.render(lsList, lsOrdered().map((page) => ({ row: lsRow(page), group: lsGroupOf(page) })),
      Object.fromEntries(Object.entries(COMP).map(([id, component]) => [id, component.name])));
    lsRenderLines();
    siteShowPage(lsPage(lsActive));
    siteProductSyncShop();
    scenSync();
  }

  // Выбор только переставляет классы: строки остаются на месте, иначе двойной клик не дойдёт до строки.
  function lsSelect(id) {
    if (id !== lsActive) salesClose(); // окно точек продаж относится к открытой странице: при переходе на другую закрывается
    lsActive = id;
    for (const row of lsList.querySelectorAll('.lsb__page')) {
      row.classList.toggle('is-active', Number(row.dataset.id) === id);
    }
    lsRenderLines();
    siteShowPage(lsPage(id));
    scenSync();
  }

  function lsCloseMenu() {
    if (lsMenuPage == null) return;
    lsMenu.hidden = true;
    lsList.querySelector('.is-menu')?.classList.remove('is-menu');
    lsMenuPage = null;
    lsCollapseIfLeft();
  }

  function lsOpenMenu(id, btn) {
    popupsClose();
    lsMenuPage = id;
    btn.closest('.lsb__page').classList.add('is-menu');
    // Страница компонента принадлежит ему: её нельзя сделать главной, скрыть, дублировать и удалить — удаляет только сам компонент.
    // Те же ограничения действуют для связанных страниц собранного сайта (group, «В конструкторе»).
    const comp = !!lsGroupOf(lsPage(id));
    for (const act of ['home', 'duplicate', 'hide', 'delete']) $(`[data-act="${act}"]`, lsMenu).hidden = comp;
    lsMenu.hidden = false;
    const r = stageRect(btn);
    lsMenu.style.left = Math.round(r.left + r.width / 2 + 26 - lsMenu.offsetWidth) + 'px'; // центр крестика — на центре «⋮»: 26 от правого края меню, 24 от верхнего
    lsMenu.style.top = Math.round(r.top + r.height / 2 - 24) + 'px';
  }

  function lsStartRename(id) {
    lsFinishRename(true);
    lsSelect(id);
    const page = lsPage(id);
    const row = lsList.querySelector(`[data-id="${id}"]`);
    const input = el('input', 'lsb__input');
    input.value = page.name;
    input.setAttribute('aria-label', 'Название страницы');
    const save = el('span', 'lsb__save',
      '<button class="btn btn--filled btn--style-pale btn--size-m btn--icon lsb__save-ok" type="button" data-save="ok" aria-label="Сохранить"><span class="btn__icon">&#xE75E;</span></button>' +
      '<button class="btn btn--ghost btn--style-label btn--size-m btn--icon lsb__save-cancel" type="button" data-save="cancel" aria-label="Отменить"><span class="btn__icon">&#xE66C;</span></button>');
    row.classList.add('is-edit');
    row.querySelector('.lsb__page-name').replaceWith(input);
    row.querySelector('.lsb__cmds').before(save);
    lsEditing = { page, row, input };
    input.focus();
    input.select();
  }

  // apply — сохранить название; пустое название не сохраняется.
  function lsFinishRename(apply) {
    if (!lsEditing) return;
    const { page, input } = lsEditing;
    lsEditing = null;
    const name = input.value.trim();
    if (apply && name) page.name = name;
    lsRender();
    lsCollapseIfLeft();
  }

  // Удаление: фокус — на предыдущую. Удалена последняя — создаётся пустая страница.
  function lsDelete(id) {
    const at = lsPages.findIndex((p) => p.id === id);
    lsPages.splice(at, 1);
    if (!lsPages.length) lsPages.push({ id: lsNextId++, name: 'Страница 1', off: false, blank: true, mode: 'page' });
    if (id === lsActive) lsActive = lsPages[Math.max(0, at - 1)].id;
    if (!lsVisibleCount()) lsPage(lsActive).off = false; // хотя бы одна страница остаётся видимой
    lsRender();
  }

  // Копия встаёт под исходную и сразу открывается. Адрес не копируем: он у каждой страницы свой.
  function lsDuplicate(id) {
    const at = lsPages.findIndex((p) => p.id === id);
    const page = { ...lsPages[at], id: lsNextId++, name: lsPages[at].name + ' (копия)', addr: '' };
    lsPages.splice(at + 1, 0, page);
    lsActive = page.id;
    lsRender();
  }

  // Страница «Карточка товара» создаётся вместе с каталогом и удаляется вместе с ним.
  let lsCardPageId = null;
  function lsAddCardPage() {
    lsCardPageId = lsNextId++;
    lsPages.push({ id: lsCardPageId, name: 'Карточка товара', off: false, blank: true, mode: 'page', product: true, fixed: true });
    lsRender();
  }
  function lsRemoveCardPage() {
    if (lsPage(lsCardPageId)) lsDelete(lsCardPageId); // её могли удалить вручную
    lsCardPageId = null;
  }

  // Страница «Обратная связь» — обычное окно (как «В окне»), размер и фон по виджету из макета 2654:44316. Создаётся с плавающей кнопкой и удаляется вместе с ней.
  let lsFloatPageId = null;
  function lsAddFloatPage() {
    const win = structuredClone(WS_DEFAULTS);
    win.pe.dims.w.px = 424;
    win.fills.background.hex = win.pe.colors.background = '#f8f8f8';
    lsFloatPageId = lsNextId++;
    lsPages.push({ id: lsFloatPageId, name: 'Обратная связь', off: false, blank: true, mode: 'window', feedback: true, fixed: true, win });
    lsRender();
  }
  function lsRemoveFloatPage() {
    if (lsPage(lsFloatPageId)) lsDelete(lsFloatPageId); // её могли удалить вручную
    lsFloatPageId = null;
  }

  // Панель поверх контента закрывается, когда мышь ушла, а меню и переименование закрыты.
  function lsCollapseIfLeft() {
    clearTimeout(lsCloseTimer);
    if (!lsRoot.classList.contains('is-open') || lsRoot.matches(':hover')) return;
    lsCloseTimer = setTimeout(() => {
      if (lsMenuPage == null && !lsEditing && lsNew.hidden && !lsRoot.matches(':hover')) lsRoot.classList.remove('is-open');
    }, 200);
  }

  lsLines.addEventListener('mouseenter', () => {
    clearTimeout(lsCloseTimer);
    lsRoot.classList.add('is-open');
  });
  lsRoot.addEventListener('mouseenter', () => clearTimeout(lsCloseTimer));
  lsRoot.addEventListener('mouseleave', lsCollapseIfLeft);
  lsToggle.addEventListener('click', () => lsSetCollapsed(!lsRoot.classList.contains('lsb--hover')));

  lsList.addEventListener('click', (e) => {
    const row = e.target.closest('.lsb__page');
    if (!row) return;
    const id = Number(row.dataset.id);
    const save = e.target.closest('[data-save]');
    if (save) { lsFinishRename(save.dataset.save === 'ok'); return; }
    if (row.classList.contains('is-edit')) return;
    const cmd = e.target.closest('[data-cmd]');
    if (cmd?.dataset.cmd === 'more') {
      if (lsMenuPage === id) lsCloseMenu();
      else lsOpenMenu(id, cmd);
    } else {
      lsSelect(id);
    }
  });
  lsList.addEventListener('dblclick', (e) => {
    const row = e.target.closest('.lsb__page');
    if (stage.classList.contains('is-tpl-view')) return; // в просмотре шаблона страницы не переименовываются
    if (row && !e.target.closest('[data-cmd], [data-save]') && !row.classList.contains('is-edit')) lsStartRename(Number(row.dataset.id));
  });
  lsList.addEventListener('keydown', (e) => {
    if (!e.target.closest('.lsb__page')) return;
    if (e.key === 'Enter') lsFinishRename(true);
    else if (e.key === 'Escape') lsFinishRename(false);
  });

  lsMenu.addEventListener('click', (e) => {
    const item = e.target.closest('[data-act]');
    if (!item) return;
    const id = lsMenuPage;
    const at = stageRect(lsMenu);
    lsCloseMenu();
    // «Сделать главной», «Скопировать ссылку» и «Скрыть» пока только закрывают меню
    if (item.dataset.act === 'settings') lsPageSettings(id, at);
    else if (item.dataset.act === 'duplicate') lsDuplicate(id);
    else if (item.dataset.act === 'delete') lsDelete(id);
  });
  $('#lsMenuClose').addEventListener('click', lsCloseMenu);

  // Окно новой страницы: открывается поверх плюса. Адрес и SEO-заголовок идут за названием, пока их не меняли вручную.
  // «Сохранить» и Enter в названии добавляют страницу и открывают её, крестик и Esc закрывают без добавления. Клик мимо окно не закрывает.
  // Это же окно — настройки страницы: открывается из меню «⋮» с её значениями, «Сохранить» применяет их к ней.
  const lsNew = $('#lsNew');
  const { lsAccess, lsAccessMenu, lsAccessSelect, lsAccessClose } = PageEditor.mount(lsNew);
  peDraggable(lsNew);
  const lsNewName = $('#lsNewName');
  const lsNewAddr = $('#lsNewAddr');
  const lsNewSeoTitle = $('#lsNewSeoTitle');
  const lsNewSeoDescription = $('#lsNewSeoDescription');
  const lsSeoDescriptionAdd = $('#lsSeoDescriptionAdd');
  const lsSeoDescriptionField = $('#lsSeoDescriptionField');
  const lsNewIndex = $('#lsNewIndex');
  const LS_NEW_NAME = 'Новая страница';
  let lsNewSeoEdited = false;
  let lsNewPage = null; // настраиваемая страница, null — новая

  function lsNewSync() {
    const name = lsNewName.value.trim() || LS_NEW_NAME;
    lsNewAddr.placeholder = PageEditor.defaultAddress(name);
    if (!lsNewSeoEdited) lsNewSeoTitle.value = name;
  }

  function lsNewFill(page) {
    lsNewPage = page;
    lsNew.setAttribute('aria-label', page ? 'Настройки страницы' : 'Новая страница');
    lsNewAddr.value = page?.addr ?? '';
    lsNewSeoEdited = page?.seo != null;
    lsNewIndex.querySelector('.rp-switch').classList.toggle('is-on', !!page?.noindex);
    lsNewIndex.setAttribute('aria-checked', !!page?.noindex);
    lsAccessClose();
    lsAccessSelect(lsAccessMenu.querySelector(`[data-access="${page?.access ?? 'public'}"]`));
    lsNewSeoDescription.value = page?.seoDescription ?? '';
    lsDescriptionShow(page?.seoDescription != null);
    lsNewEditor.reset(); // пустое название, SEO убран; вызывает lsNewSync
    if (!page) return;
    lsNewName.value = page.name;
    if (page.seo != null) {
      lsNew.querySelector('[data-pe-chip="seo"]').click();
      lsNewSeoTitle.value = page.seo;
    }
    lsNewName.dispatchEvent(new Event('input', { bubbles: true })); // PropertyEditor и подсказка адреса узнают название
  }

  function lsNewShow(left, top) {
    popupsClose();
    lsNew.hidden = false;
    lsNew.style.left = Math.round(left) + 'px';
    lsNew.style.top = Math.round(top) + 'px';
    lsNewName.focus();
  }

  const lsAddPin = $('#lsAdd .pin');

  function lsNewOpen() {
    lsAddPin.remove();
    lsNewFill(null);
    const r = stageRect($('#lsAdd'));
    lsNewShow(r.left - 12, r.top + r.height / 2 - 22);
  }

  // Настройки страницы открываются на месте меню «⋮»
  function lsPageSettings(id, at) {
    lsNewFill(lsPage(id));
    lsNewShow(at.left, at.top);
  }

  function lsNewClose() {
    if (lsNew.hidden) return;
    lsAccessClose();
    lsNew.hidden = true;
    lsCollapseIfLeft();
  }

  function lsNewSave() {
    const fields = {
      name: lsNewName.value.trim() || LS_NEW_NAME,
      addr: lsNewAddr.value.trim(),
      noindex: lsNewIndex.querySelector('.rp-switch').classList.contains('is-on'),
      seo: lsNew.querySelector('[data-pe-row="seo"]').hidden ? null : lsNewSeoTitle.value,
      seoDescription: lsNew.querySelector('[data-pe-row="seo"]').hidden || lsSeoDescriptionField.hidden ? null : lsNewSeoDescription.value,
      access: lsAccessMenu.querySelector('.is-selected').dataset.access,
    };
    if (lsNewPage) {
      Object.assign(lsNewPage, fields);
    } else {
      const page = { id: lsNextId++, off: false, blank: true, mode: 'page', ...fields };
      lsPages.push(page);
      lsActive = page.id;
    }
    lsRender();
    lsNewClose();
  }

  function lsDescriptionShow(show) {
    lsSeoDescriptionField.hidden = !show;
    lsSeoDescriptionAdd.hidden = show;
    lsSeoDescriptionAdd.setAttribute('aria-expanded', show);
  }
  lsSeoDescriptionAdd.addEventListener('click', () => {
    lsDescriptionShow(true);
    lsNewSeoDescription.focus();
  });
  lsNew.addEventListener('click', (e) => {
    if (e.target.closest('[data-pe-clear-description]')) {
      lsNewSeoDescription.value = '';
      lsDescriptionShow(false);
      lsSeoDescriptionAdd.focus();
    }
    if (e.target.closest('[data-pe-clear], .pe__reset')) {
      lsNewSeoDescription.value = '';
      lsDescriptionShow(false);
    }
    if (e.target.closest('.pe__reset')) {
      lsAccessClose();
      lsAccessSelect(lsAccessMenu.querySelector('[data-access="public"]'));
    }
  });

  // Чипс и крестик SEO, название и кнопки шапки — PropertyEditor из ui-kit
  const lsNewEditor = PropertyEditor.mount(lsNew, { onChange: lsNewSync, onDone: lsNewSave, onClose: lsNewClose });

  $('#lsAdd').addEventListener('click', lsNewOpen);
  // пустое название показываем как имя по умолчанию, при возврате в поле его можно сразу перепечатать
  lsNewName.addEventListener('blur', () => { if (!lsNewName.value.trim()) lsNewName.value = LS_NEW_NAME; });
  lsNewName.addEventListener('focus', () => { if (lsNewName.value === LS_NEW_NAME) lsNewName.select(); });
  lsNewName.addEventListener('keydown', (e) => { if (e.key === 'Enter') lsNewSave(); });
  lsNewSeoTitle.addEventListener('input', () => { lsNewSeoEdited = true; });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!lsAccessMenu.hidden) { lsAccessClose(); lsAccess.focus(); }
    else lsNewClose();
  });

  // Клик мимо окна настроек страницы закрывает его без сохранения, как крестик. «+» и меню «⋮» окно открывают сами
  document.addEventListener('mousedown', (e) => {
    if (!lsNew.hidden && !e.target.closest('#lsNew, #lsAdd, #lsMenu, #confirm')) lsNewClose();
  });

  // Клик мимо закрывает меню и сохраняет название.
  stage.addEventListener('mousedown', (e) => {
    if (lsMenuPage != null && !e.target.closest('#lsMenu, [data-cmd="more"]')) lsCloseMenu();
    if (lsEditing && !lsEditing.row.contains(e.target)) lsFinishRename(true);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lsCloseMenu(); });

  // «Страница каталога» и «Страница товара» в группе «Электронное меню» «Параметров сайта» (как в dynamic-pages).
  // Ссылка «Выберите страницу»: если страница на сайте одна, клик сразу ставит её; если несколько — радиоменю со страницами (как «Доступ»).
  // Меню одно на оба свойства, pagePickBtn — кнопка, из которой оно открыто. Выбор пока ни на что не влияет.
  // Та же разметка — на вкладке «Данные» реестра (registry/index.html), там список страниц демо.
  const pagePickBtns = () => document.querySelectorAll('[data-page-pick]');
  const pagePickMenu = $('#pagePickMenu');
  const pagePicks = { catalog: null, product: null }; // id выбранной страницы по свойству
  const componentPicks = new Map();
  function picksFor(id) {
    if (id === 'restaurant') return pagePicks;
    if (!componentPicks.has(id)) componentPicks.set(id, { catalog: null, product: null });
    return componentPicks.get(id);
  }
  const pickComponent = (btn) => btn.closest('.sales-settings')?.dataset.comp ?? 'restaurant';
  let pagePickBtn = null;
  function pagePickRender() {
    for (const btn of pagePickBtns()) {
      const pagePicks = picksFor(pickComponent(btn));
      const kind = btn.dataset.pagePick;
      if (pagePicks[kind] != null && !lsPage(pagePicks[kind])) pagePicks[kind] = null; // выбранную страницу удалили
      btn.textContent = lsPage(pagePicks[kind])?.name ?? 'Выберите';
    }
  }
  // Страницы по умолчанию привязаны в компоненте: при подключении «Электронного меню» каталог — страница с каталогом
  // («Меню», а если каталог стоит на главной — «Главная»), товар — карточка («Карточка блюда»). Уже выбранное не трогаем
  // У остальных компонентов — их страницы из COMP (catalog, product), например «Каталог услуг» и «Карточка услуги»
  function pagePickDefaults(id) {
    const pagePicks = picksFor(id);
    const own = (name) => lsPages.find((p) => p.comp === id && p.name === name);
    const catalogPage = id === 'restaurant' ? lsPages.find((p) => p.menu) ?? (catalogAdded ? lsPages.find((p) => p.home) : null) : own(COMP[id].catalog);
    const productPage = id === 'restaurant' ? lsPages.find((p) => p.comp === id && p.product) ?? lsPages.find((p) => p.product) : own(COMP[id].product);
    if (pagePicks.catalog == null && catalogPage) pagePicks.catalog = catalogPage.id;
    if (pagePicks.product == null && productPage) pagePicks.product = productPage.id;
  }
  function pagePickSet(btn, id) {
    picksFor(pickComponent(btn))[btn.dataset.pagePick] = id;
    pagePickRender();
  }
  function pagePickClose() {
    pagePickMenu.hidden = true;
    for (const btn of pagePickBtns()) btn.setAttribute('aria-expanded', 'false');
  }
  stage.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-page-pick]');
    if (!btn) return;
    const pagePicks = picksFor(pickComponent(btn));
    const kind = btn.dataset.pagePick;
    const wasOpen = !pagePickMenu.hidden && pagePickBtn === btn;
    pagePickClose();
    if (wasOpen) return;
    if (lsPages.length === 1) { pagePickSet(btn, lsPages[0].id); return; }
    pagePickBtn = btn;
    const list = $('.mw-menu__list', pagePickMenu);
    list.replaceChildren(...lsPages.map((page) => {
      const on = page.id === pagePicks[kind];
      const item = el('button', 'mw-menu__item ls-mode__item' + (on ? ' is-selected' : ''), '<span class="ls-mode__toggle"></span><span class="mw-menu__text"></span>');
      item.type = 'button';
      item.setAttribute('role', 'menuitemradio');
      item.setAttribute('aria-checked', on);
      item.dataset.pageId = page.id;
      $('.mw-menu__text', item).textContent = page.name;
      return item;
    }));
    // первый пункт — на уровне ссылки, маркер левее текста, как у «Доступа»
    const r = stageRect(btn);
    const box = stageRect(pagePickMenu.parentElement); // окно «Параметры сайта» или «Параметры» публикации
    pagePickMenu.style.left = Math.round(r.left - box.left - 30) + 'px';
    pagePickMenu.style.top = Math.round(r.top + r.height / 2 - box.top - 22) + 'px';
    pagePickMenu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
  });
  pagePickMenu.addEventListener('click', (e) => {
    const item = e.target.closest('[data-page-id]');
    if (item) pagePickSet(pagePickBtn, Number(item.dataset.pageId));
    if (item || e.target.closest('#pagePickClose')) pagePickClose();
  });
  document.addEventListener('mousedown', (e) => { if (!e.target.closest('#pagePickMenu, [data-page-pick]')) pagePickClose(); });

  // Сценарии панели — состояния страницы. «Новая страница»: открытая новая страница (или последняя, или созданная заново) получает режим сценария.
  // Остальные возвращают исходные страницы и каталог, подсказка на плюсе — только в «Создании окна с товаром».
  // «Связь кнопки с окном» — продолжение «Создания окна»: окно с карточкой товара уже есть, открыта секция с кнопкой на «Меню».
  function scenApply(scenario, mode) {
    popupsClose();
    lsNewClose();
    lsCloseMenu();
    lsFinishRename(false);
    lsList.replaceChildren();
    if (scenario === 'new') {
      // страницы других сценариев (fixed) сюда не переходят: остаются только свои
      lsPages = lsPages.filter((p) => !p.fixed);
      lsCardPageId = null;
      const active = lsPage(lsActive) ?? {};
      let page = active.blank ? active : lsPages.findLast((p) => p.blank);
      if (!page) {
        page = { id: lsNextId++, name: LS_NEW_NAME, off: false, blank: true };
        lsPages.push(page);
      }
      page.mode = mode;
      lsActive = page.id;
    } else {
      // Сценарии компонентов начинаются с одной главной: страницы приходят с компонентами
      const isComp = ['catalog-add', 'catalog-setup'].includes(scenario);
      lsPages = isComp ? lsInitialPages().filter((p) => p.home) : lsInitialPages();
      lsActive = isComp ? 1 : 2;
      lsCardPageId = null;
      compOn.clear();
      componentSales.clear();
      componentPicks.clear();
      pagePicks.catalog = pagePicks.product = null;
      pagePickClose();
      sitePlaceCatalog();
      if (scenario === 'catalog-setup') {
        const page = (name, extra) => ({ id: lsNextId++, name, off: false, mode: 'page', fixed: true, ...extra });
        lsPages.push(page('О нас', { about: true }), page('Профиль', { blank: true, compWidget: 'Профиль покупателя' }));
        salesSaved = [];
        if (tplOpening) {
          const menu = page('Меню', { menu: true, group: 'restaurant' });
          const product = page('Карточка товара', { blank: true, product: true, key: true, group: 'restaurant' });
          lsPages.push(menu, product);
          compOn.add('restaurant');
          pagePicks.catalog = menu.id;
          pagePicks.product = product.id;
        } else {
          catalogHomeSet(true);
          catalogAdded = false;
          siteCatalogShow(false);
          compConnect('delivery');
          pagePickDefaults('delivery');
        }
      } else if (isComp) {
        catalogHomeSet(true);
        catalogAdded = false;
        salesSaved = [];
        siteCatalogShow(false);
      }
      salesRender();
      pagePickRender();
      if (scenario === 'window-link') lsPages.push({ id: lsNextId++, name: 'Товар', off: false, blank: true, mode: 'window', product: true, fixed: true });
      if (scenario.startsWith('ext-')) lsAddCardPage();
    }
    if (scenario === 'window-create') $('#lsAdd').append(lsAddPin);
    else lsAddPin.remove();
    lsRender();
    const isLink = scenario === 'window-link' || scenario === 'ext-link';
    const extAt = scenario === 'ext-added' ? mode ?? 'float' : null; // где стоит добавленный внешний виджет
    siteLinkSelect(isLink);
    for (const section of [siteSection, siteLink]) section.classList.remove('is-active'); // выделение секции из прошлого сценария не переносится
    siteExtWidget.classList.toggle('is-active', extAt === 'section');
    const extPageMode = scenario === 'ext-page' ? mode ?? 'page' : null;
    siteFloatRemove();
    if (extAt === 'float' || extPageMode) siteFloatAdd();
    else if (scenario === 'ext-link') lsAddFloatPage();
    extPickerClose();
    btnSetReset();
    fbScenarioReset();
    shopFeedbackSync();
    scenScroll();
    if (isLink) btnSetOpen();
    if (extPageMode) {
      lsPage(lsFloatPageId).mode = extPageMode;
      lsActive = lsFloatPageId;
      lsRender();
    }
  }
  // Сценарий открывается на своём виджете
  function scenScroll() {
    const { scenario, variant } = stage.dataset;
    if (scenario === 'window-link' || scenario === 'ext-link') siteLinkScroll();
    else if (scenario === 'ext-added' && variant === 'section') siteContent.scrollTop += stageRect(siteExt).top - stageRect(siteContent).top - 60;
    else if (scenario.startsWith('ext-') && scenario !== 'ext-page') siteScrollEnd();
    else siteContent.scrollTop = 0;
  }
  // Панель показывает новый сценарий, а состояние на сцене уже готово
  function scenSet(scenario, variant) {
    scenSyncing = true;
    frame.select(scenario, variant);
    scenSyncing = false;
    extPinSync();
    shopFeedbackSync();
  }

  // Панель показывает состояние открытой страницы, как бы та ни открылась: из списка, после сохранения или удаления.
  function scenSync() {
    const page = lsPage(lsActive);
    const keepScenario = ['sites', 'catalog-add', 'catalog-setup', 'window-link', 'ext-add', 'ext-added', 'ext-page', 'ext-link'].includes(stage.dataset.scenario);
    // страницы сценария с готовой карточкой (fixed) — не новые
    const isNew = page.blank && !page.fixed;
    const scenario = isNew ? 'new' : keepScenario ? stage.dataset.scenario : 'window-create';
    const mode = isNew || (scenario === 'ext-page' && page.feedback) ? page.mode : keepScenario ? frame.value.variant : null;
    if (scenario === frame.value.scenario && mode === frame.value.variant) return;
    scenSyncing = true;
    frame.select(scenario, mode);
    scenSyncing = false;
  }

  // ---------- Просмотр шаблона сайта ----------
  // Шаблон «Электронного меню» с панели «Шаблоны» реестра открывается на весь экран: шапка, панель страниц и сайт.
  // Сайт — «Мили» из сценария «В конструкторе», каталог у всех шаблонов один; разные только шапка сайта и баннер
  // (.stage[data-tpl] в styles.css). Просмотр — тот же конструктор без правки: правой панели, команд правки и ховера виджетов нет.
  // «Использовать» снимает только просмотр: шаблон остаётся, экран становится обычным конструктором.
  const chTitle = $('.ch-title');
  let chTitleText = ''; // название сайта в шапке до просмотра: крестик его возвращает
  const TPL_NAV = ['Главная', 'О нас', 'Профиль', 'Меню']; // страницы сайта, как в конструкторе; «Карточка товара» в меню не выводится
  const TPL_TG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.4 4.3 2.9 11.4c-1.1.4-1.1 1.6 0 1.9l4.6 1.5 1.8 5.5c.2.7 1.1.9 1.6.4l2.6-2.4 4.6 3.4c.6.4 1.4.1 1.6-.6l3.1-14.8c.2-1-.7-1.7-1.4-1.4Zm-11.8 10 8.7-6.6-7 7.7-.3 3.1-1.4-4.2Z"/></svg>';
  for (const header of document.querySelectorAll('.site-header')) {
    header.append(
      el('nav', 'tpl-nav', TPL_NAV.map((name) => `<span>${name}</span>`).join('')),
      el('div', 'tpl-head',
        '<span class="tpl-head__phone"><span class="tpl-head__ico" aria-hidden="true">&#xe636;</span>+7 (4852) 11-22-33</span>' +
        '<span class="tpl-head__soc tpl-head__soc--vk" aria-label="ВКонтакте">VK</span>' +
        `<span class="tpl-head__soc" aria-label="Телеграм">${TPL_TG}</span>` +
        '<span class="tpl-head__bal">120 ₽</span><span class="tpl-head__ava">АС</span>'));
  }
  // Баннеры — Figma QJ9NRz32bhm1BUkVGsuti0 1453:3499 (Banner / restaurant / 1601, 1605, 1606); фото у каждого шаблона своё, ставит CSS
  $('.wg__content', siteMain.querySelector('.site-banner')).append(el('div', 'tpl-banner',
    '<span class="tpl-banner__img"></span>' +
    '<div class="tpl-banner__text"><span class="tpl-banner__tags">Боулы · Салаты · Закуски</span>' +
    '<span class="tpl-banner__title">Ресторан Мили</span><span class="tpl-banner__lead">Авторская кухня – прямиком к вашему столу</span></div>'));
  // Каталог шаблона — как на превью шаблонов: сайт без данных, поэтому демоданные (те же фото, что у демо-каталогов реестра).
  // Плитки разделов, раздел с подразделом, карточки с ценой в плашке. Встаёт в виджет каталога вместо его содержимого
  const TPL_DEMO = 'assets/img/site/demo/';
  const TPL_CATALOG = [
    ['Кофе и напитки', [['Кофе', [['Матча-латте', '280', 1], ['Эспрессо', '150', 3]]], ['Холодные', [['Лимонад', '180', 5]]]]],
    ['Десерты', [['Сладкое', [['Панна-котта', '240', 4], ['Капкейк с клубникой', '190', 6]]]]],
    ['Кухня', [['Паста', [['Паста с овощами', '420', 2]]]]],
  ];
  const tplCard = ([name, price, img]) =>
    `<div class="tpl-card"><img src="${TPL_DEMO}dish-${img}.jpg" alt=""><div class="tpl-card__name">${name}</div>` +
    `<div class="tpl-card__foot"><span class="tpl-card__buy">${price} ₽<span class="tpl-card__plus" aria-hidden="true">+</span></span></div></div>`;
  $('.wg__content', siteCatalog).append(el('div', 'tpl-catalog',
    '<div class="tpl-catalog__find">Найти</div>' +
    `<div class="tpl-catalog__cats">${TPL_CATALOG.map(([name, groups]) =>
      `<div class="tpl-catalog__cat"><img src="${TPL_DEMO}dish-${groups[0][1][0][2]}.jpg" alt=""><span>${name}</span></div>`).join('')}</div>` +
    TPL_CATALOG.map(([name, groups]) => `<div class="tpl-catalog__h">${name}</div>` +
      groups.map(([sub, items]) => `<div class="tpl-catalog__sub">${sub}</div><div class="tpl-catalog__cards">${items.map(tplCard).join('')}</div>`).join('')).join('')));

  function tplOpen(n, name, kind) {
    tplOpening = true;
    frame.select('catalog-setup'); // сайт собран, как «В конструкторе»; реестр прячется
    tplOpening = false;
    stage.classList.add('is-tpl', 'is-tpl-view');
    stage.dataset.tpl = n;
    stage.dataset.tplKind = kind || 'menu'; // набор шаблонов: у отеля свои баннеры (styles.css)
    chTitleText = chTitle.textContent;
    chTitle.textContent = name || 'Шаблон';
    const home = lsPages.find((p) => p.home);
    // В шаблоне каталог использует демоданные, как в превью.
    salesRender();
    lsActive = home.id;
    siteShown = null;
    lsRender();
    siteContent.scrollTop = 0;
  }
  function tplClose() {
    if (!stage.classList.contains('is-tpl')) return;
    tplSite = null;
    stage.classList.remove('is-tpl', 'is-tpl-view');
    delete stage.dataset.tpl;
    delete stage.dataset.tplKind;
    chTitle.textContent = chTitleText;
    pubClose(); // окно «Параметры» шаблона — до следующего «Использовать», параметры сайта возвращаются на место
  }
  // В меню шапки сайта подчёркнута открытая страница
  function tplNavSync(page) {
    if (!stage.classList.contains('is-tpl')) return;
    for (const item of document.querySelectorAll('.tpl-nav span')) item.classList.toggle('is-on', item.textContent === page.name);
  }
  $('#chUse').addEventListener('click', () => stage.classList.remove('is-tpl-view'));

  // Боковая панель и окно публикации используют один мастер параметров.
  // Пустой адрес сайта при первом открытии получает случайный набор букв (слоги «согласная + гласная», как vobara)
  const pubRand = () => {
    const c = 'bvgdzklmnprstf', v = 'aeiou';
    let s = '';
    for (let i = 0; i < 3; i++) s += c[Math.floor(Math.random() * c.length)] + v[Math.floor(Math.random() * v.length)];
    return s;
  };
  function pubOpen() {
    rsCloseParams();
    const addr = $('.rs-site .dom__text', rsParams);
    if (addr && !addr.value) { addr.value = pubRand(); addr.dispatchEvent(new Event('input', { bubbles: true })); }
    pub.hidden = false;
    moveParamsFrame(pubBody);
    showConstructorParams();
  }
  function pubClose() {
    if (pub.hidden) return;
    pub.hidden = true;
    pub.classList.remove('is-overlay-open');
    moveParamsFrame(rsParams, $('.rs-params__body', rsParams));
  }
  $('#chPublish').addEventListener('click', () => (pub.hidden ? pubOpen() : pubClose()));
  $('#pubClose').addEventListener('click', pubClose);
  // «Опубликовать» в окне: конструктор закрывается, в реестре — карточка созданного сайта (вкладка «Параметры»)
  // и окно «Домен будет создан…» (registry/index.html, reg:publish-site). Адрес — из поля окна, проверки нет
  $('.pub__publish', pub).addEventListener('click', () => {
    // «Мили» уже в реестре: публикуются правки — назад на её карточку, как по галочке
    // домен на карточке — из окна, сайт опубликован
    if (!stage.classList.contains('is-tpl')) {
      pubClose();
      regToCard = true;
      regState = regParams(true);
      frame.select('sites');
      return;
    }
    tplToRegistry(true);
  });
  /* Сайт из шаблона — в реестр: плитка и карточка нового сайта (registry/index.html, reg:publish-site).
     publish — «Опубликовать» в окне: карточка на «Параметрах» и окно «Домен будет создан…»;
     иначе галочка: карточка на «Страницах», домен и всё остальное — как в «Параметрах сайта» (не подключён — сайт не опубликован).
     Адрес — из поля домена, проверки нет */
  function tplToRegistry(publish) {
    const dom = $('.rs-site [data-domain]');
    const name = $('.dom__text', dom).value.trim() || pubRand();
    const link = dom.classList.contains('dom--saby') ? name + $('.dom__zone', dom).textContent : name;
    ExtraComponents.copy(extraComponentSite(), link);
    for (const component of ['restaurant', 'services']) {
      CompCatalog.setPrice(link, component, CompCatalog.getPrice(extraComponentSite(), component));
    }
    const params = regParams(publish);
    if (params.domain) params.domain.value = name;
    // точки продаж — те, что настроены в «Параметрах сайта» конструктора (в шаблоне их нет)
    regPublish = { link, title: chTitle.textContent, tpl: Number(stage.dataset.tpl) || 1, kind: stage.dataset.tplKind || 'menu',
      points: params.points, params, save: !publish };
    tplSite = null;
    frame.select('sites');
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') pubClose(); });
  // «Настройки» в правой панели открывают параметры на их обычном месте
  for (const b of document.querySelectorAll('.rp-btn[data-rp="settings"]')) b.addEventListener('mousedown', pubClose);

  lsSetCollapsed(lsReadCollapsed());
  scenApply(stage.dataset.scenario);
  // старт — «Реестр сайтов» поверх собранного конструктора
  // (сборка могла переключить панель на «В конструкторе» через scenSync — возвращаем)
  if (frame.value.scenario !== 'sites') frame.select('sites');
  if (stage.dataset.scenario !== 'sites') { stage.dataset.scenario = 'sites'; regShow(true); }
  // каталог выше секции с кнопкой дорисовывается вместе с картинками
  window.addEventListener('load', () => {
    if (!['window-link', 'ext-add', 'ext-added', 'ext-link'].includes(stage.dataset.scenario)) return;
    scenScroll();
    if (!btnSet.hidden) btnSetPlace();
  });
})();
