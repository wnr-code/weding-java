import assert from 'node:assert/strict';
import { test } from 'node:test';
import { kirimUcapan } from '../public/assets/js/api.js';

test('fallback ucapan hanya melaporkan tersimpan jika penyimpanan lokal berhasil', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('offline'); });
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let tersimpan;
  const penyimpanan = {
    getItem: () => null,
    setItem: (_key, value) => { tersimpan = JSON.parse(value); },
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: penyimpanan });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete globalThis.localStorage;
  });
  const data = { nama: 'Tamu Uji', kota: 'Bandung', kehadiran: 'hadir', jumlah: 1, pesan: 'Selamat!' };
  assert.equal((await kirimUcapan(data)).mode, 'lokal');
  assert.equal(tersimpan[0].kota, 'Bandung');
  penyimpanan.setItem = () => { throw new Error('Kuota penuh'); };
  await assert.rejects(kirimUcapan(data), /Ucapan belum tersimpan/);
});
