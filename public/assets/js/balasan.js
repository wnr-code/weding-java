const BALASAN = {
  hadir: [
    "Terima kasih sudah mengonfirmasi kehadiran. Sampai bertemu di hari bahagia kami!",
    "Kami senang bisa bertemu di hari bahagia kami. Semoga perjalanan menuju acara lancar.",
    "Kami bahagia bisa berbagi momen ini bersama. Sampai jumpa di acara!",
    "Terima kasih telah meluangkan waktu untuk hadir. Kami nantikan kehadirannya.",
    "Insyaallah sampai bertemu di akad atau resepsi. Semoga selalu diberi kesehatan.",
  ],
  tidak_hadir: [
    "Terima kasih sudah mengabari kami. Tak perlu khawatir jika belum bisa hadir.",
    "Terima kasih atas konfirmasinya. Meski belum bisa bertemu, kami tetap memohon doa restunya.",
    "Kami memahami jika belum bisa hadir. Semoga lain waktu kita bisa bersilaturahmi.",
    "Terima kasih telah menyempatkan diri mengisi konfirmasi. Semoga segala urusannya dimudahkan.",
    "Walau belum dapat hadir, doa dari kejauhan sangat berarti bagi kami. Terima kasih.",
  ],
  ragu: [
    "Terima kasih sudah memberi kabar. Bila waktunya memungkinkan, kami senang bisa bertemu.",
    "Semoga jadwalnya dimudahkan. Apa pun keputusannya, terima kasih sudah mengabari kami.",
    "Tak perlu terburu-buru memastikan. Terima kasih sudah memberi kabar.",
    "Jika nanti ada kesempatan untuk hadir, kami nantikan. Terima kasih atas konfirmasinya.",
    "Terima kasih sudah menyampaikan kabar sementara. Semoga segala persiapan dan urusannya lancar.",
  ],
};

// Kenali tema umum tanpa mengulang teks tamu atau mengirimkannya ke layanan AI.
const TEMA = [
  [/\b(?:keturunan|anak)(?: yang)? (?:saleh(?:ah)?|shalih(?:ah)?|sholeh(?:ah)?|penyejuk hati)\b/u, "Aamiin, terima kasih atas doa baik untuk keluarga kami."],
  [/\b(?:sakinah|mawaddah|wa\s*rahmah|samawa|samara|rumah tangga harmonis)\b/u, "Aamiin, semoga Allah membimbing kami membangun keluarga yang penuh kasih sayang dan ketenteraman."],
  [/\b(?:(?:lancar|dimudahkan) sampai hari[ -]h|(?:akad|acaranya?) (?:lancar|dimudahkan)|kelancaran (?:akad|acara))\b/u, "Aamiin, semoga persiapan dan acara kami dimudahkan."],
  [/\bba?araka?lla?ahu?\b|\b(?:semoga berkah|keberkahan)\b/u, "Aamiin, semoga Allah juga melimpahkan keberkahan untuk kita semua."],
  [/\b(?:semoga bahagia|bahagia selalu|semoga langgeng|langgeng sampai tua)\b/u, "Aamiin, semoga kebahagiaan juga selalu menyertai kita semua."],
  [/\b(?:happy wedding|selamat menikah|selamat menempuh hidup baru|selamat atas pernikahannya|congrats|congratulations)\b/u, "Terima kasih atas ucapan hangatnya untuk kami berdua."],
];

function temaPesan(pesan) {
  const teks = String(pesan ?? "").normalize("NFKC").toLowerCase().replace(/\s+/gu, " ");
  return TEMA.find(([pola]) => pola.test(teks))?.[1];
}

export function pilihBalasanHadiah(pesan, uji = false) {
  const doa = "Semoga Allah membalas kebaikan ini, memberkahi keluarga, dan memudahkan segala urusan. Aamiin.";
  if (uji) return `Contoh doa: ${doa}`;
  return `Terima kasih atas tanda kasihnya. ${temaPesan(pesan) ?? doa}`;
}

export function pilihBalasan({ id, created_at, nama, kehadiran, pesan }) {
  const pilihan = Object.hasOwn(BALASAN, kehadiran) ? BALASAN[kehadiran] : BALASAN.ragu;
  // Variasi berdasarkan ID, bukan setiap render, agar balasan tidak berubah saat muat ulang.
  let hash = 2166136261;
  for (const char of String(id ?? `${created_at}|${nama}`)) {
    hash = Math.imul(hash ^ char.codePointAt(0), 16777619);
  }
  const dasar = pilihan[(hash >>> 0) % pilihan.length];
  const konteks = temaPesan(pesan);
  return konteks ? `${konteks} ${dasar}` : dasar;
}
