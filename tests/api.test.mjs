/**
 * Uji validasi & kontrak API ucapan (Worker Cloudflare).
 * Jalankan: node --test tests/*.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.js";
import { BATAS, validasiUcapan, validasiPaginasi, hashIp } from "../worker/ucapan.js";

/* ----------------------------- D1 palsu ---------------------------------- */
function fakeD1() {
  const rows = [];

  const stats = () => ({
    total: rows.length,
    hadir: rows.filter((r) => r.kehadiran === "hadir").length,
    tidakHadir: rows.filter((r) => r.kehadiran === "tidak_hadir").length,
    ragu: rows.filter((r) => r.kehadiran === "ragu").length,
    tamu: rows.filter((r) => r.kehadiran === "hadir").reduce((n, r) => n + r.jumlah, 0),
  });

  return {
    rows,
    prepare(sql) {
      let args = [];
      const stmt = {
        bind(...nilai) {
          args = nilai;
          return stmt;
        },
        async all() {
          if (sql.includes("FROM ucapan ORDER BY created_at DESC")) {
            const urut = rows
              .slice()
              .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
            const [limit, offset] = args;
            return { results: urut.slice(offset, offset + limit) };
          }
          return { results: [] };
        },
        async first() {
          if (sql.includes("COUNT(*)")) return stats();
          if (sql.includes("WHERE ip_hash")) {
            const cocok = rows.filter((r) => r.ip_hash === args[0]);
            return cocok.length
              ? cocok.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0]
              : null;
          }
          return null;
        },
        async run() {
          if (sql.includes("INSERT INTO ucapan")) {
            const [id, nama, kehadiran, jumlah, pesan, created_at, ip_hash, jenis_pengirim, kota] = args;
            rows.push({ id, nama, kehadiran, jumlah, pesan, created_at, ip_hash, jenis_pengirim, kota });
            return { success: true };
          }
          return { success: true };
        },
      };
      return stmt;
    },
  };
}

const env = () => ({ javar: fakeD1(), ASSETS: { fetch: async () => new Response("aset") }, IP_SALT: "uji" });
const panggil = (path, init = {}, e = env()) =>
  worker.fetch(new Request(`https://undangan.test${path}`, init), e);

const kirim = (body, e = env(), ip = "203.0.113.7") =>
  panggil(
    "/api/ucapan",
    {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": ip },
      body: JSON.stringify(body),
    },
    e
  );

/* ------------------------------ Validasi --------------------------------- */
test("validasi: nama terlalu pendek ditolak", () => {
  const hasil = validasiUcapan({ nama: "A", kehadiran: "hadir" });
  assert.equal(hasil.ok, false);
  assert.equal(hasil.status, 422);
});

test("validasi: nama terlalu panjang ditolak", () => {
  const hasil = validasiUcapan({ nama: "a".repeat(BATAS.namaMax + 1), kehadiran: "hadir" });
  assert.equal(hasil.ok, false);
  assert.equal(hasil.status, 422);
});

test("validasi: kehadiran tidak dikenal ditolak", () => {
  const hasil = validasiUcapan({ nama: "Fatimah", kehadiran: "mungkin" });
  assert.equal(hasil.ok, false);
});

test("validasi: jumlah tamu dibatasi dan dinolkan bila tidak hadir", () => {
  const hadir = validasiUcapan({ nama: "Ali", kehadiran: "hadir", jumlah: 99 });
  assert.equal(hadir.ok, true);
  assert.equal(hadir.data.jumlah, BATAS.tamuMax);

  const tidak = validasiUcapan({ nama: "Ali", kehadiran: "tidak_hadir", jumlah: 4 });
  assert.equal(tidak.ok, true);
  assert.equal(tidak.data.jumlah, 0);

  const kosong = validasiUcapan({ nama: "Ali", kehadiran: "hadir", jumlah: "abc" });
  assert.equal(kosong.data.jumlah, 1);
});

test("validasi: karakter kendali dibersihkan dan spasi dirapikan", () => {
  const hasil = validasiUcapan({ nama: "  Siti\u0007   Aminah  ", kehadiran: "ragu", pesan: "  Barakallahu   lakuma\n\n\n\namin  " });
  assert.equal(hasil.ok, true);
  assert.equal(hasil.data.nama, "Siti Aminah");
  assert.equal(hasil.data.pesan, "Barakallahu lakuma\n\namin");
});

test("validasi: pesan melebihi batas ditolak", () => {
  const hasil = validasiUcapan({ nama: "Ali", kehadiran: "hadir", pesan: "x".repeat(BATAS.pesanMax + 1) });
  assert.equal(hasil.ok, false);
});

test("paginasi: nilai ekstrem dibatasi", () => {
  const url = new URL("https://x/api/ucapan?limit=999&offset=-5");
  const { limit, offset } = validasiPaginasi(url);
  assert.equal(limit, BATAS.limitMaks);
  assert.equal(offset, 0);

  const kosong = validasiPaginasi(new URL("https://x/api/ucapan"));
  assert.equal(kosong.limit, BATAS.limitDefault);
});

test("hashIp: stabil, pendek, dan berbeda per garam", async () => {
  const a = await hashIp("1.2.3.4", "satu");
  const b = await hashIp("1.2.3.4", "satu");
  const c = await hashIp("1.2.3.4", "dua");
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.equal(a.length, 16);
});

/* ------------------------------- Kontrak --------------------------------- */
test("GET /api/health melaporkan status", async () => {
  const res = await panggil("/api/health");
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.database, true);
});

test("GET /api/health tanpa D1 tetap 200 dengan database false", async () => {
  const res = await panggil("/api/health", {}, {});
  assert.equal(res.status, 200);
  assert.equal((await res.json()).database, false);
});

test("POST lalu GET /api/ucapan menyimpan serta mengembalikan ucapan", async () => {
  const e = env();
  const res = await kirim({ nama: "Keluarga Hasan", kehadiran: "hadir", jumlah: 3, pesan: "Barakallahu lakuma", jenis_pengirim: "perempuan", kota: "  Kota   Bandung " }, e);
  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.item.nama, "Keluarga Hasan");
  assert.equal(data.item.jumlah, 3);
  assert.equal(data.item.jenis_pengirim, "perempuan");
  assert.equal(data.hadir, 1);

  const list = await panggil("/api/ucapan?limit=10", {}, e);
  assert.equal(list.status, 200);
  const isi = await list.json();
  assert.equal(isi.total, 1);
  assert.equal(isi.items.length, 1);
  assert.equal(isi.items[0].pesan, "Barakallahu lakuma");
  assert.equal(isi.items[0].jenis_pengirim, "perempuan");
  assert.equal(isi.items[0].kota, "Kota Bandung");
});

test("POST menolak nama kosong dengan 422", async () => {
  const res = await kirim({ nama: " ", kehadiran: "hadir" });
  assert.equal(res.status, 422);
  assert.equal((await res.json()).ok, false);
});

test("POST menolak content-type yang salah", async () => {
  const res = await panggil("/api/ucapan", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: JSON.stringify({ nama: "Ali", kehadiran: "hadir" }),
  });
  assert.equal(res.status, 415);
});

test("POST menolak JSON rusak", async () => {
  const res = await panggil("/api/ucapan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{bukan json",
  });
  assert.equal(res.status, 400);
});

test("POST membatasi pengiriman berulang dari IP yang sama", async () => {
  const e = env();
  const pertama = await kirim({ nama: "Ali", kehadiran: "hadir", jumlah: 1 }, e, "198.51.100.9");
  assert.equal(pertama.status, 201);

  const kedua = await kirim({ nama: "Ali lagi", kehadiran: "hadir", jumlah: 1 }, e, "198.51.100.9");
  assert.equal(kedua.status, 429);

  // IP berbeda tetap boleh.
  const lain = await kirim({ nama: "Budi", kehadiran: "tidak_hadir", jumlah: 0 }, e, "198.51.100.10");
  assert.equal(lain.status, 201);
});

test("POST tanpa D1 mengembalikan 503", async () => {
  const res = await kirim({ nama: "Ali", kehadiran: "hadir" }, {});
  assert.equal(res.status, 503);
});

test("endpoint tak dikenal mengembalikan 404 JSON", async () => {
  const res = await panggil("/api/tidak-ada");
  assert.equal(res.status, 404);
  assert.equal((await res.json()).ok, false);
});

test("preflight OPTIONS dijawab 204", async () => {
  const res = await panggil("/api/ucapan", { method: "OPTIONS" });
  assert.equal(res.status, 204);
});

test("rute non-API diteruskan ke aset statis", async () => {
  const res = await panggil("/undangan");
  assert.equal(await res.text(), "aset");
});


test("validasi pilihan pengirim, dengan kompatibilitas klien lama", () => {
  assert.equal(validasiUcapan({ nama: "Ali" }).data.jenis_pengirim, null);
  assert.equal(validasiUcapan({ nama: "Ali", jenis_pengirim: "laki_laki" }).data.jenis_pengirim, "laki_laki");
  assert.equal(validasiUcapan({ nama: "Ali", jenis_pengirim: "lain" }).status, 422);
});


test("kota opsional dan divalidasi", () => {
  assert.equal(validasiUcapan({ nama: "Ali" }).data.kota, "");
  assert.equal(validasiUcapan({ nama: "Ali", kota: "x".repeat(61) }).status, 422);
  assert.equal(validasiUcapan({ nama: "Ali", kota: {} }).status, 422);
});
