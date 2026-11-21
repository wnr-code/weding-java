for (const trigger of document.querySelectorAll('[data-sheet-open]')) {
  const sheet = document.getElementById(trigger.dataset.sheetOpen);
  if (!(sheet instanceof HTMLDialogElement)) continue;
  trigger.addEventListener('click', () => {
    if (sheet.open) return;
    sheet.showModal();
    const map = sheet.querySelector('iframe[data-src]');
    if (map && !map.hasAttribute('src')) map.src = map.dataset.src;
  });
  sheet.querySelector('[data-sheet-close]')?.addEventListener('click', () => sheet.close());
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet) sheet.close();
  });
}
