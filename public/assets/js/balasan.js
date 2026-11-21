import KATEGORI from "./balasan-kategori.js?v=smart-57";

const BALASAN = {
  hadir: [
    "Terima kasih sudah mengonfirmasi kehadiran. Semoga perjalanan menuju acara lancar, aamiin.",
    "Terima kasih sudah berkenan hadir. Semoga Allah menjaga kesehatan sampai hari bahagia kami, aamiin.",
  ],
  tidak_hadir: [
    "Terima kasih sudah mengabari, doa dari jauh pun berarti bagi kami. Semoga segala urusan dimudahkan, aamiin.",
    "Terima kasih sudah memberi kabar, tak perlu khawatir jika belum bisa hadir. Semoga lain waktu kita bisa bersilaturahmi, aamiin.",
  ],
  ragu: [
    "Terima kasih sudah memberi kabar, tidak perlu terburu-buru memastikan. Semoga jadwal dan segala urusannya dimudahkan, aamiin.",
    "Terima kasih sudah mengabari, apa pun keputusannya doa baiknya tetap berarti. Semoga Allah memudahkan segala urusan, aamiin.",
  ],
};

// Kenali tema umum tanpa mengulang teks tamu atau mengirimkannya ke layanan AI.
const TEMA = [
  [/\b(?:keturunan|anak)(?: yang)? (?:saleh(?:ah)?|shalih(?:ah)?|sholeh(?:ah)?|penyejuk hati)\b/u, "Aamiin, terima kasih atas doa baik untuk keluarga kami; semoga Allah juga memberkahi keluarga yang mendoakan."],
  [/\b(?:sakinah|mawaddah|wa\s*rahmah|samawa|samara|rumah tangga harmonis)\b/u, "Aamiin, semoga Allah membimbing kami membangun keluarga yang penuh kasih sayang dan ketenteraman."],
  [/\b(?:(?:lancar|dimudahkan) sampai hari[ -]h|(?:akad|acaranya?) (?:lancar|dimudahkan)|kelancaran (?:akad|acara))\b/u, "Aamiin, semoga persiapan dan acara kami dimudahkan."],
  [/\b(?:semoga berkah|keberkahan)\b/u, "Aamiin, semoga Allah juga melimpahkan keberkahan untuk kita semua."],
  [/\b(?:semoga bahagia|bahagia selalu|semoga langgeng|langgeng sampai tua)\b/u, "Aamiin, semoga kebahagiaan juga selalu menyertai kita semua."],
  [/\b(?:happy wedding|selamat menikah|selamat menempuh hidup baru|selamat atas pernikahannya|congrats|congratulations)\b/u, "Terima kasih atas ucapan hangatnya untuk kami berdua."],
];

// Frasa mendapat bobot sesuai jumlah katanya; pengulangan tidak dihitung.
const normalisasi = (teks) => String(teks ?? "").normalize("NFKC")
  .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

// Jangan bercanda ketika tamu sedang meminta maaf atau menyampaikan kabar duka.
const KONTEKS_SENSITIF = /\b(?:maaf|berduka|meninggal|wafat|musibah|(?:sedang|lagi|masih) sakit|dirawat)\b/u;
const PENYANGKALAN = /\b(?:tidak|tak|bukan|belum|jangan|tanpa|nggak|enggak|gak|ga|ngga|ndak|kagak|teu|henteu)\b/u;

function kategoriPesan(pesan) {
  const teks = normalisasi(pesan);
  if (KONTEKS_SENSITIF.test(teks)) return undefined;
  // Jangan merespons kata benda yang disebut dalam klausa penyangkalan.
  // Lebih baik melewatkan candaan jika pola bahasanya belum jelas.
  const bagian = String(pesan ?? "").normalize("NFKC").toLowerCase()
    .split(/[.!?,;:\n]+|\b(?:tapi|tetapi|namun|melainkan)\b/u)
    .map(normalisasi).filter((klausa) => klausa && !PENYANGKALAN.test(klausa));
  let pilihan;
  let skorTerbaik = 0;
  for (const kategori of KATEGORI) {
    if (!kategori.aktif || !kategori.balasan?.trim()) continue;
    const cocok = [...new Set(kategori.kataKunci.map(normalisasi))]
      .filter((kata) => kata && bagian.some((klausa) => ` ${klausa} `.includes(` ${kata} `)));
    const utama = cocok.filter((kata) => !cocok.some((lain) =>
      lain !== kata && ` ${lain} `.includes(` ${kata} `)));
    const skor = utama.reduce((jumlah, kata) => jumlah + kata.split(" ").length, 0);
    if (skor > skorTerbaik) {
      skorTerbaik = skor;
      pilihan = kategori.balasan;
    }
  }
  return pilihan;
}

const BALASAN_BARAKALLAH = "Aamiin, وَفِيكُمْ بَارَكَ اللَّهُ (wa fiikum baarakallaah) — semoga Allah juga melimpahkan keberkahan untuk yang mendoakan.";

function doaBarakallah(pesan) {
  const teks = String(pesan ?? "").normalize("NFKD").toLowerCase().replace(/\p{M}|ـ/gu, "").replace(/\s+/gu, " ");
  return /بارك الله لك(?:ما)?(?:\s|[،,.!?]|$)|بارك عليكما|جمع بينكما في خير|\bba?araka?lla?ahu?\b/u.test(teks);
}

function temaPesan(pesan) {
  const teks = String(pesan ?? "").normalize("NFKC").toLowerCase().replace(/\s+/gu, " ");
  const arab = teks.replace(/\p{M}|ـ/gu, "");
  if (/اجعل بيتهما بيتا مباركا|المودة والرحمة والسكينة/u.test(arab) || /baitahumaa baitan mubaarakan/u.test(teks)) {
    return "Aamiin, semoga Allah membimbing kami membangun keluarga yang penuh kasih sayang dan ketenteraman.";
  }
  return TEMA.find(([pola]) => pola.test(teks))?.[1];
}

export function pilihBalasanHadiah(pesan, uji = false) {
  const doa = "Semoga Allah membalas kebaikan ini, memberkahi keluarga, dan memudahkan segala urusan. Aamiin.";
  if (uji) return `Contoh doa: ${doa}`;
  const tema = doaBarakallah(pesan) ? BALASAN_BARAKALLAH : temaPesan(pesan);
  if (tema?.startsWith("Aamiin, semoga") || tema === BALASAN_BARAKALLAH) {
    return `Terima kasih atas tanda kasih dan doanya. ${tema}`;
  }
  if (tema?.startsWith("Aamiin,")) return `Terima kasih atas tanda kasihnya. ${tema}`;
  if (tema) return `Terima kasih atas tanda kasih dan ucapan hangatnya. ${doa}`;
  return kategoriPesan(pesan) ?? `Terima kasih atas tanda kasihnya. ${doa}`;
}

export function pilihBalasan({ id, created_at, nama, kehadiran, pesan }) {
  const pilihan = Object.hasOwn(BALASAN, kehadiran) ? BALASAN[kehadiran] : BALASAN.ragu;
  // Variasi berdasarkan ID, bukan setiap render, agar balasan tidak berubah saat muat ulang.
  let hash = 2166136261;
  for (const char of String(id ?? `${created_at}|${nama}`)) {
    hash = Math.imul(hash ^ char.codePointAt(0), 16777619);
  }
  const dasar = pilihan[(hash >>> 0) % pilihan.length];
  const konteks = doaBarakallah(pesan) ? BALASAN_BARAKALLAH : temaPesan(pesan);
  if (konteks) {
    const penutup = kehadiran === "hadir"
      ? "Sampai bertemu di hari bahagia kami."
      : kehadiran === "tidak_hadir"
        ? "Meski belum bisa bertemu, doa dari jauh sangat berarti bagi kami."
        : "Jika ada kesempatan untuk hadir, kami senang bisa bertemu.";
    const terimaKasih = konteks.includes("terima kasih") || konteks.startsWith("Terima kasih")
      ? "" : "Terima kasih atas doa baiknya. ";
    const doaTambahan = konteks.startsWith("Terima kasih")
      ? " Semoga Allah melimpahkan kebaikan untuk kita semua, aamiin." : "";
    return `${terimaKasih}${konteks} ${penutup}${doaTambahan}`;
  }
  return kategoriPesan(pesan) ?? dasar;
}
