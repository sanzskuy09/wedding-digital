# Undangan Ihsan & Syifa

Undangan digital Vue 3 + GSAP, sesuai `../prd.md`. Mobile-first, dengan bingkai ponsel maksimal 480px dan panel editorial di desktop.

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

Kutipan singkat QS. Ar-Rum 30:21 (Arab dan penggalan terjemahan Indonesia) bersumber dari https://quran.com/id/bangsa-romawi/21.
