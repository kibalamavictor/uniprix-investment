/* ============================================================
   script.js  –  Uniprix Investment
   All sections are safely guarded so missing elements on a
   given page never break other scripts.
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
/* Called once after services cards are injected by JSON loader */
function initServicesDots() {
  const grid = document.getElementById('upxSvcGrid');
  const dots = document.querySelectorAll('.upx-dot');
  if (!grid || !dots.length) return;

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
}


/* ── 3. OUR PROJECTS – prev / next carousel ────────────── */
/* Called once after project cards are injected by JSON loader */
function initProjectsCarousel() {
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
    prev.style.opacity     = current === 0         ? '0.4' : '1';
    next.style.opacity     = current >= maxIndex() ? '0.4' : '1';
  }

  prev.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));

  window.addEventListener('resize', () => goTo(current), { passive: true });

  let touchStartX = 0;
  wrap.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  wrap.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
  }, { passive: true });

  goTo(0);
}


/* ── 4. TESTIMONIALS – avatar carousel ─────────────────── */
/* Accepts the testimonialsSection data object directly      */
function initTestimonials(section) {
  'use strict';

  var stage         = document.getElementById('carouselStage');
  var reviewContent = document.getElementById('reviewContent');
  var reviewName    = document.getElementById('reviewName');
  var reviewText    = document.getElementById('reviewText');
  var prevBtn       = document.getElementById('prevBtn');
  var nextBtn       = document.getElementById('nextBtn');
  var heading       = document.getElementById('testimonialsHeading');
  var subheading    = document.getElementById('testimonialsSubheading');

  if (!stage || !reviewContent || !prevBtn || !nextBtn) return;

  var reviews  = [];
  var slots    = [];
  var total    = 0;
  var current  = 0;
  var animating = false;

  /* Static text */
  if (heading)    heading.textContent    = section.heading;
  if (subheading) subheading.textContent = section.subheading;

  reviews = section.reviews;
  total   = reviews.length;
  current = 0;
  slots   = [];
  stage.innerHTML = '';

  reviews.forEach(function (review, i) {
    var el  = document.createElement('div');
    el.className = 'avatar-slot';
    var img = document.createElement('img');
    img.src = review.img;
    img.alt = review.name;
    el.appendChild(img);
    stage.appendChild(el);
    slots.push(el);

    el.addEventListener('click', function () {
      if (el.getAttribute('data-pos') === '0') return;
      goTo(i);
    });
  });

  function posLabel(slotIndex) {
    var diff = slotIndex - current;
    if (diff >  total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    if (diff ===  0) return '0';
    if (diff === -1) return '-1';
    if (diff ===  1) return '1';
    if (diff === -2) return '-2';
    if (diff ===  2) return '2';
    if (diff  <  -2) return 'hidden-left';
    return 'hidden-right';
  }

  function updateSlots() {
    slots.forEach(function (slot, idx) {
      slot.setAttribute('data-pos', posLabel(idx));
    });
  }

  function updateText() {
    reviewName.textContent = reviews[current].name;
    reviewText.textContent = reviews[current].text;
  }

  function goTo(next) {
    if (animating) return;
    animating = true;
    reviewContent.classList.add('fading');
    current = ((next % total) + total) % total;
    updateSlots();
    setTimeout(function () {
      updateText();
      reviewContent.classList.remove('fading');
      animating = false;
    }, 350);
  }

  prevBtn.addEventListener('click', function () { goTo(current - 1); });
  nextBtn.addEventListener('click', function () { goTo(current + 1); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft')  goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  var touchStartX = 0;
  stage.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) goTo(dx < 0 ? current + 1 : current - 1);
  }, { passive: true });

  updateSlots();
  updateText();
}


/* ── 5. LIGHTBOX (Gallery) ──────────────────────────────── */
function upxLbOpen(el) {
  const img = el.querySelector('img');
  if (!img) return;
  const lb    = document.getElementById('upxLightbox');
  const lbImg = document.getElementById('upxLbImg');
  if (!lb || !lbImg) return;
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

    const submitBtn   = form.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
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
    const vis      = visibleCount();
    const outerW   = trackOuter.clientWidth;
    const padH     = parseFloat(getComputedStyle(track).paddingLeft) * 2;
    const available = outerW - padH - GAP * (vis - 1);
    const cardW    = Math.floor(available / vis);
    cards.forEach(c => { c.style.width = cardW + 'px'; });
  }

  function goTo(index) {
    const vis      = visibleCount();
    const maxIndex = Math.max(0, TOTAL - vis);
    currentIndex   = Math.max(0, Math.min(index, maxIndex));

    const cardW  = cards[0].offsetWidth;
    const offset = currentIndex * (cardW + GAP);
    track.style.transform = `translateX(-${offset}px)`;

    dots.forEach((d, i) => {
      d.classList.toggle('sc-dot--active', i === currentIndex);
    });

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= maxIndex;
  }

  function init() {
    sizeCards();
    goTo(currentIndex);
  }

  prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
  nextBtn.addEventListener('click', () => goTo(currentIndex + 1));
  dots.forEach(d => {
    d.addEventListener('click', () => goTo(Number(d.dataset.index)));
  });

  let touchStartX = 0;
  track.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) goTo(currentIndex + (dx < 0 ? 1 : -1));
  }, { passive: true });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { sizeCards(); goTo(currentIndex); }, 120);
  });

  init();
  window.reInitServicesCarousel = init;
})();


/* ── 8. LOAD ALL CONTENT FROM JSON ─────────────────────── */
/* This is the single fetch that powers every dynamic section */
(function () {
  /* Detect which folder depth we are at.
     - Root pages  (index.html, gallery, contact-us, etc.)  → ./data/site-content.json
     - Subpages loaded from a subfolder won't need this file,
       but if they do, update the path in that page's own script. */
  const JSON_PATH = '/data/site-content.json';

  fetch(JSON_PATH)
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(data => {

      /* ── HERO ── */
      const heroHeadline = document.getElementById('hero-headline');
      const heroSubtitle = document.getElementById('hero-subtitle');
      const heroCtaBook  = document.getElementById('hero-cta-book');
      const heroCtaTalk  = document.getElementById('hero-cta-talk');
      const statsContainer = document.querySelector('.upx-hero__stats');
      const heroImgEl    = document.querySelector('.upx-hero__img-wrap img');

      if (heroHeadline)    heroHeadline.innerHTML      = data.hero.headline;
      if (heroSubtitle)    heroSubtitle.textContent    = data.hero.subtitle;
      if (heroCtaBook)     heroCtaBook.textContent     = data.hero.ctaBook;
      if (heroCtaTalk)     heroCtaTalk.textContent     = data.hero.ctaTalk;
      if (heroImgEl)       heroImgEl.src               = data.hero.heroImage;

      if (statsContainer) {
        statsContainer.innerHTML = '';
        data.hero.stats.forEach(stat => {
          const div = document.createElement('div');
          div.className = 'upx-stat';
          div.innerHTML = `
            <div class="upx-stat__icon"><img src="${stat.icon}" alt=""></div>
            <div class="upx-stat__info">
              <span class="upx-stat__number">${stat.number}</span>
              <span class="upx-stat__label">${stat.label}</span>
            </div>
          `;
          statsContainer.appendChild(div);
        });
      }

      /* ── ABOUT ── */
      const aboutLabel = document.getElementById('about-label');
      const aboutText1 = document.getElementById('about-text1');
      const aboutText2 = document.getElementById('about-text2');
      const aboutImg   = document.querySelector('.upx-about__img-wrap img');

      if (aboutLabel) aboutLabel.textContent = data.about.label;
      if (aboutText1) aboutText1.textContent = data.about.text1;
      if (aboutText2) aboutText2.textContent = data.about.text2;
      if (aboutImg)   aboutImg.src           = data.about.image;

      /* ── SERVICES ── */
      const svcGrid    = document.getElementById('upxSvcGrid');
      const svcHeading = document.getElementById('services-heading');

      if (svcGrid) {
        svcGrid.innerHTML = '';
        data.services.items.forEach((item, index) => {
          const card = document.createElement('div');
          card.className = `upx-svc-card ${index % 2 === 1 ? 'reverse-card' : ''}`;
          card.innerHTML = `
            <div class="upx-svc-card__img"><img src="${item.image}" alt="${item.title}"></div>
            <div class="upx-svc-card__body">
              <h3 class="upx-svc-card__title">${item.title}</h3>
              <p class="upx-svc-card__desc">${item.desc}</p>
            </div>
          `;
          svcGrid.appendChild(card);
        });
        /* Re-init dots AFTER cards are in the DOM */
        initServicesDots();
      }
      if (svcHeading) svcHeading.textContent = data.services.heading;

      /* ── WHY CHOOSE US ── */
      const whyLabel    = document.getElementById('why-label');
      const whySub      = document.getElementById('why-subtitle');
      const whyFeatures = document.getElementById('why-features');
      const whyImg      = document.querySelector('.upx-why__img-wrap img');

      if (whyLabel)    whyLabel.textContent    = data.whyChooseUs.label;
      if (whySub)      whySub.textContent      = data.whyChooseUs.subtitle;
      if (whyImg)      whyImg.src              = data.whyChooseUs.image;

      if (whyFeatures) {
        whyFeatures.innerHTML = '';
        data.whyChooseUs.features.forEach(feature => {
          const div = document.createElement('div');
          div.className = 'upx-feature';
          div.innerHTML = `
            <div class="upx-feature__icon"><img src="${feature.icon}" alt=""></div>
            <h3 class="upx-feature__title">${feature.title}</h3>
            <p class="upx-feature__desc">${feature.desc}</p>
          `;
          whyFeatures.appendChild(div);
        });
      }

      /* ── PROJECTS ── */
      const projTrack   = document.getElementById('upxProjTrack');
      const projHeading = document.getElementById('projects-heading');

      if (projTrack) {
        projTrack.innerHTML = '';
        data.projects.items.forEach(item => {
          const card = document.createElement('div');
          card.className = 'upx-pcard';
          card.innerHTML = `
            <div class="upx-pcard__img-wrap">
              <img src="${item.image}" alt="${item.title}">
            </div>
            <span class="upx-pcard__title">${item.title}</span>
            <a href="./our-projects/#${item.id}" class="upx-pcard__btn">View Project</a>
          `;
          projTrack.appendChild(card);
        });
        /* Re-init carousel AFTER cards are in the DOM */
        initProjectsCarousel();
      }
      if (projHeading) projHeading.textContent = data.projects.heading;

      /* ── TESTIMONIALS ── */
      if (data.testimonialsSection) {
        initTestimonials(data.testimonialsSection);
      }

      /* ── CTA SECTION ── */
      const ctaHeading = document.getElementById('cta-heading');
      const ctaImg     = document.querySelector('.cta-image');

      if (ctaHeading) ctaHeading.textContent = data.cta.heading;
      if (ctaImg)     ctaImg.src             = data.cta.image;

      /* ── FOOTER ── */
      const footerPhone = document.getElementById('footer-phone');
      const footerEmail = document.getElementById('footer-email');

      if (footerPhone) footerPhone.textContent = data.footer.phone;
      if (footerEmail) footerEmail.textContent = data.footer.email;

    })
    .catch(err => {
      console.error('site-content.json failed to load:', err);
    });
})();

/* ── ABOUT PAGE content loader (appended) ───────────────── */
/* Runs only when about-page elements exist in the DOM       */
document.addEventListener('DOMContentLoaded', function () {
  // These IDs only exist on the about-us page
  if (!document.getElementById('about-hero-title')) return;

  fetch('/data/site-content.json')
    .then(res => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
    .then(data => {
      const about = data.aboutPage;
      if (!about) return;

      // Hero title
      const el = id => document.getElementById(id);
      const qs = sel => document.querySelector(sel);

      if (el('about-hero-title'))    el('about-hero-title').textContent    = about.hero.title;

      // Main section
      if (el('about-main-heading'))  el('about-main-heading').textContent  = about.mainSection.heading;
      if (el('about-main-text1'))    el('about-main-text1').textContent    = about.mainSection.text1;
      if (el('about-main-text2'))    el('about-main-text2').textContent    = about.mainSection.text2;
      if (qs('.about-image'))        qs('.about-image').src                = about.mainSection.image;

      // Stats bar
      const statsBar = el('about-stats-bar');
      if (statsBar) {
        statsBar.innerHTML = '';
        about.stats.forEach(stat => {
          const item = document.createElement('div');
          item.className = 'stat-item';
          item.innerHTML = `
            <img src="${stat.icon}" alt="${stat.label} Icon" class="stat-icon">
            <div class="stat-text"><h3>${stat.number}</h3><p>${stat.label}</p></div>
          `;
          statsBar.appendChild(item);
        });
      }

      // Mission
      if (el('about-mission-heading'))  el('about-mission-heading').textContent = about.mission.heading;
      if (el('about-mission-text1'))    el('about-mission-text1').textContent   = about.mission.text1;
      if (el('about-mission-text2'))    el('about-mission-text2').textContent   = about.mission.text2;
      if (qs('.mission-grid .section-image')) qs('.mission-grid .section-image').src = about.mission.image;

      // Vision
      if (el('about-vision-heading'))   el('about-vision-heading').textContent  = about.vision.heading;
      if (el('about-vision-text'))      el('about-vision-text').textContent     = about.vision.text;
      if (qs('.vision-grid .section-image'))  qs('.vision-grid .section-image').src  = about.vision.image;

      // Values
      if (el('about-values-heading'))   el('about-values-heading').textContent  = about.values.heading;
      if (qs('.values-grid .section-image')) qs('.values-grid .section-image').src = about.values.image;
      const valuesList = el('about-values-list');
      if (valuesList) {
        valuesList.innerHTML = '';
        about.values.items.forEach(value => {
          const li = document.createElement('li');
          li.className = 'value-item';
          li.innerHTML = `<h3><span class="value-bullet"></span>${value.title}</h3><p>${value.desc}</p>`;
          valuesList.appendChild(li);
        });
      }

      // Testimonials — reuse the shared initTestimonials function
      if (data.testimonialsSection) {
        initTestimonials(data.testimonialsSection);
      }

      // Footer (about page has its own footer elements)
      if (el('footer-phone')) el('footer-phone').textContent = data.footer.phone;
      if (el('footer-email')) el('footer-email').textContent = data.footer.email;
    })
    .catch(err => console.error('About page: failed to load site-content.json', err));
});
