
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
      'use strict';

      var stage         = document.getElementById('carouselStage');
      var reviewContent = document.getElementById('reviewContent');
      var reviewName    = document.getElementById('reviewName');
      var reviewText    = document.getElementById('reviewText');
      var prevBtn       = document.getElementById('prevBtn');
      var nextBtn       = document.getElementById('nextBtn');
      var reviewCta     = document.getElementById('reviewCta');
      var heading       = document.getElementById('testimonialsHeading');
      var subheading    = document.getElementById('testimonialsSubheading');

      var reviews  = [];
      var slots    = [];
      var total    = 0;
      var current  = 0;
      var animating = false;

      /* ── Render all slots from loaded data ── */
      function renderSlots(data) {
        var section = data.testimonialsSection;

        /* Static text */
        heading.textContent    = section.heading;
        subheading.textContent = section.subheading;
        // reviewCta.textContent  = section.ctaText;
        // reviewCta.href         = section.ctaLink;

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
      }

      /* ── Position label relative to active index ── */
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

      /* ── Arrow buttons ── */
      prevBtn.addEventListener('click', function () { goTo(current - 1); });
      nextBtn.addEventListener('click', function () { goTo(current + 1); });

      /* ── Keyboard ── */
      document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft')  goTo(current - 1);
        if (e.key === 'ArrowRight') goTo(current + 1);
      });

      /* ── Touch / swipe ── */
      var touchStartX = 0;
      stage.addEventListener('touchstart', function (e) {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });
      stage.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) goTo(dx < 0 ? current + 1 : current - 1);
      }, { passive: true });

      /* ── Fetch JSON and boot ── */
      fetch('../data/site-content.json')
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (data) {
          renderSlots(data);
          updateSlots();
          updateText();
        })
        .catch(function (err) {
          console.error('Testimonials: failed to load site-content.json', err);
          stage.innerHTML = '<div class="t-error">Could not load testimonials. Please try again later.</div>';
        });

    }());
   














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





//       ============================================================
//       SCRIPT  –  carousel logic (desktop = 3 visible, mobile = 1)
//       ============================================================ 
   
    (function () {
      const track      = document.getElementById('scTrack');
      const trackOuter = document.getElementById('scTrackOuter');
      const prevBtn    = document.getElementById('scPrev');
      const nextBtn    = document.getElementById('scNext');
      const dots       = document.querySelectorAll('.sc-dot');
      const cards      = track.querySelectorAll('.sc-card');

      const TOTAL   = cards.length;
      const GAP     = 20;
      let currentIndex = 0;

      /* ── How many cards fit at this viewport width ── */
      function visibleCount() {
        const w = window.innerWidth;
        if (w >= 1024) return 3;
        if (w >= 640)  return 2;
        return 1;
      }

      /* ── Size cards so they fill the track evenly ── */
      function sizeCards() {
        const vis        = visibleCount();
        const outerW     = trackOuter.clientWidth;
        const padH       = parseFloat(getComputedStyle(track).paddingLeft) * 2;
        const available  = outerW - padH - GAP * (vis - 1);
        const cardW      = Math.floor(available / vis);

        cards.forEach(c => {
          c.style.width = cardW + 'px';
        });
      }

      /* ── Translate the track to show the right slide ── */
      function goTo(index) {
        const vis = visibleCount();
        const maxIndex = Math.max(0, TOTAL - vis);
        currentIndex = Math.max(0, Math.min(index, maxIndex));

        const cardW  = cards[0].offsetWidth;
        const offset = currentIndex * (cardW + GAP);
        track.style.transform = `translateX(-${offset}px)`;

        /* dots — highlight the first dot for each real "page" */
        dots.forEach((d, i) => {
          d.classList.toggle('sc-dot--active', i === currentIndex);
        });

        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex >= maxIndex;
      }

      /* ── Init ── */
      function init() {
        sizeCards();
        goTo(currentIndex);
      }

      /* ── Events ── */
      prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
      nextBtn.addEventListener('click', () => goTo(currentIndex + 1));
      dots.forEach(d => {
        d.addEventListener('click', () => goTo(Number(d.dataset.index)));
      });

      /* ── Touch / swipe ── */
      let touchStartX = 0;
      track.addEventListener('touchstart', e => {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });
      track.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 50) goTo(currentIndex + (dx < 0 ? 1 : -1));
      }, { passive: true });

      /* ── Resize ── */
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          sizeCards();
          goTo(currentIndex);
        }, 120);
      });

      init();
      window.reInitServicesCarousel = init;
    })();
 