/* QR-код компонента: строка «QR-код» в блоке компонента и окно «Табличка с QR-кодом».
   Общий для «Параметров сайта» конструктора и «Параметров» реестра (registry/index.html подключает ../qr.js), стили — qr.css.
   Строка — .comp-qr[data-qr-comp="<компонент>"]: миниатюра [data-qr-open] открывает окно. «Привязать» и «Распечатать» — только в шапке окна: без точек продаж в блоке показывают предупреждение; с точками «Распечатать» открывает окно «Распечатать» вместо окна таблички, «Привязать» — пока без действия.
   Тип сайта в строку ставит рендер блока: QrCode.sync(строка, компонент) — от него текст таблички и тултип «Привязать к …».
   Окно — .pe из ui-kit по центру, поверх «Опубликовать». Галочка и крестик закрывают (настраивать пока нечего), Esc — тоже.
   Стрелки «Стиль» — только ховер; «Акцентный» и «Текст» открывают вложенный список цветов (выбор — заглушка). В реестре экран перевставляется через innerHTML, поэтому события — на document. */
(function(){
  'use strict';
  // Текст таблички и куда привязывать — по типу сайта (компоненту)
  var TYPES = {
    restaurant: { title: 'Меню', to: 'точке продаж' },
    delivery: { title: 'Меню', to: 'точке продаж' },
    services: { title: 'Каталог', to: 'филиалу' },
    hotel: { title: 'Бронь', to: 'объекту размещения' }
  };
  var type = function(id){ return TYPES[id] || TYPES.restaurant; };
  // путь к картинкам: страница реестра лежит в registry/
  var base = /\/registry\//.test(location.pathname) ? '../' : '';

  function sync(row, id){
    if (!row) return;
    row.dataset.qrComp = id;
    var bind = row.querySelector('[data-qr-bind]');
    if (bind){ bind.title = 'Привязать к ' + type(id).to; bind.setAttribute('aria-label', bind.title); }
  }

  var dlg = null;
  function icons(){
    return '<button type="button" class="qr-act" data-qr-bind title="Привязать к точке продаж" aria-label="Привязать к точке продаж">&#xeb59;</button>' +
      '<button type="button" class="qr-act" data-qr-print title="Распечатать" aria-label="Распечатать">&#xe633;</button>';
  }
  // Цвета с вложенным списком: клик по строке открывает его на месте списка цветов («Стиль» остаётся сверху), стрелка «Назад» возвращает.
  // Есть у «Акцентного» (по макету) и «Текста» (пункты «Текста» — временные); выбор цвета во вложенном списке — заглушка
  var SUBS = {
    accent: { name: 'Акцентный', items: [['Основной', '#25505f'], ['Текст', '#ffffff'], ['Фон', '#1a1a1a']] },
    text: { name: 'Текст', items: [['Основной', '#1a1a1a'], ['Заголовки', '#1a1a1a'], ['Второстепенный', '#8991a9']] }
  };
  function color(name, hex, sub){
    return '<button type="button" class="qr-color"' + (sub ? ' data-qr-sub="' + sub + '"' : '') + '><span class="pe__swatch' + (hex ? '' : ' pe__swatch--empty') + '"' + (hex ? ' style="--pe-color:' + hex + '"' : '') + '></span>' +
      '<span>' + name + '</span>' + (sub === false ? '' : '<span class="arrow-button arrow-button--link arrow-button--size-s" aria-hidden="true"></span>') + '</button>';
  }
  // вложенный список: «Назад» кита (стрелка в круге) с названием цвета, под ним — строки без шеврона
  function showSub(key){
    var d = SUBS[key], box = dlg.querySelector('.qr-dlg__sub');
    box.innerHTML = '<button type="button" class="back back--size-xl back--color-default back--icon-primary back--functional-button back--style-default qr-dlg__back" data-qr-back>' +
        '<span class="back__icon" aria-hidden="true"></span><span class="back__caption">' + d.name + '</span></button>' +
      d.items.map(function(it){ return color(it[0], it[1], false); }).join('');
    dlg.querySelector('.qr-dlg__main').hidden = true;
    box.hidden = false;
  }
  function showMain(){
    if (!dlg) return;
    dlg.querySelector('.qr-dlg__sub').hidden = true;
    dlg.querySelector('.qr-dlg__main').hidden = false;
  }
  function build(){
    dlg = document.createElement('section');
    dlg.className = 'pe qr-dlg';
    dlg.id = 'qrDlg';
    dlg.setAttribute('role', 'dialog');
    dlg.setAttribute('aria-label', 'Табличка с QR-кодом');
    dlg.hidden = true;
    dlg.innerHTML =
      '<header class="pe__head">' +
        '<span class="pe__name pe__name--static">Табличка с QR-кодом</span>' +
        '<span class="qr-dlg__acts">' + icons() + '</span>' +
        '<div class="pe__cmds">' +
          '<button type="button" class="pe__done" data-qr-done aria-label="Сохранить">&#xe75e;</button>' +
          '<button type="button" class="pe__close" data-qr-close aria-label="Закрыть">&#xe66c;</button>' +
        '</div>' +
      '</header>' +
      '<div class="pe__body"><div class="pe__card qr-dlg__card">' +
        '<div class="qr-plate"><button type="button" class="qr-plate__edit" aria-label="Изменить">&#xe660;</button><span class="qr-plate__title"></span><img class="qr-plate__code" src="' + base + 'assets/img/qr.svg" alt="QR-код сайта"></div>' +
        '<div class="qr-dlg__opts">' +
          '<div class="qr-dlg__style"><button type="button" class="qr-dlg__style-name">Стиль</button>' +
            '<button type="button" class="arrow-button arrow-button--left" aria-label="Предыдущий стиль"></button>' +
            '<button type="button" class="arrow-button" aria-label="Следующий стиль"></button></div>' +
          '<div class="qr-dlg__main">' +
          color('Акцентный', '#25505f', 'accent') + color('Текст', '#1a1a1a', 'text') +
          '<div class="qr-dlg__group">Другие элементы</div>' +
          color('Фон страницы', null) +
        '</div><div class="qr-dlg__sub" hidden></div></div>' +
      '</div></div>';
    // в конструкторе — рядом с окном «Опубликовать» (в той же рамке демо), в реестре — в body
    var pub = document.getElementById('pub');
    (pub ? pub.parentNode : document.body).appendChild(dlg);
  }
  function open(id){
    if (!dlg) build();
    var t = type(id);
    dlg.querySelector('.qr-plate__title').textContent = t.title;
    var bind = dlg.querySelector('[data-qr-bind]');
    bind.title = 'Привязать к ' + t.to;
    bind.setAttribute('aria-label', bind.title);
    showMain();
    closePrint(); // и наоборот: окно печати уступает место окну таблички
    dlg.hidden = false;
  }
  function close(){ if (dlg) dlg.hidden = true; }

  /* «Привязать» и «Распечатать» без настроенных точек продаж — окно-предупреждение с «ОК».
     Вид — подтверждение страницы: в конструкторе .confirm (styles.css, рядом с #confirm), в реестре .dlg (registry/index.html). Esc и «ОК» закрывают */
  var lastRow = null; // строка QR, из которой открыто окно таблички: по ней кнопки окна ищут точки своего блока
  var alertEl = null;
  function hasPoints(row){
    var block = row && row.closest('.sales-settings');
    return !!(block && block.querySelector('.sales-row'));
  }
  function showAlert(){
    if (!alertEl){
      var c = document.getElementById('confirm') ? 'confirm' : 'dlg';
      alertEl = document.createElement('div');
      alertEl.className = c + '-layer qr-alert';
      alertEl.id = 'qrAlert';
      alertEl.hidden = true;
      alertEl.innerHTML =
        '<div class="' + c + '" role="alertdialog" aria-modal="true" aria-labelledby="qrAlertMsg" aria-describedby="qrAlertDetails">' +
          '<div class="' + c + '__head"><span class="' + c + '__marker"></span></div>' +
          '<div class="' + c + '__content">' +
            '<p class="' + c + '__message" id="qrAlertMsg">Отсутствуют настроенные точки продаж</p>' +
            '<p class="' + c + '__details" id="qrAlertDetails">Добавьте точки продаж на вкладке «Параметры»</p>' +
          '</div>' +
          '<div class="' + c + '__footer"><button type="button" class="' + c + '__btn ' + c + '__btn--primary" data-qr-alert-ok>ОК</button></div>' +
        '</div>';
      var conf = document.getElementById('confirm');
      (conf ? conf.parentNode : document.body).appendChild(alertEl);
      // клик в окне не закрывает «Параметры» и окно таблички под ним
      alertEl.addEventListener('mousedown', function(e){ e.stopPropagation(); });
    }
    alertEl.hidden = false;
  }
  function closeAlert(){ if (alertEl) alertEl.hidden = true; }

  /* «Распечатать» при настроенных точках — окно «Распечатать» на месте окна таблички и того же размера (не поверх: одно сменяет другое); крестик и Esc возвращают к табличке.
     Вид — .pe, как окно таблички; в шапке у крестика иконка «Сохранить» и контурная «Печать» кита.
     В карточке — основная (первая) точка продаж блока и превью таблички на всю оставшуюся высоту. «Сохранить» и «Печать» пока без действия */
  var printEl = null;
  function mainPoint(row){
    var n = row.closest('.sales-settings').querySelector('.sales-row .sales-row__name > span');
    return n ? n.textContent : '';
  }
  // «Печать» — кнопка кита btn--outlined btn--style-primary btn--size-m. В конструкторе button.css кита подключён (там есть #confirm),
  // в реестре свой .btn — там копия кнопки .qr-print__btn из qr.css
  var printBtn = document.getElementById('confirm') ? 'btn btn--outlined btn--style-primary btn--size-m' : 'qr-print__btn';
  function showPrint(row){
    if (!printEl){
      printEl = document.createElement('section');
      printEl.className = 'pe qr-dlg qr-print';
      printEl.id = 'qrPrint';
      printEl.setAttribute('role', 'dialog');
      printEl.setAttribute('aria-label', 'Распечатать');
      printEl.hidden = true;
      printEl.innerHTML =
        '<header class="pe__head">' +
          '<span class="pe__name pe__name--static">Распечатать</span>' +
          '<div class="pe__cmds"><button type="button" class="qr-act" title="Сохранить" aria-label="Сохранить">&#xe628;</button>' +
            '<button type="button" class="' + printBtn + '">Печать</button><button type="button" class="pe__close" data-qr-print-close aria-label="Закрыть">&#xe66c;</button></div>' +
        '</header>' +
        '<div class="pe__body"><div class="pe__card qr-print__card">' +
          '<span class="qr-print__point"></span>' +
          '<div class="qr-print__preview"><div class="qr-plate qr-plate--mini"><span class="qr-plate__title"></span><img class="qr-plate__code" src="' + base + 'assets/img/qr.svg" alt="QR-код сайта"></div></div>' +
        '</div></div>';
      var pub = document.getElementById('pub');
      (pub ? pub.parentNode : document.body).appendChild(printEl);
    }
    var point = mainPoint(row);
    printEl.querySelector('.qr-print__point').textContent = point;
    printEl.querySelector('.qr-print__point').title = point;
    printEl.querySelector('.qr-plate__title').textContent = type(row.dataset.qrComp).title;
    // окно таблички уступает место окну печати того же размера (offset* — без масштаба рамки демо)
    if (dlg && !dlg.hidden){ printEl.style.width = dlg.offsetWidth + 'px'; printEl.style.height = dlg.offsetHeight + 'px'; }
    close();
    printEl.hidden = false;
  }
  function closePrint(){ if (printEl) printEl.hidden = true; }
  // крестик и Esc окна печати возвращают окно таблички в том же виде, в каком его оставили
  function backToTable(){ closePrint(); if (dlg) dlg.hidden = false; }

  document.addEventListener('click', function(e){
    if (e.target.closest('[data-qr-alert-ok]')) { closeAlert(); return; }
    if (e.target.closest('[data-qr-print-close]')) { backToTable(); return; }
    var act = e.target.closest('[data-qr-bind], [data-qr-print]');
    if (act){
      var r = act.closest('.comp-qr') || lastRow;
      if (!hasPoints(r)) showAlert();
      else if (act.hasAttribute('data-qr-print')) showPrint(r); // «Привязать» с точками — пока без действия
      return;
    }
    var th = e.target.closest('[data-qr-open]');
    if (th){ var row = th.closest('.comp-qr'); lastRow = row; open(row && row.dataset.qrComp); return; }
    if (e.target.closest('[data-qr-done], [data-qr-close]')) { close(); return; }
    var sub = e.target.closest('[data-qr-sub]');
    if (sub && dlg && dlg.contains(sub)) { showSub(sub.dataset.qrSub); return; }
    if (e.target.closest('[data-qr-back]')) showMain();
  });
  // Esc закрывает только окно QR: «Параметры» под ним остаются открыты
  window.addEventListener('keydown', function(e){
    if (e.key !== 'Escape') return;
    // сначала — предупреждение о точках продаж, окно таблички под ним остаётся
    if (alertEl && !alertEl.hidden){ e.preventDefault(); e.stopImmediatePropagation(); closeAlert(); return; }
    if (printEl && !printEl.hidden){ e.stopImmediatePropagation(); backToTable(); return; }
    if (!dlg || dlg.hidden) return;
    e.stopImmediatePropagation();
    close();
  }, true);

  window.QrCode = { sync: sync, open: open, close: close, icons: icons };
})();
