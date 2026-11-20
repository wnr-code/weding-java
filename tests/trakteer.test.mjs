import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import worker from '../worker/index.js';

const root = 'https://wedding.example';
const webhook = (id, token) => new Request(`${root}/api/trakteer-webhook`, {
  method: 'POST',
  headers: { 'X-Webhook-Token': token },
  body: JSON.stringify({transaction_id: id, supporter_name: ' Tamu Uji ', supporter_message: 'Selamat!', email: 'test@example.com', price: 5000}),
});

test('webhook terautentikasi, mode uji terisolasi, deduplikasi dan feed minim data', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(readFileSync(new URL('../migrations/0003_tanda_kasih.sql', import.meta.url), 'utf8'));
    const env = {
      TRAKTEER_MODE: 'test', TRAKTEER_WEBHOOK_TOKEN: 'contoh-token',
      javar: {prepare: (sql) => ({bind: (...args) => ({
        run: () => db.prepare(sql).run(...args),
        all: () => ({results: db.prepare(sql).all(...args)}),
      })})},
    };
    const feed = async () => (await worker.fetch(new Request(`${root}/api/tanda-kasih`), env)).json();
    assert.equal((await worker.fetch(webhook('test-1', 'salah'), env)).status, 401);
    assert.equal((await worker.fetch(webhook('test-1', 'contoh-token'), {...env, TRAKTEER_WEBHOOK_TOKEN: ''})).status, 503);
    assert.equal((await (await worker.fetch(webhook('nyata-1', 'contoh-token'), env)).json()).diabaikan, true);
    assert.equal((await feed()).items.length, 0);
    for (let i = 0; i < 2; i++) assert.equal((await worker.fetch(webhook('test-1', 'contoh-token'), env)).status, 200);
    const data = await feed();
    assert.equal(data.uji, true);
    assert.equal(data.items.length, 1);
    assert.equal(data.items[0].nama, 'Tamu Uji');
    assert.equal(data.items[0].pesan, 'Selamat!');
    assert.deepEqual(Object.keys(data.items[0]).sort(), ['dibuat', 'nama', 'pesan']);
    env.TRAKTEER_MODE = 'live';
    assert.equal((await feed()).items.length, 0);
  } finally { db.close(); }
});
