/**
 * Cloudflare Worker — API undangan pernikahan Ja'far & Iklimah.
 * ---------------------------------------------------------------------------
 * Rute:
 *   GET  /api/health           status worker + koneksi D1
 *   GET  /api/ucapan           daftar ucapan (paginated) + ringkasan kehadiran
 *   POST /api/ucapan           kirim ucapan & konfirmasi kehadiran
 *
 * Aset statis (HTML/CSS/JS/gambar) dilayani oleh binding `ASSETS`
 * (Cloudflare Static Assets). Worker hanya menangani /api/*.
 */

import {
  BATAS,
  JEDA_DETIK,
  SQL,
  hashIp,
  validasiPaginasi,
  validasiUcapan,
} from "./ucapan.js";

const HEADER_KEAMANAN = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "SAMEORIGIN",
};

function json(data, status = 200, tambahan = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...HEADER_KEAMANAN,
      ...tambahan,
    },
  });
}

function galat(pesan, status = 400) {
  return json({ ok: false, error: pesan }, status);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Selain /api/* biarkan aset statis yang melayani.
    if (!url.pathname.startsWith("/api/")) {
      if (env.ASSETS) return env.ASSETS.fetch(request);
      return new Response("Tidak ditemukan", { status: 404, headers: HEADER_KEAMANAN });
    }

    const cors = {
      "access-control-allow-origin": url.origin,
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
      vary: "origin",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { ...HEADER_KEAMANAN, ...cors } });
    }

    const rute = `${request.method} ${url.pathname.replace(/\/+$/, "")}`;

    try {
      if (rute === "GET /api/health") {
        return json(
          { ok: true, layanan: "weding-java", database: Boolean(env.javar), waktu: new Date().toISOString() },
          200,
          cors
        );
      }

      if (rute === "GET /api/ucapan") return await ambilUcapan(url, env, cors);
      if (rute === "POST /api/ucapan") return await simpanUcapan(request, env, cors);

      return galat("Endpoint tidak ditemukan.", 404);
    } catch (err) {
      console.error("Kesalahan API:", err?.stack || err);
      return galat("Terjadi kesalahan pada server. Coba lagi sebentar.", 500);
    }
  },
};

async function ambilUcapan(url, env, cors) {
  if (!env.javar) return galat("Database belum terhubung.", 503);
  const { limit, offset } = validasiPaginasi(url);

  const [daftar, ringkas] = await Promise.all([
    env.javar.prepare(SQL.daftar).bind(limit, offset).all(),
    env.javar.prepare(SQL.ringkasan).first(),
  ]);

  return json(
    {
      ok: true,
      items: (daftar.results || []).map(petakan),
      total: Number(ringkas?.total || 0),
      hadir: Number(ringkas?.hadir || 0),
      tidakHadir: Number(ringkas?.tidakHadir || 0),
      ragu: Number(ringkas?.ragu || 0),
      tamu: Number(ringkas?.tamu || 0),
      limit,
      offset,
    },
    200,
    cors
  );
}

async function simpanUcapan(request, env, cors) {
  if (!env.javar) return galat("Database belum terhubung.", 503);

  const tipe = request.headers.get("content-type") || "";
  if (!tipe.includes("application/json")) {
    return galat("Kirim data dalam format JSON.", 415);
  }

  let body;
  try {
    const teks = await request.text();
    if (teks.length > 4000) return galat("Data terlalu besar.", 413);
    body = JSON.parse(teks);
  } catch {
    return galat("Format JSON tidak valid.", 400);
  }

  const hasil = validasiUcapan(body);
  if (!hasil.ok) return galat(hasil.pesan, hasil.status);

  const ip = request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const sidik = await hashIp(ip, env.IP_SALT || "undangan-v1");

  const terakhir = await env.javar.prepare(SQL.terakhirDariIp).bind(sidik).first();
  if (terakhir?.created_at) {
    const beda = (Date.now() - new Date(terakhir.created_at).getTime()) / 1000;
    if (Number.isFinite(beda) && beda >= 0 && beda < JEDA_DETIK) {
      return galat(`Terlalu sering mengirim. Tunggu ${Math.ceil(JEDA_DETIK - beda)} detik lagi.`, 429);
    }
  }

  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  const { nama, kehadiran, jumlah, pesan } = hasil.data;

  await env.javar.prepare(SQL.simpan)
    .bind(id, nama, kehadiran, jumlah, pesan, created_at, sidik)
    .run();

  const ringkas = await env.javar.prepare(SQL.ringkasan).first();

  return json(
    {
      ok: true,
      item: { id, nama, kehadiran, jumlah, pesan, created_at },
      total: Number(ringkas?.total || 0),
      hadir: Number(ringkas?.hadir || 0),
      tidakHadir: Number(ringkas?.tidakHadir || 0),
      ragu: Number(ringkas?.ragu || 0),
    },
    201,
    cors
  );
}

function petakan(row) {
  return {
    id: row.id,
    nama: row.nama,
    kehadiran: row.kehadiran,
    jumlah: Number(row.jumlah || 0),
    pesan: row.pesan || "",
    created_at: row.created_at,
  };
}

export { BATAS };
