const BALASAN = {
  hadir: [
    "Terima kasih sudah mengonfirmasi kehadiran. Sampai bertemu di hari bahagia kami!",
    "Kami senang bisa bertemu di hari bahagia kami. Semoga perjalanan menuju acara lancar.",
    "Kami bahagia bisa berbagi momen ini bersama. Sampai jumpa di acara!",
    "Terima kasih telah meluangkan waktu untuk hadir. Kami nantikan kehadirannya.",
    "Insyaallah sampai bertemu di akad atau resepsi. Semoga selalu diberi kesehatan.",
  ],
  tidak_hadir: [
    "Tidak apa-apa bila belum bisa hadir. Terima kasih sudah mengabari kami.",
    "Terima kasih atas konfirmasinya. Meski belum bisa bertemu, kami tetap memohon doa restunya.",
    "Kami memahami jika belum bisa hadir. Semoga lain waktu kita bisa bersilaturahmi.",
    "Terima kasih telah menyempatkan diri mengisi konfirmasi. Semoga segala urusannya dimudahkan.",
    "Walau belum dapat hadir, doa dari kejauhan sangat berarti bagi kami. Terima kasih.",
  ],
  ragu: [
    "Terima kasih sudah memberi kabar. Bila waktunya memungkinkan, kami senang bisa bertemu.",
    "Semoga jadwalnya dimudahkan. Apa pun keputusannya, terima kasih sudah mengabari kami.",
    "Tidak perlu terburu-buru memastikan. Kami menghargai kabar dan doa Bapak/Ibu.",
    "Jika nanti ada kesempatan untuk hadir, kami nantikan. Terima kasih atas konfirmasinya.",
    "Terima kasih sudah menyampaikan kabar sementara. Semoga segala persiapan dan urusannya lancar.",
  ],
};

// Kenali tema umum tanpa mengulang teks tamu atau mengirimkannya ke layanan AI.
const TEMA = [
  [/\b(sakinah|mawaddah|warahmah|rahmah|samawa|samara)\b/u, "Aamiin, semoga Allah membimbing kami membangun keluarga yang penuh kasih sayang."],
  [/\b(lancar|kelancaran|dimudahkan)\b/u, "Aamiin, semoga Allah memudahkan persiapan dan jalannya acara."],
  [/\b(barakallahu|berkah|keberkahan)\b/u, "Aamiin, semoga Allah juga melimpahkan keberkahan untuk yang mendoakan dan keluarganya."],
  [/\b(bahagia|kebahagiaan|langgeng)\b/u, "Aamiin, semoga kebahagiaan dan kebaikan juga senantiasa menyertai kita semua."],
  [/\b(selamat|congrats|congratulations)\b/u, "Ucapan selamat ini sangat berarti bagi kami."],
];

export function pilihBalasan({ id, created_at, nama, kehadiran, pesan }) {
  const pilihan = Object.hasOwn(BALASAN, kehadiran) ? BALASAN[kehadiran] : BALASAN.ragu;
  // Variasi berdasarkan ID, bukan setiap render, agar balasan tidak berubah saat muat ulang.
  let hash = 2166136261;
  for (const char of String(id ?? `${created_at}|${nama}`)) {
    hash = Math.imul(hash ^ char.codePointAt(0), 16777619);
  }
  const dasar = pilihan[(hash >>> 0) % pilihan.length];
  const ucapan = String(pesan ?? "").normalize("NFKC").toLowerCase();
  const konteks = TEMA.find(([pola]) => pola.test(ucapan))?.[1];
  return konteks ? `${konteks} ${dasar}` : dasar;
}
