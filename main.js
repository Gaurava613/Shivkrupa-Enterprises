// main.js - Clean combined script for hero slider + tensile scroll transform
// NOTE: This file contains NO ES module imports. It should be included as:
// <script src="main.js"></script> at the end of the body.

// -----------------------------
// Helper - safe console log
function info(...args) { if (window && window.console) console.log('[main.js]', ...args); }


//--------------Navbar-------------------

const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");

navToggle.addEventListener("click", () => {
  const isOpen = mainNav.style.display === "flex";

  if (isOpen) {
    mainNav.style.display = "none";
    document.body.style.overflow = "auto";
  } else {
    mainNav.style.display = "flex";
    document.body.style.overflow = "hidden"; // stop scroll
  }
});



// ---------- HERO CROSSFADE SLIDER ----------


(function heroSliderInit() {
  const root = document.getElementById('hero-new');
  if (!root) { info('hero: #hero-new not found — skipping hero slider init'); return; }

  const slides = Array.from(root.querySelectorAll('.slide'));
  const dotsWrap = root.querySelector('.dots');
  if (!slides.length || !dotsWrap) { info('hero: slides or dots container not found'); return; }

  let current = 0;
  let timer = null;
  const AUTOPLAY = true;
  const INTERVAL = 3500;

  // preload images
  const imgs = slides.map(s => s.querySelector('.slide-img')).filter(Boolean);
  const urls = imgs.map(i => i.src).filter(Boolean);

  function preload(url) {
    return new Promise(resolve => {
      if (!url) return resolve({ url, ok: false });
      const img = new Image();
      img.onload = () => resolve({ url, ok: true });
      img.onerror = () => resolve({ url, ok: false });
      img.src = url;
    });
  }

  async function preloadAll(list) {
    try {
      const res = await Promise.all(list.map(preload));
      info('hero: preload done', res);
    } catch (e) {
      info('hero: preload error', e);
    }
  }

  // build dots
  function buildDots() {
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      if (i === 0) btn.classList.add('active');
      btn.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(btn);
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

  function start() {
    if (timer) return;
    timer = setInterval(() => next(), INTERVAL);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function restart() { stop(); start(); }

  // pause on hover/focus
  root.addEventListener('mouseenter', () => stop());
  root.addEventListener('mouseleave', () => start());
  root.addEventListener('focusin', () => stop());
  root.addEventListener('focusout', () => start());

  (async function init() {
    await preloadAll(urls);
    buildDots();
    show(0);
    setTimeout(() => { if (AUTOPLAY) start(); }, 300);
    info('hero slider initialized');
  })();
})();

// -----------------------------
// About: Smooth scroll for in-page anchors (optional)
(function smoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();

// -----------------------------
// TENSILE IMAGE - scroll-driven pseudo-3D transform
(function tensileScrollTransform() {
  const wrapper = document.querySelector('.tensile-3d-wrapper');
  const img = document.getElementById('tensile-3d-img');

  if (!wrapper || !img) {
    info('tensile: wrapper or img not found — skipping scroll transform. wrapper:', !!wrapper, 'img:', !!img);
    return;
  }

  // config - tweak these to change behavior
  const SCALE_MIN = 0.55;      // small
  const SCALE_MAX = 1.18;      // large
  const ROT_MIN = -40;         // degrees (start)
  const ROT_MAX = 40;          // degrees (end)
  const TRANSLATE_Y_MIN = 40;  // px (start)
  const TRANSLATE_Y_MAX = -20; // px (end)
  const OPACITY_MIN = 0.95;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOutQuad = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  function sectionProgress() {
    const rect = wrapper.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const denom = vh + rect.height;
    if (denom === 0) return 0;
    let p = (vh - rect.top) / denom;
    return clamp(p, 0, 1);
  }

  let raf = null;
  function update() {
    const p = sectionProgress();
    const e = easeInOutQuad(p);

    const scale = lerp(SCALE_MIN, SCALE_MAX, e);
    const rotY = lerp(ROT_MIN, ROT_MAX, e);
    const rotX = lerp(6, -2, e);
    const ty = lerp(TRANSLATE_Y_MIN, TRANSLATE_Y_MAX, e);
    const opacity = lerp(OPACITY_MIN, 1, e);

    const transform = `translate3d(0px, ${ty}px, 0px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`;
    img.style.transform = transform;
    img.style.opacity = opacity.toFixed(3);

    if (p > 0.02) wrapper.classList.add('is-active'); else wrapper.classList.remove('is-active');

    raf = null;
  }

  function schedule() {
    if (raf === null) raf = requestAnimationFrame(update);
  }

  // events
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);

  // initial
  schedule();
  info('tensile scroll transform initialized for', img.src);

  // expose debug helpers
  window.__tensile3D = {
    refresh: schedule,
    setParams: (o) => Object.assign({}, o),
    destroy: () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      if (raf) cancelAnimationFrame(raf);
    }
  };
})();


/* ===== Clients gallery (gallery-style like Projects) ===== */
(function clientsGalleryInit() {
  const CLIENT_LOGOS = [
    './assets/client-1.png',
    './assets/client-2.png',
    './assets/client-3.png',
    './assets/client-4.png',
    './assets/client-5.png',
    './assets/client-6.png'
    // add / reorder your logos here
  ];

  const clientsGrid = document.getElementById('clientsGrid');
  const clientsFullGrid = document.getElementById('clientsFullGrid');
  const clientsLightbox = document.getElementById('clientsLightbox');
  const clientsLbImg = document.getElementById('clientsLightboxImg');
  const clientsLbClose = document.getElementById('clientsLbClose');
  const clientsLbPrev = document.getElementById('clientsLbPrev');
  const clientsLbNext = document.getElementById('clientsLbNext');

  const openClientsFullBtn = document.getElementById('openClientsFullBtn');
  const clientsFullModal = document.getElementById('clientsFullModal');
  const closeClientsFullBtn = document.getElementById('closeClientsFullBtn');

  if (!clientsGrid || !clientsFullGrid) return;

  // build thumbnails
  function buildClientsThumbs() {
    clientsGrid.innerHTML = '';
    CLIENT_LOGOS.forEach((src, i) => {
      const div = document.createElement('button');
      div.className = 'client-thumb';
      div.setAttribute('type', 'button');
      div.innerHTML = `<img loading="lazy" src="${src}" alt="Client ${i + 1}">`;
      div.addEventListener('click', () => openClientLightbox(i));
      clientsGrid.appendChild(div);
    });
  }

  // build full grid
  function buildClientsFullGrid() {
    clientsFullGrid.innerHTML = '';
    CLIENT_LOGOS.forEach((src, i) => {
      const a = document.createElement('button');
      a.className = 'full-client';
      a.setAttribute('type', 'button');
      a.innerHTML = `<img loading="lazy" src="${src}" alt="Client ${i + 1}">`;
      a.addEventListener('click', () => { openClientLightbox(i); closeClientsFull(); });
      clientsFullGrid.appendChild(a);
    });
  }

  // lightbox controls
  let currentIndex = 0;
  function openClientLightbox(index) {
    currentIndex = index;
    clientsLbImg.src = CLIENT_LOGOS[currentIndex];
    clientsLightbox.classList.add('active');
    clientsLightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    clientsLbClose.focus();
  }
  function closeClientLightbox() {
    clientsLightbox.classList.remove('active');
    clientsLightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function showClientPrev() {
    currentIndex = (currentIndex - 1 + CLIENT_LOGOS.length) % CLIENT_LOGOS.length;
    clientsLbImg.src = CLIENT_LOGOS[currentIndex];
  }
  function showClientNext() {
    currentIndex = (currentIndex + 1) % CLIENT_LOGOS.length;
    clientsLbImg.src = CLIENT_LOGOS[currentIndex];
  }

  // full modal
  function openClientsFull() {
    clientsFullModal.classList.add('active');
    clientsFullModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeClientsFullBtn.focus();
  }
  function closeClientsFull() {
    clientsFullModal.classList.remove('active');
    clientsFullModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // event listeners
  clientsLbClose && clientsLbClose.addEventListener('click', closeClientLightbox);
  clientsLbPrev && clientsLbPrev.addEventListener('click', showClientPrev);
  clientsLbNext && clientsLbNext.addEventListener('click', showClientNext);

  clientsLightbox && clientsLightbox.addEventListener('click', (e) => {
    if (e.target === clientsLightbox) closeClientLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (clientsLightbox.classList.contains('active')) {
      if (e.key === 'Escape') closeClientLightbox();
      if (e.key === 'ArrowLeft') showClientPrev();
      if (e.key === 'ArrowRight') showClientNext();
    }
    if (clientsFullModal.classList.contains('active') && e.key === 'Escape') {
      closeClientsFull();
    }
  });

  openClientsFullBtn && openClientsFullBtn.addEventListener('click', openClientsFull);
  closeClientsFullBtn && closeClientsFullBtn.addEventListener('click', closeClientsFull);
  clientsFullModal && clientsFullModal.addEventListener('click', (e) => {
    if (e.target === clientsFullModal) closeClientsFull();
  });

  // init
  buildClientsThumbs();
  buildClientsFullGrid();

  // optional debug
  window._clients = { open: openClientLightbox, openAll: openClientsFull };
})();

/***************************
 * Testimonials (vanilla)  *
 ***************************/
(function () {
  const testimonials = [
    { name: "Aarav Mehta", role: "Founder, GreenLeaf Organics", message: "The custom eco-friendly boxes have completely elevated our unboxing experience. The quality, print and finish are all top-notch." },
    { name: "Neha Sharma", role: "Brand Manager, Aura Skincare", message: "We needed premium packaging that was also sustainable. The team understood our brief perfectly and delivered right on time." },
    { name: "Rahul Verma", role: "Owner, BrewBox Coffee", message: "Sturdy, stylish and on-brand. Our customers constantly compliment the packaging. It really helps us stand out on the shelf." },
    { name: "Simran Kaur", role: "CEO, NatureDrops", message: "From samples to final delivery, everything was handled smoothly. The team gave great suggestions for materials and finishes." },
    { name: "David Roy", role: "Founder, BoldBrew", message: "Our subscription boxes look so much more premium now. The packaging matches our brand perfectly and is eco-conscious too." }
  ];

  const VISIBLE = 3;
  let start = 0;
  const container = document.getElementById('testimonialTrack');

  function render() {
    container.innerHTML = '';
    for (let i = 0; i < VISIBLE; i++) {
      const idx = (start + i) % testimonials.length;
      const t = testimonials[idx];

      const card = document.createElement('article');
      card.className = 'testimonial-card';
      card.innerHTML = `
            <div class="test-quote-mark">“</div>
            <p class="testimonial-message">${escapeHtml(t.message)}</p>
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <div class="test-avatar"> <img src="./assets/user.png" style="height:40px; border-radius: 100px "/> </div>
                <div style="text-align:left">
                  <div class="test-name">${escapeHtml(t.name)}</div>
                  <div class="test-role">${escapeHtml(t.role)}</div>
                </div>
              </div>
              <div class="test-stars">★★★★★</div>
            </div>
          `;
      container.appendChild(card);
    }
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function next() {
    start = (start + 1) % testimonials.length;
    render();
  }
  function prev() {
    start = (start - 1 + testimonials.length) % testimonials.length;
    render();
  }

  // buttons
  document.getElementById('nextBtn').addEventListener('click', () => { next(); });
  document.getElementById('prevBtn').addEventListener('click', () => { prev(); });

  // keyboard support
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  // init
  render();
})();


// Demo image array (replace with your actual image URLs)
const IMAGES = [
  './assets/heroImg-1.png',
  './assets/heroImg-2.png',
  './assets/heroImg-3.png',
  './assets/heroImg-4.png',
  './assets/heroImg-5.png',
  './assets/heroImg-1.png',
  './assets/productImg-1.png',
  './assets/productImg-2.png',
  './assets/productImg-3.png',
  './assets/productImg-4.png',
  './assets/heroImg-1.png',
  './assets/heroImg-2.png',
  './assets/heroImg-3.png',
  './assets/heroImg-4.png',
  './assets/heroImg-5.png',
  './assets/heroImg-1.png',
  './assets/productImg-1.png',
  './assets/productImg-2.png',
  './assets/productImg-3.png',
  './assets/productImg-4.png'
];

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

// Build thumbnails (show first 6)
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

// Build full gallery grid
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

// Lightbox controls
let currentIndex = 0;
function openLightbox(index) {
  currentIndex = index;
  lightboxImg.src = IMAGES[currentIndex];
  lightbox.setAttribute('aria-hidden', 'false');
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
  // focus for keyboard
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

// Full gallery modal
function openFullGallery() {
  fullGalleryModal.classList.add('active');
  fullGalleryModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  closeFullGalleryBtn.focus();
}
function closeFullGallery() {
  fullGalleryModal.classList.remove('active');
  fullGalleryModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// event listeners
lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click', showPrev);
lbNext.addEventListener('click', showNext);

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox(); // click outside to close
});

// keyboard
document.addEventListener('keydown', (e) => {
  if (lightbox.classList.contains('active')) {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
  }
  if (fullGalleryModal.classList.contains('active') && e.key === 'Escape') {
    closeFullGallery();
  }
});

// full gallery buttons
openFullGalleryBtn.addEventListener('click', openFullGallery);
closeFullGalleryBtn.addEventListener('click', closeFullGallery);
fullGalleryModal.addEventListener('click', (e) => {
  if (e.target === fullGalleryModal) closeFullGallery();
});

// init
buildThumbs();
buildFullGrid();

// Expose helpers for dev console (optional)
window._gallery = { open: openLightbox, openAll: openFullGallery };


// ===========================Footer==========
(function () {
  const y = new Date().getFullYear();
  const el = document.getElementById('footer-year');
  if (el) el.textContent = y;
})();


(function () {
  const track = document.getElementById('featTrack');
  const prevBtn = document.getElementById('featPrev');
  const nextBtn = document.getElementById('featNext');

  if (!track) return;

  const cards = Array.from(track.children);
  const visibleCount = 3; // how many visible at once on desktop
  let index = 0;
  let slideWidth = cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || 36);

  // recalc on resize
  function refreshMetrics() {
    slideWidth = cards[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(track).gap) || 36);
    // keep transform in bounds
    goTo(index);
  }
  window.addEventListener('resize', refreshMetrics);

  function goTo(i) {
    index = i;
    // clamp index range so we can show smooth loop using duplicated slides
    // because we duplicated slides in HTML, allow index up to cards.length - visibleCount
    const maxIndex = cards.length - visibleCount;
    if (index < 0) index = maxIndex;
    if (index > maxIndex) index = 0;
    const x = -index * slideWidth;
    track.style.transform = `translate3d(${x}px,0,0)`;
  }

  // next / prev
  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  if (nextBtn) nextBtn.addEventListener('click', () => { next(); resetAuto(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); resetAuto(); });

  // autoplay
  let timer = null;
  const INTERVAL = 1500; // 1.5s
  function startAuto() { if (timer) return; timer = setInterval(next, INTERVAL); }
  function stopAuto() { if (!timer) return; clearInterval(timer); timer = null; }
  function resetAuto() { stopAuto(); startAuto(); }

  // pause on hover
  track.addEventListener('mouseenter', stopAuto);
  track.addEventListener('mouseleave', startAuto);

  // init
  // small debounce to ensure images/layout measured
  setTimeout(() => {
    refreshMetrics();
    startAuto();
  }, 120);

})();




