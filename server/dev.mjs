/**
 * Server pengembangan lokal.
 * Menyajikan folder `public/` dan meniru API Worker (`/api/*`) memakai berkas
 * JSON, sehingga formulir ucapan bisa dicoba sebelum D1 dibuat.
 *
 *   node server/dev.mjs        → http://localhost:4321
 */

import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import { validasiPaginasi, validasiUcapan, hashIp, JEDA_DETIK, BATAS } from "../worker/ucapan.js";

const ROOT = resolve(import.meta.dirname, "..", "public");
const FILE_DATA = resolve(import.meta.dirname, "..", ".dev-data", "ucapan.json");
const PORT = Number(process.env.PORT || 4321);
const HOST = process.env.HOST || "0.0.0.0";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

/* ------------------------------ Penyimpanan ------------------------------ */
let data = null;

async function muatData() {
  if (data) return data;
  try {
    const isi = JSON.parse(await readFile(FILE_DATA, "utf8"));
    data = Array.isArray(isi) ? isi : [];
  } catch {
    data = [];
  }
  return data;
}

let simpanTimer = null;
function simpanNanti() {
  clearTimeout(simpanTimer);
  simpanTimer = setTimeout(async () => {
    try {
      await mkdir(resolve(FILE_DATA, ".."), { recursive: true });
      await writeFile(FILE_DATA, JSON.stringify(data.slice(-1000), null, 2));
    } catch (err) {
      console.warn("Gagal menyimpan data lokal:", err.message);
    }
  }, 120);
}

function ringkasan(rows) {
  return {
    total: rows.length,
    hadir: rows.filter((r) => r.kehadiran === "hadir").length,
    tidakHadir: rows.filter((r) => r.kehadiran === "tidak_hadir").length,
    ragu: rows.filter((r) => r.kehadiran === "ragu").length,
    tamu: rows.filter((r) => r.kehadiran === "hadir").reduce((n, r) => n + (r.jumlah || 0), 0),
  };
}

/* -------------------------------- Pembantu ------------------------------- */
const kirim = (res, status, body, tipe = "application/json; charset=utf-8") => {
  const isi = typeof body === "string" || body instanceof Buffer ? body : JSON.stringify(body);
  res.writeHead(status, {
    "content-type": tipe,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  res.end(res.req.method === "HEAD" ? undefined : isi);
};

const kirimJson = (res, status, obj) => kirim(res, status, obj);

async function bacaBody(req, batas = 8000) {
  const potongan = [];
  let total = 0;
  for await (const c of req) {
    total += c.length;
    if (total > batas) throw new Error("terlalu-besar");
    potongan.push(c);
  }
  return Buffer.concat(potongan).toString("utf8");
}

/* --------------------------------- API ----------------------------------- */
async function api(req, res, url) {
  await muatData();
  const rute = `${req.method} ${url.pathname.replace(/\/+$/, "")}`;

  if (rute === "GET /api/health") {
    return kirimJson(res, 200, { ok: true, layanan: "weding-java", database: "lokal", mode: "dev" });
  }

  if (rute === "GET /api/ucapan") {
    const { limit, offset } = validasiPaginasi(url);
    const urut = data
      .slice()
      .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
    return kirimJson(res, 200, {
      ok: true,
      items: urut.slice(offset, offset + limit).map(({ ip_hash, ...baris }) => baris),
      ...ringkasan(data),
      limit,
      offset,
      mode: "dev",
    });
  }

  if (rute === "POST /api/ucapan") {
    if (!(req.headers["content-type"] || "").includes("application/json")) {
      return kirimJson(res, 415, { ok: false, error: "Kirim data dalam format JSON." });
    }
    let body;
    try {
      body = JSON.parse(await bacaBody(req));
    } catch {
      return kirimJson(res, 400, { ok: false, error: "Format JSON tidak valid." });
    }

    const hasil = validasiUcapan(body);
    if (!hasil.ok) return kirimJson(res, hasil.status, { ok: false, error: hasil.pesan });

    const ip = req.socket.remoteAddress || "127.0.0.1";
    const sidik = await hashIp(ip, "dev");
    const terakhir = data
      .filter((r) => r.ip_hash === sidik)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
    if (terakhir) {
      const beda = (Date.now() - new Date(terakhir.created_at).getTime()) / 1000;
      if (beda >= 0 && beda < JEDA_DETIK) {
        return kirimJson(res, 429, {
          ok: false,
          error: `Terlalu sering mengirim. Tunggu ${Math.ceil(JEDA_DETIK - beda)} detik lagi.`,
        });
      }
    }

    const item = {
      id: randomUUID(),
      ...hasil.data,
      created_at: new Date().toISOString(),
      ip_hash: sidik,
    };
    data.push(item);
    simpanNanti();

    const { ip_hash, ...publik } = item;
    return kirimJson(res, 201, { ok: true, item: publik, ...ringkasan(data) });
  }

  return kirimJson(res, 404, { ok: false, error: "Endpoint tidak ditemukan." });
}

/* -------------------------------- Statis --------------------------------- */
async function statis(req, res, url) {
  let path;
  try {
    path = decodeURIComponent(url.pathname);
  } catch {
    return kirim(res, 400, "Permintaan tidak valid", "text/plain; charset=utf-8");
  }
  if (path.endsWith("/")) path += "index.html";

  const berkas = resolve(join(ROOT, path));
  if (!berkas.startsWith(ROOT + sep)) {
    return kirim(res, 403, "Akses ditolak", "text/plain; charset=utf-8");
  }

  const tipe = MIME[extname(berkas).toLowerCase()] || "application/octet-stream";
  try {
    const isi = await readFile(berkas);
    return kirim(res, 200, isi, tipe);
  } catch {
    // Semua halaman lain diarahkan ke index.html (aplikasi satu halaman).
    if (!extname(path)) {
      try {
        const html = await readFile(join(ROOT, "index.html"));
        return kirim(res, 200, html, MIME[".html"]);
      } catch { /* jatuh ke 404 */ }
    }
    return kirim(res, 404, "Tidak ditemukan", "text/plain; charset=utf-8");
  }
}

/* --------------------------------- Server -------------------------------- */
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "access-control-allow-origin": url.origin,
          "access-control-allow-methods": "GET, POST, OPTIONS",
          "access-control-allow-headers": "content-type",
        });
        return res.end();
      }
      return await api(req, res, url);
    }
    await statis(req, res, url);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) kirim(res, 500, { ok: false, error: "Kesalahan server lokal." });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Undangan siap di http://localhost:${PORT}`);
  console.log(`Mode pengembangan: ucapan disimpan di .dev-data/ucapan.json (${BATAS.limitDefault} item per halaman).`);
});
