CREATE TABLE IF NOT EXISTS tanda_kasih (
  transaksi TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  pesan TEXT NOT NULL,
  dibuat TEXT NOT NULL,
  uji INTEGER NOT NULL CHECK (uji IN (0, 1))
);
CREATE INDEX IF NOT EXISTS idx_tanda_kasih_feed ON tanda_kasih (uji, dibuat DESC);
