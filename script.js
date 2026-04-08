/* ============================================================
   script.js  –  Uniprix Investment
   Pure interactivity — no JSON fetch, no CMS.
   Edit content directly in the HTML files in VS Code.
   ============================================================ */


/* ── 1. NAVBAR ─────────────────────────────────────────── */
(function () {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinks      = document.getElementById('navLinks');
  const navbar        = document.querySelector('.navbar');
  if (!mobileMenuBtn || !navLinks || !navbar) return;

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
    if (currentScrollY <= 10)   navbar.classList.remove('nav-hidden');
    else if (scrollingDown)   { navbar.classList.add('nav-hidden'); navLinks.classList.remove('active'); mobileMenuBtn.textContent = '☰'; }
    else                        navbar.classList.remove('nav-hidden');
    lastScrollY = currentScrollY;
    ticking     = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(handleScroll); ticking = true; }
  }, { passive: true });
})();


/* ── 2. SERVICES SECTION – mobile carousel dots ────────── */
(function () {
  const grid = document.getElementById('upxSvcGrid');
  const dots = document.querySelectorAll('.upx-dot');
  if (!grid || !dots.length) return;

  function getActiveIndex() {
    const cards = grid.querySelectorAll('.upx-svc-card');
    let closest = 0, minDist = Infinity;
    cards.forEach((card, i) => {
      const dist = Math.abs(card.offsetLeft - grid.scrollLeft);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    return closest;
  }

  function updateDots(index) {
    dots.forEach((d, i) => d.classList.toggle('upx-dot--active', i === index));
  }

  grid.addEventListener('scroll', () => updateDots(getActiveIndex()), { passive: true });

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const index = parseInt(dot.dataset.index, 10);
      const cards = grid.querySelectorAll('.upx-svc-card');
      if (cards[index]) grid.scrollTo({ left: cards[index].offsetLeft, behavior: 'smooth' });
    });
  });
})();


/* ── 3. OUR PROJECTS – prev / next carousel ────────────── */
(function () {
  const track = document.getElementById('upxProjTrack');
  const wrap  = document.getElementById('upxProjWrap');
  const prev  = document.getElementById('upxProjPrev');
  const next  = document.getElementById('upxProjNext');
  if (!track || !wrap || !prev || !next) return;

  let current = 0;

  function getVisible() {
    const ww = window.innerWidth;
    if (ww <= 600)  return 1;
    if (ww <= 1024) return 2;
    return 4;
  }
  function getCards()     { return track.querySelectorAll('.upx-pcard'); }
  function getCardWidth() {
    const cards = getCards();
    if (!cards.length) return 0;
    return cards[0].offsetWidth + (parseFloat(window.getComputedStyle(track).gap) || 22);
  }
  function maxIndex() { return Math.max(0, getCards().length - getVisible()); }

  function goTo(index) {
    current = Math.max(0, Math.min(index, maxIndex()));
    track.style.transform = `translateX(-${current * getCardWidth()}px)`;
    prev.style.opacity    = current === 0         ? '0.4' : '1';
    next.style.opacity    = current >= maxIndex() ? '0.4' : '1';
  }

  prev.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));
  window.addEventListener('resize', () => goTo(current), { passive: true });

  let touchStartX = 0;
  wrap.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  wrap.addEventListener('touchend',   e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
  }, { passive: true });

  goTo(0);
})();


/* ── 4. TESTIMONIALS ────────────────────────────────────── */
/*
   ╔══════════════════════════════════════════════════════╗
   ║  EDIT YOUR TESTIMONIALS HERE — no other file needed  ║
   ╚══════════════════════════════════════════════════════╝
   - name : reviewer's name
   - text : their quote
   - img  : photo URL or local path e.g. "./assets/photo.jpg"

   To add a review:    copy one block { ... } and paste it
   To remove a review: delete the block
   To change text:     just retype inside the quotes
*/
(function () {
  const stage         = document.getElementById('carouselStage');
  const reviewContent = document.getElementById('reviewContent');
  const reviewName    = document.getElementById('reviewName');
  const reviewText    = document.getElementById('reviewText');
  const prevBtn       = document.getElementById('prevBtn');
  const nextBtn       = document.getElementById('nextBtn');
  const heading       = document.getElementById('testimonialsHeading');
  const subheading    = document.getElementById('testimonialsSubheading');
  if (!stage || !prevBtn || !nextBtn) return;

  // ── HEADING & SUBHEADING ──────────────────────────────
  const HEADING    = 'What Our Clients Say';
  const SUBHEADING = 'Real feedback from people we have worked with across Uganda.';

  // ── REVIEWS ──────────────────────────────────────────
  const reviews = [
    {
      name: 'John Mukasa',
      text: 'Uniprix handled our office renovation with professionalism and precision. They delivered on time and kept us informed every step of the way.',
      img:  'https://randomuser.me/api/portraits/men/32.jpg'
    },
    {
      name: 'Sarah Nalubega',
      text: 'The interior design team transformed our home beyond expectations. Great attention to detail and very client-focused throughout the project.',
      img:  'https://randomuser.me/api/portraits/women/44.jpg'
    },
    {
      name: 'David Otieno',
      text: 'From planning to execution, Uniprix Investment showed true expertise. Our commercial building was completed within budget and on schedule.',
      img:  'https://randomuser.me/api/portraits/men/56.jpg'
    },
    {
      name: 'Grace Apio',
      text: 'Reliable, honest, and skilled. I highly recommend Uniprix for any construction or renovation work. They genuinely care about quality.',
      img:  'https://randomuser.me/api/portraits/women/68.jpg'
    },
    {
      name: 'Robert Ssemakula',
      text: 'Excellent project management from start to finish. The site visits were thorough and the team communicated clearly throughout.',
      img:  'https://randomuser.me/api/portraits/men/77.jpg'
    },
  ];
  // ─────────────────────────────────────────────────────

  if (heading)    heading.textContent    = HEADING;
  if (subheading) subheading.textContent = SUBHEADING;

  const total = reviews.length;
  let current  = 0;
  let animating = false;
  const slots  = [];

  reviews.forEach((review, i) => {
    const el  = document.createElement('div');
    el.className = 'avatar-slot';
    const img = document.createElement('img');
    img.src = review.img;
    img.alt = review.name;
    el.appendChild(img);
    stage.appendChild(el);
    slots.push(el);
    el.addEventListener('click', () => { if (el.getAttribute('data-pos') !== '0') goTo(i); });
  });

  function posLabel(idx) {
    let diff = idx - current;
    if (diff >  total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    if (diff ===  0) return '0';
    if (diff === -1) return '-1';
    if (diff ===  1) return '1';
    if (diff === -2) return '-2';
    if (diff ===  2) return '2';
    return diff < -2 ? 'hidden-left' : 'hidden-right';
  }

  function updateSlots() { slots.forEach((s, i) => s.setAttribute('data-pos', posLabel(i))); }
  function updateText()  {
    if (reviewName) reviewName.textContent = reviews[current].name;
    if (reviewText) reviewText.textContent = reviews[current].text;
  }

  function goTo(next) {
    if (animating) return;
    animating = true;
    reviewContent.classList.add('fading');
    current = ((next % total) + total) % total;
    updateSlots();
    setTimeout(() => {
      updateText();
      reviewContent.classList.remove('fading');
      animating = false;
    }, 350);
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  let touchStartX = 0;
  stage.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) goTo(dx < 0 ? current + 1 : current - 1);
  }, { passive: true });

  updateSlots();
  updateText();
})();


/* ── 5. LIGHTBOX (Gallery) ──────────────────────────────── */
function upxLbOpen(el) {
  const img   = el.querySelector('img');
  const lb    = document.getElementById('upxLightbox');
  const lbImg = document.getElementById('upxLbImg');
  if (!img || !lb || !lbImg) return;
  lbImg.src = img.src;
  lb.classList.add('upx-lb-open');
  document.body.style.overflow = 'hidden';
}
function upxLbClose() {
  const lb = document.getElementById('upxLightbox');
  if (!lb) return;
  lb.classList.remove('upx-lb-open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') upxLbClose(); });


/* ── 6. CONTACT FORM (Formspree) ────────────────────────── */
(function () {
  const form       = document.getElementById('contact-form');
  const successDiv = document.getElementById('form-success');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const submitBtn    = form.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled    = true;
    submitBtn.textContent = 'Sending...';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        form.reset();
        if (successDiv) {
          successDiv.style.display = 'block';
          setTimeout(() => { successDiv.style.display = 'none'; }, 8000);
        }
      } else {
        alert('Something went wrong. Please try again.');
      }
    } catch {
      alert('Network error — please check your connection.');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled    = false;
    }
  });
})();


/* ── 7. SERVICES CARDS CAROUSEL (sc-) ───────────────────── */
(function () {
  const track      = document.getElementById('scTrack');
  const trackOuter = document.getElementById('scTrackOuter');
  const prevBtn    = document.getElementById('scPrev');
  const nextBtn    = document.getElementById('scNext');
  const dots       = document.querySelectorAll('.sc-dot');
  if (!track || !trackOuter || !prevBtn || !nextBtn) return;

  const cards = track.querySelectorAll('.sc-card');
  const TOTAL = cards.length;
  const GAP   = 20;
  let currentIndex = 0;

  function visibleCount() {
    const w = window.innerWidth;
    if (w >= 1024) return 3;
    if (w >= 640)  return 2;
    return 1;
  }

  function sizeCards() {
    const vis   = visibleCount();
    const outerW = trackOuter.clientWidth;
    const padH  = parseFloat(getComputedStyle(track).paddingLeft) * 2;
    const cardW = Math.floor((outerW - padH - GAP * (vis - 1)) / vis);
    cards.forEach(c => { c.style.width = cardW + 'px'; });
  }

  function goTo(index) {
    const vis      = visibleCount();
    const maxIndex = Math.max(0, TOTAL - vis);
    currentIndex   = Math.max(0, Math.min(index, maxIndex));
    track.style.transform = `translateX(-${currentIndex * (cards[0].offsetWidth + GAP)}px)`;
    dots.forEach((d, i) => d.classList.toggle('sc-dot--active', i === currentIndex));
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= maxIndex;
  }

  prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
  nextBtn.addEventListener('click', () => goTo(currentIndex + 1));
  dots.forEach(d => d.addEventListener('click', () => goTo(Number(d.dataset.index))));

  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) goTo(currentIndex + (dx < 0 ? 1 : -1));
  }, { passive: true });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { sizeCards(); goTo(currentIndex); }, 120);
  });

  sizeCards();
  goTo(0);
  window.reInitServicesCarousel = () => { sizeCards(); goTo(0); };
})();
