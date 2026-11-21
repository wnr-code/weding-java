let promptInstal;
const terpasang = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const tombol = document.querySelector('[data-pwa-install]');
const dialog = document.querySelector('#pwaInstallDialog');
if (tombol && dialog && !terpasang) {
  tombol.hidden = false;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    promptInstal = event;
  });
  window.addEventListener('appinstalled', () => { tombol.hidden = true; promptInstal = null; });
  tombol.addEventListener('click', async () => {
    if (promptInstal) {
      const prompt = promptInstal;
      promptInstal = null;
      try { await prompt.prompt(); return; } catch { /* Tampilkan panduan manual. */ }
    }
    dialog.showModal();
  });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
}
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {});
}

const splash = document.querySelector('#pwaSplash');
if (splash && document.documentElement.classList.contains('pwa-splash-start')) {
  // Jangan menunggu foto, musik, atau layanan pihak ketiga.
  const tunda = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : Math.max(0, 700 - performance.now());
  setTimeout(() => splash.classList.add('is-done'), tunda);
}
