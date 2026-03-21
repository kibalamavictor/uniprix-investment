//   NAVBAR



// const mobileMenuBtn = document.getElementById('mobileMenuBtn');
//     const navLinks = document.getElementById('navLinks');

//     mobileMenuBtn.addEventListener('click', () => {
//         navLinks.classList.toggle('active');
//         mobileMenuBtn.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
//     });

//     // Close mobile menu when clicking on a link
//     navLinks.addEventListener('click', (e) => {
//         if (e.target.tagName === 'A') {
//             navLinks.classList.remove('active');
//             mobileMenuBtn.textContent = '☰';
//         }
//     });



// const mobileMenuBtn = document.getElementById('mobileMenuBtn');
//   const navLinks      = document.getElementById('navLinks');
//   const navbar        = document.querySelector('.navbar');

//   /* ── Toggle mobile menu ── */
//   mobileMenuBtn.addEventListener('click', () => {
//     navLinks.classList.toggle('active');
//     mobileMenuBtn.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
//   });

//   /* Close menu on link click */
//   navLinks.addEventListener('click', (e) => {
//     if (e.target.tagName === 'A') {
//       navLinks.classList.remove('active');
//       mobileMenuBtn.textContent = '☰';
//     }
//   });

//   /* ── Scroll behaviour ──
//      - Scrolling DOWN  → hide navbar (and close open menu)
//      - Scrolling UP    → show navbar
//      - At the very top → always show
//   ── */
//   let lastScrollY   = window.scrollY;
//   let ticking       = false;

//   function handleScroll() {
//     const currentScrollY = window.scrollY;
//     const scrollingDown  = currentScrollY > lastScrollY;

//     if (currentScrollY <= 10) {
//       /* Always visible at the top */
//       navbar.classList.remove('nav-hidden');
//     } else if (scrollingDown) {
//       /* Hide on scroll down — also close the open menu */
//       navbar.classList.add('nav-hidden');
//       navLinks.classList.remove('active');
//       mobileMenuBtn.textContent = '☰';
//     } else {
//       /* Show on scroll up */
//       navbar.classList.remove('nav-hidden');
//     }

//     lastScrollY = currentScrollY;
//     ticking     = false;
//   }

//   window.addEventListener('scroll', () => {
//     if (!ticking) {
//       requestAnimationFrame(handleScroll);
//       ticking = true;
//     }
//   }, { passive: true });






    
// // TESTMONIAL SECTION




// (function () {
//   const DATA = [
//     { name: 'James M.',  img: 'https://i.pravatar.cc/150?img=12' },
//     { name: 'David O.',  img: 'https://i.pravatar.cc/150?img=33' },
//     { name: 'Sarah K.',  img: 'https://i.pravatar.cc/150?img=47' },
//     { name: 'Marcus T.', img: 'https://i.pravatar.cc/150?img=52' },
//     { name: 'Amara N.',  img: 'https://i.pravatar.cc/150?img=25' },
//   ];
//   const COUNT = DATA.length;

//   /* ── Size helpers ── */
//   function getCSSPx(name) {
//     return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;
//   }
//   function getSizes() {
//     return {
//       active: getCSSPx('--sz-active') || (window.innerWidth <= 580 ? 84  : 110),
//       near:   getCSSPx('--sz-near')   || (window.innerWidth <= 580 ? 58  : 76),
//       far:    getCSSPx('--sz-far')    || (window.innerWidth <= 580 ? 44  : 58),
//       gap:    getCSSPx('--t-gap')     || (window.innerWidth <= 580 ? 13  : 20),
//     };
//   }
//   function slotSize(dist, sz) {
//     if (dist === 0) return sz.active;
//     if (dist === 1) return sz.near;
//     return sz.far;
//   }

//   /* ── Build infinite track (5 repeats = 25 slots) ── */
//   const REPEATS   = 5;
//   const TOTAL     = COUNT * REPEATS;
//   const MID_START = COUNT * Math.floor(REPEATS / 2);

//   const track  = document.getElementById('avatarTrack');
//   const panels = [...document.querySelectorAll('.testimonial')];
//   const dots   = [...document.querySelectorAll('.t-dot')];
//   const slots  = [];

//   for (let t = 0; t < TOTAL; t++) {
//     const d   = DATA[t % COUNT];
//     const btn = document.createElement('button');
//     btn.className        = 'av-slot';
//     btn.dataset.trackIdx = t;
//     btn.setAttribute('aria-label', d.name);
//     const img = document.createElement('img');
//     img.src = d.img; img.alt = d.name; img.draggable = false;
//     btn.appendChild(img);
//     track.appendChild(btn);
//     slots.push(btn);
//   }

//   /* ── State ── */
//   let realActive  = 2;
//   let trackActive = MID_START + realActive;

//   /* ── Compute translateX to center trackActive ── */
//   function computeX(tActive) {
//     const sz  = getSizes();
//     const gap = sz.gap;
//     const allSizes = slots.map((_, i) => slotSize(Math.abs(i - tActive), sz));
//     let cx = 0;
//     for (let i = 0; i < tActive; i++) cx += allSizes[i] + gap;
//     cx += allSizes[tActive] / 2;
//     return track.parentElement.offsetWidth / 2 - cx;
//   }

//   /* ── Apply active/near classes ── */
//   function applyClasses(tActive) {
//     slots.forEach((s, i) => {
//       const d = Math.abs(i - tActive);
//       s.classList.toggle('active', d === 0);
//       s.classList.toggle('near',   d === 1);
//     });
//   }

//   /* ── Move track ── */
//   function moveTrack(x, animate) {
//     track.style.transition = animate
//       ? 'transform 0.50s cubic-bezier(0.35,0,0.15,1)'
//       : 'none';
//     track.style.transform = `translateY(-50%) translateX(${x}px)`;
//     if (!animate) track.getBoundingClientRect();
//   }

//   /* ── Silent loop jump back to center copy ── */
//   function loopJump() {
//     const center = MID_START + realActive;
//     if (trackActive === center) return;
//     trackActive = center;
//     applyClasses(trackActive);
//     moveTrack(computeX(trackActive), false);
//     requestAnimationFrame(() => requestAnimationFrame(() => {
//       track.style.transition = '';
//     }));
//   }

//   /* ── Go to ── */
//   let transitioning = false;

//   function goTo(newReal, animate = true) {
//     if (animate && transitioning) return;
//     const step   = newReal - realActive;
//     realActive   = ((newReal % COUNT) + COUNT) % COUNT;
//     trackActive += step;
//     applyClasses(trackActive);
//     moveTrack(computeX(trackActive), animate);
//     panels.forEach((p, i) => p.classList.toggle('active', i === realActive));
//     dots.forEach((d, i)   => d.classList.toggle('active', i === realActive));
//     if (animate) {
//       transitioning = true;
//       track.addEventListener('transitionend', function h() {
//         track.removeEventListener('transitionend', h);
//         loopJump();
//         transitioning = false;
//       });
//     }
//   }

//   /* ── Slot clicks ── */
//   slots.forEach(btn => {
//     btn.addEventListener('click', () => {
//       const diff = +btn.dataset.trackIdx - trackActive;
//       if (Math.abs(diff) > 2) return;
//       goTo(realActive + diff, true);
//     });
//   });

//   /* ── Dot clicks ── */
//   dots.forEach(dot => {
//     dot.addEventListener('click', () => {
//       let diff = +dot.dataset.index - realActive;
//       if (diff >  COUNT / 2) diff -= COUNT;
//       if (diff < -COUNT / 2) diff += COUNT;
//       if (diff === 0) return;
//       goTo(realActive + diff, true);
//     });
//   });

//   /* ── Drag / swipe ── */
//   let startX = null, didMove = false;
//   function onStart(x) { startX = x; didMove = false; }
//   function onEnd(x) {
//     if (startX === null) return;
//     const dx = x - startX;
//     if (Math.abs(dx) > 40) { didMove = true; goTo(realActive + (dx < 0 ? 1 : -1), true); }
//     startX = null;
//   }
//   track.addEventListener('mousedown',  e => onStart(e.clientX));
//   window.addEventListener('mouseup',   e => onEnd(e.clientX));
//   track.addEventListener('touchstart', e => onStart(e.touches[0].clientX), { passive: true });
//   track.addEventListener('touchend',   e => onEnd(e.changedTouches[0].clientX), { passive: true });
//   track.addEventListener('click', e => { if (didMove) e.stopPropagation(); }, true);

// //   /* ── Keyboard ── */
// //   document.addEventListener('keydown', e => {
// //     if (e.key === 'ArrowLeft')  goTo(realActive - 1, true);
// //     if (e.key === 'ArrowRight') goTo(realActive + 1, true);
// //   });

//   /* ── Set carousel width = exact 5-slot window ── */
//   const carousel = track.parentElement;
//   function setCarouselWidth() {
//     const sz  = getSizes();
//     const w   = sz.active + 2 * sz.near + 2 * sz.far + 4 * sz.gap;
//     const max = document.querySelector('.testimonials').offsetWidth - 48;
//     carousel.style.width = Math.min(w, max) + 'px';
//   }

//   /* ── Resize ── */
//   window.addEventListener('resize', () => {
//     setCarouselWidth();
//     applyClasses(trackActive);
//     moveTrack(computeX(trackActive), false);
//     track.style.transition = '';
//   });

//   /* ── Init ── */
//   setCarouselWidth();
//   applyClasses(trackActive);
//   moveTrack(computeX(trackActive), false);
//   track.style.transition = '';
//   panels.forEach((p, i) => p.classList.toggle('active', i === realActive));
//   dots.forEach((d, i)   => d.classList.toggle('active', i === realActive));

// })();



// /* ── NAVBAR ─────────────────────────────────────────────── */
// (function () {
//   const mobileMenuBtn = document.getElementById('mobileMenuBtn');
//   const navLinks      = document.getElementById('navLinks');
//   const navbar        = document.querySelector('.navbar');

//   mobileMenuBtn.addEventListener('click', () => {
//     navLinks.classList.toggle('active');
//     mobileMenuBtn.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
//   });

//   navLinks.addEventListener('click', (e) => {
//     if (e.target.tagName === 'A') {
//       navLinks.classList.remove('active');
//       mobileMenuBtn.textContent = '☰';
//     }
//   });

//   let lastScrollY = window.scrollY;
//   let ticking     = false;

//   function handleScroll() {
//     const currentScrollY = window.scrollY;
//     const scrollingDown  = currentScrollY > lastScrollY;

//     if (currentScrollY <= 10) {
//       navbar.classList.remove('nav-hidden');
//     } else if (scrollingDown) {
//       navbar.classList.add('nav-hidden');
//       navLinks.classList.remove('active');
//       mobileMenuBtn.textContent = '☰';
//     } else {
//       navbar.classList.remove('nav-hidden');
//     }

//     lastScrollY = currentScrollY;
//     ticking     = false;
//   }

//   window.addEventListener('scroll', () => {
//     if (!ticking) {
//       requestAnimationFrame(handleScroll);
//       ticking = true;
//     }
//   }, { passive: true });
// })();


// /* ── TESTIMONIALS ───────────────────────────────────────── */
// (function () {
//   const DATA = [
//     { name: 'James M.',  img: 'https://i.pravatar.cc/150?img=12' },
//     { name: 'David O.',  img: 'https://i.pravatar.cc/150?img=33' },
//     { name: 'Sarah K.',  img: 'https://i.pravatar.cc/150?img=47' },
//     { name: 'Marcus T.', img: 'https://i.pravatar.cc/150?img=52' },
//     { name: 'Amara N.',  img: 'https://i.pravatar.cc/150?img=25' },
//   ];
//   const COUNT = DATA.length;

//   function getCSSPx(name) {
//     return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;
//   }
//   function getSizes() {
//     return {
//       active: getCSSPx('--sz-active') || (window.innerWidth <= 580 ? 84  : 110),
//       near:   getCSSPx('--sz-near')   || (window.innerWidth <= 580 ? 58  : 76),
//       far:    getCSSPx('--sz-far')    || (window.innerWidth <= 580 ? 44  : 58),
//       gap:    getCSSPx('--t-gap')     || (window.innerWidth <= 580 ? 13  : 20),
//     };
//   }
//   function slotSize(dist, sz) {
//     if (dist === 0) return sz.active;
//     if (dist === 1) return sz.near;
//     return sz.far;
//   }

//   const REPEATS   = 5;
//   const TOTAL     = COUNT * REPEATS;
//   const MID_START = COUNT * Math.floor(REPEATS / 2);

//   const track  = document.getElementById('avatarTrack');
//   const panels = [...document.querySelectorAll('.testimonial')];
//   const dots   = [...document.querySelectorAll('.t-dot')];
//   const slots  = [];

//   for (let t = 0; t < TOTAL; t++) {
//     const d   = DATA[t % COUNT];
//     const btn = document.createElement('button');
//     btn.className        = 'av-slot';
//     btn.dataset.trackIdx = t;
//     btn.setAttribute('aria-label', d.name);
//     const img = document.createElement('img');
//     img.src = d.img; img.alt = d.name; img.draggable = false;
//     btn.appendChild(img);
//     track.appendChild(btn);
//     slots.push(btn);
//   }

//   let realActive  = 2;
//   let trackActive = MID_START + realActive;

//   function computeX(tActive) {
//     const sz  = getSizes();
//     const gap = sz.gap;
//     const allSizes = slots.map((_, i) => slotSize(Math.abs(i - tActive), sz));
//     let cx = 0;
//     for (let i = 0; i < tActive; i++) cx += allSizes[i] + gap;
//     cx += allSizes[tActive] / 2;
//     return track.parentElement.offsetWidth / 2 - cx;
//   }

//   function applyClasses(tActive) {
//     slots.forEach((s, i) => {
//       const d = Math.abs(i - tActive);
//       s.classList.toggle('active', d === 0);
//       s.classList.toggle('near',   d === 1);
//     });
//   }

//   function moveTrack(x, animate) {
//     track.style.transition = animate
//       ? 'transform 0.50s cubic-bezier(0.35,0,0.15,1)'
//       : 'none';
//     track.style.transform = `translateY(-50%) translateX(${x}px)`;
//     if (!animate) track.getBoundingClientRect();
//   }

//   function loopJump() {
//     const center = MID_START + realActive;
//     if (trackActive === center) return;
//     trackActive = center;
//     applyClasses(trackActive);
//     moveTrack(computeX(trackActive), false);
//     requestAnimationFrame(() => requestAnimationFrame(() => {
//       track.style.transition = '';
//     }));
//   }

//   let transitioning = false;

//   function goTo(newReal, animate = true) {
//     if (animate && transitioning) return;
//     const step   = newReal - realActive;
//     realActive   = ((newReal % COUNT) + COUNT) % COUNT;
//     trackActive += step;
//     applyClasses(trackActive);
//     moveTrack(computeX(trackActive), animate);
//     panels.forEach((p, i) => p.classList.toggle('active', i === realActive));
//     dots.forEach((d, i)   => d.classList.toggle('active', i === realActive));
//     if (animate) {
//       transitioning = true;
//       track.addEventListener('transitionend', function h() {
//         track.removeEventListener('transitionend', h);
//         loopJump();
//         transitioning = false;
//       });
//     }
//   }

//   slots.forEach(btn => {
//     btn.addEventListener('click', () => {
//       const diff = +btn.dataset.trackIdx - trackActive;
//       if (Math.abs(diff) > 2) return;
//       goTo(realActive + diff, true);
//     });
//   });

//   dots.forEach(dot => {
//     dot.addEventListener('click', () => {
//       let diff = +dot.dataset.index - realActive;
//       if (diff >  COUNT / 2) diff -= COUNT;
//       if (diff < -COUNT / 2) diff += COUNT;
//       if (diff === 0) return;
//       goTo(realActive + diff, true);
//     });
//   });

//   /* ── Drag / swipe ── */
//   let startX = null, didMove = false;
//   function onStart(x) { startX = x; didMove = false; }
//   function onEnd(x) {
//     if (startX === null) return;
//     const dx = x - startX;
//     if (Math.abs(dx) > 40) { didMove = true; goTo(realActive + (dx < 0 ? 1 : -1), true); }
//     startX = null;
//   }
//   track.addEventListener('mousedown',  e => onStart(e.clientX));
//   window.addEventListener('mouseup',   e => onEnd(e.clientX));
//   track.addEventListener('touchstart', e => onStart(e.touches[0].clientX), { passive: true });
//   track.addEventListener('touchend',   e => onEnd(e.changedTouches[0].clientX), { passive: true });
//   track.addEventListener('click', e => { if (didMove) e.stopPropagation(); }, true);

//   const carousel = track.parentElement;
//   function setCarouselWidth() {
//     const sz  = getSizes();
//     const w   = sz.active + 2 * sz.near + 2 * sz.far + 4 * sz.gap;
//     const max = document.querySelector('.testimonials').offsetWidth - 48;
//     carousel.style.width = Math.min(w, max) + 'px';
//   }

//   window.addEventListener('resize', () => {
//     setCarouselWidth();
//     applyClasses(trackActive);
//     moveTrack(computeX(trackActive), false);
//     track.style.transition = '';
//   });

//   setCarouselWidth();
//   applyClasses(trackActive);
//   moveTrack(computeX(trackActive), false);
//   track.style.transition = '';
//   panels.forEach((p, i) => p.classList.toggle('active', i === realActive));
//   dots.forEach((d, i)   => d.classList.toggle('active', i === realActive));
// })();







// // HOME-PAGE FIRST CAROUSEL





// (function () {
//     const grid = document.getElementById('upxSvcGrid');
//     const dots = document.querySelectorAll('.upx-dot');
//     if (!grid || !dots.length) return;

//     function getActiveIndex() {
//       const cards = grid.querySelectorAll('.upx-svc-card');
//       const scrollLeft = grid.scrollLeft;
//       let closest = 0;
//       let minDist = Infinity;
//       cards.forEach((card, i) => {
//         const dist = Math.abs(card.offsetLeft - scrollLeft);
//         if (dist < minDist) { minDist = dist; closest = i; }
//       });
//       return closest;
//     }

//     function updateDots(index) {
//       dots.forEach((d, i) => d.classList.toggle('upx-dot--active', i === index));
//     }

//     grid.addEventListener('scroll', () => {
//       updateDots(getActiveIndex());
//     }, { passive: true });

//     dots.forEach(dot => {
//       dot.addEventListener('click', () => {
//         const index = parseInt(dot.dataset.index);
//         const cards = grid.querySelectorAll('.upx-svc-card');
//         if (cards[index]) {
//           grid.scrollTo({ left: cards[index].offsetLeft, behavior: 'smooth' });
//         }
//       });
//     });
//   })();











//   // FIFTH SECTION






//   (function () {
//     const track = document.getElementById('upxProjTrack');
//     const wrap  = document.getElementById('upxProjWrap');
//     const prev  = document.getElementById('upxProjPrev');
//     const next  = document.getElementById('upxProjNext');
//     if (!track || !wrap || !prev || !next) return;

//     let current = 0;

//     function getVisible() {
//       const ww = window.innerWidth;
//       if (ww <= 600)  return 1;
//       if (ww <= 1024) return 2;
//       return 4;
//     }

//     function getCards() {
//       return track.querySelectorAll('.upx-pcard');
//     }

//     function getCardWidth() {
//       const cards = getCards();
//       if (!cards.length) return 0;
//       const style = window.getComputedStyle(track);
//       const gap = parseFloat(style.gap) || 22;
//       return cards[0].offsetWidth + gap;
//     }

//     function maxIndex() {
//       return Math.max(0, getCards().length - getVisible());
//     }

//     function goTo(index) {
//       const cards = getCards();
//       current = Math.max(0, Math.min(index, maxIndex()));
//       const offset = current * getCardWidth();
//       track.style.transform = `translateX(-${offset}px)`;
//       prev.style.opacity = current === 0 ? '0.4' : '1';
//       next.style.opacity = current >= maxIndex() ? '0.4' : '1';
//     }

//     prev.addEventListener('click', () => goTo(current - 1));
//     next.addEventListener('click', () => goTo(current + 1));
//     window.addEventListener('resize', () => goTo(current));

//     // touch swipe
//     let touchStartX = 0;
//     wrap.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
//     wrap.addEventListener('touchend', e => {
//       const diff = touchStartX - e.changedTouches[0].clientX;
//       if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
//     }, { passive: true });

//     goTo(0);
//   })();








/* ============================================================
   main.js  –  Uniprix Investment
   All sections are safely guarded so missing elements on a
   given page never break other scripts.
   ============================================================ */


/* ── 1. NAVBAR ─────────────────────────────────────────── */
(function () {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinks      = document.getElementById('navLinks');
  const navbar        = document.querySelector('.navbar');
  if (!mobileMenuBtn || !navLinks || !navbar) return;   // guard

  mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    mobileMenuBtn.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
  });

  navLinks.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      navLinks.classList.remove('active');
      mobileMenuBtn.textContent = '☰';
    }
  });

  let lastScrollY = window.scrollY;
  let ticking     = false;

  function handleScroll() {
    const currentScrollY = window.scrollY;
    const scrollingDown  = currentScrollY > lastScrollY;

    if (currentScrollY <= 10) {
      navbar.classList.remove('nav-hidden');
    } else if (scrollingDown) {
      navbar.classList.add('nav-hidden');
      navLinks.classList.remove('active');
      mobileMenuBtn.textContent = '☰';
    } else {
      navbar.classList.remove('nav-hidden');
    }

    lastScrollY = currentScrollY;
    ticking     = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(handleScroll);
      ticking = true;
    }
  }, { passive: true });
})();


/* ── 2. SERVICES SECTION – mobile carousel dots ────────── */
(function () {
  const grid = document.getElementById('upxSvcGrid');
  const dots = document.querySelectorAll('.upx-dot');
  if (!grid || !dots.length) return;   // guard

  function getActiveIndex() {
    const cards    = grid.querySelectorAll('.upx-svc-card');
    const scrollLeft = grid.scrollLeft;
    let closest = 0;
    let minDist = Infinity;
    cards.forEach((card, i) => {
      const dist = Math.abs(card.offsetLeft - scrollLeft);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    return closest;
  }

  function updateDots(index) {
    dots.forEach((d, i) => d.classList.toggle('upx-dot--active', i === index));
  }

  grid.addEventListener('scroll', () => {
    updateDots(getActiveIndex());
  }, { passive: true });

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const index = parseInt(dot.dataset.index, 10);
      const cards = grid.querySelectorAll('.upx-svc-card');
      if (cards[index]) {
        grid.scrollTo({ left: cards[index].offsetLeft, behavior: 'smooth' });
      }
    });
  });
})();


/* ── 3. OUR PROJECTS – prev / next carousel ────────────── */
(function () {
  const track = document.getElementById('upxProjTrack');
  const wrap  = document.getElementById('upxProjWrap');
  const prev  = document.getElementById('upxProjPrev');
  const next  = document.getElementById('upxProjNext');
  if (!track || !wrap || !prev || !next) return;   // guard

  let current = 0;

  function getVisible() {
    const ww = window.innerWidth;
    if (ww <= 600)  return 1;
    if (ww <= 1024) return 2;
    return 4;
  }

  function getCards() {
    return track.querySelectorAll('.upx-pcard');
  }

  function getCardWidth() {
    const cards = getCards();
    if (!cards.length) return 0;
    const gap = parseFloat(window.getComputedStyle(track).gap) || 22;
    return cards[0].offsetWidth + gap;
  }

  function maxIndex() {
    return Math.max(0, getCards().length - getVisible());
  }

  function goTo(index) {
    current = Math.max(0, Math.min(index, maxIndex()));
    track.style.transform  = `translateX(-${current * getCardWidth()}px)`;
    prev.style.opacity     = current === 0          ? '0.4' : '1';
    next.style.opacity     = current >= maxIndex()  ? '0.4' : '1';
  }

  prev.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));

  window.addEventListener('resize', () => goTo(current), { passive: true });

  // Touch swipe
  let touchStartX = 0;
  wrap.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  wrap.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
  }, { passive: true });

  goTo(0);
})();


/* ── 4. TESTIMONIALS – avatar carousel ─────────────────── */
(function () {
  const track = document.getElementById('avatarTrack');
  if (!track) return;   // guard – only runs on pages with testimonials

  const panels = [...document.querySelectorAll('.testimonial')];
  const dots   = [...document.querySelectorAll('.t-dot')];
  if (!panels.length) return;

  const DATA = [
    { name: 'James M.',  img: 'https://i.pravatar.cc/150?img=12' },
    { name: 'David O.',  img: 'https://i.pravatar.cc/150?img=33' },
    { name: 'Sarah K.',  img: 'https://i.pravatar.cc/150?img=47' },
    { name: 'Marcus T.', img: 'https://i.pravatar.cc/150?img=52' },
    { name: 'Amara N.',  img: 'https://i.pravatar.cc/150?img=25' },
  ];
  const COUNT = DATA.length;

  function getCSSPx(name) {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;
  }

  function getSizes() {
    const mobile = window.innerWidth <= 580;
    return {
      active: getCSSPx('--sz-active') || (mobile ? 84  : 110),
      near:   getCSSPx('--sz-near')   || (mobile ? 58  : 76),
      far:    getCSSPx('--sz-far')    || (mobile ? 44  : 58),
      gap:    getCSSPx('--t-gap')     || (mobile ? 13  : 20),
    };
  }

  function slotSize(dist, sz) {
    if (dist === 0) return sz.active;
    if (dist === 1) return sz.near;
    return sz.far;
  }

  const REPEATS   = 5;
  const TOTAL     = COUNT * REPEATS;
  const MID_START = COUNT * Math.floor(REPEATS / 2);
  const slots     = [];

  for (let t = 0; t < TOTAL; t++) {
    const d   = DATA[t % COUNT];
    const btn = document.createElement('button');
    btn.className        = 'av-slot';
    btn.dataset.trackIdx = t;
    btn.setAttribute('aria-label', d.name);
    const img = document.createElement('img');
    img.src = d.img; img.alt = d.name; img.draggable = false;
    btn.appendChild(img);
    track.appendChild(btn);
    slots.push(btn);
  }

  let realActive  = 2;
  let trackActive = MID_START + realActive;

  function computeX(tActive) {
    const sz    = getSizes();
    const allSz = slots.map((_, i) => slotSize(Math.abs(i - tActive), sz));
    let cx = 0;
    for (let i = 0; i < tActive; i++) cx += allSz[i] + sz.gap;
    cx += allSz[tActive] / 2;
    return track.parentElement.offsetWidth / 2 - cx;
  }

  function applyClasses(tActive) {
    slots.forEach((s, i) => {
      const d = Math.abs(i - tActive);
      s.classList.toggle('active', d === 0);
      s.classList.toggle('near',   d === 1);
    });
  }

  function moveTrack(x, animate) {
    track.style.transition = animate
      ? 'transform 0.50s cubic-bezier(0.35,0,0.15,1)'
      : 'none';
    track.style.transform = `translateY(-50%) translateX(${x}px)`;
    if (!animate) track.getBoundingClientRect(); // force reflow
  }

  function loopJump() {
    const center = MID_START + realActive;
    if (trackActive === center) return;
    trackActive = center;
    applyClasses(trackActive);
    moveTrack(computeX(trackActive), false);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      track.style.transition = '';
    }));
  }

  let transitioning = false;

  function goTo(newReal, animate = true) {
    if (animate && transitioning) return;
    const step   = newReal - realActive;
    realActive   = ((newReal % COUNT) + COUNT) % COUNT;
    trackActive += step;
    applyClasses(trackActive);
    moveTrack(computeX(trackActive), animate);
    panels.forEach((p, i) => p.classList.toggle('active', i === realActive));
    dots.forEach((d, i)   => d.classList.toggle('active', i === realActive));
    if (animate) {
      transitioning = true;
      track.addEventListener('transitionend', function h() {
        track.removeEventListener('transitionend', h);
        loopJump();
        transitioning = false;
      });
    }
  }

  slots.forEach(btn => {
    btn.addEventListener('click', () => {
      const diff = +btn.dataset.trackIdx - trackActive;
      if (Math.abs(diff) > 2) return;
      goTo(realActive + diff, true);
    });
  });

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      let diff = +dot.dataset.index - realActive;
      if (diff >  COUNT / 2) diff -= COUNT;
      if (diff < -COUNT / 2) diff += COUNT;
      if (diff === 0) return;
      goTo(realActive + diff, true);
    });
  });

  // Drag / swipe
  let startX = null, didMove = false;
  function onStart(x) { startX = x; didMove = false; }
  function onEnd(x) {
    if (startX === null) return;
    const dx = x - startX;
    if (Math.abs(dx) > 40) { didMove = true; goTo(realActive + (dx < 0 ? 1 : -1), true); }
    startX = null;
  }
  track.addEventListener('mousedown',  e => onStart(e.clientX));
  window.addEventListener('mouseup',   e => onEnd(e.clientX));
  track.addEventListener('touchstart', e => onStart(e.touches[0].clientX), { passive: true });
  track.addEventListener('touchend',   e => onEnd(e.changedTouches[0].clientX), { passive: true });
  track.addEventListener('click', e => { if (didMove) e.stopPropagation(); }, true);

  const carousel = track.parentElement;

  function setCarouselWidth() {
    const sz  = getSizes();
    const w   = sz.active + 2 * sz.near + 2 * sz.far + 4 * sz.gap;
    const max = document.querySelector('.testimonials').offsetWidth - 48;
    carousel.style.width = Math.min(w, max) + 'px';
  }

  window.addEventListener('resize', () => {
    setCarouselWidth();
    applyClasses(trackActive);
    moveTrack(computeX(trackActive), false);
    track.style.transition = '';
  }, { passive: true });

  // Init
  setCarouselWidth();
  applyClasses(trackActive);
  moveTrack(computeX(trackActive), false);
  track.style.transition = '';
  panels.forEach((p, i) => p.classList.toggle('active', i === realActive));
  dots.forEach((d, i)   => d.classList.toggle('active', i === realActive));
})();














// GALLERY



function upxLbOpen(el) {
        const img = el.querySelector('img');
        if (!img) return;
        document.getElementById('upxLbImg').src = img.src;
        document.getElementById('upxLightbox').classList.add('upx-lb-open');
        document.body.style.overflow = 'hidden';
    }
    function upxLbClose() {
        document.getElementById('upxLightbox').classList.remove('upx-lb-open');
        document.body.style.overflow = '';
    }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') upxLbClose(); });








    // FORMSPREE EMAILING


  const form = document.getElementById('contact-form');
  const successDiv = document.getElementById('form-success');

  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault(); // stop normal submission + redirect

      // Optional: disable button & change text while sending
      const submitBtn = form.querySelector('.submit-btn');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      const formData = new FormData(form);

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          // Success → clear fields + show message
          form.reset();
          successDiv.style.display = 'block';

          // Optional: auto-hide success message after 8 seconds
          setTimeout(() => {
            successDiv.style.display = 'none';
          }, 8000);

          // Reset button
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        } else {
          // Server error (e.g. spam, rate limit)
          alert('Something went wrong. Please try again.');
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }
      } catch (error) {
        // Network error
        alert('Network error — please check your connection.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }
