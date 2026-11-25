window.ExtraComponents = (() => {
  const names = { news: 'Новости', gallery: 'Галерея' };
  const assets = new URL('assets/img/comp/', document.currentScript.src);
  const prefix = 'popups:extra-components:';
  const fallback = new Map();
  function read(site) {
    if (fallback.has(site)) return fallback.get(site);
    try {
      return JSON.parse(localStorage.getItem(prefix + site)) || {};
    } catch {
      return {};
    }
  }
  const enabled = (site, id) => read(site)[id] ?? (id !== 'gallery' || site === 'mili-yar.saby.ws');
  const active = (site) => Object.entries(names)
    .filter(([id]) => enabled(site, id))
    .map(([id, name]) => ({ id, name, icon: new URL(id + '.svg', assets) }));
  function set(site, id, value) {
    const state = { ...read(site), [id]: value };
    try {
      localStorage.setItem(prefix + site, JSON.stringify(state));
      fallback.delete(site);
    } catch {
      fallback.set(site, state);
    }
    window.dispatchEvent(new Event('extra-components-change'));
  }
  window.addEventListener('storage', (event) => {
    if (event.key?.startsWith(prefix)) window.dispatchEvent(new Event('extra-components-change'));
  });
  function renderRows(list, site, { tag, rowClass, nameClass, remove }) {
    list.querySelectorAll(':scope > .extra-component-row').forEach((row) => row.remove());
    for (const { id, name } of active(site)) {
      const row = document.createElement(tag);
      row.className = rowClass + ' component-group extra-component-row';
      row.dataset.extraComponent = id;
      row.innerHTML = '<span></span><button class="component-group__remove" type="button"></button>';
      const [label, button] = row.children;
      label.className = nameClass;
      label.textContent = name;
      button.setAttribute('aria-label', 'Отключить компонент «' + name + '»');
      button.addEventListener('click', () => remove(id, name));
      list.append(row);
    }
  }
  function renderChips(list, site) {
    list.querySelectorAll(':scope > .extra-component-chip').forEach((chip) => chip.remove());
    for (const [id, name] of Object.entries(names)) {
      if (enabled(site, id)) continue;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chips chips--optional extra-component-chip';
      chip.setAttribute('aria-label', 'Подключить компонент: ' + name);
      chip.innerHTML = '<span class="chips__icon"><img alt=""></span><span class="chips__caption"></span>';
      chip.querySelector('img').src = new URL(id + '.svg', assets);
      chip.lastElementChild.textContent = name;
      chip.addEventListener('click', () => set(site, id, true));
      list.append(chip);
    }
  }
  function copy(from, to) {
    for (const id of Object.keys(names)) set(to, id, enabled(from, id));
  }
  return { active, set, copy, renderRows, renderChips };
})();
