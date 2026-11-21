const trigger = document.querySelector('#ujiUcapanPremium');
trigger?.addEventListener('click', () => {
  const panel = document.querySelector('#previewUcapanPremium');
  if (!panel || panel.querySelector('iframe')) return;
  const frame = document.createElement('iframe');
  frame.title = 'Pratinjau tombol Ucapan Premium';
  frame.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox');
  frame.referrerPolicy = 'no-referrer';
  frame.src = '/trakteer-preview.html';
  panel.append(frame);
});
