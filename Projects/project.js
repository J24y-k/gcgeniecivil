/* ============================================
   ENHANCED PROJECTS.JS
   Premium animations + modal interactions
   ============================================ */

const loadPartial = async (url, placeholderId) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Partial not found: ' + url);
    const html = await res.text();
    document.getElementById(placeholderId).innerHTML = html;
    
    // Run any inline scripts within the partial
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
    console.warn('Partial load error:', err);
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

document.addEventListener('DOMContentLoaded', async () => {
  // ============================================
  // LAZY LOAD GSAP FIRST (EARLY LOAD TO PREVENT TIMING ISSUES)
  // ============================================
  let gsapLoaded = false;
  if (!window.gsap) {
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js');
      gsapLoaded = true;
      console.log('GSAP loaded successfully');
    } catch (err) {
      console.warn('GSAP failed to load, using CSS fallbacks:', err);
    }
  } else {
    gsapLoaded = true;
  }

  // ============================================
  // INJECT PARTIALS
  // ============================================
  loadPartial('../partials/nav.html', 'nav-placeholder');
  loadPartial('../partials/footer.html', 'footer-placeholder');

  // Menu toggle logic (same as index.js)
document.body.addEventListener('click', (e) => {
  // ... (full block from Step 1)
});

  // ============================================
  // HERO ANIMATIONS
  // ============================================
  if ('IntersectionObserver' in window) {
    const heroElements = document.querySelectorAll('.projects-hero h1, .hero-lead');
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, index * 120);
          heroObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    heroElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      heroObserver.observe(el);
    });
  }

  // ============================================
  // TILES ENTRANCE ANIMATION (FIXED: CONSISTENT CSS-ONLY FOR NO FLASH/DISAPPEAR)
  // ============================================
  const tiles = Array.from(document.querySelectorAll('.tile'));
  
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          const t = entry.target;
          
          // Use consistent CSS animation (no GSAP dependency to avoid timing issues)
          setTimeout(() => {
            t.classList.add('visible');
          }, index * 120);
          
          observer.unobserve(t);
        }
      });
    }, { threshold: 0.15 });

    tiles.forEach(t => obs.observe(t));
  } else {
    // Fallback: show all tiles immediately
    tiles.forEach((t, index) => {
      setTimeout(() => t.classList.add('visible'), index * 120);
    });
  }

  // ============================================
  // MODAL INTERACTIONS
  // ============================================
  
  // Open case study modal
  document.body.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open]');
    if (opener) {
      e.preventDefault();
      const id = opener.getAttribute('data-open');
      openCase(id);
    }
  });

  // Keyboard support for tile links (Enter/Space)
  document.querySelectorAll('.tile-link').forEach(link => {
    link.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = link.getAttribute('data-open');
        openCase(id);
      }
    });
  });

  // Close button handler
  document.body.addEventListener('click', (e) => {
    const close = e.target.closest('.case-close');
    if (close) {
      const caseArticle = close.closest('.case');
      if (caseArticle) closeCase(caseArticle);
    }

    // Close if clicked outside case-inner
    const overlay = e.target.closest('.case');
    if (overlay && e.target === overlay) {
      closeCase(overlay);
    }
  });

  // ESC key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.case.show').forEach(c => closeCase(c));
    }
  });
});

// ============================================
// MODAL FUNCTIONS
// ============================================

// Open case study modal
function openCase(caseId) {
  const el = document.getElementById(caseId);
  if (!el) return;
  
  el.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  
  // Trigger show class after a small delay for CSS transition
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.add('show');
    });
  });

  // Animate inner content with GSAP if available
  const inner = el.querySelector('.case-inner');
  if (window.gsap && inner) {
    try {
      window.gsap.from(inner.querySelectorAll('h2, .case-meta, p, .case-gallery'), { 
        y: 25, 
        opacity: 0, 
        duration: 0.7, 
        stagger: 0.08,
        ease: 'power3.out',
        clearProps: 'all'
      });
    } catch (err) {
      console.warn('GSAP modal animation error:', err);
    }
  }

  // Trap focus inside modal
  const firstFocusable = inner?.querySelector('button, a, input, textarea');
  if (firstFocusable) {
    setTimeout(() => firstFocusable.focus(), 100);
  }
}

// Close case study modal
function closeCase(caseEl) {
  caseEl.classList.remove('show');
  document.documentElement.style.overflow = '';
  
  // Wait for transition to complete before hiding
  setTimeout(() => {
    caseEl.hidden = true;
  }, 320);
}