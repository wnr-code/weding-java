-- Undangan Ja'far & Iklimah — tabel ucapan & konfirmasi kehadiran.
-- Jalankan: npx wrangler d1 migrations apply weding-java --remote

CREATE TABLE IF NOT EXISTS ucapan (
  id          TEXT PRIMARY KEY,
  nama        TEXT NOT NULL,
  kehadiran   TEXT NOT NULL CHECK (kehadiran IN ('hadir', 'tidak_hadir', 'ragu')),
  jumlah      INTEGER NOT NULL DEFAULT 0 CHECK (jumlah >= 0 AND jumlah <= 10),
  pesan       TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL,
  ip_hash     TEXT
);

CREATE INDEX IF NOT EXISTS idx_ucapan_created ON ucapan (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ucapan_ip ON ucapan (ip_hash, created_at DESC);
