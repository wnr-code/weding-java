/**
 * KONFIGURASI UNDANGAN — Ja'far & Iklimah
 * ---------------------------------------------------------------------------
 * Cukup ubah file ini untuk memperbarui isi undangan. Tidak perlu menyentuh
 * HTML/CSS. Tanggal memakai format ISO 8601 dengan zona waktu WIB (+07:00).
 * Dibuat untuk Cloudflare Workers + D1.
 */

export const CONFIG = {
  /* ------------------------------ Identitas ------------------------------ */
  meta: {
    judul: "The Wedding of Ja'far & Iklimah",
    deskripsi:
      "Undangan pernikahan Dikdik Ja'far Shiddik & Risva Iklimah Adawiyah — Minggu, 3 Januari 2027 (25 Rajab 1448 H) di Gedung Islamic Center, Singaparna, Tasikmalaya.",
    // Ganti dengan alamat situs Anda setelah deploy (dipakai untuk preview WhatsApp).
    url: "https://wedding.cgs.my.id",
    // Gambar preview saat tautan dibagikan.
    gambar: "assets/img/foto-bersama.jpg",
  },

  /* -------------------------- Komentar pembuka --------------------------- */
  pembuka: {
    salam: "Assalamu'alaikum Warahmatullahi Wabarakatuh",
    bismillah: "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ",
    ayat: {
      arab: "وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُمْ مِّنْ أَنْفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوْا إِلَيْهَا وَجَعَلَ بَيْنَكُمْ مَّوَدَّةً وَّرَحْمَةً ۗ إِنَّ فِيْ ذٰلِكَ لَاٰيٰتٍ لِّقَوْمٍ يَّتَفَكَّرُوْنَ",
      terjemah:
        "“Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda kebesaran Allah bagi kaum yang berpikir.”",
      sumber: "QS. Ar-Rum: 21",
    },
    kalimat:
      "Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami:",
  },

  /* ------------------------------- Mempelai ------------------------------ */
  mempelai: {
    pria: {
      nama: "Dikdik Ja'far Shiddik",
      panggilan: "Ja'far",
      urutan: "Putra ketiga dari",
      bapak: "Bapak K.H. Maman Abdurrahman Azis",
      bapakAlmarhum: true,
      ibu: "Ibu Hj. Siti Wafiroh Alfiah",
      // Opsional: tautan Instagram tanpa @ (kosongkan jika tidak dipakai).
      instagram: "",
      foto: "assets/img/mempelai-pria.jpg",
    },
    wanita: {
      nama: "Risva Iklimah Adawiyah",
      panggilan: "Iklimah",
      urutan: "Putri kelima dari",
      bapak: "Bapak Syarip Hidayatulloh",
      bapakAlmarhum: false,
      ibu: "Ibu Sopiah",
      instagram: "",
      foto: "assets/img/mempelai-wanita.jpg",
    },
    // Nama besar yang tampil di sampul: "Ja'far & Iklimah"
    hashtag: "#JaFarIkimah",
  },

  /* --------------------------- Foto kebersamaan --------------------------- */
  /* Catatan: semua foto adalah foto asli. Wajah tidak diedit, tidak direkayasa,
     dan tidak diberi filter — hanya dipotong (crop) untuk potret 3:4. */
  // Foto utuh (tidak dipecah). Tampil dengan animasi dua panel yang menyatu.
  fotoBersama: {
    aktif: true,
    src: "assets/img/foto-bersama.jpg",
    judul: "Kebersamaan",
    ket: "Dua hati, satu tujuan — menuju ridho-Nya",
    catatan: "Sentuh foto untuk melihat versi utuh",
  },

  /* -------------------------------- Waktu -------------------------------- */
  waktu: {
    // Dipakai untuk hitung mundur & tombol simpan kalender.
    mulai: "2027-01-03T08:00:00+07:00",
    tampilanTanggal: "Minggu, 3 Januari 2027",
    tampilanHijriah: "25 Rajab 1448 H",
    lokasiSingkat: "Gedung Islamic Center, Singaparna",
    // Data kalender (.ics / Google Calendar)
    kalender: {
      judul: "Pernikahan Ja'far & Iklimah",
      deskripsi:
        "Akad nikah & resepsi pernikahan Dikdik Ja'far Shiddik & Risva Iklimah Adawiyah.",
      mulaiIso: "20270103T010000Z", // 08.00 WIB
      selesaiIso: "20270103T080000Z", // 15.00 WIB
    },
  },

  /* -------------------------------- Acara -------------------------------- */
  acara: [
    {
      nama: "Akad Nikah",
      jam: "08.00",
      jamSelesai: "Selesai",
      keterangan: "Ijab qabul disaksikan keluarga dan kerabat.",
      ikon: "ring",
    },
    {
      nama: "Resepsi",
      jam: "12.00",
      jamSelesai: "15.00",
      keterangan: "Tasyakuran dan doa restu untuk kedua mempelai.",
      ikon: "cup",
    },
  ],

  /* -------------------------------- Lokasi ------------------------------- */
  lokasi: {
    nama: "Gedung Islamic Center",
    alamat: "Kabupaten Tasikmalaya",
    detail:
      "Jl. Penda, Linggasari 01/06, Desa Singasari, Kec. Singaparna, Kab. Tasikmalaya, Jawa Barat",
    // Titik peta (dipakai untuk tombol petunjuk arah).
    koordinat: { lat: -7.3551, lng: 108.1119 },
    // Kueri yang dikirim ke Google Maps (lebih akurat jika berupa nama tempat).
    kueriPeta: "Gedung Islamic Center Singaparna, Tasikmalaya",
    // Zoom peta sematan.
    zoom: 16,
  },

  /* -------------------------------- Galeri ------------------------------- */
  galeri: [
    {
      src: "assets/img/foto-bersama.jpg",
      judul: "Ja'far & Iklimah",
      ket: "Kebersamaan kami",
    },
    {
      src: "assets/img/mempelai-pria.jpg",
      judul: "Ja'far",
      ket: "Calon mempelai pria",
    },
    {
      src: "assets/img/mempelai-wanita.jpg",
      judul: "Iklimah",
      ket: "Calon mempelai wanita",
    },
  ],

  /* ------------------------------ Tanda kasih ---------------------------- */
  hadiah: {
    aktif: true,
    pembuka:
      "Kehadiran dan doa restu Anda adalah hadiah terindah bagi kami. Bila ingin memberi tanda kasih, kami sediakan kanal berikut.",
    // Tautan Trakteer yang dihubungkan dengan undangan ini.
    trakteer: {
      label: "Dukung kami di Trakteer",
      url: "https://trakteer.id/-java",
      keterangan: "Traktir kami sebagai ucapan selamat — seikhlasnya, sepenuh doa.",
    },
    // Opsional. Kosongkan array untuk menyembunyikan kartu rekening.
    rekening: [
      // { bank: "BCA", nomor: "1234567890", atasNama: "Risva Iklimah Adawiyah" },
    ],
    kadoFisik: {
      alamat: "Jl. Penda, Linggasari 01/06, Singasari, Singaparna, Tasikmalaya",
      atasNama: "Keluarga Ja'far & Iklimah",
    },
  },

  /* --------------------------- Turut mengundang -------------------------- */
  turutMengundang: [
    "Keluarga Besar Pondok Pesantren Al-Waahidiyyah Randegan",
    "Keluarga Besar Bapak H. Elon Dahlan (alm), Bandung",
    "Keluarga Besar Bapak Sunaryo (alm), Ciamis",
    "Keluarga Bapak Hadori (alm) dan Ibu Anah (almh), Culamega",
    "Keluarga Bapak Syapari (alm) dan Ibu Siti (almh), Culamega",
  ],

  /* -------------------------------- Musik -------------------------------- */
  musik: {
    aktif: true,
    judul: "Nafas Doa",
    // Jika diisi (mis. "assets/audio/nasheed.mp3"), berkas itu yang diputar.
    // Bila kosong, undangan memakai musik instrumental islami yang dibangkitkan
    // langsung di peramban (Web Audio) sehingga tanpa berkas & bebas royalti.
    berkas: "",
    volume: 0.5,
  },

  /* ------------------------------ Ucapan/RSVP ---------------------------- */
  ucapan: {
    aktif: true,
    judul: "Ucapan & Kehadiran",
    pembuka:
      "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir. Silakan tinggalkan doa dan konfirmasi kehadiran.",
    batasPesan: 500,
    batasNama: 60,
    maksTamu: 10,
  },

  /* -------------------------------- Penutup ------------------------------ */
  penutup: {
    teks:
      "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa dan restu kepada kedua mempelai.",
    salam: "Wassalamu'alaikum Warahmatullahi Wabarakatuh",
    terimaKasih:
      "Atas kehadiran serta doa restunya, kami ucapkan terima kasih.",
  },

  /* ------------------------------- Kredit -------------------------------- */
  kredit: {
    teks: "Dibuat dengan cinta untuk Ja'far & Iklimah",
    // Muncul di kaki halaman. Hapus/ubah sesuai keinginan.
    tautan: "https://trakteer.id/-java",
    tautanLabel: "Dukung pengembang",
  },
};

/* Nama panggilan gabungan untuk sampul. */
export const PASANGAN = {
  pria: CONFIG.mempelai.pria.panggilan,
  wanita: CONFIG.mempelai.wanita.panggilan,
};

export default CONFIG;
