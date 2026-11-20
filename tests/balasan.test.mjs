import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pilihBalasan } from '../public/assets/js/balasan.js';

test('balasan stabil per ucapan dan bervariasi sesuai status kehadiran', () => {
  const jenis = ['hadir', 'tidak_hadir', 'ragu'];
  const tersaji = jenis.map((kehadiran) => new Set(Array.from({length: 50}, (_, i) => {
    const item = { id: `ucapan-${i}`, kehadiran };
    const teks = pilihBalasan(item);
    assert.equal(teks, pilihBalasan({ ...item }));
    return teks;
  })));
  for (const varian of tersaji) assert.ok(varian.size > 1);
  assert.equal(new Set(tersaji.flatMap((varian) => [...varian])).size,
    tersaji.reduce((total, varian) => total + varian.size, 0));
  assert.equal(pilihBalasan({id: 'uji', kehadiran: 'constructor'}), pilihBalasan({id: 'uji', kehadiran: 'ragu'}));
});
