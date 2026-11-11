(() => {
  const doc = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- split headlines into words for staggered reveal --- */
  document.querySelectorAll('[data-split]').forEach((el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            inner.style.setProperty('--i', i++);
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          if (child.classList.contains('hl')) {
            // keep accent word intact as one unit
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            inner.style.setProperty('--i', i++);
            child.replaceWith(w);
            inner.appendChild(child);
            w.appendChild(inner);
          } else {
            walk(child);
          }
        }
      });
    };
    walk(el);
  });

  /* --- reveal on scroll --- */
  const targets = document.querySelectorAll('[data-reveal], [data-split]');
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach((t) => t.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach((t) => io.observe(t));
  }

  /* --- sticky nav state + scroll progress --- */
  const nav = document.querySelector('.site-nav');
  const progress = document.querySelector('.progress');
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    if (nav) nav.classList.toggle('is-scrolled', y > 24);
    if (progress) {
      const max = doc.scrollHeight - window.innerHeight;
      progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* --- mobile menu --- */
  const toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    const close = () => { doc.classList.remove('nav-open'); toggle.setAttribute('aria-expanded', 'false'); };
    toggle.addEventListener('click', () => {
      const open = doc.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    document.querySelectorAll('.site-nav__links a').forEach((a) => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    window.matchMedia('(min-width: 768px)').addEventListener('change', close);
  }

  /* --- featured card spotlight follows cursor --- */
  document.querySelectorAll('.featured').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* --- before / after comparison --- */
  document.querySelectorAll('.compare').forEach((cmp) => {
    const vp = cmp.querySelector('.compare__viewport');
    const handle = cmp.querySelector('.compare__handle');
    const btns = cmp.querySelectorAll('.compare__btn');
    let pos = 50;

    const set = (value, animate = false) => {
      pos = Math.max(0, Math.min(100, value));
      cmp.classList.toggle('is-animating', animate);
      cmp.style.setProperty('--pos', `${pos}%`);
      handle.setAttribute('aria-valuenow', Math.round(pos));
      btns.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.pos) === Math.round(pos))));
    };
    const fromEvent = (e) => {
      const r = vp.getBoundingClientRect();
      return ((e.clientX - r.left) / r.width) * 100;
    };

    let dragging = false;
    vp.addEventListener('pointerdown', (e) => {
      dragging = true;
      cmp.classList.add('is-dragging', 'is-touched');
      vp.setPointerCapture(e.pointerId);
      set(fromEvent(e), true);
      setTimeout(() => cmp.classList.remove('is-animating'), 300);
    });
    vp.addEventListener('pointermove', (e) => { if (dragging) set(fromEvent(e)); });
    const end = () => { dragging = false; cmp.classList.remove('is-dragging'); };
    vp.addEventListener('pointerup', end);
    vp.addEventListener('pointercancel', end);

    handle.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 10 : 2;
      if (e.key === 'ArrowLeft') { set(pos - step); e.preventDefault(); }
      if (e.key === 'ArrowRight') { set(pos + step); e.preventDefault(); }
      if (e.key === 'Home') { set(0, true); e.preventDefault(); }
      if (e.key === 'End') { set(100, true); e.preventDefault(); }
      cmp.classList.add('is-touched');
    });

    btns.forEach((b) => b.addEventListener('click', () => {
      cmp.classList.add('is-touched');
      set(Number(b.dataset.pos), true);
    }));

    // gentle intro sweep when first seen
    if (!reduce && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setTimeout(() => { if (!cmp.classList.contains('is-touched')) set(68, true); }, 500);
        setTimeout(() => { if (!cmp.classList.contains('is-touched')) set(50, true); }, 1300);
      }, { threshold: 0.5 });
      io.observe(vp);
    }
    set(50);
  });

  /* --- case-study scrollspy --- */
  const spyLinks = document.querySelectorAll('.cs-links a[href^="#"]');
  if (spyLinks.length && 'IntersectionObserver' in window) {
    const map = new Map([...spyLinks].map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          spyLinks.forEach((a) => a.classList.remove('is-active'));
          const a = map.get(e.target.id);
          if (a) a.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }
})();
