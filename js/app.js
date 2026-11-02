document.addEventListener("DOMContentLoaded", () => {
  // Registrasi Service Worker PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log("PWA Service Worker Registered Successfully."))
      .catch(err => console.error("Service Worker Error:", err));
  }

  // Set Versi Aplikasi di Sidebar/Footer
  const verElements = document.querySelectorAll('.app-version');
  verElements.forEach(el => el.textContent = CONFIG.VERSION);
});