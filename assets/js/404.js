/* =========================================================================
   Halaman 404: menampilkan TP yang diminta (jika alamatnya seperti 2-1.html)
   dan daftar materi yang sudah tersedia, berdasarkan data.js.
   GitHub Pages otomatis menampilkan 404.html untuk alamat yang tidak ada.
   ========================================================================= */
(() => {
  'use strict';
  const KKA = window.KKA;
  if (!KKA) return;

  // Contoh: /kodingdanka/2-10.html → kode "2.10"
  const match = /(\d+)-(\d+)\.html?$/i.exec(location.pathname);
  const asked = match ? KKA.find(`${match[1]}.${match[2]}`) : null;
  if (asked) {
    const code = document.querySelector('[data-nf-code]');
    code.textContent = `TP ${asked.kode}`;
    code.hidden = false;
    document.querySelector('#judul-404').innerHTML = asked.judul;
    document.querySelector('[data-nf-lead]').textContent =
      `Materi TP ${asked.kode} untuk Kelas ${KKA.KELAS[asked.kelas]} Semester ${asked.semester} sedang disiapkan oleh guru. Sambil menunggu, pelajari materi yang sudah tersedia di bawah ini.`;
    document.title = `TP ${asked.kode} Sedang Disiapkan — Koding dan KA SMPN 1 Bandar Seikijang`;
  }

  const box = document.querySelector('[data-nf-ready]');
  const ready = KKA.ATP.filter((a) => a.ready);
  if (box && ready.length) {
    box.innerHTML = ready.map((tp) => `
      <article class="mini-card recap-card" data-el="${tp.el}">
        <p class="recap-tp">TP ${tp.kode} · Kelas ${KKA.KELAS[tp.kelas]}</p>
        <h4>${tp.judul}</h4>
        <a href="${tp.href}">Buka materi <i class="bi bi-arrow-right-short" aria-hidden="true"></i></a>
      </article>`).join('');
  }
})();
