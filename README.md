# Попапы — прототип

Интерактивный прототип попапов в окне конструктора Saby. Сцена 1600×900 и вспомогательная панель справа.

## Ссылки

- Демо (GitHub Pages): https://mariesmi.github.io/popups/
- Репозиторий (публичный): https://github.com/MarieSmi/popups
- Разработка макета: https://tensor.saby.ru/opendoc.html?guid=01a10b9e-d00c-7be9-9307-91f4f08a3298&client=3
- Макет: будет добавлен

## Состав

- Рамка демо (шапка, сцена, вспомогательная панель) — компонент `demo-frame` из [ui-kit](https://github.com/MarieSmi/ui-kit), подключён с jsDelivr по тегу `1.11.0`.
- Шапка конструктора — компонент [Builder-components](https://www.figma.com/design/rHabzni5OI5D4fxBLQdj2m/?node-id=5-28058), узел `5:28058`. Кнопки только с ховером, без действий по клику.
- Правый сайдбар — компонент [Создание страниц и окон](https://www.figma.com/design/WHZ4ZSm4wRMrxQPWqEk5Wk/?node-id=148-15451), узел `148:15451`: вписан в страницу, по умолчанию «Магазин»; «Данные»; окно «Параметры сайта».
- Виджет каталога — [узел `2547:84548`](https://www.figma.com/design/WHZ4ZSm4wRMrxQPWqEk5Wk/?node-id=2547-84548): ставится по клику на «Каталог» в магазине вместо пустой секции; каталог пропадает из магазина, появляется страница «Карточка товара». Выделение и тулбар — `widget` и `toolbar` из ui-kit.
- Левый сайдбар со списком страниц — компонент [Builder-components](https://www.figma.com/design/rHabzni5OI5D4fxBLQdj2m/?node-id=5-28393), узел `5:28393`. Режим (вписан или линии) запоминается в браузере, страницы при обновлении возвращаются к исходным.
- Шрифты Inter, cbuc-icons, cbuc-icons24 и Accordion-Font — в `assets/fonts`, тоже из interface-prototype.
- Середина — сайт в конструкторе, [узел `2547:63290`](https://www.figma.com/design/WHZ4ZSm4wRMrxQPWqEk5Wk/?node-id=2547-63290). Ховер виджетов и команды пустого виджета — компонент `widget` из ui-kit. Шрифт сайта Montserrat подключён с Google Fonts.

## Запуск

Без сборки и зависимостей:

```bash
node .claude/serve.js
```

Откроется на http://localhost:5173.

## Публикация

Сайт собирается из ветки `main`, папка `/ (root)`. Пуш в `main` обновляет его за 1–2 минуты.
