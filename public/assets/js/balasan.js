const BALASAN = {
  hadir: [
    "Terima kasih sudah mengonfirmasi kehadiran. Sampai bertemu di hari bahagia kami!",
    "Kami senang Bapak/Ibu berkenan hadir. Semoga perjalanan menuju acara lancar.",
    "Merupakan kebahagiaan bagi kami dapat menyambut Bapak/Ibu. Sampai jumpa di acara!",
    "Terima kasih telah meluangkan waktu untuk hadir. Kami nantikan kehadiran Bapak/Ibu.",
    "Insyaallah sampai bertemu di akad atau resepsi. Semoga Bapak/Ibu selalu diberi kesehatan.",
  ],
  tidak_hadir: [
    "Tidak apa-apa bila belum bisa hadir. Terima kasih sudah mengabari kami.",
    "Terima kasih atas konfirmasinya. Meski belum bisa bertemu, kami tetap memohon doa restu Bapak/Ibu.",
    "Kami memahami Bapak/Ibu berhalangan. Semoga lain waktu kita bisa bersilaturahmi.",
    "Terima kasih telah menyempatkan diri mengisi konfirmasi. Semoga segala urusan Bapak/Ibu dimudahkan.",
    "Walau belum dapat hadir, doa dari kejauhan sangat berarti bagi kami. Terima kasih.",
  ],
  ragu: [
    "Terima kasih sudah memberi kabar. Bila waktunya memungkinkan, kami senang menyambut Bapak/Ibu.",
    "Semoga jadwal Bapak/Ibu dimudahkan. Apa pun keputusannya, terima kasih sudah mengabari kami.",
    "Tidak perlu terburu-buru memastikan. Kami menghargai kabar dan doa Bapak/Ibu.",
    "Jika nanti ada kesempatan untuk hadir, kami nantikan. Terima kasih atas konfirmasinya.",
    "Terima kasih sudah menyampaikan kabar sementara. Semoga segala persiapan dan urusan Bapak/Ibu lancar.",
  ],
};

export function pilihBalasan({ id, created_at, nama, kehadiran }) {
  const pilihan = Object.hasOwn(BALASAN, kehadiran) ? BALASAN[kehadiran] : BALASAN.ragu;
  // Variasi berdasarkan ID, bukan setiap render, agar balasan tidak berubah saat muat ulang.
  let hash = 2166136261;
  for (const char of String(id ?? `${created_at}|${nama}`)) {
    hash = Math.imul(hash ^ char.codePointAt(0), 16777619);
  }
  return pilihan[(hash >>> 0) % pilihan.length];
}
