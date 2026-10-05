/* =========================================================================
   Koding dan Kecerdasan Artifisial (KKA) · SMP Negeri 1 Bandar Seikijang
   Interaksi umum (semua halaman): tema terang/gelap, layar penuh, menu,
   bayangan header, tombol ke atas, animasi muncul. Khusus beranda: navigasi
   aktif, filter Alur TP, tanda "Materi tersedia", dan salin sitasi.
   Komponen halaman materi ada di lesson.js; header/footer di layout.js.
   ========================================================================= */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Tema terang / gelap ---------- */
  const THEME_KEY = 'kka-tema';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const themeBtn = $('[data-theme-toggle]');
  const currentTheme = () => root.dataset.theme || (prefersDark.matches ? 'dark' : 'light');

  function syncThemeButton() {
    if (!themeBtn) return;
    const dark = currentTheme() === 'dark';
    themeBtn.setAttribute('aria-label', dark ? 'Gunakan tema terang' : 'Gunakan tema gelap');
    themeBtn.title = dark ? 'Tema terang' : 'Tema gelap';
    themeBtn.innerHTML = `<i class="bi ${dark ? 'bi-sun' : 'bi-moon-stars'}" aria-hidden="true"></i>`;
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* penyimpanan diblokir: abaikan */ }
      syncThemeButton();
    });
    prefersDark.addEventListener('change', syncThemeButton);
    syncThemeButton();
  }

  /* ---------- 1b. Layar penuh (untuk ditampilkan di proyektor/TV) ---------- */
  const fsBtn = $('[data-fullscreen-toggle]');
  const fsSupported = document.fullscreenEnabled || document.webkitFullscreenEnabled;
  const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;

  function syncFullscreenButton() {
    const on = Boolean(fsElement());
    root.classList.toggle('is-fullscreen', on);
    if (!fsBtn) return;
    fsBtn.setAttribute('aria-pressed', String(on));
    fsBtn.setAttribute('aria-label', on ? 'Keluar dari layar penuh' : 'Tampilkan layar penuh');
    fsBtn.title = on ? 'Keluar dari layar penuh (Esc)' : 'Layar penuh';
    fsBtn.innerHTML = `<i class="bi ${on ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'}" aria-hidden="true"></i>`;
  }

  if (fsBtn) {
    if (!fsSupported) {
      fsBtn.hidden = true; // mis. Safari di iPhone belum mendukung layar penuh untuk halaman
    } else {
      fsBtn.addEventListener('click', () => {
        if (fsElement()) {
          (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } else {
          const request = root.requestFullscreen || root.webkitRequestFullscreen;
          const result = request.call(root);
          if (result && result.catch) result.catch(() => {});
        }
      });
      document.addEventListener('fullscreenchange', syncFullscreenButton);
      document.addEventListener('webkitfullscreenchange', syncFullscreenButton);
      syncFullscreenButton();
    }
  }

  /* ---------- 2. Menu navigasi di layar kecil ---------- */
  const navToggle = $('[data-nav-toggle]');
  const navMenu = $('#menu-utama');

  function setMenu(open) {
    if (!navToggle || !navMenu) return;
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    navToggle.innerHTML = `<i class="bi ${open ? 'bi-x-lg' : 'bi-list'}" aria-hidden="true"></i>`;
    navMenu.classList.toggle('is-open', open);
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => setMenu(navToggle.getAttribute('aria-expanded') !== 'true'));
    navMenu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
        setMenu(false);
        navToggle.focus();
      }
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
  }

  /* ---------- 3. Bayangan header & tombol kembali ke atas ---------- */
  const header = $('.site-header');
  const toTop = $('[data-to-top]');

  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (toTop) toTop.classList.toggle('is-visible', y > 720);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: motionOK ? 'smooth' : 'auto' }));
  }

  /* ---------- 4. Tandai menu sesuai bagian yang sedang dibaca ---------- */
  const navLinks = $$('.nav-menu a[href^="#"]');
  if ('IntersectionObserver' in window && navLinks.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = `#${entry.target.id}`;
        navLinks.forEach((a) => {
          const active = a.getAttribute('href') === id;
          a.classList.toggle('is-active', active);
          if (active) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    $$('main > section[id]').forEach((section) => spy.observe(section));
  }

  /* ---------- 5. Animasi muncul saat digulir ---------- */
  const revealEls = $$('[data-reveal]');
  if (motionOK && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- 6. Filter Alur Tujuan Pembelajaran ---------- */
  const atp = $('#atp');
  if (atp && $('.atp-tools', atp)) {
    const kelasBtns = $$('[data-kelas-btn]', atp);
    const elBtns = $$('[data-el-btn]', atp);
    const search = $('#cari-tp', atp);
    const years = $$('.year', atp);
    const items = $$('.atp-item', atp);
    const status = $('[data-atp-status]', atp);
    const resetBtns = $$('[data-atp-reset]', atp);
    const emptyBox = $('[data-atp-empty]', atp);

    const KELAS_LABEL = { 7: 'Kelas VII', 8: 'Kelas VIII', 9: 'Kelas IX' };
    const EL_LABEL = Object.fromEntries(elBtns.map((b) => [b.dataset.elBtn, b.textContent.trim()]));
    const state = { kelas: 'semua', el: '', q: '' };

    const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
    const searchText = new Map(items.map((li) => [li, normalize(li.textContent)]));

    function render() {
      // "2-10" atau "2,10" dianggap sama dengan kode "2.10"
      const q = normalize(state.q).replace(/(\d)\s*[-,]\s*(\d)/g, '$1.$2');
      const codeQuery = /^\d\.\d{1,2}$/.test(q) ? q : '';
      const terms = q ? q.split(' ') : [];
      const filtered = state.kelas !== 'semua' || state.el || q;
      let shown = 0;
      let lastVisible = null;

      years.forEach((year) => {
        const kelasOK = state.kelas === 'semua' || year.dataset.kelas === state.kelas;
        let yearCount = 0;

        $$('.semester', year).forEach((sem) => {
          let semCount = 0;
          $$('.atp-item', sem).forEach((li) => {
            const textOK = !q || (codeQuery ? li.dataset.code === codeQuery : terms.every((t) => searchText.get(li).includes(t)));
            const ok = kelasOK && (!state.el || li.dataset.el === state.el) && textOK;
            li.hidden = !ok;
            if (ok) semCount += 1;
          });
          sem.hidden = semCount === 0;
          const count = $('.semester-count', sem);
          const total = count ? Number(count.dataset.total) : 0;
          if (count) count.textContent = semCount < total ? `${semCount} dari ${total} TP` : `${total} TP`;
          yearCount += semCount;
        });

        year.hidden = yearCount === 0;
        year.classList.remove('is-last');
        if (yearCount) lastVisible = year;
        shown += yearCount;
      });
      if (lastVisible) lastVisible.classList.add('is-last');

      const notes = [];
      if (state.kelas !== 'semua') notes.push(KELAS_LABEL[state.kelas]);
      if (state.el) notes.push(EL_LABEL[state.el]);
      if (state.q.trim()) notes.push(`“${state.q.trim()}”`);
      status.textContent = `Menampilkan ${shown} dari ${items.length} tujuan pembelajaran${notes.length ? ` · ${notes.join(' · ')}` : ''}`;

      emptyBox.hidden = shown > 0;
      resetBtns.forEach((btn) => {
        if (!emptyBox.contains(btn)) btn.hidden = !filtered;
      });
    }

    function setKelas(kelas) {
      state.kelas = kelas;
      kelasBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kelasBtn === kelas)));
      render();
    }

    function setElemen(id) {
      state.el = state.el === id ? '' : id;
      elBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.elBtn === state.el)));
      render();
    }

    function resetAll() {
      state.q = '';
      state.el = '';
      search.value = '';
      elBtns.forEach((b) => b.setAttribute('aria-pressed', 'false'));
      setKelas('semua');
    }

    kelasBtns.forEach((b) => b.addEventListener('click', () => setKelas(b.dataset.kelasBtn)));
    elBtns.forEach((b) => b.addEventListener('click', () => setElemen(b.dataset.elBtn)));
    search.addEventListener('input', () => { state.q = search.value; render(); });
    search.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && search.value) { search.value = ''; state.q = ''; render(); }
    });
    resetBtns.forEach((b) => b.addEventListener('click', () => { resetAll(); search.focus(); }));

    // Tautan seperti index.html#kelas-8 langsung menampilkan kelas tersebut
    const openKelas = (hash) => {
      const match = /^#kelas-(7|8|9)$/.exec(hash || '');
      if (!match) return false;
      resetAll();
      setKelas(match[1]);
      return true;
    };
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#kelas-"]');
      if (link) openKelas(link.getAttribute('href'));
    });
    window.addEventListener('hashchange', () => openKelas(location.hash));
    if (openKelas(location.hash)) {
      requestAnimationFrame(() => {
        const target = document.getElementById(location.hash.slice(1));
        if (target) target.scrollIntoView();
      });
    }

    render();
  }

  /* ---------- 6b. Tanda "Materi tersedia" (dari data.js, kolom ready) ---------- */
  const KKA = window.KKA;
  if (KKA) {
    const ready = KKA.ATP.filter((a) => a.ready);
    ready.forEach((tp) => {
      $$(`.atp-item[data-code="${tp.kode}"] .atp-text`).forEach((text) => {
        if ($('.atp-ready', text)) return;
        text.insertAdjacentHTML('beforeend', '<span class="atp-ready"><i class="bi bi-check2" aria-hidden="true"></i> Materi tersedia</span>');
      });
    });
    $$('[data-ready-count]').forEach((el) => { el.textContent = String(ready.length); });
  }

  /* ---------- 7. Salin sitasi rujukan ---------- */
  $$('[data-copy]').forEach((btn) => {
    const label = $('[data-copy-label]', btn);
    const icon = $('i', btn);
    const original = label ? label.textContent : '';

    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (err) {
        // Cadangan untuk peramban lama / koneksi non-HTTPS
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
        document.body.appendChild(area);
        area.select();
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        area.remove();
      }

      if (label) label.textContent = ok ? 'Sitasi tersalin!' : 'Gagal menyalin, silakan salin manual';
      if (icon) icon.className = ok ? 'bi bi-clipboard-check' : 'bi bi-clipboard-x';
      btn.classList.toggle('is-done', ok);
      clearTimeout(btn.copyTimer);
      btn.copyTimer = setTimeout(() => {
        if (label) label.textContent = original;
        if (icon) icon.className = 'bi bi-clipboard';
        btn.classList.remove('is-done');
      }, 2400);
    });
  });

  /* ---------- 8. Tahun berjalan di footer ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
