for (const trigger of document.querySelectorAll('[data-sheet-open]')) {
  const sheet = document.getElementById(trigger.dataset.sheetOpen);
  if (!(sheet instanceof HTMLDialogElement)) continue;
  const giftFrame = sheet.querySelector('.tanda-kasih-frame');
  const giftOrigin = 'https://trakteer.id';
  if (giftFrame) {
    giftFrame.addEventListener('load', () => {
      giftFrame.contentWindow?.postMessage({ type: 'embed.openModal' }, giftOrigin);
    });
    window.addEventListener('message', (e) => {
      if (sheet.open && e.origin === giftOrigin && e.source === giftFrame.contentWindow && e.data?.type === 'embed.modalClosed') sheet.close();
    });
    sheet.addEventListener('close', () => giftFrame.removeAttribute('src'));
  }
  trigger.addEventListener('click', (e) => {
    if (giftFrame) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || sheet.open) return;
      const link = new URL(trigger.href);
      if (link.origin !== giftOrigin || !/^\/[\w-]+\/tip\/?$/.test(link.pathname)) return;
      e.preventDefault();
      const embed = new URL(`/v1${link.pathname.replace(/\/$/, '')}/embed/modal`, giftOrigin);
      embed.searchParams.set('embedId', '0');
      embed.searchParams.set('ref', `${location.origin}${location.pathname}`);
      sheet.querySelector('[data-gift-fallback]').href = link.href;
      sheet.showModal();
      giftFrame.src = embed.href;
      return;
    }
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
