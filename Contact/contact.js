document.addEventListener("DOMContentLoaded", () => {
  // Load header and footer - FIXED: Corrected paths to match home page structure
  fetch("/partials/nav.html")
    .then(res => res.text())
    .then(data => (document.getElementById("nav-placeholder").innerHTML = data))
    .catch(err => console.error("Nav load error:", err));

  fetch("/partials/footer.html")
    .then(res => res.text())
    .then(data => (document.getElementById("footer-placeholder").innerHTML = data))
    .catch(err => console.error("Footer load error:", err));

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
        showPopup("Hey, thanks for your message — we’ll respond shortly!");
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