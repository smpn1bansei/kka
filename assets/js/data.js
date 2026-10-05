/* =========================================================================
   Data Alur Tujuan Pembelajaran (ATP) KKA Fase D — SATU SUMBER untuk seluruh situs.
   Rujukan: Panduan Mata Pelajaran Koding dan Kecerdasan Artifisial,
   Perencanaan Pembelajaran Mendalam (Pusat Kurikulum dan Pembelajaran, 2025, Hal. 70–73).

   Setelah halaman materi sebuah TP selesai dibuat (mis. 2-1.html),
   cukup ubah "ready: false" menjadi "ready: true" pada TP tersebut.
   Label "Materi tersedia" di beranda, tombol TP sebelumnya/berikutnya,
   dan halaman 404 akan menyesuaikan otomatis.

   Urutan array = urutan alur belajar (Kelas VII Smt 1 → Kelas IX Smt 2).
   ========================================================================= */
(function (root) {
  'use strict';

  const ELEMEN = {
    1: 'Berpikir Komputasional',
    2: 'Literasi Digital',
    3: 'Literasi dan Etika Kecerdasan Artifisial',
    4: 'Pemanfaatan dan Pengembangan Kecerdasan Artifisial',
  };

  const KELAS = { 7: 'VII', 8: 'VIII', 9: 'IX' };

  // [kode, judul (boleh berisi <i lang="en">), kelas, semester, ready]
  const ROWS = [
    ['1.1', 'Memahami pengelolaan data dalam kehidupan masyarakat', 7, 1, true],
    ['1.2', 'Menerapkan pemecahan masalah sederhana dalam kehidupan masyarakat', 7, 1, true],
    ['1.3', 'Menerapkan pengembangan dan pengujian instruksi', 7, 1, true],
    ['2.1', 'Memahami konsep dasar konten digital', 7, 1, true],
    ['2.2', 'Menerapkan pengembangan ide dan cerita sederhana', 7, 1, true],
    ['2.3', 'Menerapkan penggunaan aplikasi dasar untuk produksi konten digital berupa <i lang="en">slide</i> dan infografis', 7, 1, true],
    ['2.4', 'Menerapkan tata letak visual yang menarik dalam produksi konten digital', 7, 1, true],

    ['4.1', 'Memahami perangkat Kecerdasan Artifisial sederhana', 7, 2, false],
    ['4.2', 'Menerapkan input bermakna ke dalam sistem Kecerdasan Artifisial', 7, 2, false],
    ['3.1', 'Memahami konsep dan cara kerja Kecerdasan Artifisial Generatif', 7, 2, false],
    ['3.2', 'Memahami risiko Kecerdasan Artifisial Generatif', 7, 2, false],
    ['3.3', 'Memahami manfaat dan dampak Kecerdasan Artifisial Generatif', 7, 2, false],

    ['1.4', 'Menerapkan pengolahan dan penyajian data dalam konteks yang lebih luas', 8, 1, true],
    ['1.5', 'Menerapkan langkah-langkah sistematis untuk menyelesaikan masalah', 8, 1, true],
    ['1.6', 'Menerapkan penyusunan dan perbaikan instruksi yang lebih kompleks', 8, 1, true],
    ['2.5', 'Menerapkan teknik produksi dan <i lang="en">editing</i>', 8, 1, true],
    ['2.6', 'Menerapkan aplikasi dasar untuk produksi konten digital berupa audio dan video', 8, 1, true],
    ['2.7', 'Menerapkan teknik <i lang="en">storytelling</i> digital', 8, 1, false],
    ['2.8', 'Memahami aspek etika dan hak cipta', 8, 1, false],
    ['2.9', 'Menerapkan diseminasi konten melalui <i lang="en">platform</i> digital', 8, 1, false],

    ['3.4', 'Memahami Kecerdasan Artifisial sebagai alat bantu manusia', 8, 2, false],
    ['3.5', 'Memahami perbedaan cara manusia dan Kecerdasan Artifisial menggabungkan informasi', 8, 2, false],
    ['3.6', 'Memahami pemanfaatan perangkat penginderaan oleh Kecerdasan Artifisial', 8, 2, false],
    ['4.3', 'Menerapkan data latih dalam pengembangan Kecerdasan Artifisial', 8, 2, false],
    ['4.4', 'Menganalisis pemanfaatan Kecerdasan Artifisial pada <i lang="en">platform</i> tertentu', 8, 2, false],
    ['4.5', 'Menerapkan eksperimen klasifikasi oleh Kecerdasan Artifisial', 8, 2, false],

    ['1.7', 'Menerapkan teknologi untuk mengolah data', 9, 1, false],
    ['1.8', 'Mengembangkan solusi efektif untuk permasalahan yang kompleks', 9, 1, false],
    ['1.9', 'Menuliskan instruksi menggunakan teknologi atau pemrograman dasar', 9, 1, false],
    ['2.10', 'Menerapkan produksi konten digital yang kompleks dan inovatif', 9, 1, false],
    ['2.11', 'Menerapkan <i lang="en">editing</i> lanjutan', 9, 1, false],
    ['2.12', 'Mengevaluasi kualitas konten digital', 9, 1, false],
    ['2.13', 'Menerapkan strategi diseminasi konten digital yang efektif', 9, 1, false],

    ['3.7', 'Menganalisis kualitas data', 9, 2, false],
    ['3.8', 'Menerapkan keamanan data dalam pemanfaatan Kecerdasan Artifisial', 9, 2, false],
    ['3.9', 'Menganalisis artefak hasil Kecerdasan Artifisial berupa konten <i lang="en">deep fake</i> dalam bentuk gambar, audio, atau video', 9, 2, false],
    ['4.6', 'Memahami pemanfaatan Kecerdasan Artifisial di berbagai bidang', 9, 2, false],
    ['4.7', 'Menerapkan pengembangan konten digital dengan memanfaatkan Kecerdasan Artifisial', 9, 2, false],
  ];

  const href = (kode) => `${kode.replace('.', '-')}.html`;

  const ATP = ROWS.map(([kode, judul, kelas, semester, ready]) => ({
    kode,
    judul,
    kelas,
    semester,
    ready,
    el: Number(kode.split('.')[0]),
    href: href(kode),
  }));

  const data = {
    ELEMEN,
    KELAS,
    ATP,
    href,
    find: (kode) => ATP.find((a) => a.kode === kode),
    REFERENSI: 'Panduan Mata Pelajaran Koding dan Kecerdasan Artifisial, Perencanaan Pembelajaran Mendalam (Pusat Kurikulum dan Pembelajaran, 2025, Hal. 70–73)',
  };

  // Dipakai di peramban (window.KKA) dan juga bisa dibaca Node.js
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  else root.KKA = data;
})(this);
