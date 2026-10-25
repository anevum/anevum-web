/* ANEVUM Portfolio / Cinematic Institute experience director.
 * Decorative motion only: interactions and project content remain real DOM.
 * No external media, extra renderer, tracking or autonomous video fetching.
 */
(() => {
  'use strict';
  const root = document.documentElement;
  const hero = document.querySelector('.hero');
  const stage = document.querySelector('.institute-environment');
  const backdrop = stage?.querySelector('.institute-backdrop');
  if (!hero || !stage || !backdrop) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = navigator.connection?.saveData === true;
  const motionToggle = document.querySelector('#motion-toggle');
  const mobileMenu = document.querySelector('details.mobile-nav');

  // Static SVG is always the usable fallback. Approval must be explicit and
  // the derivative must be local. No video is enabled in this candidate.
  const videoPath = stage.dataset.approvedVideo;
  const isApprovedVideo = stage.dataset.mediaApproved === 'true'
    && /^\/portfolio\/assets\/cinematic\/[a-z0-9-]+\.(?:mp4|webm)$/.test(videoPath || '');
  let video = null;
  if (isApprovedVideo && !saveData && !reducedMotion.matches) {
    video = document.createElement('video');
    video.className = 'institute-approved-video';
    video.src = videoPath;
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = 'none';
    video.setAttribute('aria-hidden', 'true');
    stage.insertBefore(video, stage.firstChild);
  }
  let visible = true;
  let scrollYLast = -1;
  let pointerX = 0;
  let pointerY = 0;
  let queued = false;
  const enabled = () => !root.classList.contains('motion-paused')
    && !reducedMotion.matches && !saveData && !document.hidden && visible;
  const syncVideo = () => {
    if (!video) return;
    if (enabled() && video.paused) video.play().catch(() => { video.pause(); });
    else if (!enabled() && !video.paused) video.pause();
  };

  function render() {
    queued = false;
    if (!enabled()) {
      root.style.setProperty('--scene-x', '0px');
      root.style.setProperty('--scene-y', '0px');
      root.style.setProperty('--process-x', '0px');
      root.style.setProperty('--process-y', '0px');
      syncVideo();
      return;
    }
    const progress = Math.max(0, Math.min(1, window.scrollY / Math.max(1, hero.offsetHeight)));
    const x = Math.max(-22, Math.min(22, pointerX * 22));
    const y = Math.max(-16, Math.min(16, pointerY * 14 + progress * 18));
    root.style.setProperty('--scene-x', x.toFixed(1) + 'px');
    root.style.setProperty('--scene-y', y.toFixed(1) + 'px');
    root.style.setProperty('--process-x', (pointerX * 0.6).toFixed(2) + '%');
    root.style.setProperty('--process-y', (pointerY * 0.6).toFixed(2) + '%');
    syncVideo();
  }
  function queueRender() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(render);
  }
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    if (!enabled()) return;
    pointerX = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
    pointerY = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    queueRender();
  }, { passive: true });
  window.addEventListener('scroll', () => {
    if (Math.abs(window.scrollY - scrollYLast) < 3) return;
    scrollYLast = window.scrollY;
    queueRender();
  }, { passive: true });
  window.addEventListener('resize', queueRender, { passive: true });
  document.addEventListener('visibilitychange', queueRender);
  reducedMotion.addEventListener?.('change', queueRender);
  motionToggle?.addEventListener('click', () => requestAnimationFrame(queueRender));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = Boolean(entries[0]?.isIntersecting);
      queueRender();
    }, { rootMargin: '120px', threshold: 0 }).observe(hero);
  }

  mobileMenu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => { mobileMenu.open = false; });
  });
  mobileMenu?.addEventListener('keydown', event => {
    if (event.key === 'Escape') { mobileMenu.open = false; mobileMenu.querySelector('summary')?.focus(); }
  });
  document.addEventListener('click', event => {
    if (mobileMenu?.open && !mobileMenu.contains(event.target)) mobileMenu.open = false;
  });

  // Navigation remains semantic links. Highlight the currently read section
  // without inventing routes or replacing browser history.
  const navLinks = [...document.querySelectorAll('.site-header nav a[href^="#"]')];
  if ('IntersectionObserver' in window && navLinks.length) {
    const sectionObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        navLinks.forEach(link => {
          if (link.hash.slice(1) === entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    }, { rootMargin: '-25% 0px -60% 0px', threshold: 0 });
    ['work','process','about'].forEach(id => {
      const section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });
  }

  queueRender();
})();
