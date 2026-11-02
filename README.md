# Попапы — прототип

Интерактивный прототип попапов в окне конструктора Saby. Сцена 1600×900 и вспомогательная панель справа.

## Ссылки

- Демо (GitHub Pages): https://mariesmi.github.io/popups/
- Репозиторий (публичный): https://github.com/MarieSmi/popups
- Макет: будет добавлен

## Состав

- Рамка демо (шапка, сцена, вспомогательная панель) — компонент `demo-frame` из [ui-kit](https://github.com/MarieSmi/ui-kit), подключён с jsDelivr по тегу `1.11.0`.
- Шапка конструктора — компонент [Builder-components](https://www.figma.com/design/rHabzni5OI5D4fxBLQdj2m/?node-id=5-28058), узел `5:28058`. Кнопки только с ховером, без действий по клику.
- Правый тулбар с окнами (Магазин, Данные, Слои, Фильтр, Поиск, Настройки, меню «⋮») — перенесён из [interface-prototype](https://github.com/MarieSmi/interface-prototype).
- Левый сайдбар со списком страниц — компонент [Builder-components](https://www.figma.com/design/rHabzni5OI5D4fxBLQdj2m/?node-id=5-28393), узел `5:28393`. Режим (вписан или линии) запоминается в браузере, страницы при обновлении возвращаются к исходным.
- Шрифты Inter, cbuc-icons, cbuc-icons24 и Accordion-Font — в `assets/fonts`, тоже из interface-prototype.
- Область контента пока пустая.

## Запуск

Без сборки и зависимостей:

```bash
node .claude/serve.js
```

Откроется на http://localhost:5173.

## Публикация

Сайт собирается из ветки `main`, папка `/ (root)`. Пуш в `main` обновляет его за 1–2 минуты.
