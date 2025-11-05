/* About page JS
   - injects nav/footer partials (same pattern)
   - matches Home motion: GSAP (lazy UMD), fallback CSS fade-ins
   - IntersectionObserver for counters and sections
*/

const loadPartial = async (url, placeholderId) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Partial not found: ' + url);
    const html = await res.text();
    document.getElementById(placeholderId).innerHTML = html;
    // re-run inline scripts inside partial if any
    const container = document.getElementById(placeholderId);
    const scripts = container.querySelectorAll('script');
    scripts.forEach(s => {
      const n = document.createElement('script');
      if (s.src) n.src = s.src;
      else n.textContent = s.textContent;
      document.body.appendChild(n);
    });
    return true;
  } catch (err) {
    console.warn(err);
    return false;
  }
};

function loadScript(src, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error('Script failed: ' + src));
    document.head.appendChild(s);
    setTimeout(() => {
      if (!window.gsap) reject(new Error('GSAP did not load in time'));
    }, timeout);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // inject shared partials
  loadPartial('../partials/nav.html', 'nav-placeholder');
  loadPartial('../partials/footer.html', 'footer-placeholder');


  // Menu toggle logic (same as index.js)
document.body.addEventListener('click', (e) => {
  const toggle = e.target.closest('.menu-toggle');
  if (toggle) {
    const menu = document.querySelector('.main-nav');
    if (!menu) return;
    const opened = menu.classList.toggle('show');
    toggle.setAttribute('aria-expanded', opened ? 'true' : 'false');
    document.documentElement.style.overflow = opened ? 'hidden' : '';
    if (opened) {
      const first = menu.querySelector('a');
      if (first) first.focus();
    }
  }

  // Close menu when link clicked (mobile)
  if (e.target.closest('.main-nav a')) {
    const menu = document.querySelector('.main-nav');
    if (menu && menu.classList.contains('show')) {
      menu.classList.remove('show');
      const toggleBtn = document.querySelector('.menu-toggle');
      if (toggleBtn) toggleBtn.setAttribute('aria-expanded','false');
      document.documentElement.style.overflow = '';
    }
  }

  // Close menu on outside click (mobile-friendly)
  const menu = document.querySelector('.main-nav');
  const toggleBtn = document.querySelector('.menu-toggle');
  if (menu && menu.classList.contains('show') && !e.target.closest('.main-nav') && !e.target.closest('.menu-toggle')) {
    menu.classList.remove('show');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
  }
});

  // Ensure buttons are keyboard reachable
  document.querySelectorAll('.btn').forEach(b => b.setAttribute('tabindex','0'));

  // Section reveal with IntersectionObserver
  if ('IntersectionObserver' in window) {
    const sections = document.querySelectorAll('.services-summary, .people-safety, .contact-invite');
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'none';
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    sections.forEach(s => {
      s.style.opacity = '0';
      s.style.transform = 'translateY(18px)';
      s.style.transition = 'opacity .6s ease, transform .6s ease';
      observer.observe(s);
    });
  }

  // Counters: same behavior as Home hero stats
  const runCounters = (el) => {
    const numbers = el.querySelectorAll('.stat-number');
    numbers.forEach(n => {
      const target = parseInt(n.dataset.target || n.textContent.replace(/\D/g,''), 10) || 0;
      let current = 0;
      const steps = 50;
      const increment = Math.max(1, Math.round(target / steps));
      const interval = Math.round(2000 / steps);
      const t = setInterval(() => {
        current += increment;
        if (current >= target) {
          n.textContent = target + (target >= 1000 ? '+' : '');
          clearInterval(t);
        } else {
          n.textContent = Math.floor(current);
        }
      }, interval);
    });
  };

  // Observe the glance container
  const glance = document.querySelector('.glance');
  if (glance && 'IntersectionObserver' in window) {
    const gObs = new IntersectionObserver((entries, o) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runCounters(entry.target);
          o.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    gObs.observe(glance);
  } else if (glance) {
    // fallback if IO not supported
    runCounters(glance);
  }

  // GSAP animations for hero and visuals (lazy load)
  if (document.querySelector('.about-hero')) {
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js')
      .then(() => {
        if (!window.gsap) throw new Error('GSAP not available');
        const gsap = window.gsap;
        try {
          gsap.from('.about-left h1', { y: 28, opacity: 0, duration: 0.8, ease: 'power3.out' });
          gsap.from('.about-left .eyebrow', { y: 14, opacity: 0, duration: 0.6, delay: 0.06 });
          gsap.from('.about-left .lede', { y: 14, opacity: 0, duration: 0.6, delay: 0.12 });
          gsap.from('.about-ctas .btn', { y: 14, opacity: 0, duration: 0.6, delay: 0.18, stagger: 0.08 });
          gsap.from('.about-visual img', { scale: 0.98, opacity: 0, duration: 0.9, delay: 0.2, ease: 'power2.out' });
          gsap.from('.decor-1, .decor-2', { scale: 0, opacity: 0, duration: 0.6, delay: 0.28, stagger: 0.08, ease: 'back.out(1.7)' });
        } catch (e) {
          console.warn('GSAP animation error', e);
        }
      })
      .catch((err) => {
        console.warn('GSAP failed to load on About page', err);
        // fallback: simple CSS fade-in for hero text
        document.querySelectorAll('.about-left h1, .about-left .eyebrow, .about-left .lede, .about-ctas .btn').forEach((el,i) => {
          el.style.opacity = 0;
          setTimeout(()=> { el.style.transition = 'opacity .45s ease, transform .45s ease'; el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 150 + (i*80));
        });
      });
  }
});

// small micro interactions for About page (service card keyboard + subtle hover tilt)
(() => {
  // keyboard: enter on service-card opens the link if present
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const link = card.querySelector('.service-link');
        if (link) {
          link.click();
          e.preventDefault();
        }
      }
    });

    // small pointer tilt on hover (mouse only)
    let rect;
    card.addEventListener('mousemove', (ev) => {
      if (!card.matches(':hover')) return;
      rect = rect || card.getBoundingClientRect();
      const x = (ev.clientX - rect.left) / rect.width;
      const y = (ev.clientY - rect.top) / rect.height;
      const tx = (x - 0.5) * 6; // +/- degrees
      const ty = (y - 0.5) * -6;
      card.style.transform = `translateY(-6px) rotateX(${ty}deg) rotateY(${tx}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // accessible focus outline for keyboard users
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') document.documentElement.classList.add('kbd');
  }, { once: true });
})();

/* Services & CTA animations (About page) */
/* This tries to use GSAP if loaded. If not, it does a CSS fallback (adds class to trigger CSS transition) */
(function(){
  const animateCards = () => {
    const cards = Array.from(document.querySelectorAll('.service-card'));
    if (!cards.length) return;

    // If GSAP present, use it for staggered entrance and subtle lift
    if (window.gsap) {
      window.gsap.from(cards, {
        y: 24,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.12,
        clearProps: 'all'
      });

      // micro tilt reset for accessibility if previously applied
      cards.forEach(c => c.style.willChange = 'transform');
    } else {
      // CSS fallback: add a class that triggers simple opacity/translate transitions
      cards.forEach((c, i) => {
        c.style.opacity = 0;
        c.style.transform = 'translateY(20px)';
        c.style.transition = 'opacity .6s ease, transform .6s ease';
        setTimeout(()=> { c.style.opacity = 1; c.style.transform = 'translateY(0)'; }, 120 + (i * 100));
      });
    }
  };

  const animateCTA = () => {
    const stripe = document.getElementById('about-cta');
    if (!stripe) return;

    // prepare initial CSS state
    stripe.classList.add('animate-ready');

    // IntersectionObserver to trigger when visible
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // GSAP path
          if (window.gsap) {
            const tl = window.gsap.timeline();
            tl.to(stripe, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' });
            tl.from('#cta-quote', { y: 18, opacity: 0, duration: 0.45, ease: 'power2.out' }, '-=0.25');
            tl.from('#cta-case',  { y: 18, opacity: 0, duration: 0.45, ease: 'power2.out' }, '-=0.35');
            // small pulse after entry
            tl.to('#cta-quote', { scale: 1.03, duration: 0.14, yoyo: true, repeat: 1 }, '+=0.15');
          } else {
            // CSS fallback
            stripe.classList.add('animate-in');
            // simple button fade timing
            const q = document.getElementById('cta-quote');
            const c = document.getElementById('cta-case');
            if (q) { q.style.opacity = 0; q.style.transition = 'opacity .45s ease, transform .45s ease'; setTimeout(()=> { q.style.opacity = 1; q.style.transform = 'translateY(0)'; }, 300); }
            if (c) { c.style.opacity = 0; c.style.transition = 'opacity .45s ease, transform .45s ease'; setTimeout(()=> { c.style.opacity = 1; c.style.transform = 'translateY(0)'; }, 380); }
          }
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18 });

    io.observe(stripe);
  };

  // If GSAP is not loaded yet but loadScript exists, try to load it before animation
  const maybeLoadGSAPThen = (cb) => {
    if (window.gsap) { cb(); return; }
    if (typeof loadScript === 'function') {
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js').then(()=> cb()).catch(()=> cb());
    } else {
      // fallback: just run callback (CSS fallback inside)
      cb();
    }
  };

  // run when DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    maybeLoadGSAPThen(() => {
      animateCards();
      animateCTA();
    });
  });
})();
