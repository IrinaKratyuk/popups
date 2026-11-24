const PageEditor = (() => {
  const $ = (selector, root) => root.querySelector(selector);
  const closeIcon = new URL('assets/img/close-menu.svg', document.currentScript.src).href;
  const modeTemplate = document.createElement('template');
  modeTemplate.innerHTML = `<div class="pe__row open-mode">
                <span class="pe__label">Способ отображения</span>
                <button class="btn btn--link btn--style-link btn--size-m open-mode__value" type="button" aria-haspopup="menu" aria-expanded="false"></button>
              </div>
        <div class="mw-menu ls-mode open-mode__menu" role="menu" aria-label="Способ отображения" hidden>
          <div class="mw-menu__list">
            <button class="mw-menu__item ls-mode__item" type="button" role="menuitemradio" aria-checked="false" data-mode="window"><span class="ls-mode__toggle"></span><span class="mw-menu__text">В новом окне</span></button>
            <button class="mw-menu__item ls-mode__item" type="button" role="menuitemradio" aria-checked="false" data-mode="page"><span class="ls-mode__toggle"></span><span class="mw-menu__text">На странице</span></button>
            <button class="mw-menu__item ls-mode__item" type="button" role="menuitemradio" aria-checked="false" data-mode="both"><span class="ls-mode__toggle"></span><span class="mw-menu__text">В окне и на странице</span></button>
          </div>
          <button class="mw-menu__close" type="button" aria-label="Закрыть"><img src="${closeIcon}" width="12" height="12" alt=""></button>
        </div>`;
  const fields = document.createElement('template');
  fields.innerHTML = `<div class="pe__body">
          <div class="pe__card ls-new__main">
            <div class="pe__rows">
              <div class="pe__row">
                <span class="pe__label">Адрес</span>
                <span class="ls-new__addr">/<label class="input input--size-l"><span class="input__body"><span class="input__field"><input class="input__control" id="lsNewAddr" aria-label="Адрес страницы"></span></span></label></span>
              </div>
              <div class="pe__row">
                <span class="pe__label">Доступ</span>
                <button class="btn btn--link btn--style-link btn--size-m ls-new__access" type="button" id="lsAccess" aria-haspopup="menu" aria-controls="lsAccessMenu" aria-expanded="false">Без авторизации</button>
              </div>
            </div>
            <button class="ls-new__index" type="button" id="lsNewIndex" role="switch" aria-checked="false"><span>Запретить поисковую индексацию</span><span class="rp-switch"></span></button>
          </div>
          <div class="pe__card">
            <div class="ls-new__seo" data-pe-row="seo" hidden>
              <div class="pe__title"><span>SEO</span><button type="button" class="pe__x" data-pe-clear aria-label="Убрать SEO">&#xe66c;</button></div>
              <div class="ls-new__seo-fields">
                <label class="input ls-new__seo-title"><span class="pe__label">Заголовок</span><span class="input__body"><span class="input__field"><input class="input__control" id="lsNewSeoTitle"></span></span></label>
                <button class="chips chips--size-m" id="lsSeoDescriptionAdd" type="button" aria-expanded="false" aria-controls="lsSeoDescriptionField"><span class="chips__caption">Описание</span></button>
                <div class="ls-new__description" id="lsSeoDescriptionField" hidden>
                  <div class="ls-new__description-head"><label class="pe__label" for="lsNewSeoDescription">Описание</label><button class="pe__x" type="button" data-pe-clear-description aria-label="Убрать описание">&#xe66c;</button></div>
                  <div class="input input--textarea">
                    <span class="input__body"><span class="input__field">
                      <textarea class="input__control" id="lsNewSeoDescription" rows="1" placeholder="Кратко опишите содержание страницы"></textarea>
                    </span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="pe__chips"><button type="button" class="chips chips--optional" data-pe-chip="seo"><span class="chips__caption">SEO</span></button></div>
        </div>
        <div class="mw-menu ls-mode ls-access" id="lsAccessMenu" role="menu" aria-label="Доступ" hidden>
          <div class="mw-menu__list">
            <div class="ls-mode__head">Доступ</div>
            <button class="mw-menu__item ls-mode__item is-selected" type="button" role="menuitemradio" aria-checked="true" data-access="public"><span class="ls-mode__toggle"></span><span class="mw-menu__text">Без авторизации</span></button>
            <button class="mw-menu__item ls-mode__item" type="button" role="menuitemradio" aria-checked="false" data-access="authorized"><span class="ls-mode__toggle"></span><span class="mw-menu__text">Только авторизованным</span></button>
          </div>
          <button class="mw-menu__close" type="button" id="lsAccessClose" aria-label="Закрыть меню доступа"><img src="${closeIcon}" width="12" height="12" alt=""></button>
        </div>`;

  // Координаты меню внутри масштабированной сцены.
  function rect(node, root = node) {
    const box = node.getBoundingClientRect();
    const scale = root.offsetWidth ? root.getBoundingClientRect().width / root.offsetWidth : 1;
    return { left: box.left / scale, top: box.top / scale, height: box.height / scale };
  }
  const outsideHandlers = new WeakMap();
  function outside(button, menu, close) {
    outsideHandlers.set(menu, { button, close });
  }
  document.addEventListener('mousedown', event => {
    document.querySelectorAll('.mw-menu:not([hidden])').forEach(menu => {
      const handler = outsideHandlers.get(menu);
      if (handler && !menu.contains(event.target) && !handler.button.contains(event.target)) handler.close();
    });
  });
  function openModeFill(root, modes, { onOpen, onChange, title, options } = {}) {
    const parts = modeTemplate.content.cloneNode(true);
    const row = $('.open-mode', parts);
    const button = $('.open-mode__value', parts);
    const menu = $('.open-mode__menu', parts);
    // Подпись и список можно задать свои: вид и поведение остаются общими
    if (title) {
      $('.pe__label', row).textContent = title;
      menu.setAttribute('aria-label', title);
    }
    const sample = $('[data-mode]', menu);
    const list = sample.parentNode;
    menu.querySelectorAll('[data-mode]').forEach((item) => { if (options || !modes.includes(item.dataset.mode)) item.remove(); });
    for (const [mode, text] of options ?? []) {
      const item = sample.cloneNode(true);
      item.dataset.mode = mode;
      $('.mw-menu__text', item).textContent = text;
      list.append(item);
    }
    $('[data-open-mode]', root).replaceWith(row);
    root.append(menu);
    const close = () => {
      menu.hidden = true;
      button.setAttribute('aria-expanded', 'false');
    };
    const control = {
      row,
      button,
      close,
      get isOpen() { return !menu.hidden; },
      get mode() { return menu.querySelector('.is-selected').dataset.mode; },
      set(mode) {
        menu.querySelectorAll('[data-mode]').forEach((item) => {
          const on = item.dataset.mode === mode;
          item.classList.toggle('is-selected', on);
          item.setAttribute('aria-checked', on);
          if (on) button.textContent = item.textContent;
        });
      },
    };
    button.addEventListener('click', () => {
      if (!menu.hidden) { close(); return; }
      onOpen?.();
      const r = rect(button, root);
      const box = rect(root);
      menu.hidden = false;
      menu.style.left = Math.round(r.left - box.left - 30) + 'px';
      menu.style.top = Math.round(r.top + r.height / 2 - box.top - 22) + 'px';
      button.setAttribute('aria-expanded', 'true');
    });
    menu.addEventListener('click', (e) => {
      const item = e.target.closest('[data-mode]');
      if (item) {
        control.set(item.dataset.mode);
        onChange?.(item.dataset.mode);
      }
      if (item || e.target.closest('.mw-menu__close')) close();
    });
    outside(button, menu, close);
    return control;
  }
  function mount(lsNew, onChange = () => {}) {
    lsNew.append(fields.content.cloneNode(true));
    const lsNewIndex = $('#lsNewIndex', lsNew);

    // Доступ — настройка прототипа; здесь задаётся состояние страницы, серверной авторизации нет.
    const lsAccess = $('#lsAccess', lsNew);
    const lsAccessMenu = $('#lsAccessMenu', lsNew);
    function lsAccessSelect(item) {
      lsAccessMenu.querySelectorAll('[data-access]').forEach((option) => {
        const selected = option === item;
        option.classList.toggle('is-selected', selected);
        option.setAttribute('aria-checked', selected);
      });
      lsAccess.textContent = item.textContent;
    }
    function lsAccessClose() {
      lsAccessMenu.hidden = true;
      lsAccess.setAttribute('aria-expanded', 'false');
    }
    lsAccess.addEventListener('click', () => {
      if (!lsAccessMenu.hidden) { lsAccessClose(); return; }
      const r = rect(lsAccess, lsNew);
      const box = rect(lsNew);
      lsAccessMenu.style.left = Math.round(r.left - box.left - 30) + 'px';
      lsAccessMenu.style.top = Math.round(r.top + r.height / 2 - box.top - 22) + 'px';
      lsAccessMenu.hidden = false;
      lsAccess.setAttribute('aria-expanded', 'true');
    });
    lsAccessMenu.addEventListener('click', (e) => {
      const item = e.target.closest('[data-access]');
      if (item) { lsAccessSelect(item); onChange('access', item.dataset.access); }
      if (item || e.target.closest('#lsAccessClose')) { lsAccessClose(); lsAccess.focus(); }
    });
    outside(lsAccess, lsAccessMenu, lsAccessClose);
    lsNewIndex.addEventListener('click', () => {
      const on = lsNewIndex.querySelector('.rp-switch').classList.toggle('is-on');
      lsNewIndex.setAttribute('aria-checked', on);
      onChange('noindex', on);
    });
    return { lsAccess, lsAccessMenu, lsAccessSelect, lsAccessClose };
  }
  const pageAddresses = new Map([
    ['Главная', 'home'], ['О нас', 'about'], ['Профиль', 'profile'], ['Меню', 'menu'],
    ['Карточка товара', 'product'], ['Карточка блюда', 'product'],
    ['Каталог', 'catalog'], ['Корзина', 'cart'], ['Заказы', 'orders'], ['Карточка заказа', 'order'],
    ['Каталог услуг', 'services'], ['Карточка услуги', 'service'], ['Специалисты', 'specialists'],
    ['Карточка специалиста', 'specialist'], ['Выбор времени записи', 'booking'],
    ['Номера', 'rooms'], ['Карточка номера', 'room'],
  ]);
  const translit = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
  function defaultAddress(name) {
    return pageAddresses.get(name) ?? [...name.trim().toLowerCase()]
      .map((letter) => translit[letter] ?? letter).join('')
      .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }
  return { openModeFill, mount, defaultAddress };
})();
