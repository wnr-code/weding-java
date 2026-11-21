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
        <div class="share-sheet__photo">
          <img class="share-sheet__half share-sheet__half--left" src="/assets/img/foto-bersama-baru.jpg" alt="Ja’far dan Iklimah" width="1400" height="933">
          <img class="share-sheet__half share-sheet__half--right" src="/assets/img/foto-bersama-baru.jpg" alt="" width="1400" height="933">
        </div>
        <h3>Ja’far &amp; Iklimah</h3>
        <p class="share-sheet__message"></p>
      </div>
      <div class="share-social" role="group" aria-label="Pilihan berbagi"></div>
      <p class="share-sheet__status" role="status"></p>
      <div class="share-sheet__footer"></div>
    </div>`;
  panel.querySelector('.share-sheet__message').textContent = teks;
  const footer = document.querySelector('.site-footer');
  if (footer) panel.querySelector('.share-sheet__footer').append(footer.cloneNode(true));
  document.body.append(panel);
  const status = panel.querySelector('[role="status"]');
  const pilihan = panel.querySelector('.share-social');
  const pesan = `${teks}\n${url}`;
  const ikon = {
    wa: '<path d="M20.5 11.8a8.5 8.5 0 0 1-12.7 7.4L3 20.5l1.3-4.7a8.5 8.5 0 1 1 16.2-4Z"/><path d="M8.2 7.8c-.9.6-.7 2.2.5 3.9s3 3.1 4.6 3.5c1.1.3 2.2-.3 2.6-1.2l-2.5-1.3-1 1c-1.3-.6-2.1-1.5-2.6-2.7l.8-.9-1.2-2.4Z"/>',
    fb: '<path fill="currentColor" stroke="none" d="M14 21v-8h2.8l.5-3H14V8.3c0-.9.3-1.3 1.4-1.3H17V4.2A18 18 0 0 0 14.5 4C12 4 10.4 5.5 10.4 8.2V10H8v3h2.4v8Z"/>',
    ig: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3.5"/><circle cx="16.9" cy="7.2" r=".8" fill="currentColor" stroke="none"/>',
    tg: '<path d="m3 11 18-7-4 16-5-4-3 3v-5l8-7-10 6z"/>',
    more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  };
  const salin = async (pesanStatus) => {
    try {
      await navigator.clipboard.writeText(url);
      status.textContent = pesanStatus;
    } catch {
      window.prompt('Salin tautan undangan:', url);
    }
  };
  const tambahPilihan = (kode, nama, tujuan) => {
    const tombol = document.createElement(tujuan ? 'a' : 'button');
    tombol.className = 'share-social__item';
    if (tujuan) {
      tombol.href = tujuan;
      tombol.target = '_blank';
      tombol.rel = 'noopener noreferrer';
    } else tombol.type = 'button';
    tombol.innerHTML = `<span class="share-social__medal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ikon[kode]}</svg></span><span>${nama}</span>`;
    pilihan.append(tombol);
    return tombol;
  };
  tambahPilihan('wa', 'WhatsApp', `https://wa.me/?text=${encodeURIComponent(pesan)}`);
  tambahPilihan('fb', 'Facebook', `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
  tambahPilihan('ig', 'Instagram').addEventListener('click', () => salin('Tautan disalin. Tempel di pesan atau stiker tautan Story Instagram.'));
  tambahPilihan('tg', 'Telegram', `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(teks)}`);
  tambahPilihan('more', 'Lainnya').addEventListener('click', async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: judul, text: teks, url });
        return;
      } catch (galat) {
        if (galat.name === 'AbortError') return;
      }
    }
    await salin('Tautan undangan disalin.');
  });
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
}
