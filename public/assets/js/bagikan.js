for (const tombol of document.querySelectorAll('[data-bagikan]')) {
  const judul = 'Pernikahan Ja’far & Iklimah';
  const teks = 'Mohon doa restu untuk pernikahan kami, Ja’far & Iklimah.';
  const url = new URL('/jafar&iklimah', location.origin).href;
  tombol.hidden = false;
  tombol.addEventListener('click', async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: judul, text: teks, url });
        return;
      } catch (galat) {
        if (galat.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${teks}\n${url}`);
      tombol.querySelector('span').textContent = 'Disalin';
      setTimeout(() => { tombol.querySelector('span').textContent = 'Bagikan'; }, 2200);
    } catch {
      window.prompt('Salin pesan undangan:', `${teks}\n${url}`);
    }
  });
}
