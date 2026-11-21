const jam = document.querySelector('[data-site-clock]');
if (jam) {
  const format = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  });
  let timer;
  function perbarui() {
    clearTimeout(timer);
    if (document.hidden) return;
    const sekarang = new Date();
    const teks = format.format(sekarang);
    jam.dateTime = `${teks}+07:00`;
    jam.textContent = `${teks} WIB`;
    timer = setTimeout(perbarui, 1000 - sekarang.getMilliseconds());
  }
  document.addEventListener('visibilitychange', perbarui);
  perbarui();
}
