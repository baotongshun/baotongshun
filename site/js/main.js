/* =========================================================================
   main.js — site-wide vanilla JS
   - header scroll state, mobile nav
   - IntersectionObserver reveal/stagger
   - magnetic hover on CTAs
   - parallax (rAF)
   - counter-up on view
   - cookie banner
   - contact form (mailto fallback)
   - tab switcher (services)
   - dynamic year, smooth-scroll anchors
   ========================================================================= */

(function () {
  'use strict';

  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    setYear();
    initHeader();
    initMobileNav();
    initReveal();
    initMagnetic();
    initParallax();
    initCounters();
    initCookieBanner();
    initContactForm();
    initTabs();
    initMarqueeLoop();   // clones track to keep animation seamless
    initScrollCue();
  }

  // ---------------------------------------------------------------------
  function setYear() {
    $$('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
  }

  // ---------------------------------------------------------------------
  function initHeader() {
    const header = $('.site-header');
    if (!header) return;
    const onScroll = () => {
      if (window.scrollY > 12) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ---------------------------------------------------------------------
  function initMobileNav() {
    const toggle = $('.nav-toggle');
    const nav    = $('.site-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', e => {
      if (e.target.tagName === 'A') nav.classList.remove('is-open');
    });
  }

  // ---------------------------------------------------------------------
  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      $$('.reveal, .reveal-stagger').forEach(el => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    $$('.reveal, .reveal-stagger').forEach(el => io.observe(el));
  }

  // ---------------------------------------------------------------------
  function initMagnetic() {
    if (reduceMotion) return;
    const targets = $$('.magnetic');
    targets.forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width  - 0.5) * 12;
        const y = ((e.clientY - r.top)  / r.height - 0.5) * 12;
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  // ---------------------------------------------------------------------
  function initParallax() {
    if (reduceMotion) return;
    const els = $$('[data-parallax]');
    if (!els.length) return;
    let ticking = false;
    const update = () => {
      const top = window.scrollY;
      els.forEach(el => {
        const speed = parseFloat(el.dataset.parallax) || 0.25;
        const rect  = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const delta  = (window.innerHeight / 2 - center) * speed;
        el.style.transform = `translate3d(0, ${delta.toFixed(1)}px, 0)`;
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  // ---------------------------------------------------------------------
  function initCounters() {
    const els = $$('[data-counter]');
    if (!els.length) return;
    const animate = el => {
      const target = parseFloat(el.dataset.counter) || 0;
      const suffix = el.dataset.suffix || '';
      const dur    = 1600;
      const start  = performance.now();
      const tick   = (t) => {
        const p = Math.min(1, (t - start) / dur);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(target * ease).toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target.toLocaleString() + suffix;
      };
      requestAnimationFrame(tick);
    };
    if (!('IntersectionObserver' in window)) return els.forEach(animate);
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { animate(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.4 });
    els.forEach(el => io.observe(el));
  }

  // ---------------------------------------------------------------------
  function initCookieBanner() {
    const banner = $('.cookie-banner');
    if (!banner) return;
    const KEY = 'bts-cookie';
    if (localStorage.getItem(KEY)) banner.classList.add('is-hidden');
    banner.addEventListener('click', e => {
      const t = e.target.closest('[data-cookie]');
      if (!t) return;
      localStorage.setItem(KEY, t.dataset.cookie);
      banner.classList.add('is-hidden');
    });
  }

  // ---------------------------------------------------------------------
  function initContactForm() {
    const form = $('#contact-form');
    if (!form) return;
    const status = $('.form-status', form);
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.name || !data.email || !data.message) {
        status.textContent = 'Please complete all required fields.';
        status.className = 'form-status error';
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
        status.textContent = 'Please enter a valid email address.';
        status.className = 'form-status error';
        return;
      }
      const subject = encodeURIComponent(`[baotongshun.com] ${data.subject || 'New inquiry'} — ${data.name}`);
      const body = encodeURIComponent(
        `Name: ${data.name}\nCompany: ${data.company || '-'}\nEmail: ${data.email}\nPhone: ${data.phone || '-'}\nCountry: ${data.country || '-'}\n\n${data.message}`
      );
      const href = `mailto:support@baotongshun.com?subject=${subject}&body=${body}`;
      window.location.href = href;
      status.textContent = 'Opening your mail client… if nothing happens, please email support@baotongshun.com directly.';
      status.className = 'form-status success';
      form.reset();
    });
  }

  // ---------------------------------------------------------------------
  function initTabs() {
    const groups = $$('[data-tabs]');
    groups.forEach(group => {
      const buttons = $$('button', group);
      const panels  = $$(`[data-tab-panel]`, document);
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.dataset.tab;
          buttons.forEach(b => b.classList.toggle('is-active', b === btn));
          panels.forEach(p => p.classList.toggle('is-hidden', p.dataset.tabPanel !== target));
        });
      });
    });
  }

  // ---------------------------------------------------------------------
  function initMarqueeLoop() {
    $$('.marquee-track').forEach(track => {
      // Duplicate inner content for seamless loop
      track.innerHTML += track.innerHTML;
    });
  }

  // ---------------------------------------------------------------------
  function initScrollCue() {
    const cue = $('.scroll-cue');
    if (!cue) return;
    cue.addEventListener('click', () => {
      const next = cue.closest('section').nextElementSibling;
      if (next) next.scrollIntoView({ behavior: 'smooth' });
    });
  }
})();
