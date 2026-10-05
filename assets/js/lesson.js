/* =========================================================================
   Koding dan Kecerdasan Artifisial (KKA) · SMP Negeri 1 Bandar Seikijang
   Komponen interaktif HALAMAN MATERI TP (mis. 1-1.html): daftar isi, turus,
   penghitung turus, kuis, cetak lembar kerja, menyusun langkah, sorot,
   simulasi robot, serta navigasi TP sebelumnya/berikutnya.
   Dimuat SETELAH data.js dan main.js. Setiap bagian memeriksa elemennya
   dulu, jadi aman walau halaman tidak memakai semua komponen.
   ========================================================================= */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Daftar isi: tandai bagian yang sedang dibaca ---------- */
  const tocLinks = $$('.toc a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const tocSpy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        tocLinks.forEach((a) => {
          const active = a.getAttribute('href') === `#${entry.target.id}`;
          a.classList.toggle('is-active', active);
          if (active) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    tocLinks.forEach((a) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) tocSpy.observe(target);
    });
  }

  /* ---------- 2. Turus: <span class="tally" data-tally="8">8</span> ---------- */
  const tallyHTML = (n) => {
    let html = '';
    for (let i = 0; i < Math.floor(n / 5); i += 1) html += '<span class="tally-5" aria-hidden="true"></span>';
    if (n % 5) html += `<span class="tally-n" style="--n:${n % 5}" aria-hidden="true"></span>`;
    return html;
  };
  $$('[data-tally]').forEach((el) => {
    const n = Number(el.dataset.tally) || 0;
    el.innerHTML = `${tallyHTML(n)}<span class="sr-only">${n} turus</span>`;
  });

  /* ---------- 3. Penghitung turus digital ---------- */
  $$('[data-tally-counter]').forEach((box) => {
    const list = $('.counter-list', box);
    const totalEl = $('[data-total]', box);
    const blankRow = $('.counter-row', box).cloneNode(true);
    const MAX_ROWS = 10;

    function updateRow(row) {
      const n = Number(row.dataset.count) || 0;
      const name = $('.counter-name', row).value.trim() || 'kategori ini';
      $('.counter-num', row).textContent = String(n);
      $('.counter-tally', row).innerHTML = tallyHTML(n);
      $('[data-inc]', row).setAttribute('aria-label', `Tambah satu turus untuk ${name}`);
      $('[data-dec]', row).setAttribute('aria-label', `Kurangi satu turus untuk ${name}`);
    }
    function updateTotal() {
      const total = $$('.counter-row', box).reduce((sum, row) => sum + (Number(row.dataset.count) || 0), 0);
      totalEl.textContent = String(total);
    }

    box.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const row = btn.closest('.counter-row');
      if (btn.matches('[data-inc]')) {
        row.dataset.count = String((Number(row.dataset.count) || 0) + 1);
        updateRow(row);
      } else if (btn.matches('[data-dec]')) {
        row.dataset.count = String(Math.max(0, (Number(row.dataset.count) || 0) - 1));
        updateRow(row);
      } else if (btn.matches('[data-add-row]')) {
        if (list.children.length >= MAX_ROWS) return;
        const fresh = blankRow.cloneNode(true);
        fresh.dataset.count = '0';
        $('.counter-name', fresh).value = `Kategori ${list.children.length + 1}`;
        list.appendChild(fresh);
        updateRow(fresh);
        $('.counter-name', fresh).select();
        btn.disabled = list.children.length >= MAX_ROWS;
      } else if (btn.matches('[data-reset]')) {
        $$('.counter-row', box).forEach((r) => { r.dataset.count = '0'; updateRow(r); });
      } else {
        return;
      }
      updateTotal();
    });
    box.addEventListener('input', (e) => {
      const row = e.target.closest('.counter-row');
      if (row) updateRow(row);
    });

    $$('.counter-row', box).forEach(updateRow);
    updateTotal();
  });

  /* ---------- 4. Kuis dengan umpan balik langsung ---------- */
  $$('[data-quiz]').forEach((quiz) => {
    const questions = $$('.quiz-q', quiz);
    const scoreEl = $('[data-score]', quiz);
    const doneEl = $('[data-quiz-done]', quiz);
    let score = 0;
    let answered = 0;

    const choiceLabel = (q, value) => {
      const btn = $(`[data-choice="${value}"]`, q);
      return btn ? btn.textContent.trim() : value;
    };

    function finish() {
      if (!doneEl || answered < questions.length) return;
      const ratio = score / questions.length;
      doneEl.textContent = ratio === 1
        ? 'Luar biasa, semua jawabanmu tepat!'
        : ratio >= 0.7
          ? 'Bagus! Baca lagi penjelasan soal yang belum tepat.'
          : 'Tidak apa-apa. Baca ulang materinya, lalu coba lagi.';
      doneEl.hidden = false;
    }

    function reset() {
      score = 0;
      answered = 0;
      scoreEl.textContent = '0';
      if (doneEl) doneEl.hidden = true;
      questions.forEach((q) => {
        delete q.dataset.done;
        $$('[data-choice]', q).forEach((b) => {
          b.disabled = false;
          b.classList.remove('is-right', 'is-wrong');
          b.removeAttribute('aria-pressed');
        });
        const fb = $('.quiz-feedback', q);
        fb.hidden = true;
        fb.textContent = '';
      });
    }

    quiz.addEventListener('click', (e) => {
      if (e.target.closest('[data-quiz-reset]')) { reset(); return; }
      const btn = e.target.closest('[data-choice]');
      if (!btn) return;
      const q = btn.closest('.quiz-q');
      if (q.dataset.done) return;
      q.dataset.done = '1';

      const right = btn.dataset.choice === q.dataset.answer;
      $$('[data-choice]', q).forEach((b) => {
        b.disabled = true;
        if (b.dataset.choice === q.dataset.answer) b.classList.add('is-right');
      });
      if (!right) btn.classList.add('is-wrong');
      btn.setAttribute('aria-pressed', 'true');

      const fb = $('.quiz-feedback', q);
      fb.textContent = right
        ? `Tepat! ${q.dataset.explain}`
        : `Belum tepat. Jawabannya: ${choiceLabel(q, q.dataset.answer)}. ${q.dataset.explain}`;
      fb.className = `quiz-feedback ${right ? 'is-right' : 'is-wrong'}`;
      fb.hidden = false;

      answered += 1;
      if (right) score += 1;
      scoreEl.textContent = String(score);
      finish();
    });
  });

  /* ---------- 5. Cetak bagian tertentu saja (mis. lembar kerja) ---------- */
  $$('[data-print]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(btn.dataset.print);
      if (!target) return;
      root.classList.add('print-only');
      target.classList.add('print-target');
      const cleanup = () => {
        root.classList.remove('print-only');
        target.classList.remove('print-target');
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      window.print();
    });
  });

  /* ---------- 6. Aktivitas menyusun langkah (urutan benar ada di data-pos) ---------- */
  $$('[data-order]').forEach((box) => {
    const list = $('.order-list', box);
    const status = $('[data-order-status]', box);
    const items = () => $$('.order-item', list);
    const total = items().length;

    function refresh() {
      const all = items();
      all.forEach((li, i) => {
        li.classList.remove('is-right', 'is-wrong');
        $('[data-up]', li).disabled = i === 0;
        $('[data-down]', li).disabled = i === all.length - 1;
      });
    }

    box.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const li = btn.closest('.order-item');

      // Yang dipindah adalah tetangganya, sehingga fokus tetap pada tombol yang ditekan
      if (btn.matches('[data-up]') && li.previousElementSibling) {
        list.insertBefore(li.previousElementSibling, li.nextElementSibling);
      } else if (btn.matches('[data-down]') && li.nextElementSibling) {
        list.insertBefore(li.nextElementSibling, li);
      } else if (btn.matches('[data-order-check]')) {
        let right = 0;
        items().forEach((item, i) => {
          const ok = Number(item.dataset.pos) === i + 1;
          item.classList.toggle('is-right', ok);
          item.classList.toggle('is-wrong', !ok);
          if (ok) right += 1;
        });
        status.textContent = right === total
          ? 'Hebat! Semua langkah sudah berurutan dengan benar.'
          : `${right} dari ${total} langkah sudah di posisi yang benar. Pindahkan langkah yang berwarna merah, lalu periksa lagi.`;
        return;
      } else if (btn.matches('[data-order-shuffle]')) {
        const all = items();
        do {
          for (let i = all.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [all[i], all[j]] = [all[j], all[i]];
          }
        } while (all.every((item, i) => Number(item.dataset.pos) === i + 1));
        all.forEach((item) => list.appendChild(item));
        refresh();
        status.textContent = 'Langkah sudah diacak. Ayo susun lagi!';
        return;
      } else {
        return;
      }

      refresh();
      if (btn.disabled) $(btn.matches('[data-up]') ? '[data-down]' : '[data-up]', li).focus();
      status.textContent = `Langkah dipindah ke urutan ${items().indexOf(li) + 1}.`;
    });

    refresh();
  });

  /* ---------- 7. Simulasi robot pengantar paket ----------
     data-map : baris peta dipisah "/", R = robot, T = rumah tujuan, # = pohon, . = jalan
     data-dir : arah awal robot (N, E, S, W)
     Tombol [data-rb-load="M,M,L"] memuat program (M = maju, L = belok kiri, R = belok kanan) */
  $$('[data-robot]').forEach((game) => {
    const rows = game.dataset.map.split('/');
    const size = rows.length;
    const board = $('.rb-board', game);
    const list = $('.rb-program', game);
    const status = $('[data-rb-status]', game);
    const DIRS = ['N', 'E', 'S', 'W'];
    const STEP = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
    const NAMES = { M: 'Maju 1 kotak', L: 'Belok kiri', R: 'Belok kanan' };
    const MAX_STEPS = 20;
    const walls = new Set();
    let start = { x: 0, y: 0 };
    let target = { x: 0, y: 0 };
    let pos;
    let timer = null;

    // Gambar papan
    board.style.setProperty('--n', size);
    rows.forEach((row, y) => [...row].forEach((ch, x) => {
      const cell = document.createElement('span');
      cell.className = 'rb-cell';
      if (ch === '#') { walls.add(`${x},${y}`); cell.classList.add('is-wall'); cell.innerHTML = '<i class="bi bi-tree-fill" aria-hidden="true"></i>'; }
      if (ch === 'T') { target = { x, y }; cell.classList.add('is-target'); cell.innerHTML = '<i class="bi bi-house-heart-fill" aria-hidden="true"></i>'; }
      if (ch === 'R') start = { x, y };
      board.appendChild(cell);
    }));
    const robot = document.createElement('span');
    robot.className = 'rb-robot';
    robot.setAttribute('aria-hidden', 'true');
    robot.innerHTML = '<span class="rb-bot"><i class="bi bi-robot"></i></span><span class="rb-face"><i class="bi bi-caret-up-fill"></i></span>';
    board.appendChild(robot);

    const place = () => {
      robot.style.setProperty('--x', pos.x);
      robot.style.setProperty('--y', pos.y);
      robot.style.setProperty('--rot', `${pos.rot}deg`);
    };
    const steps = () => $$('.rb-step', list);
    // Gulir daftar program agar langkah yang sedang dijalankan selalu terlihat
    const keepVisible = (li) => {
      const top = li.offsetTop;
      const bottom = top + li.offsetHeight;
      if (top < list.scrollTop) list.scrollTop = top - 8;
      else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight + 8;
    };
    const setBusy = (busy) => {
      $$('button, select', game).forEach((el) => {
        if (!el.matches('[data-rb-stop]')) el.disabled = busy;
      });
    };
    const stop = () => {
      clearInterval(timer);
      timer = null;
      setBusy(false);
    };
    const resetRobot = () => {
      stop();
      const d = game.dataset.dir || 'E';
      pos = { ...start, d, rot: DIRS.indexOf(d) * 90 };
      place();
      robot.classList.remove('is-crash', 'is-win');
      steps().forEach((li) => li.classList.remove('is-active', 'is-bug'));
    };
    const renumber = () => {
      steps().forEach((li, i) => {
        $('select', li).setAttribute('aria-label', `Perintah langkah ${i + 1}`);
        $('.rb-del', li).setAttribute('aria-label', `Hapus langkah ${i + 1}`);
      });
    };
    const addStep = (cmd) => {
      if (steps().length >= MAX_STEPS) {
        status.textContent = `Program paling banyak ${MAX_STEPS} langkah.`;
        return;
      }
      const li = document.createElement('li');
      li.className = 'rb-step';
      const options = Object.entries(NAMES).map(([k, t]) => `<option value="${k}"${k === cmd ? ' selected' : ''}>${t}</option>`).join('');
      li.innerHTML = `<select>${options}</select><button type="button" class="rb-del"><i class="bi bi-x-lg" aria-hidden="true"></i></button>`;
      list.appendChild(li);
      renumber();
    };
    const load = (program) => {
      list.innerHTML = '';
      program.split(',').filter(Boolean).forEach(addStep);
      resetRobot();
    };

    function run() {
      resetRobot();
      const all = steps();
      if (!all.length) {
        status.textContent = 'Programnya masih kosong. Tambahkan perintah dulu.';
        return;
      }
      setBusy(true);
      status.textContent = 'Robot sedang menjalankan program…';
      let i = 0;
      timer = setInterval(() => {
        all.forEach((li) => li.classList.remove('is-active'));
        if (i >= all.length) {
          stop();
          if (pos.x === target.x && pos.y === target.y) {
            robot.classList.add('is-win');
            status.textContent = `Berhasil! Paket sampai di rumah tujuan dengan ${all.length} langkah.`;
          } else {
            status.textContent = 'Program selesai, tetapi robot belum sampai di rumah tujuan. Telusuri lagi langkahmu.';
          }
          return;
        }
        const li = all[i];
        li.classList.add('is-active');
        keepVisible(li);
        const cmd = $('select', li).value;
        if (cmd === 'L') {
          pos.d = DIRS[(DIRS.indexOf(pos.d) + 3) % 4];
          pos.rot -= 90;
        } else if (cmd === 'R') {
          pos.d = DIRS[(DIRS.indexOf(pos.d) + 1) % 4];
          pos.rot += 90;
        } else {
          const nx = pos.x + STEP[pos.d][0];
          const ny = pos.y + STEP[pos.d][1];
          const outside = nx < 0 || ny < 0 || nx >= size || ny >= size;
          if (outside || walls.has(`${nx},${ny}`)) {
            li.classList.remove('is-active');
            li.classList.add('is-bug');
            robot.classList.add('is-crash');
            stop();
            status.textContent = `Bug di langkah ${i + 1}: robot ${outside ? 'keluar dari peta' : 'menabrak pohon'}. Telusuri langkah-langkah sebelumnya, lalu perbaiki.`;
            return;
          }
          pos.x = nx;
          pos.y = ny;
        }
        place();
        i += 1;
      }, motionOK ? 550 : 200);
    }

    game.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn || btn.disabled) return;
      if (btn.matches('[data-rb-add]')) { addStep(btn.dataset.rbAdd); resetRobot(); }
      else if (btn.matches('.rb-del')) { btn.closest('.rb-step').remove(); renumber(); resetRobot(); }
      else if (btn.matches('[data-rb-run]')) run();
      else if (btn.matches('[data-rb-reset]')) { resetRobot(); status.textContent = 'Robot kembali ke posisi awal.'; }
      else if (btn.matches('[data-rb-clear]')) { load(''); status.textContent = 'Program dikosongkan.'; }
      else if (btn.matches('[data-rb-load]')) {
        $$('[data-rb-load]', game).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        load(btn.dataset.rbLoad);
        status.textContent = btn.dataset.rbMessage || '';
      }
    });
    list.addEventListener('change', resetRobot);

    resetRobot();
  });

  /* ---------- 8. Tombol tampil/sembunyi (mis. sorot abstraksi) ---------- */
  $$('[data-toggle]').forEach((btn) => {
    const target = document.querySelector(btn.dataset.toggle);
    if (!target) return;
    const label = $('[data-toggle-label]', btn);
    btn.addEventListener('click', () => {
      const on = target.classList.toggle('is-on');
      btn.setAttribute('aria-pressed', String(on));
      if (label) label.textContent = on ? btn.dataset.labelOn : btn.dataset.labelOff;
    });
  });

  /* ---------- 9. Kartu tautan ke TP lain: <div data-tp-links="2.2,2.3"> ----------
     Judul dan status "tersedia/segera hadir" diambil dari data.js. */
  if (window.KKA) {
    $$('[data-tp-links]').forEach((box) => {
      box.innerHTML = box.dataset.tpLinks.split(',').map((kode) => window.KKA.find(kode.trim())).filter(Boolean).map((tp) => `
        <article class="mini-card recap-card" data-el="${tp.el}">
          <p class="recap-tp">TP ${tp.kode} · Kelas ${window.KKA.KELAS[tp.kelas]}${tp.ready ? '' : ' <em class="pager-soon">segera hadir</em>'}</p>
          <h4>${tp.judul}</h4>
          <a href="${tp.href}">${tp.ready ? 'Buka materi' : 'Lihat'} <i class="bi bi-arrow-right-short" aria-hidden="true"></i></a>
        </article>`).join('');
    });
  }

  /* Warna dari token CSS, agar gambar kanvas ikut tema terang/gelap */
  const cssVar = (name, el = root) => getComputedStyle(el).getPropertyValue(name).trim();
  const onThemeChange = (fn) => new MutationObserver(fn).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  const formatBytes = (n) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 })} KB`;
    return `${(n / 1024 / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 })} MB`;
  };

  /* ---------- 10. Lab teks: setiap huruf disimpan sebagai angka ---------- */
  $$('[data-lab-text]').forEach((lab) => {
    const input = $('input', lab);
    const list = $('.char-list', lab);
    const out = $('[data-lab-out]', lab);
    const encoder = new TextEncoder();
    const render = () => {
      const chars = [...input.value].slice(0, 16);
      list.innerHTML = chars.map((ch) => {
        const code = ch.codePointAt(0);
        const bin = code < 256 ? code.toString(2).padStart(8, '0') : '(lebih dari 8 bit)';
        const shown = ch === ' ' ? '␣' : ch;
        return `<li><b>${shown.replace(/</g, '&lt;')}</b><small>${code}</small><small>${bin}</small></li>`;
      }).join('');
      const bytes = encoder.encode(chars.join('')).length;
      out.textContent = chars.length
        ? `${chars.length} karakter disimpan sebagai ${bytes} byte (${bytes * 8} bit).`
        : 'Ketik sesuatu di kotak di atas.';
    };
    input.addEventListener('input', render);
    render();
  });

  /* ---------- 11. Lab gambar: gambar digital tersusun dari piksel ---------- */
  $$('[data-lab-image]').forEach((lab) => {
    const canvas = $('canvas', lab);
    const range = $('input[type="range"]', lab);
    const out = $('[data-lab-out]', lab);
    const W = 320;
    const H = 240;
    const STEPS = [8, 16, 32, 64, 128, 320];
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Pemandangan sekolah sederhana (dibuat sekali, ukuran penuh)
    const src = document.createElement('canvas');
    src.width = W;
    src.height = H;
    const s = src.getContext('2d');
    const sky = s.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#74c0fc');
    sky.addColorStop(1, '#d0ebff');
    s.fillStyle = sky; s.fillRect(0, 0, W, H);
    s.fillStyle = '#ffd43b'; s.beginPath(); s.arc(262, 52, 26, 0, Math.PI * 2); s.fill();
    s.fillStyle = '#69db7c'; s.beginPath(); s.ellipse(80, 250, 200, 90, 0, 0, Math.PI * 2); s.fill();
    s.fillStyle = '#40c057'; s.beginPath(); s.ellipse(280, 260, 170, 80, 0, 0, Math.PI * 2); s.fill();
    s.fillStyle = '#f8f9fa'; s.fillRect(110, 120, 120, 80);
    s.fillStyle = '#e03131'; s.beginPath(); s.moveTo(98, 122); s.lineTo(170, 78); s.lineTo(242, 122); s.closePath(); s.fill();
    s.fillStyle = '#1c7ed6'; s.fillRect(160, 160, 22, 40);
    s.fillStyle = '#a5d8ff'; s.fillRect(124, 140, 24, 20); s.fillRect(194, 140, 24, 20);
    s.fillStyle = '#868e96'; s.fillRect(56, 70, 4, 130);
    s.fillStyle = '#e03131'; s.fillRect(60, 72, 36, 12);
    s.fillStyle = '#ffffff'; s.fillRect(60, 84, 36, 12);
    s.fillStyle = '#2b8a3e'; s.beginPath(); s.arc(282, 150, 26, 0, Math.PI * 2); s.fill();
    s.fillStyle = '#8d5524'; s.fillRect(278, 170, 8, 32);

    const small = document.createElement('canvas');
    const render = () => {
      const w = STEPS[Number(range.value)];
      const h = Math.round(w * 0.75);
      small.width = w;
      small.height = h;
      const sc = small.getContext('2d');
      sc.imageSmoothingEnabled = true;
      sc.drawImage(src, 0, 0, w, h);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(small, 0, 0, w, h, 0, 0, W, H);
      out.textContent = `${w} × ${h} = ${(w * h).toLocaleString('id-ID')} piksel · ukuran tanpa dikompres ± ${formatBytes(w * h * 3)}`;
      range.setAttribute('aria-valuetext', `${w} kali ${h} piksel`);
    };
    range.addEventListener('input', render);
    render();
  });

  /* ---------- 12. Lab audio: suara digital tersusun dari sampel ---------- */
  $$('[data-lab-audio]').forEach((lab) => {
    const canvas = $('canvas', lab);
    const range = $('input[type="range"]', lab);
    const out = $('[data-lab-out]', lab);
    const playBtn = $('[data-lab-play]', lab);
    const STEPS = [4, 6, 8, 16, 32, 64];
    const W = 320;
    const H = 160;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    let audioCtx = null;

    const render = () => {
      const n = STEPS[Number(range.value)];
      const mid = H / 2;
      const amp = H * 0.38;
      const cycles = 2;
      const y = (x) => mid - Math.sin((x / W) * cycles * Math.PI * 2) * amp;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = cssVar('--border-strong');
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke();
      // Gelombang asli
      ctx.strokeStyle = cssVar('--muted');
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) { if (x === 0) ctx.moveTo(x, y(x)); else ctx.lineTo(x, y(x)); }
      ctx.stroke();
      ctx.setLineDash([]);
      // Hasil sampel (digital)
      const color = cssVar('--e4');
      const total = n * cycles;
      const step = W / total;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < total; i += 1) {
        const x0 = i * step;
        const yy = y(x0);
        if (i === 0) ctx.moveTo(x0, yy); else ctx.lineTo(x0, yy);
        ctx.lineTo(x0 + step, yy);
      }
      ctx.stroke();
      ctx.fillStyle = color;
      for (let i = 0; i < total; i += 1) { ctx.beginPath(); ctx.arc(i * step, y(i * step), 3, 0, Math.PI * 2); ctx.fill(); }
      out.textContent = `${n} sampel setiap gelombang · ${n <= 8 ? 'suara terdengar kasar' : n <= 16 ? 'suara cukup jelas' : 'suara halus, mirip aslinya'}`;
      range.setAttribute('aria-valuetext', `${n} sampel setiap gelombang`);
    };

    playBtn.addEventListener('click', () => {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { out.textContent = 'Peramban ini belum bisa memutar suara.'; return; }
      audioCtx = audioCtx || new AC();
      const n = STEPS[Number(range.value)];
      const type = n <= 8 ? 'square' : n <= 16 ? 'triangle' : 'sine';
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const t = audioCtx.currentTime + i * 0.35;
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.18, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.34);
      });
    });

    range.addEventListener('input', render);
    onThemeChange(render);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', render);
    render();
  });

  /* ---------- 13. Simulasi pesan berantai: konten digital cepat menyebar ---------- */
  $$('[data-spread]').forEach((box) => {
    const fan = Number(box.dataset.fanout) || 5;
    const MAX = 8;
    const roundEl = $('[data-spread-round]', box);
    const totalEl = $('[data-spread-total]', box);
    const list = $('.spread-rounds', box);
    const note = $('[data-spread-note]', box);
    const nextBtn = $('[data-spread-next]', box);
    let round = 0;
    let fresh = 1;
    let total = 1;
    const rows = [];

    const milestone = () => {
      if (total >= 100000) return `Lebih dari 100 ribu orang hanya dalam ${round} putaran! Bayangkan jika isinya hoaks.`;
      if (total >= 15000) return 'Sudah sebanyak penduduk beberapa desa!';
      if (total >= 600) return 'Sudah sebanyak seluruh warga satu sekolah!';
      if (total >= 32) return 'Sudah lebih banyak dari jumlah murid satu kelas!';
      return 'Pesan mulai menyebar…';
    };
    const render = () => {
      roundEl.textContent = String(round);
      totalEl.textContent = total.toLocaleString('id-ID');
      const max = Math.log10(Math.max(...rows.map((r) => r.n), 10));
      list.innerHTML = rows.map((r) => `
        <li><span>Putaran ${r.round}</span><span class="spread-bar" style="--w:${Math.max(3, (Math.log10(r.n) / max) * 100)}%"></span><b>+${r.n.toLocaleString('id-ID')}</b></li>`).join('');
      note.textContent = round ? milestone() : 'Kamu menerima satu pesan menarik. Tekan "Teruskan" untuk membagikannya.';
      nextBtn.disabled = round >= MAX;
    };
    nextBtn.addEventListener('click', () => {
      if (round >= MAX) return;
      round += 1;
      fresh *= fan;
      total += fresh;
      rows.push({ round, n: fresh });
      render();
    });
    $('[data-spread-reset]', box).addEventListener('click', () => {
      round = 0; fresh = 1; total = 1; rows.length = 0;
      render();
    });
    render();
  });

  /* =================== Alat digital pengembangan ide (TP 2.2) =================== */
  /* Penyimpanan otomatis di peramban perangkat ini (aman jika diblokir) */
  const store = {
    get(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; } },
  };
  const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const slug = (s) => String(s || 'tanpa-judul').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'tanpa-judul';
  const today = () => new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const downloadText = (filename, text) => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  // Tombol hapus perlu diklik dua kali agar hasil kerja tidak terhapus tanpa sengaja
  const confirmTwice = (btn, action) => {
    if (btn.dataset.armed) {
      delete btn.dataset.armed;
      btn.classList.remove('is-armed');
      clearTimeout(btn.armTimer);
      action();
      return;
    }
    btn.dataset.armed = '1';
    btn.classList.add('is-armed');
    const label = $('[data-label]', btn);
    const original = label ? label.textContent : '';
    if (label) label.textContent = 'Klik lagi untuk yakin';
    btn.armTimer = setTimeout(() => {
      delete btn.dataset.armed;
      btn.classList.remove('is-armed');
      if (label) label.textContent = original;
    }, 3000);
  };
  const copyText = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; } catch (err) {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      area.remove();
      return ok;
    }
  };

  /* ---------- 14. Papan ide digital (brainstorming) ---------- */
  $$('[data-ideaboard]').forEach((board) => {
    const KEY = board.dataset.store || 'kka-papan-ide';
    const list = $('.ib-notes', board);
    const form = $('[data-ib-form]', board);
    const input = $('input', form);
    const topic = $('[data-ib-topic]', board);
    const status = $('[data-ib-status]', board);
    const countEl = $('[data-ib-count]', board);
    const timeEl = $('[data-ib-time]', board);
    const startBtn = $('[data-ib-start]', board);
    const DURATION = (Number(board.dataset.minutes) || 5) * 60;
    let state = store.get(KEY) || { topic: '', ideas: [] };
    let left = DURATION;
    let timer = null;

    const save = () => {
      if (!store.set(KEY, state)) status.textContent = 'Ide tidak bisa disimpan otomatis di perangkat ini. Unduh hasilnya sebelum menutup halaman.';
    };
    const clock = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const render = () => {
      topic.value = state.topic || '';
      list.innerHTML = state.ideas.map((idea, i) => `
        <li class="ib-note" data-el="${idea.c || 1}">
          <p class="ib-text">${escapeHTML(idea.text)}</p>
          <div class="ib-note-foot">
            <button type="button" class="ib-vote" data-ib-vote="${i}" aria-label="Beri suara untuk ide: ${escapeHTML(idea.text)}. Suara saat ini ${idea.votes}"><i class="bi bi-star-fill" aria-hidden="true"></i> ${idea.votes}</button>
            <button type="button" class="ib-del" data-ib-del="${i}" aria-label="Hapus ide: ${escapeHTML(idea.text)}"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
          </div>
        </li>`).join('');
      countEl.textContent = String(state.ideas.length);
    };
    const setClock = () => {
      timeEl.textContent = clock(left);
      timeEl.classList.toggle('is-done', left === 0);
    };
    const stopTimer = () => {
      clearInterval(timer);
      timer = null;
      startBtn.innerHTML = `<i class="bi bi-play-fill" aria-hidden="true"></i> ${left === DURATION ? 'Mulai' : left === 0 ? 'Mulai lagi' : 'Lanjutkan'}`;
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      state.ideas.push({ text, votes: 0, c: (state.ideas.length % 4) + 1 });
      input.value = '';
      save();
      render();
      status.textContent = `Ide ke-${state.ideas.length} ditambahkan. Terus tulis, jangan dinilai dulu!`;
      input.focus();
    });
    topic.addEventListener('input', () => { state.topic = topic.value; save(); });
    board.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      if (btn.matches('[data-ib-vote]')) {
        state.ideas[Number(btn.dataset.ibVote)].votes += 1;
        save();
        render();
        const again = $(`[data-ib-vote="${btn.dataset.ibVote}"]`, board);
        if (again) again.focus();
      } else if (btn.matches('[data-ib-del]')) {
        state.ideas.splice(Number(btn.dataset.ibDel), 1);
        save();
        render();
        status.textContent = 'Ide dihapus.';
      } else if (btn.matches('[data-ib-sort]')) {
        state.ideas.sort((a, b) => b.votes - a.votes);
        save();
        render();
        status.textContent = 'Ide diurutkan dari suara terbanyak.';
      } else if (btn.matches('[data-ib-download]')) {
        const lines = ['PAPAN IDE · TP 2.2 Pengembangan Ide dan Cerita Sederhana', `Topik  : ${state.topic || '-'}`, `Tanggal: ${today()}`, `Jumlah : ${state.ideas.length} ide`, ''];
        state.ideas.forEach((idea, i) => lines.push(`${i + 1}. ${idea.text}  (suara: ${idea.votes})`));
        downloadText(`papan-ide-${slug(state.topic)}.txt`, lines.join('\n'));
      } else if (btn.matches('[data-ib-clear]')) {
        confirmTwice(btn, () => {
          state = { topic: '', ideas: [] };
          save();
          render();
          status.textContent = 'Papan ide dikosongkan.';
        });
      } else if (btn.matches('[data-ib-start]')) {
        if (timer) { stopTimer(); return; }
        if (left === 0) left = DURATION;
        setClock();
        startBtn.innerHTML = '<i class="bi bi-pause-fill" aria-hidden="true"></i> Jeda';
        status.textContent = 'Waktu brainstorming dimulai. Tulis ide sebanyak-banyaknya!';
        timer = setInterval(() => {
          left -= 1;
          setClock();
          if (left <= 0) {
            left = 0;
            stopTimer();
            setClock();
            status.textContent = `Waktu habis! Kamu mengumpulkan ${state.ideas.length} ide. Sekarang beri bintang pada ide terbaik.`;
          }
        }, 1000);
      } else if (btn.matches('[data-ib-reset]')) {
        clearInterval(timer);
        timer = null;
        left = DURATION;
        setClock();
        stopTimer();
      }
    });

    setClock();
    render();
  });

  /* ---------- 15. Pembuat storyboard digital ---------- */
  $$('[data-storyboard]').forEach((sb) => {
    const KEY = sb.dataset.store || 'kka-storyboard';
    const list = $('.sb-panels', sb);
    const status = $('[data-sb-status]', sb);
    const summary = $('[data-sb-summary]', sb);
    const metaEls = $$('[data-sb-meta]', sb);
    const MAX = 12;
    const INK = '#11152e';
    const blank = () => ({ visual: '', teks: '', suara: '', durasi: '', sketch: '' });
    const EXAMPLE = {
      judul: 'Satu Botol, Seribu Masalah',
      format: 'Video',
      audiens: 'Murid SMP kelas VII–IX',
      panels: [
        { visual: 'Halaman sekolah yang bersih di pagi hari. Murid berdatangan.', teks: 'Narasi: "Pagi yang cerah di sekolah kita."', suara: 'Musik ceria pelan', durasi: '6' },
        { visual: 'Dodi minum dari botol plastik, lalu melemparnya ke semak-semak.', teks: '(tanpa dialog)', suara: 'Bunyi botol jatuh', durasi: '8' },
        { visual: 'Setelah istirahat, sampah berserakan dan selokan tersumbat.', teks: 'Narasi: "Kalau semua berpikir \'cuma satu botol\'…"', suara: 'Musik berubah tegang', durasi: '10' },
        { visual: 'Hujan deras. Halaman sekolah tergenang air.', teks: 'Narasi: "…inilah akibatnya."', suara: 'Bunyi hujan', durasi: '10' },
        { visual: 'Dodi memungut botolnya dan membuangnya ke tempat sampah. Teman-teman ikut memungut sampah.', teks: 'Dodi: "Ayo mulai dari kita!"', suara: 'Musik ceria kembali', durasi: '14' },
        { visual: 'Tulisan besar di layar: "Buang sampah pada tempatnya" dan nama kelas pembuat.', teks: 'Ajakan: "Sekolah bersih, kita sehat!"', suara: 'Musik penutup', durasi: '12' },
      ].map((p) => ({ ...p, sketch: '' })),
    };
    const loaded = store.get(KEY);
    let state = loaded && Array.isArray(loaded.panels) && loaded.panels.length
      ? loaded
      : { judul: '', format: 'Video', audiens: '', panels: [blank(), blank(), blank(), blank()] };
    let saveTimer = null;

    const save = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        if (!store.set(KEY, state)) status.textContent = 'Storyboard tidak bisa disimpan otomatis (memori peramban penuh atau diblokir). Unduh atau cetak hasilnya sebelum menutup halaman.';
      }, 300);
    };
    const hasContent = () => state.judul || state.audiens || state.panels.some((p) => p.visual || p.teks || p.suara || p.durasi || p.sketch);
    const grow = (el) => { el.style.height = 'auto'; el.style.height = `${el.scrollHeight + 2}px`; };
    const updateSummary = () => {
      const total = state.panels.reduce((sum, p) => sum + (Number(p.durasi) || 0), 0);
      summary.innerHTML = `<span><i class="bi bi-film" aria-hidden="true"></i> ${state.panels.length} adegan</span><span><i class="bi bi-stopwatch" aria-hidden="true"></i> total ${total} detik</span>`;
    };

    const panelHTML = (p, i) => `
      <li class="sb-panel" data-i="${i}">
        <div class="sb-panel-head">
          <b>Adegan ${i + 1}</b>
          <span class="sb-tools">
            <button type="button" data-sb-left aria-label="Geser adegan ${i + 1} ke depan"${i === 0 ? ' disabled' : ''}><i class="bi bi-arrow-left" aria-hidden="true"></i></button>
            <button type="button" data-sb-right aria-label="Geser adegan ${i + 1} ke belakang"${i === state.panels.length - 1 ? ' disabled' : ''}><i class="bi bi-arrow-right" aria-hidden="true"></i></button>
            <button type="button" data-sb-del aria-label="Hapus adegan ${i + 1}"${state.panels.length === 1 ? ' disabled' : ''}><i class="bi bi-trash3" aria-hidden="true"></i></button>
          </span>
        </div>
        <div class="sb-sketch">
          <canvas class="sb-canvas" width="480" height="300" role="img" aria-label="Kotak sketsa adegan ${i + 1}. Gambar dengan jari atau tetikus."></canvas>
          <button type="button" class="sb-clear" data-sb-clear-sketch>Hapus sketsa</button>
        </div>
        <label class="tool-field"><span>Visual: apa yang terlihat?</span><textarea data-f="visual" rows="2">${escapeHTML(p.visual)}</textarea></label>
        <label class="tool-field"><span>Teks, narasi, atau dialog</span><textarea data-f="teks" rows="2">${escapeHTML(p.teks)}</textarea></label>
        <div class="sb-row">
          <label class="tool-field"><span>Suara/musik</span><input type="text" data-f="suara" value="${escapeHTML(p.suara)}"></label>
          <label class="tool-field sb-dur"><span>Durasi (detik)</span><input type="number" min="0" max="600" inputmode="numeric" data-f="durasi" value="${escapeHTML(p.durasi)}"></label>
        </div>
      </li>`;

    const setupCanvas = (li) => {
      const i = Number(li.dataset.i);
      const canvas = $('canvas', li);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (state.panels[i].sketch) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = state.panels[i].sketch;
      }
      let drawing = false;
      let last = null;
      const point = (e) => {
        const r = canvas.getBoundingClientRect();
        return { x: ((e.clientX - r.left) * canvas.width) / r.width, y: ((e.clientY - r.top) * canvas.height) / r.height };
      };
      canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        drawing = true;
        last = point(e);
        canvas.setPointerCapture(e.pointerId);
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(last.x, last.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
      canvas.addEventListener('pointermove', (e) => {
        if (!drawing) return;
        const p = point(e);
        ctx.strokeStyle = INK;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        last = p;
      });
      const end = () => {
        if (!drawing) return;
        drawing = false;
        state.panels[i].sketch = canvas.toDataURL('image/png');
        save();
      };
      canvas.addEventListener('pointerup', end);
      canvas.addEventListener('pointercancel', end);
    };

    const render = () => {
      metaEls.forEach((el) => { el.value = state[el.dataset.sbMeta] || ''; });
      list.innerHTML = state.panels.map(panelHTML).join('');
      $$('.sb-panel', list).forEach(setupCanvas);
      $$('textarea', list).forEach(grow);
      $('[data-sb-add]', sb).disabled = state.panels.length >= MAX;
      updateSummary();
    };

    sb.addEventListener('input', (e) => {
      const el = e.target;
      if (el.dataset.sbMeta) {
        state[el.dataset.sbMeta] = el.value;
      } else if (el.dataset.f) {
        const li = el.closest('.sb-panel');
        state.panels[Number(li.dataset.i)][el.dataset.f] = el.value;
        if (el.tagName === 'TEXTAREA') grow(el);
        if (el.dataset.f === 'durasi') updateSummary();
      } else {
        return;
      }
      save();
    });

    sb.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn || btn.disabled) return;
      const li = btn.closest('.sb-panel');
      const i = li ? Number(li.dataset.i) : -1;
      const swap = (a, b) => { [state.panels[a], state.panels[b]] = [state.panels[b], state.panels[a]]; save(); render(); };

      if (btn.matches('[data-sb-left]')) swap(i, i - 1);
      else if (btn.matches('[data-sb-right]')) swap(i, i + 1);
      else if (btn.matches('[data-sb-del]')) {
        confirmTwice(btn, () => {
          state.panels.splice(i, 1);
          save();
          render();
          status.textContent = `Adegan ${i + 1} dihapus.`;
        });
      } else if (btn.matches('[data-sb-clear-sketch]')) {
        state.panels[i].sketch = '';
        save();
        render();
      } else if (btn.matches('[data-sb-add]')) {
        state.panels.push(blank());
        save();
        render();
        const added = $$('.sb-panel', list).pop();
        $('textarea', added).focus();
        status.textContent = `Adegan ${state.panels.length} ditambahkan.`;
      } else if (btn.matches('[data-sb-example]')) {
        const load = () => {
          state = JSON.parse(JSON.stringify(EXAMPLE));
          save();
          render();
          status.textContent = 'Contoh storyboard dimuat. Ganti isinya dengan ide kelompokmu!';
        };
        if (hasContent()) confirmTwice(btn, load); else load();
      } else if (btn.matches('[data-sb-download]')) {
        const total = state.panels.reduce((sum, p) => sum + (Number(p.durasi) || 0), 0);
        const lines = [
          'STORYBOARD · TP 2.2 Pengembangan Ide dan Cerita Sederhana',
          `Judul   : ${state.judul || '-'}`,
          `Format  : ${state.format || '-'}`,
          `Penonton: ${state.audiens || '-'}`,
          `Tanggal : ${today()}`,
          `Jumlah  : ${state.panels.length} adegan, total ${total} detik`,
          '',
        ];
        state.panels.forEach((p, n) => {
          lines.push(`--- Adegan ${n + 1} ---`, `Visual : ${p.visual || '-'}`, `Teks   : ${p.teks || '-'}`, `Suara  : ${p.suara || '-'}`, `Durasi : ${p.durasi || '-'} detik`, '');
        });
        lines.push('Catatan: sketsa tidak ikut dalam file teks. Gunakan tombol Cetak, lalu pilih "Simpan sebagai PDF" untuk menyimpan sketsa.');
        downloadText(`storyboard-${slug(state.judul)}.txt`, lines.join('\n'));
      } else if (btn.matches('[data-sb-clear]')) {
        confirmTwice(btn, () => {
          state = { judul: '', format: 'Video', audiens: '', panels: [blank(), blank(), blank(), blank()] };
          save();
          render();
          status.textContent = 'Storyboard dikosongkan.';
        });
      }
    });

    render();
  });

  /* ---------- 16. Perakit pesan digital (struktur pesan + 5W1H) ---------- */
  $$('[data-msg-builder]').forEach((mb) => {
    const KEY = mb.dataset.store || 'kka-pesan';
    const fields = $$('[data-m]', mb);
    const emojiBox = $('[data-m-emoji]', mb);
    const bubble = $('[data-m-bubble]', mb);
    const timeEl = $('[data-m-time]', mb);
    const countEl = $('[data-m-count]', mb);
    const levelEl = $('[data-m-level]', mb);
    const checksEl = $('[data-m-checks]', mb);
    const warnEl = $('[data-m-warn]', mb);
    const status = $('[data-m-status]', mb);
    const CHECKS = [['apa', 'Apa'], ['siapa', 'Siapa'], ['kapan', 'Kapan'], ['dimana', 'Di mana'], ['mengapa', 'Mengapa'], ['ajakan', 'Bagaimana']];
    const EXAMPLE = {
      sapaan: 'Selamat pagi, warga RT 03',
      judul: 'Kerja Bakti Bersihkan Selokan',
      apa: 'Mari bersihkan selokan bersama.',
      siapa: 'Seluruh warga',
      kapan: 'Minggu, 07.00–09.00',
      dimana: 'Pos ronda',
      mengapa: 'Agar jalan tidak tergenang saat hujan',
      ajakan: 'Bawa sapu lidi atau cangkul, ya!',
      pengirim: 'Pak RT 03',
    };

    const saved = store.get(KEY);
    if (saved && saved.values) {
      fields.forEach((f) => { f.value = saved.values[f.dataset.m] || ''; });
      emojiBox.checked = saved.emoji !== false;
    }
    const values = () => Object.fromEntries(fields.map((f) => [f.dataset.m, f.value.trim()]));
    const build = (v, useEmoji) => {
      const label = (icon, text) => (useEmoji ? `${icon} ${text}` : text);
      const lines = [];
      if (v.sapaan) lines.push(v.sapaan, '');
      if (v.judul) lines.push(`*${v.judul}*`, '');
      if (v.apa) lines.push(v.apa);
      if (v.siapa) lines.push(`${label('👥', 'Untuk')}: ${v.siapa}`);
      if (v.kapan) lines.push(`${label('🗓️', 'Kapan')}: ${v.kapan}`);
      if (v.dimana) lines.push(`${label('📍', 'Di mana')}: ${v.dimana}`);
      if (v.mengapa) lines.push(`${label('💡', 'Mengapa')}: ${v.mengapa}`);
      if (v.ajakan) lines.push('', v.ajakan);
      if (v.pengirim) lines.push('', 'Salam,', v.pengirim);
      return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    };
    const isShouting = (s) => {
      const letters = s.replace(/[^A-Za-z]/g, '');
      return letters.length >= 8 && letters.replace(/[^A-Z]/g, '').length / letters.length > 0.8;
    };

    const render = () => {
      const v = values();
      const text = build(v, emojiBox.checked);
      bubble.innerHTML = text
        ? escapeHTML(text).replace(/\*(.+?)\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')
        : '<span class="mb-placeholder">Pratinjau pesanmu akan muncul di sini. Isi kolom di samping, atau tekan "Muat contoh".</span>';
      timeEl.textContent = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const words = (text.replace(/\*/g, '').match(/[\p{L}\p{N}][\p{L}\p{N}'’.,-]*/gu) || []).length;
      countEl.textContent = String(words);
      const level = words === 0 ? ['', ''] : words <= 50 ? ['is-ok', 'Singkat dan pas'] : words <= 80 ? ['is-warn', 'Agak panjang, coba pangkas'] : ['is-bad', 'Terlalu panjang'];
      levelEl.className = `mb-level ${level[0]}`;
      levelEl.textContent = level[1];
      checksEl.innerHTML = CHECKS.map(([key, name]) => {
        const done = Boolean(v[key]);
        return `<li class="${done ? 'is-done' : ''}"><i class="bi ${done ? 'bi-check-circle-fill' : 'bi-circle'}" aria-hidden="true"></i> ${name}<span class="sr-only">${done ? ' sudah ada' : ' belum ada'}</span></li>`;
      }).join('');
      const warnings = [];
      if (Object.values(v).some(isShouting)) warnings.push('Hindari menulis dengan huruf kapital semua. Pesan seperti itu terkesan berteriak.');
      if (text && !v.pengirim) warnings.push('Cantumkan nama pengirim agar penerima tahu sumber pesannya. Ingat: saring sebelum sharing!');
      warnEl.innerHTML = warnings.map((w) => `<span><i class="bi bi-exclamation-triangle" aria-hidden="true"></i> ${w}</span>`).join('');
      warnEl.hidden = warnings.length === 0;
      store.set(KEY, { values: v, emoji: emojiBox.checked });
    };

    mb.addEventListener('input', render);
    mb.addEventListener('change', render);
    mb.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      if (btn.matches('[data-m-example]')) {
        const fill = () => {
          fields.forEach((f) => { f.value = EXAMPLE[f.dataset.m] || ''; });
          render();
          status.textContent = 'Contoh pesan dimuat. Ubah isinya sesuai pesanmu sendiri.';
        };
        if (Object.values(values()).some(Boolean)) confirmTwice(btn, fill); else fill();
      } else if (btn.matches('[data-m-clear]')) {
        confirmTwice(btn, () => {
          fields.forEach((f) => { f.value = ''; });
          render();
          status.textContent = 'Semua kolom dikosongkan.';
        });
      } else if (btn.matches('[data-m-copy]')) {
        const text = build(values(), emojiBox.checked);
        if (!text) { status.textContent = 'Pesannya masih kosong.'; return; }
        status.textContent = (await copyText(text))
          ? 'Pesan tersalin! Tempelkan di aplikasi pesan atau catatanmu.'
          : 'Gagal menyalin. Pilih teks di pratinjau, lalu salin secara manual.';
      }
    });

    render();
  });

  /* ---------- 17. Tab (mis. langkah per aplikasi) ----------
     <div data-tabs> berisi tombol role="tab" aria-controls="id-panel" */
  $$('[data-tabs]').forEach((tabs) => {
    const btns = $$('[role="tab"]', tabs);
    const panels = btns.map((b) => document.getElementById(b.getAttribute('aria-controls')));
    const select = (i, focus) => {
      btns.forEach((b, j) => {
        const on = i === j;
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
        if (panels[j]) panels[j].hidden = !on;
      });
      if (focus) btns[i].focus();
    };
    btns.forEach((b, i) => {
      b.addEventListener('click', () => select(i));
      b.addEventListener('keydown', (e) => {
        const keys = { ArrowRight: (i + 1) % btns.length, ArrowLeft: (i - 1 + btns.length) % btns.length, Home: 0, End: btns.length - 1 };
        if (e.key in keys) { e.preventDefault(); select(keys[e.key], true); }
      });
    });
    select(0);
  });

  /* ---------- 18. Lab desain slide: keterbacaan langsung dinilai ---------- */
  const luminance = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  $$('[data-design-lab]').forEach((lab) => {
    const THEMES = [
      { name: 'Putih di atas biru dongker', bg: '#1a3668', fg: '#ffffff', accent: '#ffd43b' },
      { name: 'Hitam di atas krem', bg: '#fff8e7', fg: '#212529', accent: '#e8590c' },
      { name: 'Putih di atas oranye', bg: '#e8590c', fg: '#ffffff', accent: '#1a3668' },
      { name: 'Kuning di atas putih', bg: '#ffffff', fg: '#fcc419', accent: '#fab005' },
      { name: 'Merah di atas hijau', bg: '#2f9e44', fg: '#e03131', accent: '#ffffff' },
    ];
    const FONTS = {
      sans: { css: '"Plus Jakarta Sans", Arial, sans-serif', label: 'Sans-serif' },
      serif: { css: 'Georgia, "Times New Roman", serif', label: 'Serif' },
      deco: { css: '"Comic Sans MS", "Segoe Print", "Segoe Script", cursive', label: 'Dekoratif' },
    };
    const slide = $('.dl-slide', lab);
    const body = $('.dl-body', lab);
    const sizeIn = $('[data-dl-size]', lab);
    const sizeOut = $('[data-dl-size-out]', lab);
    const fontIn = $('[data-dl-font]', lab);
    const imgIn = $('[data-dl-image]', lab);
    const feedback = $('[data-dl-feedback]', lab);
    const scoreEl = $('[data-dl-score]', lab);
    const SHORT = '<ul><li>Bawa botol minum sendiri</li><li>Buang sampah pada tempatnya</li><li>Pilah sampah plastik</li></ul>';
    const LONG = '<p>Sampah plastik adalah masalah besar di sekolah kita karena setiap hari banyak murid membeli minuman dan jajanan yang dibungkus plastik, lalu bungkusnya dibuang sembarangan sehingga selokan tersumbat dan halaman menjadi kotor, padahal kita bisa membawa botol minum sendiri, membuang sampah pada tempatnya, dan memilah sampah plastik agar bisa didaur ulang oleh bank sampah.</p>';

    const themeBox = $('[data-dl-themes]', lab);
    themeBox.innerHTML = THEMES.map((t, i) => `
      <label class="dl-swatch" title="${t.name}">
        <input type="radio" name="dl-theme-${lab.id || 'x'}" value="${i}"${i === 0 ? ' checked' : ''}>
        <span style="background:${t.bg};color:${t.fg}">Aa</span>
        <small>${t.name}</small>
      </label>`).join('');

    const level = (cls, icon, text) => `<li class="${cls}"><i class="bi ${icon}" aria-hidden="true"></i> ${text}</li>`;
    const render = () => {
      const theme = THEMES[Number($('input[type="radio"][name^="dl-theme"]:checked', lab).value)];
      const pt = Number(sizeIn.value);
      const long = $('input[name^="dl-text"]:checked', lab).value === 'long';
      const font = FONTS[fontIn.value];
      const scale = slide.clientWidth / 720;
      slide.style.setProperty('--dl-bg', theme.bg);
      slide.style.setProperty('--dl-fg', theme.fg);
      slide.style.setProperty('--dl-accent', theme.accent);
      slide.style.setProperty('--dl-font', font.css);
      slide.style.setProperty('--dl-body', `${pt * scale}px`);
      slide.style.setProperty('--dl-title', `${40 * scale}px`);
      slide.classList.toggle('has-image', imgIn.checked);
      body.innerHTML = long ? LONG : SHORT;
      sizeOut.textContent = `${pt} pt`;

      const ratio = contrast(theme.fg, theme.bg);
      const items = [];
      let good = 0;
      if (ratio >= 4.5) { good += 1; items.push(level('is-ok', 'bi-check-circle-fill', `Kontras warna ${ratio.toFixed(1)} : 1. Teks jelas terbaca.`)); }
      else if (ratio >= 3) items.push(level('is-warn', 'bi-exclamation-circle-fill', `Kontras warna ${ratio.toFixed(1)} : 1. Cukup untuk judul besar, tetapi kurang jelas untuk teks isi.`));
      else items.push(level('is-bad', 'bi-x-circle-fill', `Kontras warna hanya ${ratio.toFixed(1)} : 1. Teks sulit dibaca. Pilih warna yang lebih berbeda terang-gelapnya.`));
      if (pt >= 24) { good += 1; items.push(level('is-ok', 'bi-check-circle-fill', `Ukuran huruf ${pt} pt terbaca dari belakang kelas.`)); }
      else if (pt >= 18) items.push(level('is-warn', 'bi-exclamation-circle-fill', `Ukuran huruf ${pt} pt agak kecil. Usahakan minimal 24 pt.`));
      else items.push(level('is-bad', 'bi-x-circle-fill', `Ukuran huruf ${pt} pt terlalu kecil untuk ditayangkan.`));
      if (!long) { good += 1; items.push(level('is-ok', 'bi-check-circle-fill', 'Teks ringkas berupa poin singkat.')); }
      else items.push(level('is-bad', 'bi-x-circle-fill', 'Terlalu banyak teks. Ubah menjadi poin-poin singkat (ingat aturan 6×6).'));
      if (fontIn.value === 'sans') { good += 1; items.push(level('is-ok', 'bi-check-circle-fill', 'Huruf sans-serif mudah dibaca di layar.')); }
      else if (fontIn.value === 'serif') items.push(level('is-warn', 'bi-exclamation-circle-fill', 'Huruf serif masih bisa dipakai, tetapi sans-serif lebih jelas di layar proyektor.'));
      else items.push(level('is-bad', 'bi-x-circle-fill', 'Huruf dekoratif sulit dibaca untuk teks isi. Pakai untuk hiasan judul saja.'));
      if (imgIn.checked) { good += 1; items.push(level('is-ok', 'bi-check-circle-fill', 'Gambar yang relevan membantu penonton memahami pesan.')); }
      else items.push(level('is-warn', 'bi-exclamation-circle-fill', 'Tambahkan satu gambar atau ikon yang relevan agar slide lebih menarik.'));

      feedback.innerHTML = items.join('');
      scoreEl.textContent = `${good} / 5`;
      scoreEl.className = `dl-score ${good === 5 ? 'is-ok' : good >= 3 ? 'is-warn' : 'is-bad'}`;
    };

    lab.addEventListener('input', render);
    lab.addEventListener('change', render);
    if ('ResizeObserver' in window) new ResizeObserver(render).observe(slide);
    render();
  });

  /* ---------- 19. Tes 3 detik: poster mana yang lebih mudah diingat? ---------- */
  $$('[data-glance]').forEach((box) => {
    const items = $$('[data-glance-item]', box);
    const status = $('[data-glance-status]', box);
    const startBtn = $('[data-glance-start]', box);
    const showBtn = $('[data-glance-show]', box);
    const SECONDS = Number(box.dataset.seconds) || 3;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const cover = (on) => items.forEach((it) => it.classList.toggle('is-covered', on));
    cover(true);

    startBtn.addEventListener('click', async () => {
      startBtn.disabled = true;
      showBtn.hidden = true;
      cover(true);
      for (const item of items) {
        const name = item.dataset.glanceItem;
        status.textContent = `Bersiap melihat ${name}…`;
        await wait(1200);
        item.classList.remove('is-covered');
        for (let s = SECONDS; s > 0; s -= 1) {
          status.textContent = `Lihat ${name}: ${s}…`;
          await wait(1000);
        }
        item.classList.add('is-covered');
      }
      status.textContent = 'Selesai! Tanpa melihat lagi, coba sebutkan judul, tanggal, dan tempat acara dari setiap poster. Poster mana yang lebih kamu ingat?';
      startBtn.disabled = false;
      startBtn.innerHTML = '<i class="bi bi-arrow-repeat" aria-hidden="true"></i> Ulangi tes';
      showBtn.hidden = false;
    });
    showBtn.addEventListener('click', () => {
      cover(false);
      showBtn.hidden = true;
      status.textContent = 'Bandingkan kedua poster. Apa yang membuat salah satunya lebih mudah diingat?';
    });
  });

  /* ---------- 20. Perbaiki poster: setiap centang menerapkan satu prinsip ---------- */
  $$('[data-fixer]').forEach((fixer) => {
    const poster = $('[data-poster]', fixer);
    const boxes = $$('input[data-fix]', fixer);
    const scoreEl = $('[data-fixer-score]', fixer);
    const msg = $('[data-fixer-msg]', fixer);
    const render = () => {
      let n = 0;
      boxes.forEach((b) => {
        poster.classList.toggle(`fix-${b.dataset.fix}`, b.checked);
        if (b.checked) n += 1;
      });
      scoreEl.textContent = `${n} / ${boxes.length}`;
      scoreEl.className = `dl-score ${n === boxes.length ? 'is-ok' : n >= 4 ? 'is-warn' : 'is-bad'}`;
      msg.textContent = n === boxes.length
        ? 'Hebat! Semua prinsip diterapkan. Bandingkan dengan poster awal: jauh lebih mudah dibaca, bukan?'
        : n === 0
          ? 'Poster ini sulit dibaca. Centang perbaikan satu per satu dan perhatikan perubahannya.'
          : `${boxes.length - n} prinsip lagi. Perbaikan mana yang paling besar pengaruhnya menurutmu?`;
    };
    fixer.addEventListener('change', render);
    $('[data-fixer-reset]', fixer)?.addEventListener('click', () => { boxes.forEach((b) => { b.checked = false; }); render(); });
    $('[data-fixer-all]', fixer)?.addEventListener('click', () => { boxes.forEach((b) => { b.checked = true; }); render(); });
    render();
  });

  /* ---------- 21. Pemeriksa kontras warna (standar WCAG) ---------- */
  $$('[data-contrast-checker]').forEach((cc) => {
    const fg = $('[data-cc-fg]', cc);
    const bg = $('[data-cc-bg]', cc);
    const preview = $('.cc-preview', cc);
    const ratioEl = $('[data-cc-ratio]', cc);
    const normalEl = $('[data-cc-normal]', cc);
    const largeEl = $('[data-cc-large]', cc);
    const noteEl = $('[data-cc-note]', cc);
    const badge = (el, ok, label) => {
      el.className = `cc-badge ${ok ? 'is-ok' : 'is-bad'}`;
      el.innerHTML = `<i class="bi ${ok ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}" aria-hidden="true"></i> ${label}: ${ok ? 'lolos' : 'belum lolos'}`;
    };
    const render = () => {
      preview.style.color = fg.value;
      preview.style.background = bg.value;
      $('[data-cc-fg-code]', cc).textContent = fg.value.toUpperCase();
      $('[data-cc-bg-code]', cc).textContent = bg.value.toUpperCase();
      const ratio = contrast(fg.value, bg.value);
      ratioEl.textContent = `${ratio.toFixed(1).replace('.', ',')} : 1`;
      badge(normalEl, ratio >= 4.5, 'Teks biasa (minimal 4,5 : 1)');
      badge(largeEl, ratio >= 3, 'Teks besar/judul (minimal 3 : 1)');
      noteEl.textContent = ratio >= 7
        ? 'Sangat baik! Nyaman dibaca, bahkan untuk teks panjang dan di proyektor.'
        : ratio >= 4.5
          ? 'Baik. Teks biasa dan judul sama-sama mudah dibaca.'
          : ratio >= 3
            ? 'Hanya aman untuk judul besar. Untuk teks biasa, pilih warna yang lebih berbeda terang-gelapnya.'
            : 'Terlalu mirip terang-gelapnya. Teks akan sulit dibaca, apalagi di proyektor atau di bawah sinar matahari.';
    };
    cc.addEventListener('input', render);
    cc.addEventListener('click', (e) => {
      const preset = e.target.closest('[data-cc-preset]');
      if (preset) {
        const [f, b] = preset.dataset.ccPreset.split(',');
        fg.value = f;
        bg.value = b;
        render();
      } else if (e.target.closest('[data-cc-swap]')) {
        [fg.value, bg.value] = [bg.value, fg.value];
        render();
      }
    });
    render();
  });

  /* ---------- 22. Lab tipografi: keterbacaan paragraf ---------- */
  $$('[data-type-lab]').forEach((lab) => {
    const sample = $('.tl-sample', lab);
    const get = (name) => $(`[data-tl="${name}"]`, lab);
    const FONTS = {
      sans: '"Plus Jakarta Sans", Arial, sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
      mono: '"JetBrains Mono", Consolas, monospace',
      deco: '"Comic Sans MS", "Segoe Print", cursive',
    };
    const feedback = $('[data-tl-feedback]', lab);
    const scoreEl = $('[data-tl-score]', lab);
    const row = (cls, text) => `<li class="${cls}"><i class="bi ${cls === 'is-ok' ? 'bi-check-circle-fill' : cls === 'is-warn' ? 'bi-exclamation-circle-fill' : 'bi-x-circle-fill'}" aria-hidden="true"></i> ${text}</li>`;
    const render = () => {
      const size = Number(get('size').value);
      const lh = Number(get('leading').value);
      const width = Number(get('width').value);
      const align = get('align').value;
      const caps = get('caps').checked;
      const font = get('font').value;
      sample.style.setProperty('--tl-size', `${size}px`);
      sample.style.setProperty('--tl-leading', lh);
      sample.style.setProperty('--tl-width', `${width}ch`);
      sample.style.setProperty('--tl-align', align);
      sample.style.setProperty('--tl-font', FONTS[font]);
      sample.classList.toggle('is-caps', caps);
      $('[data-tl-out="size"]', lab).textContent = `${size} px`;
      $('[data-tl-out="leading"]', lab).textContent = lh.toFixed(1).replace('.', ',');
      $('[data-tl-out="width"]', lab).textContent = `± ${width} karakter`;

      const out = [];
      let good = 0;
      const judge = (cls, text) => { if (cls === 'is-ok') good += 1; out.push(row(cls, text)); };
      judge(size >= 16 ? 'is-ok' : size >= 14 ? 'is-warn' : 'is-bad',
        size >= 16 ? `Ukuran ${size} px nyaman dibaca di layar.` : size >= 14 ? `Ukuran ${size} px agak kecil untuk paragraf.` : `Ukuran ${size} px terlalu kecil dan melelahkan mata.`);
      judge(lh >= 1.4 && lh <= 1.8 ? 'is-ok' : lh >= 1.2 && lh <= 2 ? 'is-warn' : 'is-bad',
        lh < 1.2 ? 'Jarak antarbaris terlalu rapat sehingga baris saling berdesakan.' : lh < 1.4 ? 'Jarak antarbaris agak rapat. Coba 1,4–1,8.' : lh <= 1.8 ? 'Jarak antarbaris lega dan nyaman.' : 'Jarak antarbaris terlalu renggang sehingga paragraf terasa terpisah-pisah.');
      judge(width >= 45 && width <= 75 ? 'is-ok' : width >= 35 && width <= 90 ? 'is-warn' : 'is-bad',
        width < 35 ? 'Baris terlalu pendek, mata harus sering berpindah baris.' : width < 45 ? 'Baris agak pendek. Panjang ideal sekitar 45–75 karakter.' : width <= 75 ? 'Panjang baris ideal (45–75 karakter).' : width <= 90 ? 'Baris agak panjang, mata mudah kehilangan awal baris berikutnya.' : 'Baris terlalu panjang dan melelahkan.');
      judge(align === 'left' ? 'is-ok' : align === 'justify' ? 'is-warn' : 'is-bad',
        align === 'left' ? 'Rata kiri paling mudah diikuti mata.' : align === 'justify' ? 'Rata kanan-kiri bisa memunculkan celah lebar antarkata.' : 'Rata tengah menyulitkan membaca paragraf. Pakai untuk judul pendek saja.');
      judge(caps ? 'is-bad' : 'is-ok', caps ? 'HURUF KAPITAL SEMUA sulit dibaca untuk teks panjang dan terkesan berteriak.' : 'Huruf besar-kecil yang biasa mudah dikenali bentuk katanya.');
      judge(font === 'sans' || font === 'serif' ? 'is-ok' : font === 'mono' ? 'is-warn' : 'is-bad',
        font === 'sans' ? 'Huruf sans-serif jelas di layar.' : font === 'serif' ? 'Huruf serif nyaman untuk teks panjang, terutama di kertas.' : font === 'mono' ? 'Huruf monospace biasa dipakai untuk kode, kurang cocok untuk paragraf.' : 'Huruf dekoratif sulit dibaca untuk paragraf.');
      feedback.innerHTML = out.join('');
      scoreEl.textContent = `${good} / 6`;
      scoreEl.className = `dl-score ${good === 6 ? 'is-ok' : good >= 4 ? 'is-warn' : 'is-bad'}`;
    };
    lab.addEventListener('input', render);
    lab.addEventListener('change', render);
    render();
  });

  /* ---------- 23. Lembar kerja mini: sel, formula, dan fungsi dasar ----------
     <div data-sheet> berisi <script type="application/json" data-sheet-data>:
     {"cols":4,"rows":7,"widths":[130,90],"head":true,"cells":{"A1":"Menu"},
      "tasks":[{"cell":"D2","text":"…","expect":280000,"fn":"SUM","hint":"=B2*C2"}]}
     Formula diawali "=", mendukung + - * / ^, kurung, alamat sel, rentang (A1:A5),
     serta SUM/JUMLAH, AVERAGE/RATA-RATA, MAX/MAKS, MIN, COUNT/CACAH. */
  const numID = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
  $$('[data-sheet]').forEach((box) => {
    let cfg;
    try { cfg = JSON.parse($('[data-sheet-data]', box).textContent); } catch (e) { return; }
    const COLS = cfg.cols || 4;
    const ROWS = cfg.rows || 7;
    const tasks = cfg.tasks || [];
    const mount = $('[data-sheet-mount]', box);
    const status = $('[data-sheet-status]', box);
    const scoreEl = $('[data-sheet-score]', box);
    const taskList = $('[data-sheet-tasks]', box);
    const colName = (i) => String.fromCharCode(65 + i);
    const addrOf = (c, r) => `${colName(c)}${r}`;
    const posOf = (a) => {
      const m = /^([A-Z]{1,2})(\d+)$/.exec(a);
      if (!m) return null;
      const c = m[1].length === 1 ? m[1].charCodeAt(0) - 65 : (m[1].charCodeAt(0) - 64) * 26 + m[1].charCodeAt(1) - 65;
      return { c, r: Number(m[2]) };
    };
    const inGrid = (p) => p && p.c >= 0 && p.c < COLS && p.r >= 1 && p.r <= ROWS;
    let raw = { ...cfg.cells };
    let sel = tasks[0] ? tasks[0].cell : 'A1';

    /* --- Membaca isi sel: angka gaya Indonesia (280.000 atau 2,5) dikenali sebagai angka --- */
    const literal = (src) => {
      const s = String(src).trim();
      if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g, ''));
      if (/^-?\d+(,\d+)?$/.test(s)) return Number(s.replace(',', '.'));
      if (/^-?\d+\.\d+$/.test(s)) return Number(s);
      return s;
    };

    /* --- Penerjemah formula sederhana (tanpa eval) --- */
    const ERR = (code) => ({ err: code });
    const isErr = (v) => v !== null && typeof v === 'object' && 'err' in v;
    const FN = {
      SUM: (xs) => xs.reduce((a, b) => a + b, 0),
      AVERAGE: (xs) => { if (!xs.length) throw ERR('#DIV/0!'); return xs.reduce((a, b) => a + b, 0) / xs.length; },
      MAX: (xs) => (xs.length ? Math.max(...xs) : 0),
      MIN: (xs) => (xs.length ? Math.min(...xs) : 0),
      COUNT: (xs) => xs.length,
    };
    const ALIAS = { JUMLAH: 'SUM', 'RATA-RATA': 'AVERAGE', MAKS: 'MAX', CACAH: 'COUNT' };
    const tokenize = (src) => {
      const out = [];
      let i = 0;
      while (i < src.length) {
        const rest = src.slice(i);
        let m;
        if (/^\s/.test(rest)) { i += 1; continue; }
        if (!/^\$?[A-Za-z]{1,2}\$?\d/.test(rest) && (m = /^[A-Za-z][A-Za-z.-]*(?=\s*\()/.exec(rest))) {
          out.push({ k: 'fn', v: m[0].toUpperCase() });
        } else if ((m = /^\$?([A-Za-z]{1,2})\$?(\d+)(?::\$?([A-Za-z]{1,2})\$?(\d+))?/.exec(rest))) {
          const a = `${m[1].toUpperCase()}${m[2]}`;
          out.push(m[3] ? { k: 'range', a, b: `${m[3].toUpperCase()}${m[4]}` } : { k: 'ref', v: a });
        } else if ((m = /^\d+(?:\.\d+)?/.exec(rest))) {
          out.push({ k: 'num', v: Number(m[0]) });
        } else if ('+-*/^(),;'.includes(rest[0])) {
          m = [rest[0]];
          out.push({ k: rest[0] === ';' ? ',' : rest[0] });
        } else {
          return null;
        }
        i += m[0].length;
      }
      return out;
    };
    const evaluate = (src, get) => {
      const t = tokenize(src);
      if (!t || !t.length) return ERR('#ERROR!');
      let p = 0;
      const peek = (k) => t[p] && t[p].k === k;
      const need = (k) => { if (!peek(k)) throw ERR('#ERROR!'); p += 1; };
      const num = (v) => {
        if (isErr(v)) throw v;
        if (v === '') return 0;
        if (typeof v === 'number') return v;
        throw ERR('#VALUE!');
      };
      const rangeValues = (a, b) => {
        const pa = posOf(a); const pb = posOf(b);
        if (!inGrid(pa) || !inGrid(pb)) throw ERR('#REF!');
        const xs = [];
        for (let r = Math.min(pa.r, pb.r); r <= Math.max(pa.r, pb.r); r += 1) {
          for (let c = Math.min(pa.c, pb.c); c <= Math.max(pa.c, pb.c); c += 1) {
            const v = get(addrOf(c, r));
            if (isErr(v)) throw v;
            if (typeof v === 'number') xs.push(v);
          }
        }
        return xs;
      };
      let expr;
      const primary = () => {
        const tok = t[p];
        if (!tok) throw ERR('#ERROR!');
        p += 1;
        if (tok.k === 'num') return tok.v;
        if (tok.k === 'ref') return get(tok.v);
        if (tok.k === '(') { const v = expr(); need(')'); return v; }
        if (tok.k === 'fn') {
          const name = ALIAS[tok.v] || tok.v;
          need('(');
          const xs = [];
          if (!peek(')')) {
            do {
              if (t[p] && t[p].k === 'range' && (!t[p + 1] || t[p + 1].k === ',' || t[p + 1].k === ')')) {
                xs.push(...rangeValues(t[p].a, t[p].b));
                p += 1;
              } else {
                const v = expr();
                if (v !== '') xs.push(num(v));
              }
            } while (peek(',') && (p += 1));
          }
          need(')');
          if (!FN[name]) throw ERR('#NAME?');
          return FN[name](xs);
        }
        if (tok.k === 'range') throw ERR('#VALUE!');
        throw ERR('#ERROR!');
      };
      const unary = () => {
        if (peek('-')) { p += 1; return -num(unary()); }
        if (peek('+')) { p += 1; return num(unary()); }
        return primary();
      };
      const power = () => {
        const v = unary();
        if (peek('^')) { p += 1; return num(v) ** num(power()); }
        return v;
      };
      const term = () => {
        let v = power();
        while (peek('*') || peek('/')) {
          const op = t[p].k;
          p += 1;
          const r = num(power());
          if (op === '/' && r === 0) throw ERR('#DIV/0!');
          v = op === '*' ? num(v) * r : num(v) / r;
        }
        return v;
      };
      expr = () => {
        let v = term();
        while (peek('+') || peek('-')) {
          const op = t[p].k;
          p += 1;
          const r = num(term());
          v = op === '+' ? num(v) + r : num(v) - r;
        }
        return v;
      };
      try {
        const v = expr();
        if (p < t.length) return ERR('#ERROR!');
        return typeof v === 'number' && !Number.isFinite(v) ? ERR('#DIV/0!') : v;
      } catch (e) {
        return isErr(e) ? e : ERR('#ERROR!');
      }
    };

    let cache = {};
    const visiting = new Set();
    const valueOf = (a) => {
      if (a in cache) return cache[a];
      if (!inGrid(posOf(a))) return ERR('#REF!');
      const src = raw[a];
      let v;
      if (src == null || src === '') v = '';
      else if (String(src).startsWith('=')) {
        if (visiting.has(a)) return ERR('#REF!');
        visiting.add(a);
        v = evaluate(String(src).slice(1), valueOf);
        visiting.delete(a);
      } else v = literal(src);
      cache[a] = v;
      return v;
    };
    const show = (v) => (isErr(v) ? v.err : typeof v === 'number' ? numID.format(v) : v);
    const ERR_INFO = {
      '#ERROR!': 'formulanya tidak bisa dibaca. Periksa tanda kurung dan operatornya. Ingat: kali memakai *, bagi memakai /.',
      '#NAME?': 'nama fungsinya tidak dikenal. Periksa ejaannya, misalnya SUM atau AVERAGE.',
      '#DIV/0!': 'ada pembagian dengan nol atau sel kosong.',
      '#VALUE!': 'ada teks yang ikut dihitung. Pastikan alamat selnya berisi angka.',
      '#REF!': 'alamat selnya tidak ada atau formula merujuk ke dirinya sendiri.',
    };

    const explain = (v, src) => ERR_INFO[v.err] + (/\d\s*[x×]\s*\$?[A-Za-z]*\d/i.test(String(src || '')) ? ' Untuk perkalian gunakan tanda *, bukan x.' : '');

    /* --- Tampilan lembar kerja --- */
    const widths = cfg.widths || [];
    mount.innerHTML = `
      <div class="sheet-app">
        <div class="sheet-bar">
          <span class="sheet-name" data-sheet-name aria-label="Alamat sel terpilih"></span>
          <label class="sheet-fx" for="${box.id || 'sheet'}-input"><i>fx</i><span class="sr-only">Isi sel atau formula</span></label>
          <input class="sheet-input" id="${box.id || 'sheet'}-input" data-sheet-input autocomplete="off" spellcheck="false" placeholder="Ketik angka, teks, atau formula, lalu Enter">
        </div>
        <div class="sheet-scroll">
          <table class="sheet-grid" role="grid" aria-label="Lembar kerja">
            <colgroup><col class="sheet-col-head">${Array.from({ length: COLS }, (_, c) => `<col${widths[c] ? ` style="width:${widths[c]}px"` : ''}>`).join('')}</colgroup>
            <thead><tr><th scope="col" class="sheet-corner"></th>${Array.from({ length: COLS }, (_, c) => `<th scope="col">${colName(c)}</th>`).join('')}</tr></thead>
            <tbody>${Array.from({ length: ROWS }, (_, r) => `<tr><th scope="row">${r + 1}</th>${Array.from({ length: COLS }, (__, c) => `<td role="gridcell" tabindex="-1" data-addr="${addrOf(c, r + 1)}"></td>`).join('')}</tr>`).join('')}</tbody>
          </table>
        </div>
        <div class="sheet-tabs"><span>Lembar1</span></div>
      </div>`;
    const nameEl = $('[data-sheet-name]', mount);
    const input = $('[data-sheet-input]', mount);
    const cells = $$('td[data-addr]', mount);
    const cellEl = (a) => cells.find((td) => td.dataset.addr === a);
    const taskCells = new Set(tasks.map((t) => t.cell));

    const judge = (task) => {
      const v = valueOf(task.cell);
      const src = String(raw[task.cell] ?? '');
      const isFormula = src.startsWith('=') && /[A-Z]{1,2}\d/i.test(src);
      if (src === '') return { state: 'todo', msg: '' };
      if (isErr(v)) return { state: 'bad', msg: `Muncul ${v.err}: ${explain(v, src)}` };
      if (typeof v !== 'number' || Math.abs(v - task.expect) > 1e-6) return { state: 'bad', msg: `Hasilnya ${show(v)}, belum tepat. Periksa alamat sel dan operatornya.` };
      if (!isFormula) return { state: 'warn', msg: 'Angkanya benar, tetapi diketik langsung. Gunakan formula dengan alamat sel agar hasilnya ikut berubah saat data berubah.' };
      if (task.fn) {
        const used = Object.keys(ALIAS).filter((k) => ALIAS[k] === task.fn).concat(task.fn);
        if (!used.some((f) => src.toUpperCase().includes(`${f}(`))) return { state: 'warn', msg: `Hasilnya benar! Coba juga dengan fungsi ${task.fn} agar lebih singkat.` };
      }
      return { state: 'ok', msg: 'Tepat!' };
    };

    const render = () => {
      cache = {};
      cells.forEach((td) => {
        const a = td.dataset.addr;
        const v = valueOf(a);
        const src = raw[a];
        td.textContent = show(v);
        td.classList.toggle('is-num', typeof v === 'number' || isErr(v));
        td.classList.toggle('is-err', isErr(v));
        td.classList.toggle('has-formula', String(src ?? '').startsWith('='));
        td.classList.toggle('is-head', !!cfg.head && posOf(a).r === 1);
        td.classList.toggle('is-sel', a === sel);
        td.tabIndex = a === sel ? 0 : -1;
        td.setAttribute('aria-selected', String(a === sel));
      });
      nameEl.textContent = sel;
      if (document.activeElement !== input) input.value = raw[sel] ?? '';
      if (!taskList) return;
      let ok = 0;
      taskList.innerHTML = tasks.map((task, i) => {
        const j = judge(task);
        if (j.state === 'ok') ok += 1;
        const icon = { ok: 'bi-check-circle-fill', warn: 'bi-exclamation-circle-fill', bad: 'bi-x-circle-fill', todo: 'bi-circle' }[j.state];
        cellEl(task.cell).classList.toggle('is-task', j.state !== 'ok');
        cellEl(task.cell).classList.toggle('is-done', j.state === 'ok');
        return `<li class="sheet-task is-${j.state}">
          <i class="bi ${icon}" aria-hidden="true"></i>
          <div>
            <p><button type="button" class="sheet-goto" data-goto="${task.cell}">${task.cell}</button> ${task.text}</p>
            ${j.msg ? `<p class="sheet-task-msg">${j.msg}</p>` : ''}
            ${task.hint && j.state !== 'ok' ? `<details class="sheet-hint"><summary>Petunjuk</summary><p>Contoh: <code>${escapeHTML(task.hint)}</code></p></details>` : ''}
          </div></li>`;
      }).join('');
      taskList.dataset.done = String(ok);
      if (scoreEl) {
        scoreEl.textContent = `${ok} / ${tasks.length}`;
        scoreEl.className = `dl-score ${ok === tasks.length ? 'is-ok' : ok >= tasks.length / 2 ? 'is-warn' : 'is-bad'}`;
      }
      cells.forEach((td) => { if (!taskCells.has(td.dataset.addr)) td.classList.remove('is-task', 'is-done'); });
    };

    const select = (a, focusCell = false) => {
      if (!inGrid(posOf(a))) return;
      sel = a;
      input.value = raw[sel] ?? '';
      render();
      if (focusCell) cellEl(a).focus();
    };
    const say = (text) => { if (status) status.textContent = text; };
    const commit = () => {
      const val = input.value.trim();
      if (val === '') delete raw[sel]; else raw[sel] = val;
      render();
      const v = valueOf(sel);
      say(isErr(v) ? `Sel ${sel} menampilkan ${v.err}: ${explain(v, val)}` : val.startsWith('=') ? `Sel ${sel} berisi formula ${val} dan hasilnya ${show(v)}.` : '');
    };
    const move = (dc, dr) => {
      const p = posOf(sel);
      const c = Math.min(COLS - 1, Math.max(0, p.c + dc));
      const r = Math.min(ROWS, Math.max(1, p.r + dr));
      select(addrOf(c, r), true);
    };

    mount.addEventListener('click', (e) => {
      const td = e.target.closest('td[data-addr]');
      if (td) select(td.dataset.addr);
    });
    mount.addEventListener('dblclick', (e) => {
      if (e.target.closest('td[data-addr]')) { input.focus(); input.select(); }
    });
    $('.sheet-grid', mount).addEventListener('keydown', (e) => {
      const keys = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
      if (keys[e.key]) { e.preventDefault(); move(...keys[e.key]); return; }
      if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); input.focus(); input.select(); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); input.value = ''; commit(); return; }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); input.value = e.key; input.focus(); }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); commit(); move(0, 1); }
      if (e.key === 'Escape') { input.value = raw[sel] ?? ''; cellEl(sel).focus(); }
    });
    input.addEventListener('change', commit);
    taskList?.addEventListener('click', (e) => {
      const go = e.target.closest('[data-goto]');
      if (go) { select(go.dataset.goto); input.focus(); }
    });

    /* Isi otomatis ke bawah: alamat sel di formula ikut bergeser (referensi relatif) */
    $('[data-sheet-fill]', box)?.addEventListener('click', () => {
      const src = String(raw[sel] ?? '');
      if (!src.startsWith('=')) { say('Pilih dulu sel yang berisi formula, lalu tekan tombol ini.'); return; }
      const p = posOf(sel);
      const filled = [];
      for (let r = p.r + 1; r <= ROWS; r += 1) {
        const left = p.c > 0 ? raw[addrOf(p.c - 1, r)] : null;
        if (!left || String(left).startsWith('=') || raw[addrOf(p.c, r)]) break;
        const dr = r - p.r;
        raw[addrOf(p.c, r)] = src.replace(/(\$?)([A-Z]{1,2})(\$?)(\d+)/gi, (m, d1, c, d2, n, off, str) => (
          /[A-Za-z]/.test(str[off - 1] || '') ? m : `${d1}${c.toUpperCase()}${d2}${d2 ? n : Number(n) + dr}`));
        filled.push(`${addrOf(p.c, r)} (${raw[addrOf(p.c, r)]})`);
      }
      render();
      say(filled.length
        ? `Formula disalin ke ${filled.join(', ')}. Perhatikan: nomor baris di alamat sel ikut bergeser!`
        : 'Tidak ada sel kosong di bawahnya yang bisa diisi otomatis.');
    });
    $('[data-sheet-reset]', box)?.addEventListener('click', () => {
      raw = { ...cfg.cells };
      say('Lembar kerja kembali ke data awal.');
      select(tasks[0] ? tasks[0].cell : 'A1');
    });
    render();
  });

  /* ---------- 24. Pembuat grafik: memilih jenis grafik yang tepat dan jujur ----------
     Data contoh di tombol [data-cm-preset='{"title","goal","unit","source","zero","rows":[["Label",12]]}'] */
  $$('[data-chart-maker]').forEach((cm) => {
    const chartEl = $('[data-cm-chart]', cm);
    const fb = $('[data-cm-feedback]', cm);
    const scoreEl = $('[data-cm-score]', cm);
    const field = (n) => $(`[data-cm="${n}"]`, cm);
    const labels = $$('[data-cm-label]', cm);
    const values = $$('[data-cm-value]', cm);
    const compact = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 });
    const type = () => ($('input[data-cm-type]:checked', cm) || {}).value || 'bar';
    const PALETTE = ['var(--e1)', 'var(--e2)', 'var(--e3)', 'var(--e4)', '#868e96', '#f59f00'];
    let unit = '';

    const niceStep = (span) => {
      const raw = span / 5;
      const mag = 10 ** Math.floor(Math.log10(raw || 1));
      return [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= raw) || mag * 10;
    };
    const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

    const draw = (rows, kind, zero, title, source) => {
      const W = 520; const H = 320;
      const L = 58; const R = 18; const T = 46; const B = 62;
      const head = `<text class="cg-title" x="${W / 2}" y="24" text-anchor="middle">${escapeHTML(clip(title || 'Tanpa judul', 52))}</text>`;
      const foot = source ? `<text class="cg-source" x="${L}" y="${H - 8}">Sumber: ${escapeHTML(clip(source, 60))}</text>` : '';
      if (!rows.length) return `${head}<text class="cg-axis" x="${W / 2}" y="${H / 2}" text-anchor="middle">Isi minimal dua baris data</text>`;
      if (kind === 'pie') {
        const total = rows.reduce((a, [, v]) => a + Math.max(v, 0), 0) || 1;
        const cx = 170; const cy = 178; const rad = 112;
        let ang = -Math.PI / 2;
        const slices = rows.map(([lab, v], i) => {
          const frac = Math.max(v, 0) / total;
          const a2 = ang + frac * Math.PI * 2;
          const large = frac > 0.5 ? 1 : 0;
          const x1 = cx + rad * Math.cos(ang); const y1 = cy + rad * Math.sin(ang);
          const x2 = cx + rad * Math.cos(a2); const y2 = cy + rad * Math.sin(a2);
          const path = frac >= 0.9999
            ? `<circle cx="${cx}" cy="${cy}" r="${rad}" style="fill:${PALETTE[i % 6]}"/>`
            : `<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${rad},${rad} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" style="fill:${PALETTE[i % 6]}"/>`;
          ang = a2;
          const ly = 80 + i * 30;
          return `${path}<rect x="318" y="${ly - 12}" width="14" height="14" rx="3" style="fill:${PALETTE[i % 6]}"/><text class="cg-label" x="340" y="${ly}">${escapeHTML(clip(lab, 16))} · ${Math.round(frac * 100)}%</text>`;
        }).join('');
        return `${head}<g class="cg-pie">${slices}</g>${foot}`;
      }
      const vals = rows.map(([, v]) => v);
      let max = Math.max(...vals, 0);
      let min = zero ? 0 : Math.min(...vals);
      if (!zero) min -= (max - min) * 0.15 || 1;
      const step = niceStep(max - min || 1);
      min = zero ? 0 : Math.floor(min / step) * step;
      max = Math.ceil(max / step) * step || step;
      const plotW = W - L - R; const plotH = H - T - B;
      const y = (v) => T + plotH - ((v - min) / (max - min)) * plotH;
      let grid = '';
      for (let v = min; v <= max + 1e-9; v += step) {
        grid += `<line class="cg-grid" x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="cg-axis" x="${L - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${compact.format(v)}</text>`;
      }
      const band = plotW / rows.length;
      const xLab = rows.map(([lab], i) => `<text class="cg-label" x="${(L + band * i + band / 2).toFixed(1)}" y="${T + plotH + 18}" text-anchor="middle">${escapeHTML(clip(lab, rows.length > 4 ? 9 : 14))}</text>`).join('');
      let marks;
      if (kind === 'line') {
        const pts = rows.map(([, v], i) => [L + band * i + band / 2, y(v)]);
        marks = `<polyline class="cg-line" points="${pts.map((q) => q.map((n) => n.toFixed(1)).join(',')).join(' ')}"/>${pts.map(([px, py], i) => `<circle class="cg-dot" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5"/><text class="cg-val" x="${px.toFixed(1)}" y="${(py - 10).toFixed(1)}" text-anchor="middle">${numID.format(vals[i])}</text>`).join('')}`;
      } else {
        const bw = Math.min(64, band * 0.6);
        marks = rows.map(([, v], i) => {
          const x = L + band * i + (band - bw) / 2;
          const top = y(Math.max(v, min));
          return `<rect class="cg-bar" x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${(T + plotH - top).toFixed(1)}" rx="4"/><text class="cg-val" x="${(x + bw / 2).toFixed(1)}" y="${(top - 6).toFixed(1)}" text-anchor="middle">${numID.format(v)}</text>`;
        }).join('');
      }
      const yTitle = unit ? `<text class="cg-axis" x="14" y="${T + plotH / 2}" text-anchor="middle" transform="rotate(-90 14 ${T + plotH / 2})">${escapeHTML(unit)}</text>` : '';
      const cut = !zero ? `<path class="cg-cut" d="M${L - 6},${T + plotH - 4} l12,-6 M${L - 6},${T + plotH + 2} l12,-6"/>` : '';
      return `${head}${grid}<line class="cg-base" x1="${L}" x2="${W - R}" y1="${T + plotH}" y2="${T + plotH}"/>${marks}${xLab}${yTitle}${cut}${foot}`;
    };

    const FIT = {
      bandingkan: { bar: ['is-ok', 'Diagram batang paling tepat untuk membandingkan jumlah antarkelompok.'], line: ['is-warn', 'Garis menunjukkan perubahan waktu. Kelompok ini bukan urutan waktu, jadi batang lebih tepat.'], pie: ['is-warn', 'Lingkaran sulit dipakai membandingkan nilai yang mirip. Coba diagram batang.'] },
      tren: { line: ['is-ok', 'Diagram garis paling tepat untuk melihat naik-turunnya data dari waktu ke waktu.'], bar: ['is-warn', 'Batang bisa dipakai, tetapi garis lebih jelas menunjukkan naik-turunnya.'], pie: ['is-bad', 'Lingkaran tidak bisa menunjukkan perubahan dari waktu ke waktu.'] },
      bagian: { pie: ['is-ok', 'Diagram lingkaran tepat untuk menunjukkan bagian dari keseluruhan.'], bar: ['is-warn', 'Batang bisa dipakai, tetapi lingkaran lebih jelas menunjukkan bagian dari keseluruhan.'], line: ['is-bad', 'Garis tidak cocok karena data ini bukan urutan waktu.'] },
    };
    const row = (cls, text) => `<li class="${cls}"><i class="bi ${cls === 'is-ok' ? 'bi-check-circle-fill' : cls === 'is-warn' ? 'bi-exclamation-circle-fill' : 'bi-x-circle-fill'}" aria-hidden="true"></i> ${text}</li>`;

    const render = () => {
      const rows = labels.map((l, i) => [l.value.trim(), values[i].value.trim()])
        .filter(([l, v]) => l && v !== '' && !Number.isNaN(Number(v.replace(',', '.'))))
        .map(([l, v]) => [l, Number(v.replace(',', '.'))]);
      const kind = type();
      const zeroBox = field('zero');
      zeroBox.disabled = kind === 'pie';
      const zero = zeroBox.checked || kind === 'pie';
      const title = field('title').value.trim();
      const source = field('source').value.trim();
      const goal = field('goal').value;
      const show = rows.length >= 2 ? rows : [];
      chartEl.innerHTML = `<svg viewBox="0 0 520 320" role="img" aria-label="${escapeHTML(`${{ bar: 'Diagram batang', line: 'Diagram garis', pie: 'Diagram lingkaran' }[kind]}: ${title || 'tanpa judul'}. ${show.map(([l, v]) => `${l} ${numID.format(v)}`).join(', ')}`)}">${draw(show, kind, zero, title, source)}</svg>`;

      const out = [];
      let good = 0;
      const judge = (cls, text) => { if (cls === 'is-ok') good += 1; out.push(row(cls, text)); };
      judge(...FIT[goal][kind]);
      judge(title.length >= 10 ? 'is-ok' : 'is-bad', title.length >= 10 ? 'Judul menjelaskan isi grafik.' : 'Tulis judul yang jelas: data apa, siapa, dan kapan.');
      if (kind === 'pie') judge('is-ok', 'Diagram lingkaran tidak memakai sumbu, jadi tidak bisa "dipotong".');
      else if (zero) judge('is-ok', 'Sumbu tegak dimulai dari 0, jadi perbandingannya jujur.');
      else if (kind === 'bar') judge('is-bad', 'Sumbu tegak tidak dimulai dari 0. Selisih antarbatang terlihat jauh lebih besar dari aslinya. Ini grafik yang menyesatkan!');
      else judge('is-ok', 'Pada grafik garis, sumbu boleh tidak dimulai dari 0 asalkan angka di sumbunya terlihat jelas.');
      judge(source.length >= 4 ? 'is-ok' : 'is-bad', source.length >= 4 ? 'Sumber data dicantumkan, jadi grafik bisa dipercaya.' : 'Cantumkan sumber data agar pembaca tahu asal datanya.');
      const negative = rows.some(([, v]) => v < 0);
      judge(rows.length >= 2 && !(kind === 'pie' && (negative || rows.length > 6)) ? 'is-ok' : 'is-bad',
        rows.length < 2 ? 'Isi minimal dua baris data (label dan angka).' : kind === 'pie' && negative ? 'Diagram lingkaran tidak bisa memakai angka negatif.' : kind === 'pie' && rows.length > 6 ? 'Diagram lingkaran sebaiknya paling banyak 6 bagian.' : `Data lengkap: ${rows.length} kategori.`);
      fb.innerHTML = out.join('');
      scoreEl.textContent = `${good} / 5`;
      scoreEl.className = `dl-score ${good === 5 ? 'is-ok' : good >= 3 ? 'is-warn' : 'is-bad'}`;
    };

    const load = (preset) => {
      let d;
      try { d = JSON.parse(preset); } catch (e) { return; }
      field('title').value = d.title || '';
      field('source').value = d.source || '';
      field('goal').value = d.goal || 'bandingkan';
      field('zero').checked = d.zero !== false;
      unit = d.unit || '';
      labels.forEach((l, i) => {
        l.value = d.rows[i] ? d.rows[i][0] : '';
        values[i].value = d.rows[i] ? d.rows[i][1] : '';
      });
      render();
    };
    cm.addEventListener('input', render);
    cm.addEventListener('change', render);
    cm.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cm-preset]');
      if (!btn) return;
      $$('[data-cm-preset]', cm).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      load(btn.dataset.cmPreset);
    });
    const first = $('[data-cm-preset]', cm);
    if (first) { first.setAttribute('aria-pressed', 'true'); load(first.dataset.cmPreset); } else render();
  });

  /* ---------- 25. Mesin percabangan: telusuri JIKA–MAKA–JIKA TIDAK ----------
     <div data-branch-lab data-rules='[{"test":"<","value":5,"key":"a","ask":"Apakah {v} < 5?","out":"Gratis"},…,{"key":"c","out":"…"}]'>
     Elemen diagram alir dan baris pseudokode diberi data-path="a b" (cabang yang melewatinya). */
  const compareOps = { '<': (a, b) => a < b, '<=': (a, b) => a <= b, '>': (a, b) => a > b, '>=': (a, b) => a >= b, '==': (a, b) => a === b, '!=': (a, b) => a !== b };
  $$('[data-branch-lab]').forEach((lab) => {
    let rules;
    try { rules = JSON.parse(lab.dataset.rules); } catch (e) { return; }
    const input = $('[data-bl-input]', lab);
    const valueEl = $('[data-bl-value]', lab);
    const outEl = $('[data-bl-out]', lab);
    const traceEl = $('[data-bl-trace]', lab);
    const unit = lab.dataset.unit || '';
    const render = () => {
      const v = Number(input.value);
      if (valueEl) valueEl.textContent = `${v}${unit ? ` ${unit}` : ''}`;
      const trace = [];
      let hit = rules[rules.length - 1];
      for (const rule of rules) {
        if (!rule.test) { hit = rule; break; }
        const yes = compareOps[rule.test](v, rule.value);
        trace.push(`<li class="${yes ? 'is-ok' : 'is-bad'}"><i class="bi ${yes ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}" aria-hidden="true"></i><span>${escapeHTML(rule.ask.replace('{v}', v))} <strong>${yes ? 'Ya' : 'Tidak'}</strong></span></li>`);
        if (yes) { hit = rule; break; }
      }
      trace.push(`<li class="is-out"><i class="bi bi-arrow-right-circle-fill" aria-hidden="true"></i><span>Hasil: <strong>${escapeHTML(hit.out)}</strong></span></li>`);
      $$('[data-path]', lab).forEach((el) => {
        const on = el.dataset.path.split(' ').includes(hit.key);
        el.classList.toggle('is-on', on);
        el.classList.toggle('is-off', !on);
      });
      outEl.textContent = hit.out;
      traceEl.innerHTML = trace.join('');
    };
    input.addEventListener('input', render);
    lab.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-bl-set]');
      if (!btn) return;
      input.value = btn.dataset.blSet;
      render();
    });
    render();
  });

  /* ---------- 26. Pelacak perulangan: ULANGI n KALI dan SELAMA ---------- */
  $$('[data-loop-lab]').forEach((lab) => {
    const field = (n) => $(`[data-ll="${n}"]`, lab);
    const codeEl = $('[data-ll-code]', lab);
    const rowsEl = $('[data-ll-rows]', lab);
    const status = $('[data-ll-status]', lab);
    const stepBtn = $('[data-ll-step]', lab);
    const runBtn = $('[data-ll-run]', lab);
    const SAFETY = 30;
    const rp = (n) => `Rp${numID.format(n)}`;
    let st;
    let timer = null;

    const cfg = () => ({
      mode: field('mode').value,
      add: Number(field('add').value) || 0,
      n: Math.max(1, Math.min(12, Number(field('n').value) || 1)),
      target: Number(field('target').value) || 0,
    });
    const code = (c) => (c.mode === 'for'
      ? [['init', 'tabungan ← 0'], ['init', 'minggu ← 0'], ['head', `ULANGI ${c.n} KALI`], ['body', `    tabungan ← tabungan + ${numID.format(c.add)}`], ['body', '    minggu ← minggu + 1'], ['end', 'AKHIR ULANGI'], ['out', 'TAMPILKAN tabungan']]
      : [['init', 'tabungan ← 0'], ['init', 'minggu ← 0'], ['head', `SELAMA tabungan < ${numID.format(c.target)} LAKUKAN`], ['body', `    tabungan ← tabungan + ${numID.format(c.add)}`], ['body', '    minggu ← minggu + 1'], ['end', 'AKHIR SELAMA'], ['out', 'TAMPILKAN minggu']]);
    const highlight = (key) => $$('[data-k]', codeEl).forEach((ln) => ln.classList.toggle('is-on', ln.dataset.k === key || (key === 'loop' && (ln.dataset.k === 'head' || ln.dataset.k === 'body'))));
    const stop = () => {
      clearInterval(timer);
      timer = null;
      runBtn.innerHTML = '<i class="bi bi-play-fill" aria-hidden="true"></i> Jalankan semua';
    };
    const reset = () => {
      stop();
      const c = cfg();
      field('n').closest('.ll-field').hidden = c.mode !== 'for';
      field('target').closest('.ll-field').hidden = c.mode === 'for';
      st = { c, tabungan: 0, minggu: 0, done: false };
      codeEl.innerHTML = code(c).map(([k, t]) => `<span class="pl" data-k="${k}">${escapeHTML(t)}</span>`).join('');
      highlight('init');
      rowsEl.innerHTML = '';
      stepBtn.disabled = false;
      runBtn.disabled = false;
      status.textContent = c.mode === 'for'
        ? `Perulangan akan berjalan tepat ${c.n} kali. Tekan "Satu putaran" untuk menelusurinya.`
        : `Perulangan berjalan selama tabungan masih kurang dari ${rp(c.target)}. Berapa putaran yang dibutuhkan? Tebak dulu, lalu telusuri.`;
    };
    const finish = (text) => {
      st.done = true;
      stop();
      stepBtn.disabled = true;
      runBtn.disabled = true;
      highlight('out');
      status.textContent = text;
    };
    const step = () => {
      if (st.done) return;
      const { c } = st;
      const cont = c.mode === 'for' ? st.minggu < c.n : st.tabungan < c.target;
      if (!cont) {
        finish(c.mode === 'for'
          ? `Selesai setelah ${c.n} putaran. Tabungan akhir: ${rp(st.tabungan)}.`
          : `Kondisi "tabungan < ${numID.format(c.target)}" sudah salah, jadi perulangan berhenti. Butuh ${st.minggu} minggu, tabungan ${rp(st.tabungan)}.`);
        return;
      }
      if (st.minggu >= SAFETY) {
        finish(`Awas! Sudah ${SAFETY} putaran dan kondisinya masih benar. Karena setoran ${rp(c.add)}, tabungan tidak pernah mencapai target. Inilah perulangan tanpa akhir (infinite loop). Program kami hentikan paksa.`);
        status.classList.add('is-bad');
        return;
      }
      st.tabungan += c.add;
      st.minggu += 1;
      highlight('loop');
      const check = c.mode === 'for' ? `putaran ke-${st.minggu} dari ${c.n}` : `${numID.format(st.tabungan - c.add)} < ${numID.format(c.target)}? Ya`;
      rowsEl.insertAdjacentHTML('beforeend', `<tr><td class="num">${st.minggu}</td><td>${check}</td><td class="num">${rp(st.tabungan)}</td></tr>`);
      const wrap = rowsEl.closest('.ll-table');
      if (wrap) wrap.scrollTop = wrap.scrollHeight;
      status.classList.remove('is-bad');
      status.textContent = `Putaran ${st.minggu}: tabungan bertambah ${rp(c.add)} menjadi ${rp(st.tabungan)}.`;
    };
    stepBtn.addEventListener('click', step);
    runBtn.addEventListener('click', () => {
      if (timer) { stop(); return; }
      runBtn.innerHTML = '<i class="bi bi-pause-fill" aria-hidden="true"></i> Jeda';
      timer = setInterval(() => { step(); if (st.done) stop(); }, motionOK ? 450 : 120);
    });
    $('[data-ll-reset]', lab).addEventListener('click', () => { status.classList.remove('is-bad'); reset(); });
    lab.addEventListener('change', (e) => { if (e.target.closest('[data-ll]')) { status.classList.remove('is-bad'); reset(); } });
    reset();
  });

  /* ---------- 27. Robot penyiram tanaman: perulangan + percabangan ----------
     Tombol misi: data-gd-mission='{"map":["R?????F"],"dir":"E","rows":3,"random":true}'
     Peta: R = robot, P = tanaman, ? = mungkin tanaman (diacak), F = bendera, # = pohon, . = jalan */
  $$('[data-garden]').forEach((game) => {
    const board = $('.gd-board', game);
    const list = $('.rb-program', game);
    const status = $('[data-rb-status]', game);
    const CMD = {
      M: 'Maju 1 kotak',
      L: 'Belok kiri',
      R: 'Belok kanan',
      S: 'Siram',
      IS: 'Jika ada tanaman kering: siram',
      IB: 'Jika depan terhalang: belok kanan, jika tidak: maju',
    };
    const DIRS = ['N', 'E', 'S', 'W'];
    const STEP = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
    const WHILE_CAP = 40;
    let mission;
    let cols; let rows; let walls; let plants; let start; let finishAt; let pos; let watered; let wasted;
    let cells = [];
    let timer = null;
    const key = (x, y) => `${x},${y}`;

    const robot = document.createElement('span');
    robot.className = 'rb-robot';
    robot.setAttribute('aria-hidden', 'true');
    robot.innerHTML = '<span class="rb-bot"><i class="bi bi-robot"></i></span><span class="rb-face"><i class="bi bi-caret-up-fill"></i></span>';

    const drawBoard = () => {
      board.innerHTML = '';
      cells = [];
      board.style.setProperty('--cols', cols);
      board.style.setProperty('--rows', rows);
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const c = document.createElement('span');
          c.className = 'rb-cell gd-cell';
          const k = key(x, y);
          if (walls.has(k)) { c.classList.add('is-wall'); c.innerHTML = '<i class="bi bi-tree-fill" aria-hidden="true"></i>'; }
          else if (k === key(finishAt.x, finishAt.y)) { c.classList.add('is-target'); c.innerHTML = '<i class="bi bi-flag-fill" aria-hidden="true"></i>'; }
          else if (plants.has(k)) {
            c.classList.add('is-plant');
            if (watered.has(k)) c.classList.add('is-watered');
            c.innerHTML = '<i class="bi bi-flower1" aria-hidden="true"></i>';
          }
          if (wasted.has(k)) c.classList.add('is-wasted');
          cells.push(c);
          board.appendChild(c);
        }
      }
      board.appendChild(robot);
      const label = `Peta ${cols} kali ${rows} kotak dengan ${plants.size} tanaman.`;
      board.setAttribute('aria-label', label);
    };
    const place = () => {
      robot.style.setProperty('--x', pos.x);
      robot.style.setProperty('--y', pos.y);
      robot.style.setProperty('--rot', `${pos.rot}deg`);
    };
    const setup = (rerollPlants) => {
      const map = mission.map;
      rows = map.length;
      cols = map[0].length;
      walls = new Set();
      if (rerollPlants || !plants) plants = new Set();
      const maybe = [];
      map.forEach((line, y) => [...line].forEach((ch, x) => {
        if (ch === '#') walls.add(key(x, y));
        if (ch === 'R') start = { x, y };
        if (ch === 'F') finishAt = { x, y };
        if (ch === 'P' && rerollPlants) plants.add(key(x, y));
        if (ch === '?') maybe.push(key(x, y));
      }));
      if (rerollPlants && maybe.length) {
        const shuffled = maybe.sort(() => Math.random() - 0.5);
        const count = 2 + Math.floor(Math.random() * Math.max(1, maybe.length - 2));
        shuffled.slice(0, count).forEach((k) => plants.add(k));
      }
      watered = new Set();
      wasted = new Set();
      const d = mission.dir || 'E';
      pos = { ...start, d, rot: DIRS.indexOf(d) * 90 };
      robot.classList.remove('is-crash', 'is-win');
      drawBoard();
      place();
    };

    /* --- Baris program --- */
    const options = (sel, allowNone) => (allowNone ? '<option value="">— (tidak ada)</option>' : '')
      + Object.entries(CMD).map(([k, t]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${t}</option>`).join('');
    const rowEls = () => $$('.rb-step', list);
    const addRow = (type, a = {}) => {
      if (rowEls().length >= mission.rows) {
        status.textContent = `Misi ini hanya boleh memakai ${mission.rows} baris program. Gunakan perulangan agar programnya ringkas!`;
        return;
      }
      const li = document.createElement('li');
      li.className = 'rb-step gd-row';
      li.dataset.type = type;
      let body;
      if (type === 'cmd') body = `<select data-c1 aria-label="Perintah">${options(a.c1 || 'M')}</select>`;
      else if (type === 'rep') {
        body = `<span class="gd-kw"><i class="bi bi-arrow-repeat" aria-hidden="true"></i> Ulangi</span>
          <select data-n class="gd-n" aria-label="Berapa kali diulang">${[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<option${n === (a.n || 5) ? ' selected' : ''}>${n}</option>`).join('')}</select>
          <span class="gd-kw">kali:</span>
          <select data-c1 aria-label="Perintah pertama di dalam perulangan">${options(a.c1 || 'M')}</select>
          <select data-c2 aria-label="Perintah kedua di dalam perulangan">${options(a.c2 ?? '', true)}</select>`;
      } else {
        body = `<span class="gd-kw"><i class="bi bi-arrow-repeat" aria-hidden="true"></i> Ulangi sampai tiba di <i class="bi bi-flag-fill" aria-label="bendera"></i>:</span>
          <select data-c1 aria-label="Perintah pertama di dalam perulangan">${options(a.c1 || 'IB')}</select>
          <select data-c2 aria-label="Perintah kedua di dalam perulangan">${options(a.c2 ?? '', true)}</select>`;
      }
      li.innerHTML = `<div class="gd-row-body">${body}</div><button type="button" class="rb-del" aria-label="Hapus baris"><i class="bi bi-x-lg" aria-hidden="true"></i></button>`;
      list.appendChild(li);
    };
    const readProgram = () => rowEls().map((li) => ({
      li,
      type: li.dataset.type,
      n: Number($('[data-n]', li)?.value || 1),
      body: [$('[data-c1]', li)?.value, $('[data-c2]', li)?.value].filter(Boolean),
    }));

    /* --- Menjalankan program langkah demi langkah --- */
    const ahead = () => {
      const nx = pos.x + STEP[pos.d][0];
      const ny = pos.y + STEP[pos.d][1];
      return { nx, ny, blocked: nx < 0 || ny < 0 || nx >= cols || ny >= rows || walls.has(key(nx, ny)) };
    };
    const turn = (dir) => {
      pos.d = DIRS[(DIRS.indexOf(pos.d) + (dir === 'R' ? 1 : 3)) % 4];
      pos.rot += dir === 'R' ? 90 : -90;
    };
    const doCmd = (cmd) => {
      const here = key(pos.x, pos.y);
      if (cmd === 'L' || cmd === 'R') { turn(cmd); return null; }
      if (cmd === 'S') {
        if (plants.has(here) && !watered.has(here)) watered.add(here); else wasted.add(here);
        return null;
      }
      if (cmd === 'IS') {
        if (plants.has(here) && !watered.has(here)) watered.add(here);
        return null;
      }
      const a = ahead();
      if (cmd === 'IB' && a.blocked) { turn('R'); return null; }
      if (a.blocked) return a.nx < 0 || a.ny < 0 || a.nx >= cols || a.ny >= rows ? 'keluar dari peta' : 'menabrak pohon';
      pos.x = a.nx;
      pos.y = a.ny;
      return null;
    };
    const atFinish = () => pos.x === finishAt.x && pos.y === finishAt.y;
    function* execute(program) {
      for (let i = 0; i < program.length; i += 1) {
        const row = program[i];
        if (row.type === 'cmd') {
          yield { i, info: '' , cmd: row.body[0] };
        } else if (row.type === 'rep') {
          for (let k = 1; k <= row.n; k += 1) {
            for (const cmd of row.body) yield { i, info: `putaran ${k} dari ${row.n}`, cmd };
          }
        } else {
          let k = 0;
          while (!atFinish()) {
            k += 1;
            if (k > WHILE_CAP) { yield { i, loop: true }; return; }
            for (const cmd of row.body) yield { i, info: `putaran ${k}`, cmd };
          }
        }
      }
    }
    const setBusy = (busy) => $$('button, select', game).forEach((el) => { el.disabled = busy; });
    const stop = () => { clearInterval(timer); timer = null; setBusy(false); };
    const verdict = (program) => {
      const dry = [...plants].filter((k) => !watered.has(k)).length;
      if (wasted.size) return `Air terbuang di ${wasted.size} kotak yang tidak perlu disiram. Gunakan percabangan "Jika ada tanaman kering: siram" agar robot hanya menyiram tanaman.`;
      if (dry) return `Masih ada ${dry} tanaman kering. Telusuri lagi: apakah setiap tanaman sudah dilewati dan disiram?`;
      if (!atFinish()) return 'Semua tanaman sudah disiram, tetapi robot belum sampai di bendera.';
      robot.classList.add('is-win');
      return `Berhasil! Semua tanaman tersiram dan robot tiba di bendera hanya dengan ${program.length} baris program.${mission.random ? ' Coba jalankan lagi: letak tanaman diacak setiap kali, tetapi programmu tetap berhasil berkat percabangan.' : ''}`;
    };
    const run = () => {
      const program = readProgram();
      if (!program.length) { status.textContent = 'Programnya masih kosong. Tambahkan baris dulu.'; return; }
      setup(!!mission.random);
      rowEls().forEach((li) => li.classList.remove('is-active', 'is-bug'));
      const it = execute(program);
      setBusy(true);
      status.textContent = 'Robot sedang menjalankan program…';
      timer = setInterval(() => {
        const { value, done } = it.next();
        rowEls().forEach((li) => li.classList.remove('is-active'));
        if (done) { stop(); status.textContent = verdict(program); return; }
        const li = program[value.i].li;
        if (value.loop) {
          li.classList.add('is-bug');
          stop();
          status.textContent = `Perulangan di baris ${value.i + 1} sudah berjalan ${WHILE_CAP} kali dan robot belum juga tiba. Ini perulangan tanpa akhir! Periksa perintah di dalamnya.`;
          return;
        }
        li.classList.add('is-active');
        const crash = doCmd(value.cmd);
        place();
        drawCellState();
        if (crash) {
          li.classList.remove('is-active');
          li.classList.add('is-bug');
          robot.classList.add('is-crash');
          stop();
          status.textContent = `Bug di baris ${value.i + 1}${value.info ? ` (${value.info})` : ''}: robot ${crash}. Perbaiki programnya, lalu jalankan lagi.`;
          return;
        }
        status.textContent = `Baris ${value.i + 1}${value.info ? `, ${value.info}` : ''}: ${CMD[value.cmd]}`;
      }, motionOK ? 420 : 150);
    };
    const drawCellState = () => {
      cells.forEach((c, idx) => {
        const k = key(idx % cols, Math.floor(idx / cols));
        c.classList.toggle('is-watered', watered.has(k));
        c.classList.toggle('is-wasted', wasted.has(k));
      });
    };

    const load = (btn) => {
      try { mission = JSON.parse(btn.dataset.gdMission); } catch (e) { return; }
      stop();
      $$('[data-gd-mission]', game).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      plants = null;
      setup(true);
      list.innerHTML = '';
      status.textContent = btn.dataset.gdMessage || '';
    };
    game.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn || btn.disabled) return;
      if (btn.matches('[data-gd-mission]')) load(btn);
      else if (btn.matches('[data-gd-add]')) addRow(btn.dataset.gdAdd);
      else if (btn.matches('.rb-del')) { btn.closest('.rb-step').remove(); setup(false); }
      else if (btn.matches('[data-rb-run]')) run();
      else if (btn.matches('[data-rb-reset]')) { setup(false); rowEls().forEach((li) => li.classList.remove('is-active', 'is-bug')); status.textContent = 'Robot kembali ke posisi awal.'; }
      else if (btn.matches('[data-rb-clear]')) { list.innerHTML = ''; setup(false); status.textContent = 'Program dikosongkan.'; }
    });
    list.addEventListener('change', () => { setup(false); rowEls().forEach((li) => li.classList.remove('is-bug')); });
    const first = $('[data-gd-mission]', game);
    if (first) load(first);
  });

  /* ---------- 28. Lab perulangan bersarang: ubin persegi, segitiga, papan catur ---------- */
  $$('[data-nest-lab]').forEach((lab) => {
    const field = (n) => $(`[data-nl="${n}"]`, lab);
    const grid = $('[data-nl-grid]', lab);
    const codeEl = $('[data-nl-code]', lab);
    const status = $('[data-nl-status]', lab);
    const stepBtn = $('[data-nl-step]', lab);
    const runBtn = $('[data-nl-run]', lab);
    const outI = $('[data-nl-out="i"]', lab);
    const outJ = $('[data-nl-out="j"]', lab);
    const outN = $('[data-nl-out="n"]', lab);
    let st;
    let timer = null;

    const CODE = {
      persegi: (R, C) => [['o', `<b>ULANGI</b> i <b>DARI</b> 1 <b>SAMPAI</b> ${R}`], ['in', `    <b>ULANGI</b> j <b>DARI</b> 1 <b>SAMPAI</b> ${C}`], ['b', '        pasang ubin di baris i, kolom j'], ['ie', '    <b>AKHIR ULANGI</b>'], ['oe', '<b>AKHIR ULANGI</b>']],
      segitiga: (R) => [['o', `<b>ULANGI</b> i <b>DARI</b> 1 <b>SAMPAI</b> ${R}`], ['in', '    <b>ULANGI</b> j <b>DARI</b> 1 <b>SAMPAI</b> i'], ['b', '        pasang ubin di baris i, kolom j'], ['ie', '    <b>AKHIR ULANGI</b>'], ['oe', '<b>AKHIR ULANGI</b>']],
      catur: (R, C) => [['o', `<b>ULANGI</b> i <b>DARI</b> 1 <b>SAMPAI</b> ${R}`], ['in', `    <b>ULANGI</b> j <b>DARI</b> 1 <b>SAMPAI</b> ${C}`], ['if', '        <b>JIKA</b> (i + j) genap <b>MAKA</b>'], ['dark', '            pasang ubin gelap'], ['else', '        <b>JIKA TIDAK</b>'], ['light', '            pasang ubin terang'], ['fi', '        <b>AKHIR JIKA</b>'], ['ie', '    <b>AKHIR ULANGI</b>'], ['oe', '<b>AKHIR ULANGI</b>']],
    };
    const highlight = (keys) => $$('[data-k]', codeEl).forEach((ln) => ln.classList.toggle('is-on', keys.includes(ln.dataset.k)));
    const stop = () => {
      clearInterval(timer);
      timer = null;
      runBtn.innerHTML = '<i class="bi bi-play-fill" aria-hidden="true"></i> Jalankan semua';
    };
    const reset = () => {
      stop();
      const R = Math.max(1, Math.min(8, Number(field('rows').value) || 1));
      const C = Math.max(1, Math.min(8, Number(field('cols').value) || 1));
      const pattern = field('pattern').value;
      field('cols').closest('.ll-field').hidden = pattern === 'segitiga';
      const cols = pattern === 'segitiga' ? R : C;
      st = { R, C, pattern, cols, i: 1, j: 0, n: 0, outer: 0, done: false };
      grid.style.setProperty('--cols', cols);
      grid.innerHTML = Array.from({ length: R * cols }, (_, k) => `<span class="ng-cell" title="baris ${Math.floor(k / cols) + 1}, kolom ${(k % cols) + 1}"></span>`).join('');
      codeEl.innerHTML = CODE[pattern](R, C).map(([k, t]) => `<span class="pl" data-k="${k}">${t}</span>`).join('');
      highlight([]);
      outI.textContent = '-';
      outJ.textContent = '-';
      outN.textContent = '0';
      stepBtn.disabled = false;
      runBtn.disabled = false;
      const total = pattern === 'segitiga' ? (R * (R + 1)) / 2 : R * C;
      status.textContent = 'Tebak dulu: berapa kali perintah di dalam perulangan dalam akan dijalankan? Hitung, lalu jalankan untuk memeriksa tebakanmu.';
      status.dataset.total = total;
    };
    const innerLimit = () => (st.pattern === 'segitiga' ? st.i : st.C);
    const step = () => {
      if (st.done) return;
      st.j += 1;
      if (st.j > innerLimit()) { st.i += 1; st.j = 1; }
      if (st.i > st.R) {
        st.done = true;
        stop();
        stepBtn.disabled = true;
        runBtn.disabled = true;
        highlight(['oe']);
        $$('.ng-cell', grid).forEach((c) => c.classList.remove('is-now'));
        status.textContent = `Selesai! Perulangan luar berjalan ${st.R} kali, dan perintah di perulangan dalam dijalankan ${st.n} kali.`;
        return;
      }
      if (st.j === 1) st.outer += 1;
      st.n += 1;
      const cell = $$('.ng-cell', grid)[(st.i - 1) * st.cols + (st.j - 1)];
      $$('.ng-cell', grid).forEach((c) => c.classList.remove('is-now'));
      let keys = ['o', 'in', 'b'];
      let what = 'pasang ubin';
      if (st.pattern === 'catur') {
        const even = (st.i + st.j) % 2 === 0;
        cell.classList.add(even ? 'is-dark' : 'is-light');
        keys = ['o', 'in', 'if', even ? 'dark' : 'else', ...(even ? [] : ['light'])];
        what = `(${st.i} + ${st.j}) = ${st.i + st.j}, ${even ? 'genap → ubin gelap' : 'ganjil → ubin terang'}`;
      } else cell.classList.add('is-tile');
      cell.classList.add('is-now');
      highlight(keys);
      outI.textContent = st.i;
      outJ.textContent = st.j;
      outN.textContent = st.n;
      status.textContent = `i = ${st.i}, j = ${st.j}: ${what}.`;
    };
    stepBtn.addEventListener('click', step);
    runBtn.addEventListener('click', () => {
      if (timer) { stop(); return; }
      runBtn.innerHTML = '<i class="bi bi-pause-fill" aria-hidden="true"></i> Jeda';
      timer = setInterval(() => { step(); if (st.done) stop(); }, motionOK ? 260 : 80);
    });
    $('[data-nl-reset]', lab).addEventListener('click', reset);
    lab.addEventListener('change', (e) => { if (e.target.closest('[data-nl]')) reset(); });
    reset();
  });

  /* ---------- 29. Tebak angka: strategi satu per satu vs bagi dua ---------- */
  $$('[data-guess-lab]').forEach((lab) => {
    const MAX = Number(lab.dataset.max) || 100;
    const input = $('[data-gl-input]', lab);
    const status = $('[data-gl-status]', lab);
    const history = $('[data-gl-history]', lab);
    const rowsEl = $('[data-gl-rows]', lab);
    const compare = $('[data-gl-compare]', lab);
    const guessBtn = $('[data-gl-guess]', lab);
    const showBtn = $('[data-gl-show]', lab);
    let secret; let tries; let done; let timer = null;

    const binary = (target) => {
      const out = [];
      let lo = 1; let hi = MAX;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const res = mid === target ? 'Tepat!' : mid < target ? 'Terlalu kecil' : 'Terlalu besar';
        out.push({ lo, hi, mid, res });
        if (mid === target) break;
        if (mid < target) lo = mid + 1; else hi = mid - 1;
      }
      return out;
    };
    const newGame = () => {
      clearInterval(timer);
      secret = 1 + Math.floor(Math.random() * MAX);
      tries = [];
      done = false;
      history.innerHTML = '';
      rowsEl.innerHTML = '';
      compare.hidden = true;
      input.value = '';
      input.disabled = false;
      guessBtn.disabled = false;
      showBtn.disabled = false;
      status.className = 'tool-status';
      status.textContent = `Komputer sudah memilih bilangan bulat dari 1 sampai ${MAX}. Tebak dengan sesedikit mungkin tebakan!`;
    };
    const finishCompare = () => {
      compare.hidden = false;
      const b = binary(secret).length;
      $('[data-gl-c="you"]', compare).textContent = tries.length ? `${tries.length} tebakan` : '-';
      $('[data-gl-c="linear"]', compare).textContent = `${secret} tebakan`;
      $('[data-gl-c="binary"]', compare).textContent = `${b} tebakan`;
    };
    const guess = () => {
      if (done) return;
      const g = Math.round(Number(input.value));
      if (!input.value || Number.isNaN(g) || g < 1 || g > MAX) {
        status.textContent = `Masukkan bilangan bulat dari 1 sampai ${MAX}. (Ini juga kasus uji tidak valid, lho!)`;
        return;
      }
      tries.push(g);
      const res = g === secret ? 'ok' : g < secret ? 'up' : 'down';
      history.insertAdjacentHTML('beforeend', `<li class="gl-chip is-${res}">${g} <i class="bi ${res === 'ok' ? 'bi-check-lg' : res === 'up' ? 'bi-arrow-up' : 'bi-arrow-down'}" aria-hidden="true"></i></li>`);
      if (res === 'ok') {
        done = true;
        input.disabled = true;
        guessBtn.disabled = true;
        status.textContent = `Tepat! Bilangannya ${secret}. Kamu butuh ${tries.length} tebakan. Bandingkan dengan strategi lain di bawah.`;
        finishCompare();
      } else {
        status.textContent = `${g} terlalu ${res === 'up' ? 'kecil' : 'besar'}. Tebakan ke-${tries.length}.`;
      }
      input.value = '';
      input.focus();
    };
    guessBtn.addEventListener('click', guess);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); guess(); } });
    showBtn.addEventListener('click', () => {
      const steps = binary(secret);
      rowsEl.innerHTML = '';
      showBtn.disabled = true;
      let k = 0;
      clearInterval(timer);
      timer = setInterval(() => {
        const s = steps[k];
        rowsEl.insertAdjacentHTML('beforeend', `<tr><td class="num">${k + 1}</td><td>${s.lo}–${s.hi}</td><td class="num">${s.mid}</td><td>${s.res}</td></tr>`);
        k += 1;
        if (k >= steps.length) {
          clearInterval(timer);
          showBtn.disabled = false;
          finishCompare();
          if (!done) status.textContent = `Strategi bagi dua menemukan ${secret} dalam ${steps.length} tebakan. Untuk 1–${MAX}, bagi dua tidak pernah butuh lebih dari ${Math.ceil(Math.log2(MAX + 1))} tebakan.`;
        }
      }, motionOK ? 450 : 100);
    });
    $('[data-gl-new]', lab).addEventListener('click', newGame);
    newGame();
  });

  /* ---------- 30. Lab pengujian: kasus uji, cakupan, bug, dan uji ulang ---------- */
  const TEST_SCENARIOS = {
    predikat: {
      spec: (n) => (n < 0 || n > 100 ? 'Tidak valid' : n >= 90 ? 'A' : n >= 80 ? 'B' : n >= 70 ? 'C' : 'D'),
      v1: (n) => (n > 100 ? 'Tidak valid' : n >= 90 ? 'A' : n > 80 ? 'B' : n >= 70 ? 'C' : 'D'),
      bugs: [
        { id: 'batas', hit: (n) => n === 80, text: 'Nilai 80 menghasilkan C, padahal seharusnya B. Penyebabnya tanda > yang seharusnya ≥.' },
        { id: 'negatif', hit: (n) => n < 0, text: 'Nilai negatif dianggap D, padahal seharusnya tidak valid. Program lupa memeriksa nilai < 0.' },
      ],
      classes: [
        { label: 'Tidak valid', hit: (n) => n < 0 || n > 100 },
        { label: 'A (90–100)', hit: (n) => n >= 90 && n <= 100 },
        { label: 'B (80–89)', hit: (n) => n >= 80 && n < 90 },
        { label: 'C (70–79)', hit: (n) => n >= 70 && n < 80 },
        { label: 'D (0–69)', hit: (n) => n >= 0 && n < 70 },
      ],
      bounds: [0, 70, 80, 90, 100],
    },
  };
  $$('[data-test-lab]').forEach((lab) => {
    const sc = TEST_SCENARIOS[lab.dataset.testLab];
    if (!sc) return;
    const input = $('[data-tc-input]', lab);
    const expectSel = $('[data-tc-expect]', lab);
    const rowsEl = $('[data-tc-rows]', lab);
    const status = $('[data-tc-status]', lab);
    const covEl = $('[data-tc-coverage]', lab);
    const bugsEl = $('[data-tc-bugs]', lab);
    const fixBtn = $('[data-tc-fix]', lab);
    let cases = [];
    let version = 1;
    const run = (n) => (version === 1 ? sc.v1(n) : sc.spec(n));

    const render = () => {
      const found = new Set();
      rowsEl.innerHTML = cases.map((c, idx) => {
        const actual = run(c.n);
        const oracleOK = c.expect === sc.spec(c.n);
        let cls; let label;
        if (!oracleOK) { cls = 'is-warn'; label = 'Cek harapan'; }
        else if (actual === c.expect) { cls = 'is-ok'; label = 'Lolos'; }
        else {
          cls = 'is-bad'; label = 'Gagal';
          sc.bugs.forEach((b) => { if (b.hit(c.n)) found.add(b.id); });
        }
        return `<tr class="${cls}"><td class="num">${idx + 1}</td><td class="num">${numID.format(c.n)}</td><td>${escapeHTML(c.expect)}</td><td>${escapeHTML(actual)}</td><td><span class="tc-badge ${cls}">${label}</span></td><td><button type="button" class="rb-del tc-del" data-tc-del="${idx}" aria-label="Hapus kasus uji ${idx + 1}"><i class="bi bi-x-lg" aria-hidden="true"></i></button></td></tr>`;
      }).join('') || '<tr><td colspan="6" class="tc-empty">Belum ada kasus uji. Tambahkan di atas.</td></tr>';
      lab.dataset.found = [...found].join(',');
      const covered = sc.classes.map((k) => cases.some((c) => k.hit(c.n)));
      const bounds = sc.bounds.map((b) => cases.some((c) => c.n === b));
      covEl.innerHTML = `<p class="lab-label">Kelas data yang sudah diuji (${covered.filter(Boolean).length}/${covered.length})</p>
        <ul class="tc-chips">${sc.classes.map((k, i) => `<li class="${covered[i] ? 'is-on' : ''}"><i class="bi ${covered[i] ? 'bi-check-circle-fill' : 'bi-circle'}" aria-hidden="true"></i> ${k.label}</li>`).join('')}</ul>
        <p class="lab-label">Nilai batas yang sudah diuji (${bounds.filter(Boolean).length}/${bounds.length})</p>
        <ul class="tc-chips">${sc.bounds.map((b, i) => `<li class="${bounds[i] ? 'is-on' : ''}"><i class="bi ${bounds[i] ? 'bi-check-circle-fill' : 'bi-circle'}" aria-hidden="true"></i> ${b}</li>`).join('')}</ul>`;
      bugsEl.innerHTML = `<p class="lab-label">Bug ditemukan: ${found.size} dari ${sc.bugs.length}</p>` + sc.bugs.map((b) => (found.has(b.id) || version === 2
        ? `<p class="tc-bug${version === 2 ? ' is-fixed' : ''}"><i class="bi ${version === 2 ? 'bi-patch-check-fill' : 'bi-bug-fill'}" aria-hidden="true"></i> ${version === 2 ? '<strong>Sudah diperbaiki:</strong> ' : ''}${b.text}</p>`
        : '<p class="tc-bug is-hidden"><i class="bi bi-question-circle" aria-hidden="true"></i> Bug tersembunyi… kasus uji mana yang bisa menemukannya?</p>')).join('');
      fixBtn.hidden = version === 2 || found.size < sc.bugs.length;
      $$('[data-tc-version]', lab).forEach((el) => { el.hidden = Number(el.dataset.tcVersion) !== version; });
      $('[data-tc-vlabel]', lab).textContent = version === 1 ? 'Program versi 1' : 'Program versi 2 (sudah diperbaiki)';
    };
    const say = (t) => { status.textContent = t; };
    $('[data-tc-add]', lab).addEventListener('click', () => {
      const raw = input.value.trim().replace(',', '.');
      const n = Number(raw);
      if (raw === '' || Number.isNaN(n)) { say('Isi dulu nilai masukan untuk kasus uji.'); return; }
      if (cases.length >= 15) { say('Paling banyak 15 kasus uji. Pilih kasus uji yang paling bermakna!'); return; }
      if (cases.some((c) => c.n === n)) { say(`Nilai ${numID.format(n)} sudah diuji. Kasus uji yang sama tidak menambah informasi baru.`); return; }
      cases.push({ n, expect: expectSel.value });
      const c = cases[cases.length - 1];
      const actual = run(n);
      render();
      if (c.expect !== sc.spec(n)) say(`Menurut aturan, nilai ${numID.format(n)} seharusnya "${sc.spec(n)}", bukan "${c.expect}". Kasus uji harus memakai harapan yang benar!`);
      else if (actual === c.expect) say(`Kasus uji ${cases.length} lolos.`);
      else say(`Kasus uji ${cases.length} GAGAL! Harapan "${c.expect}", tetapi program menghasilkan "${actual}". Kamu menemukan bug!`);
      input.value = '';
      input.focus();
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('[data-tc-add]', lab).click(); } });
    rowsEl.addEventListener('click', (e) => {
      const del = e.target.closest('[data-tc-del]');
      if (!del) return;
      cases.splice(Number(del.dataset.tcDel), 1);
      render();
    });
    fixBtn.addEventListener('click', () => {
      version = 2;
      render();
      const valid = cases.filter((c) => c.expect === sc.spec(c.n));
      const fails = valid.filter((c) => run(c.n) !== c.expect).length;
      const wrong = cases.length - valid.length;
      say(fails ? `Uji ulang: masih ada ${fails} kasus yang gagal.` : `Uji ulang (regresi): ${valid.length} kasus uji dijalankan lagi pada versi 2, dan semuanya lolos. Perbaikan berhasil tanpa merusak bagian lain!${wrong ? ` (${wrong} kasus uji masih memakai harapan yang keliru. Perbaiki atau hapus.)` : ''}`);
    });
    $('[data-tc-reset]', lab).addEventListener('click', () => {
      cases = [];
      version = 1;
      render();
      say('Semua kasus uji dihapus. Program kembali ke versi 1.');
    });
    render();
  });

  /* ---------- 31. Jendela kamera: ukuran shot, aturan sepertiga, dan misi ----------
     <div data-camera-lab> berisi <svg data-cam-svg> (pemandangan 1600×900, subjek di x = 800),
     input radio name=…[data-cam-shot], [data-cam-pos], [data-cam-grid], [data-cam-mission], [data-cam-check] */
  $$('[data-camera-lab]').forEach((lab) => {
    const svg = $('[data-cam-svg]', lab);
    const frame = $('.cam-frame', lab);
    const info = $('[data-cam-info]', lab);
    const result = $('[data-cam-result]', lab);
    const missionSel = $('[data-cam-mission]', lab);
    const SUBJECT_X = 800;
    const SHOTS = {
      els: { name: 'Extreme long shot (ELS)', h: 900, cy: 450, use: 'Memperkenalkan lokasi. Tokoh terlihat kecil di tengah lingkungannya.' },
      ls: { name: 'Long shot (LS)', h: 560, cy: 515, use: 'Seluruh tubuh tokoh terlihat dari kepala sampai kaki, beserta sedikit lingkungan. Cocok untuk menunjukkan gerakan.' },
      ms: { name: 'Medium shot (MS)', h: 330, cy: 420, use: 'Tokoh terlihat dari pinggang ke atas. Paling sering dipakai untuk wawancara dan percakapan.' },
      cu: { name: 'Close up (CU)', h: 180, cy: 350, use: 'Wajah dan bahu memenuhi layar. Cocok untuk memperlihatkan ekspresi dan perasaan.' },
      ecu: { name: 'Extreme close up (ECU)', h: 72, cy: 326, use: 'Satu bagian kecil, misalnya mata. Memberi kesan dramatis atau menunjukkan detail.' },
    };
    const POS = { kiri: 1 / 3, tengah: 1 / 2, kanan: 2 / 3 };
    const MISSIONS = {
      lokasi: { shots: ['els'], text: 'Perkenalkan suasana sekolah kepada penonton.' },
      jalan: { shots: ['ls'], text: 'Tunjukkan seluruh tubuh murid yang sedang berjalan.' },
      wawancara: { shots: ['ms'], thirds: true, text: 'Rekam murid yang diwawancarai sambil menggerakkan tangan.' },
      ekspresi: { shots: ['cu'], text: 'Perlihatkan ekspresi senang di wajah murid.' },
      detail: { shots: ['ecu'], text: 'Tunjukkan detail mata yang sedang fokus membaca.' },
    };
    const value = (name) => ($(`input[data-cam-${name}]:checked`, lab) || {}).value;
    let current = [0, 0, 1600, 900];
    let anim = null;
    const target = () => {
      const s = SHOTS[value('shot')];
      const h = s.h;
      const w = (h * 16) / 9;
      const x = value('shot') === 'els' ? 0 : SUBJECT_X - w * POS[value('pos')];
      return [x, s.cy - h / 2, w, h];
    };
    const animate = (to) => {
      cancelAnimationFrame(anim);
      const from = current.slice();
      const t0 = performance.now();
      const dur = motionOK ? 350 : 0;
      const tick = (now) => {
        const k = dur ? Math.min(1, (now - t0) / dur) : 1;
        const e = 1 - (1 - k) ** 3;
        current = from.map((v, i) => v + (to[i] - v) * e);
        svg.setAttribute('viewBox', current.map((n) => n.toFixed(1)).join(' '));
        if (k < 1) anim = requestAnimationFrame(tick);
      };
      anim = requestAnimationFrame(tick);
    };
    const render = () => {
      const shot = value('shot');
      const pos = value('pos');
      frame.classList.toggle('show-grid', $('[data-cam-grid]', lab).checked);
      animate(target());
      const s = SHOTS[shot];
      const comp = shot === 'els'
        ? 'Pada shot sangat lebar ini, posisi subjek tidak terlalu berpengaruh.'
        : pos === 'tengah'
          ? 'Subjek di tengah: terkesan resmi dan simetris, tetapi sering terasa kaku.'
          : `Subjek di garis sepertiga ${pos}: komposisi lebih dinamis dan enak dilihat. Sisakan ruang kosong di arah pandangan subjek.`;
      info.innerHTML = `<p><strong>${s.name}</strong>: ${s.use}</p><p>${comp}</p>`;
      result.textContent = '';
      result.className = 'tool-status';
    };
    lab.addEventListener('change', (e) => { if (!e.target.matches('[data-cam-mission]')) render(); else { result.textContent = ''; } });
    $('[data-cam-check]', lab).addEventListener('click', () => {
      const m = MISSIONS[missionSel.value];
      const shot = value('shot');
      const okShot = m.shots.includes(shot);
      const okPos = !m.thirds || value('pos') !== 'tengah';
      result.className = `tool-status ${okShot && okPos ? 'is-ok' : 'is-bad'}`;
      if (okShot && okPos) result.textContent = `Tepat! ${SHOTS[shot].name} cocok untuk misi ini.`;
      else if (!okShot) result.textContent = `Belum tepat. Untuk "${m.text}" coba ukuran shot lain. Ukuran shot sekarang: ${SHOTS[shot].name}.`;
      else result.textContent = 'Ukuran shot sudah tepat. Untuk wawancara, letakkan subjek di garis sepertiga, bukan di tengah.';
    });
    current = target();
    svg.setAttribute('viewBox', current.join(' '));
    render();
  });

  /* ---------- 32. Meja editing: trimming dan cutting pada linimasa ---------- */
  $$('[data-timeline-lab]').forEach((lab) => {
    const SRC = 20;
    const SEGS = [
      { s: 0, e: 2, bad: true, icon: 'bi-camera-video-off', label: 'Kamera masih goyang', id: 'awal' },
      { s: 2, e: 5, icon: 'bi-hand-thumbs-up', label: '"Halo, kami dari VIII-A!"' },
      { s: 5, e: 9, icon: 'bi-mic', label: 'Wawancara Pak Darto (bagian 1)' },
      { s: 9, e: 11, bad: true, icon: 'bi-emoji-laughing', label: 'Salah ucap, semua tertawa', id: 'tengah' },
      { s: 11, e: 16, icon: 'bi-mic', label: 'Wawancara Pak Darto (bagian 2)' },
      { s: 16, e: 18, icon: 'bi-stars', label: '"Terima kasih, sampai jumpa!"' },
      { s: 18, e: 20, bad: true, icon: 'bi-moon', label: 'Layar gelap, lupa mematikan kamera', id: 'akhir' },
    ];
    const track = $('[data-tl-track]', lab);
    const head = $('[data-tl-head]', lab);
    const play = $('[data-tl-play]', lab);
    const trimIn = $('[data-tl-trim="in"]', lab);
    const trimOut = $('[data-tl-trim="out"]', lab);
    const monitor = $('[data-tl-monitor]', lab);
    const status = $('[data-tl-status]', lab);
    const fb = $('[data-tl-feedback]', lab);
    const scoreEl = $('[data-tl-score]', lab);
    const durEl = $('[data-tl-dur]', lab);
    const playBtn = $('[data-tl-run]', lab);
    let pieces; let selected = -1; let timer = null;
    const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}${t % 1 ? ',5' : ''}`;

    const effective = () => {
      const a = Number(trimIn.value);
      const b = Number(trimOut.value);
      return pieces.map((p, idx) => ({ s: Math.max(p.s, a), e: Math.min(p.e, b), idx })).filter((p) => p.e - p.s > 0.01);
    };
    const total = () => effective().reduce((n, p) => n + (p.e - p.s), 0);
    const toSource = (t) => {
      let acc = 0;
      for (const p of effective()) {
        const d = p.e - p.s;
        if (t < acc + d - 1e-9) return { src: p.s + (t - acc), piece: p };
        acc += d;
      }
      return null;
    };
    const segAt = (src) => SEGS.find((g) => src >= g.s && src < g.e);
    const render = () => {
      const eff = effective();
      const tot = total();
      track.innerHTML = eff.map((p) => {
        const parts = SEGS.map((g) => {
          const s = Math.max(g.s, p.s); const e = Math.min(g.e, p.e);
          return e - s > 0.01 ? `<span class="tl-part${g.bad ? ' is-bad' : ''}" style="flex:${e - s}" title="${escapeHTML(g.label)}"><i class="bi ${g.icon}" aria-hidden="true"></i></span>` : '';
        }).join('');
        return `<button type="button" class="tl-piece${p.idx === selected ? ' is-selected' : ''}" style="width:${((p.e - p.s) / SRC) * 100}%" data-piece="${p.idx}" aria-pressed="${p.idx === selected}" aria-label="Potongan ${fmt(p.s)} sampai ${fmt(p.e)}">${parts}</button>`;
      }).join('');
      play.max = String(tot);
      if (Number(play.value) > tot) play.value = String(tot);
      durEl.textContent = `${numID.format(tot)} detik`;
      placeHead();
      judge();
    };
    const placeHead = () => {
      const t = Number(play.value);
      head.style.left = `${(t / SRC) * 100}%`;
      const at = toSource(t);
      const g = at && segAt(at.src);
      monitor.className = `tl-monitor${g && g.bad ? ' is-bad' : ''}`;
      monitor.innerHTML = g
        ? `<i class="bi ${g.icon}" aria-hidden="true"></i><span>${escapeHTML(g.label)}</span><small>Waktu klip ${fmt(t)} · sumber ${fmt(at.src)}</small>`
        : '<i class="bi bi-film" aria-hidden="true"></i><span>Akhir video</span><small>Tidak ada gambar lagi</small>';
    };
    const kept = (g) => effective().reduce((n, p) => n + Math.max(0, Math.min(g.e, p.e) - Math.max(g.s, p.s)), 0);
    const judge = () => {
      const row = (ok, text) => `<li class="${ok ? 'is-ok' : 'is-bad'}"><i class="bi ${ok ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}" aria-hidden="true"></i><span>${text}</span></li>`;
      const gone = (id) => kept(SEGS.find((g) => g.id === id)) < 0.01;
      const good = SEGS.filter((g) => !g.bad).every((g) => kept(g) > g.e - g.s - 0.01);
      const checks = [
        [gone('awal'), 'Bagian awal yang goyang (0:00–0:02) sudah dipangkas.'],
        [gone('tengah'), 'Salah ucap di tengah (0:09–0:11) sudah dipotong.'],
        [gone('akhir'), 'Layar gelap di akhir (0:18–0:20) sudah dipangkas.'],
        [good, good ? 'Semua bagian penting masih utuh.' : 'Ada bagian penting yang ikut terpotong! Kembalikan atau atur ulang.'],
      ];
      const n = checks.filter(([ok]) => ok).length;
      fb.innerHTML = checks.map(([ok, t]) => row(ok, t)).join('');
      scoreEl.textContent = `${n} / 4`;
      scoreEl.className = `dl-score ${n === 4 ? 'is-ok' : n >= 2 ? 'is-warn' : 'is-bad'}`;
      if (n === 4) status.textContent = `Hebat! Video 20 detik menjadi ${numID.format(total())} detik tanpa bagian yang mengganggu. Tekan Putar untuk menonton hasilnya.`;
    };
    const stop = () => { clearInterval(timer); timer = null; playBtn.innerHTML = '<i class="bi bi-play-fill" aria-hidden="true"></i> Putar'; };
    const reset = () => {
      stop();
      pieces = [{ s: 0, e: SRC }];
      selected = -1;
      trimIn.value = '0';
      trimOut.value = String(SRC);
      play.value = '0';
      status.textContent = 'Klip asli berdurasi 20 detik. Tonton dulu dengan menggeser playhead atau menekan Putar.';
      render();
    };
    trimIn.addEventListener('input', () => {
      if (Number(trimIn.value) > Number(trimOut.value) - 1) trimIn.value = String(Number(trimOut.value) - 1);
      status.textContent = `Trimming: awal klip dipangkas sampai detik ${numID.format(Number(trimIn.value))}.`;
      render();
    });
    trimOut.addEventListener('input', () => {
      if (Number(trimOut.value) < Number(trimIn.value) + 1) trimOut.value = String(Number(trimIn.value) + 1);
      status.textContent = `Trimming: akhir klip dipangkas di detik ${numID.format(Number(trimOut.value))}.`;
      render();
    });
    play.addEventListener('input', () => { stop(); placeHead(); });
    track.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-piece]');
      if (!btn) return;
      selected = Number(btn.dataset.piece);
      const p = pieces[selected];
      status.textContent = `Potongan ${fmt(p.s)}–${fmt(p.e)} dipilih. Tekan "Hapus potongan" untuk membuangnya.`;
      render();
    });
    $('[data-tl-split]', lab).addEventListener('click', () => {
      const at = toSource(Number(play.value));
      if (!at) { status.textContent = 'Geser playhead ke dalam klip dulu.'; return; }
      const p = pieces[at.piece.idx];
      const s = Math.round(at.src * 2) / 2;
      if (s - p.s < 0.25 || p.e - s < 0.25) { status.textContent = 'Playhead tepat di ujung potongan, jadi tidak perlu dibelah di sini.'; return; }
      pieces.splice(at.piece.idx, 1, { s: p.s, e: s }, { s, e: p.e });
      selected = -1;
      status.textContent = `Cutting: klip dibelah di detik sumber ${fmt(s)}. Sekarang klik potongan yang ingin dibuang.`;
      render();
    });
    $('[data-tl-delete]', lab).addEventListener('click', () => {
      if (selected < 0 || !pieces[selected]) { status.textContent = 'Klik dulu potongan yang ingin dihapus.'; return; }
      if (pieces.length === 1) { status.textContent = 'Ini potongan terakhir. Belah dulu klipnya, lalu hapus bagian yang tidak perlu.'; return; }
      const p = pieces.splice(selected, 1)[0];
      selected = -1;
      play.value = '0';
      status.textContent = `Potongan ${fmt(p.s)}–${fmt(p.e)} dihapus. Potongan sesudahnya otomatis bergeser rapat (ripple).`;
      render();
    });
    playBtn.addEventListener('click', () => {
      if (timer) { stop(); return; }
      if (Number(play.value) >= total() - 0.01) play.value = '0';
      playBtn.innerHTML = '<i class="bi bi-pause-fill" aria-hidden="true"></i> Jeda';
      timer = setInterval(() => {
        const t = Math.min(total(), Number(play.value) + 0.5);
        play.value = String(t);
        placeHead();
        if (t >= total() - 0.01) stop();
      }, 250);
    });
    $('[data-tl-reset]', lab).addEventListener('click', reset);
    reset();
  });

  /* ---------- 33. Meja mixing: volume lapisan audio, fade, ducking, clipping ---------- */
  $$('[data-mixer-lab]').forEach((lab) => {
    const LEN = 20;
    const BARS = 80;
    const SPEECH = [[3, 8], [9, 13], [14, 17]];
    const FX = [[1, 1.6], [18.2, 18.8]];
    const inside = (t, list) => list.some(([a, b]) => t >= a && t < b);
    const TRACKS = [
      { key: 'narasi', label: 'Narasi', base: 0.6, env: (t) => (inside(t, SPEECH) ? 0.55 + 0.45 * Math.abs(Math.sin(t * 7.3)) : 0) },
      { key: 'musik', label: 'Musik latar', base: 0.5, env: (t) => 0.82 + 0.18 * Math.abs(Math.sin(t * 2.1)) },
      { key: 'sekitar', label: 'Suara sekitar', base: 0.3, env: (t) => 0.7 + 0.3 * Math.abs(Math.sin(t * 13.7 + 1)) },
      { key: 'efek', label: 'Efek bel', base: 0.5, env: (t) => (inside(t, FX) ? 1 : 0) },
    ];
    const lanes = $('[data-mx-lanes]', lab);
    const fb = $('[data-mx-feedback]', lab);
    const scoreEl = $('[data-mx-score]', lab);
    const status = $('[data-mx-status]', lab);
    const listenBtn = $('[data-mx-listen]', lab);
    const vol = (k) => Number($(`[data-mx="${k}"]`, lab).value) / 100;
    const opt = (k) => $(`[data-mx-opt="${k}"]`, lab).checked;
    const fadeEnv = (t) => (!opt('fade') ? 1 : t < 2 ? t / 2 : t > LEN - 2 ? Math.max(0, (LEN - t) / 2) : 1);
    const duckEnv = (t) => (opt('duck') && inside(t, SPEECH) ? 0.35 : 1);
    const amp = (tr, t) => {
      let a = vol(tr.key) * tr.base * tr.env(t);
      if (tr.key === 'musik') a *= fadeEnv(t) * duckEnv(t);
      return a;
    };
    let audio = null;

    const render = () => {
      $$('[data-mx]', lab).forEach((r) => { const o = $(`[data-mx-out="${r.dataset.mx}"]`, lab); if (o) o.textContent = `${r.value}%`; });
      const W = 400; const H = 36; const bw = W / BARS;
      let peak = 0;
      const master = Array.from({ length: BARS }, (_, i) => TRACKS.reduce((n, tr) => n + amp(tr, (i + 0.5) * (LEN / BARS)), 0));
      master.forEach((m) => { peak = Math.max(peak, m); });
      const lane = (label, vals, cls, clipLine) => `<div class="mx-lane ${cls}"><span>${label}</span><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${vals.map((v, i) => {
        const h = Math.min(H, v * H);
        return `<rect x="${(i * bw + 0.5).toFixed(1)}" y="${((H - h) / 2).toFixed(1)}" width="${(bw - 1).toFixed(1)}" height="${h.toFixed(1)}"${clipLine && v > 1 ? ' class="is-clip"' : ''}/>`;
      }).join('')}${clipLine ? `<line x1="0" x2="${W}" y1="0.5" y2="0.5"/><line x1="0" x2="${W}" y1="${H - 0.5}" y2="${H - 0.5}"/>` : ''}</svg></div>`;
      lanes.innerHTML = TRACKS.map((tr) => lane(tr.label, Array.from({ length: BARS }, (_, i) => amp(tr, (i + 0.5) * (LEN / BARS))), `is-${tr.key}`, false)).join('')
        + lane('Hasil campuran', master, 'is-master', true) + '<span class="mx-head" data-mx-head></span>';

      const narr = vol('narasi') * 0.6;
      const musicDuring = vol('musik') * 0.5 * (opt('duck') ? 0.35 : 1);
      const amb = vol('sekitar');
      const checks = [
        [narr >= 1.5 * (musicDuring + amb * 0.3) && narr > 0.3, 'Narasi paling jelas dibanding lapisan lain.', 'Narasi kurang jelas. Naikkan volume narasi atau turunkan lapisan lain.'],
        [musicDuring <= narr * 0.5, 'Musik tidak menenggelamkan narasi.', 'Musik terlalu keras saat ada narasi. Turunkan volumenya atau aktifkan ducking.'],
        [peak <= 1, 'Hasil campuran tidak pecah (tidak clipping).', `Suara pecah (clipping)! Gabungan volume melewati batas di beberapa bagian (puncak ${Math.round(peak * 100)}%).`],
        [opt('fade'), 'Musik muncul dan hilang perlahan (fade in dan fade out).', 'Musik mulai dan berhenti mendadak. Aktifkan fade in dan fade out.'],
        [amb >= 0.1 && amb <= 0.4, 'Suara sekitar secukupnya: suasana terasa nyata tanpa mengganggu.', amb < 0.1 ? 'Suara sekitar hilang sama sekali, sehingga suasana terasa kosong. Sisakan sedikit (10–40%).' : 'Suara sekitar terlalu ramai. Turunkan menjadi 10–40%.'],
      ];
      const n = checks.filter(([ok]) => ok).length;
      fb.innerHTML = checks.map(([ok, yes, no]) => `<li class="${ok ? 'is-ok' : 'is-bad'}"><i class="bi ${ok ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}" aria-hidden="true"></i><span>${ok ? yes : no}</span></li>`).join('');
      scoreEl.textContent = `${n} / 5`;
      scoreEl.className = `dl-score ${n === 5 ? 'is-ok' : n >= 3 ? 'is-warn' : 'is-bad'}`;
    };

    /* Mendengarkan hasil campuran: musik, suara sekitar, dan bel dibuat dengan Web Audio;
       narasi dibacakan oleh suara sintetis peramban (jika tersedia). */
    const stopAudio = () => {
      if (!audio) return;
      audio.timers.forEach(clearTimeout);
      clearInterval(audio.tick);
      try { audio.ctx.close(); } catch (e) { /* abaikan */ }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      audio = null;
      listenBtn.innerHTML = '<i class="bi bi-headphones" aria-hidden="true"></i> Dengarkan hasil mix';
      const h = $('[data-mx-head]', lab); if (h) h.style.display = 'none';
    };
    const listen = () => {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { status.textContent = 'Peramban ini belum mendukung pemutaran suara buatan. Lihat gelombang suaranya saja, ya.'; return; }
      const ctx = new AC();
      const t0 = ctx.currentTime + 0.1;
      const out = ctx.createGain();
      out.gain.value = 0.9;
      out.connect(ctx.destination);
      // Musik: arpeggio sederhana
      const music = ctx.createGain();
      music.connect(out);
      const mv = vol('musik') * 0.22;
      music.gain.setValueAtTime(opt('fade') ? 0 : mv, t0);
      if (opt('fade')) { music.gain.linearRampToValueAtTime(mv, t0 + 2); music.gain.setValueAtTime(mv, t0 + LEN - 2); music.gain.linearRampToValueAtTime(0, t0 + LEN); }
      if (opt('duck')) SPEECH.forEach(([a, b]) => { music.gain.setValueAtTime(mv, t0 + a - 0.2); music.gain.linearRampToValueAtTime(mv * 0.35, t0 + a); music.gain.setValueAtTime(mv * 0.35, t0 + b); music.gain.linearRampToValueAtTime(mv, t0 + b + 0.3); });
      const chords = [[261.6, 329.6, 392], [196, 246.9, 293.7], [220, 261.6, 329.6], [174.6, 220, 261.6]];
      for (let k = 0; k < LEN * 4; k += 1) {
        const f = chords[Math.floor(k / 8) % 4][k % 3];
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = f;
        const st = t0 + k * 0.25;
        g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(1, st + 0.02); g.gain.exponentialRampToValueAtTime(0.001, st + 0.24);
        o.connect(g); g.connect(music); o.start(st); o.stop(st + 0.25);
      }
      // Suara sekitar: derau yang diredam
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
      const ng = ctx.createGain(); ng.gain.value = vol('sekitar') * 0.12;
      noise.connect(lp); lp.connect(ng); ng.connect(out); noise.start(t0); noise.stop(t0 + LEN);
      // Efek bel
      FX.forEach(([a]) => [880, 1320].forEach((f) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.frequency.value = f; g.gain.setValueAtTime(vol('efek') * 0.25, t0 + a); g.gain.exponentialRampToValueAtTime(0.001, t0 + a + 0.9);
        o.connect(g); g.connect(out); o.start(t0 + a); o.stop(t0 + a + 1);
      }));
      audio = { ctx, timers: [], tick: 0 };
      const lines = ['Selamat datang di SMP Negeri 1 Bandar Seikijang.', 'Hari ini kami mengajak kamu berkeliling sekolah.', 'Ayo, kita mulai dari perpustakaan!'];
      if ('speechSynthesis' in window && vol('narasi') > 0) {
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find((v) => /^id/i.test(v.lang)) || null;
        SPEECH.forEach(([a], i) => audio.timers.push(setTimeout(() => {
          const u = new SpeechSynthesisUtterance(lines[i]);
          u.lang = 'id-ID'; if (voice) u.voice = voice; u.volume = Math.min(1, vol('narasi')); u.rate = 1.05;
          window.speechSynthesis.speak(u);
        }, (a + 0.1) * 1000)));
      }
      audio.timers.push(setTimeout(stopAudio, (LEN + 0.3) * 1000));
      const start = performance.now();
      const tick = () => {
        const headEl = $('[data-mx-head]', lab);
        const p = Math.min(1, (performance.now() - start) / (LEN * 1000));
        if (headEl) { headEl.style.display = 'block'; headEl.style.left = `calc(10px + var(--mx-label) + (100% - 20px - var(--mx-label)) * ${p.toFixed(4)})`; }
      };
      tick();
      audio.tick = setInterval(tick, 100);
      listenBtn.innerHTML = '<i class="bi bi-stop-fill" aria-hidden="true"></i> Berhenti';
      status.textContent = 'Memutar hasil mix selama 20 detik. Perhatikan apakah narasi terdengar jelas.';
    };
    listenBtn.addEventListener('click', () => (audio ? stopAudio() : listen()));
    lab.addEventListener('input', () => { if (audio) stopAudio(); render(); });
    lab.addEventListener('change', () => { if (audio) stopAudio(); render(); });
    $('[data-mx-reset]', lab).addEventListener('click', () => {
      stopAudio();
      $$('[data-mx]', lab).forEach((r) => { r.value = r.defaultValue; });
      $$('[data-mx-opt]', lab).forEach((c) => { c.checked = false; });
      status.textContent = 'Kembali ke campuran awal yang masih berantakan.';
      render();
    });
    render();
  });

  /* ---------- 34. Pemilih aplikasi: perangkat + jenis karya + internet ---------- */
  $$('[data-app-picker]').forEach((box) => {
    const out = $('[data-ap-out]', box);
    const pathEl = $('[data-ap-path]', box);
    const val = (n) => ($(`input[name="${n}"]:checked`, box) || {}).value;
    const LABEL = { hp: 'HP', laptop: 'Laptop', web: 'Lab/Chromebook', video: 'Video', audio: 'Audio', lancar: 'Lancar', terbatas: 'Terbatas' };
    const APPS = {
      capcutHP: { name: 'CapCut (HP)', icon: 'bi-phone', why: ['Mudah dipakai dengan jari.', 'Fitur lengkap: potong, teks, musik, dan teks otomatis.', 'Setelah terpasang, sebagian besar fitur bisa dipakai tanpa internet.'] },
      capcutPC: { name: 'CapCut (komputer)', icon: 'bi-laptop', why: ['Layar lebar sehingga linimasa lebih mudah diatur.', 'Bisa memakai mouse dan pintasan papan ketik.'] },
      clipchampPC: { name: 'Clipchamp', icon: 'bi-windows', why: ['Sudah tersedia di banyak komputer Windows atau bisa dibuka di peramban.', 'Tampilannya sederhana dan cocok untuk pemula.'] },
      audacity: { name: 'Audacity', icon: 'bi-soundwave', why: ['Gratis dan khusus untuk mengolah suara.', 'Punya fitur pengurang derau, fade, dan pengatur volume.', 'Bisa dipakai tanpa internet.'] },
      recorderHP: { name: 'Perekam suara bawaan HP + CapCut', icon: 'bi-mic', why: ['Rekam dengan aplikasi perekam suara di HP.', 'Potong dan atur volumenya di CapCut, lalu tambahkan gambar sampul.'] },
      webEditor: { name: 'Clipchamp atau Canva (versi web)', icon: 'bi-globe', why: ['Tidak perlu memasang aplikasi, cukup buka peramban.', 'Proyek tersimpan di akun, sehingga bisa dilanjutkan di komputer lain.'] },
    };
    const render = () => {
      const d = val('ap-device'); const k = val('ap-kind'); const n = val('ap-net');
      let main; let alt = null;
      if (k === 'video') {
        if (d === 'hp') main = APPS.capcutHP;
        else if (d === 'laptop') { main = APPS.capcutPC; alt = APPS.clipchampPC; }
        else main = APPS.webEditor;
      } else if (d === 'laptop') { main = APPS.audacity; alt = APPS.clipchampPC; }
      else if (d === 'hp') main = APPS.recorderHP;
      else main = APPS.webEditor;
      const notes = [];
      if (n === 'terbatas' && d === 'web') notes.push('<strong>Hati-hati:</strong> alat berbasis web membutuhkan internet yang stabil sepanjang waktu. Kerjakan di laboratorium sekolah yang ada Wi-Fi, atau pilih aplikasi yang dipasang di perangkat.');
      else if (n === 'terbatas') notes.push('Unduh dan pasang aplikasinya saat ada Wi-Fi. Setelah itu, kamu bisa bekerja tanpa internet. Fitur seperti musik dan templat daring tetap memerlukan internet.');
      if (d === 'web' && k === 'audio') notes.push('Audacity tidak bisa dipasang di Chromebook. Alat web sudah cukup untuk memotong suara dan mengatur volume.');
      const card = (a, tag) => `<article class="ap-card${tag ? '' : ' is-main'}"><i class="bi ${a.icon}" aria-hidden="true"></i><div><p class="ap-tag">${tag || 'Pilihan utama'}</p><h4>${a.name}</h4><ul>${a.why.map((w) => `<li>${w}</li>`).join('')}</ul></div></article>`;
      out.innerHTML = card(main) + (alt ? card(alt, 'Pilihan lain') : '') + notes.map((t) => `<p class="ap-note"><i class="bi bi-info-circle" aria-hidden="true"></i><span>${t}</span></p>`).join('');
      pathEl.innerHTML = `<span class="pl"><b>JIKA</b> karya = ${LABEL[k]} <b>MAKA</b></span><span class="pl">    <b>JIKA</b> perangkat = ${LABEL[d]} <b>MAKA</b></span><span class="pl">        <b>PILIH</b> <i>${main.name.replace(' (versi web)', '').replace('Perekam suara bawaan HP', 'Perekam HP')}</i></span><span class="pl">    <b>AKHIR JIKA</b></span><span class="pl"><b>AKHIR JIKA</b></span><span class="pl"><b>CATATAN</b> internet: <i>${LABEL[n]}</i></span>`;
    };
    box.addEventListener('change', render);
    render();
  });

  /* ---------- 35. Penjelajah tampilan aplikasi: jelajahi bagian atau cari bagian ----------
     <div data-ui-explorer data-ui-tasks='[{"ask":"…","part":"pratinjau"}]'> berisi tombol
     [data-ui-part][data-ui-name][data-ui-desc], [data-ui-info], [data-ui-mode], [data-ui-prompt], [data-ui-score] */
  $$('[data-ui-explorer]').forEach((box) => {
    let tasks;
    try { tasks = JSON.parse(box.dataset.uiTasks || '[]'); } catch (e) { tasks = []; }
    const parts = $$('[data-ui-part]', box);
    const info = $('[data-ui-info]', box);
    const prompt = $('[data-ui-prompt]', box);
    const scoreEl = $('[data-ui-score]', box);
    let mode = 'explore'; let queue = []; let score = 0; let tries = 0;
    const flash = (el, cls) => { el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 700); };
    const setMode = (m) => {
      mode = m;
      $$('[data-ui-mode]', box).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.uiMode === m)));
      parts.forEach((p) => p.classList.remove('is-active'));
      box.classList.toggle('is-quiz', m === 'quiz');
      if (m === 'quiz') {
        queue = tasks.slice().sort(() => Math.random() - 0.5);
        score = 0; tries = 0;
        info.innerHTML = '<p>Baca pertanyaan di atas, lalu klik bagian tampilan yang benar.</p>';
        nextTask();
      } else {
        prompt.hidden = true;
        scoreEl.hidden = true;
        info.innerHTML = '<p>Klik salah satu bagian tampilan untuk mengenal namanya dan kegunaannya.</p>';
      }
    };
    const nextTask = () => {
      prompt.hidden = false;
      scoreEl.hidden = false;
      scoreEl.textContent = `${score} / ${tasks.length}`;
      if (!queue.length) {
        prompt.innerHTML = `<i class="bi bi-trophy" aria-hidden="true"></i> Selesai! Kamu menemukan ${score} dari ${tasks.length} bagian pada percobaan pertama.`;
        info.innerHTML = '<p>Tekan "Mode tantangan" lagi untuk mengulang dengan urutan berbeda.</p>';
        return;
      }
      tries = 0;
      prompt.innerHTML = `<i class="bi bi-search" aria-hidden="true"></i> ${escapeHTML(queue[0].ask)}`;
    };
    box.addEventListener('click', (e) => {
      const modeBtn = e.target.closest('[data-ui-mode]');
      if (modeBtn) { setMode(modeBtn.dataset.uiMode); return; }
      const part = e.target.closest('[data-ui-part]');
      if (!part) return;
      const name = part.dataset.uiName;
      if (mode === 'explore' || !queue.length) {
        parts.forEach((p) => p.classList.toggle('is-active', p === part));
        info.innerHTML = `<h4>${escapeHTML(name)}</h4><p>${escapeHTML(part.dataset.uiDesc)}</p>`;
        return;
      }
      const task = queue[0];
      if (part.dataset.uiPart === task.part) {
        if (tries === 0) score += 1;
        flash(part, 'is-correct');
        info.innerHTML = `<h4><i class="bi bi-check-circle-fill" aria-hidden="true"></i> Tepat, ini ${escapeHTML(name)}!</h4><p>${escapeHTML(part.dataset.uiDesc)}</p>`;
        queue.shift();
        nextTask();
      } else {
        tries += 1;
        flash(part, 'is-wrong');
        info.innerHTML = `<h4><i class="bi bi-x-circle-fill" aria-hidden="true"></i> Bukan, itu ${escapeHTML(name)}.</h4><p>Coba bagian lain.</p>`;
      }
    });
    setMode('explore');
  });

  /* ---------- 36. Kalkulator ekspor: perkiraan ukuran file video ---------- */
  $$('[data-export-calc]').forEach((box) => {
    const f = (n) => $(`[data-ex="${n}"]`, box);
    const sizeEl = $('[data-ex-out="size"]', box);
    const sendEl = $('[data-ex-out="send"]', box);
    const rateEl = $('[data-ex-out="rate"]', box);
    const fb = $('[data-ex-feedback]', box);
    const RATE = { 480: 2.5, 720: 5, 1080: 8, 2160: 35 };
    const FPS = { 24: 0.85, 30: 1, 60: 1.5 };
    const GOAL = {
      grup: { res: 720, fps: 30, text: 'dikirim ke grup kelas atau Google Classroom' },
      proyektor: { res: 1080, fps: 30, text: 'ditayangkan di proyektor atau TV' },
      arsip: { res: 1080, fps: 60, text: 'disimpan sebagai arsip berkualitas tinggi' },
    };
    const ORDER = [480, 720, 1080, 2160];
    const render = () => {
      const res = Number(f('res').value);
      const fps = Number(f('fps').value);
      const dur = Math.max(1, Math.min(1200, Number(f('dur').value) || 1));
      const goal = GOAL[f('goal').value];
      const mbps = RATE[res] * FPS[fps] + 0.128;
      const mb = (mbps * dur) / 8;
      sizeEl.textContent = mb >= 1000 ? `${numID.format(mb / 1000)} GB` : `${numID.format(Math.round(mb * 10) / 10)} MB`;
      const sec = (mb * 8) / 5;
      sendEl.textContent = sec < 60 ? `${Math.max(1, Math.round(sec))} detik` : `${numID.format(Math.round(sec / 6) / 10)} menit`;
      rateEl.textContent = `${numID.format(Math.round(mbps * 10) / 10)} Mbps`;
      const diff = ORDER.indexOf(res) - ORDER.indexOf(goal.res);
      const rows = [];
      const row = (cls, t) => rows.push(`<li class="${cls}"><i class="bi ${cls === 'is-ok' ? 'bi-check-circle-fill' : cls === 'is-warn' ? 'bi-exclamation-circle-fill' : 'bi-x-circle-fill'}" aria-hidden="true"></i><span>${t}</span></li>`);
      if (diff === 0) row('is-ok', `Resolusi ${res}p pas untuk video yang ${goal.text}.`);
      else if (diff < 0) row('is-bad', `Resolusi ${res}p kurang tajam untuk video yang ${goal.text}. Coba ${goal.res}p.`);
      else row('is-warn', `Resolusi ${res}p lebih tajam dari yang dibutuhkan, tetapi filenya jauh lebih besar. ${goal.res}p sudah cukup.`);
      if (fps === goal.fps || (fps === 30 && goal.fps === 60) || (fps === 24 && goal.fps === 30)) row('is-ok', `${fps} fps cocok. ${fps === 24 ? 'Kesannya seperti film bioskop.' : fps === 60 ? 'Gerakan terlihat sangat halus.' : 'Ini pilihan umum yang aman.'}`);
      else row('is-warn', `${fps} fps membuat file lebih besar tanpa banyak manfaat untuk tujuan ini. 30 fps sudah cukup.`);
      if (mb > 500) row('is-bad', 'Ukuran file sangat besar, sehingga boros kuota dan lama dikirim. Pendekkan durasinya atau turunkan resolusinya.');
      else if (mb > 150) row('is-warn', 'Ukuran file cukup besar. Kirim lewat Google Drive, bukan lewat aplikasi pesan.');
      else row('is-ok', 'Ukuran file wajar dan hemat kuota.');
      fb.innerHTML = rows.join('');
    };
    box.addEventListener('input', render);
    box.addEventListener('change', render);
    render();
  });

  /* ---------- 37. Perakit narasi persuasif: pancing, masalah, solusi, ajak ----------
     <div data-narrative-builder> berisi <script type="application/json" data-nb-data>
     {"parts":[["pancing","Pancingan"],…],"topics":{"air":{"label":"…","options":{"pancing":[{"t":"…","q":"good|weak|bad","why":"…"}]}}}} */
  $$('[data-narrative-builder]').forEach((box) => {
    let data;
    try { data = JSON.parse($('[data-nb-data]', box).textContent); } catch (e) { return; }
    const topicSel = $('[data-nb-topic]', box);
    const partsEl = $('[data-nb-parts]', box);
    const scriptEl = $('[data-nb-script]', box);
    const fb = $('[data-nb-feedback]', box);
    const scoreEl = $('[data-nb-score]', box);
    const metaEl = $('[data-nb-meta]', box);
    const id = box.id || 'nb';
    const POINT = { good: 2, weak: 1, bad: 0 };
    const ICON = { good: 'bi-check-circle-fill', weak: 'bi-exclamation-circle-fill', bad: 'bi-x-circle-fill' };
    const CLS = { good: 'is-ok', weak: 'is-warn', bad: 'is-bad' };
    topicSel.innerHTML = Object.entries(data.topics).map(([k, t]) => `<option value="${k}">${escapeHTML(t.label)}</option>`).join('');
    const buildParts = () => {
      const topic = data.topics[topicSel.value];
      partsEl.innerHTML = data.parts.map(([key, label], pi) => `
        <fieldset class="nb-part">
          <legend><span class="nb-step">${pi + 1}</span> ${escapeHTML(label)}</legend>
          ${topic.options[key].map((o, oi) => `<label class="nb-option"><input type="radio" name="${id}-${key}" value="${oi}"><span>${escapeHTML(o.t)}</span></label>`).join('')}
        </fieldset>`).join('');
      render();
    };
    const render = () => {
      const topic = data.topics[topicSel.value];
      let score = 0; let words = 0; let chosen = 0;
      const lines = []; const notes = [];
      data.parts.forEach(([key, label]) => {
        const r = $(`input[name="${id}-${key}"]:checked`, box);
        if (!r) { lines.push(`<p class="nb-line is-empty"><b>${escapeHTML(label)}</b><span>(belum dipilih)</span></p>`); return; }
        const o = topic.options[key][Number(r.value)];
        chosen += 1;
        score += POINT[o.q];
        words += o.t.split(/\s+/).filter(Boolean).length;
        lines.push(`<p class="nb-line ${CLS[o.q]}"><b>${escapeHTML(label)}</b><span>${escapeHTML(o.t)}</span></p>`);
        notes.push(`<li class="${CLS[o.q]}"><i class="bi ${ICON[o.q]}" aria-hidden="true"></i><span><strong>${escapeHTML(label)}:</strong> ${escapeHTML(o.why)}</span></li>`);
      });
      scriptEl.innerHTML = lines.join('');
      fb.innerHTML = notes.join('') || '<li class="is-warn"><i class="bi bi-hand-index" aria-hidden="true"></i><span>Pilih satu kalimat untuk setiap bagian.</span></li>';
      const max = data.parts.length * 2;
      scoreEl.textContent = `${score} / ${max}`;
      scoreEl.className = `dl-score ${score === max ? 'is-ok' : score >= max / 2 ? 'is-warn' : 'is-bad'}`;
      metaEl.textContent = chosen ? `${words} kata · perkiraan durasi dibacakan ${Math.max(1, Math.round(words / 2.5))} detik` : '';
    };
    topicSel.addEventListener('change', buildParts);
    partsEl.addEventListener('change', render);
    buildParts();
  });

  /* ---------- 38. Penata tempo (pacing): durasi setiap shot ----------
     <div data-pace-lab> berisi <script type="application/json" data-pl-data>
     {"min":25,"max":40,"shots":[{"label":"Pembuka","icon":"bi-…","text":"…","dur":12,"role":"hook|isi|ajakan"}]} */
  $$('[data-pace-lab]').forEach((box) => {
    let data;
    try { data = JSON.parse($('[data-pl-data]', box).textContent); } catch (e) { return; }
    const ctrls = $('[data-pl-controls]', box);
    const strip = $('[data-pl-strip]', box);
    const screen = $('[data-pl-screen]', box);
    const fb = $('[data-pl-feedback]', box);
    const scoreEl = $('[data-pl-score]', box);
    const totalEl = $('[data-pl-total]', box);
    const playBtn = $('[data-pl-play]', box);
    const words = (t) => (t ? t.split(/\s+/).filter(Boolean).length : 0);
    const need = (s) => (s.text ? Math.ceil((words(s.text) / 3 + 1) * 2) / 2 : 0);
    let timer = null;
    ctrls.innerHTML = data.shots.map((s, i) => `
      <div class="pl-row">
        <label for="${box.id || 'pl'}-${i}"><i class="bi ${s.icon}" aria-hidden="true"></i> ${i + 1}. ${escapeHTML(s.label)}</label>
        <input id="${box.id || 'pl'}-${i}" type="range" min="0.5" max="15" step="0.5" value="${s.dur}" data-pl-dur="${i}">
        <output data-pl-out="${i}"></output>
      </div>`).join('');
    const durs = () => $$('[data-pl-dur]', box).map((r) => Number(r.value));
    const fmt = (n) => `${numID.format(n)} dtk`;
    const showShot = (i, left) => {
      const s = data.shots[i];
      screen.innerHTML = `<i class="bi ${s.icon}" aria-hidden="true"></i>${s.text ? `<p>${escapeHTML(s.text)}</p>` : ''}<small>Shot ${i + 1} · ${escapeHTML(s.label)}${left != null ? ` · sisa ${Math.ceil(Math.max(0, left))} dtk` : ''}</small>`;
      $$('.pl-block', strip).forEach((b, k) => b.classList.toggle('is-now', k === i));
    };
    const render = () => {
      const d = durs();
      const total = d.reduce((a, b) => a + b, 0);
      d.forEach((v, i) => { $(`[data-pl-out="${i}"]`, box).textContent = fmt(v); });
      strip.innerHTML = data.shots.map((s, i) => `<span class="pl-block is-${s.role}" style="flex:${d[i]}" title="${escapeHTML(s.label)}: ${fmt(d[i])}"><i class="bi ${s.icon}" aria-hidden="true"></i><small>${numID.format(d[i])}</small></span>`).join('');
      totalEl.textContent = `${numID.format(total)} detik`;
      const issues = [];
      let ok = 0; let checks = 0;
      data.shots.forEach((s, i) => {
        const v = d[i];
        const n = need(s);
        checks += 1;
        let msg = null;
        if (s.role === 'hook' && v > 5) msg = `Pembuka ${fmt(v)} terlalu lama. Pancing penonton dalam 5 detik pertama!`;
        else if (s.role === 'ajakan' && v < 4) msg = `Ajakan hanya ${fmt(v)}. Beri minimal 4 detik agar ajakan sempat dibaca dan diingat.`;
        else if (n && v < n) msg = `Teks di shot ${i + 1} ("${s.text}") butuh sekitar ${fmt(n)} untuk dibaca, tetapi hanya tampil ${fmt(v)}.`;
        else if (v < 1.5) msg = `Shot ${i + 1} hanya ${fmt(v)}, terlalu cepat untuk dipahami.`;
        else if (v > 8) msg = `Shot ${i + 1} (${s.label}) ${fmt(v)} terlalu lama tanpa perubahan, sehingga penonton mulai bosan.`;
        if (msg) issues.push(`<li class="is-bad"><i class="bi bi-x-circle-fill" aria-hidden="true"></i><span>${escapeHTML(msg)}</span></li>`);
        else ok += 1;
      });
      checks += 1;
      if (total < data.min || total > data.max) issues.push(`<li class="is-warn"><i class="bi bi-exclamation-circle-fill" aria-hidden="true"></i><span>Durasi total ${numID.format(total)} detik. Targetnya ${data.min}–${data.max} detik.</span></li>`);
      else ok += 1;
      fb.innerHTML = issues.length ? issues.join('') : '<li class="is-ok"><i class="bi bi-check-circle-fill" aria-hidden="true"></i><span>Tempo sudah pas! Pembuka cepat, teks sempat dibaca, tidak ada shot yang membosankan, dan ajakan cukup lama.</span></li>';
      scoreEl.textContent = `${ok} / ${checks}`;
      scoreEl.className = `dl-score ${ok === checks ? 'is-ok' : ok >= checks / 2 ? 'is-warn' : 'is-bad'}`;
      if (!timer) showShot(0);
    };
    const stop = () => {
      clearInterval(timer);
      timer = null;
      playBtn.innerHTML = '<i class="bi bi-play-fill" aria-hidden="true"></i> Putar pratinjau';
      $$('.pl-block', strip).forEach((b) => b.classList.remove('is-now'));
    };
    playBtn.addEventListener('click', () => {
      if (timer) { stop(); showShot(0); return; }
      const d = durs();
      const start = performance.now();
      playBtn.innerHTML = '<i class="bi bi-stop-fill" aria-hidden="true"></i> Berhenti';
      timer = setInterval(() => {
        const t = (performance.now() - start) / 1000;
        let acc = 0; let i = 0;
        while (i < d.length && t >= acc + d[i]) { acc += d[i]; i += 1; }
        if (i >= d.length) { stop(); screen.innerHTML = '<i class="bi bi-check2-circle" aria-hidden="true"></i><p>Selesai</p><small>Bagaimana rasanya? Terlalu cepat, terlalu lambat, atau pas?</small>'; return; }
        showShot(i, acc + d[i] - t);
      }, 100);
    });
    box.addEventListener('input', (e) => { if (e.target.matches('[data-pl-dur]')) { if (timer) stop(); render(); } });
    $('[data-pl-reset]', box)?.addEventListener('click', () => {
      stop();
      $$('[data-pl-dur]', box).forEach((r, i) => { r.value = data.shots[i].dur; });
      render();
    });
    render();
  });

  /* ---------- 39. Pencocok audio–visual: gambar + suasana musik sesuai narasi ----------
     <div data-av-lab> berisi <script type="application/json" data-av-data>
     {"moods":{"ceria":"Ceria"},"scenes":[{"narasi":"…","visuals":[{"icon":"bi-…","label":"…","ok":true}],"moods":["serius"],"why":"…"}]} */
  const MOOD_TUNES = {
    ceria: { wave: 'triangle', step: 0.16, notes: [523.3, 659.3, 784, 1046.5, 784, 659.3, 784, 1046.5] },
    tenang: { wave: 'sine', step: 0.5, notes: [392, 523.3, 659.3, 523.3] },
    serius: { wave: 'square', step: 0.38, notes: [110, 110, 130.8, 103.8, 110] },
    sedih: { wave: 'sine', step: 0.55, notes: [440, 392, 349.2, 329.6] },
  };
  let moodCtx = null;
  const playMood = (mood) => {
    const AC = window.AudioContext || window.webkitAudioContext;
    const tune = MOOD_TUNES[mood];
    if (!AC || !tune) return;
    try {
      if (moodCtx) moodCtx.close();
      moodCtx = new AC();
      const t0 = moodCtx.currentTime + 0.05;
      tune.notes.forEach((f, i) => {
        const o = moodCtx.createOscillator(); const g = moodCtx.createGain();
        o.type = tune.wave; o.frequency.value = f;
        const st = t0 + i * tune.step;
        const peak = tune.wave === 'square' ? 0.05 : 0.18;
        g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(peak, st + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, st + tune.step * 0.95);
        o.connect(g); g.connect(moodCtx.destination); o.start(st); o.stop(st + tune.step);
      });
    } catch (e) { /* abaikan jika suara tidak didukung */ }
  };
  $$('[data-av-lab]').forEach((box) => {
    let data;
    try { data = JSON.parse($('[data-av-data]', box).textContent); } catch (e) { return; }
    const list = $('[data-av-scenes]', box);
    const film = $('[data-av-film]', box);
    const scoreEl = $('[data-av-score]', box);
    const id = box.id || 'av';
    list.innerHTML = data.scenes.map((sc, i) => `
      <div class="av-scene" data-av-scene="${i}">
        <p class="av-narasi"><span>Adegan ${i + 1} · Narasi</span>"${escapeHTML(sc.narasi)}"</p>
        <div class="av-visuals" role="radiogroup" aria-label="Pilih gambar untuk adegan ${i + 1}">
          ${sc.visuals.map((v, k) => `<label class="av-visual"><input type="radio" name="${id}-v${i}" value="${k}"><i class="bi ${v.icon}" aria-hidden="true"></i><span>${escapeHTML(v.label)}</span></label>`).join('')}
        </div>
        <div class="av-mood">
          <label for="${id}-m${i}">Suasana musik</label>
          <select id="${id}-m${i}" data-av-mood="${i}"><option value="">Pilih…</option>${Object.entries(data.moods).map(([k, l]) => `<option value="${k}">${escapeHTML(l)}</option>`).join('')}</select>
          <button type="button" class="link-btn" data-av-listen="${i}"><i class="bi bi-volume-up" aria-hidden="true"></i> Dengar</button>
        </div>
        <p class="av-note" data-av-note="${i}" aria-live="polite"></p>
      </div>`).join('');
    const render = () => {
      let score = 0;
      const frames = data.scenes.map((sc, i) => {
        const vr = $(`input[name="${id}-v${i}"]:checked`, box);
        const mood = $(`[data-av-mood="${i}"]`, box).value;
        const v = vr ? sc.visuals[Number(vr.value)] : null;
        const okV = !!(v && v.ok);
        const okM = sc.moods.includes(mood);
        if (okV) score += 1;
        if (okM) score += 1;
        const note = $(`[data-av-note="${i}"]`, box);
        const parts = [];
        if (v) parts.push(okV ? '<span class="is-ok"><i class="bi bi-check-circle-fill" aria-hidden="true"></i> Gambar selaras dengan narasi.</span>' : `<span class="is-bad"><i class="bi bi-x-circle-fill" aria-hidden="true"></i> Telinga mendengar satu hal, mata melihat hal lain. Penonton bisa bingung.</span>`);
        if (mood) parts.push(okM ? `<span class="is-ok"><i class="bi bi-check-circle-fill" aria-hidden="true"></i> Musik ${escapeHTML(data.moods[mood].toLowerCase())} cocok. ${escapeHTML(sc.why)}</span>` : `<span class="is-bad"><i class="bi bi-x-circle-fill" aria-hidden="true"></i> Suasana musik kurang cocok. ${escapeHTML(sc.why)}</span>`);
        note.innerHTML = parts.join('');
        return `<figure class="av-frame${v ? (okV ? ' is-ok' : ' is-bad') : ''}"><span class="av-screen">${v ? `<i class="bi ${v.icon}" aria-hidden="true"></i>` : '<i class="bi bi-question-lg" aria-hidden="true"></i>'}</span><figcaption>${escapeHTML(sc.narasi)}${mood ? `<small><i class="bi bi-music-note-beamed" aria-hidden="true"></i> ${escapeHTML(data.moods[mood])}</small>` : ''}</figcaption></figure>`;
      });
      film.innerHTML = frames.join('');
      const max = data.scenes.length * 2;
      scoreEl.textContent = `${score} / ${max}`;
      scoreEl.className = `dl-score ${score === max ? 'is-ok' : score >= max / 2 ? 'is-warn' : 'is-bad'}`;
    };
    box.addEventListener('change', render);
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-av-listen]');
      if (!b) return;
      const mood = $(`[data-av-mood="${b.dataset.avListen}"]`, box).value;
      if (mood) playMood(mood);
      else $(`[data-av-note="${b.dataset.avListen}"]`, box).textContent = 'Pilih suasana musik dulu, lalu tekan Dengar.';
    });
    render();
  });

  /* ---------- 40. Pemilih lisensi Creative Commons ---------- */
  const CC_PARTS = {
    BY: { icon: 'bi-person-check', name: 'BY · Atribusi', text: 'Nama pencipta wajib dicantumkan.' },
    NC: { icon: 'bi-currency-dollar', name: 'NC · Nonkomersial', text: 'Tidak boleh dipakai untuk mencari uang.' },
    SA: { icon: 'bi-arrow-repeat', name: 'SA · Berbagi serupa', text: 'Karya hasil ubahan harus memakai lisensi yang sama.' },
    ND: { icon: 'bi-slash-circle', name: 'ND · Tanpa turunan', text: 'Tidak boleh diubah. Hanya boleh dibagikan apa adanya.' },
    CC0: { icon: 'bi-globe', name: 'CC0 · Domain publik', text: 'Bebas dipakai untuk apa saja, bahkan tanpa menyebut nama.' },
  };
  $$('[data-license-picker]').forEach((box) => {
    const out = $('[data-lp-out]', box);
    const val = (n) => ($(`input[name="${n}"]:checked`, box) || {}).value;
    const render = () => {
      const name = val('lp-name'); const com = val('lp-com'); const mod = val('lp-mod');
      const comField = $('[data-lp-group="com"]', box); const modField = $('[data-lp-group="mod"]', box);
      comField.hidden = name === 'tidak';
      modField.hidden = name === 'tidak';
      let code; let parts;
      if (name === 'tidak') { code = 'CC0 1.0'; parts = ['CC0']; }
      else {
        parts = ['BY'];
        if (com === 'tidak') parts.push('NC');
        if (mod === 'sa') parts.push('SA');
        if (mod === 'tidak') parts.push('ND');
        code = `CC ${parts.join('-')} 4.0`;
      }
      const can = (ok, text) => `<li class="${ok === true ? 'is-ok' : ok === false ? 'is-bad' : 'is-warn'}"><i class="bi ${ok === true ? 'bi-check-circle-fill' : ok === false ? 'bi-x-circle-fill' : 'bi-exclamation-circle-fill'}" aria-hidden="true"></i><span>${text}</span></li>`;
      const cc0 = name === 'tidak';
      out.innerHTML = `
        <p class="lp-code">${code}</p>
        <ul class="lp-parts">${parts.map((p) => `<li><i class="bi ${CC_PARTS[p].icon}" aria-hidden="true"></i><span><strong>${CC_PARTS[p].name}</strong> ${CC_PARTS[p].text}</span></li>`).join('')}</ul>
        <p class="lab-label">Orang lain boleh…</p>
        <ul class="dl-feedback">
          ${can(true, 'Menyimpan, memakai, dan membagikan karyamu, misalnya untuk tugas sekolah.')}
          ${can(cc0 || mod !== 'tidak' ? (mod === 'sa' && !cc0 ? null : true) : false, cc0 || mod === 'ya' ? 'Mengubah atau menggabungkan karyamu.' : mod === 'sa' ? 'Mengubah karyamu, asalkan hasilnya dibagikan dengan lisensi yang sama.' : 'Tidak boleh mengubah karyamu.')}
          ${can(cc0 || com === 'ya', cc0 || com === 'ya' ? 'Memakai karyamu untuk tujuan komersial (dijual).' : 'Tidak boleh memakai karyamu untuk mencari uang.')}
          ${can(cc0 ? true : null, cc0 ? 'Tidak wajib menyebut namamu (tetapi tetap sopan jika disebut).' : 'Wajib menuliskan namamu sebagai pencipta.')}
        </ul>
        <p class="lab-label">Tulis di karyamu</p>
        <p class="lp-note">${cc0 ? 'Karya ini dibagikan ke domain publik dengan CC0 1.0.' : `© 2026 Nama Kamu. Karya ini dilisensikan dengan ${code}.`}</p>`;
    };
    box.addEventListener('change', render);
    render();
  });

  /* ---------- 41. Pembuat atribusi: Judul, Pencipta, Sumber, Lisensi (JuPeSuLi) ---------- */
  $$('[data-attribution]').forEach((box) => {
    const f = (n) => $(`[data-at="${n}"]`, box);
    const out = $('[data-at-out]', box);
    const fb = $('[data-at-feedback]', box);
    const status = $('[data-at-status]', box);
    const render = () => {
      const judul = f('judul').value.trim();
      const pencipta = f('pencipta').value.trim();
      const sumber = f('sumber').value.trim();
      const lic = f('lisensi').value;
      const ubah = f('ubah').checked;
      const cara = f('cara').value.trim();
      const tujuan = f('tujuan').value;
      f('cara').closest('.ll-field').hidden = !ubah;
      const rows = [];
      const row = (cls, t) => rows.push(`<li class="${cls}"><i class="bi ${cls === 'is-ok' ? 'bi-check-circle-fill' : cls === 'is-warn' ? 'bi-exclamation-circle-fill' : 'bi-x-circle-fill'}" aria-hidden="true"></i><span>${t}</span></li>`);
      const missing = [['judul', judul], ['pencipta', pencipta], ['sumber', sumber]].filter(([, v]) => !v).map(([k]) => k);
      if (missing.length) row('is-bad', `Lengkapi bagian: ${missing.join(', ')}. Jika judul tidak ada, tulis "Tanpa judul".`);
      else row('is-ok', 'Judul, pencipta, dan sumber sudah lengkap.');
      if (lic === 'hak-cipta') row('is-bad', 'Bahan ini dilindungi hak cipta penuh atau lisensinya tidak jelas. Jangan dipakai tanpa izin pencipta. Cari bahan lain yang berlisensi bebas, atau buat sendiri.');
      else {
        if (lic.includes('ND') && ubah) row('is-bad', 'Lisensi ND (tanpa turunan) tidak membolehkan bahan diubah, dipotong, atau diberi tulisan. Pakai apa adanya, atau cari bahan lain.');
        if (lic.includes('NC') && tujuan === 'jual') row('is-bad', 'Lisensi NC (nonkomersial) tidak membolehkan bahan dipakai untuk karya yang dijual.');
        if (lic.includes('SA') && ubah) row('is-warn', 'Lisensi SA: karya hasil ubahanmu harus dibagikan dengan lisensi yang sama.');
        if (ubah && !cara) row('is-warn', 'Tuliskan perubahan yang kamu lakukan, misalnya "dipotong" atau "diberi teks".');
        if (lic === 'situs') row('is-warn', 'Lisensi situs (misalnya Pixabay atau Unsplash) membolehkan pemakaian gratis. Bacalah aturannya, dan sebaiknya tetap cantumkan nama pencipta.');
        if (!rows.some((r) => r.includes('is-bad')) && !missing.length) row('is-ok', 'Pemakaian bahan ini sesuai dengan lisensinya.');
      }
      const licText = { CC0: 'domain publik (CC0)', situs: 'lisensi situs, bebas pakai', 'hak-cipta': 'HAK CIPTA PENUH (perlu izin)' }[lic] || `lisensi ${lic} 4.0`;
      const text = `"${judul || '…'}" oleh ${pencipta || '…'}, dari ${sumber || '…'}, ${licText}.${ubah ? ` Diubah: ${cara || '…'}.` : ''}`;
      out.textContent = text;
      fb.innerHTML = rows.join('');
    };
    box.addEventListener('input', render);
    box.addEventListener('change', render);
    $('[data-at-copy]', box).addEventListener('click', async () => {
      const ok = await copyText(out.textContent);
      status.textContent = ok ? 'Atribusi disalin. Tempelkan di bawah gambar, di slide terakhir, atau di deskripsi video.' : 'Gagal menyalin. Blok teksnya, lalu salin secara manual.';
    });
    render();
  });

  /* ---------- 42. Pemeriksa kemiripan teks (cara kerja pendeteksi plagiarisme) ---------- */
  $$('[data-plagiarism]').forEach((box) => {
    const source = $('[data-pc-source]', box).textContent;
    const input = $('[data-pc-input]', box);
    const marked = $('[data-pc-marked]', box);
    const pctEl = $('[data-pc-pct]', box);
    const bar = $('[data-pc-bar]', box);
    const fb = $('[data-pc-feedback]', box);
    const N = 3;
    const norm = (w) => w.toLowerCase().replace(/[^a-z0-9à-ÿ-]/gi, '');
    const srcWords = source.split(/\s+/).map(norm).filter(Boolean);
    const grams = new Set();
    for (let i = 0; i + N <= srcWords.length; i += 1) grams.add(srcWords.slice(i, i + N).join(' '));
    const cite = new RegExp(box.dataset.cite || 'menurut|sumber', 'i');
    const render = () => {
      const raw = input.value;
      const tokens = raw.split(/(\s+)/);
      const words = [];
      tokens.forEach((t, idx) => { if (t.trim()) words.push({ idx, w: norm(t) }); });
      const hit = new Array(words.length).fill(false);
      for (let i = 0; i + N <= words.length; i += 1) {
        const g = words.slice(i, i + N).map((x) => x.w).join(' ');
        if (grams.has(g)) for (let k = i; k < i + N; k += 1) hit[k] = true;
      }
      const real = words.filter((x) => x.w).length;
      const copied = hit.filter((h, i) => h && words[i].w).length;
      const pct = real ? Math.round((copied / real) * 100) : 0;
      const hitIdx = new Set(words.filter((_, i) => hit[i]).map((x) => x.idx));
      marked.innerHTML = raw.trim() ? tokens.map((t, idx) => (hitIdx.has(idx) ? `<mark>${escapeHTML(t)}</mark>` : escapeHTML(t))).join('') : '<span class="pc-empty">Tulisanmu akan tampil di sini. Bagian yang sama persis dengan sumber akan diberi warna.</span>';
      pctEl.textContent = `${pct}%`;
      bar.style.setProperty('--p', `${pct}%`);
      bar.className = `pc-bar ${pct >= 50 ? 'is-bad' : pct >= 20 ? 'is-warn' : 'is-ok'}`;
      const rows = [];
      const row = (cls, t) => rows.push(`<li class="${cls}"><i class="bi ${cls === 'is-ok' ? 'bi-check-circle-fill' : cls === 'is-warn' ? 'bi-exclamation-circle-fill' : 'bi-x-circle-fill'}" aria-hidden="true"></i><span>${t}</span></li>`);
      if (!real) row('is-warn', 'Tulis ulang isi teks sumber dengan kata-katamu sendiri di kotak sebelah kiri.');
      else {
        if (real < 15) row('is-warn', 'Tulisanmu masih terlalu pendek. Coba tulis minimal dua kalimat.');
        if (pct >= 50) row('is-bad', `${pct}% kata tersusun persis seperti sumber. Ini menyalin, bukan parafrase. Tutup sumbernya, pahami isinya, lalu tulis dengan gayamu sendiri.`);
        else if (pct >= 20) row('is-warn', `${pct}% masih sama persis dengan sumber. Mengganti satu-dua kata belum cukup. Ubah juga susunan kalimatnya.`);
        else row('is-ok', `Hanya ${pct}% yang sama. Kamu sudah memakai kata-katamu sendiri.`);
        if (cite.test(raw)) row('is-ok', 'Kamu menyebutkan sumbernya. Parafrase tetap wajib mencantumkan sumber!');
        else row('is-bad', 'Belum ada sumber. Tambahkan, misalnya "Menurut buku Pangan Lokal Riau, …".');
      }
      fb.innerHTML = rows.join('');
    };
    input.addEventListener('input', render);
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pc-preset]');
      if (!b) return;
      input.value = b.dataset.pcPreset;
      render();
    });
    $('[data-pc-clear]', box)?.addEventListener('click', () => { input.value = ''; render(); input.focus(); });
    render();
  });

  /* ---------- 43. Simulator unggahan: pratinjau + pemeriksa siap unggah ---------- */
  const fbRow = (cls, t) => `<li class="${cls}"><i class="bi ${cls === 'is-ok' ? 'bi-check-circle-fill' : cls === 'is-warn' ? 'bi-exclamation-circle-fill' : 'bi-x-circle-fill'}" aria-hidden="true"></i><span>${t}</span></li>`;
  const capsRatio = (s) => {
    const letters = s.replace(/[^a-z]/gi, '');
    return letters.length ? letters.replace(/[^A-Z]/g, '').length / letters.length : 0;
  };
  $$('[data-post-lab]').forEach((box) => {
    const f = (n) => $(`[data-pp="${n}"]`, box);
    const chk = (n) => $(`[data-pp-check="${n}"]`, box).checked;
    const preview = $('[data-pp-preview]', box);
    const fb = $('[data-pp-feedback]', box);
    const scoreEl = $('[data-pp-score]', box);
    const status = $('[data-pp-status]', box);
    const PLAT = {
      pendek: 'Video pendek tegak (9:16)',
      kanal: 'Kanal video sekolah (16:9)',
      mading: 'Mading digital kelas',
      blog: 'Blog atau situs sekolah',
    };
    const VIS = { publik: 'Publik', terbatas: 'Terbatas (warga sekolah)', pribadi: 'Pribadi' };
    let checks = [];
    const render = () => {
      const plat = f('platform').value;
      const title = f('judul').value.trim();
      const desc = f('deskripsi').value.trim();
      const tags = f('tagar').value.trim().split(/\s+/).filter(Boolean);
      const vis = f('visibilitas').value;
      const kom = f('komentar').value;
      const tagHTML = tags.map((t) => `<span>${escapeHTML(t)}</span>`).join(' ');
      const visIcon = { publik: 'bi-globe2', terbatas: 'bi-people', pribadi: 'bi-lock' }[vis];
      const meta = `<p class="pp-meta"><i class="bi ${visIcon}" aria-hidden="true"></i> ${VIS[vis]} · <i class="bi bi-chat-dots" aria-hidden="true"></i> Komentar ${kom === 'moderasi' ? 'disaring' : kom}</p>`;
      if (plat === 'pendek') {
        preview.className = 'pp-preview is-pendek';
        preview.innerHTML = `<div class="pp-phone"><i class="bi bi-droplet-half pp-art" aria-hidden="true"></i><div class="pp-overlay"><p class="pp-user">@osis.smpn1bandarseikijang</p><p class="pp-title">${escapeHTML(title || 'Judul video…')}</p><p class="pp-tags">${tagHTML}</p></div><div class="pp-side" aria-hidden="true"><i class="bi bi-heart"></i><i class="bi bi-chat"></i><i class="bi bi-share"></i></div></div>${meta}`;
      } else if (plat === 'kanal') {
        preview.className = 'pp-preview is-kanal';
        preview.innerHTML = `<div class="pp-thumb"><i class="bi bi-droplet-half" aria-hidden="true"></i><span class="pp-dur">0:58</span></div><p class="pp-title">${escapeHTML(title || 'Judul video…')}</p><p class="pp-user">Kanal SMP Negeri 1 Bandar Seikijang</p><p class="pp-desc">${escapeHTML(desc || 'Deskripsi video…')}</p><p class="pp-tags">${tagHTML}</p>${meta}`;
      } else if (plat === 'mading') {
        preview.className = 'pp-preview is-mading';
        preview.innerHTML = `<div class="pp-note"><p class="pp-user"><i class="bi bi-person-circle" aria-hidden="true"></i> Kelompok 3 · VIII-A</p><p class="pp-title">${escapeHTML(title || 'Judul unggahan…')}</p><div class="pp-thumb is-small"><i class="bi bi-droplet-half" aria-hidden="true"></i></div><p class="pp-desc">${escapeHTML(desc || 'Keterangan…')}</p><p class="pp-tags">${tagHTML}</p></div>${meta}`;
      } else {
        preview.className = 'pp-preview is-blog';
        preview.innerHTML = `<div class="pp-article"><p class="pp-user">Blog SMP Negeri 1 Bandar Seikijang · Karya Murid</p><p class="pp-title">${escapeHTML(title || 'Judul artikel…')}</p><div class="pp-thumb"><i class="bi bi-droplet-half" aria-hidden="true"></i></div><p class="pp-desc">${escapeHTML(desc || 'Isi singkat…')}</p><p class="pp-tags">${tagHTML}</p></div>${meta}`;
      }

      const rows = [];
      checks = [];
      const add = (cls, t) => { checks.push(cls); rows.push(fbRow(cls, t)); };
      if (title.length < 10) add('is-bad', 'Judul terlalu pendek. Tulis judul yang jelas, 10–60 huruf.');
      else if (title.length > 60) add('is-warn', `Judul ${title.length} huruf, terlalu panjang. Persingkat sampai paling banyak 60 huruf.`);
      else add('is-ok', 'Panjang judul pas dan jelas.');
      if (capsRatio(title) > 0.7 && title.length > 5) add('is-warn', 'Judul memakai HURUF KAPITAL SEMUA, sehingga terkesan berteriak dan sulit dibaca.');
      else add('is-ok', 'Judul mudah dibaca, tidak berteriak.');
      if (desc.length < 30) add('is-bad', 'Deskripsi terlalu singkat. Jelaskan isi konten dalam 1–2 kalimat.');
      else if (!/sumber|musik|kredit|lisensi|oleh/i.test(desc)) add('is-warn', 'Deskripsi belum mencantumkan sumber atau kredit bahan, misalnya musik dan foto (TP 2.8).');
      else add('is-ok', 'Deskripsi jelas dan mencantumkan kredit.');
      const badTag = tags.filter((t) => !/^#[\p{L}\p{N}_]+$/u.test(t));
      if (!tags.length) add('is-warn', 'Belum ada tagar. Tambahkan 2–5 tagar agar konten mudah ditemukan.');
      else if (badTag.length) add('is-bad', `Tagar harus diawali # dan tanpa spasi atau tanda baca: ${escapeHTML(badTag.join(' '))}`);
      else if (tags.length > 5) add('is-warn', `${tags.length} tagar terlalu banyak dan terlihat seperti spam. Pilih 2–5 yang paling sesuai.`);
      else add('is-ok', `${tags.length} tagar yang rapi.`);
      const text = `${title} ${desc}`;
      if (/(\+62|\b08)\d[\d\s-]{7,}/.test(text) || /[\w.]+@[\w-]+\.\w+/.test(text) || /\b(jl\.?|jalan)\s+\w+.*\bno\.?\s*\d+/i.test(text) || /alamat rumah/i.test(text)) add('is-bad', 'Ada data pribadi (nomor HP, email, atau alamat rumah). Hapus sebelum diunggah!');
      else add('is-ok', 'Tidak ada data pribadi yang ikut tersebar.');
      if (vis === 'publik' && !chk('guru')) add('is-bad', 'Unggahan publik harus lewat akun resmi sekolah dan disetujui guru pendamping.');
      else if (vis === 'pribadi') add('is-warn', 'Pengaturan "Pribadi" membuat konten hanya bisa dilihat olehmu. Untuk berbagi ke kelas, pilih "Terbatas".');
      else add('is-ok', `Pengaturan privasi "${VIS[vis]}" sudah sesuai.`);
      if (kom === 'moderasi') add('is-ok', 'Komentar disaring dulu, jadi ruang komentar tetap aman.');
      else if (kom === 'aktif') add('is-warn', 'Komentar terbuka. Pastikan ada yang rutin memantau dan menyaring komentar.');
      else add('is-warn', 'Komentar dimatikan, sehingga penonton tidak bisa bertanya atau memberi masukan. Pilih "disaring dulu".');
      add(chk('izin') ? 'is-ok' : 'is-bad', chk('izin') ? 'Semua orang yang tampil sudah memberi izin.' : 'Pastikan semua orang yang tampil di konten sudah memberi izin (TP 2.5).');
      add(chk('atribusi') ? 'is-ok' : 'is-bad', chk('atribusi') ? 'Bahan dari orang lain sudah diberi atribusi.' : 'Periksa lisensi dan atribusi musik serta gambar (TP 2.8).');
      add(chk('takarir') ? 'is-ok' : 'is-warn', chk('takarir') ? 'Ada takarir (subtitle), sehingga teman tunarungu dan penonton tanpa suara tetap paham.' : 'Tambahkan takarir (subtitle) agar konten bisa dinikmati semua orang.');
      fb.innerHTML = rows.join('');
      const ok = checks.filter((c) => c === 'is-ok').length;
      scoreEl.textContent = `${ok} / ${checks.length}`;
      scoreEl.className = `dl-score ${ok === checks.length ? 'is-ok' : ok >= checks.length - 3 ? 'is-warn' : 'is-bad'}`;
      status.textContent = '';
      status.className = 'tool-status';
      preview.classList.remove('is-published');
      $('.pp-platform', box).textContent = PLAT[plat];
    };
    box.addEventListener('input', render);
    box.addEventListener('change', render);
    $('[data-pp-publish]', box).addEventListener('click', () => {
      render();
      const bad = checks.filter((c) => c === 'is-bad').length;
      const warn = checks.filter((c) => c === 'is-warn').length;
      if (bad) {
        status.className = 'tool-status is-bad';
        status.textContent = `Belum siap unggah: masih ada ${bad} hal penting yang harus diperbaiki (tanda merah).`;
      } else {
        preview.classList.add('is-published');
        status.className = 'tool-status is-ok';
        status.textContent = warn ? `Terunggah! Masih ada ${warn} saran (tanda kuning) agar unggahan berikutnya lebih baik.` : 'Terunggah! Kontenmu siap dinikmati dengan aman dan bertanggung jawab.';
      }
    });
    render();
  });

  /* ---------- 44. Ruang komentar: memilih balasan yang beretika ---------- */
  $$('[data-reply-lab]').forEach((box) => {
    let data;
    try { data = JSON.parse($('[data-rl-data]', box).textContent); } catch (e) { return; }
    const thread = $('[data-rl-thread]', box);
    const opts = $('[data-rl-options]', box);
    const fb = $('[data-rl-feedback]', box);
    const nextBtn = $('[data-rl-next]', box);
    const progress = $('[data-rl-progress]', box);
    const scoreEl = $('[data-rl-score]', box);
    let i = 0; let score = 0;
    const show = () => {
      const sc = data[i];
      progress.textContent = `Komentar ${i + 1} dari ${data.length}`;
      scoreEl.textContent = `${score} / ${data.length}`;
      thread.innerHTML = `<div class="rl-bubble is-in"><i class="bi ${sc.icon}" aria-hidden="true"></i><div><p class="rl-who">${escapeHTML(sc.who)}</p><p>${escapeHTML(sc.text)}</p></div></div>`;
      const order = sc.options.map((o, k) => k).sort(() => Math.random() - 0.5);
      opts.innerHTML = order.map((k) => `<button type="button" class="rl-option" data-rl-pick="${k}">${escapeHTML(sc.options[k].t)}</button>`).join('');
      opts.hidden = false;
      fb.innerHTML = '';
      nextBtn.hidden = true;
    };
    box.addEventListener('click', (e) => {
      const pick = e.target.closest('[data-rl-pick]');
      if (pick) {
        const o = data[i].options[Number(pick.dataset.rlPick)];
        if (o.q === 'good') score += 1;
        thread.insertAdjacentHTML('beforeend', `<div class="rl-bubble is-out is-${o.q}"><i class="bi bi-person-circle" aria-hidden="true"></i><div><p class="rl-who">Kamu</p><p>${escapeHTML(o.t)}</p></div></div>`);
        opts.hidden = true;
        fb.innerHTML = fbRow(o.q === 'good' ? 'is-ok' : o.q === 'meh' ? 'is-warn' : 'is-bad', escapeHTML(o.why));
        scoreEl.textContent = `${score} / ${data.length}`;
        nextBtn.hidden = false;
        nextBtn.innerHTML = i < data.length - 1 ? 'Komentar berikutnya <i class="bi bi-arrow-right" aria-hidden="true"></i>' : 'Lihat hasil <i class="bi bi-flag" aria-hidden="true"></i>';
        nextBtn.focus();
        return;
      }
      if (e.target.closest('[data-rl-next]')) {
        if (i >= data.length) { i = 0; score = 0; show(); return; }
        if (i < data.length - 1) { i += 1; show(); return; }
        thread.innerHTML = `<div class="rl-result"><i class="bi bi-trophy" aria-hidden="true"></i><p><strong>${score} dari ${data.length}</strong> balasanmu sudah beretika.</p><p>${score === data.length ? 'Luar biasa! Kamu siap menjadi moderator komentar yang bijak.' : 'Coba lagi dan perhatikan penjelasan di setiap balasan.'}</p></div>`;
        opts.hidden = true;
        fb.innerHTML = '';
        nextBtn.hidden = false;
        nextBtn.innerHTML = '<i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Main lagi';
        i = data.length;
        return;
      }
    });
    show();
  });

  /* ---------- 45. Pemeriksa pesan 4B: Benar, Baik, Berguna, Butuh ---------- */
  $$('[data-msg-lab]').forEach((box) => {
    const input = $('[data-ml-input]', box);
    const to = $('[data-ml="to"]', box);
    const jam = $('[data-ml="jam"]', box);
    const bubble = $('[data-ml-bubble]', box);
    const fb = $('[data-ml-feedback]', box);
    const scoreEl = $('[data-ml-score]', box);
    const KASAR = /\b(bodoh|goblo[kg]|bego|tolol|dungu|idiot|anjing|bangsat|sialan|kampret|jelek lu|norak)\b/i;
    const render = () => {
      const t = input.value.trim();
      const who = to.value;
      const h = Number(jam.value);
      bubble.innerHTML = t ? `${escapeHTML(t)}<small>${String(h).padStart(2, '0')}.00 <i class="bi bi-check2-all" aria-hidden="true"></i></small>` : '<span class="pc-empty">Pesanmu akan tampil di sini…</span>';
      const rows = [];
      let ok = 0; let n = 0;
      const add = (cls, msg) => { n += 1; if (cls === 'is-ok') ok += 1; rows.push(fbRow(cls, msg)); };
      if (!t) { fb.innerHTML = fbRow('is-warn', 'Tulis pesanmu, atau coba salah satu contoh.'); scoreEl.textContent = '0 / 0'; scoreEl.className = 'dl-score'; return; }
      const words = t.split(/\s+/).length;
      const emoji = (t.match(/\p{Extended_Pictographic}/gu) || []).length;
      const formal = who === 'guru';
      const salam = /(selamat (pagi|siang|sore|malam))|assalamu|halo|hai|permisi|\bsalam\b|om swastiastu|shalom/i.test(t);
      add(salam || !formal ? 'is-ok' : 'is-bad', salam ? 'Ada salam pembuka.' : formal ? 'Mulai pesan kepada guru dengan salam, misalnya "Selamat sore, Bu".' : 'Pesan untuk teman boleh santai, tetapi sapaan tetap membuatnya ramah.');
      if (formal) {
        const intro = /\b(saya|nama saya)\b/i.test(t) && /kelas/i.test(t);
        add(intro ? 'is-ok' : 'is-bad', intro ? 'Kamu memperkenalkan diri (nama dan kelas).' : 'Perkenalkan diri: nama dan kelas, karena guru mengajar banyak murid.');
      }
      const santun = /mohon|maaf|tolong|terima ?kasih|makasih|permisi/i.test(t);
      add(santun ? 'is-ok' : (formal ? 'is-bad' : 'is-warn'), santun ? 'Ada kata santun seperti "mohon", "maaf", atau "terima kasih".' : 'Tambahkan kata santun, misalnya "mohon" atau "terima kasih".');
      add(capsRatio(t) > 0.6 && t.replace(/[^a-z]/gi, '').length > 10 ? 'is-bad' : 'is-ok', capsRatio(t) > 0.6 && t.replace(/[^a-z]/gi, '').length > 10 ? 'Pesan HURUF KAPITAL SEMUA terbaca seperti berteriak dan marah.' : 'Tidak berteriak dengan huruf kapital.');
      const ribut = /[!?]{3,}/.test(t);
      add(ribut ? 'is-warn' : 'is-ok', ribut ? 'Tanda seru atau tanya yang berderet (!!! ???) terkesan tidak sabar.' : 'Tanda baca wajar.');
      const emojiMax = formal ? 1 : 3;
      add(emoji > emojiMax ? 'is-warn' : 'is-ok', emoji > emojiMax ? `${emoji} emoji terlalu banyak${formal ? ' untuk pesan kepada guru' : ''}. Pakai secukupnya.` : 'Emoji dipakai secukupnya.');
      add(KASAR.test(t) ? 'is-bad' : 'is-ok', KASAR.test(t) ? 'Ada kata kasar atau ejekan. Hapus! Kata-kata di dunia maya bisa melukai dan tersimpan lama.' : 'Tidak ada kata kasar.');
      add(words < 5 ? 'is-warn' : words > 90 ? 'is-warn' : 'is-ok', words < 5 ? 'Pesan terlalu singkat, maksudnya bisa tidak jelas.' : words > 90 ? 'Pesan terlalu panjang. Sampaikan intinya saja.' : 'Panjang pesan pas dan maksudnya jelas.');
      const late = (formal && (h < 6 || h >= 21)) || (who === 'grup' && (h < 6 || h >= 22));
      add(late ? 'is-warn' : 'is-ok', late ? `Pukul ${String(h).padStart(2, '0')}.00 adalah waktu istirahat. Kirim pesan pada jam yang wajar, kecuali darurat.` : 'Waktu mengirim pesan wajar.');
      fb.innerHTML = rows.join('');
      scoreEl.textContent = `${ok} / ${n}`;
      scoreEl.className = `dl-score ${ok === n ? 'is-ok' : ok >= n - 2 ? 'is-warn' : 'is-bad'}`;
    };
    box.addEventListener('input', render);
    box.addEventListener('change', render);
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ml-preset]');
      if (!b) return;
      input.value = b.dataset.mlPreset;
      if (b.dataset.mlTo) to.value = b.dataset.mlTo;
      if (b.dataset.mlJam) jam.value = b.dataset.mlJam;
      render();
    });
    render();
  });

  /* ---------- 46. Navigasi TP sebelumnya/berikutnya: <kka-tp-nav code="1.2"> ----------
     Dibuat otomatis dari urutan di data.js, jadi tidak perlu ditulis manual. */
  const KKA = window.KKA;
  $$('kka-tp-nav').forEach((nav) => {
    if (!KKA) return;
    const i = KKA.ATP.findIndex((a) => a.kode === nav.getAttribute('code'));
    if (i < 0) return;
    const current = KKA.ATP[i];
    const prev = KKA.ATP[i - 1];
    const next = KKA.ATP[i + 1];
    const soon = (tp) => (tp.ready ? '' : ' <em class="pager-soon">segera hadir</em>');
    const kelasLink = (tp) => `index.html#kelas-${tp.kelas}`;

    const prevLink = prev
      ? `<a href="${prev.href}"><small><i class="bi bi-arrow-left" aria-hidden="true"></i> Sebelumnya</small><span>TP ${prev.kode} · ${prev.judul}${soon(prev)}</span></a>`
      : `<a href="${kelasLink(current)}"><small><i class="bi bi-arrow-left" aria-hidden="true"></i> Kembali</small><span>Alur TP Kelas ${KKA.KELAS[current.kelas]}</span></a>`;
    const nextLink = next
      ? `<a class="pager-next" href="${next.href}"><small>Berikutnya <i class="bi bi-arrow-right" aria-hidden="true"></i></small><span>TP ${next.kode} · ${next.judul}${soon(next)}</span></a>`
      : `<a class="pager-next" href="${kelasLink(current)}"><small>Selesai <i class="bi bi-arrow-right" aria-hidden="true"></i></small><span>Kembali ke Alur TP Kelas ${KKA.KELAS[current.kelas]}</span></a>`;

    nav.innerHTML = `
      <nav class="pager" aria-label="Navigasi TP">${prevLink}${nextLink}</nav>
      <p class="lesson-source">TP ini mengacu pada ${KKA.REFERENSI}. Materi dan tugas dikembangkan untuk pembelajaran di SMP Negeri 1 Bandar Seikijang.</p>`;
  });
})();
