(() => {
  let host = window;
  try {
    if (window.top.document.querySelector('script[src$="site-personal-data.js"]')) host = window.top;
  } catch {
    // A cross-origin embed keeps its own document picker.
  }
  const defaults = {
    consent: 'Согласие на обработку ПДн',
    policy: 'Политика конфиденциальности приложения Saby Admin (ru)',
  };

  function syncEditors() {
    if (!host.PersonalDocuments) return;
    for (const editor of document.querySelectorAll('[data-personal-document]')) {
      const field = editor.dataset.personalDocument;
      const name = host.PersonalDocuments.get(document.body.dataset.personalDocumentSite, field);
      const button = editor.querySelector('.btn--style-link');
      button.querySelector('.btn__caption').textContent = name || 'Выберите документ';
      editor.querySelector('[data-clear-personal-document]').hidden = !name;
    }
  }

  if (window === host) {
    const assetRoot = new URL('assets/img/', document.currentScript.src);
    const values = new Map();
    const groups = [
      ['Клиентам', [
        [94, 'Privacy Policy of the Saby Admin Application (en)'],
        [96, 'Оферта доступа к сервису SABY MEET (ru)'],
        [98, defaults.policy],
        [100, 'Согласие на обработку ПДн (ru)'],
        [95, 'Соглашение о признании действительности ЭП с оператором Yangi Texnologiyalar (Узбекистан) (ru)'],
        [100, 'Согласие на обработку ПДн для направления заявки на открытие расчетного счета (ru)'],
      ]],
      ['Общие', [
        [97, 'Политика обработки персональных данных для брендированных приложений (ru)', 'Политика для брендированных приложений СБИС'],
        [99, 'Политика конфиденциальности для брендированных приложений (ru)', 'Политика конфиденциальности для брендированных приложений СБИС.'],
      ]],
    ];
    const buttonClasses = 'btn btn--filled btn--style-unaccented btn--size-xl btn--icon';
    let dialog;
    let active;

    function createDialog(workspace) {
      const panel = workspace.ownerDocument.createElement('dialog');
      panel.className = 'personal-offers';
      panel.setAttribute('aria-labelledby', 'personalOffersTitle');
      panel.innerHTML = `
        <div class="personal-offers__content">
          <header class="personal-offers__header">
            <h2 id="personalOffersTitle" tabindex="-1" autofocus>Оферты</h2>
            <span class="btn btn--filled btn--style-pale btn--size-m personal-offers__add" aria-hidden="true"><span class="btn__icon">&#xEADD;</span></span>
            <span class="btn btn--link btn--style-link btn--size-m"><span class="btn__caption">Компания “Тензор”</span></span>
          </header>
        </div>
        <aside class="personal-offers__rail">
          <button type="button" class="close-button close-button--functional-button close-button--size-l" aria-label="Закрыть"></button>
          <div class="personal-offers__informers" aria-hidden="true">
            <span class="${buttonClasses} personal-offers__date"><span>16<br><small>чт</small></span></span>
            <span class="${buttonClasses}"><span class="btn__icon">&#xE636;</span></span>
            <span class="${buttonClasses}"><span class="btn__icon">&#xE65D;</span></span>
            <span class="${buttonClasses} personal-offers__help"><img alt="" src="${new URL('offers-imgFrame.svg', assetRoot)}"></span>
          </div>
        </aside>`;
      const content = panel.querySelector('.personal-offers__content');
      for (const [heading, documents] of groups) {
        const section = panel.ownerDocument.createElement('section');
        section.className = 'personal-offers__group';
        section.innerHTML = `
          <h3><span class="btn__icon" aria-hidden="true">&#xE9AA;</span>${heading}</h3>
          <div class="personal-offers__grid"></div>`;
        const grid = section.querySelector('.personal-offers__grid');
        for (const [image, name, description] of documents) {
          const card = panel.ownerDocument.createElement('button');
          card.type = 'button';
          card.className = 'personal-offers__card';
          card.innerHTML = `
            <img class="personal-offers__preview" alt="" src="${new URL(`offers-imgComponent${image}.png`, assetRoot)}">
            <span class="personal-offers__name"><span></span></span>
            ${description ? '<span class="personal-offers__folder-icon" aria-hidden="true">&#xEA39;</span>' : ''}
            <span class="${buttonClasses} personal-offers__menu" aria-hidden="true"><span class="btn__icon">&#xE9D9;</span></span>`;
          card.querySelector('.personal-offers__name > span').textContent = name;
          card.addEventListener('click', () => {
            host.PersonalDocuments.set(active.site, active.field, name);
            panel.close();
          });
          if (description) {
            const item = panel.ownerDocument.createElement('div');
            item.className = 'personal-offers__folder';
            const caption = panel.ownerDocument.createElement('div');
            caption.className = 'personal-offers__description';
            const captionText = panel.ownerDocument.createElement('span');
            captionText.textContent = description;
            caption.append(captionText);
            item.append(card, caption);
            grid.append(item);
          } else {
            grid.append(card);
          }
        }
        content.append(section);
      }
      panel.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
        }
      });
      panel.addEventListener('cancel', (event) => event.preventDefault());
      panel.addEventListener('close', () => {
        active?.trigger.focus();
        active = null;
      });
      panel.querySelector('.close-button').addEventListener('click', () => panel.close());
      workspace.append(panel);
      return panel;
    }

    host.PersonalDocuments = {
      get(site, field) {
        return values.get(site)?.get(field) ?? defaults[field];
      },
      set(site, field, name) {
        if (!values.has(site)) values.set(site, new Map());
        values.get(site).set(field, name);
        host.dispatchEvent(new Event('personal-documents-change'));
      },
      open(site, field, trigger) {
        const source = trigger.ownerDocument;
        const workspace = source.defaultView.frameElement?.id === 'rsParamsFrame'
          ? document.querySelector('#stage')
          : source.querySelector('#regSalesPicker, #salesPicker')?.parentElement;
        if (!workspace) return;
        if (dialog?.parentElement !== workspace) {
          dialog?.remove();
          dialog = createDialog(workspace);
        }
        if (dialog.open) return;
        active = { site, field, trigger };
        dialog.show();
        dialog.querySelector('.personal-offers__content').scrollTop = 0;
      },
    };
    host.dispatchEvent(new Event('personal-documents-change'));
  }

  host.addEventListener('personal-documents-change', syncEditors);
  if (window !== host) {
    window.addEventListener('pagehide', () => {
      host.removeEventListener('personal-documents-change', syncEditors);
    });
    window.addEventListener('pageshow', () => {
      host.addEventListener('personal-documents-change', syncEditors);
      syncEditors();
    });
  }
  document.addEventListener('personal-document-site-change', syncEditors);
  document.addEventListener('click', (event) => {
    const editor = event.target.closest('[data-personal-document]');
    if (!editor) return;
    const clear = event.target.closest('[data-clear-personal-document]');
    const trigger = editor.querySelector('.btn--style-link');
    const site = document.body.dataset.personalDocumentSite;
    const field = editor.dataset.personalDocument;
    if (clear) {
      host.PersonalDocuments.set(site, field, '');
      trigger.focus();
    } else if (event.target.closest('.btn--style-link') === trigger) {
      host.PersonalDocuments.open(site, field, trigger);
    }
  }, true);
  syncEditors();
})();
