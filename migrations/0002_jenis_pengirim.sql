-- Ucapan lama tetap tersimpan tanpa menebak jenis pengirimnya.
ALTER TABLE ucapan ADD COLUMN jenis_pengirim TEXT
  CHECK (jenis_pengirim IN ('laki_laki', 'perempuan'));
