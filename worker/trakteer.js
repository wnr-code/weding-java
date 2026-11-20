import { timingSafeEqual } from "node:crypto";
import { bersihkanTeks } from "./ucapan.js";

const encoder = new TextEncoder();
const normalisasiToken = (nilai) => String(nilai ?? "").trim().replace(/^["']+|["']+$/g, "").trim();

function tokenCocok(dikirim, secret) {
  const a = encoder.encode(normalisasiToken(dikirim));
  const b = encoder.encode(normalisasiToken(secret));
  return b.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

export async function terimaTrakteer(request, env, json) {
  const mode = env.TRAKTEER_MODE;
  if (!env.javar || !normalisasiToken(env.TRAKTEER_WEBHOOK_TOKEN) || !["test", "live"].includes(mode)) {
    return json({ ok: false, error: "Webhook belum dikonfigurasi." }, 503);
  }
  if (!tokenCocok(request.headers.get("X-Webhook-Token"), env.TRAKTEER_WEBHOOK_TOKEN)) {
    return json({ ok: false, error: "Token tidak valid." }, 401);
  }

  let body;
  try {
    // Batasi byte sebelum decode, termasuk pada permintaan tanpa Content-Length.
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Badan kosong");
    const decoder = new TextDecoder();
    let raw = "", total = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 20_000) {
        void reader.cancel().catch(() => {});
        return json({ ok: false, error: "Data terlalu besar." }, 413);
      }
      raw += decoder.decode(value, { stream: true });
    }
    body = JSON.parse(raw + decoder.decode());
  } catch {
    return json({ ok: false, error: "JSON tidak valid." }, 400);
  }

  const id = body?.transaction_id;
  if (typeof id !== "string" || !id.trim() || id !== id.trim() || id.length > 100) {
    return json({ ok: false, error: "ID transaksi tidak valid." }, 400);
  }
  // Konvensi ID uji yang juga digunakan proyek Quran. Peristiwa di luar mode diabaikan.
  const uji = /^test/i.test(id);
  if ((mode === "test") !== uji) return json({ ok: true, diabaikan: true });

  const teks = (nilai, panjang) => typeof nilai === "string" ? bersihkanTeks(nilai).slice(0, panjang) : "";
  const nama = teks(body.supporter_name, 60) || "Hamba Allah";
  const pesan = teks(body.supporter_message, 280);
  await env.javar.prepare(`INSERT INTO tanda_kasih (transaksi, nama, pesan, dibuat, uji)
    VALUES (?, ?, ?, ?, ?) ON CONFLICT(transaksi) DO NOTHING`)
    .bind(id, nama, pesan, new Date().toISOString(), Number(uji)).run();
  return json({ ok: true });
}

export async function ambilTandaKasih(env, json) {
  if (!env.javar || !["test", "live"].includes(env.TRAKTEER_MODE)) return json({ ok: true, items: [] });
  const { results } = await env.javar.prepare(`SELECT nama, pesan, dibuat FROM tanda_kasih
    WHERE uji = ? ORDER BY dibuat DESC, rowid DESC LIMIT 10`).bind(Number(env.TRAKTEER_MODE === "test")).all();
  return json({ ok: true, uji: env.TRAKTEER_MODE === "test", items: results });
}
