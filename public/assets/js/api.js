/**
 * Klien API ucapan & kehadiran.
 * Bila Worker/D1 belum tersedia (mis. pratinjau statis), data disimpan di
 * localStorage agar formulir tetap dapat dicoba tanpa memutus pengalaman.
 */

const API = "/api/ucapan";
const KUNCI_LOKAL = "weding-java:ucapan";

const bacaLokal = () => {
  try {
    const raw = localStorage.getItem(KUNCI_LOKAL);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

const simpanLokal = (arr) => {
  try {
    localStorage.setItem(KUNCI_LOKAL, JSON.stringify(arr.slice(-200)));
  } catch { /* kuota penuh — abaikan */ }
};

function ringkas(items) {
  return {
    items,
    total: items.length,
    hadir: items.filter((i) => i.kehadiran === "hadir").length,
    tidakHadir: items.filter((i) => i.kehadiran === "tidak_hadir").length,
    ragu: items.filter((i) => i.kehadiran === "ragu").length,
    mode: "lokal",
  };
}

async function minta(url, opsi) {
  const res = await fetch(url, {
    headers: { "content-type": "application/json" },
    ...opsi,
  });
  if (!res.ok) {
    const mentah = await res.text().catch(() => "");
    let pesan = mentah;
    try {
      pesan = JSON.parse(mentah).error || mentah;
    } catch { /* bukan JSON */ }
    const err = new Error(pesan || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function ambilUcapan({ limit = 6, offset = 0 } = {}) {
  try {
    const data = await minta(`${API}?limit=${limit}&offset=${offset}`);
    return { ...data, mode: "server" };
  } catch (err) {
    if (err.status && err.status >= 400 && err.status < 500) throw err;
    const all = bacaLokal().slice().reverse();
    return { ...ringkas(all), items: all.slice(offset, offset + limit) };
  }
}

export async function kirimUcapan(payload) {
  try {
    const data = await minta(API, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { ...data, mode: "server" };
  } catch (err) {
    // Validasi server (400/422) tetap diteruskan ke pengguna.
    if (err.status && err.status >= 400 && err.status < 500) throw err;

    const item = {
      id: (crypto.randomUUID ? crypto.randomUUID() : `lokal-${Date.now()}`),
      nama: payload.nama,
      kehadiran: payload.kehadiran,
      jumlah: payload.jumlah,
      pesan: payload.pesan || "",
      created_at: new Date().toISOString(),
      lokal: true,
    };
    const arr = bacaLokal();
    arr.push(item);
    simpanLokal(arr);
    return { item, mode: "lokal" };
  }
}

export async function cekServer() {
  try {
    const res = await fetch("/api/health", { headers: { accept: "application/json" } });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data && data.ok);
  } catch {
    return false;
  }
}

export default { ambilUcapan, kirimUcapan, cekServer };
