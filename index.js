// Home/index.js - Complete with all improvements
// Injects nav/footer partials, accessible menu toggle, and GSAP animations

const loadPartial = async (url, placeholderId) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Not found: ' + url);
    const html = await res.text();
    document.getElementById(placeholderId).innerHTML = html;
    
    // Rerun inline scripts inside the injected partial (if any)
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

// Load a UMD script and call callback after loaded or fallback after timeout
function loadScript(src, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error('Script failed: ' + src));
    document.head.appendChild(s);
    
    // Fallback timeout
    setTimeout(() => {
      if (!window.gsap) reject(new Error('GSAP did not load in time'));
    }, timeout);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Inject header & footer
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
            clearProps: 'all' // FIXED: Clear all animation props after complete
          });
          
          gsap.from('.hero-stats .stat', { 
            y: 20, 
            opacity: 0, 
            duration: 0.6, 
            delay: 0.32, 
            stagger: 0.1,
            clearProps: 'all' // FIXED: Clear all animation props after complete
          });
          
          // Hero image animation
          gsap.from('.hero-media-frame', { 
            scale: 0.95, 
            opacity: 0, 
            duration: 0.8, 
            delay: 0.2, 
            ease: 'power2.out',
            clearProps: 'all' // FIXED: Clear all animation props after complete
          });
          
          // Decorative elements
          gsap.from('.decor-1', { 
            scale: 0, 
            opacity: 0, 
            duration: 0.6, 
            delay: 0.4, 
            ease: 'back.out(1.7)',
            clearProps: 'all' // FIXED: Clear all animation props after complete
          });
          
          gsap.from('.decor-2', { 
            scale: 0, 
            opacity: 0, 
            duration: 0.6, 
            delay: 0.5, 
            ease: 'back.out(1.7)',
            clearProps: 'all' // FIXED: Clear all animation props after complete
          });
          
        } catch (err) {
          console.warn('GSAP animation failed', err);
        }
      })
      .catch((err) => {
        console.warn('GSAP failed to load', err);
        
        // Fallback: CSS-based fade-in animation
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
    
    // NEW: Counter animation for stats when scrolled into view
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const stats = entry.target.querySelectorAll('.stat-number');
          stats.forEach(stat => {
            const finalValue = stat.textContent.trim();
            const numericValue = parseInt(finalValue.replace(/[^0-9]/g, ''));
            const suffix = finalValue.replace(/[0-9]/g, '').trim();
            
            // Animate from 0 to final number
            let currentValue = 0;
            const increment = numericValue / 50; // 50 steps
            const duration = 2000; // 2 seconds
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
    
    // Observe hero stats
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
      statsObserver.observe(heroStats);
    }
  }
});