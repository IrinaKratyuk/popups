/* Настройки каталога компонента: свойство «Выбор товара из <прайс>» и под ним «Доступно клиенту» с группой чекбоксов — последними строками свойств, после QR-кода.
   Общий для «Параметров сайта» конструктора и «Данных» реестра (registry/index.html подключает ../comp-catalog.js), стили — comp-catalog.css.
   Группа — .comp-cat[data-cat-comp="<компонент>"] между свойствами (.comp-props) и «Точками продаж». Есть только у «Электронного меню» и «Услуг»,
   у остальных компонентов группа скрыта. Тип сайта ставит рендер блока: CompCatalog.sync(группа, компонент).
   Чекбокс — checkbox из ui-kit (components/checkbox, outlined): значение в input, readonly — .is-readonly и disabled у input.
   «Онлайн-платежи» зависят от заказа: заказ выключен — платежи выключены и readonly, включить нельзя; заказ включили — платежи как были.
   Значения запоминаются по компоненту (общие для конструктора и реестра в пределах страницы). Выбранный прайс общий для свойств компонента и каталога.
   В реестре экран перевставляется через innerHTML: пустые группы дозаполняются сами (MutationObserver), события — на document. */
(function(){
  'use strict';
  // needs — индекс чекбокса, без которого этот недоступен
  var TYPES = {
    restaurant: { toggles: [{ name: 'Заказ по меню' }, { name: 'Онлайн-платежи', needs: 0 }, { name: 'Вызов официанта' }], source: 'Выбор товаров из', price: 'Меню A la carte' },
    services: { toggles: [{ name: 'Заказ по каталогу' }, { name: 'Онлайн-платежи', needs: 0 }], source: 'Выбор услуги из', price: 'Прайс 17.12.19' }
  };
  var state = {}; // компонент → [вкл/выкл] по чекбоксам; по умолчанию всё включено
  var prefix = 'popups:catalog-price:';
  var prices = new Map();
  function priceKey(site, id){ return prefix + JSON.stringify([site, id]); }
  function getPrice(site, id){
    var key = priceKey(site, id);
    if (prices.has(key)) return prices.get(key);
    try {
      var value = localStorage.getItem(key);
      if (value !== null) return value;
    } catch (err) {}
    return TYPES[id]?.price || '';
  }
  function setPrice(site, id, price){
    var key = priceKey(site, id);
    prices.set(key, price);
    try { localStorage.setItem(key, price); } catch (err) {}
    window.dispatchEvent(new Event('catalog-price-change'));
  }
  window.addEventListener('storage', function(e){
    if (!e.key || !e.key.startsWith(prefix)) return;
    prices.delete(e.key);
    window.dispatchEvent(new Event('catalog-price-change'));
  });
  var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // Показ одного переключателя: зависимый без «родителя» — выключен и readonly, своё значение не теряет
  function view(id, i){
    var t = TYPES[id].toggles[i], on = state[id];
    var locked = t.needs != null && !on[t.needs];
    return { checked: on[i] && !locked, disabled: locked };
  }

  function sync(group, id){
    if (!group) return;
    if (id) group.dataset.catComp = id; else id = group.dataset.catComp;
    var t = TYPES[id];
    // «Выбор товара из» — строкой свойств (.comp-props перед группой): подпись в колонке меток, прайс — в колонке значений
    var props = group.previousElementSibling;
    if (props && props.classList.contains('comp-props')){
      props.querySelectorAll('[data-cat-source]').forEach(function(el){ el.remove(); });
      if (t){
        var label = document.createElement('span'), val = document.createElement('button');
        label.className = 'rs-site__label'; label.dataset.catSource = ''; label.textContent = t.source;
        val.type = 'button';
        val.className = 'comp-cat__price';
        val.dataset.catSource = '';
        val.dataset.catalogPrice = id;
        val.textContent = t.price;
        props.append(label, val);
      }
    }
    // Чекбоксы — тоже строкой свойств: метка «Доступно клиенту» в колонке меток, группа чекбоксов — в колонке значений.
    // Сама группа остаётся пустой меткой-маркером (скрыта, но не :empty — чтобы MutationObserver её не дозаполнял снова)
    group.hidden = true;
    group.innerHTML = '<span data-cat-marker></span>';
    if (!t || !props || !props.classList.contains('comp-props')) return;
    if (!state[id]) state[id] = t.toggles.map(function(){ return true; });
    var cap = document.createElement('span'), row = document.createElement('div');
    cap.className = 'rs-site__label comp-cat__label'; cap.dataset.catSource = ''; cap.textContent = 'Доступно клиенту';
    row.className = 'comp-cat__checks'; row.dataset.catSource = ''; row.dataset.catComp = id;
    row.innerHTML = t.toggles.map(function(tg, i){
      var v = view(id, i);
      return '<label class="checkbox checkbox--outlined comp-cat__check' + (v.disabled ? ' is-readonly' : '') + '"><input class="checkbox__input" type="checkbox" data-cat-toggle="' + i + '"' +
        (v.checked ? ' checked' : '') + (v.disabled ? ' disabled' : '') + '><span class="checkbox__box"></span><span class="checkbox__caption">' + esc(tg.name) + '</span></label>';
    }).join('');
    props.append(cap, row);
  }

  document.addEventListener('change', function(e){
    var input = e.target.closest('[data-cat-toggle]');
    if (!input) return;
    var group = input.closest('.comp-cat__checks'), id = group.dataset.catComp;
    state[id][+input.dataset.catToggle] = input.checked;
    // обновить зависимые переключатели этой группы
    group.querySelectorAll('[data-cat-toggle]').forEach(function(el){
      var v = view(id, +el.dataset.catToggle);
      el.checked = v.checked;
      el.disabled = v.disabled;
      el.closest('.checkbox').classList.toggle('is-readonly', v.disabled);
    });
  });

  function fill(){ document.querySelectorAll('.comp-cat:empty:not([hidden])').forEach(function(g){ sync(g); }); }
  fill();
  new MutationObserver(fill).observe(document.documentElement, { childList: true, subtree: true });

  window.CompCatalog = { sync: sync, getPrice: getPrice, setPrice: setPrice };
})();
