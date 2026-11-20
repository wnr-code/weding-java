ALTER TABLE ucapan ADD COLUMN kota TEXT NOT NULL DEFAULT '' CHECK (length(kota) <= 60);
