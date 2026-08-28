/* ============================================================
   script.js  –  Uniprix Investment
   Page interactivity; testimonials load from CMS JSON in HTML.
   ============================================================ */


/* ── 1. NAVBAR ─────────────────────────────────────────── */
(function () {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinks      = document.getElementById('navLinks');
  const navbar        = document.querySelector('.navbar');
  if (!mobileMenuBtn || !navLinks || !navbar) return;

  const menuIcon = mobileMenuBtn.querySelector('[aria-hidden="true"]');

  function setMenuOpen(isOpen) {
    navLinks.classList.toggle('active', isOpen);
    if (menuIcon) menuIcon.textContent = isOpen ? '✕' : '☰';
    mobileMenuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    mobileMenuBtn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  }

  mobileMenuBtn.addEventListener('click', () => {
    setMenuOpen(!navLinks.classList.contains('active'));
  });

  navLinks.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') setMenuOpen(false);
  });

  let lastScrollY = window.scrollY;
  let ticking     = false;

  function handleScroll() {
    const currentScrollY = window.scrollY;
    const scrollingDown  = currentScrollY > lastScrollY;
    if (currentScrollY <= 10)   navbar.classList.remove('nav-hidden');
    else if (scrollingDown)   { navbar.classList.add('nav-hidden'); setMenuOpen(false); }
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
    dots.forEach((d, i) => {
      const active = i === index;
      d.classList.toggle('upx-dot--active', active);
      d.setAttribute('aria-selected', active ? 'true' : 'false');
    });
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

  function setNavState(btn, disabled) {
    btn.disabled = disabled;
    btn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
  }

  function goTo(index) {
    current = Math.max(0, Math.min(index, maxIndex()));
    track.style.transform = `translateX(-${current * getCardWidth()}px)`;
    prev.style.opacity    = current === 0         ? '0.4' : '1';
    next.style.opacity    = current >= maxIndex() ? '0.4' : '1';
    setNavState(prev, current === 0);
    setNavState(next, current >= maxIndex());
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
(function () {
  const section       = document.querySelector('.testimonials');
  const stage         = document.getElementById('carouselStage');
  const reviewContent = document.getElementById('reviewContent');
  const reviewName    = document.getElementById('reviewName');
  const reviewText    = document.getElementById('reviewText');
  const prevBtn       = document.getElementById('prevBtn');
  const nextBtn       = document.getElementById('nextBtn');
  const heading       = document.getElementById('testimonialsHeading');
  const subheading    = document.getElementById('testimonialsSubheading');
  if (!stage || !prevBtn || !nextBtn) return;

  const dataEl = document.getElementById('testimonials-data');
  let reviews = [];
  if (dataEl) {
    try {
      const config = JSON.parse(dataEl.textContent);
      reviews = (config.reviews || []).map(r => ({
        name: r.name,
        text: r.text,
        img: r.image || r.img,
      }));
    } catch { /* ignore */ }
  }
  if (!reviews.length) return;

  const total = reviews.length;
  let current  = 0;
  let animating = false;
  const slots  = [];

  reviews.forEach((review, i) => {
    const el  = document.createElement('button');
    el.type = 'button';
    el.className = 'avatar-slot';
    el.setAttribute('aria-label', `Show review from ${review.name}`);
    const img = document.createElement('img');
    img.src = review.img;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
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

  function updateSlots() {
    slots.forEach((s, i) => {
      const active = posLabel(i) === '0';
      s.setAttribute('data-pos', posLabel(i));
      s.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

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

  section?.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(current - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
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
(function () {
  const lb      = document.getElementById('upxLightbox');
  const lbImg   = document.getElementById('upxLbImg');
  const lbClose = document.getElementById('upxLbClose');
  if (!lb || !lbImg || !lbClose) return;

  let lastFocus = null;

  function upxLbOpen(el) {
    const img = el.querySelector('img');
    if (!img) return;
    lastFocus = document.activeElement;
    lbImg.src = img.src;
    lbImg.alt = img.alt || 'Enlarged gallery image';
    lb.hidden = false;
    lb.classList.add('upx-lb-open');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function upxLbClose() {
    lb.classList.remove('upx-lb-open');
    lb.hidden = true;
    lbImg.src = '';
    lbImg.alt = '';
    document.body.style.overflow = '';
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  window.upxLbOpen = upxLbOpen;
  window.upxLbClose = upxLbClose;

  lbClose.addEventListener('click', upxLbClose);
  lb.addEventListener('click', e => { if (e.target === lb) upxLbClose(); });

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('upx-lb-open')) return;
    if (e.key === 'Escape') upxLbClose();
  });

  document.querySelectorAll('.upx-gitem').forEach(item => {
    const img = item.querySelector('img');
    const label = img?.alt ? `View larger image: ${img.alt}` : 'View larger image';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', label);
    item.addEventListener('click', () => upxLbOpen(item));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        upxLbOpen(item);
      }
    });
  });
})();


/* ── 6. CONTACT FORM (Formspree) ────────────────────────── */
(function () {
  const form       = document.getElementById('contact-form');
  const successDiv = document.getElementById('form-success');
  if (!form) return;

  let errorDiv = document.getElementById('form-error');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.id = 'form-error';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.style.cssText = 'display:none;margin-top:1rem;padding:1rem;background:#ffe6e6;border:1px solid #ffb3b3;border-radius:6px;color:#660000;text-align:center;';
    form.appendChild(errorDiv);
  }

  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    if (successDiv) successDiv.style.display = 'none';
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const submitBtn    = form.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled    = true;
    submitBtn.textContent = 'Sending...';
    errorDiv.style.display = 'none';

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
        showError('Something went wrong. Please try again.');
      }
    } catch {
      showError('Network error — please check your connection.');
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
    dots.forEach((d, i) => {
      const active = i === currentIndex;
      d.classList.toggle('sc-dot--active', active);
      d.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= maxIndex;
    prevBtn.setAttribute('aria-disabled', currentIndex === 0 ? 'true' : 'false');
    nextBtn.setAttribute('aria-disabled', currentIndex >= maxIndex ? 'true' : 'false');
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
