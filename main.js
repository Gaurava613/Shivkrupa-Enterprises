// main.js - Combined file with guards and scroll-animations
function info(...args) { if (window && window.console) console.log('[main.js]', ...args); }

/* ---------------- NAV TOGGLE ---------------- */
const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");
if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.style.display === "flex";
    if (isOpen) {
      mainNav.style.display = "none";
      document.body.style.overflow = "auto";
    } else {
      mainNav.style.display = "flex";
      document.body.style.overflow = "hidden";
    }
  });
}

// ======================== NEW HERO SECTION ==========================

 (function () {
        const shots = Array.from(document.querySelectorAll(".hero-shot"));
        const labelEl = document.getElementById("heroStepLabel");

        if (!shots.length || !labelEl) return;

        const labels = [
            "Concept model from your idea",
            "3D vision – how it will look"
        ];

        let index = 0;

        function showSlide(i) {
            shots.forEach((img, idx) => {
                img.classList.toggle("is-active", idx === i);
            });
            labelEl.textContent = labels[i] || "";
        }

        // initial
        showSlide(index);

        // change every ~2.2s
        setInterval(() => {
            index = (index + 1) % shots.length;
            showSlide(index);
        }, 2200);
    })();

    


/* ---------------- HERO SLIDER ---------------- */
(function heroSliderInit() {
  const root = document.getElementById('hero-new');
  if (!root) { info('hero: skipped'); return; }
  const slides = Array.from(root.querySelectorAll('.slide'));
  const dotsWrap = root.querySelector('.dots');
  if (!slides.length || !dotsWrap) { info('hero: slides or dots missing'); return; }

  let current = 0, timer = null;
  const AUTOPLAY = true, INTERVAL = 3500;

  // preload
  async function preloadAll(urls) {
    const promises = urls.map(u => new Promise(r => {
      if (!u) return r();
      const img = new Image();
      img.onload = () => r();
      img.onerror = () => r();
      img.src = u;
    }));
    await Promise.all(promises);
  }

  const urls = slides.map(s => s.querySelector('.slide-img') && s.querySelector('.slide-img').src).filter(Boolean);

  function buildDots() {
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      if (i === 0) b.classList.add('active');
      b.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(b);
    });
  }

  function show(i) {
    slides.forEach((s, idx) => {
      s.classList.remove('is-active', 'is-leaving');
      if (idx === i) s.classList.add('is-active');
    });
    Array.from(dotsWrap.children).forEach((d, idx) => d.classList.toggle('active', idx === i));
  }

  function next() {
    slides[current].classList.add('is-leaving');
    current = (current + 1) % slides.length;
    show(current);
  }
  function goTo(i) {
    if (i === current) return;
    slides[current].classList.add('is-leaving');
    current = i % slides.length;
    show(current);
    restart();
  }

  function start() { if (timer) return; timer = setInterval(() => next(), INTERVAL); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function restart() { stop(); start(); }

  root.addEventListener('mouseenter', () => stop());
  root.addEventListener('mouseleave', () => start());
  root.addEventListener('focusin', () => stop());
  root.addEventListener('focusout', () => start());

  (async function init() { await preloadAll(urls); buildDots(); show(0); setTimeout(() => { if (AUTOPLAY) start(); }, 300); info('hero init'); })();
})();

/* ---------------- SMOOTH ANCHORS ---------------- */
(function smoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
})();

/* ---------------- TENSILE 3D SCROLL TRANSFORM ---------------- */
(function tensileScrollTransform() {
  const wrapper = document.querySelector('.tensile-3d-wrapper');
  const img = document.getElementById('tensile-3d-img');
  if (!wrapper || !img) { info('tensile: skip'); return; }

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOutQuad = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  function sectionProgress() {
    const rect = wrapper.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const denom = vh + rect.height;
    if (!denom) return 0;
    let p = (vh - rect.top) / denom;
    return clamp(p, 0, 1);
  }

  let raf = null;
  function update() {
    const p = sectionProgress();
    const e = easeInOutQuad(p);
    const scale = lerp(0.55, 1.18, e);
    const rotY = lerp(-40, 40, e);
    const rotX = lerp(6, -2, e);
    const ty = lerp(40, -20, e);
    const opacity = lerp(0.95, 1, e);
    img.style.transform = `translate3d(0px, ${ty}px, 0px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`;
    img.style.opacity = opacity.toFixed(3);
    if (p > 0.02) wrapper.classList.add('is-active'); else wrapper.classList.remove('is-active');
    raf = null;
  }
  function schedule() { if (raf === null) raf = requestAnimationFrame(update); }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  schedule();
  info('tensile transform initialized for', img.src);
})();

/* ---------------- STATS ROTATOR ---------------- */
(function statsRotator() {
  const stats = document.querySelectorAll('.stat');
  if (!stats.length) return;
  const px = v => parseFloat(v) || 0;
  function computeRadiusFor(stat) {
    const rect = stat.getBoundingClientRect();
    const width = Math.min(rect.width, rect.height);
    const ringEl = stat.querySelector('.ring');
    const ringWidth = px(getComputedStyle(ringEl).borderWidth) || 3;
    const radius = (width / 2) - (ringWidth / 2);
    return Math.max(6, Math.round(radius));
  }
  function angleFromCenter(stat, clientX, clientY) {
    const rect = stat.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const rad = Math.atan2(dy, dx);
    return rad * (180 / Math.PI);
  }
  stats.forEach(stat => {
    const rotator = stat.querySelector('.rotator');
    const dot = stat.querySelector('.dot');
    const defaultAngle = +(stat.getAttribute('data-default-angle') || 45);
    let rafId = null; let lastTs = null;
    stat.dataset.currentAngle = String(defaultAngle);
    function applyAngle(angleDeg, animate = false) {
      const r = computeRadiusFor(stat);
      if (!animate) { rotator.style.transition = 'none'; dot.style.transition = 'none'; }
      else { rotator.style.transition = ''; dot.style.transition = ''; }
      rotator.style.transform = `translate(-50%,-50%) rotate(${angleDeg}deg)`;
      dot.style.transform = `rotate(0deg) translate(0, ${-r}px)`;
      stat.dataset.currentAngle = String(angleDeg);
    }
    function tweenTo(angleStart, angleEnd, ms) {
      const start = performance.now();
      function step(t) {
        const dt = (t - start) / ms;
        const eased = Math.min(1, dt);
        let a0 = ((angleStart % 360) + 360) % 360; let a1 = ((angleEnd % 360) + 360) % 360;
        let diff = a1 - a0;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        const cur = a0 + diff * eased;
        applyAngle(cur, true);
        if (dt < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    const SPIN_SPEED_DEG_PER_SEC = 30;
    function startSpin(initialAngle) {
      stopSpin();
      rotator.classList.add('spinning');
      lastTs = null;
      function spinStep(ts) {
        if (!lastTs) lastTs = ts;
        const delta = ts - lastTs; lastTs = ts;
        const deltaDeg = (SPIN_SPEED_DEG_PER_SEC * (delta / 1000));
        const curr = +(stat.dataset.currentAngle || initialAngle);
        const next = curr + deltaDeg;
        applyAngle(next, false);
        rafId = requestAnimationFrame(spinStep);
      }
      rafId = requestAnimationFrame(spinStep);
    }
    function stopSpin() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } rotator.classList.remove('spinning'); lastTs = null; }
    function handleEnter(e) {
      const evt = (e.touches && e.touches[0]) ? e.touches[0] : e;
      if (evt && typeof evt.clientX === 'number') {
        const a = angleFromCenter(stat, evt.clientX, evt.clientY);
        applyAngle(a, false);
        stat.dataset.currentAngle = String(a);
      }
      startSpin(+(stat.dataset.currentAngle || defaultAngle));
    }
    function handleLeave() {
      stopSpin();
      const current = +(stat.dataset.currentAngle || defaultAngle);
      tweenTo(current, defaultAngle, 600);
    }
    applyAngle(defaultAngle, false);
    stat.addEventListener('mouseenter', handleEnter);
    stat.addEventListener('mouseleave', handleLeave);
    stat.addEventListener('touchstart', (ev) => { handleEnter(ev); }, { passive: true });
    stat.addEventListener('touchend', handleLeave);
    let resizeTimer = null;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { const cur = +(stat.dataset.currentAngle || defaultAngle); applyAngle(cur, false); }, 80); });
  });
})();

/* ---------------- PRODUCT CAROUSEL (keeps clones for infinite) ---------------- */
(function productCarousel() {
  const track = document.querySelector('.carousel-track');
  const viewport = document.querySelector('.carousel-viewport');
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');
  if (!track) return;
  let slides = Array.from(track.children);
  let visibleCount = getVisibleCount();
  const AUTOPLAY_INTERVAL = 1500;
  const TRANSITION_MS = 600;
  function setupClones() {
    track.querySelectorAll('.clone').forEach(n => n.remove());
    slides = Array.from(track.children);
    const firstN = slides.slice(0, visibleCount).map(n => n.cloneNode(true));
    const lastN = slides.slice(-visibleCount).map(n => n.cloneNode(true));
    firstN.forEach(n => { n.classList.add('clone'); track.appendChild(n); });
    lastN.reverse().forEach(n => { n.classList.add('clone'); track.insertBefore(n, track.firstChild); });
    slides = Array.from(track.children);
  }
  function layout() {
    visibleCount = getVisibleCount();
    setupClones();
    const slideWidth = slides[0].getBoundingClientRect().width + getGap();
    index = visibleCount;
    track.style.transition = 'none';
    setTranslateX(-index * slideWidth);
    void track.offsetHeight;
    track.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(.22,.9,.35,1)`;
  }
  function getGap() { const cs = window.getComputedStyle(track); const gap = parseFloat(cs.gap || cs.columnGap || 20); return isNaN(gap) ? 20 : gap; }
  function getVisibleCount() { const w = window.innerWidth; if (w <= 720) return 1; if (w <= 1100) return 2; return 3; }
  function setTranslateX(x) { track.style.transform = `translateX(${x}px)`; }
  function getSlideWidth() { const rect = slides[0].getBoundingClientRect(); const gap = getGap(); return rect.width + gap; }
  let index = 0, isAnimating = false;
  function goToIndex(i) {
    if (isAnimating) return;
    isAnimating = true;
    const slideW = getSlideWidth();
    track.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(.22,.9,.35,1)`;
    setTranslateX(-i * slideW);
    index = i;
    setTimeout(() => {
      const total = slides.length;
      const realCount = total - visibleCount * 2;
      if (index >= realCount + visibleCount) {
        index = visibleCount;
        track.style.transition = 'none';
        setTranslateX(-index * slideW);
        void track.offsetHeight;
        track.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(.22,.9,.35,1)`;
      } else if (index < visibleCount) {
        index = index + realCount;
        track.style.transition = 'none';
        setTranslateX(-index * slideW);
        void track.offsetHeight;
        track.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(.22,.9,.35,1)`;
      }
      isAnimating = false;
    }, TRANSITION_MS + 20);
  }
  function next() { goToIndex(index + 1); }
  function prev() { goToIndex(index - 1); }

  let autoplayTimer = null;
  function startAutoplay() { stopAutoplay(); autoplayTimer = setInterval(() => next(), AUTOPLAY_INTERVAL); }
  function stopAutoplay() { if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; } }
  if (nextBtn) nextBtn.addEventListener('click', () => { stopAutoplay(); next(); startAutoplay(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { stopAutoplay(); prev(); startAutoplay(); });
  const carousel = document.querySelector('.products-carousel');
  if (carousel) { carousel.addEventListener('mouseenter', () => stopAutoplay()); carousel.addEventListener('mouseleave', () => startAutoplay()); carousel.addEventListener('focusin', () => stopAutoplay()); carousel.addEventListener('focusout', () => startAutoplay()); }
  let resizeTimer = null;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => layout(), 120); });
  layout(); startAutoplay();
  window.__productCarousel = { next, prev, start: startAutoplay, stop: stopAutoplay };
})();




/* ---------------- CLIENTS SLIDER (replaced) ---------------- */
(function clientsInit() {
  const logos = [
    './assets/client-1.png',
    './assets/client-2.png',
    './assets/client-3.png',
    './assets/client-5.png',
    './assets/client-6.png'
  ];
  const track = document.getElementById('clientsTrack');
  const slider = document.getElementById('clientsSlider');

  if (!track || !slider) return;

  // create nodes function
  function createLogoNode(src, idx) {
    const wrap = document.createElement('div');
    wrap.className = 'client-logo-wrap';
    wrap.setAttribute('role', 'listitem');
    const img = document.createElement('img');
    img.alt = `Client logo ${idx + 1}`;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = src;
    wrap.appendChild(img);
    return wrap;
  }

  // clear first
  track.innerHTML = '';

  // append original set twice (for smooth looping)
  logos.forEach((src, i) => track.appendChild(createLogoNode(src, i)));
  logos.forEach((src, i) => track.appendChild(createLogoNode(src, i + logos.length)));

  // compute animation (marquee) duration from track width
  function computeMarquee() {
    // allow a short timeout for images to render
    requestAnimationFrame(() => {
      const children = Array.from(track.children);
      if (!children.length) return;
      // measure the real width of one set (first half)
      const halfCount = Math.floor(children.length / 2);
      let width = 0;
      for (let i = 0; i < halfCount; i++) {
        const r = children[i].getBoundingClientRect();
        width += r.width + parseFloat(getComputedStyle(track).gap || 28);
      }
      // avoid zero
      width = Math.max(360, width);
      // speed px per second — tweak this to make it faster/slower
      const pxPerSec = 120; // 120px per second
      const duration = Math.max(8, Math.round(width / pxPerSec));
      // inject a keyframes rule dynamically (unique name)
      const name = 'clientsScroll';
      // remove previous if exists
      const existing = document.getElementById('clientsScrollKeyframes');
      if (existing) existing.remove();
      // create rules
      const style = document.createElement('style');
      style.id = 'clientsScrollKeyframes';
      style.textContent = `
        @keyframes ${name} {
          0% { transform: translateX(0); }
          100% { transform: translateX(-${width}px); }
        }
      `;
      document.head.appendChild(style);
      // apply animation to the track
      track.style.animationName = name;
      track.style.animationDuration = duration + 's';
      track.style.animationTimingFunction = 'linear';
      track.style.animationIterationCount = 'infinite';
      // make sure paused state class works
      track.classList.remove('pause');
    });
  }

  // pause/resume handlers
  function pauseTrack() { track.classList.add('pause'); track.style.animationPlayState = 'paused'; }
  function resumeTrack() { track.classList.remove('pause'); track.style.animationPlayState = 'running'; }

  slider.addEventListener('mouseenter', pauseTrack);
  slider.addEventListener('mouseleave', resumeTrack);
  slider.addEventListener('focusin', pauseTrack);
  slider.addEventListener('focusout', resumeTrack);
  // recompute on resize/orientationchange
  let resizeTimer = null;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(computeMarquee, 150); });
  window.addEventListener('orientationchange', () => { setTimeout(computeMarquee, 220); });

  computeMarquee();
})();


/* ---------------- GALLERY & LIGHTBOX (guarded) ---------------- */
const IMAGES = [
  './assets/heroImg-1.png', './assets/heroImg-2.png', './assets/heroImg-3.png',
  './assets/heroImg-4.png', './assets/heroImg-5.png', './assets/productImg-1.png',
  './assets/productImg-2.png', './assets/productImg-3.png', './assets/productImg-4.png'
];

(function initGalleryIfNeeded() {
  const galleryGrid = document.getElementById('galleryGrid');
  const fullGalleryGrid = document.getElementById('fullGalleryGrid');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lbClose = document.getElementById('lbClose');
  const lbPrev = document.getElementById('lbPrev');
  const lbNext = document.getElementById('lbNext');
  const openFullGalleryBtn = document.getElementById('openFullGalleryBtn');
  const fullGalleryModal = document.getElementById('fullGalleryModal');
  const closeFullGalleryBtn = document.getElementById('closeFullGalleryBtn');

  if (!galleryGrid || !fullGalleryGrid || !lightbox || !lightboxImg || !lbClose) {
    info('gallery: elements missing — skip');
    return;
  }

  function buildThumbs() {
    galleryGrid.innerHTML = '';
    const thumbs = IMAGES.slice(0, 6);
    thumbs.forEach((src, i) => {
      const div = document.createElement('div');
      div.className = 'thumb';
      div.innerHTML = `<img loading="lazy" src="${src}" alt="Project image ${i + 1}">`;
      div.addEventListener('click', () => openLightbox(i));
      galleryGrid.appendChild(div);
    });
  }

  function buildFullGrid() {
    fullGalleryGrid.innerHTML = '';
    IMAGES.forEach((src, i) => {
      const a = document.createElement('button');
      a.className = 'full-thumb';
      a.innerHTML = `<img loading="lazy" src="${src}" alt="Project image ${i + 1}">`;
      a.addEventListener('click', () => {
        openLightbox(i);
        closeFullGallery();
      });
      fullGalleryGrid.appendChild(a);
    });
  }

  let currentIndex = 0;
  function openLightbox(index) {
    currentIndex = index;
    lightboxImg.src = IMAGES[currentIndex];
    lightbox.setAttribute('aria-hidden', 'false');
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }
  function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function showPrev() {
    currentIndex = (currentIndex - 1 + IMAGES.length) % IMAGES.length;
    lightboxImg.src = IMAGES[currentIndex];
  }
  function showNext() {
    currentIndex = (currentIndex + 1) % IMAGES.length;
    lightboxImg.src = IMAGES[currentIndex];
  }

  function openFullGallery() {
    if (!fullGalleryModal) return;
    fullGalleryModal.classList.add('active');
    fullGalleryModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeFullGalleryBtn && closeFullGalleryBtn.focus();
  }
  function closeFullGallery() {
    fullGalleryModal.classList.remove('active');
    fullGalleryModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', showPrev);
  lbNext.addEventListener('click', showNext);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', (e) => {
    if (lightbox.classList.contains('active')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    }
    if (fullGalleryModal && fullGalleryModal.classList.contains('active') && e.key === 'Escape') {
      closeFullGallery();
    }
  });

  if (openFullGalleryBtn) openFullGalleryBtn.addEventListener('click', openFullGallery);
  if (closeFullGalleryBtn) closeFullGalleryBtn.addEventListener('click', closeFullGallery);
  if (fullGalleryModal) fullGalleryModal.addEventListener('click', (e) => { if (e.target === fullGalleryModal) closeFullGallery(); });

  buildThumbs(); buildFullGrid();
  window._gallery = { open: openLightbox, openAll: openFullGallery };
})();

/* ---------------- TESTIMONIALS (guarded) ---------------- */
const testimonialData = [
    { name: "Nikhil Agarwal", role: "Founder", message: "Nirvista transformed our payments infrastructure with a seamless UPI + Wallet system.", avatar: "./assets/user1.jpg" },
    { name: "Aarav Mehta", role: "Founder, GreenLeaf Organics", message: "The custom eco-friendly boxes have completely elevated our unboxing experience.", avatar: "./assets/user2.jpg" },
    { name: "Sarah Mitchell", role: "CTO", message: "Their AI team built us a scalable prediction system that improved appointment forecasting.", avatar: "./assets/user3.jpg" },
    { name: "Rahul Verma", role: "Owner, BrewBox Coffee", message: "Sturdy, stylish and on-brand. Our customers constantly compliment the packaging.", avatar: "./assets/user4.jpg" },
    { name: "Simran Kaur", role: "CEO, NatureDrops", message: "From samples to final delivery, everything was handled smoothly.", avatar: "./assets/user5.jpg" }
];

const track = document.getElementById('testimonialTrack');
const dotsWrap = document.getElementById('testDots');
let currentIndex = 0;

function initTestimonials() {
    // 1. Render Cards
    track.innerHTML = testimonialData.map((t, i) => `
        <article class="testimonial-card" data-index="${i}">
            <div class="test-quote-mark">“</div>
            <div class="test-meta" style="display:flex; align-items:center; gap:15px;">
                <div style="width:50px; height:50px; border-radius:50%; background:#334; overflow:hidden;">
                    <img src="./assets/user.png" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <div>
                    <div class="test-name" style="color:white; font-weight:700;">${t.name}</div>
                    <div class="test-role" style="color:var(--accent-blue); font-size:12px;">${t.role}</div>
                </div>
                <div style="margin-left:auto; color:#FFD700;">★★★★★</div>
            </div>
            <p class="testimonial-message">${t.message}</p>
        </article>
    `).join('');

    // 2. Render Dots
    dotsWrap.innerHTML = testimonialData.map((_, i) => `<button class="dot" onclick="goTo(${i})"></button>`).join('');

    updateSlider();
}

function updateSlider() {
    const cards = document.querySelectorAll('.testimonial-card');
    const dots = document.querySelectorAll('.dot');
    const windowWidth = document.querySelector('.testimonial-window').offsetWidth;
    const cardWidth = cards[0].offsetWidth;
    const gap = 30;

    // Calculate center position
    const translateX = (windowWidth / 2) - (currentIndex * (cardWidth + gap)) - (cardWidth / 2);
    track.style.transform = `translateX(${translateX}px)`;

    // Update classes
    cards.forEach((card, i) => {
        card.classList.toggle('active', i === currentIndex);
    });
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
    });
}

function next() {
    currentIndex = (currentIndex + 1) % testimonialData.length;
    updateSlider();
}

function prev() {
    currentIndex = (currentIndex - 1 + testimonialData.length) % testimonialData.length;
    updateSlider();
}

function goTo(i) {
    currentIndex = i;
    updateSlider();
}

// Event Listeners
document.getElementById('nextBtn').addEventListener('click', next);
document.getElementById('prevBtn').addEventListener('click', prev);
window.addEventListener('resize', updateSlider);

// Initialize
initTestimonials();

/* ---------------- ANIMATE ON SCROLL (IntersectionObserver) ---------------- */
(function scrollAnimateInit() {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(ent => {
        if (ent.isIntersecting) {
          ent.target.classList.add('in-view');
          observer.unobserve(ent.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.animate-on-scroll').forEach(n => observer.observe(n));
  } else {
    document.querySelectorAll('.animate-on-scroll').forEach(n => n.classList.add('in-view'));
  }
})();

/* ---------------- FOOTER YEAR ---------------- */
(function setYear() { const y = new Date().getFullYear(); const el = document.getElementById('footer-year'); if (el) el.textContent = y; })();

info('main.js loaded');


