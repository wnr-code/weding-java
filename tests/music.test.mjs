import test from 'node:test';
import assert from 'node:assert/strict';
import { Music } from '../public/assets/js/music.js';

test('Ney: menolak autoplay, mencoba lagi dengan audio yang sama, dan tetap mengulang', async (t) => {
  let percobaan = 0;
  const asli = globalThis.Audio;
  t.after(() => { if (asli === undefined) delete globalThis.Audio; else globalThis.Audio = asli; });
  globalThis.Audio = class {
    paused = true;
    play() {
      if (++percobaan === 1) return Promise.reject(new DOMException('Perlu ketukan', 'NotAllowedError'));
      this.paused = false;
      return Promise.resolve();
    }
    pause() { this.paused = true; }
  };
  const musik = new Music({ berkas: '/assets/audio/ney-dinletisi.mp3', posisiAwal: 12 });
  assert.equal(await musik.start(), false);
  const audio = musik.el;
  assert.equal(audio.loop, true);
  assert.equal(audio.currentTime, 12);
  assert.equal(await musik.start(), true);
  assert.equal(musik.el, audio);
  audio.pause(); // Interupsi oleh browser atau sistem.
  assert.equal(await musik.start(), true);
  assert.equal(audio.paused, false);
  musik.pause();
  assert.equal(audio.paused, true);
});
