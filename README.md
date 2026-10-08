# Undangan Ihsan & Syifa

Undangan digital Vue 3 + GSAP, sesuai `../prd.md`. Mobile memenuhi lebar layar; desktop memakai bingkai ponsel maksimal 480px dan panel editorial.

## Jalankan

```sh
npm install
npm run dev
```

Node.js 22.13+ diperlukan untuk penyimpanan RSVP SQLite lokal. Konfirmasi lokal tersimpan di `.local/rsvp.sqlite` (tidak dimasukkan ke Git). Pada Sites, RSVP disimpan di database D1 melalui binding `DB`.

## Personalisasi

Ganti tanggal, nama lokasi, alamat, tautan Google Maps, foto, dan nomor rekening pada `src/config.js`. Set `demo: false` setelah semua data asli tersedia. Lokasi/tanggal/foto saat ini adalah contoh; nomor rekening sengaja kosong. Gunakan `?for=Aziz%20%26%20Partner` untuk sapaan personal di layar pembuka, chat, dan isian nama RSVP. Parameter lama `?to=Nama%20Tamu` tetap didukung. Jika menggunakan tanda kutip, `?for='Aziz & partner'` juga didukung; tautan dengan `%26` direkomendasikan agar karakter ampersand tidak dianggap pemisah parameter. Tanpa nama, sapaan tetap “Tamu Istimewa”.

Foto contoh: Alexander Mass dan Camila Cordeiro / Unsplash. Tautan sumber tersedia di konfigurasi dan galeri. Musik berupa melodi ambient sintetis dan hanya diputar saat tamu menekan tombol musik.

## Build dan data

`npm run build` menghasilkan `dist/client` untuk aset dan `dist/server/index.js` untuk Cloudflare Worker. `npm run db:generate` menghasilkan migrasi dari `db/schema.ts`. Migrasi diterapkan saat deployment Sites.

Tabel `rsvps` memuat nama, kehadiran, jumlah tamu, ucapan, dan waktu kirim. Tidak ada endpoint daftar publik; pemilik dapat mengakses data melalui database Sites. Pengiriman menggunakan ID unik per sesi sehingga retry tidak menambahkan duplikat. Jangan mengubah migrasi yang sudah terpublikasi.

Jumlah tamu pada formulir dan validasi server dibatasi 1–3 orang. Pilihan tidak hadir disimpan dengan jumlah tamu 0.

## Database RSVP di Vercel

`vercel.json` menerbitkan frontend dari `dist/client` dan Vercel Function `api/rsvp.js`. Cloudflare Worker dan binding D1 tidak berjalan di Vercel. Formulir memakai `POST /api/rsvp` pada domain yang sedang dibuka; fungsi tersebut memvalidasi input melalui `server/validation.js`, lalu menulis ke Supabase PostgreSQL.

Konfigurasi Supabase:

1. Siapkan project Supabase dan terapkan schema `supabase/schema.sql` sebagai migrasi. Migrasi SQLite di `drizzle/` tetap khusus Sites dan tidak digunakan untuk Supabase.
2. Pasang `SUPABASE_URL` dan `SUPABASE_PUBLISHABLE_KEY` sebagai environment variables server pada Vercel Production. Contoh nama variabel ada di `.env.example`. Jangan gunakan prefix `VITE_` atau memasukkan service-role/secret key ke browser.
3. Deploy ulang. Fungsi memakai Data API dengan `return=minimal`. Primary key UUID memastikan retry tidak menambah baris; fungsi mengenali error duplikat `23505` sebagai konfirmasi yang telah tersimpan. Tidak memakai upsert agar role pengirim tidak membutuhkan izin SELECT.
4. Lihat konfirmasi melalui Supabase Dashboard → Table Editor → `public.rsvps`. Tidak ada endpoint daftar RSVP untuk tamu.

RLS aktif. Role `anon` hanya diberi izin INSERT pada kolom formulir; akses SELECT, UPDATE, DELETE dan pengisian waktu server tidak diberikan. Database ikut menegakkan nama 1–100 karakter, ucapan maksimal 1000 karakter, jumlah tamu hadir 1–3, dan tidak hadir 0.

Uji validasi dan endpoint dengan `node --test tests/*.test.mjs`. Project aktif yang digunakan: SanzProject (`odlfdzybdhqapmbjencv`). Tabel: `public.rsvps`.

Dokumentasi: https://supabase.com/docs/guides/api/securing-your-api.

Kutipan singkat QS. Ar-Rum 30:21 (Arab dan penggalan terjemahan Indonesia) bersumber dari https://quran.com/id/bangsa-romawi/21.
