(() => {
  'use strict';

  // ---------- DOM ----------
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
  // disabled — сценарий пока не сделан
  const frame = DemoFrame.mount({
    stage,
    head: { title: 'Попапы' },
    devices: [
      { id: 'laptop', icon: 'laptop', label: 'Ноутбук', disabled: true },
      { id: 'monitor', icon: 'monitor', label: 'Монитор', size: '1600х900', name: 'монитор' },
    ],
    device: 'monitor',
    scenarios: [
      { group: 'Работа с каталогом', items: [
        { id: 'no-catalog', title: 'Без каталога' },
        { id: 'catalog-add', title: 'Добавление каталога', disabled: true },
        { id: 'catalog-setup', title: 'Настройка каталога', disabled: true },
        { id: 'product-card', title: 'Карточка товара', disabled: true },
      ] },
      { group: 'Работа с окнами/страницами', items: [
        { id: 'window-create', title: 'Создание окна с товаром', disabled: true },
        { id: 'window-setup', title: 'Настройки окна', disabled: true },
        { id: 'window-switch', title: 'Переключение страница-окно', disabled: true },
        { id: 'window-link', title: 'Связь кнопки с окном', disabled: true },
      ] },
      { group: 'Режим просмотра', items: [
        { id: 'view-catalog', title: 'В каталоге и по кнопке', disabled: true },
      ] },
      { group: 'Внешние виджеты', items: [
        { id: 'ext-float', title: 'С плавающей кнопкой', disabled: true },
        { id: 'ext-button', title: 'На обычной кнопке', disabled: true, variants: [
          { id: 'add', title: 'Добавление окна' },
          { id: 'widget', title: 'Окно с виджетом' },
          { id: 'link', title: 'Связь с окном' },
        ] },
        { id: 'ext-body', title: 'В теле страницы', disabled: true },
      ] },
    ],
    team: [
      { label: 'Design', name: 'Пахтусова Ирина', links: [
        { title: 'Разработка макета', href: 'https://tensor.saby.ru/opendoc.html?guid=01a10b9e-d00c-7be9-9307-91f4f08a3298&client=3' },
      ] },
      { label: 'Develop' },
    ],
    value: { scenario: stage.dataset.scenario },
    onScale: (s) => { scale = s; },
    onChange: ({ scenario }) => {
      stage.dataset.scenario = scenario;
      rsCloseParams();
    },
  });

  // Панель сценариев: demo-frame даёт один уровень групп, разделы «Окна» и «Внешние виджеты» со сворачиванием,
  // переключатель «Точки» и статус показа добавляем поверх его разметки.
  const scenCard = $('.df-card--scen', frame.panel);
  const scenGroups = [...scenCard.querySelectorAll('.df-group')];

  function scenSection(title, nodes) {
    const head = el('button', 'pop-sec__head', `<span>${title}</span><span class="ico pop-sec__arrow">&#xE9AA;</span>`);
    head.type = 'button';
    const body = el('div', 'pop-sec__body');
    body.append(...nodes);
    head.addEventListener('click', () => {
      body.hidden = !body.hidden;
      head.querySelector('.pop-sec__arrow').innerHTML = body.hidden ? '&#xE9C2;' : '&#xE9AA;';
    });
    const section = el('div', 'pop-sec');
    section.append(head, body);
    return section;
  }

  const groupNodes = (g) => [g, g.nextElementSibling];
  for (const g of scenGroups) g.classList.add('pop-sub');
  const scenLast = scenGroups[3];
  const scenLastOptions = scenLast.nextElementSibling;
  scenLast.remove(); // заголовок группы становится заголовком раздела
  scenCard.append(
    scenSection('Окна', scenGroups.slice(0, 3).flatMap(groupNodes)),
    scenSection('Внешние виджеты', [scenLastOptions]),
  );

  // «Точки» — подсказки клика в сценариях; пока только состояние на сцене
  const hints = el('span', 'pop-hints', 'Точки<button class="rp-switch is-on" type="button" role="switch" aria-checked="true" aria-label="Точки"></button>');
  scenGroups[0].append(hints);
  hints.querySelector('button').addEventListener('click', (e) => {
    const on = e.currentTarget.classList.toggle('is-on');
    e.currentTarget.setAttribute('aria-checked', on);
    stage.classList.toggle('no-hints', !on);
  });

  $('.df-team', frame.panel).before(el('div', 'pop-status', '<span class="ico24">&#xE651;</span>Не показывали'));

  function stageRect(node) {
    const s = stage.getBoundingClientRect();
    const r = node.getBoundingClientRect();
    return { left: (r.left - s.left) / scale, top: (r.top - s.top) / scale, width: r.width / scale, height: r.height / scale };
  }

  // ---------- Правый сайдбар (Figma WHZ4ZSm4wRMrxQPWqEk5Wk 148:15451) ----------
  // Вписан в страницу, по умолчанию открыт «Магазин». Клик по иконке переключает панель, повторный — сворачивает до тулбара.
  // «Настройки» открывают окно поверх контента без вписанной панели; закрытие окна возвращает панель.
  // «Структура», «Стиль», «Шрифт» пока только с ховером: их панелей в макете нет.
  const rsParams = $('#rsParams');
  let rsPanel = 'shop';    // открытая панель или null
  let rsParamsOpen = false;

  function rsRender() {
    stage.classList.toggle('is-rs-closed', !rsPanel || rsParamsOpen);
    for (const name of ['shop', 'data']) $('#rs-' + name).hidden = name !== rsPanel || rsParamsOpen;
    rsParams.hidden = !rsParamsOpen;
    for (const b of document.querySelectorAll('.rp-btn[data-rp]')) {
      const on = rsParamsOpen ? b.dataset.rp === 'settings' : b.dataset.rp === rsPanel;
      b.classList.toggle('is-active', on);
    }
  }

  function rsCloseParams() {
    if (!rsParamsOpen) return;
    rsParamsOpen = false;
    rsRender();
  }

  for (const b of document.querySelectorAll('.rp-btn[data-rp]')) {
    b.addEventListener('click', () => {
      const name = b.dataset.rp;
      if (name === 'settings') rsParamsOpen = !rsParamsOpen;
      else if (rsParamsOpen) { rsParamsOpen = false; rsPanel = name; }
      else rsPanel = rsPanel === name ? null : name;
      rsRender();
    });
  }
  $('#rsParamsClose').addEventListener('click', rsCloseParams);
  stage.addEventListener('mousedown', (e) => {
    if (rsParamsOpen && !e.target.closest('#rsParams, .rp-btn')) rsCloseParams();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') rsCloseParams(); });

  // «Магазин»: статика с ховером
  $('#rsSmall').innerHTML = ['E6D3', 'EAC3', 'EAEE', 'EA80'].map((g) => `<div class="rs-cell"><span class="ico24">&#x${g};</span></div>`).join('');
  const SHOP_ITEMS = [
    ['EAC9', 'Текст'], ['EBD3', 'Заголовок'], ['E9A3', 'Изображение'], ['E929', 'Видео'], ['E739', 'Файл'],
    ['EB7E', 'Отправить ответ'], ['E6CC', 'Таблица'], ['E63D', 'Наименование'], ['EA5F', 'Заказать'],
  ];
  // пустая ячейка держит «Заказать» в ширину половины ряда
  $('#rsMedium').innerHTML = SHOP_ITEMS.map(([g, t]) => `<div class="rs-item"><span class="ico">&#x${g};</span>${t}</div>`).join('') + '<div class="rs-item rs-item--empty"></div>';
  // [название, описание, высота, картинка, белая подложка, положение картинки из макета]
  const COVER = 'inset:0;width:100%;height:100%;object-fit:cover';
  const CONTAIN = 'inset:0;width:100%;height:100%;object-fit:contain';
  const SHOP_WIDGETS = [
    ['Каталог', 'Виджет товаров и услуг, доступных в вашем заведении', 304, 'catalog', false, COVER],
    ['Корзина', 'Для хранения выбранных товаров, расчета итоговой стоимости и быстрого перехода к оформлению заказа', 231, 'cart', true, CONTAIN],
    ['Мои контакты', 'Закрепите контакты для быстрого доступа, звоните и пишите коллегам в один клик', 267, 'contacts', false, 'left:-8.18%;top:-16.06%;width:110.98%;height:126.28%'],
    ['Список страниц', 'Позволяет редактировать и настраивать страницы', 190, 'pages', false, 'left:-13.21%;top:-23.68%;width:121.23%;height:137.37%'],
    ['Текстовый виджет', 'Позволяет редактировать и просматривать текст', 159, 'text', false, 'left:-1.18%;top:-5.37%;width:104.72%;height:110.07%'],
    ['Уведомления', 'Виджет для отображения уведомлений по категориям', 267, 'notifications', false, 'left:-2.12%;top:-3.35%;width:105.66%;height:107.43%'],
  ];
  $('#rsWidgets').innerHTML = SHOP_WIDGETS.map(([name, desc, h, img, white, pos]) =>
    `<div class="rs-w" style="height:${h}px"><div><div class="rs-w__name">${name}</div><div class="rs-w__desc">${desc}</div></div>` +
    `<div class="rs-w__pv${white ? ' rs-w__pv--white' : ''}" data-widget="${img}"><div class="rs-w__img"><img src="assets/img/shop/${img}.png" alt="" style="${pos}"></div><span class="ico24 rs-w__plus">&#xEAE9;</span></div></div>`).join('');

  // Виджет на фрейме: клик по «Каталогу» в магазине ставит его вместо пустой секции и выделяет,
  // каталог пропадает из магазина, появляется страница «Карточка товара». Удаление виджета возвращает всё обратно.
  // Выделение — .is-active у .wg: снимается кликом мимо, клик по виджету ставит снова. «Удалить» в тулбаре возвращает пустую секцию.
  const siteSection = $('#siteSection');
  const siteCatalog = $('#siteCatalog');

  const shopCatalog = $('#rsWidgets [data-widget="catalog"]').closest('.rs-w');

  function siteAddCatalog() {
    shopCatalog.hidden = true;
    lsAddCardPage();
    siteSection.hidden = true;
    siteCatalog.hidden = false;
    siteCatalog.classList.add('is-active');
  }
  function siteRemoveCatalog() {
    shopCatalog.hidden = false;
    lsRemoveCardPage();
    siteCatalog.hidden = true;
    siteCatalog.classList.remove('is-active');
    siteSection.hidden = false;
  }

  $('#rsWidgets').addEventListener('click', (e) => {
    if (e.target.closest('[data-widget="catalog"]')) siteAddCatalog();
  });
  $('#siteCatalogDelete').addEventListener('click', siteRemoveCatalog);
  stage.addEventListener('mousedown', (e) => {
    if (siteCatalog.hidden) return;
    siteCatalog.classList.toggle('is-active', !!e.target.closest('#siteCatalog'));
  });

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
  // сценарий «Без каталога» — страница «Меню»
  let lsPages = [{ id: 1, name: 'Главная', off: false }, { id: 2, name: 'Меню', off: false }];
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
    stage.classList.toggle('is-ls-collapsed', collapsed);
    stage.classList.remove('is-ls-open');
    $('#lsToggleIco').innerHTML = collapsed ? '&#xEBFB;' : '&#xEBFA;';
    lsToggle.setAttribute('aria-label', collapsed ? 'Закрепить панель' : 'Свернуть панель');
    try { localStorage.setItem(LS_KEY, collapsed ? 'collapsed' : 'pinned'); } catch {}
  }

  function lsRenderLines() {
    lsLines.replaceChildren(...lsPages.map((p) => el('span', 'ls-line' + (p.id === lsActive ? ' is-active' : ''))));
  }

  function lsRender() {
    lsList.replaceChildren(...lsPages.map((p) => {
      const row = el('div', 'ls-item' + (p.id === lsActive ? ' is-active' : '') + (p.off ? ' is-off' : ''),
        '<span class="ls-item__marker"></span><span class="ls-item__name"></span>' +
        '<span class="ls-item__cmds">' +
        `<button class="btn btn--ghost btn--style-label btn--size-m btn--icon ls-cmd ls-cmd--24" type="button" data-cmd="eye" aria-label="${p.off ? 'Показать' : 'Скрыть'}"><span class="btn__icon">${p.off ? '&#xE619;' : '&#xE651;'}</span></button>` +
        '<button class="btn btn--ghost btn--style-label btn--size-m btn--icon ls-cmd" type="button" data-cmd="more" aria-label="Ещё"><span class="btn__icon">&#xE9D9;</span></button>' +
        '</span>');
      row.dataset.id = p.id;
      row.querySelector('.ls-item__name').textContent = p.name;
      // нельзя скрыть все страницы: у последней видимой глазик не срабатывает
      row.querySelector('[data-cmd="eye"]').disabled = !p.off && lsVisibleCount() === 1;
      return row;
    }));
    lsRenderLines();
  }

  // Выбор только переставляет классы: строки остаются на месте, иначе двойной клик не дойдёт до строки.
  function lsSelect(id) {
    lsActive = id;
    for (const row of lsList.children) {
      row.classList.toggle('is-active', Number(row.dataset.id) === id);
    }
    lsRenderLines();
  }

  function lsCloseMenu() {
    if (lsMenuPage == null) return;
    lsMenu.hidden = true;
    lsList.querySelector('.is-menu')?.classList.remove('is-menu');
    lsMenuPage = null;
    lsCollapseIfLeft();
  }

  function lsOpenMenu(id, btn) {
    lsMenuPage = id;
    btn.closest('.ls-item').classList.add('is-menu');
    lsMenu.hidden = false;
    const r = stageRect(btn);
    lsMenu.style.left = Math.round(r.left + r.width / 2 - lsMenu.offsetWidth) + 'px';
    lsMenu.style.top = Math.round(r.top + r.height / 2 - 8 - 14) + 'px';
  }

  function lsStartRename(id) {
    lsFinishRename(true);
    lsSelect(id);
    const page = lsPage(id);
    const row = lsList.querySelector(`[data-id="${id}"]`);
    const input = el('input', 'ls-input');
    input.value = page.name;
    input.setAttribute('aria-label', 'Название страницы');
    const save = el('span', 'ls-save',
      '<button class="btn btn--filled btn--style-pale btn--size-m btn--icon ls-cmd ls-save__ok" type="button" data-save="ok" aria-label="Сохранить"><span class="btn__icon">&#xE75E;</span></button>' +
      '<button class="btn btn--ghost btn--style-label btn--size-m btn--icon ls-cmd ls-cmd--24" type="button" data-save="cancel" aria-label="Отменить"><span class="btn__icon">&#xE66C;</span></button>');
    row.classList.add('is-edit');
    row.querySelector('.ls-item__name').replaceWith(input);
    row.querySelector('.ls-item__cmds').before(save);
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
    if (!lsPages.length) lsPages.push({ id: lsNextId++, name: 'Страница 1', off: false });
    if (id === lsActive) lsActive = lsPages[Math.max(0, at - 1)].id;
    if (!lsVisibleCount()) lsPage(lsActive).off = false; // хотя бы одна страница остаётся видимой
    lsRender();
  }

  // Страница «Карточка товара» создаётся вместе с каталогом и удаляется вместе с ним.
  let lsCardPageId = null;
  function lsAddCardPage() {
    lsCardPageId = lsNextId++;
    lsPages.push({ id: lsCardPageId, name: 'Карточка товара', off: false });
    lsRender();
  }
  function lsRemoveCardPage() {
    if (lsPage(lsCardPageId)) lsDelete(lsCardPageId); // её могли удалить вручную
    lsCardPageId = null;
  }

  // Панель поверх контента закрывается, когда мышь ушла, а меню и переименование закрыты.
  function lsCollapseIfLeft() {
    clearTimeout(lsCloseTimer);
    if (!stage.classList.contains('is-ls-open') || lsRoot.matches(':hover')) return;
    lsCloseTimer = setTimeout(() => {
      if (lsMenuPage == null && !lsEditing && !lsRoot.matches(':hover')) stage.classList.remove('is-ls-open');
    }, 200);
  }

  lsLines.addEventListener('mouseenter', () => {
    clearTimeout(lsCloseTimer);
    stage.classList.add('is-ls-open');
  });
  lsRoot.addEventListener('mouseenter', () => clearTimeout(lsCloseTimer));
  lsRoot.addEventListener('mouseleave', lsCollapseIfLeft);
  lsToggle.addEventListener('click', () => lsSetCollapsed(!stage.classList.contains('is-ls-collapsed')));

  lsList.addEventListener('click', (e) => {
    const row = e.target.closest('.ls-item');
    if (!row) return;
    const id = Number(row.dataset.id);
    const save = e.target.closest('[data-save]');
    if (save) { lsFinishRename(save.dataset.save === 'ok'); return; }
    if (row.classList.contains('is-edit')) return;
    const cmd = e.target.closest('[data-cmd]');
    if (cmd?.dataset.cmd === 'eye') {
      const page = lsPage(id);
      page.off = !page.off;
      lsRender();
    } else if (cmd?.dataset.cmd === 'more') {
      if (lsMenuPage === id) lsCloseMenu();
      else { lsCloseMenu(); lsOpenMenu(id, cmd); }
    } else {
      lsSelect(id);
    }
  });
  lsList.addEventListener('dblclick', (e) => {
    const row = e.target.closest('.ls-item');
    if (row && !e.target.closest('[data-cmd], [data-save]') && !row.classList.contains('is-edit')) lsStartRename(Number(row.dataset.id));
  });
  lsList.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') lsFinishRename(true);
    else if (e.key === 'Escape') lsFinishRename(false);
  });

  lsMenu.addEventListener('click', (e) => {
    const item = e.target.closest('[data-act]');
    if (!item) return;
    const id = lsMenuPage;
    lsCloseMenu();
    if (item.dataset.act === 'rename') lsStartRename(id);
    else lsDelete(id);
  });
  $('#lsMenuClose').addEventListener('click', lsCloseMenu);

  // Клик мимо закрывает меню и сохраняет название.
  stage.addEventListener('mousedown', (e) => {
    if (lsMenuPage != null && !e.target.closest('#lsMenu, [data-cmd="more"]')) lsCloseMenu();
    if (lsEditing && !lsEditing.row.contains(e.target)) lsFinishRename(true);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lsCloseMenu(); });

  lsSetCollapsed(lsReadCollapsed());
  lsRender();
})();
