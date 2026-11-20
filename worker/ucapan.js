/**
 * Validasi & util bersama untuk API ucapan.
 * Dipakai oleh Worker (worker/index.js) dan server pengembangan (server/dev.mjs),
 * sehingga aturan data tetap sama di kedua lingkungan.
 */

export const BATAS = Object.freeze({
  namaMin: 2,
  namaMax: 60,
  pesanMax: 500,
  tamuMax: 10,
  limitDefault: 6,
  limitMaks: 50,
});

const KEHADIRAN = new Set(["hadir", "tidak_hadir", "ragu"]);

/** Buang karakter kendali, rapikan spasi. */
export function bersihkanTeks(nilai, { barisBaru = false } = {}) {
  let s = String(nilai ?? "");
  // eslint-disable-next-line no-control-regex
  s = s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
  if (barisBaru) {
    s = s.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n");
    s = s.split("\n").map((b) => b.replace(/[ \t]{2,}/g, " ").trim()).join("\n");
  } else {
    s = s.replace(/\s+/g, " ");
  }
  return s.trim();
}

/**
 * @returns {{ok: true, data: {nama: string, kehadiran: string, jumlah: number, pesan: string}}
 *          | {ok: false, status: number, pesan: string}}
 */
export function validasiUcapan(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, status: 400, pesan: "Format permintaan tidak valid." };
  }

  const nama = bersihkanTeks(input.nama);
  if (nama.length < BATAS.namaMin) {
    return { ok: false, status: 422, pesan: `Nama minimal ${BATAS.namaMin} karakter.` };
  }
  if (nama.length > BATAS.namaMax) {
    return { ok: false, status: 422, pesan: `Nama maksimal ${BATAS.namaMax} karakter.` };
  }

  const kehadiran = bersihkanTeks(input.kehadiran || "ragu").toLowerCase();
  if (!KEHADIRAN.has(kehadiran)) {
    return { ok: false, status: 422, pesan: "Status kehadiran tidak dikenal." };
  }

  let jumlah = Number.parseInt(input.jumlah ?? 1, 10);
  if (!Number.isFinite(jumlah) || jumlah < 0) jumlah = 0;
  if (kehadiran !== "hadir") jumlah = 0;
  if (jumlah > BATAS.tamuMax) jumlah = BATAS.tamuMax;
  if (kehadiran === "hadir" && jumlah < 1) jumlah = 1;

  const pesan = bersihkanTeks(input.pesan, { barisBaru: true });
  if (pesan.length > BATAS.pesanMax) {
    return { ok: false, status: 422, pesan: `Ucapan maksimal ${BATAS.pesanMax} karakter.` };
  }

  return { ok: true, data: { nama, kehadiran, jumlah, pesan } };
}

/** Parameter paginasi yang aman. */
export function validasiPaginasi(url) {
  const limit = Number.parseInt(url.searchParams.get("limit") || BATAS.limitDefault, 10);
  const offset = Number.parseInt(url.searchParams.get("offset") || 0, 10);
  return {
    limit: Math.min(Math.max(Number.isFinite(limit) ? limit : BATAS.limitDefault, 1), BATAS.limitMaks),
    offset: Math.min(Math.max(Number.isFinite(offset) ? offset : 0, 0), 5000),
  };
}

/** Ubah IP menjadi sidik jari anonim (untuk pembatasan laju, bukan pelacakan). */
export async function hashIp(ip, salt = "") {
  const data = new TextEncoder().encode(`${salt}:${ip || "0.0.0.0"}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const SQL = {
  ringkasan: `SELECT COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN kehadiran = 'hadir' THEN 1 ELSE 0 END), 0) AS hadir,
      COALESCE(SUM(CASE WHEN kehadiran = 'tidak_hadir' THEN 1 ELSE 0 END), 0) AS tidakHadir,
      COALESCE(SUM(CASE WHEN kehadiran = 'ragu' THEN 1 ELSE 0 END), 0) AS ragu,
      COALESCE(SUM(CASE WHEN kehadiran = 'hadir' THEN jumlah ELSE 0 END), 0) AS tamu
    FROM ucapan`,
  daftar: `SELECT id, nama, kehadiran, jumlah, pesan, created_at
    FROM ucapan ORDER BY created_at DESC, rowid DESC LIMIT ? OFFSET ?`,
  terakhirDariIp: `SELECT created_at FROM ucapan WHERE ip_hash = ? ORDER BY created_at DESC LIMIT 1`,
  simpan: `INSERT INTO ucapan (id, nama, kehadiran, jumlah, pesan, created_at, ip_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
};

export const JEDA_DETIK = 20;

export default { BATAS, bersihkanTeks, validasiUcapan, validasiPaginasi, hashIp, SQL, JEDA_DETIK };
