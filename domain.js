/* Редактор домена — состояния компонента DomainSetupForm (Figma DRIJUUCPNarHomYAJ5eMqn, 14:1683).
   type: saby — поле + зона .saby.ru, custom — свой домен.
   saby:   Default → ввод → Pending («Проверка домена…») → Filled (свободен) / NotFree (занят); недопустимые
           символы — FormatError; «Подключить» с пустым полем — NotFilled; из Filled — Connecting → Connected.
   custom: Default / Filled по вводу; «Подключить»: пусто — NotFilled, без зоны — FormatError,
           иначе Connecting → WaitingDNS; «Проверить» — Connecting → Connected. «Изменить» — назад к Filled.
   Общий для «Параметров сайта» конструктора и вкладки «Данные» реестра (registry/index.html подключает ../domain.js).
   В реестре экран перевставляется через innerHTML, поэтому состояние живёт у элемента (WeakMap), события — на document.
   Фокус скрипт не трогает: поле остаётся тем же узлом, меняются только классы, кнопки и подсказка. */
(function(){
  'use strict';
  var TAKEN = ['tensor', 'saby', 'shop', 'test', 'admin'];   // демо: занятые имена на saby.ru
  var WAIT = 800;                                          // демо-задержка проверки и подключения, мс
  var states = new WeakMap();

  function st(el){
    var s = states.get(el);
    if (!s){ s = { type: 'saby', state: 'Default', value: '', timer: 0 }; states.set(el, s); }
    return s;
  }
  var link = '<span class="dom__link">инструкции</span>';
  function btn(kind, text, act){
    var dis = kind === 'off' || kind === 'ghost';
    return '<button class="dom__btn dom__btn--' + kind + '" type="button"' + (act && !dis ? ' data-dom-act="' + act + '"' : '') + (dis ? ' disabled' : '') + '>' + text + '</button>';
  }
  function spin(){
    var h = '';
    for (var i = 0; i < 12; i++) h += '<i style="transform:rotate(' + (i * 30) + 'deg);opacity:' + ((i + 1) / 12).toFixed(2) + '"></i>';
    return '<div class="dom__btn dom__btn--primary" aria-label="Подождите"><span class="dom__spin">' + h + '</span></div>';
  }

  /* Кнопки и подсказка по состоянию — как в вариантах макета */
  function view(s){
    var other = s.type === 'saby' ? 'Свой домен' : 'Домен от Saby';
    var name = s.value;
    if (s.type === 'saby') switch (s.state){
      case 'NotFilled':   return { b: btn('primary', 'Подключить', 'connect') + btn('pale', other, 'type'), t: 'Введите домен — адрес примет вид домен.saby.ru', c: 'danger' };
      case 'FormatError': return { b: btn('off', 'Подключить') + btn('pale', other, 'type'), t: 'Используйте латинские буквы, цифры, дефис и подчёркивание', c: 'danger' };
      case 'Pending':     return { b: spin() + btn('off', other), t: 'Проверка домена…' };
      case 'NotFree':     return { b: btn('off', 'Подключить') + btn('pale', other, 'type'), t: 'Этот домен уже занят', c: 'danger' };
      case 'Filled':      return { b: btn('primary', 'Подключить', 'connect') + btn('pale', other, 'type'), t: 'Домен ' + name + '.saby.ru доступен', c: 'success' };
      case 'Connecting':  return { b: spin() + btn('ghost', other), t: 'Подключение домена…' };
      case 'Connected':   return { b: btn('pale', 'Изменить', 'edit') + btn('label', other, 'type'), t: 'Домен подключён' };
      default:            return { b: btn('primary', 'Подключить', 'connect') + btn('pale', other, 'type'), t: 'Подключите домен на saby.ru или настройте свой по ' + link };
    }
    switch (s.state){
      case 'NotFilled':   return { b: btn('primary', 'Подключить', 'connect') + btn('pale', other, 'type'), t: 'Введите домен — например, tensor.ru', c: 'danger' };
      case 'FormatError': return { b: btn('primary', 'Подключить', 'connect') + btn('pale', other, 'type'), t: 'Укажите полный адрес — например, tensor.ru', c: 'danger' };
      case 'Connecting':  return { b: spin() + btn('off', 'Изменить'), t: 'Проверка DNS-записей…' };
      case 'WaitingDNS':  return { b: btn('primary', 'Проверить', 'check') + btn('pale', 'Изменить', 'edit'), t: 'Выполните настройки по ' + link + '. Обновление DNS — до 48 часов' };
      case 'Connected':   return { b: btn('pale', 'Изменить', 'edit'), t: 'Домен подключён' };
      default:            return { b: btn('primary', 'Подключить', 'connect') + btn('pale', other, 'type'), t: 'Подключите свой домен по ' + link };
    }
  }

  function render(el){
    var s = st(el), v = view(s);
    var input = el.querySelector('.dom__text'), zone = el.querySelector('.dom__zone');
    var locked = ['Connecting', 'WaitingDNS', 'Connected'].indexOf(s.state) > -1;
    var saby = s.type === 'saby';
    el.classList.toggle('dom--saby', saby);
    el.classList.toggle('dom--bold', locked);
    el.classList.toggle('dom--success', s.state === 'Connected');
    el.classList.toggle('dom--warning', !saby && (s.state === 'Connecting' || s.state === 'WaitingDNS'));
    input.placeholder = saby ? 'mycompany' : 'mydomain.ru';
    input.readOnly = locked;
    var shown = saby && s.state === 'Connected' ? s.value + '.saby.ru' : s.value;
    if (input.value !== shown) input.value = shown;
    zone.hidden = !saby || s.state === 'Connected';
    el.querySelector('.dom__btns').innerHTML = v.b;
    var status = el.querySelector('.dom__status');
    status.className = 'dom__status' + (v.c ? ' dom__status--' + v.c : '');
    status.innerHTML = v.t;
  }

  function later(el, fn){
    var s = st(el);
    clearTimeout(s.timer);
    s.timer = setTimeout(function(){ if (document.contains(el)){ fn(s); render(el); } }, WAIT);
  }
  function set(el, state){ st(el).state = state; render(el); }

  function check(el){
    var s = st(el);
    clearTimeout(s.timer);
    if (s.type === 'custom'){ set(el, s.value ? 'Filled' : 'Default'); return; }
    if (!s.value){ set(el, 'Default'); return; }
    if (!/^[a-z0-9_-]+$/i.test(s.value)){ set(el, 'FormatError'); return; }
    set(el, 'Pending');
    later(el, function(s){ s.state = TAKEN.indexOf(s.value.toLowerCase()) > -1 ? 'NotFree' : 'Filled'; });
  }

  document.addEventListener('input', function(e){
    var input = e.target.closest && e.target.closest('[data-domain] .dom__text');
    if (!input || input.readOnly) return;
    var el = input.closest('[data-domain]'), s = st(el);
    s.value = input.value.trim();
    s.auto = false; // адрес ввёл человек — больше не подставляем
    check(el);
  });

  /* Адрес нового сайта (с нуля или из шаблона) — случайный, не из названия сайта или шаблона:
     три слога «согласная + гласная», как vobara. Один на страницу: пока адрес не правили руками, он не меняется
     и возвращается при переключении на «Домен от Saby». Подставляется в состоянии по умолчанию, без проверки.
     Занятые имена пропускаем. */
  var rand = '';
  function randName(){
    var c = 'bvgdzklmnprstf', v = 'aeiou', s = '';
    for (var i = 0; i < 3; i++) s += c[Math.floor(Math.random() * c.length)] + v[Math.floor(Math.random() * v.length)];
    return s;
  }
  function suggestion(){
    while (!rand || TAKEN.indexOf(rand) > -1) rand = randName();
    return rand;
  }
  /* У сайта уже есть адрес (data-site-address — в реестре его ставит карточка сайта по подписи плитки):
     редактор сразу в состоянии Connected с этим адресом. *.saby.ru — домен от Saby, остальное — свой домен.
     data-site-off — сайт снят с публикации: адрес тот же, но домен не подключён (Default). */
  function connected(el){
    var addr = el.dataset.siteAddress, s = st(el);
    var saby = /\.saby\.ru$/i.test(addr);
    s.type = saby ? 'saby' : 'custom';
    s.value = saby ? addr.replace(/\.saby\.ru$/i, '') : addr;
    s.state = 'siteOff' in el.dataset ? 'Default' : 'Connected';
    s.auto = false;
    /* data-site-state — домен, как его оставили в «Параметрах сайта» конструктора (JSON { type, value, state }):
       карточка реестра после выхода из конструктора показывает то же. Незавершённые проверки — назад в Filled */
    if (el.dataset.siteState) try {
      var d = JSON.parse(el.dataset.siteState);
      s.type = d.type === 'custom' ? 'custom' : 'saby';
      s.value = d.value || '';
      s.state = ['Pending', 'Connecting'].indexOf(d.state) > -1 ? (s.value ? 'Filled' : 'Default') : d.state || 'Default';
    } catch (err) {}
    render(el);
  }
  // состояние редактора для передачи в реестр (../app.js: выход из конструктора на карточку сайта)
  window.domainState = function(el){ var s = st(el); return { type: s.type, value: s.value, state: s.state }; };
  window.domainSetState = function(el, value){
    Object.assign(st(el), value, { auto: false });
    render(el);
  };
  function suggest(){
    document.querySelectorAll('[data-domain][data-site-address]').forEach(function(el){
      if (!states.has(el)) connected(el);
    });
    var v = suggestion();
    if (!v) return;
    document.querySelectorAll('[data-domain]').forEach(function(el){
      if (el.dataset.siteAddress) return;
      var fresh = !states.has(el), s = st(el);
      if (fresh) s.auto = !el.querySelector('.dom__text').value;
      if (!s.auto || s.type !== 'saby' || s.state !== 'Default' || s.value === v) return;
      s.value = v;
      render(el);
    });
  }
  // В реестре экраны перевставляются через innerHTML — новый редактор ловим наблюдателем
  function watch(){
    suggest();
    new MutationObserver(suggest).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();

  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-domain] [data-dom-act]');
    if (!b) return;
    var el = b.closest('[data-domain]'), s = st(el), act = b.dataset.domAct;
    clearTimeout(s.timer);
    if (act === 'type'){
      s.type = s.type === 'saby' ? 'custom' : 'saby';
      s.auto = s.type === 'saby'; // «Домен от Saby» — снова адрес из названия сайта, свой домен — пустое поле
      s.value = s.auto ? suggestion() : '';
      set(el, 'Default');
    } else if (act === 'edit'){
      set(el, 'Filled');
    } else if (act === 'check'){
      set(el, 'Connecting');
      later(el, function(s){ s.state = 'Connected'; });
    } else if (act === 'connect'){
      if (!s.value){ set(el, 'NotFilled'); return; }
      if (s.type === 'custom' && !/^[a-zа-яё0-9-]+(\.[a-zа-яё0-9-]+)+$/i.test(s.value)){ set(el, 'FormatError'); return; }
      set(el, 'Connecting');
      later(el, function(s){ s.state = s.type === 'saby' ? 'Connected' : 'WaitingDNS'; });
    }
  });
})();
