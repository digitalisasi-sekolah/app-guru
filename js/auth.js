/**
 * Auth Manager - Versi v1.42 (Handling Offline, Fallback & Caching)
 * Pengembang: Pak Ajiardin (SMKN 1 Wakatobi)
 */

const Auth = {
  currentUser: null,

  init() {
    const saved = localStorage.getItem('guru_app_user');
    if (saved) {
      this.currentUser = JSON.parse(saved);
    }
  },

  async loginAdmin(password) {
    // 1. Cek kredensial offline lokal (Admin Default)
    if (password === "admin123") {
      this.currentUser = { role: "admin", nama: "Administrator (Wakasek/Kepsek)" };
      localStorage.setItem('guru_app_user', JSON.stringify(this.currentUser));
      return { status: "success" };
    }
    
    // 2. Jika ada internet, validasi ke server GAS
    if (!navigator.onLine) {
      return { status: "error", message: "Perangkat sedang offline. Gunakan password admin bawaan (admin123)." };
    }

    try {
      const res = await fetch(CONFIG.GAS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "loginAdmin", password })
      }).then(r => r.json());

      if (res.status === "success") {
        this.currentUser = { role: "admin", nama: "Administrator" };
        localStorage.setItem('guru_app_user', JSON.stringify(this.currentUser));
      }
      return res;
    } catch(e) {
      return { status: "error", message: "Gagal terhubung ke Google Apps Script. Periksa URL Endpoint di config.js." };
    }
  },

  async loginGuru(noHP, password) {
    // 1. Cek apakah ada data cache session guru sebelumnya untuk mendukung login offline
    const cachedUsers = JSON.parse(localStorage.getItem('guru_cached_list') || '[]');
    const localMatch = cachedUsers.find(g => String(g.noHP).trim() === String(noHP).trim());

    if (!navigator.onLine) {
      if (localMatch) {
        this.currentUser = { role: "guru", ...localMatch };
        localStorage.setItem('guru_app_user', JSON.stringify(this.currentUser));
        return { status: "success", message: "Login offline berhasil menggunakan data tersimpan." };
      }
      return { status: "error", message: "Koneksi offline. Login online dibutuhkan pertama kali untuk menyimpan kredensial akun." };
    }

    // 2. Jika online, kirim permintaan autentikasi ke server GAS
    try {
      const res = await fetch(CONFIG.GAS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "loginGuru", noHP, password })
      }).then(r => r.json());

      if (res.status === "success") {
        this.currentUser = { role: "guru", ...res.guru };
        localStorage.setItem('guru_app_user', JSON.stringify(this.currentUser));

        // Simpan ke cache lokal untuk login offline di masa mendatang
        if (!localMatch) {
          cachedUsers.push(res.guru);
          localStorage.setItem('guru_cached_list', JSON.stringify(cachedUsers));
        }
      }
      return res;
    } catch(e) {
      return { status: "error", message: "Gagal terhubung ke server. Pastikan URL GAS_ENDPOINT sudah benar dan deployment 'Who has access' diatur ke 'Anyone'." };
    }
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem('guru_app_user');
    window.location.reload();
  }
};

Auth.init();