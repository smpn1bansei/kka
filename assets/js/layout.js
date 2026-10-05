/* =========================================================================
   Komponen tata letak bersama: <kka-header> dan <kka-footer>
   Header, menu, dan footer cukup diubah DI SINI, semua halaman ikut berubah.

   Cara pakai (letakkan tepat di awal <body>):
     <kka-header active="atp"></kka-header>
     <script src="assets/js/layout.js"></script>
     ... isi halaman ...
     <kka-footer></kka-footer>

   Atribut <kka-header>:
     home    → khusus beranda (tautan menu menjadi #tentang, dst.)
     active  → menu yang disorot: tentang | elemen | peta | atp | rujukan

   File ini sengaja dimuat TANPA defer agar header langsung tampil
   (tidak "meloncat" saat halaman dibuka).
   ========================================================================= */
(function () {
  'use strict';

  const MENU = [
    ['tentang', 'Tentang'],
    ['elemen', 'Elemen'],
    ['peta', 'Peta TP'],
    ['atp', 'Alur TP'],
    ['rujukan', 'Rujukan'],
  ];

  const FOOTER_LINKS = [
    ['tentang', 'Tentang Mata Pelajaran'],
    ['elemen', 'Elemen &amp; Deskripsi'],
    ['peta', 'Peta TP'],
    ['atp', 'Alur Tujuan Pembelajaran'],
    ['rujukan', 'Rujukan'],
  ];

  const KELAS = [['7', 'VII'], ['8', 'VIII'], ['9', 'IX']];

  const BRAND = `
    <svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect x=".5" y=".5" width="39" height="39" rx="11" fill="#10285a" stroke="#ffffff" stroke-opacity=".16"/>
      <path d="M13 13 27 27M27 13 13 27" stroke="#ffffff" stroke-opacity=".45" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="13" cy="13" r="4.2" fill="#4dabf7"/>
      <circle cx="27" cy="13" r="4.2" fill="#ff922b"/>
      <circle cx="13" cy="27" r="4.2" fill="#51cf66"/>
      <circle cx="27" cy="27" r="4.2" fill="#da77f2"/>
      <circle cx="20" cy="20" r="3.2" fill="#ffffff"/>
    </svg>
    <span class="brand-text">
      <strong>Koding &amp; KA</strong>
      <small>SMPN 1 Bandar Seikijang</small>
    </span>`;

  // Di beranda tautan cukup "#tentang"; di halaman lain "index.html#tentang"
  const base = (isHome) => (isHome ? '#' : 'index.html#');

  class KkaHeader extends HTMLElement {
    connectedCallback() {
      const isHome = this.hasAttribute('home');
      const active = this.getAttribute('active') || '';
      const menu = MENU.map(([id, label]) => {
        const on = id === active ? ' class="is-active"' : '';
        return `<li><a href="${base(isHome)}${id}"${on}>${label}</a></li>`;
      }).join('');

      this.innerHTML = `
        <a class="skip-link" href="#konten">Lewati ke konten utama</a>
        <header class="site-header">
          <nav class="nav container" aria-label="Navigasi utama">
            <a class="brand" href="${isHome ? '#beranda' : 'index.html'}">${BRAND}</a>
            <ul class="nav-menu" id="menu-utama">${menu}</ul>
            <div class="nav-actions">
              <button class="icon-btn" type="button" data-fullscreen-toggle aria-pressed="false" aria-label="Tampilkan layar penuh" title="Layar penuh">
                <i class="bi bi-arrows-fullscreen" aria-hidden="true"></i>
              </button>
              <button class="icon-btn" type="button" data-theme-toggle aria-label="Ganti tema">
                <i class="bi bi-moon-stars" aria-hidden="true"></i>
              </button>
              <button class="icon-btn nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="menu-utama" aria-label="Buka menu">
                <i class="bi bi-list" aria-hidden="true"></i>
              </button>
            </div>
          </nav>
        </header>`;
    }
  }

  class KkaFooter extends HTMLElement {
    connectedCallback() {
      const isHome = document.querySelector('kka-header[home]') !== null;
      const b = base(isHome);
      const links = FOOTER_LINKS.map(([id, label]) => `<li><a href="${b}${id}">${label}</a></li>`).join('');
      const kelas = KELAS.map(([k, r]) => `<li><a href="${b}kelas-${k}">Kelas ${r}</a></li>`).join('');

      this.innerHTML = `
        <footer class="site-footer">
          <div class="container footer-grid">
            <div class="footer-brand">
              <a class="brand" href="${isHome ? '#beranda' : 'index.html'}">${BRAND}</a>
              <p>Situs kurikulum mata pelajaran Koding dan Kecerdasan Artifisial Fase D di SMP Negeri 1 Bandar Seikijang, rujukan bersama bagi murid, guru, dan orang tua.</p>
            </div>
            <nav aria-labelledby="footer-jelajahi">
              <h2 class="footer-title" id="footer-jelajahi">Jelajahi</h2>
              <ul>${links}</ul>
            </nav>
            <nav aria-labelledby="footer-kelas">
              <h2 class="footer-title" id="footer-kelas">ATP per Kelas</h2>
              <ul>${kelas}</ul>
            </nav>
          </div>
          <div class="container footer-bottom">
            <p>© <span data-year>${new Date().getFullYear()}</span> SMP Negeri 1 Bandar Seikijang · Koding dan Kecerdasan Artifisial</p>
            <p>Mengacu pada Panduan Mata Pelajaran KKA (Pusat Kurikulum dan Pembelajaran, 2025)</p>
          </div>
        </footer>
        <button class="to-top" type="button" data-to-top aria-label="Kembali ke atas">
          <i class="bi bi-arrow-up" aria-hidden="true"></i>
        </button>`;
    }
  }

  if (!customElements.get('kka-header')) customElements.define('kka-header', KkaHeader);
  if (!customElements.get('kka-footer')) customElements.define('kka-footer', KkaFooter);
})();
