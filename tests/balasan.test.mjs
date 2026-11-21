import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pilihBalasan, pilihBalasanHadiah } from '../public/assets/js/balasan.js';

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

test('balasan menanggapi tema doa tanpa mengubah respon kehadiran', () => {
  const item = { id: 'uji', kehadiran: 'tidak_hadir' };
  const dasar = pilihBalasan(item);
  assert.equal(pilihBalasan({ ...item, pesan: 'Pesan umum' }), dasar);
  const hasil = pilihBalasan({ ...item, pesan: 'Semoga sakinah mawaddah warahmah.' });
  assert.match(hasil, /keluarga yang penuh kasih sayang/);
  assert.match(hasil, /belum bisa bertemu/);
});

test('doa pernikahan mengutamakan tema spesifik tanpa menebak status hadir', () => {
  const item = { id: 'uji-tema', kehadiran: 'tidak_hadir' };
  const dasar = pilihBalasan(item);
  for (const pesan of ['Maaf tidak bisa hadir', 'Kopiannya rapi']) {
    assert.equal(pilihBalasan({ ...item, pesan }), dasar);
  }
  const hasil = pilihBalasan({ ...item, pesan: 'Happy wedding! Semoga sakinah dan langgeng.' });
  assert.match(hasil, /ketenteraman/);
  assert.doesNotMatch(hasil, /ucapan hangatnya/);
  assert.match(hasil, /belum bisa bertemu/);
  assert.match(pilihBalasan({ ...item, pesan: 'Semoga anak sholehah' }), /doa baik untuk keluarga/);
  assert.match(pilihBalasan({ ...item, pesan: 'Dimudahkan sampai hari H' }), /persiapan dan acara/);
});

test('Tanda Kasih tetap berterima kasih dan mengenali variasi doa keberkahan', () => {
  for (const pesan of ['barakallah', 'baarakallah', 'Baarakallaahu laka', 'barakallahu laka']) {
    assert.match(pilihBalasanHadiah(pesan), /^Terima kasih atas tanda kasih dan doanya\. Aamiin, .*wa fiikum baarakallaah.*keberkahan/);
  }
  assert.match(pilihBalasanHadiah('peci'), /suasana pesantren/);
  assert.match(pilihBalasanHadiah('sakinah', true), /^Contoh doa:/);
});

test('kategori baru cocok utuh, mengenali variasi, dan memilih satu balasan', () => {
  const item = { id: 'smart', kehadiran: 'tidak_hadir' };
  for (const [pesan, pola] of [
    ['SABATANG!', /cuma sebatang/], ['KOPI HITAM ☕, kado', /doanya tetap manis/],
    ['kopiah dan kitab', /suasana pesantren/], ['telor dan indo mie', /daftar belanja/],
    ['via QRIS', /atas kebaikannya/],
  ]) {
    assert.match(pilihBalasan({ ...item, pesan }), pola);
    assert.match(pilihBalasanHadiah(pesan), pola);
  }
  const hasil = pilihBalasan({ ...item, pesan: 'kopi kopi kopi, kopi hitam, uang dan hadiah' });
  assert.match(hasil, /atas kebaikannya/);
  assert.doesNotMatch(hasil, /doanya tetap manis|sampai bertemu/i);
});

test('doa Arab berharakat dan tanpa harakat cocok tanpa mengubah status RSVP', () => {
  const item = { id: 'arab', kehadiran: 'hadir' };
  for (const [pesan, pola] of [
    ['بَارَكَ اللَّهُ لَكَ، وَبَارَكَ عَلَيْكَ، وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ', /keberkahan/],
    ['بارك الله لكما وبارك عليكما وجمع بينكما في خير', /keberkahan/],
    ['اللَّهُمَّ اجْعَلْ بَيْتَهُمَا بَيْتًا مُبَارَكًا، وَارْزُقْهُمَا الْمَوَدَّةَ وَالرَّحْمَةَ وَالسَّكِينَةَ', /ketenteraman/],
    ["Allahummaj'al baitahumaa baitan mubaarakan", /ketenteraman/],
  ]) {
    assert.match(pilihBalasan({ ...item, pesan }), /Sampai bertemu/);
    assert.match(pilihBalasan({ ...item, pesan }), pola);
    assert.match(pilihBalasanHadiah(pesan), pola);
  }
});

test('doa Barakallah didahulukan dari kata hadiah dan dibalas tanpa menebak gender', () => {
  const pesan = "Bārakallāhu laka, wa baaraka 'alaika, wa jama'a bainakumaa fii khair. Semoga suka kopinya.";
  const item = { id: 'barakallah', kehadiran: 'hadir' };
  const balasan = pilihBalasan({ ...item, pesan });
  assert.match(balasan, /wa fiikum baarakallaah/);
  assert.match(balasan, /Sampai bertemu/);
  assert.match(pilihBalasanHadiah(pesan), /^Terima kasih atas tanda kasih dan doanya\. .*wa fiikum baarakallaah/);
});

test('penyangkalan dan kabar sensitif tidak memicu humor, doa tetap didahulukan', () => {
  const item = { id: 'konteks', kehadiran: 'tidak_hadir' };
  for (const pesan of ['Saya tidak bawa kado, hanya titip doa', 'Nggak ngopi', 'Maaf, sedang sakit. Kopi menyusul.']) {
    assert.equal(pilihBalasan({ ...item, pesan }), pilihBalasan(item));
    assert.match(pilihBalasanHadiah(pesan), /Terima kasih atas tanda kasihnya/);
  }
  const pesan = 'Semoga akad lancar, kopinya nanti ya.';
  const hasil = pilihBalasan({ ...item, pesan });
  assert.match(hasil, /persiapan dan acara/);
  assert.match(hasil, /belum bisa bertemu/);
  assert.equal(hasil.match(/aamiin/gi)?.length, 1);
  assert.doesNotMatch(hasil, /kopinya boleh pahit/i);
  assert.match(pilihBalasanHadiah(pesan), /persiapan dan acara/);
  assert.match(pilihBalasanHadiah('Happy wedding!'), /Semoga Allah/);
});
