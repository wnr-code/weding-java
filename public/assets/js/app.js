/**
 * Undangan Pernikahan — Ja'far & Iklimah
 * Logika antarmuka: isi data, hitung mundur, peta, galeri, musik,
 * ucapan/kehadiran, serta animasi ornamen.
 */

import CONFIG from "./config.js";
import { injectOrnaments, icons } from "./ornament.js";
import { Music } from "./music.js";
import * as api from "./api.js";

/* Tandai bahwa JS aktif: elemen beranimasi baru disembunyikan lewat kelas ini. */
document.documentElement.classList.add("js");

/* ------------------------------- Pembantu -------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const on = (node, ev, fn, opt) => node && node.addEventListener(ev, fn, opt);

const kurangiGerak = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

function waktuRelatif(iso) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const beda = Math.max(0, Date.now() - t) / 1000;
  if (beda < 60) return "baru saja";
  if (beda < 3600) return `${Math.floor(beda / 60)} menit lalu`;
  if (beda < 86400) return `${Math.floor(beda / 3600)} jam lalu`;
  if (beda < 86400 * 7) return `${Math.floor(beda / 86400)} hari lalu`;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(t));
}

/* ------------------------------ Data & teks ------------------------------- */
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
  ayatArab: CONFIG.pembuka.ayat.arab,
  ayatTerjemah: CONFIG.pembuka.ayat.terjemah,
  ayatSumber: CONFIG.pembuka.ayat.sumber,
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
  kreditTeks: CONFIG.kredit.teks,
  kreditLabel: CONFIG.kredit.tautan ? `· ${CONFIG.kredit.tautanLabel}` : "",
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
  if ($("#linkKredit") && CONFIG.kredit.tautan) {
    $("#linkKredit").href = CONFIG.kredit.tautan;
  }
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

  const buka = (i, capOverride) => {
    galeriIndex = (i + CONFIG.galeri.length) % CONFIG.galeri.length;
    const g = CONFIG.galeri[galeriIndex];
    img.src = g.src;
    img.alt = g.judul;
    cap.textContent = capOverride || `${g.judul} — ${g.ket}`;
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add("is-open"));
    document.body.classList.add("is-locked");
    $("#lightboxClose").focus();
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

  const wrap = $("#mapWrap");
  if (!wrap) return;
  let dimuat = false;

  const muat = () => {
    if (dimuat) return;
    dimuat = true;
    const q = encodeURIComponent(L.kueriPeta);
    const src = `https://maps.google.com/maps?q=${q}&z=${L.zoom || 16}&hl=id&output=embed`;
    const frame = document.createElement("iframe");
    frame.src = src;
    frame.title = `Peta lokasi ${L.nama}`;
    frame.loading = "lazy";
    frame.referrerPolicy = "no-referrer-when-downgrade";
    frame.allowFullscreen = true;
    frame.setAttribute("allow", "clipboard-write");
    wrap.innerHTML = "";
    wrap.appendChild(frame);
  };

  on($("#btnMuattPeta"), "click", muat);

  // Muat otomatis saat bagian peta hampir terlihat.
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          muat();
          io.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    io.observe(wrap);
  }
}

/* ------------------------------ Tanda kasih ------------------------------- */
function pasangHadiah() {
  const H = CONFIG.hadiah;
  const section = $("#hadiah");
  if (!section) return;
  const adaTrakteer = Boolean(H.trakteer && H.trakteer.url);
  const adaRekening = Array.isArray(H.rekening) && H.rekening.length > 0;
  const adaKado = Boolean(H.kadoFisik && H.kadoFisik.alamat);
  if (!H.aktif || (!adaTrakteer && !adaRekening && !adaKado)) return;

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
const state = { offset: 0, limit: 6, total: 0, memuat: false };

function badgeKehadiran(item) {
  const map = {
    hadir: { teks: item.jumlah > 1 ? `Hadir · ${item.jumlah} orang` : "Hadir", cls: "" },
    tidak_hadir: { teks: "Tidak hadir", cls: "wish__badge--tidak" },
    ragu: { teks: "Masih ragu", cls: "wish__badge--ragu" },
  };
  return map[item.kehadiran] || map.ragu;
}

function buatKartuUcapan(item, i = 0) {
  const li = document.createElement("li");
  li.className = "wish";
  li.style.animationDelay = `${Math.min(i * 60, 360)}ms`;

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

  const b = badgeKehadiran(item);
  const badge = document.createElement("span");
  badge.className = `wish__badge ${b.cls}`;
  badge.textContent = b.teks;

  const time = document.createElement("span");
  time.className = "wish__time";
  time.textContent = waktuRelatif(item.created_at);

  top.append(nm, badge, time);
  body.appendChild(top);

  if (item.pesan) {
    const msg = document.createElement("p");
    msg.className = "wish__msg";
    msg.textContent = item.pesan;
    body.appendChild(msg);
  }

  li.append(av, body);
  return li;
}

function perbaruiStatistik(data) {
  const set = (id, v) => { const n = $(id); if (n) n.textContent = String(v ?? 0); };
  set("#statHadir", data.hadir ?? 0);
  set("#statUcapan", data.total ?? 0);
  set("#statTidakHadir", data.tidakHadir ?? 0);
  const c = $("#wishesCount");
  if (c) c.textContent = data.total ? `${data.total} ucapan` : "";
}

async function muatUcapan({ reset = false } = {}) {
  const list = $("#daftarUcapan");
  if (!list || state.memuat) return;
  state.memuat = true;
  if (reset) state.offset = 0;

  try {
    const data = await api.ambilUcapan({ limit: state.limit, offset: state.offset });
    if (reset) list.innerHTML = "";
    (data.items || []).forEach((it, i) => list.appendChild(buatKartuUcapan(it, i)));
    state.offset += (data.items || []).length;
    state.total = data.total ?? 0;
    perbaruiStatistik(data);

    const kosong = $("#wishesEmpty");
    if (kosong) kosong.hidden = (data.total ?? 0) > 0;
    const lagi = $("#btnMuatLagi");
    if (lagi) lagi.hidden = state.offset >= state.total;
  } catch (err) {
    console.warn("Gagal memuat ucapan:", err);
    toast("Ucapan belum dapat dimuat. Coba lagi nanti.");
  } finally {
    state.memuat = false;
  }
}

function pasangFormUcapan() {
  const section = $("#ucapan");
  if (!section) return;
  if (U.aktif === false) return;
  section.hidden = false;

  const form = $("#formUcapan");
  const nama = $("#inNama");
  const pesan = $("#inPesan");
  const jumlah = $("#inJumlah");
  const fieldJumlah = $("#fieldJumlah");
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

  const aturJumlah = () => {
    const dipilih = form.querySelector('input[name="kehadiran"]:checked')?.value;
    const perlu = dipilih === "hadir";
    if (fieldJumlah) {
      fieldJumlah.style.opacity = perlu ? "1" : ".45";
      fieldJumlah.style.pointerEvents = perlu ? "auto" : "none";
    }
    if (jumlah) jumlah.disabled = !perlu;
  };
  on(form, "change", (e) => {
    if (e.target.name === "kehadiran") aturJumlah();
  });
  aturJumlah();

  on(form, "submit", async (e) => {
    e.preventDefault();
    const namaVal = (nama.value || "").trim();
    const kehadiran = form.querySelector('input[name="kehadiran"]:checked')?.value || "ragu";
    const pesanVal = (pesan.value || "").trim();
    const jml = kehadiran === "hadir" ? Number(jumlah.value || 1) : 0;

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

    btn.classList.add("is-busy");
    label.textContent = "Mengirim…";
    status.textContent = "";
    status.className = "form-status";

    try {
      const hasil = await api.kirimUcapan({ nama: namaVal, kehadiran, jumlah: jml, pesan: pesanVal });
      status.textContent =
        hasil.mode === "lokal"
          ? "Ucapan tersimpan di perangkat ini (mode pratinjau — server belum aktif)."
          : "Terima kasih! Ucapan dan doa Anda sudah kami terima. 🤍";
      status.className = "form-status is-ok";
      pesan.value = "";
      const c = $("#counterPesan");
      if (c) c.textContent = `0/${pesan.maxLength}`;
      aturJumlah();
      await muatUcapan({ reset: true });
      toast(hasil.mode === "lokal" ? "Tersimpan di perangkat (mode pratinjau)" : "Terima kasih atas doanya 🤍");
    } catch (err) {
      status.textContent = err?.message && err.message !== "Failed to fetch"
        ? err.message
        : "Ucapan gagal dikirim. Periksa koneksi lalu coba lagi.";
      status.className = "form-status is-err";
      console.warn(err);
    } finally {
      btn.classList.remove("is-busy");
      label.textContent = "Kirim Ucapan";
    }
  });

  on($("#btnMuatLagi"), "click", () => muatUcapan({ reset: false }));
  muatUcapan({ reset: true });
}

/* --------------------------------- Musik --------------------------------- */
let musik = null;
const musicUI = () => $$("#musicToggle, #musicToggleCover");

function sinkronMusik() {
  const aktif = Boolean(musik && musik.playing);
  musicUI().forEach((b) => b && b.setAttribute("aria-pressed", aktif ? "true" : "false"));
}

function pasangMusik() {
  musik = new Music(CONFIG.musik);
  musik.onChange = sinkronMusik;
  if (!musik.tersedia) {
    musicUI().forEach((b) => b && (b.hidden = true));
    return;
  }

  const toggle = async () => {
    const main = $("#main");
    const sudahDibuka = main && !main.hidden;
    if (!sudahDibuka) {
      bukaUndangan({ mulaiMusik: false });
    }
    if (musik.playing) {
      musik.pause();
    } else {
      await musik.start();
      if (!musik.playing) toast("Musik tidak dapat diputar di peramban ini");
    }
    sinkronMusik();
  };

  musicUI().forEach((b) => on(b, "click", toggle));

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
  const canvas = $("#particles");
  if (!canvas || kurangiGerak()) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let w = 0, h = 0, dpr = 1, raf = 0;
  const titik = Array.from({ length: 42 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 0.6 + Math.random() * 1.8,
    sp: 0.00004 + Math.random() * 0.00013,
    ph: Math.random() * Math.PI * 2,
    al: 0.12 + Math.random() * 0.4,
  }));

  const ukuran = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  let last = performance.now();
  const gambar = (now) => {
    const dt = Math.min(64, now - last);
    last = now;
    ctx.clearRect(0, 0, w, h);
    for (const p of titik) {
      p.y -= p.sp * dt;
      if (p.y < -0.05) {
        p.y = 1.05;
        p.x = Math.random();
      }
      const tw = 0.55 + 0.45 * Math.sin(now * 0.0011 + p.ph);
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(178,138,65,${(p.al * tw).toFixed(3)})`;
      ctx.fill();
    }
    raf = requestAnimationFrame(gambar);
  };

  ukuran();
  window.addEventListener("resize", ukuran, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else {
      last = performance.now();
      raf = requestAnimationFrame(gambar);
    }
  });
  raf = requestAnimationFrame(gambar);
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
  cover?.classList.add("is-open");
  musicFloat?.classList.add("is-visible");

  if (mulaiMusik && musik && musik.tersedia) {
    musik.start().then(sinkronMusik);
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
const SECTION_NAV = ["salam", "mempelai", "acara", "galeri", "ucapan"];
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
  $$(".dock__item").forEach((a) => a.classList.toggle("is-active", a.dataset.nav === aktif));

  const penutup = $("#penutup");
  const dock = $("#dock");
  const diDasar = penutup && window.scrollY > penutup.offsetTop + penutup.offsetHeight - window.innerHeight * 0.6;
  dock?.classList.toggle("is-hidden", Boolean(diDasar && sudahDibuka));
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
    const target = document.querySelector(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    window.scrollTo({ top: target.offsetTop - 8, behavior: kurangiGerak() ? "auto" : "smooth" });
  });
}

/* --------------------------------- Inisialisasi -------------------------- */
function mulai() {
  injectOrnaments();
  $$(".cover__rosette svg").forEach((s) => s.classList.add("spin-slow"));
  $$(".loader__ring svg").forEach((s) => s.classList.add("spin-slow"));

  isiTeks();
  renderAcara();
  renderGaleri();
  pasangLightbox();
  pasangFotoSpesial();
  pasangHitungMundur();
  pasangKalender();
  pasangPeta();
  pasangHadiah();
  pasangFormUcapan();
  pasangMusik();
  pasangPartikel();
  pasangGulir();
  siapkanReveal();

  on($("#btnBuka"), "click", () => bukaUndangan());

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
