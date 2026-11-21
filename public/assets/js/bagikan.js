const pemicu = document.querySelectorAll('[data-bagikan]');
if (pemicu.length) {
  const judul = 'Pernikahan Ja’far & Iklimah';
  const teks = 'Mohon doa restu untuk pernikahan kami, Ja’far & Iklimah.';
  const url = new URL('/jafar&iklimah', location.origin).href;
  const panel = document.createElement('dialog');
  panel.className = 'bottom-sheet share-sheet';
  panel.setAttribute('aria-labelledby', 'judulBagikan');
  panel.innerHTML = `
    <div class="bottom-sheet__panel">
      <header class="bottom-sheet__head">
        <h2 id="judulBagikan">Bagikan Undangan</h2>
        <button class="sheet-close" type="button" aria-label="Tutup" autofocus><img class="gold-icon" src="/assets/img/ikon/tutup.webp" alt="" width="44" height="44"></button>
      </header>
      <div class="share-sheet__card gold-glow">
        <img class="share-sheet__photo" src="/assets/img/foto-bersama.jpg" alt="Ja’far dan Iklimah" width="1400" height="933" loading="lazy">
        <h3>Ja’far &amp; Iklimah</h3>
        <p class="share-sheet__message"></p>
      </div>
      <div class="btn-row">
        <button class="btn btn--gold" type="button" data-share-native>Bagikan</button>
        <button class="btn btn--outline" type="button" data-share-copy>Salin Tautan</button>
      </div>
      <p class="share-sheet__status" role="status"></p>
      <footer class="share-sheet__footer"></footer>
    </div>`;
  panel.querySelector('.share-sheet__message').textContent = teks;
  panel.querySelector('.share-sheet__footer').textContent = document.querySelector('.site-footer__credit')?.textContent ?? '';
  document.body.append(panel);
  const status = panel.querySelector('[role="status"]');
  const bagikan = panel.querySelector('[data-share-native]');
  bagikan.hidden = typeof navigator.share !== 'function';
  panel.querySelector('.sheet-close').addEventListener('click', () => panel.close());
  panel.addEventListener('click', (e) => { if (e.target === panel) panel.close(); });
  for (const tombol of pemicu) {
    tombol.hidden = false;
    tombol.setAttribute('aria-haspopup', 'dialog');
    tombol.addEventListener('click', () => {
      status.textContent = '';
      if (!panel.open) panel.showModal();
    });
  }
  bagikan.addEventListener('click', async () => {
    try {
      await navigator.share({ title: judul, text: teks, url });
    } catch (galat) {
      if (galat.name !== 'AbortError') status.textContent = 'Belum bisa dibagikan. Coba Salin Tautan.';
    }
  });
  panel.querySelector('[data-share-copy]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      status.textContent = 'Tautan undangan disalin.';
    } catch {
      window.prompt('Salin tautan undangan:', url);
    }
  });
}
