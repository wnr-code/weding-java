/**
 * Undangan Pernikahan — Ja'far & Iklimah
 * Logika antarmuka: isi data, hitung mundur, peta, galeri, musik,
 * ucapan/kehadiran, serta animasi ornamen.
 */

import { pilihBalasan, pilihBalasanHadiah } from "./balasan.js?v=konteks-89";
import { AYAT_PERNIKAHAN } from "./ayat-pernikahan.js";
import CONFIG from "./config.js?v=groom-104";
import { injectOrnaments, icons } from "./ornament.js";
import { Music } from "./music.js?v=qalbi-102";
import * as api from "./api.js?v=audit-29";

/* Tandai bahwa JS aktif: elemen beranimasi baru disembunyikan lewat kelas ini. */
document.documentElement.classList.add("js");

/* ------------------------------- Pembantu -------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const on = (node, ev, fn, opt) => node && node.addEventListener(ev, fn, opt);

const mediaGerak = window.matchMedia("(prefers-reduced-motion: reduce)");
const kurangiGerak = () => mediaGerak.matches;

function toast(pesan, ms = 2600) {
  const box = $("#toast");
  if (!box) return;
  box.textContent = pesan;
  box.classList.add("is-visible");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => box.classList.remove("is-visible"), ms);
}

async function salinTeks(teks) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(teks);
      return true;
    }
  } catch { /* lanjut ke cara lama */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = teks;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

const inisial = (nama = "") =>
  nama
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase() || "?";

/* ------------------------------ Data & teks ------------------------------- */
const ayatPilihan = [{ ...CONFIG.pembuka.ayat, surah: 30, nomor: 21 }, ...AYAT_PERNIKAHAN];
const ayat = ayatPilihan[Math.floor(Math.random() * ayatPilihan.length)];
const M = CONFIG.mempelai;
const W = CONFIG.waktu;

const namaBapak = (p) => `${p.bapak}${p.bapakAlmarhum ? " (alm)" : ""}`;
const igUrl = (p) => (p.instagram ? `https://instagram.com/${p.instagram.replace(/^@/, "")}` : "");

const TAMU_KEY = "weding-java:tamu";
function ambilTamu() {
  const p = new URLSearchParams(location.search);
  const mentah = (p.get("to") || p.get("kepada") || p.get("nama") || "").trim();
  if (mentah) {
    const nama = mentah.replace(/[\u0000-\u001f<>]/g, "").slice(0, 70);
    try { sessionStorage.setItem(TAMU_KEY, nama); } catch { /* privat */ }
    return nama;
  }
  try { return sessionStorage.getItem(TAMU_KEY) || ""; } catch { return ""; }
}
const namaTamu = ambilTamu();

const NILAI = {
  panggilanPria: M.pria.panggilan,
  panggilanWanita: M.wanita.panggilan,
  namaPria: M.pria.nama,
  namaWanita: M.wanita.nama,
  urutanPria: M.pria.urutan,
  urutanWanita: M.wanita.urutan,
  bapakPria: namaBapak(M.pria),
  ibuPria: M.pria.ibu,
  bapakWanita: namaBapak(M.wanita),
  ibuWanita: M.wanita.ibu,
  igPriaLabel: M.pria.instagram ? `@${M.pria.instagram.replace(/^@/, "")}` : "",
  igWanitaLabel: M.wanita.instagram ? `@${M.wanita.instagram.replace(/^@/, "")}` : "",
  fotoJudul: CONFIG.fotoBersama?.judul || "Kebersamaan",
  fotoKet: CONFIG.fotoBersama?.ket || "",
  fotoCatatan: CONFIG.fotoBersama?.catatan || "",
  pasanganScript: `${M.pria.panggilan} & ${M.wanita.panggilan}`,
  tanggal: W.tampilanTanggal,
  hijriah: W.tampilanHijriah,
  lokasiNama: CONFIG.lokasi.nama,
  lokasiDetail: CONFIG.lokasi.detail,
  bismillah: CONFIG.pembuka.bismillah,
  salam: CONFIG.pembuka.salam,
  ayatArab: ayat.arab,
  ayatTerjemah: ayat.terjemah,
  ayatSumber: ayat.sumber,
  kalimatPembuka: CONFIG.pembuka.kalimat,
  hadiahPembuka: CONFIG.hadiah.pembuka,
  trakteerLabel: CONFIG.hadiah.trakteer.label,
  trakteerKet: CONFIG.hadiah.trakteer.keterangan,
  kadoAlamat: CONFIG.hadiah.kadoFisik.alamat,
  kadoNama: CONFIG.hadiah.kadoFisik.atasNama,
  ucapanJudul: CONFIG.ucapan.judul,
  ucapanPembuka: CONFIG.ucapan.pembuka,
  penutupTeks: CONFIG.penutup.teks,
  penutupSalam: CONFIG.penutup.salam,
  terimaKasih: CONFIG.penutup.terimaKasih,
  hashtag: M.hashtag,
  tamu: namaTamu || "Tamu Undangan",
};

function isiTeks() {
  $$("[data-bind]").forEach((node) => {
    const v = NILAI[node.dataset.bind];
    node.textContent = v ?? "";
  });
  $$("[data-bind-src]").forEach((img) => {
    const key = img.dataset.bindSrc;
    const src = key === "fotoPria" ? M.pria.foto : M.wanita.foto;
    if (src) img.src = src;
    const nama = key === "fotoPria" ? M.pria.nama : M.wanita.nama;
    img.alt = `Foto ${nama}`;
  });
  $$("[data-bind-href]").forEach((a) => {
    const key = a.dataset.bindHref;
    const url = key === "igPria" ? igUrl(M.pria) : igUrl(M.wanita);
    if (url) {
      a.href = url;
      a.hidden = false;
    } else {
      a.hidden = true;
    }
  });
  document.title = `${CONFIG.meta.judul} · ${W.tampilanTanggal}`;
}

/* --------------------------------- Acara --------------------------------- */
function renderAcara() {
  const box = $("#events");
  if (!box) return;
  box.innerHTML = CONFIG.acara
    .map(
      (a) => `<article class="event reveal">
        <div class="event__icon">${icons[a.ikon] || icons.ring}</div>
        <h3 class="event__name">${a.nama}</h3>
        <p class="event__time">${a.jam}<span class="sep">–</span>${a.jamSelesai}<span class="sep">·</span>WIB</p>
        <p class="event__note">${a.keterangan}</p>
        <span class="event__day">${W.tampilanTanggal}</span>
      </article>`
    )
    .join("");

  const daftar = $("#invitedList");
  if (daftar) {
    daftar.innerHTML = CONFIG.turutMengundang.map((k) => `<li>${k}</li>`).join("");
  }
}

/* -------------------------------- Galeri --------------------------------- */
let galeriIndex = 0;
function renderGaleri() {
  const box = $("#gallery");
  if (!box) return;
  box.innerHTML = CONFIG.galeri
    .map(
      (g, i) => `<button class="gallery__item reveal" type="button" data-i="${i}" style="--d:${i * 60}ms" aria-label="Perbesar foto: ${g.judul}">
        <img src="${g.src}" alt="${g.judul}" loading="lazy" decoding="async" />
        <span class="gallery__caption"><strong>${g.judul}</strong><span>${g.ket}</span></span>
      </button>`
    )
    .join("");
}

let bukaFoto = () => {};

function pasangLightbox() {
  const lb = $("#lightbox");
  const img = $("#lightboxImg");
  const cap = $("#lightboxCap");
  if (!lb || !img) return;

  const tampilkan = (src, judul, keterangan) => {
    img.src = src;
    img.alt = judul;
    cap.textContent = keterangan;
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add("is-open"));
    document.body.classList.add("is-locked");
    $("#lightboxClose").focus();
  };
  const buka = (i, capOverride) => {
    galeriIndex = (i + CONFIG.galeri.length) % CONFIG.galeri.length;
    const g = CONFIG.galeri[galeriIndex];
    tampilkan(g.src, g.judul, capOverride || `${g.judul} — ${g.ket}`);
  };
  const tutup = () => {
    lb.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    setTimeout(() => { lb.hidden = true; }, 320);
  };

  // Buka foto tertentu (dipakai potret mempelai & foto kebersamaan).
  bukaFoto = (src, capOverride) => {
    const i = CONFIG.galeri.findIndex((g) => g.src === src);
    if (i >= 0) buka(i, capOverride);
    else if (src) tampilkan(src, capOverride, capOverride);
  };

  on($("#gallery"), "click", (e) => {
    const btn = e.target.closest(".gallery__item");
    if (btn) buka(Number(btn.dataset.i));
  });
  on($("#lightboxClose"), "click", tutup);
  on($("#lightboxPrev"), "click", () => buka(galeriIndex - 1));
  on($("#lightboxNext"), "click", () => buka(galeriIndex + 1));
  on(lb, "click", (e) => { if (e.target === lb) tutup(); });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") tutup();
    if (e.key === "ArrowLeft") buka(galeriIndex - 1);
    if (e.key === "ArrowRight") buka(galeriIndex + 1);
  });
}

/* ----------------------- Foto mempelai & kebersamaan --------------------- */
function pasangFotoSpesial() {
  // Potret hasil "pecahan" foto bersama → bisa diperbesar.
  $$(".person__photo").forEach((ph, i) => {
    const orang = i === 0 ? M.pria : M.wanita;
    ph.tabIndex = 0;
    ph.setAttribute("role", "button");
    ph.setAttribute("aria-label", `Perbesar foto ${orang.nama}`);
    const buka = () => bukaFoto(orang.foto, `${orang.nama} — ${orang.panggilan}`);
    on(ph, "click", buka);
    on(ph, "keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        buka();
      }
    });
  });

  // Foto utuh (tidak dipecah) dengan animasi dua panel menyatu.
  const F = CONFIG.fotoBersama;
  const section = $("#kebersamaan");
  const box = $("#splitFoto");
  if (!section || !box) return;
  if (!F || F.aktif === false || !F.src) {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  $$(".split__half", box).forEach((h) => {
    h.style.backgroundImage = `url("${F.src}")`;
  });
  const buka = () => bukaFoto(F.src, `${F.judul} — ${F.ket}`);
  on(box, "click", buka);
  on(box, "keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      buka();
    }
  });
}

/* ----------------------------- Hitung mundur ----------------------------- */
function pasangHitungMundur() {
  const target = new Date(W.mulai).getTime();
  const box = $("#countdown");
  const note = $("#countdownNote");
  if (!box || !Number.isFinite(target)) return;

  const cell = (k) => box.querySelector(`[data-cd="${k}"]`);
  const pad = (v) => String(Math.max(0, v)).padStart(2, "0");

  const tick = () => {
    const sisa = target - Date.now();
    if (sisa <= 0) {
      box.classList.remove("is-live");
      ["hari", "jam", "menit", "detik"].forEach((k) => (cell(k).textContent = "00"));
      if (note) note.textContent = "Alhamdulillah, acara telah berlangsung. Terima kasih atas doa dan kehadirannya. 🤍";
      clearInterval(tick._id);
      return;
    }
    box.classList.add("is-live");
    const detik = Math.floor(sisa / 1000);
    cell("hari").textContent = pad(Math.floor(detik / 86400));
    cell("jam").textContent = pad(Math.floor((detik % 86400) / 3600));
    cell("menit").textContent = pad(Math.floor((detik % 3600) / 60));
    cell("detik").textContent = pad(detik % 60);
    if (note) note.textContent = "";
  };
  tick();
  tick._id = setInterval(tick, 1000);
}

/* ------------------------------- Kalender -------------------------------- */
function pasangKalender() {
  const k = W.kalender;
  const lokasi = `${CONFIG.lokasi.nama}, ${CONFIG.lokasi.detail}`;

  const gcal = $("#btnGcal");
  if (gcal) {
    const q = new URLSearchParams({
      action: "TEMPLATE",
      text: k.judul,
      dates: `${k.mulaiIso}/${k.selesaiIso}`,
      details: k.deskripsi,
      location: lokasi,
    });
    gcal.href = `https://calendar.google.com/calendar/render?${q.toString()}`;
  }

  on($("#btnIcs"), "click", () => {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const isi = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Ja'far & Iklimah//Undangan//ID",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@weding-java`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${k.mulaiIso}`,
      `DTEND:${k.selesaiIso}`,
      `SUMMARY:${k.judul}`,
      `DESCRIPTION:${k.deskripsi.replace(/,/g, "\\,")}`,
      `LOCATION:${lokasi.replace(/,/g, "\\,")}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT3H",
      "ACTION:DISPLAY",
      "DESCRIPTION:Pernikahan Ja'far & Iklimah",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([isi], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pernikahan-jafar-iklimah.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast("Tanggal disimpan. Cek kalender Anda 🤍");
  });
}

/* --------------------------------- Peta ---------------------------------- */
function pasangPeta() {
  const L = CONFIG.lokasi;
  const tujuan = L.koordinat && Number.isFinite(L.koordinat.lat)
    ? `${L.koordinat.lat},${L.koordinat.lng}`
    : L.kueriPeta;
  const urlPeta = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(L.kueriPeta)}`;
  const urlRute = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(tujuan)}`;

  [$("#btnMaps"), $("#btnMaps2")].forEach((a) => {
    if (a) a.href = a.id === "btnMaps" ? urlRute : urlPeta;
  });

  const alamatLengkap = `${L.nama}, ${L.detail}`;
  [$("#btnSalinAlamat"), $("#btnSalinKado")].forEach((btn) => {
    on(btn, "click", async () => {
      const teks = btn.id === "btnSalinKado" ? `${CONFIG.hadiah.kadoFisik.alamat} (${CONFIG.hadiah.kadoFisik.atasNama})` : alamatLengkap;
      const ok = await salinTeks(teks);
      toast(ok ? "Alamat disalin ✓" : "Gagal menyalin, silakan salin manual");
    });
  });


}

/* ------------------------------ Tanda kasih ------------------------------- */
function hadiahTersedia() {
  const H = CONFIG.hadiah;
  return H.aktif && Boolean(H.trakteer?.url || H.rekening?.length || H.kadoFisik?.alamat);
}
function pasangHadiah() {
  const H = CONFIG.hadiah;
  const section = $("#hadiah");
  if (!section) return;
  const adaTrakteer = Boolean(H.trakteer && H.trakteer.url);
  const adaRekening = Array.isArray(H.rekening) && H.rekening.length > 0;
  const adaKado = Boolean(H.kadoFisik && H.kadoFisik.alamat);
  if (!hadiahTersedia()) return;

  section.hidden = false;

  const link = $("#linkTrakteer");
  if (link) {
    if (adaTrakteer) {
      link.href = H.trakteer.url;
    } else {
      link.hidden = true;
    }
  }

  if (adaRekening) {
    const list = $("#rekeningList");
    list.hidden = false;
    list.innerHTML = H.rekening
      .map(
        (r, i) => `<div class="rekening__card">
          <span class="rekening__bank">${r.bank}</span>
          <span>
            <span class="rekening__num">${r.nomor}</span>
            <span class="rekening__name">a.n. ${r.atasNama}</span>
          </span>
          <button class="btn btn--ghost btn--sm rekening__copy" type="button" data-rek="${i}">Salin</button>
        </div>`
      )
      .join("");
    on(list, "click", async (e) => {
      const btn = e.target.closest("[data-rek]");
      if (!btn) return;
      const r = H.rekening[Number(btn.dataset.rek)];
      const ok = await salinTeks(r.nomor);
      toast(ok ? `Nomor ${r.bank} disalin ✓` : "Gagal menyalin nomor");
    });
  }

  if (!adaKado) $("#kadoFisik").hidden = true;
  else $("#kadoFisik").hidden = false;
}

/* -------------------------- Ucapan & kehadiran --------------------------- */
const U = CONFIG.ucapan;
const state = { offset: 0, limit: 6, total: 0, memuat: null };

function badgeKehadiran(item) {
  const map = {
    hadir: { teks: "Hadir", cls: "wish__badge--hadir" },
    tidak_hadir: { teks: "Tidak hadir", cls: "wish__badge--tidak" },
    ragu: { teks: "Masih ragu", cls: "wish__badge--ragu" },
  };
  return map[item.kehadiran] || map.ragu;
}

function labelKiriman(teks, gaya) {
  const label = document.createElement("span");
  label.className = `wish__kind wish__kind--${gaya}`;
  label.textContent = teks;
  return label;
}

const ilustrasiMempelai = ["taman", "pelaminan", "senja", "bintang", "ngaji", "doa", "berbagi", "jalan", "tani", "fu-biru", "tangga", "kolam", "unggun", "payung", "kain", "teh"];
for (let i = ilustrasiMempelai.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [ilustrasiMempelai[i], ilustrasiMempelai[j]] = [ilustrasiMempelai[j], ilustrasiMempelai[i]];
}

function pasangWajahKartu(kartu, avatar, isi, urutan) {
  const depan = document.createElement("div");
  depan.className = "wish wish__front";
  depan.append(avatar, isi);
  const belakang = document.createElement("div");
  belakang.className = "wish__back";
  belakang.setAttribute("aria-hidden", "true");
  const ilustrasi = document.createElement("img");
  ilustrasi.className = "wish__back-art";
  ilustrasi.alt = "";
  ilustrasi.loading = "lazy";
  ilustrasi.decoding = "async";
  const adegan = ilustrasiMempelai[urutan % ilustrasiMempelai.length];
  ilustrasi.src = new URL(`../img/ilustrasi-segar-${adegan}.webp`, import.meta.url).href;
  belakang.append(ilustrasi);
  kartu.append(depan, belakang);
}

function buatCentangPengirim() {
  const centang = document.createElement("span");
  centang.className = "wish__sender-check";
  centang.setAttribute("aria-hidden", "true");
  centang.textContent = "✓";
  return centang;
}

const formatWaktuKiriman = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
});
function buatWaktuKiriman(iso) {
  if (!iso) return null;
  const tanggal = new Date(iso);
  if (!Number.isFinite(tanggal.getTime())) return null;
  const waktu = document.createElement("time");
  waktu.dateTime = tanggal.toISOString();
  waktu.textContent = `${formatWaktuKiriman.format(tanggal)} WIB`;
  return waktu;
}

function buatKartuUcapan(item, urutan) {
  const li = document.createElement("li");
  li.className = "wish-slot";

  const av = document.createElement("div");
  av.className = "wish__avatar";
  av.textContent = inisial(item.nama);

  const body = document.createElement("div");
  body.className = "wish__body";

  const top = document.createElement("div");
  top.className = "wish__top";

  const nm = document.createElement("span");
  nm.className = "wish__name";
  nm.textContent = item.nama;
  nm.append(buatCentangPengirim());

  const b = badgeKehadiran(item);
  const badge = document.createElement("span");
  badge.className = `wish__badge ${b.cls}`;
  li.dataset.kehadiran = item.kehadiran;
  badge.textContent = b.teks;

  top.append(nm, badge);
  body.append(labelKiriman("Ucapan & Doa", "doa"), top);
  const waktu = buatWaktuKiriman(item.created_at);
  if (waktu) {
    const meta = document.createElement("p");
    meta.className = "wish__reply-label";
    meta.append("Dikirim · ", waktu);
    body.append(meta);
  }
  if (item.kota) {
    const kota = document.createElement("p");
    kota.className = "wish__city";
    kota.textContent = `Asal: ${item.kota}`;
    body.append(kota);
  }

  if (item.pesan) {
    const msg = document.createElement("p");
    msg.className = "wish__msg";
    msg.textContent = item.pesan;
    body.appendChild(msg);
  }

  body.append(buatReaksi());
  pasangWajahKartu(li, av, body, urutan);
  li.querySelector(".wish__front").append(buatBalasan(pilihBalasan(item), item.created_at));
  return li;
}

function buatReaksi() {
  const reaksi = document.createElement("span");
  reaksi.className = "wish__reaction";
  reaksi.setAttribute("role", "img");
  reaksi.setAttribute("aria-label", "Disukai kedua mempelai, ditampilkan otomatis");
  const cincin = document.createElement("img");
  cincin.src = new URL("../img/cincin-emas.svg", import.meta.url).href;
  cincin.alt = "";
  cincin.width = 28;
  cincin.height = 21;
  reaksi.append(cincin);
  return reaksi;
}

function buatBalasan(kalimat, waktuKiriman) {
  const reply = document.createElement("div");
  reply.className = "wish__reply";
  const replyAvatar = document.createElement("span");
  replyAvatar.className = "wish__reply-avatar";
  replyAvatar.setAttribute("aria-hidden", "true");
  const pengantinPembalas = [M.pria, M.wanita];
  for (const pengantin of pengantinPembalas) {
    const foto = document.createElement("img");
    foto.src = new URL(`../../${pengantin.foto}`, import.meta.url).href;
    foto.alt = "";
    foto.loading = "lazy";
    foto.width = 26;
    foto.height = 26;
    replyAvatar.append(foto);
  }
  const bubble = document.createElement("div");
  bubble.className = "wish__reply-bubble";
  const author = document.createElement("strong");
  author.textContent = pengantinPembalas.map((p) => p.panggilan).join(" & ");
  const label = document.createElement("span");
  label.className = "wish__reply-label";
  label.textContent = "Balasan otomatis";
  const waktu = buatWaktuKiriman(waktuKiriman);
  if (waktu) label.append(" · ", waktu);
  const text = document.createElement("p");
  text.textContent = kalimat;
  bubble.append(author, label, text);
  reply.append(replyAvatar, bubble);
  return reply;
}

function perbaruiStatistik(data) {
  const set = (id, v) => { const n = $(id); if (n) n.textContent = String(v ?? 0); };
  set("#statHadir", data.hadir ?? 0);
  set("#statUcapan", data.total ?? 0);
  set("#statTidakHadir", data.tidakHadir ?? 0);
  const c = $("#wishesCount");
  if (c) c.textContent = data.total ? `${data.total} ucapan` : "";
}

function pasangCarousel(id) {
  const root = document.getElementById(id);
  if (!root) return () => {};
  const stage = root.querySelector(".wish-carousel__stage");
  const track = root.querySelector(".wish-carousel__track");
  const zona = root.querySelector(".wish-carousel__drag-zone");
  const controls = root.querySelector(".wish-carousel__controls");
  const count = controls.querySelector("[data-slide-count]");
  const tombolPutar = controls.querySelector("[data-slide-play]");
  const panah = Array.from(controls.querySelectorAll("[data-slide]"));
  const bisaDiputar = "IntersectionObserver" in window;
  let diputar = bisaDiputar && !kurangiGerak();
  let dalamLayar = false;
  let tahanSampai = 0;
  let sentuhan = null;
  let langkah = 0;
  let tilt = 0;
  let tiltTerakhir = null;
  let jumlahTerakhir = 0;
  let indeksTerakhir = -1;
  let frame = 0;
  let waktuLalu = null;
  let pemulai = 0;
  let perubahanSentuh = false;
  let sedangHover = false;
  let gerakanManual = null;
  let radius = 0;
  const mediaHover = matchMedia("(hover: hover)");
  if (bisaDiputar) {
    new IntersectionObserver(([entry]) => {
      dalamLayar = entry.isIntersecting;
      jadwalkan();
    }).observe(stage);
  }
  tombolPutar.hidden = !bisaDiputar;
  const perbaruiPutar = () => {
    tombolPutar.textContent = diputar ? "Jeda" : "Putar";
    tombolPutar.setAttribute("aria-label", diputar ? "Jeda putaran kartu" : "Putar kartu otomatis");
  };
  perbaruiPutar();

  const aktif = (n) => n ? ((Math.round(langkah) % n) + n) % n : 0;
  const gambar = () => {
    const n = track.children.length;
    if (!n) return;
    track.style.transform = `translateZ(${-radius}px) rotateY(${-langkah * 360 / n}deg)`;
    if (tilt !== tiltTerakhir) {
      track.style.setProperty("--tilt", `${tilt}deg`);
      tiltTerakhir = tilt;
    }
    const i = aktif(n);
    if (i === indeksTerakhir) return;
    indeksTerakhir = i;
    count.textContent = `${i + 1} / ${n}`;
    Array.from(track.children).forEach((card, index) => {
      card.classList.toggle("wish--terlihat", index === i);
      card.setAttribute("aria-hidden", String(index !== i));
    });
  };
  const sinkron = () => {
    const n = track.children.length;
    controls.hidden = n === 0 || (n === 1 && !bisaDiputar);
    panah.forEach((button) => { button.hidden = n < 2; });
    count.hidden = n < 2;
    radius = n < 2 ? 0 : Math.max(88, (track.firstElementChild.offsetWidth + 16) / (2 * Math.tan(Math.PI / n)));
    stage.style.setProperty("--ring-radius", `${radius}px`);
    Array.from(track.children).forEach((card, index) => {
      card.style.setProperty("--card-angle", `${index * 360 / n}deg`);
    });
    indeksTerakhir = -1;
    gambar();
  };

  function bolehPutar() {
    return diputar && dalamLayar && !sentuhan && !sedangHover && !track.contains(document.activeElement)
      && track.children.length > 0;
  }
  function jadwalkan() {
    clearTimeout(pemulai);
    if (frame || document.hidden) return;
    if (gerakanManual || perubahanSentuh || (bolehPutar() && performance.now() >= tahanSampai)) {
      frame = requestAnimationFrame(putar);
    } else if (bolehPutar()) {
      pemulai = setTimeout(jadwalkan, Math.max(0, tahanSampai - performance.now()));
    }
  }
  function putar(now) {
    frame = 0;
    const dt = waktuLalu === null ? 0 : Math.min(40, now - waktuLalu);
    waktuLalu = now;
    if (gerakanManual) {
      const m = gerakanManual;
      m.mulai ??= now;
      const t = Math.min(1, (now - m.mulai) / 580);
      const progres = 1 - (1 - t) ** 3;
      langkah = m.dari + (m.ke - m.dari) * progres;
      tilt = m.tiltDari + (m.tiltKe - m.tiltDari) * progres;
      if (t === 1) gerakanManual = null;
      gambar();
    } else if (perubahanSentuh) {
      perubahanSentuh = false;
      gambar();
    } else if (bolehPutar() && now >= tahanSampai) {
      const n = track.children.length;
      if (n > 0) {
        // Kecepatan tetap, tanpa jeda di antara kartu; sudut bebas melewati 360°.
        langkah += dt * Math.min((n === 1 ? 12 : 9) * n / 360, 1 / 5) / 1000;
        gambar();
      }
    }
    jadwalkan();
    if (!frame) waktuLalu = null;
  }
  const menuju = (ke) => {
    const tiltKe = Math.round(tilt / 360) * 360;
    if (kurangiGerak() || (langkah === ke && tilt === tiltKe)) {
      langkah = ke;
      tilt = tiltKe;
      gerakanManual = null;
      gambar();
    } else {
      gerakanManual = { dari: langkah, ke, tiltDari: tilt, tiltKe, mulai: null };
      jadwalkan();
    }
  };
  const manual = (arah) => {
    if (track.children.length < 2) return;
    tahanSampai = performance.now() + 10_000;
    menuju((gerakanManual?.ke ?? Math.round(langkah)) + arah);
  };
  on(controls.querySelector('[data-slide="-1"]'), "click", () => manual(-1));
  on(controls.querySelector('[data-slide="1"]'), "click", () => manual(1));
  on(tombolPutar, "click", () => {
    diputar = !diputar;
    tahanSampai = 0;
    if (!diputar) menuju(Math.round(langkah));
    perbaruiPutar();
    jadwalkan();
  });
  on(zona, "pointerdown", (e) => {
    if (!e.isPrimary || e.button !== 0 || !track.children.length) return;
    gerakanManual = null;
    sentuhan = { id: e.pointerId, x: e.clientX, y: e.clientY, mulai: langkah, tilt, sudut: 0,
      jarak: Math.max(90, zona.clientWidth * .44), bergerak: false };
    tahanSampai = performance.now() + 10_000;
    zona.setPointerCapture(e.pointerId);
  });
  on(window, "pointermove", (e) => {
    if (sentuhan?.id !== e.pointerId) return;
    const dx = e.clientX - sentuhan.x;
    const dy = e.clientY - sentuhan.y;
    if (!sentuhan.bergerak) {
      if (Math.hypot(dx, dy) < 7) return;
      sentuhan.bergerak = true;
      stage.classList.add("wish-carousel__stage--dragging");
    }
    const sudut = (nilai) => Math.max(-360, Math.min(360, nilai));
    const { jarak } = sentuhan;
    sentuhan.sudut = sudut(-dx * 180 / jarak);
    langkah = sentuhan.mulai + (sentuhan.sudut * track.children.length) / 360;
    tilt = sentuhan.tilt - sudut(dy * 180 / jarak);
    perubahanSentuh = true;
    jadwalkan();
  });
  const selesaiTarik = (e, batal = false) => {
    if (sentuhan?.id !== e.pointerId) return;
    const { mulai, sudut } = sentuhan;
    sentuhan = null;
    perubahanSentuh = false;
    stage.classList.remove("wish-carousel__stage--dragging");
    tahanSampai = performance.now() + 10_000;
    const asal = Math.round(mulai);
    let tujuan = batal || Math.abs(sudut) < 18 ? asal : Math.round(langkah);
    if (!batal && track.children.length > 1 && Math.abs(sudut) >= 18 && tujuan === asal) {
      tujuan = asal + Math.sign(sudut);
    }
    menuju(tujuan);
    jadwalkan();
  };
  on(window, "pointerup", (e) => selesaiTarik(e));
  on(window, "pointercancel", (e) => selesaiTarik(e, true));
  on(track, "keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    manual(e.key === "ArrowLeft" ? -1 : 1);
  });
  on(stage, "pointerenter", (e) => {
    sedangHover = mediaHover.matches && e.pointerType === "mouse";
    jadwalkan();
  });
  on(stage, "pointerleave", () => {
    sedangHover = false;
    jadwalkan();
  });
  on(track, "blur", () => queueMicrotask(jadwalkan));
  on(mediaGerak, "change", () => {
    if (!kurangiGerak() || !diputar) return;
    diputar = false;
    menuju(Math.round(langkah));
    perbaruiPutar();
    jadwalkan();
  });
  on(document, "visibilitychange", () => {
    waktuLalu = null;
    jadwalkan();
  });
  window.addEventListener("resize", sinkron, { passive: true });

  return (reset = false) => {
    const n = track.children.length;
    root.hidden = n === 0;
    if (reset || n !== jumlahTerakhir) {
      langkah = reset ? 0 : aktif(jumlahTerakhir);
      jumlahTerakhir = n;
      tilt = 0;
      gerakanManual = null;
      perubahanSentuh = false;
    }
    sinkron();
    jadwalkan();
  };
}

let sinkronUcapan = () => {};

async function muatUcapan({ reset = false } = {}) {
  const list = $("#daftarUcapan");
  if (!list) return;
  if (state.memuat) {
    // Refresh sesudah kirim tidak boleh hilang jika daftar masih dimuat.
    if (!reset) return state.memuat;
    await state.memuat;
    return muatUcapan({ reset: true });
  }
  const lagi = $("#btnMuatLagi");
  state.memuat = (async () => {
    const offset = reset ? 0 : state.offset;
    if (lagi) lagi.disabled = true;
    list.setAttribute("aria-busy", "true");
    try {
      const data = await api.ambilUcapan({ limit: state.limit, offset });
      const items = data.items || [];
      const kartu = document.createDocumentFragment();
      items.forEach((it, i) => kartu.append(buatKartuUcapan(it, offset + i)));
      if (reset) list.replaceChildren(kartu);
      else list.append(kartu);
      sinkronUcapan(reset);
      state.offset = offset + items.length;
      state.total = data.total ?? 0;
      perbaruiStatistik(data);

      const kosong = $("#wishesEmpty");
      if (kosong) kosong.hidden = state.total > 0;
      if (lagi) lagi.hidden = state.offset >= state.total;
    } catch (err) {
      console.warn("Gagal memuat ucapan:", err);
      toast("Ucapan belum dapat dimuat. Coba lagi nanti.");
    } finally {
      if (lagi) lagi.disabled = false;
      list.removeAttribute("aria-busy");
      state.memuat = null;
    }
  })();
  return state.memuat;
}

function pasangFormUcapan() {
  const section = $("#ucapan");
  if (!section) return;
  if (U.aktif === false) return;
  section.hidden = false;

  const form = $("#formUcapan");
  const nama = $("#inNama");
  const kota = $("#inKota");
  const pesan = $("#inPesan");
  const status = $("#formStatus");
  const btn = $("#btnKirim");
  const label = $("#btnKirimLabel");

  if (nama && namaTamu) nama.value = namaTamu;
  if (pesan) pesan.maxLength = U.batasPesan || 500;
  if (nama) nama.maxLength = U.batasNama || 60;

  on(pesan, "input", () => {
    const c = $("#counterPesan");
    if (c) c.textContent = `${pesan.value.length}/${pesan.maxLength}`;
  });

  on(form, "submit", async (e) => {
    e.preventDefault();
    if (btn.disabled) return;
    const namaVal = (nama.value || "").trim();
    const kehadiran = form.querySelector('input[name="kehadiran"]:checked')?.value || "ragu";
    const pesanVal = (pesan.value || "").trim();

    if (namaVal.length < 2) {
      status.textContent = "Mohon isi nama Anda (minimal 2 huruf).";
      status.className = "form-status is-err";
      nama.focus();
      return;
    }
    if (pesanVal.length > (U.batasPesan || 500)) {
      status.textContent = "Ucapan terlalu panjang.";
      status.className = "form-status is-err";
      return;
    }

    btn.disabled = true;
    btn.classList.add("is-busy");
    label.textContent = "Mengirim…";
    status.textContent = "";
    status.className = "form-status";

    try {
      const hasil = await api.kirimUcapan({ nama: namaVal, kota: kota.value.trim(), kehadiran, jumlah: kehadiran === "hadir" ? 1 : 0, pesan: pesanVal });
      status.textContent =
        hasil.mode === "lokal"
          ? "Ucapan tersimpan di perangkat ini (mode pratinjau — server belum aktif)."
          : "Terima kasih! Ucapan dan doa Anda sudah kami terima. 🤍";
      status.className = "form-status is-ok";
      pesan.value = "";
      const c = $("#counterPesan");
      if (c) c.textContent = `0/${pesan.maxLength}`;
      const panel = form.closest("dialog");
      if (panel?.open) panel.close();
      toast(hasil.mode === "lokal" ? "Tersimpan di perangkat (mode pratinjau)" : "Terima kasih atas doanya 🤍");
      await muatUcapan({ reset: true });
    } catch (err) {
      status.textContent = err?.message && err.message !== "Failed to fetch"
        ? err.message
        : "Ucapan gagal dikirim. Periksa koneksi lalu coba lagi.";
      status.className = "form-status is-err";
      console.warn(err);
    } finally {
      btn.disabled = false;
      btn.classList.remove("is-busy");
      label.textContent = "Kirim Ucapan";
    }
  });

  on($("#btnMuatLagi"), "click", () => muatUcapan({ reset: false }));
  muatUcapan({ reset: true });
}

/* Tarik dari puncak halaman Ucapan, bukan dari carousel atau popup. */
function pasangTarikMuatUlang() {
  let awal = null;
  let memuat = false;
  const diPuncak = () => window.scrollY <= 0;
  document.addEventListener("touchstart", (e) => {
    awal = null;
    if (memuat || e.touches.length !== 1 || !diPuncak()) return;
    if (e.target.closest?.("dialog, .wish-carousel__stage, button, a, input, textarea, select, iframe")) return;
    const { identifier, clientX, clientY } = e.touches[0];
    awal = { identifier, clientX, clientY };
  }, { passive: true });
  document.addEventListener("touchmove", () => {
    if (!diPuncak()) awal = null;
  }, { passive: true });
  document.addEventListener("touchcancel", () => { awal = null; }, { passive: true });
  document.addEventListener("touchend", (e) => {
    const mulai = awal;
    awal = null;
    if (!mulai || !diPuncak() || e.touches.length) return;
    const akhir = Array.from(e.changedTouches).find((t) => t.identifier === mulai.identifier);
    if (!akhir || akhir.clientY - mulai.clientY < 90 || Math.abs(akhir.clientX - mulai.clientX) > 50) return;
    memuat = true;
    window.location.reload();
  }, { passive: true });
}

/* --------------------------------- Musik --------------------------------- */
let musik = null;
const musicUI = () => $$("#musicToggle, #musicToggleCover");

function sinkronMusik() {
  const aktif = Boolean(musik && musik.playing);
  musicUI().forEach((b) => b && b.setAttribute("aria-pressed", aktif ? "true" : "false"));
}

const KUNCI_MUSIK = `undangan:musik:${CONFIG.musik.berkas}`;
const bacaMusik = () => {
  try { return JSON.parse(sessionStorage.getItem(KUNCI_MUSIK)) ?? {}; }
  catch { return {}; }
};
function simpanMusik(aktif = bacaMusik().aktif) {
  if (!CONFIG.musik.berkas || (aktif === undefined && !musik?.el)) return;
  try {
    sessionStorage.setItem(KUNCI_MUSIK, JSON.stringify({ aktif, posisi: musik?.el?.currentTime ?? 0 }));
  } catch { /* Pengaturan penyimpanan browser tidak menghalangi musik. */ }
}

function pasangMusik() {
  const keadaan = bacaMusik();
  musik = new Music({ ...CONFIG.musik, posisiAwal: keadaan.posisi });
  musik.onChange = sinkronMusik;
  if (!musik.tersedia) {
    musicUI().forEach((b) => b && (b.hidden = true));
    return;
  }

  const toggle = async () => {
    const main = $("#main");
    const sudahDibuka = main && !main.hidden;
    if (main && !sudahDibuka) {
      bukaUndangan({ mulaiMusik: false });
    }
    if (musik.playing) {
      musik.pause();
      simpanMusik(false);
    } else {
      await musik.start();
      if (musik.playing) simpanMusik(true);
      if (!musik.playing) toast("Musik tidak dapat diputar di peramban ini");
    }
    sinkronMusik();
  };

  musicUI().forEach((b) => on(b, "click", toggle));

  // Audio berkas berjalan dalam loop native, termasuk saat tab di latar.
  if (CONFIG.musik.berkas) {
    window.addEventListener("pagehide", () => simpanMusik());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) simpanMusik();
      else cobaLanjutkan();
    });
    const cobaLanjutkan = () => {
      if (bacaMusik().aktif === false || $("#main")?.hidden) return;
      if (!musik.playing || musik.el?.paused) musik.start();
    };
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) {
        const terakhir = bacaMusik();
        if (terakhir.aktif === false) musik.pause();
        if (musik.el && Number.isFinite(terakhir.posisi)) musik.el.currentTime = terakhir.posisi;
        cobaLanjutkan();
      }
    });
    // Jika autoplay ditolak, lanjutkan pada ketukan berikutnya di halaman yang sama.
    document.addEventListener("click", (e) => {
      if (!e.target.closest?.("#musicToggle, #musicToggleCover, #btnBuka")) cobaLanjutkan();
    }, { capture: true });
    cobaLanjutkan();
    return;
  }

  document.addEventListener("visibilitychange", () => {
    if (!musik) return;
    if (document.hidden && musik.playing) {
      musik.pause();
      musik._sebelumnya = true;
    } else if (!document.hidden && musik._sebelumnya) {
      musik._sebelumnya = false;
      musik.resumeIfPaused();
    }
  });
}

/* -------------------------------- Reveal --------------------------------- */
let pengamat = null;
function siapkanReveal() {
  if (kurangiGerak() || !("IntersectionObserver" in window)) {
    $$(".reveal").forEach((n) => n.classList.add("is-in"));
    $$(".divider").forEach((n) => n.classList.add("is-in"));
    return;
  }
  if (!pengamat) {
    pengamat = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            pengamat.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
  }
  $$(".reveal, .divider").forEach((n) => {
    if (!n.classList.contains("is-in")) pengamat.observe(n);
  });
}

/* Jaring pengaman: bila pengamat gagal, konten tetap tampil. */
function paksaTampil() {
  const main = $("#main");
  if (!main || main.hidden) return; // jangan tampilkan sebelum undangan dibuka
  $$(".reveal:not(.is-in)").forEach((el) => {
    if (pengamat && el.id === "splitFoto") return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight + 120 && r.bottom > -120) el.classList.add("is-in");
  });
  $$(".divider:not(.is-in)").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("is-in");
  });
}
setTimeout(paksaTampil, 1600);

/* ---------------------------- Partikel dekoratif -------------------------- */
function pasangPartikel() {
  const layer = $("#particles");
  if (!layer || kurangiGerak()) return;
  for (let i = 0; i < 14; i++) {
    const bentuk = document.createElement("span");
    bentuk.className = `ambient__petal ambient__petal--${i % 2 ? "heart" : "flower"}`;
    bentuk.textContent = i % 2 ? "♥" : "✿";
    bentuk.style.setProperty("--x", `${5 + (i * 37) % 90}%`);
    bentuk.style.setProperty("--delay", `${-i * 2.7}s`);
    bentuk.style.setProperty("--duration", `${19 + i % 7}s`);
    layer.append(bentuk);
  }
}

/* ----------------------------- Buka undangan ----------------------------- */
let sudahDibuka = false;
function bukaUndangan({ mulaiMusik = true } = {}) {
  if (sudahDibuka) return;
  sudahDibuka = true;

  const cover = $("#cover");
  const main = $("#main");
  const dock = $("#dock");
  const musicFloat = $("#musicToggle");

  document.body.classList.remove("is-locked");
  if (main) main.hidden = false;
  if (dock) dock.hidden = false;
  const hadiahFloat = $("#hadiahFloat");
  if (hadiahFloat && hadiahTersedia()) hadiahFloat.hidden = false;
  const ucapanFloat = $("#ucapanFloat");
  if (ucapanFloat && U.aktif !== false) ucapanFloat.hidden = false;
  cover?.classList.add("is-open");
  musicFloat?.classList.add("is-visible");

  if (mulaiMusik && musik && musik.tersedia && bacaMusik().aktif !== false) {
    musik.start().then(() => {
      if (musik.playing) simpanMusik(true);
      sinkronMusik();
    });
  }

  setTimeout(() => {
    if (cover) cover.hidden = true;
    window.scrollTo(0, 0);
    siapkanReveal();
    perbaruiGulir();
    setTimeout(paksaTampil, 900);
  }, kurangiGerak() ? 60 : 1050);
}

/* --------------------------- Gulir & navigasi ---------------------------- */
const SECTION_NAV = ["salam", "mempelai", "acara", "peta", "turut"];
let ticking = false;

function perbaruiGulir() {
  const bar = $("#progressBar");
  const doc = document.documentElement;
  const total = doc.scrollHeight - window.innerHeight;
  const rasio = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
  if (bar) bar.style.width = `${(rasio * 100).toFixed(2)}%`;

  const toTop = $("#toTop");
  if (toTop) toTop.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.9);

  const tengah = window.scrollY + window.innerHeight * 0.42;
  let aktif = SECTION_NAV[0];
  SECTION_NAV.forEach((id) => {
    const sec = document.getElementById(id);
    if (sec && sec.offsetTop <= tengah) aktif = id;
  });
  $$(".dock__item").forEach((a) => {
    const terpilih = a.dataset.nav === aktif;
    a.classList.toggle("is-active", terpilih);
    if (terpilih) a.setAttribute("aria-current", "location");
    else a.removeAttribute("aria-current");
  });
}

function pasangGulir() {
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      perbaruiGulir();
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  on($("#toTop"), "click", () => {
    const target = $("#salam") || document.body;
    window.scrollTo({ top: target.offsetTop || 0, behavior: kurangiGerak() ? "auto" : "smooth" });
  });

  on($("#dock"), "click", (e) => {
    const a = e.target.closest(".dock__item");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href?.startsWith("#")) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    window.scrollTo({ top: target.offsetTop - 8, behavior: kurangiGerak() ? "auto" : "smooth" });
  });
}

async function tampilkanTandaKasih(sinkron) {
  const bagian = $("#kirimanHadiah");
  const daftar = $("#daftarHadiah");
  if (!bagian || !daftar) return;
  try {
    const res = await fetch("/api/tanda-kasih");
    if (!res.ok) return;
    const data = await res.json();
    if (!Array.isArray(data.items) || !data.items.length) return;
    if (data.uji) $("#statusKirimanHadiah").textContent = "Tampilan Percobaan";
    for (const [i, item] of data.items.entries()) {
      const kartu = document.createElement("li");
      kartu.className = "wish-slot wish--hadiah";
      const avatar = document.createElement("span");
      avatar.className = "wish__avatar";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = "♡";
      const isi = document.createElement("div");
      isi.className = "wish__body";
      const nama = document.createElement("strong");
      nama.className = "wish__name";
      nama.textContent = item.nama;
      nama.append(buatCentangPengirim());
      const pesan = document.createElement("p");
      pesan.className = "wish__msg";
      pesan.textContent = item.pesan;
      isi.append(labelKiriman(data.uji ? "Kiriman Uji · Bukan Hadiah" : "Tanda Kasih", data.uji ? "uji" : "hadiah"), nama);
      const waktu = buatWaktuKiriman(item.dibuat);
      if (waktu) {
        const meta = document.createElement("p");
        meta.className = "wish__reply-label";
        meta.append("Diterima · ", waktu);
        isi.append(meta);
      }
      if (item.pesan) isi.append(pesan);
      isi.append(buatReaksi());
      const balasan = buatBalasan(pilihBalasanHadiah(item.pesan, data.uji), item.dibuat);
      pasangWajahKartu(kartu, avatar, isi, i + 1);
      kartu.querySelector(".wish__front").append(balasan);
      daftar.append(kartu);
    }
    bagian.hidden = false;
    sinkron(true);
  } catch { /* Feed tambahan tidak menghalangi formulir ucapan. */ }
}

/* --------------------------------- Inisialisasi -------------------------- */
function mulai() {
  const rujukanAyat = $("a[data-bind='ayatSumber']");
  if (rujukanAyat) rujukanAyat.href = `https://quran.cgs.my.id/#/surah/${ayat.surah}/${ayat.nomor}`;
  injectOrnaments();
  isiTeks();
  const personalisasi = (href) => {
    const url = new URL(href, location.origin);
    if (namaTamu) url.searchParams.set("to", namaTamu);
    return url.pathname + url.search + url.hash;
  };
  const kembali = $("#kembaliUndangan");
  if (kembali) {
    kembali.href = personalisasi(kembali.getAttribute("href"));
    document.title = `Ucapan & Kehadiran · ${CONFIG.meta.judul}`;
    sinkronUcapan = pasangCarousel("carouselUcapan");
    pasangFormUcapan();
    pasangTarikMuatUlang();
    pasangPartikel();
    pasangMusik();
    pasangHadiah();
    const hadiahFloat = $("#hadiahFloat");
    if (hadiahFloat) hadiahFloat.hidden = !hadiahTersedia();
    pasangPeta();
    siapkanReveal();
    if (location.hash === "#hadiah" && hadiahTersedia()) {
      requestAnimationFrame(() => $("#hadiah")?.scrollIntoView({ behavior: "instant" }));
    }
    tampilkanTandaKasih(pasangCarousel("carouselHadiah"));
    return;
  }
  $$("[data-ucapan-link]").forEach((a) => {
    a.hidden = U.aktif === false || a.id === "ucapanFloat" || a.id === "hadiahFloat";
    a.href = personalisasi(a.getAttribute("href"));
  });
  const ajakanUcapan = $("#ucapan");
  if (ajakanUcapan) ajakanUcapan.hidden = U.aktif === false;
  $$(".loader__ring svg").forEach((s) => s.classList.add("spin-slow"));

  renderAcara();
  renderGaleri();
  pasangLightbox();
  pasangFotoSpesial();
  pasangHitungMundur();
  pasangKalender();
  pasangPeta();
  pasangMusik();
  pasangPartikel();
  pasangGulir();
  siapkanReveal();

  on($("#btnBuka"), "click", () => bukaUndangan());
  if (location.hash === "#salam") bukaUndangan();

  perbaruiGulir();

  const loader = $("#loader");
  const tutupLoader = () => {
    loader?.classList.add("is-done");
    setTimeout(() => { if (loader) loader.hidden = true; }, 800);
  };
  if (document.readyState === "complete") setTimeout(tutupLoader, 350);
  else window.addEventListener("load", () => setTimeout(tutupLoader, 350), { once: true });

  // Pengaman: bila aset lambat, tetap buka setelah 4 detik.
  setTimeout(tutupLoader, 4000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mulai, { once: true });
} else {
  mulai();
}
