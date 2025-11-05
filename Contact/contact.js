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

document.addEventListener("DOMContentLoaded", () => {
  // Load header and footer - FIXED: Corrected paths to match home page structure
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

  // Handle contact form
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");

  form.addEventListener("submit", async e => {
    e.preventDefault();
    status.textContent = "Sending...";

    const formData = new FormData(form);
    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        form.reset();
        status.textContent = "";
        showPopup("Hey, thanks for your message, we’ll respond shortly!");
      } else {
        const data = await response.json();
        status.textContent = data.error || "Something went wrong. Try again.";
      }
    } catch (err) {
      console.error(err);
      status.textContent = "Network error. Please try again later.";
    }
  });
});

// === Popup ===
function showPopup(message) {
  // Create popup container
  const popup = document.createElement("div");
  popup.className = "popup-overlay";
  popup.innerHTML = `
    <div class="popup-box">
      <p>${message}</p>
      <button class="popup-close">OK</button>
    </div>
  `;
  document.body.appendChild(popup);

  // Animate in
  requestAnimationFrame(() => popup.classList.add("show"));

  // Close handlers
  popup.querySelector(".popup-close").addEventListener("click", () => closePopup(popup));
  popup.addEventListener("click", e => {
    if (e.target === popup) closePopup(popup);
  });
}

function closePopup(popup) {
  popup.classList.remove("show");
  setTimeout(() => popup.remove(), 300);
}