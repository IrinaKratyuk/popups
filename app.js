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
  DemoFrame.mount({
    stage,
    head: { title: 'Попапы' },
    devices: [
      { id: 'laptop', icon: 'laptop', label: 'Ноутбук', disabled: true },
      { id: 'monitor', icon: 'monitor', label: 'Монитор', size: '1600х900', name: 'монитор' },
    ],
    device: 'monitor',
    scenarios: [{ id: 'demo', title: 'Общее демо' }],
    team: [{ label: 'Design', name: 'Смирнова Мария' }, { label: 'Develop' }],
    value: { scenario: stage.dataset.scenario },
    onScale: (s) => { scale = s; },
    onChange: ({ scenario }) => {
      stage.dataset.scenario = scenario;
      closeRp();
      closeRpMore();
    },
  });

  function stageRect(node) {
    const s = stage.getBoundingClientRect();
    const r = node.getBoundingClientRect();
    return { left: (r.left - s.left) / scale, top: (r.top - s.top) / scale, width: r.width / scale, height: r.height / scale };
  }

  // ---------- Окна правой панели ----------
  // Клик по иконке открывает её окно слева от колонки, повторный — закрывает; открыто одно окно.
  // Закрывают также клик мимо окна и Esc.
  // Верх окна — по верху иконки, высота — по содержимому; data-fit="full" («Магазин») — до низа панели.
  let rpOpen = null;
  const rpBtn = (name) => $(`.rp-btn[data-rp="${name}"]`);

  function openRp(name) {
    const win = $('#rp-' + name);
    closeRp();
    if (!win) return;
    rpOpen = name;
    const btn = rpBtn(name);
    btn.classList.add('is-active');
    win.hidden = false;
    win.style.top = Math.round(stageRect(btn).top) + 'px';
    win.style.bottom = win.dataset.fit === 'full' ? '8px' : '';
  }

  function closeRp() {
    if (!rpOpen) return;
    closeRpMenu();
    $('#rp-' + rpOpen).hidden = true;
    rpBtn(rpOpen).classList.remove('is-active');
    rpOpen = null;
  }

  for (const b of document.querySelectorAll('.rp-btn[data-rp]')) {
    b.addEventListener('click', () => (rpOpen === b.dataset.rp ? closeRp() : openRp(b.dataset.rp)));
  }
  stage.addEventListener('mousedown', (e) => {
    if (!rpMenu.hidden && !e.target.closest('#rpMenu, .rp-link')) closeRpMenu();
    if (rpOpen && !e.target.closest('.rp-win, .rp-btn[data-rp], #rpMenu')) closeRp();
  });
  // Esc сначала закрывает выпадающий список, потом окно.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!rpMenu.hidden) closeRpMenu();
    else closeRp();
  });

  // «Магазин»: список категорий (статика с ховером). open — раскрытый раздел, closed — свёрнутый, child — подраздел.
  const SHOP_CATS = [
    ['Все', 240, 'selected'], ['Секции', 4], ['Навигация', 1], ['Продажи', 32, 'open'],
    ['Каталог и цены', 7, 'child'], ['Розница', 10, 'child'], ['Presto', 2, 'child'], ['Saby Clients', 1, 'child'], ['Документы продаж', 6, 'child'],
    ['Отчетность', 7, 'closed'], ['Базовые возможности', 9, 'closed'], ['Документооборот', 5, 'closed'], ['Управление персоналом', 26, 'closed'],
    ['Бухгалтерия и зарплата', 40, 'closed'], ['Деньги', 5], ['Торги', 13], ['Компании', 9], ['Маркетинг', 6],
    ['CRM и контакт центр', 32, 'closed'], ['Задачи и проекты', 6], ['Корпоративная соцсеть', 21, 'closed'], ['Видеонаблюдение', 1],
    ['Управление транспортом', 6], ['Сайт', 21, 'closed'],
  ];
  const ARROWS = { open: '&#xE9AA;', closed: '&#xE9C2;' };
  $('#rpCats').innerHTML = SHOP_CATS.map(([name, count, kind]) =>
    `<div class="rp-cat${kind === 'child' ? ' rp-cat--child' : ''}${kind === 'selected' ? ' is-selected' : ''}">` +
    `<span class="ico rp-cat__arrow">${ARROWS[kind] ?? ''}</span><span class="rp-cat__name">${name}</span><span class="rp-cat__count">${count}</span></div>`).join('');

  // Карточки на картинке превью (координаты из макета 16041:48565): [x, y, ширина, высота, большая — с «+»].
  const SHOP_WIDGETS = [
    [12, 35, 75.5, 32], [95.5, 35, 75.5, 32], [179, 35, 75.5, 32], [262.5, 35, 75.5, 32], // секции
    [12, 108, 326, 52, true], // вкладки
    [12, 247, 326, 50, true], [12, 372, 326, 202, true], [12, 634, 326, 50, true], // наценка, номенклатура, остаток
    [12, 759, 326, 202, true], // отчеты
  ];
  $('#rpShopPv').insertAdjacentHTML('beforeend', SHOP_WIDGETS.map(([x, y, w, h, big]) =>
    `<div class="rp-wz" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">${big ? '<span class="ico24 rp-wz__plus">&#xEAE9;</span>' : ''}</div>`).join(''));

  // «Настройки»: переключатель «Информеры» и выпадающие списки «На странице / В окне».
  const informers = $('#rpInformers');
  informers.addEventListener('click', () => {
    const on = !informers.classList.contains('is-on');
    informers.classList.toggle('is-on', on);
    informers.setAttribute('aria-checked', on);
  });

  const rpMenu = $('#rpMenu');
  const rpMenuList = $('#rpMenuList');
  const NOTICE_MODES = ['На странице', 'В окне'];
  let rpMenuLink = null;

  // Как «Состояние панели» в окне «Меню»: выбранный пункт встаёт на место ссылки.
  function openRpMenu(link) {
    rpMenuLink = link;
    rpMenuList.innerHTML = '';
    NOTICE_MODES.forEach((title, i) => {
      const b = el('button', 'mw-menu__item' + (title === link.textContent ? ' is-on' : ''),
        `<span class="mw-menu__dot"></span><span class="mw-menu__text">${title}</span>`);
      b.type = 'button';
      b.addEventListener('click', () => { link.textContent = title; closeRpMenu(); });
      rpMenuList.append(b);
    });
    rpMenu.hidden = false;
    const r = stageRect(link);
    const at = Math.max(0, NOTICE_MODES.indexOf(link.textContent));
    rpMenu.style.left = (r.left - 30) + 'px';
    rpMenu.style.top = (r.top + r.height / 2 - 12 - 16 - at * 38) + 'px';
  }
  function closeRpMenu() { rpMenu.hidden = true; rpMenuLink = null; }

  for (const link of document.querySelectorAll('#rp-settings .rp-link')) {
    link.addEventListener('click', () => (rpMenuLink === link ? closeRpMenu() : openRpMenu(link)));
  }
  $('#rpMenuClose').addEventListener('click', closeRpMenu);

  // «⋮»: меню действий (статика с ховером), крестик меню — ровно поверх «⋮» (крестик: right −14, top 8, 28×28).
  const rpMore = $('#rpMore');
  const rpMoreMenu = $('#rpMoreMenu');
  function openRpMore() {
    rpMoreMenu.hidden = false;
    rpMore.classList.add('is-active');
    const r = stageRect(rpMore);
    rpMoreMenu.style.left = Math.round(r.left + r.width / 2 - rpMoreMenu.offsetWidth) + 'px';
    rpMoreMenu.style.top = Math.round(r.top + r.height / 2 - 8 - 14) + 'px';
  }
  function closeRpMore() { rpMoreMenu.hidden = true; rpMore.classList.remove('is-active'); }
  rpMore.addEventListener('click', () => (rpMoreMenu.hidden ? openRpMore() : closeRpMore()));
  $('#rpMoreClose').addEventListener('click', closeRpMore);
  stage.addEventListener('mousedown', (e) => {
    if (!rpMoreMenu.hidden && !e.target.closest('#rpMoreMenu, #rpMore')) closeRpMore();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !rpMoreMenu.hidden) closeRpMore(); });
})();
