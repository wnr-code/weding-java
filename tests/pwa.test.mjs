import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const read = (path) => readFile(new URL(`../public/${path}`, import.meta.url));

test('manifest PWA dan ikon cocok, terhubung dari kedua halaman', async () => {
  const manifest = JSON.parse(await read('manifest.webmanifest'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/');
  for (const { src, sizes } of manifest.icons) {
    const png = await read(src.slice(1));
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, sizes);
  }
  for (const page of ['index.html', 'ucapan/index.html']) {
    assert.match(await read(page).then(String), /rel="manifest" href="\/manifest\.webmanifest"/);
  }
});

test('service worker menampilkan fallback saat offline tanpa menyentuh API', async () => {
  const origin = 'https://wedding.example';
  const handlers = {};
  const offline = new Response('offline');
  let online = true;
  vm.runInNewContext(await read('sw.js').then(String), {
    URL, Response,
    self: { location: { origin }, addEventListener: (name, fn) => { handlers[name] = fn; } },
    fetch: async () => { if (!online) throw new Error('offline'); return new Response('live'); },
    caches: { open: async () => ({ match: async (path) => path === '/offline.html' ? offline : null }) },
  });
  function request(path, method = 'GET', mode = 'navigate') {
    let response;
    handlers.fetch({ request: { url: origin + path, method, mode }, respondWith: (r) => { response = r; } });
    return response;
  }
  assert.equal(await (await request('/ucapan/')).text(), 'live');
  online = false;
  assert.equal(await request('/jafar&iklimah?to=Tamu'), offline);
  assert.equal(request('/api/ucapan'), undefined);
  assert.equal(request('/api/ucapan', 'POST', 'cors'), undefined);
  assert.equal(request('/assets/audio/qalbi-sajad-12.mp3', 'GET', 'no-cors'), undefined);
});
