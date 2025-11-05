// index.js - Robust loader + existing site behaviour preserved
// Injects nav/footer partials, accessible menu toggle, and GSAP animations

// Robust partial loader that tries multiple candidate URLs until one succeeds.
// Usage: await loadPartial('partials/nav.html', 'nav-placeholder');
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

  // console.log('Loaded partial', relPath, 'from', usedUrl);
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

// Load a UMD script and call callback after loaded or fallback after timeout
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

// Main DOM ready logic
document.addEventListener('DOMContentLoaded', () => {
  // ALWAYS call loadPartial with the logical path 'partials/...' (do not use ../ or ./ here).
  // The loader will try the right candidate paths for you.
  loadPartial('partials/nav.html', 'nav-placeholder');
  loadPartial('partials/footer.html', 'footer-placeholder');

  // Delegate click for menu toggle and nav interactions
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

    // Close menu on outside click (mobile-friendly)
    if (menu && menu.classList.contains('show') && !e.target.closest('.main-nav') && !e.target.closest('.menu-toggle')) {
      menu.classList.remove('show');
      toggleBtn.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
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
  });

  // Lazy load GSAP (UMD) and run animations if hero exists
  if (document.querySelector('.hero-section')) {
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js')
      .then(() => {
        if (!window.gsap) throw new Error('GSAP loaded but not available');
        const gsap = window.gsap;

        try {
          // Hero animations
          gsap.from('.hero-copy h1', {
            y: 28,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out'
          });

          gsap.from('.hero-copy .hero-sub', {
            y: 18,
            opacity: 0,
            duration: 0.6,
            delay: 0.08
          });

          gsap.from('.hero-copy .hero-lead', {
            y: 18,
            opacity: 0,
            duration: 0.6,
            delay: 0.16
          });

          gsap.from('.hero-actions .btn', {
            y: 14,
            opacity: 0,
            duration: 0.6,
            delay: 0.24,
            stagger: 0.08,
            clearProps: 'all'
          });

          gsap.from('.hero-stats .stat', {
            y: 20,
            opacity: 0,
            duration: 0.6,
            delay: 0.32,
            stagger: 0.1,
            clearProps: 'all'
          });

          gsap.from('.hero-media-frame', {
            scale: 0.95,
            opacity: 0,
            duration: 0.8,
            delay: 0.2,
            ease: 'power2.out',
            clearProps: 'all'
          });

          gsap.from('.decor-1', {
            scale: 0,
            opacity: 0,
            duration: 0.6,
            delay: 0.4,
            ease: 'back.out(1.7)',
            clearProps: 'all'
          });

          gsap.from('.decor-2', {
            scale: 0,
            opacity: 0,
            duration: 0.6,
            delay: 0.5,
            ease: 'back.out(1.7)',
            clearProps: 'all'
          });

        } catch (err) {
          console.warn('GSAP animation failed', err);
        }
      })
      .catch((err) => {
        console.warn('GSAP failed to load', err);

        // Fallback CSS-based fade-in
        document.querySelectorAll('.hero-copy h1, .hero-copy .hero-sub, .hero-copy .hero-lead, .hero-actions .btn').forEach((el, i) => {
          el.style.opacity = 0;
          setTimeout(() => {
            el.style.transition = 'opacity .45s ease, transform .45s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }, 150 + (i * 80));
        });
      });
  }

  // Intersection Observer for scroll animations on other sections
  if ('IntersectionObserver' in window) {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe sections for fade-in on scroll
    document.querySelectorAll('.who-section, .mission-section, .projects-section').forEach(section => {
      section.style.opacity = '0';
      section.style.transform = 'translateY(30px)';
      section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(section);
    });

    // Counter animation for stats when scrolled into view
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const stats = entry.target.querySelectorAll('.stat-number');
          stats.forEach(stat => {
            const finalValue = stat.textContent.trim();
            const numericValue = parseInt(finalValue.replace(/[^0-9]/g, ''));
            const suffix = finalValue.replace(/[0-9]/g, '').trim();

            let currentValue = 0;
            const increment = numericValue / 50;
            const duration = 2000;
            const stepTime = duration / 50;

            stat.textContent = '0' + suffix;

            const counter = setInterval(() => {
              currentValue += increment;
              if (currentValue >= numericValue) {
                stat.textContent = finalValue;
                clearInterval(counter);
              } else {
                stat.textContent = Math.floor(currentValue) + suffix;
              }
            }, stepTime);
          });

          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
      statsObserver.observe(heroStats);
    }
  }
});
