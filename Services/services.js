/* ============================================
   ENHANCED SERVICES.JS
   Premium animations + accordion + scroll effects
   ============================================ */

const loadPartial = async (url, placeholderId) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Partial not found: ' + url);
    const html = await res.text();
    document.getElementById(placeholderId).innerHTML = html;
    
    // Execute inline scripts if any
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

document.addEventListener('DOMContentLoaded', () => {
  // Inject partials
  loadPartial('/partials/nav.html', 'nav-placeholder');
  loadPartial('/partials/footer.html', 'footer-placeholder');

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
      link.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
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