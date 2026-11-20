# weding-java — Undangan Pernikahan Ja'far & Iklimah

**Repo:** https://github.com/wnr-code/weding-java · **Worker:** `weding-java` · **Database D1:** `weding-java`

Undangan pernikahan **Dikdik Ja'far Shiddik** & **Risva Iklimah Adawiyah**
— Minggu, **3 Januari 2027** / **25 Rajab 1448 H** — Gedung Islamic Center,
Singaparna, Kabupaten Tasikmalaya.

Dibangun untuk **Cloudflare** (Static Assets + Workers + D1): cepat, gratis
pada kuota wajar, tanpa server yang perlu dirawat, dan tetap ringan di jaringan
seluler.

---

## Fitur

| Permintaan | Wujud di undangan |
| --- | --- |
| Support Cloudflare | Static Assets (`public/`) + Worker API (`worker/`) + D1 (`migrations/`) |
| Data pengantin | Nama, urutan anak, orang tua (termasuk gelar `(alm)`) dari `assets/js/config.js` |
| Tanggal 25 Rajab | Tampil berdampingan dengan 3 Januari 2027 di sampul, hitung mundur, dan acara |
| Terhubung Trakteer | Kartu **Tanda Kasih** → `https://trakteer.id/-java` |
| Kirim ucapan / kehadiran | Formulir *Hadir / Masih Ragu / Tidak Hadir* + jumlah tamu + doa, tersimpan di D1, lengkap dengan statistik |
| Peta | Google Maps sematan (dimuat saat mendekati layar) + tombol petunjuk arah & salin alamat |
| Foto-foto | Foto asli: potret per wajah untuk kedua mempelai + foto utuh dengan animasi dua panel menyatu, semuanya bisa diperbesar (lightbox) |
| Musik Islami | Instrumental maqam Hijaz yang dibangkitkan Web Audio (tanpa berkas) **atau** ganti dengan MP3 nasheed Anda |
| Animasi hiasan Islami | Roset geometris berputar, bulan sabit mengapung, pembatas floral yang "tumbuh" saat digulir, kilau emas, partikel cahaya, bingkai mihrab |

Tambahan yang sudah termasuk:

- Foto bersama dipecah menjadi dua potret wajah (kartu mempelai) **dan** versi utuh yang beranimasi menyatu — sesuai permintaan.
- Sampul dengan nama tamu personal (`?to=Nama`).
- Hitung mundur *live* ke detik.
- Tombol **Simpan Tanggal** (`.ics`) dan **Google Kalender**.
- Navigasi bawah ala aplikasi + bilah kemajuan gulir.
- Mode hemat gerak (`prefers-reduced-motion`) dan struktur `noscript`.
- Font disimpan sendiri (Great Vibes, Cormorant Garamond, Amiri, Plus Jakarta Sans) — tanpa Google Fonts, tanpa permintaan pihak ketiga.
- API dengan validasi, pembatasan laju per IP, dan anonimisasi IP.

---

## Struktur

```
.
├─ public/                        # aset statis (Cloudflare Static Assets)
│  ├─ index.html
│  ├─ _headers                    # header keamanan & cache
│  ├─ favicon.svg · robots.txt
│  └─ assets/
│     ├─ css/style.css
│     ├─ js/config.js             # ← SEMUA DATA UNDANGAN ADA DI SINI
│     ├─ js/app.js · ornament.js · music.js · api.js
│     ├─ fonts/*.woff2
│     └─ img/                     # foto asli, kartu undangan, favicon
│        ├─ foto-bersama.jpg      # foto utuh (tidak dipecah)
│        ├─ mempelai-pria.jpg     # potret wajah Ja'far
│        ├─ mempelai-wanita.jpg   # potret wajah Iklimah
│        └─ kartu-1.jpg, kartu-2.jpg
├─ worker/
│  ├─ index.js                    # API /api/*
│  └─ ucapan.js                   # validasi bersama (dipakai server dev & tes)
├─ migrations/0001_ucapan.sql     # skema D1
├─ server/dev.mjs                 # server lokal tanpa dependency
├─ tests/api.test.mjs             # 19 tes (node --test)
├─ wrangler.toml
└─ package.json
```

---

## 1. Coba dulu di komputer

Tidak perlu `npm install` — server pengembangan hanya memakai modul bawaan Node.

```bash
node server/dev.mjs          # buka http://localhost:4321
```

Ucapan yang dikirim saat mode lokal disimpan di `.dev-data/ucapan.json`
(tidak ikut ter-commit). Untuk mencoba sebagai tamu:

```
http://localhost:4321/?to=Bapak%20Hasan%20%26%20Keluarga
```

Jalankan tes API:

```bash
node --test tests/*.test.mjs
```

---

## 2. Mengubah isi undangan

Semua teks dan angka berada di **`public/assets/js/config.js`**.

| Bagian | Isi |
| --- | --- |
| `meta` | Judul, deskripsi, URL situs, gambar pratinjau WhatsApp |
| `pembuka` | Bismillah, salam, ayat (Arab + terjemah), kalimat pengantar |
| `mempelai` | Nama lengkap & panggilan, urutan anak, orang tua, `bapakAlmarhum`, Instagram, foto |
| `waktu` | `mulai` (ISO +07:00), tanggal tampilan, **`tampilanHijriah`**, data kalender |
| `acara` | Daftar sesi (Akad Nikah, Resepsi) beserta jam |
| `lokasi` | Nama gedung, alamat, `koordinat`, `kueriPeta` untuk Google Maps |
| `galeri` | Daftar `{ src, judul, ket }` |
| `hadiah` | Trakteer, rekening (opsional), alamat kado |
| `turutMengundang` | Daftar keluarga yang turut mengundang |
| `musik` | `aktif`, `berkas` (kosongkan untuk musik bawaan), `volume` |
| `ucapan` | Judul, pengantar, batas karakter |
| `penutup`, `kredit` | Kalimat penutup dan kredit |

Contoh mengubah tanggal:

```js
waktu: {
  mulai: "2027-01-03T08:00:00+07:00",
  tampilanTanggal: "Minggu, 3 Januari 2027",
  tampilanHijriah: "25 Rajab 1448 H",
  ...
}
```

> `mulai` menggerakkan hitung mundur, sedangkan `kalender.mulaiIso` /
> `kalender.selesaiIso` memakai format UTC (`20270103T010000Z` = 08.00 WIB).

### Foto: dipecah per wajah & versi utuh

Saat ini undangan memakai **satu foto bersama** yang diolah menjadi tiga berkas:

| Berkas | Fungsi | Rasio |
| --- | --- | --- |
| `foto-bersama.jpg` | Foto utuh — tampil di bagian **Kebersamaan** dengan animasi dua panel yang menyatu, muncul lagi di galeri, dan jadi pratinjau WhatsApp | 3:2 |
| `mempelai-pria.jpg` | Potongan wajah Ja'far untuk kartu mempelai | 3:4 |
| `mempelai-wanita.jpg` | Potongan wajah Iklimah untuk kartu mempelai | 3:4 |

Cara mengganti:

1. Simpan foto ke `public/assets/img/` (JPG, lebar ± 1200 px, < 250 KB).
2. Perbarui `mempelai.pria.foto`, `mempelai.wanita.foto`, `fotoBersama.src`, dan entri `galeri`.
3. Untuk memotong wajah otomatis tanpa alat desain, jalankan skrip contoh
   (butuh `npm i jimp` sekali pakai):

```js
// potong.js — sesuaikan x, y, lebar, tinggi
import Jimp from "jimp";
const img = await Jimp.read("foto-asli.jpg");
await img.clone().crop(110, 140, 560, 747).quality(88)
  .writeAsync("public/assets/img/mempelai-pria.jpg");   // rasio 3:4
await img.clone().crop(840, 330, 520, 693).quality(88)
  .writeAsync("public/assets/img/mempelai-wanita.jpg");
```

> **Wajah tidak diedit.** Ketiga berkas di atas hanya hasil *crop* dari foto asli
> (tanpa retouching, tanpa filter warna, tanpa rekayasa AI, tanpa perubahan
> proporsi). Animasi hanya menggeser/zoom seluruh foto secara utuh — tidak
> mengubah objek wajah.

Animasi foto:

- Potret mempelai: muncul dari bawah + gerak "napas" sangat halus (skala maksimal
  1,03 dengan titik pusat di area wajah), dan bisa disentuh untuk diperbesar.
- Foto bersama: dua panel kiri-kanan bergeser masuk dan menyatu, garis emas di tengah memudar, lalu keterangan muncul. Semua animasi patuh pada `prefers-reduced-motion`. Menghapus animasi cukup dengan `fotoBersama.aktif: false` (bagian disembunyikan) atau membiarkan potret tetap statis.

### Musik

- **Bawaan:** instrumental Islami yang dihasilkan peramban (Web Audio). Tanpa berkas, tanpa hak cipta, hemat kuota. Nada mulai setelah tamu menekan *Buka Undangan* sesuai kebijakan autoplay peramban.
- **Ganti dengan MP3 nasheed:** taruh berkas di `public/assets/audio/`, lalu isi `musik.berkas: "assets/audio/nasheed.mp3"`. Pastikan Anda memiliki izin penggunaan berkas tersebut.

---

## 3. Menghubungkan Trakteer

Tautan sudah diatur di `config.js`:

```js
trakteer: {
  label: "Dukung kami di Trakteer",
  url: "https://trakteer.id/-java",
  keterangan: "Traktir kami sebagai ucapan selamat — seikhlasnya, sepenuh doa.",
}
```

Bila tautan berubah, cukup ganti `url`. Kosongkan `hadiah.aktif` (`false`)
untuk menyembunyikan seluruh bagian tanda kasih.

---

## 4. Deploy ke Cloudflare

### 4.1 Siapkan database D1

```bash
npx --yes wrangler@4.165.0 login        # sekali saja
npx --yes wrangler@4.165.0 d1 create weding-java
```

Perintah terakhir mencetak `database_id`. Salin nilainya ke
`wrangler.toml`, ganti `00000000-0000-0000-0000-000000000000`.
Sekaligus ubah `IP_SALT` menjadi kalimat acak Anda.

### 4.2 Terapkan skema

```bash
npx --yes wrangler@4.165.0 d1 migrations apply weding-java --remote
```

### 4.3 Deploy

```bash
npx --yes wrangler@4.165.0 deploy
```

Wrangler akan mencetak URL `https://weding-java.<subdomain>.workers.dev`.
Periksa `/api/health` → `{"ok":true,"database":true}`.

### 4.4 Domain sendiri (opsional)

Di Dashboard Cloudflare → **Workers & Pages → weding-java →
Settings → Domains & Routes → Add custom domain**, misalnya
`undangan.namadomain.com`. Setelah itu perbarui `meta.url` di `config.js`.

### 4.5 Deploy lewat GitHub Actions

Dua workflow sudah disiapkan:

- `.github/workflows/checks.yml` — tes API + `wrangler deploy --dry-run` tiap push/PR.
- `.github/workflows/deploy.yml` — deploy manual berkonfirmasi (`DEPLOY-weding-java`).
  Butuh secret `CLOUDFLARE_API_TOKEN` dan `CLOUDFLARE_ACCOUNT_ID` di
  **Settings → Secrets and variables → Actions**.

---

## 5. Berbagi ke tamu

Buat tautan personal per tamu, misalnya:

```
https://undangan.namadomain.com/?to=Bapak%20Ahmad%20Fauzi
```

Nama akan tampil di sampul dan otomatis terisi pada formulir ucapan.
Setelah domain final diketahui, perbarui `og:url` dan `og:image` pada
`public/index.html` agar pratinjau tautan WhatsApp menampilkan gambar undangan.
Nama disimpan di `sessionStorage` sehingga tetap muncul saat halaman dimuat ulang.

Tips: gunakan `encodeURIComponent("Bapak Ahmad Fauzi & Keluarga")`, atau
buat pemendek tautan (mis. `s.id`, `bit.ly`) agar rapi di WhatsApp.

---

## 6. Data ucapan & privasi

- Ucapan disimpan di tabel `ucapan` pada D1 (`migrations/0001_ucapan.sql`).
- Alamat IP **tidak** disimpan; hanya sidik SHA-256 8 byte untuk membatasi
  satu kiriman per 20 detik per pengirim.
- Isi ucapan dirender sebagai teks (bukan HTML) di peramban, sehingga aman
  dari penyisipan skrip.
- Nama tamu di `?to=` dibersihkan dari karakter kendali dan dipotong 70 karakter.

Melihat ucapan yang masuk:

```bash
npx --yes wrangler@4.165.0 d1 execute weding-java --remote \
  --command "SELECT nama, kehadiran, jumlah, pesan, created_at FROM ucapan ORDER BY created_at DESC LIMIT 50"
```

Rekap kehadiran:

```bash
npx --yes wrangler@4.165.0 d1 execute weding-java --remote \
  --command "SELECT kehadiran, COUNT(*) jumlah, SUM(jumlah) tamu FROM ucapan GROUP BY kehadiran"
```

Hapus satu ucapan yang tidak pantas:

```bash
npx --yes wrangler@4.165.0 d1 execute weding-java --remote \
  --command "DELETE FROM ucapan WHERE id = 'UUID-UCAPAN'"
```

---

## 7. Catatan teknis

- **Tanpa build.** Tidak ada bundler; berkas ES module dimuat langsung.
  Total aset ± 1,1 MB (mayoritas gambar & font) dan ± 2,9 KB gzip untuk Worker.
- **API**: `GET /api/health`, `GET /api/ucapan?limit=6&offset=0`,
  `POST /api/ucapan` (`{ nama, kehadiran, jumlah, pesan }`).
  `kehadiran` ∈ `hadir | tidak_hadir | ragu`.
- **Fallback**: bila API tidak tersedia (mis. membuka `index.html` langsung),
  formulir menyimpan ucapan di `localStorage` dan menandainya *mode pratinjau*.
- **Kuota gratis Cloudflare** (Workers + D1 + Static Assets) jauh di atas
  kebutuhan satu undangan (ribuan tampilan/hari).
- Bila ingin menambah proteksi bot, aktifkan **Cloudflare Turnstile** dan
  verifikasi token di `worker/index.js` sebelum `INSERT`.

---

## 8. Perintah ringkas

```bash
node server/dev.mjs                              # pratinjau lokal
node --test tests/*.test.mjs                     # tes API
npx wrangler@4.165.0 deploy --dry-run            # validasi konfigurasi
npx wrangler@4.165.0 d1 migrations apply weding-java --remote
npx wrangler@4.165.0 deploy                      # terbit
```

---

Dibuat dengan cinta untuk Ja'far & Iklimah. Barakallahu lakuma wa baraka
'alaikuma wa jama'a bainakuma fii khair.
