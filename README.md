# Koding dan Kecerdasan Artifisial — SMP Negeri 1 Bandar Seikijang

Situs kurikulum mata pelajaran **Koding dan Kecerdasan Artifisial (KKA) Fase D** (Kelas VII–IX):
elemen, capaian pembelajaran, alur tujuan pembelajaran (ATP), dan halaman materi setiap TP.

Rujukan: *Panduan Mata Pelajaran Koding dan Kecerdasan Artifisial, Perencanaan Pembelajaran Mendalam*
(Pusat Kurikulum dan Pembelajaran, 2025, Hal. 70–73).

Situs ini hanya memakai HTML, CSS, dan JavaScript biasa (tanpa *build tool*), sehingga bisa:

- dibuka langsung dengan **klik dua kali** `index.html` di komputer, dan
- diterbitkan di **GitHub Pages** apa adanya.

## Struktur folder

```
index.html            Beranda: tentang mapel, elemen, peta TP, alur TP, rujukan
1-1.html, 1-2.html …  Halaman materi tiap TP (nama file = kode TP, titik → tanda hubung)
404.html              Tampil otomatis di GitHub Pages jika halaman belum ada
_template-tp.html     Templat untuk membuat halaman TP baru (tidak ikut diterbitkan)
assets/
  css/style.css       Gaya umum: warna, header, footer, beranda
  css/lesson.css      Gaya khusus halaman materi (kuis, lembar kerja, robot, dll.)
  js/data.js          DATA ATP: satu sumber untuk seluruh situs
  js/layout.js        Header, menu, dan footer bersama (<kka-header>, <kka-footer>)
  js/main.js          Interaksi umum: tema, layar penuh, menu, filter ATP beranda
  js/lesson.js        Interaksi halaman materi + tombol TP sebelumnya/berikutnya
  js/404.js           Isi halaman 404 (TP yang diminta + materi yang tersedia)
  img/favicon.svg     Ikon tab peramban
```

## Header dan footer bersama

Header, menu, dan footer **tidak lagi ditulis di setiap halaman**. Setiap halaman cukup memuat:

```html
<body>
  <kka-header active="atp"><a href="index.html">Beranda</a></kka-header>
  <script src="assets/js/layout.js"></script>
  ...
  <kka-footer></kka-footer>
</body>
```

Untuk mengubah menu, nama sekolah, atau isi footer, cukup sunting **`assets/js/layout.js`**,
dan semua halaman ikut berubah.

## Membuat halaman materi TP baru

1. Salin `_template-tp.html`, lalu beri nama sesuai kode TP, misalnya `2-1.html` untuk TP 2.1.
2. Ganti semua tulisan bertanda ✎ (judul, kode, kelas, elemen, isi materi).
3. Gunakan komponen yang sudah ada. Contohnya bisa dilihat di:
   - `1-1.html`: kuis, turus, penghitung turus, lembar kerja yang bisa dicetak
   - `1-2.html`: alur empat pilar, pohon masalah, diagram alir, menyusun langkah, tombol sorot
   - `1-3.html`: simulasi robot dan debugging
4. Buka `assets/js/data.js`, lalu ubah `false` menjadi `true` pada baris TP tersebut, contoh:
   ```js
   ['2.1', 'Memahami konsep dasar konten digital', 7, 1, true],
   ```
   Dengan begitu label **"Materi tersedia"** di beranda, jumlah materi tersedia,
   tombol **TP sebelumnya/berikutnya**, dan halaman 404 menyesuaikan otomatis.

## Mengubah warna

Semua warna diatur di bagian **TOKEN** paling atas `assets/css/style.css`:

- `--night`: warna biru dongker untuk header, hero, dan footer
- `--e1` sampai `--e4`: warna keempat elemen (biru, oranye, hijau, ungu)

## Menerbitkan di GitHub Pages

1. Unggah seluruh isi folder ini ke sebuah repositori GitHub (`index.html` di folder paling atas).
2. Buka **Settings → Pages**, pilih **Deploy from a branch**, branch `main`, folder `/ (root)`, lalu **Save**.
3. Situs aktif di `https://<username>.github.io/<nama-repo>/`.

## Catatan

- Fitur interaktif (menu ponsel, kuis, simulasi) memerlukan JavaScript. Isi materi tetap terbaca tanpa JavaScript.
- Tombol layar penuh disembunyikan di layar ponsel. Saat layar penuh, ukuran huruf otomatis diperbesar agar terbaca jelas di proyektor.
- Font (Plus Jakarta Sans, JetBrains Mono) dan ikon (Bootstrap Icons) dimuat dari CDN, sehingga perlu koneksi internet. Tanpa internet, situs tetap bisa dipakai dengan font bawaan perangkat.
