/* ============================================
   ENHANCED PROJECTS.JS
   Premium animations + modal interactions
   ============================================ */

// Robust partial loader (same as index.js)
async function loadPartial(relPath, placeholderId) {
  const container = document.getElementById(placeholderId);
  if (!container) {
    console.warn('Placeholder not found:', placeholderId);
    return false;
  }

  // Build candidate paths to try (in order)
  const candidates = [];
  const pathnameSegments = window.location.pathname.split('/').filter(Boolean);

  // If on GitHub Pages (username.github.io/<repo>/...), add /<repo>/<relPath>
  if (location.hostname.endsWith('github.io') && pathnameSegments.length > 0) {
    const repo = pathnameSegments[0];
    candidates.push(`/${repo}/${relPath}`);
  }

  // Common candidates
  candidates.push(`./${relPath}`); // relative to current doc
  candidates.push(relPath);        // plain relative
  candidates.push(`../${relPath}`); // parent-level
  candidates.push(`/${relPath}`);   // absolute to host root (fallback)

  // Deduplicate
  const uniq = [...new Set(candidates)];

  // Try each candidate until one fetches OK
  let fetchedHtml = null;
  let usedUrl = null;
  for (const candidate of uniq) {
    try {
      const res = await fetch(candidate, { method: 'GET' });
      if (res && res.ok) {
        fetchedHtml = await res.text();
        usedUrl = candidate;
        break;
      }
    } catch (err) {
      // try next
    }
  }

  if (!fetchedHtml) {
    console.warn('All candidates failed for partial:', relPath, 'tried:', uniq);
    return false;
  }

  // Inject
  container.innerHTML = fetchedHtml;

  // Re-run inline scripts in injected partial
  const scripts = container.querySelectorAll('script');
  scripts.forEach(s => {
    const n = document.createElement('script');
    if (s.src) n.src = s.src;
    else n.textContent = s.textContent;
    document.body.appendChild(n);
  });

  // Normalize links/images inside the injected partial so it works on root and nested pages
  normalizeInjectedPaths(container);

  return true;
}

// Normalizer: strip ../ when on root; add ../ when on nested pages for missing root references
function normalizeInjectedPaths(container) {
  const pathname = window.location.pathname;
  const segs = pathname.split('/').filter(Boolean);
  const isRoot = (segs.length === 1) || (segs.length === 2 && segs[1].toLowerCase() === 'index.html');

  if (isRoot) {
    // Remove leading ../ for links and images so partials authored for nested pages still work on root
    container.querySelectorAll('a[href]').forEach(a => {
      const h = a.getAttribute('href');
      if (!h) return;
      if (h.startsWith('../')) a.setAttribute('href', h.replace(/^\.\.\//, ''));
    });
    container.querySelectorAll('img[src]').forEach(img => {
      const s = img.getAttribute('src');
      if (!s) return;
      if (s.startsWith('../')) img.setAttribute('src', s.replace(/^\.\.\//, ''));
    });
    container.querySelectorAll('[style]').forEach(el => {
      const st = el.getAttribute('style');
      if (!st) return;
      const newSt = st.replace(/url\(\s*['"]?\.\.\/+/g, 'url(');
      if (newSt !== st) el.setAttribute('style', newSt);
    });
    container.querySelectorAll('[srcset]').forEach(el => {
      const v = el.getAttribute('srcset');
      if (!v) return;
      el.setAttribute('srcset', v.replace(/(^|\s)\.\.\/+/g, '$1'));
    });
  } else {
    // Nested page: ensure injected links/images that point to root-level assets get ../ prepended
    container.querySelectorAll('a[href]').forEach(a => {
      const h = a.getAttribute('href');
      if (!h) return;
      if (/^(?:https?:|mailto:|tel:|#)/i.test(h)) return;
      if (!h.startsWith('../') && !h.startsWith('./') && !h.startsWith('/')) {
        if (/^(index\.html|About\/|Contact\/|Projects\/|Services\/|Images\/)/i.test(h)) {
          a.setAttribute('href', '../' + h);
        }
      }
    });
    container.querySelectorAll('img[src]').forEach(img => {
      const s = img.getAttribute('src');
      if (!s) return;
      if (!/^(?:https?:|data:)/i.test(s) && !s.startsWith('../') && !s.startsWith('./') && !s.startsWith('/')) {
        if (/^(Images\/)/i.test(s)) img.setAttribute('src', '../' + s);
      }
    });
    container.querySelectorAll('[style]').forEach(el => {
      const st = el.getAttribute('style');
      if (!st) return;
      const newSt = st.replace(/url\(\s*['"]?(Images\/)/g, 'url(../$1');
      if (newSt !== st) el.setAttribute('style', newSt);
    });
  }
}

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
  loadPartial('partials/nav.html', 'nav-placeholder');
  loadPartial('partials/footer.html', 'footer-placeholder');

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