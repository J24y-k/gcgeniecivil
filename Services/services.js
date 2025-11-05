/* ============================================
   ENHANCED SERVICES.JS
   Premium animations + accordion + scroll effects
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

document.addEventListener('DOMContentLoaded', () => {
  // Inject partials
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
  // ACCORDION LOGIC (Accessible & Smooth)
  // ============================================
  const items = document.querySelectorAll('.service-item');
  
  items.forEach(item => {
    const btn = item.querySelector('.accordion-toggle');
    const panel = item.querySelector('.panel');

    if (!btn || !panel) return;

    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      
      // Close all other panels (single-open behavior)
      document.querySelectorAll('.accordion-toggle[aria-expanded="true"]').forEach(other => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          const otherPanel = document.getElementById(other.getAttribute('aria-controls'));
          if (otherPanel) {
            otherPanel.hidden = true;
            // Smooth collapse
            otherPanel.style.maxHeight = '0';
            otherPanel.style.opacity = '0';
          }
        }
      });

      // Toggle current panel
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      panel.hidden = open;
      
      if (!open) {
        // Opening animation
        panel.style.maxHeight = panel.scrollHeight + 'px';
        panel.style.opacity = '1';
        
        // Smooth scroll to panel
        setTimeout(() => {
          btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);

        // GSAP animation for panel content if available
        if (window.gsap) {
          try {
            window.gsap.from(panel.querySelectorAll('.panel-body > *'), { 
              y: 20, 
              opacity: 0, 
              duration: 0.6, 
              stagger: 0.08, 
              ease: 'power2.out',
              clearProps: 'all'
            });
          } catch (err) {
            console.warn('GSAP animation error:', err);
          }
        }
      } else {
        // Closing animation
        panel.style.maxHeight = '0';
        panel.style.opacity = '0';
      }
    });

    // Keyboard support (Enter/Space)
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { 
        e.preventDefault(); 
        btn.click(); 
      }
    });

    // Initialize panel state
    panel.style.transition = 'max-height 0.4s ease, opacity 0.4s ease';
    panel.style.maxHeight = '0';
    panel.style.opacity = '0';
    panel.style.overflow = 'hidden';
  });

  // ============================================
  // INTERSECTION OBSERVER ANIMATIONS
  // ============================================
  if ('IntersectionObserver' in window) {
    
    // Hero elements fade-in
    const heroElements = document.querySelectorAll('.hero-left h1, .hero-sub, .hero-lead, .services-quicklinks');
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
    }, { threshold: 0.1 });

    heroElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      heroObserver.observe(el);
    });

    // Service quicklinks stagger
    const quickLinks = document.querySelectorAll('.services-quicklinks a');
    const linkObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, index * 80);
          linkObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    quickLinks.forEach(link => {
      link.style.opacity = '0';
      link.style.transform = 'translateY(15px)';
      link.style.transition = 'opacity 0.5s ease, transform .5s ease';
      linkObserver.observe(link);
    });

    // Accordion items stagger reveal
    const accordionItems = document.querySelectorAll('.service-item');
    const accordionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, index * 120);
          accordionObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });

    accordionItems.forEach(item => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(35px)';
      item.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      accordionObserver.observe(item);
    });

    // Section titles and leads
    const sectionElements = document.querySelectorAll('.section-title, .section-lead');
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, index * 100);
          sectionObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    sectionElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(25px)';
      el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      sectionObserver.observe(el);
    });

    // CTA section reveal
    const ctaSection = document.querySelector('.svc-cta');
    if (ctaSection) {
      const ctaObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            ctaObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });

      ctaSection.style.opacity = '0';
      ctaSection.style.transform = 'translateY(40px)';
      ctaSection.style.transition = 'opacity 0.9s ease, transform 0.9s ease';
      ctaObserver.observe(ctaSection);
    }

    // Media squares pulse animation
    const mediaSquares = document.querySelectorAll('.media-sm');
    const mediaObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'scale(1)';
          }, index * 100);
          mediaObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    mediaSquares.forEach(square => {
      square.style.opacity = '0';
      square.style.transform = 'scale(0.8)';
      square.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      mediaObserver.observe(square);
    });
  }

  // ============================================
  // LAZY LOAD GSAP FOR ENHANCED ANIMATIONS
  // ============================================
  if (!window.gsap) {
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js')
      .then(() => {
        console.log('GSAP loaded successfully');
        
        // Add GSAP-powered animations after load
        if (window.gsap) {
          const gsap = window.gsap;
          
          // Hero media frame animation
          const heroFrame = document.querySelector('.hero-media-frame');
          if (heroFrame) {
            gsap.from(heroFrame, {
              scale: 0.95,
              opacity: 0,
              duration: 0.9,
              ease: 'power2.out',
              clearProps: 'all'
            });
          }
        }
      })
      .catch((err) => {
        console.warn('GSAP failed to load, using CSS fallbacks:', err);
      });
  }

  // ============================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      
      if (target) {
        // Open the accordion if clicking a service link
        const toggle = target.querySelector('.accordion-toggle');
        if (toggle && toggle.getAttribute('aria-expanded') === 'false') {
          toggle.click();
        }
        
        // Smooth scroll to target
        setTimeout(() => {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, toggle ? 100 : 0);
      }
    });
  });

  // ============================================
  // ADD LOADING CLASS TO BODY
  // ============================================
  setTimeout(() => {
    document.body.classList.add('loaded');
  }, 100);
});