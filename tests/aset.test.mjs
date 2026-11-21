import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import CONFIG from '../public/assets/js/config.js';
import { AYAT_PERNIKAHAN } from '../public/assets/js/ayat-pernikahan.js';

const publicDir = new URL('../public/', import.meta.url);

test('aset lokal yang dirujuk oleh halaman dan konfigurasi tersedia', async () => {
  const paths = [CONFIG.meta.gambar, CONFIG.fotoBersama.src, CONFIG.musik.berkas,
    ...Object.values(CONFIG.mempelai).map((m) => m.foto).filter(Boolean),
    ...CONFIG.galeri.map((m) => m.src)];
  for (const file of ['index.html', 'ucapan/index.html', 'assets/css/style.css', 'assets/js/app.js']) {
    const body = await readFile(new URL(file, publicDir), 'utf8');
    for (const [, path] of body.matchAll(/(?:^|["'(])\/?(assets\/[^"')\s?#]+)/gm)) paths.push(path);
    for (const [, path] of body.matchAll(/\bfrom\s+["']\.\/([^"'?#]+)/g)) {
      await access(new URL(path, new URL(file, publicDir)));
    }
  }
  await Promise.all([...new Set(paths)].map((path) => access(new URL(path, publicDir))));
});

test('lima rujukan ayat berbeda dan semua memiliki teks serta terjemahan', () => {
  const ayat = [{ ...CONFIG.pembuka.ayat, surah: 30, nomor: 21 }, ...AYAT_PERNIKAHAN];
  assert.equal(ayat.length, 5);
  assert.equal(new Set(ayat.map((a) => `${a.surah}/${a.nomor}`)).size, 5);
  for (const a of ayat) {
    assert.match(a.arab, /\p{Script=Arabic}/u);
    assert.ok(a.terjemah.trim());
    assert.ok(a.sumber.endsWith(`: ${a.nomor}`));
  }
});
