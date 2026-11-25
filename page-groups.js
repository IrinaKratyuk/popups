window.PageGroups = (() => {
  let nextId = 0;

  function collapsed(list) {
    return new Set(Array.from(list.querySelectorAll('[data-page-group] > [aria-expanded="false"]'),
      (button) => button.parentElement.dataset.pageGroup));
  }

  function render(list, entries, names, closed = collapsed(list)) {
    const groups = new Map();
    const children = document.createDocumentFragment();
    for (const { row, group } of entries) {
      if (!group || !names[group]) {
        children.append(row);
        continue;
      }
      if (!groups.has(group)) {
        const branch = document.createElement(list.tagName === 'UL' ? 'li' : 'div');
        branch.className = 'page-group';
        branch.dataset.pageGroup = group;
        const pages = document.createElement(list.tagName === 'UL' ? 'ul' : 'div');
        pages.className = 'site-tree__pages';
        pages.id = 'page-group-' + ++nextId;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'page-group__toggle';
        button.setAttribute('aria-controls', pages.id);
        const arrow = document.createElement('span');
        arrow.className = 'ml__arrow';
        arrow.setAttribute('aria-hidden', 'true');
        const caption = document.createElement('span');
        caption.className = 'ml__caption';
        caption.textContent = names[group];
        button.append(arrow, caption);
        function setExpanded(expanded) {
          button.setAttribute('aria-expanded', String(expanded));
          arrow.classList.toggle('ml__arrow--down', expanded);
          pages.hidden = !expanded;
        }
        setExpanded(!closed.has(group));
        button.addEventListener('click', () => setExpanded(pages.hidden));
        branch.append(button, pages);
        children.append(branch);
        groups.set(group, pages);
      }
      groups.get(group).append(row);
    }
    list.replaceChildren(children);
  }

  return { collapsed, render };
})();
